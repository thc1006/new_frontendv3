<template>
  <v-dialog v-model="dialogVisible" max-width="1200px" persistent>
    <v-card class="chat-container fixed-dialog-card">
      <v-card-title class="sticky-title" style="display: flex; align-items: center; justify-content: space-between;">
        <span>5G-ORAN 小幫手</span>
        <v-btn icon @click="closeChat">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-container>
        <v-row class="pa-0">
          <v-col cols="3" class="pa-0" style="height: 75vh;">
            <v-sheet class="chat-sidebar no-elevation" height="100%">
              <!-- sidebar content -->
              <div class="sidebar-header">
                <div class="text-subtitle-1 font-weight-bold">聊天列表</div>
                <v-btn icon size="small" @click="createChat(projectId!)">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </div>
              <v-list nav dense class="chat-list">
                <v-list-item
                  v-for="(chat, id) in chats"
                  :key="id"
                  :value="id"
                  :active="id === activeChatId"
                  class="chat-item"
                >
                  <v-list-item-title class="chat-title" @click="switchChat(id)" >
                    <span v-if="!editingChatId || editingChatId !== id">{{ chat.title }}</span>
                    <v-text-field
                      v-else
                      v-model="editingTitle"
                      dense
                      outlined
                      hide-details
                      @keyup.enter="saveChatTitle(id)"
                      @blur="cancelEditChatTitle"
                    />
                  </v-list-item-title>
                  <template #append>
                    <v-btn 
                      icon 
                      size="x-small" 
                      variant="text"
                      class="edit-btn"
                      @click.stop="startEditChatTitle(id, chat.title)"
                    >
                      <v-icon size="16">mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn 
                      icon 
                      size="x-small" 
                      variant="text"
                      class="delete-btn"
                      @click.stop="deleteChat(id)"
                    >
                      <v-icon size="16">mdi-close</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-col>

          <!-- 右側聊天區 -->
          <v-col cols="9" class="d-flex flex-column pa-0" style="height: 75vh;">
            <!-- 對話訊息 -->  
            <template v-if="!activeChatId">
              <div class="empty-message">
                請先選擇聊天室或點擊左上角的 + 號開啟新的聊天室，再輸入問題
              </div>
            </template>
            <template v-else>
              <div ref="messagesContainer" class="chat-messages" >
                <div 
                  v-for="(message, index) in activeMessages.message" 
                  :key="index"
                  :class="[
                    'message', 
                    message.role === 'USER' ? 'user-message' : 'assistant-message'
                  ]"
                >
                  <!-- Assistant -->
                  <template v-if="message.role === 'ASSISTANT'">
                    <v-avatar size="32" class="mr-2">
                      <v-icon>mdi-robot</v-icon>
                    </v-avatar>
                    <div class="message-bubble assistant-bubble">
                      <div v-html="formatMessage(message.content)" />
                      <div class="message-time">{{ message.time }}</div>
                    </div>
                  </template>

                  <!-- User -->
                  <template v-else>
                    <div class="message-bubble user-bubble">
                      <div>{{ message.content }}</div>
                      <div class="message-time">{{  message.time }}</div>
                    </div>
                    <v-avatar size="32" class="ml-2">
                      <v-icon>mdi-account</v-icon>
                    </v-avatar>
                  </template>
                </div>

                <!-- 載入動畫 -->
                <div v-if="isLoading" class="message assistant-message">
                  <v-avatar size="32" class="mr-2">
                    <v-icon>mdi-robot</v-icon>
                  </v-avatar>
                  <div class="message-bubble assistant-bubble">
                    <v-progress-circular indeterminate size="16" width="2" class="mr-2" />
                    正在思考中...
                  </div>
                </div>
              </div>
              <!-- 快速提問 -->
              <div class="quick-questions px-4 py-2" style="border-top: 1px solid #e0e0e0;">
                <v-btn
                  v-for="(q, i) in quickQuestions"
                  :key="i"
                  small
                  class="ma-1"
                  color="primary"
                  variant="outlined"
                  @click="askQuickQuestion(q)"
                >
                  {{ q }}
                </v-btn>
              </div>
              <!-- 輸入區 -->
              <div class="chat-input px-4 py-2">
                <v-text-field
                  v-model="userInput"
                  placeholder="請輸入您的問題"
                  outlined
                  dense
                  hide-details
                  variant="outlined"
                  :disabled="isLoading"
                  append-inner-icon="mdi-send"
                  @keyup.enter="sendMessage"
                  @click:append-inner="sendMessage"
                />
              </div>
            </template>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { useAssistantStore } from '~/stores/assistant'
  import { useRoute } from 'vue-router'
  
  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const assistantStore = useAssistantStore()
  const route = useRoute()

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const userInput = ref('')
  const messagesContainer = ref<HTMLElement | null>(null)
  

  // 快速問題建議
  const quickQuestions = [
    '最新的基站狀態如何？',
    '今天有異常警嗎？',
    '網路效能如何？',
    '用戶連線數量？'
  ]

  // 從 store 獲取狀態
  const chats = computed(() => assistantStore.chats)
  const activeChatId = computed(()=>assistantStore.activeChatId)
  const activeMessages = computed(()=>chats.value[activeChatId.value]||[])
  const isLoading = computed(() => assistantStore.isLoading)

  const projectId = ref(route.params.projectId ? Number(route.params.projectId) : null)

  const editingChatId = ref<string | null>(null);
  const editingTitle = ref<string>('');

  function startEditChatTitle(chatId: string, currentTitle: string) {
    editingChatId.value = chatId;
    editingTitle.value = currentTitle;
  }

  async function saveChatTitle(chatId: string) {
    if (!editingTitle.value.trim()) {
      console.error('標題不可為空');
      return;
    }

    try {
      await assistantStore.updateChatTitle(chatId, editingTitle.value.trim());
      editingChatId.value = null;
      editingTitle.value = '';
    } catch (error) {
      console.error('更新聊天標題失敗:', error);
    }
  }

  function cancelEditChatTitle() {
    editingChatId.value = null;
    editingTitle.value = '';
  }

  watch(() => route.params.projectId, (newVal) => {
    projectId.value = newVal ? Number(newVal) : null
  })

  watch(dialogVisible, async (visible) => {
    if (visible && projectId.value) {
      try {
        await assistantStore.loadChatSessions(projectId.value)
      } catch (err) {
        console.error('載入聊天室列表失敗:', err)
      }
    }
  })

  

  function closeChat() {
    dialogVisible.value = false
  }

  function switchChat(id:string){
    assistantStore.switchChat(id)
    assistantStore.loadChatMessages(id)
    nextTick(()=>scrollToBottom())
  }

  async function createChat(id: number) {
    await assistantStore.createChat(id)
  }

  function deleteChat(id: string){
    assistantStore.deleteChat(id)
  }

  async function sendMessage() {
    if (!userInput.value.trim() || isLoading.value) return

    const messageText = userInput.value.trim()
    userInput.value = ''


    try {
      await assistantStore.sendMessage(messageText)
      await nextTick()
      scrollToBottom()
    } catch (error) {
      console.error('發送訊息失敗:', error)
    }
  }

  function askQuickQuestion(question: string) {
    userInput.value = question
    sendMessage()
  }

  function scrollToBottom() {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }


  function escapeHTML(text: string){
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMessage(text: string) {
    const escaped = escapeHTML(text);
    return escaped.replace(/\n/g, '<br>');
  }

  // 監聽對話框開啟，滾動到底部
  watch(dialogVisible, (newVal) => {
    if (newVal) {
      nextTick(() => {
        scrollToBottom()
      })
    }
  })

  // 監聽訊息變化，自動滾動
  watch(activeMessages, 
        () => {
          nextTick(() => {
            scrollToBottom()
          })
        }, { deep: true })
  </script>

    <style>
    .v-dialog__content {
      align-items: center !important;
      justify-content: center !important;
    }
    </style>

<style scoped>
.fixed-dialog-card {
  width: 95%;
  height: 100%;
}

.chat-container {
  display: flex;
  flex-direction: row;
  height: 80%;
  overflow: hidden;
}

.chat-sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  background: #f8f9fa;
  box-shadow: none
}

.sidebar-header {
  position: sticky;
  top: 64px;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.chat-item {
  margin-bottom: 4px;
  border-radius: 8px;
}

.chat-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: #1565c0;
  color: white;
  padding: 12px 16px;
  min-height: auto;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.empty-message {
  height: 100%;
  display: flex;
  justify-content: center; /* 水平置中 */
  align-items: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}

.message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
  word-wrap: break-word;
}

.assistant-message {
  justify-content: flex-start;
}

.user-message {
  justify-content: flex-end;
}

.assistant-bubble {
  background: #e8f0fe;
  border: 1px solid #dadce0;
}

.user-bubble {
  background: #1976d2;
  color: white;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 4px;
}

.chat-input {
  padding: 16px;
  background: white;
}


.chat-title {
  cursor: pointer;
  flex: 1;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-item:hover .delete-btn {
  opacity: 1;
}

.sticky-title {
  position: sticky;
  top: 0;
  background-color: #1565c0; 
  color: white;
  z-index: 10;
}

.edit-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-item:hover .edit-btn {
  opacity: 1;
}
</style>