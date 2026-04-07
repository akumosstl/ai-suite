import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="hud">
      <div class="hud-item">
        <span>Day {{ currentDay }} of Sprint {{ currentSprint }}</span>
      </div>
      <div class="hud-item">
        <span>Budget: $ {{ budget }}</span>
      </div>
      <div class="hud-item">
        <span>Quality: {{ qualityScore }}%</span>
        <mat-progress-bar mode="determinate" [value]="qualityScore"></mat-progress-bar>
      </div>
    </div>
  `,
  styles: [`
    .hud {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
    }
    .hud-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    mat-progress-bar {
      width: 100px;
      margin-top: 4px;
    }
  `]
})
export class HudComponent {
  @Input() currentDay: number = 1;
  @Input() currentSprint: number = 1;
  @Input() budget: number = 0;
  @Input() qualityScore: number = 0;
}