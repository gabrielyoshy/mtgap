import { inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { ColorFilter, DraftCard, DraftType, RawStats, UserGroup, ViewMode } from '@types';

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

      const currentCards = ids
        .map((id) => entities[id])
        .filter((raw): raw is RawStats => raw !== undefined);

      const maxWinRate =
        currentCards.length > 0
          ? Math.max(...currentCards.map((c) => c.ever_drawn_win_rate || 0))
          : 0;

      return ids.map((id) => {
        const raw = entities[id];

        if (!raw) {
          return null;
        }

        const currentWinRate = raw.ever_drawn_win_rate || 0;
        const isBestCard = currentWinRate === maxWinRate && maxWinRate > 0;

        return {
          mtgaId: raw.mtga_id,
          name: raw.name,
          imageUrl: raw.url,
          color: raw.color,
          rarity: raw.rarity,
          seenCount: raw.seen_count,
          avgSeen: raw.avg_seen,
          pickCount: raw.pick_count,
          avgPick: raw.avg_pick,
          gameCount: raw.game_count,
          poolCount: raw.pool_count,
          playRate: raw.play_rate,
          winRate: raw.win_rate,
          openingHandGameCount: raw.opening_hand_game_count,
          openingHandWinRate: raw.opening_hand_win_rate,
          drawnGameCount: raw.drawn_game_count,
          drawnWinRate: raw.drawn_win_rate,
          everDrawnGameCount: raw.ever_drawn_game_count,
          everDrawnWinRate: raw.ever_drawn_win_rate,
          neverDrawnGameCount: raw.never_drawn_game_count,
          neverDrawnWinRate: raw.never_drawn_win_rate,
          drawnImprovementWinRate: raw.drawn_improvement_win_rate,
          tier: calculateTier(raw.win_rate),
          bestCard: isBestCard,
        } as DraftCard;
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
