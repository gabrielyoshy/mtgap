import { inject, Injectable } from '@angular/core';
import { DraftStore } from './draft.store';
import { DraftPick } from '@types';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  draftStore = inject(DraftStore);

  constructor() {
    this.initElectronListener();
  }

  private initElectronListener() {
    if (window.electronAPI) {
      window.electronAPI.onDraftUpdate((data: any) => {
        console.log('🃏 Datos recibidos en Angular:', data);
        let cardIds: string[] = [];
        if (data.DraftPack) {
          cardIds = data.DraftPack;
        } else if (data.DraftPack) {
          cardIds = data.DraftPack.split(',');
        }

        const numericIds = cardIds.map((id) => Number(id)).filter((id) => !isNaN(id));

        this.draftStore.updateFilterIds(numericIds);
      });

      // 2. Evento de PICK REALIZADO
      window.electronAPI.onDraftPick((data: DraftPick) => {
        console.log('point_right Pick recibido:', data);
        // Convertimos el ID a número por seguridad, aunque ya debería venir así
        const pickInfo = {
          ...data,
          cardId: Number(data.cardId),
        };

        this.draftStore.addPick(pickInfo);
      });

      window.electronAPI.onDraftDeckLoaded((data: any) => {
        console.log('📂 Mazo recibido en Angular:', data);
        this.draftStore.loadDeckFromLog(data);
      });

      window.electronAPI.startLogWatcher();
    }
  }
}
