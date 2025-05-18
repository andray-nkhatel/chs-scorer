<script setup>
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import apiClient from '../service/api.service';

import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const isAdmin = computed(() => store.getters['auth/hasRole']('Admin'));


const toast = useToast();
const results = ref([]);
const loading = ref(true);
const error = ref(null);

// Dialog states for add/edit functionality
const resultDialog = ref(false);
const deleteResultDialog = ref(false);
const result = ref({
  id: null,
  participantId: null,
  participantName: '',
  eventId: null,
  eventName: '',
  position: null,
  points: null,
  categoryId: null,   
  categoryName: '',  
});
const selectedResults = ref(null);
const submitted = ref(false);
const editMode = ref(false);

// Data for dropdowns
const participants = ref([]);
const events = ref([]);
// For selecting categories, you need a separate categories array:
const categories = ref([]);

// Load participants
const loadParticipants = () => {
  apiClient.get('/participants')
    .then(response => {
      participants.value = response.data.map(participant => ({
        label: participant.fullName,
        value: participant.id,
        name: participant.fullName,
        houseName: participant.houseName,  // Keep the houseName property
        houseId: participant.houseId   
      }));
    })
    .catch(err => {
      console.error('Error loading participants:', err);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load participants', life: 3000 });
    });
};

const getHouseNameForParticipant = (participantId) => {
    // Find the participant with the matching ID
    const participant = participants.value.find(p => p.value === participantId);
    // Return the house name if found, otherwise return a placeholder
    return participant ? participant.houseName : 'N/A';
  }

// Load events
const loadEvents = () => {
  apiClient.get('/events')
    .then(response => {
      events.value = response.data.map(event => ({
        label: event.name,
        value: event.id,
        name: event.name,
        categoryId: event.categoryId,
        categoryName: event.categoryName,
      }));
    })
    .catch(err => {
      console.error('Error loading events:', err);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load events', life: 3000 });
    });
};

const getCategoryNameForEvent = (eventId) => {
    // Find the event with the matching ID
    const event = events.value.find(e => e.value === eventId);
    // Return the category name if found, otherwise return a placeholder
    return event ? event.categoryName : 'N/A';
  }

// Fetch results data
const fetchResults = () => {
  loading.value = true;
  error.value = null;
  
  apiClient.get('/results')
    .then(response => {
      results.value = response.data;
      console.log('Results loaded:', results.value);
    })
    .catch(err => {
      console.error('Error fetching results:', err);
      error.value = 'Failed to load results. Please try again later.';
      toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 3000 });
    })
    .finally(() => {
      loading.value = false;
    });
};

// Open dialog to add new result
const openNew = () => {
  result.value = {
    id: null,
    participantId: null,
    participantName: '',
    eventId: null,
    eventName: '',
    position: null,
    points: null,
    categoryId: null,   
    categoryName: '',   
  };
  submitted.value = false;
  resultDialog.value = true;
  editMode.value = false;
};

// Open dialog to edit result
const editResult = (editResult) => {
  result.value = { ...editResult };
  resultDialog.value = true;
  editMode.value = true;
};

// Confirm result deletion
const confirmDeleteResult = (resultToDelete) => {
  result.value = resultToDelete;
  deleteResultDialog.value = true;
};

// Hide the dialog
const hideDialog = () => {
  resultDialog.value = false;
  submitted.value = false;
};

// Participant selection change handler
const onParticipantChange = () => {
  if (result.value.participantId) {
    const selectedParticipant = participants.value.find(p => p.value === result.value.participantId);
    if (selectedParticipant) {
      result.value.participantName = selectedParticipant.name;
    }
  } else {
    result.value.participantName = '';
  }
};

// Event selection change handler
const onEventChange = () => {
  if (result.value.eventId) {
    const selectedEvent = events.value.find(e => e.value === result.value.eventId);
    if (selectedEvent) {
      result.value.eventName = selectedEvent.name;
    }
  } else {
    result.value.eventName = '';
  }
};



// Load categories
const loadCategories = () => {
  apiClient.get('/categories') 
    .then(response => {
      categories.value = response.data.map(category => ({
        label: category.name,
        value: category.id,
        name: category.name
      }));
    })
    .catch(err => {
      console.error('Error loading categories:', err);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load categories', life: 3000 });
    });
};

// Category selection change handler
const onCategoryChange = () => {
  if (result.value.categoryId) {
    const selectedCategory = categories.value.find(c => c.value === result.value.categoryId);
    if (selectedCategory) {
      result.value.categoryName = selectedCategory.name;
    }
  } else {
    result.value.categoryName = '';
  }
};

// Calculate points based on position
// const calculatePoints = () => {
//   if (result.value.position) {
//     // Example point calculation: 10 points for 1st, 8 for 2nd, 6 for 3rd, 4 for 4th, 2 for 5th, 1 for 6th
//     const pointsMap = { 1: 10, 2: 8, 3: 6, 4: 4, 5: 2, 6: 1 };
//     result.value.points = pointsMap[result.value.position] || 0;
//   } else {
//     result.value.points = 0;
//   }
// };

const calculatePoints = () => {
  if (result.value.position && result.value.position > 0) {
    // 1st place = 1 point, 2nd = 2 points, etc.
    result.value.points = result.value.position;
  } else {
    result.value.points = 0;
  }
};

// Save result (add or update)
const saveResult = () => {
  submitted.value = true;
  
  if (!result.value.participantId) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Participant is required', life: 3000 });
    return;
  }
  
  if (!result.value.eventId) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Event is required', life: 3000 });
    return;
  }
  
  if (!result.value.position || result.value.position < 1) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Position must be a positive number', life: 3000 });
    return;
  }
  
  // Calculate points if not set
  if (!result.value.points) {
    calculatePoints();
  }
  
  if (editMode.value) {
    // Update existing result
    apiClient.put(`/results/${result.value.id}`, result.value)
      .then(() => {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Result Updated', life: 3000 });
        fetchResults();
        resultDialog.value = false;
      })
      .catch(err => {
        console.error('Error updating result:', err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update result', life: 3000 });
      });
  } else {
    // Add new result
    apiClient.post('/results', result.value)
      .then(() => {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Result Added', life: 3000 });
        fetchResults();
        resultDialog.value = false;
      })
      .catch(err => {
        console.error('Error adding result:', err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add result', life: 3000 });
      });
  }
};

// Delete result
const deleteResult = () => {
  apiClient.delete(`/results/${result.value.id}`)
    .then(() => {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Result Deleted', life: 3000 });
      fetchResults();
      deleteResultDialog.value = false;
    })
    .catch(err => {
      console.error('Error deleting result:', err);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete result', life: 3000 });
    });
};

// Export to CSV
const exportCSV = () => {
  // Simple CSV export function
  const downloadCSV = () => {
    const csv = [
      // CSV header
      Object.keys(results.value[0] || {}).join(','),
      // CSV rows
      ...results.value.map(item => 
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
    link.setAttribute('download', 'results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (results.value.length > 0) {
    downloadCSV();
  } else {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'No data to export', life: 3000 });
  }
};

// Load data on component mount
onMounted(() => {

  fetchResults();
  loadParticipants();
  loadEvents();
  loadCategories();


   
  
});
</script>

<template>
  <div class="results-page p-4">
    <Toast />
    
    <div class="card">
      <h1 class="text-2xl font-bold mb-4">Results</h1>
      
      <!-- Toolbar -->
      <div class="flex justify-between items-center mb-4">
        <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
        <Button v-if="isAdmin" label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV" />
      </div>
      
      <!-- Data Table -->
      <DataTable 
        :value="results" 
        v-model:selection="selectedResults" 
        dataKey="id"
        :paginator="true" 
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} results"
        responsiveLayout="scroll"
        :loading="loading"
        stripedRows
        :filters="null"
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="text-center p-4" v-if="!loading && !error">
            No results found.
          </div>
          <div class="text-center text-red-500 p-4" v-if="error">
            {{ error }}
          </div>
        </template>
        
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="id" header="ID" sortable style="width: 4rem"></Column>
        <Column field="participantName" header="Participant" sortable style="min-width: 8rem"></Column>
        <Column field="eventName" header="Event" sortable style="min-width: 8rem"></Column>
        <Column field="position" header="Position" sortable style="width: 8rem">
          <template #body="slotProps">
            <span :class="{'text-green-600 font-bold': slotProps.data.position === 1, 
                         'text-blue-600 font-bold': slotProps.data.position === 2,
                         'text-orange-600 font-bold': slotProps.data.position === 3}">
              {{ slotProps.data.position }}
            </span>
          </template>
        </Column>
        <Column field="houseName" header="House" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <span>{{ getHouseNameForParticipant(slotProps.data.participantId) }}</span>
                </template>
        </Column>
        <Column field="categoryName" header="Category" sortable style="min-width: 8rem">
                <template #body="slotProps">
                <span>{{ getCategoryNameForEvent(slotProps.data.eventId) }}</span>
                </template>
        </Column>
        <Column field="points" header="Points" sortable style="width: 8rem"></Column>
        <Column :exportable="false" style="width: 8rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editResult(slotProps.data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDeleteResult(slotProps.data)" />
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Add/Edit Result Dialog -->
    <Dialog v-model:visible="resultDialog" :style="{width: '450px'}" header="Result Details" :modal="true" class="p-fluid">
      <div class="field">
        <label for="participant">Participant</label>
        <Dropdown id="participant" v-model="result.participantId" class="w-full" :options="participants" optionLabel="label" optionValue="value" 
          placeholder="Select a Participant" :class="{'p-invalid': submitted && !result.participantId}"
          @change="onParticipantChange" />
        <small class="p-error" v-if="submitted && !result.participantId">Participant is required.</small>
      </div>
      
      <div class="field">
        <label for="event">Event</label>
        <Dropdown id="event" v-model="result.eventId" :options="events" class="w-full" optionLabel="label" optionValue="value" 
          placeholder="Select an Event" :class="{'p-invalid': submitted && !result.eventId}"
          @change="onEventChange" />
        <small class="p-error" v-if="submitted && !result.eventId">Event is required.</small>
      </div>

      <div class="field">
            <label for="category">Category</label>
            <Dropdown 
            id="category" 
            v-model="result.categoryId" 
            :options="categories" 
            class="w-full" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Select a Category" 
            :class="{'p-invalid': submitted && !result.categoryId}"
            @change="onCategoryChange" />
            <small class="p-error" v-if="submitted && !result.categoryId">Category is required.</small>
     </div>
      
      <div class="field">
        <label for="position">Position</label>
        <InputNumber id="position" v-model="result.position" class="w-full" :min="1" :max="100" showButtons
          :class="{'p-invalid': submitted && (!result.position || result.position < 1)}"
          @change="calculatePoints" />
        <small class="p-error" v-if="submitted && (!result.position || result.position < 1)">
          Position is required and must be a positive number.
        </small>
      </div>
      
      <div class="field">
        <label for="points">Points</label>
        <InputNumber id="points" v-model="result.points" :min="0" class="w-full" showButtons />
        <small class="text-gray-500">Points will be calculated automatically based on position, but can be overridden.</small>
      </div>
      
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveResult" />
      </template>
    </Dialog>
    
    <!-- Delete Result Dialog -->
    <Dialog v-model:visible="deleteResultDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span v-if="result">Are you sure you want to delete the result for <b>{{ result.participantName }}</b> in <b>{{ result.eventName }}</b>?</span>
      </div>
      <template #footer>
       
          <Button  label="No" icon="pi pi-times" class="p-button-text" @click="deleteResultDialog = false" />
          <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteResult" />
       
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.results-page {
  background-color: var(--surface-card);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.field {
  margin-bottom: 1.5rem;
  width: auto;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.confirmation-content {
  display: flex;
  align-items: center;
}
</style>