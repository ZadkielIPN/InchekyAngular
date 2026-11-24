import { describe, expect, it } from 'vitest';
import type { Venta } from '../models/api.models';
import { createTicketPrintDocument } from './ticket-print-document';

const venta: Venta = {
  id: 42,
  fecha: '2026-11-22T12:30:00',
  cajeroId: 7,
  cajeroNombre: '7 - Ana',
  clienteNombre: 'Cliente',
  detalles: [
    {
      productoId: 5,
      productoNombre: 'Producto de prueba',
      cantidad: 2,
      precioUnitario: 25,
      subtotal: 50,
    },
  ],
  subtotal: 50,
  total: 45,
  descuentoPromociones: 5,
  puntosUtilizados: 0,
  puntosGanados: 4,
  metodoPago: 'EFECTIVO',
};

describe('createTicketPrintDocument', () => {
  it('fits the ticket and monetary rows within a 44 mm area on a 58 mm POS page', () => {
    const document = createTicketPrintDocument(venta, 'https://incheky.example/images/logo.png');

    expect(document).toContain('@page { size: 58mm auto; margin: 0; }');
    expect(document).toContain('html, body { width: 58mm; background: white; }');
    expect(document).toContain('.ticket { width: 44mm; margin: 0 auto; padding: 1.5mm; transform: translateX(-5mm); }');
    expect(document).toContain('grid-template-columns: minmax(0, 1fr) max-content; column-gap: 2mm;');
    expect(document).toContain('white-space: nowrap;');
    expect(document).toContain('<img class="ticket-logo" src="https://incheky.example/images/logo.png" alt="Incheky">');
    expect(document).toContain('.ticket-logo { filter: grayscale(1) contrast(1.8); }');
    expect(document).toContain('<strong>$45.00</strong>');
    expect(document).toContain('Ticket de venta #42');
    expect(document).toContain('Producto de prueba');
    expect(document).toContain('Puntos ganados: 4');
  });

  it('escapes user-provided text before adding it to the printable document', () => {
    const document = createTicketPrintDocument({
      ...venta,
      clienteNombre: '<img src=x onerror=alert(1)>',
      detalles: [
        {
          ...venta.detalles[0],
          productoNombre: '<script>alert(1)</script>',
        },
      ],
    }, 'https://incheky.example/images/logo.png');

    expect(document).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(document).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(document).not.toContain('<img src=x');
    expect(document).not.toContain('<script>alert(1)</script>');
  });

  it('escapes the logo URL before adding it to the printable document', () => {
    const document = createTicketPrintDocument(venta, 'https://incheky.example/logo.png?x="');

    expect(document).toContain('src="https://incheky.example/logo.png?x=&quot;"');
  });
});
