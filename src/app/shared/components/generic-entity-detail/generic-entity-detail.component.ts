import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, from, map, mergeMap, of, toArray } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { TicketService } from '../../../core/services/ticket.service';
import { LoadingComponent } from '../loading/loading.component';

type Rec = Record<string, any>;
type DetailType = 'text' | 'money' | 'date' | 'datetime' | 'bool' | 'number';

interface DetailField {
  label: string;
  key?: string;
  type?: DetailType;
  value?: (record: Rec) => unknown;
}

interface EntityDetailConfig {
  label: string;
  editable: boolean;
  titleOf: (record: Rec) => string;
  fields: DetailField[];
}

const fullName = (record: Rec) => `${record['nombre'] ?? ''} ${record['apellido'] ?? ''}`.trim();
const LEVEL_DISCOUNT: Record<string, string> = { BRONCE: '0%', PLATA: '5%', ORO: '10%' };

const DETAIL_CONFIG: Record<string, EntityDetailConfig> = {
  productos: {
    label: 'Producto',
    editable: true,
    titleOf: (r) => r['nombre'],
    fields: [
      { label: 'Descripción', key: 'descripcion' },
      { label: 'Peso', key: 'peso', type: 'number' },
      { label: 'Fecha de caducidad', key: 'fechaCaducidad', type: 'date' },
    ],
  },
  proveedores: {
    label: 'Proveedor',
    editable: true,
    titleOf: (r) => r['nombre'],
    fields: [
      { label: 'Teléfono', key: 'telefono' },
      { label: 'Correo', key: 'email' },
      { label: 'Dirección', key: 'direccion' },
      { label: 'Activo', key: 'activo', type: 'bool' },
    ],
  },
  clientes: {
    label: 'Cliente',
    editable: true,
    titleOf: fullName,
    fields: [
      { label: 'Rol', key: 'rol' },
      { label: 'Descuento por nivel', value: (r) => LEVEL_DISCOUNT[r['nivelLealtad']] },
      { label: 'Valor de sus puntos', value: (r) => (r['puntos'] ?? 0) * 0.5, type: 'money' },
    ],
  },
  cajeros: {
    label: 'Cajero',
    editable: true,
    titleOf: fullName,
    fields: [
      { label: 'Rol', key: 'rol' },
      { label: 'Correo', key: 'email' },
      { label: 'Número de empleado', key: 'numeroEmpleado' },
      { label: 'Turno', key: 'turno' },
      { label: 'Caja asignada', key: 'cajaAsignada' },
    ],
  },
  administradores: {
    label: 'Administrador',
    editable: true,
    titleOf: fullName,
    fields: [
      { label: 'Rol', key: 'rol' },
      { label: 'Correo', key: 'email' },
      { label: 'Número de administrador', key: 'numeroAdministrador' },
    ],
  },
  usuarios: {
    label: 'Usuario',
    editable: false,
    titleOf: fullName,
    fields: [
      { label: 'Rol', key: 'rol' },
      { label: 'Correo', key: 'email' },
    ],
  },
  promociones: {
    label: 'Promoción',
    editable: true,
    titleOf: (r) => r['nombre'],
    fields: [],
  },
  ventas: {
    label: 'Venta',
    editable: false,
    titleOf: (r) => `Venta #${r['id']}`,
    fields: [
      { label: 'Subtotal', key: 'subtotal', type: 'money' },
      { label: 'Descuento por promociones', key: 'descuentoPromociones', type: 'money' },
      { label: 'Descuento por nivel de lealtad', key: 'descuentoNivel', type: 'money' },
      { label: 'Descuento por puntos', key: 'descuentoPuntos', type: 'money' },
      { label: 'Puntos utilizados', key: 'puntosUtilizados', type: 'number' },
      { label: 'Efectivo recibido', key: 'efectivoRecibido', type: 'money' },
      { label: 'Cambio entregado', key: 'cambio', type: 'money' },
    ],
  },
  abastecimientos: {
    label: 'Abastecimiento',
    editable: false,
    titleOf: (r) => `Abastecimiento #${r['id']}`,
    fields: [],
  },
};

@Component({
  selector: 'app-generic-entity-detail',
  standalone: true,
  imports: [RouterLink, LoadingComponent, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './generic-entity-detail.component.html',
})
export class GenericEntityDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly tickets = inject(TicketService);

  readonly endpoint = this.route.snapshot.data['endpoint'] as string;
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly config = DETAIL_CONFIG[this.endpoint];
  readonly canEdit = this.config.editable && this.auth.hasRole('ADMINISTRADOR');

  readonly record = signal<Rec | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly names = signal<Record<number, string>>({});
  readonly downloading = signal(false);
  readonly ticketError = signal('');

  readonly heading = computed(() => {
    const record = this.record();
    return record ? this.config.titleOf(record) : this.config.label;
  });

  readonly rows = computed(() => {
    const record = this.record();
    if (!record) return [];
    return this.config.fields
      .map((field) => ({
        label: field.label,
        type: field.type ?? 'text',
        value: field.value ? field.value(record) : record[field.key ?? ''],
      }))
      .filter((row) => row.value !== null && row.value !== undefined && row.value !== '');
  });

  readonly imageUrl = computed(() => {
    const imagen = this.record()?.['imagen'] as string | undefined;
    if (!imagen) return null;
    if (/^https?:\/\//.test(imagen)) return imagen;
    return `${new URL(environment.apiUrl, window.location.origin).origin}/uploads/productos/${imagen}`;
  });

  constructor() {
    this.load();
  }

  name(id: number) {
    return this.names()[id] ?? `#${id}`;
  }

  downloadTicket() {
    this.ticketError.set('');
    this.downloading.set(true);
    this.tickets.downloadPdf(this.id).subscribe({
      next: () => this.downloading.set(false),
      error: (error) => {
        this.downloading.set(false);
        this.ticketError.set(this.tickets.errorMessage(error, 'No se pudo descargar el ticket.'));
      },
    });
  }

  private load() {
    this.api.get<Rec>(`${this.endpoint}/${this.id}`).subscribe({
      next: (record) => {
        this.record.set(record);
        this.loading.set(false);
        this.resolveNames(record);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(
          error.status === 404
            ? 'No se encontró el registro.'
            : error.status === 403
              ? 'No tienes permiso para ver este registro.'
              : 'No se pudo cargar la información.',
        );
      },
    });
  }

  private resolveNames(record: Rec) {
    let source: string | null = null;
    let ids: number[] = [];
    if (this.endpoint === 'promociones') {
      source = 'productos';
      ids = record['productoIds'] ?? [];
    } else if (this.endpoint === 'productos') {
      source = 'promociones';
      ids = record['promocionIds'] ?? [];
    } else if (this.endpoint === 'abastecimientos') {
      source = 'productos';
      ids = (record['detalles'] ?? []).map((detalle: Rec) => detalle['productoId']);
    }
    const unique = [...new Set(ids)];
    if (!source || !unique.length) return;

    from(unique)
      .pipe(
        mergeMap(
          (id) =>
            this.api.get<Rec>(`${source}/${id}`).pipe(
              map((item) => [id, item['nombre'] as string] as const),
              catchError(() => of([id, `#${id}`] as const)),
            ),
          6,
        ),
        toArray(),
      )
      .subscribe((entries) => this.names.set(Object.fromEntries(entries)));
  }
}
