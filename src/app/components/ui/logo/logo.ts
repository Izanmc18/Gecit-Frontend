import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.html',
  styleUrls: ['./logo.css']
})
export class LogoComponent {
  @Input() size: number = 180;
  @Input() grayscale: boolean = false;
  @Input() customClass: string = '';
}
