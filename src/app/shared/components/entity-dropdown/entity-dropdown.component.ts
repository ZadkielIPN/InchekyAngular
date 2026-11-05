import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  forwardRef,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface EntityDropdownOption {
  id: number;
  label: string;
  secondary?: string;
  icon?: string;
}

@Component({
  selector: 'app-entity-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EntityDropdownComponent),
      multi: true,
    },
  ],
})
export class EntityDropdownComponent implements ControlValueAccessor {
  @Input() options: EntityDropdownOption[] = [];
  @Input() placeholder = 'Selecciona una opción';
  @Input() searchPlaceholder = 'Filtrar por nombre...';
  @Input() multiple = false;
  @Input() icon = 'bi-list';

  readonly open = signal(false);
  readonly query = signal('');
  readonly disabled = signal(false);
  value: number | number[] | null = null;

  private onChange: (value: number | number[] | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  get selectedIds(): number[] {
    if (Array.isArray(this.value)) return this.value;
    return this.value === null ? [] : [this.value];
  }

  get selectedOptions(): EntityDropdownOption[] {
    const ids = new Set(this.selectedIds);
    return this.options.filter((option) => ids.has(option.id));
  }

  get filteredOptions(): EntityDropdownOption[] {
    const normalized = this.query().trim().toLocaleLowerCase();
    if (!normalized) return this.options;
    return this.options.filter((option) =>
      `${option.label} ${option.secondary ?? ''}`.toLocaleLowerCase().includes(normalized),
    );
  }

  toggle() {
    if (this.disabled()) return;
    this.open.update((value) => !value);
    if (this.open()) this.onTouched();
  }

  select(option: EntityDropdownOption) {
    if (this.multiple) {
      const ids = new Set(this.selectedIds);
      if (ids.has(option.id)) ids.delete(option.id);
      else ids.add(option.id);
      this.value = [...ids];
    } else {
      this.value = option.id;
      this.open.set(false);
      this.query.set('');
    }
    this.onChange(this.value);
  }

  remove(id: number, event: Event) {
    event.stopPropagation();
    if (!this.multiple) {
      this.clear();
      return;
    }
    this.value = this.selectedIds.filter((selectedId) => selectedId !== id);
    this.onChange(this.value);
  }

  clear() {
    this.value = this.multiple ? [] : null;
    this.onChange(this.value);
  }

  writeValue(value: number | number[] | null): void {
    this.value = this.multiple
      ? Array.isArray(value) ? value : value === null ? [] : [value]
      : Array.isArray(value) ? value[0] ?? null : value;
  }

  registerOnChange(fn: (value: number | number[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  @HostListener('document:click', ['$event'])
  closeFromOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
