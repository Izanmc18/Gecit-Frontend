import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TurnManagementService } from '../../services/turn-management.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './waiting-room.html',
  styleUrls: ['./waiting-room.css']
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
  private turnService = inject(TurnManagementService);
  private route = inject(ActivatedRoute);

 
  idEntidad: string = '';
  displayData = signal<any>({ llamados: [], enEspera: [] });
  currentTime = signal<Date>(new Date());
  
  private lastCalledTicket: string | null = null;
  private pollSubscription?: Subscription;
  private clockSubscription?: Subscription;

  ngOnInit() {
    this.idEntidad = this.route.snapshot.paramMap.get('idEntidad') || '';
    
   
    this.clockSubscription = interval(1000).subscribe(() => {
      this.currentTime.set(new Date());
    });

   
    this.loadData();
    this.pollSubscription = interval(5000).subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    this.pollSubscription?.unsubscribe();
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
    audio.play().catch(e => console.log('Audio play blocked by browser', e));
  }

  getFormattedDate(): string {
    const options: any = { weekday: 'long', day: 'numeric', month: 'long' };
    return this.currentTime().toLocaleDateString('es-ES', options);
  }
}
