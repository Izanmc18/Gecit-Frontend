import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { Tramite } from '../../models/booking.model';
import { LogoComponent } from '../ui/logo/logo';

export function dniValidator() {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const validChars = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const nifRexp = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    const nieRexp = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    const str = value.toString().toUpperCase().replace(/\s|-/g, '');

    if (!nifRexp.test(str) && !nieRexp.test(str)) return { invalidDni: true };

    let nie = str;
    if (nieRexp.test(str)) {
      nie = nie.replace('X', '0').replace('Y', '1').replace('Z', '2');
    }

    const letter = str.substr(-1);
    const charIndex = parseInt(nie.substr(0, 8), 10) % 23;

    if (validChars.charAt(charIndex) === letter) {
      return null;
    }

    return { invalidDni: true };
  };
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LogoComponent],
  templateUrl: './booking.html',
  styleUrls: ['./booking.css']
})
export class Booking implements OnInit {
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private cdr = inject(ChangeDetectorRef);

  readonly ID_ENTIDAD_DEFAULT = 'a82c4f61-4444-4b5c-8b88-c2e6d8f9b234';

  bookingForm = this.fb.group({
    idEntidad: [this.ID_ENTIDAD_DEFAULT, Validators.required],
    idTramite: ['', Validators.required],
    clienteNombre: ['', Validators.required],
    clienteApellidos: ['', Validators.required],
    clienteDni: ['', [Validators.required, dniValidator()]],
    clienteEmail: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    clienteTelefono: ['', [Validators.required, Validators.pattern(/^[67][0-9]{8}$/)]]
  });

  tramites: Tramite[] = [];
  availableSlots: string[] = [];
  selectedDate: string = '';
  selectedTime: string = '';
  today: string = new Date().toISOString().split('T')[0];
  step = 1;

  ngOnInit() {
    this.loadTramites();
    
    // Forzar detección de cambios al escribir en el formulario (por el modo zoneless)
    this.bookingForm.valueChanges.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  loadTramites() {
    this.bookingService.getTramites(this.ID_ENTIDAD_DEFAULT).subscribe({
      next: (data: Tramite[]) => {
        this.tramites = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando trámites', err)
    });
  }

  onDateSelected(date: string) {
    this.selectedDate = date;
    this.selectedTime = '';
    this.loadSlots();
  }

  loadSlots() {
    const idTramite = this.bookingForm.get('idTramite')?.value;
    if (idTramite && this.selectedDate) {
      this.bookingService.getSlots(this.ID_ENTIDAD_DEFAULT, idTramite, this.selectedDate).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error cargando huecos', err)
      });
    }
  }

  selectTime(time: string) {
    this.selectedTime = time;
    this.cdr.detectChanges();
  }

  setStep(n: number) {
    this.step = n;
    this.cdr.detectChanges();
  }

  nextStep() {
    if (this.step === 1 && this.bookingForm.get('idTramite')?.valid) {
      this.setStep(2);
    } else if (this.step === 2 && this.selectedDate && this.selectedTime) {
      this.setStep(3);
    }
  }

  submitBooking() {
    if (this.bookingForm.valid && this.selectedDate && this.selectedTime) {
      // Por ahora, solo avanzamos al paso 4 (Confirmación visual)
      this.step = 4;
      this.cdr.detectChanges();
      
      // Aquí iría la llamada al backend para crear la cita:
      // const fechaHora = new Date(`${this.selectedDate}T${this.selectedTime}`).toISOString();
      // ... (llamada a this.bookingService.createAppointment)
    }
  }

  resetForm() {
    this.bookingForm.reset({
      idEntidad: this.ID_ENTIDAD_DEFAULT,
      idTramite: '',
      clienteNombre: '',
      clienteApellidos: '',
      clienteDni: '',
      clienteEmail: '',
      clienteTelefono: ''
    });
    this.selectedDate = '';
    this.selectedTime = '';
    this.availableSlots = [];
    this.step = 1;
    this.cdr.detectChanges();
  }
}
