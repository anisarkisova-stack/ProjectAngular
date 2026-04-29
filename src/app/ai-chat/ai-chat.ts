import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService, Message } from './ai-chat.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss'
})
export class AiChat implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  loading = false;
  inputText = '';
  messages: Message[] = [];

  constructor(private aiChatService: AiChatService) {}

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendSuggestion(text: string): void {
    this.inputText = text;
    this.send();
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', content: text });
    this.inputText = '';
    this.loading = true;

    this.aiChatService.sendMessage(this.messages).subscribe({
      next: (res) => {
        const reply = res.content?.[0]?.text || 'პასუხი ვერ მივიღე';
        this.messages.push({ role: 'assistant', content: reply });
        this.loading = false;
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: 'შეცდომა დაფიქსირდა. სცადეთ თავიდან.' });
        this.loading = false;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }
}