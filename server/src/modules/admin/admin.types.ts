export interface DashboardStats {
  customers: number;
  sellers: number;
  products: number;
  orders: number;
  revenue: number;
}

export interface MonthlyDataPoint {
  month: string;
  year: number;
  value: number;
}

export interface CategoryDataPoint {
  category: string;
  count: number;
}

export interface DashboardCharts {
  salesPerMonth: MonthlyDataPoint[];
  ordersPerMonth: MonthlyDataPoint[];
  productsPerCategory: CategoryDataPoint[];
}

export interface RecentOrder {
  _id: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface RecentSeller {
  _id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface RecentProduct {
  _id: string;
  name: string;
  price: number;
  status: string;
  createdAt: string;
}

export interface DashboardRecent {
  orders: RecentOrder[];
  sellers: RecentSeller[];
  products: RecentProduct[];
}

export interface DashboardResponse {
  stats: DashboardStats;
  charts: DashboardCharts;
  recent: DashboardRecent;
}
