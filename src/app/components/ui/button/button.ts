import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'inverted' | 'outlined' | 'label';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
  styleUrls: ['./button.css']
})
export class Button {
  @Input() variant: ButtonVariant = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() customClass: string = '';

  get computedClasses(): string {
    let variantClass = '';
    switch (this.variant) {
      case 'primary':
        variantClass = 'btn-primary';
        break;
      case 'secondary':
        variantClass = 'btn-secondary'; 
        break;
      case 'inverted':
        variantClass = 'btn-inverted';
        break;
      case 'outlined':
        variantClass = 'btn-outlined';
        break;
      case 'label':
        variantClass = 'btn-label'; 
        break;
    }
    return `btn-gecit ${variantClass} ${this.customClass}`;
  }

  onClick(event: Event) {
    
  }
}
