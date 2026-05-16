import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../ui/navbar/navbar';
import { FooterComponent } from '../../footer/footer';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './privacy.html',
  styleUrl: './privacy.css'
})
export class PrivacyComponent {}
