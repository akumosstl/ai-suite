import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Componente raiz da aplicação AI Suite.
 * Responsável por renderizar o layout principal e gerenciar o título da aplicação.
 *
 * @component
 * @description Componente principal que serve como container para todas as rotas da aplicação.
 * Utiliza RouterOutlet para renderizar os componentes de acordo com a rota ativa.
 *
 * @selector app-root
 * @templateUrl ./app.html
 * @styleUrl ./app.scss
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /**
   * Título da aplicação usado para display.
   * Utiliza signal para reatividade com Angular Signals.
   */
  /**
 * Título da aplicação usado para display.
 * Utiliza signal para reatividade com Angular Signals.
 */
protected readonly title = signal('desktop-angular');
}
