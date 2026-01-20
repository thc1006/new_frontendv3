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

  // Use Map with numeric keys to match backend ID type (eliminates String/Number conversions)
  const chats = ref<Map<number, ChatSession>>(new Map())
  const activeChatId = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function createChat(projectId: number) {
    if (!projectId) {
      console.error('projectId 為 null，無法建立聊天')
      return
    }

    const newTitle = `${userStore.user?.user_id}_${projectId}_chat_${Date.now()}`
    const response = await $apiClient.chat.chatSessionsCreate(projectId, { title: newTitle })
    const chatId = (response.data as CreateChatResponse)['new chat session id']

    chats.value.set(chatId, { title: newTitle, message: [] })
    activeChatId.value = chatId
  }

  async function loadChatSessions(projectId: number) {
    isLoading.value = true
    try {
      const response = await $apiClient.chat.chatSessionsList(projectId)
      const sessions = response.data as ChatSessionListItem[]

      chats.value.clear()
      sessions.forEach(session => {
        const id = session['chat session id']
        chats.value.set(id, {
          title: session['chat session title'],
          message: []
        })
      })
    } catch (err) {
      console.error('載入聊天室列表錯誤', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loadChatMessages(chatId: number) {
    if (!chats.value.has(chatId)) return

    try {
      const response = await $apiClient.chat.messagesList(chatId)
      const messages = response.data as ChatMessageResponse[]

      const chat = chats.value.get(chatId)
      if (chat) {
        chat.message = messages.map(msg => ({
          role: msg['chat message role'],
          content: msg['chat message content'],
          time: msg['chat message created_at']
        }))
      }
    } catch (err) {
      console.error('載入聊天訊息失敗:', err)
      throw err
    }
  }

  async function deleteChat(chatId: number) {
    if (!chats.value.has(chatId)) return

    try {
      await $apiClient.chat.chatSessionsDelete(chatId)
      chats.value.delete(chatId)
      if (activeChatId.value === chatId) {
        activeChatId.value = null
      }
    } catch (err) {
      console.error('刪除聊天室失敗:', err)
      throw err
    }
  }

  async function switchChat(chatId: number) {
    if (chats.value.has(chatId)) {
      activeChatId.value = chatId
      // Load messages if not already loaded
      const chat = chats.value.get(chatId)
      if (chat && chat.message.length === 0) {
        await loadChatMessages(chatId)
      }
    }
  }

  async function sendMessage(messageText: string) {
    if (activeChatId.value === null || !messageText.trim()) return

    const chatId = activeChatId.value
    const chat = chats.value.get(chatId)
    if (!chat) return

    const userMessage: ChatMessage = {
      role: 'USER',
      content: messageText,
      time: new Date().toISOString()
    }

    chat.message.push(userMessage)
    isLoading.value = true
    error.value = null

    try {
      // Send user message to API
      const response = await $apiClient.chat.messagesCreate(chatId, {
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

      chat.message.push(assistantMessage)

    } catch (err: unknown) {
      console.error('發送訊息失敗:', err)
      error.value = err instanceof Error ? err.message : '發送訊息失敗'

      // Add error response
      const errorMessage: ChatMessage = {
        role: 'ASSISTANT',
        content: '抱歉，我現在無法回答您的問題。請稍後再試或聯繫系統管理員。',
        time: new Date().toISOString()
      }
      chat.message.push(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  async function updateChatTitle(chatId: number, newTitle: string) {
    const chat = chats.value.get(chatId)
    if (!chat) {
      console.error('無法更新標題，聊天會話不存在');
      return;
    }

    try {
      await $apiClient.chat.chatSessionsUpdate(chatId, { title: newTitle });
      chat.title = newTitle;
    } catch (err) {
      console.error('更新聊天標題失敗:', err);
      throw err;
    }
  }

  function clearError() {
    error.value = null
  }

  // Helper to get chat list as array for template iteration
  function getChatList(): Array<{ id: number; title: string; message: ChatMessage[] }> {
    return Array.from(chats.value.entries()).map(([id, session]) => ({
      id,
      title: session.title,
      message: session.message
    }))
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
    clearError,
    getChatList
  }
})
