import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Room } from '../../lib/types';

export default function RoomsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['rooms', statusFilter],
    queryFn: async () => {
      const params: any = { per_page: 200 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/rooms', { params });
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.put(`/rooms/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const rooms: Room[] = roomsData?.data || [];

  const statusColors: Record<string, string> = {
    vacant_clean: 'bg-green-100 border-green-300 text-green-800',
    vacant_dirty: 'bg-red-100 border-red-300 text-red-800',
    inspected: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    occupied_clean: 'bg-blue-100 border-blue-300 text-blue-800',
    occupied_dirty: 'bg-orange-100 border-orange-300 text-orange-800',
    reserved: 'bg-purple-100 border-purple-300 text-purple-800',
    out_of_order: 'bg-gray-200 border-gray-400 text-gray-600',
    out_of_service: 'bg-gray-100 border-gray-300 text-gray-500',
    blocked: 'bg-gray-300 border-gray-500 text-gray-700',
    house_use: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    complimentary: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  };

  const statusOptions = [
    'vacant_clean', 'vacant_dirty', 'occupied_clean', 'occupied_dirty',
    'inspected', 'reserved', 'out_of_order', 'blocked', 'house_use', 'complimentary',
  ];

  const statusCounts = rooms.reduce((acc: Record<string, number>, room: Room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-500 mt-1">{rooms.length} rooms total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-2 rounded-lg text-sm ${view === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-2 rounded-lg text-sm ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            !statusFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({rooms.length})
        </button>
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status === statusFilter ? '' : status)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.replace(/_/g, ' ')} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`p-3 rounded-xl border-2 cursor-pointer hover:shadow-lg transition-all ${
                statusColors[room.status] || 'bg-gray-100 border-gray-200'
              }`}
            >
              <p className="text-lg font-bold text-center">{room.number}</p>
              <p className="text-xs text-center opacity-75">{room.room_type_name}</p>
              <div className="mt-2">
                <select
                  value={room.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    statusMutation.mutate({ id: room.id, status: e.target.value });
                  }}
                  className="w-full text-xs bg-white/50 border-0 rounded px-1 py-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Room</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Housekeeping</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{room.number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{room.room_type_name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={room.status}
                      onChange={(e) => statusMutation.mutate({ id: room.id, status: e.target.value })}
                      className={`text-xs rounded-full px-2 py-1 border-0 font-medium ${
                        statusColors[room.status] || 'bg-gray-100'
                      }`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{room.housekeeping_status}</td>
                  <td className="px-4 py-3">
                    <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading && <div className="text-center text-gray-400">Loading rooms...</div>}
    </div>
  );
}
