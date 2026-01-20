# Copilot Code Review Instructions

This document provides instructions for GitHub Copilot when reviewing code in this repository.

## Project Context
- **Framework**: Nuxt 3 (Vue 3 + TypeScript)
- **UI Library**: Vuetify 3
- **Map Library**: Mapbox GL JS
- **State Management**: Pinia
- **Testing**: Playwright E2E tests

## Code Review Guidelines

### TypeScript
- Ensure strict type safety; avoid `any` type unless absolutely necessary
- Prefer interfaces over type aliases for object shapes
- Use proper null checking with optional chaining (`?.`) and nullish coalescing (`??`)

### Vue Components
- Follow Vue 3 Composition API with `<script setup lang="ts">`
- Ensure proper ref/reactive usage
- Check for memory leaks in component lifecycle (cleanup in `onUnmounted`)
- Verify computed properties are pure functions

### Security
- Flag any hardcoded credentials or API keys
- Check for XSS vulnerabilities in template bindings
- Ensure user input is properly sanitized
- Verify API endpoints use proper authentication

### Performance
- Check for unnecessary re-renders
- Ensure proper use of `v-memo` or `computed` for expensive operations
- Flag large bundle imports that could be lazy-loaded
- Verify images and assets are optimized

### Code Style
- 2-space indentation
- No console.log in production code (use logger utility instead)
- Meaningful variable and function names
- Comments for complex logic only

## Files to Ignore
- `node_modules/`
- `.nuxt/`
- `.output/`
- `*.min.js`
- Generated API clients
