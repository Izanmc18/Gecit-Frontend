import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { NavbarComponent, NavItem } from '../ui/navbar/navbar';
import { FooterComponent } from '../footer/footer';
import { Cita, EstadoCita } from '../../models/appointment.model';
import { AppointmentDetailComponent } from '../ui/appointment-detail/appointment-detail';
import { ModalConfirmationComponent } from '../ui/modal-confirmation/modal-confirmation';

@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  imports: [CommonModule, DatePipe, NavbarComponent, FooterComponent, AppointmentDetailComponent, ModalConfirmationComponent],
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

  // Calendar State
  currentMonthDate = signal<Date>(new Date());
  selectedAppointment = signal<Cita | null>(null);
  showDetailModal = signal<boolean>(false);

  navItems: NavItem[] = [
    { label: 'Mis citas', icon: 'bi bi-calendar-check', value: 'dashboard' },
    { label: 'Calendario', icon: 'bi bi-calendar3', value: 'calendario' },
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

  miniCalendarDays = computed(() => {
    const date = this.currentMonthDate();
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const days = [];
    let firstDayIndex = startOfMonth.getDay(); 
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
    
    const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ 
        date: new Date(date.getFullYear(), date.getMonth() - 1, prevMonthLastDay - i),
        isCurrentMonth: false 
      });
    }
    
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push({ 
        date: new Date(date.getFullYear(), date.getMonth(), i),
        isCurrentMonth: true 
      });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ 
        date: new Date(date.getFullYear(), date.getMonth() + 1, i),
        isCurrentMonth: false 
      });
    }
    
    return days;
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
        this.showDetailModal.set(false);
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
  }

  nextMonth() {
    const d = new Date(this.currentMonthDate());
    d.setMonth(d.getMonth() + 1);
    this.currentMonthDate.set(d);
  }

  prevMonth() {
    const d = new Date(this.currentMonthDate());
    d.setMonth(d.getMonth() - 1);
    this.currentMonthDate.set(d);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  getAppointmentsForDay(date: Date): Cita[] {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return this.allCitas().filter(cita => cita.fechaHora.startsWith(dateStr));
  }

  getAppointmentColorClass(cita: Cita): string {
    switch (cita.estado) {
      case EstadoCita.PENDIENTE: return 'event-pendiente'; 
      case EstadoCita.REALIZADA: return 'event-realizada'; 
      case EstadoCita.CANCELADA: return 'event-cancelada';
      default: return 'event-general'; 
    }
  }

  openDetailModal(cita: Cita) {
    this.selectedAppointment.set(cita);
    this.showDetailModal.set(true);
  }

  get userName(): string {
    const u = this.currentUser();
    return u ? u.nombre : '';
  }
}
