import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './footer/footer';
import { Header } from './header/header';
import { AiChat } from './ai-chat/ai-chat';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, AiChat],
  templateUrl: './app.html',
  styleUrl: './app.scss'

})
export class App {
  protected readonly title = signal('projectAngular');
  
}