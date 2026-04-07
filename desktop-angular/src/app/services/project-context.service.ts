import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectContextService {
  private projectIdSource = new BehaviorSubject<number | null>(this.getStoredProjectId());
  currentProjectId$ = this.projectIdSource.asObservable();

  private previousUrlSource = new BehaviorSubject<string | null>(null);
  previousUrl$ = this.previousUrlSource.asObservable();

  private fromProjectSource = new BehaviorSubject<boolean>(false);
  fromProject$ = this.fromProjectSource.asObservable();

  private readonly PROJECT_ID_KEY = 'lastProjectId';

  constructor() {}

  private getStoredProjectId(): number | null {
    const stored = localStorage.getItem(this.PROJECT_ID_KEY);
    return stored ? parseInt(stored, 10) : null;
  }

  setProjectId(id: number | null): void {
    this.projectIdSource.next(id);
    if (id) {
      localStorage.setItem(this.PROJECT_ID_KEY, id.toString());
    } else {
      localStorage.removeItem(this.PROJECT_ID_KEY);
    }
  }

  getProjectId(): number | null {
    return this.projectIdSource.getValue();
  }

  setPreviousUrl(url: string | null): void {
    this.previousUrlSource.next(url);
  }

  getPreviousUrl(): string | null {
    return this.previousUrlSource.getValue();
  }

  setFromProject(fromProject: boolean): void {
    this.fromProjectSource.next(fromProject);
  }

  isFromProject(): boolean {
    return this.fromProjectSource.getValue();
  }

  clearContext(): void {
    this.previousUrlSource.next(null);
    this.fromProjectSource.next(false);
  }
}
