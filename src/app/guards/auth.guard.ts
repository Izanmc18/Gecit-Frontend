import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
   
    const requiredRoles = route.data['roles'] as string[];
    if (!requiredRoles) return true;

    const user = authService.currentUser();
    const ADMIN_ROLE = 'e51b3a32-1111-4a3b-9a99-b1d5c7f8a121';

    if (user && user.idRol === ADMIN_ROLE && state.url === '/dashboard-employees') {
      router.navigate(['/dashboard-admin']);
      return false;
    }

    if (user && requiredRoles.includes(user.idRol)) {
      return true;
    }

    router.navigate(['/login']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};
