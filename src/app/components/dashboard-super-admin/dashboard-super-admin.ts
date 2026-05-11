import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntityService } from '../../services/entity.service';
import { Entidad } from '../../models/booking.model';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NavbarComponent, NavItem } from '../ui/navbar/navbar';
import { AnalyticsService } from '../../services/analytics.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-dashboard-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './dashboard-super-admin.html',
  styleUrls: ['./dashboard-super-admin.css']
})
export class DashboardSuperAdmin implements OnInit {
  private entityService = inject(EntityService);
  private analyticsService = inject(AnalyticsService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  activeTab = signal<string>('dashboard');
  entities = signal<Entidad[]>([]);
  users = signal<User[]>([]);
  isLoading = signal<boolean>(true);
  searchTerm = signal<string>('');
  roleFilter = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

 
  stats = signal<any>({
    totalEntidades: 0,
    totalUsuarios: 0,
    totalCitas: 0,
    esperaMedia: 10,
    totalCitasRealizadas: 0,
    weeklyData: []
  });

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'bi bi-grid-1x2', value: 'dashboard' },
    { label: 'Gestión de Entidades', icon: 'bi bi-buildings', value: 'entities' },
    { label: 'Usuarios', icon: 'bi bi-people', value: 'users' },
    { label: 'Configuración', icon: 'bi bi-gear', value: 'settings' }
  ];

 
  showEntityModal = signal<boolean>(false);
  isEditingEntity = signal<boolean>(false);
  selectedEntityId = signal<string | null>(null);

 
  showUserModal = signal<boolean>(false);
  isEditingUser = signal<boolean>(false);
  selectedUserId = signal<string | null>(null);

  entityForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    dominio: ['', [Validators.required]],
    logoUrl: ['']
  });

  userForm = this.fb.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    idRol: ['', Validators.required],
    idEntidad: ['']
  });

  filteredEntities = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.entities().filter(e => 
      e.nombre.toLowerCase().includes(term) || 
      e.dominio.toLowerCase().includes(term)
    );
  });

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const role = this.roleFilter();
    
    return this.users().filter(u => {
      const nombre = (u.nombre || '').toLowerCase();
      const apellidos = (u.apellidos || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      
      const matchesSearch = !term || 
                          nombre.includes(term) || 
                          apellidos.includes(term) || 
                          email.includes(term);
                          
      const matchesRole = !role || u.idRol === role;
      
      return matchesSearch && matchesRole;
    });
  });

  paginatedUsers = computed(() => {
    const users = this.filteredUsers();
    const size = Number(this.pageSize());
    const page = Number(this.currentPage());
    const start = (page - 1) * size;
    return users.slice(start, start + size);
  });

  totalPages = computed(() => {
    const size = Number(this.pageSize());
    return Math.ceil(this.filteredUsers().length / size);
  });

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.loadEntities();
    this.loadStats();
    this.loadUsers();
  }

  loadStats() {
    this.analyticsService.getGlobalStats().subscribe(data => this.stats.set(data));
  }

  loadEntities() {
    this.entityService.getEntities().subscribe(data => {
      this.entities.set(data);
      this.isLoading.set(false);
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe(data => this.users.set(data));
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    this.searchTerm.set('');
  }

 
  openCreateEntity() {
    this.isEditingEntity.set(false);
    this.entityForm.reset();
    this.showEntityModal.set(true);
  }

  openEditEntity(entity: Entidad) {
    this.isEditingEntity.set(true);
    this.selectedEntityId.set(entity.id);
    this.entityForm.patchValue(entity);
    this.showEntityModal.set(true);
  }

  onSubmitEntity() {
    if (this.entityForm.invalid) return;
    const val = this.entityForm.value;
    if (this.isEditingEntity()) {
      this.entityService.updateEntity(this.selectedEntityId()!, val as any).subscribe(() => {
        this.loadEntities();
        this.showEntityModal.set(false);
      });
    } else {
      this.entityService.createEntity(val as any).subscribe(() => {
        this.loadEntities();
        this.showEntityModal.set(false);
      });
    }
  }

 
  openCreateUser() {
    this.isEditingUser.set(false);
    this.userForm.reset();
    this.showUserModal.set(true);
  }

  onSubmitUser() {
    if (this.userForm.invalid) return;
    const val = this.userForm.value;
    this.userService.createUser(val).subscribe(() => {
      this.loadUsers();
      this.showUserModal.set(false);
    });
  }

  deleteUser(id: string) {
    if (confirm('¿Eliminar este usuario?')) {
      this.userService.deleteUser(id).subscribe(() => this.loadUsers());
    }
  }

  getRoleName(roleId: string): string {
    switch (roleId) {
      case 'e51b3a32-0000-4a3b-9a99-b1d5c7f8a120': return 'SuperAdmin';
      case 'e51b3a32-1111-4a3b-9a99-b1d5c7f8a121': return 'Admin';
      case 'e51b3a32-2222-4a3b-9a99-b1d5c7f8a122': return 'Empleado';
      case 'e51b3a32-3333-4a3b-9a99-b1d5c7f8a123': return 'Cliente';
      default: return 'Usuario';
    }
  }

  getEntityName(entityId: string | null): string {
    if (!entityId) return 'Global';
    const entity = this.entities().find(e => e.id === entityId);
    return entity ? entity.nombre : 'Global';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
