import { Component, EventEmitter, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgForOf, NgIf } from "@angular/common"; // Import NgIf
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subject, takeUntil } from 'rxjs';
import {AuthService} from "../../../../auth/services/auth.service";
import {TooltipModule} from "primeng/tooltip";
import {Role} from "../../../../auth/enum/Role"; // Import Role enum

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
  roles?: Role[]; // Add roles property
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    ButtonModule,
    RippleModule,
    RouterLink,
    RouterLinkActive,
    NgForOf,
    NgIf, // Add NgIf to imports
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  providers: [
    ConfirmationService,
    MessageService
  ]
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() openSidebar = new EventEmitter<void>();

  loading: boolean = false;
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService); // Inject AuthService

  // Define all possible menu items with their associated roles
  allMenuItems: MenuItem[] = [
    { label: 'Metiers', icon: 'pi pi-briefcase', routerLink: '/portail/metiers' },
    { label: 'Candidatures', icon:'pi-id-card',routerLink: '/portail/candidatures' }
  ];

  filteredMenuItems: MenuItem[] = []; // This will hold the menu items visible to the current user

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.filterMenuItems();
    // Subscribe to isAuthenticated$ to re-filter if auth state changes
    this.authService.isAuthenticated$.subscribe(() => {
      this.filterMenuItems();
    });
  }

  private hasRequiredRole(item: MenuItem): boolean {
    // If no roles are specified for the item, it's visible to everyone
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    // Check if the user has at least one of the required roles
    return item.roles.some(role => this.authService.hasRole(role));
  }

  private filterMenuItems(): void {
    this.filteredMenuItems = this.allMenuItems.filter(item => this.hasRequiredRole(item));
  }

  confirmLogout(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      acceptLabel: 'Oui, Déconnexion',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.logout();
      },
      reject: () => {
        this.messageService.add({severity:'info', summary:'Annulé', detail:'La déconnexion a été annulée.'});
      }
    });
  }

  logout() {
    this.loading = true;
    this.authService.logout().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (success) => {
        if (success) {
          this.messageService.add({severity:'success', summary:'Succès', detail:'Vous avez été déconnecté(e) avec succès !'});
        } else {
          this.messageService.add({severity:'error', summary:'Erreur', detail:'Échec de la déconnexion. Veuillez réessayer.'});
        }
      },
      error: (err) => {
        console.error('Logout error:', err);
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Une erreur est survenue lors de la déconnexion.'});
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
