import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';

export class LogWatcher extends EventEmitter {
  private logPath: string;
  private currentSize: number = 0;
  private isWatching: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  // NUEVO: Un buffer para guardar líneas cortadas entre chunks
  private lineBuffer: string = '';

  constructor() {
    super();
    this.logPath = path.join(
      os.homedir(),
      'AppData',
      'LocalLow',
      'Wizards Of The Coast',
      'MTGA',
      'Player.log',
    );
  }

  start() {
    console.log('--- INICIANDO LOG WATCHER ---');
    console.log('📂 Ruta objetivo:', this.logPath);

    if (!fs.existsSync(this.logPath)) {
      console.error('❌ ERROR CRÍTICO: El archivo Player.log NO EXISTE.');
      return;
    }

    try {
      const stats = fs.statSync(this.logPath);
      this.currentSize = stats.size;
      console.log(`✅ Archivo encontrado. Tamaño inicial: ${this.currentSize} bytes.`);

      this.isWatching = true;
      this.checkInterval = setInterval(() => this.checkUpdates(), 1000);
      console.log('👀 Vigilancia activa...');
    } catch (error) {
      console.error('❌ Error al acceder al archivo:', error);
    }
  }

  private checkUpdates() {
    if (!this.isWatching) return;

    try {
      const stats = fs.statSync(this.logPath);
      if (stats.size === this.currentSize) return;

      console.log(`⚡ CAMBIO DETECTADO! Nuevo tamaño: ${stats.size}`);

      if (stats.size < this.currentSize) {
        console.log('🔄 El archivo se reinició.');
        this.currentSize = 0;
        this.lineBuffer = ''; // Limpiamos buffer si el archivo se reinicia
      }

      const stream = fs.createReadStream(this.logPath, {
        start: this.currentSize,
        end: stats.size,
        encoding: 'utf8',
      });

      stream.on('data', (chunk: string | Buffer) => {
        // 1. Añadimos el nuevo chunk a lo que sobró de la vez anterior
        this.lineBuffer += chunk.toString();

        // 2. Partimos por saltos de línea
        const lines = this.lineBuffer.split('\n');

        // 3. IMPORTANTE: La última línea del array suele estar incompleta
        // (es el corte del chunk). La sacamos del array y la guardamos para el siguiente ciclo.
        this.lineBuffer = lines.pop() || '';

        // 4. Procesamos todas las líneas que SÍ están completas
        for (const line of lines) {
          this.processLineCheck(line);
        }
      });

      stream.on('end', () => {
        // Al terminar de leer el bloque actual, actualizamos el tamaño.
        // Nota: NO procesamos this.lineBuffer aquí, porque esperamos que se complete
        // en la siguiente lectura si quedó algo pendiente.
        this.currentSize = stats.size;
      });

      stream.on('error', (err) => {
        console.error('❌ Error en el stream:', err);
      });
    } catch (err) {
      console.error('❌ Error leyendo actualización:', err);
    }
  }

  // He renombrado parseChunk a processLineCheck para que sea más claro
  private processLineCheck(line: string) {
    // Filtro rápido para no perder tiempo parseando basura
    if ((line.includes('Draft.Notify') || line.includes('BotDraft')) && line.includes('{')) {
      this.processDraftLine(line);
    }
  }

  private processDraftLine(line: string) {
    try {
      const jsonStartIndex = line.indexOf('{');
      if (jsonStartIndex === -1) return;

      const jsonString = line.substring(jsonStartIndex);
      let data = JSON.parse(jsonString);

      // CASO 1: Quick Draft / Bot Draft (Payload anidado)
      // Estructura: { Payload: "{\"DraftPack\": [\"123\", \"456\"] ... }" }
      if (data.Payload && typeof data.Payload === 'string') {
        try {
          const internalData = JSON.parse(data.Payload);
          data = { ...data, ...internalData };
        } catch (innerError) {
          // Ignoramos si falla el payload interno
        }
      }

      // --- NORMALIZACIÓN DE CARTAS ---
      let finalPack: string[] = [];

      // Detectar formato Bot (Array explícito)
      if (data.DraftPack && Array.isArray(data.DraftPack)) {
        finalPack = data.DraftPack;
      }
      // Detectar formato Humano/Premier (String separado por comas)
      // Ejemplo: "PackCards": "96044,96155,95979"
      else if (data.PackCards && typeof data.PackCards === 'string') {
        finalPack = data.PackCards.split(',').map((id: string) => id.trim());
      }

      // EMISIÓN
      if (finalPack.length > 0) {
        console.log(`📦 Evento Draft PACK encontrado (${finalPack.length} cartas).`);

        // Estandarizamos el evento: Angular siempre recibirá un array 'DraftPack'
        // Sobreescribimos la propiedad DraftPack con nuestro array limpio
        const eventData = { ...data, DraftPack: finalPack };

        this.emit('draft-pack', eventData);
      } else if (data.DraftStatus) {
        console.log('ℹ️ Evento Draft STATUS (Pick realizado o cambio de fase).');
      }
    } catch (e) {
      console.error('❌ Error parseando JSON en processDraftLine:', e);
    }
  }

  stop() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.isWatching = false;
  }
}
