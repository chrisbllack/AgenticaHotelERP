import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:infineon_mobile/features/auth/auth_provider.dart';

class AdminDashboard extends ConsumerWidget {
  const AdminDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('System Administration'),
        actions: [
          IconButton(icon: const Icon(Icons.backup), onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Backup started...')));
          }),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Welcome
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const CircleAvatar(radius: 24, child: Icon(Icons.admin_panel_settings)),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? 'Admin', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('System Administrator', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // System Status
          Text('System Status', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          _StatusCard(title: 'Database', value: 'PostgreSQL 16.2', status: 'healthy', icon: Icons.storage),
          _StatusCard(title: 'Cache', value: 'Redis 7.2', status: 'healthy', icon: Icons.speed),
          _StatusCard(title: 'Search', value: 'Meilisearch 1.6', status: 'healthy', icon: Icons.search),
          _StatusCard(title: 'Storage', value: 'MinIO (Local)', status: 'healthy', icon: Icons.folder),
          const SizedBox(height: 24),

          // Quick actions
          Text('Administration', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          _AdminAction(icon: Icons.people, title: 'User Management', subtitle: 'Add, edit, deactivate users and roles', onTap: () {}),
          _AdminAction(icon: Icons.business, title: 'Property Settings', subtitle: 'Hotel config, departments, taxes', onTap: () {}),
          _AdminAction(icon: Icons.attach_money, title: 'Currency & Tax', subtitle: 'Manage currencies, tax rates, service charges', onTap: () {}),
          _AdminAction(icon: Icons.vpn_key, title: 'API Keys', subtitle: 'Manage API keys and integrations', onTap: () {}),
          _AdminAction(icon: Icons.print, title: 'Hardware Devices', subtitle: 'POS terminals, printers, door locks', onTap: () {}),
          _AdminAction(icon: Icons.cloud_sync, title: 'Channel Manager', subtitle: 'OTA connections and mappings', onTap: () {}),
          _AdminAction(icon: Icons.backup, title: 'Backups & Restore', subtitle: 'Database backups and disaster recovery', onTap: () {}),
          _AdminAction(icon: Icons.history, title: 'Audit Logs', subtitle: 'View system activity and audit trail', onTap: () {}),
          _AdminAction(icon: Icons.email, title: 'Notification Settings', subtitle: 'Email, SMS, push notification config', onTap: () {}),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  final String title;
  final String value;
  final String status;
  final IconData icon;
  const _StatusCard({required this.title, required this.value, required this.status, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: Colors.purple),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(value, style: const TextStyle(fontSize: 12)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: status == 'healthy' ? Colors.green.shade50 : Colors.red.shade50,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(status, style: TextStyle(fontSize: 11, color: status == 'healthy' ? Colors.green : Colors.red, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}

class _AdminAction extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _AdminAction({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: Colors.purple),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
