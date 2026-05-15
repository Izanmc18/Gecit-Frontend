import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { NavbarComponent, NavItem } from '../ui/navbar/navbar';
import { Footer } from '../footer/footer';
import { Cita } from '../../models/appointment.model';

@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  imports: [CommonModule, DatePipe, NavbarComponent, Footer],
  templateUrl: './dashboard-client.html',
  styleUrls: ['./dashboard-client.css']
})
export class DashboardClient implements OnInit {
  protected authService = inject(AuthService);
  protected router = inject(Router);
  private appointmentService = inject(AppointmentService);

  currentUser = this.authService.currentUser;

  allCitas = signal<Cita[]>([]);
  isLoading = signal(true);
  cancellingId = signal<string | null>(null);
  showConfirm = signal(false);
  citaToCancel = signal<Cita | null>(null);
  activeTab = signal('dashboard');
  isSideMenuOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Mis citas', icon: 'bi bi-calendar-check', value: 'dashboard' },
    { label: 'Historial', icon: 'bi bi-clock-history', value: 'historial' },
  ];

  futureCitas = computed(() => {
    const now = new Date();
    return this.allCitas().filter(c => new Date(c.fechaHora) >= now);
  });

  pastCitas = computed(() => {
    const now = new Date();
    return this.allCitas().filter(c => new Date(c.fechaHora) < now);
  });

  ngOnInit() {
    this.loadCitas();
  }

  loadCitas() {
    this.isLoading.set(true);
    this.appointmentService.getMyAppointments().subscribe({
      next: (citas) => {
        this.allCitas.set(citas);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  confirmCancel(cita: Cita) {
    this.citaToCancel.set(cita);
    this.showConfirm.set(true);
  }

  doCancel() {
    const cita = this.citaToCancel();
    if (!cita) return;
    this.cancellingId.set(cita.id);
    this.showConfirm.set(false);
    this.appointmentService.cancelMyAppointment(cita.id).subscribe({
      next: () => {
        this.allCitas.update(list => list.filter(c => c.id !== cita.id));
        this.cancellingId.set(null);
        this.citaToCancel.set(null);
      },
      error: () => {
        this.cancellingId.set(null);
      }
    });
  }

  cancelConfirm() {
    this.showConfirm.set(false);
    this.citaToCancel.set(null);
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
    this.isSideMenuOpen.set(false);
  }

  toggleSideMenu() {
    this.isSideMenuOpen.update(v => !v);
  }

  goToBooking() {
    this.router.navigate(['/booking']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get userName(): string {
    const u = this.currentUser();
    return u ? u.nombre : '';
  }
}
