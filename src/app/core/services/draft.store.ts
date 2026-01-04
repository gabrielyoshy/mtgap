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
  DraftPick,
  DraftType,
  RawStats,
  UserGroup,
  ViewMode,
} from '@types';

function calculateTier(wr: number): string {
  if (!wr) return '-';
  if (wr > 0.65) return 'A+';
  if (wr > 0.64) return 'A';
  if (wr > 0.625) return 'A-';
  if (wr > 0.61) return 'B+';
  if (wr > 0.595) return 'B';
  if (wr > 0.585) return 'B-';
  if (wr > 0.565) return 'C+';
  if (wr > 0.55) return 'C';
  if (wr > 0.54) return 'C-';
  if (wr > 0.45) return 'D';
  return 'F';
}

function mapToDraftCard(raw: RawStats, isBestCard: boolean = false): DraftCard {
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
    tier: calculateTier(raw.ever_drawn_win_rate),
    bestCard: isBestCard,
  } as DraftCard;
}

function mapDeckToDisplay(deckCards: DraftPick[], entities: Record<string, RawStats>) {
  return deckCards
    .map((dc) => {
      const raw = entities[dc.cardId];
      if (!raw) return null;

      const card = mapToDraftCard(raw);
      // Agregamos info extra útil para la UI
      return {
        ...card,
        pickedAt: `P${dc.packNumber}P${dc.pickNumber}`,
        // Importante: Pasamos la referencia del objeto DeckCard original
        // para poder usar sus datos (pack/pick) al hacer click para moverla
        sourceRef: dc,
      };
    })
    .filter(Boolean);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

const today = new Date();
const fiveYearsAgo = new Date();
fiveYearsAgo.setFullYear(today.getFullYear() - 5);

export const DraftStore = signalStore(
  { providedIn: 'root' },

  withState({
    currentSet: 'TLA',
    filterIds: [] as number[],
    pickedCards: [] as DraftPick[],
    status: 'idle' as 'idle' | 'loading' | 'loaded' | 'error',
    colors: ColorFilter.All,
    userGroup: UserGroup.All,
    draftType: DraftType.Premier,
    viewMode: ViewMode.CardList,
    startDate: formatDate(fiveYearsAgo),
    endDate: formatDate(today),
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
          tier: calculateTier(raw.ever_drawn_win_rate),
          bestCard: isBestCard,
        } as DraftCard;
      });
    }),

    mainDeck: computed(() => {
      const mainCards = store.pickedCards().filter((c) => c.zone === 'main');
      return mapDeckToDisplay(mainCards, store.entityMap());
    }),

    // CAMBIO 3: Computed separado para SIDEBOARD
    sideboard: computed(() => {
      const sideCards = store.pickedCards().filter((c) => c.zone === 'sideboard');
      return mapDeckToDisplay(sideCards, store.entityMap());
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

    addPick(pick: DraftPick) {
      patchState(store, (state) => {
        // Verificación simple para evitar duplicados si el log escupe el evento dos veces
        const exists = state.pickedCards.some(
          (p) =>
            p.draftId === pick.draftId &&
            p.packNumber === pick.packNumber &&
            p.pickNumber === pick.pickNumber,
        );

        if (exists) return state;

        const newCard: DraftPick = {
          ...pick,
          zone: 'main',
        };

        return {
          pickedCards: [...state.pickedCards, newCard],
        };
      });
    },

    toggleZone(packNumber: number, pickNumber: number) {
      patchState(store, (state) => {
        return {
          pickedCards: state.pickedCards.map((card) => {
            // Identificamos la carta única por su momento de pick
            if (card.packNumber === packNumber && card.pickNumber === pickNumber) {
              return {
                ...card,
                // Si es main -> side, si es side -> main
                zone: card.zone === 'main' ? 'sideboard' : 'main',
              };
            }
            return card;
          }),
        };
      });
    },

    resetDraft() {
      patchState(store, { pickedCards: [], filterIds: [] });
    },

    setDateRange(start: Date, end: Date) {
      patchState(store, {
        startDate: formatDate(start),
        endDate: formatDate(end),
        status: 'idle',
      });
      this.loadStats();
    },

    loadDeckFromLog(data: { main: number[]; side: number[] }) {
      patchState(store, (state) => {
        const newPickedCards: DraftPick[] = [];
        let counter = 1;

        // Procesar Main Deck
        data.main.forEach((cardId) => {
          newPickedCards.push({
            draftId: 'imported',
            packNumber: 0, // 0 indica que vino del log, no de un pack en vivo
            pickNumber: counter++, // ID único secuencial
            cardId: cardId,
            zone: 'main',
          });
        });

        // Procesar Sideboard
        data.side.forEach((cardId) => {
          newPickedCards.push({
            draftId: 'imported',
            packNumber: 0,
            pickNumber: counter++,
            cardId: cardId,
            zone: 'sideboard',
          });
        });

        return {
          pickedCards: newPickedCards,
          // Opcional: Si cargas un mazo, quizás quieras limpiar el filtro del sobre actual
          filterIds: [],
        };
      });

      // Importante: Asegurarnos de tener los datos de estas cartas
      // Si la colección cargada es diferente a la del store, recargamos stats
      // (Aquí asumo que el usuario ya seleccionó el set correcto en el panel)
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
          const filterDate = `&start_date=${store.startDate()}&end_date=${store.endDate()}`;

          const url = `https://www.17lands.com/card_ratings/data?expansion=${expansion}&event_type=${draftType}${userGroup}${colors}${filterDate}`;

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
