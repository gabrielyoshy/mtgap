import { inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, type, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, entityConfig, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

// --- Interfaces ---
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
  stats?: {
    gihWr: string;
    alsa: string;
    tier: string;
    iwd?: string;
  };
}

// --- Helper Puro (Fuera del Store) ---
function calculateTier(wr: number): string {
  if (!wr) return '-';
  if (wr > 0.6) return 'S';
  if (wr > 0.57) return 'A';
  if (wr > 0.55) return 'B';
  if (wr > 0.52) return 'C';
  return 'D';
}

// --- Config Entities ---
const cardsConfig = entityConfig({
  entity: type<RawStats>(),
  collection: '_cards',
  selectId: (card) => card.mtga_id,
});

export const CardStore = signalStore(
  { providedIn: 'root' },

  // 1. Estado Base (Agregamos filterIds)
  withState({
    currentSet: 'TLA',
    filterIds: [] as number[], // <--- NUEVO STATE
    status: 'idle' as 'idle' | 'loading' | 'loaded' | 'error',
  }),

  // 2. Entidades
  withEntities(cardsConfig),

  // 3. Computed Signals (La magia ocurre aquí)
  withComputed((store) => ({
    // Este signal se recalcula automáticamente si cambia 'filterIds' O si se cargan datos en '_cards'
    filteredCards: computed(() => {
      const ids = store.filterIds();
      const entities = store._cardsEntities(); // Diccionario O(1)

      return ids.map((id) => {
        const raw = entities[id];

        if (raw) {
          // Transformación de RawStats a DraftCard
          return {
            mtga_id: raw.mtga_id,
            name: raw.name,
            imageUrl:
              raw.url || `https://static.wikia.nocookie.net/mtgalaxy/images/${raw.mtga_id}.jpg`,
            stats: {
              gihWr: raw.ever_drawn_win_rate
                ? (raw.ever_drawn_win_rate * 100).toFixed(1) + '%'
                : '-',
              alsa: raw.avg_seen ? raw.avg_seen.toFixed(2) : '-',
              tier: calculateTier(raw.ever_drawn_win_rate),
              iwd: raw.drawn_improvement_win_rate
                ? (raw.drawn_improvement_win_rate * 100).toFixed(1) + 'pp'
                : '-',
            },
          } as DraftCard;
        } else {
          // Fallback
          return {
            mtga_id: id,
            name: 'Desconocida / Cargando...',
            imageUrl: `https://static.wikia.nocookie.net/mtgalaxy/images/${id}.jpg`,
            stats: undefined,
          } as DraftCard;
        }
      });
    }),
  })),

  // 4. Métodos
  withMethods((store, http = inject(HttpClient)) => ({
    // --- Nuevo Método para actualizar el filtro ---
    updateFilterIds(ids: number[]) {
      patchState(store, { filterIds: ids });
    },

    setExpansion(expansion: string) {
      patchState(store, { currentSet: expansion, status: 'idle' });
      this.loadStats();
    },

    loadStats: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        switchMap(() => {
          const expansion = store.currentSet();
          const url = `https://www.17lands.com/card_ratings/data?expansion=${expansion}&format=PremierDraft`;

          return http.get<RawStats[]>(url).pipe(
            tapResponse({
              next: (data) => {
                patchState(store, setAllEntities(data, cardsConfig), { status: 'loaded' });
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
