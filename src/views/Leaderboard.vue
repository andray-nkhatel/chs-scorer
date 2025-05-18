<script setup>
import Button from 'primevue/button';
import Chart from 'primevue/chart';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import apiClient from '../service/api.service';

const toast = useToast();
const houses = ref([]);
const loading = ref(true);
const error = ref(null);
const chartData = ref(null);
const chartOptions = ref(null);

// Fetch leaderboard data
const fetchLeaderboard = () => {
  loading.value = true;
  error.value = null;
  
  apiClient.get('/leaderboard')
    .then(response => {
      houses.value = response.data;
      console.log('Leaderboard loaded:', houses.value);
      
      // Prepare chart data after loading
      prepareChartData();
    })
    .catch(err => {
      console.error('Error fetching leaderboard:', err);
      error.value = 'Failed to load leaderboard. Please try again later.';
      toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 3000 });
    })
    .finally(() => {
      loading.value = false;
    });
};

// Prepare chart data
const prepareChartData = () => {
  // Sort houses by points for the chart (highest first)
  const sortedHouses = [...houses.value].sort((a, b) => b.totalPoints - a.totalPoints);
  
  chartData.value = {
    labels: sortedHouses.map(house => house.houseName),
    datasets: [
      {
        label: 'Total Points',
        data: sortedHouses.map(house => house.totalPoints),
        backgroundColor: sortedHouses.map(house => house.color || getDefaultColor(house.houseName)),
        borderColor: sortedHouses.map(house => house.color || getDefaultColor(house.houseName)),
        borderWidth: 1
      }
    ]
  };
  
  chartOptions.value = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Points'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Houses'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return tooltipItems[0].label;
          },
          label: (tooltipItem) => {
            return `Points: ${tooltipItem.raw}`;
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };
};

// Get default color based on house name if no color is provided
const getDefaultColor = (houseName) => {
  const colorMap = {
    'Kudu': '#ff6b6b',
    'Sable': '#4dabf7',
    'Eland': '#ffdf3b'
    
  };
  
  // Try to match by name
  for (const [key, value] of Object.entries(colorMap)) {
    if (houseName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Default fallback - generate a color based on the name
  let hash = 0;
  for (let i = 0; i < houseName.length; i++) {
    hash = houseName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

// Export to CSV
const exportCSV = () => {
  // Simple CSV export function
  const downloadCSV = () => {
    const csv = [
      // CSV header
      Object.keys(houses.value[0] || {}).join(','),
      // CSV rows
      ...houses.value.map(item => 
        Object.values(item).map(val => 
          typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        ).join(',')
      )
    ].join('\n');
    
    // Create a blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'leaderboard.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (houses.value.length > 0) {
    downloadCSV();
  } else {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'No data to export', life: 3000 });
  }
};

// Refresh leaderboard data
const refreshLeaderboard = () => {
  fetchLeaderboard();
  toast.add({ severity: 'info', summary: 'Refreshed', detail: 'Leaderboard data updated', life: 2000 });
};

// Computed property for medal emoji based on rank
const getMedalEmoji = (rank) => {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return rank;
  }
};

// Load data on component mount
onMounted(() => {
  fetchLeaderboard();
});
</script>

<template>
  <div class="leaderboard-page p-4">
    <Toast />
    
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">House Leaderboard</h1>
        <div>
          <Button icon="pi pi-refresh" class="p-button-outlined mr-2" @click="refreshLeaderboard" />
          <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV" />
        </div>
      </div>
      
      <!-- Top Houses Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" v-if="houses.length > 0 && !loading">
        <div v-for="house in houses.filter(h => h.rank <= 3).sort((a, b) => a.rank - b.rank)" :key="house.houseId"
          class="podium-card p-4 rounded-lg shadow-md" 
          :style="{ backgroundColor: house.color ? house.color + '20' : getDefaultColor(house.houseName) + '20', 
                   borderLeft: '4px solid ' + (house.color || getDefaultColor(house.houseName)) }">
          <div class="flex items-center">
            <div class="rank-badge" :class="`rank-${house.rank}`">
              {{ house.rank === 1 ? '🥇' : house.rank === 2 ? '🥈' : '🥉' }}
            </div>
            <div class="ml-4">
              <h2 class="text-xl font-bold">{{ house.houseName }}</h2>
              <p class="text-2xl font-bold mt-1">{{ house.totalPoints }} points</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Chart -->
      <div class="mb-6" v-if="chartData && !loading" style="height: 300px;">
        <Chart type="bar" :data="chartData" :options="chartOptions" />
      </div>
      
      <!-- Data Table -->
      <DataTable 
        :value="houses" 
        dataKey="houseId"
        :paginator="true" 
        :rows="10"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} houses"
        responsiveLayout="scroll"
        :loading="loading"
        stripedRows
        :filters="null"
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="text-center p-4" v-if="!loading && !error">
            No leaderboard data found.
          </div>
          <div class="text-center text-red-500 p-4" v-if="error">
            {{ error }}
          </div>
        </template>
        
        <Column field="rank" header="Rank" sortable style="width: 6rem">
          <template #body="slotProps">
            <div class="flex justify-center items-center">
              <span class="rank-number" :class="{ 
                'rank-1': slotProps.data.rank === 1,
                'rank-2': slotProps.data.rank === 2,
                'rank-3': slotProps.data.rank === 3
              }">
                {{ getMedalEmoji(slotProps.data.rank) }}
              </span>
            </div>
          </template>
        </Column>
        <Column field="houseName" header="House" sortable style="min-width: 12rem">
          <template #body="slotProps">
            <div class="flex items-center">
              <div class="color-dot mr-2" :style="{ backgroundColor: slotProps.data.color || getDefaultColor(slotProps.data.houseName) }"></div>
              <span>{{ slotProps.data.houseName }}</span>
            </div>
          </template>
        </Column>
        <Column field="totalPoints" header="Total Points" sortable style="width: 10rem">
          <template #body="slotProps">
            <div class="font-bold">{{ slotProps.data.totalPoints }}</div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-page {
  background-color: var(--surface-card);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.podium-card {
  transition: transform 0.2s;
}

.podium-card:hover {
  transform: translateY(-5px);
}

.rank-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background-color: #f8f9fa;
}

.rank-number {
  font-weight: bold;
  font-size: 1.2rem;
}

.rank-1 {
  color: gold;
  font-size: 1.6rem;
}

.rank-2 {
  color: silver;
  font-size: 1.5rem;
}

.rank-3 {
  color: #cd7f32; /* Bronze */
  font-size: 1.4rem;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>