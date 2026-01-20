import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage } from '~/apis/Api'
import { useUserStore } from '~/stores/user'

// API Response interfaces (based on actual backend response structure)
interface CreateChatResponse {
  'new chat session id': number
}

interface ChatSessionListItem {
  'chat session id': number
  'chat session title': string
}

interface ChatMessageResponse {
  'chat message role': 'USER' | 'ASSISTANT'
  'chat message content': string
  'chat message created_at': string
}

interface SendMessageResponse {
  'chat message content': string
}

interface ChatSession {
  title: string
  message: ChatMessage[]
}

export const useAssistantStore = defineStore('assistant', () => {
  const userStore = useUserStore()
  const { $apiClient } = useNuxtApp();

  const chats = ref<Record<string, ChatSession>>({})
  const activeChatId = ref<string>('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function createChat(projectId: number) {
    if (!projectId) {
      console.error('projectId 為 null，無法建立聊天')
      return
    }

    const newTitle = `${userStore.user?.user_id}_${projectId}_chat_${Date.now()}`
    const response = await $apiClient.chat.chatSessionsCreate(projectId, { title: newTitle })
    const chatId = String((response.data as CreateChatResponse)['new chat session id'])

    chats.value[chatId] = { title: newTitle, message: [] }
    activeChatId.value = chatId

  }

  async function loadChatSessions(projectId: number) {
    isLoading.value = true
    try {
      const response = await $apiClient.chat.chatSessionsList(projectId)
      const sessions = response.data as ChatSessionListItem[]

      chats.value = {}
      sessions.forEach(session => {
        const id = String(session['chat session id'])
        chats.value[id] = {
          title: session['chat session title'],
          message: []
        }
      })
    } catch (error) {
      console.error('載入聊天室列表錯誤', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadChatMessages(chatId: string) {
    if (!chats.value[chatId]) return
    
    try {
      const response = await $apiClient.chat.messagesList(Number(chatId))
      const messages = response.data as ChatMessageResponse[]

      chats.value[chatId].message = messages.map(msg => ({
        role: msg['chat message role'],
        content: msg['chat message content'],
        time: msg['chat message created_at']
      }))
    } catch (error) {
      console.error('載入聊天訊息失敗:', error)
      throw error
    }
  }

  async function deleteChat(chatId: string){
    if(!chats.value[chatId]) return
    
    try {
      await $apiClient.chat.chatSessionsDelete(Number(chatId))
      Reflect.deleteProperty(chats.value, chatId)
      if (activeChatId.value === chatId) {
        activeChatId.value = ''
      }
    } catch (error) {
      console.error('刪除聊天室失敗:', error)
      throw error
    }
  }

  async function switchChat(chatId: string){
    if(chats.value[chatId]){
      activeChatId.value = chatId
      // Load messages if not already loaded
      if (chats.value[chatId].message.length === 0) {
        await loadChatMessages(chatId)
      }
    }
  }

  async function sendMessage(messageText: string) {
    if(!activeChatId.value || !messageText.trim()) return

    const chatId = activeChatId.value
    const userMessage: ChatMessage = {
      role: 'USER',
      content: messageText,
      time: new Date().toISOString()
    }
    
    chats.value[chatId].message.push(userMessage)
    isLoading.value = true
    error.value = null

    try {
      // Send user message to API
      const response = await $apiClient.chat.messagesCreate(Number(chatId), {
        role: 'USER',
        content: messageText,
        time: new Date().toISOString()
      })

      
      // Add assistant response
      const responseData = response.data as SendMessageResponse
      const assistantMessage: ChatMessage = {
        role: 'ASSISTANT',
        content: responseData['chat message content'] || '抱歉，我現在無法回答您的問題。',
        time: new Date().toISOString()
      }

      chats.value[chatId].message.push(assistantMessage)

    } catch (err: unknown) {
      console.error('發送訊息失敗:', err)
      error.value = err instanceof Error ? err.message : '發送訊息失敗'
      
      // Add error response
      const errorMessage: ChatMessage = {
        role: 'ASSISTANT',
        content: '抱歉，我現在無法回答您的問題。請稍後再試或聯繫系統管理員。',
        time: new Date().toISOString()
      }
      chats.value[chatId].message.push(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  async function updateChatTitle(chatId: string, newTitle: string) {
    if (!chats.value[chatId]) {
      console.error('無法更新標題，聊天會話不存在');
      return;
    }

    try {
      await $apiClient.chat.chatSessionsUpdate(Number(chatId), { title: newTitle });
      chats.value[chatId].title = newTitle;
    } catch (error) {
      console.error('更新聊天標題失敗:', error);
      throw error;
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    chats,
    activeChatId,
    isLoading,
    error,
    sendMessage,
    createChat,
    loadChatSessions,
    loadChatMessages,
    deleteChat,
    switchChat,
    updateChatTitle,
    clearError
  }
})