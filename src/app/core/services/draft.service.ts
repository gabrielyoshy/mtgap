import { inject, Injectable } from '@angular/core';
import { CardStore } from './card.store';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  cardStore = inject(CardStore);

  constructor() {
    this.initElectronListener();
  }

  private initElectronListener() {
    if (window.electronAPI) {
      window.electronAPI.onDraftUpdate((data: any) => {
        console.log('🃏 Datos recibidos en Angular:', data);

        // La estructura de MTGA suele ser data.SelfPack o data.PackCards
        // Depende de la versión del log, pero usualmente es un array de strings (IDs)
        let cardIds: string[] = [];

        if (data.DraftPack) {
          cardIds = data.DraftPack;
        } else if (data.DraftPack) {
          cardIds = data.DraftPack.split(','); // A veces viene como string separado por comas
        }

        // Convertimos a números para procesar mejor
        const numericIds = cardIds.map((id) => Number(id)).filter((id) => !isNaN(id));

        // Actualizamos el Signal dentro de la zona de Angular para refrescar la vista
        this.cardStore.updateFilterIds(numericIds);
      });

      // Iniciamos el watcher explícitamente si no arrancó solo
      window.electronAPI.startLogWatcher();
    }
  }
}
