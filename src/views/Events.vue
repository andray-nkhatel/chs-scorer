<script setup>
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import apiClient from '../service/api.service';

const toast = useToast();
const events = ref([]);
const loading = ref(true);
const error = ref(null);

// Dialog states for add/edit functionality
const eventDialog = ref(false);
const deleteEventDialog = ref(false);
const event = ref({
  id: null,
  name: '',
  eventTypeId: null,
  eventTypeName: '',
  categoryId: null,
  categoryName: '',
  scheduledTime: null
});
const selectedEvents = ref(null);
const submitted = ref(false);
const editMode = ref(false);

// Data for dropdowns
const eventTypes = ref([]);
const categories = ref([]);

// Load event types
const loadEventTypes = () => {
  apiClient.get('/eventtypes')
    .then(response => {
      eventTypes.value = response.data.map(type => ({
        label: type.name,
        value: type.id,
        name: type.name
      }));
    })
    .catch(err => {
      console.error('Error loading event types:', err);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load event types', life: 3000 });
    });
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

// Fetch events data
const fetchEvents = () => {
  loading.value = true;
  error.value = null;
  
  apiClient.get('/events')
    .then(response => {
      events.value = response.data;
      console.log('Events loaded:', events.value);
    })
    .catch(err => {
      console.error('Error fetching events:', err);
      error.value = 'Failed to load events. Please try again later.';
      toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 3000 });
    })
    .finally(() => {
      loading.value = false;
    });
};

// Format date for display
const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Open dialog to add new event
const openNew = () => {
  event.value = {
    id: null,
    name: '',
    eventTypeId: null,
    eventTypeName: '',
    categoryId: null,
    categoryName: '',
    scheduledTime: new Date()
  };
  submitted.value = false;
  eventDialog.value = true;
  editMode.value = false;
};

// Open dialog to edit event
const editEvent = (editEvent) => {
  event.value = { 
    ...editEvent,
    scheduledTime: new Date(editEvent.scheduledTime)
  };
  eventDialog.value = true;
  editMode.value = true;
};

// Confirm event deletion
const confirmDeleteEvent = (eventToDelete) => {
  event.value = eventToDelete;
  deleteEventDialog.value = true;
};

// Hide the dialog
const hideDialog = () => {
  eventDialog.value = false;
  submitted.value = false;
};

// Event type selection change handler
const onEventTypeChange = () => {
  if (event.value.eventTypeId) {
    const selectedType = eventTypes.value.find(t => t.value === event.value.eventTypeId);
    if (selectedType) {
      event.value.eventTypeName = selectedType.name;
    }
  } else {
    event.value.eventTypeName = '';
  }
};

// Category selection change handler
const onCategoryChange = () => {
  if (event.value.categoryId) {
    const selectedCategory = categories.value.find(c => c.value === event.value.categoryId);
    if (selectedCategory) {
      event.value.categoryName = selectedCategory.name;
    }
  } else {
    event.value.categoryName = '';
  }
};

// Save event (add or update)
const saveEvent = () => {
  submitted.value = true;
  
  if (!event.value.name?.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Event name is required', life: 3000 });
    return;
  }
  
  if (!event.value.eventTypeId) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Event type is required', life: 3000 });
    return;
  }
  
  if (!event.value.categoryId) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Category is required', life: 3000 });
    return;
  }
  
  if (!event.value.scheduledTime) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Scheduled time is required', life: 3000 });
    return;
  }

  // Ensure proper format for API
  const eventToSave = {
    ...event.value,
    scheduledTime: event.value.scheduledTime.toISOString()
  };
  
  if (editMode.value) {
    // Update existing event
    apiClient.put(`/events/${eventToSave.id}`, eventToSave)
      .then(() => {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Event Updated', life: 3000 });
        fetchEvents();
        eventDialog.value = false;
      })
      .catch(err => {
        console.error('Error updating event:', err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update event', life: 3000 });
      });
  } else {
    // Add new event
    apiClient.post('/events', eventToSave)
      .then(() => {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Event Added', life: 3000 });
        fetchEvents();
        eventDialog.value = false;
      })
      .catch(err => {
        console.error('Error adding event:', err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add event', life: 3000 });
      });
  }
};

// Delete event
const deleteEvent = () => {
  apiClient.delete(`/events/${event.value.id}`)
    .then(() => {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Event Deleted', life: 3000 });
      fetchEvents();
      deleteEventDialog.value = false;
    })
    .catch(err => {
      console.error('Error deleting event:', err);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete event', life: 3000 });
    });
};

// Export to CSV
const exportCSV = () => {
  // Simple CSV export function
  const downloadCSV = () => {
    const csv = [
      // CSV header
      Object.keys(events.value[0] || {}).join(','),
      // CSV rows
      ...events.value.map(item => 
        Object.values(item).map(val => {
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          if (val instanceof Date) return `"${val.toISOString()}"`;
          return val;
        }).join(',')
      )
    ].join('\n');
    
    // Create a blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'events.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (events.value.length > 0) {
    downloadCSV();
  } else {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'No data to export', life: 3000 });
  }
};

// Load data on component mount
onMounted(() => {
  fetchEvents();
  loadEventTypes();
  loadCategories();
});
</script>

<template>
  <div class="events-page p-4">
    <Toast />
    
    <div class="card">
      <h1 class="text-2xl font-bold mb-4">Events</h1>
      
      <!-- Toolbar -->
      <div class="flex justify-between items-center mb-4">
        <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
        <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV" />
      </div>
      
      <!-- Data Table -->
      <DataTable 
        :value="events" 
        v-model:selection="selectedEvents" 
        dataKey="id"
        :paginator="true" 
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} events"
        responsiveLayout="scroll"
        :loading="loading"
        stripedRows
        :filters="null"
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="text-center p-4" v-if="!loading && !error">
            No events found.
          </div>
          <div class="text-center text-red-500 p-4" v-if="error">
            {{ error }}
          </div>
        </template>
        
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="id" header="ID" sortable style="width: 4rem"></Column>
        <Column field="name" header="Name" sortable style="min-width: 14rem"></Column>
        <Column field="eventTypeName" header="Event Type" sortable style="width: 10rem"></Column>
        <Column field="categoryName" header="Category" sortable style="width: 10rem"></Column>
        <Column field="scheduledTime" header="Scheduled Time" sortable style="width: 12rem">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.scheduledTime) }}
          </template>
        </Column>
        <Column :exportable="false" style="width: 8rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editEvent(slotProps.data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDeleteEvent(slotProps.data)" />
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Add/Edit Event Dialog -->
    <Dialog v-model:visible="eventDialog" :style="{width: '450px'}" header="Event Details" :modal="true" class="p-fluid">
      <div class="field">
        <label for="name">Name</label>
        <InputText id="name" v-model="event.name" required autofocus :class="{'p-invalid': submitted && !event.name}" />
        <small class="p-error" v-if="submitted && !event.name">Event name is required.</small>
      </div>
      
      <div class="field">
        <label for="eventType">Event Type</label>
        <Dropdown id="eventType" v-model="event.eventTypeId" :options="eventTypes" optionLabel="label" optionValue="value" 
          placeholder="Select an Event Type" :class="{'p-invalid': submitted && !event.eventTypeId}"
          @change="onEventTypeChange" />
        <small class="p-error" v-if="submitted && !event.eventTypeId">Event type is required.</small>
      </div>
      
      <div class="field">
        <label for="category">Category</label>
        <Dropdown id="category" v-model="event.categoryId" :options="categories" optionLabel="label" optionValue="value" 
          placeholder="Select a Category" :class="{'p-invalid': submitted && !event.categoryId}"
          @change="onCategoryChange" />
        <small class="p-error" v-if="submitted && !event.categoryId">Category is required.</small>
      </div>
      
      <div class="field">
        <label for="scheduledTime">Scheduled Time</label>
        <Calendar id="scheduledTime" v-model="event.scheduledTime" showTime hourFormat="12" 
          :class="{'p-invalid': submitted && !event.scheduledTime}" />
        <small class="p-error" v-if="submitted && !event.scheduledTime">Scheduled time is required.</small>
      </div>
      
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveEvent" />
      </template>
    </Dialog>
    
    <!-- Delete Event Dialog -->
    <Dialog v-model:visible="deleteEventDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span v-if="event">Are you sure you want to delete <b>{{ event.name }}</b>?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteEventDialog = false" />
        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteEvent" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.events-page {
  background-color: var(--surface-card);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.field {
  margin-bottom: 1.5rem;
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