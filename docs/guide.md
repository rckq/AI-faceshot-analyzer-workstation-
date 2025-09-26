---

# faceshot-analyzer 프로젝트 개발 가이드라인

##  목차

1. [기술 스택](#-기술-스택)
2. [컴포넌트 설계 원칙](#-컴포넌트-설계-원칙)
3. [컴포넌트 네이밍 규칙](#-컴포넌트-네이밍-규칙)
4. [Export 규칙](#-export-규칙)
5. [Tailwind CSS 사용 가이드](#-tailwind-css-사용-가이드)
6. [Spacing-First 정책](#-spacing-first-정책)
7. [Next.js 15 특화 설정](#-nextjs-15-특화-설정)
8. [프로젝트 구조](#-프로젝트-구조)
9. [최종 체크리스트](#-최종-체크리스트)

## 🚀 기술 스택

### 현재 사용 중 (Active)
- **Next.js 15.1.0** - React 풀스택 프레임워크 (App Router)
- **TypeScript 5.6.2** - 정적 타입 검사
- **React 19.0.0** - UI 라이브러리
- **Tailwind CSS 3.4.1** - 유틸리티 퍼스트 CSS 프레임워크
- **shadcn-ui** - Radix UI 기반 컴포넌트 라이브러리
- **Lucide React** - 아이콘 라이브러리

### 설정 완료 (Ready to Use)
- **React Query (@tanstack/react-query)** - 서버 상태 관리 (Provider 설정됨)
- **next-themes** - 다크모드 지원 (Provider 설정됨)
- **Supabase** - 백엔드 서비스 (클라이언트 설정됨)

### 향후 사용 예정 (Installed)
- **Zustand** - 글로벌 상태 관리 (장바구니, 사용자 정보 등)
- **React Hook Form** - 폼 상태 관리 (회원가입, 로그인 등)
- **Zod** - 스키마 검증
- **Axios** - HTTP 클라이언트 (백엔드 API 통신)
- **Framer Motion** - 페이지 전환, 인터랙션 애니메이션
- **date-fns** - 날짜/시간 처리
- **es-toolkit** - 유틸리티 함수 모음
- **ts-pattern** - 패턴 매칭
- **react-use** - React 훅 모음
- **clsx** + **tailwind-merge** - 조건부 클래스명 관리

## 🏗 컴포넌트 설계 원칙

### ❌ 불필요한 추상화 금지

#### 단순 래퍼 컴포넌트 지양

```jsx
<code_block_to_apply_changes_from>
```

#### 불필요한 배럴 익스포트 금지

```typescript
// ❌ 나쁜 예: 컴포넌트 2-3개만 있는 폴더의 index.ts
// components/course/index.ts
export * from './CourseCard';
export * from './CourseList';
export * from './CourseHeader';

// ✅ 좋은 예: 직접 import
import { CourseCard } from "@/components/course/CourseCard";
import { CourseList } from "@/components/course/CourseList";
```

#### 의미 없는 컨테이너 컴포넌트 지양

```jsx
// ❌ 나쁜 예: 단순히 div와 className만 있는 컨테이너
function CourseContentWrapper({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5">{children}</div>
}

// ✅ 좋은 예: 직접 적용
<div className="flex flex-col gap-5">{children}</div>
```

### ✅ 추상화 허용 기준

다음 경우에만 추상화를 허용합니다:

1. **로직이 포함된 경우**: 상태 관리, 데이터 변환, 이벤트 처리 등
2. **재사용이 명확한 경우**: 3곳 이상에서 동일한 패턴으로 사용
3. **복잡한 조건부 렌더링**: 10줄 이상의 복잡한 조건 분기
4. **외부 라이브러리 래핑**: API 호출, 서드파티 컴포넌트 통합

```jsx
// ✅ 좋은 추상화 예시: 로직이 있는 경우
function useCourseData(courseId: string) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 복잡한 데이터 페칭 로직
    fetchCourse(courseId).then(setCourse).finally(() => setLoading(false));
  }, [courseId]);
  
  return { course, loading };
}

// ✅ 좋은 추상화 예시: 복잡한 조건부 렌더링
function CourseStatusBadge({ status, isEnrolled, hasDiscount }: CourseStatusBadgeProps) {
  // 10+ 줄의 복잡한 상태별 스타일링 로직
  const getStatusClasses = () => {
    if (isEnrolled) return "bg-green-100 text-green-800";
    if (hasDiscount) return "bg-red-100 text-red-800";
    if (status === 'popular') return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };
  
  const getStatusText = () => {
    if (isEnrolled) return "수강 중";
    if (hasDiscount) return "할인 중";
    if (status === 'popular') return "인기";
    return "일반";
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {getStatusText()}
    </span>
  );
}
```

### SOLID 원칙 적용

#### SRP (단일 책임 원칙)

```jsx
// hooks/useCourses.ts - 데이터 페칭만
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses
  });
}

// utils/courseTransform.ts - 데이터 변환만
export function transformCourseData(course: Course): CourseView {
  return {
    ...course,
    formattedPrice: formatPrice(course.price),
    enrollmentRate: calculateEnrollmentRate(course)
  };
}

// components/CourseDashboard.tsx - UI 조합만
export function CourseDashboard() {
  const { data: courses } = useCourses();
  const transformedCourses = courses?.map(transformCourseData);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {transformedCourses?.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

#### OCP (개방-폐쇄 원칙)

```typescript
// types/course.ts
export type CourseStatus = "draft" | "published" | "archived";

export const courseStatusConfig: Record<CourseStatus, {
  label: string;
  color: string;
  icon: LucideIcon;
}> = {
  draft: { label: "초안", color: "gray", icon: Edit },
  published: { label: "공개", color: "green", icon: CheckCircle },
  archived: { label: "보관", color: "red", icon: Archive }
};

// 새 상태 추가는 여기만 수정하면 됨
```

##  컴포넌트 네이밍 규칙

### 도메인별 네이밍 패턴

#### 강의 도메인
```typescript
// 컴포넌트
CourseCard, CourseList, CourseHeader, CourseDetail
CourseEnrollment, CourseProgress, CourseReview

// 훅
useCourse, useCourseList, useCourseEnrollment
useCourseProgress, useCourseReview

// 타입
Course, CourseListResponse, CourseEnrollment
CourseProgress, CourseReview
```

#### 장바구니 도메인
```typescript
// 컴포넌트
CartButton, CartDrawer, CartItem, CartSummary
CartCheckout, CartEmpty

// 훅
useCart, useCartItems, useCartTotal
useCartCheckout, useCartValidation

// 타입
CartItem, CartSummary, CartCheckoutRequest
```

#### 결제 도메인
```typescript
// 컴포넌트
CheckoutForm, CheckoutSummary, CheckoutPayment
OrderConfirmation, OrderHistory

// 훅
useCheckout, usePayment, useOrderHistory
useOrderConfirmation

// 타입
CheckoutForm, PaymentMethod, Order, OrderHistory
```

#### 사용자 도메인
```typescript
// 컴포넌트
UserProfile, UserDashboard, UserSettings
UserEnrollment, UserProgress

// 훅
useUser, useUserProfile, useUserSettings
useUserEnrollment, useUserProgress

// 타입
User, UserProfile, UserSettings, UserEnrollment
```

### 네이밍 규칙

1. **컴포넌트**: PascalCase, 명사형
2. **훅**: camelCase, `use` 접두사
3. **타입**: PascalCase, 명사형
4. **상수**: UPPER_SNAKE_CASE
5. **함수**: camelCase, 동사형

```typescript
// ✅ 좋은 예
const CourseCard = () => { /* ... */ };
const useCourseData = () => { /* ... */ };
type CourseData = { /* ... */ };
const MAX_COURSES_PER_PAGE = 12;
const formatCoursePrice = (price: number) => { /* ... */ };

// ❌ 나쁜 예
const courseCard = () => { /* ... */ };
const UseCourseData = () => { /* ... */ };
type courseData = { /* ... */ };
const maxCoursesPerPage = 12;
const FormatCoursePrice = (price: number) => { /* ... */ };
```

## 📤 Export 규칙

### 기본 Export 사용

```typescript
// ✅ 좋은 예: 기본 export 사용
// components/CourseCard.tsx
export default function CourseCard({ course }: CourseCardProps) {
  return <div>{/* ... */}</div>;
}

// types/CourseCard.ts
export interface CourseCardProps {
  course: Course;
  onEnroll?: () => void;
}
```

### Named Export 사용 (유틸리티, 훅)

```typescript
// ✅ 좋은 예: named export 사용
// hooks/useCourse.ts
export function useCourse(courseId: string) {
  // ...
}

export function useCourseList() {
  // ...
}

// utils/courseUtils.ts
export function formatCoursePrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(price);
}

export function calculateDiscount(originalPrice: number, discountRate: number): number {
  return originalPrice * (1 - discountRate);
}
```

### Import 규칙

```typescript
// ✅ 좋은 예: 명확한 import
import CourseCard from "@/components/course/CourseCard";
import { useCourse, useCourseList } from "@/hooks/useCourse";
import { formatCoursePrice } from "@/utils/courseUtils";

// ❌ 나쁜 예: 불명확한 import
import CourseCard from "@/components/course";
import { useCourse } from "@/hooks";
import { formatCoursePrice } from "@/utils";
```

## 🎨 Tailwind CSS 사용 가이드

### 컬러 시스템

```css
/* 기본 컬러 사용 */
bg-white, bg-gray-50, bg-gray-100
text-gray-900, text-gray-700, text-gray-500
border-gray-200, border-gray-300

/* 브랜드 컬러 */
bg-blue-500, bg-blue-600, bg-blue-700
text-blue-600, text-blue-700
border-blue-200, border-blue-300

/* 상태 컬러 */
bg-green-100, text-green-800 (성공)
bg-red-100, text-red-800 (에러)
bg-yellow-100, text-yellow-800 (경고)
bg-blue-100, text-blue-800 (정보)
```

### 타이포그래피

```css
/* 제목 */
text-3xl font-bold (h1)
text-2xl font-semibold (h2)
text-xl font-medium (h3)

/* 본문 */
text-base (기본)
text-sm (작은 텍스트)
text-xs (매우 작은 텍스트)

/* 가중치 */
font-light, font-normal, font-medium, font-semibold, font-bold
```

### 레이아웃

```css
/* 컨테이너 */
container mx-auto px-4
max-w-7xl mx-auto px-4

/* 그리드 */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
grid grid-cols-12 gap-4

/* 플렉스 */
flex flex-col gap-4
flex items-center justify-between
flex-1, flex-shrink-0
```

### 반응형 디자인

```css
/* 모바일 우선 */
text-sm md:text-base lg:text-lg
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
p-4 md:p-6 lg:p-8

/* 브레이크포인트 */
sm: (640px+)
md: (768px+)
lg: (1024px+)
xl: (1280px+)
2xl: (1536px+)
```

##  Spacing-First 정책

### 일관된 Spacing 사용

```css
/* 표준 spacing 값 */
space-y-1, space-y-2, space-y-3, space-y-4, space-y-6, space-y-8
gap-1, gap-2, gap-3, gap-4, gap-6, gap-8
p-1, p-2, p-3, p-4, p-6, p-8
m-1, m-2, m-3, m-4, m-6, m-8

/* 컴포넌트별 spacing 가이드 */
/* 카드 내부 */
p-4 md:p-6

/* 섹션 간격 */
py-8 md:py-12

/* 요소 간격 */
space-y-4 md:space-y-6
```

### Spacing 규칙

1. **컴포넌트 내부**: `p-4` 또는 `p-6`
2. **섹션 간격**: `py-8` 또는 `py-12`
3. **요소 간격**: `space-y-4` 또는 `gap-4`
4. **반응형**: 모바일에서 작게, 데스크톱에서 크게

```jsx
// ✅ 좋은 예: 일관된 spacing
function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-sm border">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{course.title}</h3>
        <p className="text-gray-600 text-sm">{course.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">
            {formatCoursePrice(course.price)}
          </span>
          <Button size="sm">수강신청</Button>
        </div>
      </div>
    </div>
  );
}
```

## ⚙️ Next.js 15 특화 설정

### App Router 사용

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 동적 라우트 파라미터 처리

```typescript
// ✅ 올바른 예: Next.js 15
export default async function CoursePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const course = await getCourseById(id);
  
  return <CourseDetail course={course} />;
}

// ❌ 잘못된 예: Next.js 14 이하 방식
export default function CoursePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { id } = params; // 타입 에러 발생
  // ...
}
```

### 이미지 최적화

```jsx
import Image from 'next/image';

// ✅ 좋은 예: Next.js Image 컴포넌트 사용
<Image
  src="/course-thumbnail.jpg"
  alt="강의 썸네일"
  width={300}
  height={200}
  className="rounded-lg"
  priority={isAboveFold}
/>

// ❌ 나쁜 예: 일반 img 태그 사용
<img src="/course-thumbnail.jpg" alt="강의 썸네일" />
```

### 메타데이터 설정

```typescript
// app/course/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseById(id);
  
  return {
    title: `${course.title} - 인프런`,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: [course.thumbnail],
    },
  };
}
```

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈페이지
│   ├── course/[id]/       # 강의 상세 페이지
│   ├── category/[id]/     # 카테고리 페이지
│   ├── checkout/[id]/     # 결제 페이지
│   └── roadmap/           # 로드맵 페이지
├── components/            # 공통 컴포넌트
│   ├── ui/               # shadcn-ui 컴포넌트
│   ├── cart-button.tsx   # 장바구니 버튼
│   ├── like-button.tsx   # 좋아요 버튼
│   └── providers.tsx     # Provider 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── supabase/         # Supabase 클라이언트
│   ├── mock-data.ts      # Mock 데이터
│   ├── types.ts          # 타입 정의
│   └── utils.ts          # 유틸리티 함수
└── public/               # 정적 파일
    ├── *.jpg            # 강의 썸네일 이미지
    └── roadmap/         # 로드맵 관련 이미지
```

### 디렉토리 규칙

1. **app/**: Next.js App Router 페이지
2. **components/**: 재사용 가능한 컴포넌트
3. **lib/**: 유틸리티, 설정, 타입 정의
4. **public/**: 정적 파일 (이미지, 아이콘 등)

## ✅ 최종 체크리스트

### 컴포넌트 작성 시
- [ ] 불필요한 래퍼 컴포넌트를 만들지 않았는가?
- [ ] 컴포넌트 이름이 도메인과 일치하는가?
- [ ] TypeScript 타입을 정의했는가?
- [ ] Tailwind CSS를 사용했는가?
- [ ] 반응형 디자인을 적용했는가?

### 코드 품질
- [ ] ESLint 에러가 없는가?
- [ ] TypeScript 에러가 없는가?
- [ ] 불필요한 추상화를 하지 않았는가?
- [ ] 일관된 네이밍 규칙을 따랐는가?
- [ ] 적절한 spacing을 사용했는가?

### Next.js 15 준수
- [ ] 동적 라우트에서 `await params`를 사용했는가?
- [ ] `next/image`를 사용했는가?
- [ ] 메타데이터를 설정했는가?
- [ ] App Router 구조를 따랐는가?

### 성능 최적화
- [ ] 불필요한 리렌더링을 방지했는가?
- [ ] 이미지를 최적화했는가?
- [ ] 적절한 캐싱을 사용했는가?
- [ ] 번들 크기를 고려했는가?

---

이 가이드라인을 따라 일관되고 유지보수 가능한 코드를 작성하세요. 🚀

---