import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cita, EstadoCita, EstadoTurno } from '../../../models';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-detail.html',
  styleUrls: ['./appointment-detail.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentDetailComponent {
  @Input() cita: Cita | null = null;
  @Input() show: boolean = false;
  @Input() isAdmin: boolean = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<{ cita: Cita, status: string }>();
  @Output() callClient = new EventEmitter<Cita>();
  @Output() attendClient = new EventEmitter<Cita>();

  closeModal() {
    this.close.emit();
  }

  updateStatus(status: string) {
    if (this.cita) {
      this.statusChange.emit({ cita: this.cita, status });
      this.closeModal();
    }
  }

  onCall() {
    if (this.cita) {
      this.callClient.emit(this.cita);
      this.closeModal();
    }
  }

  onAttend() {
    if (this.cita) {
      this.attendClient.emit(this.cita);
      this.closeModal();
    }
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
}
