"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { X, Camera, CameraOff, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastScanned, setLastScanned] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const startScanner = useCallback(async (deviceId?: string) => {
    if (!videoRef.current) return;
    setStatus("loading");

    try {
      // Хуучин reader-ийг зогсоох
      if (readerRef.current) {
        await BrowserMultiFormatReader.releaseAllStreams();
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Боломжит камерууд авах
      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(videoDevices);

      // Арын камер сонгох (байвал)
      const backCamera = videoDevices.find(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
      );
      const chosenId = deviceId || backCamera?.deviceId || videoDevices[0]?.deviceId;
      if (chosenId) setSelectedDevice(chosenId);

      if (!chosenId) {
        setStatus("error");
        setErrorMsg("Камер олдсонгүй");
        return;
      }

      setStatus("scanning");

      await reader.decodeFromVideoDevice(
        chosenId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            if (text !== lastScanned) {
              setLastScanned(text);
              // Амжилттай уншсаны дараа дуу гаргах
              try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
              } catch {}
              onScan(text);
            }
          }
          if (err && !(err instanceof NotFoundException)) {
            console.warn("Scanner warning:", err);
          }
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setStatus("error");
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setErrorMsg("Камерт зөвшөөрөл олгоно уу");
        } else if (err.name === "NotFoundError") {
          setErrorMsg("Камер олдсонгүй");
        } else {
          setErrorMsg("Камер нээхэд алдаа гарлаа: " + err.message);
        }
      }
    }
  }, [lastScanned, onScan]);

  useEffect(() => {
    startScanner();
    return () => {
      BrowserMultiFormatReader.releaseAllStreams();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    startScanner(deviceId);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-[#0f172a]">
        {/* Толгой */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Camera className="size-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Баркод уншуулах</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Видео хэсэг */}
        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Тархалтын хамрах хэрэгсэл */}
          {status === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-40">
                {/* Булангийн хүрээнүүд */}
                {[
                  "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
                  "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
                  "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
                  "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 border-blue-400 ${cls}`} />
                ))}
                {/* Скан шугам */}
                <div
                  className="absolute left-2 right-2 h-0.5 bg-blue-400/70"
                  style={{
                    top: "50%",
                    boxShadow: "0 0 8px 2px rgba(96,165,250,0.5)",
                    animation: "scanLine 2s ease-in-out infinite",
                  }}
                />
              </div>
              {/* Загвар хэв */}
              <style>{`
                @keyframes scanLine {
                  0%, 100% { top: 20%; }
                  50% { top: 80%; }
                }
              `}</style>
            </div>
          )}

          {/* Ачаалж байна */}
          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
              <Loader2 className="size-8 text-blue-400 animate-spin" />
              <p className="text-sm text-white/80">Камер нэхэж байна...</p>
            </div>
          )}

          {/* Алдаа */}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4 text-center">
              <CameraOff className="size-10 text-red-400" />
              <p className="text-sm text-white font-medium">{errorMsg}</p>
              <button
                onClick={() => startScanner(selectedDevice)}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Дахин оролдох
              </button>
            </div>
          )}
        </div>

        {/* Доод хэсэг */}
        <div className="px-4 py-3 space-y-3">
          {/* Камер сонгох (олон камер байвал) */}
          {devices.length > 1 && (
            <select
              value={selectedDevice}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full rounded-lg bg-white/10 border border-white/20 text-white text-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId} className="bg-[#1e293b]">
                  {d.label || `Камер ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          )}

          <p className="text-xs text-white/50 text-center">
            {status === "scanning"
              ? "Баркодыг дөрвөлжин хүрээн дотор байрлуул"
              : status === "loading"
              ? "Камер эхлүүлж байна..."
              : "Камер нээгдсэнгүй"}
          </p>
        </div>
      </div>
    </div>
  );
}