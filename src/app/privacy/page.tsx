import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | AI 프로필 사진 분석기",
  description: "베럴댄미 AI 프로필 사진 분석기의 개인정보 처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            개인정보 처리방침
          </h1>
          <p className="text-gray-600">시행일자: 2024년 12월</p>
        </div>

        <div className="space-y-8 text-gray-700">
          <section className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 md:p-6 rounded-xl">
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              제1조 (수집하는 개인정보 항목 및 목적)
            </h2>
            <div>
              <p className="font-semibold mb-2">1. 수집 항목</p>
              <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                <li>이름, 연락처(휴대전화번호), 업로드한 사진</li>
                <li>(선택) 이메일 주소 — 이벤트 및 추가 안내용</li>
                <li>
                  clientId(로컬 저장 생성), visitorId(FingerprintJS), IP 주소
                </li>
                <li>
                  브라우저/OS 정보(User-Agent), 언어 설정, 유입 경로(Referrer)
                </li>
              </ul>
              <p className="font-semibold mt-4 mb-2">2. 수집 및 이용 목적</p>
              <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                <li>AI 프로필 사진 분석 결과 제공</li>
                <li>서비스 개선 및 개인화</li>
                <li>이벤트 및 프로모션 안내 (동의 시)</li>
                <li>부정 이용 방지 및 중복 참여 방지(브라우저 지문 활용)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 mt-3 text-sm md:text-base">
              <p>
                ⭐ <strong>특별 안내</strong>: 업로드하신 사진은 AI 분석용으로만
                사용되며, 마케팅 목적으로 사용되지 않습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              제2조 (개인정보 보유 및 이용 기간)
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
              <li>원칙: 이용 목적 달성 시까지 (최대 1년)</li>
              <li>즉시 파기 요청 시: 지체 없이 파기</li>
              <li>법령상 보관 의무가 있는 경우: 해당 기간 동안 보관</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              제3조 (동의 거부와 서비스 제한)
            </h2>
            <p className="text-sm md:text-base">
              필수 정보(이름, 연락처, 사진) 수집에 동의하지 않으실 경우, AI 분석
              서비스를 이용하실 수 없습니다. 선택 정보는 거부하셔도 서비스
              이용에 제한이 없습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              제4조 (개인정보 보호 조치)
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
              <li>암호화된 통신 채널 사용 (HTTPS)</li>
              <li>접근 권한 최소화</li>
              <li>정기적인 보안 점검</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              제5조 (브라우저 지문 수집 및 활용)
            </h2>
            <p className="text-gray-700 mb-2">
              서비스는 부정 이용 방지와 동일인 판단의 정확도 향상을 위해
              오픈소스 FingerprintJS를 사용하여 브라우저 지문을 기반으로 한
              방문자 식별자(visitorId)를 생성·수집합니다. 이는 쿠키/로컬 저장소
              삭제나 시크릿 모드 등에서도 어느 정도 복원력이 있으나, 100% 식별을
              보장하지 않습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
              <li>
                수집 항목: visitorId, clientId, IP, User-Agent, 언어, Referrer
              </li>
              <li>
                이용 목적: 부정 이용 방지, 중복 참여 방지, 보안/오남용 탐지
              </li>
              <li>
                보관 기간: 목적 달성 시 즉시 삭제(법령상 보관의무가 있는 경우
                해당 기간 준수)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              제6조 (권리 행사)
            </h2>
            <p className="text-sm md:text-base mb-4">
              개인정보 열람, 수정, 삭제, 처리 정지 등을 요청하실 수 있습니다.
            </p>
            <div className="rounded-xl border border-gray-200 p-4 mt-3 text-sm md:text-base">
              <p>
                동의 철회 및 문의:{" "}
                <span className="text-gray-500">
                  [
                  <Link
                    href="https://www.instagram.com/better.than.me2040/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-500"
                  >
                    인스타그램
                  </Link>
                  /{" "}
                  <Link
                    href="https://open.kakao.com/o/sDAisnDh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-500"
                  >
                    카카오톡 채널
                  </Link>
                  ]
                </span>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            본 방침은 2024년 12월부터 시행됩니다.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-3 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors"
          >
            돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
