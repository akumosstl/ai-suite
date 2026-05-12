import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { PluginsModalComponent } from './plugins-modal.component';
import { ApiService } from '../../../services/api.service';

describe('PluginsModalComponent', () => {
  let component: PluginsModalComponent;
  let fixture: ComponentFixture<PluginsModalComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getPluginRegistry']);

    await TestBed.configureTestingModule({
      imports: [PluginsModalComponent, NoopAnimationsModule],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: MatDialogRef, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PluginsModalComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load plugins on init', () => {
    const mockPlugins = {
      plugins: [
        { name: 'test-plugin', version: '1.0.0', namespace: 'com.test', documentationUrl: 'http://test.com', download: '', type: 'flow' }
      ]
    };

    apiServiceSpy.getPluginRegistry.and.returnValue(of(mockPlugins));

    component.ngOnInit();

    expect(apiServiceSpy.getPluginRegistry).toHaveBeenCalled();
    expect(component.plugins.length).toBe(1);
    expect(component.plugins[0].name).toBe('test-plugin');
    expect(component.plugins[0].type).toBe('flow');
    expect(component.availableTypes).toEqual(['flow']);
  });

it('should handle pagination correctly', () => {
    component.plugins = Array(25).fill(null).map((_, i) => ({
      name: `plugin-${i}`, version: '1.0.0', namespace: 'com.test', documentationUrl: 'http://test.com', download: '', type: 'flow'
    }));

    component.pageIndex = 0;
    component.updatePaginatedPlugins();
    expect(component.paginatedPlugins.length).toBe(10);

    component.pageIndex = 1;
    component.updatePaginatedPlugins();
    expect(component.paginatedPlugins.length).toBe(10);

    component.pageIndex = 2;
    component.updatePaginatedPlugins();
    expect(component.paginatedPlugins.length).toBe(5);
  });

it('should select plugin on selectPlugin', () => {
    const plugin = {
      name: 'test-plugin', version: '1.0.0', namespace: 'com.test', documentationUrl: 'http://test.com', download: '', type: 'flow'
    };

    component.selectPlugin(plugin);
    expect(component.selectedPlugin).toBe(plugin);
  });

  it('should close dialog on onCancel', () => {
    const closeSpy = spyOn(component['dialogRef'], 'close');
    component.onCancel();
    expect(closeSpy).toHaveBeenCalled();
  });
});
