import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, switchMap, tap } from 'rxjs/operators';
import { Portfolio, PortfolioItem, Trade, TradeType } from '../models/portfolio.model';
import { Stock } from '../models/stock.model';
import { StockService } from './stock.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private portfolioSubject = new BehaviorSubject<Portfolio | null>(null);
  public portfolio$ = this.portfolioSubject.asObservable();
  private tradesSubject = new BehaviorSubject<Trade[]>([]);
  public trades$ = this.tradesSubject.asObservable();

  private isBrowser: boolean;

  constructor(
    private stockService: StockService,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (this.isBrowser) {
      this.loadPortfolioFromStorage();
      this.loadTradesFromStorage();
    }
  }

  private loadPortfolioFromStorage(): void {
    if (!this.isBrowser) return;
    
    const portfolioJson = localStorage.getItem('portfolio');
    if (portfolioJson) {
      try {
        const portfolio = JSON.parse(portfolioJson) as Portfolio;
        this.portfolioSubject.next(portfolio);
      } catch (e) {
        this.initializeEmptyPortfolio();
      }
    } else {
      this.initializeEmptyPortfolio();
    }
  }

  private loadTradesFromStorage(): void {
    if (!this.isBrowser) return;
    
    const tradesJson = localStorage.getItem('trades');
    if (tradesJson) {
      try {
        const trades = JSON.parse(tradesJson) as Trade[];
        this.tradesSubject.next(trades);
      } catch (e) {
        this.tradesSubject.next([]);
      }
    }
  }

  private initializeEmptyPortfolio(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      const emptyPortfolio: Portfolio = {
        userId: user.id,
        items: [],
        totalValue: 0,
        totalGainLoss: 0,
        percentGainLoss: 0,
        cashBalance: user.cashBalance,
        lastUpdated: new Date()
      };
      this.portfolioSubject.next(emptyPortfolio);
      if (this.isBrowser) {
        localStorage.setItem('portfolio', JSON.stringify(emptyPortfolio));
      }
    }
  }

  getPortfolio(): Observable<Portfolio | null> {
    return this.portfolio$;
  }

  getTrades(): Observable<Trade[]> {
    return this.trades$;
  }

  executeTrade(symbol: string, quantity: number, type: TradeType): Observable<boolean> {
    return this.stockService.getStockBySymbol(symbol).pipe(
      switchMap(stock => {
        if (!stock) {
          return of(false);
        }

        const user = this.authService.getCurrentUser();
        const portfolio = this.portfolioSubject.value;

        if (!user || !portfolio) {
          return of(false);
        }

        const total = stock.price * quantity;

        if (type === TradeType.BUY) {
          // Check if user has enough cash
          if (user.cashBalance < total) {
            return of(false);
          }

          // Update cash balance
          const newBalance = user.cashBalance - total;
          this.authService.updateUserBalance(newBalance);

          // Add to portfolio
          this.addToPortfolio(stock, quantity, total);
        } else if (type === TradeType.SELL) {
          // Check if user has enough shares
          const existingItem = portfolio.items.find(item => item.symbol === symbol);
          if (!existingItem || existingItem.quantity < quantity) {
            return of(false);
          }

          // Update cash balance
          const newBalance = user.cashBalance + total;
          this.authService.updateUserBalance(newBalance);

          // Remove from portfolio
          this.removeFromPortfolio(stock, quantity, total);
        }

        // Record the trade
        const trade: Trade = {
          id: Date.now().toString(),
          userId: user.id,
          symbol: stock.symbol,
          companyName: stock.companyName,
          quantity,
          price: stock.price,
          type,
          total,
          timestamp: new Date()
        };

        const trades = [...this.tradesSubject.value, trade];
        this.tradesSubject.next(trades);
        if (this.isBrowser) {
          localStorage.setItem('trades', JSON.stringify(trades));
        }

        return of(true);
      }),
      delay(500) // Simulate network delay
    );
  }

  private addToPortfolio(stock: Stock, quantity: number, total: number): void {
    const portfolio = this.portfolioSubject.value;
    if (!portfolio) return;

    const existingItemIndex = portfolio.items.findIndex(item => item.symbol === stock.symbol);

    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = portfolio.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      const newTotalCost = (existingItem.averagePurchasePrice * existingItem.quantity) + total;
      const newAveragePrice = newTotalCost / newQuantity;

      const updatedItem: PortfolioItem = {
        ...existingItem,
        quantity: newQuantity,
        averagePurchasePrice: newAveragePrice,
        currentPrice: stock.price,
        totalValue: newQuantity * stock.price,
        totalGainLoss: (stock.price - newAveragePrice) * newQuantity,
        percentGainLoss: ((stock.price - newAveragePrice) / newAveragePrice) * 100,
        lastUpdated: new Date()
      };

      portfolio.items[existingItemIndex] = updatedItem;
    } else {
      // Add new item
      const newItem: PortfolioItem = {
        id: Date.now().toString(),
        userId: portfolio.userId,
        symbol: stock.symbol,
        companyName: stock.companyName,
        quantity,
        averagePurchasePrice: stock.price,
        currentPrice: stock.price,
        totalValue: quantity * stock.price,
        totalGainLoss: 0,
        percentGainLoss: 0,
        lastUpdated: new Date()
      };

      portfolio.items.push(newItem);
    }

    // Update portfolio totals
    this.updatePortfolioTotals(portfolio);
  }

  private removeFromPortfolio(stock: Stock, quantity: number, total: number): void {
    const portfolio = this.portfolioSubject.value;
    if (!portfolio) return;

    const existingItemIndex = portfolio.items.findIndex(item => item.symbol === stock.symbol);

    if (existingItemIndex >= 0) {
      const existingItem = portfolio.items[existingItemIndex];
      const newQuantity = existingItem.quantity - quantity;

      if (newQuantity <= 0) {
        // Remove item completely
        portfolio.items.splice(existingItemIndex, 1);
      } else {
        // Update existing item
        const updatedItem: PortfolioItem = {
          ...existingItem,
          quantity: newQuantity,
          currentPrice: stock.price,
          totalValue: newQuantity * stock.price,
          totalGainLoss: (stock.price - existingItem.averagePurchasePrice) * newQuantity,
          percentGainLoss: ((stock.price - existingItem.averagePurchasePrice) / existingItem.averagePurchasePrice) * 100,
          lastUpdated: new Date()
        };

        portfolio.items[existingItemIndex] = updatedItem;
      }

      // Update portfolio totals
      this.updatePortfolioTotals(portfolio);
    }
  }

  private updatePortfolioTotals(portfolio: Portfolio): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    let totalValue = 0;
    let totalCost = 0;

    portfolio.items.forEach(item => {
      totalValue += item.totalValue;
      totalCost += item.averagePurchasePrice * item.quantity;
    });

    const totalGainLoss = totalValue - totalCost;
    const percentGainLoss = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    const updatedPortfolio: Portfolio = {
      ...portfolio,
      totalValue,
      totalGainLoss,
      percentGainLoss,
      cashBalance: user.cashBalance,
      lastUpdated: new Date()
    };

    this.portfolioSubject.next(updatedPortfolio);
    if (this.isBrowser) {
      localStorage.setItem('portfolio', JSON.stringify(updatedPortfolio));
    }
  }

  // Update portfolio with latest stock prices
  updatePortfolioPrices(): Observable<Portfolio | null> {
    const portfolio = this.portfolioSubject.value;
    if (!portfolio || portfolio.items.length === 0) {
      return of(portfolio);
    }

    const symbols = portfolio.items.map(item => item.symbol);
    const observables = symbols.map(symbol => this.stockService.getStockBySymbol(symbol));

    // This would be more efficient with a batch API call in a real app
    return of(observables).pipe(
      switchMap(obs => {
        const updatedPortfolio = { ...portfolio };
        
        // Update each item with latest price
        portfolio.items.forEach((item, index) => {
          const stock = this.stockService.mockStocks.find(s => s.symbol === item.symbol);
          if (stock) {
            const updatedItem: PortfolioItem = {
              ...item,
              currentPrice: stock.price,
              totalValue: item.quantity * stock.price,
              totalGainLoss: (stock.price - item.averagePurchasePrice) * item.quantity,
              percentGainLoss: ((stock.price - item.averagePurchasePrice) / item.averagePurchasePrice) * 100,
              lastUpdated: new Date()
            };
            updatedPortfolio.items[index] = updatedItem;
          }
        });
        
        this.updatePortfolioTotals(updatedPortfolio);
        return of(updatedPortfolio);
      }),
      delay(300) // Simulate network delay
    );
  }
}
