// 클라이언트 ID 생성 및 가져오기
export function getClientId(): string {
  if (typeof window === "undefined") return "";

  const storedId = localStorage.getItem("clientId");
  if (storedId) return storedId;

  const newId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    localStorage.setItem("clientId", newId);
  } catch (_) {
    // localStorage 사용 불가 시 무시
  }

  return newId;
}

// 첫 방문 시 referrer 저장
export function saveFirstReferrer(): void {
  if (typeof window === "undefined") return;

  try {
    if (!localStorage.getItem("firstReferrer") && document.referrer) {
      localStorage.setItem("firstReferrer", document.referrer);
    }
  } catch (_) {
    // localStorage 사용 불가 시 무시
  }
}

// 저장된 referrer 가져오기
export function getFirstReferrer(): string {
  if (typeof window === "undefined") return "";

  try {
    return localStorage.getItem("firstReferrer") || "";
  } catch (_) {
    return "";
  }
}

// 클라이언트 메타 정보 수집
export interface ClientMeta {
  clientId: string;
  visitorId: string;
  ip: string;
  ua: string;
  lang: string;
  referrer: string;
}

export async function collectClientMeta(): Promise<ClientMeta> {
  const meta: ClientMeta = {
    clientId: getClientId(),
    visitorId: "",
    ip: "",
    ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
    lang:
      typeof navigator !== "undefined"
        ? navigator.language || (navigator as any).languages?.[0] || ""
        : "",
    referrer: typeof document !== "undefined" ? document.referrer : "",
  };

  // FingerprintJS로 visitorId 가져오기
  if (typeof window !== "undefined" && (window as any).FingerprintJS) {
    try {
      const FingerprintJS = (window as any).FingerprintJS;
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      meta.visitorId = result.visitorId;
    } catch (_) {
      // 실패 시 무시
    }
  }

  // IP 주소 가져오기
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    meta.ip = data.ip;
  } catch (_) {
    // 실패 시 무시
  }

  // referrer가 없으면 저장된 첫 referrer 사용
  if (!meta.referrer) {
    meta.referrer = getFirstReferrer();
  }

  return meta;
}

// visitorId를 기다리는 함수
export async function waitForVisitorId(
  timeoutMs: number = 800
): Promise<string> {
  if (typeof window === "undefined") return "";

  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if ((window as any).__visitorId) {
      return (window as any).__visitorId;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return "";
}
