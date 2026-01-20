/**
 * Sentry Error Tracking Plugin for Nuxt 3
 *
 * This plugin integrates Sentry for error tracking in production.
 * Errors are automatically captured and sent to Sentry dashboard.
 *
 * Configuration:
 * - Set NUXT_PUBLIC_SENTRY_DSN environment variable to enable
 * - In development, Sentry is disabled by default
 *
 * Usage:
 *   // Errors are automatically captured
 *   // For manual error reporting:
 *   const { $sentry } = useNuxtApp()
 *   $sentry?.captureException(new Error('Something went wrong'))
 *   $sentry?.captureMessage('User performed action X')
 */

import * as Sentry from '@sentry/vue'

type SentryInstance = typeof Sentry | null

export default defineNuxtPlugin<{ sentry: SentryInstance }>((nuxtApp) => {
  const config = useRuntimeConfig()
  const router = useRouter()

  // Only initialize Sentry if DSN is provided
  const sentryDsn = config.public.sentryDsn as string

  if (!sentryDsn) {
    console.log('[Sentry] DSN not configured, error tracking disabled')
    return {
      provide: {
        sentry: null
      }
    }
  }

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // Adjust in production for lower sampling rate
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out common non-actionable errors
    beforeSend(event, hint) {
      const error = hint?.originalException

      // Ignore network errors that are expected
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        if (
          message.includes('network error') ||
          message.includes('failed to fetch') ||
          message.includes('load failed')
        ) {
          // Still log locally but don't send to Sentry
          console.warn('[Sentry] Network error filtered:', message)
          return null
        }
      }

      return event
    },

    // Additional context
    initialScope: {
      tags: {
        app: 'wisdon-frontend',
      },
    },
  })

  // Capture Vue errors
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    // Get component name (works with both Options API and Composition API)
    const componentName = instance?.$options?.name ||
                          instance?.$options?.__name ||
                          instance?.$.type?.name ||
                          instance?.$.type?.__name ||
                          'UnknownComponent'

    Sentry.captureException(error, {
      extra: {
        componentName,
        info,
      },
    })
    // Re-throw to allow Vue's default error handling
    console.error('[Vue Error]', error)
  }

  // Capture unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason, {
        tags: {
          type: 'unhandledrejection',
        },
      })
    })
  }

  // Expose Sentry on window for use by logger utility
  (window as unknown as { $sentry: typeof Sentry }).$sentry = Sentry

  console.log('[Sentry] Initialized successfully')

  return {
    provide: {
      sentry: Sentry
    }
  }
})
