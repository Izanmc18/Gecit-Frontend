import { Component, OnInit, OnDestroy, NgZone, inject, signal, computed } from '@angular/core';
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
import { RolService, Rol } from '../../services/rol.service';
import { ModalConfirmationComponent } from '../ui/modal-confirmation/modal-confirmation';

@Component({
  selector: 'app-dashboard-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent, ModalConfirmationComponent],
  templateUrl: './dashboard-super-admin.html',
  styleUrls: ['./dashboard-super-admin.css'],
})
export class DashboardSuperAdmin implements OnInit, OnDestroy {
  private entityService = inject(EntityService);
  private analyticsService = inject(AnalyticsService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private rolService = inject(RolService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private zone = inject(NgZone);

  currentUser = this.authService.currentUser;
  activeTab = signal<string>('dashboard');
  entities = signal<Entidad[]>([]);
  users = signal<User[]>([]);
  isLoading = signal<boolean>(true);
  searchTerm = signal<string>('');
  roleFilter = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  entitySortDir = signal<'asc' | 'desc'>('asc');
  entityPage = signal<number>(1);
  entityPageSize = signal<number>(5);

  roles = signal<Rol[]>([]);
  rolesLoading = signal<boolean>(false);
  rolesError = signal<string>('');
  editingRol = signal<Rol | null>(null);
  editingRolName = signal<string>('');
  newRolName = signal<string>('');

  stats = signal<any>({
    totalEntities: 0,
    totalUsers: 0,
    totalResources: 0,
    platformGrowth: [],
    userDistribution: [],
  });

  maxGrowthValue = computed(() => {
    const data = this.stats().platformGrowth || [];
    return data.length > 0 ? Math.max(...data.map((d: any) => d.value), 1) : 1;
  });

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'bi bi-grid-1x2', value: 'dashboard' },
    { label: 'Gestión de Entidades', icon: 'bi bi-buildings', value: 'entities' },
    { label: 'Usuarios', icon: 'bi bi-people', value: 'users' },
    { label: 'Configuración', icon: 'bi bi-gear', value: 'settings' },
  ];

  showEntityModal = signal<boolean>(false);
  isEditingEntity = signal<boolean>(false);
  selectedEntityId = signal<string | null>(null);

  showUserModal = signal<boolean>(false);
  isEditingUser = signal<boolean>(false);
  selectedUserId = signal<string | null>(null);

  showConfirmModal = signal<boolean>(false);
  confirmTitle = signal<string>('');
  confirmMessage = signal<string>('');
  confirmType = signal<'danger' | 'warning' | 'info'>('danger');
  pendingAction = signal<(() => void) | null>(null);

  entityForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    dominio: ['', [Validators.required]],
    tramitesString: [''],
  });

  userForm = this.fb.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['12345678', [Validators.minLength(6)]],
    idRol: ['', Validators.required],
    idEntidad: [''],
  });

  filteredEntities = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sort = this.entitySortDir();

    let result = this.entities().filter(
      (e) => e.nombre.toLowerCase().includes(term) || e.dominio.toLowerCase().includes(term),
    );

    result.sort((a, b) => {
      const nameA = a.nombre.toLowerCase();
      const nameB = b.nombre.toLowerCase();
      if (sort === 'asc') return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

    return result;
  });

  paginatedEntities = computed(() => {
    const list = this.filteredEntities();
    const size = Number(this.entityPageSize());
    const page = Number(this.entityPage());
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  totalEntityPages = computed(() => {
    const size = Number(this.entityPageSize());
    return Math.ceil(this.filteredEntities().length / size);
  });

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const role = this.roleFilter();

    return this.users().filter((u) => {
      const nombre = (u.nombre || '').toLowerCase();
      const apellidos = (u.apellidos || '').toLowerCase();
      const email = (u.email || '').toLowerCase();

      const matchesSearch =
        !term || nombre.includes(term) || apellidos.includes(term) || email.includes(term);

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

  private refreshInterval: any;

  ngOnInit() {
    this.loadAll();

    this.zone.runOutsideAngular(() => {
      this.refreshInterval = setInterval(() => {
        if (!document.hidden) {
          this.zone.run(() => this.loadAll());
        }
      }, 5000);
    });

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onVisibilityChange = () => {
    if (!document.hidden) {
      this.loadAll();
    }
  };

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  loadAll() {
    this.isLoading.set(true);
    this.loadEntities();
    this.loadStats();
    this.loadUsers();
    this.loadRoles();
  }

  loadStats() {
    this.analyticsService.getGlobalStats().subscribe((data) => this.stats.set(data));
  }

  loadEntities() {
    this.entityService.getEntities().subscribe((data) => {
      this.entities.set(data);
      this.isLoading.set(false);
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe((data) => this.users.set(data));
  }

  loadRoles() {
    this.rolesLoading.set(true);
    this.rolService.getRoles().subscribe({
      next: (data) => {
        this.roles.set(data);
        this.rolesLoading.set(false);
      },
      error: (err) => {
        this.rolesError.set('Error al cargar roles');
        this.rolesLoading.set(false);
      }
    });
  }

  createRol() {
    const name = this.newRolName().trim();
    if (!name) return;
    this.rolService.createRol(name).subscribe({
      next: () => {
        this.newRolName.set('');
        this.loadRoles();
      },
      error: () => this.rolesError.set('Error al crear rol')
    });
  }

  startEditRol(rol: Rol) {
    this.editingRol.set(rol);
    this.editingRolName.set(rol.nombreRol);
  }

  saveEditRol() {
    const rol = this.editingRol();
    const newName = this.editingRolName().trim();
    if (!rol || !newName) return;
    
    this.rolService.updateRol(rol.id, newName).subscribe({
      next: () => {
        this.cancelEditRol();
        this.loadRoles();
      },
      error: () => this.rolesError.set('Error al actualizar rol')
    });
  }

  cancelEditRol() {
    this.editingRol.set(null);
    this.editingRolName.set('');
  }

  deleteRol(id: string) {
    this.confirmTitle.set('¿Eliminar Rol?');
    this.confirmMessage.set('Esta acción podría afectar a los usuarios que tengan este rol asignado.');
    this.confirmType.set('danger');
    this.pendingAction.set(() => {
      this.rolService.deleteRol(id).subscribe({
        next: () => {
          this.loadRoles();
          this.showConfirmModal.set(false);
        },
        error: () => {
          this.rolesError.set('Error al eliminar rol');
          this.showConfirmModal.set(false);
        }
      });
    });
    this.showConfirmModal.set(true);
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.entityPage.set(1);
  }

  toggleEntitySort() {
    this.entitySortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    this.entityPage.set(1);
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
    const { tramitesString, ...val } = this.entityForm.value;

    let tramitesArray: string[] = [];
    if (tramitesString && typeof tramitesString === 'string') {
      tramitesArray = tramitesString
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    const submitData = { ...val, tramites: tramitesArray };

    if (this.isEditingEntity()) {
      this.entityService.updateEntity(this.selectedEntityId()!, submitData as any).subscribe(() => {
        this.loadEntities();
        this.showEntityModal.set(false);
      });
    } else {
      this.entityService.createEntity(submitData as any).subscribe(() => {
        this.loadEntities();
        this.showEntityModal.set(false);
      });
    }
  }

  deleteEntity(id: string) {
    this.confirmTitle.set('¿Eliminar Entidad?');
    this.confirmMessage.set('Esta acción eliminará la entidad y todos sus recursos asociados (Salas, Mesas, etc.).');
    this.confirmType.set('danger');
    this.pendingAction.set(() => {
      this.entityService.deleteEntity(id).subscribe(() => {
        this.loadEntities();
        this.showConfirmModal.set(false);
      });
    });
    this.showConfirmModal.set(true);
  }

  openCreateUser() {
    this.isEditingUser.set(false);
    this.userForm.reset({ password: '12345678' });
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
    this.confirmTitle.set('¿Eliminar Usuario?');
    this.confirmMessage.set('El usuario perderá el acceso a la plataforma de forma permanente.');
    this.confirmType.set('danger');
    this.pendingAction.set(() => {
      this.userService.deleteUser(id).subscribe(() => {
        this.loadUsers();
        this.showConfirmModal.set(false);
      });
    });
    this.showConfirmModal.set(true);
  }

  onConfirmAction() {
    const action = this.pendingAction();
    if (action) action();
  }

  onCancelAction() {
    this.showConfirmModal.set(false);
    this.pendingAction.set(null);
  }

  getRoleName(roleId: string): string {
    switch (roleId) {
      case 'e51b3a32-0000-4a3b-9a99-b1d5c7f8a120':
        return 'SuperAdmin';
      case 'e51b3a32-1111-4a3b-9a99-b1d5c7f8a121':
        return 'Admin';
      case 'e51b3a32-2222-4a3b-9a99-b1d5c7f8a122':
        return 'Empleado';
      case 'e51b3a32-3333-4a3b-9a99-b1d5c7f8a123':
        return 'Cliente';
      default:
        return 'Usuario';
    }
  }

  getEntityName(entityId: string | null): string {
    if (!entityId) return 'Global';
    const entity = this.entities().find((e) => e.id === entityId);
    return entity ? entity.nombre : 'Global';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
