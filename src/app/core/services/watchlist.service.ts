import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { Watchlist, WatchlistItem } from '../models/watchlist.model';
import { StockService } from './stock.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {
  private watchlistSubject = new BehaviorSubject<Watchlist | null>(null);
  public watchlist$ = this.watchlistSubject.asObservable();

  private isBrowser: boolean;

  constructor(
    private stockService: StockService,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (this.isBrowser) {
      this.loadWatchlistFromStorage();
    }
  }

  private loadWatchlistFromStorage(): void {
    if (!this.isBrowser) return;
    
    const watchlistJson = localStorage.getItem('watchlist');
    if (watchlistJson) {
      try {
        const watchlist = JSON.parse(watchlistJson) as Watchlist;
        this.watchlistSubject.next(watchlist);
      } catch (e) {
        this.initializeEmptyWatchlist();
      }
    } else {
      this.initializeEmptyWatchlist();
    }
  }

  private initializeEmptyWatchlist(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      const emptyWatchlist: Watchlist = {
        id: Date.now().toString(),
        userId: user.id,
        name: 'Default Watchlist',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.watchlistSubject.next(emptyWatchlist);
      if (this.isBrowser) {
        localStorage.setItem('watchlist', JSON.stringify(emptyWatchlist));
      }
    }
  }

  getWatchlist(): Observable<Watchlist | null> {
    return this.watchlist$;
  }

  addToWatchlist(symbol: string): Observable<boolean> {
    return this.stockService.getStockBySymbol(symbol).pipe(
      switchMap(stock => {
        if (!stock) {
          return of(false);
        }

        const watchlist = this.watchlistSubject.value;
        const user = this.authService.getCurrentUser();

        if (!watchlist || !user) {
          return of(false);
        }

        // Check if already in watchlist
        const existingItem = watchlist.items.find(item => item.symbol === symbol);
        if (existingItem) {
          return of(true); // Already in watchlist
        }

        // Add to watchlist
        const newItem: WatchlistItem = {
          id: Date.now().toString(),
          userId: user.id,
          symbol: stock.symbol,
          companyName: stock.companyName,
          addedAt: new Date(),
          currentPrice: stock.price,
          priceChange: stock.change,
          percentChange: stock.changePercent,
          lastUpdated: new Date()
        };

        const updatedWatchlist: Watchlist = {
          ...watchlist,
          items: [...watchlist.items, newItem],
          updatedAt: new Date()
        };

        this.watchlistSubject.next(updatedWatchlist);
        localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));

        return of(true);
      }),
      delay(300) // Simulate network delay
    );
  }

  removeFromWatchlist(symbol: string): Observable<boolean> {
    const watchlist = this.watchlistSubject.value;
    if (!watchlist) {
      return of(false);
    }

    const itemIndex = watchlist.items.findIndex(item => item.symbol === symbol);
    if (itemIndex === -1) {
      return of(false);
    }

    const updatedItems = [...watchlist.items];
    updatedItems.splice(itemIndex, 1);

    const updatedWatchlist: Watchlist = {
      ...watchlist,
      items: updatedItems,
      updatedAt: new Date()
    };

    this.watchlistSubject.next(updatedWatchlist);
    this.updateWatchlistInStorage(updatedWatchlist);

    return of(true).pipe(delay(300)); // Simulate network delay
  }

  // Update watchlist with latest stock prices
  updateWatchlistPrices(): Observable<Watchlist | null> {
    const watchlist = this.watchlistSubject.value;
    if (!watchlist || watchlist.items.length === 0) {
      return of(watchlist);
    }

    // This would be more efficient with a batch API call in a real app
    const updatedWatchlist = { ...watchlist };
    
    // Update each item with latest price
    updatedWatchlist.items = watchlist.items.map(item => {
      const stock = this.stockService.mockStocks.find(s => s.symbol === item.symbol);
      if (stock) {
        return {
          ...item,
          currentPrice: stock.price,
          priceChange: stock.change,
          percentChange: stock.changePercent,
          lastUpdated: new Date()
        };
      }
      return item;
    });
    
    updatedWatchlist.updatedAt = new Date();
    this.watchlistSubject.next(updatedWatchlist);
    this.updateWatchlistInStorage(updatedWatchlist);
    
    return of(updatedWatchlist).pipe(delay(300)); // Simulate network delay
  }

  private updateWatchlistInStorage(watchlist: Watchlist): void {
    if (this.isBrowser) {
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }
  }
}
