/**
 * Interface for defining search, pagination, and sorting criteria for Metiers.
 */
export interface MetierCriteria {
  metierName?: string;
  description?: string;
  page?: number;        // Zero-indexed page number
  size?: number;        // Number of items per page
  sortBy?: string;      // Field to sort by (e.g., 'metierName', 'id')
  sortDirection?: 'asc' | 'desc'; // Sorting order
}
