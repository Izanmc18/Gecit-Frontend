import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../ui/navbar/navbar';
import { FooterComponent } from '../../footer/footer';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './terms.html',
  styleUrl: './terms.css'
})
export class TermsComponent {}
