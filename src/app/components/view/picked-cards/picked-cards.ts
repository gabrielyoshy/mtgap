import { Component, inject, computed } from '@angular/core';
import { PercentPipe, DecimalPipe } from '@angular/common';
import { DraftStore } from '@services';

@Component({
  selector: 'app-picked-cards',
  imports: [PercentPipe],
  templateUrl: './picked-cards.html',
  styleUrl: './picked-cards.css',
})
export class PickedCards {
  readonly store = inject(DraftStore);

  // Obtenemos las cartas del pool ordenadas por Tier/WinRate descendente
  mainCards = computed(() => {
    const mainCards = this.store.mainDeck();
    // Ordenar: Primero las mejores cartas
    return mainCards.sort((a, b) => (b?.everDrawnWinRate || 0) - (a?.everDrawnWinRate || 0));
  });

  sideboardCards = computed(() => {
    const sideCards = this.store.sideboard();
    // Ordenar: Primero las mejores cartas
    return sideCards.sort((a, b) => (b?.everDrawnWinRate || 0) - (a?.everDrawnWinRate || 0));
  });

  // Estadísticas Agregadas del Mazo
  deckStats = computed(() => {
    const cards = this.mainCards();
    if (cards.length === 0) return { avgWr: 0, sTier: 0, aTier: 0 };

    const totalWr = cards.reduce((acc, c) => acc + (c?.everDrawnWinRate || 0), 0);
    const avgWr = totalWr / cards.length;

    // Contar Tiers
    const sTier = cards.filter((c) => c?.tier.includes('S')).length;
    const aTier = cards.filter((c) => c?.tier.includes('A')).length;

    return { avgWr, sTier, aTier };
  });

  getTierClass(tier: string): string {
    if (!tier) return 'tier-d';
    const cleanTier = tier.replace(/[\+\-]/g, '').toLowerCase();
    return `tier-${cleanTier}`;
  }
}
