import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Device {
  id: string; name: string; device_model: string; serial_number: string;
  ip_address: string; port: number; protocol: string; location: string;
  department: string; timezone: string; status: string;
  last_sync_at: string | null; last_sync_error: string | null;
  capabilities: string; sync_interval_minutes: number;
}

interface SyncJob {
  id: string; device_id: string; device_name: string;
  started_at: string; completed_at: string | null;
  records_fetched: number; records_created: number;
  duplicates_skipped: number; errors: number; status: string;
}

interface RawEvent {
  id: string; provider: string; device_user_id: string; employee_id: string;
  event_timestamp: string; event_type: string; verification_type: string;
  processed: number; processing_status: string;
}

const STATUS_COLORS: Record<string, string> = {
  online: 'bg-green-100 text-green-700',
  offline: 'bg-red-100 text-red-700',
  error: 'bg-yellow-100 text-yellow-700',
  maintenance: 'bg-gray-100 text-gray-700',
};

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('devices');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAddDevice, setShowAddDevice] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/hr/devices').catch(() => ({ data: { data: [] } })),
      api.get('/hr/devices/sync-jobs').catch(() => ({ data: { data: [] } })),
    ]).then(([dRes, jRes]) => {
      setDevices(dRes.data.data || []);
      setSyncJobs(jRes.data.data || []);
      setLoading(false);
    });
  }, []);

  const syncDevice = async (deviceId: string) => {
    setSyncing(deviceId);
    try {
      await api.post(`/hr/devices/${deviceId}/sync`);
      // Refresh
      const [dRes, jRes] = await Promise.all([
        api.get('/hr/devices'),
        api.get('/hr/devices/sync-jobs'),
      ]);
      setDevices(dRes.data.data || []);
      setSyncJobs(jRes.data.data || []);
    } catch {}
    setSyncing(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biometric Device Management</h1>
          <p className="text-gray-500 text-sm mt-1">Dahua, ZKTeco, and compatible face/fingerprint terminals</p>
        </div>
        <button onClick={() => setShowAddDevice(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Device
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'devices', label: '📡 Devices', count: devices.length },
          { id: 'sync', label: '🔄 Sync History', count: syncJobs.length },
          { id: 'events', label: '📋 Raw Events' },
          { id: 'mapping', label: '👤 Device Users' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{t.label}{t.count ? ` (${t.count})` : ''}</button>
        ))}
      </div>

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading devices...</p>
          ) : devices.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-gray-400 text-lg mb-2">No biometric devices registered</p>
              <p className="text-gray-300 text-sm">Add a Dahua or ZKTeco device to start tracking attendance</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {devices.map(device => (
                <div key={device.id} className="bg-white rounded-xl border p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        device.status === 'online' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>📡</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{device.name}</h3>
                        <p className="text-xs text-gray-500">{device.device_model || 'Unknown Model'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[device.status] || 'bg-gray-100 text-gray-600'}`}>
                      {device.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-400">IP Address</span>
                      <p className="font-medium">{device.ip_address || '—'}:{device.port}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-400">Protocol</span>
                      <p className="font-medium uppercase">{device.protocol}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-400">Location</span>
                      <p className="font-medium">{device.location || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-400">Last Sync</span>
                      <p className="font-medium">
                        {device.last_sync_at
                          ? new Date(device.last_sync_at).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {device.last_sync_error && (
                    <div className="bg-red-50 text-red-700 text-xs rounded p-2 mb-3">
                      ⚠️ {device.last_sync_error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => syncDevice(device.id)}
                      disabled={syncing === device.id}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 disabled:opacity-50">
                      {syncing === device.id ? '⏳ Syncing...' : '🔄 Sync Now'}
                    </button>
                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                      ⚙️ Settings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sync History Tab */}
      {activeTab === 'sync' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {syncJobs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No sync jobs yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-2">Device</th>
                  <th className="px-4 py-2">Started</th>
                  <th className="px-4 py-2">Duration</th>
                  <th className="px-4 py-2">Fetched</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2">Dupes</th>
                  <th className="px-4 py-2">Errors</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {syncJobs.map(job => {
                  const dur = job.completed_at
                    ? ((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000).toFixed(1) + 's'
                    : 'Running...';
                  return (
                    <tr key={job.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{job.device_name || job.device_id}</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(job.started_at).toLocaleString()}</td>
                      <td className="px-4 py-2">{dur}</td>
                      <td className="px-4 py-2 text-center">{job.records_fetched}</td>
                      <td className="px-4 py-2 text-center font-medium text-green-600">{job.records_created}</td>
                      <td className="px-4 py-2 text-center text-yellow-600">{job.duplicates_skipped}</td>
                      <td className="px-4 py-2 text-center text-red-600">{job.errors}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          job.status === 'completed' ? 'bg-green-100 text-green-700' :
                          job.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{job.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Raw Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="text-center py-8">
            <p className="text-gray-400">Raw attendance events are stored here from biometric device syncs</p>
            <p className="text-xs text-gray-300 mt-1">Events are processed into attendance records automatically</p>
          </div>
        </div>
      )}

      {/* Device Users Tab */}
      {activeTab === 'mapping' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="text-center py-8">
            <p className="text-gray-400">Employee-to-device user mapping</p>
            <p className="text-xs text-gray-300 mt-1">Map HR employees to their biometric device user IDs</p>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Biometric Device</h2>
            <div className="space-y-3">
              <input placeholder="Device Name" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select className="w-full border rounded-lg px-3 py-2 text-sm">
                <option>Dahua ASA3223A-W (Face)</option>
                <option>Dahua ASI3201C-S (Face)</option>
                <option>ZKTeco uFace 800</option>
                <option>ZKTeco SpeedFace VSL</option>
                <option>Generic REST API</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="IP Address" className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Port" defaultValue="8080" className="border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Username" className="border rounded-lg px-3 py-2 text-sm" />
                <input type="password" placeholder="Password" className="border rounded-lg px-3 py-2 text-sm" />
              </div>
              <input placeholder="Location (e.g., Main Lobby)" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                <option value="Africa/Accra">Africa/Accra (GMT)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                <option value="Africa/Cairo">Africa/Cairo (EET)</option>
              </select>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAddDevice(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Add Device</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
