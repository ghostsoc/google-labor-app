import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { InventoryItem } from '../types';
import {
  QrCode,
  Camera,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onItemFound: (item: InventoryItem, scannedCode: string) => void;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onItemFound,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'itw-qr-reader-container';

  // Sound feedback on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext unavailable or blocked by autoplay policy
    }
  };

  const handleMatchCode = (code: string) => {
    const clean = code.trim().toLowerCase();
    setLastScanned(code);
    playBeep();

    // Match by barcode, SKU, ID, or model
    const matched = inventory.find(
      (item) =>
        item.barcode.toLowerCase() === clean ||
        item.sku.toLowerCase() === clean ||
        item.id.toLowerCase() === clean ||
        clean.includes(item.barcode.toLowerCase()) ||
        clean.includes(item.sku.toLowerCase())
    );

    if (matched) {
      // Stop scanner before handing over
      stopScanner();
      onItemFound(matched, code);
    } else {
      setCameraError(`Scanned code "${code}" does not match any equipment in active fleet.`);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleMatchCode(decodedText);
        },
        () => {
          // ignore frame decode failures
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setIsScanning(false);
      setCameraError(
        err?.message ||
          'Camera access was blocked or is not supported in this browser sandbox. You can use the quick simulation or manual lookup below.'
      );
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow DOM element to render
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-400 text-neutral-950 font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">QR & Barcode Scanner</h2>
              <p className="text-xs text-neutral-400">
                Point camera at equipment case barcode for instant check-in / check-out
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera Viewfinder Box */}
        <div className="relative rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 min-h-[260px] flex items-center justify-center">
          <div id={scannerContainerId} className="w-full h-full" />

          {/* Scanner Overlay Box */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-52 h-52 border-2 border-amber-400 rounded-xl relative shadow-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1" />
                <div className="w-full h-0.5 bg-amber-400 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-md" />
              </div>
            </div>
          )}

          {/* Camera Error or Standby Message */}
          {cameraError && (
            <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-4 text-center">
              <Camera className="w-8 h-8 text-neutral-600 mb-2" />
              <p className="text-xs text-neutral-300 font-medium">Camera Inactive</p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">{cameraError}</p>
              <button
                type="button"
                onClick={startScanner}
                className="mt-3 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Barcode / Asset ID Lookup */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-medium text-neutral-300">
            Manual Barcode / SKU Scan
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. ITW-88201 or AUD-SHU-AD4Q..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualCode) {
                  e.preventDefault();
                  handleMatchCode(manualCode);
                }
              }}
              className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={() => manualCode && handleMatchCode(manualCode)}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Lookup
            </button>
          </div>
        </div>

        {/* Quick Simulated Road Case Barcodes (for warehouse testing) */}
        <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-neutral-400 text-[11px]">
            <span className="font-semibold text-neutral-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Simulate Case Barcode Scan:</span>
            </span>
            <span className="text-[10px]">Click any tag</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {inventory.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMatchCode(item.barcode)}
                className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-[11px] font-mono text-amber-400/90 border border-neutral-800 rounded transition-colors cursor-pointer"
              >
                {item.barcode} ({item.name.split(' ')[0]})
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
