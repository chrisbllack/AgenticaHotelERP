import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';

interface Room {
  id: string; number: string; room_type: string; type_code: string;
  floor: number; room_status: string; hk_status: string; is_smoking: boolean;
}

interface Reservation {
  id: string; guest_id: string; guest_name: string; room_number: string; room_type: string;
  arrival_date: string; departure_date: string; status: string;
  is_vip: boolean; adults: number; children: number; source: string;
  special_requests: string; rate_plan_id: string; total_estimate: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  confirmed:    { bg: '#3B82F6', text: '#fff', label: 'Confirmed' },
  checked_in:   { bg: '#10B981', text: '#fff', label: 'Checked In' },
  in_house:     { bg: '#10B981', text: '#fff', label: 'In House' },
  tentative:    { bg: '#FBBF24', text: '#92400E', label: 'Tentative' },
  cancelled:    { bg: '#EF4444', text: '#fff', label: 'Cancelled' },
  no_show:      { bg: '#F87171', text: '#fff', label: 'No Show' },
  checked_out:  { bg: '#9CA3AF', text: '#fff', label: 'Checked Out' },
};

const HK_STATUS_COLORS: Record<string, string> = {
  clean: 'bg-green-100 text-green-700',
  dirty: 'bg-yellow-100 text-yellow-700',
};

const ROOM_STATUS_ICONS: Record<string, string> = {
  vacant_clean: '✅', vacant_dirty: '🧹', occupied_clean: '🟢',
  occupied_dirty: '🟡', out_of_order: '🔴', reserved: '📅',
};

export default function ReservationCalendar() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [baseDate, setBaseDate] = useState(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [dragRes, setDragRes] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ res: Reservation; x: number; y: number } | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const getDates = useCallback(() => {
    const dates: Date[] = [];
    if (view === 'day') {
      dates.push(new Date(baseDate));
    } else if (view === 'week') {
      const start = new Date(baseDate);
      start.setDate(start.getDate() - start.getDay() + 1); // Monday
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        dates.push(d);
      }
    } else {
      const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        dates.push(d);
      }
    }
    return dates;
  }, [view, baseDate]);

  const dates = getDates();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const isToday = (d: Date) => formatDate(d) === formatDate(new Date());

  useEffect(() => {
    setLoading(true);
    const start = formatDate(dates[0]);
    const end = formatDate(dates[dates.length - 1]);
    api.get(`/front-desk/chart?start=${start}&end=${end}`).then(r => {
      const d = r.data.data;
      setRooms(d.rooms || []);
      setReservations(d.reservations || []);
      setSummary(d.summary || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dates[0]?.toISOString(), dates[dates.length - 1]?.toISOString()]);

  const navDays = view === 'day' ? 1 : view === 'week' ? 7 : 30;

  // Group rooms by type
  const roomGroups = rooms.reduce<Record<string, Room[]>>((acc, room) => {
    if (!acc[room.room_type]) acc[room.room_type] = [];
    acc[room.room_type].push(room);
    return acc;
  }, {});

  const findReservation = (roomNumber: string, date: Date): Reservation | undefined => {
    const dateStr = formatDate(date);
    return reservations.find(r =>
      r.room_number === roomNumber &&
      r.arrival_date <= dateStr && r.departure_date > dateStr &&
      r.status !== 'cancelled' && r.status !== 'no_show'
    );
  };

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, resId: string) => {
    setDragRes(resId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, roomNumber: string, date: Date) => {
    e.preventDefault();
    if (!dragRes) return;

    const res = reservations.find(r => r.id === dragRes);
    if (!res) return;

    const newRoom = rooms.find(r => r.number === roomNumber);
    if (!newRoom) return;

    try {
      await api.post('/front-desk/move-reservation', {
        reservation_id: dragRes,
        new_room_id: newRoom.id,
      });
      // Optimistic update
      setReservations(prev => prev.map(r =>
        r.id === dragRes ? { ...r, room_number: roomNumber, room_type: newRoom.room_type } : r
      ));
    } catch {}
    setDragRes(null);
  };

  const handleDragEnd = () => setDragRes(null);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservation Chart</h1>
          <p className="text-gray-500 text-sm mt-1">Rooms × Dates — drag reservations to reassign rooms</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  view === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
          {/* Legend Toggle */}
          <button onClick={() => setShowLegend(!showLegend)}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border rounded-lg">
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-3 text-xs">
          <span className="bg-gray-100 px-2 py-1 rounded">
            <span className="font-semibold">{summary.total_rooms || 0}</span> Total
          </span>
          <span className="bg-green-50 px-2 py-1 rounded text-green-700">
            <span className="font-semibold">{summary.available || 0}</span> Available
          </span>
          <span className="bg-blue-50 px-2 py-1 rounded text-blue-700">
            <span className="font-semibold">{summary.occupied || 0}</span> Occupied
          </span>
          <span className="bg-yellow-50 px-2 py-1 rounded text-yellow-700">
            <span className="font-semibold">{summary.dirty || 0}</span> Dirty
          </span>
          <span className="bg-red-50 px-2 py-1 rounded text-red-700">
            <span className="font-semibold">{summary.out_of_order || 0}</span> OOO
          </span>
          <span className="bg-purple-50 px-2 py-1 rounded text-purple-700">
            <span className="font-semibold">{summary.reserved || 0}</span> Reserved
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button onClick={() => setBaseDate(d => { const n = new Date(d); n.setDate(n.getDate() - navDays); return n; })}
          className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors">← Prev</button>
        <button onClick={() => setBaseDate(new Date())}
          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">Today</button>
        <button onClick={() => setBaseDate(d => { const n = new Date(d); n.setDate(n.getDate() + navDays); return n; })}
          className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors">Next →</button>
        <span className="text-sm text-gray-600 font-medium ml-2">
          {dates.length === 1
            ? dates[0].toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            : `${dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${dates[dates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          }
        </span>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
          {Object.entries(STATUS_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: val.bg }} />
              <span className="text-xs text-gray-600">{val.label}</span>
            </div>
          ))}
          <div className="w-px bg-gray-300 mx-1" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs">⭐</span>
            <span className="text-xs text-gray-600">VIP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🚬</span>
            <span className="text-xs text-gray-600">Smoking</span>
          </div>
        </div>
      )}

      {/* Chart Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">Loading chart data...</div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No rooms configured</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-auto max-h-[calc(100vh-300px)]" ref={gridRef}>
          {Object.entries(roomGroups).map(([typeName, typeRooms]) => (
            <div key={typeName}>
              {/* Room Type Header */}
              <div className="sticky top-0 z-20 bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">{typeName}</span>
                  <span className="text-slate-400 text-xs">({typeRooms.length} rooms)</span>
                </div>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-slate-50 border-b border-r border-gray-200 px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 z-10 w-36">
                      Room
                    </th>
                    {dates.map((d, i) => (
                      <th key={i} className={`border-b border-r border-gray-200 px-1 py-1.5 text-center min-w-[${view === 'day' ? '120' : view === 'week' ? '100' : '36'}px] ${
                        isToday(d) ? 'bg-blue-50' : 'bg-slate-50'
                      }`}>
                        <div className={`text-[10px] font-semibold ${isToday(d) ? 'text-blue-600' : 'text-gray-600'}`}>
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-xs ${isToday(d) ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {typeRooms.map(room => (
                    <tr key={room.id} className="group hover:bg-gray-50/50">
                      <td className="sticky left-0 bg-white group-hover:bg-gray-50 border-b border-r border-gray-200 px-2 py-1 z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">{ROOM_STATUS_ICONS[room.room_status] || '⬜'}</span>
                          <div>
                            <div className="font-medium text-xs text-gray-900">{room.number}</div>
                            <div className="flex items-center gap-1">
                              <span className={`text-[9px] px-1 rounded ${HK_STATUS_COLORS[room.hk_status] || 'bg-gray-100 text-gray-500'}`}>
                                {room.hk_status}
                              </span>
                              {room.is_smoking && <span className="text-[9px]">🚬</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      {dates.map((d, di) => {
                        const res = findReservation(room.number, d);
                        const isFirstDay = res && formatDate(new Date(res.arrival_date)) === formatDate(d);
                        const isLastDay = res && formatDate(new Date(res.departure_date)) === formatDate(d);
                        const sc = res ? STATUS_COLORS[res.status] || STATUS_COLORS.confirmed : null;

                        return (
                          <td key={di}
                            className={`border-b border-r border-gray-200 px-0.5 py-0.5 ${
                              isToday(d) ? 'bg-blue-50/30' : ''
                            } ${dragRes && !res ? 'hover:bg-green-50' : ''}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, room.number, d)}
                          >
                            {res ? (
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, res.id)}
                                onDragEnd={handleDragEnd}
                                onMouseEnter={(e) => setTooltip({ res, x: e.clientX, y: e.clientY })}
                                onMouseLeave={() => setTooltip(null)}
                                className={`
                                  h-7 rounded-sm cursor-grab active:cursor-grabbing text-white text-[10px]
                                  flex items-center px-1.5 gap-1 select-none transition-opacity
                                  ${dragRes === res.id ? 'opacity-50' : 'hover:opacity-90 hover:shadow-md'}
                                  ${isFirstDay ? 'rounded-l-md' : 'rounded-none'}
                                  ${isLastDay ? 'rounded-r-md' : 'rounded-none'}
                                  ${!isFirstDay && !isLastDay ? 'rounded-none' : ''}
                                `}
                                style={{
                                  backgroundColor: sc?.bg || '#6B7280',
                                  color: sc?.text || '#fff',
                                  marginLeft: isFirstDay ? '0' : '-1px',
                                  width: isFirstDay ? 'calc(100% + 1px)' : 'calc(100% + 2px)',
                                }}
                              >
                                {isFirstDay && (
                                  <span className="truncate font-medium">
                                    {res.guest_name}
                                  </span>
                                )}
                                {!isFirstDay && !isLastDay && (
                                  <span className="w-full text-center opacity-70">•</span>
                                )}
                                {isLastDay && (
                                  <span className="text-[8px] ml-auto opacity-70">CO</span>
                                )}
                                {res.is_vip && isFirstDay && <span>⭐</span>}
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl p-3 text-xs max-w-xs pointer-events-none"
          style={{ left: Math.min(tooltip.x + 10, window.innerWidth - 300), top: tooltip.y - 10 }}>
          <div className="font-semibold text-sm mb-1">{tooltip.res.guest_name}</div>
          <div className="space-y-0.5 text-gray-300">
            <p>Room: {tooltip.res.room_number} ({tooltip.res.room_type})</p>
            <p>Arrival: {new Date(tooltip.res.arrival_date).toLocaleDateString()}</p>
            <p>Departure: {new Date(tooltip.res.departure_date).toLocaleDateString()}</p>
            <p>Status: <span style={{ color: STATUS_COLORS[tooltip.res.status]?.bg || '#fff' }}>
              {STATUS_COLORS[tooltip.res.status]?.label || tooltip.res.status}</span></p>
            {tooltip.res.is_vip && <p className="text-amber-400">⭐ VIP Guest</p>}
            {tooltip.res.source && <p>Source: {tooltip.res.source}</p>}
            {tooltip.res.total_estimate > 0 && <p>Est: ₦{tooltip.res.total_estimate.toLocaleString()}</p>}
            {tooltip.res.special_requests && <p className="text-amber-300 italic mt-1">"{tooltip.res.special_requests}"</p>}
          </div>
        </div>
      )}
    </div>
  );
}
