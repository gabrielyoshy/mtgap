import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DraftStore } from '@services';
import { DraftCard } from '@types';

@Component({
  selector: 'app-booster-ranking',
  imports: [CommonModule, MatTableModule, MatIconModule, MatTooltipModule],
  templateUrl: './booster-ranking.html',
  styleUrl: './booster-ranking.css',
})
export class BoosterRanking {
  readonly store = inject(DraftStore);

  displayedColumns: string[] = [
    'pick',
    'image',
    'name',
    'tier',
    'everDrawnWinRate',
    'drawnImprovementWinRate',
    'neverDrawnWinRate',
    'rarity',
    'seenCount',
    'avgSeen',
    'pickCount',
    'avgPick',
    'gameCount',
    'poolCount',
    'playRate',
    'winRate',
    'openingHandGameCount',
    'openingHandWinRate',
    'drawnGameCount',
    'drawnWinRate',
    'everDrawnGameCount',
    'neverDrawnGameCount',
  ];

  dataSource = new MatTableDataSource<DraftCard>();
}
