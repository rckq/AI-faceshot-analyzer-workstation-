// Google Apps Script 코드
// 이 코드를 Google 스프레드시트의 Apps Script에 붙여넣으세요

// 1. >>>>>>> 이 부분에 구글 드라이브 폴더 ID를 붙여넣어 주세요! <<<<<<<
const FOLDER_ID = "여기에_구글_드라이브_폴더_ID를_입력하세요";

/**
 * 웹 앱에서 POST 요청을 받아 처리하는 메인 함수입니다.
 * action=complete: 개인정보 + 분석결과를 한 번에 저장 (최적화된 방식)
 */
function doPost(e) {
  try {
    // 디버깅을 위한 로그
    console.log("Received request:", JSON.stringify(e, null, 2));

    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    if (!sheet) {
      throw new Error(
        "Sheet named 'Sheet1' not found. Please check the sheet name."
      );
    }

    // 요청 파라미터 (JSON 우선, 실패 시 폴백)
    let p;
    try {
      const postData = e.postData && e.postData.contents;
      if (postData) {
        p = JSON.parse(postData);
      } else {
        p = e.parameter || {};
      }
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      p = e.parameter || {};
    }

    console.log("Parsed parameters:", JSON.stringify(p, null, 2));

    const action = p.action || "complete";
    const name = p.name;
    const contact = p.contact;
    const timestamp = p.timestamp;
    const imageBase64 = p.image;
    const consent = p.consent || "N";

    // 필수 파라미터 검증
    if (!name || !contact || !imageBase64) {
      throw new Error(
        `Missing required fields: name=${!!name}, contact=${!!contact}, image=${!!imageBase64}`
      );
    }

    // AI 분석 점수/코멘트
    const figureScore = p.figureScore || "";
    const backgroundScore = p.backgroundScore || "";
    const vibeScore = p.vibeScore || "";
    const figureCritique = p.figureCritique || "";
    const backgroundCritique = p.backgroundCritique || "";
    const vibeCritique = p.vibeCritique || "";
    const finalCritique = p.finalCritique || "";

    try {
      // 이미지 데이터 확인 및 처리
      let imageData;
      if (imageBase64.includes(",")) {
        imageData = imageBase64.split(",")[1];
      } else {
        imageData = imageBase64;
      }

      if (!imageData) {
        throw new Error("Invalid image data format");
      }

      // 이미지를 구글 드라이브에 저장
      const decodedImage = Utilities.base64Decode(imageData);
      const safeName = (name || "").replace(/[\\/:*?"<>|]/g, "_");
      const safeTimestamp = (
        timestamp || new Date().toLocaleString("ko-KR")
      ).replace(/[:/\s]/g, "_");
      const imageBlob = Utilities.newBlob(
        decodedImage,
        "image/jpeg",
        `${safeName}_${safeTimestamp}.jpg`
      );
      const imageFolder = DriveApp.getFolderById(FOLDER_ID);
      const imageFile = imageFolder.createFile(imageBlob);
      const imageUrl = imageFile.getUrl();

      // 시트 헤더 가져오기
      const headers = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0];
      console.log("Sheet headers:", JSON.stringify(headers));

      // 락 서비스로 동시 쓰기 방지
      const lock = LockService.getDocumentLock();
      lock.waitLock(20000); // 최대 20초 대기

      try {
        // 모든 데이터를 한 번에 저장
        const rowMap = {
          요청ID: p.requestId || "",
          타임스탬프: timestamp || new Date().toLocaleString("ko-KR"),
          이름: name || "",
          연락처: contact || "",
          "이미지 URL": imageUrl || "",
          "최종 한줄평": finalCritique || "",
          인물: figureScore || "",
          배경: backgroundScore || "",
          감성: vibeScore || "",
          "인물 코멘트": figureCritique || "",
          "배경 코멘트": backgroundCritique || "",
          "감성 코멘트": vibeCritique || "",
          visitorId: p.visitorId || "",
          clientId: p.clientId || "",
          ip: p.ip || "",
          ua: p.ua || "",
          lang: p.lang || "",
          referrer: p.referrer || "",
          동의: consent || "N",
          상태: figureScore ? "DONE" : "PENDING",
          업데이트시각: new Date().toLocaleString("ko-KR"),
        };

        console.log("Row data to insert:", JSON.stringify(rowMap, null, 2));

        // 헤더 별칭 처리 (대소문자/오탈자 허용)
 // 헤더 정규화 후 인덱스 매핑
const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
.map((h) => String(h || "").trim());
const norm = (s) => String(s || "").replace(/\s+/g, "").toLowerCase();
const headerIndex = Object.fromEntries(headers.map((h, i) => [norm(h), i]));

// 숫자 강제(숫자 아니면 빈칸)
const toInt = (v) => {
const n = parseInt(v, 10);
return Number.isFinite(n) ? n : "";
};

// 행 버퍼와 셀 쓰기 도우미
const row = new Array(headers.length).fill("");
function put(headerName, value) {
const idx = headerIndex[norm(headerName)];
if (idx >= 0) row[idx] = value ?? "";
}

// 정확 매핑(시트 헤더 기준)
put("요청ID", p.requestId || "");
put("타임스탬프", timestamp || new Date().toLocaleString("ko-KR"));
put("이름", name || "");
put("연락처", contact || "");
put("이미지 URL", imageUrl || "");
put("최종 한줄평", finalCritique || "");

// 점수(숫자 강제)
put("인물", toInt(figureScore));
put("배경", toInt(backgroundScore));
put("감성", toInt(vibeScore));

// 코멘트
put("인물 코멘트", figureCritique || "");
put("배경 코멘트", backgroundCritique || "");
put("감성 코멘트", vibeCritique || "");

// 메타
put("visitorId", p.visitorId || "");
put("clientId", p.clientId || "");
put("ip", p.ip || "");
put("ua", p.ua || "");
put("lang", p.lang || "");
put("referrer", p.referrer || "");
put("동의", consent || "N");
put("상태", figureScore ? "DONE" : "PENDING");
put("업데이트시각", new Date().toLocaleString("ko-KR"));

// 시트 기록
sheet.appendRow(row);
      } finally {
        lock.releaseLock();
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          ok: true,
          requestId: p.requestId,
          fileUrl: imageUrl,
          action: "complete",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } catch (imageError) {
      console.error("Image processing error:", imageError);
      throw new Error("Image processing failed: " + imageError.message);
    }
  } catch (error) {
    console.error("Apps Script Error:", error);
    const errorResponse = {
      result: "error",
      message: error.message,
      stack: error.stack,
    };
    console.error("Error response:", JSON.stringify(errorResponse, null, 2));
    return ContentService.createTextOutput(
      JSON.stringify(errorResponse)
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 이 스크립트가 구글 드라이브에 접근할 수 있도록 권한을 강제로 요청하는 테스트 함수입니다.
 * 설정 과정에서 딱 한 번만 실행하고, 권한 허용 후에는 삭제해도 됩니다.
 */
function forceDrivePermission() {
  try {
    DriveApp.getFolderById(FOLDER_ID);
    Logger.log("Google Drive permission is already granted.");
  } catch (e) {
    Logger.log(
      "Requesting Google Drive permission. Please follow the prompts. Error: " +
        e.message
    );
  }
}
