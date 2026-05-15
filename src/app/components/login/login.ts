import { Component, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InputField } from '../ui/input/input';
import { Button } from '../ui/button/button';
import { LogoComponent } from '../ui/logo/logo';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputField, Button, LogoComponent, Footer],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';
  showPasswordModal = signal<boolean>(false);
  showRegisterModal = signal<boolean>(false);
  isChangingPassword = false;
  isRegistering = false;
  passwordError = '';
  registerError = '';

  passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  registerForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        
        if (response.requirePasswordChange) {
          this.showPasswordModal.set(true);
          return;
        }

        this.redirectUser(response.user);
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onRegisterSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegistering = true;
    this.registerError = '';
    this.cdr.detectChanges();

    const data = {
      ...this.registerForm.value,
      idRol: 'e51b3a32-3333-4a3b-9a99-b1d5c7f8a123' // Cliente
    };

    this.authService.register(data as any).subscribe({
      next: (response) => {
        this.isRegistering = false;
        this.showRegisterModal.set(false);
        this.redirectUser(response.user);
      },
      error: (error) => {
        this.registerError = error.message;
        this.isRegistering = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPasswordChangeSubmit() {
    if (this.passwordForm.invalid) return;
    
    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden';
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = '';
    
    this.authService.changePassword(newPassword!).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.showPasswordModal.set(false);
        this.redirectUser(this.authService.currentUser()!);
      },
      error: (err) => {
        this.isChangingPassword = false;
        this.passwordError = 'Error al cambiar la contraseña';
      }
    });
  }

  private redirectUser(user: any) {
    const userRole = user.idRol;
    const SUPER_ADMIN_ROLE = 'e51b3a32-0000-4a3b-9a99-b1d5c7f8a120';
    const ADMIN_ROLE = 'e51b3a32-1111-4a3b-9a99-b1d5c7f8a121';
    const EMPLEADO_ROLE = 'e51b3a32-2222-4a3b-9a99-b1d5c7f8a122';

    if (userRole === SUPER_ADMIN_ROLE) {
      this.router.navigate(['/dashboard-super-admin']);
    } else if (userRole === ADMIN_ROLE) {
      this.router.navigate(['/dashboard-admin']);
    } else if (userRole === EMPLEADO_ROLE) {
      this.router.navigate(['/dashboard-employees']);
    } else {
      this.router.navigate(['/dashboard-client']);
    }
  }
}
