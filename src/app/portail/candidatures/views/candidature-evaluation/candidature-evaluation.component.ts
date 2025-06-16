// src/app/pages/candidature-evaluation/candidature-evaluation.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MessageService, SelectItem } from 'primeng/api';
import { HttpResponse } from '@angular/common/http';

import { CandidatureService } from '../../services/CandidatureService';
import { CandidatureResponse } from '../../dtos/CandidatureResponse';
import { CandidatureStatus } from '../../enums/CandidatureStatus'; // Ensure this is the updated enum
import {
  FirstPhysicalInterviewRequest,
  PhoneEvaluationRequest,
  SecondPhysicalInterviewRequest,
  // PlanifierEvaluationTelephoniqueRequest // No longer needed if EN_ATTENTE is removed
} from "../../dtos/steps"; // Ensure 'steps' correctly exports all these DTOs

// PrimeNG Modules for UI
import { CardModule } from 'primeng/card';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from "primeng/tooltip";

@Component({
  selector: 'app-candidature-evaluation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextareaModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
    TagModule,
    FileUploadModule,
    TooltipModule
  ],
  templateUrl: './candidature-evaluation.component.html',
  styleUrls: ['./candidature-evaluation.component.scss'],
  providers: [MessageService]
})
export class CandidatureEvaluationComponent implements OnInit, OnDestroy {
  evaluationForm!: FormGroup;
  candidatureId: number | null = null;
  candidature: CandidatureResponse | null = null;
  loading: boolean = true;
  private _destroy$ = new Subject<void>();

  statusOptions: SelectItem[] = [];

  phoneReportFile: File | null = null;
  firstPhysicalReportFile: File | null = null;
  secondPhysicalReportFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private candidatureService: CandidatureService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.route.paramMap.pipe(takeUntil(this._destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.candidatureId = +id;
        this.loadCandidatureDetails(this.candidatureId);
      } else {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'ID de candidature manquant pour l\'évaluation.' });
        this.loading = false;
        this.router.navigate(['/portail/candidatures']);
      }
    });

    // Subscribe to status changes to apply dynamic validators.
    this.f['status'].valueChanges.pipe(takeUntil(this._destroy$)).subscribe(selectedStatus => {
      if (this.candidature) {
        this.applyDynamicValidators(selectedStatus, this.candidature.status);
      }
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  initializeForm(): void {
    this.evaluationForm = this.fb.group({
      evaluationTelephonique: new FormControl(''),
      dateEntretienTelephonique: new FormControl(null), // Date of the phone interview
      datePremierEntretienPhysique: new FormControl(null), // Date of the first physical interview
      premiereEvaluationPhysique: new FormControl(''),
      dateDeuxiemeEntretienPhysique: new FormControl(null), // Date of the second physical interview
      deuxiemeEvaluationPhysique: new FormControl(''),
      status: new FormControl(null, Validators.required),
    });
  }

  loadCandidatureDetails(id: number): void {
    this.loading = true;
    this.candidatureService.getCandidatureById(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (data) => {
          this.candidature = data;
          this.evaluationForm.patchValue({
            evaluationTelephonique: data.evaluationTelephonique,
            dateEntretienTelephonique: data.dateEntretienTelephonique ? new Date(data.dateEntretienTelephonique) : null,
            datePremierEntretienPhysique: data.datePremierEntretienPhysique ? new Date(data.datePremierEntretienPhysique) : null,
            premiereEvaluationPhysique: data.premiereEvaluationPhysique,
            dateDeuxiemeEntretienPhysique: data.dateDeuxiemeEntretienPhysique ? new Date(data.dateDeuxiemeEntretienPhysique) : null,
            deuxiemeEvaluationPhysique: data.deuxiemeEvaluationPhysique,
          });
          this.generateStatusOptions(data.status);
          this.applyDynamicValidators(null, data.status); // Initial validation application
          this.loading = false;
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement de la candidature pour évaluation.' });
          console.error('Erreur lors du chargement de la candidature:', err);
          this.loading = false;
          this.router.navigate(['/portail/candidatures']);
        }
      });
  }

  /**
   * Generates available status options based on the current candidature status from backend.
   * Only allows transition to the NEXT valid step or REJECTED.
   */
  generateStatusOptions(currentStatus: CandidatureStatus): void {
    const availableOptions = new Set<CandidatureStatus>();

    switch (currentStatus) {
      case CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE:
        availableOptions.add(CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE);
        availableOptions.add(CandidatureStatus.REJETE);
        break;
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE:
        availableOptions.add(CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE);
        availableOptions.add(CandidatureStatus.REJETE);
        break;
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE:
        availableOptions.add(CandidatureStatus.EMBAUCHE);
        availableOptions.add(CandidatureStatus.REJETE);
        break;
      case CandidatureStatus.EMBAUCHE:
      case CandidatureStatus.REJETE:
        // No further status changes if already HIRED or REJECTED
        break;
      default:
        console.warn(`Unexpected current status: ${currentStatus}. No transition options.`);
        break;
    }

    this.statusOptions = Array.from(availableOptions).map(status => ({
      label: this.getStatusLabel(status),
      value: status
    }));

    if (this.isFinalStatus) {
      this.f['status'].disable({ emitEvent: false });
    } else {
      this.f['status'].enable({ emitEvent: false });
    }
  }

  /**
   * Dynamically applies or removes validators based on the *intended new status* from the dropdown,
   * considering the *current actual status* of the candidature.
   */
  applyDynamicValidators(selectedStatusFromDropdown: CandidatureStatus | null, currentCandidatureStatus: CandidatureStatus | undefined): void {
    const evalTel = this.f['evaluationTelephonique'];
    const dateTel = this.f['dateEntretienTelephonique'];
    const datePremEnt = this.f['datePremierEntretienPhysique'];
    const premEvalPhys = this.f['premiereEvaluationPhysique'];
    const dateDeuxEnt = this.f['dateDeuxiemeEntretienPhysique'];
    const deuxEvalPhys = this.f['deuxiemeEvaluationPhysique'];

    // Clear all validators first to prevent accumulation
    [evalTel, dateTel, datePremEnt, premEvalPhys, dateDeuxEnt, deuxEvalPhys].forEach(control => {
      control.clearValidators();
      control.updateValueAndValidity({ emitEvent: false });
    });

    // Disable/Enable fields based on current actual status (what's already done)
    // and what is the *next* step to be completed.
    if (currentCandidatureStatus === CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE) {
      evalTel.enable({ emitEvent: false });
      dateTel.enable({ emitEvent: false }); // Enable for editing/viewing
      datePremEnt.enable({ emitEvent: false });
      premEvalPhys.disable({ emitEvent: false });
      dateDeuxEnt.disable({ emitEvent: false });
      deuxEvalPhys.disable({ emitEvent: false });
    } else if (currentCandidatureStatus === CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE) {
      evalTel.disable({ emitEvent: false });
      dateTel.disable({ emitEvent: false });
      datePremEnt.enable({ emitEvent: false }); // Enable for editing/viewing
      premEvalPhys.enable({ emitEvent: false });
      dateDeuxEnt.enable({ emitEvent: false });
      deuxEvalPhys.disable({ emitEvent: false });
    } else if (currentCandidatureStatus === CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE) {
      evalTel.disable({ emitEvent: false });
      dateTel.disable({ emitEvent: false });
      datePremEnt.disable({ emitEvent: false });
      premEvalPhys.disable({ emitEvent: false });
      dateDeuxEnt.enable({ emitEvent: false }); // Enable for editing/viewing
      deuxEvalPhys.enable({ emitEvent: false });
    } else if (this.isFinalStatus) {
      [evalTel, dateTel, datePremEnt, premEvalPhys, dateDeuxEnt, deuxEvalPhys].forEach(control => {
        control.disable({ emitEvent: false });
      });
    }

    // Apply validators based on the *intended* transition (selected status from dropdown)
    if (selectedStatusFromDropdown) {
      switch (currentCandidatureStatus) {
        case CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE:
          if (selectedStatusFromDropdown === CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE) {
            evalTel.setValidators(Validators.required);
            datePremEnt.setValidators(Validators.required);
          }
          break;
        case CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE:
          if (selectedStatusFromDropdown === CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE) {
            premEvalPhys.setValidators(Validators.required);
            dateDeuxEnt.setValidators(Validators.required);
          }
          break;
        case CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE:
          if (selectedStatusFromDropdown === CandidatureStatus.EMBAUCHE || selectedStatusFromDropdown === CandidatureStatus.REJETE) {
            deuxEvalPhys.setValidators(Validators.required);
          }
          break;
      }
    }

    // Re-evaluate validity for all controls
    [evalTel, dateTel, datePremEnt, premEvalPhys, dateDeuxEnt, deuxEvalPhys].forEach(control => {
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  getStatusLabel(status: CandidatureStatus): string {
    switch (status) {
      case CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE: return 'Entretien Téléphonique Planifié';
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE: return '1er Entretien Physique Planifié';
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE: return '2ème Entretien Physique Planifié';
      case CandidatureStatus.EMBAUCHE: return 'Embauché';
      case CandidatureStatus.REJETE: return 'Rejeté';
      default: return "Inconnu";
    }
  }

  // --- File Handling Methods ---
  onPhoneReportFileSelect(event: any): void {
    this.phoneReportFile = event.files && event.files.length > 0 ? event.files[0] : null;
  }

  onFirstPhysicalReportFileSelect(event: any): void {
    this.firstPhysicalReportFile = event.files && event.files.length > 0 ? event.files[0] : null;
  }

  onSecondPhysicalReportFileSelect(event: any): void {
    this.secondPhysicalReportFile = event.files && event.files.length > 0 ? event.files[0] : null;
  }

  downloadReport(reportType: 'phone' | 'first' | 'second'): void {
    if (!this.candidatureId) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'ID de candidature manquant pour le téléchargement.' });
      return;
    }

    let downloadObservable: Observable<HttpResponse<Blob>> | null = null;
    let defaultFilenamePrefix: string = '';
    let hasReportFlag: boolean = false;

    if (this.candidature) {
      switch (reportType) {
        case 'phone':
          downloadObservable = this.candidatureService.downloadRapportEvaluationTelephonique(this.candidatureId);
          defaultFilenamePrefix = 'rapport_evaluation_telephonique_';
          hasReportFlag = this.candidature.hasRapportEvaluationTelephonique;
          break;
        case 'first':
          downloadObservable = this.candidatureService.downloadRapportPremiereEvaluationPhysique(this.candidatureId);
          defaultFilenamePrefix = 'rapport_premiere_evaluation_physique_';
          hasReportFlag = this.candidature.hasRapportPremiereEvaluationPhysique;
          break;
        case 'second':
          downloadObservable = this.candidatureService.downloadRapportDeuxiemeEvaluationPhysique(this.candidatureId);
          defaultFilenamePrefix = 'rapport_deuxieme_evaluation_physique_';
          hasReportFlag = this.candidature.hasRapportDeuxiemeEvaluationPhysique;
          break;
      }
    }

    if (!hasReportFlag) {
      this.messageService.add({ severity: 'info', summary: 'Information', detail: 'Aucun rapport n\'est disponible pour cette étape.' });
      return;
    }

    if (downloadObservable) {
      downloadObservable.pipe(takeUntil(this._destroy$)).subscribe({
        next: (response: HttpResponse<Blob>) => {
          const filename = this.getFilenameFromContentDisposition(
            response.headers.get('Content-Disposition'),
            `${defaultFilenamePrefix}${this.candidatureId}`
          );
          const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

          if (response.body) {
            this.saveFile(response.body, filename, contentType);
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Rapport téléchargé avec succès.' });
          } else {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le contenu du rapport est vide.' });
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.message || 'Une erreur inconnue est survenue.';
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Échec du téléchargement du rapport: ${errorMessage}` });
          console.error(`Erreur lors du téléchargement du rapport (${reportType}):`, err);
        }
      });
    }
  }

  deleteReport(reportType: 'phone' | 'first' | 'second'): void {
    if (!this.candidatureId) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'ID de candidature manquant pour la suppression.' });
      return;
    }

    let deleteObservable: Observable<void> | null = null;
    let reportName: string = '';
    let hasReportFlag: boolean = false;

    if (this.candidature) {
      switch (reportType) {
        case 'phone':
          deleteObservable = this.candidatureService.deleteRapportEvaluationTelephonique(this.candidatureId);
          reportName = 'téléphonique';
          hasReportFlag = this.candidature.hasRapportEvaluationTelephonique;
          break;
        case 'first':
          deleteObservable = this.candidatureService.deleteRapportPremiereEvaluationPhysique(this.candidatureId);
          reportName = 'première physique';
          hasReportFlag = this.candidature.hasRapportPremiereEvaluationPhysique;
          break;
        case 'second':
          deleteObservable = this.candidatureService.deleteRapportDeuxiemeEvaluationPhysique(this.candidatureId);
          reportName = 'deuxième physique';
          hasReportFlag = this.candidature.hasRapportDeuxiemeEvaluationPhysique;
          break;
      }
    }

    if (!hasReportFlag) {
      this.messageService.add({ severity: 'info', summary: 'Information', detail: 'Aucun rapport n\'est à supprimer pour cette étape.' });
      return;
    }

    if (deleteObservable) {
      deleteObservable.pipe(takeUntil(this._destroy$)).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Rapport d'évaluation ${reportName} supprimé.` });
          this.loadCandidatureDetails(this.candidatureId!);
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.message || 'Une erreur inconnue est survenue.';
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Échec de la suppression du rapport ${reportName}: ${errorMessage}` });
          console.error(`Erreur lors de la suppression du rapport (${reportType}):`, err);
        }
      });
    }
  }

  // --- Submission Logic ---
  onSubmit(): void {

    if (!this.candidatureId || !this.candidature) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'ID de candidature ou données manquantes.' });
      return;
    }

    const currentStatus = this.candidature.status;
    const targetStatus = this.f['status'].value as CandidatureStatus;

    this.applyDynamicValidators(targetStatus, currentStatus);
    this.evaluationForm.markAllAsTouched();

    if (this.evaluationForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez corriger les erreurs du formulaire.' });
      return;
    }

    const formValue = this.evaluationForm.value;
    let serviceCallObservable: Observable<any> | null = null;
    let reportFileToSend: File | undefined;

    switch (currentStatus) {
      case CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE:
        if (targetStatus === CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE) {
          const request: PhoneEvaluationRequest = {
            evaluationTelephonique: formValue.evaluationTelephonique,
            datePremierEntretienPhysique: (formValue.datePremierEntretienPhysique as Date)?.toISOString(),
            dateEntretienTelephonique:(formValue.dateEntretienTelephonique as Date)?.toISOString()
          };
          reportFileToSend = this.phoneReportFile || undefined;
          serviceCallObservable = this.candidatureService.passerEvaluationTelephonique(this.candidatureId, request, reportFileToSend);
        } else if (targetStatus === CandidatureStatus.REJETE) {
          const request: SecondPhysicalInterviewRequest = { // Using this DTO for rejection as a generic approach
            deuxiemeEvaluationPhysique: formValue.evaluationTelephonique, // Use available notes, if any
            finalStatus: targetStatus
          };
          serviceCallObservable = this.candidatureService.validerDeuxiemeEntretienPhysique(this.candidatureId, request, undefined);
        }
        break;

      case CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE:
        if (targetStatus === CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE) {
          const request: FirstPhysicalInterviewRequest = {
            premiereEvaluationPhysique: formValue.premiereEvaluationPhysique,
            dateDeuxiemeEntretienPhysique: (formValue.dateDeuxiemeEntretienPhysique as Date)?.toISOString()
          };
          reportFileToSend = this.firstPhysicalReportFile || undefined;
          serviceCallObservable = this.candidatureService.validerPremierEntretienPhysique(this.candidatureId, request, reportFileToSend);
        } else if (targetStatus === CandidatureStatus.REJETE) {
          const request: SecondPhysicalInterviewRequest = {
            deuxiemeEvaluationPhysique: formValue.premiereEvaluationPhysique,
            finalStatus: targetStatus
          };
          serviceCallObservable = this.candidatureService.validerDeuxiemeEntretienPhysique(this.candidatureId, request, undefined);
        }
        break;

      case CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE:
        if (targetStatus === CandidatureStatus.EMBAUCHE || targetStatus === CandidatureStatus.REJETE) {
          const request: SecondPhysicalInterviewRequest = {
            deuxiemeEvaluationPhysique: formValue.deuxiemeEvaluationPhysique,
            finalStatus: targetStatus
          };
          reportFileToSend = this.secondPhysicalReportFile || undefined;
          serviceCallObservable = this.candidatureService.validerDeuxiemeEntretienPhysique(this.candidatureId, request, reportFileToSend);
        }
        break;

      default:
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Transition de statut non reconnue.' });
        return;
    }

    if (serviceCallObservable) {
      serviceCallObservable.pipe(takeUntil(this._destroy$)).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Évaluation de la candidature mise à jour.' });
          this.loadCandidatureDetails(this.candidatureId!);
          this.phoneReportFile = null;
          this.firstPhysicalReportFile = null;
          this.secondPhysicalReportFile = null;
          this.f['status'].reset(null, { emitEvent: false });
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.message || 'Une erreur inconnue est survenue.';
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Échec de la mise à jour de l\'évaluation: ${errorMessage}` });
          console.error('Erreur lors de la mise à jour de l\'évaluation:', err);
        }
      });
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez sélectionner un nouveau statut pour la candidature.' });
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
    return this.evaluationForm.controls;
  }

  // Helper getters for dynamic visibility based on current candidature status
  // isEnAttenteStep is removed as per the provided enum
  get isPhoneInterviewStep(): boolean {
    return this.candidature?.status === CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE;
  }

  get isFirstPhysicalInterviewStep(): boolean {
    return this.candidature?.status === CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE;
  }

  get isSecondPhysicalInterviewStep(): boolean {
    return this.candidature?.status === CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE;
  }

  get isFinalStatus(): boolean {
    return this.candidature?.status === CandidatureStatus.EMBAUCHE || this.candidature?.status === CandidatureStatus.REJETE;
  }

  goBack(): void {
    if (this.candidatureId) {
      this.router.navigate(['/portail/candidatures', this.candidatureId]);
    } else {
      this.router.navigate(['/portail/candidatures']);
    }
  }

  protected readonly CandidatureStatus = CandidatureStatus;

  /**
   * Returns the PrimeNG severity for a given CandidatureStatus for styling.
   */
  getStatusSeverity(status: CandidatureStatus): "info" | "success" | "danger" | "secondary" | "warning" | "contrast" | undefined {
    switch (status) {
      case CandidatureStatus.EMBAUCHE:
        return 'success';
      case CandidatureStatus.REJETE:
        return 'danger';
      case CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE:
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE:
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE:
        return 'info';
      default:
        return 'secondary';
    }
  }
}
