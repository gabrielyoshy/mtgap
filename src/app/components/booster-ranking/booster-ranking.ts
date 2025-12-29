import { Component, ViewChild, inject, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CardStore, DraftCard } from '../../core/services/card.store';

@Component({
  selector: 'app-booster-ranking',
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './booster-ranking.html',
  styleUrl: './booster-ranking.css',
})
export class BoosterRanking implements AfterViewInit {
  readonly store = inject(CardStore);

  // Añadimos 'pick' (recomendación), 'color' y 'games'
  displayedColumns: string[] = [
    'pick',
    'image',
    'name',
    'color',
    'tier',
    'gihWr',
    'iwd',
    'alsa',
    'games',
  ];

  dataSource = new MatTableDataSource<DraftCard>();
  bestPickId: number | null = null; // Para marcar la mejor carta

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    effect(() => {
      const cards = this.store.filteredCards();

      // Lógica de Recomendación:
      // Encontramos la carta con mayor GIH WR (ignorando las que tienen pocos juegos si quieres)
      const bestCard = [...cards].sort(
        (a, b) => (b.stats?.gihWrValue || 0) - (a.stats?.gihWrValue || 0),
      )[0];
      this.bestPickId = bestCard ? bestCard.mtga_id : null;

      this.dataSource.data = cards;

      // Si cambian los datos, sugerimos ordenar por Pick (GIH WR)
      if (this.sort) {
        this.sort.sort({ id: 'gihWr', start: 'desc', disableClear: false });
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Configuración custom para ordenar números correctamente
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'pick':
          return item.mtga_id === this.bestPickId ? 1 : 0; // El mejor pick va primero
        case 'gihWr':
          return item.stats?.gihWrValue || 0;
        case 'iwd':
          return this.parsePercentage(item.stats?.iwd);
        case 'alsa':
          return parseFloat(item.stats?.alsa || '99'); // Mayor ALSA al final
        case 'games':
          return item.avg_seen;
        case 'tier':
          return this.tierValue(item.stats?.tier);
        default:
          return (item as any)[property];
      }
    };
  }

  parsePercentage(val?: string): number {
    if (!val || val === '-') return -999;
    return parseFloat(val.replace('%', '').replace('pp', ''));
  }

  tierValue(tier?: string): number {
    const map: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, '-': 0 };
    return map[tier || '-'] || 0;
  }

  getWrColor(val?: number): string {
    if (!val) return '#e5e7eb';
    if (val >= 60) return '#d8b4fe'; // Mítico
    if (val >= 57) return '#86efac'; // Verde
    if (val >= 54) return '#67e8f9'; // Azul
    if (val < 50) return '#fca5a5'; // Rojo
    return '#e5e7eb';
  }
}
