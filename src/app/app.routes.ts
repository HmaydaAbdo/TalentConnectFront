import { Routes } from '@angular/router';
import { LoginComponent } from "./auth/views/login/login.component";
import {PortailComponent} from "./portail/global/views/portail/portail.component";
import {authGuard} from "./auth/guards/auth.guard";



export const routes: Routes = [
  { path: '', redirectTo: '/connexion', pathMatch: 'full' },
  { path: 'connexion', component: LoginComponent },
  {
    path: 'portail',
    component: PortailComponent,
    canActivate: [authGuard],
    children: [

      {
        path: '',
        loadChildren: () => import('./portail/global/routes/portail.routes').then(m => m.PORTAIL_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: '/connexion', pathMatch: 'full' }
];
