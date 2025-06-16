import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideAnimations} from "@angular/platform-browser/animations";
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import { appHttpInterceptorInterceptor} from "./auth/interceptors/app-http-interceptor.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient( withInterceptors([appHttpInterceptorInterceptor])),
    provideRouter(routes),
    provideAnimations(),

  ]
};
