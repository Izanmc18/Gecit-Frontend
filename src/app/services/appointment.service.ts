import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita, TurnoLlegada } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1';

  getAppointments(filters: any = {}): Observable<{ data: Cita[], meta?: any }> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });
    
    return this.http.get<{ data: Cita[], meta?: any }>(`${this.apiUrl}/appointments`, { 
      params,
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
  }

  private getHeaders() {
    return {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    };
  }

  callTicket(idTicket: string): Observable<TurnoLlegada> {
    return this.http.patch<TurnoLlegada>(`${this.apiUrl}/tickets/${idTicket}/call`, {}, this.getHeaders());
  }

  attendTicket(idTicket: string): Observable<TurnoLlegada> {
    return this.http.patch<TurnoLlegada>(`${this.apiUrl}/tickets/${idTicket}/attend`, {}, this.getHeaders());
  }

  discardTicket(idTicket: string): Observable<TurnoLlegada> {
    return this.http.patch<TurnoLlegada>(`${this.apiUrl}/tickets/${idTicket}/discard`, {}, this.getHeaders());
  }

  updateAppointmentStatus(idCita: string, estado: string): Observable<Cita> {
    return this.http.patch<Cita>(`${this.apiUrl}/appointments/${idCita}`, { estado }, this.getHeaders());
  }

  createAppointment(appointment: any): Observable<Cita> {
    return this.http.post<Cita>(`${this.apiUrl}/appointments`, appointment, this.getHeaders());
  }
}
