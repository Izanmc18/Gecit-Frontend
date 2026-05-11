import { Component, OnInit, signal, computed, inject, ViewChild, effect, ChangeDetectorRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StageComponent, CoreShapeComponent } from 'ng2-konva';
import { OfficeService } from '../../../services/office.service';
import { Sala, Mesa } from '../../../models/office.model';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import Konva from 'konva';

@Component({
  selector: 'app-admin-canvas',
  standalone: true,
  imports: [CommonModule, StageComponent, CoreShapeComponent],
  templateUrl: './canvas.html',
  styleUrls: ['./canvas.css']
})
export class AdminCanvasComponent implements OnInit {
  idEntidad = input<string | undefined>();
  private officeService = inject(OfficeService);
  private cdr = inject(ChangeDetectorRef);
  
  @ViewChild('stage') stage!: StageComponent;
  @ViewChild('transformer') transformer!: CoreShapeComponent;

 
  rooms = signal<Sala[]>([]);
  selectedRoom = signal<Sala | null>(null);
  tables = signal<Mesa[]>([]);
  isSaving = signal<boolean>(false);
  showPlan = signal<boolean>(true);
  
 
  canvasMode = signal<'select' | 'pan'>('select');
  scale = signal<number>(1);
  selectedTableId = signal<string | null>(null);
  isFullscreen = signal<boolean>(false);
  
 
  public configImage = signal<any>(null);

  constructor() {
   
    effect(() => {
      const id = this.selectedTableId();
      this.updateTransformer();
    });
  }
  
 
  stageWidth = signal<number>(800);
  stageHeight = signal<number>(600);

 
  public configStage = computed(() => ({
    width: this.stageWidth(),
    height: this.stageHeight(),
    draggable: this.canvasMode() === 'pan',
    scaleX: this.scale(),
    scaleY: this.scale(),
    clearBeforeDraw: true
  }));

  ngOnInit() {
    console.log('Iniciando carga de salas...');
    this.loadRooms();
    this.updateStageSize();
    window.addEventListener('resize', () => this.updateStageSize());
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
        console.log('Salas recibidas:', rooms);
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
  }

  loadBackgroundImage() {
    const image = new Image();
    image.src = '/media/office_plan.png';
    image.onload = () => {
      this.configImage.set({
        image: image,
        width: this.configStage().width,
        height: this.configStage().height,
        opacity: 0.5
      });
    };
  }

  togglePlan() {
    this.showPlan.update(v => !v);
  }

  loadTables(roomId: string) {
    this.officeService.getTables().subscribe(allTables => {
      console.log('Raw tables from server:', allTables);
     
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

  zoomIn() {
    this.scale.update(s => Math.min(s + 0.1, 3));
  }

  zoomOut() {
    this.scale.update(s => Math.max(s - 0.1, 0.5));
  }

  onTableClick(id: string) {
    if (this.canvasMode() === 'select') {
      this.selectedTableId.set(id);
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

  handleStageMouseDown(event: any) {
   
    const target = event.target || event.evt?.target;
    if (!target) return;

    const stage = target.getStage();
    if (target === stage || target.getParent()?.nodeType === 'Layer') {
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

    console.log(`Mesa ${table.nombreMesa} arrastrada a:`, { newX, newY });

   
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
    
   
    node.scaleX(1);
    node.scaleY(1);

    this.updateTableSize(table.id, newWidth, newHeight);
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

    if (confirm('¿Estás seguro de que deseas eliminar esta mesa?')) {
      this.isSaving.set(true);
      this.officeService.deleteTable(id).subscribe(() => {
        this.tables.update(current => current.filter(t => t.id !== id));
        this.isSaving.set(false);
        this.selectedTableId.set(null);
        this.updateTransformer();
      });
    }
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
    console.log('Guardando diseño. Leyendo posiciones directamente del canvas...');
    
    this.isSaving.set(true);
    const saveObservables = tables.map(table => {
     
      const node = stage.findOne('.group-' + table.id);
      
      let x = table.posX;
      let y = table.posY;

      if (node) {
        x = Math.round(node.x());
        y = Math.round(node.y());
        console.log(`Mesa ${table.nombreMesa} detectada en canvas: (${x}, ${y})`);
      } else {
        console.warn(`No se encontró el nodo para la mesa ${table.id} en el canvas`);
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
      next: (results) => {
        console.log('Resultados del guardado:', results);
        this.isSaving.set(false);
        alert('¡Diseño guardado con éxito!');
      },
      error: (error) => {
        console.error('Error masivo al guardar:', error);
        this.isSaving.set(false);
        alert('Error al guardar el diseño: ' + (error.error?.message || error.message));
      }
    });
  }

 
  getGroupConfig(table: Mesa) {
    return {
      id: table.id,
      name: 'group-' + table.id,
      x: this.getTableX(table),
      y: this.getTableY(table),
      draggable: this.canvasMode() === 'select'
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
    return {
      x: 0,
      y: largo / 2 - 7,
      text: table.nombreMesa || (table as any).nombre_mesa || 'Mesa',
      fontSize: 11,
      fontFamily: 'Inter, sans-serif',
      fill: '#1e293b',
      width: ancho,
      align: 'center',
      fontStyle: '600'
    };
  }
}
