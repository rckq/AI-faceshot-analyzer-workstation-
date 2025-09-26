import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeImagePayload, AnalysisResult } from "@/lib/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeImagePayload = await request.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        { error: 'Invalid request: expected mode "full"' },
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

    // 1) Gemini API로 이미지 분석
    const analysisResult = await analyzeWithGemini(imageBase64);

    // 2) Apps Script로 데이터 저장 (백그라운드 처리)
    if (APPS_SCRIPT_URL) {
      saveToAppsScript({
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
        ...analysisResult,
      }).catch((error) => {
        console.error("Failed to save to Apps Script:", error);
      });
    }

    return NextResponse.json({
      ok: true,
      result: analysisResult,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

async function analyzeWithGemini(imageBase64: string): Promise<AnalysisResult> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

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

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const gemini = await response.json();
  const text = gemini?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonText = text.replace(/```json\n?|```/g, "").trim();

  try {
    return JSON.parse(jsonText);
  } catch (_) {
    throw new Error("Invalid Gemini response");
  }
}

async function saveToAppsScript(payload: any): Promise<void> {
  const response = await fetch(APPS_SCRIPT_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Apps Script error:", response.status, text);
    throw new Error(`Apps Script request failed: ${response.status}`);
  }
}
