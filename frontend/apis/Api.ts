/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export type AODTSimulationConfigRequest =
  | ({
    mode: "0";
  } & AODTSimulationDurationConfig)
  | ({
    mode: "1";
  } & AODTSimulationSlotConfig);

export type GeocodeResults = GeocodeResult[];

export interface GeocodeResult {
  place_id?: number | string;
  /** Latitude as string per Nominatim default. */
  lat?: string;
  /** Longitude as string per Nominatim default. */
  lon?: string;
  display_name?: string;
  class?: string;
  type?: string;
  importance?: number;
  /** N, S, E, W as strings. */
  boundingbox?: string[];
  /** Nominatim-formatted address object. */
  address?: Record<string, any>;
  [key: string]: any;
}

export interface ErrorResponse {
  error: string;
}

export interface NotFoundResponse {
  /** Human-readable not-found message (Chinese). */
  message: string;
  /** Always an empty array in this case. */
  results: any[];
}

export interface UpstreamErrorResponse {
  /** Generic error message. */
  error: string;
  /** HTTP status returned by the upstream (if available). */
  status?: number;
  /** Truncated upstream response body (for diagnostics). */
  body?: string;
  /** Local exception detail (e.g., connection error). */
  detail?: string;
}

export interface Message {
  /** @example "操作成功" */
  message?: string;
}

export interface Error {
  /** @example "錯誤訊息" */
  error?: string;
}

export interface ChatSessionTitle {
  /** @example "A chat about 5G-ORAN" */
  title: string;
}

export interface ChatMessage {
  /** @example "USER" */
  role: "USER" | "ASSISTANT";
  /** @example "How many UEs are connected to gNB2?" */
  content: string;
  /**
   * @format date-time
   * @example "2025-08-14T15:30:00Z"
   */
  time: string;
}

export interface User {
  /** @example 1 */
  user_id?: number;
  /** @example "user1" */
  account?: string;
  /** @example "user1@gmail.com" */
  email?: string;
  /** @example "USER" */
  role?: "ADMIN" | "USER";
  /** @example 12345 */
  grafana_user_id?: string | null;
  /**
   * @format date
   * @example "2023-10-01"
   */
  created_at?: string;
}

export interface UserPutBody {
  /** @example "user1" */
  account?: string;
  /** @example "user1@gmail.com" */
  email?: string;
  /** @example "USER" */
  role?: "ADMIN" | "USER";
  /** @example "password123" */
  password?: string;
}

export interface RegisterRequest {
  /** @example "user123" */
  account: string;
  /** @example "password123" */
  password: string;
  /**
   * @format email
   * @example "user@example.com"
   */
  email: string;
}

export interface LoginRequest {
  /** @example "user123" */
  account: string;
  /** @example "password123" */
  password: string;
}

export interface Project {
  /** @example 1 */
  project_id?: number;
  /** @example "Project A" */
  title?: string;
  /**
   * @format date
   * @example "2023-10-01"
   */
  date?: string;
  /** @example "folder123" */
  grafana_folder_id?: string | null;
  /** @example 22.99414508942207 */
  lat?: double;
  /** @example 120.21676580777418 */
  lon?: double;
  /** @example 200 */
  margin?: number;
  /** @example 10 */
  lat_offset?: float;
  /** @example 10 */
  lon_offset?: float;
  /** @example 10 */
  rotation_offset?: float;
  /** @example 10 */
  scale?: float;
  owner?: User;
  /** @example false */
  is_deployed?: boolean;
}

export interface ProjectPostRequest {
  /** @example "Project A" */
  title: string;
  /**
   * @format date
   * @example "2023-10-01"
   */
  date: string;
  /** @format binary */
  gml_file?: File;
  /** @example 22.82539 */
  lat?: number;
  /** @example 120.40568 */
  lon?: number;
  /** @example 200 */
  margin?: number;
}

export interface ProjectPutRequest {
  /** @example "Project A" */
  title?: string;
  /**
   * @format date
   * @example "2023-10-01"
   */
  date?: string;
  /** @example 22.82539 */
  lat?: number;
  /** @example 120.40568 */
  lon?: number;
  /** @example 200 */
  margin?: number;
}

export interface ProjectStatus {
  /** @example "SUCCESS" */
  rsrp_status?: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS" | null;
  /** @example "SUCCESS" */
  throughput_status?: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS" | null;
  /** @example "SUCCESS" */
  rsrp_dt_status?: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS" | null;
  /** @example "SUCCESS" */
  throughput_dt_status?: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS" | null;
}

export interface ProjectStatusUpdateRequest {
  /** @example "SUCCESS" */
  status: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS";
}

export interface ProjectHeatmapData {
  /**
   * 區域 ID
   * @example 1
   */
  areaId: number;
  /**
   * MS X 座標
   * @format float
   * @example -7.77217
   */
  ms_x: number;
  /**
   * MS Y 座標
   * @format float
   */
  ms_y: number;
  /**
   * RSRP 數值
   * @example [-92.06,-120.4,-250]
   */
  rus: number[];
}

export type ProjectRSRPRequest = ProjectHeatmapData[];

export type ProjectRSRPDTRequest = ProjectHeatmapData[];

export type ProjectThroughputRequest = ProjectHeatmapData[];

export type ProjectThroughputDTRequest = ProjectHeatmapData[];

export interface MapCorrectionRequest {
  /**
   * 地圖旋轉角度（以東方為 0 度，逆時針）
   * @format double
   * @example 0
   */
  rotation_offset?: number;
  /**
   * 中心緯度位移量
   * @format double
   * @example 0
   */
  lat_offset?: number;
  /**
   * 中心經度位移量
   * @format double
   * @example 0
   */
  lon_offset?: number;
  /**
   * 地圖縮放倍數
   * @format double
   * @example 1
   */
  scale?: number;
}

export interface BrandMetrics {
  /** @example 1 */
  id?: number;
  /** @example 1 */
  brand_id: number;
  /**
   * 參數名稱
   * @example "DL throughput per cell"
   */
  name: string;
  /**
   * 參數類型 (Report / Control)
   * @example "Report"
   */
  type: string;
  /**
   * 單位 (dBm, Mbps...)
   * @example "Mbps"
   */
  unit?: string | null;
  /**
   * 回報間隔秒數
   * @example 5
   */
  interval?: number | null;
  /**
   * API 來源 (OSS-uelist / Netopeer-stream 等)
   * @example "OSS-uelist"
   */
  api_source?: string | null;
  /**
   * operator 欄位
   * @example "="
   */
  operator?: string | null;
  /**
   * 描述
   * @example "每個小區的下行吞吐量"
   */
  description?: string | null;
  /**
   * 對應 AbstractMetrics 的 id
   * @example 1
   */
  abstract_metrics_id: number;
}

export interface BrandMetricsRequest {
  /**
   * 對應 AbstractMetrics 的 id
   * @example 1
   */
  abstract_metrics_id?: number;
  /**
   * 參數名稱
   * @example "DL throughput per cell"
   */
  name: string;
  /**
   * 參數類型 (Report / Control)
   * @example "Report"
   */
  type: string;
  /**
   * 單位 (dBm, Mbps...)
   * @example "Mbps"
   */
  unit?: string | null;
  /**
   * 回報間隔秒數
   * @example 5
   */
  interval?: number | null;
  /**
   * API 來源 (OSS-uelist / Netopeer-stream 等)
   * @example "OSS-uelist"
   */
  api_source?: string | null;
  /**
   * operator 欄位
   * @example "="
   */
  operator?: string | null;
  /**
   * 描述
   * @example "每個小區的下行吞吐量"
   */
  description?: string | null;
}

export interface Brand {
  /** @example 1 */
  brand_id?: number;
  /** @example "Pegatron" */
  brand_name?: string;
  /** @example 20 */
  bandwidth?: number;
  /** @example 10 */
  tx_power?: number;
  brand_metrics?: BrandMetrics[];
}

export interface BrandRequest {
  /** @example "Pegatron" */
  brand_name: string;
  /** @example 20 */
  bandwidth: number;
  /** @example 10 */
  tx_power: number;
  brand_metrics?: BrandMetricsRequest[];
}

export interface BrandRequestPut {
  /** @example 20 */
  bandwidth: number;
  /** @example 10 */
  tx_power: number;
  brand_metrics?: BrandMetricsRequest[];
}

export interface CU {
  /** @example 1 */
  CU_id?: number;
  /** @example 1 */
  project_id?: number;
  /** @example "p1_cu1" */
  name?: string;
  /** @example 1 */
  brand_id?: number;
}

export interface CURequest {
  /** @example 1 */
  project_id: number;
  /** @example "p1_cu1" */
  name: string;
  /** @example 1 */
  brand_id: number;
}

export interface DU {
  /** @example 1 */
  DU_id?: number;
  /** @example 1 */
  CU_id?: number | null;
  /** @example 1 */
  project_id?: number;
  /** @example "p1_du1" */
  name?: string;
  /** @example 1 */
  brand_id?: number;
}

export interface DURequest {
  /** @example 1 */
  CU_id?: number | null;
  /** @example 1 */
  project_id: number;
  /** @example "p1_du1" */
  name: string;
  /** @example 1 */
  brand_id: number;
}

export interface RU {
  /** @example 1 */
  RU_id?: number;
  /** @example 1 */
  DU_id?: number | null;
  /** @example 1 */
  project_id?: number;
  /** @example 1.2 */
  lat?: number | null;
  /** @example 1.2 */
  lon?: number | null;
  /** @example 1.2 */
  z?: number | null;
  /** @example "p1_ru1" */
  name?: string;
  /** @example 1 */
  brand_id?: number;
  /** @example 20 */
  bandwidth?: number;
  /** @example 10 */
  tx_power?: number;
  /** @example 60 */
  opening_angle?: number;
  /** @example 0 */
  roll?: number;
  /** @example 0 */
  tilt?: number;
}

export interface RURequest {
  /** @example "p1_ru1" */
  name: string;
  /** @example 1 */
  DU_id?: number | null;
  /** @example 1 */
  project_id: number;
  /** @example 1 */
  brand_id: number;
  /** @example 1.2 */
  lat?: number | null;
  /** @example 1.2 */
  lon?: number | null;
  /** @example 1.2 */
  z?: number | null;
  /** @example 20 */
  bandwidth: number;
  /** @example 10 */
  tx_power: number;
  /** @example 60 */
  opening_angle?: number;
  /** @example 0 */
  roll?: number;
  /** @example 0 */
  tilt?: number;
}

/** @example {"lat":1.2,"lon":1.2,"z":1.2} */
export interface RULocationRequest {
  /** @example 1.2 */
  lat: number;
  /** @example 1.2 */
  lon: number;
  /** @example 1.2 */
  z: number;
}

export interface ProjectSetDeploy {
  CUs?: CU[];
  DUs?: DU[];
  RUs?: RU[];
}

export interface RUCache {
  /** @example 1 */
  RU_id?: number;
  /** @example "p1_ru1_cache" */
  name?: string;
  /** @example 1 */
  eval_id?: number;
  /** @example 1 */
  project_id?: number;
  /** @example 1 */
  brand_id?: number;
  /** @example 1.2 */
  lat?: number | null;
  /** @example 1.2 */
  lon?: number | null;
  /** @example 1.2 */
  z?: number | null;
  /** @example 20 */
  bandwidth?: number;
  /** @example 10 */
  tx_power?: number;
  /** @example 60 */
  opening_angle?: number;
  /** @example 0 */
  roll?: number;
  /** @example 0 */
  tilt?: number;
}

export interface Map {
  /** @example 1 */
  map_id?: number;
  /** @example 1 */
  project_id?: number;
  /** @example "map_image" */
  MinIO_map_for_aodt?: string | null;
  /** @example "map_position" */
  MinIO_map_for_frontend?: string;
}

export interface MapRequest {
  /** @example 1 */
  project_id: number;
  /** @example "map_image" */
  MinIO_map_for_aodt?: string | null;
  /** @example "map_position" */
  MinIO_map_for_frontend?: string;
}

export interface Evaluation {
  /** @example 1 */
  eval_id?: number;
  /** @example 1 */
  project_id?: number;
  /** @example "IDLE" */
  rsrp_status?: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS";
  /** @example "IDLE" */
  throughput_status?: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS";
  /** @example "IDLE" */
  rsrp_dt_status?: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS";
  /** @example "IDLE" */
  throughput_dt_status?: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS";
}

export interface EvaluationRequest {
  /** @example 1 */
  project_id: number;
}

export interface EvaluationStatusUpdateRequest {
  /** @example "SUCCESS" */
  status: "IDLE" | "WAITING" | "FAILURE" | "SUCCESS";
}

export interface EvaluationHeatmap {
  /** @example 1 */
  evaluation_id: number;
  heatmap: ProjectHeatmapData[];
  /** @example "rsrp" */
  sim_mode: "rsrp" | "rsrp_dt" | "throughput" | "throughput_dt";
}

export interface AIModel {
  /** @example 1 */
  AI_model_id?: number;
  /** @example "MyModel" */
  model_name?: string;
  /** @example 1 */
  project_id?: number;
  /** @example false */
  is_active?: boolean;
  /** @example false */
  is_training?: boolean;
  /** @example false */
  can_be_updated?: boolean;
}

export interface AIModelRequest {
  /** @example "MyModel" */
  model_name: string;
  /** @example 1 */
  project_id: number;
}

export interface PrimitiveAIModel {
  /** @example 1 */
  model_id?: number;
  /** @example "PrimitiveAIModel" */
  model_name?: string;
  ai_metrics?: AIMetrics[];
}

export interface PrimitiveAIModelRequest {
  /** @example "PrimitiveAIModel" */
  model_name: string;
  ai_metrics?: AIMetricsRequest[];
}

export interface PrimitiveDTAIModel {
  /** @example 1 */
  model_id?: number;
  /** @example "PrimitiveDTAIModel" */
  model_name?: string;
  /** @example "dt_model_1.h5" */
  MinIO_name_for_DT_AI_model?: string;
}

export interface AIMetrics {
  /** @example 1 */
  id?: number;
  /** @example 1 */
  model_id?: number;
  /** @example 1 */
  abstract_metrics_id?: number;
  /** @example "AI UE Count" */
  name?: string;
  /** @example "Report" */
  type?: string;
  /** @example "dBm" */
  unit?: string | null;
  /** @example 5 */
  interval?: number | null;
  /** @example "=" */
  operator?: string | null;
  /** @example "AI 預測 UE 數量" */
  description?: string | null;
  abstract_metrics?: AbstractMetrics;
}

export interface AIMetricsRequest {
  name: string;
  type: string;
  unit?: string | null;
  interval?: number | null;
  operator?: string | null;
  description?: string | null;
  /** @example 1 */
  abstract_metrics_id?: number;
}

export interface AbstractMetrics {
  /** @example 1 */
  id?: number;
  /** @example "cell_on_off" */
  key?: string;
  /** @example "Cell ON/OFF" */
  display_name?: string;
}

export interface AbstractMetricsShow {
  /** @example 1 */
  id?: number;
  /** @example "cell_on_off" */
  key?: string;
  /** @example "Cell ON/OFF" */
  display_name?: string;
  ai_metrics?: AIMetrics[];
  BrandMetrics?: BrandMetrics[];
}

export interface UserProject {
  /** @example 1 */
  user_id?: number;
  /** @example 1 */
  project_id?: number;
  /** @example "OWNER" */
  role?: string;
}

export interface UserProjectRole {
  /** @example 1 */
  project_id?: number;
  /** @example "OWNER" */
  role?: string;
}

export interface UserProjectRequest {
  /** @example "user" */
  role: string;
}

export interface AODTResponse {
  /** @example true */
  success?: boolean;
  /** @example "操作成功" */
  message?: string;
  /** 回傳的資料 */
  data?: object | null;
}

export interface AODTStatusResponse {
  /** @example true */
  success?: boolean;
  /** @example "AODT 服務運行正常" */
  message?: string;
  /** @example "connected" */
  status?: "connected" | "disconnected" | "error";
  /** @example "http://140.113.144.121:8011" */
  api_url?: string | null;
}

export interface AODTWorkflowResponse {
  /** @example true */
  success?: boolean;
  /** @example "AODT 工作流程啟動成功" */
  message?: string;
  /** @example ["資料庫連接成功","USD Stage 開啟成功","模擬配置完成"] */
  steps_completed?: string[];
}

export interface AODTConnectionRequest {
  /** @example "clickhouse" */
  db_host: string;
  /** @example 9000 */
  db_port: number;
  /** @example 1 */
  project_id: number;
  /** @example 1 */
  evaluation_id: number;
}

export interface AODTRUCreateRequest {
  /** @example 1 */
  project_id: number;
  /**
   * 緯度
   * @example 0
   */
  lat: number;
  /**
   * 高度
   * @example 0
   */
  lon: number;
  /** @example 0 */
  z: number;
  /** @example 0 */
  ru_roll: number;
  /** @example 0 */
  ru_tilt?: number;
}

export interface AODTStageRequest {
  /** @example "NYCU_API_TEST_cli.usd" */
  file_name: string;
}

export interface AODTUECreateRequest {
  /**
   * UE X 座標
   * @example 0
   */
  ue_x: number;
  /**
   * UE Y 座標
   * @example 0
   */
  ue_y: number;
  /**
   * UE 半徑 (公分)
   * @example 100
   */
  ue_radius: number;
  /**
   * UE 數量
   * @example 10
   */
  ue_cnt: number;
}

export interface AODTDUCreateRequest {
  /** @example 1 */
  project_id: number;
  /** @example 1 */
  evaluation_id: number;
  /**
   * 緯度
   * @example 0
   */
  lat: number;
  /**
   * 經度
   * @example 0
   */
  lon: number;
  /**
   * DU Z 座標
   * @example 0
   */
  z: number;
}

export interface AODTSimulationProgressResponse {
  /**
   * 模擬進度百分比
   * @format float
   * @example 75
   */
  progress?: number;
  /**
   * 模擬是否正在運行
   * @example true
   */
  is_running?: boolean;
}

export interface TaskUnfinish {
  /** @example "PENDING" */
  status?: string;
}

export interface TaskInserted {
  /** @example true */
  success?: boolean;
  /** @example "已經將計算任務放入對列中" */
  message?: string;
  /** @example "08a2b9fd-af95-40d3-b836-5da67fdd6544" */
  task_id?: string;
}

export interface AODTSimulationSlotConfig {
  /**
   * 是否完整模擬
   * @example true
   */
  is_full: boolean;
  /**
   * 模擬模式 (1 = Slot 模式)
   * @example 1
   */
  mode: 1;
  /**
   * 每批次的 slot 數量
   * @min 1
   * @example 10
   */
  slots_per_batch: number;
  /**
   * 每個 slot 的採樣數
   * @min 1
   * @example 14
   */
  samples_per_slot: number;
}

export interface AODTSimulationDurationConfig {
  /**
   * 是否完整模擬
   * @example false
   */
  is_full: boolean;
  /**
   * 模擬模式 (0 = Duration 模式)
   * @example 0
   */
  mode: 0;
  /**
   * 模擬持續時間（秒）
   * @min 0
   * @example 60
   */
  duration: number;
  /**
   * 採樣間隔（秒）
   * @min 0
   * @example 1
   */
  interval: number;
}

export interface AODTWorkflowRequest {
  /** @example "clickhouse" */
  db_host?: string;
  /** @example 9000 */
  db_port?: number;
  /** @example 1 */
  project_id?: number;
  /** @example 1 */
  evaluation_id?: number;
  dus?: {
    /**
     * 緯度
     * @example 0
     */
    lat?: number;
    /**
     * 經度
     * @example 0
     */
    lon?: number;
    /**
     * DU Z 座標
     * @example 0
     */
    z?: number;
  }[];
  rus?: {
    /**
     * 緯度
     * @example 0
     */
    lat?: number;
    /**
     * 經度
     * @example 0
     */
    lon?: number;
    /**
     * DU Z 座標
     * @example 0
     */
    z?: number;
    /** @example 0 */
    ru_roll?: number;
  }[];
  ues?: AODTUECreateRequest;
  rsrp_config?: AODTSimulationConfigRequest;
  throughput_config?: AODTSimulationSlotConfig;
}

export interface RUPropertiesUpdateRequest {
  /**
   * RU 的完整路徑
   * @example "/RUs/ru_0001"
   */
  ru_path: string;
  /**
   * RU 高度（公尺）
   * @format float
   * @min 0.5
   * @max 100
   * @example 30
   */
  height?: number;
  /**
   * 機械方位角（度）
   * @format float
   * @min 0
   * @max 360
   * @example 45
   */
  mech_azimuth?: number;
  /**
   * 機械傾斜角（度）
   * @format float
   * @min 0
   * @max 360
   * @example 15
   */
  mech_tilt?: number;
}

export interface RUPropertiesUpdateResponse {
  /** @example true */
  success?: boolean;
  /** @example "成功更新 RU 屬性: /RUs/ru_0001" */
  message?: string;
  updated_properties?: {
    /** @example "/RUs/ru_0001" */
    ru_path?: string;
    /**
     * @format float
     * @example 30
     */
    height?: number | null;
    /**
     * @format float
     * @example 45
     */
    mech_azimuth?: number | null;
    /**
     * @format float
     * @example -5
     */
    mech_tilt?: number | null;
  };
  /** @example "已更新: height=30.0m, azimuth=45.0°, tilt=15.0°" */
  summary?: string;
}

export interface RUPropertiesResponse {
  /** @example true */
  success?: boolean;
  /** @example "/RUs/ru_0001" */
  ru_path?: string;
  /** @example "成功獲取 RU 屬性: /RUs/ru_0001" */
  message?: string;
  properties?: {
    /**
     * RU 高度（公尺）
     * @format float
     * @example 30
     */
    height?: number | null;
    /**
     * 機械方位角（度）
     * @format float
     * @example 45
     */
    mech_azimuth?: number | null;
    /**
     * 機械傾斜角（度）
     * @format float
     * @example 15
     */
    mech_tilt?: number | null;
    /**
     * Cell ID
     * @example "cell_001"
     */
    cell_id?: string | null;
    /**
     * DU ID
     * @example "du_001"
     */
    du_id?: string | null;
  };
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://127.0.0.1:8000",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
          method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Flask SQLAlchemy RESTful API
 * @version 1.0.0
 * @baseUrl http://127.0.0.1:8000
 *
 * 產生的 OpenAPI 文件，對應 Flask + SQLAlchemy 所有 RESTful API。
 *
 * - 所有 API 回傳 JSON。
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  geocode = {
    /**
     * No description
     *
     * @tags Geocode
     * @name SearchGeocode
     * @summary Geocode search (Taiwan)
     * @request GET:/geocode/search
     */
    searchGeocode: (
      query: {
        /**
         * Address or keywords to search.
         * @minLength 1
         */
        q: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        GeocodeResults,
        ErrorResponse | NotFoundResponse | UpstreamErrorResponse
      >({
        path: `/geocode/search`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  auth = {
    /**
     * No description
     *
     * @tags Auth
     * @name RegisterCreate
     * @summary 註冊新使用者
     * @request POST:/auth/register
     */
    registerCreate: (data: RegisterRequest, params: RequestParams = {}) =>
      this.request<User, Error>({
        path: `/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name LoginCreate
     * @summary 使用者登入
     * @request POST:/auth/login
     */
    loginCreate: (data: LoginRequest, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name LogoutCreate
     * @summary 使用者登出
     * @request POST:/auth/logout
     * @secure
     */
    logoutCreate: (params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/auth/logout`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  project = {
    /**
     * No description
     *
     * @tags Project
     * @name ProjectsList
     * @summary 取得所有 Project
     * @request GET:/projects
     */
    projectsList: (params: RequestParams = {}) =>
      this.request<Project[], any>({
        path: `/projects`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name ProjectsCreate
     * @summary 新增 Project
     * @request POST:/projects
     */
    projectsCreate: (data: ProjectPostRequest, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/projects`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name GetProject
     * @summary 取得當前使用者的所有 Project
     * @request GET:/projects/me
     * @secure
     */
    getProject: (params: RequestParams = {}) =>
      this.request<Project[], Error>({
        path: `/projects/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name ProjectsDetail
     * @summary 取得單一 Project
     * @request GET:/projects/{project_id}
     */
    projectsDetail: (projectId: number, params: RequestParams = {}) =>
      this.request<Project, Error>({
        path: `/projects/${projectId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name ProjectsUpdate
     * @summary 更新 Project
     * @request PUT:/projects/{project_id}
     */
    projectsUpdate: (
      projectId: number,
      data: ProjectPutRequest,
      params: RequestParams = {},
    ) =>
      this.request<Project, Error>({
        path: `/projects/${projectId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name ProjectsDelete
     * @summary 刪除 Project
     * @request DELETE:/projects/{project_id}
     */
    projectsDelete: (projectId: number, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/projects/${projectId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name GetProjectUsers
     * @summary 取得專案的所有使用者
     * @request GET:/projects/{project_id}/users
     */
    getProjectUsers: (projectId: number, params: RequestParams = {}) =>
      this.request<User[], Error>({
        path: `/projects/${projectId}/users`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name GetProjectCUs
     * @summary 取得專案的所有 CU
     * @request GET:/projects/{project_id}/cus
     */
    getProjectCUs: (projectId: number, params: RequestParams = {}) =>
      this.request<CU[], any>({
        path: `/projects/${projectId}/cus`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name GetProjectDUs
     * @summary 取得專案的所有 DU
     * @request GET:/projects/{project_id}/dus
     */
    getProjectDUs: (projectId: number, params: RequestParams = {}) =>
      this.request<DU[], any>({
        path: `/projects/${projectId}/dus`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name GetProjectRUs
     * @summary 取得專案的所有 RU
     * @request GET:/projects/{project_id}/rus
     */
    getProjectRUs: (projectId: number, params: RequestParams = {}) =>
      this.request<RU[], any>({
        path: `/projects/${projectId}/rus`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name GetProjectEvaluations
     * @summary 取得專案的所有評估
     * @request GET:/projects/{project_id}/evaluations
     */
    getProjectEvaluations: (projectId: number, params: RequestParams = {}) =>
      this.request<Evaluation[], any>({
        path: `/projects/${projectId}/evaluations`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name AiModelsList
     * @summary 取得專案的所有 AI 模型
     * @request GET:/projects/{project_id}/ai_models
     */
    aiModelsList: (projectId: number, params: RequestParams = {}) =>
      this.request<AIModel[], any>({
        path: `/projects/${projectId}/ai_models`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 獲取專案的 RSRP 數據（從 MinIO）
     *
     * @tags Project
     * @name RsrpList
     * @summary 取得專案的 RSRP 數據
     * @request GET:/projects/{project_id}/rsrp
     */
    rsrpList: (projectId: number, params: RequestParams = {}) =>
      this.request<
        Message[],
        | {
          /** @example "RSRP not ready" */
          message?: string;
        }
        | {
          /** @example "Project not found" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/rsrp`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 將 RSRP 數據上傳到 MinIO 並更新專案狀態
     *
     * @tags Project
     * @name RsrpCreate
     * @summary 上傳或更新專案的 RSRP 數據
     * @request POST:/projects/{project_id}/rsrp
     */
    rsrpCreate: (
      projectId: number,
      data: ProjectRSRPRequest[],
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "RSRP data uploaded successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid data" */
          message?: string;
        }
        | {
          /** @example "Bucket 'rsrp' does not exist." */
          message?: string;
        }
        | {
          /** @example "Failed to upload rsrp data" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/rsrp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 獲取專案的 Throughput 數據（從 MinIO）
     *
     * @tags Project
     * @name ThroughputList
     * @summary 取得專案的 Throughput 數據
     * @request GET:/projects/{project_id}/throughput
     */
    throughputList: (projectId: number, params: RequestParams = {}) =>
      this.request<
        Message[],
        | {
          /** @example "Throughput not ready" */
          message?: string;
        }
        | {
          /** @example "Throughput data not found" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/throughput`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 將 Throughput 數據上傳到 MinIO 並更新專案狀態
     *
     * @tags Project
     * @name ThroughputCreate
     * @summary 上傳或更新專案的 Throughput 數據
     * @request POST:/projects/{project_id}/throughput
     */
    throughputCreate: (
      projectId: number,
      data: ProjectThroughputRequest[],
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "Throughput data uploaded successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid data" */
          message?: string;
        }
        | {
          /** @example "Bucket 'throughput' does not exist." */
          message?: string;
        }
        | {
          /** @example "Failed to upload throughput data" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/throughput`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 獲取專案的 Digital Twin RSRP RSRP 數據（從 MinIO）
     *
     * @tags Project
     * @name RsrpDtList
     * @summary 取得專案的 rsrp_dt 數據
     * @request GET:/projects/{project_id}/rsrp_dt
     */
    rsrpDtList: (projectId: number, params: RequestParams = {}) =>
      this.request<
        Message[],
        | {
          /** @example "rsrp_dt not ready" */
          message?: string;
        }
        | {
          /** @example "rsrp_dt data not found" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/rsrp_dt`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 將 Digital Twin RSRP 數據上傳到 MinIO 並更新專案狀態
     *
     * @tags Project
     * @name RsrpDtCreate
     * @summary 上傳或更新專案的 rsrp_dt 數據
     * @request POST:/projects/{project_id}/rsrp_dt
     */
    rsrpDtCreate: (
      projectId: number,
      data: ProjectRSRPDTRequest[],
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "rsrp_dt data uploaded successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid data" */
          message?: string;
        }
        | {
          /** @example "Bucket 'rsrp_dt' does not exist." */
          message?: string;
        }
        | {
          /** @example "Failed to upload rsrp_dt data" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/rsrp_dt`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 獲取專案的 Digital Twin Throughput 數據（從 MinIO）
     *
     * @tags Project
     * @name ThroughputDtList
     * @summary 取得專案的 ThroughputDT 數據
     * @request GET:/projects/{project_id}/throughput_dt
     */
    throughputDtList: (projectId: number, params: RequestParams = {}) =>
      this.request<
        Message[],
        | {
          /** @example "ThroughputDT not ready" */
          message?: string;
        }
        | {
          /** @example "ThroughputDT data not found" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/throughput_dt`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 將 Digital Twin Throughput 數據上傳到 MinIO 並更新專案狀態
     *
     * @tags Project
     * @name ThroughputDtCreate
     * @summary 上傳或更新專案的 ThroughputDT 數據
     * @request POST:/projects/{project_id}/throughput_dt
     */
    throughputDtCreate: (
      projectId: number,
      data: ProjectThroughputDTRequest[],
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "ThroughputDT data uploaded successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid data" */
          message?: string;
        }
        | {
          /** @example "Bucket 'throughput_dt' does not exist." */
          message?: string;
        }
        | {
          /** @example "Failed to upload throughput_dt data" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/throughput_dt`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 獲取專案的 rsrp、throughput、rsrp_dt、throughput_dt 狀態
     *
     * @tags Project
     * @name StatusList
     * @summary 取得專案的所有狀態
     * @request GET:/projects/{project_id}/status
     */
    statusList: (projectId: number, params: RequestParams = {}) =>
      this.request<
        ProjectStatus,
        {
          /** @example "Project not found" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/status`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 更新專案的 RSRP 處理狀態
     *
     * @tags Project
     * @name StatusRsrpUpdate
     * @summary 更新專案的 RSRP 狀態
     * @request PUT:/projects/{project_id}/status/rsrp
     */
    statusRsrpUpdate: (
      projectId: number,
      data: ProjectStatusUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "RSRP status updated successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid status" */
          message?: string;
        }
        | {
          /** @example "Project not found" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/status/rsrp`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 更新專案的 Throughput 處理狀態
     *
     * @tags Project
     * @name StatusThroughputUpdate
     * @summary 更新專案的 Throughput 狀態
     * @request PUT:/projects/{project_id}/status/throughput
     */
    statusThroughputUpdate: (
      projectId: number,
      data: ProjectStatusUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "Throughput status updated successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid status" */
          message?: string;
        }
        | {
          /** @example "Project not found" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/status/throughput`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 更新專案的 Digital Twin RSRP 處理狀態
     *
     * @tags Project
     * @name StatusRsrpDtUpdate
     * @summary 更新專案的 rsrp_dt 狀態
     * @request PUT:/projects/{project_id}/status/rsrp_dt
     */
    statusRsrpDtUpdate: (
      projectId: number,
      data: ProjectStatusUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "rsrp_dt status updated successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid status" */
          message?: string;
        }
        | {
          /** @example "Project not found" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/status/rsrp_dt`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 更新專案的 Digital Twin Throughput 處理狀態
     *
     * @tags Project
     * @name StatusThroughputDtUpdate
     * @summary 更新專案的 ThroughputDT 狀態
     * @request PUT:/projects/{project_id}/status/throughput_dt
     */
    statusThroughputDtUpdate: (
      projectId: number,
      data: ProjectStatusUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "ThroughputDT status updated successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid status" */
          message?: string;
        }
        | {
          /** @example "Project not found" */
          message?: string;
        }
      >({
        path: `/projects/${projectId}/status/throughput_dt`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name MapsFrontendList
     * @summary 取得專案的 Frontend Map（MinIO 內容）
     * @request GET:/projects/{project_id}/maps_frontend
     */
    mapsFrontendList: (projectId: number, params: RequestParams = {}) =>
      this.request<object, Error>({
        path: `/projects/${projectId}/maps_frontend`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name MapsAodtList
     * @summary 取得專案的 AODT Map（USD 格式，MinIO 內容）
     * @request GET:/projects/{project_id}/maps_aodt
     */
    mapsAodtList: (projectId: number, params: RequestParams = {}) =>
      this.request<object, Error>({
        path: `/projects/${projectId}/maps_aodt`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name MapsCreate
     * @summary 新增或更新專案 Map
     * @request POST:/projects/{project_id}/maps
     */
    mapsCreate: (
      projectId: number,
      data: {
        /** AODT 地圖內容（JSON） */
        map_aodt?: object;
        /** Frontend 地圖內容（JSON） */
        map_frontend?: object;
      },
      params: RequestParams = {},
    ) =>
      this.request<Map, Error>({
        path: `/projects/${projectId}/maps`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name DeployEvaluation
     * @summary 將選定的evaluation部署，加入CU、DU、RU
     * @request POST:/projects/{project_id}/deploy/{evaluation_id}
     */
    deployEvaluation: (
      projectId: number,
      evaluationId: number,
      params: RequestParams = {},
    ) =>
      this.request<ProjectSetDeploy, Error>({
        path: `/projects/${projectId}/deploy/${evaluationId}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project
     * @name MapCorrectionUpdate
     * @summary 校正原始 gltf 地圖位置及大小
     * @request PUT:/projects/{project_id}/map_correction
     */
    mapCorrectionUpdate: (
      projectId: number,
      data: MapCorrectionRequest,
      params: RequestParams = {},
    ) =>
      this.request<Message, Error>({
        path: `/projects/${projectId}/map_correction`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * No description
     *
     * @tags User
     * @name GetUser
     * @summary 取得當前登入的 User
     * @request GET:/users/me
     * @secure
     */
    getUser: (params: RequestParams = {}) =>
      this.request<User, Error>({
        path: `/users/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UsersList
     * @summary 取得所有 User
     * @request GET:/users
     */
    usersList: (params: RequestParams = {}) =>
      this.request<User[], any>({
        path: `/users`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UsersDetail
     * @summary 取得單一 User
     * @request GET:/users/{user_id}
     */
    usersDetail: (userId: number, params: RequestParams = {}) =>
      this.request<User, Error>({
        path: `/users/${userId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UsersUpdate
     * @summary 更新 User
     * @request PUT:/users/{user_id}
     */
    usersUpdate: (
      userId: number,
      data: UserPutBody,
      params: RequestParams = {},
    ) =>
      this.request<User, Error>({
        path: `/users/${userId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UsersDelete
     * @summary 刪除 User
     * @request DELETE:/users/{user_id}
     */
    usersDelete: (userId: number, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/users/${userId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  projectUser = {
    /**
     * No description
     *
     * @tags Project_User
     * @name UserProjectsCreate
     * @summary 新增 User 到 Project
     * @request POST:/user_projects/{user_id}/{project_id}
     */
    userProjectsCreate: (
      userId: number,
      projectId: number,
      data: UserProjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<UserProject, Error>({
        path: `/user_projects/${userId}/${projectId}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project_User
     * @name UserProjectsUpdate
     * @summary 更新 User 在 Project 中的角色
     * @request PUT:/user_projects/{user_id}/{project_id}
     */
    userProjectsUpdate: (
      userId: number,
      projectId: number,
      data: UserProjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<UserProject, Error>({
        path: `/user_projects/${userId}/${projectId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Project_User
     * @name GetUserProjectRole
     * @summary 取得我在指定 Project 中的角色
     * @request GET:/user_projects/{project_id}/role
     */
    getUserProjectRole: (projectId: number, params: RequestParams = {}) =>
      this.request<UserProjectRole[], Error>({
        path: `/user_projects/${projectId}/role`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  chat = {
    /**
     * No description
     *
     * @tags Chat
     * @name ChatSessionsList
     * @summary 取得當前 project 的所有 chat_sessions
     * @request GET:/projects/{project_id}/chat_sessions
     */
    chatSessionsList: (projectId: number, params: RequestParams = {}) =>
      this.request<object, Error>({
        path: `/projects/${projectId}/chat_sessions`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatSessionsCreate
     * @summary 建立新的 chat_sessions
     * @request POST:/projects/{project_id}/chat_sessions
     */
    chatSessionsCreate: (
      projectId: number,
      data: ChatSessionTitle,
      params: RequestParams = {},
    ) =>
      this.request<object, Error>({
        path: `/projects/${projectId}/chat_sessions`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatSessionsUpdate
     * @summary 編輯 chat_session 的標題
     * @request PUT:/chat_sessions/{chat_session_id}
     */
    chatSessionsUpdate: (
      chatSessionId: number,
      data: ChatSessionTitle,
      params: RequestParams = {},
    ) =>
      this.request<object, Error>({
        path: `/chat_sessions/${chatSessionId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatSessionsDelete
     * @summary 刪除一個 chat_session
     * @request DELETE:/chat_sessions/{chat_session_id}
     */
    chatSessionsDelete: (chatSessionId: number, params: RequestParams = {}) =>
      this.request<object, Error>({
        path: `/chat_sessions/${chatSessionId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name MessagesList
     * @summary 取得一個 chat_session 的 所有 chat_messages
     * @request GET:/chat_sessions/{chat_session_id}/messages
     */
    messagesList: (chatSessionId: number, params: RequestParams = {}) =>
      this.request<object, Error>({
        path: `/chat_sessions/${chatSessionId}/messages`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name MessagesCreate
     * @summary 新增一條 chat_message 到 chat_session
     * @request POST:/chat_sessions/{chat_session_id}/messages
     */
    messagesCreate: (
      chatSessionId: number,
      data: ChatMessage,
      params: RequestParams = {},
    ) =>
      this.request<object, Error>({
        path: `/chat_sessions/${chatSessionId}/messages`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  evaluation = {
    /**
     * No description
     *
     * @tags Evaluation
     * @name EvaluationsList
     * @summary 取得所有 Evaluation
     * @request GET:/evaluations
     */
    evaluationsList: (params: RequestParams = {}) =>
      this.request<Evaluation[], any>({
        path: `/evaluations`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name EvaluationsCreate
     * @summary 新增 Evaluation
     * @request POST:/evaluations
     */
    evaluationsCreate: (data: EvaluationRequest, params: RequestParams = {}) =>
      this.request<Evaluation, any>({
        path: `/evaluations`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name EvaluationsDetail
     * @summary 取得單一 Evaluation
     * @request GET:/evaluations/{evaluation_id}
     */
    evaluationsDetail: (evaluationId: number, params: RequestParams = {}) =>
      this.request<Evaluation, Error>({
        path: `/evaluations/${evaluationId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name EvaluationsUpdate
     * @summary 更新 Evaluation
     * @request PUT:/evaluations/{evaluation_id}
     */
    evaluationsUpdate: (
      evaluationId: number,
      data: EvaluationRequest,
      params: RequestParams = {},
    ) =>
      this.request<Evaluation, Error>({
        path: `/evaluations/${evaluationId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name EvaluationsDelete
     * @summary 刪除 Evaluation
     * @request DELETE:/evaluations/{evaluation_id}
     */
    evaluationsDelete: (evaluationId: number, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/evaluations/${evaluationId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name RsrpCreate
     * @summary 上傳或更新評估的 RSRP 資料
     * @request POST:/evaluations/rsrp
     */
    rsrpCreate: (data: EvaluationHeatmap, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "RSRP data uploaded successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid data" */
          message?: string;
        }
        | {
          /** @example "Bucket 'rsrp' does not exist." */
          message?: string;
        }
        | {
          /** @example "Failed to upload rsrp data" */
          message?: string;
        }
      >({
        path: `/evaluations/rsrp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name RsrpFailedCreate
     * @summary 重置評估的 RSRP 資料狀態為失敗
     * @request POST:/evaluations/rsrp/failed
     */
    rsrpFailedCreate: (
      data: {
        /** @example 1 */
        evaluation_id?: number;
        /** @example "計算錯誤，請重新計算" */
        message?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "RSRP status reset to FAILURE" */
          message?: string;
        },
        | {
          /** @example "Cannot reset status for temporary evaluation" */
          message?: string;
        }
        | {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/rsrp/failed`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name RsrpList
     * @summary 取得評估的 RSRP 資料
     * @request GET:/evaluations/{evaluation_id}/rsrp
     */
    rsrpList: (evaluationId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** RSRP 資料 */
          rsrp?: object;
        },
        Error
      >({
        path: `/evaluations/${evaluationId}/rsrp`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name ThroughputCreate
     * @summary 上傳或更新評估的 Throughput 資料
     * @request POST:/evaluations/throughput
     */
    throughputCreate: (data: EvaluationHeatmap, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "Throughput data uploaded successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid data" */
          message?: string;
        }
        | {
          /** @example "Bucket 'throughput' does not exist." */
          message?: string;
        }
        | {
          /** @example "Failed to upload throughput data" */
          message?: string;
        }
      >({
        path: `/evaluations/throughput`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name ThroughputFailedCreate
     * @summary 重置評估的 Throughput 資料狀態為失敗
     * @request POST:/evaluations/throughput/failed
     */
    throughputFailedCreate: (
      data: {
        evaluation_id?: number;
        /** @example "計算錯誤，請重新計算" */
        message?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "Throughput status reset to FAILURE" */
          message?: string;
        },
        | {
          /** @example "Cannot reset status for temporary evaluation" */
          message?: string;
        }
        | {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/throughput/failed`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name ThroughputList
     * @summary 取得評估的 Throughput 資料
     * @request GET:/evaluations/{evaluation_id}/throughput
     */
    throughputList: (evaluationId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** Throughput 資料 */
          throughput?: object;
        },
        Error
      >({
        path: `/evaluations/${evaluationId}/throughput`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name RsrpDtCreate
     * @summary 上傳或更新評估的 rsrp_dt 資料
     * @request POST:/evaluations/rsrp_dt
     */
    rsrpDtCreate: (data: EvaluationHeatmap, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "rsrp_dt data uploaded successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid data" */
          message?: string;
        }
        | {
          /** @example "Bucket 'rsrp_dt' does not exist." */
          message?: string;
        }
        | {
          /** @example "Failed to upload rsrp_dt data" */
          message?: string;
        }
      >({
        path: `/evaluations/rsrp_dt`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name RsrpDtFailedCreate
     * @summary 重置評估的 rsrp_dt 資料狀態為失敗
     * @request POST:/evaluations/rsrp_dt/failed
     */
    rsrpDtFailedCreate: (
      data: {
        evaluation_id?: number;
        /** @example "計算錯誤，請重新計算" */
        message?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "rsrp_dt status reset to FAILURE" */
          message?: string;
        },
        | {
          /** @example "Cannot reset status for temporary evaluation" */
          message?: string;
        }
        | {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/rsrp_dt/failed`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name RsrpDtList
     * @summary 取得評估的 rsrp_dt 資料
     * @request GET:/evaluations/{evaluation_id}/rsrp_dt
     */
    rsrpDtList: (evaluationId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** rsrp_dt 資料 */
          rsrp_dt?: object;
        },
        Error
      >({
        path: `/evaluations/${evaluationId}/rsrp_dt`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name ThroughputDtCreate
     * @summary 上傳或更新評估的 ThroughputDT 資料
     * @request POST:/evaluations/throughput_dt
     */
    throughputDtCreate: (data: EvaluationHeatmap, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "ThroughputDT data uploaded successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid data" */
          message?: string;
        }
        | {
          /** @example "Bucket 'throughput_dt' does not exist." */
          message?: string;
        }
        | {
          /** @example "Failed to upload throughput_dt data" */
          message?: string;
        }
      >({
        path: `/evaluations/throughput_dt`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name ThroughputDtFailedCreate
     * @summary 重置評估的 ThroughputDT 資料狀態為失敗
     * @request POST:/evaluations/throughput_dt/failed
     */
    throughputDtFailedCreate: (
      data: {
        evaluation_id?: number;
        /** @example "計算錯誤，請重新計算" */
        message?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "ThroughputDT status reset to FAILURE" */
          message?: string;
        },
        | {
          /** @example "Cannot reset status for temporary evaluation" */
          message?: string;
        }
        | {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/throughput_dt/failed`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name ThroughputDtList
     * @summary 取得評估的 ThroughputDT 資料
     * @request GET:/evaluations/{evaluation_id}/throughput_dt
     */
    throughputDtList: (evaluationId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** ThroughputDT 資料 */
          throughput_dt?: object;
        },
        Error
      >({
        path: `/evaluations/${evaluationId}/throughput_dt`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name StatusRsrpUpdate
     * @summary 修改evaluation的rsrp狀態
     * @request PUT:/evaluations/{evaluation_id}/status/rsrp
     */
    statusRsrpUpdate: (
      evaluationId: number,
      data: EvaluationStatusUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "rsrp status updated successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid status" */
          message?: string;
        }
        | {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/${evaluationId}/status/rsrp`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name StatusThroughputUpdate
     * @summary 修改evaluation的throughput狀態
     * @request PUT:/evaluations/{evaluation_id}/status/throughput
     */
    statusThroughputUpdate: (
      evaluationId: number,
      data: EvaluationStatusUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "Throughput status updated successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid status" */
          message?: string;
        }
        | {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/${evaluationId}/status/throughput`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name StatusRsrpDtUpdate
     * @summary 修改evaluation的heatmapDT狀態
     * @request PUT:/evaluations/{evaluation_id}/status/rsrp_dt
     */
    statusRsrpDtUpdate: (
      evaluationId: number,
      data: EvaluationStatusUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "rsrp_dt status updated successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid status" */
          message?: string;
        }
        | {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/${evaluationId}/status/rsrp_dt`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name StatusThroughputDtUpdate
     * @summary 修改evaluation的throughputDT狀態
     * @request PUT:/evaluations/{evaluation_id}/status/throughputDT
     */
    statusThroughputDtUpdate: (
      evaluationId: number,
      data: EvaluationStatusUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "ThroughputDT status updated successfully" */
          message?: string;
        },
        | {
          /** @example "Invalid status" */
          message?: string;
        }
        | {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/${evaluationId}/status/throughputDT`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name DiscardCreate
     * @summary 丟棄指定的 Evaluation（將所有狀態設為 DISCARDED）
     * @request POST:/evaluations/{evaluation_id}/discard
     */
    discardCreate: (evaluationId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "Evaluation discarded successfully" */
          message?: string;
        },
        {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/${evaluationId}/discard`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Evaluation
     * @name ResetStatusCreate
     * @summary reset the status of 4 heatmaps to WAITING
     * @request POST:/evaluations/reset-status
     */
    resetStatusCreate: (
      data: {
        /**
         * Evaluation ID
         * @example 1
         */
        evaluation_id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "Status reset successfully" */
          message?: string;
        },
        {
          /** @example "Evaluation not found" */
          message?: string;
        }
      >({
        path: `/evaluations/reset-status`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  ruCache = {
    /**
     * No description
     *
     * @tags RUCache
     * @name RucachesList
     * @summary 取得所有 RUCache
     * @request GET:/rucaches
     */
    rucachesList: (params: RequestParams = {}) =>
      this.request<RU[], any>({
        path: `/rucaches`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RUCache
     * @name RucachesCreate
     * @summary 新增 RUCache
     * @request POST:/rucaches
     */
    rucachesCreate: (data: RURequest, params: RequestParams = {}) =>
      this.request<RU, any>({
        path: `/rucaches`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RUCache
     * @name RucachesDetail
     * @summary 取得單一 RUCache
     * @request GET:/rucaches/{RU_id}
     */
    rucachesDetail: (ruId: number, params: RequestParams = {}) =>
      this.request<RU, Error>({
        path: `/rucaches/${ruId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RUCache
     * @name RucachesUpdate
     * @summary 更新 RUCache
     * @request PUT:/rucaches/{RU_id}
     */
    rucachesUpdate: (
      ruId: number,
      data: RURequest,
      params: RequestParams = {},
    ) =>
      this.request<RU, Error>({
        path: `/rucaches/${ruId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RUCache
     * @name RucachesDelete
     * @summary 刪除 RUCache
     * @request DELETE:/rucaches/{RU_id}
     */
    rucachesDelete: (ruId: number, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/rucaches/${ruId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RUCache
     * @name IntRuIdLocationUpdate
     * @summary 更新 RUCache 的位置
     * @request PUT:/ru_cache/<int:RU_id>/location
     */
    intRuIdLocationUpdate: (
      ruId: number,
      data: RULocationRequest,
      params: RequestParams = {},
    ) =>
      this.request<RU, Error>({
        path: `/ru_cache/<int${ruId}>/location`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  cu = {
    /**
     * No description
     *
     * @tags CU
     * @name GetCUs
     * @summary 取得所有 CU
     * @request GET:/cus
     */
    getCUs: (params: RequestParams = {}) =>
      this.request<CU[], any>({
        path: `/cus`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags CU
     * @name PostCu
     * @summary 新增 CU
     * @request POST:/cus
     */
    postCu: (data: CURequest, params: RequestParams = {}) =>
      this.request<CU, any>({
        path: `/cus`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags CU
     * @name GetCu
     * @summary 取得單一 CU
     * @request GET:/cus/{CU_id}
     */
    getCu: (cuId: number, params: RequestParams = {}) =>
      this.request<CU, Error>({
        path: `/cus/${cuId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags CU
     * @name PutCu
     * @summary 更新 CU
     * @request PUT:/cus/{CU_id}
     */
    putCu: (cuId: number, data: CURequest, params: RequestParams = {}) =>
      this.request<CU, Error>({
        path: `/cus/${cuId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags CU
     * @name DeleteCu
     * @summary 刪除 CU
     * @request DELETE:/cus/{CU_id}
     */
    deleteCu: (cuId: number, params: RequestParams = {}) =>
      this.request<Message, any>({
        path: `/cus/${cuId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  du = {
    /**
     * No description
     *
     * @tags DU
     * @name GetDUs
     * @summary 取得所有 DU
     * @request GET:/dus
     */
    getDUs: (params: RequestParams = {}) =>
      this.request<DU[], any>({
        path: `/dus`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DU
     * @name PostDu
     * @summary 新增 DU
     * @request POST:/dus
     */
    postDu: (data: DURequest, params: RequestParams = {}) =>
      this.request<DU, any>({
        path: `/dus`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DU
     * @name GetDu
     * @summary 取得單一 DU
     * @request GET:/dus/{DU_id}
     */
    getDu: (duId: number, params: RequestParams = {}) =>
      this.request<DU, Error>({
        path: `/dus/${duId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DU
     * @name PutDu
     * @summary 更新 DU
     * @request PUT:/dus/{DU_id}
     */
    putDu: (duId: number, data: DURequest, params: RequestParams = {}) =>
      this.request<DU, any>({
        path: `/dus/${duId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DU
     * @name DeleteDu
     * @summary 刪除 DU
     * @request DELETE:/dus/{DU_id}
     */
    deleteDu: (duId: number, params: RequestParams = {}) =>
      this.request<Message, any>({
        path: `/dus/${duId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  ru = {
    /**
     * No description
     *
     * @tags RU
     * @name GetRUs
     * @summary 取得所有 RU
     * @request GET:/rus
     */
    getRUs: (params: RequestParams = {}) =>
      this.request<RU[], any>({
        path: `/rus`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RU
     * @name PostRu
     * @summary 新增 RU
     * @request POST:/rus
     */
    postRu: (data: RURequest, params: RequestParams = {}) =>
      this.request<RU, any>({
        path: `/rus`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RU
     * @name GetRu
     * @summary 取得單一 RU
     * @request GET:/rus/{RU_id}
     */
    getRu: (ruId: number, params: RequestParams = {}) =>
      this.request<RU, Error>({
        path: `/rus/${ruId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RU
     * @name PutRu
     * @summary 更新 RU
     * @request PUT:/rus/{RU_id}
     */
    putRu: (ruId: number, data: RURequest, params: RequestParams = {}) =>
      this.request<RU, any>({
        path: `/rus/${ruId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RU
     * @name DeleteRu
     * @summary 刪除 RU
     * @request DELETE:/rus/{RU_id}
     */
    deleteRu: (ruId: number, params: RequestParams = {}) =>
      this.request<Message, any>({
        path: `/rus/${ruId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags RU
     * @name IntRuIdLocationUpdate
     * @summary 更新 RU 的位置
     * @request PUT:/rus/<int:RU_id>/location
     */
    intRuIdLocationUpdate: (
      ruId: number,
      data: RULocationRequest,
      params: RequestParams = {},
    ) =>
      this.request<RU, Error>({
        path: `/rus/<int${ruId}>/location`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  aiModel = {
    /**
     * No description
     *
     * @tags AIModel
     * @name AiModelsList
     * @summary 取得所有 AIModel
     * @request GET:/ai_models
     */
    aiModelsList: (params: RequestParams = {}) =>
      this.request<AIModel[], any>({
        path: `/ai_models`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name AiModelsCreate
     * @summary 新增 AIModel
     * @request POST:/ai_models
     */
    aiModelsCreate: (data: AIModelRequest, params: RequestParams = {}) =>
      this.request<AIModel, any>({
        path: `/ai_models`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name AiModelsDetail
     * @summary 取得單一 AIModel
     * @request GET:/ai_models/{AI_model_id}
     */
    aiModelsDetail: (aiModelId: number, params: RequestParams = {}) =>
      this.request<AIModel, Error>({
        path: `/ai_models/${aiModelId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name AiModelsUpdate
     * @summary 更新 AIModel
     * @request PUT:/ai_models/{AI_model_id}
     */
    aiModelsUpdate: (
      aiModelId: number,
      data: AIModelRequest,
      params: RequestParams = {},
    ) =>
      this.request<AIModel, Error>({
        path: `/ai_models/${aiModelId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name AiModelsDelete
     * @summary 刪除 AIModel
     * @request DELETE:/ai_models/{AI_model_id}
     */
    aiModelsDelete: (aiModelId: number, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/ai_models/${aiModelId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name ActivateCreate
     * @summary 啟用 AIModel
     * @request POST:/ai_models/{AI_model_id}/activate
     */
    activateCreate: (aiModelId: number, params: RequestParams = {}) =>
      this.request<AIModel, Error>({
        path: `/ai_models/${aiModelId}/activate`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name DeactivateCreate
     * @summary 停用 AIModel
     * @request POST:/ai_models/{AI_model_id}/deactivate
     */
    deactivateCreate: (aiModelId: number, params: RequestParams = {}) =>
      this.request<AIModel, Error>({
        path: `/ai_models/${aiModelId}/deactivate`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name StartTrainingCreate
     * @summary 開始訓練 AIModel
     * @request POST:/ai_models/{AI_model_id}/start-training
     */
    startTrainingCreate: (aiModelId: number, params: RequestParams = {}) =>
      this.request<AIModel, Error>({
        path: `/ai_models/${aiModelId}/start-training`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name StopTrainingCreate
     * @summary 停止訓練 AIModel
     * @request POST:/ai_models/{AI_model_id}/stop-training
     */
    stopTrainingCreate: (aiModelId: number, params: RequestParams = {}) =>
      this.request<AIModel, Error>({
        path: `/ai_models/${aiModelId}/stop-training`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name EnableUpdateCreate
     * @summary 啟用 AIModel 更新
     * @request POST:/ai_models/{AI_model_id}/enable-update
     */
    enableUpdateCreate: (aiModelId: number, params: RequestParams = {}) =>
      this.request<AIModel, Error>({
        path: `/ai_models/${aiModelId}/enable-update`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AIModel
     * @name DisableUpdateCreate
     * @summary 停用 AIModel 更新
     * @request POST:/ai_models/{AI_model_id}/disable-update
     */
    disableUpdateCreate: (aiModelId: number, params: RequestParams = {}) =>
      this.request<AIModel, Error>({
        path: `/ai_models/${aiModelId}/disable-update`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
  dtaiModel = {
    /**
     * No description
     *
     * @tags DTAIModel
     * @name DtAiModelsList
     * @summary 取得所有 DTAIModel
     * @request GET:/dt_ai_models
     */
    dtAiModelsList: (params: RequestParams = {}) =>
      this.request<any[], any>({
        path: `/dt_ai_models`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DTAIModel
     * @name DtAiModelsCreate
     * @summary 新增 DTAIModel
     * @request POST:/dt_ai_models
     */
    dtAiModelsCreate: (data: any, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/dt_ai_models`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DTAIModel
     * @name DtAiModelsDetail
     * @summary 取得單一 DTAIModel
     * @request GET:/dt_ai_models/{model_id}
     */
    dtAiModelsDetail: (modelId: number, params: RequestParams = {}) =>
      this.request<any, Error>({
        path: `/dt_ai_models/${modelId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DTAIModel
     * @name DtAiModelsUpdate
     * @summary 更新 DTAIModel
     * @request PUT:/dt_ai_models/{model_id}
     */
    dtAiModelsUpdate: (
      modelId: number,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<any, Error>({
        path: `/dt_ai_models/${modelId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DTAIModel
     * @name DtAiModelsDelete
     * @summary 刪除 DTAIModel
     * @request DELETE:/dt_ai_models/{model_id}
     */
    dtAiModelsDelete: (modelId: number, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/dt_ai_models/${modelId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  abstractMetrics = {
    /**
     * No description
     *
     * @tags AbstractMetrics
     * @name AbstractMetricsList
     * @summary 取得所有 AbstractMetrics
     * @request GET:/abstract_metrics
     */
    abstractMetricsList: (params: RequestParams = {}) =>
      this.request<AbstractMetricsShow[], any>({
        path: `/abstract_metrics`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AbstractMetrics
     * @name AbstractMetricsCreate
     * @summary 新增 AbstractMetrics
     * @request POST:/abstract_metrics
     */
    abstractMetricsCreate: (
      data: {
        /** @example "Cell ON/OFF" */
        display_name: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        AbstractMetricsShow,
        {
          /** @example "display_name is required" */
          error?: string;
        }
      >({
        path: `/abstract_metrics`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AbstractMetrics
     * @name AbstractMetricsDetail
     * @summary 取得單一 AbstractMetrics
     * @request GET:/abstract_metrics/{metrics_id}
     */
    abstractMetricsDetail: (metricsId: number, params: RequestParams = {}) =>
      this.request<
        AbstractMetricsShow,
        {
          /** @example "AbstractMetrics not found" */
          message?: string;
        }
      >({
        path: `/abstract_metrics/${metricsId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AbstractMetrics
     * @name AbstractMetricsUpdate
     * @summary 更新 AbstractMetrics
     * @request PUT:/abstract_metrics/{metrics_id}
     */
    abstractMetricsUpdate: (
      metricsId: number,
      data: {
        /** @example "Cell ON/OFF" */
        display_name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        AbstractMetricsShow,
        | {
          /** @example "display_name is required" */
          error?: string;
        }
        | {
          /** @example "AbstractMetrics not found" */
          message?: string;
        }
      >({
        path: `/abstract_metrics/${metricsId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AbstractMetrics
     * @name AbstractMetricsDelete
     * @summary 刪除 AbstractMetrics
     * @request DELETE:/abstract_metrics/{metrics_id}
     */
    abstractMetricsDelete: (metricsId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "AbstractMetrics 1 deleted successfully" */
          message?: string;
        },
        {
          /** @example "AbstractMetrics not found" */
          message?: string;
        }
      >({
        path: `/abstract_metrics/${metricsId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  brand = {
    /**
     * @description 回傳資料庫中所有唯一的 BrandMetrics.name
     *
     * @tags Brand
     * @name UniqueNamesList
     * @summary 取得所有唯一的 BrandMetrics 參數名稱
     * @request GET:/brand_metrics/unique-names
     */
    uniqueNamesList: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example ["# of UE per cell ","DL throughput per cell ","UL throughput per cell "] */
          unique_names?: string[];
        },
        any
      >({
        path: `/brand_metrics/unique-names`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Brand
     * @name BrandsList
     * @summary 取得所有品牌
     * @request GET:/brands
     */
    brandsList: (params: RequestParams = {}) =>
      this.request<Brand[], any>({
        path: `/brands`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Brand
     * @name BrandsCreate
     * @summary 新增品牌
     * @request POST:/brands
     */
    brandsCreate: (data: BrandRequest, params: RequestParams = {}) =>
      this.request<Brand, Error>({
        path: `/brands`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Brand
     * @name BrandsDetail
     * @summary 取得單一品牌
     * @request GET:/brands/{brand_id}
     */
    brandsDetail: (brandId: number, params: RequestParams = {}) =>
      this.request<Brand, Error>({
        path: `/brands/${brandId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Brand
     * @name BrandsUpdate
     * @summary 更新品牌
     * @request PUT:/brands/{brand_id}
     */
    brandsUpdate: (
      brandId: number,
      data: BrandRequestPut,
      params: RequestParams = {},
    ) =>
      this.request<Brand, Error>({
        path: `/brands/${brandId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Brand
     * @name BrandsDelete
     * @summary 刪除品牌
     * @request DELETE:/brands/{brand_id}
     */
    brandsDelete: (brandId: number, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/brands/${brandId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  primitiveAiModel = {
    /**
     * No description
     *
     * @tags PrimitiveAIModel
     * @name PrimitiveAiModelsList
     * @summary 取得所有 PrimitiveAIModel
     * @request GET:/primitive_ai_models
     */
    primitiveAiModelsList: (params: RequestParams = {}) =>
      this.request<PrimitiveAIModel[], any>({
        path: `/primitive_ai_models`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PrimitiveAIModel
     * @name PrimitiveAiModelsCreate
     * @summary 新增 PrimitiveAIModel
     * @request POST:/primitive_ai_models
     */
    primitiveAiModelsCreate: (
      data: PrimitiveAIModelRequest,
      params: RequestParams = {},
    ) =>
      this.request<PrimitiveAIModel, Error>({
        path: `/primitive_ai_models`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PrimitiveAIModel
     * @name PrimitiveAiModelsDetail
     * @summary 取得單一 PrimitiveAIModel
     * @request GET:/primitive_ai_models/{model_id}
     */
    primitiveAiModelsDetail: (modelId: number, params: RequestParams = {}) =>
      this.request<
        PrimitiveAIModel & {
          ai_metrics?: object[];
        },
        Error
      >({
        path: `/primitive_ai_models/${modelId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PrimitiveAIModel
     * @name PrimitiveAiModelsUpdate
     * @summary 更新 PrimitiveAIModel
     * @request PUT:/primitive_ai_models/{model_id}
     */
    primitiveAiModelsUpdate: (
      modelId: number,
      data: PrimitiveAIModelRequest,
      params: RequestParams = {},
    ) =>
      this.request<PrimitiveAIModel, Error>({
        path: `/primitive_ai_models/${modelId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PrimitiveAIModel
     * @name PrimitiveAiModelsDelete
     * @summary 刪除 PrimitiveAIModel
     * @request DELETE:/primitive_ai_models/{model_id}
     */
    primitiveAiModelsDelete: (modelId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "PrimitiveAIModel 1 deleted successfully" */
          message?: string;
        },
        Error
      >({
        path: `/primitive_ai_models/${modelId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  primitiveDtAiModel = {
    /**
     * No description
     *
     * @tags PrimitiveDTAIModel
     * @name PrimitiveDtAiModelsList
     * @summary 取得所有 PrimitiveDTAIModel
     * @request GET:/primitive_dt_ai_models
     */
    primitiveDtAiModelsList: (params: RequestParams = {}) =>
      this.request<PrimitiveDTAIModel[], any>({
        path: `/primitive_dt_ai_models`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PrimitiveDTAIModel
     * @name PrimitiveDtAiModelsCreate
     * @summary 新增 PrimitiveDTAIModel
     * @request POST:/primitive_dt_ai_models
     */
    primitiveDtAiModelsCreate: (
      data: {
        model_name: string;
        MinIO_name_for_DT_AI_model?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<PrimitiveDTAIModel, any>({
        path: `/primitive_dt_ai_models`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PrimitiveDTAIModel
     * @name PrimitiveDtAiModelsDetail
     * @summary 取得單一 PrimitiveDTAIModel
     * @request GET:/primitive_dt_ai_models/{model_id}
     */
    primitiveDtAiModelsDetail: (modelId: number, params: RequestParams = {}) =>
      this.request<PrimitiveDTAIModel, Error>({
        path: `/primitive_dt_ai_models/${modelId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PrimitiveDTAIModel
     * @name PrimitiveDtAiModelsUpdate
     * @summary 更新 PrimitiveDTAIModel
     * @request PUT:/primitive_dt_ai_models/{model_id}
     */
    primitiveDtAiModelsUpdate: (
      modelId: number,
      data: {
        model_name?: string;
        MinIO_name_for_DT_AI_model?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<PrimitiveDTAIModel, Error>({
        path: `/primitive_dt_ai_models/${modelId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PrimitiveDTAIModel
     * @name PrimitiveDtAiModelsDelete
     * @summary 刪除 PrimitiveDTAIModel
     * @request DELETE:/primitive_dt_ai_models/{model_id}
     */
    primitiveDtAiModelsDelete: (modelId: number, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/primitive_dt_ai_models/${modelId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  map = {
    /**
     * No description
     *
     * @tags Map
     * @name MapsList
     * @summary 取得所有 Map
     * @request GET:/maps
     */
    mapsList: (params: RequestParams = {}) =>
      this.request<Map[], any>({
        path: `/maps`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Map
     * @name MapsCreate
     * @summary 新增 Map
     * @request POST:/maps
     */
    mapsCreate: (data: MapRequest, params: RequestParams = {}) =>
      this.request<Map, any>({
        path: `/maps`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Map
     * @name MapsDetail
     * @summary 取得單一 Map
     * @request GET:/maps/{map_id}
     */
    mapsDetail: (mapId: number, params: RequestParams = {}) =>
      this.request<Map, Error>({
        path: `/maps/${mapId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Map
     * @name MapsUpdate
     * @summary 更新 Map
     * @request PUT:/maps/{map_id}
     */
    mapsUpdate: (mapId: number, data: MapRequest, params: RequestParams = {}) =>
      this.request<Map, Error>({
        path: `/maps/${mapId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Map
     * @name MapsDelete
     * @summary 刪除 Map
     * @request DELETE:/maps/{map_id}
     */
    mapsDelete: (mapId: number, params: RequestParams = {}) =>
      this.request<Message, Error>({
        path: `/maps/${mapId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Map
     * @name MapPositionDetail
     * @summary 取得專案關聯的所有地圖位置信息
     * @request GET:/Map_Position/{id}
     */
    mapPositionDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          MID?: number;
          position?: object;
          name?: string;
        }[],
        string
      >({
        path: `/Map_Position/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  minIo = {
    /**
     * No description
     *
     * @tags MinIO
     * @name EnsureBucketCreate
     * @summary 確保 MinIO bucket 存在
     * @request POST:/minio/ensure_bucket
     */
    ensureBucketCreate: (
      data: {
        /** @example "rsrp" */
        bucket?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success?: boolean;
        },
        {
          /** @example "Bucket 不存在" */
          error?: string;
        }
      >({
        path: `/minio/ensure_bucket`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MinIO
     * @name UploadJsonCreate
     * @summary 上傳 JSON 字串到 MinIO
     * @request POST:/minio/upload_json
     */
    uploadJsonCreate: (
      data: {
        /** @example "rsrp" */
        bucket?: string;
        /** @example "test.json" */
        object_name?: string;
        /** @example "{"a":1,"b":2}" */
        json_str?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success?: boolean;
        },
        any
      >({
        path: `/minio/upload_json`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MinIO
     * @name GetJsonCreate
     * @summary 取得 MinIO 內的 JSON 字串
     * @request POST:/minio/get_json
     */
    getJsonCreate: (
      data: {
        /** @example "rsrp" */
        bucket?: string;
        /** @example "test.json" */
        object_name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "{"a":1,"b":2}" */
          json?: string;
        },
        any
      >({
        path: `/minio/get_json`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MinIO
     * @name DeleteObjectCreate
     * @summary 刪除 MinIO 內的物件
     * @request POST:/minio/delete_object
     */
    deleteObjectCreate: (
      data: {
        /** @example "rsrp" */
        bucket?: string;
        /** @example "test.json" */
        object_name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success?: boolean;
        },
        | {
          /** @example "Missing parameter" */
          message?: string;
        }
        | {
          success?: boolean;
          error?: string;
        }
      >({
        path: `/minio/delete_object`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  aodt = {
    /**
     * @description 檢查 AODT 服務是否正常運行
     *
     * @tags AODT
     * @name StatusList
     * @summary 取得 AODT 服務狀態
     * @request GET:/aodt/status
     */
    statusList: (params: RequestParams = {}) =>
      this.request<AODTStatusResponse, AODTStatusResponse>({
        path: `/aodt/status`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 建立與 AODT 系統的資料庫連接並附加 worker
     *
     * @tags AODT
     * @name ConnectCreate
     * @summary 連接到 AODT 資料庫
     * @request POST:/aodt/connect
     */
    connectCreate: (data?: AODTConnectionRequest, params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/connect`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 在 AODT 中開啟指定的 USD Stage 檔案
     *
     * @tags AODT
     * @name OpenStageCreate
     * @summary 開啟 AODT USD Stage
     * @request POST:/aodt/open-stage
     */
    openStageCreate: (data: AODTStageRequest, params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/open-stage`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 配置 AODT 模擬參數，支援兩種模式： - **Mode 0**: 計算 rsrp - **Mode 1**: 計算 throughput
     *
     * @tags AODT
     * @name SimulationConfigCreate
     * @summary 設定 AODT 模擬配置
     * @request POST:/aodt/simulation-config
     */
    simulationConfigCreate: (
      data: AODTSimulationConfigRequest,
      params: RequestParams = {},
    ) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/simulation-config`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 執行完整的 AODT (rsrp) 工作流程，包括： 1. 傳入 USD 檔案 2. 連接資料庫 3. 開啟 USD Stage（可選） 4. 設定模擬配置（可選） 5. 刪除現有的 DU 和 RU 6. 建立 pannel 7. 創建 DU 和 RU 8. 自動分配 DU 9. 自動部署 UE 10. 開始模擬
     *
     * @tags AODT
     * @name WorkflowStartCreate
     * @summary 啟動完整的 AODT (rsrp) 工作流程
     * @request POST:/aodt/workflow/start
     */
    workflowStartCreate: (
      data?: AODTWorkflowRequest,
      params: RequestParams = {},
    ) =>
      this.request<TaskInserted, Error>({
        path: `/aodt/workflow/start`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 在 AODT 中創建一個 RU 於指定座標
     *
     * @tags AODT
     * @name RuCreateCreate
     * @summary 創建單個 RU
     * @request POST:/aodt/ru/create
     */
    ruCreateCreate: (data: AODTRUCreateRequest, params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/ru/create`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 在 AODT 中批量創建多個 RU
     *
     * @tags AODT
     * @name RuCreateBatchCreate
     * @summary 批量創建 RU
     * @request POST:/aodt/ru/create-batch
     */
    ruCreateBatchCreate: (data: any, params: RequestParams = {}) =>
      this.request<any, AODTResponse>({
        path: `/aodt/ru/create-batch`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 設定最後創建的 RU 的方向角度
     *
     * @tags AODT
     * @name RuSetDirectionCreate
     * @summary 設定 RU 方向
     * @request POST:/aodt/ru/set-direction
     */
    ruSetDirectionCreate: (
      data: AODTRUCreateRequest,
      params: RequestParams = {},
    ) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/ru/set-direction`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 刪除 AODT 場景中的所有 RU
     *
     * @tags AODT
     * @name RuDeleteAllDelete
     * @summary 刪除所有 RU
     * @request DELETE:/aodt/ru/delete-all
     */
    ruDeleteAllDelete: (params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/ru/delete-all`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * @description 在 AODT 中創建一個 DU 於指定座標
     *
     * @tags AODT
     * @name DuCreateCreate
     * @summary 創建單個 DU
     * @request POST:/aodt/du/create
     */
    duCreateCreate: (data: AODTDUCreateRequest, params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/du/create`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 刪除 AODT 場景中的所有 DU
     *
     * @tags AODT
     * @name DuDeleteAllDelete
     * @summary 刪除所有 DU
     * @request DELETE:/aodt/du/delete-all
     */
    duDeleteAllDelete: (params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/du/delete-all`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * @description 在 AODT 中批量創建多個 DU
     *
     * @tags AODT
     * @name DuCreateBatchCreate
     * @summary 批量創建 DU
     * @request POST:/aodt/du/create-batch
     */
    duCreateBatchCreate: (data: any, params: RequestParams = {}) =>
      this.request<any, AODTResponse>({
        path: `/aodt/du/create-batch`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 自動將 DU 分配給場景中的所有 RU
     *
     * @tags AODT
     * @name DuAutoAssignCreate
     * @summary 自動分配 DU 給所有 RU
     * @request POST:/aodt/du/auto-assign
     */
    duAutoAssignCreate: (params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/du/auto-assign`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description 在 AODT 中隨機建立指定數量的 UE
     *
     * @tags AODT
     * @name UesCreateDirectCreate
     * @summary 直接創建 UE
     * @request POST:/aodt/ues/create-direct
     */
    uesCreateDirectCreate: (
      data: AODTUECreateRequest,
      params: RequestParams = {},
    ) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/ues/create-direct`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AODT
     * @name GenerateUeMobilityList
     * @summary 生成 UE 移動性
     * @request GET:/aodt/generate-ue-mobility
     */
    generateUeMobilityList: (params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/generate-ue-mobility`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 啟動 AODT 模擬流程
     *
     * @tags AODT
     * @name StartSimulationCreate
     * @summary 開始 AODT 模擬
     * @request POST:/aodt/start-simulation
     */
    startSimulationCreate: (
      data: {
        /**
         * 專案 ID
         * @example 1
         */
        project_id: number;
        /**
         * 評估 ID
         * @example 1
         */
        evaluation_id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/start-simulation`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 獲取當前 AODT 模擬的進度資訊
     *
     * @tags AODT
     * @name SimulationProgressList
     * @summary 取得 AODT 模擬進度
     * @request GET:/aodt/simulation_progress
     */
    simulationProgressList: (params: RequestParams = {}) =>
      this.request<AODTSimulationProgressResponse, AODTResponse>({
        path: `/aodt/simulation_progress`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 確認 AODT 模擬是否仍在進行中
     *
     * @tags AODT
     * @name WorkflowIsSimRunningList
     * @summary 檢查 AODT 模擬是否正在運行
     * @request GET:/aodt/workflow/is_sim_running
     */
    workflowIsSimRunningList: (params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse>({
        path: `/aodt/workflow/is_sim_running`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 執行完整的 AODT (throughput) 工作流程，包括： 1. 傳入 USD 檔案 2. 連接資料庫 3. 開啟 USD Stage（可選） 4. 設定模擬配置（可選） 5. 刪除現有的 DU 和 RU 6. 建立 pannel 7. 創建 DU 和 RU 8. 自動分配 DU 9. 自動部署 UE 10. 開始模擬
     *
     * @tags AODT
     * @name WorkflowThroughputCreate
     * @summary 啟動 AODT (throughput) 的完整工作流程
     * @request POST:/aodt/workflow/throughput
     */
    workflowThroughputCreate: (
      data: AODTWorkflowRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Heatmap uploaded successfully" */
          message?: string;
        },
        | {
          /** @example false */
          success?: boolean;
          /** @example "Missing heatmap file or project ID" */
          error?: string;
        }
        | {
          /** @example false */
          success?: boolean;
          /** @example "Internal server error" */
          error?: string;
        }
      >({
        path: `/aodt/workflow/throughput`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 創建一個新的 Panel
     *
     * @tags AODT
     * @name PanelCreateCreate
     * @summary 創建 Panel
     * @request POST:/aodt/panel/create
     */
    panelCreateCreate: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "成功創建 Panel" */
          message?: string;
          data?: {
            /** @example "/path/to/panel" */
            panel_path?: string;
            /** @example "Panel1" */
            panel_name?: string;
          };
        },
        | {
          /** @example false */
          success?: boolean;
          /** @example "Panel 創建失敗" */
          message?: string;
        }
        | {
          /** @example false */
          success?: boolean;
          /** @example "創建 Panel 錯誤" */
          message?: string;
        }
      >({
        path: `/aodt/panel/create`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description 批量創建多個 Panel
     *
     * @tags AODT
     * @name PanelCreateBatchCreate
     * @summary 批量創建 Panel
     * @request POST:/aodt/panel/create-batch
     */
    panelCreateBatchCreate: (
      data: {
        /**
         * 要創建的 Panel 數量
         * @example 3
         */
        count?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success?: boolean;
          message?: string;
          summary?: object;
          results?: object[];
        },
        {
          success?: boolean;
          message?: string;
        }
      >({
        path: `/aodt/panel/create-batch`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 檢查 Panel 的配置狀態
     *
     * @tags AODT
     * @name PanelCheckConfigList
     * @summary 檢查 Panel 配置
     * @request GET:/aodt/panel/check-config
     */
    panelCheckConfigList: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Panel 配置檢查完成" */
          message?: string;
          data?: {
            /** @example true */
            panel_asset_path_configured?: boolean;
            /** @example "/path/to/panel/assets" */
            panel_asset_path?: string;
          };
        },
        {
          /** @example false */
          success?: boolean;
          /** @example "檢查 Panel 配置錯誤" */
          message?: string;
        }
      >({
        path: `/aodt/panel/check-config`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 回傳目前場景中的 Panel 數量
     *
     * @tags AODT
     * @name PanelCountList
     * @summary 取得當前場景中 Panel 的數量
     * @request GET:/aodt/panel/count
     */
    panelCountList: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "成功取得 Panel 數量" */
          message?: string;
          data?: {
            /** @example 3 */
            panel_count?: number;
          };
        },
        | {
          /** @example false */
          success?: boolean;
          /** @example "取得 Panel 數量失敗" */
          message?: string;
        }
        | {
          /** @example false */
          success?: boolean;
          /** @example "取得 Panel 數量錯誤" */
          message?: string;
        }
      >({
        path: `/aodt/panel/count`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AODT
     * @name CreateFilesCreate
     * @summary 在 omniverse server 裡面建立 usd 檔案
     * @request POST:/aodt/create-files
     */
    createFilesCreate: (
      data: {
        /** @example 1 */
        project_id?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "檔案建立成功" */
          message?: string;
        },
        {
          /** @example false */
          success?: boolean;
          /** @example "伺服器錯誤" */
          message?: string;
        }
      >({
        path: `/aodt/create-files`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AODT
     * @name DeleteFileCreate
     * @summary 在 omniverse server 裡面刪除檔案
     * @request POST:/aodt/delete-file
     */
    deleteFileCreate: (
      data: {
        /** @example "aodt_map_1.usd" */
        file_name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "檔案刪除成功" */
          message?: string;
        },
        {
          /** @example false */
          success?: boolean;
          /** @example "伺服器錯誤" */
          message?: string;
        }
      >({
        path: `/aodt/delete-file`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AODT
     * @name WorkflowResultDetail
     * @summary 得到task_id對應的task的response
     * @request GET:/aodt/workflow/result/{task_id}
     */
    workflowResultDetail: (taskId: string, params: RequestParams = {}) =>
      this.request<AODTResponse, AODTResponse | TaskUnfinish>({
        path: `/aodt/workflow/result/${taskId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AODT
     * @name RestartCreate
     * @summary 重新啟動 AODT 前端以及 restart 後端 containers
     * @request POST:/aodt/restart
     */
    restartCreate: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "AODT 開啟成功" */
          message?: string;
        },
        {
          /** @example "伺服器錯誤" */
          message?: string;
          /** @example "開啟失敗" */
          error?: string;
        }
      >({
        path: `/aodt/restart`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description 更新 RU 的屬性，包括高度、機械方位角和機械傾斜角。 - 可以同時更新多個屬性，也可以只更新其中一個 - 高度單位為公尺，範圍：0.5-100.0 米 - 機械方位角範圍：0-360 度 - 機械傾斜角範圍：0.0-360.0 度
     *
     * @tags AODT
     * @name RuUpdatePropertiesCreate
     * @summary 更新 RU 屬性
     * @request POST:/aodt/ru/update-properties
     */
    ruUpdatePropertiesCreate: (
      data: RUPropertiesUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<
        RUPropertiesUpdateResponse,
        | {
          /** @example false */
          success?: boolean;
          /** @example "缺少必要參數: ru_path" */
          message?:
          | "請提供請求資料"
          | "缺少必要參數: ru_path"
          | "至少需要提供一個要更新的屬性 (height, mech_azimuth, mech_tilt)"
          | "height 必須在 0.5-100.0 米範圍內"
          | "mech_azimuth 必須在 0.0-360.0 度範圍內"
          | "mech_tilt 必須在 0.0-360.0 度範圍內";
        }
        | {
          /** @example false */
          success?: boolean;
          /** @example "內部錯誤: connection timeout" */
          message?: string;
        }
      >({
        path: `/aodt/ru/update-properties`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 獲取指定 RU 的當前屬性值，包括： - 高度 (height) - 機械方位角 (mech_azimuth) - 機械傾斜角 (mech_tilt) - Cell ID (cell_id) - DU ID (du_id)
     *
     * @tags AODT
     * @name RuPropertiesDetail
     * @summary 獲取 RU 屬性
     * @request GET:/aodt/ru/properties/{ru_path}
     */
    ruPropertiesDetail: (ruPath: string, params: RequestParams = {}) =>
      this.request<
        RUPropertiesResponse,
        | {
          /** @example false */
          success?: boolean;
          /** @example "獲取 RU 屬性失敗: /RUs/ru_0001" */
          message?: string;
        }
        | {
          /** @example false */
          success?: boolean;
          /** @example "內部錯誤: connection timeout" */
          message?: string;
        }
      >({
        path: `/aodt/ru/properties/${ruPath}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  dtAiModel = {
    /**
     * No description
     *
     * @tags DT_AI_Model
     * @name NetDtCreate
     * @summary 傳送 heatmap 給 DT Model 計算 DT
     * @request POST:/netDT/{evaluation_id}
     */
    netDtCreate: (evaluationId: number, params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Network DT simulation start" */
          message?: string;
        },
        {
          /** @example false */
          success?: boolean;
          /** @example "Network DT simulation Error" */
          error?: string;
        }
      >({
        path: `/netDT/${evaluationId}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DT_AI_Model
     * @name RanDtCreate
     * @summary 傳送 heatmap 給 DT Model 計算 DT
     * @request POST:/ranDT/{evaluation_id}
     */
    ranDtCreate: (
      evaluationId: number,
      data: {
        /** @example [[120.99703268059369,24.78668801345445],[120.99701254813118,24.787093779033228]] */
        ue_start_end_pt?: Array<[number, number]>;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Ran DT simulation start" */
          message?: string;
        },
        {
          /** @example false */
          success?: boolean;
          /** @example "Ran DT simulation Error" */
          error?: string;
        }
      >({
        path: `/ranDT/${evaluationId}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  gnb = {
    /**
     * @description 從 GNB_STATUS_API_URL 取得 GNB 狀態與座標資訊
     *
     * @tags GNB
     * @name GnbStatusList
     * @summary 取得所有 GNB 狀態（含座標）
     * @request GET:/gnb_status
     */
    gnbStatusList: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example 1 */
          id?: number;
          /** @example 25.033 */
          lat?: number | null;
          /** @example 121.565 */
          lon?: number | null;
        }[],
        | {
          /** @example "GNB_STATUS_API_URL not set" */
          message?: string;
        }
        | {
          /** @example "Failed to fetch GNB status" */
          message?: string;
        }
      >({
        path: `/gnb_status`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
