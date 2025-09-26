# 통합 개발 가이드라인

## 🎯 핵심 원칙

### SOLID + 선언적(Declarative) + 불필요한 추상화 금지

#### ✅ 추상화 허용 기준
- **로직이 포함된 경우**: 상태 관리, 데이터 변환, 이벤트 처리
- **재사용이 명확한 경우**: 3곳 이상에서 동일한 패턴으로 사용
- **복잡한 조건부 렌더링**: 10줄 이상의 복잡한 조건 분기
- **외부 라이브러리 래핑**: API 호출, 서드파티 컴포넌트 통합

#### ❌ 금지 사항
- 단순 스타일링만 하는 래퍼 컴포넌트
- 컴포넌트 2-3개만 있는 폴더의 배럴 익스포트
- div + className만 있는 의미 없는 컨테이너 컴포넌트

```jsx
// ❌ 나쁜 예: 불필요한 추상화
function ResultCard({ children }) {
  return <div className="p-6 rounded-xl bg-white">{children}</div>
}

// ✅ 좋은 예: 직접 스타일링
<div className="p-6 rounded-xl bg-white">
  <PalletCalculatorResult />
</div>
```

## 🏷 네이밍 규칙

### 컴포넌트 네이밍
- **형식**: PascalCase
- **패턴**: `[Domain][Role][Variant|State]`
- **예시**: `ProductList`, `AiToolsSidebar`, `AuthLoginForm`
- **금지어**: `Common`, `Base`, `Util`, `Index`, `Test/Tmp`, `Styled*`

### 파일 구조 네이밍
```typescript
// 컴포넌트 파일
components/
├── CourseCard.tsx           // 단일 컴포넌트
├── CourseList.tsx          // 리스트 컴포넌트
├── CourseDetailModal.tsx   // 모달 컴포넌트
└── CourseFilter.tsx        // 필터 컴포넌트

// 훅 파일
hooks/
├── useCourses.ts           // 데이터 페칭 훅
├── useCourseFilter.ts      // 필터링 로직 훅
└── useCart.ts              // 장바구니 상태 훅

// 유틸리티 파일
utils/
├── courseTransform.ts      // 데이터 변환 함수
├── dateFormat.ts           // 날짜 포맷팅
└── validation.ts            // 유효성 검사
```

## 📦 Export 규칙

### 기본 원칙
- **단일 export**: 선언과 동시에 `export default` 사용
- **다중 export**: named export 사용
- **페이지 컴포넌트**: 항상 `export default` (Next.js 요구사항)
- **UI 라이브러리**: Shadcn 패턴 유지 (`export { Component }`)

```typescript
// 단일 컴포넌트 → default
export default function ProductCard({ product }: ProductCardProps) {
  /* ... */
}

// 여러 항목 → named export
export interface PalletFormData { /* ... */ }
export interface PalletResult { /* ... */ }
export function PalletCalculator() { /* ... */ }

// UI 라이브러리 → Shadcn 패턴
export { Button, buttonVariants };
```

## 🎨 스타일링 시스템

### Tailwind CSS 원칙
- **Tailwind 유틸리티 우선 사용**
- **인라인 style 금지** (style={{ }} 사용 금지)
- **styled-jsx 금지**
- **예외**: `globals.css`, 디자인 토큰, 서드파티 오버라이드

### 배경 이미지 처리 패턴
```jsx
// ❌ 나쁜 예: 인라인 스타일
<div 
  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0) 56%, rgba(0, 0, 0, 0.6) 100%), url('${detailImage}')`
  }}
/>

// ✅ 좋은 예: Image 컴포넌트 + 오버레이
<Image src={detailImage} alt="" fill priority className="object-cover" />
<div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" aria-hidden="true" />
```

### 그라디언트 처리
```jsx
// ❌ 나쁜 예: 인라인 radial-gradient
<div style={{
  background: 'radial-gradient(circle at 50% 45%, rgba(162, 162, 162, 0) 0%, rgba(0, 0, 0, 0.84) 84%, rgba(0, 0, 0, 1) 100%)'
}} />

// ✅ 좋은 예: Tailwind 그라디언트 클래스
<div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/84 to-black" />
```

### 동적 배경색 처리
```jsx
// ❌ 나쁜 예: 인라인 backgroundColor
<div style={{ backgroundColor: insight.backgroundColor || '#E1DFDF' }} />

// ✅ 좋은 예: Tailwind 클래스 사용
<div className="w-full h-full bg-gray-20" />
// 또는 동적 클래스 매핑
<div className={cn("w-full h-full", backgroundColorClass)} />
```

### Spacing-First 정책 ⚠️

#### 핵심 규칙
**외곽 여백은 최상단 래퍼의 padding, 형제 요소 간 간격은 부모의 gap으로만 관리**

```jsx
// ✅ 좋은 예: padding + gap
<div className="p-6 md:p-8">
  <div className="flex flex-col gap-4">
    <Card />
    <Card />
    <Card />
  </div>
</div>

// ❌ 나쁜 예: margin 사용
<div>
  <Card />
  <Card className="mt-4" />
  <Card className="mt-4" />
</div>
```

#### 레이아웃 패턴
```jsx
// 세로 스택
<div className="flex flex-col gap-4">

// 가로 정렬
<div className="flex gap-4">

// 그리드
<div className="grid gap-4">

// 반응형 (모바일 우선)
<div className="gap-3 md:gap-4 lg:gap-6">
<div className="p-4 md:p-6 lg:p-8">
```

### 디자인 시스템 컬러

#### 브랜드팩 컬러 팔레트
```typescript
// Gray Scale
bg-gray-0    // #FFFFFF
bg-gray-5    // #F6F6F6
text-gray-100 // #000000

// Brand Colors
bg-beige-60   // #9E8573 (primary)
bg-navy-60    // #364C62
text-accent-point   // #F44949
text-accent-success // #A3DA24
```

#### 타이포그래피
```typescript
// Display & Heading
text-display-1  // 60px, font-700
text-display-2  // 44px, font-700
text-h1        // 40px, font-700
text-h2        // 32px, font-700

// Body
text-body-0     // 24px
text-body-1     // 19px
text-body-2     // 17px
text-body-2-bold // 17px, font-700
```

### 아이콘 시스템

```jsx
// 방법 1: Icon 컴포넌트 (권장)
import { Icon } from "@/lib/icons";
<Icon name="package" size={24} className="text-gray-60" />

// 방법 2: 개별 import
import { Package, CircleCheck } from "@/lib/icons";
<Package size={24} className="text-gray-60" />
```

## 🏗 SOLID 원칙 구현

### SRP (단일 책임)
```jsx
// hooks/useUserData.ts - 데이터 페칭만
export function useUserData() { /* ... */ }

// utils/userTransform.ts - 데이터 변환만
export function transformUserData(data) { /* ... */ }

// components/UserDashboard.tsx - UI 조합만
export function UserDashboard() {
  const data = useUserData();
  const view = transformUserData(data);
  return <Chart data={view} />;
}
```

### OCP (개방-폐쇄)
```typescript
export const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-blue-500 text-white",
  secondary: "bg-gray-500 text-white",
  // 새 variant 추가는 여기만
};
```

### DIP (의존 역전)
```typescript
// 추상에 의존
export interface DataService<T> { 
  fetch(): Promise<T> 
}

export function DataDisplay<T>({ service }: { service: DataService<T> }) {
  // 구체적인 구현이 아닌 인터페이스에 의존
}
```

## 🔧 프로젝트 설정

### 필수 설정

#### tsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

#### cn 유틸리티
```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Next.js 15 특별 고려사항
```typescript
// 동적 라우트 파라미터는 Promise로 전달됨
export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  // ...
}
```

## 📋 개발 프로세스

### 작업 시작 전 체크리스트
- [ ] Development Guidelines 숙지
- [ ] 기존 컴포넌트 라이브러리 확인 (`/components/ui/`)
- [ ] Figma 디자인 전체 구조 파악
- [ ] 재사용 가능한 컴포넌트 식별
- [ ] 상태 관리 요구사항 분석

### 권장 개발 플로우
```
Phase 1: 설계 (20%)
├── 요구사항 분석
├── 컴포넌트 구조 설계
└── 가이드라인 준수 계획

Phase 2: 구현 (60%)
├── 컴포넌트별 순차 개발
├── 실시간 가이드라인 적용
└── 단위별 테스트

Phase 3: 통합 (20%)
├── 페이지 레벨 조합
├── 전체 빌드 테스트
└── 반응형 검증
```

## 🎨 Figma MCP 작업 가이드

### 워크플로우
1. MCP로 데이터 획득 (개발용 스크립트 경로로 분리)
2. 레이아웃/스타일/텍스트 토큰 추출
3. 상수/목데이터 분리 → 컴포넌트 분리 → 타입 정의
4. Tailwind로 스타일링 + 반응형

### Figma → Tailwind 매핑
```
layout.mode=row/column → flex flex-row/col
gap:20 → gap-5
padding:20 → p-5
width:448 → w-[448px] (불가피할 때만)
radius:16 → rounded-2xl
```

## 🧪 테스트 및 품질 관리

### 테스트 전략
- **E2E 테스트**: Playwright로 사용자 시나리오 테스트
- **컴포넌트 테스트**: 주요 비즈니스 로직 검증
- **타입 안전성**: TypeScript strict mode 활용

### 코드 품질 체크리스트
- [ ] TypeScript 타입 정의 완료
- [ ] ESLint 규칙 준수
- [ ] 접근성(ARIA) 속성 포함
- [ ] 반응형 디자인 검증
- [ ] 성능 최적화 (이미지 lazy loading 등)

## ✅ 최종 체크리스트

### 코드 구조
- [ ] 불필요한 추상화가 없는가?
- [ ] Export 규칙을 준수했는가?
- [ ] 네이밍 규칙을 따랐는가?

### 스타일링
- [ ] Spacing-First 정책 준수 (gap 우선, margin 금지)
- [ ] 디자인 시스템 컬러/타이포그래피 사용
- [ ] 정의된 아이콘 시스템 사용
- [ ] Tailwind 유틸리티 우선 사용

### 품질
- [ ] TypeScript 타입 정의
- [ ] SOLID 원칙 준수
- [ ] 컴포넌트 독립성 보장
- [ ] 반응형 대응 완료

## 🚫 금지 사항 요약

1. **불필요한 추상화**
   - 단순 스타일링 래퍼
   - 의미 없는 컨테이너
   - 과도한 배럴 익스포트

2. **Spacing 안티패턴**
   - 형제 간격을 위한 margin (mt, mb, mx, my)
   - 컴포넌트 외부 레이아웃 margin

3. **스타일링 안티패턴**
   - 하드코딩된 hex 컬러
   - styled-jsx 사용
   - 외부 이미지 URL 직접 사용

4. **네이밍 안티패턴**
   - Common, Base, Util 접두사
   - 구현 디테일 포함 (색상, 라이브러리명)

## 📝 Quick Reference

```jsx
// 컴포넌트 템플릿
export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  return (
    <div className="p-6 md:p-8"> {/* 외곽 padding */}
      <div className="flex flex-col gap-4"> {/* 형제 간격 gap */}
        <h2 className="text-h2 text-gray-100">제목</h2>
        <p className="text-body-2 text-gray-70">내용</p>
        <Button className="bg-beige-60 text-white">
          <Icon name="check" size={16} className="mr-2" />
          확인
        </Button>
      </div>
    </div>
  );
}
```

## 🔄 프로젝트별 추가 고려사항

### 인프런 클론 프로젝트 특화
- **강의 카드 컴포넌트**: CourseCard, CourseList 패턴
- **장바구니 기능**: Zustand 상태 관리
- **결제 프로세스**: React Hook Form + Zod 검증
- **반응형 디자인**: 모바일 우선 접근

### 기술 스택 통합
- **Next.js 15**: App Router, 동적 라우팅
- **TypeScript**: Strict mode, 타입 안전성
- **Tailwind CSS**: 유틸리티 퍼스트
- **shadcn/ui**: 컴포넌트 라이브러리
- **React Query**: 서버 상태 관리
- **Zustand**: 클라이언트 상태 관리

---
*이 가이드라인은 일관성 있고 유지보수 가능한 코드베이스를 위한 필수 규칙입니다.*
