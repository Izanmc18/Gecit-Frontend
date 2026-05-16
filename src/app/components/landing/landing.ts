import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LogoComponent } from '../ui/logo/logo';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent, FooterComponent],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class LandingComponent {
  private router = inject(Router);

  goToLogin() {
    this.router.navigate(['/login']);
  }

  contactExpert() {
    window.location.href = 'mailto:admin@innovasur.com?subject=Información sobre GECIT';
  }

  requestDemo() {
    window.location.href = 'mailto:admin@innovasur.com?subject=Solicitud de Demo GECIT';
  }
}
