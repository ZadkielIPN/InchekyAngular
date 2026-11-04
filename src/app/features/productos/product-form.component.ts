import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from './product.service';
import { UnidadMedida } from '../../core/models/api.models';

@Component({ selector: 'app-product-form', standalone: true, imports: [ReactiveFormsModule, RouterLink], templateUrl: './product-form.component.html' })
export class ProductFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProductService);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly error = signal('');
  file?: File;
  readonly units: UnidadMedida[] = ['PIEZA', 'KILOGRAMO', 'LITRO', 'METRO'];
  readonly form = this.fb.nonNullable.group({ nombre: ['', Validators.required], descripcion: ['', Validators.required], precio: [0, [Validators.required, Validators.min(0)]], stock: [0, [Validators.required, Validators.min(0)]], peso: [0, Validators.min(0)], valoracion: [0, Validators.min(0)], activo: [true], codigoBarras: ['', Validators.required], unidadMedida: ['PIEZA' as UnidadMedida, Validators.required], fechaCaducidad: [''], imagen: [''] });
  constructor() { if (this.id) this.service.get(this.id).subscribe(value => this.form.patchValue(value)); }
  selectFile(event: Event) { const input = event.target as HTMLInputElement; this.file = input.files?.[0]; }
  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const request = this.id ? this.service.update(this.id, value) : this.service.create(value, this.file);
    request.subscribe({ next: () => void this.router.navigate(['/productos']), error: error => this.error.set(error.error?.message ?? 'No se pudo guardar.') });
  }
}
