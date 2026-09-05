import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:infineon_mobile/features/auth/auth_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // Server connection
          _SectionHeader(title: 'Connection'),
          ListTile(
            leading: const Icon(Icons.dns),
            title: const Text('Server Address'),
            subtitle: const Text('192.168.1.50:8080'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.wifi_find),
            title: const Text('Auto-Discover Server'),
            subtitle: const Text('Scan local network for INFINEON server'),
            onTap: () {},
          ),

          const Divider(),

          // User
          _SectionHeader(title: 'Account'),
          const ListTile(
            leading: Icon(Icons.person),
            title: Text('Manager'),
            subtitle: Text('General Manager'),
          ),
          ListTile(
            leading: const Icon(Icons.fingerprint),
            title: const Text('Biometric Login'),
            trailing: Switch(value: true, onChanged: (v) {}),
          ),

          const Divider(),

          // Preferences
          _SectionHeader(title: 'Preferences'),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('Language'),
            subtitle: const Text('English'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.attach_money),
            title: const Text('Currency'),
            subtitle: const Text('NGN (₦)'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          SwitchListTile(
            secondary: const Icon(Icons.dark_mode),
            title: const Text('Dark Mode'),
            value: false,
            onChanged: (v) {},
          ),

          const Divider(),

          // Offline
          _SectionHeader(title: 'Offline & Sync'),
          ListTile(
            leading: const Icon(Icons.cloud_queue),
            title: const Text('Pending Sync Items'),
            subtitle: const Text('0 items queued'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.backup),
            title: const Text('Local Data Backup'),
            onTap: () {},
          ),

          const Divider(),

          // About
          _SectionHeader(title: 'About'),
          const ListTile(
            leading: Icon(Icons.info),
            title: Text('INFINEON PMS'),
            subtitle: Text('Version 1.0.0 (Build 1)'),
          ),

          const Divider(),

          // Logout
          Padding(
            padding: const EdgeInsets.all(16),
            child: OutlinedButton.icon(
              onPressed: () {
                ref.read(authProvider.notifier).logout();
              },
              icon: const Icon(Icons.logout, color: Colors.red),
              label: const Text('Sign Out', style: TextStyle(color: Colors.red)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        title,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Theme.of(context).colorScheme.primary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
