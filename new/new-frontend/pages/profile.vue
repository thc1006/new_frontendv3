<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>個人資料</h2>
    </div>

    <!-- 載入中狀態 -->
    <div v-if="isLoading" class="loading-state">
      <v-progress-circular indeterminate color="primary" />
      <span>載入中...</span>
    </div>

    <!-- 用戶資訊區塊 -->
    <div v-else class="user-info-section">
      <v-card class="info-card">
        <v-card-title class="info-card-title">
          <v-icon class="mr-2">mdi-account-circle</v-icon>
          帳號資訊
        </v-card-title>
        <v-card-text>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">帳號</div>
              <div class="info-value">{{ user?.account || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">電子郵件</div>
              <div class="info-value">{{ user?.email || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">角色</div>
              <div class="info-value">
                <v-chip :color="user?.role === 'ADMIN' ? 'primary' : 'secondary'" size="small">
                  {{ user?.role || '-' }}
                </v-chip>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">建立日期</div>
              <div class="info-value">{{ formatDate(user?.created_at) }}</div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 安全性設定區塊 -->
      <v-card class="security-card">
        <v-card-title class="info-card-title">
          <v-icon class="mr-2">mdi-shield-account</v-icon>
          安全性設定
        </v-card-title>
        <v-card-text>
          <div class="security-item">
            <div>
              <div class="security-label">密碼</div>
              <div class="security-hint">定期更換密碼以確保帳號安全</div>
            </div>
            <v-btn color="primary" variant="outlined" @click="openPasswordDialog">
              修改密碼
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- 修改密碼對話框 -->
    <v-dialog v-model="passwordDialog" max-width="450">
      <v-card>
        <v-card-title>修改密碼</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="passwordForm.newPassword"
            label="新密碼"
            type="password"
            :rules="[v => !!v || '請輸入新密碼', v => v.length >= 6 || '密碼至少 6 個字元']"
            class="mb-2"
          />
          <v-text-field
            v-model="passwordForm.confirmPassword"
            label="確認新密碼"
            type="password"
            :rules="[v => !!v || '請確認新密碼']"
            :error-messages="passwordMismatchError"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closePasswordDialog">取消</v-btn>
          <v-btn color="primary" :loading="isChangingPassword" @click="confirmChangePassword">確認</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 提示訊息 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useUserStore } from '~/stores/user'

  const userStore = useUserStore()

  const isLoading = ref(true)
  const passwordDialog = ref(false)
  const isChangingPassword = ref(false)
  const snackbar = ref({ show: false, text: '', color: 'success' })

  // TODO: 後端 API 實作後，需加入舊密碼欄位以提升安全性
  const passwordForm = ref({
    newPassword: '',
    confirmPassword: ''
  })

  // 密碼不一致錯誤訊息
  const passwordMismatchError = computed(() => {
    if (passwordForm.value.confirmPassword &&
      passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      return '密碼不一致'
    }
    return ''
  })

  // 用戶資料
  const user = computed(() => userStore.user)

  onMounted(async () => {
    try {
      // 確保用戶資料已載入
      if (!userStore.user) {
        await userStore.fetchUser()
      }
    } catch (err) {
      console.error('載入用戶資料失敗:', err)
      snackbar.value = {
        show: true,
        text: '無法載入個人資料，請稍後再試',
        color: 'error'
      }
    } finally {
      isLoading.value = false
    }
  })

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-TW')
  }

  function openPasswordDialog() {
    passwordForm.value = { newPassword: '', confirmPassword: '' }
    passwordDialog.value = true
  }

  function closePasswordDialog() {
    passwordDialog.value = false
    passwordForm.value = { newPassword: '', confirmPassword: '' }
  }

  async function confirmChangePassword() {
    // 驗證密碼
    if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
      snackbar.value = { show: true, text: '密碼至少 6 個字元', color: 'error' }
      return
    }

    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      snackbar.value = { show: true, text: '密碼不一致', color: 'error' }
      return
    }

    // TODO: 後端需提供 PATCH /user/password 端點
    // 預期請求：{ old_password: string, new_password: string }
    // 預期回應：{ success: boolean }
    isChangingPassword.value = true
    console.warn('[TODO] Change password API not implemented')
    snackbar.value = {
      show: true,
      text: '修改密碼功能尚未接上後端',
      color: 'warning'
    }
    isChangingPassword.value = false
    closePasswordDialog()
  }
</script>

<style scoped>
.profile-container {
  padding: 24px 32px;
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.profile-header h2 {
  margin: 0;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #1976d2, #42a5f5);
  border-radius: 2px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  color: #666;
}

.user-info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card,
.security-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.info-card-title {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 15px;
  color: #1a1a1a;
  font-weight: 500;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.security-label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.security-hint {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

@media (max-width: 600px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
