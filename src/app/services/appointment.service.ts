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

  getAppointments(idUsuarioAsignado: string, fechaInicio: string, fechaFin?: string): Observable<{ data: Cita[] }> {
    let params = new HttpParams()
      .set('idUsuarioAsignado', idUsuarioAsignado)
      .set('fechaInicio', fechaInicio);
    
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    
    return this.http.get<{ data: Cita[] }>(`${this.apiUrl}/appointments`, { params });
  }

  callTicket(idTicket: string): Observable<TurnoLlegada> {
    return this.http.patch<TurnoLlegada>(`${this.apiUrl}/tickets/${idTicket}/call`, {});
  }

  attendTicket(idTicket: string): Observable<TurnoLlegada> {
    return this.http.patch<TurnoLlegada>(`${this.apiUrl}/tickets/${idTicket}/attend`, {});
  }

  updateAppointmentStatus(idCita: string, estado: string): Observable<Cita> {
    return this.http.patch<Cita>(`${this.apiUrl}/appointments/${idCita}`, { estado });
  }

  createAppointment(appointment: any): Observable<Cita> {
    return this.http.post<Cita>(`${this.apiUrl}/appointments`, appointment);
  }
}
