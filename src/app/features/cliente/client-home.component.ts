import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { PageResponse, Producto } from '../../core/models/api.models';
import { ProductImageComponent } from '../../shared/components/product-image/product-image.component';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, ProductImageComponent],
  templateUrl: './client-home.component.html',
})
export class ClientHomeComponent {
  private readonly api = inject(ApiService);
  readonly productos = signal<Producto[]>([]);
  readonly page = signal<PageResponse<Producto> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly query = signal('');
  readonly pageSize = 20;
  currentPage = 0;
  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          this.loading.set(true);
          return this.api.list<Producto>('productos/catalogo', this.currentPage, this.pageSize, { q: query });
        }),
      )
      .subscribe({
        next: (page) => {
          this.page.set(page);
          this.productos.set(page.content);
          this.error.set('');
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el catálogo.');
          this.loading.set(false);
        },
      });

    this.load('');
  }

  onSearch(value: string) {
    const query = value.trim();
    this.query.set(query);
    this.currentPage = 0;
    this.search$.next(query);
  }

  previous() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.load(this.query());
    }
  }

  next() {
    if (this.page() && !this.page()!.last) {
      this.currentPage++;
      this.load(this.query());
    }
  }

  private load(query: string) {
    this.loading.set(true);
    this.api.list<Producto>('productos/catalogo', this.currentPage, this.pageSize, { q: query }).subscribe({
      next: (page) => {
        this.page.set(page);
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
