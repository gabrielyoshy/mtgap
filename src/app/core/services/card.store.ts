import { inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
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

function calculateTier(wr: number): string {
  if (!wr) return '-';
  if (wr > 0.6) return 'S';
  if (wr > 0.57) return 'A';
  if (wr > 0.55) return 'B';
  if (wr > 0.52) return 'C';
  return 'D';
}

export const CardStore = signalStore(
  { providedIn: 'root' },

  withState({
    currentSet: 'TLA',
    filterIds: [] as number[],
    status: 'idle' as 'idle' | 'loading' | 'loaded' | 'error',
    colors: ColorFilter.All,
    userGroup: UserGroup.All,
    draftType: DraftType.Premier,
  }),

  withEntities<RawStats>(),

  withComputed((store) => ({
    filteredCards: computed(() => {
      const ids = store.filterIds();
      const entities = store.entityMap();

      return ids.map((id) => {
        const raw = entities[id];
        if (raw) {
          return {
            mtga_id: raw.mtga_id,
            name: raw.name,
            imageUrl:
              raw.url || `https://static.wikia.nocookie.net/mtgalaxy/images/${raw.mtga_id}.jpg`,

            color: raw.color || 'C',
            avg_seen: raw.avg_seen || 0,

            stats: {
              gihWr: raw.ever_drawn_win_rate
                ? (raw.ever_drawn_win_rate * 100).toFixed(1) + '%'
                : '-',
              gihWrValue: raw.ever_drawn_win_rate ? raw.ever_drawn_win_rate * 100 : 0,
              alsa: raw.avg_seen ? raw.avg_seen.toFixed(2) : '-',
              tier: calculateTier(raw.ever_drawn_win_rate),
              iwd: raw.drawn_improvement_win_rate
                ? (raw.drawn_improvement_win_rate * 100).toFixed(1) + 'pp'
                : '-',
            },
          } as DraftCard;
        } else {
          return {
            mtga_id: id,
            name: 'Desconocida / Cargando...',

            stats: undefined,
          } as DraftCard;
        }
      });
    }),
  })),

  withMethods((store, http = inject(HttpClient)) => ({
    updateFilterIds(ids: number[]) {
      patchState(store, { filterIds: ids });
    },

    setCurrentSet(currentSet: string) {
      patchState(store, { currentSet, status: 'idle' });
      this.loadStats();
    },

    setDraftType(draftType: DraftType) {
      patchState(store, { draftType, status: 'idle' });
      this.loadStats();
    },

    setUserGroup(userGroup: UserGroup) {
      patchState(store, { userGroup, status: 'idle' });
      this.loadStats();
    },

    setColors(colors: ColorFilter) {
      patchState(store, { colors, status: 'idle' });
      this.loadStats();
    },

    loadStats: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        switchMap(() => {
          const expansion = store.currentSet();
          const draftType = store.draftType();
          const userGroup =
            store.userGroup() === UserGroup.All ? '' : `&user_group=${store.userGroup()}`;
          const colors = store.colors() === ColorFilter.All ? '' : `&colors=${store.colors()}`;

          const url = `https://www.17lands.com/card_ratings/data?expansion=${expansion}&event_type=${draftType}${userGroup}${colors}`;

          return http.get<RawStats[]>(url).pipe(
            tapResponse({
              next: (data) => {
                patchState(
                  store,
                  setAllEntities(data, {
                    selectId: (card) => card.mtga_id,
                  }),
                  { status: 'loaded' },
                );

                console.log(`✅ [Store] Datos cargados.`);
              },
              error: (err) => {
                console.error('Error loading stats:', err);
                patchState(store, { status: 'error' });
              },
            }),
          );
        }),
      ),
    ),
  })),
);
