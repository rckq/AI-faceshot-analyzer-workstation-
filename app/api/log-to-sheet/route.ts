import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../lib/logger";

export async function POST(request: NextRequest) {
  try {
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      logger.warn("apps-script:not-configured");
      return NextResponse.json(
        {
          ok: false,
          reason: "APPS_SCRIPT_URL not set",
        },
        { headers: { "X-Request-Id": crypto.randomUUID() } }
      );
    }

    const incoming = await request.json();
    const requestId = incoming.requestId || crypto.randomUUID();
    const sheetPayload = {
      action: incoming.action || "complete",
      requestId: incoming.requestId || "",
      name: incoming.name || "",
      contact: incoming.contact || "",
      timestamp: incoming.timestamp || new Date().toLocaleString("ko-KR"),
      image: incoming.image || incoming.imageBase64 || "",
      consent: incoming.consent
        ? "Y"
        : incoming.consent === "N"
        ? "N"
        : incoming.consent || "N",
      clientId: incoming.clientId || "",
      visitorId: incoming.visitorId || "",
      ip: incoming.ip || "",
      ua: incoming.ua || "",
      lang: incoming.lang || "",
      referrer: incoming.referrer || "",
      figureScore: incoming.figureScore,
      backgroundScore: incoming.backgroundScore,
      vibeScore: incoming.vibeScore,
      figureCritique: incoming.figureCritique,
      backgroundCritique: incoming.backgroundCritique,
      vibeCritique: incoming.vibeCritique,
      finalCritique: incoming.finalCritique,
    };

    logger.info("apps-script:request", { requestId });

    const sheetResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sheetPayload),
    });

    const sheetResult = await sheetResponse.text();
    logger.info("apps-script:response", {
      requestId,
      status: sheetResponse.status,
      ok: sheetResponse.ok,
      bodyLen: sheetResult.length,
    });

    if (!sheetResponse.ok) {
      logger.error("apps-script:failed", {
        requestId,
        status: sheetResponse.status,
        preview: sheetResult.slice(0, 500),
      });
    }

    return NextResponse.json(
      { ok: true },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (error) {
    const requestId = crypto.randomUUID();
    logger.error("apps-script:exception", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}
