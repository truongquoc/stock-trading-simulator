export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  summary: string;
  url: string;
  imageUrl?: string;
  relatedSymbols: string[];
  publishedAt: Date;
}

export interface NewsResponse {
  items: NewsItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
