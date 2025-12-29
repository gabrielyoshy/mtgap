import { AfterViewInit, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OverlayToggleComponent } from './overlay-toggle/overlay-toggle.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OverlayToggleComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements AfterViewInit {
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
}
