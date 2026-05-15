import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { TurnManagementService } from '../../services/turn-management.service';
import { LogoComponent } from '../ui/logo/logo';
import { dniValidator } from '../booking/booking';

@Component({
  selector: 'app-kiosk',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LogoComponent],
  templateUrl: './kiosk.html',
  styleUrls: ['./kiosk.css']
})
export class KioskComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private turnService = inject(TurnManagementService);
  private fb = inject(FormBuilder);

  slug = signal<string>('');
  entidadName = signal<string>('GECIT');
  idEntidad = signal<string>('');
  
  dniValue = signal<string>('');
  keyboardMode = signal<'numeric' | 'alpha'>('numeric');
  
  errorMsg = signal<string>('');
  isSuccess = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  currentTime = new Date(); // Añadir para el footer del kiosko

  private readonly alphaKeys = ['T', 'R', 'W', 'A', 'G', 'M', 'Y', 'F', 'P', 'D', 'X', 'B', 'N', 'J', 'Z', 'S', 'Q', 'V', 'H', 'L', 'C', 'K', 'E'];
  private readonly numericKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  ngOnInit() {
    this.slug.set(this.route.snapshot.paramMap.get('slug') || '');
    if (this.slug()) {
      this.loadEntity();
    }
  }

  loadEntity() {
    this.bookingService.getEntityByDomain(this.slug()).subscribe({
      next: (entidad) => {
        this.entidadName.set(entidad.nombre);
        this.idEntidad.set(entidad.id);
      },
      error: (err) => console.error('Error cargando entidad:', err)
    });
  }

  onKeyPress(key: string) {
    if (this.dniValue().length < 9) {
      this.dniValue.set(this.dniValue() + key);
      this.errorMsg.set('');
    }
  }

  onDelete() {
    this.dniValue.set(this.dniValue().slice(0, -1));
    this.errorMsg.set('');
  }

  toggleKeyboard() {
    this.keyboardMode.set(this.keyboardMode() === 'numeric' ? 'alpha' : 'numeric');
  }

  get currentKeys() {
    return this.keyboardMode() === 'numeric' ? this.numericKeys : this.alphaKeys;
  }

  confirmarLlegada() {
    const dni = this.dniValue();
    if (!dni) {
      this.errorMsg.set('Por favor, introduce tu DNI');
      return;
    }

    if (dni.length < 9) {
      this.errorMsg.set('DNI incompleto');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set('');

    this.turnService.checkIn(this.idEntidad(), dni).subscribe({
      next: (res) => {
        this.isSuccess.set(true);
        this.isLoading.set(false);
        setTimeout(() => this.resetKiosk(), 5000);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'No se encontró ninguna cita para hoy con ese DNI');
        this.isLoading.set(false);
      }
    });
  }

  resetKiosk() {
    this.dniValue.set('');
    this.isSuccess.set(false);
    this.errorMsg.set('');
    this.keyboardMode.set('numeric');
  }
}
