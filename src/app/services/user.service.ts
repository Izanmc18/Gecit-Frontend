import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/users';

  private getHeaders() {
    return {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    };
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, this.getHeaders());
  }

  createUser(user: any): Observable<User> {
    return this.http.post<User>(this.apiUrl, user, this.getHeaders());
  }

  updateUser(id: string, user: any): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, user, this.getHeaders());
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  getCompetencias(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/v1/skills', this.getHeaders());
  }
}
