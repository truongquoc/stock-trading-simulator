import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) 
  },
  { 
    path: 'stocks', 
    loadComponent: () => import('./features/stocks/stock-list/stock-list.component').then(m => m.StockListComponent) 
  },
  { 
    path: 'stocks/:symbol', 
    loadComponent: () => import('./features/stocks/stock-detail/stock-detail.component').then(m => m.StockDetailComponent) 
  },
  { 
    path: 'portfolio', 
    loadComponent: () => import('./features/portfolio/portfolio-list/portfolio-list.component').then(m => m.PortfolioListComponent) 
  },
  { 
    path: 'watchlist', 
    loadComponent: () => import('./features/watchlist/watchlist/watchlist.component').then(m => m.WatchlistComponent) 
  },
  { 
    path: 'news', 
    loadComponent: () => import('./features/news/news-feed/news-feed.component').then(m => m.NewsFeedComponent) 
  },
  { path: '**', redirectTo: '/dashboard' }
];
