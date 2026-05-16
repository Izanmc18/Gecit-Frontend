import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

export interface NavItem {
  label: string;
  icon: string;
  value: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() activeTab: string = '';
  @Input() navItems: NavItem[] = [];
  @Input() title: string = 'GECIT Admin';
  @Input() showHomeButton: boolean = false;
  @Output() tabChange = new EventEmitter<string>();

  isMenuOpen = signal(false);

  currentUser = this.authService.currentUser;

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  get userRoleName(): string {
    const roleId = this.currentUser()?.idRol;
    if (roleId === 'e51b3a32-0000-4a3b-9a99-b1d5c7f8a120') return 'Super Admin';
    if (roleId === 'e51b3a32-1111-4a3b-9a99-b1d5c7f8a121') return 'Admin';
    if (roleId === 'e51b3a32-2222-4a3b-9a99-b1d5c7f8a122') return 'Empleado';
    return 'Cliente';
  }

  onTabClick(value: string) {
    this.tabChange.emit(value);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
