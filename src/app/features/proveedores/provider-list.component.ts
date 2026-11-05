import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProviderService } from './provider.service';
import { Proveedor, PageResponse } from '../../core/models/api.models';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [RouterLink, LoadingComponent, FormsModule],
  templateUrl: './provider-list.component.html',
})
export class ProviderListComponent {
  private readonly service = inject(ProviderService);
  readonly data = signal<PageResponse<Proveedor> | null>(null);
  readonly loading = signal(true);
  page = 0;
  query = '';
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
  remove(id: number) {
    if (confirm('¿Eliminar proveedor?')) this.service.delete(id).subscribe(() => this.load());
  }
  search() {
    this.page = 0;
    this.load();
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
