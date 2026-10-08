import React from 'react';
import { ShiftLaborCostDetails, ROLE_BASE_RATES } from '../utils/laborCostUtils';
import {
  DollarSign,
  Clock,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react';

interface ShiftLaborCostDetailModalProps {
  details: ShiftLaborCostDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftLaborCostDetailModal: React.FC<ShiftLaborCostDetailModalProps> = ({
  details,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !details) return null;

  const benchmark = ROLE_BASE_RATES[details.role];

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
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Shift Labor Cost Calculation
            </h2>
            <p className="text-xs text-neutral-400">
              Role-based pay rate and overtime hour breakdown for live production shift
            </p>
          </div>
        </div>

        {/* Technician & Shift Context Card */}
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">{details.staffName}</span>
            <span className="px-2 py-0.5 rounded font-mono font-medium text-[11px] bg-amber-950 text-amber-300 border border-amber-800/80">
              {details.role}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-neutral-400 font-mono text-[11px] pt-1 border-t border-neutral-800/80">
            <div>
              <span className="text-neutral-500 block">Production Call:</span>
              <span className="text-neutral-200 font-sans truncate block">{details.eventName}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Date & Shift Call:</span>
              <span className="text-neutral-200 block">
                {details.date} · {details.startTime}–{details.endTime}
              </span>
            </div>
          </div>
        </div>

        {/* Total Cost Highlight Pill */}
        <div className="bg-gradient-to-r from-neutral-950 to-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Estimated Total Shift Outlay
            </span>
            <span className="text-2xl font-bold font-mono text-amber-400 mt-0.5 block">
              ${details.totalEstimatedCost.toFixed(2)}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              Calculation mode: {details.rateType} ({details.totalHours} hrs scheduled)
            </span>
          </div>

          {details.hasOvertime ? (
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-mono text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Overtime Active</span>
              </span>
              <span className="text-[10px] text-neutral-400 block mt-1 font-mono">
                +{details.otHours + details.doubleTimeHours}h beyond standard 10h
              </span>
            </div>
          ) : (
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Standard Day</span>
              </span>
              <span className="text-[10px] text-neutral-400 block mt-1 font-mono">
                No overtime penalty
              </span>
            </div>
          )}
        </div>

        {/* Itemized Calculation Math */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
            Itemized Pay Math & Tier Breakdown
          </span>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl divide-y divide-neutral-800/80 text-xs font-mono">
            {/* Regular Base Pay */}
            <div className="p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">
                  {details.rateType === 'Day Rate'
                    ? 'Guaranteed 10-Hour Day Rate'
                    : `Straight-Time Regular Hours (${details.regularHours}h @ $${details.effectiveHourlyRate}/hr)`}
                </span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  Standard production baseline call (up to 10 hours)
                </span>
              </div>
              <span className="font-bold text-white text-sm">
                ${details.regularPay.toFixed(2)}
              </span>
            </div>

            {/* Overtime (1.5x) */}
            <div className="p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span>Overtime (1.5x Rate)</span>
                  {details.otHours > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      {details.otHours} hrs @ ${(details.effectiveHourlyRate * 1.5).toFixed(2)}/hr
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  Hours worked between 10.0 and 14.0 hours
                </span>
              </div>
              <span
                className={`font-bold text-sm ${
                  details.otPay > 0 ? 'text-amber-400' : 'text-neutral-500'
                }`}
              >
                ${details.otPay.toFixed(2)}
              </span>
            </div>

            {/* Double-Time (2.0x) */}
            {details.doubleTimeHours > 0 && (
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span>Double Time (2.0x Rate)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {details.doubleTimeHours} hrs @ ${(details.effectiveHourlyRate * 2.0).toFixed(2)}/hr
                    </span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-normal">
                    Golden hour penalty (hours worked beyond 14.0 hours)
                  </span>
                </div>
                <span className="font-bold text-sm text-rose-400">
                  ${details.doubleTimePay.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Role-Based Market Benchmark Reference */}
        {benchmark && (
          <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Industry Role Benchmark ({details.role}):</span>
              </span>
              <span className="text-white font-bold">
                ${benchmark.hourlyRate}/hr · ${benchmark.dayRate}/day
              </span>
            </div>
            <p className="text-[10px] text-neutral-500">
              {benchmark.description}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
