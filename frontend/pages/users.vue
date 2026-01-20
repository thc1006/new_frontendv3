<template>
  <div class="user-list-container">
    <h2>使用者列表</h2>
    <div class="user-list-table">
      <div class="user-list-header">
        <div>帳號</div>
        <div>Email</div>
        <div>角色</div>
        <div>Grafana User ID</div>
        <div>建立日期</div>
        <div>ID</div>
        <div>操作</div>
      </div>
      <div
        v-for="user in userList"
        :key="user.user_id"
        class="user-list-row"
        style="cursor:pointer"
        @click="showUserProjects(user.user_id)"
      >
        <div>{{ user.account }}</div>
        <div>{{ user.email }}</div>
        <div>
          <span>{{ user.role }}</span>
        </div>
        <div>{{ user.grafana_user_id }}</div>
        <div>{{ user.created_at }}</div>
        <div>{{ user.user_id }}</div>
        <div @click.stop>
          <v-btn
            color="error"
            :disabled="user.role === 'ADMIN' || !user.user_id"
            class="delete-btn"
            @click="deleteUser(user.user_id!)"
          >刪除</v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import type { User } from '~/apis/Api'

  const { $apiClient } = useNuxtApp()

  const userList = ref<User[]>([])

  async function fetchUsers(): Promise<void> {
    const res = await $apiClient.user.usersList()
    userList.value = res.data
  }

  async function deleteUser(userId: number): Promise<void> {
    if (confirm('確定要刪除此使用者嗎？')) {
      await $apiClient.user.usersDelete(userId)
      userList.value = userList.value.filter((u: User) => u.user_id !== userId)
    }
  }

  function showUserProjects(_userId: number | undefined): void {
    // TODO: Navigate to user projects page or show dialog
  }

  onMounted(fetchUsers)
</script>

<style scoped>
.user-list-container {
  margin-top: 40px;
  margin-left: 32px;
  margin-right: 32px;
}
.user-list-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.user-list-header,
.user-list-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1.5fr 1.5fr 0.8fr 0.8fr;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
}
.user-list-header {
  background: #000000;
  color: #fff;
  font-weight: bold;
  border-radius: 12px 12px 0 0;
  letter-spacing: 1px;
}
.user-list-row {
  background: #fff;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s;
}
.user-list-row:last-child {
  border-radius: 0 0 12px 12px;
}
.user-list-row:hover {
  background: #333;
  color: #fff;
}
.delete-btn {
  opacity: 1;
}
.delete-btn:disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>