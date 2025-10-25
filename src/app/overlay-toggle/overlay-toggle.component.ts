import { Component } from '@angular/core';

@Component({
  selector: 'overlay-toggle',
  standalone: true,
  templateUrl: './overlay-toggle.component.html',
  styleUrls: ['./overlay-toggle.component.css'],
})
export class OverlayToggleComponent {
  // index of display to move to
  displayIndex = 0;
  interactive = false;

  onIndexChange(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    const n = Number(v);
    if (!Number.isFinite(n) || isNaN(n)) return;
    this.displayIndex = Math.max(0, Math.floor(n));
  }

  private callMove(i: number) {
    try {
      const api = (window as any).electronAPI;
      if (api && api.moveToDisplay) api.moveToDisplay(i);
      else console.warn('electronAPI.moveToDisplay not available');
    } catch (e) {
      console.warn('moveToDisplay failed', e);
    }
  }

  move() {
    this.callMove(this.displayIndex);
  }

  movePrimary() {
    this.displayIndex = 0;
    this.callMove(0);
  }

  // When user hovers the overlay control, disable click-through so the overlay can receive clicks.
  onEnter() {
    try {
      const api = (window as any).electronAPI;
      if (api && api.setIgnoreMouseEvents) api.setIgnoreMouseEvents(false);
    } catch (e) {
      // ignore
    }
  }

  // When leaving the overlay UI, re-enable click-through so clicks pass through to the game.
  onLeave() {
    if (this.interactive) return;
    try {
      const api = (window as any).electronAPI;
      if (api && api.setIgnoreMouseEvents) api.setIgnoreMouseEvents(true);
    } catch (e) {
      // ignore
    }
  }

  toggleInteractive() {
    const next = !this.interactive;
    this.interactive = next;
    try {
      const api = (window as any).electronAPI;
      if (api && api.setIgnoreMouseEvents) api.setIgnoreMouseEvents(!next);
    } catch (e) {}
  }
}
