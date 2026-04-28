import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Booking } from './components/booking/booking';
import { DashboardEmployees } from './components/dashboard-employees/dashboard-employees';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'booking/:domain', component: Booking },
  { path: 'booking', redirectTo: '/booking/innovasur.com', pathMatch: 'full' },
  { 
    path: 'dashboard-employees', 
    component: DashboardEmployees,
    canActivate: [authGuard],
    data: { roles: ['e51b3a32-2222-4a3b-9a99-b1d5c7f8a122'] } 
  },
  { path: '', redirectTo: '/booking/innovasur.com', pathMatch: 'full' }
];

