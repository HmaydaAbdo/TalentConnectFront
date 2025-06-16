// src/app/pages/candidature/candidature-list/candidature-list.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ConfirmationService, MessageService, SortEvent } from 'primeng/api';
import { Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';

import { CandidatureResponse } from '../../dtos/CandidatureResponse';
import { CandidatureStatus } from '../../enums/CandidatureStatus'; // Ensure this is the updated enum
import { CandidatureCriteria } from '../../dtos/CandidatureCriteria';
import { CandidatureService } from '../../services/CandidatureService';
import { MetierService } from '../../../metier/services/MetierService';
import { MetierResponse } from '../../../metier/dtos/MetierResponse';

import {TableLazyLoadEvent, TableModule} from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PageResponse } from "../../../global/types/PageResponse";
import { CommonModule } from "@angular/common";
import { CalendarModule } from 'primeng/calendar'; // Import CalendarModule for date picker
import {DatePipe} from "@angular/common"; // Import DatePipe for formatting

@Component({
  selector: 'app-candidature-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    CalendarModule // Add CalendarModule here
  ],
  templateUrl: './candidature-list.component.html',
  styleUrls: ['./candidature-list.component.scss'],
  providers: [
    ConfirmationService,
    MessageService,
    CandidatureService,
    MetierService,
    DatePipe // Provide DatePipe
  ]
})
export class CandidatureListComponent implements OnInit, OnDestroy {

  candidatures: CandidatureResponse[] = [];
  totalRecords: number = 0;
  loading: boolean = true;

  criteriaForm: FormGroup;
  private _destroy$ = new Subject<void>();

  page: number = 0;
  size: number = 10;
  sortBy: string = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  statuses: { label: string; value: CandidatureStatus | null }[] = [];
  metiers: MetierResponse[] = [];

  readonly CandidatureStatus = CandidatureStatus;

  constructor(
    private fb: FormBuilder,
    private candidatureService: CandidatureService,
    private metierService: MetierService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    private datePipe: DatePipe // Inject DatePipe
  ) {
    this.criteriaForm = this.fb.group({
      fullName: new FormControl(''),
      phoneNumber: new FormControl(''),
      metierId: new FormControl(null),
      status: new FormControl(null),
      dateEntretienTelephonique: new FormControl(null) // NEW: Add date filter control
    });

    // --- UPDATED STATUSES FOR FRENCH ENUM ---
    this.statuses = [
      { label: 'Tous les Statuts', value: null },
      { label: 'Entretien Téléphonique Planifié', value: CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE },
      { label: '1er Entretien Physique Planifié', value: CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE },
      { label: '2ème Entretien Physique Planifié', value: CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE },
      { label: 'Embauché', value: CandidatureStatus.EMBAUCHE },
      { label: 'Rejeté', value: CandidatureStatus.REJETE }
    ];
    // --- END UPDATED STATUSES ---
  }

  ngOnInit(): void {
    this.loadMetiers();

    this.criteriaForm.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this._destroy$)
      )
      .subscribe(() => {
        this.page = 0;
        this.loadCandidatures();
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  loadMetiers(): void {
    const metierCriteria = { page: 0, size: 1000, sortBy: 'metierName', sortDirection: 'asc' as 'asc' | 'desc' };
    this.metierService.searchMetiers(metierCriteria)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response: PageResponse<MetierResponse>) => {
          this.metiers = response.content;
          this.loadCandidatures();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement des métiers.' });
          console.error('Erreur lors du chargement des métiers:', err);
          this.loading = false;
        }
      });
  }

  loadCandidatures(): void {
    this.loading = true;
    const formValues = this.criteriaForm.value;

    // Convert Date object from p-calendar to ISO 8601 string for backend
    const dateEntretien = formValues.dateEntretienTelephonique ?
      this.datePipe.transform(formValues.dateEntretienTelephonique, 'yyyy-MM-ddTHH:mm:ss') + 'Z' : // Format for OffsetDateTime (UTC)
      undefined;

    const criteria: CandidatureCriteria = {
      fullName: formValues.fullName || undefined,
      phoneNumber: formValues.phoneNumber || undefined,
      metierId: formValues.metierId || undefined,
      status: formValues.status || undefined,
      dateEntretienTelephonique: dateEntretien, // NEW: Pass the formatted date
      page: this.page,
      size: this.size,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.candidatureService.searchCandidatures(criteria)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response) => {
          this.candidatures = response.content;
          this.totalRecords = response.totalElements;
          this.loading = false;
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement des candidatures.' });
          console.error('Erreur lors du chargement des candidatures:', err);
          this.loading = false;
        }
      });
  }

  onPageChange(event: TableLazyLoadEvent): void {
    this.page = event.first! / event.rows!;
    this.size = event.rows!;
    this.loadCandidatures();
  }

  onSort(event: SortEvent): void {
    if (event.field) {
      this.sortBy = event.field === 'metierName' ? 'metierName' : event.field;
      this.sortDirection = event.order === 1 ? 'asc' : 'desc';
      this.loadCandidatures();
    }
  }

  clearFilters(): void {
    this.criteriaForm.reset({
      fullName: '',
      phoneNumber: '',
      metierId: null,
      status: null,
      dateEntretienTelephonique: null // NEW: Reset date filter
    });
    this.page = 0;
    this.sortBy = 'id';
    this.sortDirection = 'desc';
  }

  viewDetails(id: number): void {
    this.router.navigate(['/portail/candidatures', id]);
  }

  evaluate(id: number): void {
    this.router.navigate([`/portail/candidatures/${id}/evaluate`]);
  }

  addNewCandidature(): void {
    this.router.navigate(['/portail/candidatures/new']);
  }

  downloadCv(candidature: CandidatureResponse): void {
    if (!candidature.id) {
      this.messageService.add({ severity: 'warn', summary: 'Avertissement', detail: 'L\'ID de la candidature est manquant pour télécharger le CV.' });
      return;
    }

    if (!candidature.hasCv) {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Aucun CV n\'est disponible pour cette candidature.' });
      return;
    }

    this.candidatureService.downloadCv(candidature.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          if (response.body) {
            const filename = this.getFilenameFromContentDisposition(
              response.headers.get('Content-Disposition'),
              `CV_${candidature.fullName.replace(/\s/g, '_')}_${candidature.id}`
            );
            const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
            this.saveFile(response.body, filename, contentType);
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'CV téléchargé avec succès.' });
          } else {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le contenu du CV est vide.' });
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléchargement du CV. Il pourrait ne pas exister ou une erreur réseau s\'est produite.' });
          console.error('Erreur lors du téléchargement du CV:', err);
        }
      });
  }

  private getFilenameFromContentDisposition(contentDispositionHeader: string | null, defaultFilename: string): string {
    if (contentDispositionHeader) {
      const filenameMatch = /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\n]*?)['"]?$/.exec(contentDispositionHeader);
      if (filenameMatch && filenameMatch[1]) {
        try {
          return decodeURIComponent(filenameMatch[1].replace(/^UTF-8''/, ''));
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

  deleteCandidature(id: number, fullName: string): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer la candidature de "${fullName}"? Cette action est irréversible.`,
      header: 'Confirmer la Suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
      acceptLabel: 'Oui, Supprimer',
      rejectLabel: 'Non, Annuler',
      accept: () => {
        this.candidatureService.deleteCandidature(id)
          .pipe(takeUntil(this._destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Candidature supprimée avec succès.' });
              this.loadCandidatures();
            },
            error: (err) => {
              this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la suppression de la candidature.' });
              console.error('Erreur lors de la suppression de la candidature:', err);
            }
          });
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Annulé', detail: 'La suppression a été annulée.' });
      }
    });
  }

  getDynamicActionLabel(status: CandidatureStatus): string {
    switch (status) {
      case CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE: // Updated
        return 'appeler le candidat ';
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE: // Updated
        return 'Conduire le 1er entretien physique ';
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE: // Updated
        return 'Conduire Le 2ème entretien physique';
      case CandidatureStatus.EMBAUCHE: // Updated
      case CandidatureStatus.REJETE: // Updated
        return 'Voir Évaluation Finale';
      default:
        return 'Détails';
    }
  }

  handleDynamicAction(candidature: CandidatureResponse): void {
    if (candidature.status === CandidatureStatus.EMBAUCHE || candidature.status === CandidatureStatus.REJETE) { // Updated
      this.viewDetails(candidature.id);
    } else {
      this.evaluate(candidature.id);
    }
  }

  getStatusLabel(status: CandidatureStatus): string {
    const foundStatus = this.statuses.find(s => s.value === status);
    return foundStatus ? foundStatus.label : status.replace(/_/g, ' ');
  }

  getStatusSeverity(status: CandidatureStatus): "info" | "success" | "danger" | "secondary" | "warning" | "contrast" | undefined {
    switch (status) {
      case CandidatureStatus.EMBAUCHE: // Updated
        return 'success';
      case CandidatureStatus.REJETE: // Updated
        return 'danger';
      case CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE: // Updated
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE: // Updated
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE: // Updated
        return 'info';
      default:
        return 'secondary';
    }
  }
}
