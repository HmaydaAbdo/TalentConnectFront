/**
 * Interface for representing a Metier retrieved from the backend.
 */
export interface MetierResponse {
  id: number;
  metierName: string;
  description?: string;
}
