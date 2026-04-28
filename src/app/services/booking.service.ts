import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Entidad, Tramite } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  getEntidades(): Observable<Entidad[]> {
    return this.http.get<Entidad[]>(`${this.apiUrl}/entities`);
  }

  getEntityByDomain(domain: string): Observable<Entidad> {
    return this.http.get<Entidad>(`${this.apiUrl}/entities/public/${domain}`);
  }

  getTramites(idEntidad: string): Observable<Tramite[]> {
    return this.http.get<Tramite[]>(`${this.apiUrl}/procedures?idEntidad=${idEntidad}`);
  }

  getSlots(idEntidad: string, idTramite: string, fecha: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/appointments/slots?idEntidad=${idEntidad}&idTramite=${idTramite}&fecha=${fecha}`);
  }
}
