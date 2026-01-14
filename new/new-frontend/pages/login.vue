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

      <!-- 登入區塊 - Figma Node 3:2113 -->
      <div class="login-block">
        <div class="login-box">
          <v-form ref="loginForm" v-model="valid" class="login-form">
            <!-- Account 欄位 -->
            <div class="form-row">
              <label for="account-input" class="field-label">Account</label>
              <input
                id="account-input"
                v-model="account"
                type="text"
                class="field-input"
                required
                aria-required="true"
              />
            </div>
            <!-- Password 欄位 -->
            <div class="form-row">
              <label for="password-input" class="field-label">Password</label>
              <div class="password-wrapper">
                <input
                  id="password-input"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="field-input"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <v-icon>{{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                </button>
              </div>
            </div>
            <!-- Login 按鈕 -->
            <div class="form-actions">
              <button
                type="button"
                class="login-btn"
                :disabled="!account || !password || loginMutation.isPending.value"
                @click="submit"
              >
                Login
              </button>
            </div>
            <!-- No Account? Register -->
            <div class="register-row">
              <span class="no-account-text">No Account?</span>
              <a href="/register" class="register-link">Register</a>
            </div>
          </v-form>
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
  import type { VForm } from 'vuetify/components'
  import { useMutation, useQueryClient } from '@tanstack/vue-query'
  import type { LoginRequest } from '~/apis/Api'
  import { navigateTo } from '#app'

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
    // 因為使用原生 input，直接檢查欄位值
    if (!account.value || !password.value) return

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
@import url('https://fonts.cdnfonts.com/css/joti-one');

.login-page {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

// 背景圖層
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

// 登入區塊 - Figma Node 3:2113
.login-block {
  position: absolute;
  bottom: 15%;
  right: 5%;
  animation: riseIn 0.8s ease 0.3s both;

  @media (max-width: 768px) {
    right: 50%;
    transform: translateX(50%);
    bottom: 10%;
  }
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Figma 登入框樣式
.login-box {
  min-width: 400px;
  padding: 40px 24px 24px;
  background: #c2c2c2; // Figma 規範灰色
  border-radius: 17.69px; // Figma 規範圓角
  box-shadow: 0px 3.5px 3.5px rgba(0, 0, 0, 0.25);

  @media (max-width: 768px) {
    min-width: 320px;
    padding: 30px 20px 20px;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.field-label {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 400;
  color: #000;
  min-width: 160px;

  @media (max-width: 768px) {
    font-size: 24px;
    min-width: 100px;
  }
}

.field-input {
  flex: 1;
  height: 53px;
  padding: 0 16px;
  background: rgba(85, 85, 85, 0.6); // Figma 輸入框背景
  border: none;
  border-radius: 17.69px;
  font-size: 18px;
  color: #fff;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    box-shadow: 0 0 0 2px rgba(0, 77, 255, 0.3);
  }
}

// 密碼欄位容器 (含切換按鈕)
.password-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;

  .field-input {
    padding-right: 48px; // 預留切換按鈕空間
  }
}

// 密碼顯示/隱藏切換按鈕 - Figma Node 3:487 eye icon
.password-toggle {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s;

  &:hover {
    color: #fff;
  }

  &:focus {
    outline: 2px solid rgba(0, 77, 255, 0.5);
    border-radius: 4px;
  }
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.login-btn {
  padding: 10px 32px;
  background: #004dff; // Figma 按鈕藍色
  border: none;
  border-radius: 17.69px;
  font-family: 'Inter', sans-serif;
  font-size: 21px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #0040d6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.register-row {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
}

.no-account-text {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #000;
}

.register-link {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #000;
  text-decoration: underline;

  &:hover {
    color: #004dff;
  }
}
</style>
