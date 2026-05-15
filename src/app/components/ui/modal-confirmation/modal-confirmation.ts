import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="show" (click)="onCancel()">
      <div class="modal-card animate-scale-in" (click)="$event.stopPropagation()">
        <div class="modal-header" [ngClass]="type">
          <div class="icon-wrapper">
            <i [class]="getIcon()"></i>
          </div>
        </div>
        
        <div class="modal-body text-center">
          <h3 class="modal-title">{{ title }}</h3>
          <p class="modal-message text-muted">{{ message }}</p>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" (click)="onCancel()">{{ cancelText }}</button>
          <button class="btn-confirm" [ngClass]="type" (click)="onConfirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .modal-card {
      background: white;
      border-radius: 1.5rem;
      width: 90%;
      max-width: 400px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      padding: 2.5rem 0 1.5rem;
      display: flex;
      justify-content: center;
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }

    .modal-header.danger .icon-wrapper {
      background: #fef2f2;
      color: #ef4444;
    }

    .modal-header.warning .icon-wrapper {
      background: #fffbeb;
      color: #f59e0b;
    }

    .modal-header.info .icon-wrapper {
      background: #eff6ff;
      color: #3b82f6;
    }

    .modal-body {
      padding: 0 2rem 2rem;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }

    .modal-message {
      font-size: 1rem;
      line-height: 1.6;
    }

    .modal-footer {
      padding: 1.5rem 2rem 2rem;
      display: flex;
      gap: 1rem;
    }

    .btn-cancel {
      flex: 1;
      padding: 0.875rem;
      border: 1px solid #e2e8f0;
      background: white;
      color: #64748b;
      border-radius: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .btn-confirm {
      flex: 1;
      padding: 0.875rem;
      border: none;
      color: white;
      border-radius: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .btn-confirm.danger { background: #ef4444; }
    .btn-confirm.danger:hover { background: #dc2626; transform: translateY(-2px); }

    .btn-confirm.warning { background: #f59e0b; }
    .btn-confirm.warning:hover { background: #d97706; transform: translateY(-2px); }

    .btn-confirm.info { background: #3b82f6; }
    .btn-confirm.info:hover { background: #2563eb; transform: translateY(-2px); }

    .animate-scale-in {
      animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ModalConfirmationComponent {
  @Input() show: boolean = false;
  @Input() title: string = '¿Estás seguro?';
  @Input() message: string = 'Esta acción no se puede deshacer.';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  getIcon(): string {
    switch (this.type) {
      case 'danger': return 'bi bi-trash3-fill';
      case 'warning': return 'bi bi-exclamation-triangle-fill';
      case 'info': return 'bi bi-info-circle-fill';
      default: return 'bi bi-question-circle-fill';
    }
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
