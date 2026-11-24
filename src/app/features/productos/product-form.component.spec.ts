import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProductService } from './product.service';
import { ProductFormComponent } from './product-form.component';

describe('ProductFormComponent', () => {
  const productServiceStub = {
    get: vi.fn(() => of({})),
    update: vi.fn(() => of({})),
    create: vi.fn(() => of({})),
  };
  const routerStub = { navigate: vi.fn(() => Promise.resolve(true)) };

  beforeEach(async () => {
    productServiceStub.get.mockClear();
    productServiceStub.update.mockClear();

    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '42' } } },
        },
        { provide: Router, useValue: routerStub },
        { provide: ProductService, useValue: productServiceStub },
      ],
    }).compileComponents();
  });

  it('sends the selected image file when updating a product', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const component = fixture.componentInstance;
    const file = new File(['image'], 'actualizada.jpg', { type: 'image/jpeg' });
    component.form.patchValue({
      nombre: 'Producto',
      descripcion: 'Descripción',
      codigoBarras: '12345',
    });
    component.selectFile({ target: { files: [file] } } as unknown as Event);

    component.save();

    expect(productServiceStub.update).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ nombre: 'Producto' }),
      file,
    );
  });
});
