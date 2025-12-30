export interface RawStats {
  mtga_id: number;
  name: string;
  color: string;
  rarity: string;
  url: string;
  url_back: string;
  types: string[];
  layout: string;
  seen_count: number;
  avg_seen: number;
  pick_count: number;
  avg_pick: number;
  game_count: number;
  pool_count: number;
  play_rate: number;
  win_rate: number;
  opening_hand_game_count: number;
  opening_hand_win_rate: number;
  drawn_game_count: number;
  drawn_win_rate: number;
  ever_drawn_game_count: number;
  ever_drawn_win_rate: number;
  never_drawn_game_count: number;
  never_drawn_win_rate: number;
  drawn_improvement_win_rate: number;
}

export interface DraftCard {
  mtgaId: number;
  name: string;
  imageUrl: string;
  color: string;
  rarity: string;
  seenCount: number;
  avgSeen: number;
  pickCount: number;
  avgPick: number;
  gameCount: number;
  poolCount: number;
  playRate: number;
  winRate: number;
  openingHandGameCount: number;
  openingHandWinRate: number;
  drawnGameCount: number;
  drawnWinRate: number;
  everDrawnGameCount: number;
  everDrawnWinRate: number;
  neverDrawnGameCount: number;
  neverDrawnWinRate: number;
  drawnImprovementWinRate: number;
  tier: string;
  bestCard: boolean;
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
