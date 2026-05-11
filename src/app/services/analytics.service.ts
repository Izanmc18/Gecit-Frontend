import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/analytics';

  private getHeaders() {
    return {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    };
  }

  getGlobalStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/global`, this.getHeaders());
  }

  getDashboardSummary(idEntidad: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/${idEntidad}`, this.getHeaders());
  }
}
