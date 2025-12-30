import { Component, inject } from '@angular/core';
import { BoosterRanking } from './booster-ranking/booster-ranking';
import { DraftStore } from '@services';
import { ViewMode } from '@types';
import { CardsWithStats } from './cards-with-stats/cards-with-stats';

@Component({
  selector: 'app-view',
  imports: [BoosterRanking, CardsWithStats],
  templateUrl: './view.html',
  styleUrl: './view.css',
})
export class View {
  readonly store = inject(DraftStore);
  viewMode = this.store.viewMode;
  ViewModeType = ViewMode;
}
