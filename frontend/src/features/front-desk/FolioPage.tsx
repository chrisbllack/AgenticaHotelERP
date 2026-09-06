import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function FolioPage() {
  const { stayId } = useParams<{ stayId: string }>();
  const navigate = useNavigate();

  const { data: folio, isLoading } = useQuery({
    queryKey: ['folio', stayId],
    queryFn: async () => {
      const res = await api.get(`/folios/stay/${stayId}`);
      return res.data.data;
    },
    enabled: !!stayId,
  });

  if (isLoading) return <div className="text-center py-8">Loading folio...</div>;
  if (!folio) return <div className="text-center py-8">Folio not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Folio {folio.folio_number}</h1>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          folio.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {folio.status}
        </span>
      </div>

      {/* Folio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Debits</p>
          <p className="text-2xl font-bold text-red-600">₦{folio.total_debits?.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Credits</p>
          <p className="text-2xl font-bold text-green-600">₦{folio.total_credits?.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Balance Due</p>
          <p className="text-2xl font-bold text-blue-600">₦{folio.balance?.toFixed(2)}</p>
        </div>
      </div>

      {/* Folio Lines */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Charges & Payments</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(!folio.lines || folio.lines.length === 0) ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No charges posted yet</td></tr>
            ) : (
              folio.lines.map((line: any) => (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {line.business_date ? new Date(line.business_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{line.charge_code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{line.description}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{line.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">₦{line.unit_price?.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${
                    line.type === 'debit' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {line.type === 'debit' ? '+' : '-'}${line.amount?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{line.posted_by}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      {folio.status === 'open' && (
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            + Post Charge
          </button>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            💳 Record Payment
          </button>
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            🖨️ Print Folio
          </button>
        </div>
      )}
    </div>
  );
}
