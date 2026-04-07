import { Component, Inject } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { CommonModule } from '@angular/common'

export interface PipelineResultDialogData {
  success: boolean
  message: string
  showConfirm?: boolean
  confirmText?: string
  cancelText?: string
}

@Component({
  selector: 'app-pipeline-result-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.success ? 'Success' : (data.showConfirm ? 'Confirm' : 'Error') }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)" *ngIf="data.showConfirm">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button mat-button (click)="dialogRef.close(true)" 
              [color]="data.showConfirm ? 'primary' : ''">
        {{ data.confirmText || 'OK' }}
      </button>
    </mat-dialog-actions>
  `
})
export class PipelineResultDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PipelineResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PipelineResultDialogData
  ) {}
}
