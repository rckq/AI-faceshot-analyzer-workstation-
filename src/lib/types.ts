// AI 분석 결과 타입
export interface AnalysisResult {
  isValid: boolean;
  reason?: string;
  figureScore?: number;
  backgroundScore?: number;
  vibeScore?: number;
  figureCritique?: string;
  backgroundCritique?: string;
  vibeCritique?: string;
  finalCritique?: string;
}

// 폼 데이터 타입
export interface ContactFormData {
  name: string;
  contact: string;
  consent: boolean;
}

// API 요청 페이로드
export interface AnalyzeImagePayload {
  mode: "full";
  requestId: string;
  name: string;
  contact: string;
  timestamp: string;
  imageBase64: string;
  consent: boolean;
  clientId: string;
  visitorId: string;
  ip: string;
  ua: string;
  lang: string;
  referrer: string;
}

// Apps Script 페이로드
export interface AppsScriptPayload {
  action: "complete";
  requestId: string;
  name: string;
  contact: string;
  timestamp: string;
  image: string;
  consent: "Y" | "N";
  clientId: string;
  visitorId: string;
  ip: string;
  ua: string;
  lang: string;
  referrer: string;
  figureScore?: number;
  backgroundScore?: number;
  vibeScore?: number;
  figureCritique?: string;
  backgroundCritique?: string;
  vibeCritique?: string;
  finalCritique?: string;
}

// API 응답 타입
export interface AnalyzeResponse {
  ok: boolean;
  result?: AnalysisResult;
  error?: string;
}
