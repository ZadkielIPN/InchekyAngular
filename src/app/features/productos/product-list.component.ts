import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from './product.service';
import { PageResponse, Producto } from '../../core/models/api.models';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingComponent],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent {
  private readonly service = inject(ProductService);
  readonly data = signal<PageResponse<Producto> | null>(null);
  readonly loading = signal(true);
  query = '';
  page = 0;
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.service
      .list(this.page, this.query)
      .subscribe({
        next: (value) => this.data.set(value),
        complete: () => this.loading.set(false),
      });
  }
  search() {
    this.page = 0;
    this.load();
  }
  remove(id: number) {
    if (confirm('¿Eliminar producto?')) this.service.delete(id).subscribe(() => this.load());
  }
  next() {
    if (!this.data()?.last) {
      this.page++;
      this.load();
    }
  }
  previous() {
    if (this.page) {
      this.page--;
      this.load();
    }
  }
}
