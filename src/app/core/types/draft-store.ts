export interface RawStats {
  mtga_id: number;
  name: string;
  url: string;
  ever_drawn_win_rate: number;
  avg_seen: number;
  rarity?: string;
  color?: string;
  types?: string[];
  drawn_improvement_win_rate?: number;
}

export interface DraftCard {
  mtga_id: number;
  name: string;
  imageUrl: string;
  color: string;
  avg_seen: number;
  stats?: {
    gihWr: string;
    gihWrValue: number;
    alsa: string;
    tier: string;
    iwd: string;
  };
}

export enum DraftType {
  Premier = 'PremierDraft',
  Traditional = 'TradDraft',
  QuickDraft = 'QuickDraft',
  Sealed = 'Sealed',
  TradSealed = 'TradSealed',
  ArenaDirectSealed = 'ArenaDirect_Sealed',
  EmblemQuickDraft = 'Emblem_QuickDraft',
  MidWeekQuickDraft = 'MidWeekQuickDraft',
  QualifierPlayInSealed = 'QualifierPlayIn_Sealed',
}

export enum UserGroup {
  All = 'all',
  Top = 'top',
  Middle = 'middle',
  Bottom = 'bottom',
}

export enum ColorFilter {
  All = 'all',
  W = 'W',
  U = 'U',
  B = 'B',
  R = 'R',
  G = 'G',
  WU = 'WU',
  WB = 'WB',
  WR = 'WR',
  WG = 'WG',
  UB = 'UB',
  UR = 'UR',
  UG = 'UG',
  BR = 'BR',
  BG = 'BG',
  RG = 'RG',
  WGU = 'WGU',
  WUB = 'WUB',
  WBR = 'WBR',
  WRG = 'WRG',
  WBG = 'WBG',
  UBR = 'UBR',
  URG = 'URG',
  BRG = 'BRG',
  WUBRG = 'WUBRG',
}

export enum ViewMode {
  CardList = 'card-list',
  BoosterRanking = 'booster-ranking',
  Graphs = 'graphs',
}
