import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Receipt,
  Boxes,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { EventBooking, Equipment, UserRole } from '../types/rental';
import { formatRupiah } from '../utils/formatters';

interface FinancialSummaryProps {
  bookings: EventBooking[];
  equipmentList: Equipment[];
  userRole?: UserRole;
  onNavigateToCalendar?: () => void;
  onNavigateToInvoice?: () => void;
}

// Custom dark-ink tooltip for Recharts charts
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: '#1a1d24',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '6px',
        padding: '10px 14px',
        fontSize: '11px',
        color: '#fff',
        minWidth: '160px',
      }}
    >
      <div style={{ marginBottom: '6px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
        {label}
      </div>
      {payload.map((entry: any, i: number) => {
        const nameMap: Record<string, string> = {
          terbayar: 'Kas Terbayar',
          piutang: 'Sisa Piutang',
          totalOmset: 'Total Omset',
        };
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '2px' }}>
            <span style={{ color: entry.color || 'rgba(255,255,255,0.6)' }}>{nameMap[entry.dataKey] || entry.name}</span>
            <span style={{ fontFamily: 'monospace', color: '#fff' }}>{formatRupiah(Number(entry.value))}</span>
          </div>
        );
      })}
    </div>
  );
};

const UtilTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  return (
    <div
      style={{
        background: '#1a1d24',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '6px',
        padding: '10px 14px',
        fontSize: '11px',
        color: '#fff',
      }}
    >
      <div style={{ marginBottom: '4px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{d?.category}</div>
      <div style={{ fontFamily: 'monospace' }}>
        {d?.utilizationRate}% &mdash; {d?.bookedUnits} / {d?.totalStock} unit
      </div>
    </div>
  );
};

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  bookings,
  equipmentList,
  userRole = 'admin',
  onNavigateToCalendar,
  onNavigateToInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'revenue' | 'utilization'>('all');

  // 1. Current October Booking Financials from actual state
  const totalOctoberRevenue = useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  }, [bookings]);

  const totalOctoberPaid = useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.paidAmount, 0);
  }, [bookings]);

  const totalOctoberUnpaid = useMemo(() => {
    return Math.max(0, totalOctoberRevenue - totalOctoberPaid);
  }, [totalOctoberRevenue, totalOctoberPaid]);

  const collectionRate = useMemo(() => {
    if (totalOctoberRevenue === 0) return 0;
    return Math.round((totalOctoberPaid / totalOctoberRevenue) * 100);
  }, [totalOctoberRevenue, totalOctoberPaid]);

  // 2. Monthly Revenue Data (Historical context + October live actual data + Next month pipeline)
  const monthlyRevenueData = useMemo(() => {
    return [
      {
        month: 'Jul 2026',
        terbayar: 62000000,
        piutang: 4500000,
        totalOmset: 66500000,
        eventCount: 3,
      },
      {
        month: 'Agt 2026',
        terbayar: 84000000,
        piutang: 7200000,
        totalOmset: 91200000,
        eventCount: 4,
      },
      {
        month: 'Sep 2026',
        terbayar: 95500000,
        piutang: 11000000,
        totalOmset: 106500000,
        eventCount: 5,
      },
      {
        month: 'Okt 2026 (Aktif)',
        terbayar: totalOctoberPaid,
        piutang: totalOctoberUnpaid,
        totalOmset: totalOctoberRevenue,
        eventCount: bookings.length,
        isCurrent: true,
      },
      {
        month: 'Nov 2026 (Proyeksi)',
        terbayar: 42000000,
        piutang: 38000000,
        totalOmset: 80000000,
        eventCount: 3,
      },
    ];
  }, [totalOctoberPaid, totalOctoberUnpaid, totalOctoberRevenue, bookings.length]);

  // 3. Equipment Category Utilization Rates & Revenue Contribution
  const categoryStats = useMemo(() => {
    const categories: Equipment['category'][] = [
      'Kamera & Lensa',
      'Audio & Sound',
      'Lighting & Effect',
      'Visual & LED',
      'Rigging & Truss',
      'Power & Kabel',
    ];

    return categories.map((cat) => {
      const itemsInCat = equipmentList.filter((eq) => eq.category === cat);
      const totalStock = itemsInCat.reduce((sum, eq) => sum + eq.totalStock, 0);

      // Total quantity reserved/booked in bookings
      let bookedUnits = 0;
      let revenue = 0;

      bookings.forEach((b) => {
        b.items.forEach((it) => {
          if (it.category === cat) {
            bookedUnits += it.quantity;
            revenue += it.subtotal;
          }
        });
      });

      const utilizationRate = totalStock > 0 ? Math.round((bookedUnits / totalStock) * 100) : 0;

      return {
        category: cat,
        shortName: cat.split(' & ')[0],
        totalStock,
        bookedUnits,
        utilizationRate,
        revenue,
      };
    });
  }, [equipmentList, bookings]);

  // Total Fleet Fleet Utilization
  const overallFleetUtilization = useMemo(() => {
    const totalPhysicalUnits = equipmentList.reduce((sum, e) => sum + e.totalStock, 0);
    const totalBookedUnits = categoryStats.reduce((sum, c) => sum + c.bookedUnits, 0);
    if (totalPhysicalUnits === 0) return 0;
    return Math.round((totalBookedUnits / totalPhysicalUnits) * 100);
  }, [equipmentList, categoryStats]);

  // 4. Top Equipment by Utilization & Revenue
  const topEquipmentData = useMemo(() => {
    return equipmentList
      .map((eq) => {
        const bookedQty = bookings.reduce((sum, b) => {
          const it = b.items.find((i) => i.equipmentId === eq.id);
          return sum + (it ? it.quantity : 0);
        }, 0);
        const rate = eq.totalStock > 0 ? Math.round((bookedQty / eq.totalStock) * 100) : 0;
        const totalEarned = bookings.reduce((sum, b) => {
          const it = b.items.find((i) => i.equipmentId === eq.id);
          return sum + (it ? it.subtotal : 0);
        }, 0);

        return {
          id: eq.id,
          name: eq.name,
          category: eq.category,
          totalStock: eq.totalStock,
          bookedQty,
          utilizationRate: rate,
          totalEarned,
          hasConflict: rate > 100,
        };
      })
      .sort((a, b) => b.utilizationRate - a.utilizationRate)
      .slice(0, 5);
  }, [equipmentList, bookings]);

  // Color mapping for category pie chart
  const PIE_COLORS = [
    '#4F46E5', // Indigo (Kamera)
    '#0EA5E9', // Sky (Audio)
    '#F59E0B', // Amber (Lighting)
    '#8B5CF6', // Purple (Visual LED)
    '#10B981', // Emerald (Rigging)
    '#64748B', // Slate (Power)
  ];

  // Custom Rupiah Tooltip Formatter for Recharts
  const formatTooltipValue = (value: number | string | undefined) => {
    if (typeof value === 'number') {
      return formatRupiah(value);
    }
    return value || '';
  };

  const isOwner = userRole === 'owner';

  const tabs: { key: 'all' | 'revenue' | 'utilization'; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'revenue', label: 'Pendapatan' },
    { key: 'utilization', label: 'Utilisasi' },
  ];

  return (
    <div className="animate-page-enter space-y-6">

      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="section-label mb-1">
            {isOwner ? 'Finansial & Utilisasi' : 'Kapasitas & Stok Gudang'}
          </p>
          <h2 className="text-[18px] font-semibold text-[#111318] leading-snug">
            {isOwner
              ? 'Ringkasan Keuangan & Armada'
              : 'Alokasi Stok Gudang'}
          </h2>
          <p className="text-[13px] text-[#6b7280] mt-0.5">
            {isOwner
              ? 'Analitik pendapatan sewa & tingkat utilisasi kapasitas inventaris berbasis data riil'
              : 'Alokasi unit fisik armada dan kapasitas ketersediaan stok gudang'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onNavigateToCalendar && (
            <button onClick={onNavigateToCalendar} className="btn-ghost text-[13px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Kalender
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {isOwner && onNavigateToInvoice && (
            <button onClick={onNavigateToInvoice} className="btn-ghost text-[13px] flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              Invoice
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Switcher (Owner only) ── */}
      {isOwner && (
        <div className="flex items-center gap-6 border-b border-[rgba(17,19,24,0.08)]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-2.5 text-[13px] font-medium transition-colors relative ${
                activeTab === t.key
                  ? 'text-[#111318]'
                  : 'text-[#9ca3af] hover:text-[#374151]'
              }`}
            >
              {t.label}
              {activeTab === t.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: '#4f46e5' }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="flex divide-x divide-[rgba(17,19,24,0.08)]">
        {isOwner ? (
          <>
            <div className="flex-1 pr-6 animate-value-appear stagger-1">
              <p className="section-label mb-1">Omset Booking</p>
              <div className="metric-figure-mono text-[#111318]">
                {formatRupiah(totalOctoberRevenue)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-[#059669]" />
                <span className="text-[12px] text-[#059669] font-medium">{bookings.length} event terdaftar</span>
              </div>
            </div>

            <div className="flex-1 px-6 animate-value-appear stagger-2">
              <p className="section-label mb-1">Kas Masuk</p>
              <div className="metric-figure-mono text-[#059669]">
                {formatRupiah(totalOctoberPaid)}
              </div>
              <div className="mt-1 text-[12px] text-[#6b7280]">
                Kolektibilitas&ensp;<span className="font-mono text-[#111318] font-semibold">{collectionRate}%</span>
              </div>
            </div>

            <div className="flex-1 px-6 animate-value-appear stagger-3">
              <p className="section-label mb-1">Sisa Piutang</p>
              <div className="metric-figure-mono text-[#d97706]">
                {formatRupiah(totalOctoberUnpaid)}
              </div>
              <div className="mt-1 text-[12px] text-[#6b7280]">
                {bookings.filter((b) => b.paymentStatus !== 'Lunas').length} invoice belum lunas
              </div>
            </div>

            <div className="flex-1 pl-6 animate-value-appear stagger-4">
              <p className="section-label mb-1">Utilisasi Armada</p>
              <div className="metric-figure-mono text-[#4f46e5]">
                {overallFleetUtilization}%
              </div>
              <div className="mt-1 text-[12px]">
                {overallFleetUtilization > 80 ? (
                  <span className="text-[#d97706] font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Permintaan Tinggi
                  </span>
                ) : (
                  <span className="text-[#059669] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Kapasitas Sehat
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 pr-6 animate-value-appear stagger-1">
              <p className="section-label mb-1">Total Unit Fisik</p>
              <div className="metric-figure-mono text-[#111318]">
                {equipmentList.reduce((sum, e) => sum + e.totalStock, 0)}
                <span className="text-[14px] font-normal ml-1">unit</span>
              </div>
              <div className="mt-1 text-[12px] text-[#4f46e5] font-medium">6 Kategori Alat</div>
            </div>

            <div className="flex-1 px-6 animate-value-appear stagger-2">
              <p className="section-label mb-1">Unit di Luar</p>
              <div className="metric-figure-mono text-[#d97706]">
                {categoryStats.reduce((sum, c) => sum + c.bookedUnits, 0)}
                <span className="text-[14px] font-normal ml-1">unit</span>
              </div>
              <div className="mt-1 text-[12px] text-[#6b7280]">Teralokasi event aktif</div>
            </div>

            <div className="flex-1 px-6 animate-value-appear stagger-3">
              <p className="section-label mb-1">Unit Standby</p>
              <div className="metric-figure-mono text-[#059669]">
                {equipmentList.reduce((sum, e) => sum + e.totalStock, 0) -
                  categoryStats.reduce((sum, c) => sum + c.bookedUnits, 0)}
                <span className="text-[14px] font-normal ml-1">unit</span>
              </div>
              <div className="mt-1 text-[12px] text-[#6b7280]">Siap disewa / standby</div>
            </div>

            <div className="flex-1 pl-6 animate-value-appear stagger-4">
              <p className="section-label mb-1">Utilisasi Keseluruhan</p>
              <div className="metric-figure-mono text-[#4f46e5]">
                {overallFleetUtilization}%
              </div>
              <div className="mt-1 text-[12px]">
                {overallFleetUtilization > 80 ? (
                  <span className="text-[#d97706] font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Stok Banyak Terpakai
                  </span>
                ) : (
                  <span className="text-[#059669] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Kapasitas Aman
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── CHART 1: Monthly Revenue Trend (Owner only) ── */}
      {isOwner && (activeTab === 'all' || activeTab === 'revenue') && (
        <div className="panel p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <p className="section-label mb-0.5">Tren Pendapatan Bulanan</p>
              <h3 className="text-[14px] font-semibold text-[#111318]">
                Realisasi Arus Kas &amp; Piutang Sewa
              </h3>
              <p className="text-[12px] text-[#6b7280] mt-0.5">
                Perbandingan kas terbayar vs piutang sewa alat sepanjang periode operasional
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-[#6b7280] font-medium shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#10b981' }} />
                Kas Terbayar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f59e0b' }} />
                Piutang
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-[2px] rounded-full" style={{ background: '#6366f1' }} />
                Total Omset
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyRevenueData}
                margin={{ top: 10, right: 12, left: 8, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="rgba(17,19,24,0.06)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)} jt`}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar
                  dataKey="terbayar"
                  name="terbayar"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                  barSize={28}
                />
                <Bar
                  dataKey="piutang"
                  name="piutang"
                  stackId="a"
                  fill="#f59e0b"
                  radius={[3, 3, 0, 0]}
                  barSize={28}
                />
                <Line
                  type="monotone"
                  dataKey="totalOmset"
                  name="totalOmset"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#6366f1', strokeWidth: 2, stroke: '#fefdfb' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── CHART 2 & 3: Utilization + Pie ── */}
      {(activeTab === 'all' || activeTab === 'utilization') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Horizontal Bar — utilization by category */}
          <div className={`${isOwner ? 'lg:col-span-7' : 'lg:col-span-12'} panel p-5`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="section-label mb-0.5">Utilisasi per Kategori</p>
                <h4 className="text-[14px] font-semibold text-[#111318]">
                  Tingkat Utilisasi Stok (%)
                </h4>
                <p className="text-[12px] text-[#6b7280] mt-0.5">
                  Persentase kapasitas alat yang teralokasi dalam booking aktif
                </p>
              </div>
              <span className="badge-indigo text-[10px] font-mono shrink-0">Ambang Kritis: 80%</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryStats}
                  layout="vertical"
                  margin={{ top: 4, right: 28, left: 16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="1 4" horizontal={false} stroke="rgba(17,19,24,0.06)" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(val) => `${val}%`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="shortName"
                    type="category"
                    tick={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<UtilTooltip />} />
                  <Bar
                    dataKey="utilizationRate"
                    name="Utilisasi"
                    barSize={14}
                    radius={[0, 3, 3, 0]}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.utilizationRate > 80
                            ? '#be123c'
                            : entry.utilizationRate >= 60
                            ? '#4f46e5'
                            : '#0ea5e9'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="divider my-3" />
            <div className="flex items-center gap-4 text-[11px] text-[#6b7280]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: '#0ea5e9' }} />
                &lt; 60% Tersedia
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: '#4f46e5' }} />
                60–80% Optimal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: '#be123c' }} />
                &gt; 80% Kritis
              </span>
              <span className="ml-auto font-medium text-[#374151]">{equipmentList.length} model alat</span>
            </div>
          </div>

          {/* Right: Donut — revenue contribution (Owner only) */}
          {isOwner && (
            <div className="lg:col-span-5 panel p-5 flex flex-col">
              <div className="mb-4">
                <p className="section-label mb-0.5">Kontribusi Omset</p>
                <h4 className="text-[14px] font-semibold text-[#111318]">
                  Distribusi per Kategori Alat
                </h4>
                <p className="text-[12px] text-[#6b7280] mt-0.5">
                  Proporsi nilai sewa masing-masing divisi peralatan
                </p>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell
                          key={`pie-cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div
                            style={{
                              background: '#1a1d24',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '11px',
                              color: '#fff',
                            }}
                          >
                            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '3px' }}>
                              {payload[0]?.name}
                            </div>
                            <div style={{ fontFamily: 'monospace' }}>
                              {formatRupiah(Number(payload[0]?.value))}
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom horizontal legend */}
              <div className="divider my-3" />
              <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                {categoryStats.map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-[11px] text-[#374151] truncate">{cat.shortName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#6b7280] tabular-nums ml-2 shrink-0">
                      {totalOctoberRevenue > 0
                        ? `${Math.round((cat.revenue / totalOctoberRevenue) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Top Equipment Performance Table ── */}
      {topEquipmentData.length > 0 && (
        <div className="panel">
          <div className="px-5 pt-4 pb-3 border-b border-[rgba(17,19,24,0.08)]">
            <p className="section-label mb-0.5">Performa Alat</p>
            <h4 className="text-[14px] font-semibold text-[#111318]">
              Top 5 Alat berdasarkan Utilisasi
            </h4>
          </div>
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Nama Alat</th>
                <th>Kategori</th>
                {isOwner && <th className="text-right">Pendapatan</th>}
                <th className="text-right">Utilisasi</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topEquipmentData.map((eq, idx) => (
                <tr key={eq.id} className={`table-row-hover stagger-${Math.min(idx + 1, 8) as 1}`}>
                  <td>
                    <span className="text-[13px] font-medium text-[#111318]">{eq.name}</span>
                    <span className="block text-[11px] text-[#9ca3af] font-mono tabular-nums">
                      {eq.bookedQty} / {eq.totalStock} unit
                    </span>
                  </td>
                  <td>
                    <span className="text-[12px] text-[#6b7280]">{eq.category}</span>
                  </td>
                  {isOwner && (
                    <td className="text-right">
                      <span className="font-mono tabular-nums text-[12px] text-[#374151]">
                        {formatRupiah(eq.totalEarned)}
                      </span>
                    </td>
                  )}
                  <td className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono tabular-nums text-[12px] text-[#374151]">
                        {eq.utilizationRate}%
                      </span>
                      <div className="progress-bar-track w-20" style={{ height: '3px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(eq.utilizationRate, 100)}%`,
                            background:
                              eq.utilizationRate > 80
                                ? '#be123c'
                                : eq.utilizationRate >= 60
                                ? '#4f46e5'
                                : '#10b981',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    {eq.hasConflict ? (
                      <span className="badge-carmine">Konflik</span>
                    ) : eq.utilizationRate > 80 ? (
                      <span className="badge-amber">Kritis</span>
                    ) : (
                      <span className="badge-emerald">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Accounts Receivable Section (Owner only) ── */}
      {isOwner && totalOctoberUnpaid > 0 && (
        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="section-label mb-1">Piutang Belum Lunas</p>
              <div className="metric-figure-mono" style={{ color: '#be123c' }}>
                {formatRupiah(totalOctoberUnpaid)}
              </div>
              <p className="text-[12px] text-[#6b7280] mt-1">
                {bookings.filter((b) => b.paymentStatus !== 'Lunas').length} invoice menunggu pelunasan
              </p>
            </div>
            {onNavigateToInvoice && (
              <button onClick={onNavigateToInvoice} className="btn-ghost text-[13px] flex items-center gap-1.5 mb-1">
                Lihat Semua Invoice
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="panel">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Klien / Event</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Terbayar</th>
                  <th className="text-right">Sisa</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter((b) => b.paymentStatus !== 'Lunas')
                  .slice(0, 5)
                  .map((b, idx) => (
                    <tr key={b.id} className="table-row-hover">
                      <td>
                        <span className="text-[13px] font-medium text-[#111318]">{b.clientName}</span>
                        <span className="block text-[11px] text-[#9ca3af] font-mono tabular-nums">
                          {b.eventName}
                        </span>
                      </td>
                      <td className="text-right font-mono tabular-nums text-[12px] text-[#374151]">
                        {formatRupiah(b.totalAmount)}
                      </td>
                      <td className="text-right font-mono tabular-nums text-[12px] text-[#059669]">
                        {formatRupiah(b.paidAmount)}
                      </td>
                      <td className="text-right font-mono tabular-nums text-[12px] text-[#be123c]">
                        {formatRupiah(b.totalAmount - b.paidAmount)}
                      </td>
                      <td>
                        {b.paymentStatus === 'DP 50%' ? (
                          <span className="badge-amber">DP 50%</span>
                        ) : b.paymentStatus === 'Belum Bayar' ? (
                          <span className="badge-carmine">Belum Bayar</span>
                        ) : (
                          <span className="badge-ink">{b.paymentStatus}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Operational Notes Panel ── */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-label mb-0.5">
              {isOwner ? 'Rekomendasi Manajemen' : 'Protokol Gudang'}
            </p>
            <h4 className="text-[14px] font-semibold text-[#111318]">
              {isOwner
                ? 'Inventaris & Investasi Alat'
                : 'Pemeliharaan Stok Fisik'}
            </h4>
          </div>
          <span className="font-mono text-[10px] badge-indigo">
            {isOwner ? 'Insight Finansial' : 'Protokol Gudang'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isOwner ? (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#be123c]" />
                  <span className="text-[12px] font-semibold text-[#be123c]">Over-Allocation</span>
                </div>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  <strong className="text-[#374151]">Sony Alpha A7 III</strong> dan{' '}
                  <strong className="text-[#374151]">LED Videowall P3.9</strong> mendekati kapasitas &gt;90% pada
                  15–17 Oktober. Sistem mendeteksi bentrok jadwal yang perlu disubstitusi atau sub-rent.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="text-[12px] font-semibold text-[#059669]">Penghasil Omset Tertinggi</span>
                </div>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  Divisi <strong className="text-[#374151]">Audio &amp; Sound</strong> menyumbang nilai sewa terbesar
                  bulan ini melalui paket Line Array RCF dan Digital Mixer Yamaha CL5 dengan tingkat pengembalian
                  tepat waktu 100%.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#4f46e5]" />
                  <span className="text-[12px] font-semibold text-[#4f46e5]">Peluang Investasi</span>
                </div>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  Tingkat utilisasi Lighting Beam 260W selalu penuh pada akhir pekan. Menambah 4 unit diproyeksikan
                  meningkatkan kapasitas booking hingga +Rp 18.000.000/bulan.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#be123c]" />
                  <span className="text-[12px] font-semibold text-[#be123c]">Stok Menipis</span>
                </div>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  Periksa alokasi <strong className="text-[#374151]">Sony Alpha A7 III</strong> dan{' '}
                  <strong className="text-[#374151]">LED Videowall</strong>. Stok fisik di rak gudang tersisa sangat
                  sedikit untuk jadwal event aktif.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-[#d97706]" />
                  <span className="text-[12px] font-semibold text-[#d97706]">QC Fisik &amp; Aksesoris</span>
                </div>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  Lakukan pemeriksaan visual menyeluruh pada unit audio &amp; lighting yang baru kembali: cek
                  grounding kabel power, pin XLR, dan kelengkapan hardcase.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="text-[12px] font-semibold text-[#059669]">Kesiapan Rak &amp; Standby</span>
                </div>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  Pastikan baterai cadangan terisi penuh dan label QR/barcode pada tiap flight case dapat terbaca
                  sebelum unit dimuat ke kendaraan loading.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
