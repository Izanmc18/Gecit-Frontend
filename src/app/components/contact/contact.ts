import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../ui/navbar/navbar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class ContactComponent {}
