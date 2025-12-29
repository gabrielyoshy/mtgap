import { Injectable, NgZone, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  // Usamos un Signal para almacenar los IDs de las cartas del pack actual
  currentPack = signal<number[]>([]);

  constructor(private ngZone: NgZone) {
    this.initElectronListener();
  }

  private initElectronListener() {
    if (window.electronAPI) {
      window.electronAPI.onDraftUpdate((data: any) => {
        console.log('🃏 Datos recibidos en Angular:', data);

        // La estructura de MTGA suele ser data.SelfPack o data.PackCards
        // Depende de la versión del log, pero usualmente es un array de strings (IDs)
        let cardIds: string[] = [];

        if (data.SelfPack) {
          cardIds = data.SelfPack;
        } else if (data.PackCards) {
          cardIds = data.PackCards.split(','); // A veces viene como string separado por comas
        }

        // Convertimos a números para procesar mejor
        const numericIds = cardIds.map((id) => Number(id)).filter((id) => !isNaN(id));

        // Actualizamos el Signal dentro de la zona de Angular para refrescar la vista
        this.ngZone.run(() => {
          this.currentPack.set(numericIds);
        });
      });

      // Iniciamos el watcher explícitamente si no arrancó solo
      window.electronAPI.startLogWatcher();
    }
  }
}
