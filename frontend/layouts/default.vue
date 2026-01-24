<template>
  <v-app>
    <v-app-bar app>
      <v-app-bar-nav-icon v-if="!isSidebarDisabled" @click="toggleDrawer"  />
      <v-img
        v-if="logoStyle === 'WiSDON'"
        src="/wisdon.png"
        alt="Wisdon"
        max-width=150px
        style="cursor:pointer; height: auto; margin-left: 10px;"
        @click="gotoWisdon"
      />
      <v-img
        v-if="logoStyle === 'TFN'"
        src="/tfn.png"
        alt="TFN"
        max-width=150px
        style="cursor:pointer; height: auto; margin-left: 10px;" 
        @click="gotoTFN"
      />
      <v-spacer/>
      <v-btn
        v-if="isLoggedIn && isInProjectContext"
        variant="text"
        class="wisdon-chat-btn"
        @click="openAssistant"
      >
        WiSDON Chat
      </v-btn>
      <v-spacer/>
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer
      v-if="!isSidebarDisabled"
      v-model="drawer"
      floating
      temporary
      app
      :disabled="isSidebarDisabled"
      :scrim="!isSidebarDisabled"
    >
      <div class="pa-4">
        <span class="text-h4">Menu</span>
      </div>
      <!-- Breadcrumbs -->
      <div v-if="breadcrumbs.length > 1" class="breadcrumbs pa-3">
        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
          <span
            :class="['breadcrumb-item', { 'breadcrumb-current': index === breadcrumbs.length - 1 }]"
            @click="index < breadcrumbs.length - 1 ? menuNavigate(crumb.path) : null"
          >
            {{ crumb.title }}
          </span>
          <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">/</span>
        </template>
      </div>
      <v-divider v-if="breadcrumbs.length > 1" />
      <v-list>
        <template v-for="item in currentMenu" :key="item.title">
          <v-list-item
            v-if="!('children' in item)"
            :class="{ 'v-list-item--active': isActiveRoute(item.to) }"
            @click="menuNavigate(item.to)"
          >
            <template #prepend>
              <v-icon v-if="isActiveRoute(item.to)" color="primary" size="small">mdi-chevron-right</v-icon>
            </template>
            <v-list-item-title :class="{ 'font-weight-bold text-primary': isActiveRoute(item.to) }">
              {{ item.title }}
            </v-list-item-title>
          </v-list-item>
          <v-list-group
            v-else
            no-action
            :value="isGroupActive(item)"
          >
            <template #activator="{ props }">
              <v-list-item v-bind="props" :class="{ 'v-list-item--active': isGroupActive(item) }">
                <v-list-item-title :class="{ 'font-weight-bold text-primary': isGroupActive(item) }">
                  {{ item.title }}
                </v-list-item-title>
              </v-list-item>
            </template>
            <v-list-item
              v-for="child in item.children"
              :key="child.title"
              :class="{ 'v-list-item--active': isActiveRoute(child.to) }"
              @click="menuNavigate(child.to)"
            >
              <template #prepend>
                <v-icon v-if="isActiveRoute(child.to)" color="primary" size="small">mdi-chevron-right</v-icon>
              </template>
              <v-list-item-title :class="{ 'font-weight-bold text-primary': isActiveRoute(child.to) }">
                {{ child.title }}
              </v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <NuxtPage/>
    </v-main>
    <!-- chatbot window -->
    <ChatInterface
      v-if="isLoggedIn && isInProjectContext"
      v-model="showAssistant"
    />
    <v-footer app padless>
      <v-col class="text-center" cols="12">
        <a
          href="Crews.webp"
          target="_blank"
          style="text-decoration: none; color: inherit; cursor: pointer;"
        >
          Copyright © 2026 NYCU WiSDON All Rights Reserved 
        </a>
      </v-col>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { useUserStore } from '~/stores/user'
  import { useRoute, useRouter } from 'vue-router'
  import { navigateTo } from 'nuxt/app'
  import { createModuleLogger } from '~/utils/logger'

  const log = createModuleLogger('Layout')

  const config = useRuntimeConfig()
  const logoStyle = config.public.logoStyle

  const drawer = ref(false)
  const userStore = useUserStore()
  const route = useRoute()
  const router = useRouter()
  const isNavigating = ref(false)

  const projectId = ref(route.params.projectId ? Number(route.params.projectId) : null)
  const isLoggedIn = computed(() => !!userStore.user)
  const showAssistant = ref(false)

  const isInProjectContext = computed(() => {
    return route.path.startsWith('/projects/') &&
      route.path !== '/projects/create' &&
      !!route.params.projectId
  })

  log.lifecycle('setup:start', { path: route.path })
  await userStore.fetchUser()
  log.lifecycle('setup:userFetched', { user: userStore.user?.account })

  watch(() => route.params.projectId, (newVal) => {
    projectId.value = newVal ? Number(newVal) : null
    log.debug('projectId changed', { projectId: projectId.value })
  })

  const mainMenu = [
    { title: 'Projects List', to: '/' },
    { title: 'Profile', to: '/profile' },
    { title: 'User List', to: '/users', requiredRole: 'ADMIN' },
    { title: 'Brands', to: '/brands', requiredRole: 'ADMIN' },
    { title: 'AI Models', to: '/ai-models', requiredRole: 'ADMIN'},
  ]

  const userRole = computed(() => userStore.user?.role ?? '')

  const filteredMainMenu = computed(() =>
    mainMenu.filter(item => !item.requiredRole || userRole.value === item.requiredRole)
  )

  // 專案選單結構 (根據 Figma 3:2027, 17:429)
  const projectMenu = computed(() => [
    { title: 'Overview', to: `/projects/${projectId.value}/overviews` },
    { title: 'Scene Deployment', to: `/projects/${projectId.value}/scene-deployment` },
    { title: 'AI Application Simulator', to: `/projects/${projectId.value}/ai-simulator` },
    { title: 'AI-RAN Applications', to: `/projects/${projectId.value}/ai-ran` },
    {
      title: 'Configuration',
      children: [
        { title: 'gNB', to: `/projects/${projectId.value}/config/gnb` },
        { title: 'Evaluation', to: `/projects/${projectId.value}/config/evaluations` }
      ]
    },
    {
      title: 'Performance',
      children: [
        { title: 'NES', to: `/projects/${projectId.value}/performance/nes` },
        { title: 'MRO', to: `/projects/${projectId.value}/performance/mro` },
        { title: 'AI Model Performance', to: `/projects/${projectId.value}/performance/ai-model` },
        { title: 'RAN Slice Performance', to: `/projects/${projectId.value}/performance/ran-slice` }
      ]
    },
    { title: 'AI Model Evaluation', to: `/projects/${projectId.value}/ai-model-evaluation` },
    { title: 'Project Setting', to: `/projects/${projectId.value}/setting` },
    { title: 'Projects List', to: '/' }
  ])

  // Navigation logging - removed window.location.reload() to fix blank page issue
  router.beforeEach((to, from) => {
    log.info(`Navigation starting: ${from.path} → ${to.path}`)
    isNavigating.value = true
  })

  router.afterEach((to, from) => {
    log.info(`Navigation completed: ${from.path} → ${to.path}`)
    isNavigating.value = false
  })

  router.onError((error) => {
    log.error('Navigation error', { error: error.message })
    isNavigating.value = false
  })

  const currentMenu = computed(() => {
    if (route.path.startsWith('/projects/')&&(route.path!=='/projects/create')) return projectMenu.value
    return filteredMainMenu.value
  })

  // 檢查路由是否為當前活躍路由
  const isActiveRoute = (path: string): boolean => {
    return route.path === path
  }

  // 檢查群組是否包含活躍路由
  const isGroupActive = (item: { children?: { to: string }[] }): boolean => {
    if (!item.children) return false
    return item.children.some(child => route.path === child.to)
  }

  // 麵包屑導航
  const breadcrumbs = computed(() => {
    const crumbs: { title: string; path: string }[] = []

    if (route.path === '/' || route.path === '/login' || route.path === '/register') {
      return crumbs
    }

    crumbs.push({ title: 'Home', path: '/' })

    if (route.path.startsWith('/projects/') && projectId.value) {
      crumbs.push({ title: `Project ${projectId.value}`, path: `/projects/${projectId.value}/overviews` })

      // 找到當前頁面的標題
      const flatMenu = projectMenu.value.flatMap(item =>
        'children' in item && item.children ? item.children : [item]
      )
      const currentItem = flatMenu.find(item => item.to === route.path)
      if (currentItem) {
        crumbs.push({ title: currentItem.title, path: route.path })
      }
    } else {
      const currentItem = filteredMainMenu.value.find(item => item.to === route.path)
      if (currentItem) {
        crumbs.push({ title: currentItem.title, path: route.path })
      }
    }

    return crumbs
  })

  // Disable if not log in
  const isSidebarDisabled = computed(() => {
    return (
      !userStore.user ||
      route.path === '/login' ||
      route.path === '/register'
    )
  })

  function gotoTFN() {
    window.open('https://www.twmsolution.com/internet/index.html', '_blank')
  }

  function gotoWisdon() {
    window.open('https://cm.nycu.edu.tw/pages.php?pa=lab_content&lab_id=6&locale=tw', '_blank')
  }

  // Toggle sidebar
  function toggleDrawer() {
    if (!isSidebarDisabled.value) {
      drawer.value = !drawer.value
      log.debug('Drawer toggled', { open: drawer.value })
    }
  }

  // Handle AI assistant
  async function openAssistant() {
    log.info('Opening AI assistant')
    showAssistant.value = true
  }

  // Handle user logout and redirect to login page
  async function logout() {
    log.info('Logout initiated')
    try {
      await userStore.logout()
      log.info('Logout successful')
    } catch (error) {
      log.error('Logout error', { error })
    } finally {
      // Use Vue router navigation instead of window.location.reload()
      await navigateTo('/login', { replace: true })
    }
  }

  // Menu navigation with proper async handling
  async function menuNavigate(to: string) {
    log.info(`Menu navigate to: ${to}`)
    drawer.value = false
    try {
      await navigateTo(to)
    } catch (error) {
      log.error('Navigation failed', { to, error })
    }
  }

  onMounted(() => {
    log.lifecycle('mounted', { path: route.path })
  })
</script>

<style scoped>
/* WiSDON Chat button - Figma Node 17:154 */
.wisdon-chat-btn {
  color: #006ab5 !important;
  font-size: 18px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
}

/* Breadcrumbs navigation */
.breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.breadcrumb-item {
  cursor: pointer;
  transition: color 0.2s;
}

.breadcrumb-item:hover:not(.breadcrumb-current) {
  color: #006ab5;
  text-decoration: underline;
}

.breadcrumb-current {
  color: #006ab5;
  font-weight: 500;
  cursor: default;
}

.breadcrumb-separator {
  color: #999;
  margin: 0 2px;
}

/* Active route highlighting */
.v-list-item--active {
  background-color: rgba(0, 106, 181, 0.08) !important;
}
</style>
