// src/app/candidatures/dtos/CandidatureResponse.ts

import { CandidatureStatus } from "../enums/CandidatureStatus";

export interface CandidatureResponse {
  id: number;
  fullName: string;
  phoneNumber?: string;
  metierId: number;
  metierName: string;
  evaluationTelephonique?: string;
  premiereEvaluationPhysique?: string;
  deuxiemeEvaluationPhysique?: string;
  dateEntretienTelephonique?: string; // New field
  datePremierEntretienPhysique?: string;
  dateDeuxiemeEntretienPhysique?: string;
  status: CandidatureStatus;
  hasCv: boolean;
  hasRapportEvaluationTelephonique: boolean;
  hasRapportPremiereEvaluationPhysique: boolean;
  hasRapportDeuxiemeEvaluationPhysique: boolean;
}
