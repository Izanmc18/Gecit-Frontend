export interface LoginRequest {
  email: string;
  password?: string; // Optional if we plan to use passwordless or something, but usually required
}

export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: User;
}
