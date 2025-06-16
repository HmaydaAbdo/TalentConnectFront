import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../../../environments/environment";
import {MetierRequest} from "../dtos/MetierRequest";
import {MetierResponse} from "../dtos/MetierResponse";
import {MetierCriteria} from "../dtos/MetierCriteria";
import {PageResponse} from "../../global/types/PageResponse";


@Injectable({
  providedIn: 'root'
})
export class MetierService {

  private apiUrl = `${environment.apiUrl}metiers`;

  constructor(private http: HttpClient) { }

  /**
   * Sends a POST request to create a new Metier.
   * @param metier The MetierRequest object containing the data for the new Metier.
   * @returns An Observable of the created MetierResponse.
   */
  createMetier(metier: MetierRequest): Observable<MetierResponse> {
    return this.http.post<MetierResponse>(this.apiUrl, metier);
  }

  /**
   * Sends a GET request to retrieve a Metier by its ID.
   * @param id The unique identifier of the Metier.
   * @returns An Observable of the MetierResponse.
   */
  getMetierById(id: number): Observable<MetierResponse> {
    return this.http.get<MetierResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Sends a PUT request to update an existing Metier.
   * @param id The unique identifier of the Metier to update.
   * @param metier The MetierRequest object containing the updated data.
   * @returns An Observable of the updated MetierResponse.
   */
  updateMetier(id: number, metier: MetierRequest): Observable<MetierResponse> {
    return this.http.put<MetierResponse>(`${this.apiUrl}/${id}`, metier);
  }

  /**
   * Sends a DELETE request to remove a Metier by its ID.
   * @param id The unique identifier of the Metier to delete.
   * @returns An Observable that completes when the deletion is successful.
   */
  deleteMetier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Sends a GET request to search for Metiers with pagination and sorting capabilities.
   * @param criteria The MetierCriteria object specifying search filters, page number, page size,
   * sort field, and sort direction.
   * @returns An Observable of PageResponse<MetierResponse> containing the paginated results.
   */
  searchMetiers(criteria: MetierCriteria): Observable<PageResponse<MetierResponse>> {
    let params = new HttpParams();

    // Append search filter parameters
    if (criteria.metierName) {
      params = params.set('metierName', criteria.metierName);
    }
    if (criteria.description) {
      params = params.set('description', criteria.description);
    }

    // Append pagination parameters
    if (criteria.page !== undefined && criteria.page !== null) {
      params = params.set('page', criteria.page.toString());
    }
    if (criteria.size !== undefined && criteria.size !== null) {
      params = params.set('size', criteria.size.toString());
    }

    // Append sorting parameters
    if (criteria.sortBy) {
      params = params.set('sortBy', criteria.sortBy);
    }
    if (criteria.sortDirection) {
      params = params.set('sortDirection', criteria.sortDirection);
    }

    return this.http.get<PageResponse<MetierResponse>>(this.apiUrl, { params });
  }
}
