import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  Self,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NgControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  styleUrls: ['./date-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
})
export class DateInputComponent implements OnInit, ControlValueAccessor {
  @Input() label?: string;
  @Input() maxDate?: Date;
  @Input() size?: string;
  bsConfig: Partial<BsDatepickerConfig> | undefined;
  @Input() formControl?: FormControl;
  @Input() customClass: string = '';
  @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor() {}
  ngOnInit() {}

  writeValue(value: any): void {
    console.log('### value', value);
    // this.formControl?.setValue(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onValueChange(value: Date): void {
    this.valueChange.emit(value);
  }
}
