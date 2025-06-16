import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials } from '../../dto/LoginCredentials';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { MessageService } from 'primeng/api';
import {Router} from "@angular/router";
import {Role} from "../../enum/Role";


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    InputGroupModule,
    InputGroupAddonModule,

  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  passwordVisible: boolean = false;
  passwordInputType: string = 'password';
  private messageService = inject(MessageService);

  loginForm!: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login(): void {
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    this.isLoading = true;

    const credentials: LoginCredentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Connexion réussie !',life: 3000 });
        this.router.navigate(['/portail/candidatures']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Identifiants incorrects';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Identifiants incorrects.' });
        console.error('Login error:', error);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
    this.passwordInputType = this.passwordVisible ? 'text' : 'password';
  }
}
