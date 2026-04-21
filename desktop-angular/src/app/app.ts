import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from './services/api.service';
import { UpdateService } from './services/update.service';
import { UpdateDialogComponent } from './components/update-dialog/update-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('desktop-angular');
  private apiService = inject(ApiService);
  private updateService = inject(UpdateService);
  private dialog = inject(MatDialog);

  async ngOnInit(): Promise<void> {
    const currentVersion = await this.apiService.getVersion();
    const updateInfo = await this.updateService.checkForUpdate(currentVersion);
    
    if (updateInfo) {
      this.dialog.open(UpdateDialogComponent, {
        width: '400px',
        data: {
          currentVersion: currentVersion,
          newVersion: updateInfo.version
        }
      });
    }
  }
}
