import { Component, inject } from '@angular/core';
import { DraftStore } from '@services';

@Component({
  selector: 'app-cards-with-stats',
  imports: [],
  templateUrl: './cards-with-stats.html',
  styleUrl: './cards-with-stats.css',
})
export class CardsWithStats {
  readonly store = inject(DraftStore);
  cards = this.store.filteredCards;

  getScryfallImage(cardName: string): string {
    const query = encodeURIComponent(cardName);
    return `https://api.scryfall.com/cards/named?exact=${query}&format=image&version=normal`;
  }

  // Helper para colorear el Win Rate
  getWinRateClass(wr: number): string {
    const percentage = wr * 100;
    if (percentage >= 60) return 'stat-godly'; // Roto
    if (percentage >= 57) return 'stat-great'; // Muy bueno
    if (percentage >= 54) return 'stat-good'; // Bueno
    if (percentage >= 50) return 'stat-average'; // Relleno
    return 'stat-bad'; // Malo
  }

  // Formatear porcentaje
  formatPercent(val: number): string {
    return (val * 100).toFixed(1) + '%';
  }
}
