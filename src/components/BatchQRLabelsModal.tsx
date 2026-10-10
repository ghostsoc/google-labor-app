import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { InventoryItem } from '../types';
import { useApp } from '../context/AppContext';
import {
  Printer,
  X,
  CheckCircle2,
  Filter,
  CheckSquare,
  Square,
  QrCode,
  Tag,
  Download,
} from 'lucide-react';

interface BatchQRLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
}

interface ItemWithQR extends InventoryItem {
  qrUrl?: string;
}

export const BatchQRLabelsModal: React.FC<BatchQRLabelsModalProps> = ({
  isOpen,
  onClose,
  inventory,
}) => {
  const { settings } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [itemsWithQR, setItemsWithQR] = useState<ItemWithQR[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [warningNotice, setWarningNotice] = useState<string | null>(null);

  // Initialize selected IDs with all items
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(inventory.map((item) => item.id));
    }
  }, [isOpen, inventory]);

  // Generate QR codes for all items
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    setIsGenerating(true);

    const generateQRs = async () => {
      try {
        const enriched = await Promise.all(
          inventory.map(async (item) => {
            const qrUrl = await QRCode.toDataURL(item.barcode, {
              width: 180,
              margin: 1,
              errorCorrectionLevel: 'M',
            });
            return { ...item, qrUrl };
          })
        );
        if (!isCancelled) {
          setItemsWithQR(enriched);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Error generating batch QR codes:', err);
        if (!isCancelled) setIsGenerating(false);
      }
    };

    generateQRs();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, inventory]);

  if (!isOpen) return null;

  const filteredItems = itemsWithQR.filter(
    (item) => categoryFilter === 'All' || item.category === categoryFilter
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePrintSheet = () => {
    const itemsToPrint = itemsWithQR.filter((i) => selectedIds.includes(i.id));
    if (itemsToPrint.length === 0) {
      setWarningNotice('Please select at least one item to print QR labels.');
      setTimeout(() => setWarningNotice(null), 3000);
      return;
    }

    const labelsHtml = itemsToPrint
      .map(
        (item) => `
        <div class="label-card">
          <div class="qr-col">
            <img src="${item.qrUrl}" alt="QR" />
            <div class="barcode-num">${item.barcode}</div>
          </div>
          <div class="info-col">
            <div class="brand">${settings.companyName || 'IN THE WIND AV'}</div>
            <div class="name">${item.name}</div>
            <div class="meta">
              <span><strong>SKU:</strong> ${item.sku}</span>
              <span><strong>BIN:</strong> ${item.locationBin}</span>
            </div>
            <div class="sub-meta">
              <span>Cat: ${item.category}</span>
              <span>Rate: $${item.dayRate}/day</span>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    const printableHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Equipment QR Asset Labels - ${settings.companyName || 'In The Wind AV'}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 0.4in;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 0;
              color: #000;
              background: #fff;
            }
            .header-bar {
              margin-bottom: 12px;
              border-bottom: 2px solid #000;
              padding-bottom: 4px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              font-family: monospace;
            }
            .labels-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .label-card {
              border: 1.5px solid #000;
              border-radius: 6px;
              padding: 6px 8px;
              display: flex;
              align-items: center;
              gap: 8px;
              page-break-inside: avoid;
              background: #fff;
              height: 105px;
              box-sizing: border-box;
            }
            .qr-col {
              flex-shrink: 0;
              text-align: center;
            }
            .qr-col img {
              width: 78px;
              height: 78px;
              display: block;
            }
            .barcode-num {
              font-size: 8px;
              font-family: monospace;
              font-weight: bold;
              margin-top: 1px;
            }
            .info-col {
              flex: 1;
              overflow: hidden;
            }
            .brand {
              font-size: 8px;
              font-weight: bold;
              text-transform: uppercase;
              color: #555;
              border-bottom: 1px solid #ddd;
              padding-bottom: 1px;
              margin-bottom: 3px;
            }
            .name {
              font-size: 10px;
              font-weight: 800;
              line-height: 1.2;
              max-height: 28px;
              overflow: hidden;
              margin-bottom: 3px;
            }
            .meta {
              font-size: 8px;
              font-family: monospace;
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .sub-meta {
              font-size: 8px;
              color: #666;
              font-family: monospace;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <span>${settings.companyName || 'IN THE WIND AV'} · WAREHOUSE ASSET LABELS</span>
            <span>DATE: ${new Date().toISOString().split('T')[0]} · ${itemsToPrint.length} TAGS</span>
          </div>
          <div class="labels-grid">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `;

    try {
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.visibility = 'hidden';
      document.body.appendChild(printFrame);

      let frameDoc: Document | null = null;
      try {
        frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document || null;
      } catch {
        frameDoc = null;
      }

      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(printableHtml);
        frameDoc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch {
            window.print();
          } finally {
            setTimeout(() => {
              try {
                if (document.body.contains(printFrame)) {
                  document.body.removeChild(printFrame);
                }
              } catch {}
            }, 1000);
          }
        }, 250);
        return;
      }
    } catch {
      // Fallback if sandboxed iframe policy blocks dynamic frames
    }

    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shadow-xs">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Batch Print QR Asset Labels
            </h2>
            <p className="text-xs text-neutral-400">
              Generate and print warehouse sticker labels with QR codes, bin locations, and SKUs
            </p>
          </div>
        </div>

        {/* Warning Notification */}
        {warningNotice && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span>{warningNotice}</span>
          </div>
        )}

        {/* Filter and Selection Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-mono">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded-md text-white font-medium focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Categories ({itemsWithQR.length})</option>
              <option value="Audio">Audio</option>
              <option value="Video">Video</option>
              <option value="Lighting">Lighting</option>
              <option value="Rigging & Power">Rigging & Power</option>
              <option value="Staging & Truss">Staging & Truss</option>
              <option value="Cables & Comms">Cables & Comms</option>
            </select>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer"
            >
              {selectedIds.length === filteredItems.length ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-neutral-500" />
              )}
              <span>Select All ({filteredItems.length})</span>
            </button>
            <span className="text-neutral-500">|</span>
            <span className="text-amber-400 font-bold">{selectedIds.length} Selected</span>
          </div>
        </div>

        {/* Scrollable Item List with QR Previews */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80 pr-1 space-y-1">
          {isGenerating ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <QrCode className="w-8 h-8 mx-auto animate-pulse text-amber-400" />
              <p className="text-xs font-mono">Rendering QR barcodes for equipment fleet...</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelectItem(item.id)}
                  className={`p-2.5 rounded-lg flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800/60 border border-amber-400/30'
                      : 'hover:bg-neutral-800/30 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="accent-amber-400 cursor-pointer"
                    />

                    {/* QR Thumbnail */}
                    {item.qrUrl && (
                      <img
                        src={item.qrUrl}
                        alt="QR"
                        className="w-10 h-10 object-contain bg-white rounded p-0.5"
                      />
                    )}

                    <div>
                      <div className="font-semibold text-white text-xs">{item.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span className="text-amber-300 font-bold">{item.sku}</span>
                        <span>·</span>
                        <span>BC: {item.barcode}</span>
                        <span>·</span>
                        <span>Bin: {item.locationBin}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono shrink-0">
                    <div className="text-neutral-300">{item.category}</div>
                    <div className="text-[10px] text-neutral-500">
                      {item.totalQuantity} fleet units
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800 shrink-0 text-xs">
          <span className="text-neutral-500 font-mono text-[11px]">
            Formats standard 2-column letter sheet or Avery labels
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePrintSheet}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span>Print {selectedIds.length} QR Labels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
