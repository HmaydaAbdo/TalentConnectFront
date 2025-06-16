// src/app/core/services/candidature.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../../../../environments/environment";
import { CandidatureRequest } from "../dtos/CandidatureRequest";
import { CandidatureResponse } from "../dtos/CandidatureResponse";
import { CandidatureCriteria } from "../dtos/CandidatureCriteria";
import { PageResponse } from "../../global/types/PageResponse";
import {FirstPhysicalInterviewRequest, PhoneEvaluationRequest, SecondPhysicalInterviewRequest} from "../dtos/steps";

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private apiUrl = `${environment.apiUrl}candidatures`;

  constructor(private http: HttpClient) { }

  createCandidature(request: CandidatureRequest, cvFile?: File): Observable<CandidatureResponse> {
    const formData = new FormData();
    formData.append('candidature', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (cvFile) {
      formData.append('cvFile', cvFile, cvFile.name);
    }
    return this.http.post<CandidatureResponse>(this.apiUrl, formData);
  }

  updateCandidature(id: number, request: CandidatureRequest, cvFile?: File): Observable<CandidatureResponse> {
    const formData = new FormData();
    formData.append('candidature', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (cvFile) {
      formData.append('cvFile', cvFile, cvFile.name);
    }
    return this.http.put<CandidatureResponse>(`${this.apiUrl}/${id}`, formData);
  }

  deleteCandidature(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCandidatureById(id: number): Observable<CandidatureResponse> {
    return this.http.get<CandidatureResponse>(`${this.apiUrl}/${id}`);
  }

  searchCandidatures(criteria?: CandidatureCriteria): Observable<PageResponse<CandidatureResponse>> {
    const defaultPaginationAndSort: Pick<CandidatureCriteria, 'page' | 'size' | 'sortBy' | 'sortDirection'> = {
      page: 0,
      size: 10,
      sortBy: 'id',
      sortDirection: 'asc'
    };

    const effectiveCriteria: CandidatureCriteria = { ...defaultPaginationAndSort, ...criteria };

    let params = new HttpParams();

    if (effectiveCriteria.fullName) {
      params = params.set('fullName', effectiveCriteria.fullName);
    }
    if (effectiveCriteria.phoneNumber) {
      params = params.set('phoneNumber', effectiveCriteria.phoneNumber);
    }
    if (effectiveCriteria.metierId != null) {
      params = params.set('metierId', effectiveCriteria.metierId.toString());
    }
    if (effectiveCriteria.status) {
      params = params.set('status', effectiveCriteria.status);
    }
    // --- NEW CHANGE HERE ---
    if (effectiveCriteria.dateEntretienTelephonique) {
      params = params.set('dateEntretienTelephonique', effectiveCriteria.dateEntretienTelephonique);
    }
    // --- END NEW CHANGE ---

    if (effectiveCriteria.page != null) {
      params = params.set('page', effectiveCriteria.page.toString());
    }
    if (effectiveCriteria.size != null) {
      params = params.set('size', effectiveCriteria.size.toString());
    }

    if (effectiveCriteria.sortBy) {
      params = params.set('sortBy', effectiveCriteria.sortBy);
    }
    if (effectiveCriteria.sortDirection) {
      params = params.set('sortDirection', effectiveCriteria.sortDirection);
    }

    return this.http.get<PageResponse<CandidatureResponse>>(this.apiUrl, { params });
  }

  downloadCv(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/cv`, { observe: 'response', responseType: 'blob' });
  }

  deleteCv(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/cv`);
  }

  passerEvaluationTelephonique(id: number, request: PhoneEvaluationRequest, reportFile?: File): Observable<any> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (reportFile) {
      formData.append('reportFile', reportFile, reportFile.name);
    }
    return this.http.patch(`${this.apiUrl}/${id}/phone-evaluation`, formData);
  }

  validerPremierEntretienPhysique(id: number, request: FirstPhysicalInterviewRequest, reportFile?: File): Observable<any> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (reportFile) {
      formData.append('reportFile', reportFile, reportFile.name);
    }
    return this.http.patch(`${this.apiUrl}/${id}/first-physical-interview`, formData);
  }

  validerDeuxiemeEntretienPhysique(id: number, request: SecondPhysicalInterviewRequest, reportFile?: File): Observable<any> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (reportFile) {
      formData.append('reportFile', reportFile, reportFile.name);
    }
    return this.http.patch(`${this.apiUrl}/${id}/second-physical-interview`, formData);
  }

  downloadRapportEvaluationTelephonique(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/reports/phone-evaluation`, { observe: 'response', responseType: 'blob' });
  }

  downloadRapportPremiereEvaluationPhysique(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/reports/first-physical-interview`, { observe: 'response', responseType: 'blob' });
  }

  downloadRapportDeuxiemeEvaluationPhysique(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/reports/second-physical-interview`, { observe: 'response', responseType: 'blob' });
  }

  deleteRapportEvaluationTelephonique(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/reports/phone-evaluation`);
  }

  deleteRapportPremiereEvaluationPhysique(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/reports/first-physical-interview`);
  }

  deleteRapportDeuxiemeEvaluationPhysique(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/reports/second-physical-interview`);
  }
}
