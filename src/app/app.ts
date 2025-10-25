import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OverlayToggleComponent } from './overlay-toggle/overlay-toggle.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OverlayToggleComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('MTGAP');
}
