import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-panel-toggle',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <button 
      class="panel-toggle-btn"
      [class.collapsed]="isCollapsed"
      [matTooltip]="isCollapsed ? 'Show panel' : 'Hide panel'"
      matTooltipPosition="right"
      (click)="toggle.emit()">
      <mat-icon class="toggle-icon">{{ isCollapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
    </button>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 100%;
      flex-shrink: 0;
      background: transparent;
      position: relative;
      z-index: 10;
    }

    .panel-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 56px;
      border: none;
      border-radius: 0 8px 8px 0;
      background: linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%);
      color: #b0b0b0;
      cursor: pointer;
      transition: all 0.08s ease-out;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
      padding: 0;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
    }

    .panel-toggle-btn:hover {
      background: linear-gradient(135deg, #3a3a3a 0%, #4a4a4a 100%);
      color: #ffffff;
      width: 28px;
      box-shadow: 4px 0 12px rgba(0, 0, 0, 0.4);
    }

    .toggle-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      transition: transform 0.08s ease-out;
    }

    .panel-toggle-btn:hover .toggle-icon {
      transform: scale(1.1);
    }
  `]
})
export class PanelToggleComponent {
  @Input() isCollapsed = false;
  @Output() toggle = new EventEmitter<void>();
}
