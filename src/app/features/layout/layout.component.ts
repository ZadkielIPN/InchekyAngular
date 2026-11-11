import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgOptimizedImage],
  templateUrl: './layout.component.html',
  styleUrls: ['layout.component.css'],
})
export class LayoutComponent {
  readonly auth = inject(AuthService);

  canAccess(...roles: string[]) {
    return this.auth.hasRole(...roles);
  }
}
