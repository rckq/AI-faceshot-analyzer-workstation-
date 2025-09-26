"use client";

import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export interface ClientInfo {
  clientId: string;
  visitorId: string;
  ip: string;
  ua: string;
  lang: string;
  referrer: string;
}

export function useClientInfo(): ClientInfo {
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientId: "",
    visitorId: "",
    ip: "",
    ua: "",
    lang: "",
    referrer: "",
  });

  useEffect(() => {
    const initializeClientInfo = async () => {
      // Client ID
      let clientId = "";
      try {
        clientId = localStorage.getItem("clientId") || "";
        if (!clientId && crypto && crypto.randomUUID) {
          clientId = crypto.randomUUID();
          localStorage.setItem("clientId", clientId);
        } else if (!clientId) {
          clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          localStorage.setItem("clientId", clientId);
        }
      } catch (e) {
        clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }

      // User Agent
      const ua = navigator.userAgent || "";

      // Language
      const lang =
        navigator.language ||
        (navigator.languages && navigator.languages[0]) ||
        "";

      // Referrer
      let referrer = document.referrer || "";
      try {
        const firstReferrer = localStorage.getItem("firstReferrer");
        if (!firstReferrer && document.referrer) {
          localStorage.setItem("firstReferrer", document.referrer);
        }
        if (!referrer && firstReferrer) {
          referrer = firstReferrer;
        }
      } catch (e) {}

      // Visitor ID from FingerprintJS
      let visitorId = "";
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        visitorId = result.visitorId;
      } catch (e) {
        console.log("FingerprintJS failed to load");
      }

      // IP Address
      let ip = "";
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        ip = data.ip || "";
      } catch (e) {
        console.log("Failed to fetch IP");
      }

      setClientInfo({
        clientId,
        visitorId,
        ip,
        ua,
        lang,
        referrer,
      });
    };

    initializeClientInfo();
  }, []);

  return clientInfo;
}
