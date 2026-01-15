<template>
  <div class="register-page">
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

      <!-- 註冊區塊 - Figma Node 3:1042 -->
      <div class="register-block">
        <div class="register-container">
          <div class="register-card">
            <!-- Logo -->
            <div class="logo-container">
              <img src="/wisdon.png" alt="WiSDON logo" class="logo" />
            </div>

            <!-- 標題 -->
            <h2 class="page-title">Register</h2>

            <v-form ref="formRef" v-model="valid" class="register-form">
              <!-- Account 欄位 -->
              <div class="form-row">
                <label for="account-input" class="field-label">Account</label>
                <input
                  id="account-input"
                  v-model="form.account"
                  name="account"
                  type="text"
                  class="field-input"
                  placeholder="Account"
                  required
                  aria-required="true"
                  @input="debouncedCheckAccount(form.account)"
                />
              </div>

              <!-- Email 欄位 -->
              <div class="form-row">
                <label for="email-input" class="field-label">Email</label>
                <input
                  id="email-input"
                  v-model="form.email"
                  name="email"
                  type="email"
                  class="field-input"
                  placeholder="Email"
                  required
                  aria-required="true"
                  @input="debouncedCheckEmail(form.email)"
                />
              </div>

              <!-- Password 欄位 -->
              <div class="form-row">
                <label for="password-input" class="field-label">Password</label>
                <div class="password-wrapper">
                  <input
                    id="password-input"
                    v-model="form.password"
                    name="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="field-input"
                    placeholder="Password"
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

              <!-- Confirm Password 欄位 -->
              <div class="form-row">
                <label for="confirm-password-input" class="field-label">Confirm Password</label>
                <div class="password-wrapper">
                  <input
                    id="confirm-password-input"
                    v-model="confirmPassword"
                    name="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    class="field-input"
                    placeholder="Confirm Password"
                    required
                    aria-required="true"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <v-icon>{{ showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                  </button>
                </div>
              </div>

              <!-- 錯誤訊息 -->
              <div v-if="errorMessage" class="error-message v-messages__message">
                {{ errorMessage }}
              </div>

              <!-- 按鈕區 -->
              <div class="form-actions">
                <button
                  type="button"
                  class="back-btn"
                  @click="goBack"
                >
                  BACK
                </button>
                <button
                  type="button"
                  class="register-btn"
                  :disabled="isPending"
                  @click="onSubmit"
                >
                  {{ isPending ? 'Processing...' : 'Register' }}
                </button>
              </div>
            </v-form>
          </div>
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
          <v-spacer />
          <v-btn color="primary" @click="navigateToLogin">OK</v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { RegisterRequest } from '~/apis/Api'
import { navigateTo } from '#app'

// 表單欄位
const form = ref<RegisterRequest>({ account: '', email: '', password: '' })
const confirmPassword = ref('')
const valid = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const formRef = ref<any>(null)
const showSuccessDialog = ref(false)

// 錯誤與提示
const errorMessage = ref('')
const showError = ref(false)
const showSuccess = ref(false)
const popupMessage = ref('')

// 即時檢查狀態
const accountCheckStatus = ref<string>('idle')
const emailCheckStatus = ref<string>('idle')

// debounce timer
let accountCheckTimer: ReturnType<typeof setTimeout> | null = null
let emailCheckTimer: ReturnType<typeof setTimeout> | null = null

// 帳號存在性檢查 (placeholder)
async function checkAccountExists(account: string): Promise<boolean> {
  // TODO: 後端需新增 GET /auth/check-account?account={account}
  await new Promise(resolve => setTimeout(resolve, 300))
  return false
}

// 信箱存在性檢查 (placeholder)
async function checkEmailExists(email: string): Promise<boolean> {
  // TODO: 後端需新增 GET /auth/check-email?email={email}
  await new Promise(resolve => setTimeout(resolve, 300))
  return false
}

// debounced 帳號檢查
function debouncedCheckAccount(value: string) {
  if (accountCheckTimer) clearTimeout(accountCheckTimer)
  if (!value) {
    accountCheckStatus.value = 'idle'
    return
  }
  accountCheckStatus.value = 'checking'
  accountCheckTimer = setTimeout(async () => {
    const exists = await checkAccountExists(value)
    accountCheckStatus.value = exists ? 'taken' : 'available'
  }, 500)
}

// debounced 信箱檢查
function debouncedCheckEmail(value: string) {
  if (emailCheckTimer) clearTimeout(emailCheckTimer)
  if (!value || !/.+@.+\..+/.test(value)) {
    emailCheckStatus.value = 'idle'
    return
  }
  emailCheckStatus.value = 'checking'
  emailCheckTimer = setTimeout(async () => {
    const exists = await checkEmailExists(value)
    emailCheckStatus.value = exists ? 'taken' : 'available'
  }, 500)
}

// 驗證 email 格式
function isValidEmail(emailStr: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(emailStr)
}

// 返回登入頁
function goBack() {
  navigateTo('/login')
}

// 表單驗證
function validateForm(): boolean {
  errorMessage.value = ''

  if (!form.value.account.trim()) {
    errorMessage.value = 'Account is required'
    return false
  }

  if (accountCheckStatus.value === 'taken') {
    errorMessage.value = 'This account is already taken'
    return false
  }

  if (!form.value.email.trim()) {
    errorMessage.value = 'Email is required'
    return false
  }

  if (!isValidEmail(form.value.email)) {
    errorMessage.value = 'Please enter a valid email address'
    return false
  }

  if (emailCheckStatus.value === 'taken') {
    errorMessage.value = 'This email is already registered'
    return false
  }

  if (!form.value.password) {
    errorMessage.value = 'Password is required'
    return false
  }

  if (form.value.password.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters'
    return false
  }

  if (!confirmPassword.value) {
    errorMessage.value = 'Please confirm your password'
    return false
  }

  if (form.value.password !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return false
  }

  return true
}

// Register mutation
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

// 導航到登入頁
function navigateToLogin() {
  showSuccessDialog.value = false
  router.push('/login')
}

// 提交註冊
async function onSubmit() {
  if (!validateForm()) {
    return
  }

  errorMessage.value = ''

  try {
    await mutateAsync(form.value)
    showSuccessDialog.value = true
  } catch (err: any) {
    const status = err?.response?.status
    let message = 'Registration failed. Please try again later.'

    if (status === 409) {
      message = 'Account or email has already been registered.'
    } else if (status === 400) {
      message = 'Please check the input data format.'
    }

    popupMessage.value = message
    showError.value = true
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.cdnfonts.com/css/joti-one');

.register-page {
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
      top: 10vh;
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
      top: 5vh;
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

// 註冊區塊 - Figma Node 3:1042
.register-block {
  position: absolute;
  bottom: 8%;
  right: 5%;
  animation: riseIn 0.8s ease 0.3s both;

  @media (max-width: 768px) {
    right: 50%;
    transform: translateX(50%);
    bottom: 3%;
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

.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

// Figma 註冊卡片樣式 - 白色背景 + 圓角 + 陰影
.register-card {
  min-width: 420px;
  padding: 24px 32px 32px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    min-width: 320px;
    padding: 20px 24px 28px;
  }
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.logo {
  height: 48px;
  width: auto;
}

.page-title {
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-label {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.field-input {
  flex: 1;
  height: 44px;
  padding: 0 14px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  color: #333;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder {
    color: #999;
  }

  &:focus {
    border-color: #006ab5;
    box-shadow: 0 0 0 2px rgba(0, 106, 181, 0.15);
  }
}

// 密碼欄位容器
.password-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;

  .field-input {
    padding-right: 44px;
  }
}

// 密碼顯示/隱藏切換按鈕
.password-toggle {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }

  &:focus {
    outline: 2px solid rgba(0, 106, 181, 0.4);
    border-radius: 4px;
  }
}

// 錯誤訊息
.error-message {
  color: #d32f2f;
  font-size: 13px;
  text-align: center;
  padding: 4px 0;
}

// 按鈕區塊
.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
}

// 返回按鈕 - Figma 藍色 #006ab5
.back-btn {
  padding: 10px 24px;
  background: #006ab5;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #005a9a;
  }
}

// 註冊按鈕 - Figma 藍色 #006ab5
.register-btn {
  padding: 10px 24px;
  background: #006ab5;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #005a9a;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
