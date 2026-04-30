import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
        
        const userRole = response.user.idRol;
        const employeeRoles = [
          'e51b3a32-1111-4a3b-9a99-b1d5c7f8a121', // Admin
          'e51b3a32-2222-4a3b-9a99-b1d5c7f8a122'  // Empleado
        ];

        if (employeeRoles.includes(userRole)) {
          this.router.navigate(['/dashboard-employees']);
        } else {
          // Si es cliente o particular, lo llevamos al portal de reservas
          this.router.navigate(['/booking']);
        }
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
