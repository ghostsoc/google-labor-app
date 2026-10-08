import { LaborShift, StaffMember, CrewRole } from '../types';

export interface RoleRateBenchmark {
  role: CrewRole;
  title: string;
  category: 'Audio' | 'Video' | 'Lighting' | 'Rigging' | 'Staging' | 'Management' | 'Logistics';
  hourlyRate: number;
  dayRate: number; // 10-hour guarantee
  description: string;
}

export const ROLE_BASE_RATES: Record<CrewRole, RoleRateBenchmark> = {
  'A1 Audio Lead': {
    role: 'A1 Audio Lead',
    title: 'Lead Audio Engineer & FOH Mixer',
    category: 'Audio',
    hourlyRate: 75,
    dayRate: 750,
    description: 'System tuning, line array calibration, FOH mix, Dante networking',
  },
  'A2 Audio Assistant': {
    role: 'A2 Audio Assistant',
    title: 'Audio Assistant & Stage Tech',
    category: 'Audio',
    hourlyRate: 55,
    dayRate: 550,
    description: 'Wireless RF mic dressing, stage sub-snakes, backstage patch',
  },
  'V1 Video Lead / Switcher': {
    role: 'V1 Video Lead / Switcher',
    title: 'Lead Video Engineer & Switcher EIC',
    category: 'Video',
    hourlyRate: 80,
    dayRate: 800,
    description: 'Barco/Spyder switching, 4K matrix routing, multi-cam directing',
  },
  'V2 Video Tech / Projection': {
    role: 'V2 Video Tech / Projection',
    title: 'Video & Projection Technician',
    category: 'Video',
    hourlyRate: 60,
    dayRate: 600,
    description: 'Laser projector convergence, LED wall tile patching, PTZ ops',
  },
  'L1 Lighting Designer / Board Op': {
    role: 'L1 Lighting Designer / Board Op',
    title: 'Lighting Designer & grandMA Programmer',
    category: 'Lighting',
    hourlyRate: 72,
    dayRate: 720,
    description: 'grandMA3 console programming, fixture addressing, cue design',
  },
  'L2 Lighting Tech': {
    role: 'L2 Lighting Tech',
    title: 'Lighting Electrician & Tech',
    category: 'Lighting',
    hourlyRate: 55,
    dayRate: 550,
    description: 'Power distro hookup, DMX/sACN patching, truss fixture hanging',
  },
  'Rigging Lead': {
    role: 'Rigging Lead',
    title: 'ETCP Certified Head Rigger',
    category: 'Rigging',
    hourlyRate: 70,
    dayRate: 700,
    description: 'Motor load calculations, high climbing, structural bridle points',
  },
  'Stage Manager': {
    role: 'Stage Manager',
    title: 'Production Stage Manager',
    category: 'Staging',
    hourlyRate: 65,
    dayRate: 650,
    description: 'Show run-of-show timing, talent cueing, green room coordination',
  },
  'General AV Tech': {
    role: 'General AV Tech',
    title: 'General AV Technician & Utility',
    category: 'Staging',
    hourlyRate: 50,
    dayRate: 500,
    description: 'Cable runs, breakout room AV setups, strike packing',
  },
  'Production Manager': {
    role: 'Production Manager',
    title: 'Event Technical Production Manager',
    category: 'Management',
    hourlyRate: 85,
    dayRate: 850,
    description: 'Client liaison, venue technical advance, crew dispatch management',
  },
  'Logistics & Truck Driver': {
    role: 'Logistics & Truck Driver',
    title: 'Logistics Lead & CDL Truck Driver',
    category: 'Logistics',
    hourlyRate: 48,
    dayRate: 480,
    description: 'Warehouse load-out, 26ft box truck transport, dock logistics',
  },
};

export interface ShiftLaborCostDetails {
  shiftId: string;
  staffId: string;
  staffName: string;
  role: CrewRole;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  regularHours: number;
  otHours: number; // 1.5x (hours 10-14)
  doubleTimeHours: number; // 2.0x (hours >14)
  rateType: 'Day Rate' | 'Hourly';
  effectiveHourlyRate: number;
  effectiveDayRate: number;
  roleBenchmarkHourlyRate: number;
  roleBenchmarkDayRate: number;
  regularPay: number;
  otPay: number;
  doubleTimePay: number;
  totalEstimatedCost: number;
  agreedShiftRate: number; // Stored shift.rate
  hasOvertime: boolean;
  department: string;
}

export function calculateShiftLaborCost(
  shift: LaborShift,
  staffList: StaffMember[]
): ShiftLaborCostDetails {
  const assignedStaff = staffList.find((s) => s.id === shift.staffId);
  const benchmark = ROLE_BASE_RATES[shift.role] || {
    hourlyRate: 65,
    dayRate: 650,
    category: 'Audio',
  };

  const effectiveHourlyRate =
    assignedStaff?.hourlyRate ||
    (shift.rateType === 'Hourly' ? shift.rate : benchmark.hourlyRate);

  const effectiveDayRate =
    assignedStaff?.dayRate ||
    (shift.rateType === 'Day Rate' ? shift.rate : benchmark.dayRate);

  const totalHours = shift.hours || 10;
  const regularHours = Math.min(10, totalHours);
  const otHours = Math.max(0, Math.min(4, totalHours - 10)); // Hours 10 to 14
  const doubleTimeHours = Math.max(0, totalHours - 14); // Hours beyond 14

  let regularPay = 0;
  let otPay = 0;
  let doubleTimePay = 0;
  let totalEstimatedCost = 0;

  if (shift.rateType === 'Day Rate') {
    // Standard 10-hour live production guarantee
    regularPay = effectiveDayRate;
    otPay = Number((otHours * (effectiveHourlyRate * 1.5)).toFixed(2));
    doubleTimePay = Number((doubleTimeHours * (effectiveHourlyRate * 2.0)).toFixed(2));
    totalEstimatedCost = Number((regularPay + otPay + doubleTimePay).toFixed(2));
  } else {
    // Pure Hourly calculation
    regularPay = Number((regularHours * effectiveHourlyRate).toFixed(2));
    otPay = Number((otHours * (effectiveHourlyRate * 1.5)).toFixed(2));
    doubleTimePay = Number((doubleTimeHours * (effectiveHourlyRate * 2.0)).toFixed(2));
    totalEstimatedCost = Number((regularPay + otPay + doubleTimePay).toFixed(2));
  }

  return {
    shiftId: shift.id,
    staffId: shift.staffId,
    staffName: shift.staffName || assignedStaff?.name || 'Technician',
    role: shift.role,
    eventName: shift.eventName,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    totalHours,
    regularHours,
    otHours,
    doubleTimeHours,
    rateType: shift.rateType,
    effectiveHourlyRate,
    effectiveDayRate,
    roleBenchmarkHourlyRate: benchmark.hourlyRate,
    roleBenchmarkDayRate: benchmark.dayRate,
    regularPay,
    otPay,
    doubleTimePay,
    totalEstimatedCost,
    agreedShiftRate: shift.rate || totalEstimatedCost,
    hasOvertime: otHours > 0 || doubleTimeHours > 0,
    department: benchmark.category || 'Production',
  };
}

export interface DepartmentLaborMetric {
  department: string;
  totalCost: number;
  totalHours: number;
  shiftCount: number;
  percentageOfCost: number;
}

export interface EventLaborMetric {
  eventName: string;
  totalCost: number;
  totalHours: number;
  shiftCount: number;
  confirmedShifts: number;
}

export interface RoleLaborMetric {
  role: CrewRole;
  department: string;
  benchmarkHourlyRate: number;
  totalCost: number;
  totalHours: number;
  shiftCount: number;
}

export interface FleetLaborSummary {
  totalEstimatedLaborCost: number;
  totalRegularPay: number;
  totalOvertimePay: number;
  totalHours: number;
  regularHours: number;
  otHours: number;
  doubleTimeHours: number;
  totalShiftsCount: number;
  averageCostPerShift: number;
  averageHourlyRate: number;
  departments: DepartmentLaborMetric[];
  events: EventLaborMetric[];
  roles: RoleLaborMetric[];
  shiftDetailsMap: Map<string, ShiftLaborCostDetails>;
}

export function calculateFleetLaborSummary(
  shifts: LaborShift[],
  staffList: StaffMember[]
): FleetLaborSummary {
  const shiftDetailsMap = new Map<string, ShiftLaborCostDetails>();

  let totalEstimatedLaborCost = 0;
  let totalRegularPay = 0;
  let totalOvertimePay = 0;
  let totalHours = 0;
  let regularHours = 0;
  let otHours = 0;
  let doubleTimeHours = 0;

  const deptMap = new Map<string, { totalCost: number; totalHours: number; shiftCount: number }>();
  const eventMap = new Map<string, { totalCost: number; totalHours: number; shiftCount: number; confirmedShifts: number }>();
  const roleMap = new Map<CrewRole, { department: string; benchmarkHourlyRate: number; totalCost: number; totalHours: number; shiftCount: number }>();

  shifts.forEach((shift) => {
    const details = calculateShiftLaborCost(shift, staffList);
    shiftDetailsMap.set(shift.id, details);

    totalEstimatedLaborCost += details.totalEstimatedCost;
    totalRegularPay += details.regularPay;
    totalOvertimePay += (details.otPay + details.doubleTimePay);
    totalHours += details.totalHours;
    regularHours += details.regularHours;
    otHours += details.otHours;
    doubleTimeHours += details.doubleTimeHours;

    // Dept grouping
    const curDept = deptMap.get(details.department) || { totalCost: 0, totalHours: 0, shiftCount: 0 };
    curDept.totalCost += details.totalEstimatedCost;
    curDept.totalHours += details.totalHours;
    curDept.shiftCount += 1;
    deptMap.set(details.department, curDept);

    // Event grouping
    const curEv = eventMap.get(shift.eventName) || { totalCost: 0, totalHours: 0, shiftCount: 0, confirmedShifts: 0 };
    curEv.totalCost += details.totalEstimatedCost;
    curEv.totalHours += details.totalHours;
    curEv.shiftCount += 1;
    if (shift.status === 'Confirmed') curEv.confirmedShifts += 1;
    eventMap.set(shift.eventName, curEv);

    // Role grouping
    const curRole = roleMap.get(shift.role) || {
      department: details.department,
      benchmarkHourlyRate: details.roleBenchmarkHourlyRate,
      totalCost: 0,
      totalHours: 0,
      shiftCount: 0,
    };
    curRole.totalCost += details.totalEstimatedCost;
    curRole.totalHours += details.totalHours;
    curRole.shiftCount += 1;
    roleMap.set(shift.role, curRole);
  });

  const departments: DepartmentLaborMetric[] = Array.from(deptMap.entries())
    .map(([department, data]) => ({
      department,
      totalCost: Number(data.totalCost.toFixed(2)),
      totalHours: Number(data.totalHours.toFixed(1)),
      shiftCount: data.shiftCount,
      percentageOfCost: totalEstimatedLaborCost > 0 ? Math.round((data.totalCost / totalEstimatedLaborCost) * 100) : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const events: EventLaborMetric[] = Array.from(eventMap.entries())
    .map(([eventName, data]) => ({
      eventName,
      totalCost: Number(data.totalCost.toFixed(2)),
      totalHours: Number(data.totalHours.toFixed(1)),
      shiftCount: data.shiftCount,
      confirmedShifts: data.confirmedShifts,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const roles: RoleLaborMetric[] = Array.from(roleMap.entries())
    .map(([role, data]) => ({
      role,
      department: data.department,
      benchmarkHourlyRate: data.benchmarkHourlyRate,
      totalCost: Number(data.totalCost.toFixed(2)),
      totalHours: Number(data.totalHours.toFixed(1)),
      shiftCount: data.shiftCount,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const totalShiftsCount = shifts.length;
  const averageCostPerShift = totalShiftsCount > 0 ? Number((totalEstimatedLaborCost / totalShiftsCount).toFixed(2)) : 0;
  const averageHourlyRate = totalHours > 0 ? Number((totalEstimatedLaborCost / totalHours).toFixed(2)) : 0;

  return {
    totalEstimatedLaborCost: Number(totalEstimatedLaborCost.toFixed(2)),
    totalRegularPay: Number(totalRegularPay.toFixed(2)),
    totalOvertimePay: Number(totalOvertimePay.toFixed(2)),
    totalHours: Number(totalHours.toFixed(1)),
    regularHours: Number(regularHours.toFixed(1)),
    otHours: Number(otHours.toFixed(1)),
    doubleTimeHours: Number(doubleTimeHours.toFixed(1)),
    totalShiftsCount,
    averageCostPerShift,
    averageHourlyRate,
    departments,
    events,
    roles,
    shiftDetailsMap,
  };
}
