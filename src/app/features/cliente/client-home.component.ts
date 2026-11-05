import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Producto } from '../../core/models/api.models';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './client-home.component.html',
})
export class ClientHomeComponent {
  private readonly api = inject(ApiService);
  readonly productos = signal<Producto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly query = signal('');

  constructor() {
    effect(() => this.load(this.query()));
  }

  onSearch(value: string) {
    this.query.set(value);
  }

  imageUrl(producto: Producto) {
    return producto.imagen
      ? `http://localhost:8080/uploads/productos/${producto.imagen}`
      : 'assets/images/product-placeholder.svg';
  }

  private load(query: string) {
    this.loading.set(true);
    this.api.list<Producto>('productos/catalogo', 0, 24, { q: query }).subscribe({
      next: (page) => {
        this.productos.set(page.content);
        this.error.set('');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo.');
        this.loading.set(false);
      },
    });
  }
}
