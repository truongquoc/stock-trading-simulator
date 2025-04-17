import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { StockService } from './services/stock.service';
import { PortfolioService } from './services/portfolio.service';
import { WatchlistService } from './services/watchlist.service';
import { NewsService } from './services/news.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    AuthService,
    StockService,
    PortfolioService,
    WatchlistService,
    NewsService
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule has already been loaded. Import CoreModule only in the AppModule.');
    }
  }
}
