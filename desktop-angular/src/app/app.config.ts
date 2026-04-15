import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

/**
 * Configuração global da aplicação Angular.
 * 
 * @description
 * Define os provedores necessários para o funcionamento da aplicação:
 * - provideBrowserGlobalErrorListeners: Tratamento global de erros no navegador
 * - provideRouter: Sistema de rotas da aplicação
 * - provideClientHydration: Hidratação client-side para SSR
 * - provideHttpClient: Cliente HTTP para requisições à API
 * 
 * @constant appConfig
 * @type {ApplicationConfig}
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient()
  ]
};
