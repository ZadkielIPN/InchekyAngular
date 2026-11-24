import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent NFC mode', () => {
  const authStub = {
    loading: () => false,
    login: vi.fn(() => of({ id: 1, nombre: 'Ana', apellido: 'Lopez', email: 'ana@example.com', rol: 'CAJERO' })),
    loginNfc: vi.fn(() => of({ id: 1, nombre: 'Ana', apellido: 'Lopez', email: 'ana@example.com', rol: 'CAJERO' })),
    getLoginErrorMessage: vi.fn(() => 'No se encontró la tarjeta.'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
      ],
    }).compileComponents();
  });

  it('keeps NFC capture disabled until the NFC link is selected', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input[name="nfcUid"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Iniciar sesión con tarjeta NFC');

    const nfcLink = fixture.nativeElement.querySelector('button.btn-link') as HTMLButtonElement;
    nfcLink.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('input[name="nfcUid"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Acerca la tarjeta al lector');
    expect(fixture.nativeElement.textContent).toContain('Usar correo y contraseña');
  });

  it('restores manual login mode when NFC is disabled', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.enableNfcLogin();
    component.nfcUid.set('0011522182');
    component.disableNfcLogin();

    expect(component.nfcMode()).toBe(false);
    expect(component.nfcUid()).toBe('');
  });

  it('does not steal focus from the manual login fields on initialization', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const emailInput = fixture.nativeElement.querySelector('#email') as HTMLInputElement;
    emailInput.focus();

    expect(document.activeElement).toBe(emailInput);
  });
});
