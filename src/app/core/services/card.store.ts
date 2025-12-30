import { inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
// 1. Importamos withEntities y setAllEntities (ya no necesitamos entityConfig)
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

// --- Interfaces ---
export interface RawStats {
  mtga_id: number; // Asegúrate que esto coincida con la API
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
  // Nuevos campos
  color: string;
  avg_seen: number;
  stats?: {
    gihWr: string;
    gihWrValue: number; // Guardamos el número puro para ordenar fácil
    alsa: string;
    tier: string;
    iwd: string;
  };
}

// --- Helper ---
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
  }),

  // 2. CONFIGURACIÓN DIRECTA (Sin nombre de colección)
  // Al no usar 'collection', las entidades se guardan en 'entityMap' y 'ids' directamente.
  // Esto es mucho menos propenso a errores.
  withEntities<RawStats>(),

  withComputed((store) => ({
    filteredCards: computed(() => {
      const ids = store.filterIds();

      // 3. Accedemos a la colección por defecto (entityMap)
      const entities = store.entityMap();

      // Debug: Veremos si ahora sí es un objeto { "123": {...} }
      // console.log('🃏 Mapa de Entidades:', entities);

      return ids.map((id) => {
        const raw = entities[id];
        if (raw) {
          return {
            mtga_id: raw.mtga_id,
            name: raw.name,
            imageUrl:
              raw.url || `https://static.wikia.nocookie.net/mtgalaxy/images/${raw.mtga_id}.jpg`,

            // Mapeo de Color y Cantidad de Juegos
            color: raw.color || 'C', // 'C' = Colorless/Artifact si viene vacío
            avg_seen: raw.avg_seen || 0,

            stats: {
              gihWr: raw.ever_drawn_win_rate
                ? (raw.ever_drawn_win_rate * 100).toFixed(1) + '%'
                : '-',
              // Guardamos el valor numérico para lógica de recomendación
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
                // 4. VALIDACIÓN DE DATOS (CRÍTICO)
                // Si la API trae 'arena_id' en vez de 'mtga_id', aquí nos daremos cuenta.
                if (data.length > 0) {
                  const first = data[0];
                  console.log('🔍 Inspección de datos:', first);

                  if (first.mtga_id === undefined) {
                    console.error(
                      '⚠️ ALERTA: mtga_id es undefined. Claves disponibles:',
                      Object.keys(first),
                    );
                  }
                }

                // 5. GUARDADO EXPLÍCITO
                // Pasamos el selectId AQUÍ MISMO para forzar la indexación.
                patchState(
                  store,
                  setAllEntities(data, {
                    selectId: (card) => card.mtga_id, // <--- Forzamos la ID aquí
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
