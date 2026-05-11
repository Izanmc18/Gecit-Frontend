import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, NgZone, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { Cita, EstadoCita, EstadoTurno, AbsenceResponse, TipoAusencia } from '../../models';
import { LogoComponent } from '../ui/logo/logo';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbsenceService } from '../../services/absence.service';
import { BookingService } from '../../services/booking.service';
import { Tramite } from '../../models/booking.model';
import { InputField } from '../ui/input/input';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap, tap, finalize } from 'rxjs';
import { AppointmentDetailComponent } from '../ui/appointment-detail/appointment-detail';
import { NavbarComponent, NavItem } from '../ui/navbar/navbar';

@Component({
  selector: 'app-dashboard-employees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, InputField, AppointmentDetailComponent, NavbarComponent],
  templateUrl: './dashboard-employees.html',
  styleUrls: ['./dashboard-employees.css']
})
export class DashboardEmployees implements OnInit {
  private appointmentService = inject(AppointmentService);
  private absenceService = inject(AbsenceService);
  private authService = inject(AuthService);
  private bookingService = inject(BookingService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.currentUser()?.idRol === 'e51b3a32-1111-4a3b-9a99-b1d5c7f8a121');
  
  appointments = signal<Cita[]>([]);
  absences = signal<AbsenceResponse[]>([]);
  isLoading = signal<boolean>(true);
  today = signal<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`);
  activeTab = signal<string>('agenda');
  
  navItems: NavItem[] = [
    { label: 'Mi Agenda', icon: 'bi bi-journal-text', value: 'agenda' },
    { label: 'Calendario', icon: 'bi bi-calendar3', value: 'calendario' },
    { label: 'Gestión Laboral', icon: 'bi bi-person-badge', value: 'laboral' }
  ];

  calendarView = signal<'dia' | 'semana' | 'mes'>('semana');
  tipoAusencia = TipoAusencia;

  showCreateModal = signal<boolean>(false);
  isSavingAppointment = signal<boolean>(false);
  tramites = signal<Tramite[]>([]);
  availableSlots = signal<string[]>([]);
  
  selectedAppointment = signal<Cita | null>(null);
  showDetailModal = signal<boolean>(false);
  
  appointmentForm = this.fb.group({
    idTramite: ['', Validators.required],
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    clienteNombre: ['', [Validators.required, Validators.minLength(2)]],
    clienteApellidos: ['', [Validators.required, Validators.minLength(2)]],
    clienteDni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}[A-Z]$/i)]],
    clienteEmail: ['', [Validators.required, Validators.email]],
    clienteTelefono: ['', [Validators.required, Validators.pattern(/^[679][0-9]{8}$/)]],
    observaciones: ['']
  });
  
  currentMonthDate = signal<Date>(new Date());
  currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));
  selectedDate = signal<Date>(new Date());

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
  
  displayedDays = computed(() => {
    const view = this.calendarView();
    const start = this.currentWeekStart();
    const selected = this.selectedDate();
    
    if (view === 'dia') {
      return [selected];
    } else if (view === 'semana') {
      const days = [];
      for (let i = 0; i < 5; i++) { 
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
      }
      return days;
    } else {
      return this.miniCalendarDays().map(d => d.date);
    }
  });

  refreshAppointmentsTrigger = signal<number>(0);
  refreshAbsencesTrigger = signal<number>(0);

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    this.cdr.detectChanges();
  }

  nextWeek() {
    const d = new Date(this.currentWeekStart());
    d.setDate(d.getDate() + 7);
    this.currentWeekStart.set(d);
    this.cdr.detectChanges();
  }

  prevWeek() {
    const d = new Date(this.currentWeekStart());
    d.setDate(d.getDate() - 7);
    this.currentWeekStart.set(d);
    this.cdr.detectChanges();
  }

  nextMonth() {
    const d = new Date(this.currentMonthDate());
    d.setMonth(d.getMonth() + 1);
    this.currentMonthDate.set(d);
    this.cdr.detectChanges();
  }

  prevMonth() {
    const d = new Date(this.currentMonthDate());
    d.setMonth(d.getMonth() - 1);
    this.currentMonthDate.set(d);
    this.cdr.detectChanges();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isSameDay(d1: Date, d2: Date): boolean {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  }

  private dataLoader = toObservable(this.currentWeekStart).pipe(
    switchMap(start => {
      const user = this.currentUser();
      if (!user) return [];
      this.isLoading.set(true);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 4); 
      
      const fechaInicio = start.toISOString().split('T')[0];
      const fechaFin = end.toISOString().split('T')[0];

      const filters = { idUsuarioAsignado: user.id, fechaInicio, fechaFin };
      return this.appointmentService.getAppointments(filters).pipe(
        tap({
          next: (response) => {
            this.appointments.set(response.data);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        })
      );
    })
  ).subscribe();

  searchTerm = signal<string>('');
  filterBy = signal<'TODAS' | 'PENDIENTES' | 'REALIZADAS'>('TODAS');
  sortField = signal<string>('fechaHora');
  sortDirection = signal<'asc' | 'desc'>('asc');

  absenceForm = this.fb.group({
    tipo: [TipoAusencia.VACACIONES, Validators.required],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.minLength(10)]]
  });

  stats = computed(() => {
    const list = this.appointments();
    return {
      total: list.length,
      pending: list.filter(a => a.estado === EstadoCita.PENDIENTE).length,
      attended: list.filter(a => a.estado === EstadoCita.REALIZADA).length
    };
  });

  filteredAppointments = computed(() => {
    let filtered = [...this.appointments()];
    const term = this.searchTerm().toLowerCase();
    const filter = this.filterBy();
    const sField = this.sortField();
    const sDir = this.sortDirection();

    if (term) {
      filtered = filtered.filter(a => 
        a.clienteNombre.toLowerCase().includes(term) || 
        a.clienteApellidos.toLowerCase().includes(term) ||
        a.turnoLlegada?.codigoTicket.toLowerCase().includes(term)
      );
    }

    if (filter === 'PENDIENTES') {
      filtered = filtered.filter(a => a.estado === EstadoCita.PENDIENTE);
    } else if (filter === 'REALIZADAS') {
      filtered = filtered.filter(a => a.estado === EstadoCita.REALIZADA);
    }

    filtered.sort((a, b) => {
      let valA: any, valB: any;
      switch(sField) {
        case 'hora': valA = a.fechaHora; valB = b.fechaHora; break;
        case 'cliente': valA = a.clienteNombre; valB = b.clienteNombre; break;
        case 'ticket': valA = a.turnoLlegada?.codigoTicket || ''; valB = b.turnoLlegada?.codigoTicket || ''; break;
        case 'estado': valA = a.estado; valB = b.estado; break;
        default: valA = a.fechaHora; valB = b.fechaHora;
      }
      if (valA < valB) return sDir === 'asc' ? -1 : 1;
      if (valA > valB) return sDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

  constructor() {
    effect(() => {
      this.refreshAppointmentsTrigger();
      const user = this.currentUser();
      const start = this.currentWeekStart();
      if (user && start) {
        this.zone.run(() => this.isLoading.set(true));
        const end = new Date(start);
        end.setDate(start.getDate() + 4);
        const fechaInicio = start.toISOString().split('T')[0];
        const fechaFin = end.toISOString().split('T')[0];

        const filters = { idUsuarioAsignado: user.id, fechaInicio, fechaFin };
        this.appointmentService.getAppointments(filters).subscribe({
          next: (response) => {
            this.zone.run(() => {
              this.appointments.set(response.data);
              this.isLoading.set(false);
            });
          },
          error: (err) => {
            console.error('Error loading appointments', err);
            this.zone.run(() => this.isLoading.set(false));
          }
        });
      }
    }, { allowSignalWrites: true });

    effect(() => {
      this.refreshAbsencesTrigger();
      const user = this.currentUser();
      if (user) {
        const request = this.isAdmin() 
          ? this.absenceService.getAllAbsences() 
          : this.absenceService.getMyAbsences(user.id);

        request.subscribe(response => {
          this.zone.run(() => {
            this.absences.set(response.data);
            this.cdr.detectChanges();
          });
        });
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const tab = this.activeTab();
      this.zone.run(() => {
        if (tab === 'agenda' || tab === 'calendario') {
          this.refreshAppointmentsTrigger.update(n => n + 1);
        } else {
          this.refreshAbsencesTrigger.update(n => n + 1);
        }
        setTimeout(() => this.cdr.detectChanges(), 50);
      });
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadTramites();
  }

  loadTramites() {
    const user = this.currentUser();
    if (user) {
      this.bookingService.getTramites(user.idEntidad).subscribe(data => {
        this.tramites.set(data);
        this.cdr.detectChanges();
      });
    }
  }

  onDateOrTramiteChange() {
    const { idTramite, fecha } = this.appointmentForm.value;
    const user = this.currentUser();
    if (idTramite && fecha && user) {
      this.bookingService.getSlots(user.idEntidad, idTramite, fecha).subscribe(slots => {
        this.availableSlots.set(slots);
        this.cdr.detectChanges();
      });
    }
  }

  openCreateModal() {
    this.appointmentForm.reset();
    this.showCreateModal.set(true);
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.cdr.detectChanges();
  }

  openDetailModal(cita: Cita) {
    this.selectedAppointment.set(cita);
    this.showDetailModal.set(true);
    this.cdr.detectChanges();
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedAppointment.set(null);
    this.cdr.detectChanges();
  }

  onSubmitAppointment() {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    this.isSavingAppointment.set(true);
    this.cdr.detectChanges();

    const formVal = this.appointmentForm.value;
    const appointmentData = {
      ...formVal,
      fechaHora: `${formVal.fecha}T${formVal.hora}:00`,
      idUsuarioAsignado: user.id,
      idMesa: 'e51b3a32-1111-4a3b-9a99-b1d5c7f8a111'
    };

    this.appointmentService.createAppointment(appointmentData)
      .pipe(finalize(() => {
        this.isSavingAppointment.set(false);
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.closeCreateModal();
          this.refreshData();
        },
        error: (err) => alert(err.error?.message || 'Error al crear la cita')
      });
  }

  refreshData() {
    this.refreshAppointmentsTrigger.update(n => n + 1);
    this.cdr.detectChanges();
  }

  requestAbsence() {
    if (this.absenceForm.invalid) return;
    const user = this.currentUser();
    if (user) {
      const request = { ...this.absenceForm.value, idUsuario: user.id } as any;
      this.absenceService.requestAbsence(request).subscribe({
        next: () => {
          this.refreshAbsencesTrigger.update(n => n + 1);
          this.absenceForm.reset({ tipo: TipoAusencia.VACACIONES });
          this.cdr.detectChanges();
        },
        error: (err) => alert(err.error?.message || 'Error al solicitar ausencia')
      });
    }
  }

  approveAbsence(id: string) {
    this.absenceService.approveAbsence(id).subscribe({
      next: () => this.refreshAbsencesTrigger.update(n => n + 1),
      error: (err) => alert(err.error?.message || 'Error al aprobar')
    });
  }

  rejectAbsence(id: string) {
    this.absenceService.rejectAbsence(id).subscribe({
      next: () => this.refreshAbsencesTrigger.update(n => n + 1),
      error: (err) => alert(err.error?.message || 'Error al rechazar')
    });
  }

  setFilter(filter: 'TODAS' | 'PENDIENTES' | 'REALIZADAS') {
    this.filterBy.set(filter);
    this.cdr.detectChanges();
  }

  setSort(field: string) {
    if (this.sortField() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  callClient(cita: Cita) {
    if (cita.turnoLlegada) {
      this.appointmentService.callTicket(cita.turnoLlegada.id).subscribe(() => this.refreshData());
    }
  }

  attendClient(cita: Cita) {
    if (cita.turnoLlegada) {
      this.appointmentService.attendTicket(cita.turnoLlegada.id).subscribe(() => this.refreshData());
    }
  }

  discardClient(cita: Cita) {
    if (cita.turnoLlegada) {
      if (confirm(`¿Estás seguro de descartar el turno de ${cita.clienteNombre}? Se marcará como No Presentado.`)) {
        this.appointmentService.discardTicket(cita.turnoLlegada.id).subscribe(() => this.refreshData());
      }
    }
  }

  updateStatus(cita: Cita, estado: string) {
    this.appointmentService.updateAppointmentStatus(cita.id, estado).subscribe(() => this.refreshData());
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case EstadoCita.PENDIENTE: return 'bg-warning text-dark';
      case EstadoCita.REALIZADA: return 'bg-success';
      case EstadoCita.CANCELADA: return 'bg-danger';
      case EstadoCita.NO_PRESENTADO: return 'bg-secondary';
      default: return 'bg-primary';
    }
  }

  getTurnoStatusClass(estado: string): string {
    switch (estado) {
      case EstadoTurno.EN_ESPERA: return 'text-warning';
      case EstadoTurno.LLAMADO: return 'text-primary fw-bold animate-pulse';
      case EstadoTurno.ATENDIDO: return 'text-success';
      default: return 'text-muted';
    }
  }

  getAppointmentsForDay(date: Date): Cita[] {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return this.filteredAppointments().filter(cita => cita.fechaHora.startsWith(dateStr));
  }

  getAppointmentStyle(cita: Cita): any {
    const date = new Date(cita.fechaHora);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    const startHour = 8;
    const endHour = 15;
    
    const topPx = ((hours - startHour) * 60) + minutes; 
    
    const durationMin = 30; 
    const heightPx = durationMin;

    return {
      'top.px': topPx,
      'height.px': heightPx,
    };
  }

  getAppointmentColorClass(cita: Cita): string {
    switch (cita.estado) {
      case EstadoCita.PENDIENTE: return 'event-pendiente'; 
      case EstadoCita.REALIZADA: return 'event-realizada'; 
      case EstadoCita.CANCELADA: return 'event-cancelada';
      default: return 'event-general'; 
    }
  }
}
