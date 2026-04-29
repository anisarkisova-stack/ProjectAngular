import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
private readonly API = 'https://api.anthropic.com/v1/messages';
private readonly SYSTEM = `You are a helpful assistant for Step Railway — a Georgian train ticket booking service.
You help users in both Georgian and English. Always respond in the same language the user writes in.

Available stations and routes: trains run between Georgian cities. Wagons have seats with prices.
You can help with:
- Finding routes and schedules
- Seat availability and prices
- How to book a ticket
- Ticket check and return process
- General travel questions

Be friendly, concise and helpful. Keep responses short and clear.`;

  constructor(private http: HttpClient) {}

  sendMessage(messages: Message[]): Observable<any> {
    const headers = new HttpHeaders()
      .set('x-api-key', environment.anthropicApiKey)
      .set('anthropic-version', '2023-06-01')
      .set('content-type', 'application/json')
      .set('anthropic-dangerous-allow-browser', 'true');

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: this.SYSTEM,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    };

    return this.http.post(this.API, body, { headers });
  }
}