import { Component, inject } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DraftStore } from '@services';
import { ColorFilter, DraftType, UserGroup, ViewMode } from '@types';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-control-panel',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './control-panel.html',
  styleUrl: './control-panel.css',
})
export class ControlPanel {
  draftStore = inject(DraftStore);

  private readonly today = new Date();
  private readonly fiveYearsAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 5));

  formGroup = new FormGroup({
    currentSet: new FormControl('TLA', Validators.required),
    draftType: new FormControl(DraftType.Premier, Validators.required),
    userGroup: new FormControl(UserGroup.All, Validators.required),
    colors: new FormControl(ColorFilter.All, Validators.required),
    viewMode: new FormControl(ViewMode.CardList, Validators.required),
    startDate: new FormControl(this.fiveYearsAgo, Validators.required),
    endDate: new FormControl(this.today, Validators.required),
  });

  DraftType = DraftType;
  UserGroup = UserGroup;
  ColorFilter = ColorFilter;
  ViewMode = ViewMode;

  constructor() {
    this.initSetSubscription();
    this.initDateSubscription();
  }

  initSetSubscription() {
    this.formGroup
      .get('currentSet')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.draftStore.setCurrentSet(value);
      });

    this.formGroup
      .get('draftType')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.draftStore.setDraftType(value);
      });

    this.formGroup
      .get('userGroup')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.draftStore.setUserGroup(value);
      });

    this.formGroup
      .get('colors')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.draftStore.setColors(value);
      });

    this.formGroup
      .get('viewMode')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.draftStore.setViewMode(value);
      });
  }

  initDateSubscription() {
    // Suscribirse a cambios en startDate o endDate
    // Nota: El datepicker de rango dispara eventos parcialmente.
    // Lo ideal es verificar que ambos valores sean válidos antes de llamar al store.

    this.formGroup.valueChanges.pipe(takeUntilDestroyed()).subscribe((values) => {
      // Verificamos si cambiaron las fechas específicamente y si son válidas
      const start = values.startDate;
      const end = values.endDate;

      if (start instanceof Date && end instanceof Date) {
        // Solo actualizamos si las fechas en el store son diferentes para evitar bucles
        // (La conversión a string lo maneja el store, aquí pasamos Date objects)
        // Podrías agregar un debounceTime si sientes que hace muchas peticiones al seleccionar
        this.draftStore.setDateRange(start, end);
      }
    });
  }

  triggerSimulation() {
    console.log('🔘 Botón presionado: Pidiendo simulación a Electron...');
    if (window.electronAPI) {
      window.electronAPI.simulateDraft();
    } else {
      console.error('❌ Electron API no encontrada (¿Estás en el navegador?)');
      this.draftStore.updateFilterIds([
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
      this.draftStore.updateFilterIds([
        95951, 96155, 96035, 95841, 95974, 95930, 96031, 96132, 95833, 96034, 96035,
      ]);
    }
  }
}
