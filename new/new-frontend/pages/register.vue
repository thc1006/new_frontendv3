<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="headline">註冊</v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="valid">
              <!-- Account Field -->
              <v-text-field
                v-model="form.account"
                label="帳號"
                :rules="[rules.required]"
                required
              />
              <!-- Email Field -->
              <v-text-field
                v-model="form.email"
                label="電子郵件"
                :rules="[rules.required, rules.email]"
                required
              />
              <!-- Password Field -->
              <v-text-field
                v-model="form.password"
                label="密碼"
                :type="showPassword ? 'text' : 'password'"
                :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="[rules.required, rules.password]"
                required
                @click:append="showPassword = !showPassword"
              />
              <!-- Confirm Password Field -->
              <v-text-field
                v-model="confirmPassword"
                label="確認密碼"
                :type="showConfirmPassword ? 'text' : 'password'"
                :append-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="[rules.required, rules.confirm]"
                required
                @click:append="showConfirmPassword = !showConfirmPassword"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn color="primary" @click="router.push('/login')">back</v-btn>
            <v-btn :disabled="!valid || isPending" color="primary" @click="onSubmit">
              <v-icon left>mdi-account-plus</v-icon>
              註冊
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5 text-center">
          Sign Up Successfully
        </v-card-title>
        <v-card-text class="text-center pt-4">
          Please Login Again
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn color="primary" @click="navigateToLogin">OK</v-btn>
          <v-spacer/>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useMutation, useQueryClient } from '@tanstack/vue-query'
  import type { RegisterRequest } from '~/apis/Api'

  // reactive form state
  const form = ref<RegisterRequest>({ account: '', email: '', password: '' })
  const confirmPassword = ref<string>('')  // confirm password field
  const valid = ref(false)
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)   // toggle for confirm password
  const formRef = ref<any>(null)           // for v-form reference
  const showSuccessDialog = ref(false)     // control for success dialog

  // validation rules
  const rules = {
    required: (v: string) => !!v || '此欄位為必填',
    email:    (v: string) => /.+@.+\..+/.test(v) || '電子郵件格式錯誤',
    password: (v: string) =>
      /^(?!.*(.)\1\1)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/.test(v)
      || '密碼需 8-20 字元，含大小寫、數字、符號，且不可連續 3 個相同字元',
    confirm:  (v: string) => v === form.value.password || '密碼與確認密碼不符',
  }

  // custom register mutation
  function useRegisterMutation() {
    const { $apiClient } = useNuxtApp()
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (requestParameters: RegisterRequest) =>
        $apiClient.auth.registerCreate(requestParameters),
      onSettled: () => {
        queryClient.invalidateQueries()
      },
    })
  }

  const { mutateAsync, isPending } = useRegisterMutation()
  const router = useRouter()

  // navigation function
  function navigateToLogin() {
    showSuccessDialog.value = false
    router.push('/login')
  }

  // submission handler
  async function onSubmit() {
    if (!(formRef.value as any).validate()) {
      return
    }

    try {
      await mutateAsync(form.value)
      // Show success dialog instead of immediate redirect
      showSuccessDialog.value = true
    } catch (err: any) {
      console.error('Registration failed:', err)
    }
  }
</script>
