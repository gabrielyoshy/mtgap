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

  // Columnas a mostrar
  displayedColumns: string[] = ['image', 'name', 'tier', 'gihWr', 'alsa', 'iwd', 'rarity'];

  // Fuente de datos de Material
  dataSource = new MatTableDataSource<DraftCard>();

  // Referencias al HTML para Ordenamiento y Paginación
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    // MAGIA: Sincronizamos el Store (Signal) con la Tabla (DataSource)
    effect(() => {
      const cards = this.store.filteredCards();
      this.dataSource.data = cards;

      // Opcional: Si cambian los datos, volver a la página 1
      if (this.paginator) {
        this.paginator.firstPage();
      }
    });
  }

  ngAfterViewInit() {
    // Vinculamos los componentes de Material al DataSource
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Configuración custom para ordenar correctamente los porcentajes (strings)
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'gihWr':
          return this.parsePercentage(item.stats?.gihWr);
        case 'iwd':
          return this.parsePercentage(item.stats?.iwd);
        case 'alsa':
          return parseFloat(item.stats?.alsa || '0');
        case 'tier':
          return this.tierValue(item.stats?.tier); // Para que S > A > B
        default:
          return (item as any)[property];
      }
    };
  }

  // Helpers de UI
  parsePercentage(val?: string): number {
    if (!val || val === '-') return -999;
    return parseFloat(val.replace('%', '').replace('pp', ''));
  }

  tierValue(tier?: string): number {
    const map: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, '-': 0 };
    return map[tier || '-'] || 0;
  }

  getWrColor(wrString?: string): string {
    const wr = this.parsePercentage(wrString);
    if (wr >= 60) return '#d8b4fe'; // Morado
    if (wr >= 57) return '#86efac'; // Verde
    if (wr >= 54) return '#67e8f9'; // Azul
    if (wr < 50 && wr > 0) return '#fca5a5'; // Rojo
    return '#e5e7eb'; // Gris
  }
}
