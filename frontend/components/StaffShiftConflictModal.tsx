import React, { useState } from 'react';
import { StaffMember, LaborShift } from '../types';
import { ShiftConflict, formatMinutes } from '../utils/conflictDetection';
import {
  AlertTriangle,
  X,
  Clock,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Edit2,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

interface StaffShiftConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ShiftConflict[];
  staff: StaffMember[];
  shifts: LaborShift[];
  onUpdateShift: (shiftId: string, updates: Partial<LaborShift>) => void;
  onDeleteShift: (shiftId: string) => void;
  onSelectDateInTimeline?: (date: string) => void;
}

export const StaffShiftConflictModal: React.FC<StaffShiftConflictModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  staff,
  onUpdateShift,
  onDeleteShift,
  onSelectDateInTimeline,
}) => {
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(
    conflicts[0]?.id || null
  );
  const [reassigningShiftId, setReassigningShiftId] = useState<string | null>(null);
  const [newStaffId, setNewStaffId] = useState<string>('');
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [resolutionNotice, setResolutionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeConflict =
    conflicts.find((c) => c.id === selectedConflictId) || conflicts[0] || null;

  const handleReassign = (shiftId: string) => {
    if (!newStaffId) return;
    const replacementTech = staff.find((s) => s.id === newStaffId);
    if (!replacementTech) return;

    onUpdateShift(shiftId, {
      staffId: replacementTech.id,
      staffName: replacementTech.name,
      role: replacementTech.role,
    });

    setResolutionNotice(`Shift reassigned to ${replacementTech.name}.`);
    setReassigningShiftId(null);
    setNewStaffId('');
    setTimeout(() => setResolutionNotice(null), 3000);
  };

  const handleSaveTimes = (shiftId: string) => {
    if (!editStartTime || !editEndTime) return;

    const [sh, sm] = editStartTime.split(':').map(Number);
    const [eh, em] = editEndTime.split(':').map(Number);
    let diff = eh * 60 + em - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    const hours = Number((diff / 60).toFixed(1));

    onUpdateShift(shiftId, {
      startTime: editStartTime,
      endTime: editEndTime,
      hours,
    });

    setResolutionNotice('Shift call hours updated successfully.');
    setEditingShiftId(null);
    setTimeout(() => setResolutionNotice(null), 3000);
  };

  const handleDelete = (shiftId: string, eventName: string) => {
    onDeleteShift(shiftId);
    setResolutionNotice(`Shift for "${eventName}" removed.`);
    setTimeout(() => setResolutionNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Labor Shift Timeline Conflict Resolution
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {conflicts.length} {conflicts.length === 1 ? 'Issue' : 'Issues'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Review and resolve overlapping call times, transit gaps, and crew double-booking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success / Action Toast */}
        {resolutionNotice && (
          <div className="mx-5 mt-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resolutionNotice}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {conflicts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">All Conflicts Resolved!</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                The labor schedule timeline is completely clear of double-bookings and scheduling overlaps.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Resolution Window
              </button>
            </div>
          ) : (
            <>
              {/* Conflict Selector Pills (if multiple) */}
              {conflicts.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold">
                    Select Conflict to Resolve:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {conflicts.map((c, idx) => {
                      const isSelected = (activeConflict?.id || conflicts[0].id) === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedConflictId(c.id);
                            setReassigningShiftId(null);
                            setEditingShiftId(null);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs'
                              : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                          }`}
                        >
                          <span className="font-mono text-[10px] font-bold">#{idx + 1}</span>
                          <span className="font-semibold text-white">{c.staffName}</span>
                          <span className="text-[10px] font-mono text-neutral-400">({c.date})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeConflict && (
                <div className="space-y-5">
                  {/* Active Conflict Banner Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-neutral-900 to-neutral-900 border border-rose-800/40 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="text-xs font-bold text-rose-300 uppercase tracking-wide font-mono">
                          {activeConflict.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 self-start sm:self-auto">
                        Date: {activeConflict.date}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed">
                      {activeConflict.description}
                    </p>
                    <div className="pt-2 text-[11px] text-amber-300 flex items-start gap-1.5">
                      <span className="font-bold shrink-0">Recommendation:</span>
                      <span>{activeConflict.recommendation}</span>
                    </div>
                  </div>

                  {/* Overlap Visual Timeline Strip */}
                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>Timeline Call Time Comparison (24H Span)</span>
                      {activeConflict.overlapMinutes && (
                        <span className="text-rose-400 font-bold">
                          Direct Overlap: {formatMinutes(activeConflict.overlapMinutes)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 pt-1">
                      {/* Shift A Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                          <span className="text-sky-400 font-semibold truncate max-w-xs">
                            Shift 1: {activeConflict.shiftA.eventName}
                          </span>
                          <span>
                            {activeConflict.shiftA.startTime} – {activeConflict.shiftA.endTime} ({activeConflict.shiftA.hours}h)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-sky-500 rounded-full"
                            style={{
                              marginLeft: `${(parseInt(activeConflict.shiftA.startTime.split(':')[0]) / 24) * 100}%`,
                              width: `${(activeConflict.shiftA.hours / 24) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Shift B Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                          <span className="text-amber-400 font-semibold truncate max-w-xs">
                            Shift 2: {activeConflict.shiftB.eventName}
                          </span>
                          <span>
                            {activeConflict.shiftB.startTime} – {activeConflict.shiftB.endTime} ({activeConflict.shiftB.hours}h)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              marginLeft: `${(parseInt(activeConflict.shiftB.startTime.split(':')[0]) / 24) * 100}%`,
                              width: `${(activeConflict.shiftB.hours / 24) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conflicting Shifts Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shift A Card */}
                    <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3 relative flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
                              Shift #1
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">
                              {activeConflict.shiftA.eventName}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {activeConflict.shiftA.callType}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-neutral-300">
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="font-mono text-white">
                              {activeConflict.shiftA.startTime} – {activeConflict.shiftA.endTime}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              ({activeConflict.shiftA.hours} hours)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400">
                            <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="truncate">{activeConflict.shiftA.venue}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Users className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span>
                              Assigned Tech: <strong className="text-white">{activeConflict.shiftA.staffName}</strong> ({activeConflict.shiftA.role})
                            </span>
                          </div>
                        </div>

                        {/* Inline Time Editor */}
                        {editingShiftId === activeConflict.shiftA.id && (
                          <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg space-y-2 mt-2">
                            <span className="text-[10px] font-mono uppercase text-neutral-400">
                              Adjust Call Hours:
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-neutral-400 block mb-0.5">Start</label>
                                <input
                                  type="time"
                                  value={editStartTime}
                                  onChange={(e) => setEditStartTime(e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-neutral-400 block mb-0.5">End</label>
                                <input
                                  type="time"
                                  value={editEndTime}
                                  onChange={(e) => setEditEndTime(e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => setEditingShiftId(null)}
                                className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveTimes(activeConflict.shiftA.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-400 text-neutral-950 rounded hover:bg-amber-300"
                              >
                                Save Times
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline Reassignment Selector */}
                        {reassigningShiftId === activeConflict.shiftA.id && (
                          <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg space-y-2 mt-2">
                            <span className="text-[10px] font-mono uppercase text-neutral-400">
                              Reassign to Available Technician:
                            </span>
                            <select
                              value={newStaffId}
                              onChange={(e) => setNewStaffId(e.target.value)}
                              className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                            >
                              <option value="">Select Technician...</option>
                              {staff
                                .filter((s) => s.id !== activeConflict.shiftA.staffId)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} — {s.role} (${s.dayRate}/day)
                                  </option>
                                ))}
                            </select>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => setReassigningShiftId(null)}
                                className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={!newStaffId}
                                onClick={() => handleReassign(activeConflict.shiftA.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-400 text-neutral-950 rounded hover:bg-emerald-300 disabled:opacity-50"
                              >
                                Confirm Reassignment
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Shift A Action Buttons */}
                      <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setReassigningShiftId(activeConflict.shiftA.id);
                              setEditingShiftId(null);
                            }}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            <span>Reassign</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingShiftId(activeConflict.shiftA.id);
                              setEditStartTime(activeConflict.shiftA.startTime);
                              setEditEndTime(activeConflict.shiftA.endTime);
                              setReassigningShiftId(null);
                            }}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-amber-400" />
                            <span>Adjust Time</span>
                          </button>
                        </div>
                        <button
                          onClick={() => handleDelete(activeConflict.shiftA.id, activeConflict.shiftA.eventName)}
                          title="Remove shift"
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Shift B Card */}
                    <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3 relative flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                              Shift #2
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">
                              {activeConflict.shiftB.eventName}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {activeConflict.shiftB.callType}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-neutral-300">
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="font-mono text-white">
                              {activeConflict.shiftB.startTime} – {activeConflict.shiftB.endTime}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              ({activeConflict.shiftB.hours} hours)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400">
                            <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="truncate">{activeConflict.shiftB.venue}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Users className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span>
                              Assigned Tech: <strong className="text-white">{activeConflict.shiftB.staffName}</strong> ({activeConflict.shiftB.role})
                            </span>
                          </div>
                        </div>

                        {/* Inline Time Editor */}
                        {editingShiftId === activeConflict.shiftB.id && (
                          <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg space-y-2 mt-2">
                            <span className="text-[10px] font-mono uppercase text-neutral-400">
                              Adjust Call Hours:
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-neutral-400 block mb-0.5">Start</label>
                                <input
                                  type="time"
                                  value={editStartTime}
                                  onChange={(e) => setEditStartTime(e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-neutral-400 block mb-0.5">End</label>
                                <input
                                  type="time"
                                  value={editEndTime}
                                  onChange={(e) => setEditEndTime(e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => setEditingShiftId(null)}
                                className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveTimes(activeConflict.shiftB.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-400 text-neutral-950 rounded hover:bg-amber-300"
                              >
                                Save Times
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline Reassignment Selector */}
                        {reassigningShiftId === activeConflict.shiftB.id && (
                          <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg space-y-2 mt-2">
                            <span className="text-[10px] font-mono uppercase text-neutral-400">
                              Reassign to Available Technician:
                            </span>
                            <select
                              value={newStaffId}
                              onChange={(e) => setNewStaffId(e.target.value)}
                              className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                            >
                              <option value="">Select Technician...</option>
                              {staff
                                .filter((s) => s.id !== activeConflict.shiftB.staffId)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} — {s.role} (${s.dayRate}/day)
                                  </option>
                                ))}
                            </select>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => setReassigningShiftId(null)}
                                className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={!newStaffId}
                                onClick={() => handleReassign(activeConflict.shiftB.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-400 text-neutral-950 rounded hover:bg-emerald-300 disabled:opacity-50"
                              >
                                Confirm Reassignment
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Shift B Action Buttons */}
                      <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setReassigningShiftId(activeConflict.shiftB.id);
                              setEditingShiftId(null);
                            }}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            <span>Reassign</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingShiftId(activeConflict.shiftB.id);
                              setEditStartTime(activeConflict.shiftB.startTime);
                              setEditEndTime(activeConflict.shiftB.endTime);
                              setReassigningShiftId(null);
                            }}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-amber-400" />
                            <span>Adjust Time</span>
                          </button>
                        </div>
                        <button
                          onClick={() => handleDelete(activeConflict.shiftB.id, activeConflict.shiftB.eventName)}
                          title="Remove shift"
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            {onSelectDateInTimeline && activeConflict && (
              <button
                onClick={() => {
                  onSelectDateInTimeline(activeConflict.date);
                  onClose();
                }}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Jump to Timeline View for {activeConflict.date}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
