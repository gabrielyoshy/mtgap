import { Component } from '@angular/core';

import { BoosterRanking } from './components/booster-ranking/booster-ranking';
import { ControlPanel } from './components/control-panel/control-panel';

@Component({
  selector: 'app-root',
  imports: [BoosterRanking, ControlPanel],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {}
