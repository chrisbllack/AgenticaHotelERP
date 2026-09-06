import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';

export default function CheckInPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState('');
  const [idType, setIdType] = useState('passport');
  const [idNumber, setIdNumber] = useState('');
  const [depositPaid, setDepositPaid] = useState(0);

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: async () => {
      const res = await api.get(`/reservations/${reservationId}`);
      return res.data.data;
    },
    enabled: !!reservationId,
  });

  const { data: availableRooms } = useQuery({
    queryKey: ['available-rooms', reservation?.room_type_id],
    queryFn: async () => {
      const res = await api.get('/rooms', { params: { status: 'vacant_clean' } });
      return (res.data.data || []).filter((r: any) => r.room_type_id === reservation?.room_type_id);
    },
    enabled: !!reservation?.room_type_id,
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/reservations/${reservationId}/check-in`, {
        room_id: selectedRoom,
        id_type: idType,
        id_number: idNumber,
        deposit_paid: depositPaid,
      });
      return res.data;
    },
    onSuccess: (data) => {
      alert(`Check-in successful! Folio: ${data.data.folio_number}`);
      navigate('/front-desk');
    },
    onError: (error: any) => {
      alert(`Check-in failed: ${error?.response?.data?.message || error.message}`);
    },
  });

  if (isLoading) return <div className="text-center py-8">Loading reservation...</div>;
  if (!reservation) return <div className="text-center py-8">Reservation not found</div>;

  const isCheckOut = window.location.pathname.includes('check-out');

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/reservations/${reservationId}/check-out`, {
        payment_method: 'cash',
        payment_amount: 0,
      });
      return res.data;
    },
    onSuccess: () => {
      alert('Check-out successful!');
      navigate('/front-desk');
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isCheckOut ? 'Check Out' : 'Check In'} — {reservation.guest_name}
        </h1>
      </div>

      {/* Reservation Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Reservation Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Confirmation</p>
            <p className="font-mono font-bold text-gray-900">{reservation.confirmation_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Room Type</p>
            <p className="font-medium text-gray-900">{reservation.room_type_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Arrival</p>
            <p className="font-medium text-gray-900">{reservation.arrival_date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Departure</p>
            <p className="font-medium text-gray-900">{reservation.departure_date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Nights</p>
            <p className="font-medium text-gray-900">{reservation.nights}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Adults / Children</p>
            <p className="font-medium text-gray-900">{reservation.adults} / {reservation.children}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Estimated</p>
            <p className="font-bold text-blue-600">₦{reservation.total_estimated?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              {reservation.status}
            </span>
          </div>
        </div>
        {reservation.special_requests && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-medium text-yellow-700 mb-1">Special Requests:</p>
            <p className="text-sm text-yellow-800">{reservation.special_requests}</p>
          </div>
        )}
        {reservation.is_vip && (
          <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700 font-medium">⭐ VIP Guest</p>
          </div>
        )}
      </div>

      {!isCheckOut ? (
        /* Check-In Form */
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Room Assignment</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Room *</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select a room...</option>
              {(availableRooms || []).map((room: any) => (
                <option key={room.id} value={room.id}>
                  Room {room.number} — {room.room_type_name}
                </option>
              ))}
            </select>
            {availableRooms && availableRooms.length === 0 && (
              <p className="text-sm text-red-500 mt-1">No available rooms of this type</p>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 pt-4">Guest Verification</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
              <select value={idType} onChange={(e) => setIdType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="drivers_license">Driver's License</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter ID number" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Paid</label>
            <input type="number" value={depositPaid} onChange={(e) => setDepositPaid(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              min="0" step="0.01" />
          </div>

          <button
            onClick={() => checkInMutation.mutate()}
            disabled={!selectedRoom || checkInMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            {checkInMutation.isPending ? 'Processing...' : '🏨 Complete Check-In'}
          </button>
        </div>
      ) : (
        /* Check-Out Form */
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Check Out</h3>
          <p className="text-gray-600">Confirm check-out for {reservation.guest_name}. The room will be marked as vacant and ready for cleaning.</p>
          <button
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            {checkOutMutation.isPending ? 'Processing...' : '🏠 Complete Check-Out'}
          </button>
        </div>
      )}
    </div>
  );
}
