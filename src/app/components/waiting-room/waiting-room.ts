import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TurnManagementService } from '../../services/turn-management.service';
import { interval, Subscription, switchMap, of } from 'rxjs';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './waiting-room.html',
  styleUrls: ['./waiting-room.css']
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
  private turnService = inject(TurnManagementService);
  private bookingService = inject(BookingService);
  private route = inject(ActivatedRoute);

  idEntidad: string = '';
  slug: string = '';
  displayData = signal<any>({ llamados: [], enEspera: [] });
  currentTime = signal<Date>(new Date());
  
  private lastCalledTicket: string | null = null;
  private eventsSubscription?: Subscription;
  private clockSubscription?: Subscription;

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    
    this.clockSubscription = interval(1000).subscribe(() => {
      this.currentTime.set(new Date());
    });

    if (this.slug) {
      this.bookingService.getEntityByDomain(this.slug).subscribe({
        next: (entidad) => {
          this.idEntidad = entidad.id;
          this.loadData();
          this.startSse();
        },
        error: (err) => console.error('Error resolving slug:', err)
      });
    }
  }

  private startSse() {
    if (this.idEntidad) {
      this.eventsSubscription = this.turnService.getTurnEvents(this.idEntidad).subscribe({
        next: (event) => {
          this.loadData();
        },
        error: (err) => console.error('SSE Error:', err)
      });
    }
  }

  ngOnDestroy() {
    this.eventsSubscription?.unsubscribe();
    this.clockSubscription?.unsubscribe();
  }

  loadData() {
    if (!this.idEntidad) return;

    this.turnService.getDisplayData(this.idEntidad).subscribe({
      next: (data) => {
        this.displayData.set(data);
        this.checkNewCall(data.llamados);
      },
      error: (err) => console.error('Error loading display data:', err)
    });
  }

  private checkNewCall(llamados: any[]) {
    if (llamados.length > 0) {
      const mostRecent = llamados[0].ticket;
      if (this.lastCalledTicket && this.lastCalledTicket !== mostRecent) {
        this.playNotificationSound();
      }
      this.lastCalledTicket = mostRecent;
    }
  }

  private playNotificationSound() {
    const audio = new Audio('assets/sounds/notification.mp3');
    audio.play().catch(() => {});
  }

  getFormattedDate(): string {
    const options: any = { weekday: 'long', day: 'numeric', month: 'long' };
    return this.currentTime().toLocaleDateString('es-ES', options);
  }
}
