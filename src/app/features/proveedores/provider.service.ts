import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Proveedor } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private readonly api = inject(ApiService);
  list(page = 0) {
    return this.api.list<Proveedor>('proveedores', page);
  }
  get(id: number) {
    return this.api.get<Proveedor>(`proveedores/${id}`);
  }
  create(value: Omit<Proveedor, 'id'>) {
    return this.api.post<Proveedor>('proveedores', value);
  }
  update(id: number, value: Omit<Proveedor, 'id'>) {
    return this.api.put<Proveedor>(`proveedores/${id}`, value);
  }
  delete(id: number) {
    return this.api.delete(`proveedores/${id}`);
  }
}
