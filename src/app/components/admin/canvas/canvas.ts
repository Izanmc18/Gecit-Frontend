import { Component, OnInit, signal, computed, inject, ViewChild, effect, ChangeDetectorRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StageComponent, CoreShapeComponent } from 'ng2-konva';
import { OfficeService } from '../../../services/office.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { Sala, Mesa, DeskAssignment, AssignmentShift } from '../../../models/office.model';
import { User } from '../../../models/auth.model';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import Konva from 'konva';

import { ModalConfirmationComponent } from '../../ui/modal-confirmation/modal-confirmation';

@Component({
  selector: 'app-admin-canvas',
  standalone: true,
  imports: [CommonModule, StageComponent, CoreShapeComponent, FormsModule, ReactiveFormsModule, ModalConfirmationComponent],
  templateUrl: './canvas.html',
  styleUrls: ['./canvas.css']
})
export class AdminCanvasComponent implements OnInit {
  idEntidad = input<string | undefined>();
  private officeService = inject(OfficeService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  
  @ViewChild('stage') stage!: StageComponent;
  @ViewChild('transformer') transformer!: CoreShapeComponent;

  rooms = signal<Sala[]>([]);
  selectedRoom = signal<Sala | null>(null);
  tables = signal<Mesa[]>([]);
  isSaving = signal<boolean>(false);
  showPlan = signal<boolean>(true);

  canvasMode = signal<'select' | 'pan'>('select');
  viewMode = signal<'design' | 'assignment'>('design');
  scale = signal<number>(1);
  selectedTableId = signal<string | null>(null);
  isFullscreen = signal<boolean>(false);

  assignments = signal<DeskAssignment[]>([]);
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  showAssignModal = signal<boolean>(false);
  availableEmployees = signal<User[]>([]);
  isSavingAssignment = signal<boolean>(false);
  assignmentError = signal<string | null>(null);

  assignmentForm = this.fb.group({
    idUsuario: ['', Validators.required],
    turno: [AssignmentShift.COMPLETO, Validators.required]
  });

  showSalaModal = signal<boolean>(false);
  isSavingSala = signal<boolean>(false);
  salaError = signal<string>('');
  editingSalaId = signal<string | null>(null);
  selectedFile: File | null = null;
  currentUser = this.authService.currentUser;

  salaForm = this.fb.group({
    nombreSala: ['', [Validators.required, Validators.minLength(2)]],
    canvasWidth: [800, [Validators.required, Validators.min(100)]],
    canvasHeight: [600, [Validators.required, Validators.min(100)]],
    colorFondo: ['#FFFFFF']
  });

  showConfirmModal = signal<boolean>(false);
  confirmTitle = signal<string>('');
  confirmMessage = signal<string>('');
  confirmType = signal<'danger' | 'warning' | 'info'>('danger');
  pendingAction = signal<(() => void) | null>(null);
 
  public configImage = signal<any>(null);

  constructor() {
   
    effect(() => {
      const id = this.selectedTableId();
      this.updateTransformer();
    });
  }

  stageWidth = signal<number>(800);
  stageHeight = signal<number>(600);
  panX = signal<number>(0);
  panY = signal<number>(0);

  public configStage = computed(() => ({
    width: this.stageWidth(),
    height: this.stageHeight(),
    draggable: false
  }));

  public configMainGroup = computed(() => ({
    draggable: this.canvasMode() === 'pan',
    x: this.panX(),
    y: this.panY(),
    scaleX: this.scale(),
    scaleY: this.scale()
  }));

  ngOnInit() {
    this.loadRooms();
    this.loadEmployees();
    this.loadAssignments();
    this.updateStageSize();
    window.addEventListener('resize', () => this.updateStageSize());
  }

  handleWheel(event: any) {
    event.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = event.target.getStage();
    const oldScale = this.scale();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - this.panX()) / oldScale,
      y: (pointer.y - this.panY()) / oldScale,
    };

    const newScale = event.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    this.scale.set(Math.max(0.1, Math.min(newScale, 5)));

    this.panX.set(pointer.x - mousePointTo.x * this.scale());
    this.panY.set(pointer.y - mousePointTo.y * this.scale());
  }

  loadEmployees() {
    this.userService.getUsers().subscribe(users => {

      this.availableEmployees.set(users.filter(u => u.rol?.nombreRol !== 'Cliente'));
    });
  }

  loadAssignments() {
    this.officeService.getAssignments().subscribe(asg => {

      this.assignments.set(asg);
    });
  }

  private updateStageSize() {
    const wrapper = document.querySelector('.canvas-stage-wrapper');
    if (wrapper) {
      this.stageWidth.set(wrapper.clientWidth);
      this.stageHeight.set(wrapper.clientHeight);
    }
  }

  loadRooms() {
    this.officeService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        if (rooms.length > 0) {
          this.selectRoom(rooms[0]);
        }
      },
      error: (err) => console.error('Error al cargar salas:', err)
    });
  }

  selectRoom(room: Sala) {
    this.selectedRoom.set(room);
    this.loadTables(room.id);
    this.loadBackgroundImage();

    this.scale.set(1);
    this.panX.set(0);
    this.panY.set(0);
    setTimeout(() => this.fitToScreen(), 100);
  }

  fitToScreen() {
    const room = this.selectedRoom();
    if (!room) return;

    this.updateStageSize();

    const wrapper = document.querySelector('.canvas-stage-wrapper');
    if (!wrapper) return;

    const padding = 40;
    const availableWidth = wrapper.clientWidth - padding;
    const availableHeight = wrapper.clientHeight - padding;

    const scaleX = availableWidth / room.canvasWidth;
    const scaleY = availableHeight / room.canvasHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // No zoom in more than 100%

    this.scale.set(newScale);

    this.panX.set((wrapper.clientWidth - room.canvasWidth * newScale) / 2);
    this.panY.set((wrapper.clientHeight - room.canvasHeight * newScale) / 2);
  }

  deleteRoom(event: Event, room: Sala) {
    event.stopPropagation();
    this.confirmTitle.set('¿Eliminar Sala?');
    this.confirmMessage.set(`¿Estás seguro de que deseas eliminar la sala "${room.nombreSala}"? Se borrarán también todas las mesas configuradas en ella.`);
    this.confirmType.set('danger');
    this.pendingAction.set(() => {
      this.officeService.deleteRoom(room.id).subscribe({
        next: () => {
          this.loadRooms();
          if (this.selectedRoom()?.id === room.id) {
            this.selectedRoom.set(null);
            this.tables.set([]);
            this.configImage.set(null);
          }
          this.showConfirmModal.set(false);
        },
        error: (err) => {
          console.error('Error al eliminar la sala:', err);
          this.showConfirmModal.set(false);
        }
      });
    });
    this.showConfirmModal.set(true);
  }

  loadBackgroundImage() {
    const room = this.selectedRoom();
    if (!room) {
      this.configImage.set(null);
      return;
    }

    if (room.nombreSala === 'Planta Principal') {
      room.urlPlano = 'assets/images/plano/office_plan.png';
    }

    if (!room.urlPlano) {
      this.configImage.set(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'Anonymous';

    if (room.urlPlano.includes('assets/')) {
      image.src = `/${room.urlPlano}`;
    } else {
      image.src = `http://localhost:3000/public/${room.urlPlano}`;
    }
    
    image.onload = () => {
      this.configImage.set({
        image: image,
        width: room.canvasWidth,
        height: room.canvasHeight,
        opacity: 0.5,
        listening: false
      });
    };
    
    image.onerror = () => {
      console.error('Error al cargar la imagen del plano:', image.src);
      this.configImage.set(null);
    };
  }

  togglePlan() {
    this.showPlan.update(v => !v);
  }

  loadTables(roomId: string) {
    this.officeService.getTables().subscribe(allTables => {
     
      const roomTables = allTables
        .filter(t => (t.idSala || (t as any).id_sala) === roomId)
        .map(t => ({
          ...t,
          posX: t.posX ?? (t as any).pos_x ?? 0,
          posY: t.posY ?? (t as any).pos_y ?? 0,
          ancho: t.ancho ?? (t as any).ancho ?? 60,
          largo: t.largo ?? (t as any).largo ?? 60,
        }));
      this.tables.set(roomTables as Mesa[]);
    });
  }

  setMode(mode: 'select' | 'pan') {
    this.canvasMode.set(mode);
    this.selectedTableId.set(null);
  }

  setViewMode(mode: 'design' | 'assignment') {
    this.viewMode.set(mode);
    this.selectedTableId.set(null);
    if (mode === 'design') {
      this.canvasMode.set('select');
    }
  }

  zoomIn() {
    this.scale.update(s => Math.min(s + 0.1, 3));
  }

  zoomOut() {
    this.scale.update(s => Math.max(s - 0.1, 0.5));
  }

  onTableClick(id: string) {
    if (this.viewMode() === 'design' && this.canvasMode() === 'select') {
      this.selectedTableId.set(id);
    } else if (this.viewMode() === 'assignment') {
      this.selectedTableId.set(id);
      this.openAssignmentModal();
    }
  }

  handleTableClick(event: any, id: string) {
    this.onTableClick(id);
   
    if (event) {
      event.cancelBubble = true;
    }
  }

  toggleFullscreen() {
    this.isFullscreen.update(v => !v);
  }

  onMainGroupDragEnd(event: any) {
    const node = event.target;
    this.panX.set(node.x());
    this.panY.set(node.y());
  }

  handleStageMouseDown(event: any) {

    const target = event.target || event.evt?.target;
    if (!target) return;

    const stage = target.getStage();

    if (target === stage) {
      this.selectedTableId.set(null);
    }
  }

  updateTransformer() {
    if (!this.stage || !this.transformer) return;

    setTimeout(() => {
      const stage = this.stage.getStage();
      const transformer = this.transformer.getStage() as unknown as Konva.Transformer;
      const id = this.selectedTableId();

      if (!id) {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
        return;
      }

      const selectedNode = stage.findOne('.group-' + id);
      if (selectedNode) {
        (selectedNode as Konva.Node).draggable(this.canvasMode() === 'select');
        transformer.nodes([selectedNode as Konva.Node]);
        transformer.getLayer()?.batchDraw();
      } else {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
      }
    }, 0);
  }

  onDragStart(event: any) {
   
    event.cancelBubble = true;
  }

  onDragEnd(event: any, table: Mesa) {
    let node = event.target || event.evt?.target;
    if (!node) return;

    if (node.nodeType === 'Shape' || node.className === 'Rect' || node.className === 'Text') {
      node = node.getParent();
    }

    const newX = Math.round(node.x());
    const newY = Math.round(node.y());

    this.updateTablePosition(table.id, newX, newY);
    
    this.stage?.getStage()?.batchDraw();
  }

  onTransformEnd(event: any, table: Mesa) {
    let node = event.target || event.evt?.target;
    if (!node) return;

    if (node.nodeType === 'Shape' || node.className === 'Rect' || node.className === 'Text') {
      node = node.getParent();
    }

    const newWidth = Math.round(node.width() * node.scaleX());
    const newHeight = Math.round(node.height() * node.scaleY());
    const newX = Math.round(node.x());
    const newY = Math.round(node.y());

    // Reset scale to 1 to avoid double scaling
    node.scaleX(1);
    node.scaleY(1);

    // Update the local state
    this.tables.update(current => 
      current.map(t => {
        if (t.id === table.id) {
          const updated = { ...t, ancho: newWidth, largo: newHeight, posX: newX, posY: newY };
          if ((t as any).pos_x !== undefined) (updated as any).pos_x = newX;
          if ((t as any).pos_y !== undefined) (updated as any).pos_y = newY;
          return updated;
        }
        return t;
      })
    );
    this.cdr.detectChanges();
    this.stage?.getStage()?.batchDraw();

    this.saveTableChanges(table.id, { ancho: newWidth, largo: newHeight, posX: newX, posY: newY });
    this.updateTransformer();
  }

  private updateTablePosition(id: string, x: number, y: number) {
    this.tables.update(current => 
      current.map(t => {
        if (t.id === id) {
          const updated = { ...t, posX: x, posY: y };
         
          if ((t as any).pos_x !== undefined) (updated as any).pos_x = x;
          if ((t as any).pos_y !== undefined) (updated as any).pos_y = y;
          return updated;
        }
        return t;
      })
    );
    this.cdr.detectChanges();
    this.stage?.getStage()?.batchDraw();

    this.saveTableChanges(id, { posX: x, posY: y });
    this.updateTransformer();
  }

  private updateTableSize(id: string, w: number, h: number) {
    this.tables.update(current => 
      current.map(t => t.id === id ? { ...t, ancho: w, largo: h } : t)
    );
    this.cdr.detectChanges();
    this.stage?.getStage()?.batchDraw();
    this.saveTableChanges(id, { ancho: w, largo: h });
  }

  private saveTableChanges(id: string, changes: any) {
    this.isSaving.set(true);
    this.officeService.updateTable(id, changes).subscribe({
      next: () => setTimeout(() => this.isSaving.set(false), 500),
      error: () => this.isSaving.set(false)
    });
  }

  addTable() {
    if (!this.selectedRoom()) return;

    const existingNames = this.tables().map(t => t.nombreMesa);
    let nextNumber = 1;
    while (existingNames.some(name => name === `Mesa ${nextNumber}`)) {
      nextNumber++;
    }

    const newTable: Partial<Mesa> = {
      nombreMesa: `Mesa ${nextNumber}`,
      idSala: this.selectedRoom()!.id,
      posX: 100,
      posY: 100,
      ancho: 120,
      largo: 80,
      estado: 'Libre'
    };

    this.isSaving.set(true);
    this.officeService.createTable(newTable as Mesa).subscribe(table => {
      this.tables.update(current => [...current, table]);
      this.isSaving.set(false);
      this.selectedTableId.set(table.id);
      this.updateTransformer();
    });
  }

  deleteSelectedTable() {
    const id = this.selectedTableId();
    if (!id) return;

    this.confirmTitle.set('¿Eliminar Mesa?');
    this.confirmMessage.set('¿Estás seguro de que deseas eliminar esta mesa del diseño?');
    this.confirmType.set('danger');
    this.pendingAction.set(() => {
      this.isSaving.set(true);
      this.officeService.deleteTable(id).subscribe(() => {
        this.tables.update(current => current.filter(t => t.id !== id));
        this.isSaving.set(false);
        this.selectedTableId.set(null);
        this.updateTransformer();
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

  toggleTableState() {
    const id = this.selectedTableId();
    const table = this.getSelectedTable();
    if (!id || !table) return;

    const newEstado = table.estado === 'Inactiva' ? 'Libre' : 'Inactiva';
    
    this.isSaving.set(true);
    this.officeService.updateTable(id, { estado: newEstado }).subscribe(() => {
      this.tables.update(current => current.map(t => t.id === id ? { ...t, estado: newEstado } : t));
      this.isSaving.set(false);
    });
  }

  getSelectedTable(): Mesa | undefined {
    return this.tables().find(t => t.id === this.selectedTableId());
  }

  saveDesign() {
    const stage = this.stage?.getStage();
    if (!stage) {
      console.error('No se pudo acceder al escenario de Konva');
      return;
    }

    const tables = this.tables();

    this.isSaving.set(true);
    const saveObservables = tables.map(table => {
     
      const node = stage.findOne('#' + table.id);
      
      let x = table.posX;
      let y = table.posY;

      if (node) {
        x = Math.round(node.x());
        y = Math.round(node.y());
      }

      const changes: any = {
        posX: x,
        posY: y,
        ancho: table.ancho,
        largo: table.largo,
        rotacion: table.rotacion ?? 0
      };
      
      return this.officeService.updateTable(table.id, changes);
    });

    forkJoin(saveObservables).subscribe({
      next: () => {
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Error masivo al guardar:', error);
        this.isSaving.set(false);
      }
    });
  }

  getGroupConfig(table: Mesa) {
    return {
      id: table.id,
      name: 'group-' + table.id,
      x: this.getTableX(table),
      y: this.getTableY(table),
      draggable: this.viewMode() === 'design' && this.canvasMode() === 'select'
    };
  }

  getTableX(table: Mesa): number {
    return table.posX ?? (table as any)['pos_x'] ?? 0;
  }

  getTableY(table: Mesa): number {
    return table.posY ?? (table as any)['pos_y'] ?? 0;
  }

  getTableConfig(table: Mesa) {
    const isSelected = this.selectedTableId() === table.id;
    const isInactive = table.estado === 'Inactiva';
    const ancho = table.ancho ?? (table as any).ancho ?? 60;
    const largo = table.largo ?? (table as any).largo ?? 60;
    
    return {
      x: 0,
      y: 0,
      width: ancho,
      height: largo,
      fill: isInactive ? '#f1f5f9' : (isSelected ? '#eff6ff' : '#ffffff'),
      stroke: isInactive ? '#cbd5e1' : (isSelected ? '#3b82f6' : '#cbd5e1'),
      strokeWidth: isSelected ? 2 : 1,
      opacity: isInactive ? 0.6 : 1,
      dash: isInactive ? [5, 5] : [],
      cornerRadius: 8,
      shadowBlur: isSelected ? 10 : 5,
      shadowOpacity: isSelected ? 0.2 : 0.1,
      shadowOffset: { x: 2, y: 2 }
    };
  }

  getTransformerConfig() {
    return {
      rotateEnabled: true,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      boundBoxFunc: (oldBox: any, newBox: any) => {
       
        if (newBox.width < 20 || newBox.height < 20) {
          return oldBox;
        }
        return newBox;
      }
    };
  }

  getTextConfig(table: Mesa) {
    const ancho = table.ancho ?? (table as any).ancho ?? 60;
    const largo = table.largo ?? (table as any).largo ?? 60;

    const assignment = this.getTableAssignment(table.id);
    let label = table.nombreMesa || (table as any).nombre_mesa || 'Mesa';
    
    if (this.viewMode() === 'assignment' && assignment) {
      label = assignment.usuario?.nombre || 'Asignada';
    }

    return {
      x: 0,
      y: largo / 2 - 7,
      text: label,
      fontSize: 11,
      fontFamily: 'Inter, sans-serif',
      fill: assignment ? '#2563eb' : '#1e293b',
      width: ancho,
      align: 'center',
      fontStyle: assignment ? '700' : '600'
    };
  }

  getTableAssignment(tableId: string): DeskAssignment | undefined {
    return this.assignments().find(a => 
      a.idMesa === tableId && 
      a.fecha === this.selectedDate()
    );
  }

  openAssignmentModal() {
    const assignment = this.getTableAssignment(this.selectedTableId()!);
    if (assignment) {
      this.assignmentForm.patchValue({
        idUsuario: assignment.idUsuario,
        turno: assignment.turno
      });
    } else {
      this.assignmentForm.reset({
        turno: AssignmentShift.COMPLETO
      });
    }
    this.assignmentError.set(null);
    this.showAssignModal.set(true);
  }

  closeAssignmentModal() {
    this.showAssignModal.set(false);
    this.selectedTableId.set(null);
  }

  saveAssignment() {
    if (this.assignmentForm.invalid || !this.selectedTableId()) return;

    this.isSavingAssignment.set(true);
    const data = {
      ...this.assignmentForm.value,
      idMesa: this.selectedTableId(),
      fecha: this.selectedDate()
    };

    const existing = this.getTableAssignment(this.selectedTableId()!);
    
    if (existing) {

      this.officeService.deleteAssignment(existing.id).subscribe(() => {
        this.createNewAssignment(data);
      });
    } else {
      this.createNewAssignment(data);
    }
  }

  private createNewAssignment(data: any) {
    this.officeService.createAssignment(data).subscribe({
      next: () => {
        this.loadAssignments();
        this.isSavingAssignment.set(false);
        this.closeAssignmentModal();
      },
      error: (err) => {
        this.assignmentError.set(err.error?.message || 'Error al guardar la asignación');
        this.isSavingAssignment.set(false);
      }
    });
  }

  removeAssignment() {
    const existing = this.getTableAssignment(this.selectedTableId()!);
    if (existing) {
      this.isSavingAssignment.set(true);
      this.officeService.deleteAssignment(existing.id).subscribe(() => {
        this.loadAssignments();
        this.isSavingAssignment.set(false);
        this.closeAssignmentModal();
      });
    }
  }

  openNewSalaModal() {
    this.editingSalaId.set(null);
    this.salaForm.reset({ canvasWidth: 800, canvasHeight: 600, colorFondo: '#FFFFFF' });
    this.salaError.set('');
    this.selectedFile = null;
    this.showSalaModal.set(true);
  }

  closeSalaModal() {
    this.showSalaModal.set(false);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  saveSala() {
    if (this.salaForm.invalid) {
      this.salaForm.markAllAsTouched();
      return;
    }

    this.isSavingSala.set(true);
    this.salaError.set('');
    
    const user = this.currentUser();
    const idEntidad = (user as any)?.idEntidad || (user as any)?.id_entidad;

    if (!idEntidad) {
      this.salaError.set('No se pudo determinar la entidad');
      this.isSavingSala.set(false);
      return;
    }

    const performSave = (urlPlano?: string) => {
      const formValue = this.salaForm.value;
      const salaData = { ...formValue, idEntidad, urlPlano } as any;

      if (this.editingSalaId()) {
        this.officeService.updateRoom(this.editingSalaId()!, salaData).subscribe({
          next: () => {
            this.isSavingSala.set(false);
            this.closeSalaModal();
            this.loadRooms();
          },
          error: (err) => {
            this.isSavingSala.set(false);
            this.salaError.set('Error al actualizar la sala');
          }
        });
      } else {
        this.officeService.createRoom(salaData).subscribe({
          next: () => {
            this.isSavingSala.set(false);
            this.closeSalaModal();
            this.loadRooms();
          },
          error: (err) => {
            this.isSavingSala.set(false);
            this.salaError.set('Error al crear la sala');
          }
        });
      }
    };

    if (this.selectedFile) {
      this.officeService.uploadRoomPlan(this.selectedFile).subscribe({
        next: (res) => performSave(res.url),
        error: (err) => {
          this.isSavingSala.set(false);
          this.salaError.set('Error al subir el plano');
        }
      });
    } else {
      performSave();
    }
  }
}
