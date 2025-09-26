# AI 분석 시간 단축 방안
_Exported on 2025. 9. 24. at 21시 4분 13초 GMT+9 from Cursor (1.6.45)_

---

**User**

🐢 AI 분석기 응답 시간, 무엇이 문제일까? (10초의 비밀)
현재 사용자가 결과를 보기까지 약 10초의 시간이 소요되는 현상은 하나의 원인이 아닌, 여러 단계의 작업 시간이 합쳐진 결과입니다. 각 단계별 소요 시간을 분석하고 지연이 가장 큰 범인부터 순서대로 살펴보겠습니다.

🥇 범인 #1: Gemini AI의 두 번에 걸친 분석 작업 (약 7-9초)
가장 결정적인 시간 지연의 원인입니다. 현재 코드는 Gemini AI에게 두 번의 별도 작업을 순차적으로 요청하고 있습니다.

1차 요청 (이미지 검증): "이 이미지가 실제 인물 사진이 맞나요? (Yes/No)" 라는 질문을 먼저 보냅니다. AI는 이미지를 분석하고 답변을 생성합니다. (약 3-4초 소요)

2차 요청 (본 분석): 1차 답변이 'Yes'일 경우, "이제 점수와 코멘트를 포함한 상세 분석을 해주세요." 라는 두 번째 질문을 보냅니다. AI는 다시 이미지를 분석하고 상세한 JSON 결과를 생성합니다. (약 4-5초 소요)

문제점: 똑같은 이미지를 두고 두 번이나 AI 서버와 통신하고, AI가 두 번이나 생각하게 만들고 있습니다. 이는 마치 심부름을 두 번 나눠서 보내는 것과 같아 비효율적입니다.

🥈 범인 #2: 여러 번의 네트워크 통신 (약 1-2초)
사용자의 요청은 우리 서버(Netlify)를 거쳐 Google 서버(Gemini, Apps Script)까지 여러 번의 왕복 여행을 합니다.

클라이언트 → Netlify Function: 사용자의 AI 분석 요청이 우리 서버로 전달됩니다.

Netlify → Gemini API: 우리 서버가 다시 구글 AI 서버로 분석을 요청합니다.

클라이언트 → Apps Script: 동시에, 사용자의 개인정보가 구글 시트로 전송됩니다.

문제점: 각 통신마다 약간의 지연(Latency)이 발생하며, 이들이 합쳐져 무시할 수 없는 시간을 만듭니다.

🥉 범인 #3: 고화질 이미지 업로드 (약 0.5-1초)
사용자가 올린 고화질, 고용량의 사진 원본을 그대로 Netlify 서버와 Gemini API로 전송하고 있습니다.

문제점: 파일 크기가 클수록 업로드에 걸리는 시간이 길어집니다. AI는 프로필 사진을 분석할 때 아주 높은 해상도가 필요하지 않습니다.

✨ 해결 방안: 가장 큰 범인부터 잡자!
가장 큰 문제인 **"AI의 두 번에 걸친 분석 작업"**을 해결하는 것이 가장 효과적입니다.

솔루션: AI에게 한 번에 똑똑하게 질문하기

두 번 나눠서 질문하는 대신, 하나의 프롬프트(지시문)에 검증과 분석을 모두 포함시키는 것입니다.

(기존 방식)

"이거 사람 사진 맞아?" → (AI 답변) → 2. "그럼 이제 분석해줘."

(개선 방식)

"이 사진이 실제 인물 사진일 경우에만 점수와 코멘트를 포함한 상세 분석 결과를 JSON으로 알려줘. 만약 인물 사진이 아니라면, { "isValid": false } 라고만 답해줘."

이 방식을 적용하면 AI와의 통신을 단 한 번으로 줄여, 전체 분석 시간을 약 3-4초 단축시킬 수 있습니다. 이는 사용자가 체감하는 속도를 극적으로 개선할 수 있는 가장 확실한 방법입니다.

제미나이의 제안인데 기존 방식이 매우 비효율적인 것 같으니 수정을 하고 싶다.

---

**Cursor**

지금 코드에서 제미나이 호출 흐름과 프롬프트를 먼저 확인해 볼게요. 이어서 Netlify 함수(`analyzeImage.js`)를 단일 호출 방식으로 리팩터링하겠습니다.

방금 코드 구조를 확인했어요. 이제 `index.html`에서 검증+분석을 하나의 프롬프트로 합치고, 불필요한 1.5초 지연도 제거하겠습니다.

아래 블록으로 그대로 교체해주세요.

```641:693:c:\Users\rckq7\Downloads\[MAJU]\AI-faceshot-analyzer(html,netlify,구글드라이브) - 복사본\index.html
          // 통합 프롬프트 1회 호출 (검증 + 분석)
          const combinedPrompt = `
당신은 프로필 사진 검증 및 평가자입니다. 아래 규칙을 정확히 따르세요.

1) 검증: 입력 이미지는 실제 사람이 찍힌 한 명의 인물 사진이며 프로필 사진으로 적합한가요?
   다음은 부적합: AI 생성물, 그림/일러스트/애니메이션/캐릭터, 유명인, 단체사진, 얼굴 과도한 가림, 심한 저화질/과도한 필터.
   유효하지 않다면 JSON만 반환:
   {
     "isValid": false,
     "reason": "한국어로 짧고 친절하게 부적합 사유를 써주세요"
   }

2) 분석: 유효하다면 JSON만 반환(기타 텍스트/마크다운 금지):
{
  "isValid": true,
  "figureScore": 0-100 정수,
  "backgroundScore": 0-100 정수,
  "vibeScore": 0-100 정수,
  "figureCritique": "한국어로 솔직하지만 귀엽고 친절한 톤",
  "backgroundCritique": "한국어",
  "vibeCritique": "한국어",
  "finalCritique": "한국어 한 문장 요약"
}
요구사항:
- 점수는 반드시 0~100 정수.
- 응답은 JSON만. 마크다운/설명/코드펜스 금지.
          `.trim();

          const resultText = await callGeminiAPI(combinedPrompt, uploadedImageBase64);

          // 혹시 모델이 코드펜스를 붙일 경우 대비한 정리
          const jsonText = resultText.replace(/```json\n?|```/g, "").trim();
          const result = JSON.parse(jsonText);

          if (!result.isValid) {
            showAlert(result.reason || "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요.");
            resetToUpload();
            return;
          }

          // 2단계: 기존 행 업데이트 (DONE)
          const formData = new FormData();
          formData.append("action", "update");
          formData.append("requestId", requestId);
          // 점수
          formData.append("figureScore", result.figureScore);
          formData.append("backgroundScore", result.backgroundScore);
          formData.append("vibeScore", result.vibeScore);
          // 코멘트
          formData.append("figureCritique", result.figureCritique);
          formData.append("backgroundCritique", result.backgroundCritique);
          formData.append("vibeCritique", result.vibeCritique);
          formData.append("finalCritique", result.finalCritique);

          fetch(scriptURL, { method: "POST", body: formData })
            .then((response) =>
              console.log("Submitted to Google Sheet with AI scores", response)
            )
            .catch((error) =>
              console.error("Error submitting to Google Sheet!", error.message)
            );

          displayResults(result);
```

변경 사항
- 두 번의 제미나이 호출(검증→분석)을 하나의 통합 프롬프트로 합쳐 네트워크/추론 시간을 크게 단축.
- 기존 1.5초 인위적 지연을 제거해 즉시 요청 시작.
- 시트 기록 흐름은 그대로 유지: create(메타) → 분석 완료 후 update(점수/코멘트).

테스트 방법
- 실제 인물 사진: 결과가 정상 JSON으로 파싱되고 점수/코멘트가 표시되는지 확인.
- 부적합 이미지(일러스트/캐릭터/단체/유명인): 커스텀 알림 노출 후 업로드 화면으로 복귀하는지 확인.
- 네트워크 실패나 차단 시: 기존 에러 처리(UI 알림) 동작 확인.

추가로 원하시면 다음 단계로 이미지 전송 전 1024px 리사이즈와 JPEG 품질 조정을 넣어 업로드 시간을 더 줄일 수 있어요.

- 변경 요약
  - `index.html`의 분석 구간을 단일 프롬프트/단일 호출로 리팩터링.
  - 불필요한 `setTimeout(1500ms)` 제거.
  - 실패 시 `{ isValid:false, reason }` 처리 로직 추가로 UX 개선.

```plaintext
          // 통합 프롬프트 1회 호출 (검증 + 분석)
          const combinedPrompt = `
당신은 프로필 사진 검증 및 평가자입니다. 아래 규칙을 정확히 따르세요.

1) 검증: 입력 이미지는 실제 사람이 찍힌 한 명의 인물 사진이며 프로필 사진으로 적합한가요?
   다음은 부적합: AI 생성물, 그림/일러스트/애니메이션/캐릭터, 유명인, 단체사진, 얼굴 과도한 가림, 심한 저화질/과도한 필터.
   유효하지 않다면 JSON만 반환:
   {
     "isValid": false,
     "reason": "한국어로 짧고 친절하게 부적합 사유를 써주세요"
   }

2) 분석: 유효하다면 JSON만 반환(기타 텍스트/마크다운 금지):
{
  "isValid": true,
  "figureScore": 0-100 정수,
  "backgroundScore": 0-100 정수,
  "vibeScore": 0-100 정수,
  "figureCritique": "한국어로 솔직하지만 귀엽고 친절한 톤",
  "backgroundCritique": "한국어",
  "vibeCritique": "한국어",
  "finalCritique": "한국어 한 문장 요약"
}
요구사항:
- 점수는 반드시 0~100 정수.
- 응답은 JSON만. 마크다운/설명/코드펜스 금지.
          `.trim();

          const resultText = await callGeminiAPI(combinedPrompt, uploadedImageBase64);

          // 혹시 모델이 코드펜스를 붙일 경우 대비한 정리
          const jsonText = resultText.replace(/```json\n?|```/g, "").trim();
          const result = JSON.parse(jsonText);

          if (!result.isValid) {
            showAlert(result.reason || "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요.");
            resetToUpload();
            return;
          }

          // 2단계: 기존 행 업데이트 (DONE)
          const formData = new FormData();
          formData.append("action", "update");
          formData.append("requestId", requestId);
          // 점수
          formData.append("figureScore", result.figureScore);
          formData.append("backgroundScore", result.backgroundScore);
          formData.append("vibeScore", result.vibeScore);
          // 코멘트
          formData.append("figureCritique", result.figureCritique);
          formData.append("backgroundCritique", result.backgroundCritique);
          formData.append("vibeCritique", result.vibeCritique);
          formData.append("finalCritique", result.finalCritique);

          fetch(scriptURL, { method: "POST", body: formData })
            .then((response) =>
              console.log("Submitted to Google Sheet with AI scores", response)
            )
            .catch((error) =>
              console.error("Error submitting to Google Sheet!", error.message)
            );

          displayResults(result);
```

---

**User**

너는 "figureCritique": "한국어로 솔직하지만 귀엽고 친절한 톤" 을 제안해주었다. 하지만,

`You are a brutally honest but fair profile picture evaluator with a witty and friendly personality. Analyze this image on a scale of 0 to 100 for '인물' (Figure), '배경' (Background), and '감성' (Vibe). Provide the response in a JSON object format. The JSON object must contain these keys: 'figureScore', 'backgroundScore', 'vibeScore', 'figureCritique', 'backgroundCritique', 'vibeCritique', and 'finalCritique'. The critiques must be in Korean, brutally honest, helpful, and written in a cute, friendly tone. The 'finalCritique' must be a single, sharp, and witty summary sentence in Korean.`

바로 이 프롬프트가 신랄하면서도 위트있는 대답으로 고객들을 웃음 짓게할 우리 mvp의 핵심이야. 


---

**Cursor**

좋아요. 그 톤을 그대로 살리면서 “검증+분석”을 한 번에 처리하도록 합치겠습니다. 아래처럼 `index.html`의 해당 구간을 교체하면, 기존의 신랄+위트 톤을 유지하면서도 호출을 1회로 줄일 수 있어요.

```641:693:c:\Users\rckq7\Downloads\[MAJU]\AI-faceshot-analyzer(html,netlify,구글드라이브) - 복사본\index.html
          // 통합 프롬프트 1회 호출 (검증 + 분석, 기존 톤 유지)
          const combinedPrompt = `
You are a brutally honest but fair profile picture evaluator with a witty and friendly personality.
Follow the rules strictly and respond with JSON only.

1) Validation:
- Check if the input image is a real photograph of a single person and suitable for a profile photo.
- Consider invalid if: AI-generated, illustration/anime/character, celebrity, group photo, face severely occluded, extremely low quality, excessive filter.
- If invalid, return ONLY:
{
  "isValid": false,
  "reason": "한국어로 짧고 친절하지만 위트있는 이유"
}

2) Analysis (only if valid):
- Analyze this image on a scale of 0 to 100 for '인물'(Figure), '배경'(Background), and '감성'(Vibe).
- The JSON object MUST contain exactly these keys and only these keys:
{
  "isValid": true,
  "figureScore": 0-100 정수,
  "backgroundScore": 0-100 정수,
  "vibeScore": 0-100 정수,
  "figureCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "backgroundCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "vibeCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "finalCritique": "한국어 한 문장 위트있는 요약"
}
- Scores must be integers in 0~100.
- All text must be in Korean, brutally honest yet fair, witty and friendly.
- Output MUST be JSON only. No markdown, code fences, or extra commentary.
          `.trim();

          const resultText = await callGeminiAPI(combinedPrompt, uploadedImageBase64);

          // 혹시 모델이 코드펜스를 붙일 경우 대비한 정리
          const jsonText = resultText.replace(/```json\n?|```/g, "").trim();
          const result = JSON.parse(jsonText);

          if (!result.isValid) {
            showAlert(result.reason || "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요.");
            resetToUpload();
            return;
          }

          // 2단계: 기존 행 업데이트 (DONE)
          const formData = new FormData();
          formData.append("action", "update");
          formData.append("requestId", requestId);
          // 점수
          formData.append("figureScore", result.figureScore);
          formData.append("backgroundScore", result.backgroundScore);
          formData.append("vibeScore", result.vibeScore);
          // 코멘트
          formData.append("figureCritique", result.figureCritique);
          formData.append("backgroundCritique", result.backgroundCritique);
          formData.append("vibeCritique", result.vibeCritique);
          formData.append("finalCritique", result.finalCritique);

          fetch(scriptURL, { method: "POST", body: formData })
            .then((response) =>
              console.log("Submitted to Google Sheet with AI scores", response)
            )
            .catch((error) =>
              console.error("Error submitting to Google Sheet!", error.message)
            );

          displayResults(result);
```

- 핵심 유지: 기존 영어 프롬프트의 “brutally honest + witty/friendly” 성격을 그대로 사용.
- 최적화: 검증과 분석을 단일 호출로 통합, 불필요한 대기 제거.
- 실패 UX: `isValid:false` 시 사유를 한국어로 위트 있게 안내.

```plaintext
          // 통합 프롬프트 1회 호출 (검증 + 분석, 기존 톤 유지)
          const combinedPrompt = `
You are a brutally honest but fair profile picture evaluator with a witty and friendly personality.
Follow the rules strictly and respond with JSON only.

1) Validation:
- Check if the input image is a real photograph of a single person and suitable for a profile photo.
- Consider invalid if: AI-generated, illustration/anime/character, celebrity, group photo, face severely occluded, extremely low quality, excessive filter.
- If invalid, return ONLY:
{
  "isValid": false,
  "reason": "한국어로 짧고 친절하지만 위트있는 이유"
}

2) Analysis (only if valid):
- Analyze this image on a scale of 0 to 100 for '인물'(Figure), '배경'(Background), and '감성'(Vibe).
- The JSON object MUST contain exactly these keys and only these keys:
{
  "isValid": true,
  "figureScore": 0-100 정수,
  "backgroundScore": 0-100 정수,
  "vibeScore": 0-100 정수,
  "figureCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "backgroundCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "vibeCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "finalCritique": "한국어 한 문장 위트있는 요약"
}
- Scores must be integers in 0~100.
- All text must be in Korean, brutally honest yet fair, witty and friendly.
- Output MUST be JSON only. No markdown, code fences, or extra commentary.
          `.trim();

          const resultText = await callGeminiAPI(combinedPrompt, uploadedImageBase64);

          // 혹시 모델이 코드펜스를 붙일 경우 대비한 정리
          const jsonText = resultText.replace(/```json\n?|```/g, "").trim();
          const result = JSON.parse(jsonText);

          if (!result.isValid) {
            showAlert(result.reason || "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요.");
            resetToUpload();
            return;
          }

          // 2단계: 기존 행 업데이트 (DONE)
          const formData = new FormData();
          formData.append("action", "update");
          formData.append("requestId", requestId);
          // 점수
          formData.append("figureScore", result.figureScore);
          formData.append("backgroundScore", result.backgroundScore);
          formData.append("vibeScore", result.vibeScore);
          // 코멘트
          formData.append("figureCritique", result.figureCritique);
          formData.append("backgroundCritique", result.backgroundCritique);
          formData.append("vibeCritique", result.vibeCritique);
          formData.append("finalCritique", result.finalCritique);

          fetch(scriptURL, { method: "POST", body: formData })
            .then((response) =>
              console.log("Submitted to Google Sheet with AI scores", response)
            )
            .catch((error) =>
              console.error("Error submitting to Google Sheet!", error.message)
            );

          displayResults(result);
```

---

**User**

오케이 이걸로 수정하자

---

**Cursor**

먼저 `index.html`에서 제미나이 두 단계 호출 구간을 단일 통합 프롬프트로 리팩터링하고, 1.5초 지연을 제거하겠습니다. 이어서 파일을 편집합니다.

방금 통합 프롬프트로 수정하기 위해 해당 구간의 정확한 내용을 다시 확인하겠습니다. 이어서 같은 자리에서 코드를 교체하겠습니다.

지금 통합 프롬프트로 리팩터링을 적용하기 위해 `index.html`의 해당 코드 블록 위치를 정확히 찾겠습니다. 그 다음 즉시 해당 구간을 교체하겠습니다.

지금 `index.html`에서 검증과 분석을 하나의 통합 프롬프트로 바꾸고, 1.5초 지연과 2단계 호출을 제거하는 편집을 적용하겠습니다.

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>💖 AI 프로필 사진 분석기 💖</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script
      src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js"
      defer
    ></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        font-family: "Gamja Flower", cursive;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgb(253, 242, 248);
      }

      /* 메인 타이틀 반응형 스타일 */
      .main-title {
        font-size: clamp(0.9rem, 6.5vw, 3rem);
        line-height: 1.1;
        white-space: nowrap;
      }

      /* 메인 컨테이너 - 중앙 정렬 보장 */
      .main-container {
        width: 100%;
        max-width: 400px;
        margin: 0 auto;
        padding: 1.5rem;
        background: white;
        border-radius: 1.5rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        position: relative;
        overflow: hidden;
      }

      /* 전체 래퍼 */
      .app-wrapper {
        width: 100%;
        max-width: 400px;
        margin: 1rem;
      }
      /* 반응형 컨테이너 너비 */
      @media (min-width: 480px) {
        .app-wrapper,
        .main-container {
          max-width: 480px;
        }
      }
      @media (min-width: 640px) {
        .app-wrapper,
        .main-container {
          max-width: 560px;
        }
      }
      @media (min-width: 768px) {
        .app-wrapper,
        .main-container {
          max-width: 640px;
        }
      }
      @media (min-width: 1024px) {
        .app-wrapper,
        .main-container {
          max-width: 720px;
        }
      }
      @media (min-width: 1280px) {
        .app-wrapper,
        .main-container {
          max-width: 800px;
        }
      }
      /* 귀여운 로딩 애니메이션 */
      .bouncing-loader {
        display: flex;
        justify-content: center;
      }
      .bouncing-loader > div {
        width: 20px;
        height: 20px;
        margin: 3px 6px;
        border-radius: 50%;
        background-color: #fca5a5; /* red-300 */
        opacity: 1;
        animation: bouncing-loader 0.8s infinite alternate;
      }
      .bouncing-loader > div:nth-child(2) {
        animation-delay: 0.2s;
      }
      .bouncing-loader > div:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes bouncing-loader {
        to {
          opacity: 0.1;
          transform: translateY(-16px);
        }
      }
      /* 결과 점수 바 애니메이션 */
      @keyframes fill-bar {
        from {
          width: 0%;
        }
        to {
          width: var(--target-width);
        }
      }
      .score-bar-fill {
        animation: fill-bar 1.5s ease-out forwards;
      }
      /* 화면 전환 효과 */
      .view-section {
        transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
      }
      .view-section.hidden {
        opacity: 0;
        transform: scale(0.95);
        pointer-events: none;
        position: absolute;
      }
    </style>
  </head>
  <body>
    <div class="app-wrapper">
      <div class="main-container">
        <!-- Initial Upload View -->
        <div id="upload-section" class="view-section">
          <div class="text-center">
            <h1 class="main-title font-bold text-gray-800">
              ✨ AI 프로필 사진 분석기 ✨
            </h1>
            <p class="text-gray-500 mt-2 text-lg">
              당신의 매력, AI가 찾아드려요!
            </p>
          </div>
          <div class="mt-8">
            <div
              class="w-full h-64 border-2 border-dashed border-pink-300 rounded-2xl flex items-center justify-center bg-pink-100 bg-opacity-50"
            >
              <img
                id="image-preview"
                src=""
                alt="Image preview"
                class="hidden max-h-full max-w-full rounded-lg"
              />
              <div id="upload-placeholder" class="text-center text-pink-400">
                <svg
                  class="mx-auto h-16 w-16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                  />
                </svg>
                <p class="mt-2 text-xl">클릭해서 사진 올리기!</p>
              </div>
            </div>
          </div>
          <div class="mt-6 space-y-3">
            <input
              type="file"
              id="image-upload"
              class="hidden"
              accept="image/*"
            />
            <button
              onclick="document.getElementById('image-upload').click()"
              class="w-full bg-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              앨범에서 사진 선택 💖
            </button>
            <button
              id="next-button"
              class="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-slate-900 transition-all duration-300 transform hover:scale-105 shadow-lg hidden"
            >
              정보 입력하고 결과보기 ✨
            </button>
          </div>
        </div>

        <!-- Contact Info View -->
        <div id="contact-section" class="view-section hidden">
          <div class="text-center">
            <h2 class="text-3xl font-bold text-gray-800">
              결과를 보기 전, 마지막 단계!
            </h2>
            <p class="text-gray-500 mt-4 text-lg">
              개인정보를 입력해주셔야 결과를 보실 수 있습니다.<br />
              결과가 나오기 까지 약 6초가 소요됩니다.
            </p>
          </div>
          <form id="contact-form" class="space-y-4 mt-8" novalidate>
            <input
              type="text"
              id="user-name"
              placeholder="이름 (한글/영문만 가능)"
              class="w-full text-lg p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              required
            />
            <input
              type="tel"
              id="user-contact"
              placeholder="010-1234-5678"
              maxlength="13"
              class="w-full text-lg p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              required
            />
            <div
              class="flex items-start space-x-3 rounded-lg bg-gray-50 p-3 border border-gray-200"
            >
              <input
                id="contact-consent"
                type="checkbox"
                class="mt-1 h-5 w-5 text-fuchsia-500 border-gray-300 rounded"
              />
              <label
                for="contact-consent"
                class="text-gray-700 text-base leading-6"
              >
                개인정보 수집 및 이용에 동의합니다.
                <span class="text-gray-400 text-sm block"
                  >이름, 연락처, 업로드한 사진은 결과 생성 및 서비스 고도화
                  목적에만 사용됩니다.
                  <a
                    href="privacy.html"
                    target="_blank"
                    class="text-fuchsia-600 underline"
                    >자세히 보기</a
                  >
                </span>
              </label>
            </div>
            <button
              type="submit"
              class="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-900 transition-colors text-lg"
            >
              결과 분석 시작하기 🚀
            </button>
          </form>
          <p
            id="form-success-message"
            class="text-center text-green-600 mt-4 hidden"
          >
            정보가 성공적으로 제출되었습니다!
          </p>
        </div>

        <!-- Loading View -->
        <div id="loading-section" class="view-section hidden text-center py-16">
          <div class="bouncing-loader mx-auto">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p class="text-gray-600 font-semibold text-2xl mt-8">
            AI가 당신의 매력을 스캔 중이에요! ✨
          </p>
          <p class="text-gray-400 mt-2 text-lg">
            두근두근... 잠시만 기다려주세요!
          </p>
        </div>

        <!-- Result View -->
        <div id="result-section" class="view-section hidden">
          <div class="text-center">
            <h2 class="text-3xl font-bold text-gray-800">AI 분석 결과!</h2>
            <img
              id="result-image"
              src=""
              alt="Analyzed image"
              class="mt-4 w-48 h-48 mx-auto rounded-full object-cover shadow-2xl border-4 border-white"
            />
          </div>

          <div class="mt-8 space-y-6">
            <!-- 인물 점수 -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-bold text-xl text-gray-700">🤵 인물</h3>
                <span
                  id="figure-score"
                  class="font-bold text-xl text-fuchsia-500"
                ></span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-5">
                <div
                  id="figure-bar"
                  class="bg-fuchsia-500 h-5 rounded-full score-bar-fill"
                  style="width: 0%"
                ></div>
              </div>
              <p
                id="figure-critique"
                class="text-base text-gray-700 mt-2 p-3 bg-fuchsia-50 rounded-lg"
              ></p>
            </div>
            <!-- 배경 점수 -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-bold text-xl text-gray-700">🏞️ 배경</h3>
                <span
                  id="background-score"
                  class="font-bold text-xl text-emerald-500"
                ></span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-5">
                <div
                  id="background-bar"
                  class="bg-emerald-500 h-5 rounded-full score-bar-fill"
                  style="width: 0%"
                ></div>
              </div>
              <p
                id="background-critique"
                class="text-base text-gray-700 mt-2 p-3 bg-emerald-50 rounded-lg"
              ></p>
            </div>
            <!-- 감성 점수 -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-bold text-xl text-gray-700">✨ 감성</h3>
                <span
                  id="vibe-score"
                  class="font-bold text-xl text-amber-500"
                ></span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-5">
                <div
                  id="vibe-bar"
                  class="bg-amber-500 h-5 rounded-full score-bar-fill"
                  style="width: 0%"
                ></div>
              </div>
              <p
                id="vibe-critique"
                class="text-base text-gray-700 mt-2 p-3 bg-amber-50 rounded-lg"
              ></p>
            </div>
          </div>

          <div class="mt-8 text-center bg-gray-100 p-4 rounded-xl shadow-inner">
            <h3 class="font-bold text-gray-800 text-lg">AI의 최종 한 줄 평</h3>
            <p id="final-critique" class="text-xl mt-2 text-gray-700 italic">
              "
            </p>
          </div>

          <div
            class="mt-8 text-center border-t-2 border-dashed border-pink-200 pt-6"
          >
            <h3 class="text-2xl font-bold text-gray-800">
              베럴댄미 : 남성그루밍 프로필 서비스
            </h3>
            <p class="text-gray-600 mt-2 text-lg">
              인생 프로필 사진, 전문가와 함께!
            </p>
            <div class="flex justify-center space-x-4 mt-4">
              <a
                href="https://www.instagram.com/better.than.me2040/"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-gradient-to-r from-pink-500 to-orange-400 text-white py-2 px-5 rounded-lg hover:shadow-lg transition-shadow text-base"
                >인스타그램</a
              >
              <a
                href="https://open.kakao.com/o/sDAisnDh"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-yellow-400 text-gray-800 py-2 px-5 rounded-lg hover:shadow-lg transition-shadow text-base"
                >오픈채팅</a
              >
            </div>
            <p class="text-sm text-gray-500 mt-2">
              프로필사진 및 냉정한 외모평가를 원한다면 오픈채팅으로 연락주세요
            </p>
          </div>

          <div class="mt-6 text-center">
            <button
              onclick="resetApp()"
              class="w-full bg-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              다른 사진으로 또 하기! 📸
            </button>
          </div>
        </div>

        <!-- Custom Alert Modal -->
        <div
          id="alert-modal"
          class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div
            class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center transform transition-all animate-in zoom-in-75"
          >
            <p id="alert-message" class="text-gray-700 text-xl"></p>
            <button
              onclick="closeModal()"
              class="mt-8 bg-fuchsia-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-fuchsia-600 transition-colors text-lg"
            >
              알겠어요!
            </button>
          </div>
        </div>
      </div>
    </div>

    <script>
      const uploadSection = document.getElementById("upload-section");
      const contactSection = document.getElementById("contact-section");
      const loadingSection = document.getElementById("loading-section");
      const resultSection = document.getElementById("result-section");
      const imageUpload = document.getElementById("image-upload");
      const imagePreview = document.getElementById("image-preview");
      const uploadPlaceholder = document.getElementById("upload-placeholder");
      const nextButton = document.getElementById("next-button");
      const resultImage = document.getElementById("result-image");
      const contactForm = document.getElementById("contact-form");

      const alertModal = document.getElementById("alert-modal");
      const alertMessage = document.getElementById("alert-message");

      let uploadedImageBase64 = null;
      // 요청 상관관계를 위한 고유 ID 생성 (두 단계 전송에 사용)
      let requestId =
        crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      // Google Apps Script 웹앱 URL (시트 기록용)
      const scriptURL =
        "https://script.google.com/macros/s/AKfycbzeqSuS9PKnpesHA-XLXmch_pVLPYG190-k9SGMwsv37JS0moJrvkLiVIxj63UgFx1Q/exec";

      // 방문자/환경 메타 수집 (clientId + FingerprintJS + IP/UA/lang/referrer)
      window.__clientId =
        localStorage.getItem("clientId") ||
        (() => {
          const id =
            crypto && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          try {
            localStorage.setItem("clientId", id);
          } catch (_) {}
          return id;
        })();
      window.__ua = navigator.userAgent;
      window.__lang =
        navigator.language ||
        (navigator.languages && navigator.languages[0]) ||
        "";
      window.__referrer = document.referrer || "";

      window.__visitorId = "";
      if (window.FingerprintJS && FingerprintJS.load) {
        FingerprintJS.load()
          .then((fp) => fp.get())
          .then((res) => {
            window.__visitorId = res.visitorId;
          })
          .catch(() => {});
      }

      window.__clientIp = "";
      fetch("https://api.ipify.org?format=json")
        .then((r) => r.json())
        .then((d) => {
          window.__clientIp = d.ip;
        })
        .catch(() => {});

      // 이미지 업로드 처리
      imageUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            uploadedImageBase64 = e.target.result;
            imagePreview.src = uploadedImageBase64;
            imagePreview.classList.remove("hidden");
            uploadPlaceholder.classList.add("hidden");
            nextButton.classList.remove("hidden");
          };
          reader.readAsDataURL(file);
        }
      });

      // '정보 입력' 버튼 클릭 -> 연락처 폼으로 이동
      nextButton.addEventListener("click", () => {
        if (!uploadedImageBase64) {
          showAlert("먼저 사진을 선택해주세요!");
          return;
        }
        switchView("contact-section");
      });

      // 연락처 입력 자동 포맷팅
      document
        .getElementById("user-contact")
        .addEventListener("input", (event) => {
          let value = event.target.value.replace(/[^0-9]/g, ""); // 숫자만 남기기

          if (value.length >= 3) {
            value = value.substring(0, 3) + "-" + value.substring(3);
          }
          if (value.length >= 8) {
            value = value.substring(0, 8) + "-" + value.substring(8, 12);
          }

          event.target.value = value;
        });

      // 이름 유효성 검사 함수
      function validateName(name) {
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

      // 연락처 유효성 검사 함수
      function validatePhoneNumber(phone) {
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        return phoneRegex.test(phone);
      }

      // 연락처 폼 제출 -> 분석 시작
      contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("user-name").value;
        const contact = document.getElementById("user-contact").value;

        if (!name || !contact) {
          showAlert("이름과 연락처를 모두 입력해주세요!");
          return;
        }

        if (!validateName(name)) {
          showAlert(
            "올바른 사람 이름을 입력해주세요! 의성어나 무의미한 문자는 사용할 수 없습니다."
          );
          return;
        }

        if (!validatePhoneNumber(contact)) {
          showAlert("연락처는 010-1234-5678 형식으로 입력해주세요!");
          return;
        }

        const consentChecked =
          document.getElementById("contact-consent")?.checked;
        if (!consentChecked) {
          showAlert("개인정보 수집 및 이용에 동의해주세요.");
          return;
        }

        // UI 상태 변경: 로딩
        switchView("loading-section");

        // 1단계: 개인정보 먼저 기록 (PENDING)
        const createFD = new FormData();
        createFD.append("action", "create");
        createFD.append("requestId", requestId);
        createFD.append("name", name);
        createFD.append("contact", contact);
        createFD.append("timestamp", new Date().toLocaleString("ko-KR"));
        createFD.append("image", uploadedImageBase64);
        createFD.append("consent", consentChecked ? "Y" : "N");
        // 방문자 메타 (지문 + 클라이언트ID + 환경)
        createFD.append("clientId", window.__clientId || "");
        createFD.append("visitorId", window.__visitorId || "");
        createFD.append("ip", window.__clientIp || "");
        createFD.append("ua", window.__ua || "");
        createFD.append("lang", window.__lang || "");
        createFD.append("referrer", window.__referrer || "");
        try {
          await fetch(scriptURL, { method: "POST", body: createFD });
        } catch (_) {
          // 개인정보 기록 실패 시에도 분석은 계속 시도 (이후 재시도 가능)
        }

        // (변경) 시트 점수/코멘트 전송은 분석 완료 후 2단계에서 수행합니다

        try {
          const combinedPrompt = `
You are a brutally honest but fair profile picture evaluator with a witty and friendly personality.
Follow the rules strictly and respond with JSON only.

1) Validation:
- Check if the input image is a real photograph of a single person and suitable for a profile photo.
- Consider invalid if: AI-generated, illustration/anime/character, celebrity, group photo, face severely occluded, extremely low quality, excessive filter.
- If invalid, return ONLY:
{
  "isValid": false,
  "reason": "한국어로 짧고 친절하지만 위트있는 이유"
}

2) Analysis (only if valid):
- Analyze this image on a scale of 0 to 100 for '인물'(Figure), '배경'(Background), and '감성'(Vibe).
- The JSON object MUST contain exactly these keys and only these keys:
{
  "isValid": true,
  "figureScore": 0-100 정수,
  "backgroundScore": 0-100 정수,
  "vibeScore": 0-100 정수,
  "figureCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "backgroundCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "vibeCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "finalCritique": "한국어 한 문장 위트있는 요약"
}
- Scores must be integers in 0~100.
- All text must be in Korean, brutally honest yet fair, witty and friendly.
- Output MUST be JSON only. No markdown, code fences, or extra commentary.
          `.trim();

          const resultText = await callGeminiAPI(
            combinedPrompt,
            uploadedImageBase64
          );

          const jsonString = resultText.replace(/```json\n?|```/g, "").trim();
          const result = JSON.parse(jsonString);

          if (!result.isValid) {
            showAlert(result.reason || "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요.");
            resetToUpload();
            return;
          }

          // 2단계: 기존 행 업데이트 (DONE)
          const formData = new FormData();
          formData.append("action", "update");
          formData.append("requestId", requestId);
          // 점수
          formData.append("figureScore", result.figureScore);
          formData.append("backgroundScore", result.backgroundScore);
          formData.append("vibeScore", result.vibeScore);
          // 코멘트
          formData.append("figureCritique", result.figureCritique);
          formData.append("backgroundCritique", result.backgroundCritique);
          formData.append("vibeCritique", result.vibeCritique);
          formData.append("finalCritique", result.finalCritique);

          fetch(scriptURL, { method: "POST", body: formData })
            .then((response) =>
              console.log("Submitted to Google Sheet with AI scores", response)
            )
            .catch((error) =>
              console.error("Error submitting to Google Sheet!", error.message)
            );

          displayResults(result);
        } catch (error) {
          console.error("Error during analysis:", error);
          // showAlert("분석 중 오류가 발생했어요. 다시 시도해 주세요!");
          resetToUpload();
        }
      });

      // Gemini API 호출 함수 (수정됨)
      async function callGeminiAPI(prompt, imageBase64) {
        const apiUrl = `/.netlify/functions/analyzeImage`;
        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // *** FIX: prompt와 imageBase64를 함께 보냅니다. ***
            body: JSON.stringify({
              prompt: prompt, // <-- 이 부분을 추가!
              imageBase64: imageBase64,
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Serverless function failed with status ${response.status}`
            );
          }

          const result = await response.json();

          // AI가 유해성 등으로 답변을 거부했을 경우의 처리
          if (result.promptFeedback && result.promptFeedback.blockReason) {
            console.error(
              "Analysis blocked by API:",
              result.promptFeedback.blockReason
            );
            showAlert("AI가 분석을 거부했어요. 다른 사진으로 시도해보세요.");
            throw new Error("API content blocked");
          }

          if (result.candidates && result.candidates[0].content.parts[0].text) {
            return result.candidates[0].content.parts[0].text;
          } else {
            throw new Error(
              "Invalid API response format from serverless function"
            );
          }
        } catch (error) {
          console.error("Error calling serverless function:", error);
          if (error.message !== "API content blocked") {
            showAlert(
              "분석 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            );
          }
          throw error; // 오류를 다시 던져서 후속 처리를 막습니다.
        }
      }

      // 결과 표시 함수
      function displayResults(data) {
        resultImage.src = uploadedImageBase64;

        document.getElementById(
          "figure-score"
        ).textContent = `${data.figureScore}점`;
        document.getElementById(
          "background-score"
        ).textContent = `${data.backgroundScore}점`;
        document.getElementById(
          "vibe-score"
        ).textContent = `${data.vibeScore}점`;

        const figureBar = document.getElementById("figure-bar");
        const backgroundBar = document.getElementById("background-bar");
        const vibeBar = document.getElementById("vibe-bar");

        // 애니메이션을 위해 스타일 변수 설정
        figureBar.style.setProperty("--target-width", `${data.figureScore}%`);
        backgroundBar.style.setProperty(
          "--target-width",
          `${data.backgroundScore}%`
        );
        vibeBar.style.setProperty("--target-width", `${data.vibeScore}%`);

        document.getElementById("figure-critique").textContent =
          data.figureCritique;
        document.getElementById("background-critique").textContent =
          data.backgroundCritique;
        document.getElementById("vibe-critique").textContent =
          data.vibeCritique;
        document.getElementById(
          "final-critique"
        ).textContent = `"${data.finalCritique}"`;

        // UI 상태 변경: 결과
        switchView("result-section");
      }

      // 커스텀 알림창 보이기
      function showAlert(message) {
        alertMessage.textContent = message;
        alertModal.classList.remove("hidden");
      }

      // 커스텀 알림창 닫기
      function closeModal() {
        alertModal.classList.add("hidden");
      }

      function switchView(viewId) {
        document.querySelectorAll(".view-section").forEach((section) => {
          section.classList.add("hidden");
        });
        document.getElementById(viewId).classList.remove("hidden");
      }

      // 초기 업로드 화면으로 리셋
      function resetToUpload() {
        switchView("upload-section");
      }

      // 전체 앱 리셋
      function resetApp() {
        uploadedImageBase64 = null;
        imagePreview.src = "";
        imagePreview.classList.add("hidden");
        uploadPlaceholder.classList.remove("hidden");
        nextButton.classList.add("hidden");
        contactForm.reset();
        resetToUpload();
      }
    </script>
  </body>
</html>

```

방금 `index.html`에서 검증+분석을 단일 통합 프롬프트로 교체하고, 인위적 1.5초 지연 및 이중 Gemini 호출을 제거했습니다. 새 코드가 문법/린트 오류 없이 동작하는지 확인하겠습니다.

- 적용 완료: `index.html`에서 두 단계 제미나이 호출을 단일 통합 프롬프트로 리팩터링, 1.5초 지연 제거, `isValid:false` 처리 및 기존 시트 업데이트 흐름 유지.

테스트 팁
- 실제 인물 사진: 결과 JSON 파싱 후 점수/코멘트 표시되는지 확인.
- 부적합 이미지: 위트 있는 사유로 알림 후 업로드 화면 복귀.
- 오류/차단: 기존 알림 동작 확인.

추가 최적화 원하면 알려줘요
- 이미지 업로드 전 1024px 리사이즈 + JPEG 품질 0.8로 전송시간 단축
- Netlify 함수에서 `flash` 모델 유지/업데이트, 안전설정 최적화
- 프런트에서 타임아웃/재시도 백오프 추가

---

**User**

그 질문에 대한 답을 드리기 전에, 먼저 `index.html`에서 Gemini API를 호출하는 부분을 확인했습니다.

```javascript
const apiUrl = `/.netlify/functions/analyzeImage`;
```

이 코드는 Netlify 서버에 있는 `analyzeImage.js`라는 함수를 호출하는 방식입니다. **따라서 실제 어떤 Gemini 모델을 사용하는지는 `index.html`이 아니라, 서버 파일인 `analyzeImage.js`에 정의되어 있습니다.**

제가 이전에 속도 개선을 위해 보내드렸던 `analyzeImage.js` 코드에는 `gemini-pro-vision` 모델을 사용하도록 되어 있었습니다.

이제 질문에 답변을 드리면,

> **"지금까지 적용한 방법은 범인 \#1, 범인 \#2를 해결한 건가?"**

**절반만 맞습니다.**

  - **범인 \#1 (AI의 두 번에 걸친 분석):**

      - **네, 완벽하게 해결했습니다\!** 👍
      - 이미지 검증과 본 분석을 하나의 프롬프트로 통합하여 Gemini AI와의 통신을 두 번에서 한 번으로 줄였습니다. 이것이 가장 큰 속도 개선을 가져온 핵심적인 변화입니다.

  - **범인 \#2 (여러 번의 네트워크 통신):**

      - **아니요, 아직 해결되지 않았습니다.**
      - 현재 구조는 여전히 **두 개의 다른 서버(Netlify, Apps Script)와 각각 통신**하고 있습니다.
        1.  **AI 분석 요청:** 클라이언트 → Netlify 서버 → Gemini 서버
        2.  **데이터 저장 요청:** 클라이언트 → Apps Script 서버 → Google Sheets 서버
      - 이 두 요청이 거의 동시에 출발하기 때문에 네트워크 지연 문제는 여전히 남아있습니다.

### 💡 범인 \#2를 해결하는 방법: "서버에서 모든 일 처리하기"

이 문제를 근본적으로 해결하려면, 현재 분리된 두 작업을 **하나의 창구에서 모두 처리**하도록 만들어야 합니다.

**개선된 흐름:**

1.  사용자는 오직 **Netlify 서버에만** 모든 정보(이미지, 이름, 연락처 등)를 담아 단 한 번의 요청을 보냅니다.
2.  Netlify 서버(`analyzeImage.js`)는 요청을 받은 뒤, **두 가지 일을 순서대로 처리**합니다.
      - **첫 번째 임무:** 받은 정보를 Google Apps Script로 전달하여 시트에 기록합니다.
      - **두 번째 임무:** Google Gemini API를 호출하여 이미지를 분석합니다.
3.  모든 작업이 끝나면, 최종 분석 결과를 사용자에게 한 번에 돌려줍니다.

**장점:**

  - **단순함:** 클라이언트(`index.html`)는 이제 Netlify 서버와만 통신하면 되므로 코드가 훨씬 깨끗하고 단순해집니다.
  - **안정성:** 모든 작업이 서버에서 순차적으로 일어나므로 데이터 누락 등의 위험이 줄어듭니다.
  - **보안:** Google Apps Script의 웹 앱 URL이 `index.html`에서 완전히 사라지므로 외부에 노출되지 않아 보안에 더 유리합니다.

이 방식은 조금 더 복잡한 서버 코드가 필요하지만, 시스템을 훨씬 더 안정적이고 효율적으로 만들어줍니다.

이 방법을 위해서 어떻게 해야할까?

---

**Cursor**

Let me update the Netlify function to handle both the Apps Script create/update and the Gemini analysis in one request, and refactor index.html to send all data to the server and stop calling Apps Script directly.

I'll update the server to handle both Apps Script logging and Gemini analysis in one request, and refactor the client to send all data to the server and stop calling Apps Script directly.

서버에서 시트 기록(create/update)와 Gemini 분석을 한 번에 처리하도록 함수와 클라이언트를 동시에 수정하겠습니다. Netlify 함수에 Apps Script 연동을 추가하고, 클라이언트에서는 Apps Script 직접 호출을 제거하고 필요한 메타 정보를 서버로 전송하도록 리팩터링합니다.

이제 서버 함수와 클라이언트 코드를 동시에 수정해, Netlify 함수가 Apps Script 기록과 Gemini 분석을 모두 처리하도록 구현하겠습니다.

이제 Netlify 함수가 Apps Script 로깅과 Gemini 분석을 모두 처리하도록 서버 코드를 확장하고, 프런트엔드에서 Apps Script 직접 호출을 제거하는 리팩터링을 적용하겠습니다.

Netlify 함수가 Apps Script 로깅과 Gemini 분석을 순차 처리하도록 수정하고, 클라이언트에서 Apps Script 직접 호출을 제거해 단일 서버 요청으로 바꾸겠습니다. 두 파일을 동시에 편집합니다.

방금 서버/클라이언트 흐름을 확인했고, 이제 “범인 #2”를 제거하기 위해 서버(Netlify 함수)에서 시트 기록(create/update)과 Gemini 분석을 모두 처리하도록 리팩터링 코드를 드립니다. 클라이언트(`index.html`)는 Netlify 함수 한 군데만 호출하게 됩니다. [[memory:9269685]] [[memory:9267201]] [[memory:9269126]]

### 1) Netlify 함수 교체: `netlify/functions/analyzeImage.js`
- Apps Script 호출을 서버로 이동 (환경변수 `APPS_SCRIPT_URL` 사용)
- 통합 프롬프트로 Gemini 분석
- isValid=false면 update 생략, isValid=true면 update 수행
- 하위 호환: 기존 `prompt + imageBase64` 직접 호출도 계속 동작

```javascript
exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || '{}');

    const apiKey = process.env.GEMINI_API_KEY;
    const appsScriptUrl = process.env.APPS_SCRIPT_URL; // 시트 기록용
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }) };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // 하위 호환: 기존 방식(prompt + imageBase64)을 그대로 처리
    if (body.prompt && body.imageBase64 && !body.mode) {
      const payload = {
        contents: [
          {
            parts: [
              { text: body.prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: body.imageBase64.split(",")[1],
                },
              },
            ],
          },
        ],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      };
      const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      return { statusCode: response.status, body: JSON.stringify(result) };
    }

    // 통합 흐름: 서버가 시트 create/update + Gemini 분석 처리
    const {
      mode,
      requestId,
      name,
      contact,
      timestamp,
      imageBase64,
      consent,
      clientId,
      visitorId,
      ip,
      ua,
      lang,
      referrer,
    } = body;

    if (mode !== "full") {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid request: expected mode 'full' or {prompt,imageBase64}" }) };
    }
    if (!imageBase64 || !requestId || !name || !contact) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields (imageBase64, requestId, name, contact)" }) };
    }

    // 1) 시트 create (Apps Script가 설정된 경우)
    if (appsScriptUrl) {
      try {
        const fdCreate = new FormData();
        fdCreate.append("action", "create");
        fdCreate.append("requestId", requestId);
        fdCreate.append("name", name);
        fdCreate.append("contact", contact);
        fdCreate.append("timestamp", timestamp || new Date().toLocaleString("ko-KR"));
        fdCreate.append("image", imageBase64);
        fdCreate.append("consent", consent ? "Y" : "N");
        fdCreate.append("clientId", clientId || "");
        fdCreate.append("visitorId", visitorId || "");
        fdCreate.append("ip", ip || "");
        fdCreate.append("ua", ua || "");
        fdCreate.append("lang", lang || "");
        fdCreate.append("referrer", referrer || "");
        await fetch(appsScriptUrl, { method: "POST", body: fdCreate });
      } catch (_) {
        // 로깅 실패는 분석을 막지 않음
      }
    }

    // 2) Gemini 통합 프롬프트 분석
    const combinedPrompt = `
You are a brutally honest but fair profile picture evaluator with a witty and friendly personality.
Follow the rules strictly and respond with JSON only.

1) Validation:
- Check if the input image is a real photograph of a single person and suitable for a profile photo.
- Consider invalid if: AI-generated, illustration/anime/character, celebrity, group photo, face severely occluded, extremely low quality, excessive filter.
- If invalid, return ONLY:
{
  "isValid": false,
  "reason": "한국어로 짧고 친절하지만 위트있는 이유"
}

2) Analysis (only if valid):
- Analyze this image on a scale of 0 to 100 for '인물'(Figure), '배경'(Background), and '감성'(Vibe).
- The JSON object MUST contain exactly these keys and only these keys:
{
  "isValid": true,
  "figureScore": 0-100 정수,
  "backgroundScore": 0-100 정수,
  "vibeScore": 0-100 정수,
  "figureCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "backgroundCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "vibeCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "finalCritique": "한국어 한 문장 위트있는 요약"
}
- Scores must be integers in 0~100.
- All text must be in Korean, brutally honest yet fair, witty and friendly.
- Output MUST be JSON only. No markdown, code fences, or extra commentary.
    `.trim();

    const payload = {
      contents: [
        {
          parts: [
            { text: combinedPrompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(",")[1],
              },
            },
          ],
        },
      ],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };

    const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const gemini = await response.json();

    const text = gemini?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonText = (text || "").replace(/```json\\n?|```/g, "").trim();
    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonText);
    } catch (_) {
      return { statusCode: 502, body: JSON.stringify({ error: "Invalid Gemini response", raw: gemini }) };
    }

    // 3) 시트 update (isValid일 때만)
    if (appsScriptUrl && analysisResult?.isValid) {
      try {
        const fdUpdate = new FormData();
        fdUpdate.append("action", "update");
        fdUpdate.append("requestId", requestId);
        fdUpdate.append("figureScore", analysisResult.figureScore);
        fdUpdate.append("backgroundScore", analysisResult.backgroundScore);
        fdUpdate.append("vibeScore", analysisResult.vibeScore);
        fdUpdate.append("figureCritique", analysisResult.figureCritique);
        fdUpdate.append("backgroundCritique", analysisResult.backgroundCritique);
        fdUpdate.append("vibeCritique", analysisResult.vibeCritique);
        fdUpdate.append("finalCritique", analysisResult.finalCritique);
        await fetch(appsScriptUrl, { method: "POST", body: fdUpdate });
      } catch (_) {}
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, result: analysisResult }) };
  } catch (error) {
    console.error("Function Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
```

환경 변수 설정
- Netlify Dashboard → Site settings → Environment variables
  - `GEMINI_API_KEY`: 기존과 동일
  - `APPS_SCRIPT_URL`: 기존에 `index.html`에서 쓰던 Apps Script 웹앱 URL

### 2) 클라이언트 교체: `index.html`
- Apps Script 직접 호출 제거
- 제출 시 필요한 모든 메타 + 이미지 포함해 Netlify 함수로 단일 요청
- 응답의 `result`로 화면 렌더

아래 두 군데만 바꾸면 됩니다.

1) 상단 Apps Script URL 제거
```12:16:index.html
// Apps Script는 서버에서만 호출 (클라이언트 직접 호출 제거)
// const scriptURL = "<removed>";
```

2) 제출 핸들러에서 Apps Script `create`/`update`와 Gemini 호출 로직을 단일 서버 요청으로 교체
```583:616:index.html
// UI 상태 변경: 로딩
switchView("loading-section");

// 서버로 단일 요청 (create + analyze + update)
try {
  const payload = {
    mode: "full",
    requestId,
    name,
    contact,
    timestamp: new Date().toLocaleString("ko-KR"),
    imageBase64: uploadedImageBase64,
    consent: !!consentChecked,
    clientId: window.__clientId || "",
    visitorId: window.__visitorId || "",
    ip: window.__clientIp || "",
    ua: window.__ua || "",
    lang: window.__lang || "",
    referrer: window.__referrer || "",
  };

  const res = await fetch("/.netlify/functions/analyzeImage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  const result = data.result || data;

  if (!result.isValid) {
    showAlert(result.reason || "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요.");
    resetToUpload();
    return;
  }

  displayResults(result);
} catch (error) {
  console.error("Error during analysis:", error);
  showAlert("분석 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  resetToUpload();
}
```

추가 메모
- 보안: Apps Script URL이 프런트에서 사라져 외부 노출 방지.
- 일관성: 시트 헤더들은 이미 서버에서 `create/update` 시 포함됩니다. [[memory:9269685]]
- 동의/프라이버시: `consent`는 서버에 ‘Y/N’로 전달되어 시트에 기록됩니다. [[memory:9267201]] [[memory:9269126]]

검증 체크리스트
- Netlify 환경변수 `APPS_SCRIPT_URL` 설정 후 배포
- 정상 사진: 결과가 1회 요청으로 표출
- 부적합 이미지: `isValid:false` + reason 표시 후 업로드 화면 복귀
- 시트: create → (유효시) update가 같은 `requestId`로 반영

- 변경 요약
  - `analyzeImage.js`: Apps Script create/update + Gemini 분석을 서버에서 순차 처리. 단일 응답으로 결과 반환.
  - `index.html`: Apps Script 직접 호출 제거. 모든 데이터 단일 요청으로 Netlify 함수에 전달.

```javascript
exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || '{}');

    const apiKey = process.env.GEMINI_API_KEY;
    const appsScriptUrl = process.env.APPS_SCRIPT_URL; // 시트 기록용
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }) };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // 하위 호환: 기존 방식(prompt + imageBase64)을 그대로 처리
    if (body.prompt && body.imageBase64 && !body.mode) {
      const payload = {
        contents: [
          {
            parts: [
              { text: body.prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: body.imageBase64.split(",")[1],
                },
              },
            ],
          },
        ],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      };
      const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      return { statusCode: response.status, body: JSON.stringify(result) };
    }

    // 통합 흐름: 서버가 시트 create/update + Gemini 분석 처리
    const {
      mode,
      requestId,
      name,
      contact,
      timestamp,
      imageBase64,
      consent,
      clientId,
      visitorId,
      ip,
      ua,
      lang,
      referrer,
    } = body;

    if (mode !== "full") {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid request: expected mode 'full' or {prompt,imageBase64}" }) };
    }
    if (!imageBase64 || !requestId || !name || !contact) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields (imageBase64, requestId, name, contact)" }) };
    }

    // 1) 시트 create (Apps Script가 설정된 경우)
    if (appsScriptUrl) {
      try {
        const fdCreate = new FormData();
        fdCreate.append("action", "create");
        fdCreate.append("requestId", requestId);
        fdCreate.append("name", name);
        fdCreate.append("contact", contact);
        fdCreate.append("timestamp", timestamp || new Date().toLocaleString("ko-KR"));
        fdCreate.append("image", imageBase64);
        fdCreate.append("consent", consent ? "Y" : "N");
        fdCreate.append("clientId", clientId || "");
        fdCreate.append("visitorId", visitorId || "");
        fdCreate.append("ip", ip || "");
        fdCreate.append("ua", ua || "");
        fdCreate.append("lang", lang || "");
        fdCreate.append("referrer", referrer || "");
        await fetch(appsScriptUrl, { method: "POST", body: fdCreate });
      } catch (_) {
        // 로깅 실패는 분석을 막지 않음
      }
    }

    // 2) Gemini 통합 프롬프트 분석
    const combinedPrompt = `
You are a brutally honest but fair profile picture evaluator with a witty and friendly personality.
Follow the rules strictly and respond with JSON only.

1) Validation:
- Check if the input image is a real photograph of a single person and suitable for a profile photo.
- Consider invalid if: AI-generated, illustration/anime/character, celebrity, group photo, face severely occluded, extremely low quality, excessive filter.
- If invalid, return ONLY:
{
  "isValid": false,
  "reason": "한국어로 짧고 친절하지만 위트있는 이유"
}

2) Analysis (only if valid):
- Analyze this image on a scale of 0 to 100 for '인물'(Figure), '배경'(Background), and '감성'(Vibe).
- The JSON object MUST contain exactly these keys and only these keys:
{
  "isValid": true,
  "figureScore": 0-100 정수,
  "backgroundScore": 0-100 정수,
  "vibeScore": 0-100 정수,
  "figureCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "backgroundCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "vibeCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "finalCritique": "한국어 한 문장 위트있는 요약"
}
- Scores must be integers in 0~100.
- All text must be in Korean, brutally honest yet fair, witty and friendly.
- Output MUST be JSON only. No markdown, code fences, or extra commentary.
    `.trim();

    const payload = {
      contents: [
        {
          parts: [
            { text: combinedPrompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(",")[1],
              },
            },
          ],
        },
      ],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };

    const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const gemini = await response.json();

    const text = gemini?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonText = (text || "").replace(/```json\\n?|```/g, "").trim();
    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonText);
    } catch (_) {
      return { statusCode: 502, body: JSON.stringify({ error: "Invalid Gemini response", raw: gemini }) };
    }

    // 3) 시트 update (isValid일 때만)
    if (appsScriptUrl && analysisResult?.isValid) {
      try {
        const fdUpdate = new FormData();
        fdUpdate.append("action", "update");
        fdUpdate.append("requestId", requestId);
        fdUpdate.append("figureScore", analysisResult.figureScore);
        fdUpdate.append("backgroundScore", analysisResult.backgroundScore);
        fdUpdate.append("vibeScore", analysisResult.vibeScore);
        fdUpdate.append("figureCritique", analysisResult.figureCritique);
        fdUpdate.append("backgroundCritique", analysisResult.backgroundCritique);
        fdUpdate.append("vibeCritique", analysisResult.vibeCritique);
        fdUpdate.append("finalCritique", analysisResult.finalCritique);
        await fetch(appsScriptUrl, { method: "POST", body: fdUpdate });
      } catch (_) {}
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, result: analysisResult }) };
  } catch (error) {
    console.error("Function Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
```

```html
// Apps Script는 서버에서만 호출 (클라이언트 직접 호출 제거)
// const scriptURL = "<removed>";
```

```html
// UI 상태 변경: 로딩
switchView("loading-section");

// 서버로 단일 요청 (create + analyze + update)
try {
  const payload = {
    mode: "full",
    requestId,
    name,
    contact,
    timestamp: new Date().toLocaleString("ko-KR"),
    imageBase64: uploadedImageBase64,
    consent: !!consentChecked,
    clientId: window.__clientId || "",
    visitorId: window.__visitorId || "",
    ip: window.__clientIp || "",
    ua: window.__ua || "",
    lang: window.__lang || "",
    referrer: window.__referrer || "",
  };

  const res = await fetch("/.netlify/functions/analyzeImage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  const result = data.result || data;

  if (!result.isValid) {
    showAlert(result.reason || "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요.");
    resetToUpload();
    return;
  }

  displayResults(result);
} catch (error) {
  console.error("Error during analysis:", error);
  showAlert("분석 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  resetToUpload();
}
```

---

**User**

이 말이 꼭 해보고 싶었어. 진행시켜

---

**Cursor**

지금 서버와 클라이언트 모두를 수정할 준비가 되었습니다. 먼저 할 일들을 정리하고, 서버 함수부터 업데이트한 뒤 클라이언트를 리팩터링하겠습니다. 이어서 각 파일을 읽어 정확한 교체 지점을 파악합니다.

서버가 Apps Script 기록과 Gemini 분석을 모두 처리하도록 `analyzeImage.js`를 업데이트하고, 클라이언트 `index.html`에서 Apps Script 직접 호출을 제거해 단일 서버 요청으로 전환하겠습니다. 먼저 서버 함수를 교체한 뒤, 클라이언트 제출 로직을 수정하겠습니다.

```javascript
exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || '{}');

    const apiKey = process.env.GEMINI_API_KEY;
    const appsScriptUrl = process.env.APPS_SCRIPT_URL; // Google Apps Script WebApp URL (optional)
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }) };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // Backward compatibility: direct prompt + imageBase64
    if (body.prompt && body.imageBase64 && !body.mode) {
      const payload = {
        contents: [
          {
            parts: [
              { text: body.prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: body.imageBase64.split(",")[1],
                },
              },
            ],
          },
        ],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      return { statusCode: response.status, body: JSON.stringify(result) };
    }

    // Integrated flow: create (sheet) -> analyze -> update (sheet)
    const {
      mode,
      requestId,
      name,
      contact,
      timestamp,
      imageBase64,
      consent,
      clientId,
      visitorId,
      ip,
      ua,
      lang,
      referrer,
    } = body;

    if (mode !== 'full') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request: expected mode 'full' or {prompt,imageBase64}" }),
      };
    }
    if (!imageBase64 || !requestId || !name || !contact) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields (imageBase64, requestId, name, contact)" }),
      };
    }

    // 1) Create (Apps Script optional)
    if (appsScriptUrl) {
      try {
        const fdCreate = new FormData();
        fdCreate.append('action', 'create');
        fdCreate.append('requestId', requestId);
        fdCreate.append('name', name);
        fdCreate.append('contact', contact);
        fdCreate.append('timestamp', timestamp || new Date().toLocaleString('ko-KR'));
        fdCreate.append('image', imageBase64);
        fdCreate.append('consent', consent ? 'Y' : 'N');
        fdCreate.append('clientId', clientId || '');
        fdCreate.append('visitorId', visitorId || '');
        fdCreate.append('ip', ip || '');
        fdCreate.append('ua', ua || '');
        fdCreate.append('lang', lang || '');
        fdCreate.append('referrer', referrer || '');

        await fetch(appsScriptUrl, { method: 'POST', body: fdCreate });
      } catch (_) {
        // Logging failure should not block analysis
      }
    }

    // 2) Analyze via Gemini (single combined prompt)
    const combinedPrompt = `
You are a brutally honest but fair profile picture evaluator with a witty and friendly personality.
Follow the rules strictly and respond with JSON only.

1) Validation:
- Check if the input image is a real photograph of a single person and suitable for a profile photo.
- Consider invalid if: AI-generated, illustration/anime/character, celebrity, group photo, face severely occluded, extremely low quality, excessive filter.
- If invalid, return ONLY:
{
  "isValid": false,
  "reason": "한국어로 짧고 친절하지만 위트있는 이유"
}

2) Analysis (only if valid):
- Analyze this image on a scale of 0 to 100 for '인물'(Figure), '배경'(Background), and '감성'(Vibe).
- The JSON object MUST contain exactly these keys and only these keys:
{
  "isValid": true,
  "figureScore": 0-100 정수,
  "backgroundScore": 0-100 정수,
  "vibeScore": 0-100 정수,
  "figureCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "backgroundCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "vibeCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "finalCritique": "한국어 한 문장 위트있는 요약"
}
- Scores must be integers in 0~100.
- All text must be in Korean, brutally honest yet fair, witty and friendly.
- Output MUST be JSON only. No markdown, code fences, or extra commentary.
    `.trim();

    const payload = {
      contents: [
        {
          parts: [
            { text: combinedPrompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64.split(',')[1],
              },
            },
          ],
        },
      ],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const gemini = await response.json();

    const text = gemini?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonText = (text || '').replace(/```json\n?|```/g, '').trim();
    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonText);
    } catch (_) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Invalid Gemini response', raw: gemini }) };
    }

    // 3) Update (Apps Script optional) if valid
    if (appsScriptUrl && analysisResult?.isValid) {
      try {
        const fdUpdate = new FormData();
        fdUpdate.append('action', 'update');
        fdUpdate.append('requestId', requestId);
        fdUpdate.append('figureScore', analysisResult.figureScore);
        fdUpdate.append('backgroundScore', analysisResult.backgroundScore);
        fdUpdate.append('vibeScore', analysisResult.vibeScore);
        fdUpdate.append('figureCritique', analysisResult.figureCritique);
        fdUpdate.append('backgroundCritique', analysisResult.backgroundCritique);
        fdUpdate.append('vibeCritique', analysisResult.vibeCritique);
        fdUpdate.append('finalCritique', analysisResult.finalCritique);

        await fetch(appsScriptUrl, { method: 'POST', body: fdUpdate });
      } catch (_) {
        // Do not fail the whole request if update logging fails
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, result: analysisResult }) };
  } catch (error) {
    console.error('Function Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

```

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>💖 AI 프로필 사진 분석기 💖</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script
      src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js"
      defer
    ></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        font-family: "Gamja Flower", cursive;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgb(253, 242, 248);
      }

      /* 메인 타이틀 반응형 스타일 */
      .main-title {
        font-size: clamp(0.9rem, 6.5vw, 3rem);
        line-height: 1.1;
        white-space: nowrap;
      }

      /* 메인 컨테이너 - 중앙 정렬 보장 */
      .main-container {
        width: 100%;
        max-width: 400px;
        margin: 0 auto;
        padding: 1.5rem;
        background: white;
        border-radius: 1.5rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        position: relative;
        overflow: hidden;
      }

      /* 전체 래퍼 */
      .app-wrapper {
        width: 100%;
        max-width: 400px;
        margin: 1rem;
      }
      /* 반응형 컨테이너 너비 */
      @media (min-width: 480px) {
        .app-wrapper,
        .main-container {
          max-width: 480px;
        }
      }
      @media (min-width: 640px) {
        .app-wrapper,
        .main-container {
          max-width: 560px;
        }
      }
      @media (min-width: 768px) {
        .app-wrapper,
        .main-container {
          max-width: 640px;
        }
      }
      @media (min-width: 1024px) {
        .app-wrapper,
        .main-container {
          max-width: 720px;
        }
      }
      @media (min-width: 1280px) {
        .app-wrapper,
        .main-container {
          max-width: 800px;
        }
      }
      /* 귀여운 로딩 애니메이션 */
      .bouncing-loader {
        display: flex;
        justify-content: center;
      }
      .bouncing-loader > div {
        width: 20px;
        height: 20px;
        margin: 3px 6px;
        border-radius: 50%;
        background-color: #fca5a5; /* red-300 */
        opacity: 1;
        animation: bouncing-loader 0.8s infinite alternate;
      }
      .bouncing-loader > div:nth-child(2) {
        animation-delay: 0.2s;
      }
      .bouncing-loader > div:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes bouncing-loader {
        to {
          opacity: 0.1;
          transform: translateY(-16px);
        }
      }
      /* 결과 점수 바 애니메이션 */
      @keyframes fill-bar {
        from {
          width: 0%;
        }
        to {
          width: var(--target-width);
        }
      }
      .score-bar-fill {
        animation: fill-bar 1.5s ease-out forwards;
      }
      /* 화면 전환 효과 */
      .view-section {
        transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
      }
      .view-section.hidden {
        opacity: 0;
        transform: scale(0.95);
        pointer-events: none;
        position: absolute;
      }
    </style>
  </head>
  <body>
    <div class="app-wrapper">
      <div class="main-container">
        <!-- Initial Upload View -->
        <div id="upload-section" class="view-section">
          <div class="text-center">
            <h1 class="main-title font-bold text-gray-800">
              ✨ AI 프로필 사진 분석기 ✨
            </h1>
            <p class="text-gray-500 mt-2 text-lg">
              당신의 매력, AI가 찾아드려요!
            </p>
          </div>
          <div class="mt-8">
            <div
              class="w-full h-64 border-2 border-dashed border-pink-300 rounded-2xl flex items-center justify-center bg-pink-100 bg-opacity-50"
            >
              <img
                id="image-preview"
                src=""
                alt="Image preview"
                class="hidden max-h-full max-w-full rounded-lg"
              />
              <div id="upload-placeholder" class="text-center text-pink-400">
                <svg
                  class="mx-auto h-16 w-16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                  />
                </svg>
                <p class="mt-2 text-xl">클릭해서 사진 올리기!</p>
              </div>
            </div>
          </div>
          <div class="mt-6 space-y-3">
            <input
              type="file"
              id="image-upload"
              class="hidden"
              accept="image/*"
            />
            <button
              onclick="document.getElementById('image-upload').click()"
              class="w-full bg-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              앨범에서 사진 선택 💖
            </button>
            <button
              id="next-button"
              class="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-slate-900 transition-all duration-300 transform hover:scale-105 shadow-lg hidden"
            >
              정보 입력하고 결과보기 ✨
            </button>
          </div>
        </div>

        <!-- Contact Info View -->
        <div id="contact-section" class="view-section hidden">
          <div class="text-center">
            <h2 class="text-3xl font-bold text-gray-800">
              결과를 보기 전, 마지막 단계!
            </h2>
            <p class="text-gray-500 mt-4 text-lg">
              개인정보를 입력해주셔야 결과를 보실 수 있습니다.<br />
              결과가 나오기 까지 약 6초가 소요됩니다.
            </p>
          </div>
          <form id="contact-form" class="space-y-4 mt-8" novalidate>
            <input
              type="text"
              id="user-name"
              placeholder="이름 (한글/영문만 가능)"
              class="w-full text-lg p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              required
            />
            <input
              type="tel"
              id="user-contact"
              placeholder="010-1234-5678"
              maxlength="13"
              class="w-full text-lg p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              required
            />
            <div
              class="flex items-start space-x-3 rounded-lg bg-gray-50 p-3 border border-gray-200"
            >
              <input
                id="contact-consent"
                type="checkbox"
                class="mt-1 h-5 w-5 text-fuchsia-500 border-gray-300 rounded"
              />
              <label
                for="contact-consent"
                class="text-gray-700 text-base leading-6"
              >
                개인정보 수집 및 이용에 동의합니다.
                <span class="text-gray-400 text-sm block"
                  >이름, 연락처, 업로드한 사진은 결과 생성 및 서비스 고도화
                  목적에만 사용됩니다.
                  <a
                    href="privacy.html"
                    target="_blank"
                    class="text-fuchsia-600 underline"
                    >자세히 보기</a
                  >
                </span>
              </label>
            </div>
            <button
              type="submit"
              class="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-900 transition-colors text-lg"
            >
              결과 분석 시작하기 🚀
            </button>
          </form>
          <p
            id="form-success-message"
            class="text-center text-green-600 mt-4 hidden"
          >
            정보가 성공적으로 제출되었습니다!
          </p>
        </div>

        <!-- Loading View -->
        <div id="loading-section" class="view-section hidden text-center py-16">
          <div class="bouncing-loader mx-auto">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p class="text-gray-600 font-semibold text-2xl mt-8">
            AI가 당신의 매력을 스캔 중이에요! ✨
          </p>
          <p class="text-gray-400 mt-2 text-lg">
            두근두근... 잠시만 기다려주세요!
          </p>
        </div>

        <!-- Result View -->
        <div id="result-section" class="view-section hidden">
          <div class="text-center">
            <h2 class="text-3xl font-bold text-gray-800">AI 분석 결과!</h2>
            <img
              id="result-image"
              src=""
              alt="Analyzed image"
              class="mt-4 w-48 h-48 mx-auto rounded-full object-cover shadow-2xl border-4 border-white"
            />
          </div>

          <div class="mt-8 space-y-6">
            <!-- 인물 점수 -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-bold text-xl text-gray-700">🤵 인물</h3>
                <span
                  id="figure-score"
                  class="font-bold text-xl text-fuchsia-500"
                ></span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-5">
                <div
                  id="figure-bar"
                  class="bg-fuchsia-500 h-5 rounded-full score-bar-fill"
                  style="width: 0%"
                ></div>
              </div>
              <p
                id="figure-critique"
                class="text-base text-gray-700 mt-2 p-3 bg-fuchsia-50 rounded-lg"
              ></p>
            </div>
            <!-- 배경 점수 -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-bold text-xl text-gray-700">🏞️ 배경</h3>
                <span
                  id="background-score"
                  class="font-bold text-xl text-emerald-500"
                ></span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-5">
                <div
                  id="background-bar"
                  class="bg-emerald-500 h-5 rounded-full score-bar-fill"
                  style="width: 0%"
                ></div>
              </div>
              <p
                id="background-critique"
                class="text-base text-gray-700 mt-2 p-3 bg-emerald-50 rounded-lg"
              ></p>
            </div>
            <!-- 감성 점수 -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-bold text-xl text-gray-700">✨ 감성</h3>
                <span
                  id="vibe-score"
                  class="font-bold text-xl text-amber-500"
                ></span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-5">
                <div
                  id="vibe-bar"
                  class="bg-amber-500 h-5 rounded-full score-bar-fill"
                  style="width: 0%"
                ></div>
              </div>
              <p
                id="vibe-critique"
                class="text-base text-gray-700 mt-2 p-3 bg-amber-50 rounded-lg"
              ></p>
            </div>
          </div>

          <div class="mt-8 text-center bg-gray-100 p-4 rounded-xl shadow-inner">
            <h3 class="font-bold text-gray-800 text-lg">AI의 최종 한 줄 평</h3>
            <p id="final-critique" class="text-xl mt-2 text-gray-700 italic">
              "
            </p>
          </div>

          <div
            class="mt-8 text-center border-t-2 border-dashed border-pink-200 pt-6"
          >
            <h3 class="text-2xl font-bold text-gray-800">
              베럴댄미 : 남성그루밍 프로필 서비스
            </h3>
            <p class="text-gray-600 mt-2 text-lg">
              인생 프로필 사진, 전문가와 함께!
            </p>
            <div class="flex justify-center space-x-4 mt-4">
              <a
                href="https://www.instagram.com/better.than.me2040/"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-gradient-to-r from-pink-500 to-orange-400 text-white py-2 px-5 rounded-lg hover:shadow-lg transition-shadow text-base"
                >인스타그램</a
              >
              <a
                href="https://open.kakao.com/o/sDAisnDh"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-yellow-400 text-gray-800 py-2 px-5 rounded-lg hover:shadow-lg transition-shadow text-base"
                >오픈채팅</a
              >
            </div>
            <p class="text-sm text-gray-500 mt-2">
              프로필사진 및 냉정한 외모평가를 원한다면 오픈채팅으로 연락주세요
            </p>
          </div>

          <div class="mt-6 text-center">
            <button
              onclick="resetApp()"
              class="w-full bg-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              다른 사진으로 또 하기! 📸
            </button>
          </div>
        </div>

        <!-- Custom Alert Modal -->
        <div
          id="alert-modal"
          class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div
            class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center transform transition-all animate-in zoom-in-75"
          >
            <p id="alert-message" class="text-gray-700 text-xl"></p>
            <button
              onclick="closeModal()"
              class="mt-8 bg-fuchsia-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-fuchsia-600 transition-colors text-lg"
            >
              알겠어요!
            </button>
          </div>
        </div>
      </div>
    </div>

    <script>
      const uploadSection = document.getElementById("upload-section");
      const contactSection = document.getElementById("contact-section");
      const loadingSection = document.getElementById("loading-section");
      const resultSection = document.getElementById("result-section");
      const imageUpload = document.getElementById("image-upload");
      const imagePreview = document.getElementById("image-preview");
      const uploadPlaceholder = document.getElementById("upload-placeholder");
      const nextButton = document.getElementById("next-button");
      const resultImage = document.getElementById("result-image");
      const contactForm = document.getElementById("contact-form");

      const alertModal = document.getElementById("alert-modal");
      const alertMessage = document.getElementById("alert-message");

      let uploadedImageBase64 = null;
      // 요청 상관관계를 위한 고유 ID 생성 (두 단계 전송에 사용)
      let requestId =
        crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      // Google Apps Script 웹앱 URL (시트 기록용)
      // const scriptURL = "<moved-to-server>"; // Apps Script 호출은 서버(Netlify 함수)에서만 수행

      // 방문자/환경 메타 수집 (clientId + FingerprintJS + IP/UA/lang/referrer)
      window.__clientId =
        localStorage.getItem("clientId") ||
        (() => {
          const id =
            crypto && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          try {
            localStorage.setItem("clientId", id);
          } catch (_) {}
          return id;
        })();
      window.__ua = navigator.userAgent;
      window.__lang =
        navigator.language ||
        (navigator.languages && navigator.languages[0]) ||
        "";
      window.__referrer = document.referrer || "";

      window.__visitorId = "";
      if (window.FingerprintJS && FingerprintJS.load) {
        FingerprintJS.load()
          .then((fp) => fp.get())
          .then((res) => {
            window.__visitorId = res.visitorId;
          })
          .catch(() => {});
      }

      window.__clientIp = "";
      fetch("https://api.ipify.org?format=json")
        .then((r) => r.json())
        .then((d) => {
          window.__clientIp = d.ip;
        })
        .catch(() => {});

      // 이미지 업로드 처리
      imageUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            uploadedImageBase64 = e.target.result;
            imagePreview.src = uploadedImageBase64;
            imagePreview.classList.remove("hidden");
            uploadPlaceholder.classList.add("hidden");
            nextButton.classList.remove("hidden");
          };
          reader.readAsDataURL(file);
        }
      });

      // '정보 입력' 버튼 클릭 -> 연락처 폼으로 이동
      nextButton.addEventListener("click", () => {
        if (!uploadedImageBase64) {
          showAlert("먼저 사진을 선택해주세요!");
          return;
        }
        switchView("contact-section");
      });

      // 연락처 입력 자동 포맷팅
      document
        .getElementById("user-contact")
        .addEventListener("input", (event) => {
          let value = event.target.value.replace(/[^0-9]/g, ""); // 숫자만 남기기

          if (value.length >= 3) {
            value = value.substring(0, 3) + "-" + value.substring(3);
          }
          if (value.length >= 8) {
            value = value.substring(0, 8) + "-" + value.substring(8, 12);
          }

          event.target.value = value;
        });

      // 이름 유효성 검사 함수
      function validateName(name) {
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

      // 연락처 유효성 검사 함수
      function validatePhoneNumber(phone) {
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        return phoneRegex.test(phone);
      }

      // 연락처 폼 제출 -> 분석 시작
      contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("user-name").value;
        const contact = document.getElementById("user-contact").value;

        if (!name || !contact) {
          showAlert("이름과 연락처를 모두 입력해주세요!");
          return;
        }

        if (!validateName(name)) {
          showAlert(
            "올바른 사람 이름을 입력해주세요! 의성어나 무의미한 문자는 사용할 수 없습니다."
          );
          return;
        }

        if (!validatePhoneNumber(contact)) {
          showAlert("연락처는 010-1234-5678 형식으로 입력해주세요!");
          return;
        }

        const consentChecked =
          document.getElementById("contact-consent")?.checked;
        if (!consentChecked) {
          showAlert("개인정보 수집 및 이용에 동의해주세요.");
          return;
        }

        // UI 상태 변경: 로딩
        switchView("loading-section");
        // 서버로 단일 요청 (create + analyze + update)
        try {
          const payload = {
            mode: "full",
            requestId,
            name,
            contact,
            timestamp: new Date().toLocaleString("ko-KR"),
            imageBase64: uploadedImageBase64,
            consent: !!consentChecked,
            clientId: window.__clientId || "",
            visitorId: window.__visitorId || "",
            ip: window.__clientIp || "",
            ua: window.__ua || "",
            lang: window.__lang || "",
            referrer: window.__referrer || "",
          };

          const res = await fetch("/.netlify/functions/analyzeImage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            throw new Error(`Server error ${res.status}`);
          }
          const data = await res.json();
          const result = data.result || data; // 호환 처리

          if (!result.isValid) {
            showAlert(result.reason || "앗! 실제 인물 사진을 넣어야 정확한 평가가 가능해요.");
            resetToUpload();
            return;
          }

          displayResults(result);
        } catch (error) {
          console.error("Error during analysis:", error);
          showAlert("분석 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
          resetToUpload();
        }
      });

      // Gemini API 호출 함수 (수정됨)
      async function callGeminiAPI(prompt, imageBase64) {
        const apiUrl = `/.netlify/functions/analyzeImage`;
        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // *** FIX: prompt와 imageBase64를 함께 보냅니다. ***
            body: JSON.stringify({
              prompt: prompt, // <-- 이 부분을 추가!
              imageBase64: imageBase64,
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Serverless function failed with status ${response.status}`
            );
          }

          const result = await response.json();

          // AI가 유해성 등으로 답변을 거부했을 경우의 처리
          if (result.promptFeedback && result.promptFeedback.blockReason) {
            console.error(
              "Analysis blocked by API:",
              result.promptFeedback.blockReason
            );
            showAlert("AI가 분석을 거부했어요. 다른 사진으로 시도해보세요.");
            throw new Error("API content blocked");
          }

          if (result.candidates && result.candidates[0].content.parts[0].text) {
            return result.candidates[0].content.parts[0].text;
          } else {
            throw new Error(
              "Invalid API response format from serverless function"
            );
          }
        } catch (error) {
          console.error("Error calling serverless function:", error);
          if (error.message !== "API content blocked") {
            showAlert(
              "분석 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            );
          }
          throw error; // 오류를 다시 던져서 후속 처리를 막습니다.
        }
      }

      // 결과 표시 함수
      function displayResults(data) {
        resultImage.src = uploadedImageBase64;

        document.getElementById(
          "figure-score"
        ).textContent = `${data.figureScore}점`;
        document.getElementById(
          "background-score"
        ).textContent = `${data.backgroundScore}점`;
        document.getElementById(
          "vibe-score"
        ).textContent = `${data.vibeScore}점`;

        const figureBar = document.getElementById("figure-bar");
        const backgroundBar = document.getElementById("background-bar");
        const vibeBar = document.getElementById("vibe-bar");

        // 애니메이션을 위해 스타일 변수 설정
        figureBar.style.setProperty("--target-width", `${data.figureScore}%`);
        backgroundBar.style.setProperty(
          "--target-width",
          `${data.backgroundScore}%`
        );
        vibeBar.style.setProperty("--target-width", `${data.vibeScore}%`);

        document.getElementById("figure-critique").textContent =
          data.figureCritique;
        document.getElementById("background-critique").textContent =
          data.backgroundCritique;
        document.getElementById("vibe-critique").textContent =
          data.vibeCritique;
        document.getElementById(
          "final-critique"
        ).textContent = `"${data.finalCritique}"`;

        // UI 상태 변경: 결과
        switchView("result-section");
      }

      // 커스텀 알림창 보이기
      function showAlert(message) {
        alertMessage.textContent = message;
        alertModal.classList.remove("hidden");
      }

      // 커스텀 알림창 닫기
      function closeModal() {
        alertModal.classList.add("hidden");
      }

      function switchView(viewId) {
        document.querySelectorAll(".view-section").forEach((section) => {
          section.classList.add("hidden");
        });
        document.getElementById(viewId).classList.remove("hidden");
      }

      // 초기 업로드 화면으로 리셋
      function resetToUpload() {
        switchView("upload-section");
      }

      // 전체 앱 리셋
      function resetApp() {
        uploadedImageBase64 = null;
        imagePreview.src = "";
        imagePreview.classList.add("hidden");
        uploadPlaceholder.classList.remove("hidden");
        nextButton.classList.add("hidden");
        contactForm.reset();
        resetToUpload();
      }
    </script>
  </body>
</html>

```

진행시켰습니다. 이제 흐름이 단일 요청으로 합쳐졌어요.

- 서버 `netlify/functions/analyzeImage.js`
  - `mode: "full"` 지원: Apps Script create → Gemini 단일 분석 → Apps Script update 를 서버에서 순차 처리
  - 기존 `prompt + imageBase64` 방식은 하위 호환 유지
  - 환경변수 `APPS_SCRIPT_URL` 사용(대시보드에 등록 필요)

- 클라이언트 `index.html`
  - Apps Script 직접 호출 제거
  - 제출 시 메타+이미지 포함해 `/.netlify/functions/analyzeImage`로 단일 POST
  - 응답의 `result`로 바로 `displayResults(...)` 렌더

배포/테스트 체크
- Netlify 환경변수 설정: GEMINI_API_KEY, APPS_SCRIPT_URL
- 실제 인물/부적합 이미지 케이스 각각 확인
- 시트에서 동일 `requestId`로 create/update 반영 확인

원하면 다음으로 이미지 리사이즈(1024px, JPEG q=0.8)로 업로드 시간도 더 줄여드릴게요.

---

**User**

기존 prompt + imageBase64 방식은 하위 호환 유지
환경변수 APPS_SCRIPT_URL 사용(대시보드에 등록 필요)

이게 무슨 말이야?

---

**Cursor**

간단히 정리해 드릴게요.

- “기존 prompt + imageBase64 방식은 하위 호환 유지”의 의미
  - 예전처럼 클라이언트가 `/.netlify/functions/analyzeImage`에 `{ prompt, imageBase64 }`만 보내도 그대로 동작합니다.
  - 서버는 이 경우 바로 Gemini에 전달해 결과를 되돌려줍니다. 즉, 이전 프런트 코드도 수정 없이 계속 사용할 수 있다는 뜻입니다.

- “환경변수 APPS_SCRIPT_URL 사용(대시보드에 등록 필요)”의 의미
  - 기존에 `index.html`에 박혀 있던 Google Apps Script 웹앱 URL을 클라이언트에서 제거했고, 서버에서만 사용하도록 옮겼습니다.
  - Netlify 사이트 설정에서 환경변수로 `APPS_SCRIPT_URL`을 등록해야 서버가 시트에 create/update를 보낼 수 있습니다.
  - 설정 경로: Netlify Dashboard → Site settings → Environment variables → Add variable
    - Name: `APPS_SCRIPT_URL`
    - Value: Apps Script 웹앱 배포 URL
    - 저장 후 재배포(Deploy) 필요
  - 만약 이 변수를 설정하지 않으면, 서버는 시트 기록(create/update)을 건너뛰고 Gemini 분석만 수행합니다.

- 새(권장) 호출 방식 요약
  - 클라이언트는 이제 한 번만 요청합니다. `mode: "full"`과 메타데이터+이미지를 함께 전송하세요.
  - 서버가 시트 create → Gemini 분석 → 시트 update까지 처리하고 `result`를 반환합니다.

예시
```javascript
await fetch('/.netlify/functions/analyzeImage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'full',
    requestId, name, contact,
    timestamp: new Date().toLocaleString('ko-KR'),
    imageBase64, consent: true,
    clientId, visitorId, ip, ua, lang, referrer
  })
});
```

- 응답 형태
  - 새 방식: `{ ok: true, result: { isValid, figureScore, ... } }`
  - 구 방식: Gemini 원본 응답(JSON)이 그대로 반환됩니다.

```javascript
await fetch('/.netlify/functions/analyzeImage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'full',
    requestId, name, contact,
    timestamp: new Date().toLocaleString('ko-KR'),
    imageBase64, consent: true,
    clientId, visitorId, ip, ua, lang, referrer
  })
});
```

