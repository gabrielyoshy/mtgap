import { Component, inject } from '@angular/core';
import { ControlPanel } from './components/control-panel/control-panel';
import { View } from './components/view/view';
import { ElectronService } from '@services';

@Component({
  selector: 'app-root',
  imports: [ControlPanel, View],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  electronService = inject(ElectronService);
}
