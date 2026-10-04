export const orderStatuses = [
  'pending_confirmation',
  'awaiting_payment',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const;

export const paymentStatuses = ['unpaid', 'paid'] as const;
export const paymentMethods = ['cash', 'bank_transfer'] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];

export type OrderItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
};

export type StoredOrder = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  fulfillment: 'collection' | 'delivery';
  address: string | null;
  notes: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  inventory_state?: 'untracked' | 'reserved' | 'committed' | 'released';
};

export type StaffRole = 'customer' | 'support' | 'fulfillment' | 'manager' | 'owner';

export type CustomerProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: StaffRole;
  is_admin: boolean;
  created_at: string;
};

export type OrderActivity = {
  id: number;
  order_id: string;
  event_type:
    | 'order_created'
    | 'status_changed'
    | 'payment_changed'
    | 'fulfillment_updated'
    | 'customer_update'
    | 'internal_note'
    | 'order_claimed'
    | 'inventory_adjusted';
  from_status: string | null;
  to_status: string | null;
  actor_user_id: string | null;
  actor_role: string | null;
  customer_visible: boolean;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type InternalOrderNote = {
  id: number;
  order_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
};

export type CustomerNotification = {
  id: number;
  user_id: string;
  order_id: string | null;
  activity_id: number | null;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export type ProductInventory = {
  product_id: string;
  size: string;
  stock_on_hand: number;
  reserved: number;
  low_stock_threshold: number;
  updated_by: string | null;
  updated_at: string;
};

export type AdminSavedView = {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const statusLabels: Record<OrderStatus, string> = {
  pending_confirmation: 'Order received',
  awaiting_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const statusDescriptions: Record<OrderStatus, string> = {
  pending_confirmation:
    'Your order is waiting for a team member to call you and confirm availability and payment.',
  awaiting_payment:
    'The team has contacted you. Complete the agreed cash or bank payment so the order can be confirmed.',
  confirmed: 'Payment has been received and an admin has confirmed your order.',
  preparing: 'Your order is being prepared.',
  ready: 'Your order is ready for collection or delivery coordination.',
  completed: 'Your order has been completed.',
  cancelled: 'This order was cancelled. Contact the team if you need help.',
};
