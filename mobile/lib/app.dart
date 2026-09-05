import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:infineon_mobile/core/router/app_router.dart';
import 'package:infineon_mobile/core/theme/app_theme.dart';
import 'package:infineon_mobile/core/network/connectivity_provider.dart';

class InfineonApp extends ConsumerWidget {
  const InfineonApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final connectivity = ref.watch(connectivityProvider);

    return MaterialApp.router(
      title: 'INFINEON PMS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
      builder: (context, child) {
        // Show offline banner when disconnected
        final isOffline = connectivity.valueOrNull == false;
        return Column(
          children: [
            if (isOffline)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
                color: Colors.orange.shade700,
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.wifi_off, color: Colors.white, size: 14),
                    SizedBox(width: 8),
                    Text(
                      'Offline Mode — Changes will sync when connected',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ],
                ),
              ),
            Expanded(child: child ?? const SizedBox()),
          ],
        );
      },
    );
  }
}
