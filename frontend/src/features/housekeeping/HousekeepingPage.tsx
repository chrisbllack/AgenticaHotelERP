import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function HousekeepingPage() {
  const { data: rooms } = useQuery({
    queryKey: ['rooms', 'housekeeping'],
    queryFn: async () => {
      const res = await api.get('/rooms?per_page=200');
      return res.data.data;
    },
  });

  const roomsList: any[] = rooms || [];
  const dirtyRooms = roomsList.filter(r => r.housekeeping_status === 'dirty' || r.status === 'vacant_dirty');
  const cleanRooms = roomsList.filter(r => r.housekeeping_status === 'clean' || r.status === 'vacant_clean');
  const occupiedRooms = roomsList.filter(r => r.status === 'occupied_clean' || r.status === 'occupied_dirty');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Housekeeping</h1>
        <p className="text-gray-500 mt-1">Room cleaning and maintenance status</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-5 border border-red-200">
          <p className="text-sm text-red-600 font-medium">Needs Cleaning</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{dirtyRooms.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Clean & Ready</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{cleanRooms.length}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Occupied</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{occupiedRooms.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Room Cleaning Status</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Room</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Room Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Housekeeping</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roomsList.map((room: any) => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-900">{room.number}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{room.room_type_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{room.status?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    room.housekeeping_status === 'dirty' ? 'bg-red-100 text-red-700' :
                    room.housekeeping_status === 'clean' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {room.housekeeping_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {room.housekeeping_status === 'dirty' && (
                    <button className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 font-medium">
                      Mark Clean
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
