/**
 * Interface for creating or updating a Metier.
 */
export interface MetierRequest {
  metierName: string;
  description?: string; // Optional field
}
