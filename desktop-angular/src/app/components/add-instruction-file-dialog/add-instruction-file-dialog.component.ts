import { Component, Inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface InstructionFileData {
  path: string;
  fileName: string;
  content: string;
}

@Component({
  selector: 'app-add-instruction-file-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Add Instruction File</h2>
    <mat-dialog-content>
      <mat-form-field style="width: 100%">
        <mat-label>Path</mat-label>
        <input matInput [(ngModel)]="data.path" />
      </mat-form-field>
      <mat-form-field style="width: 100%">
        <mat-label>File Name</mat-label>
        <input matInput [(ngModel)]="data.fileName" />
      </mat-form-field>
      <mat-form-field style="width: 100%">
        <mat-label>Content</mat-label>
        <textarea matInput [(ngModel)]="data.content" rows="5"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="data">Add</button>
    </mat-dialog-actions>
  `
})
export class AddInstructionFileDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AddInstructionFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InstructionFileData
  ) {
    this.data = { path: '', fileName: '', content: '' };
  }
}