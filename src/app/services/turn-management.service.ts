import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TurnManagementService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/tickets';

  constructor(private http: HttpClient) {}

  getDisplayData(idEntidad?: string, slug?: string): Observable<any> {
    let query = '';
    if (idEntidad) query = `idEntidad=${idEntidad}`;
    else if (slug) query = `slug=${slug}`;
    return this.http.get(`${this.apiUrl}/display?${query}`);
  }

  getTurnEvents(idEntidadOrSlug: string): Observable<any> {
    return new Observable(observer => {
      const eventSource = new EventSource(`${this.apiUrl}/events/${idEntidadOrSlug}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        observer.next(data);
      };

      eventSource.onerror = (error) => {
        // No llamamos a observer.error(error) para evitar destruir la suscripción de Angular.
        // El EventSource nativo del navegador gestiona la reconexión automática de forma transparente.
        console.warn('SSE connection interrupted. Browser will automatically reconnect...', error);
      };

      return () => {
        eventSource.close();
      };
    });
  }

  checkIn(idEntidad: string, dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/checkin`, { idEntidad, dni });
  }
}
