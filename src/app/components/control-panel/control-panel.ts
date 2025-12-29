import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DraftService } from '../../core/services/draft.service';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CardStore } from '../../core/services/card.store';

@Component({
  selector: 'app-control-panel',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './control-panel.html',
  styleUrl: './control-panel.css',
})
export class ControlPanel implements AfterViewInit {
  draftService = inject(DraftService);
  cardStore = inject(CardStore);

  collectionFormControl = new FormControl('TLA', Validators.required);

  constructor() {
    effect(() => {
      console.log('Pack actual:', this.draftService.currentPack());
    });

    this.collectionFormControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      console.log('🛠️ [ControlPanel] Set cambiado a:', value);
      if (value) this.cardStore.setExpansion(value);
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
    // console.log('🔘 Botón presionado: Pidiendo simulación a Electron...');
    // if (window.electronAPI) {
    //   window.electronAPI.simulateDraft();
    // } else {
    //   console.error('❌ Electron API no encontrada (¿Estás en el navegador?)');
    // }

    this.cardStore.updateFilterIds([97274, 97275, 97276]);
  }
}
