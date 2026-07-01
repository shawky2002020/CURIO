<script setup lang="ts">
/**
 * SellerDashboardPage Component
 * Premium operational command center for Curio Seller partners.
 */
import { ref, onMounted, computed } from 'vue';
import { Bar, Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  RefreshCw,
  Star,
  Layers,
} from '@lucide/vue';
import { useAuthStore } from '../../../stores/auth.store.js';
import { sellerApi, type SellerDashboardData } from '../../../api/seller.api.js';
import { useSellerProductStore } from '../../../stores/sellerProduct.store.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const authStore = useAuthStore();
const sellerProductStore = useSellerProductStore();
const loading = ref(true);
const error = ref<string | null>(null);

const dashboardData = ref<SellerDashboardData>({
  stats: {
    revenue: 0,
    orders: 0,
    products: 0,
    lowStock: 0,
  },
  charts: {
    monthlySales: [],
    monthlyRevenue: [],
  },
  recent: {
    orders: [],
    reviews: [],
  },
});

const fetchDashboardData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await sellerApi.fetchDashboardData();
    if (response.success && response.data) {
      dashboardData.value = response.data;
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to fetch seller dashboard data.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
  sellerProductStore.fetchLowStockThreshold();
});

// Chart data mapping
const revenueChartData = computed(() => ({
  labels: dashboardData.value.charts.monthlyRevenue.map((d) => `${d.month} ${d.year}`),
  datasets: [
    {
      label: 'Monthly Revenue ($)',
      data: dashboardData.value.charts.monthlyRevenue.map((d) => d.value),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.12)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
    },
  ],
}));

const salesChartData = computed(() => ({
  labels: dashboardData.value.charts.monthlySales.map((d) => `${d.month} ${d.year}`),
  datasets: [
    {
      label: 'Units Sold',
      data: dashboardData.value.charts.monthlySales.map((d) => d.value),
      backgroundColor: 'rgba(16, 185, 129, 0.75)',
      borderRadius: 6,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true },
  },
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const statusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    processing: '#6366f1',
    shipped: '#3b82f6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };
  return colors[status] || '#a3aab8';
};
</script>

<template>
  <div class="seller-dashboard-page">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="welcome-section">
        <h1 class="page-title">Seller Studio</h1>
        <p class="page-subtitle">Welcome back, {{ authStore.user?.storeName || authStore.user?.fullName || 'Seller Partner' }}. Here is your studio performance.</p>
      </div>
      <button class="sync-btn" @click="fetchDashboardData" :disabled="loading">
        <RefreshCw :class="['btn-icon', { 'spin-animation': loading }]" /> Sync Studio
      </button>
    </header>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <AlertTriangle class="error-icon" />
      <h3>Failed to load dashboard data</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchDashboardData">Retry Loading</button>
    </div>

    <!-- Loaded Studio View -->
    <div v-else-if="!loading" class="dashboard-content-wrap">
      
      <!-- Stats Cards -->
      <section class="stats-grid">
        <!-- Revenue Card -->
        <div class="stat-card border-glow-blue">
          <div class="stat-meta">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-value">${{ dashboardData.stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="stat-icon-wrap bg-blue-dim">
            <DollarSign class="stat-icon text-blue" />
          </div>
        </div>

        <!-- Orders Card -->
        <div class="stat-card border-glow-purple">
          <div class="stat-meta">
            <span class="stat-label">Total Orders</span>
            <span class="stat-value">{{ dashboardData.stats.orders }}</span>
          </div>
          <div class="stat-icon-wrap bg-purple-dim">
            <ShoppingBag class="stat-icon text-purple" />
          </div>
        </div>

        <!-- Products Card -->
        <div class="stat-card border-glow-green">
          <div class="stat-meta">
            <span class="stat-label">Total Products</span>
            <span class="stat-value">{{ dashboardData.stats.products }}</span>
          </div>
          <div class="stat-icon-wrap bg-green-dim">
            <Package class="stat-icon text-green" />
          </div>
        </div>

        <!-- Low Stock Warning Card -->
        <div class="stat-card border-glow-amber" :class="{ 'warning-glow': dashboardData.stats.lowStock > 0 }">
          <div class="stat-meta">
            <span class="stat-label">Low Stock items (≤ {{ sellerProductStore.lowStockThreshold }})</span>
            <span class="stat-value">{{ dashboardData.stats.lowStock }}</span>
          </div>
          <div class="stat-icon-wrap" :class="dashboardData.stats.lowStock > 0 ? 'bg-amber' : 'bg-amber-dim'">
            <AlertTriangle class="stat-icon" :class="dashboardData.stats.lowStock > 0 ? 'text-dark' : 'text-amber'" />
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section class="charts-grid">
        <!-- Monthly Revenue Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Monthly Revenue Trend</h3>
            <span class="chart-badge">Line Chart</span>
          </div>
          <div class="chart-container">
            <Line :data="revenueChartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Monthly Sales Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Monthly Units Sold</h3>
            <span class="chart-badge">Bar Chart</span>
          </div>
          <div class="chart-container">
            <Bar :data="salesChartData" :options="chartOptions" />
          </div>
        </div>
      </section>

      <!-- Tables Section -->
      <section class="recent-events-grid">
        <!-- Recent Orders -->
        <div class="event-card-panel">
          <div class="panel-header">
            <div class="panel-title-wrap">
              <ShoppingBag class="panel-header-icon" />
              <h3>Recent Studio Orders</h3>
            </div>
            <router-link to="/admin/orders" class="view-all-link">Manage Orders</router-link>
          </div>
          
          <div class="table-container">
            <table v-if="dashboardData.recent.orders.length > 0" class="panel-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Share</th>
                  <th>Status</th>
                  <th>Placed At</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in dashboardData.recent.orders" :key="order._id">
                  <td class="customer-cell">{{ order.customerName }}</td>
                  <td class="price-cell">${{ order.sellerSubtotal.toFixed(2) }}</td>
                  <td>
                    <span class="status-badge" :style="{ backgroundColor: statusColor(order.status) + '15', color: statusColor(order.status) }">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="date-cell">{{ formatDate(order.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-panel-state">
              <Layers class="empty-state-icon" />
              <p>No orders containing your products yet.</p>
            </div>
          </div>
        </div>

        <!-- Recent Reviews -->
        <div class="event-card-panel">
          <div class="panel-header">
            <div class="panel-title-wrap">
              <Star class="panel-header-icon" />
              <h3>Recent Product Reviews</h3>
            </div>
          </div>
          
          <div class="reviews-list-container">
            <div v-if="dashboardData.recent.reviews.length > 0" class="reviews-stack">
              <div v-for="review in dashboardData.recent.reviews" :key="review._id" class="review-row-item">
                <div class="review-meta-line">
                  <span class="reviewer-name">{{ review.userId?.fullName || 'Anonymous' }}</span>
                  <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                </div>
                <div class="product-badge">
                  On {{ review.productId?.name }}
                </div>
                <div class="rating-row">
                  <Star v-for="star in 5" :key="star" class="review-star-icon" :class="{ active: star <= review.rating }" />
                </div>
                <p class="review-comment-text">"{{ review.comment }}"</p>
              </div>
            </div>
            <div v-else class="empty-panel-state">
              <Star class="empty-state-icon" />
              <p>No reviews have been left on your products yet.</p>
            </div>
          </div>
        </div>
      </section>

    </div>

    <!-- Loading State -->
    <div v-else class="loading-container">
      <RefreshCw class="spin-animation large-spinner" />
      <p>Synchronizing studio statistics...</p>
    </div>
  </div>
</template>

<style scoped>
.seller-dashboard-page {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 20px;
  flex-wrap: wrap;
}

.welcome-section {
  text-align: left;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--color-muted);
  margin: 0;
}

.sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.sync-btn:hover {
  background-color: var(--color-bg-alt);
  border-color: var(--color-accent);
}

.btn-icon {
  width: 15px;
  height: 15px;
}

.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Stats Cards Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.stat-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 6px;
}

.stat-label {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-primary);
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  width: 20px;
  height: 20px;
}

/* Accent Colors */
.border-glow-blue { border-left: 4px solid #3b82f6; }
.text-blue { color: #3b82f6; }
.bg-blue-dim { background-color: rgba(59, 130, 246, 0.1); }

.border-glow-purple { border-left: 4px solid #8b5cf6; }
.text-purple { color: #8b5cf6; }
.bg-purple-dim { background-color: rgba(139, 92, 246, 0.1); }

.border-glow-green { border-left: 4px solid #10b981; }
.text-green { color: #10b981; }
.bg-green-dim { background-color: rgba(16, 185, 129, 0.1); }

.border-glow-amber { border-left: 4px solid #d97706; }
.text-amber { color: #d97706; }
.bg-amber-dim { background-color: rgba(217, 119, 6, 0.1); }

.warning-glow {
  border-left: 4px solid #ef4444;
}

.bg-amber {
  background-color: #ef4444;
}

.text-dark {
  color: #ffffff;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 750;
  color: var(--color-primary);
  margin: 0;
}

.chart-badge {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-accent);
  background-color: var(--color-bg-alt);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.chart-container {
  height: 280px;
  width: 100%;
}

/* Events and Lists Grid */
.recent-events-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
}

@media (max-width: 992px) {
  .recent-events-grid {
    grid-template-columns: 1fr;
  }
}

.event-card-panel {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12px;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-header-icon {
  width: 20px;
  height: 20px;
  color: var(--color-accent);
}

.panel-header h3 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 750;
  color: var(--color-primary);
  margin: 0;
}

.view-all-link {
  font-family: var(--font-sans);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-accent);
  text-decoration: none;
  transition: opacity var(--duration-fast);
}

.view-all-link:hover {
  text-decoration: underline;
  opacity: 0.85;
}

/* Panel Table */
.table-container {
  width: 100%;
  overflow-x: auto;
}

.panel-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.panel-table th {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-muted);
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.panel-table td {
  font-family: var(--font-sans);
  font-size: 0.88rem;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.customer-cell {
  font-weight: 650;
  color: var(--color-primary);
}

.price-cell {
  font-family: var(--font-mono);
  font-weight: 600;
}

.status-badge {
  font-size: 0.72rem;
  font-weight: 750;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  display: inline-block;
}

.date-cell {
  color: var(--color-muted);
  font-size: 0.82rem;
}

/* Reviews Panel */
.reviews-list-container {
  width: 100%;
}

.reviews-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-row-item {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 16px;
  text-align: left;
}

.review-row-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.review-meta-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.reviewer-name {
  font-family: var(--font-sans);
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-primary);
}

.review-date {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--color-muted);
}

.product-badge {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--color-accent);
  background-color: var(--color-bg-alt);
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  font-weight: 600;
}

.rating-row {
  display: flex;
  gap: 3px;
  margin-bottom: 8px;
}

.review-star-icon {
  width: 14px;
  height: 14px;
  color: var(--color-border);
  fill: transparent;
}

.review-star-icon.active {
  color: #ffbe0b;
  fill: #ffbe0b;
}

.review-comment-text {
  font-family: var(--font-sans);
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--color-text-light);
  margin: 0;
  font-style: italic;
}

/* Empty State */
.empty-panel-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: var(--color-muted);
  gap: 12px;
}

.empty-state-icon {
  width: 36px;
  height: 36px;
  color: var(--color-border);
}

.empty-panel-state p {
  font-family: var(--font-sans);
  font-size: 0.88rem;
  margin: 0;
}

/* Loading container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 24px;
  color: var(--color-muted);
  gap: 16px;
}

.large-spinner {
  width: 48px;
  height: 48px;
  color: var(--color-accent);
}

/* Error Banner */
.error-banner {
  text-align: center;
  padding: 80px 24px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  max-width: 500px;
  margin: 0 auto;
}

.error-icon {
  width: 40px;
  height: 40px;
  color: #ef4444;
  margin-bottom: 16px;
}

.error-banner h3 {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.error-banner p {
  font-family: var(--font-sans);
  color: var(--color-muted);
  margin: 0 0 24px 0;
}

.retry-btn {
  padding: 10px 24px;
  background-color: var(--color-primary);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--duration-fast);
}

.retry-btn:hover {
  opacity: 0.9;
}
</style>
