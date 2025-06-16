// src/app/candidatures/dtos/CandidatureCriteria.ts

import { CandidatureStatus } from "../enums/CandidatureStatus";

export interface CandidatureCriteria {
  fullName?: string;
  phoneNumber?: string;
  metierId?: number;
  status?: CandidatureStatus;
  dateEntretienTelephonique?: string; // New: Add date for phone interview criteria
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}
