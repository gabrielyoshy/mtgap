export interface ElectronAPI {
  onDraftUpdate: (callback: (data: any) => void) => void;
  startLogWatcher: () => void;
  setIgnoreMouseEvents: (ignore: boolean) => void;
  simulateDraft: () => void;
  simulate2Booster: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
