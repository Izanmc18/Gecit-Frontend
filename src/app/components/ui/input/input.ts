import { Component, Input, forwardRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputField),
      multi: true
    }
  ],
  templateUrl: './input.html',
  styleUrls: ['./input.css']
})
export class InputField implements ControlValueAccessor {
  private cdr = inject(ChangeDetectorRef);
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() error: string | null = null;
  @Input() hasIconLeft: boolean = false;
  @Input() hasIconRight: boolean = false;
  @Input() customClass: string = '';

  value: string = '';
  isDisabled: boolean = false;
  passwordVisible: boolean = false;

  get actualType(): string {
    if (this.type === 'password') {
      return this.passwordVisible ? 'text' : 'password';
    }
    return this.type;
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
    this.cdr.detectChanges();
  }

  onChange: any = () => {};
  onTouched: any = () => {};

  onInputChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
    this.cdr.detectChanges();
  }

  writeValue(value: any): void {
    if (value !== undefined) {
      this.value = value;
      this.cdr.detectChanges();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
