<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="headline">登入</v-card-title>
          <v-card-text>
            <v-form ref="loginForm" v-model="valid">
              <v-text-field
                v-model="account"
                label="Account"
                :rules="[rules.required]"
              />
              <v-text-field
                v-model="password"
                label="password"
                :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :type="showPassword ? 'text' : 'password'"
                :rules="[rules.required]"
                @click:append="showPassword = !showPassword"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn color="primary" @click="handleRegister">
              註冊
            </v-btn>
            <v-btn color="primary" :disabled="!valid" @click="submit">
              登入
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="showError" color="error" timeout="4000" location="top">
      {{ popupMessage }}
    </v-snackbar>
    <v-snackbar v-model="showSuccess" color="success" timeout="4000" location="top">
      {{ popupMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { VForm } from 'vuetify/components';
  import { useMutation, useQueryClient } from '@tanstack/vue-query'
  import type { LoginRequest } from '~/apis/Api'
  import { navigateTo } from '#app';

  function useLoginMutation() {
    const { $apiClient } = useNuxtApp()

    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: (requestParameters: LoginRequest) => $apiClient.auth.loginCreate(requestParameters),
      onSettled: () => {
        queryClient.invalidateQueries()
      },
    })
  }

  const account = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const valid = ref(false)
  const loginForm = ref<VForm|null>(null)  // Form validation instance
  const loginMutation = useLoginMutation()  // get mutate function
  const showError = ref(false)
  const showSuccess = ref(false)
  const popupMessage = ref('')

  const rules = {
    required: (value: string) => !!value || '必填欄位',
  }

  function handleRegister() {
    navigateTo('/register')
  }
  async function submit() {
    // Validate all fields and update `valid.value`
    loginForm.value?.validate()
    if (!valid.value) return  // stop if form invalid

    // Use the mutation to login
    loginMutation.mutate(
      { account: account.value, password: password.value },
      {
        onSuccess: async () => {
          popupMessage.value = '登入成功'
          showSuccess.value = true
          setTimeout(() => {
            navigateTo('/')
          }, 1000) // 1.0sec
        },
        onError: (error) => {
          let message = '登入失敗，請檢查帳號密碼'
          const err = error as { response?: { status?: number } }
          if (err.response?.status) {
            switch (err.response.status) {
            case 400:
              message = '請檢查輸入資料格式'
              break
            case 401:
              message = '帳號或密碼錯誤'
              break
            case 403:
              message = '帳號已被鎖定，請聯絡管理員'
              break
            case 404:
              message = '查無此帳號'
              break
            case 429:
              message = '請求過於頻繁，請稍後再試'
              break
            case 500:
              message = '系統異常，請稍後再試'
              break
            case 503:
              message = '服務暫時無法使用，請稍後再試'
              break
            }
          }
          popupMessage.value = message
          showError.value = true
          console.error('登入失敗：', error)
        },
      }
    )
  }
</script>

<style lang="scss" scoped>
.v-application {
  font-family: 'Noto Sans TC', sans-serif;
}
</style>
