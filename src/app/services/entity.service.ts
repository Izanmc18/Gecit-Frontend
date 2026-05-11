import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Entidad } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class EntityService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/entities';

  private getHeaders() {
    return {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    };
  }

  getEntities(): Observable<Entidad[]> {
    return this.http.get<Entidad[]>(this.apiUrl);
  }

  createEntity(entity: Partial<Entidad>): Observable<Entidad> {
    return this.http.post<Entidad>(this.apiUrl, entity, this.getHeaders());
  }

  updateEntity(id: string, entity: Partial<Entidad>): Observable<Entidad> {
    return this.http.patch<Entidad>(`${this.apiUrl}/${id}`, entity, this.getHeaders());
  }

  deleteEntity(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}
