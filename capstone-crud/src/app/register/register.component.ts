import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { RegisterService } from '../services/register.service';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterModule],
})
export class RegisterComponent implements OnInit {
  public registerForm!: FormGroup;
  public isRegistering: boolean = false;

  constructor(
    private registerService: RegisterService,
    private router: Router,
  ) {}

  ngOnInit() {
    const today = new Date();
    const minDateString = today.toISOString().split('T')[0];

    this.registerForm = new FormGroup({
      FirstName: new FormControl('', Validators.required),
      LastName: new FormControl('', Validators.required),
      Birthdate: new FormControl('', [
        Validators.required,
        this.validateBirthday(),
      ]),
      StudentNum: new FormControl('', [
        Validators.required,
        Validators.maxLength(8), 
        Validators.pattern("^[0-9]*$")
      ])
    });
  }

  validateName() {
    const nameControl = this.registerForm.get('FirstName');
    if (!nameControl?.value) return;
  
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (!nameRegex.test(nameControl.value)) {
      alert('Please enter a valid name (only letters and spaces)');
      nameControl.setErrors({ invalidName: true });
    } else {
      nameControl.setErrors(null);
    }
  }

  onStudentNumInput(event: any) {
    let input = event.target.value;
    input = input.replace(/[^\d]/g, '');
    if (input.length > 8) {
      alert('Please enter only 8 digits for the student number.');
      input = input.slice(0, 8);
    }
    this.registerForm.get('StudentNum')!.setValue(input);
  }

  validateBirthday(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const selectedDate = new Date(control.value);
      const today = new Date();
      const minDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      ); // Calculate the minimum date for 18 years old

      if (selectedDate > today || selectedDate >= minDate) {
        return { invalidBirthday: true };
      }

      return null;
    };
  }


  onSubmit() {
    this.validateName();
    if (this.registerForm.invalid) {
      alert('Please fill in all required fields.');
      return;
    }
  
    const FirstName = this.registerForm.get('FirstName')!.value;
    const LastName = this.registerForm.get('LastName')!.value;
    const Birthdate = this.registerForm.get('Birthdate')!.value;
    const StudentNum = this.registerForm.get('StudentNum')!.value;
  
    const UserName = StudentNum;
    const Password = this.formatPassword(Birthdate);
  
    this.registerService.checkStudentNumber(StudentNum).subscribe(
      (isRegistered) => {
        if (isRegistered) {
          alert('Student number is already registered.');
        } else {
          this.isRegistering = true;
          this.registerService
            .register(
              UserName,
              Password,
              FirstName,
              LastName,
              Birthdate,
              StudentNum
            )
            .subscribe(
              (response) => {
                // Redirect to login page
                this.router.navigate(['login']).then(() => {
                  // Once redirected to login, show the registration note
                  alert('Registration successful! \nNote: Change your PASSWORD on login to secure your account!');
                });
              },
              (error) => {
                console.error('Registration error:', error);
              }
            )
            .add(() => {
              this.isRegistering = false;
            });
        }
      },
      (error) => {
        console.error('Error checking student number:', error);
      }
    );
  }

  private formatPassword(birthdate: string): string {
    const dateParts = birthdate.split('-');
    const month = dateParts[1];
    const day = dateParts[2];
    const year = dateParts[0];
    return month + day + year;
  }
}
