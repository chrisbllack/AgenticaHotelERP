import { useState } from 'react';

export default function GuestPortalPage() {
  const [activeTab, setActiveTab] = useState<'checkin' | 'folio' | 'services' | 'feedback'>('checkin');
  const [checkinStep, setCheckinStep] = useState(0);

  const folioCharges = [
    { date: 'Sep 3', desc: 'Room 301 — Deluxe (Night 1)', debit: 45000, credit: 0, category: 'room' },
    { date: 'Sep 3', desc: 'VAT (5%)', debit: 2250, credit: 0, category: 'tax' },
    { date: 'Sep 3', desc: 'Service Charge (10%)', debit: 4500, credit: 0, category: 'service' },
    { date: 'Sep 3', desc: 'Restaurant — Lunch', debit: 8500, credit: 0, category: 'restaurant' },
    { date: 'Sep 4', desc: 'Room 301 — Deluxe (Night 2)', debit: 45000, credit: 0, category: 'room' },
    { date: 'Sep 4', desc: 'Minibar', debit: 3200, credit: 0, category: 'minibar' },
    { date: 'Sep 4', desc: 'Deposit Payment', debit: 0, credit: 50000, category: 'payment' },
  ];

  const totalDebit = folioCharges.reduce((sum, c) => sum + c.debit, 0);
  const totalCredit = folioCharges.reduce((sum, c) => sum + c.credit, 0);
  const balance = totalDebit - totalCredit;

  const services = [
    { icon: '🍽️', name: 'Room Service', desc: 'Order food & beverages to your room', category: 'dining' },
    { icon: '🧖', name: 'Spa Booking', desc: 'Book massage & wellness treatments', category: 'wellness' },
    { icon: '🧺', name: 'Laundry', desc: 'Request laundry & dry cleaning', category: 'housekeeping' },
    { icon: '🚗', name: 'Airport Transfer', desc: 'Book airport pickup/dropoff', category: 'transport' },
    { icon: '🔧', name: 'Maintenance', desc: 'Report an issue in your room', category: 'maintenance' },
    { icon: '🛎️', name: 'Concierge', desc: 'Restaurant reservations, tours, events', category: 'concierge' },
    { icon: '📰', name: 'Extra Towels', desc: 'Request additional towels', category: 'housekeeping' },
    { icon: '⏰', name: 'Wake-up Call', desc: 'Schedule a wake-up call', category: 'service' },
    { icon: '🖨️', name: 'Late Checkout', desc: 'Request late checkout (fees may apply)', category: 'service' },
    { icon: '🔑', name: 'Key Management', desc: 'Manage digital room key', category: 'access' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guest Self-Service Portal</h1>
          <p className="text-sm text-gray-500">Digital check-in, folio view, service requests — guest-facing kiosk/link</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Preview as:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Guest Kiosk Mode</span>
        </div>
      </div>

      {/* Guest Info Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Welcome back</p>
            <p className="text-2xl font-bold">Amina Hassan</p>
            <p className="text-sm opacity-80 mt-1">Room 301 — Deluxe | Sep 3–6, 2026 (3 nights)</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Outstanding Balance</p>
            <p className="text-3xl font-bold">₦{balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'checkin' as const, label: 'Digital Check-in', icon: '📱' },
          { key: 'folio' as const, label: 'My Folio', icon: '📄' },
          { key: 'services' as const, label: 'Services & Requests', icon: '🛎️' },
          { key: 'feedback' as const, label: 'Feedback', icon: '⭐' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Digital Check-in */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Digital Check-in Process</h3>
          <div className="flex items-center gap-4 mb-8">
            {['Scan ID', 'Verify Details', 'Sign Agreement', 'Key Delivered'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= checkinStep ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < checkinStep ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${i <= checkinStep ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{step}</span>
                {i < 3 && <div className={`flex-1 h-0.5 ${i < checkinStep ? 'bg-green-200' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>

          {checkinStep === 0 && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📷</span>
              </div>
              <p className="text-lg font-medium mb-2">Scan Your ID Document</p>
              <p className="text-sm text-gray-500 mb-6">Place your passport or national ID on the scanner</p>
              <button onClick={() => setCheckinStep(1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Simulate Scan →
              </button>
            </div>
          )}

          {checkinStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" defaultValue="Amina Hassan" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" defaultValue="+234 801 234 5678" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" defaultValue="amina@email.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <input type="text" defaultValue="Nigerian" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setCheckinStep(0)} className="px-4 py-2 text-gray-600 hover:text-gray-800">← Back</button>
                <button onClick={() => setCheckinStep(2)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Verify & Continue →</button>
              </div>
            </div>
          )}

          {checkinStep === 2 && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✍️</span>
              </div>
              <p className="text-lg font-medium mb-2">Sign Registration Card</p>
              <p className="text-sm text-gray-500 mb-4">Review terms and sign digitally</p>
              <div className="bg-gray-50 rounded-lg p-4 text-left text-sm text-gray-600 max-w-md mx-auto mb-6">
                <p>I confirm that the information provided is accurate. I agree to the hotel's terms and conditions, cancellation policy, and liability provisions.</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 max-w-sm mx-auto mb-6">
                <p className="text-gray-400 text-sm">Sign here ✍️</p>
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={() => setCheckinStep(1)} className="px-4 py-2 text-gray-600 hover:text-gray-800">← Back</button>
                <button onClick={() => setCheckinStep(3)} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Sign & Complete Check-in →</button>
              </div>
            </div>
          )}

          {checkinStep === 3 && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <p className="text-2xl font-bold text-green-700 mb-2">Check-in Complete!</p>
              <p className="text-gray-500 mb-2">Room 301 — Your digital key is ready</p>
              <p className="text-sm text-gray-400 mb-6">Key has been sent to your phone via NFC</p>
              <button onClick={() => setCheckinStep(0)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Reset Demo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Folio View */}
      {activeTab === 'folio' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Guest Folio — Room 301</h3>
              <p className="text-sm text-gray-500">Amina Hassan | Sep 3–6, 2026</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">📄 Download PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Debit (₦)</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Credit (₦)</th>
                </tr>
              </thead>
              <tbody>
                {folioCharges.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 px-4 text-gray-500">{c.date}</td>
                    <td className="py-2 px-4">{c.desc}</td>
                    <td className="py-2 px-4 text-right">{c.debit > 0 ? `₦${c.debit.toLocaleString()}` : ''}</td>
                    <td className="py-2 px-4 text-right text-green-600">{c.credit > 0 ? `₦${c.credit.toLocaleString()}` : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                  <td className="py-3 px-4" colSpan={2}>Balance Due</td>
                  <td className="py-3 px-4 text-right">₦{totalDebit.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-green-600">₦{totalCredit.toLocaleString()}</td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="py-3 px-4 font-bold" colSpan={2}>Amount Outstanding</td>
                  <td className="py-3 px-4 text-right font-bold text-lg" colSpan={2}>₦{balance.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Services */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {services.map((svc, i) => (
            <button key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:border-blue-300 transition-all">
              <span className="text-3xl block mb-2">{svc.icon}</span>
              <p className="text-sm font-medium">{svc.name}</p>
              <p className="text-xs text-gray-400 mt-1">{svc.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Feedback */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Rate Your Stay</h3>
          {['Overall Experience', 'Room Cleanliness', 'Staff Service', 'Food & Beverage', 'Value for Money'].map((label, i) => (
            <div key={i} className="mb-4">
              <p className="text-sm font-medium mb-1">{label}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} className="text-2xl text-gray-300 hover:text-yellow-400 transition-colors">★</button>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Tell us about your experience..." />
          </div>
          <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Submit Feedback</button>
        </div>
      )}
    </div>
  );
}
