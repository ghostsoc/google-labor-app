import React, { useState } from 'react';
import { StaffMember, CrewRole, LaborShift } from '../types';
import {
  Calculator,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface LaborCostCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember[];
  onApplyToShift?: (data: {
    staffId: string;
    role: CrewRole;
    startTime: string;
    endTime: string;
    hours: number;
    rate: number;
    rateType: 'Day Rate' | 'Hourly';
    notes: string;
  }) => void;
}

export const LaborCostCalculatorModal: React.FC<LaborCostCalculatorModalProps> = ({
  isOpen,
  onClose,
  staff,
  onApplyToShift,
}) => {
  const [mode, setMode] = useState<'single' | 'crew'>('single');

  // Single shift state
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || '');
  const [customHourlyRate, setCustomHourlyRate] = useState<number>(staff[0]?.hourlyRate || 75);
  const [startTime, setStartTime] = useState<string>('07:00');
  const [endTime, setEndTime] = useState<string>('19:00');
  const [mealBreakMinutes, setMealBreakMinutes] = useState<number>(60);
  const [otThresholdHours, setOtThresholdHours] = useState<number>(10); // Standard 10-hr day guarantee in live production
  const [doubleTimeThresholdHours, setDoubleTimeThresholdHours] = useState<number>(14);

  // Multi-crew event estimator state
  const [eventDurationHours, setEventDurationHours] = useState<number>(12);
  const [crewRosterSelection, setCrewRosterSelection] = useState<
    { id: string; staffId: string; count: number }[]
  >([
    { id: '1', staffId: staff[0]?.id || '', count: 1 },
    { id: '2', staffId: staff[1]?.id || '', count: 1 },
    { id: '3', staffId: staff[5]?.id || staff[0]?.id || '', count: 2 },
  ]);
  const [payrollBurdenPercent, setPayrollBurdenPercent] = useState<number>(12); // Workers comp / payroll admin overhead

  if (!isOpen) return null;

  // Selected staff member
  const currentStaff = staff.find((s) => s.id === selectedStaffId) || staff[0];
  const effectiveHourlyRate = customHourlyRate || currentStaff?.hourlyRate || 75;

  // Time difference calculation
  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 10;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Spans midnight
    return Number((diffMinutes / 60).toFixed(2));
  };

  const elapsedHours = calculateDuration(startTime, endTime);
  const billableHours = Math.max(0, Number((elapsedHours - mealBreakMinutes / 60).toFixed(2)));

  // Tiered calculation
  const regularHours = Math.min(billableHours, otThresholdHours);
  const regularCost = regularHours * effectiveHourlyRate;

  const overtimeHours = Math.max(
    0,
    Math.min(billableHours - otThresholdHours, doubleTimeThresholdHours - otThresholdHours)
  );
  const overtimeCost = overtimeHours * (effectiveHourlyRate * 1.5);

  const doubleTimeHours = Math.max(0, billableHours - doubleTimeThresholdHours);
  const doubleTimeCost = doubleTimeHours * (effectiveHourlyRate * 2.0);

  const totalCalculatedLaborCost = Number((regularCost + overtimeCost + doubleTimeCost).toFixed(2));
  const effectiveAverageRate =
    billableHours > 0 ? Number((totalCalculatedLaborCost / billableHours).toFixed(2)) : 0;

  // Multi-crew calculations
  const calculateCrewLineCost = (staffMember: StaffMember, duration: number) => {
    const rate = staffMember.hourlyRate;
    const regH = Math.min(duration, otThresholdHours);
    const otH = Math.max(0, Math.min(duration - otThresholdHours, doubleTimeThresholdHours - otThresholdHours));
    const dtH = Math.max(0, duration - doubleTimeThresholdHours);
    return regH * rate + otH * (rate * 1.5) + dtH * (rate * 2.0);
  };

  const crewSummary = crewRosterSelection.map((item) => {
    const member = staff.find((s) => s.id === item.staffId) || staff[0];
    const unitCost = calculateCrewLineCost(member, eventDurationHours);
    const lineTotal = unitCost * item.count;
    return {
      member,
      count: item.count,
      unitCost,
      lineTotal,
    };
  });

  const totalCrewBaseCost = crewSummary.reduce((sum, item) => sum + item.lineTotal, 0);
  const payrollBurdenAmount = (totalCrewBaseCost * payrollBurdenPercent) / 100;
  const grandTotalCrewBudget = totalCrewBaseCost + payrollBurdenAmount;

  const handleApplySingleToShift = () => {
    if (onApplyToShift && currentStaff) {
      onApplyToShift({
        staffId: currentStaff.id,
        role: currentStaff.role,
        startTime,
        endTime,
        hours: billableHours,
        rate: totalCalculatedLaborCost,
        rateType: 'Day Rate',
        notes: `Calculated: ${regularHours.toFixed(1)}h straight + ${overtimeHours.toFixed(1)}h OT(1.5x) + ${doubleTimeHours.toFixed(1)}h DT(2.0x)`,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400 text-neutral-950 font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Labor Cost & Overtime Calculator</h2>
              <p className="text-xs text-neutral-400">
                Automated rate tiering for straight time, overtime (1.5x), and meal break adjustments
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => setMode('single')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'single'
                ? 'bg-neutral-800 text-amber-400 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Individual Shift Calculation
          </button>
          <button
            onClick={() => setMode('crew')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'crew'
                ? 'bg-neutral-800 text-amber-400 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Event Crew Call Budget Estimator
          </button>
        </div>

        {/* MODE 1: Single Shift Calculator */}
        {mode === 'single' && (
          <div className="space-y-4">
            {/* Input grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Select Crew Member</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    const s = staff.find((m) => m.id === e.target.value);
                    if (s) setCustomHourlyRate(s.hourlyRate);
                  }}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-medium focus:outline-none focus:border-amber-400"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - ${s.hourlyRate}/hr
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Base Hourly Rate ($/hr)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customHourlyRate}
                  onChange={(e) => setCustomHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Call Time (Start)</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Wrap Time (End)</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Unpaid Meal Break</label>
                <select
                  value={mealBreakMinutes}
                  onChange={(e) => setMealBreakMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={0}>No Meal Break (Continuous call)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (Standard production meal window)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Overtime Threshold</label>
                <select
                  value={otThresholdHours}
                  onChange={(e) => setOtThresholdHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={8}>After 8 Hours (California standard day)</option>
                  <option value={10}>After 10 Hours (AV 10-hr day guarantee)</option>
                </select>
              </div>
            </div>

            {/* Live Calculation Breakdown Box */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2">
                <span className="font-semibold text-neutral-300">Shift Duration & Billable Hours</span>
                <span className="font-mono text-amber-400 font-bold">
                  {elapsedHours} elapsed · {billableHours} billable hours
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {/* Straight time */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">
                    Straight Time ({regularHours.toFixed(1)} hrs @ ${effectiveHourlyRate.toFixed(2)}/hr):
                  </span>
                  <span className="font-mono text-white tabular-nums">${regularCost.toFixed(2)}</span>
                </div>

                {/* Overtime */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">
                    Overtime 1.5x ({overtimeHours.toFixed(1)} hrs @ ${(effectiveHourlyRate * 1.5).toFixed(2)}/hr):
                  </span>
                  <span className={`font-mono tabular-nums ${overtimeCost > 0 ? 'text-amber-400 font-semibold' : 'text-neutral-500'}`}>
                    ${overtimeCost.toFixed(2)}
                  </span>
                </div>

                {/* Double time */}
                {doubleTimeHours > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-rose-400">
                      Double Time 2.0x ({doubleTimeHours.toFixed(1)} hrs @ ${(effectiveHourlyRate * 2.0).toFixed(2)}/hr):
                    </span>
                    <span className="font-mono text-rose-400 font-bold tabular-nums">
                      ${doubleTimeCost.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="pt-2 border-t border-neutral-800 flex items-baseline justify-between">
                  <div>
                    <span className="font-bold text-white text-sm">Estimated Total Shift Cost:</span>
                    <span className="text-[11px] text-neutral-400 block font-mono">
                      (Effective Average: ${effectiveAverageRate}/hr)
                    </span>
                  </div>
                  <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                    ${totalCalculatedLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              {onApplyToShift && (
                <button
                  type="button"
                  onClick={handleApplySingleToShift}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  <span>Apply & Dispatch Shift</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: Event Crew Call Budget Estimator */}
        {mode === 'crew' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Standard Event Call Duration</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="4"
                    max="24"
                    value={eventDurationHours}
                    onChange={(e) => setEventDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-neutral-400 shrink-0">hours</span>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Payroll Overhead / Burden (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={payrollBurdenPercent}
                    onChange={(e) => setPayrollBurdenPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-neutral-400 shrink-0">%</span>
                </div>
              </div>
            </div>

            {/* Crew Roster Allocation Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300">Crew Positions Allocated</span>
                <button
                  type="button"
                  onClick={() =>
                    setCrewRosterSelection([
                      ...crewRosterSelection,
                      { id: Date.now().toString(), staffId: staff[0]?.id || '', count: 1 },
                    ])
                  }
                  className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Crew Line</span>
                </button>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl divide-y divide-neutral-800/80 text-xs">
                {crewRosterSelection.map((line, idx) => {
                  const member = staff.find((s) => s.id === line.staffId) || staff[0];
                  const lineCost = calculateCrewLineCost(member, eventDurationHours) * line.count;

                  return (
                    <div key={line.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 flex items-center gap-2">
                        <select
                          value={line.staffId}
                          onChange={(e) => {
                            const updated = [...crewRosterSelection];
                            updated[idx].staffId = e.target.value;
                            setCrewRosterSelection(updated);
                          }}
                          className="w-full max-w-xs px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
                        >
                          {staff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role}) - ${s.hourlyRate}/hr
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-neutral-500">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={line.count}
                            onChange={(e) => {
                              const updated = [...crewRosterSelection];
                              updated[idx].count = Math.max(1, Number(e.target.value));
                              setCrewRosterSelection(updated);
                            }}
                            className="w-14 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-center font-mono text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-white tabular-nums">
                          ${lineCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCrewRosterSelection(crewRosterSelection.filter((_, i) => i !== idx))
                          }
                          className="p-1 text-neutral-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Crew Total Summary Box */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Crew Gross Wages ({eventDurationHours}h call):</span>
                <span className="font-mono text-white tabular-nums">${totalCrewBaseCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Employer Burden / Fringe ({payrollBurdenPercent}%):</span>
                <span className="font-mono text-white tabular-nums">${payrollBurdenAmount.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline font-bold text-base">
                <span className="text-white">Total Event Labor Budget:</span>
                <span className="font-mono text-emerald-400 text-lg tabular-nums">
                  ${grandTotalCrewBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close Calculator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
