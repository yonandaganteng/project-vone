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
  Legend,
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
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Component Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              {isOwner ? <TrendingUp className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {isOwner
                ? 'Ringkasan Finansial & Rasio Utilisasi Alat (Owner Executive Analytics)'
                : 'Ringkasan Kapasitas & Utilisasi Stok Gudang (Warehouse Stock Analytics)'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isOwner
              ? 'Visualisasi analitik pendapatan sewa per bulan dan tingkat utilisasi kapasitas inventaris gudang berbasis data riil.'
              : 'Visualisasi alokasi unit fisik armada dan kapasitas ketersediaan stok gudang tanpa data finansial.'}
          </p>
        </div>

        {/* View Segment Switcher (Only for Owner) */}
        {isOwner && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Analitik
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'revenue'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Pendapatan Sewa
            </button>
            <button
              onClick={() => setActiveTab('utilization')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'utilization'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              Utilisasi Stok
            </button>
          </div>
        )}
      </div>

      {/* Mini KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/60 border-b border-slate-200">
        {isOwner ? (
          <>
            <div className="p-4">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Omset Booking Bulan Ini
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatRupiah(totalOctoberRevenue)}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>{bookings.length} Event Terdaftar</span>
              </div>
            </div>

            <div className="p-4">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Kas Masuk (Terbayar)
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 mt-0.5">
                {formatRupiah(totalOctoberPaid)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Kolektibilitas: <strong className="text-slate-800">{collectionRate}%</strong>
              </div>
            </div>

            <div className="p-4">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Sisa Piutang Klien
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-600 mt-0.5">
                {formatRupiah(totalOctoberUnpaid)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {bookings.filter((b) => b.paymentStatus !== 'Lunas').length} Invoice Belum Lunas
              </div>
            </div>

            <div className="p-4">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Rata-rata Utilisasi Armada
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-indigo-600 mt-0.5">
                {overallFleetUtilization}% Kapasitas
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {overallFleetUtilization > 80 ? (
                  <span className="text-amber-600 font-medium">⚠️ Permintaan Tinggi</span>
                ) : (
                  <span className="text-emerald-600 font-medium">✓ Level Kapasitas Sehat</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Total Unit Fisik Gudang
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5">
                {equipmentList.reduce((sum, e) => sum + e.totalStock, 0)} Unit
              </div>
              <div className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                <span>Total 6 Kategori Alat</span>
              </div>
            </div>

            <div className="p-4">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Unit Sedang di Luar (Disewa)
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-600 mt-0.5">
                {categoryStats.reduce((sum, c) => sum + c.bookedUnits, 0)} Unit
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Teralokasi di event aktif
              </div>
            </div>

            <div className="p-4">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Unit Standby di Rak Gudang
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 mt-0.5">
                {equipmentList.reduce((sum, e) => sum + e.totalStock, 0) -
                  categoryStats.reduce((sum, c) => sum + c.bookedUnits, 0)}{' '}
                Unit
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Siap untuk disewa / standby
              </div>
            </div>

            <div className="p-4">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Tingkat Utilisasi Keseluruhan
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-indigo-600 mt-0.5">
                {overallFleetUtilization}% Kapasitas
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {overallFleetUtilization > 80 ? (
                  <span className="text-amber-600 font-medium">⚠️ Stok Banyak Terpakai</span>
                ) : (
                  <span className="text-emerald-600 font-medium">✓ Kapasitas Aman</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Charts Body */}
      <div className="p-5 space-y-6">
        {/* CHART 1: Monthly Rental Revenue Trend (Only for Owner) */}
        {isOwner && (activeTab === 'all' || activeTab === 'revenue') && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Tren Pendapatan Rental & Realisasi Arus Kas Bulanan (Recharts Bar & Line)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Perbandingan penerimaan kas (terbayar) versus piutang sewa alat sepanjang periode operasional
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Kas Terbayar
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  Piutang
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 bg-indigo-600 rounded-full" />
                  Total Omset
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyRevenueData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const label =
                        name === 'terbayar'
                          ? 'Kas Terbayar'
                          : name === 'piutang'
                          ? 'Sisa Piutang'
                          : 'Total Omset Sewa';
                      return [formatRupiah(Number(value)), label];
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#0F172A', fontSize: '12px' }}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '11px',
                    }}
                  />
                  <Bar
                    dataKey="terbayar"
                    name="terbayar"
                    stackId="a"
                    fill="#10B981"
                    radius={[0, 0, 0, 0]}
                    barSize={32}
                  />
                  <Bar
                    dataKey="piutang"
                    name="piutang"
                    stackId="a"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalOmset"
                    name="totalOmset"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2 & 3: Category Utilization Rate & Revenue Distribution */}
        {(activeTab === 'all' || activeTab === 'utilization') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left: Bar Chart of Utilization Rate by Category */}
            <div className={`${isOwner ? 'lg:col-span-7' : 'lg:col-span-12'} bg-slate-50/70 p-4 rounded-xl border border-slate-200`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    Tingkat Utilisasi Stok per Kategori (%)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Persentase kapasitas alat yang sedang teralokasi dalam jadwal booking aktif
                  </p>
                </div>
                <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  Ambang Kritis: 80%
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryStats}
                    layout="vertical"
                    margin={{ top: 5, right: 25, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      tickFormatter={(val) => `${val}%`}
                      axisLine={{ stroke: '#CBD5E1' }}
                    />
                    <YAxis
                      dataKey="shortName"
                      type="category"
                      tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => {
                        const payload = item.payload;
                        return [
                          `${val}% (${payload.bookedUnits} dari ${payload.totalStock} Unit Terpakai)`,
                          'Tingkat Utilisasi',
                        ];
                      }}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '11px',
                      }}
                    />
                    <Bar
                      dataKey="utilizationRate"
                      name="Utilisasi"
                      barSize={18}
                      radius={[0, 4, 4, 0]}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.utilizationRate > 80
                              ? '#EF4444' // Red if overbooked/critical
                              : entry.utilizationRate >= 60
                              ? '#4F46E5' // Indigo if healthy high
                              : '#0EA5E9' // Sky if moderate
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200 mt-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                    &lt; 60% Tersedia
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                    60-80% Optimal
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                    &gt; 80% Kritis / Bentrok
                  </span>
                </div>
                <span className="font-medium text-slate-700">Total {equipmentList.length} Model Alat</span>
              </div>
            </div>

            {/* Right: Pie Chart of Revenue Contribution by Category (Only for Owner) */}
            {isOwner && (
              <div className="lg:col-span-5 bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 mb-1">
                    <PieChartIcon className="w-4 h-4 text-indigo-600" />
                    Kontribusi Omset per Kategori Alat
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Proporsi nilai sewa yang dihasilkan masing-masing divisi peralatan
                  </p>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          dataKey="revenue"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
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
                          formatter={(value: any, name: any) => [
                            formatRupiah(Number(value)),
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '11px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Legend List */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200 text-[11px]">
                  {categoryStats.map((cat, i) => (
                    <div key={cat.category} className="flex items-center justify-between pr-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="truncate text-slate-700 font-medium">{cat.shortName}</span>
                      </div>
                      <span className="font-mono text-slate-500 text-[10px]">
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

        {/* TOP ASSETS & STRATEGIC RECOMMENDATIONS */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600 rounded-lg text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {isOwner
                  ? 'Rekomendasi Manajemen Inventaris & Investasi Alat'
                  : 'Protokol Gudang & Pemeliharaan Stok Fisik'}
              </h4>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/80 px-2 py-0.5 rounded self-start sm:self-auto">
              {isOwner ? 'Insight Finansial' : 'Protokol Gudang'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
            {isOwner ? (
              <>
                <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                  <span className="font-semibold text-rose-400 block mb-1">
                    ⚠️ Peringatan Over-Allocation:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    <strong>Sony Alpha A7 III Body</strong> dan <strong>LED Videowall P3.9</strong> mendekati kapasitas &gt;90% pada tanggal 15-17 Oktober. Sistem mendeteksi bentrok jadwal yang perlu disubstitusi atau disewa silang (*sub-rent*).
                  </p>
                </div>

                <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                  <span className="font-semibold text-emerald-400 block mb-1">
                    ✓ Penghasil Omset Tertinggi:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Divisi <strong>Audio & Sound</strong> menyumbang nilai sewa terbesar bulan ini melalui paket Line Array RCF dan Digital Mixer Yamaha CL5 dengan tingkat pengembalian tepat waktu 100%.
                  </p>
                </div>

                <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                  <span className="font-semibold text-indigo-400 block mb-1">
                    💡 Peluang Investasi Alat Baru:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Tingkat utilisasi Lighting Beam 260W selalu penuh pada akhir pekan. Menambah 4 unit tambahan diproyeksikan meningkatkan kapasitas booking hingga +Rp 18.000.000/bulan.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                  <span className="font-semibold text-rose-400 block mb-1">
                    ⚠️ Stok Menipis & Kritis:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Periksa alokasi <strong>Sony Alpha A7 III</strong> dan <strong>LED Videowall</strong>. Stok fisik di rak gudang tersisa sangat sedikit untuk jadwal event aktif.
                  </p>
                </div>

                <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                  <span className="font-semibold text-amber-400 block mb-1">
                    🔍 QC Fisik & Aksesoris:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Lakukan pemeriksaan visual menyeluruh pada unit audio & lighting yang baru kembali: cek grounding kabel power, pin XLR, dan kelengkapan hardcase.
                  </p>
                </div>

                <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                  <span className="font-semibold text-emerald-400 block mb-1">
                    ✓ Kesiapan Rak & Standby:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Pastikan baterai cadangan terisi penuh dan label QR/barcode pada tiap flight case dapat terbaca sebelum unit dimuat ke kendaraan loading.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
