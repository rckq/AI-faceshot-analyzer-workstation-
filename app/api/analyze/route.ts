import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    const correlationId = body?.requestId || crypto.randomUUID();

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const primaryModel = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
    const fallbackModel = "gemini-1.5-flash-8b";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${apiKey}`;
    const maxOutputTokens =
      Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 512) || 512;

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
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens,
          responseMimeType: "application/json",
        },
      };

      logger.info("gemini:request", { requestId: correlationId });
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      logger.info("gemini:response", {
        requestId: correlationId,
        status: response.status,
      });
      return NextResponse.json(result, { status: response.status });
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
      diagnostics,
    } = body;

    if (mode !== "full") {
      return NextResponse.json(
        {
          error:
            "Invalid request: expected mode 'full' or {prompt,imageBase64}",
        },
        { status: 400 }
      );
    }

    if (!imageBase64 || !requestId || !name || !contact) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (imageBase64, requestId, name, contact)",
        },
        { status: 400 }
      );
    }

    // 1) Analyze via Gemini
    const diagnosticsEnabled = !!diagnostics;
    const combinedPrompt = (
      diagnosticsEnabled
        ? `You are a brutally honest but fair profile picture evaluator with a witty and friendly personality.
Follow the rules strictly and respond with JSON only.

1) Validation:
- Determine if the image is a real photograph of a single person suitable for a profile photo.
- Consider invalid if: AI-generated, illustration/anime/character, celebrity, group photo, face severely occluded, extremely low quality, excessive filter.
- Always include a detailed validation breakdown under "validation" with the following keys:
  {
    "isRealPhotograph": boolean,
    "numFaces": integer,
    "isSinglePerson": boolean,
    "aiGeneratedLikelihood": number (0~1),
    "illustrationLikelihood": number (0~1),
    "celebrityLikelihood": number (0~1),
    "groupPhotoLikelihood": number (0~1),
    "faceOcclusionSeverity": number (0~1),
    "imageQualityScore": integer (0~100),
    "excessiveFilterLikelihood": number (0~1),
    "reasons": string[]
  }
- If invalid, return:
{
  "isValid": false,
  "reason": "한국어로 짧고 친절하지만 위트있는 이유",
  "validation": { ...as described above }
}

2) Analysis (only if valid):
- Analyze this image on a scale of 0 to 100 for '인물'(Figure), '배경'(Background), and '감성'(Vibe).
- The JSON MUST include all of the following keys, and MAY include the extra "validation" object:
{
  "isValid": true,
  "figureScore": 0-100 정수,
  "backgroundScore": 0-100 정수,
  "vibeScore": 0-100 정수,
  "figureCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "backgroundCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "vibeCritique": "한국어로 신랄하지만 공정하고 귀엽고 친절한 톤",
  "finalCritique": "한국어 한 문장 위트있는 요약",
  "validation": { ...same schema as above }
}
- Scores must be integers in 0~100.
- All text must be in Korean, brutally honest yet fair, witty and friendly.
- Output MUST be JSON only. No markdown, code fences, or extra commentary.`
        : `You are a brutally honest but fair profile picture evaluator with a witty and friendly personality.
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
- Output MUST be JSON only. No markdown, code fences, or extra commentary.`
    ).trim();

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
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 256,
        responseMimeType: "application/json",
      },
    };

    logger.info("gemini:request", { requestId });
    let response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let gemini = await response.json();
    if (!response.ok && gemini?.error?.status === "NOT_FOUND") {
      const fbUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${apiKey}`;
      response = await fetch(fbUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      gemini = await response.json();
    }
    logger.info("gemini:response", { requestId, status: response.status });

    if (!response.ok) {
      // 상류 오류를 그대로 전달해 디버깅/재시도 전략 수립을 용이하게
      return NextResponse.json(gemini, { status: response.status });
    }

    const text = gemini?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonText = (text || "").replace(/```json\n?|```/g, "").trim();
    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonText);
    } catch (_) {
      return NextResponse.json(gemini, { status: 502 });
    }

    // 2) 시트 저장은 클라이언트에서 결과 표시 직후 비동기 전송하도록 위임
    if (appsScriptUrl) {
      try {
        const bgPayload: Record<string, any> = {
          action: "complete",
          requestId,
          name,
          contact,
          timestamp: timestamp || new Date().toLocaleString("ko-KR"),
          // image는 전송 생략(용량/지연 절감)
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

        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
        // 기다리지 않고 비동기 전송 시도 (실패해도 사용자 응답에는 영향 없음)
        void fetch(`${baseUrl}/api/log-to-sheet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bgPayload),
        }).catch(() => {});
      } catch (e) {
        logger.error("sheet-log:enqueue-exception", {
          requestId,
          error: (e as Error)?.message,
        });
      }
    }

    return NextResponse.json(
      { ok: true, result: analysisResult },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (error) {
    const requestId = crypto.randomUUID();
    logger.error("api:exception", {
      requestId,
      error: (error as Error)?.message || "Unknown error",
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}
