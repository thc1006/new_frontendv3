<template>
  <div class="login-page">
    <!-- 背景層 -->
    <div class="bg-overlay" />

    <!-- 前景內容 -->
    <div class="foreground">
      <!-- Banner 區塊 -->
      <div class="banner">
        <div class="small-text animate-text">
          <b>Welcome to a 5G O-RAN project Management Website</b>
        </div>
        <div class="big-text animate-text">
          <b>WiSDON LAB</b>
        </div>
      </div>

      <!-- 登入區塊 -->
      <div class="login-block">
        <v-card class="login-card" elevation="8">
          <v-card-title class="headline text-center">登入</v-card-title>
          <v-card-text>
            <v-form ref="loginForm" v-model="valid">
              <v-text-field
                v-model="account"
                label="Account"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
              <v-text-field
                v-model="password"
                label="Password"
                :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :type="showPassword ? 'text' : 'password'"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                @click:append="showPassword = !showPassword"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn color="primary" variant="text" @click="handleRegister">
              註冊
            </v-btn>
            <v-btn color="primary" :disabled="!valid" @click="submit">
              登入
            </v-btn>
          </v-card-actions>
        </v-card>
        <div class="register-hint">
          <span>New Friend? -> </span>
          <a href="/register">Register Here</a>
        </div>
      </div>
    </div>

    <!-- Snackbar 提示 -->
    <v-snackbar v-model="showError" color="error" timeout="4000" location="top">
      {{ popupMessage }}
    </v-snackbar>
    <v-snackbar v-model="showSuccess" color="success" timeout="4000" location="top">
      {{ popupMessage }}
    </v-snackbar>
  </div>
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
  const loginForm = ref<VForm|null>(null)
  const loginMutation = useLoginMutation()
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
    loginForm.value?.validate()
    if (!valid.value) return

    loginMutation.mutate(
      { account: account.value, password: password.value },
      {
        onSuccess: async () => {
          popupMessage.value = '登入成功'
          showSuccess.value = true
          setTimeout(() => {
            navigateTo('/')
          }, 1000)
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
// 引入 Joti One 字體（同 legacy）
@import url('https://fonts.cdnfonts.com/css/joti-one');

.login-page {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

// 背景圖層（半透明）
.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/background.jpg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  opacity: 0.5;
  z-index: 0;
}

.foreground {
  position: relative;
  height: 100%;
  z-index: 1;
}

// Banner 文字樣式
.banner {
  position: relative;

  .big-text {
    position: absolute;
    top: 25vh;
    left: 5%;
    font-family: 'Joti One', sans-serif;
    font-size: 90px;
    color: #E7E3E3;
    text-shadow: 3px 3px 4px rgba(202, 198, 198, 0.5);
    -webkit-text-stroke: 1.5px rgba(41, 39, 39, 0.5);

    @media (max-width: 768px) {
      font-size: 48px;
      top: 15vh;
    }
  }

  .small-text {
    position: absolute;
    top: 17vh;
    left: 5%;
    font-family: 'Joti One', sans-serif;
    font-size: 50px;
    color: #E7E3E3;
    text-shadow: 3px 3px 4px rgba(202, 198, 198, 0.5);
    -webkit-text-stroke: 1.5px rgba(41, 39, 39, 0.5);

    @media (max-width: 768px) {
      font-size: 24px;
      top: 8vh;
    }
  }
}

// 淡入動畫
.animate-text {
  opacity: 0;
  animation: fadeSlideIn 4s ease 0.4s forwards;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 登入區塊（右下角）
.login-block {
  position: absolute;
  bottom: 20%;
  right: 5%;

  @media (max-width: 768px) {
    right: 50%;
    transform: translateX(50%);
    bottom: 10%;
  }
}

.login-card {
  min-width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.register-hint {
  text-align: right;
  margin-top: 1em;
  color: #E7E3E3;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);

  a {
    color: #90caf9;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
