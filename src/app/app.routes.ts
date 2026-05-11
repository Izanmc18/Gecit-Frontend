import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Booking } from './components/booking/booking';
import { DashboardEmployees } from './components/dashboard-employees/dashboard-employees';
import { DashboardAdmin } from './components/dashboard-admin/dashboard-admin';
import { WaitingRoomComponent } from './components/waiting-room/waiting-room';
import { DashboardSuperAdmin } from './components/dashboard-super-admin/dashboard-super-admin';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'booking/:domain', component: Booking },
  { path: 'booking', redirectTo: '/booking/innovasur.com', pathMatch: 'full' },
  { path: 'waiting-room/:idEntidad', component: WaitingRoomComponent },
  { 
    path: 'dashboard-super-admin', 
    component: DashboardSuperAdmin,
    canActivate: [authGuard],
    data: { roles: ['e51b3a32-0000-4a3b-9a99-b1d5c7f8a120'] } 
  },
  { 
    path: 'dashboard-employees', 
    component: DashboardEmployees,
    canActivate: [authGuard],
    data: { roles: ['e51b3a32-2222-4a3b-9a99-b1d5c7f8a122'] } 
  },
  {
    path: 'dashboard-admin',
    component: DashboardAdmin,
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/booking/innovasur.com', pathMatch: 'full' }
];

