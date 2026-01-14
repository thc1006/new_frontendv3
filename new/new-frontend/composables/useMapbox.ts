import mapboxgl from 'mapbox-gl'
import { ref, shallowRef, onUnmounted } from 'vue'
import type { Ref, ShallowRef } from 'vue'

// Mapbox access token - 共用設定
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ'

// 台灣預設位置
export const DEFAULT_CENTER: [number, number] = [120.9738, 24.8138]
export const DEFAULT_ZOOM = 13

// Mapbox 配置選項
export interface MapboxOptions {
  container: string | HTMLElement
  center?: [number, number]
  zoom?: number
  style?: string
  pitch?: number
  projection?: string
  addNavControl?: boolean
  addScaleControl?: boolean
}

// 回傳類型
export interface UseMapboxReturn {
  map: ShallowRef<mapboxgl.Map | null>
  isLoaded: Ref<boolean>
  initMap: (options: MapboxOptions) => mapboxgl.Map | null
  destroyMap: () => void
}

/**
 * Mapbox 地圖初始化 composable
 * 處理共用的地圖初始化邏輯、控制項添加和清理
 */
export function useMapbox(): UseMapboxReturn {
  // 使用 shallowRef 避免深層類型遞迴問題 (mapboxgl.Map 類型太複雜)
  const map = shallowRef<mapboxgl.Map | null>(null)
  const isLoaded = ref(false)

  /**
   * 初始化地圖
   * @param options 地圖配置選項
   */
  const initMap = (options: MapboxOptions): mapboxgl.Map | null => {
    // 若已存在則不重複建立
    if (map.value) return map.value

    const container = typeof options.container === 'string'
      ? document.getElementById(options.container)
      : options.container

    if (!container) {
      console.warn('[useMapbox] 找不到地圖容器')
      return null
    }

    // 設定 access token
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

    // 取得線上/離線樣式設定
    const config = useRuntimeConfig()
    const isOnline = config.public?.isOnline
    const onlineStyle = options.style || 'mapbox://styles/mapbox/streets-v12'
    const offlineStyle = config.public?.offlineMapboxGLJSURL as string
    const mapStyle = isOnline ? onlineStyle : offlineStyle

    // 建立地圖實例
    map.value = new mapboxgl.Map({
      container,
      style: mapStyle,
      center: options.center ?? DEFAULT_CENTER,
      zoom: options.zoom ?? DEFAULT_ZOOM,
      pitch: options.pitch ?? 0,
      projection: options.projection as mapboxgl.ProjectionSpecification['name'] | undefined
    })

    // 預設添加導航控制
    if (options.addNavControl !== false) {
      map.value.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      )
    }

    // 預設添加比例尺
    if (options.addScaleControl !== false) {
      map.value.addControl(new mapboxgl.ScaleControl())
    }

    // 監聽 load 事件
    map.value.on('load', () => {
      isLoaded.value = true
    })

    return map.value
  }

  /**
   * 銷毀地圖實例
   */
  const destroyMap = () => {
    if (map.value) {
      map.value.remove()
      map.value = null
      isLoaded.value = false
    }
  }

  // 組件卸載時自動清理
  onUnmounted(() => {
    destroyMap()
  })

  return {
    map,
    isLoaded,
    initMap,
    destroyMap
  }
}
