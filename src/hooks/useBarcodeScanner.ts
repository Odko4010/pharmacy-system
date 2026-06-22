"use client";

import { useEffect, useRef, useCallback } from "react";

interface Options {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  timeout?: number;
}

/**
 * POS баркод уншигч нь USB HID keyboard горимоор ажилладаг:
 * тэмдэгтүүдийг маш хурдан (50ms доор) дараалан "бичиж", Enter дарна.
 *
 * Энэ hook нь:
 * - Input/textarea-д focus байвал оролцохгүй (тухайн талбар өөрөө авна)
 * - Хурдан ирсэн тэмдэгтүүдийг buffer-т хуримтлуулна
 * - Enter эсвэл 80ms тайван байвал flush хийж onScan дуудна
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 3,
  timeout = 80,
}: Options) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const code = bufferRef.current.trim();
    bufferRef.current = "";
    if (code.length >= minLength) {
      onScan(code);
    }
  }, [onScan, minLength]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Input/textarea/select-д focus байвал тухайн талбар өөрөө авна
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (timerRef.current) clearTimeout(timerRef.current);
        flush();
        return;
      }

      // 500ms-ээс удсан бол хүн гараар бичиж байна → buffer цэвэрлэ
      if (gap > 500 && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, timeout);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, flush, timeout]);
}