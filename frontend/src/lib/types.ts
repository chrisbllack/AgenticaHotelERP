export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: {
    request_id: string;
    execution_time_ms?: number;
    pagination?: Pagination;
  };
  errors: string[];
  timestamp: string;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export interface RoomType {
  id: string;
  code: string;
  name: string;
  description?: string;
  max_occupancy: number;
  adult_capacity: number;
  child_capacity: number;
  bed_configuration?: string;
  base_rate: number;
  min_rate: number;
  max_rate: number;
  status: string;
}

export interface Room {
  id: string;
  number: string;
  room_type_id: string;
  room_type_name?: string;
  building_id?: string;
  floor_id?: string;
  status: RoomStatus;
  housekeeping_status: string;
  maintenance_status: string;
}

export type RoomStatus =
  | 'vacant_clean'
  | 'vacant_dirty'
  | 'occupied_clean'
  | 'occupied_dirty'
  | 'inspected'
  | 'reserved'
  | 'due_in'
  | 'due_out'
  | 'out_of_order'
  | 'out_of_service'
  | 'blocked'
  | 'house_use'
  | 'complimentary';

export type ReservationStatus =
  | 'inquiry'
  | 'tentative'
  | 'confirmed'
  | 'checked_in'
  | 'in_house'
  | 'checked_out'
  | 'cancelled'
  | 'no_show'
  | 'expired';

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
  company?: string;
  gender?: string;
  address?: string;
  city?: string;
}

export interface Reservation {
  id: string;
  confirmation_number: string;
  guest_id: string;
  guest_name?: string;
  room_type_id: string;
  room_type_name?: string;
  room_id?: string;
  arrival_date: string;
  departure_date: string;
  nights: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  deposit_amount: number;
  total_estimated: number;
  special_requests?: string;
  is_vip: boolean;
  created_at: string;
}

export interface FrontDeskDashboard {
  arrivals: number;
  departures: number;
  in_house: number;
  available_rooms: number;
  occupied_rooms: number;
}
