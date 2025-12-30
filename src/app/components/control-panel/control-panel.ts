import { Component, inject } from '@angular/core';
import { DraftService } from '../../core/services/draft.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CardStore, DraftType, UserGroup, ColorFilter } from '../../core/services/card.store';

@Component({
  selector: 'app-control-panel',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './control-panel.html',
  styleUrl: './control-panel.css',
})
export class ControlPanel {
  draftService = inject(DraftService);
  cardStore = inject(CardStore);

  formGroup = new FormGroup({
    currentSet: new FormControl('TLA', Validators.required),
    draftType: new FormControl(DraftType.Premier, Validators.required),
    userGroup: new FormControl(UserGroup.All, Validators.required),
    colors: new FormControl(ColorFilter.All, Validators.required),
  });

  // Exponer los enums para el template
  DraftType = DraftType;
  UserGroup = UserGroup;
  ColorFilter = ColorFilter;

  constructor() {
    this.initSetSubscription();
  }

  initSetSubscription() {
    this.formGroup
      .get('currentSet')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.cardStore.setCurrentSet(value);
      });

    this.formGroup
      .get('draftType')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.cardStore.setDraftType(value);
      });

    this.formGroup
      .get('userGroup')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.cardStore.setUserGroup(value);
      });

    this.formGroup
      .get('colors')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.cardStore.setColors(value);
      });
  }

  triggerSimulation() {
    console.log('🔘 Botón presionado: Pidiendo simulación a Electron...');
    if (window.electronAPI) {
      window.electronAPI.simulateDraft();
    } else {
      console.error('❌ Electron API no encontrada (¿Estás en el navegador?)');
      this.cardStore.updateFilterIds([
        95938, 96143, 96035, 95863, 95934, 95952, 96077, 96130, 95875, 96092, 96046, 95971, 95910,
        96179,
      ]);
    }
  }

  trigger2BoosterSimulation() {
    console.log('🔘 Botón presionado: Pidiendo simulación de 2 booster a Electron...');
    if (window.electronAPI) {
      window.electronAPI.simulate2Booster();
    } else {
      console.error('❌ Electron API no encontrada (¿Estás en el navegador?)');
      this.cardStore.updateFilterIds([
        95951, 96155, 96035, 95841, 95974, 95930, 96031, 96132, 95833, 96034, 96035,
      ]);
    }
  }
}
