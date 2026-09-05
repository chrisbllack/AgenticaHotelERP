import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:infineon_mobile/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive for offline storage
  await Hive.initFlutter();

  // Register Hive adapters
  // await Hive.registerAdapter(SyncQueueItemAdapter());

  // Open boxes
  await Hive.openBox('settings');
  await Hive.openBox('cache');
  await Hive.openBox('sync_queue');

  runApp(
    const ProviderScope(
      child: InfineonApp(),
    ),
  );
}
