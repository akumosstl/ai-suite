import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  private windowOpened = false;

  openMainWindow(): void {
    if (this.windowOpened) {
      return;
    }
    this.windowOpened = true;

    const width = window.screen.width;
    const height = window.screen.height;
    const features = `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes,top=0,left=0`;
    window.open(window.location.href, '_blank', features);
  }
}