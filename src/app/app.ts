import { AfterViewInit, Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OverlayToggleComponent } from './overlay-toggle/overlay-toggle.component';
import { DraftService } from './core/services/draft.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements AfterViewInit {
  draftService = inject(DraftService);

  constructor() {
    // Esto imprimirá en la consola del navegador cada vez que cambie el pack
    effect(() => {
      console.log('Pack actual:', this.draftService.currentPack());
    });
  }

  ngAfterViewInit() {
    // IMPORTANTE: Al iniciar, le decimos a Electron:
    // "Todo lo que sea transparente, ignóralo"
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(true);
    }
  }

  // Cuando el mouse entra al menú (Lo hacemos clickeable)
  onMouseEnter() {
    console.log('Mouse sobre el menú: Activando clics');
    window.electronAPI?.setIgnoreMouseEvents(false);
  }

  // Cuando el mouse sale del menú (Lo hacemos fantasma otra vez)
  onMouseLeave() {
    console.log('Mouse fuera del menú: Pasando clics al juego');
    window.electronAPI?.setIgnoreMouseEvents(true);
  }

  triggerSimulation() {
    console.log('🔘 Botón presionado: Pidiendo simulación a Electron...');
    if (window.electronAPI) {
      window.electronAPI.simulateDraft();
    } else {
      console.error('❌ Electron API no encontrada (¿Estás en el navegador?)');
    }
  }
}
