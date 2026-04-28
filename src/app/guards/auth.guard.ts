import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Si hay un rol requerido en la ruta, lo comprobamos
    const requiredRoles = route.data['roles'] as string[];
    if (!requiredRoles) return true;

    const user = authService.currentUser();
    // Aquí comprobamos el ID del rol o el nombre si lo tuviéramos
    // El usuario tiene idRol. Para empleado es 'e51b3a32-2222-4a3b-9a99-b1d5c7f8a122'
    if (user && requiredRoles.includes(user.idRol)) {
      return true;
    }

    // Si no tiene el rol, redirigir a login (o a una página de no autorizado)
    router.navigate(['/login']);
    return false;
  }

  // Si no está autenticado, redirigir a login
  router.navigate(['/login']);
  return false;
};
