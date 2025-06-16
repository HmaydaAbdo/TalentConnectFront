// src/app/portal/portail.routes.ts
import { Routes } from '@angular/router';
import { MetierListComponent } from "../../metier/views/metier-list/metier-list.component";
import { CandidatureListComponent } from "../../candidatures/views/candidaturesList/CandidatureListComponent";
import { CandidatureFormComponent } from "../../candidatures/views/candidature-form/candidature-form.component";
import { CandidatureEvaluationComponent } from '../../candidatures/views/candidature-evaluation/candidature-evaluation.component';
import {CandidatureDetailsComponent} from "../../candidatures/views/candidature-details/candidature-details.component";

export const PORTAIL_ROUTES: Routes = [
  { path: '', redirectTo: 'candidatures', pathMatch: 'full'},
  { path: 'metiers', component: MetierListComponent },
  {
    path: 'candidatures',
    children: [
      { path: '', component: CandidatureListComponent }, // Lists all candidatures (e.g., /candidatures)
      { path: 'new', component: CandidatureFormComponent }, // Form for creating a new candidature (e.g., /candidatures/new)
      { path: ':id', component: CandidatureDetailsComponent }, // View details of a specific candidature (e.g., /candidatures/123)
      { path: ':id/edit', component: CandidatureFormComponent }, // Form for editing a specific candidature (e.g., /candidatures/123/edit)
      { path: ':id/evaluate', component: CandidatureEvaluationComponent }, // Form for evaluation (e.g., /candidatures/123/evaluate)
    ]
  }
];
