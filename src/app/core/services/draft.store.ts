import { inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import {
  ColorFilter,
  DraftCard,
  DraftType,
  RawStats,
  UserGroup,
  ViewMode,
} from '../types/draft-store';

function calculateTier(wr: number): string {
  if (!wr) return '-';
  if (wr > 0.6) return 'S';
  if (wr > 0.57) return 'A';
  if (wr > 0.55) return 'B';
  if (wr > 0.52) return 'C';
  return 'D';
}

export const DraftStore = signalStore(
  { providedIn: 'root' },

  withState({
    currentSet: 'TLA',
    filterIds: [] as number[],
    status: 'idle' as 'idle' | 'loading' | 'loaded' | 'error',
    colors: ColorFilter.All,
    userGroup: UserGroup.All,
    draftType: DraftType.Premier,
    viewMode: ViewMode.CardList,
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

    setViewMode(viewMode: ViewMode) {
      patchState(store, { viewMode });
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
