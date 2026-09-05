import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive/hive.dart';

class ApiClient {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _baseUrlKey = 'server_url';

  late final Dio _dio;
  final Box _syncQueue = Hive.box('sync_queue');

  ApiClient({String? baseUrl}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl ?? 'http://192.168.1.50:8080/api/v1',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(AuthInterceptor(_storage));
    _dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true));
  }

  // Save/load server URL for LAN access
  static Future<void> setServerUrl(String url) async {
    await _storage.write(key: _baseUrlKey, value: url);
  }

  static Future<String> getServerUrl() async {
    return await _storage.read(key: _baseUrlKey) ?? 'http://192.168.1.50:8080/api/v1';
  }

  // Auth
  Future<void> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    final token = response.data['data']['token'] as String;
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _tokenKey);
    return token != null && token.isNotEmpty;
  }

  // Generic CRUD
  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? params}) async {
    try {
      final response = await _dio.get(path, queryParameters: params);
      return response.data;
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return _getFromCache(path);
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> post(String path, {dynamic data}) async {
    try {
      final response = await _dio.post(path, data: data);
      return response.data;
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        // Queue for sync when online
        _addToSyncQueue('POST', path, data);
        return {'success': true, 'queued': true};
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> put(String path, {dynamic data}) async {
    final response = await _dio.put(path, data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final response = await _dio.delete(path);
    return response.data;
  }

  // Offline sync queue
  void _addToSyncQueue(String method, String path, dynamic data) {
    _syncQueue.add({
      'method': method,
      'path': path,
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  Map<String, dynamic> _getFromCache(String path) {
    final cache = Hive.box('cache');
    return cache.get(path, defaultValue: {'success': false, 'offline': true});
  }

  // Sync queued operations when back online
  Future<void> syncQueuedOperations() async {
    final queue = _syncQueue.values.toList();
    for (final item in queue) {
      try {
        final method = item['method'] as String;
        final path = item['path'] as String;
        final data = item['data'];

        if (method == 'POST') {
          await _dio.post(path, data: data);
        } else if (method == 'PUT') {
          await _dio.put(path, data: data);
        }
        // Remove from queue on success
        final key = _syncQueue.keys.elementAt(queue.indexOf(item));
        await _syncQueue.delete(key);
      } catch (e) {
        // Keep in queue, will retry next time
        break;
      }
    }
  }
}

class AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  AuthInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: 'auth_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      _storage.delete(key: 'auth_token');
    }
    handler.next(err);
  }
}
