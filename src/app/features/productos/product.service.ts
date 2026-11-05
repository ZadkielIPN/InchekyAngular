import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Producto, PageResponse } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);
  list(page = 0, q = '') {
    return this.api.list<Producto>('productos', page, 10, { q });
  }
  get(id: number) {
    return this.api.get<Producto>(`productos/${id}`);
  }
  create(value: Record<string, unknown>, file?: File) {
    const body = new FormData();
    body.append('producto', new Blob([JSON.stringify(value)], { type: 'application/json' }));
    if (file) body.append('file', file);
    return this.api.post<Producto>('productos', body);
  }
  update(id: number, value: Record<string, unknown>) {
    return this.api.put<Producto>(`productos/${id}`, value);
  }
  delete(id: number) {
    return this.api.delete(`productos/${id}`);
  }
}
