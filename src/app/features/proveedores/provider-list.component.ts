import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProviderService } from './provider.service';
import { Proveedor, PageResponse } from '../../core/models/api.models';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [RouterLink, LoadingComponent],
  templateUrl: './provider-list.component.html',
})
export class ProviderListComponent {
  private readonly service = inject(ProviderService);
  readonly data = signal<PageResponse<Proveedor> | null>(null);
  readonly loading = signal(true);
  page = 0;
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.service
      .list(this.page)
      .subscribe({
        next: (value) => this.data.set(value),
        complete: () => this.loading.set(false),
      });
  }
  remove(id: number) {
    if (confirm('¿Eliminar proveedor?')) this.service.delete(id).subscribe(() => this.load());
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
