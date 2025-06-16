import { Component, OnInit, OnDestroy } from '@angular/core'; // Import OnDestroy
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MetierResponse } from "../../dtos/MetierResponse";

import { MetierCriteria } from "../../dtos/MetierCriteria";
import { MetierService } from "../../services/MetierService";
import { MetierRequest } from "../../dtos/MetierRequest";
import { Subject, takeUntil } from 'rxjs'; // Import Subject and takeUntil
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {PageResponse} from "../../../global/types/PageResponse"; // Import operators

@Component({
  selector: 'app-metier-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    RippleModule
  ],
  templateUrl: './metier-list.component.html',
  styleUrls: ['./metier-list.component.scss'],
})
export class MetierListComponent implements OnInit, OnDestroy { // Implement OnDestroy
  metiers: MetierResponse[] = [];
  pageResponse: PageResponse<MetierResponse> | null = null;

  // Search form and criteria
  searchForm: FormGroup;
  criteria: MetierCriteria = { page: 0, size: 10, sortBy: 'metierName', sortDirection: 'asc' };

  // For the Create/Edit Dialog
  displayDialog: boolean = false;
  isEditing: boolean = false;
  currentMetierId: number | null = null;

  // Reactive Form Group for Metier data (create/edit)
  metierForm: FormGroup;

  // Subject to manage subscriptions for cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private metierService: MetierService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    // Initialize the reactive form for CREATE/EDIT with validators
    this.metierForm = this.fb.group({
      metierName: ['', [Validators.required]],
      description: ['', []]
    });

    // Initialize the reactive form for SEARCH filters
    this.searchForm = this.fb.group({
      searchMetierName: [''],
      searchDescription: ['']
    });
  }

  ngOnInit(): void {
    this.loadMetiers();

    // Subscribe to search form value changes for instant search with debounce
    this.searchForm.valueChanges.pipe(
      debounceTime(300), // Wait for 300ms after the last keystroke
      distinctUntilChanged(), // Only emit when the current value is different from the last
      takeUntil(this.destroy$) // Unsubscribe when the component is destroyed
    ).subscribe(() => {
      this.onSearch(); // Trigger search when form values change and debounce time is met
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(); // Emit a value to complete all subscriptions
    this.destroy$.complete(); // Complete the subject
  }

  /**
   * Helper to get form controls easily
   */
  get formControls(): { [key: string]: AbstractControl } {
    return this.metierForm.controls;
  }

  get searchFormControls(): { [key: string]: AbstractControl } {
    return this.searchForm.controls;
  }

  /**
   * Fetches metiers from the backend based on current criteria.
   */
  loadMetiers(): void {
    this.metierService.searchMetiers(this.criteria).subscribe({
      next: (response) => {
        this.metiers = response.content;
        this.pageResponse = response;
      },
      error: (error) => {
        console.error('Error loading metiers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load metiers. Please try again later.'
        });
      }
    });
  }

  /**
   * Triggers a new search based on current search form values.
   * Resets page to 0 and updates criteria from searchForm before reloading.
   */
  onSearch(): void {
    // Update criteria from search form values
    this.criteria.metierName = this.searchForm.get('searchMetierName')?.value || undefined;
    this.criteria.description = this.searchForm.get('searchDescription')?.value || undefined;

    this.criteria.page = 0; // Reset to the first page for a new search
    this.loadMetiers();
  }

  /**
   * Handles table sorting events.
   * @param event The sort event object from p-table.
   */
  onSort(event: any): void {
    this.criteria.sortBy = event.field;
    this.criteria.sortDirection = event.order === 1 ? 'asc' : 'desc';
    this.loadMetiers();
  }

  /**
   * Handles table pagination events (lazy loading).
   * @param event The lazy load event object from p-table.
   */
  onPageChange(event: any): void {
    this.criteria.page = event.first / event.rows;
    this.criteria.size = event.rows;
    this.loadMetiers();
  }

  /**
   * Opens the dialog for creating a new Metier, resetting the form.
   */
  showCreateDialog(): void {
    this.isEditing = false;
    this.currentMetierId = null;
    this.metierForm.reset({ metierName: '', description: '' });
    this.metierForm.markAsUntouched();
    this.metierForm.markAsPristine();
    this.displayDialog = true;
  }

  /**
   * Opens the dialog for editing an existing Metier, pre-filling the form.
   * @param metier The Metier to be edited.
   */
  showEditDialog(metier: MetierResponse): void {
    this.isEditing = true;
    this.currentMetierId = metier.id;
    this.metierForm.patchValue({
      metierName: metier.metierName,
      description: metier.description
    });
    this.metierForm.markAsUntouched();
    this.metierForm.markAsPristine();
    this.displayDialog = true;
  }

  /**
   * Submits the Metier form, either creating a new one or updating an existing one.
   */
  onSubmitForm(): void {
    if (this.metierForm.invalid) {
      this.metierForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    const metierRequest: MetierRequest = this.metierForm.value;

    if (this.isEditing && this.currentMetierId !== null) {
      this.metierService.updateMetier(this.currentMetierId, metierRequest).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Metier updated successfully!' });
          this.loadMetiers();
          this.displayDialog = false;
        },
        error: (error) => {
          console.error('Error updating metier:', error);
          const detail = error.error?.message || 'Failed to update metier.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: detail });
        }
      });
    } else {
      this.metierService.createMetier(metierRequest).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Metier created successfully!' });
          this.loadMetiers();
          this.displayDialog = false;
        },
        error: (error) => {
          console.error('Error creating metier:', error);
          const detail = error.error?.message || 'Failed to create metier.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: detail });
        }
      });
    }
  }

  /**
   * Prompts for confirmation before deleting a Metier.
   * @param metier The Metier to be deleted.
   */
  confirmDelete(metier: MetierResponse): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete Metier: <strong>${metier.metierName}</strong>?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'No, Cancel',
      accept: () => {
        this.deleteMetier(metier.id);
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelled', detail: 'Deletion cancelled' });
      }
    });
  }

  /**
   * Deletes a Metier using the service.
   * @param id The ID of the Metier to delete.
   */
  private deleteMetier(id: number): void {
    this.metierService.deleteMetier(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Metier deleted successfully!' });
        this.loadMetiers();
      },
      error: (error) => {
        console.error('Error deleting metier:', error);
        const detail = error.error?.message || 'Failed to delete metier. It might be referenced by job offers.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: detail });
      }
    });
  }
}
