import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LoadingComponent } from '../loading/loading.component';
import { PageResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-generic-entity-list',
  standalone: true,
  imports: [RouterLink, LoadingComponent],
  templateUrl: './generic-entity-list.component.html',
})
export class GenericEntityListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  readonly title = this.route.snapshot.data['title'] as string;
  readonly endpoint = this.route.snapshot.data['endpoint'] as string;
  readonly columns = this.route.snapshot.data['columns'] as string[];
  readonly canCreate = this.route.snapshot.data['canCreate'] !== false;
  readonly canEdit = this.route.snapshot.data['canEdit'] !== false;
  readonly page = signal<PageResponse<Record<string, unknown>> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  currentPage = 0;

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.list<Record<string, unknown>>(this.endpoint, this.currentPage).subscribe({
      next: (value) => this.page.set(value),
      error: () => this.error.set('No se pudo cargar la información.'),
      complete: () => this.loading.set(false),
    });
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
