import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Trace {
  id: string; type: string; title: string; description?: string;
  department: string; priority: string; status: string;
  assigned_to?: string; guest_name?: string; room_number?: string;
  due_date?: string; due_time?: string; created_at: string;
}

export default function TracesPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    api.get('/traces').then(r => {
      setTraces(r.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = traces.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (deptFilter !== 'all' && t.department !== deptFilter) return false;
    return true;
  });

  const departments = [...new Set(traces.map(t => t.department))].sort();
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

  const sorted = [...filtered].sort((a, b) =>
    (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
  );

  const stats = {
    total: traces.length,
    pending: traces.filter(t => t.status === 'pending').length,
    in_progress: traces.filter(t => t.status === 'in_progress').length,
    completed: traces.filter(t => t.status === 'completed').length,
    urgent: traces.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
  };

  const updateStatus = async (traceId: string, newStatus: string) => {
    await api.put(`/traces/${traceId}/status`, { status: newStatus });
    setTraces(prev => prev.map(t => t.id === traceId ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Traces & Tasks</h1>
        <p className="text-gray-500">Operational tasks, guest requests, and departmental assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Traces</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-yellow-600">Pending</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
          <p className="text-xs text-blue-600">In Progress</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
          <p className="text-xs text-red-600">Urgent Open</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'pending', 'in_progress', 'completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>{s === 'all' ? 'All' : s.replace('_', ' ')}</button>
          ))}
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-xs bg-white">
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Traces List */}
      {loading ? (
        <p className="text-gray-500">Loading traces...</p>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-400">No traces found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(trace => (
            <div key={trace.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${
              trace.priority === 'urgent' ? 'border-l-4 border-l-red-500' :
              trace.priority === 'high' ? 'border-l-4 border-l-orange-400' : ''
            }`}>
              {/* Priority Indicator */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                trace.priority === 'urgent' ? 'bg-red-500' :
                trace.priority === 'high' ? 'bg-orange-400' :
                trace.priority === 'normal' ? 'bg-blue-400' : 'bg-gray-300'
              }`} />

              {/* Type Badge */}
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                {trace.type}
              </span>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 text-sm">{trace.title}</h4>
                  {trace.guest_name && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{trace.guest_name}</span>
                  )}
                  {trace.room_number && (
                    <span className="text-xs text-gray-500">Room {trace.room_number}</span>
                  )}
                </div>
                {trace.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{trace.description}</p>
                )}
              </div>

              {/* Department & Assigned To */}
              <div className="text-xs text-gray-500 text-right flex-shrink-0">
                <p className="font-medium">{trace.department}</p>
                <p>{trace.assigned_to || 'Unassigned'}</p>
              </div>

              {/* Due Date */}
              {trace.due_date && (
                <div className="text-xs text-right flex-shrink-0">
                  <p className={`font-medium ${
                    new Date(trace.due_date) < new Date() ? 'text-red-600' : 'text-gray-600'
                  }`}>{new Date(trace.due_date).toLocaleDateString()}</p>
                  {trace.due_time && <p className="text-gray-400">{trace.due_time}</p>}
                </div>
              )}

              {/* Priority Badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                trace.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                trace.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>{trace.priority}</span>

              {/* Status Badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                trace.status === 'completed' ? 'bg-green-100 text-green-700' :
                trace.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>{trace.status.replace('_', ' ')}</span>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                {trace.status === 'pending' && (
                  <button onClick={() => updateStatus(trace.id, 'in_progress')}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">
                    Start
                  </button>
                )}
                {(trace.status === 'pending' || trace.status === 'in_progress') && (
                  <button onClick={() => updateStatus(trace.id, 'completed')}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">
                    Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
