import { CandidatureStatus } from '../enums/CandidatureStatus'; // Assuming your frontend enum

export interface SecondPhysicalInterviewRequest {
  deuxiemeEvaluationPhysique: string;
  finalStatus: CandidatureStatus; // The status (HIRED/REJECTED)
}

export interface FirstPhysicalInterviewRequest {
  premiereEvaluationPhysique: string;
  dateDeuxiemeEntretienPhysique: string; // ISO 8601 string expected for OffsetDateTime
}

// src/app/candidatures/dtos/PhoneEvaluationRequest.ts

export interface PhoneEvaluationRequest {
  evaluationTelephonique: string;
  dateEntretienTelephonique?: string; // New field for the date of the phone interview
  datePremierEntretienPhysique?: string; // ISO 8601 string expected for OffsetDateTime, now optional
}
