import { PercentPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DraftStore } from '@services';
import { DraftPick } from '@types';

@Component({
  selector: 'app-cards-with-stats',
  imports: [PercentPipe],
  templateUrl: './cards-with-stats.html',
  styleUrl: './cards-with-stats.css',
})
export class CardsWithStats {
  readonly store = inject(DraftStore);
  cards = this.store.filteredCards;

  getTierClass(tier: string): string {
    // Limpiamos el tier por si viene con +/- (ej: "B+" -> "b")
    const cleanTier = tier.replace(/[\+\-]/g, '').toLowerCase();
    return `tier-${cleanTier}`; // Retorna 'tier-s', 'tier-a', etc.
  }

  onCardClick(cardId: number) {
    const currentPoolSize = this.store.pickedCards().length;

    const manualPick: DraftPick = {
      zone: 'main',
      draftId: 'manual',
      packNumber: 1, // Simplificación para picks manuales
      pickNumber: currentPoolSize + 1,
      cardId: cardId,
    };

    this.store.addPick(manualPick);
  }
}
