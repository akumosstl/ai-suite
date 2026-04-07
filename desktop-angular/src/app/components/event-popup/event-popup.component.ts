import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GameEvent, EventChoice } from '../../services/api.service';

export interface EventPopupData {
  event: GameEvent;
}

@Component({
  selector: 'app-event-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Event!</h2>
    <mat-dialog-content>
      <p>{{ data.event.description }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button *ngFor="let choice of data.event.choices; let i = index"
              (click)="selectChoice(i)">{{ choice.text }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 300px;
    }
  `]
})
export class EventPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<EventPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventPopupData
  ) {}

  selectChoice(index: number): void {
    this.dialogRef.close(index);
  }
}