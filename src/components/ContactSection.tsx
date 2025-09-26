"use client";

import { FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import type { ContactFormData } from "@/lib/types";

interface ContactSectionProps {
  formData: ContactFormData;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  hidden?: boolean;
}

export default function ContactSection({
  formData,
  onChange,
  onSubmit,
  hidden = true,
}: ContactSectionProps) {
  const formatPhoneNumber = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, "");

    if (value.length >= 3) {
      value = value.substring(0, 3) + "-" + value.substring(3);
    }
    if (value.length >= 8) {
      value = value.substring(0, 8) + "-" + value.substring(8, 12);
    }

    e.target.value = value;
    onChange(e);
  };

  return (
    <div className={`view-section ${hidden ? "hidden" : ""}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">
          결과를 보기 전, 마지막 단계!
        </h2>
        <p className="text-gray-500 mt-4 text-lg">
          개인정보를 입력해주셔야 결과를 보실 수 있습니다.
          <br />
          결과가 나오기 까지 약 6초가 소요됩니다.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 mt-8" noValidate>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          placeholder="이름 (한글/영문만 가능)"
          className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          required
        />
        <input
          type="tel"
          name="contact"
          value={formData.contact}
          onChange={formatPhoneNumber}
          placeholder="010-1234-5678"
          maxLength={13}
          className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          required
        />
        <div className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3 border border-gray-200">
          <input
            id="contact-consent"
            type="checkbox"
            name="consent"
            checked={formData.consent}
            onChange={onChange}
            className="mt-1 h-5 w-5 text-fuchsia-500 border-gray-300 rounded"
          />
          <label
            htmlFor="contact-consent"
            className="text-gray-700 text-base leading-6"
          >
            개인정보 수집 및 이용에 동의합니다.
            <span className="text-gray-400 text-sm block">
              이름, 연락처, 업로드한 사진은 결과 생성 및 서비스 고도화 목적에만
              사용됩니다.
              <Link
                href="/privacy"
                target="_blank"
                className="text-fuchsia-600 underline ml-1"
              >
                자세히 보기
              </Link>
            </span>
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-900 transition-colors text-lg"
        >
          결과 분석 시작하기 🚀
        </button>
      </form>
    </div>
  );
}
