import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';

export class LogWatcher extends EventEmitter {
  private logPath: string;
  private currentSize: number = 0;
  private isWatching: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private lineBuffer: string = '';

  // NUEVO: Bandera para saber si estamos esperando un JSON en la siguiente línea
  private pendingEventType: 'Courses' | 'DraftPick' | 'GetDeck' | null = null;

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
      // Leemos desde el principio (0) para capturar el estado inicial al abrir la app
      this.currentSize = 0;
      console.log(`✅ Archivo encontrado. Leyendo historial...`);

      this.isWatching = true;

      // Primera lectura inmediata
      this.checkUpdates();

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

      if (stats.size < this.currentSize) {
        console.log('🔄 El archivo se reinició.');
        this.currentSize = 0;
        this.lineBuffer = '';
        this.pendingEventType = null;
      }

      const stream = fs.createReadStream(this.logPath, {
        start: this.currentSize,
        end: stats.size,
        encoding: 'utf8',
      });

      stream.on('data', (chunk: string | Buffer) => {
        this.lineBuffer += chunk.toString();
        const lines = this.lineBuffer.split('\n');
        this.lineBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().length > 0) {
            // Ignorar líneas vacías
            this.processLineCheck(line);
          }
        }
      });

      stream.on('end', () => {
        this.currentSize = stats.size;
      });

      stream.on('error', (err) => {
        console.error('❌ Error en el stream:', err);
      });
    } catch (err) {
      console.error('❌ Error leyendo actualización:', err);
    }
  }

  private processLineCheck(line: string) {
    // -----------------------------------------------------
    // CASO A: Estamos esperando un JSON de la línea anterior
    // -----------------------------------------------------
    if (this.pendingEventType) {
      if (line.trim().startsWith('{')) {
        console.log(`puzzle_piece JSON encontrado para ${this.pendingEventType}. Procesando...`);

        if (this.pendingEventType === 'Courses') {
          this.processCourses(line);
        } else if (this.pendingEventType === 'DraftPick') {
          this.processPickLine(line, true); // true = es solo el json
        } else if (this.pendingEventType === 'GetDeck') {
          // Si implementas editar mazo, aquí iría
        }

        // Ya procesamos, reseteamos la bandera
        this.pendingEventType = null;
        return; // Terminamos con esta línea
      } else {
        // Si la línea siguiente no empieza con {, cancelamos la espera
        // (a veces hay logs basura entre medio)
        // Opcional: Podrías no resetear si quieres ser más permisivo
        // this.pendingEventType = null;
      }
    }

    // -----------------------------------------------------
    // CASO B: Buscamos encabezados nuevos
    // -----------------------------------------------------

    // 1. DRAFT PACKS (Suelen venir en la misma línea, pero por si acaso)
    if (line.includes('Draft.Notify') || line.includes('BotDraft')) {
      if (line.includes('{')) {
        this.processDraftLine(line);
      }
    }

    // 2. PICKS
    if (line.includes('EventPlayerDraftMakePick') && line.includes('==>')) {
      // A veces viene en la misma línea, a veces no.
      if (line.includes('{')) {
        this.processPickLine(line);
      } else {
        this.pendingEventType = 'DraftPick';
      }
    }

    // 3. COURSES (Mazos activos / Inicio de sesión)
    if (line.includes('EventGetCoursesV2') && line.includes('<==')) {
      console.log('📚 Detectada cabecera EventGetCoursesV2.');
      if (line.includes('{')) {
        // Está en la misma línea
        this.processCourses(line);
      } else {
        // Está en la siguiente línea
        console.log('⏳ Esperando JSON de Courses en la siguiente línea...');
        this.pendingEventType = 'Courses';
      }
    }
  }

  // --- Lógica para procesar el Pick ---
  private processPickLine(line: string, jsonOnly: boolean = false) {
    try {
      const jsonStartIndex = line.indexOf('{');
      if (jsonStartIndex === -1) return;

      const jsonString = line.substring(jsonStartIndex);
      const outerData = JSON.parse(jsonString);

      // El campo 'request' es un string que contiene OTRO json dentro
      if (outerData.request && typeof outerData.request === 'string') {
        const requestData = JSON.parse(outerData.request);
        const cardId = requestData.GrpIds ? requestData.GrpIds[0] : null;

        if (cardId) {
          console.log(`POINT 👉 Pick detectado: ID ${cardId}`);
          this.emit('draft-pick', {
            draftId: requestData.DraftId,
            packNumber: requestData.Pack,
            pickNumber: requestData.Pick,
            cardId: cardId,
          });
        }
      }
    } catch (e) {
      console.error('❌ Error parseando Pick:', e);
    }
  }

  private processDraftLine(line: string) {
    try {
      const jsonStartIndex = line.indexOf('{');
      if (jsonStartIndex === -1) return;

      const jsonString = line.substring(jsonStartIndex);
      let data = JSON.parse(jsonString);

      if (data.Payload && typeof data.Payload === 'string') {
        try {
          const internalData = JSON.parse(data.Payload);
          data = { ...data, ...internalData };
        } catch (innerError) {}
      }

      let finalPack: string[] = [];
      if (data.DraftPack && Array.isArray(data.DraftPack)) {
        finalPack = data.DraftPack;
      } else if (data.PackCards && typeof data.PackCards === 'string') {
        finalPack = data.PackCards.split(',').map((id: string) => id.trim());
      }

      if (finalPack.length > 0) {
        console.log(`📦 Pack encontrado (${finalPack.length} cartas).`);
        this.emit('draft-pack', { ...data, DraftPack: finalPack });
      }
    } catch (e) {
      console.error('❌ Error parseando DraftLine:', e);
    }
  }

  private processCourses(line: string) {
    try {
      const jsonStartIndex = line.indexOf('{');
      if (jsonStartIndex === -1) return;

      const jsonString = line.substring(jsonStartIndex);
      const data = JSON.parse(jsonString);

      if (data.Courses && Array.isArray(data.Courses)) {
        // Buscamos cualquier curso de Draft o Sealed que tenga cartas
        const draftCourses = data.Courses.filter(
          (c: any) =>
            c.InternalEventName &&
            (c.InternalEventName.toLowerCase().includes('draft') ||
              c.InternalEventName.toLowerCase().includes('sealed')) &&
            c.CourseDeck &&
            (c.CourseDeck.MainDeck || c.CourseDeck.CardPool),
        );

        if (draftCourses.length > 0) {
          // Tomamos el último de la lista, suele ser el más reciente
          const activeDraft = draftCourses[draftCourses.length - 1];

          console.log('📂 Evento Limitado encontrado:', activeDraft.InternalEventName);

          const mainDeck = activeDraft.CourseDeck.MainDeck || [];
          const sideboard = activeDraft.CourseDeck.Sideboard || [];

          // Enviamos al Store
          this.emit('current-deck', {
            source: 'course-v2',
            eventId: activeDraft.InternalEventName,
            main: this.flattenDeck(mainDeck),
            side: this.flattenDeck(sideboard),
          });
        } else {
          console.log(
            '⚠️ EventGetCoursesV2 procesado, pero no se encontraron eventos de Draft activos.',
          );
        }
      }
    } catch (e) {
      console.error('❌ Error procesando EventGetCoursesV2:', e);
    }
  }

  private flattenDeck(cardList: any[]): number[] {
    const flat: number[] = [];
    if (!Array.isArray(cardList)) return flat;

    cardList.forEach((c) => {
      for (let i = 0; i < c.quantity; i++) {
        flat.push(c.cardId);
      }
    });
    return flat;
  }

  stop() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.isWatching = false;
  }
}
