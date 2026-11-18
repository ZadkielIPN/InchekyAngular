import { environment } from '../../../environments/environment';

export const PRODUCT_PLACEHOLDER = '/images/product-placeholder.svg';

export function productImageUrl(imagen?: string | null): string {
  if (!imagen) return PRODUCT_PLACEHOLDER;
  if (/^https?:\/\//i.test(imagen)) return imagen;
  const origin = new URL(environment.apiUrl, window.location.origin).origin;
  return `${origin}/uploads/productos/${imagen}`;
}
