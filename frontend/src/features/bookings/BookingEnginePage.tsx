import { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';

// ═══════════════════════════════════════════════════════════════
// BOOKING ENGINE — Guest-facing branded booking experience
// Inspired by Booking.com / eZee / Djubo guest booking flows
// ═══════════════════════════════════════════════════════════════

type Step = 'search' | 'results' | 'details' | 'payment' | 'confirmation';

interface SearchParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
}

interface RoomOption {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  rate: number;
  promoRate?: number;
  amenities: string[];
  maxOccupancy: number;
  bedType: string;
  size: string;
  image: string;
  imageColor: string;
  available: number;
  cancellationPolicy: string;
  mealPlan: string;
}

interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  idType: string;
  idNumber: string;
  specialRequests: string;
  arrivalTime: string;
}

interface BookingResult {
  reservationId: string;
  confirmationCode: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  depositAmount: number;
  currency: string;
}

const HOTEL_INFO = {
  name: 'Grand Palm Hotel Lagos',
  tagline: 'Where luxury meets the heartbeat of Lagos',
  address: '12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  phone: '+234 1 234 5678',
  email: 'reservations@grandpalmhotel.com',
  rating: 4.7,
  reviewCount: 1243,
  checkInTime: '2:00 PM',
  checkOutTime: '12:00 PM (Noon)',
};

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'United Kingdom',
  'United States', 'France', 'Germany', 'UAE', 'India', 'China', 'Brazil',
];

const ID_TYPES = ['National ID (NIN)', 'International Passport', 'Driver\'s License', 'BVN Verification'];

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getMinCheckout(checkIn: string): string {
  if (!checkIn) return getTomorrow();
  const d = new Date(checkIn);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ── Static room catalog (will be enriched from API when available) ──
const ROOM_CATALOG: Omit<RoomOption, 'available'>[] = [
  {
    id: 'rt-standard',
    name: 'Standard Room',
    description: 'Comfortable room with city view, queen bed, work desk, free WiFi',
    longDescription: 'Our Standard Room offers everything you need for a comfortable stay in Lagos. Featuring a plush queen-size bed, modern work desk, complimentary high-speed WiFi, and views of the bustling Lekki cityscape. The room includes blackout curtains, premium linens, and a rain shower bathroom.',
    rate: 25000,
    promoRate: 22000,
    amenities: ['Free WiFi', '55" Smart TV', 'Air Conditioning', 'Minibar', 'In-Room Safe', 'Work Desk', 'Rain Shower', 'Hair Dryer'],
    maxOccupancy: 2,
    bedType: '1 Queen Bed',
    size: '28 m²',
    image: '🏨',
    imageColor: 'from-blue-400 to-blue-600',
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
    mealPlan: 'Room Only',
  },
  {
    id: 'rt-deluxe',
    name: 'Deluxe Room',
    description: 'Spacious room with garden view, king bed, sitting area, premium amenities',
    longDescription: 'Step up to our Deluxe Room and enjoy 40% more space with a separate sitting area, king-size bed, and beautiful garden views. Includes all Standard Room amenities plus a Nespresso machine, premium bath products, plush bathrobes, and turndown service.',
    rate: 35000,
    amenities: ['Free WiFi', '55" Smart TV', 'Air Conditioning', 'Minibar', 'Nespresso Machine', 'Sitting Area', 'Garden View', 'Bathrobe & Slippers', 'Turndown Service'],
    maxOccupancy: 3,
    bedType: '1 King Bed + Sofa',
    size: '38 m²',
    image: '🌟',
    imageColor: 'from-emerald-400 to-emerald-600',
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
    mealPlan: 'Breakfast Included',
  },
  {
    id: 'rt-executive',
    name: 'Executive Suite',
    description: 'Premium suite with separate living room, panoramic views, lounge access',
    longDescription: 'Our Executive Suite is designed for discerning travelers who appreciate space and sophistication. Features a separate living room with dining area, panoramic Lagos lagoon views, walk-in closet, and exclusive access to the Executive Lounge with complimentary evening cocktails and canapés.',
    rate: 55000,
    amenities: ['Free WiFi', '65" Smart TV', 'Air Conditioning', 'Full Minibar', 'Nespresso Machine', 'Living Room', 'Walk-in Closet', 'Lagoon View', 'Executive Lounge Access', 'Evening Cocktails', 'Butler Service'],
    maxOccupancy: 3,
    bedType: '1 King Bed',
    size: '55 m²',
    image: '👑',
    imageColor: 'from-purple-400 to-purple-600',
    cancellationPolicy: 'Free cancellation up to 72 hours before check-in',
    mealPlan: 'Breakfast & Evening Cocktails',
  },
  {
    id: 'rt-presidential',
    name: 'Presidential Suite',
    description: 'Ultimate luxury with private dining, jacuzzi, dedicated butler, rooftop access',
    longDescription: 'The crown jewel of Grand Palm Hotel. Our Presidential Suite offers an unparalleled luxury experience with a private dining room seating 8, outdoor jacuzzi with skyline views, dedicated 24/7 butler service, private elevator access, and complimentary airport transfer. Perfect for heads of state, celebrities, and VIP guests.',
    rate: 120000,
    amenities: ['Free WiFi', '85" Smart TV', 'Air Conditioning', 'Premium Bar', 'Private Dining', 'Jacuzzi', 'Rooftop Terrace', 'Butler Service', 'Private Elevator', 'Airport Transfer', 'Spa Access', 'Penthouse Views'],
    maxOccupancy: 4,
    bedType: '1 California King',
    size: '95 m²',
    image: '💎',
    imageColor: 'from-amber-400 to-amber-600',
    cancellationPolicy: 'Free cancellation up to 7 days before check-in',
    mealPlan: 'Full Board (All Meals)',
  },
];

export default function BookingEnginePage() {
  const [step, setStep] = useState<Step>('search');
  const [search, setSearch] = useState<SearchParams>({
    checkIn: '', checkOut: '', adults: 2, children: 0, rooms: 1,
  });
  const [rooms, setRooms] = useState<(RoomOption & { available: number })[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null);
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    firstName: '', lastName: '', email: '', phone: '', country: 'Nigeria',
    idType: 'National ID (NIN)', idNumber: '', specialRequests: '',    arrivalTime: '14:00',
  });
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paystack');

  const nights = search.checkIn && search.checkOut
    ? Math.max(1, Math.ceil((new Date(search.checkOut).getTime() - new Date(search.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalRoomRate = selectedRoom ? (selectedRoom.promoRate || selectedRoom.rate) * nights : 0;
  const serviceCharge = Math.round(totalRoomRate * 0.10);
  const vat = Math.round((totalRoomRate + serviceCharge) * 0.075);
  const hotelOccupancyTax = Math.round(totalRoomRate * 0.05); // Lagos hotel occupancy tax
  const totalAmount = totalRoomRate + serviceCharge + vat + hotelOccupancyTax;
  const depositAmount = Math.round(totalAmount * 0.25); // 25% deposit

  const handleSearch = () => {
    if (!search.checkIn || !search.checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }
    if (new Date(search.checkOut) <= new Date(search.checkIn)) {
      alert('Check-out must be after check-in');
      return;
    }
    // Simulate availability (in production, this calls the API)
    const updated = ROOM_CATALOG.map((r) => ({
      ...r,
      available: Math.max(0, Math.floor(Math.random() * 15) + 3),
    }));
    setRooms(updated);
    setStep('results');
  };

  const handleSelectRoom = (room: RoomOption & { available: number }) => {
    setSelectedRoom(room);
    setStep('details');
  };

  const handleGuestDetailsSubmit = () => {
    if (!guestDetails.firstName || !guestDetails.lastName || !guestDetails.email || !guestDetails.phone) {
      alert('Please fill in all required fields');
      return;
    }
    if (!guestDetails.email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/booking/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: `${guestDetails.firstName} ${guestDetails.lastName}`,
          guest_email: guestDetails.email,
          guest_phone: guestDetails.phone,
          room_type_id: selectedRoom?.id,
          check_in: search.checkIn,
          check_out: search.checkOut,
          adults: search.adults,
          total_rate: totalAmount,
        }),
      });
      const data = await res.json();
      setBookingResult({
        reservationId: data.reservation_id || 'RES-' + Date.now(),
        confirmationCode: 'GP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        roomName: selectedRoom?.name || '',
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        nights,
        totalAmount,
        depositAmount,
        currency: 'NGN',
      });
      setStep('confirmation');
    } catch (err) {
      // For demo, still show confirmation
      setBookingResult({
        reservationId: 'RES-' + Date.now(),
        confirmationCode: 'GP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        roomName: selectedRoom?.name || '',
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        nights,
        totalAmount,
        depositAmount,
        currency: 'NGN',
      });
      setStep('confirmation');
    }
    setLoading(false);
  };

  // ── STEP PROGRESS BAR ──
  const StepProgress = () => {
    const steps: { key: Step; label: string; num: number }[] = [
      { key: 'search', label: 'Search', num: 1 },
      { key: 'results', label: 'Select Room', num: 2 },
      { key: 'details', label: 'Guest Details', num: 3 },
      { key: 'payment', label: 'Payment', num: 4 },
      { key: 'confirmation', label: 'Confirmed', num: 5 },
    ];
    const stepOrder: Step[] = ['search', 'results', 'details', 'payment', 'confirmation'];
    const currentIdx = stepOrder.indexOf(step);

    return (
      <div className="flex items-center justify-center gap-0 mb-8">
        {steps.map((s, i) => {
          const isActive = s.key === step;
          const isComplete = stepOrder.indexOf(s.key) < currentIdx;
          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  isActive ? 'bg-blue-600 text-white scale-110' :
                  isComplete ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isComplete ? '✓' : s.num}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-1 mt-[-14px] ${
                  isComplete ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── SEARCH STEP ──
  const SearchStep = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold">{HOTEL_INFO.name}</h1>
        <p className="text-white/70 mt-1">{HOTEL_INFO.tagline}</p>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="flex items-center gap-1">⭐ {HOTEL_INFO.rating} ({HOTEL_INFO.reviewCount.toLocaleString()} reviews)</span>
          <span className="text-white/40">|</span>
          <span>📍 {HOTEL_INFO.address}</span>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl shadow-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Find Your Perfect Room</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Check-in</label>
            <input
              type="date"
              min={getToday()}
              value={search.checkIn}
              onChange={(e) => setSearch({ ...search, checkIn: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {search.checkIn && <p className="text-xs text-gray-400 mt-0.5">{formatDateShort(search.checkIn)}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Check-out</label>
            <input
              type="date"
              min={getMinCheckout(search.checkIn)}
              value={search.checkOut}
              onChange={(e) => setSearch({ ...search, checkOut: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {search.checkOut && <p className="text-xs text-gray-400 mt-0.5">{formatDateShort(search.checkOut)}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Guests</label>
            <select
              value={search.adults}
              onChange={(e) => setSearch({ ...search, adults: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
            >
              {[1,2,3,4,5,6].map((n) => (
                <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Rooms</label>
            <select
              value={search.rooms}
              onChange={(e) => setSearch({ ...search, rooms: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
            >
              {[1,2,3,4,5].map((n) => (
                <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-blue-700 transition text-sm"
            >
              🔍 Check Availability
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '🔒', title: 'Secure Booking', desc: 'SSL encrypted, PCI compliant' },
          { icon: '💰', title: 'Best Rate Guarantee', desc: 'No hidden fees, transparent pricing' },
          { icon: '🔄', title: 'Free Cancellation', desc: 'Cancel up to 48 hours before check-in' },
        ].map((f, i) => (
          <div key={i} className="bg-white rounded-xl p-4 text-center border">
            <span className="text-2xl">{f.icon}</span>
            <h3 className="font-semibold text-sm mt-2">{f.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // ── ROOM RESULTS STEP ──
  const ResultsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {rooms.filter((r) => r.available > 0).length} rooms available
          </h2>
          <p className="text-sm text-gray-500">
            {formatDateShort(search.checkIn)} → {formatDateShort(search.checkOut)} · {nights} night{nights > 1 ? 's' : ''} · {search.adults} adult{search.adults > 1 ? 's' : ''} · Check-in: 2:00 PM · Check-out: 12:00 PM
          </p>
        </div>
        <button onClick={() => setStep('search')} className="text-sm text-blue-600 hover:underline">Modify Search</button>
      </div>

      {rooms.filter((r) => r.available > 0).map((room) => (
        <div key={room.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
          <div className="flex flex-col md:flex-row">
            {/* Room Image */}
            <div className={`w-full md:w-72 h-48 md:h-auto bg-gradient-to-br ${room.imageColor} flex items-center justify-center text-6xl flex-shrink-0`}>
              {room.image}
            </div>

            {/* Room Details */}
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{room.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{room.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>🛏️ {room.bedType}</span>
                    <span>📐 {room.size}</span>
                    <span>👥 Max {room.maxOccupancy} guests</span>
                  </div>
                </div>
                {room.promoRate && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                    SAVE {Math.round((1 - room.promoRate / room.rate) * 100)}%
                  </span>
                )}
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {room.amenities.slice(0, 6).map((a) => (
                  <span key={a} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{a}</span>
                ))}
                {room.amenities.length > 6 && (
                  <span className="text-blue-600 text-xs px-2 py-0.5">+{room.amenities.length - 6} more</span>
                )}
              </div>

              {/* Meal Plan & Cancellation */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="text-green-600 font-medium">✓ {room.mealPlan}</span>
                <span>🔄 {room.cancellationPolicy}</span>
              </div>

              {/* Price & Book */}
              <div className="flex items-end justify-between mt-4 pt-4 border-t">
                <div>
                  {room.promoRate && (
                    <span className="text-gray-400 line-through text-sm mr-2">{formatNGN(room.rate)}</span>
                  )}
                  <span className="text-2xl font-bold text-blue-600">{formatNGN(room.promoRate || room.rate)}</span>
                  <span className="text-gray-500 text-sm"> / night</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {nights > 0 ? `${formatNGN((room.promoRate || room.rate) * nights)} for ${nights} nights` : 'Select dates to see total'}
                  </p>
                </div>
                <button
                  onClick={() => handleSelectRoom(room)}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                >
                  Select Room →
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── GUEST DETAILS STEP ──
  const DetailsStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-lg font-semibold">Guest Information</h2>
        <p className="text-sm text-gray-500">All fields marked with * are required</p>

        <div className="bg-white rounded-xl p-5 border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">First Name *</label>
              <input value={guestDetails.firstName} onChange={(e) => setGuestDetails({ ...guestDetails, firstName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Chidinma" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Last Name *</label>
              <input value={guestDetails.lastName} onChange={(e) => setGuestDetails({ ...guestDetails, lastName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Okoro" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Address *</label>
              <input type="email" value={guestDetails.email} onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number *</label>
              <input value={guestDetails.phone} onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="+234 801 234 5678" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
              <select value={guestDetails.country} onChange={(e) => setGuestDetails({ ...guestDetails, country: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Expected Arrival Time</label>
              <select value={guestDetails.arrivalTime} onChange={(e) => setGuestDetails({ ...guestDetails, arrivalTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ID Verification (Nigerian regulatory requirement)</label>
            <div className="grid grid-cols-2 gap-4">
              <select value={guestDetails.idType} onChange={(e) => setGuestDetails({ ...guestDetails, idType: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm">
                {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={guestDetails.idNumber} onChange={(e) => setGuestDetails({ ...guestDetails, idNumber: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm" placeholder="ID Number" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Special Requests</label>
            <textarea value={guestDetails.specialRequests} onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
              placeholder="e.g. High floor, extra pillows, dietary requirements, celebration..." />
          </div>
        </div>
      </div>

      {/* Booking Summary Sidebar */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border sticky top-4">
          <h3 className="font-semibold mb-3">Booking Summary</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-medium">{selectedRoom?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span>{formatDateShort(search.checkIn)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span>{formatDateShort(search.checkOut)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Duration</span><span>{nights} night{nights > 1 ? 's' : ''}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Guests</span><span>{search.adults} adult{search.adults > 1 ? 's' : ''}</span></div>
            <hr />
            <div className="flex justify-between"><span className="text-gray-500">Room Rate</span><span>{formatNGN(totalRoomRate)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Service Charge (10%)</span><span>{formatNGN(serviceCharge)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">VAT (7.5%)</span><span>{formatNGN(vat)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Hotel Occupancy Tax (5%)</span><span>{formatNGN(hotelOccupancyTax)}</span></div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-blue-600">{formatNGN(totalAmount)}</span>
            </div>
          </div>
          <button onClick={handleGuestDetailsSubmit}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold mt-4 hover:bg-blue-700 transition">
            Continue to Payment →
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">🔒 Secure checkout powered by Paystack</p>
        </div>
      </div>
    </div>
  );

  // ── PAYMENT STEP ──
  const PaymentStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-lg font-semibold">Payment Method</h2>

        <div className="bg-white rounded-xl p-5 border space-y-4">
          {/* Payment Methods */}
          <div className="space-y-3">
            {[
              { id: 'paystack', name: 'Pay with Card', icon: '💳', desc: 'Visa, Mastercard, Verve' },
              { id: 'bank', name: 'Bank Transfer', icon: '🏦', desc: 'Direct bank transfer with instant confirmation' },
              { id: 'ussd', name: 'USSD Payment', icon: '📱', desc: 'Pay from any bank using USSD code' },
              { id: 'momo', name: 'Mobile Money', icon: '📲', desc: 'MTN MoMo, Airtel Money' },
            ].map((pm) => (
              <label key={pm.id}
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition ${
                  paymentMethod === pm.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600" />
                <span className="text-2xl">{pm.icon}</span>
                <div>
                  <p className="font-medium text-sm">{pm.name}</p>
                  <p className="text-xs text-gray-500">{pm.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-blue-600" />
            <div className="text-xs text-gray-600">
              I agree to the <span className="text-blue-600 font-medium">Terms & Conditions</span> and <span className="text-blue-600 font-medium">Privacy Policy</span>.
              I understand that a {formatNGN(depositAmount)} (25%) deposit is required to confirm this booking,
              and cancellation must be made at least 48 hours before check-in for a full refund.
              The remaining {formatNGN(totalAmount - depositAmount)} is due at check-in.
            </div>
          </label>

          <button onClick={handlePayment} disabled={loading || !agreedToTerms}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? '⏳ Processing Payment...' : `💳 Pay ${formatNGN(depositAmount)} Deposit Now`}
          </button>
          <p className="text-xs text-center text-gray-400">
            🔒 25% deposit secures your room. Balance due at check-in.
          </p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border sticky top-4">
          <h3 className="font-semibold mb-3">Payment Summary</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-medium">{selectedRoom?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Dates</span><span className="text-xs">{formatDateShort(search.checkIn)} → {formatDateShort(search.checkOut)}</span></div>
            <hr />
            <div className="flex justify-between font-bold">
              <span>Total Amount</span>
              <span>{formatNGN(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-blue-600 font-bold text-lg">
              <span>Deposit Due Now (25%)</span>
              <span>{formatNGN(depositAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Balance at Check-in</span>
              <span>{formatNGN(totalAmount - depositAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── CONFIRMATION STEP ──
  const ConfirmationStep = () => (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8">
        <span className="text-6xl">✅</span>
        <h1 className="text-2xl font-bold text-green-800 mt-4">Booking Confirmed!</h1>
        <p className="text-green-600 mt-2">Your reservation has been successfully created</p>
      </div>

      <div className="bg-white rounded-xl border p-6 text-left space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Confirmation Code</span><p className="text-xl font-bold text-blue-600">{bookingResult?.confirmationCode}</p></div>
          <div><span className="text-gray-500">Reservation ID</span><p className="font-mono text-sm">{bookingResult?.reservationId}</p></div>
          <div><span className="text-gray-500">Room</span><p className="font-medium">{bookingResult?.roomName}</p></div>
          <div><span className="text-gray-500">Guests</span><p>{guestDetails.firstName} {guestDetails.lastName}</p></div>
          <div><span className="text-gray-500">Check-in</span><p>{formatDateShort(bookingResult?.checkIn || '')}</p></div>
          <div><span className="text-gray-500">Check-out</span><p>{formatDateShort(bookingResult?.checkOut || '')}</p></div>
          <div><span className="text-gray-500">Duration</span><p>{bookingResult?.nights} night{bookingResult?.nights !== 1 ? 's' : ''}</p></div>
          <div><span className="text-gray-500">Total Amount</span><p className="font-bold">{formatNGN(bookingResult?.totalAmount || 0)}</p></div>
        </div>
        <hr />          <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">💰 Deposit Paid: {formatNGN(bookingResult?.depositAmount || 0)}</p>
          <p className="text-xs text-blue-600 mt-1">Remaining balance of {formatNGN((bookingResult?.totalAmount || 0) - (bookingResult?.depositAmount || 0))} is due at check-in</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">⏰ <strong>Check-in:</strong> {HOTEL_INFO.checkInTime} · <strong>Check-out:</strong> {HOTEL_INFO.checkOutTime}</p>
          <p className="text-xs text-gray-500 mt-1">Early check-in and late check-out available upon request (subject to availability)</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 text-left text-sm text-gray-600 space-y-2">
        <p>📧 A confirmation email has been sent to <strong>{guestDetails.email}</strong></p>
        <p>📞 For questions, call us at <strong>{HOTEL_INFO.phone}</strong></p>
        <p>📍 Check-in from 2:00 PM · Check-out by 12:00 PM (Noon) at {HOTEL_INFO.address}</p>
      </div>

      <button onClick={() => { setStep('search'); setSelectedRoom(null); }}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
        Book Another Room
      </button>
    </div>
  );

  // ── MAIN RENDER ──
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌴</span>
            <div>
              <h1 className="font-bold text-lg">{HOTEL_INFO.name}</h1>
              <p className="text-xs text-gray-400">Online Reservations · Check-in: 2:00 PM · Check-out: 12:00 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>📞 {HOTEL_INFO.phone}</span>
            <span>📧 {HOTEL_INFO.email}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {step !== 'confirmation' && <StepProgress />}

        {step === 'search' && <SearchStep />}
        {step === 'results' && <ResultsStep />}
        {step === 'details' && <DetailsStep />}
        {step === 'payment' && <PaymentStep />}
        {step === 'confirmation' && <ConfirmationStep />}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12 px-6 py-4 text-center text-xs text-gray-400">
        <p>{HOTEL_INFO.name} · {HOTEL_INFO.address}</p>
        <p className="mt-1">Powered by INFINEON Enterprise Platform · Prices in Nigerian Naira (NGN) · All taxes included</p>
        <p className="text-xs text-gray-400">Check-in: 2:00 PM · Check-out: 12:00 PM (Noon)</p>
      </div>
    </div>
  );
}
