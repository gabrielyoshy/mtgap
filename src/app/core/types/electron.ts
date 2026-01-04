import { DraftPick } from './draft-store';

export interface ElectronAPI {
  onDraftUpdate: (callback: (data: any) => void) => void;
  onDraftPick: (callback: (data: DraftPick) => void) => void;
  startLogWatcher: () => void;
  simulateDraft: () => void;
  simulate2Booster: () => void;
  onDraftDeckLoaded: (callback: (data: { main: number[]; side: number[] }) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
