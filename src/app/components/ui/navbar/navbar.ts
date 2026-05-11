import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

export interface NavItem {
  label: string;
  icon: string;
  value: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() activeTab: string = '';
  @Input() navItems: NavItem[] = [];
  @Input() title: string = 'GECIT Admin';
  @Output() tabChange = new EventEmitter<string>();

  currentUser = this.authService.currentUser;

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
