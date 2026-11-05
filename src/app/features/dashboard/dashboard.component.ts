import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ClientHomeComponent } from '../cliente/client-home.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ClientHomeComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
}
