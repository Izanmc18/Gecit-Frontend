import { Component, OnInit, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { OfficeService } from '../../services/office.service';
import { AbsenceService } from '../../services/absence.service';
import { AppointmentService } from '../../services/appointment.service';
import { AdminCanvasComponent } from '../admin/canvas/canvas';
import { Chart, registerables } from 'chart.js';
import { NavbarComponent, NavItem } from '../ui/navbar/navbar';
Chart.register(...registerables);
import { User } from '../../models/auth.model';
import { Absence } from '../../models/absence.model';
import { Cita } from '../../models/appointment.model';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, AdminCanvasComponent, FormsModule, NavbarComponent],
  templateUrl: './dashboard-admin.html',
  styleUrls: ['./dashboard-admin.css']
})
export class DashboardAdmin implements OnInit {
  private authService = inject(AuthService);
  private absenceService = inject(AbsenceService);
  private officeService = inject(OfficeService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  
 
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
  
 
  absences = signal<Absence[]>([]);
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

  ngOnInit() {
    this.loadAbsences();
    this.loadStats();
    this.loadTodayAgenda();
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

    if ((user as any).id_entidad) {
      this.officeService.getDashboardSummary((user as any).id_entidad).subscribe(data => {
        this.stats.set(data);
      });
    }
  }

  initCharts(data: any) {
   
    const ctxVolume = document.getElementById('volumeChart') as HTMLCanvasElement;
    if (ctxVolume) {
      if (this.volumeChart) this.volumeChart.destroy();
      this.volumeChart = new Chart(ctxVolume, {
        type: 'bar',
        data: {
          labels: data.graficaCitas.map((d: any) => d.name),
          datasets: [{
            label: 'Citas',
            data: data.graficaCitas.map((d: any) => d.value),
            backgroundColor: '#3b82f6',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
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
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            borderWidth: 0
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
}
