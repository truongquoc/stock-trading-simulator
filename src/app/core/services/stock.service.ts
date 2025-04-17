import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { Stock, StockHistoricalData, StockSearchResult, TimeRange } from '../models/stock.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  public mockStocks: Stock[] = [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      price: 175.43,
      change: 2.35,
      changePercent: 1.36,
      previousClose: 173.08,
      open: 173.52,
      dayHigh: 176.10,
      dayLow: 173.05,
      volume: 54321000,
      marketCap: 2800000000000,
      lastUpdated: new Date()
    },
    {
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      price: 338.11,
      change: -1.25,
      changePercent: -0.37,
      previousClose: 339.36,
      open: 339.40,
      dayHigh: 340.12,
      dayLow: 337.50,
      volume: 23456000,
      marketCap: 2500000000000,
      lastUpdated: new Date()
    },
    {
      symbol: 'GOOGL',
      companyName: 'Alphabet Inc.',
      price: 138.72,
      change: 0.98,
      changePercent: 0.71,
      previousClose: 137.74,
      open: 137.80,
      dayHigh: 139.20,
      dayLow: 137.50,
      volume: 19876000,
      marketCap: 1750000000000,
      lastUpdated: new Date()
    },
    {
      symbol: 'AMZN',
      companyName: 'Amazon.com Inc.',
      price: 178.15,
      change: 3.42,
      changePercent: 1.96,
      previousClose: 174.73,
      open: 175.20,
      dayHigh: 178.90,
      dayLow: 174.80,
      volume: 32145000,
      marketCap: 1850000000000,
      lastUpdated: new Date()
    },
    {
      symbol: 'TSLA',
      companyName: 'Tesla, Inc.',
      price: 177.80,
      change: -5.32,
      changePercent: -2.91,
      previousClose: 183.12,
      open: 182.45,
      dayHigh: 183.50,
      dayLow: 177.20,
      volume: 98765000,
      marketCap: 560000000000,
      lastUpdated: new Date()
    }
  ];

  private isBrowser: boolean;

  constructor(private http: HttpClient) {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  }

  getStocks(): Observable<Stock[]> {
    // In a real app, this would be an API call to get real stock data
    // For simulation purposes, we'll return mock data
    return of(this.mockStocks).pipe(delay(this.isBrowser ? 500 : 0));
  }

  getStockBySymbol(symbol: string): Observable<Stock | null> {
    // In a real app, this would be an API call to get real stock data
    const stock = this.mockStocks.find(s => s.symbol === symbol.toUpperCase());
    return of(stock || null).pipe(delay(this.isBrowser ? 300 : 0));
  }

  searchStocks(query: string): Observable<StockSearchResult[]> {
    // In a real app, this would be an API call to search for stocks
    // For simulation purposes, we'll filter mock data
    const results = this.mockStocks
      .filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
        stock.companyName.toLowerCase().includes(query.toLowerCase())
      )
      .map(stock => ({
        symbol: stock.symbol,
        companyName: stock.companyName,
        exchange: 'NASDAQ'
      }));
    
    return of(results).pipe(delay(this.isBrowser ? 300 : 0));
  }

  getHistoricalData(symbol: string, range: TimeRange): Observable<StockHistoricalData[]> {
    // In a real app, this would be an API call to get historical data
    // For simulation purposes, we'll generate mock data
    const now = new Date();
    const data: StockHistoricalData[] = [];
    
    let days = 0;
    switch (range) {
      case '1d': days = 1; break;
      case '5d': days = 5; break;
      case '1m': days = 30; break;
      case '3m': days = 90; break;
      case '6m': days = 180; break;
      case '1y': days = 365; break;
      case '5y': days = 365 * 5; break;
    }
    
    const stock = this.mockStocks.find(s => s.symbol === symbol.toUpperCase());
    if (!stock) {
      return of([]);
    }
    
    const basePrice = stock.price;
    const volatility = 0.02; // 2% daily volatility
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate random price movements
      const randomChange = (Math.random() - 0.5) * volatility * basePrice;
      const open = basePrice + randomChange * (i / days);
      const high = open * (1 + Math.random() * 0.01);
      const low = open * (1 - Math.random() * 0.01);
      const close = (open + high + low) / 3 + (Math.random() - 0.5) * 0.005 * basePrice;
      const volume = Math.floor(Math.random() * 10000000) + 5000000;
      
      data.push({
        date,
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    return of(data).pipe(delay(this.isBrowser ? 500 : 0));
  }

  // This method would be used in a real app to get real-time updates
  // For simulation, we'll just update the prices randomly every few seconds
  startRealTimeUpdates(): Observable<Stock[]> {
    if (!this.isBrowser) {
      // If we're not in a browser, just return the current stocks once
      return of([...this.mockStocks]);
    }
    
    return new Observable<Stock[]>(observer => {
      // Emit initial value immediately
      observer.next([...this.mockStocks]);
      
      const interval = setInterval(() => {
        this.mockStocks.forEach(stock => {
          // Random price change between -1% and +1%
          const priceChange = stock.price * (Math.random() * 0.02 - 0.01);
          stock.price += priceChange;
          stock.change = stock.price - stock.previousClose;
          stock.changePercent = (stock.change / stock.previousClose) * 100;
          stock.lastUpdated = new Date();
        });
        
        observer.next([...this.mockStocks]);
      }, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    });
  }
}
