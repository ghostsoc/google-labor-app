import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { InventoryItem } from '../types';
import { useApp } from '../context/AppContext';
import {
  QrCode,
  Printer,
  Download,
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Wrench,
  MapPin,
  Tag,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ItemQRCodeModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onQuickActionFeedback?: (msg: string) => void;
}

export const ItemQRCodeModal: React.FC<ItemQRCodeModalProps> = ({
  item,
  isOpen,
  onClose,
  onQuickActionFeedback,
}) => {
  const { updateInventoryItem, settings } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState<'normal' | 'large'>('normal');
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Encode standard equipment payload for warehouse scanners
  const qrPayload = item.barcode;

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(qrPayload, {
      width: qrSize === 'large' ? 400 : 260,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H', // High error correction so labels can withstand road scuffs
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [item, qrPayload, qrSize, isOpen]);

  if (!isOpen) return null;

  const showFlash = (msg: string) => {
    setActionNotice(msg);
    if (onQuickActionFeedback) onQuickActionFeedback(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Quick Check-out (-1 available, +1 on-rent)
  const handleQuickCheckOut = () => {
    if (item.availableQuantity <= 0) {
      showFlash(`No units of ${item.name} currently available to check out.`);
      return;
    }
    const newAvail = item.availableQuantity - 1;
    const newOnRent = item.onRentQuantity + 1;
    updateInventoryItem(item.id, {
      availableQuantity: newAvail,
      onRentQuantity: newOnRent,
    });
    showFlash(`Checked OUT 1 unit to show/truck (Warehouse: ${newAvail} left)`);
  };

  // Quick Check-in (+1 available, -1 on-rent)
  const handleQuickCheckIn = () => {
    if (item.onRentQuantity <= 0) {
      showFlash(`No units of ${item.name} are currently recorded as on-rent.`);
      return;
    }
    const newOnRent = item.onRentQuantity - 1;
    const newAvail = item.availableQuantity + 1;
    updateInventoryItem(item.id, {
      availableQuantity: newAvail,
      onRentQuantity: newOnRent,
    });
    showFlash(`Checked IN 1 unit from show return (Warehouse: ${newAvail} available)`);
  };

  // Download QR code PNG
  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${item.sku}_${item.barcode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print individual road case label tag
  const handlePrintTag = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=500');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Tag - ${item.sku}</title>
          <style>
            @page {
              size: 3in 2in;
              margin: 0.1in;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 6px;
              color: #000;
              background: #fff;
              box-sizing: border-box;
            }
            .label-box {
              border: 2px solid #000;
              border-radius: 6px;
              padding: 6px 8px;
              display: flex;
              gap: 8px;
              align-items: center;
              height: calc(2in - 14px);
              box-sizing: border-box;
            }
            .qr-side {
              flex-shrink: 0;
              text-align: center;
            }
            .qr-side img {
              width: 95px;
              height: 95px;
              display: block;
            }
            .qr-side .code-text {
              font-size: 8px;
              font-family: monospace;
              font-weight: bold;
              margin-top: 2px;
            }
            .info-side {
              flex: 1;
              overflow: hidden;
            }
            .company-name {
              font-size: 8px;
              font-weight: 800;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              color: #444;
              border-bottom: 1px solid #ccc;
              padding-bottom: 2px;
              margin-bottom: 4px;
            }
            .item-title {
              font-size: 11px;
              font-weight: 800;
              line-height: 1.15;
              max-height: 38px;
              overflow: hidden;
              margin-bottom: 4px;
            }
            .meta-row {
              font-size: 8px;
              margin-bottom: 2px;
              display: flex;
              justify-content: space-between;
              font-family: monospace;
            }
            .sku-badge {
              font-weight: bold;
              background: #000;
              color: #fff;
              padding: 1px 4px;
              border-radius: 2px;
            }
            .bin-badge {
              font-weight: bold;
              border: 1px solid #000;
              padding: 0px 3px;
              border-radius: 2px;
            }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="qr-side">
              <img src="${qrDataUrl}" alt="QR Code" />
              <div class="code-text">${item.barcode}</div>
            </div>
            <div class="info-side">
              <div class="company-name">${settings.companyName || 'IN THE WIND AV'}</div>
              <div class="item-title">${item.name}</div>
              <div class="meta-row">
                <span>SKU: <span class="sku-badge">${item.sku}</span></span>
                <span>BIN: <span class="bin-badge">${item.locationBin}</span></span>
              </div>
              <div class="meta-row" style="margin-top: 3px; color: #555;">
                <span>Cat: ${item.category}</span>
                <span>Day Rate: $${item.dayRate}</span>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 750);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyPayloadToClipboard = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shadow-xs">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Asset QR Code & Scanning Tag
            </h2>
            <p className="text-xs text-neutral-400">
              High-density scannable barcode tag for warehouse dispatch, check-out and return
            </p>
          </div>
        </div>

        {/* Flash action notice */}
        {actionNotice && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{actionNotice}</span>
          </div>
        )}

        {/* QR Code Presentation Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex flex-col items-center justify-center space-y-4">
          {/* Printable Label Simulation Card */}
          <div className="bg-white text-neutral-950 rounded-xl p-4 shadow-lg flex items-center gap-4 max-w-sm w-full border border-neutral-200">
            {/* Rendered QR Image */}
            <div className="shrink-0 flex flex-col items-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${item.name}`}
                  className="w-28 h-28 object-contain rounded-md"
                />
              ) : (
                <div className="w-28 h-28 bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 rounded-md">
                  Generating...
                </div>
              )}
              <span className="text-[10px] font-mono font-bold mt-1 text-neutral-800">
                {item.barcode}
              </span>
            </div>

            {/* Label details */}
            <div className="flex-1 space-y-1.5 text-left overflow-hidden">
              <div className="text-[9px] font-mono uppercase font-bold text-neutral-500 border-b border-neutral-300 pb-0.5">
                {settings.companyName || 'IN THE WIND AV'} · ASSET TAG
              </div>
              <h4 className="text-xs font-bold text-neutral-950 leading-tight line-clamp-2">
                {item.name}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-0.5">
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white font-bold">
                  {item.sku}
                </span>
                <span className="px-1.5 py-0.5 rounded border border-neutral-400 text-neutral-800 font-semibold">
                  BIN: {item.locationBin}
                </span>
              </div>
              <div className="text-[10px] text-neutral-600 font-mono">
                <span>Cat: {item.category}</span>
                <span className="ml-2 font-bold">${item.dayRate}/day</span>
              </div>
            </div>
          </div>

          {/* Encoded payload bar */}
          <div className="flex items-center justify-between w-full max-w-sm px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-400">
            <span className="text-[11px] truncate">
              Payload: <strong className="text-amber-400">{qrPayload}</strong>
            </span>
            <button
              type="button"
              onClick={copyPayloadToClipboard}
              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedPayload ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Live Warehouse Stock Summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase">Warehouse Avail</span>
            <span
              className={`text-base font-bold ${
                item.availableQuantity > 0 ? 'text-emerald-400' : 'text-neutral-500'
              }`}
            >
              {item.availableQuantity}
            </span>
            <span className="text-[10px] text-neutral-500 block">units ready</span>
          </div>

          <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase">On-Rent Shows</span>
            <span className="text-base font-bold text-amber-400">{item.onRentQuantity}</span>
            <span className="text-[10px] text-neutral-500 block">dispatched</span>
          </div>

          <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase">Total Fleet</span>
            <span className="text-base font-bold text-white">{item.totalQuantity}</span>
            <span className="text-[10px] text-neutral-500 block">catalog stock</span>
          </div>
        </div>

        {/* Quick Check-Out / Check-In Action Buttons */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
            Instant Scan Action Emulation
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickCheckOut}
              disabled={item.availableQuantity <= 0}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 border border-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              <span>Check OUT to Show (-1)</span>
            </button>

            <button
              type="button"
              onClick={handleQuickCheckIn}
              disabled={item.onRentQuantity <= 0}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 hover:text-emerald-200 border border-neutral-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Check IN from Return (+1)</span>
            </button>
          </div>
        </div>

        {/* Bottom Utility Controls: Print Label & Download PNG */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintTag}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Road Case Label</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>Download PNG</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
