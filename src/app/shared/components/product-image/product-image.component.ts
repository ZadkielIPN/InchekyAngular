import { Component, computed, input, signal } from '@angular/core';
import { PRODUCT_PLACEHOLDER, productImageUrl } from '../../../core/utils/product-image';

@Component({
  selector: 'app-product-image',
  standalone: true,
  template: `<img
    [src]="src()"
    [alt]="alt()"
    [class.is-placeholder]="isPlaceholder()"
    referrerpolicy="no-referrer"
    loading="lazy"
    (error)="onError()"
  />`,
  styles: `
    :host {
      display: block;
      height: var(--product-image-height, 200px);
      background: #fff;
      overflow: hidden;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 0.5rem;
    }
    img.is-placeholder {
      object-fit: cover;
      padding: 0;
      background: #eef5f1;
    }
  `,
})
export class ProductImageComponent {
  /** Nombre de archivo (uploads/productos) o enlace completo; vacío = placeholder. */
  readonly imagen = input<string | null | undefined>(null);
  /** URL directa (p. ej. vista previa de un archivo recién elegido); tiene prioridad. */
  readonly preview = input<string | null>(null);
  readonly alt = input('');

  private readonly failedUrl = signal<string | null>(null);
  private readonly wanted = computed(() => this.preview() ?? productImageUrl(this.imagen()));
  readonly src = computed(() => (this.failedUrl() === this.wanted() ? PRODUCT_PLACEHOLDER : this.wanted()));
  readonly isPlaceholder = computed(() => this.src() === PRODUCT_PLACEHOLDER);

  onError() {
    if (!this.isPlaceholder()) this.failedUrl.set(this.wanted());
  }
}
