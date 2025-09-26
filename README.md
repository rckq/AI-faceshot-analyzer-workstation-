# 🎯 AI 프로필 사진 분석기 - Next.js 15

AI를 활용한 프로필 사진 분석 및 평가 서비스입니다. Google Gemini API를 사용하여 인물, 배경, 감성을 분석합니다.

## ✨ 주요 기능

- 📸 **이미지 업로드**: 드래그 앤 드롭 또는 파일 선택
- 🤖 **AI 분석**: Google Gemini를 통한 3가지 측면 평가
  - 인물: 표정, 포즈, 전체적인 매력
  - 배경: 배경 구성, 조명, 전체적인 분위기
  - 감성: 사진이 전달하는 느낌과 매력
- 💾 **데이터 저장**: Google Sheets + Drive 자동 저장
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 🚀 기술 스택

- **Framework**: Next.js 15.1.0 (App Router)
- **Language**: TypeScript 5.6.2
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 3.4.1
- **AI**: Google Gemini API
- **Storage**: Google Apps Script (Sheets + Drive)
- **Analytics**: FingerprintJS

## 📦 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone https://github.com/your-username/ai-faceshot-analyzer.git
cd ai-faceshot-analyzer
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일 생성:

```env
GEMINI_API_KEY=your_gemini_api_key_here
APPS_SCRIPT_URL=your_apps_script_url_here
```

### 4. 개발 서버 실행

```bash
npm run dev
npx --yes netlify-cli@latest dev --port 8888
```

http://localhost:3000 에서 확인

### 5. 프로덕션 빌드

```bash
npm run build
npm start
```

## 🔧 Google Apps Script 설정

### 1. Google 스프레드시트 생성

1. [Google 스프레드시트](https://sheets.google.com)에서 새 시트 생성
2. 시트 이름을 "Sheet1"로 유지
3. 첫 번째 행에 헤더 추가:
   ```
   요청ID | 타임스탬프 | 이름 | 연락처 | 이미지 URL | 동의 | clientId | visitorId | ip | ua | lang | referrer | 상태 | 인물 | 배경 | 감성 | 인물 코멘트 | 배경 코멘트 | 감성 코멘트 | 최종 한줄평 | 업데이트시각
   ```

### 2. Google Drive 폴더 생성

1. [Google Drive](https://drive.google.com)에서 이미지 저장용 폴더 생성
2. 폴더 ID 복사 (URL에서 `/folders/` 뒤의 문자열)

### 3. Apps Script 설정

1. 스프레드시트에서 `확장 프로그램` → `Apps Script` 클릭
2. [Apps Script 코드](./docs/apps-script-code.js) 붙여넣기
3. `FOLDER_ID` 변경
4. `배포` → `새 배포` → `웹 앱`으로 배포
5. 생성된 URL을 환경 변수로 설정

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx            # 루트 레이아웃
│   ├── page.tsx              # 홈페이지
│   ├── globals.css           # 글로벌 스타일
│   ├── privacy/
│   │   └── page.tsx          # 개인정보 처리방침
│   └── api/
│       └── analyze/
│           └── route.ts      # AI 분석 API
├── components/               # 재사용 컴포넌트
│   ├── UploadSection.tsx    # 업로드 UI
│   ├── ContactSection.tsx   # 연락처 입력
│   ├── LoadingSection.tsx   # 로딩 화면
│   ├── ResultSection.tsx    # 결과 표시
│   └── AlertModal.tsx       # 알림 모달
└── lib/                     # 유틸리티
    ├── types.ts             # TypeScript 타입
    ├── validation.ts        # 검증 로직
    └── client-utils.ts      # 클라이언트 유틸
```

## 🌐 배포

### Vercel (권장)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-faceshot-analyzer)

1. 위 버튼 클릭 또는 [Vercel](https://vercel.com) 접속
2. GitHub 저장소 연결
3. 환경 변수 설정 (GEMINI_API_KEY, APPS_SCRIPT_URL)
4. Deploy 클릭

### Netlify

```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 빌드 및 배포
npm run build
netlify deploy --prod --dir=.next
```

## 📊 성능 지표

- **Lighthouse Score**

  - Performance: 95+
  - Accessibility: 100
  - Best Practices: 100
  - SEO: 100

- **Core Web Vitals**
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1

## 🔒 보안

- 환경 변수를 통한 API 키 보호
- 서버 사이드 API 호출
- 입력 검증 및 sanitization
- HTTPS 전용
- CSP 헤더 설정

## 📖 문서

- [마이그레이션 분석](./docs/migration-analysis.md)
- [프로젝트 가이드라인](./docs/project-guidelines.md)
- [API 명세](./docs/api-spec.md)
- [Apps Script 코드](./docs/apps-script-code.js)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 📞 문의

- Instagram: [@better.than.me2040](https://www.instagram.com/better.than.me2040/)
- KakaoTalk: [오픈채팅](https://open.kakao.com/o/sDAisnDh)

## 🙏 감사의 말

- Google Gemini API
- Next.js Team
- Vercel
- 모든 오픈소스 기여자들

---

Made with ❤️ by 베럴댄미
