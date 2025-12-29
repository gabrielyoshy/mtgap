"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogWatcher = void 0;
const fs = require("fs");
const path = require("path");
const os = require("os");
const events_1 = require("events");
class LogWatcher extends events_1.EventEmitter {
    constructor() {
        super();
        this.currentSize = 0;
        this.isWatching = false;
        this.checkInterval = null;
        // Construimos la ruta
        this.logPath = path.join(os.homedir(), 'AppData', 'LocalLow', 'Wizards Of The Coast', 'MTGA', 'Player.log');
    }
    start() {
        console.log('--- INICIANDO LOG WATCHER ---');
        console.log('📂 Ruta objetivo:', this.logPath);
        if (!fs.existsSync(this.logPath)) {
            console.error('❌ ERROR CRÍTICO: El archivo Player.log NO EXISTE en la ruta indicada.');
            console.error('👉 Asegúrate de haber abierto el juego al menos una vez.');
            return;
        }
        // Obtenemos tamaño inicial
        try {
            const stats = fs.statSync(this.logPath);
            this.currentSize = stats.size;
            console.log(`✅ Archivo encontrado. Tamaño inicial: ${this.currentSize} bytes.`);
            this.isWatching = true;
            // Iniciamos el ciclo de lectura
            this.checkInterval = setInterval(() => this.checkUpdates(), 1000);
            console.log('👀 Vigilancia activa: Esperando cambios en el archivo...');
        }
        catch (error) {
            console.error('❌ Error al acceder al archivo:', error);
        }
    }
    checkUpdates() {
        if (!this.isWatching)
            return;
        try {
            const stats = fs.statSync(this.logPath);
            // DEBUG: Descomenta esto si quieres ver que el loop funciona (spam en consola)
            // console.log(`Ciclo: ${this.currentSize} -> ${stats.size}`);
            if (stats.size === this.currentSize)
                return;
            console.log(`⚡ CAMBIO DETECTADO! Nuevo tamaño: ${stats.size}`);
            if (stats.size < this.currentSize) {
                console.log('🔄 El archivo se reinició (es más pequeño). Reseteando cursor.');
                this.currentSize = 0;
            }
            const stream = fs.createReadStream(this.logPath, {
                start: this.currentSize,
                end: stats.size,
                encoding: 'utf8',
            });
            stream.on('data', (chunk) => {
                // Forzamos conversión a string para evitar errores de tipo
                const text = chunk.toString();
                this.parseChunk(text);
            });
            stream.on('end', () => {
                this.currentSize = stats.size;
            });
        }
        catch (err) {
            console.error('❌ Error leyendo actualización:', err);
        }
    }
    parseChunk(chunk) {
        console.log('📄 Procesando texto nuevo...');
        const lines = chunk.split('\n');
        lines.forEach((line) => {
            if (line.includes('Draft.Notify')) {
                console.log('🎯 ¡LÍNEA DE DRAFT ENCONTRADA!');
                console.log('Texto:', line);
                this.processDraftLine(line);
            }
        });
    }
    processDraftLine(line) {
        try {
            const jsonStartIndex = line.indexOf('{');
            if (jsonStartIndex === -1) {
                console.warn('⚠️ Se encontró Draft.Notify pero no el JSON "{".');
                return;
            }
            const jsonString = line.substring(jsonStartIndex);
            const data = JSON.parse(jsonString);
            console.log('📦 JSON Parseado correctamente:', data);
            this.emit('draft-pack', data);
        }
        catch (e) {
            console.error('❌ Error parseando JSON:', e);
        }
    }
    stop() {
        if (this.checkInterval)
            clearInterval(this.checkInterval);
        this.isWatching = false;
    }
}
exports.LogWatcher = LogWatcher;
//# sourceMappingURL=log-watcher.js.map