// src/app/candidatures/candidature-form/candidature-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';
import { HttpResponse } from '@angular/common/http';

import { CandidatureService } from '../../services/CandidatureService'; // Adjust path if needed
import { MetierService } from '../../../metier/services/MetierService'; // Adjust path if needed
import { CandidatureRequest } from '../../dtos/CandidatureRequest'; // Adjust path if needed
import { MetierResponse } from '../../../metier/dtos/MetierResponse'; // Adjust path if needed
import { CandidatureResponse } from '../../dtos/CandidatureResponse'; // Adjust path if needed

// PrimeNG Modules for UI
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { InputMaskModule } from 'primeng/inputmask';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar'; // Import CalendarModule for date input

@Component({
  selector: 'app-candidature-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
    FileUploadModule,
    InputMaskModule,
    TooltipModule,
    CalendarModule // Add CalendarModule to imports
  ],
  templateUrl: './candidature-form.component.html',
  styleUrls: ['./candidature-form.component.scss'],
  providers: [MessageService]
})
export class CandidatureFormComponent implements OnInit, OnDestroy {
  candidatureForm!: FormGroup;
  isEditMode: boolean = false;
  candidatureId: number | null = null;
  metiers: MetierResponse[] = [];
  selectedCvFile: File | null = null;

  loading: boolean = true;
  candidatureDetails: CandidatureResponse | null = null;

  private _destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public candidatureService: CandidatureService,
    private metierService: MetierService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFormData();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  initializeForm(): void {
    this.candidatureForm = this.fb.group({
      fullName: new FormControl('', [Validators.required ]),
      phoneNumber: new FormControl('',[Validators.required,Validators.pattern(/^\d{10}$/)]),
      metierId: new FormControl(null, Validators.required),
      dateEntretienTelephonique: new FormControl(null)
    });
  }

  loadFormData(): void {
    this.route.paramMap.pipe(takeUntil(this._destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.candidatureId = +id;
        this.isEditMode = true;
      }
    });

    this.metierService.searchMetiers({ page: 0, size: 1000, sortBy: 'metierName', sortDirection: 'asc' })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response) => {
          this.metiers = response.content;
          if (this.isEditMode && this.candidatureId) {
            this.loadCandidatureForEdit(this.candidatureId);
          } else {
            this.loading = false;
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement des métiers.' });
          console.error('Erreur lors du chargement des métiers:', err);
          this.loading = false;
        }
      });
  }

  loadCandidatureForEdit(id: number): void {
    this.candidatureService.getCandidatureById(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (candidature) => {
          this.candidatureDetails = candidature;
          const dateEntretien = candidature.dateEntretienTelephonique ? new Date(candidature.dateEntretienTelephonique) : null;
          this.candidatureForm.patchValue({
            fullName: candidature.fullName,
            phoneNumber: candidature.phoneNumber,
            metierId: candidature.metierId,
            dateEntretienTelephonique: dateEntretien
          });
          this.loading = false;
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement de la candidature pour édition.' });
          console.error('Erreur lors du chargement de la candidature:', err);
          this.loading = false;
          this.router.navigate(['/portail/candidatures']);
        }
      });
  }

  onCvFileSelect(event: any): void {
    this.selectedCvFile = event.files && event.files.length > 0 ? event.files[0] : null;
  }

  onCvFileRemove(): void {
    this.selectedCvFile = null;
  }

  onSubmit(): void {
    if (this.candidatureForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez corriger les erreurs du formulaire.' });
      this.candidatureForm.markAllAsTouched();
      return;
    }

    const formValue = this.candidatureForm.value;
    const request: CandidatureRequest = {
      ...formValue,
      dateEntretienTelephonique: formValue.dateEntretienTelephonique ? (formValue.dateEntretienTelephonique as Date).toISOString() : undefined
    };

    if (this.isEditMode && this.candidatureId) {
      this.candidatureService.updateCandidature(this.candidatureId, request, this.selectedCvFile || undefined)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Candidature mise à jour avec succès.' });
            this.loadCandidatureForEdit(this.candidatureId!);
            this.selectedCvFile = null;
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour de la candidature.' });
            console.error('Erreur lors de la mise à jour de la candidature:', err);
          }
        });
    } else {
      if (!this.selectedCvFile) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez joindre un CV pour la nouvelle candidature.' });
        return;
      }

      this.candidatureService.createCandidature(request, this.selectedCvFile)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Candidature créée avec succès.' });
            this.router.navigate(['/portail/candidatures']);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la création de la candidature.' });
            console.error('Erreur lors de la création de la candidature:', err);
          }
        });
    }
  }

  downloadFile(downloadObservable: Observable<HttpResponse<Blob>>, defaultFilenamePrefix: string): void {
    if (!this.candidatureId) {
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'ID de candidature manquant pour le téléchargement.' });
      return;
    }

    downloadObservable.pipe(takeUntil(this._destroy$)).subscribe({
      next: (response: HttpResponse<Blob>) => {
        const filename = this.getFilenameFromContentDisposition(
          response.headers.get('Content-Disposition'),
          `${defaultFilenamePrefix}${this.candidatureId}`
        );
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

        if (response.body) {
          this.saveFile(response.body, filename, contentType);
          this.messageService.add({ severity: 'success', summary: 'Téléchargement', detail: 'Fichier téléchargé avec succès.' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le contenu du fichier est vide.' });
        }
      },
      error: (err: any) => {
        const errorMessage = err.error?.message || err.message || 'Une erreur inconnue est survenue.';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Échec du téléchargement du fichier: ${errorMessage}` });
        console.error('Error downloading file:', err);
      }
    });
  }

  deleteCvReport(): void {
    if (this.candidatureId) {
      this.candidatureService.deleteCv(this.candidatureId)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'CV supprimé.' });
            this.loadCandidatureForEdit(this.candidatureId!);
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la suppression du CV.' });
            console.error(err);
          }
        });
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'ID de candidature manquant pour la suppression du CV.' });
    }
  }

  private getFilenameFromContentDisposition(contentDispositionHeader: string | null, defaultFilename: string): string {
    if (contentDispositionHeader) {
      const filenameMatch = /filename="?([^"]+)"?/.exec(contentDispositionHeader);
      if (filenameMatch && filenameMatch[1]) {
        try {
          return decodeURIComponent(filenameMatch[1]);
        } catch (e) {
          console.warn('Failed to decode filename from Content-Disposition, using raw value:', filenameMatch[1]);
          return filenameMatch[1];
        }
      }
    }
    return defaultFilename;
  }

  private saveFile(blobData: Blob, filename: string, contentType: string): void {
    const blob = new Blob([blobData], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  get f() {
    return this.candidatureForm.controls;
  }

  goBack(): void {
    if (this.isEditMode && this.candidatureId) {
      this.router.navigate(['/portail/candidatures', this.candidatureId]);
    } else {
      this.router.navigate(['/portail/candidatures']);
    }
  }
}
