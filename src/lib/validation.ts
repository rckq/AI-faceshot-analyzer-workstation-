// 이름 유효성 검사
export function validateName(name: string): boolean {
  const trimmedName = name.trim();

  // 빈 문자열이거나 공백만 있는 경우
  if (!trimmedName || trimmedName.length < 2) {
    return false;
  }

  // 연속된 공백이 있는지 확인
  if (trimmedName.includes("  ")) {
    return false;
  }

  // 한글, 영문, 공백만 허용, 2-10글자
  const nameRegex = /^[가-힣a-zA-Z\s]{2,10}$/;
  if (!nameRegex.test(trimmedName)) {
    return false;
  }

  // 의성어나 무의미한 패턴 검사
  const invalidPatterns = [
    /^(.)\1+$/, // 같은 글자 반복 (예: 가가가, aaa)
    /^[ㄱ-ㅎㅏ-ㅣ]+$/, // 자음이나 모음만
    /(하{2,}|히{2,}|후{2,}|헤{2,}|호{2,})/, // 하하하, 히히히 등
    /^(하|히|후|헤|호|ㅋ|ㅎ|ㄷ|ㄴ|ㄹ|ㅁ|ㅂ|ㅅ|ㅇ|ㅈ|ㅊ|ㅌ|ㅍ)+$/, // 의성어/자모 반복
    /^[0-9!@#$%^&*()_+=\-\[\]{}|;:,.<>?]+$/, // 숫자나 특수문자만
    /(test|테스트|ㅋㅋ+|ㅎㅎ+|ㄷㄷ|ㄴㄴ)/i, // 테스트/채팅 용어
    /(하히후헤호|아하하하|우하하|으하하)/, // 대표 의성어
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(trimmedName)) {
      return false;
    }
  }

  return true;
}

// 연락처 유효성 검사
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  return phoneRegex.test(phone);
}

// 고유 ID 생성
export function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
