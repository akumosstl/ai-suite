import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'

export interface UpdateInfo {
  version: string
}

interface SoftwareJson {
  software: {
    name: string
    version: string
    releaseDate: string
  }
}

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  private http = inject(HttpClient)
  private updateUrl = 'https://raw.githubusercontent.com/akumosstl/akumosstl.github.io/main/update.json'

  async checkForUpdate(currentVersion: string): Promise<UpdateInfo | null> {
    try {
      const response = await firstValueFrom(this.http.get<SoftwareJson>(this.updateUrl))
      const onlineVersion = response?.software?.version
      if (onlineVersion && onlineVersion !== currentVersion) {
        return { version: onlineVersion }
      }
      return null
    } catch (error) {
      console.error('Failed to check for updates:', error)
      return null
    }
  }
}