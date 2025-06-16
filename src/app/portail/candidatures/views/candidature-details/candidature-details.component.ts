// src/app/pages/candidature-details/candidature-details.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';
import { HttpResponse } from '@angular/common/http';

import { CandidatureService } from '../../services/CandidatureService';
import { CandidatureResponse } from '../../dtos/CandidatureResponse';
import { CandidatureStatus } from '../../enums/CandidatureStatus'; // Ensure this is the updated enum

// PrimeNG Modules for UI
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";


@Component({
  selector: 'app-candidature-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ToastModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './candidature-details.component.html',
  styleUrls: ['./candidature-details.component.scss'],
  providers: [MessageService]
})
export class CandidatureDetailsComponent implements OnInit, OnDestroy {
  candidature: CandidatureResponse | null = null;
  loading: boolean = true;
  private _destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private candidatureService: CandidatureService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this._destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCandidatureDetails(+id);
      } else {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'ID de candidature manquant.' });
        this.loading = false;
        this.router.navigate(['/portail/candidatures']); // Ensure this path is correct
      }
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  loadCandidatureDetails(id: number): void {
    this.loading = true;
    this.candidatureService.getCandidatureById(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (data) => {
          this.candidature = data;
          this.loading = false;
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement des détails de la candidature.' });
          console.error('Erreur lors du chargement des détails de la candidature:', err);
          this.loading = false;
          this.router.navigate(['/portail/candidatures']);
        }
      });
  }

  /**
   * Returns a user-friendly label for a given candidature status,
   * now mapping the new French enum values.
   * @param status The CandidatureStatus enum value.
   * @returns A string representing the status label.
   */
  getStatusLabel(status: CandidatureStatus): string {
    switch (status) {
      case CandidatureStatus.ENTRETIEN_TELEPHONIQUE_PLANIFIE: return 'Entretien Téléphonique Planifié';
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_1_PLANIFIE: return '1er Entretien Physique Planifié';
      case CandidatureStatus.ENTRETIEN_PHYSIQUE_2_PLANIFIE: return '2ème Entretien Physique Planifié';
      case CandidatureStatus.EMBAUCHE: return 'Embauché';
      case CandidatureStatus.REJETE: return 'Rejeté';
      default: return 'Inconnu';
    }
  }

  editCandidature(): void {
    if (this.candidature?.id) {
      this.router.navigate(['/portail/candidatures', this.candidature.id, 'edit']);
    }
  }

  startEvaluation(): void {
    if (this.candidature?.id) {
      this.router.navigate(['/portail/candidatures', this.candidature.id, 'evaluate']);
    }
  }

  downloadCv(candidature: CandidatureResponse): void {
    if (!candidature.id) {
      this.messageService.add({ severity: 'warn', summary: 'Avertissement', detail: 'L\'ID de la candidature est manquant pour télécharger le CV.' });
      return;
    }
    if (!candidature.hasCv) {
      this.messageService.add({ severity: 'info', summary: 'Information', detail: 'Aucun CV n\'est disponible pour cette candidature.' });
      return;
    }

    this.candidatureService.downloadCv(candidature.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          const filename = this.getFilenameFromContentDisposition(response.headers.get('Content-Disposition'), `CV_${candidature.fullName.replace(/\s/g, '_')}_${candidature.id}`);
          const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
          if (response.body) {
            this.saveFile(response.body, filename, contentType);
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'CV téléchargé avec succès.' });
          } else {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le contenu du CV est vide.' });
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléchargement du CV. Il pourrait ne pas exister ou une erreur s\'est produite.' });
          console.error('Erreur lors du téléchargement du CV:', err);
        }
      });
  }

  downloadPhoneEvaluationReport(candidature: CandidatureResponse): void {
    if (!candidature.id) {
      this.messageService.add({ severity: 'warn', summary: 'Avertissement', detail: 'L\'ID de la candidature est manquant pour télécharger le rapport.' });
      return;
    }
    if (!candidature.hasRapportEvaluationTelephonique) {
      this.messageService.add({ severity: 'info', summary: 'Information', detail: 'Aucun rapport d\'évaluation téléphonique n\'est disponible.' });
      return;
    }

    this.candidatureService.downloadRapportEvaluationTelephonique(candidature.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          const filename = this.getFilenameFromContentDisposition(response.headers.get('Content-Disposition'), `Rapport_Evaluation_Telephonique_${candidature.fullName.replace(/\s/g, '_')}_${candidature.id}`);
          const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
          if (response.body) {
            this.saveFile(response.body, filename, contentType);
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Rapport d\'évaluation téléphonique téléchargé avec succès.' });
          } else {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le contenu du rapport téléphonique est vide.' });
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléchargement du rapport téléphonique. Il pourrait ne pas exister ou une erreur s\'est produite.' });
          console.error('Erreur lors du téléchargement du rapport téléphonique:', err);
        }
      });
  }

  downloadFirstPhysicalInterviewReport(candidature: CandidatureResponse): void {
    if (!candidature.id) {
      this.messageService.add({ severity: 'warn', summary: 'Avertissement', detail: 'L\'ID de la candidature est manquant pour télécharger le rapport.' });
      return;
    }
    if (!candidature.hasRapportPremiereEvaluationPhysique) {
      this.messageService.add({ severity: 'info', summary: 'Information', detail: 'Aucun rapport de 1er entretien physique n\'est disponible.' });
      return;
    }

    this.candidatureService.downloadRapportPremiereEvaluationPhysique(candidature.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          const filename = this.getFilenameFromContentDisposition(response.headers.get('Content-Disposition'), `Rapport_1er_Entretien_Physique_${candidature.fullName.replace(/\s/g, '_')}_${candidature.id}`);
          const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
          if (response.body) {
            this.saveFile(response.body, filename, contentType);
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Rapport du 1er entretien physique téléchargé avec succès.' });
          } else {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le contenu du rapport du 1er entretien physique est vide.' });
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléchargement du rapport du 1er entretien physique. Il pourrait ne pas exister ou une erreur s\'est produite.' });
          console.error('Erreur lors du téléchargement du rapport du 1er entretien physique:', err);
        }
      });
  }

  downloadSecondPhysicalInterviewReport(candidature: CandidatureResponse): void {
    if (!candidature.id) {
      this.messageService.add({ severity: 'warn', summary: 'Avertissement', detail: 'L\'ID de la candidature est manquant pour télécharger le rapport.' });
      return;
    }
    if (!candidature.hasRapportDeuxiemeEvaluationPhysique) {
      this.messageService.add({ severity: 'info', summary: 'Information', detail: 'Aucun rapport de 2ème entretien physique n\'est disponible.' });
      return;
    }

    this.candidatureService.downloadRapportDeuxiemeEvaluationPhysique(candidature.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          const filename = this.getFilenameFromContentDisposition(response.headers.get('Content-Disposition'), `Rapport_2eme_Entretien_Physique_${candidature.fullName.replace(/\s/g, '_')}_${candidature.id}`);
          const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
          if (response.body) {
            this.saveFile(response.body, filename, contentType);
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Rapport du 2ème entretien physique téléchargé avec succès.' });
          } else {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le contenu du rapport du 2ème entretien physique est vide.' });
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléchargement du rapport du 2ème entretien physique. Il pourrait ne pas exister ou une erreur s\'est produite.' });
          console.error('Erreur lors du téléchargement du rapport du 2ème entretien physique:', err);
        }
      });
  }

  private getFilenameFromContentDisposition(contentDispositionHeader: string | null, defaultFilename: string): string {
    if (contentDispositionHeader) {
      const filenameMatch = /filename="?([^"]+)"?/.exec(contentDispositionHeader);
      if (filenameMatch && filenameMatch[1]) {
        try {
          return decodeURIComponent(filenameMatch[1]); // Ensure decoding for special characters
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

  goBackToList(): void {
    this.router.navigate(['/portail/candidatures']);
  }
}
