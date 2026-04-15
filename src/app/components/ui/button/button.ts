import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'inverted' | 'outlined' | 'label';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
})
export class Button {
  variant = input<ButtonVariant>('primary');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  customClass = input<string>('');

  baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-4 py-2';

  computedClasses = computed(() => {
    let variantClass = '';
    switch (this.variant()) {
      case 'primary':
        variantClass = 'bg-primary text-white hover:opacity-90 shadow-sm';
        break;
      case 'secondary':
        variantClass = 'bg-neutral text-gray-900 border border-gray-200 hover:bg-gray-100'; 
        break;
      case 'inverted':
        variantClass = 'bg-gray-800 text-white hover:bg-gray-900 shadow-sm';
        break;
      case 'outlined':
        variantClass = 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900';
        break;
      case 'label':
        variantClass = 'bg-primary text-white hover:opacity-90 shadow-sm px-6 rounded-lg'; 
        break;
    }
    return `${this.baseClasses} ${variantClass} ${this.customClass()}`;
  });

  onClick(event: Event) {
    // Basic propagation
  }
}
