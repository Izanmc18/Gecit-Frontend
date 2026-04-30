import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbsenceRequest, AbsenceResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AbsenceService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/absences';

  getMyAbsences(idUsuario: string): Observable<{ data: AbsenceResponse[] }> {
    const params = new HttpParams().set('idUsuario', idUsuario);
    return this.http.get<{ data: AbsenceResponse[] }>(`${this.apiUrl}`, { params });
  }

  getAllAbsences(): Observable<{ data: AbsenceResponse[] }> {
    return this.http.get<{ data: AbsenceResponse[] }>(`${this.apiUrl}`);
  }

  approveAbsence(id: string): Observable<AbsenceResponse> {
    return this.http.patch<AbsenceResponse>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectAbsence(id: string): Observable<AbsenceResponse> {
    return this.http.patch<AbsenceResponse>(`${this.apiUrl}/${id}/reject`, {});
  }

  requestAbsence(request: AbsenceRequest): Observable<AbsenceResponse> {
    return this.http.post<AbsenceResponse>(`${this.apiUrl}`, request);
  }
}
