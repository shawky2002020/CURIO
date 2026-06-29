<script setup lang="ts">
/**
 * BaseTable Component
 * Reusable generic table layout supporting skeleton loaders, empty states,
 * and cell-specific rendering slots.
 */
interface TableHeader {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface Props {
  headers: TableHeader[];
  items: any[];
  loading?: boolean;
  emptyText?: string;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: 'No records found.',
});
</script>

<template>
  <div class="table-card">
    <!-- Table Loading Skeleton -->
    <div v-if="loading" class="skeleton-container" role="status" aria-label="Loading data">
      <div v-for="i in 5" :key="i" class="skeleton-row"></div>
    </div>

    <!-- Table Scroll Container -->
    <div v-else class="table-scroll-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th
              v-for="header in headers"
              :key="header.key"
              :style="{ textAlign: header.align || 'left', width: header.width }"
            >
              {{ header.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="item._id || index" class="table-row">
            <td
              v-for="header in headers"
              :key="header.key"
              :style="{ textAlign: header.align || 'left' }"
            >
              <!-- Slot override for specific cells e.g. #cell(fullName) -->
              <slot :name="`cell(${header.key})`" :item="item" :index="index">
                {{ item[header.key] !== undefined && item[header.key] !== null ? item[header.key] : '—' }}
              </slot>
            </td>
          </tr>
          <!-- Empty State -->
          <tr v-if="!items.length">
            <td :colspan="headers.length" class="empty-state-cell">
              <slot name="empty">
                <div class="empty-state-container">
                  <h4>{{ emptyText }}</h4>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-sizing: border-box;
}

.table-scroll-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  text-align: left;
}

thead th {
  padding: 14px 20px;
  font-weight: 700;
  color: var(--color-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

tbody td {
  padding: 14px 20px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

.table-row {
  transition: background-color var(--duration-fast) var(--ease-out);
}

.table-row:hover {
  background-color: rgba(247, 239, 229, 0.3); /* Muted warm background hover */
}

.empty-state-cell {
  text-align: center !important;
  padding: 64px 24px !important;
}

.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 360px;
  margin: 0 auto;
}

.empty-state-container h4 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

/* Shimmer Loading skeletons */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.skeleton-row {
  height: 52px;
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-bg-alt) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-md);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
