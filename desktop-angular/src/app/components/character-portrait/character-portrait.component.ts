import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-character-portrait',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="portrait" [ngStyle]="{ 'background-image': 'url(' + imageUrl + ')' }">
    </div>
  `,
  styles: [`
    .portrait {
      width: 128px;
      height: 128px;
      background-size: cover;
      background-position: center;
      border-radius: 50%;
      border: 2px solid #ccc;
    }
  `]
})
export class CharacterPortraitComponent {
  @Input() role: string = 'developer';

  private roleImageMap: Record<string, string> = {
    'developer': 'assets/images/developer_2.png',
    'software_developer': 'assets/images/software_developer_1.png',
    'quality_assurance': 'assets/images/quality_assurance.png',
    'product_owner': 'assets/images/product_owner.png',
    'cto': 'assets/images/cto.png',
    'default': 'assets/images/developer_2.png'
  };

  get imageUrl(): string {
    return this.roleImageMap[this.role.toLowerCase()] || this.roleImageMap['default'];
  }
}