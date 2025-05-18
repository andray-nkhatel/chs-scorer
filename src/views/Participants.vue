<script setup>
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import apiClient from '../service/api.service';

const toast = useToast();
const participants = ref([]);
const loading = ref(true);
const error = ref(null);

// Dialog states for add/edit functionality
const participantDialog = ref(false);
const deleteParticipantDialog = ref(false);
const participant = ref({
  id: null,
  fullName: '',
  age: null,
  gender: '',
  houseId: null,
  houseName: ''
});
const selectedParticipants = ref(null);
const submitted = ref(false);
const editMode = ref(false);

// Gender options for dropdown
const genderOptions = ref([
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' }
]);

// Houses data for dropdown (you might want to fetch this from API)
const houses = ref([
  { label: 'Kudu', value: 1, name: 'Kudu' },
  { label: 'Sable', value: 2, name: 'Sable' },
  { label: 'Eland', value: 3, name: 'Eland' },
  
]);

// Fetch participants data
const fetchParticipants = () => {
  loading.value = true;
  error.value = null;
  
  apiClient.get('/participants')
    .then(response => {
      participants.value = response.data;
      console.log('Participants loaded:', participants.value);
    })
    .catch(err => {
      console.error('Error fetching participants:', err);
      error.value = 'Failed to load participants. Please try again later.';
      toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 3000 });
    })
    .finally(() => {
      loading.value = false;
    });
};

// Open dialog to add new participant
const openNew = () => {
  participant.value = {
    id: null,
    fullName: '',
    age: null,
    gender: '',
    houseId: null,
    houseName: ''
  };
  submitted.value = false;
  participantDialog.value = true;
  editMode.value = false;
};

// Open dialog to edit participant
const editParticipant = (editParticipant) => {
  participant.value = { ...editParticipant };
  participantDialog.value = true;
  editMode.value = true;
};

// Confirm participant deletion
const confirmDeleteParticipant = (participantToDelete) => {
  participant.value = participantToDelete;
  deleteParticipantDialog.value = true;
};

// Hide the dialog
const hideDialog = () => {
  participantDialog.value = false;
  submitted.value = false;
};

// Save participant (add or update)
const saveParticipant = () => {
  submitted.value = true;
  
  if (!participant.value.fullName?.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Name is required', life: 3000 });
    return;
  }
  
  // Set houseName based on selected houseId
  if (participant.value.houseId) {
    const selectedHouse = houses.value.find(h => h.value === participant.value.houseId);
    if (selectedHouse) {
      participant.value.houseName = selectedHouse.name;
    }
  }
  
  if (editMode.value) {
    // Update existing participant
    apiClient.put(`/participants/${participant.value.id}`, participant.value)
      .then(() => {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Participant Updated', life: 3000 });
        fetchParticipants();
        participantDialog.value = false;
        participant.value = {};
      })
      .catch(err => {
        console.error('Error updating participant:', err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update participant', life: 3000 });
      });
  } else {
    // Add new participant
    apiClient.post('/participants', participant.value)
      .then(() => {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Participant Added', life: 3000 });
        fetchParticipants();
        participantDialog.value = false;
        participant.value = {};
      })
      .catch(err => {
        console.error('Error adding participant:', err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add participant', life: 3000 });
      });
  }
};

// Delete participant
const deleteParticipant = () => {
  apiClient.delete(`/participants/${participant.value.id}`)
    .then(() => {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Participant Deleted', life: 3000 });
      fetchParticipants();
      deleteParticipantDialog.value = false;
      participant.value = {};
    })
    .catch(err => {
      console.error('Error deleting participant:', err);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete participant', life: 3000 });
    });
};

// Export to CSV
const exportCSV = () => {
  // Using require instead of dynamic import to avoid TypeScript errors
  const downloadCSV = () => {
    const csv = [
      // CSV header
      Object.keys(participants.value[0] || {}).join(','),
      // CSV rows
      ...participants.value.map(item => 
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
    link.setAttribute('download', 'participants.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (participants.value.length > 0) {
    downloadCSV();
  } else {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'No data to export', life: 3000 });
  }
};

// Load data on component mount
onMounted(() => {
  fetchParticipants();
});
</script>

<template>
  <div class="participants-page p-4">
    <Toast />
    
    <div class="card">
      <h1 class="text-2xl font-bold mb-4">Participants</h1>
      
      <!-- Toolbar -->
      <div class="flex justify-between items-center mb-4">
        <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
        <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV" />
      </div>
      
      <!-- Data Table -->
      <DataTable 
        :value="participants" 
        v-model:selection="selectedParticipants" 
        dataKey="id"
        :paginator="true" 
        :rows="100"
        :rowsPerPageOptions="[5, 10, 25]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} participants"
        responsiveLayout="scroll"
        :loading="loading"
        stripedRows
        :filters="null"
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="text-center p-4" v-if="!loading && !error">
            No participants found.
          </div>
          <div class="text-center text-red-500 p-4" v-if="error">
            {{ error }}
          </div>
        </template>
        
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="id" header="ID" sortable style="width: 5rem"></Column>
        <Column field="fullName" header="Name" sortable style="min-width: 16rem"></Column>
        <Column field="age" header="Age" sortable style="width: 8rem"></Column>
        <Column field="gender" header="Gender" sortable style="width: 10rem"></Column>
        <Column field="houseName" header="House" sortable style="width: 12rem"></Column>
        <Column :exportable="false" style="width: 8rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editParticipant(slotProps.data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDeleteParticipant(slotProps.data)" />
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Add/Edit Participant Dialog -->
    <Dialog v-model:visible="participantDialog" :style="{width: '450px'}" header="Participant Details" :modal="true" class="p-fluid">
      <div class="field">
        <label for="name">Name</label>
        <InputText id="name" v-model="participant.fullName" class="w-full" required autofocus :class="{'p-invalid': submitted && !participant.fullName}" />
        <small class="p-error" v-if="submitted && !participant.fullName">Name is required.</small>
      </div>
      <div class="field">
        <label for="age">Age</label>
        <InputNumber id="age" v-model="participant.age" class="w-full" required :min="0" :max="120" />
      </div>
      <div class="field">
        <label for="gender">Gender</label>
        <Dropdown id="gender" v-model="participant.gender" class="w-full" :options="genderOptions" optionLabel="label" optionValue="value" placeholder="Select a Gender" />
      </div>
      <div class="field">
        <label for="house">House</label>
        <Dropdown id="house" v-model="participant.houseId" class="w-full" :options="houses" optionLabel="label" optionValue="value" placeholder="Select a House" />
      </div>
      
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveParticipant" />
      </template>
    </Dialog>
    
    <!-- Delete Participant Dialog -->
    <Dialog v-model:visible="deleteParticipantDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span v-if="participant">Are you sure you want to delete <b>{{ participant.fullName }}</b>?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteParticipantDialog = false" />
        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteParticipant" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.participants-page {
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