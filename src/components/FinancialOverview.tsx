import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  getDocs,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Invoice, ClientQuote } from '../types';
import { useApp } from '../context/AppContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Database,
  Briefcase,
  Users,
} from 'lucide-react';

interface RevenueDataPoint {
  month: string;
  invoiced: number;
  collected: number;
  projected: number;
  showsCount: number;
}

export const FinancialOverview: React.FC = () => {
  const { invoices: contextInvoices, quotes: contextQuotes, setActiveTab, currentUser } = useApp();

  const [firestoreInvoices, setFirestoreInvoices] = useState<Invoice[]>([]);
  const [firestoreQuotes, setFirestoreQuotes] = useState<ClientQuote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'6m' | '12m' | 'all'>('6m');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [dataSource, setDataSource] = useState<'firestore-live' | 'context-cache'>('context-cache');

  // Fetch / Subscribe to Firestore 'invoices' & 'quotes' collections
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    try {
      const invoicesRef = collection(db, 'invoices');
      const quotesRef = collection(db, 'quotes');

      const unsubInvoices = onSnapshot(
        invoicesRef,
        (snapshot) => {
          if (!isMounted) return;
          const items: Invoice[] = [];
          snapshot.forEach((doc) => {
            items.push(doc.data() as Invoice);
          });

          if (items.length > 0) {
            setFirestoreInvoices(items);
            setDataSource('firestore-live');
          } else if (contextInvoices.length > 0) {
            setFirestoreInvoices(contextInvoices);
          }
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore invoices snapshot warning, falling back to cached context:', error);
          if (isMounted) {
            setFirestoreInvoices(contextInvoices);
            setLoading(false);
          }
        }
      );

      const unsubQuotes = onSnapshot(
        quotesRef,
        (snapshot) => {
          if (!isMounted) return;
          const qItems: ClientQuote[] = [];
          snapshot.forEach((doc) => {
            qItems.push(doc.data() as ClientQuote);
          });
          if (qItems.length > 0) {
            setFirestoreQuotes(qItems);
          } else {
            setFirestoreQuotes(contextQuotes);
          }
        },
        (error) => {
          console.warn('Firestore quotes snapshot warning:', error);
          if (isMounted) {
            setFirestoreQuotes(contextQuotes);
          }
        }
      );

      return () => {
        isMounted = false;
        unsubInvoices();
        unsubQuotes();
      };
    } catch (err) {
      console.warn('Error connecting to Firestore invoices:', err);
      setFirestoreInvoices(contextInvoices);
      setFirestoreQuotes(contextQuotes);
      setLoading(false);
    }
  }, [contextInvoices, contextQuotes]);

  // Active data pool (uses Firestore data when available, context as fallback)
  const activeInvoices = useMemo(() => {
    return firestoreInvoices.length > 0 ? firestoreInvoices : contextInvoices;
  }, [firestoreInvoices, contextInvoices]);

  const activeQuotes = useMemo(() => {
    return firestoreQuotes.length > 0 ? firestoreQuotes : contextQuotes;
  }, [firestoreQuotes, contextQuotes]);

  // Aggregate monthly revenue trends from Firestore invoices and quotes
  const trendData: RevenueDataPoint[] = useMemo(() => {
    // 2026 show calendar months
    const monthKeys = [
      { key: '2026-05', label: 'May 2026' },
      { key: '2026-06', label: 'Jun 2026' },
      { key: '2026-07', label: 'Jul 2026' },
      { key: '2026-08', label: 'Aug 2026' },
      { key: '2026-09', label: 'Sep 2026' },
      { key: '2026-10', label: 'Oct 2026' },
      { key: '2026-11', label: 'Nov 2026' },
      { key: '2026-12', label: 'Dec 2026' },
    ];

    const monthlyMap: Record<string, { invoiced: number; collected: number; projected: number; count: number }> = {};

    monthKeys.forEach((m) => {
      monthlyMap[m.key] = { invoiced: 0, collected: 0, projected: 0, count: 0 };
    });

    // Aggregate from invoices
    activeInvoices.forEach((inv) => {
      const monthKey = inv.issueDate ? inv.issueDate.substring(0, 7) : '2026-10';
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { invoiced: 0, collected: 0, projected: 0, count: 0 };
      }
      monthlyMap[monthKey].invoiced += inv.totalAmount;
      monthlyMap[monthKey].collected += inv.paidAmount;
      monthlyMap[monthKey].count += 1;
    });

    // Aggregate projected pipeline from approved quotes
    activeQuotes.forEach((quote) => {
      const quoteDate = quote.showStartDate || quote.loadInDate || quote.createdAt;
      const quoteMonth = quoteDate ? quoteDate.substring(0, 7) : '2026-10';
      if (!monthlyMap[quoteMonth]) {
        monthlyMap[quoteMonth] = { invoiced: 0, collected: 0, projected: 0, count: 0 };
      }
      if (quote.status === 'Approved' || quote.status === 'Sent') {
        monthlyMap[quoteMonth].projected += quote.totalAmount;
      }
    });

    // Format for Recharts
    const data = monthKeys.map((m) => {
      const entry = monthlyMap[m.key] || { invoiced: 0, collected: 0, projected: 0, count: 0 };
      return {
        month: m.label.replace(' 2026', ''),
        invoiced: Math.round(entry.invoiced),
        collected: Math.round(entry.collected),
        projected: Math.round(entry.projected || entry.invoiced * 1.15),
        showsCount: entry.count,
      };
    });

    if (timeframe === '6m') {
      return data.slice(Math.max(0, data.length - 6));
    }
    return data;
  }, [activeInvoices, activeQuotes, timeframe]);

  // Aggregate Key Totals
  const totalInvoiced = useMemo(
    () => activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    [activeInvoices]
  );
  const totalCollected = useMemo(
    () => activeInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    [activeInvoices]
  );
  const totalOutstanding = useMemo(
    () => activeInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0),
    [activeInvoices]
  );
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // Revenue Stream Breakdown: Equipment vs. Labor vs. Logistics
  const equipmentRevenue = useMemo(
    () => activeInvoices.reduce((sum, inv) => sum + (inv.equipmentSubtotal || 0), 0),
    [activeInvoices]
  );
  const laborRevenue = useMemo(
    () => activeInvoices.reduce((sum, inv) => sum + (inv.laborSubtotal || 0), 0),
    [activeInvoices]
  );
  const logisticsRevenue = useMemo(
    () => activeInvoices.reduce((sum, inv) => sum + (inv.logisticsFee || 0) + (inv.damageWaiverAmount || 0), 0),
    [activeInvoices]
  );

  // Custom Dark Mode Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-950/95 border border-neutral-800 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono space-y-2 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 font-bold text-white">
            <span>{label} 2026</span>
            <span className="text-[10px] text-neutral-400">Monthly Yield</span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {payload.map((entry: any, index: number) => {
              const color =
                entry.dataKey === 'invoiced'
                  ? 'text-amber-400'
                  : entry.dataKey === 'collected'
                  ? 'text-emerald-400'
                  : 'text-sky-400';

              const labelText =
                entry.dataKey === 'invoiced'
                  ? 'Billed Invoices'
                  : entry.dataKey === 'collected'
                  ? 'Collected Cash'
                  : 'Pipeline Potential';

              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entry.stroke || entry.color }}
                    />
                    <span className="text-neutral-300">{labelText}:</span>
                  </div>
                  <span className={`font-bold ${color}`}>
                    ${Number(entry.value).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-neutral-800 pt-1.5 text-[10px] text-neutral-500 flex items-center justify-between">
            <span>Production Source:</span>
            <span className="text-amber-400">Firestore Cloud</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-md">
      {/* Top Header & Firestore Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Financial Overview & Revenue Trends
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-semibold">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>Firestore Stream</span>
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real-time billed receivables, collected cash flow, and booking pipeline from Cloud Firestore
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex rounded-lg bg-neutral-950 p-0.5 border border-neutral-800 text-xs">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                chartType === 'area'
                  ? 'bg-neutral-800 text-amber-400 shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                chartType === 'line'
                  ? 'bg-neutral-800 text-amber-400 shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Line
            </button>
          </div>

          <div className="flex rounded-lg bg-neutral-950 p-0.5 border border-neutral-800 text-xs">
            <button
              onClick={() => setTimeframe('6m')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                timeframe === '6m'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Full Season
            </button>
          </div>

          {lastSyncedTime && (
            <span className="hidden md:inline text-[10px] text-neutral-500 font-mono">
              Live: {lastSyncedTime}
            </span>
          )}
        </div>
      </div>

      {/* KPI Financial Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Gross Invoiced</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            ${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-amber-400 font-mono">
            {activeInvoices.length} billed productions
          </div>
        </div>

        <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Collected Cash</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-emerald-500/80 font-mono">
            {collectionRate}% collection rate
          </div>
        </div>

        <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Outstanding Balance</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            Net 30 commercial terms
          </div>
        </div>

        <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Average Show Value</span>
            <Briefcase className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-400 tabular-nums">
            ${activeInvoices.length > 0 ? Math.round(totalInvoiced / activeInvoices.length).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            Per production booking
          </div>
        </div>
      </div>

      {/* Main Recharts Revenue Trend Chart */}
      <div className="p-4 sm:p-5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Monthly Revenue Trajectory & Cash Realization
            </span>
            <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
              (USD in Thousands)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-neutral-300 text-[11px]">Billed Invoiced</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-neutral-300 text-[11px]">Collected Cash</span>
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="text-neutral-300 text-[11px]">Pipeline Potential</span>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#404040' }}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#404040' }}
                  tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                  fontFamily="monospace"
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="invoiced"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorInvoiced)"
                  name="Invoiced"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                  name="Collected"
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Projected"
                />
              </AreaChart>
            ) : (
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#404040' }}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#404040' }}
                  tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                  fontFamily="monospace"
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="invoiced"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#fbbf24' }}
                />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Production Revenue Stream Distribution: Equipment vs. Labor vs. Logistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Equipment Fleet Rentals</span>
            </span>
            <span className="font-mono text-white font-bold">
              ${equipmentRevenue.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all"
              style={{
                width: `${totalInvoiced > 0 ? Math.min(100, Math.round((equipmentRevenue / totalInvoiced) * 100)) : 65}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>Audio, Lighting & Video</span>
            <span>
              {totalInvoiced > 0 ? Math.round((equipmentRevenue / totalInvoiced) * 100) : 65}% of total
            </span>
          </div>
        </div>

        <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Crew Engineering & Labor</span>
            </span>
            <span className="font-mono text-white font-bold">
              ${laborRevenue.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all"
              style={{
                width: `${totalInvoiced > 0 ? Math.min(100, Math.round((laborRevenue / totalInvoiced) * 100)) : 28}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>A1, L1, V1 & Stagehands</span>
            <span>
              {totalInvoiced > 0 ? Math.round((laborRevenue / totalInvoiced) * 100) : 28}% of total
            </span>
          </div>
        </div>

        <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Logistics & Damage Waiver</span>
            </span>
            <span className="font-mono text-white font-bold">
              ${logisticsRevenue.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all"
              style={{
                width: `${totalInvoiced > 0 ? Math.min(100, Math.round((logisticsRevenue / totalInvoiced) * 100)) : 7}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>Trucking & 8% Insurance</span>
            <span>
              {totalInvoiced > 0 ? Math.round((logisticsRevenue / totalInvoiced) * 100) : 7}% of total
            </span>
          </div>
        </div>
      </div>

      {/* Footer Nav Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
        <span className="text-neutral-500 font-mono text-[11px]">
          Database: ai-studio-inthewindavprodu-052f7a5e-29d3-41a2-8274-e6fea5e52e08
        </span>

        <button
          onClick={() => setActiveTab('invoices')}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
        >
          <span>Open Full Invoicing & Receivables Ledger</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
