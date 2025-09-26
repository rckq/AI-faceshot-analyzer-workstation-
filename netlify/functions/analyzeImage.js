exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");

    const apiKey = process.env.GEMINI_API_KEY;
    const appsScriptUrl = process.env.APPS_SCRIPT_URL; // Google Apps Script WebApp URL (optional)
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }),
      };
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
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
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

    if (mode !== "full") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Invalid request: expected mode 'full' or {prompt,imageBase64}",
        }),
      };
    }
    if (!imageBase64 || !requestId || !name || !contact) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Missing required fields (imageBase64, requestId, name, contact)",
        }),
      };
    }

    // 1) Analyze via Gemini (우선 실행 - 사용자 대기시간 최소화)
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
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const gemini = await response.json();

    const text = gemini?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonText = (text || "").replace(/```json\n?|```/g, "").trim();
    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonText);
    } catch (_) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Invalid Gemini response", raw: gemini }),
      };
    }

    // 2) 시트 저장 (방법 B: 백그라운드 함수 호출로 비동기 처리)
    try {
      const bgPayload = {
        action: "complete",
        requestId,
        name,
        contact,
        timestamp: timestamp || new Date().toLocaleString("ko-KR"),
        image: imageBase64,
        consent: consent ? "Y" : "N",
        clientId: clientId || "",
        visitorId: visitorId || "",
        ip: ip || "",
        ua: ua || "",
        lang: lang || "",
        referrer: referrer || "",
      };

      if (analysisResult?.isValid) {
        bgPayload.figureScore = analysisResult.figureScore;
        bgPayload.backgroundScore = analysisResult.backgroundScore;
        bgPayload.vibeScore = analysisResult.vibeScore;
        bgPayload.figureCritique = analysisResult.figureCritique;
        bgPayload.backgroundCritique = analysisResult.backgroundCritique;
        bgPayload.vibeCritique = analysisResult.vibeCritique;
        bgPayload.finalCritique = analysisResult.finalCritique;
      }

      console.log(
        "Queue background logging with payload:",
        JSON.stringify(bgPayload, null, 2)
      );

      // Netlify Functions: Node 환경의 fetch는 절대 URL이 필요합니다.
      // 배포 환경: process.env.URL 사용. 로컬 개발: http://localhost:8888 기본값.
      const siteUrl =
        process.env.URL || process.env.DEPLOY_URL || "http://localhost:8888";
      const bgUrl = `${siteUrl}/.netlify/functions/logToAppsScript-background`;

      await fetch(bgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bgPayload),
      });
    } catch (e) {
      console.error("Failed to enqueue background logging:", e);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, result: analysisResult }),
    };
  } catch (error) {
    console.error("Function Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
