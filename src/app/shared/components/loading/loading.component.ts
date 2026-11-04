import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `<div class="loading">{{ message() }}</div>`,
  styles: [`.loading{padding:2rem;text-align:center;color:#64748b}`],
})
export class LoadingComponent {
  readonly message = input('Cargando...');
}
