import React, { useState } from 'react';
import { FleetLaborSummary, ShiftLaborCostDetails } from '../utils/laborCostUtils';
import { exportToCSV } from '../utils/csvExport';
import {
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Layers,
  Award,
  Calendar,
  Briefcase,
  PieChart,
} from 'lucide-react';

interface StaffLaborCostSummaryProps {
  summary: FleetLaborSummary;
  isFiltered: boolean;
  filterEventName?: string;
  filterRoleName?: string;
  onSelectShiftDetail?: (details: ShiftLaborCostDetails) => void;
}

export const StaffLaborCostSummary: React.FC<StaffLaborCostSummaryProps> = ({
  summary,
  isFiltered,
  filterEventName,
  filterRoleName,
  onSelectShiftDetail,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<'departments' | 'roles' | 'events'>('departments');

  const handleExportLaborReport = () => {
    const headers = [
      'Shift ID',
      'Production Event',
      'Shift Date',
      'Call Time',
      'Wrap Time',
      'Technician',
      'Crew Role',
      'Department',
      'Total Hours',
      'Regular Hours',
      'Overtime Hours',
      'Rate Type',
      'Base Rate ($)',
      'Regular Pay ($)',
      'Overtime Pay ($)',
      'Total Estimated Cost ($)',
    ];

    const rows = Array.from(summary.shiftDetailsMap.values()).map((details) => [
      details.shiftId,
      details.eventName,
      details.date,
      details.startTime,
      details.endTime,
      details.staffName,
      details.role,
      details.department,
      details.totalHours,
      details.regularHours,
      details.otHours + details.doubleTimeHours,
      details.rateType,
      details.rateType === 'Day Rate' ? details.effectiveDayRate : details.effectiveHourlyRate,
      details.regularPay,
      details.otPay + details.doubleTimePay,
      details.totalEstimatedCost,
    ]);

    exportToCSV(`staff_labor_cost_report_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm transition-all">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Estimated Labor Costs & Payroll Summary
              </h2>
              {isFiltered && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 font-semibold">
                  Filtered View
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Calculated from scheduled crew hours, 10-hour day guarantees, overtime rules, and role pay rates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleExportLaborReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-xs font-medium transition-colors cursor-pointer"
            title="Download CSV export of estimated labor costs"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Labor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 text-xs transition-colors cursor-pointer"
          >
            <span className="text-[11px] font-mono">{isExpanded ? 'Hide Details' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 4 High-Impact Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Card 1: Total Estimated Cost */}
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-sans uppercase text-[11px] text-neutral-400">Total Labor Cost</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">
            ${summary.totalEstimatedLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Avg / shift:</span>
            <span className="font-bold text-amber-300">${summary.averageCostPerShift.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 2: Total Hours & OT Breakdown */}
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-sans uppercase text-[11px] text-neutral-400">Crew Hours Scheduled</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-sky-400 tabular-nums tracking-tight">
            {summary.totalHours.toFixed(1)} <span className="text-xs font-normal text-neutral-400 font-sans">hrs</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Regular: {summary.regularHours.toFixed(0)}h</span>
            <span className={summary.otHours > 0 ? 'text-amber-400 font-bold' : 'text-neutral-500'}>
              OT: {summary.otHours.toFixed(1)}h
            </span>
          </div>
        </div>

        {/* Card 3: Overtime Financial Exposure */}
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-sans uppercase text-[11px] text-neutral-400">Overtime Premium</span>
            <AlertTriangle className={`w-4 h-4 ${summary.totalOvertimePay > 0 ? 'text-rose-400' : 'text-neutral-600'}`} />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${
              summary.totalOvertimePay > 0 ? 'text-rose-400' : 'text-neutral-400'
            }`}
          >
            ${summary.totalOvertimePay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Standard:</span>
            <span className="text-neutral-300 font-bold">${summary.totalRegularPay.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 4: Shifts & Blended Hourly Rate */}
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-sans uppercase text-[11px] text-neutral-400">Scheduled Shifts</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">
            {summary.totalShiftsCount} <span className="text-xs font-normal text-neutral-400 font-sans">calls</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Blended rate:</span>
            <span className="font-bold text-emerald-400">${summary.averageHourlyRate.toFixed(2)}/hr</span>
          </div>
        </div>
      </div>

      {/* Expanded Tabbed Deep Dive Section */}
      {isExpanded && (
        <div className="pt-2 border-t border-neutral-800/80 space-y-3">
          {/* Sub-Tabs: Department vs Role vs Event */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveBreakdownTab('departments')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeBreakdownTab === 'departments'
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Department Share ({summary.departments.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveBreakdownTab('roles')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeBreakdownTab === 'roles'
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Role Pay Rates ({summary.roles.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveBreakdownTab('events')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeBreakdownTab === 'events'
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Cost by Event ({summary.events.length})
              </button>
            </div>

            <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
              Standard 10h Day Guarantee · 1.5x Overtime Tier
            </span>
          </div>

          {/* TAB 1: Department Distribution */}
          {activeBreakdownTab === 'departments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {summary.departments.map((dept) => {
                const getDeptColor = (name: string) => {
                  switch (name) {
                    case 'Audio':
                      return 'text-amber-400 bg-amber-400';
                    case 'Video':
                      return 'text-sky-400 bg-sky-400';
                    case 'Lighting':
                      return 'text-emerald-400 bg-emerald-400';
                    case 'Rigging':
                      return 'text-purple-400 bg-purple-400';
                    default:
                      return 'text-rose-400 bg-rose-400';
                  }
                };

                const colorClasses = getDeptColor(dept.department);
                const textColor = colorClasses.split(' ')[0];
                const barColor = colorClasses.split(' ')[1];

                return (
                  <div
                    key={dept.department}
                    className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold font-sans text-sm ${textColor}`}>
                        {dept.department}
                      </span>
                      <span className="text-white font-bold">
                        ${dept.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${dept.percentageOfCost}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                      <span>{dept.shiftCount} shifts · {dept.totalHours} hrs</span>
                      <span className="font-bold text-neutral-300">{dept.percentageOfCost}% of labor</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Role-Based Pay Rates Benchmark & Actuals */}
          {activeBreakdownTab === 'roles' && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 font-sans">Role / Crew Position</th>
                      <th className="py-2.5 px-3">Dept</th>
                      <th className="py-2.5 px-3 text-right">Role Base Rate</th>
                      <th className="py-2.5 px-3 text-center">Scheduled Shifts</th>
                      <th className="py-2.5 px-3 text-center">Total Hours</th>
                      <th className="py-2.5 px-3 text-right">Total Estimated Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {summary.roles.map((roleMetric) => (
                      <tr key={roleMetric.role} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white font-sans">{roleMetric.role}</td>
                        <td className="py-2.5 px-3 text-neutral-400">{roleMetric.department}</td>
                        <td className="py-2.5 px-3 text-right text-amber-300">
                          ${roleMetric.benchmarkHourlyRate}/hr (${roleMetric.benchmarkHourlyRate * 10}/day)
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-white">{roleMetric.shiftCount}</td>
                        <td className="py-2.5 px-3 text-center text-sky-400">{roleMetric.totalHours} hrs</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">
                          ${roleMetric.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Event-Level Labor Cost Summary */}
          {activeBreakdownTab === 'events' && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 font-sans">Production / Booked Event</th>
                      <th className="py-2.5 px-3 text-center">Total Shifts</th>
                      <th className="py-2.5 px-3 text-center">Confirmed Calls</th>
                      <th className="py-2.5 px-3 text-center">Crew Hours</th>
                      <th className="py-2.5 px-3 text-right">Estimated Event Labor Outlay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {summary.events.map((ev) => (
                      <tr key={ev.eventName} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white font-sans">{ev.eventName}</td>
                        <td className="py-2.5 px-3 text-center">{ev.shiftCount} shifts</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                            {ev.confirmedShifts} / {ev.shiftCount} confirmed
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-sky-400">{ev.totalHours} hrs</td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-400 text-sm">
                          ${ev.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
