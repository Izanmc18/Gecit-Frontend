import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Rol {
  id: string;
  nombreRol: string;
}

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/roles';

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      })
    };
  }

  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.apiUrl, this.getHeaders());
  }

  createRol(nombre: string): Observable<Rol> {
    return this.http.post<Rol>(this.apiUrl, { nombreRol: nombre }, this.getHeaders());
  }

  updateRol(id: string, nombre: string): Observable<Rol> {
    return this.http.patch<Rol>(`${this.apiUrl}/${id}`, { nombreRol: nombre }, this.getHeaders());
  }

  deleteRol(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}
