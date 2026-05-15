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

  getSalas(idEntidad: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/salas/public/${idEntidad}`);
  }

  getSlots(idEntidad: string, idTramite: string, fecha: string, idSala?: string): Observable<string[]> {
    let url = `${this.apiUrl}/appointments/slots?idEntidad=${idEntidad}&idTramite=${idTramite}&fecha=${fecha}`;
    if (idSala) {
      url += `&idSala=${idSala}`;
    }
    return this.http.get<string[]>(url);
  }

  createAppointment(appointmentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments`, appointmentData);
  }
}

