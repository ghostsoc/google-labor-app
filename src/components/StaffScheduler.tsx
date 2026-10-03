import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StaffMember, LaborShift, CrewRole, AssignedShiftEquipment } from '../types';
import { LaborCostCalculatorModal } from './LaborCostCalculatorModal';
import { ShiftGearAssignmentModal } from './ShiftGearAssignmentModal';
import {
  Users,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Award,
  DollarSign,
  Printer,
  X,
  FileText,
  MapPin,
  Trash2,
  Edit2,
  Calculator,
  ArrowRight,
  TrendingUp,
  Package,
} from 'lucide-react';

interface StaffSchedulerProps {
  initialPrefill?: {
    date?: string;
    eventName?: string;
    openModal?: boolean;
  } | null;
  onClearPrefill?: () => void;
}

export const StaffScheduler: React.FC<StaffSchedulerProps> = ({
  initialPrefill,
  onClearPrefill,
}) => {
  const { staff, shifts, quotes, inventory, addStaffMember, addShift, updateShift, deleteShift, deleteStaffMember } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'shifts' | 'roster'>('shifts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedEvent, setSelectedEvent] = useState<string>('All');
  const [stagingFilter, setStagingFilter] = useState<'All' | 'Staged' | 'Pending Staging'>('All');

  // Modal States
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [callSheetEvent, setCallSheetEvent] = useState<string | null>(null);
  const [selectedShiftForGear, setSelectedShiftForGear] = useState<LaborShift | null>(null);

  // Keep selected shift synchronized with current state in shifts array
  const currentActiveShiftForGear = useMemo(() => {
    if (!selectedShiftForGear) return null;
    return shifts.find((s) => s.id === selectedShiftForGear.id) || selectedShiftForGear;
  }, [shifts, selectedShiftForGear]);

  // Helper to calculate hours between two times
  const calculateHoursFromTimes = (start: string, end: string): number => {
    if (!start || !end) return 10;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return Number((diff / 60).toFixed(1));
  };

  // Automated labor cost calculation based on hours and staff rate
  const calculateEstimatedLaborRate = (
    staffMember: StaffMember | undefined,
    hours: number,
    rateType: 'Day Rate' | 'Hourly'
  ): number => {
    if (!staffMember) return 500;
    const baseHourly = staffMember.hourlyRate || 75;
    const standardDayHours = 10;

    if (rateType === 'Hourly') {
      const regHours = Math.min(hours, standardDayHours);
      const otHours = Math.max(0, hours - standardDayHours);
      return Number((regHours * baseHourly + otHours * (baseHourly * 1.5)).toFixed(2));
    } else {
      const baseDayRate = staffMember.dayRate || 750;
      const otHours = Math.max(0, hours - standardDayHours);
      const otPay = otHours * (baseHourly * 1.5);
      return Number((baseDayRate + otPay).toFixed(2));
    }
  };

  // New Shift Form State
  const [shiftForm, setShiftForm] = useState<{
    eventName: string;
    staffId: string;
    role: CrewRole;
    date: string;
    startTime: string;
    endTime: string;
    callType: 'Load In / Setup' | 'Show Operator' | 'Rehearsal' | 'Strike / Load Out' | 'Warehouse Prep';
    rateType: 'Day Rate' | 'Hourly';
    rate: number;
    hours: number;
    status: 'Draft' | 'Offered' | 'Confirmed';
    venue: string;
    notes: string;
  }>({
    eventName: quotes[0]?.eventName || 'General Production Call',
    staffId: staff[0]?.id || '',
    role: staff[0]?.role || 'A1 Audio Lead',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '17:00',
    callType: 'Load In / Setup',
    rateType: 'Day Rate',
    rate: staff[0]?.dayRate || 750,
    hours: 10,
    status: 'Confirmed',
    venue: quotes[0]?.venueName || 'Moscone Center, SF',
    notes: '',
  });

  // New Staff Form State
  const [staffForm, setStaffForm] = useState<Omit<StaffMember, 'id'>>({
    name: '',
    role: 'A1 Audio Lead',
    email: '',
    phone: '',
    dayRate: 700,
    hourlyRate: 70,
    skills: ['FOH Mix', 'Dante Level 2'],
    avatarUrl: '',
    status: 'Available',
    notes: '',
  });

  const [skillsInput, setSkillsInput] = useState('FOH Live Mix, Dante Level 2');

  useEffect(() => {
    if (initialPrefill && initialPrefill.openModal) {
      setShiftForm((prev) => ({
        ...prev,
        date: initialPrefill.date || prev.date,
        eventName: initialPrefill.eventName || prev.eventName,
      }));
      setIsShiftModalOpen(true);
      if (onClearPrefill) {
        onClearPrefill();
      }
    }
  }, [initialPrefill, onClearPrefill]);

  const filteredShifts = shifts.filter((s) => {
    const matchesSearch =
      s.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.assignedEquipment && s.assignedEquipment.some((eq) => eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || eq.sku.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesRole = selectedRole === 'All' || s.role.includes(selectedRole);
    const matchesEvent = selectedEvent === 'All' || s.eventName === selectedEvent;

    const matchesStaging =
      stagingFilter === 'All' ||
      (stagingFilter === 'Staged' &&
        s.assignedEquipment &&
        s.assignedEquipment.length > 0 &&
        s.assignedEquipment.every((eq) => eq.stagedStatus === 'Staged / Checked Out')) ||
      (stagingFilter === 'Pending Staging' &&
        s.assignedEquipment &&
        s.assignedEquipment.some((eq) => eq.stagedStatus === 'Pending Staging'));

    return matchesSearch && matchesRole && matchesEvent && matchesStaging;
  });

  const filteredStaff = staff.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.skills.some((sk) => sk.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRole === 'All' || st.role.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  const handleStaffSelect = (staffId: string) => {
    const selected = staff.find((s) => s.id === staffId);
    if (selected) {
      const calculatedHours = calculateHoursFromTimes(shiftForm.startTime, shiftForm.endTime);
      const calculatedRate = calculateEstimatedLaborRate(selected, calculatedHours, shiftForm.rateType);

      setShiftForm((prev) => ({
        ...prev,
        staffId: selected.id,
        role: selected.role,
        hours: calculatedHours,
        rate: calculatedRate,
      }));
    }
  };

  const handleTimeChange = (type: 'start' | 'end', val: string) => {
    const newStart = type === 'start' ? val : shiftForm.startTime;
    const newEnd = type === 'end' ? val : shiftForm.endTime;
    const hours = calculateHoursFromTimes(newStart, newEnd);
    const assignedStaff = staff.find((s) => s.id === shiftForm.staffId);
    const rate = calculateEstimatedLaborRate(assignedStaff, hours, shiftForm.rateType);

    setShiftForm((prev) => ({
      ...prev,
      startTime: newStart,
      endTime: newEnd,
      hours,
      rate,
    }));
  };

  const handleRateTypeChange = (newRateType: 'Day Rate' | 'Hourly') => {
    const assignedStaff = staff.find((s) => s.id === shiftForm.staffId);
    const rate = calculateEstimatedLaborRate(assignedStaff, shiftForm.hours, newRateType);
    setShiftForm((prev) => ({
      ...prev,
      rateType: newRateType,
      rate,
    }));
  };

  const handleApplyCalculatorResult = (data: {
    staffId: string;
    role: CrewRole;
    startTime: string;
    endTime: string;
    hours: number;
    rate: number;
    rateType: 'Day Rate' | 'Hourly';
    notes: string;
  }) => {
    setShiftForm((prev) => ({
      ...prev,
      staffId: data.staffId,
      role: data.role,
      startTime: data.startTime,
      endTime: data.endTime,
      hours: data.hours,
      rate: data.rate,
      rateType: data.rateType,
      notes: data.notes,
    }));
    setIsShiftModalOpen(true);
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedStaff = staff.find((s) => s.id === shiftForm.staffId);
    addShift({
      ...shiftForm,
      staffName: assignedStaff ? assignedStaff.name : 'Crew Tech',
    });
    setIsShiftModalOpen(false);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addStaffMember({
      ...staffForm,
      skills: skillsArray,
    });
    setIsStaffModalOpen(false);
  };

  // Distinct event list for filter
  const eventList = Array.from(new Set(shifts.map((s) => s.eventName)));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Labor Scheduling & Crew Dispatch
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Dispatch lead audio, video, lighting engineers and stagehands across show dates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Labor Calculator</span>
          </button>
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Technician</span>
          </button>
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch Shift</span>
          </button>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('shifts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'shifts'
                ? 'bg-amber-400 text-neutral-950 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Shift Dispatch Board ({shifts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'roster'
                ? 'bg-amber-400 text-neutral-950 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Technician Roster ({staff.length})
          </button>
        </div>

        {eventList.length > 0 && activeSubTab === 'shifts' && (
          <button
            onClick={() => setCallSheetEvent(eventList[0])}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:underline cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Call Sheet</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'shifts'
                ? 'Search shift by tech, event, venue...'
                : 'Search tech by name, skill, cert...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto">
          {activeSubTab === 'shifts' && (
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Booked Events</option>
              {eventList.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            {['All', 'Audio', 'Video', 'Lighting', 'Rigging'].map((roleFilter) => (
              <button
                key={roleFilter}
                onClick={() => setSelectedRole(roleFilter)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedRole === roleFilter
                    ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {roleFilter}
              </button>
            ))}
          </div>

          {activeSubTab === 'shifts' && (
            <div className="flex items-center gap-1 pl-1 border-l border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase font-mono px-1">Gear:</span>
              <button
                onClick={() => setStagingFilter('All')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  stagingFilter === 'All'
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStagingFilter('Pending Staging')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  stagingFilter === 'Pending Staging'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Shifts with gear pending warehouse staging"
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Needs Staging</span>
              </button>
              <button
                onClick={() => setStagingFilter('Staged')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  stagingFilter === 'Staged'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Shifts with all assigned gear staged"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Fully Staged</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: Shifts Dispatch Table */}
      {activeSubTab === 'shifts' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Production & Venue</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Role & Call Scope</th>
                  <th className="py-3 px-4">Assigned Gear & Staging</th>
                  <th className="py-3 px-4 text-right">Agreed Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70 text-neutral-200">
                {filteredShifts.map((shift) => {
                  const gearList = shift.assignedEquipment || [];
                  const totalUnits = gearList.reduce((sum, item) => sum + item.quantity, 0);
                  const stagedUnits = gearList
                    .filter((item) => item.stagedStatus === 'Staged / Checked Out')
                    .reduce((sum, item) => sum + item.quantity, 0);
                  const isAllStaged = gearList.length > 0 && stagedUnits === totalUnits;

                  return (
                    <tr key={shift.id} className="hover:bg-neutral-800/30 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-white font-mono">{shift.date}</div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {shift.startTime} – {shift.endTime} ({shift.hours}h)
                        </div>
                      </td>

                      {/* Production & Venue */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white truncate">{shift.eventName}</div>
                        <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{shift.venue}</span>
                        </div>
                      </td>

                      {/* Tech Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-white">
                        {shift.staffName}
                      </td>

                      {/* Role & Scope */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-amber-400/90 font-medium">{shift.role}</div>
                        <div className="text-[11px] text-neutral-400">{shift.callType}</div>
                      </td>

                      {/* Assigned Gear & Staging */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {gearList.length > 0 ? (
                          <button
                            onClick={() => setSelectedShiftForGear(shift)}
                            className="group text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                              <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                                {totalUnits} Units ({gearList.length} Items)
                              </span>
                            </div>
                            <div className="mt-1">
                              {isAllStaged ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Fully Staged</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Staging {stagedUnits}/{totalUnits}</span>
                                </span>
                              )}
                            </div>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedShiftForGear(shift)}
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 py-1 px-2 rounded hover:bg-neutral-800/80 border border-dashed border-neutral-700 hover:border-amber-400/50 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Assign Gear</span>
                          </button>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono tabular-nums font-semibold text-white">
                        ${shift.rate}{' '}
                        <span className="text-[10px] text-neutral-400 font-normal">
                          ({shift.rateType})
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono ${
                            shift.status === 'Confirmed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                              : shift.status === 'Offered'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}
                        >
                          {shift.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedShiftForGear(shift)}
                            title="Assign & Stage Equipment"
                            className="p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5" />
                          </button>
                          {shift.status !== 'Confirmed' && (
                            <button
                              onClick={() => updateShift(shift.id, { status: 'Confirmed' })}
                              className="px-2 py-0.5 text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded hover:bg-emerald-900 transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            onClick={() => deleteShift(shift.id)}
                            title="Cancel Shift"
                            className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredShifts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                      <p className="text-sm font-medium">No shifts scheduled for selected filters</p>
                      <p className="text-xs text-neutral-500 mt-1">Dispatch crew using the button above</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Crew Roster */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-amber-400 text-base shrink-0">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white">{member.name}</h3>
                      <div className="text-xs text-amber-400/90 font-medium">{member.role}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      member.status === 'On Job'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-neutral-300">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{member.phone}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {member.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-neutral-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {(() => {
                  const memberShifts = shifts.filter(
                    (s) => s.staffId === member.id && s.assignedEquipment && s.assignedEquipment.length > 0
                  );
                  const totalGearUnits = memberShifts.reduce(
                    (acc, s) => acc + (s.assignedEquipment?.reduce((sub, eq) => sub + eq.quantity, 0) || 0),
                    0
                  );
                  if (totalGearUnits === 0) return null;
                  return (
                    <div className="mt-3 p-2 bg-neutral-950/70 border border-neutral-800 rounded-lg flex items-center justify-between text-[11px] font-mono">
                      <span className="text-neutral-400 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-400" />
                        <span>Assigned Shift Gear:</span>
                      </span>
                      <span className="text-amber-300 font-bold">{totalGearUnits} units staged</span>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <div className="font-mono text-neutral-300">
                  <span className="font-bold text-white">${member.dayRate}</span> / 10-hr day
                </div>
                <button
                  onClick={() => {
                    setShiftForm((prev) => ({
                      ...prev,
                      staffId: member.id,
                      role: member.role,
                      rate: member.dayRate,
                    }));
                    setIsShiftModalOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded transition-colors cursor-pointer"
                >
                  Book Shift
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Call Sheet Modal */}
      {callSheetEvent && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Event Call Sheet: {callSheetEvent}</h3>
              </div>
              <button onClick={() => setCallSheetEvent(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-bold text-amber-400 text-sm">IN THE WIND AV · OFFICIAL PRODUCTION CALL</span>
                <span className="font-mono text-neutral-400">Date: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="text-neutral-300">
                <p><strong>Loading Dock:</strong> Guard check-in required. High-visibility vest required on dock.</p>
                <p><strong>Radio Channel:</strong> Production Ch 2 · Audio Ch 3 · Video Ch 4 · Rigging Ch 5</p>
              </div>

              <div className="pt-2">
                <h4 className="font-semibold text-white mb-2 uppercase tracking-wider text-[11px]">Rostered Crew & Call Times:</h4>
                <div className="divide-y divide-neutral-800/80">
                  {shifts
                    .filter((s) => s.eventName === callSheetEvent)
                    .map((s) => (
                      <div key={s.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{s.staffName}</span>
                            <span className="text-neutral-400 text-[11px] font-mono">({s.role})</span>
                          </div>
                          <div className="text-[11px] text-neutral-400">{s.callType} · {s.venue}</div>
                          {s.assignedEquipment && s.assignedEquipment.length > 0 && (
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="text-amber-400 font-semibold flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                <span>Staged Gear:</span>
                              </span>
                              {s.assignedEquipment.map((eq) => (
                                <span
                                  key={eq.id}
                                  className={`px-1.5 py-0.5 rounded border font-mono ${
                                    eq.stagedStatus === 'Staged / Checked Out'
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                      : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                                  }`}
                                >
                                  {eq.name} (x{eq.quantity}) [{eq.stagedStatus === 'Staged / Checked Out' ? '✓ Staged' : 'Pending'}]
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right font-mono text-amber-400 font-bold shrink-0">
                          Call: {s.startTime}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Call Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Shift Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-white">Dispatch Technician Shift</h2>
              <button onClick={() => setIsShiftModalOpen(false)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Production / Event Title *</label>
                <input
                  type="text"
                  required
                  value={shiftForm.eventName}
                  onChange={(e) => setShiftForm({ ...shiftForm, eventName: e.target.value })}
                  placeholder="e.g. Apex Global Tech Summit 2026"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Assigned Technician *</label>
                  <select
                    value={shiftForm.staffId}
                    onChange={(e) => handleStaffSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Crew Role *</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.role}
                    onChange={(e) => setShiftForm({ ...shiftForm, role: e.target.value as CrewRole })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Shift Date *</label>
                  <input
                    type="date"
                    required
                    value={shiftForm.date}
                    onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Call Scope *</label>
                  <select
                    value={shiftForm.callType}
                    onChange={(e) => setShiftForm({ ...shiftForm, callType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Load In / Setup">Load In / Setup</option>
                    <option value="Show Operator">Show Operator</option>
                    <option value="Rehearsal">Rehearsal</option>
                    <option value="Strike / Load Out">Strike / Load Out</option>
                    <option value="Warehouse Prep">Warehouse Prep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Rate Billing Structure *</label>
                  <select
                    value={shiftForm.rateType}
                    onChange={(e) => handleRateTypeChange(e.target.value as 'Day Rate' | 'Hourly')}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Day Rate">Day Rate (10-hr standard guarantee)</option>
                    <option value="Hourly">Hourly (with 1.5x overtime after 10h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Call Time (Start)</label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => handleTimeChange('start', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Wrap Time (End)</label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => handleTimeChange('end', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Automated Labor Cost Calculation Banner */}
                <div className="col-span-2 p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-amber-400" />
                      <span>Shift Duration & Estimated Labor:</span>
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      {shiftForm.hours} hrs ({shiftForm.hours > 10 ? `${Math.min(10, shiftForm.hours)}h reg + ${(shiftForm.hours - 10).toFixed(1)}h OT 1.5x` : 'Straight time'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                    <span>
                      Standard tech rate: ${staff.find((s) => s.id === shiftForm.staffId)?.hourlyRate || 75}/hr (Est: ${calculateEstimatedLaborRate(staff.find((s) => s.id === shiftForm.staffId), shiftForm.hours, shiftForm.rateType)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCalculatorOpen(true)}
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Advanced Breakdown →
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Agreed Shift Rate ($) *
                  </label>
                  <input
                    type="number"
                    value={shiftForm.rate}
                    onChange={(e) => setShiftForm({ ...shiftForm, rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Venue / Hall</label>
                  <input
                    type="text"
                    value={shiftForm.venue}
                    onChange={(e) => setShiftForm({ ...shiftForm, venue: e.target.value })}
                    placeholder="e.g. Moscone South Hall A"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Dispatch & Notify Crew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-white">Add Technician to Roster</h2>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Marcus Brody"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Primary Role *</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as CrewRole })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="A1 Audio Lead">A1 Audio Lead</option>
                  <option value="A2 Audio Assistant">A2 Audio Assistant</option>
                  <option value="V1 Video Lead / Switcher">V1 Video Lead / Switcher</option>
                  <option value="V2 Video Tech / Projection">V2 Video Tech / Projection</option>
                  <option value="L1 Lighting Designer / Board Op">L1 Lighting Designer / Board Op</option>
                  <option value="L2 Lighting Tech">L2 Lighting Tech</option>
                  <option value="Rigging Lead">Rigging Lead</option>
                  <option value="General AV Tech">General AV Tech</option>
                  <option value="Production Manager">Production Manager</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="tech@avcrews.net"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="(415) 555-0199"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Day Rate (10h guarantee)</label>
                  <input
                    type="number"
                    value={staffForm.dayRate}
                    onChange={(e) => setStaffForm({ ...staffForm, dayRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={staffForm.hourlyRate}
                    onChange={(e) => setStaffForm({ ...staffForm, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Certifications & Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="Dante L3, SPRAT II, grandMA3, OSHA 30"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Labor Cost & Overtime Calculator Modal */}
      <LaborCostCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        staff={staff}
        onApplyToShift={handleApplyCalculatorResult}
      />

      {/* Shift Gear Assignment & Staging Modal */}
      {currentActiveShiftForGear && (
        <ShiftGearAssignmentModal
          shift={currentActiveShiftForGear}
          onClose={() => setSelectedShiftForGear(null)}
        />
      )}
    </div>
  );
};
