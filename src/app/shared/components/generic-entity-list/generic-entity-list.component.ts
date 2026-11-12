import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { LoadingComponent } from '../loading/loading.component';
import { PageResponse } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-generic-entity-list',
  standalone: true,
  imports: [RouterLink, LoadingComponent, FormsModule],
  templateUrl: './generic-entity-list.component.html',
})
export class GenericEntityListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly title = this.route.snapshot.data['title'] as string;
  readonly endpoint = this.route.snapshot.data['endpoint'] as string;
  readonly columns = this.route.snapshot.data['columns'] as string[];
  readonly canCreate = this.route.snapshot.data['canCreate'] !== false
    && (this.endpoint !== 'promociones' || this.auth.hasRole('ADMINISTRADOR'));
  readonly canEdit = this.route.snapshot.data['canEdit'] !== false
    && (this.endpoint !== 'promociones' || this.auth.hasRole('ADMINISTRADOR'));
  readonly canDelete = this.route.snapshot.data['canDelete'] !== false
    && (this.endpoint !== 'promociones' || this.auth.hasRole('ADMINISTRADOR'));
  readonly page = signal<PageResponse<Record<string, unknown>> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  currentPage = 0;
  query = '';

  displayColumn(column: string) {
    const labels: Record<string, string> = {
      cajeroNombre: 'Cajero',
      clienteNombre: 'Cliente',
      proveedorNombre: 'Proveedor',
      descuento: 'Descuentos',
      puntosGanados: 'Puntos ganados',
    };
    if (labels[column]) return labels[column];

    return column
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (value) => value.toUpperCase());
  }

  displayValue(item: Record<string, unknown>, column: string) {
    const value = item[column];
    if (value !== undefined && value !== null && value !== '') return value;

    const idColumn = column.replace(/Nombre$/, 'Id');
    return item[idColumn] ?? '';
  }

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.list<Record<string, unknown>>(this.endpoint, this.currentPage, 10, { q: this.query }).subscribe({
      next: (value) => this.page.set(value),
      error: () => this.error.set('No se pudo cargar la información.'),
      complete: () => this.loading.set(false),
    });
  }

  search() {
    this.currentPage = 0;
    this.load();
  }

  remove(id: unknown) {
    if (!confirm('¿Deseas eliminar este registro?')) return;
    this.api.delete(`${this.endpoint}/${id}`).subscribe({ next: () => this.load() });
  }

  next() {
    if (this.page() && !this.page()!.last) {
      this.currentPage++;
      this.load();
    }
  }

  previous() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.load();
    }
  }
}
