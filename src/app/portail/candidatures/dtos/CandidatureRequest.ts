// src/app/candidatures/dtos/CandidatureRequest.ts

import { CandidatureStatus } from "../enums/CandidatureStatus";

export interface CandidatureRequest {
  fullName: string;
  phoneNumber?: string;
  metierId: number;
  evaluationTelephonique?: string;
  premiereEvaluationPhysique?: string;
  deuxiemeEvaluationPhysique?: string;
  dateEntretienTelephonique?: string; // New field
  datePremierEntretienPhysique?: string;
  dateDeuxiemeEntretienPhysique?: string;
  status?: CandidatureStatus;
}
