import { Component, OnInit, OnDestroy, NgZone, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { OfficeService } from '../../services/office.service';
import { DeskAssignment, Mesa } from '../../models/office.model';
import { AbsenceService } from '../../services/absence.service';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { AdminCanvasComponent } from '../admin/canvas/canvas';
import { Chart, registerables } from 'chart.js';
import { NavbarComponent, NavItem } from '../ui/navbar/navbar';
import { InputField } from '../ui/input/input';
Chart.register(...registerables);
import { User } from '../../models/auth.model';
import { Absence } from '../../models/absence.model';
import { Cita } from '../../models/appointment.model';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, AdminCanvasComponent, FormsModule, ReactiveFormsModule, NavbarComponent, InputField],
  templateUrl: './dashboard-admin.html',
  styleUrls: ['./dashboard-admin.css']
})
export class DashboardAdmin implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private absenceService = inject(AbsenceService);
  private officeService = inject(OfficeService);
  private zone = inject(NgZone);
  private appointmentService = inject(AppointmentService);
  private userService = inject(UserService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  private volumeChart: any;
  private tramiteChart: any;

  currentUser = this.authService.currentUser;
  activeTab = signal<string>('resumen');
  
  navItems: NavItem[] = [
    { label: 'Resumen', icon: 'bi bi-grid-1x2', value: 'resumen' },
    { label: 'Agenda', icon: 'bi bi-calendar3', value: 'agenda' },
    { label: 'Laboral', icon: 'bi bi-person-badge', value: 'laboral' },
    { label: 'Configuración', icon: 'bi bi-gear', value: 'configuracion' }
  ];

  absenceSearch = signal<string>('');
  absenceFilter = signal<string>('all');
  employeeFilter = signal<string>('all');
  
  activePersonalTab = signal<'ausencias' | 'plantilla'>('ausencias');
  employees = signal<User[]>([]);
  showEmployeeModal = signal<boolean>(false);
  isSavingEmployee = signal<boolean>(false);
  employeeError = signal<string>('');
  editingEmployeeId = signal<string | null>(null);
  
  showDeleteModal = signal<boolean>(false);
  employeeToDelete = signal<User | null>(null);

  absencePage = signal<number>(1);
  absencePageSize = signal<number>(5);
  employeePage = signal<number>(1);
  employeePageSize = signal<number>(5);

  agendaSearch = signal<string>('');
  agendaTramiteFilter = signal<string>('all');
  agendaPage = signal<number>(1);
  agendaPageSize = signal<number>(5);

  employeeForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['12345678', [Validators.required, Validators.minLength(6)]],
    competenciasIds: [[]]
  });

  competencias = signal<any[]>([]);
  absences = signal<Absence[]>([]);
  deskAssignments = signal<DeskAssignment[]>([]);
  tables = signal<Mesa[]>([]);
  today = new Date();
  todayAppointments = signal<Cita[]>([]);
  stats = signal<any>({
    totalCitas: 0,
    realizadas: 0,
    empleadosActivos: 0,
    esperaMedia: 0,
    graficaCitas: [],
    tramitesStats: []
  });

  constructor() {
   
    effect(() => {
      const currentTab = this.activeTab();
      const currentStats = this.stats();
      
      if (currentTab === 'resumen') {
       
        setTimeout(() => this.initCharts(currentStats), 100);
      }
    });
  }

  filteredAbsences = computed(() => {
    const search = this.absenceSearch().toLowerCase();
    const filter = this.absenceFilter();
    let list = this.absences();

    if (search) {
      list = list.filter(a => 
        a.usuarioNombre?.toLowerCase().includes(search) || 
        a.usuarioEmail?.toLowerCase().includes(search)
      );
    }

    if (filter !== 'all') {
      list = list.filter(a => a.estado === filter);
    }

    return list;
  });

  paginatedAbsences = computed(() => {
    const page = this.absencePage();
    const size = this.absencePageSize();
    const start = (page - 1) * size;
    return this.filteredAbsences().slice(start, start + size);
  });

  absenceTotalPages = computed(() => Math.ceil(this.filteredAbsences().length / this.absencePageSize()));

  filteredEmployees = computed(() => {
    const search = this.absenceSearch().toLowerCase(); 
    const filter = this.employeeFilter();
    let list = this.employees();

    if (search) {
      list = list.filter(e => 
        e.nombre?.toLowerCase().includes(search) || 
        e.apellidos?.toLowerCase().includes(search) || 
        e.email?.toLowerCase().includes(search)
      );
    }

    if (filter !== 'all') {
      list = list.filter(e => (e.rol?.nombreRol || e.rol || 'Empleado') === filter);
    }

    return list;
  });

  paginatedEmployees = computed(() => {
    const page = this.employeePage();
    const size = this.employeePageSize();
    const start = (page - 1) * size;
    return this.filteredEmployees().slice(start, start + size);
  });

  employeeTotalPages = computed(() => Math.ceil(this.filteredEmployees().length / this.employeePageSize()));

  filteredAgenda = computed(() => {
    const search = this.agendaSearch().toLowerCase().trim();
    const filter = this.agendaTramiteFilter();
    let list = this.todayAppointments();

    if (search) {
      list = list.filter(cita => 
        cita.clienteNombre?.toLowerCase().includes(search) || 
        cita.clienteDni?.toLowerCase().includes(search)
      );
    }

    if (filter !== 'all') {
      list = list.filter(cita => this.getTramiteNombre(cita) === filter);
    }

    return list;
  });

  paginatedAgenda = computed(() => {
    const page = this.agendaPage();
    const size = this.agendaPageSize();
    const start = (page - 1) * size;
    return this.filteredAgenda().slice(start, start + size);
  });

  agendaTotalPages = computed(() => Math.ceil(this.filteredAgenda().length / this.agendaPageSize()));

  private refreshInterval: any;

  ngOnInit() {
    this.loadAbsences();
    this.loadEmployees();
    this.loadStats();
    this.loadTodayAgenda();
    this.loadTodayAssignments();
    this.loadTables();
    this.loadCompetencias();

    this.zone.runOutsideAngular(() => {
      this.refreshInterval = setInterval(() => {
        if (!document.hidden) {
          this.zone.run(() => {
            this.loadTodayAgenda();
            this.loadStats();
            this.loadTodayAssignments();
            this.loadAbsences();
            this.loadEmployees();
          });
        }
      }, 5000);
    });

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onVisibilityChange = () => {
    if (!document.hidden) {
      this.loadTodayAgenda();
      this.loadStats();
    }
  };

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  loadCompetencias() {
    this.userService.getCompetencias().subscribe({
      next: (comp) => {
        const dataArray = (comp as any).data ? (comp as any).data : comp;
        this.competencias.set(Array.isArray(dataArray) ? dataArray : []);
      },
      error: (err) => console.error('Error loading competencias', err)
    });
  }

  loadTodayAssignments() {
    this.officeService.getAssignments().subscribe({
      next: (asg) => {
        const today = new Date().toISOString().split('T')[0];

        this.deskAssignments.set(asg.filter(a => a.fecha === today));
      },
      error: (err) => console.error('Error loading assignments', err)
    });
  }

  getEmployeeAssignment(userId: string): DeskAssignment | undefined {
    return this.deskAssignments().find(a => (a.idUsuario || (a as any).id_usuario) === userId);
  }

  getMesaName(assignment: DeskAssignment): string {

    const name = assignment.mesa?.nombreMesa || assignment.mesa?.nombre_mesa || assignment.mesa?.nombre;
    if (name) return name;

    const tableId = assignment.idMesa || (assignment as any).id_mesa;
    const table = this.tables().find(t => t.id === tableId);
    if (table) return table.nombreMesa || (table as any).nombre_mesa || 'Mesa';

    return 'Mesa ' + (tableId ? tableId.substring(0, 4) : '??');
  }

  loadEmployees() {
    this.userService.getUsers().subscribe({
      next: (users) => this.employees.set(users),
      error: (err) => console.error('Error loading employees', err)
    });
  }

  loadTodayAgenda() {
    const today = new Date().toISOString().split('T')[0];
    this.appointmentService.getAppointments({ fechaInicio: today }).subscribe(response => {
      this.todayAppointments.set(response.data);
    });
  }

  loadStats() {
    const user = this.currentUser();
   
    if (!user) {
      setTimeout(() => this.loadStats(), 200);
      return;
    }

    const entId = (user as any).idEntidad || (user as any).id_entidad;
    
    if (entId) {
      this.officeService.getDashboardSummary(entId).subscribe({
        next: (data) => {
          this.stats.set(data);

          setTimeout(() => this.initCharts(data), 200);
        },
        error: (err) => console.error('Error al cargar estadísticas:', err)
      });
    }
  }

  initCharts(data: any) {
   
    const ctxVolume = document.getElementById('volumeChart') as HTMLCanvasElement;
    if (ctxVolume) {
      if (this.volumeChart) this.volumeChart.destroy();
      this.volumeChart = new Chart(ctxVolume, {
        type: 'line', // Cambiamos a línea para un look más moderno
        data: {
          labels: data.graficaCitas.map((d: any) => d.name),
          datasets: [{
            label: 'Citas registradas',
            data: data.graficaCitas.map((d: any) => d.value),
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3b82f6',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#3b82f6',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              padding: 12,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              displayColors: false
            }
          },
          scales: { 
            y: { 
              beginAtZero: true, 
              grid: { color: '#f1f5f9' },
              ticks: { font: { size: 11 } }
            }, 
            x: { 
              grid: { display: false },
              ticks: { font: { size: 11 } }
            } 
          }
        }
      });
    }

    const ctxTramite = document.getElementById('tramiteChart') as HTMLCanvasElement;
    if (ctxTramite) {
      if (this.tramiteChart) this.tramiteChart.destroy();
      this.tramiteChart = new Chart(ctxTramite, {
        type: 'doughnut',
        data: {
          labels: data.tramitesStats.map((d: any) => d.name),
          datasets: [{
            data: data.tramitesStats.map((d: any) => d.value),
            backgroundColor: [
              '#3b82f6', // Azul
              '#10b981', // Verde
              '#f59e0b', // Ambar
              '#8b5cf6', // Violeta
              '#ec4899', // Rosa
              '#64748b'  // Pizarra
            ],
            hoverOffset: 10,
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
          },
          cutout: '70%'
        }
      });
    }
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    this.agendaSearch.set('');
    this.agendaTramiteFilter.set('all');
    this.agendaPage.set(1);
  }

  getTramiteNombre(cita: any): string {
    return cita.tramite?.nombreTramite || cita.tramite?.nombre || 'General';
  }

  getStatusClass(estado: string): string {
    if (estado === 'Pendiente') return 'status-pending';
    if (estado === 'Realizada' || estado === 'Atendida' || estado === 'Completada') return 'status-approved';
    if (estado === 'Cancelada' || estado === 'No presentado') return 'status-rejected';
    return '';
  }

  setAbsencePage(page: number) {
    if (page >= 1 && page <= this.absenceTotalPages()) {
      this.absencePage.set(page);
    }
  }

  setEmployeePage(page: number) {
    if (page >= 1 && page <= this.employeeTotalPages()) {
      this.employeePage.set(page);
    }
  }

  onPageSizeChange(type: 'absence' | 'employee', event: any) {
    const size = parseInt(event.target.value);
    if (type === 'absence') {
      this.absencePageSize.set(size);
      this.absencePage.set(1);
    } else {
      this.employeePageSize.set(size);
      this.employeePage.set(1);
    }
  }

  onJumpPage(type: 'absence' | 'employee', event: any) {
    let page = parseInt(event.target.value);
    const total = type === 'absence' ? this.absenceTotalPages() : this.employeeTotalPages();
    
    if (isNaN(page) || page < 1) page = 1;
    if (page > total) page = total;

    if (type === 'absence') {
      this.absencePage.set(page);
    } else {
      this.employeePage.set(page);
    }

    event.target.value = page;
  }

  loadTables() {
    this.officeService.getTables().subscribe(allTables => {
      this.tables.set(allTables);
    });
  }

  loadAbsences() {
    this.absenceService.getAllAbsences().subscribe(response => {
      this.absences.set(response.data);
    });
  }

  approveAbsence(id: string) {
    this.absenceService.approveAbsence(id).subscribe(() => {
      this.loadAbsences();
    });
  }

  rejectAbsence(id: string) {
    this.absenceService.rejectAbsence(id).subscribe(() => {
      this.loadAbsences();
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openNewEmployeeModal() {
    this.editingEmployeeId.set(null);
    this.employeeForm.reset({ password: '12345678', competenciasIds: [] });
    this.employeeError.set('');
    this.showEmployeeModal.set(true);
  }

  openEditEmployeeModal(emp: any) {
    this.editingEmployeeId.set(emp.id);
    this.employeeForm.patchValue({
      nombre: emp.nombre,
      apellidos: emp.apellidos,
      email: emp.email,
      password: '',
      competenciasIds: emp.competencias?.map((c: any) => c.id) || []
    });
    this.employeeForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.employeeForm.get('password')?.updateValueAndValidity();
    
    this.employeeError.set('');
    this.showEmployeeModal.set(true);
  }

  closeEmployeeModal() {
    this.showEmployeeModal.set(false);
  }

  deleteEmployee(emp: User) {
    this.employeeToDelete.set(emp);
    this.showDeleteModal.set(true);
  }

  confirmDelete() {
    const emp = this.employeeToDelete();
    if (emp) {
      this.userService.deleteUser(emp.id).subscribe({
        next: () => {
          this.loadEmployees();
          this.showDeleteModal.set(false);
          this.employeeToDelete.set(null);
        },
        error: (err) => console.error('Error deleting employee', err)
      });
    }
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.employeeToDelete.set(null);
  }

  saveEmployee() {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSavingEmployee.set(true);
    this.employeeError.set('');
    const formValue = this.employeeForm.value;
    const id = this.editingEmployeeId();

    if (id) {
      const updateData: any = { ...formValue };
      if (!updateData.password) delete updateData.password;

      this.userService.updateUser(id, updateData).subscribe({
        next: () => {
          this.isSavingEmployee.set(false);
          this.closeEmployeeModal();
          this.loadEmployees();
        },
        error: (err) => this.handleError(err)
      });
    } else {
      const newEmployee = {
        ...formValue,
        idRol: 'e51b3a32-2222-4a3b-9a99-b1d5c7f8a122' 
      };

      this.userService.createUser(newEmployee).subscribe({
        next: () => {
          this.isSavingEmployee.set(false);
          this.closeEmployeeModal();
          this.loadEmployees();
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  private handleError(err: any) {
    this.isSavingEmployee.set(false);
    let errorMsg = 'Error al procesar el empleado';
    if (err.error?.error?.message) {
      errorMsg = Array.isArray(err.error.error.message) ? err.error.error.message.join(', ') : err.error.error.message;
    } else if (err.error?.message) {
      errorMsg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
    }
    this.employeeError.set(errorMsg);
  }
}
