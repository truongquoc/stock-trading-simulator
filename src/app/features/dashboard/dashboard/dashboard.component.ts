import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Stock } from '../../../core/models/stock.model';
import { StockService } from '../../../core/services/stock.service';
import { WatchlistService } from '../../../core/services/watchlist.service';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    NgFor,
    NgIf,
    NgClass
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stocks: Stock[] = [];
  private stockSubscription: Subscription | null = null;

  constructor(
    private stockService: StockService,
    private watchlistService: WatchlistService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStocks();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    if (this.stockSubscription) {
      this.stockSubscription.unsubscribe();
    }
  }

  private loadStocks(): void {
    this.stockService.getStocks().subscribe(stocks => {
      this.stocks = stocks;
    });
  }

  private startRealTimeUpdates(): void {
    this.stockSubscription = this.stockService.startRealTimeUpdates().subscribe(stocks => {
      this.stocks = stocks;
    });
  }

  addToWatchlist(symbol: string): void {
    this.watchlistService.addToWatchlist(symbol).subscribe(success => {
      if (success) {
        this.snackBar.open(`${symbol} added to watchlist`, 'Close', {
          duration: 3000
        });
      } else {
        this.snackBar.open(`Failed to add ${symbol} to watchlist`, 'Close', {
          duration: 3000
        });
      }
    });
  }
}
