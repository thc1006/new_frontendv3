<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="start">
      <v-col cols="12" sm="12" md="10" lg="8">
        <!-- page title (Figma 3:664) -->
        <h2 class="text-h4 font-weight-bold mb-6">Upload AI Model</h2>

        <!-- form start -->
        <v-form ref="uploadForm">
          <v-row>
            <!-- Left: Form fields -->
            <v-col cols="12" md="6">
              <!-- Model Name (Figma 3:674) -->
              <div class="mb-4">
                <label class="text-h6 font-weight-medium">Model Name</label>
                <v-text-field
                  v-model="modelName"
                  placeholder="AI Model #4"
                  density="comfortable"
                  :rules="[rules.required]"
                  required
                  variant="outlined"
                  bg-color="rgba(194,194,194,0.3)"
                  rounded="pill"
                  class="mt-2"
                />
              </div>

              <!-- Upload File (Figma 3:675) -->
              <div class="mb-4">
                <label class="text-h6 font-weight-medium">Upload File</label>
                <v-file-input
                  v-model="modelFile"
                  placeholder="Select Model File"
                  density="comfortable"
                  prepend-icon=""
                  prepend-inner-icon="mdi-upload"
                  accept=".h5,.pkl,.pt,.onnx,.pb,.keras"
                  :rules="[rules.fileRequired]"
                  variant="outlined"
                  bg-color="rgba(194,194,194,0.3)"
                  rounded="pill"
                  class="mt-2"
                />
              </div>

              <!-- Model Config (Figma 3:676) -->
              <div class="mb-4">
                <label class="text-h6 font-weight-medium">Model Config</label>
                <v-textarea
                  v-model="modelConfig"
                  placeholder='{ "epochs": 10, "batch_size": 32 }'
                  density="comfortable"
                  rows="4"
                  variant="outlined"
                  bg-color="rgba(194,194,194,0.3)"
                  class="mt-2"
                />
              </div>
            </v-col>

            <!-- Right: Existing Model selection (Figma 3:673) -->
            <v-col cols="12" md="6">
              <div class="existing-model-section">
                <label class="text-h6 font-weight-medium">Existing Model</label>

                <!-- NES checkbox (Figma 3:665) -->
                <div class="mt-4">
                  <v-checkbox
                    v-model="nesSelected"
                    label="NES"
                    color="primary"
                    hide-details
                    density="comfortable"
                  />
                </div>

                <!-- MRO checkbox (Figma 3:666) -->
                <div class="mt-2">
                  <v-checkbox
                    v-model="mroSelected"
                    label="MRO"
                    color="primary"
                    hide-details
                    density="comfortable"
                  />
                </div>

                <!-- Model version selection (shown after checkbox selected) -->
                <div v-if="nesSelected || mroSelected" class="mt-4">
                  <label class="text-body-1 font-weight-medium">Select Base Model Version</label>
                  <v-select
                    v-model="selectedBaseModel"
                    :items="availableModels"
                    item-title="display_name"
                    item-value="id"
                    placeholder="Select base model"
                    density="comfortable"
                    variant="outlined"
                    class="mt-2"
                  />
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- action button (Figma 3:685) -->
          <div class="d-flex justify-start mt-6">
            <v-btn
              color="primary"
              class="btn-fixed-width me-3"
              style="text-transform: capitalize"
              :disabled="uploadDisabled"
              :loading="isLoading"
              rounded="lg"
              @click="uploadModel"
            >
              Upload
            </v-btn>
            <v-btn
              color="grey"
              class="btn-fixed-width"
              style="text-transform: capitalize"
              rounded="lg"
              @click="back"
            >
              Back
            </v-btn>
          </div>
        </v-form>
      </v-col>
    </v-row>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon color="success" class="me-2">mdi-check-circle</v-icon>
          Upload Success
        </v-card-title>
        <v-card-text>
          Model "{{ modelName }}" has been uploaded successfully.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            style="text-transform: capitalize"
            @click="handleSuccessClose"
          >
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Error Dialog -->
    <v-dialog v-model="showErrorDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon color="error" class="me-2">mdi-alert-circle</v-icon>
          Upload Failed
        </v-card-title>
        <v-card-text>
          {{ errorMessage }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            style="text-transform: capitalize"
            @click="showErrorDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">

  import { computed, ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'

  const { $apiClient } = useNuxtApp()
  const router = useRouter()

  // Form fields
  const modelName = ref('')
  const modelFile = ref<File[]>([])
  const modelConfig = ref('')
  const nesSelected = ref(false)
  const mroSelected = ref(false)
  const selectedBaseModel = ref<number | null>(null)

  // UI state
  const isLoading = ref(false)
  const showSuccessDialog = ref(false)
  const showErrorDialog = ref(false)
  const errorMessage = ref('')
  const snackbar = ref({
    show: false,
    text: '',
    color: 'info'
  })

  // Available base models (fetched from API)
  const availableModels = ref<{ id: number; display_name: string }[]>([])

  // Validation rules
  const rules = {
    required: (v: string) => !!v || 'This field is required',
    fileRequired: (v: File[]) => (v && v.length > 0) || 'Please select a model file',
  }

  // Button disabled state
  const uploadDisabled = computed(() => {
    return !modelName.value || !modelFile.value || modelFile.value.length === 0 || isLoading.value
  })

  // Fetch available base models
  onMounted(async () => {
    try {
      const response = await $apiClient.primitiveAiModel.primitiveAiModelsList()
      const models = response.data as Array<{ id?: number; title?: string; version?: string }>
      availableModels.value = models.map(m => ({
        id: m.id ?? 0,
        display_name: `${m.title || 'Unknown'} (v${m.version || '1'})`
      }))
    } catch (err) {
      console.error('Failed to fetch models:', err)
    }
  })

  // Upload model
  async function uploadModel() {
    if (uploadDisabled.value) return

    isLoading.value = true
    try {
      // TODO: Backend API not yet implemented
      // Expected endpoint: POST /primitive_ai_models/upload
      // Expected request body: FormData { model_name, file, model_type, config, base_model_id }
      // Expected response: { model_id, version, upload_status }

      const formData = new FormData()
      formData.append('model_name', modelName.value)
      formData.append('file', modelFile.value[0])

      if (modelConfig.value) {
        formData.append('config', modelConfig.value)
      }
      if (nesSelected.value) {
        formData.append('model_type', 'NES')
      }
      if (mroSelected.value) {
        formData.append('model_type', 'MRO')
      }
      if (selectedBaseModel.value) {
        formData.append('base_model_id', String(selectedBaseModel.value))
      }

      // Placeholder: Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Show placeholder warning
      snackbar.value = {
        show: true,
        text: 'Model upload feature not yet connected to backend (Placeholder)',
        color: 'warning'
      }

      console.warn('[TODO] Model upload API not implemented', {
        modelName: modelName.value,
        fileName: modelFile.value[0]?.name,
        nesSelected: nesSelected.value,
        mroSelected: mroSelected.value
      })

      showSuccessDialog.value = true
    } catch (err) {
      errorMessage.value = 'Upload failed, please try again later'
      showErrorDialog.value = true
      console.error('Upload failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Close dialog after successful upload
  function handleSuccessClose() {
    showSuccessDialog.value = false
    // Optional: navigate to AI Models list
    // router.push('/ai-models')
  }

  // Go back to previous page
  function back() {
    router.back()
  }

</script>

<style scoped>

.btn-fixed-width {
  min-width: 100px;
}

.existing-model-section {
  padding-left: 24px;
}

</style>
