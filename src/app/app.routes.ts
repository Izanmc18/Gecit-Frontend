import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Booking } from './components/booking/booking';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'booking', component: Booking },
  { path: '', redirectTo: '/booking', pathMatch: 'full' }
];
