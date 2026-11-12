import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;

  list<T>(
    path: string,
    page = 0,
    size = 10,
    extra: Record<string, string | number | undefined> = {},
  ) {
    let params = new HttpParams().set('page', page).set('size', size);
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, value);
    });
    return this.http.get<PageResponse<T>>(`${this.baseUrl}/${path}`, { params });
  }

  get<T>(path: string) {
    return this.http.get<T>(`${this.baseUrl}/${path}`);
  }

  getBlob(path: string) {
    return this.http.get(`${this.baseUrl}/${path}`, { responseType: 'blob' });
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${this.baseUrl}/${path}`, body);
  }

  postText(path: string, body: unknown, params: Record<string, string> = {}) {
    return this.http.post(`${this.baseUrl}/${path}`, body, {
      params: new HttpParams({ fromObject: params }),
      responseType: 'text',
    });
  }

  put<T>(path: string, body: unknown) {
    return this.http.put<T>(`${this.baseUrl}/${path}`, body);
  }

  delete(path: string) {
    return this.http.delete<void>(`${this.baseUrl}/${path}`);
  }
}
