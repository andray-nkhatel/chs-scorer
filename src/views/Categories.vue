<script setup>
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import apiClient from '../service/api.service';

const toast = useToast();
const categories = ref([]);
const loading = ref(true);
const error = ref(null);

// Dialog states for add/edit functionality
const categoryDialog = ref(false);
const deleteCategoryDialog = ref(false);
const category = ref({
  id: null,
  name: ''
});
const selectedCategories = ref(null);
const submitted = ref(false);
const editMode = ref(false);

// Fetch categories data
const fetchCategories = () => {
  loading.value = true;
  error.value = null;
  
  apiClient.get('/categories')
    .then(response => {
      categories.value = response.data;
      console.log('Categories loaded:', categories.value);
    })
    .catch(err => {
      console.error('Error fetching categories:', err);
      error.value = 'Failed to load categories. Please try again later.';
      toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 3000 });
    })
    .finally(() => {
      loading.value = false;
    });
};

// Open dialog to add new category
const openNew = () => {
  category.value = {
    id: null,
    name: ''
  };
  submitted.value = false;
  categoryDialog.value = true;
  editMode.value = false;
};

// Open dialog to edit category
const editCategory = (editCategory) => {
  category.value = { ...editCategory };
  categoryDialog.value = true;
  editMode.value = true;
};

// Confirm category deletion
const confirmDeleteCategory = (categoryToDelete) => {
  category.value = categoryToDelete;
  deleteCategoryDialog.value = true;
};

// Hide the dialog
const hideDialog = () => {
  categoryDialog.value = false;
  submitted.value = false;
};

// Save category (add or update)
const saveCategory = () => {
  submitted.value = true;
  
  if (!category.value.name?.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Category name is required', life: 3000 });
    return;
  }
  
  if (editMode.value) {
    // Update existing category
    apiClient.put(`/categories/${category.value.id}`, category.value)
      .then(() => {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Category Updated', life: 3000 });
        fetchCategories();
        categoryDialog.value = false;
        category.value = {};
      })
      .catch(err => {
        console.error('Error updating category:', err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update category', life: 3000 });
      });
  } else {
    // Add new category
    apiClient.post('/categories', category.value)
      .then(() => {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Category Added', life: 3000 });
        fetchCategories();
        categoryDialog.value = false;
        category.value = {};
      })
      .catch(err => {
        console.error('Error adding category:', err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add category', life: 3000 });
      });
  }
};

// Delete category
const deleteCategory = () => {
  apiClient.delete(`/categories/${category.value.id}`)
    .then(() => {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Category Deleted', life: 3000 });
      fetchCategories();
      deleteCategoryDialog.value = false;
      category.value = {};
    })
    .catch(err => {
      console.error('Error deleting category:', err);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete category', life: 3000 });
    });
};

// Export to CSV
const exportCSV = () => {
  // Simple CSV export function
  const downloadCSV = () => {
    const csv = [
      // CSV header
      Object.keys(categories.value[0] || {}).join(','),
      // CSV rows
      ...categories.value.map(item => 
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
    link.setAttribute('download', 'categories.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (categories.value.length > 0) {
    downloadCSV();
  } else {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'No data to export', life: 3000 });
  }
};

// Load data on component mount
onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <div class="categories-page p-4">
    <Toast />
    
    <div class="card">
      <h1 class="text-2xl font-bold mb-4">Categories</h1>
      
      <!-- Toolbar -->
      <div class="flex justify-between items-center mb-4">
        <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
        <Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV" />
      </div>
      
      <!-- Data Table -->
      <DataTable 
        :value="categories" 
        v-model:selection="selectedCategories" 
        dataKey="id"
        :paginator="true" 
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} categories"
        responsiveLayout="scroll"
        :loading="loading"
        stripedRows
        :filters="null"
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="text-center p-4" v-if="!loading && !error">
            No categories found.
          </div>
          <div class="text-center text-red-500 p-4" v-if="error">
            {{ error }}
          </div>
        </template>
        
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="id" header="ID" sortable style="width: 5rem"></Column>
        <Column field="name" header="Name" sortable style="min-width: 16rem"></Column>
        <Column :exportable="false" style="width: 8rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editCategory(slotProps.data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDeleteCategory(slotProps.data)" />
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Add/Edit Category Dialog -->
    <Dialog v-model:visible="categoryDialog" :style="{width: '450px'}" header="Category Details" :modal="true" class="p-fluid">
      <div class="field">
        <label for="name">Name</label>
        <InputText id="name" v-model="category.name" class="w-full" required autofocus :class="{'p-invalid': submitted && !category.name}" />
        <small class="p-error" v-if="submitted && !category.name">Category name is required.</small>
      </div>
      
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveCategory" />
      </template>
    </Dialog>
    
    <!-- Delete Category Dialog -->
    <Dialog v-model:visible="deleteCategoryDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span v-if="category">Are you sure you want to delete <b>{{ category.name }}</b>?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteCategoryDialog = false" />
        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteCategory" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.categories-page {
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