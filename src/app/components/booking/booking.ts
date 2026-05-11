import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { Tramite } from '../../models/booking.model';
import { LogoComponent } from '../ui/logo/logo';
import { InputField } from '../ui/input/input';
import { RegisterRequest } from '../../models/auth.model';

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
  imports: [CommonModule, ReactiveFormsModule, LogoComponent, InputField],
  templateUrl: './booking.html',
  styleUrls: ['./booking.css']
})
export class Booking implements OnInit {
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  public authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  idEntidad = signal<string | null>(null);
  entidadName = signal<string>('');
  entidadNotFound = signal<boolean>(false);
  isLoadingEntidad = signal<boolean>(true);

  bookingForm = this.fb.group({
    idEntidad: ['', Validators.required],
    idTramite: ['', Validators.required],
    clienteNombre: ['', Validators.required],
    clienteApellidos: ['', Validators.required],
    clienteDni: ['', [Validators.required, dniValidator()]],
    clienteEmail: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    clienteTelefono: ['', [Validators.required, Validators.pattern(/^[67][0-9]{8}$/)]]
  });

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  registerForm = this.fb.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    dni: ['', [Validators.required, dniValidator()]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: ['', [Validators.required, Validators.pattern(/^[67][0-9]{8}$/)]]
  });

  tramites = signal<Tramite[]>([]);
  availableSlots = signal<string[]>([]);
  selectedDate = signal<string>('');
  selectedTime = signal<string>('');
  today = new Date().toISOString().split('T')[0];
  step = signal<number>(1);
  authMode = signal<'guest' | 'login' | 'register'>('guest');
  authError = signal<string>('');
  isAuthLoading = signal<boolean>(false);

  isAuthorized = signal<boolean>(true);

  ngOnInit() {
    this.checkRole();
    this.checkInitialAuth();
    
    this.route.paramMap.subscribe(params => {
      const domain = params.get('domain');
      if (domain) {
        this.loadEntityByDomain(domain);
      } else {
        this.entidadNotFound.set(true);
        this.isLoadingEntidad.set(false);
      }
    });
  }

  loadEntityByDomain(domain: string) {
    this.isLoadingEntidad.set(true);
    this.bookingService.getEntityByDomain(domain).subscribe({
      next: (entidad) => {
        this.idEntidad.set(entidad.id);
        this.entidadName.set(entidad.nombre);
        this.bookingForm.get('idEntidad')?.setValue(entidad.id);
        this.isLoadingEntidad.set(false);
        this.cdr.detectChanges();
        this.loadTramites();
      },
      error: () => {
        this.entidadNotFound.set(true);
        this.isLoadingEntidad.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private checkRole() {
    const user = this.authService.currentUser();
    if (user) {
      const allowedRoles = ['e51b3a32-3333-4a3b-9a99-b1d5c7f8a123'];
      if (!allowedRoles.includes(user.idRol)) {
        this.isAuthorized.set(false);
      }
    }
  }

  private checkInitialAuth() {
    const user = this.authService.currentUser();
    if (user && this.isAuthorized()) {
      this.fillFormFromUser(user);
    }
  }

  loadTramites() {
    const id = this.idEntidad();
    if (!id) return;
    this.bookingService.getTramites(id).subscribe({
      next: (data: Tramite[]) => {
        this.tramites.set(data);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando trámites', err)
    });
  }

  onDateSelected(date: string) {
    this.selectedDate.set(date);
    this.selectedTime.set('');
    this.loadSlots();
  }

  loadSlots() {
    const idTramite = this.bookingForm.get('idTramite')?.value;
    const date = this.selectedDate();
    const idEntidad = this.idEntidad();
    if (idTramite && date && idEntidad) {
      this.bookingService.getSlots(idEntidad, idTramite, date).subscribe({
        next: (slots) => {
          this.availableSlots.set(slots);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error cargando huecos', err)
      });
    }
  }

  selectTime(time: string) {
    this.selectedTime.set(time);
  }

  setStep(n: number) {
    this.step.set(n);
    this.cdr.detectChanges();
  }

  nextStep() {
    const currentStep = this.step();
    if (currentStep === 1 && this.bookingForm.get('idTramite')?.valid) {
      this.setStep(2);
    } else if (currentStep === 2 && this.selectedDate() && this.selectedTime()) {
      this.setStep(3);
    }
  }

  setAuthMode(mode: 'guest' | 'login' | 'register') {
    this.authMode.set(mode);
    this.authError.set('');
  }

  onLoginSubmit() {
    if (this.loginForm.invalid) return;
    this.isAuthLoading.set(true);
    this.authError.set('');
    
    this.authService.login(this.loginForm.value as any).subscribe({
      next: (res: any) => {
        this.fillFormFromUser(res.user);
        this.isAuthLoading.set(false);
        
        const userRole = res.user.idRol;
        const employeeRoles = [
          'e51b3a32-1111-4a3b-9a99-b1d5c7f8a121',
          'e51b3a32-2222-4a3b-9a99-b1d5c7f8a122'
        ];

        if (employeeRoles.includes(userRole)) {
          this.router.navigate(['/dashboard-employees']);
        } else {
          this.setAuthMode('guest');
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.authError.set(err.message);
        this.isAuthLoading.set(false);
      }
    });
  }

  onRegisterSubmit() {
    if (this.registerForm.invalid) return;
    this.isAuthLoading.set(true);
    this.authError.set('');

    this.authService.register(this.registerForm.value as any).subscribe({
      next: (res: any) => {
        this.fillFormFromUser(res.user);
        this.isAuthLoading.set(false);
        this.setAuthMode('guest');
      },
      error: (err: any) => {
        this.authError.set(err.message);
        this.isAuthLoading.set(false);
      }
    });
  }

  fillFormFromUser(user: any) {
    this.bookingForm.patchValue({
      clienteNombre: user.nombre,
      clienteApellidos: user.apellidos,
      clienteDni: user.dni || '',
      clienteEmail: user.email,
      clienteTelefono: user.telefono || ''
    });
  }

  submitBooking() {
    if (this.bookingForm.valid && this.selectedDate() && this.selectedTime()) {
      this.step.set(4);
    }
  }

  resetForm() {
    this.bookingForm.reset({
      idEntidad: this.idEntidad(),
      idTramite: '',
      clienteNombre: '',
      clienteApellidos: '',
      clienteDni: '',
      clienteEmail: '',
      clienteTelefono: ''
    });
    this.selectedDate.set('');
    this.selectedTime.set('');
    this.availableSlots.set([]);
    this.step.set(1);
    this.cdr.detectChanges();
  }
}
