import { inject, Injectable } from '@angular/core';
import { DraftStore } from './draft.store';

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

      window.electronAPI.startLogWatcher();
    }
  }
}
