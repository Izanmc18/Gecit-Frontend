import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sala, Mesa, UpdateMesaDto, UpdateSalaDto } from '../models/office.model';

@Injectable({
  providedIn: 'root'
})
export class OfficeService {
  private readonly apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

 
  getRooms(): Observable<Sala[]> {
    return this.http.get<Sala[]>(`${this.apiUrl}/rooms`, { headers: this.getHeaders() });
  }

  getRoomById(id: string): Observable<Sala> {
    return this.http.get<Sala>(`${this.apiUrl}/rooms/${id}`, { headers: this.getHeaders() });
  }

  updateRoom(id: string, data: UpdateSalaDto): Observable<Sala> {
    return this.http.patch<Sala>(`${this.apiUrl}/rooms/${id}`, data, { headers: this.getHeaders() });
  }

 
  getTables(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${this.apiUrl}/tables`, { headers: this.getHeaders() });
  }

  getTablesByRoom(idSala: string): Observable<Mesa[]> {
   
   
   
    return this.http.get<Mesa[]>(`${this.apiUrl}/tables`, { headers: this.getHeaders() });
  }

  updateTable(id: string, data: UpdateMesaDto): Observable<Mesa> {
    return this.http.patch<Mesa>(`${this.apiUrl}/tables/${id}`, data, { headers: this.getHeaders() });
  }

  createTable(data: Partial<Mesa>): Observable<Mesa> {
    return this.http.post<Mesa>(`${this.apiUrl}/tables`, data, { headers: this.getHeaders() });
  }

  deleteTable(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tables/${id}`, { headers: this.getHeaders() });
  }

 
  getDashboardSummary(idEntidad: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/dashboard/${idEntidad}`, { headers: this.getHeaders() });
  }
}
