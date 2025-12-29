import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardStore, DraftCard } from '../../core/services/card.store';

@Component({
  selector: 'app-booster-ranking',
  imports: [FormsModule],
  templateUrl: './booster-ranking.html',
  styleUrl: './booster-ranking.css',
})
export class BoosterRanking {
  readonly store = inject(CardStore);
}
