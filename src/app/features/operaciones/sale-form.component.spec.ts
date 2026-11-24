import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { OperationService } from './operation.service';
import { SaleFormComponent } from './sale-form.component';

describe('SaleFormComponent NFC cashier selection', () => {
  const cashier = {
    id: 8,
    nombre: 'Luis',
    apellido: 'Cajero',
    email: 'luis@example.com',
    rol: 'CAJERO' as const,
    numeroEmpleado: 1002,
    turno: 'MATUTINO' as const,
    cajaAsignada: 1,
  };
  const operations = {
    catalogProducts: vi.fn(() => of({ content: [] })),
    clients: vi.fn(() => of({ content: [] })),
    promotions: vi.fn(() => of({ content: [] })),
    cashiers: vi.fn(() => of({ content: [] })),
    cashierByNfc: vi.fn(() => of(cashier)),
  };
  const auth = {
    currentUser: () => ({ id: 1, nombre: 'Admin', apellido: 'Uno', email: 'admin@example.com', rol: 'ADMINISTRADOR' }),
    hasRole: (...roles: string[]) => roles.includes('ADMINISTRADOR'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleFormComponent],
      providers: [
        provideRouter([]),
        { provide: OperationService, useValue: operations },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
  });

  it('selects a cashier after scanning their exact UID', () => {
    const fixture = TestBed.createComponent(SaleFormComponent);
    const component = fixture.componentInstance;

    component.nfcCashierUid.set('0009580011');
    component.submitNfcCashier();

    expect(operations.cashierByNfc).toHaveBeenCalledWith('0009580011');
    expect(component.selectedCashierId()).toBe(cashier.id);
    expect(component.cashiers()).toContain(cashier);
    expect(component.nfcCashierMessage()).toContain('Luis Cajero');
  });
});
