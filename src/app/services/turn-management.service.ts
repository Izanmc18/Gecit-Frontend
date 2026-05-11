import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TurnManagementService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/turnos-llegada';

  constructor(private http: HttpClient) {}

  getDisplayData(idEntidad: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/display?idEntidad=${idEntidad}`);
  }
}
