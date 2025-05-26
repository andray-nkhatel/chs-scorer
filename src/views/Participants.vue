
<script setup>
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import apiClient from '../service/api.service';
const store = useStore();
const toast = useToast();
const participants = ref([]);
const loading = ref(true);
const error = ref(null);
const fileUploadRef = ref(null);

const participantDialog = ref(false);
const deleteParticipantDialog = ref(false);
const bulkImportDialog = ref(false);
const importResults = ref(null);
const importLoading = ref(false);
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

const genderOptions = ref([
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' }
]);

const houses = ref([
  { label: 'Kudu', value: 1, name: 'Kudu' },
  { label: 'Sable', value: 2, name: 'Sable' },
  { label: 'Eland', value: 3, name: 'Eland' },
]);

// --- Search functionality ---
const searchTerm = ref('');
const filteredParticipants = computed(() => {
  if (!searchTerm.value.trim()) return participants.value;
  return participants.value.filter(p =>
    p.fullName &&
    p.fullName.toLowerCase().includes(searchTerm.value.trim().toLowerCase())
  );
});
// ----------------------------

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

const importParticipants = () => {
  if (!fileUploadRef.value || !fileUploadRef.value.files || fileUploadRef.value.files.length === 0) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a file to import', life: 3000 });
    return;
  }
  const file = fileUploadRef.value.files[0];
  const validTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  if (!validTypes.includes(file.type)) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Invalid file type. Please upload Excel (.xls, .xlsx) or CSV files', 
      life: 3000 
    });
    return;
  }
  importLoading.value = true;
  const formData = new FormData();
  formData.append('file', file);
  apiClient.post('/participants/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
    .then(response => {
      toast.add({ 
        severity: 'success', 
        summary: 'Success', 
        detail: `Successfully imported ${response.data.successCount} participants`, 
        life: 3000 
      });
      importResults.value = response.data;
      bulkImportDialog.value = true;
      fetchParticipants();
      if (fileUploadRef.value) {
        fileUploadRef.value.clear();
      }
    })
    .catch(err => {
      console.error('Error importing participants:', err);
      if (err.response && err.response.data && err.response.data.errors) {
        importResults.value = err.response.data;
        bulkImportDialog.value = true;
      } else {
        toast.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to import participants. Please check your file format.', 
          life: 5000 
        });
      }
    })
    .finally(() => {
      importLoading.value = false;
    });
};

const editParticipant = (editParticipant) => {
  participant.value = { ...editParticipant };
  participantDialog.value = true;
  editMode.value = true;
};

const confirmDeleteParticipant = (participantToDelete) => {
  participant.value = participantToDelete;
  deleteParticipantDialog.value = true;
};

const hideDialog = () => {
  participantDialog.value = false;
  submitted.value = false;
};

const saveParticipant = () => {
  submitted.value = true;
  if (!participant.value.fullName?.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Name is required', life: 3000 });
    return;
  }
  if (participant.value.houseId) {
    const selectedHouse = houses.value.find(h => h.value === participant.value.houseId);
    if (selectedHouse) {
      participant.value.houseName = selectedHouse.name;
    }
  }
  if (editMode.value) {
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

const downloadTemplate = () => {
  const headers = ['FullName', 'Age', 'Gender', 'HouseId'];
  const csvContent = headers.join(',') + '\n' + 
                     'John Doe,15,Male,1\n' +
                     'Jane Smith,16,Female,2';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'participants_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.add({ severity: 'info', summary: 'Template', detail: 'Template spreadsheet downloaded', life: 3000 });
};

const exportCSV = () => {
  const downloadCSV = () => {
    const csv = [
      Object.keys(participants.value[0] || {}).join(','),
      ...participants.value.map(item => 
        Object.values(item).map(val => 
          typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        ).join(',')
      )
    ].join('\n');
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

onMounted(() => {
  fetchParticipants();
});

const isAdmin = computed(() => store.getters['auth/hasRole']('Admin'));
</script>

<template>
  <div class="participants-page p-4">
    <Toast />

    <div class="card">
      <h1 class="text-2xl font-bold mb-4">Participants</h1>
      
      <!-- Search Bar -->
      <div class="flex flex-wrap gap-2 mb-4 items-center">
        <InputText
          v-model="searchTerm"
          placeholder="Search by name..."
          class="p-inputtext-sm w-full md:w-60"
          style="max-width: 300px;"
        />
      </div>
      
      <!-- Toolbar -->
      <div v-if="isAdmin" class="flex flex-wrap gap-2 mb-4 items-center">
        <Button label="New" icon="pi pi-plus" class="p-button-success" @click="openNew" />
        <div class="flex-grow-1 flex items-center gap-2">
          <span class="p-input-icon-right">
            <FileUpload
              ref="fileUploadRef"
              mode="basic"
              :multiple="false"
              accept=".xlsx,.xls,.csv"
              :auto="false"
              chooseLabel="Choose Spreadsheet"
              class="p-button-outlined"
              :maxFileSize="10000000"
            />
          </span>
          <Button 
            label="Import" 
            icon="pi pi-upload" 
            class="p-button-primary" 
            @click="importParticipants"
            :loading="importLoading"
          />
          <Button 
            label="Template" 
            icon="pi pi-download" 
            class="p-button-secondary p-button-outlined" 
            @click="downloadTemplate"
            title="Download a template spreadsheet with the correct format"
          />
        </div>
        <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV" />
      </div>
      
      <!-- Data Table -->
      <DataTable 
        :value="filteredParticipants" 
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
            <Button v-if="isAdmin" icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDeleteParticipant(slotProps.data)" />
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
    
    <!-- Bulk Import Results Dialog -->
    <Dialog v-model:visible="bulkImportDialog" :style="{width: '550px'}" :header="importResults?.success ? 'Import Successful' : 'Import Failed'" :modal="true">
      <div v-if="importResults">
        <div v-if="importResults.success" class="text-green-600 mb-4">
          <i class="pi pi-check-circle mr-2" style="font-size: 1.5rem"></i>
          <span class="font-bold">{{ importResults.message }}</span>
        </div>
        <div v-else class="text-red-600 mb-4">
          <i class="pi pi-times-circle mr-2" style="font-size: 1.5rem"></i>
          <span class="font-bold">{{ importResults.message }}</span>
        </div>
        <div v-if="importResults.successCount" class="mb-2">
          Successfully imported: <span class="font-bold">{{ importResults.successCount }}</span> participants
        </div>
        <div v-if="importResults.failureCount" class="mb-4">
          Failed to import: <span class="font-bold">{{ importResults.failureCount }}</span> participants
        </div>
        <div v-if="importResults.errors && importResults.errors.length > 0" class="mt-4">
          <h3 class="text-lg font-bold mb-2">Validation Errors:</h3>
          <div v-for="(error, index) in importResults.errors" :key="index" class="p-3 bg-red-50 rounded mb-2">
            <div><span class="font-bold">Row {{ error.rowNumber }}:</span> {{ error.participant.fullName }}</div>
            <ul class="list-disc pl-5 mt-1">
              <li v-for="(errMsg, errIndex) in error.errors" :key="errIndex" class="text-red-600">
                {{ errMsg }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Close" icon="pi pi-times" class="p-button-text" @click="bulkImportDialog = false" />
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
