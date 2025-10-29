// Mock data service to replace entity calls for MVP
interface MockOrder {
  id: string;
  order_number: string;
  client_id: string;
  client_name: string;
  client_company: string;
  product: string;
  quantity: number;
  delivery_date: string;
  delivery_type: string;
  delivery_location: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface MockNotification {
  id: string;
  user_id: string;
  order_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

class MockDataService {
  private orders: MockOrder[] = [];
  private notifications: MockNotification[] = [];
  private orderCounter: number = 1000; // Start from 1000 for better looking order numbers

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Load counter from localStorage
    const storedCounter = localStorage.getItem('orderCounter');
    if (storedCounter) {
      this.orderCounter = parseInt(storedCounter, 10);
    }

    // Initialize with sample data
    const now = new Date().toISOString();
    
    this.orders = [
      {
        id: '1',
        order_number: 'PN-1001',
        client_id: '1',
        client_name: 'John Smith',
        client_company: 'Smith Construction Ltd.',
        product: 'sand_0_3',
        quantity: 15.5,
        delivery_date: '2024-01-15T09:00:00',
        delivery_type: 'external',
        delivery_location: '123 Construction Site, Tel Aviv, Israel',
        status: 'approved',
        notes: 'Please deliver to the back entrance',
        created_at: now,
        updated_at: now
      },
      {
        id: '2',
        order_number: 'PN-1002',
        client_id: '2',
        client_name: 'Ahmed Hassan',
        client_company: 'BuildCo Industries',
        product: 'granite_10_60',
        quantity: 25.0,
        delivery_date: '2024-01-18T14:30:00',
        delivery_type: 'self_transport',
        delivery_location: '456 Industrial Zone, Haifa, Israel',
        status: 'pending',
        notes: 'Contact site manager before delivery',
        created_at: now,
        updated_at: now
      },
      {
        id: '3',
        order_number: 'PN-1003',
        client_id: '1',
        client_name: 'John Smith',
        client_company: 'Smith Construction Ltd.',
        product: 'lentil_9_5_19',
        quantity: 8.0,
        delivery_date: '2024-01-12T11:00:00',
        delivery_type: 'external',
        delivery_location: '789 Residential Project, Jerusalem, Israel',
        status: 'completed',
        notes: '',
        created_at: now,
        updated_at: now
      }
    ];

    this.notifications = [
      {
        id: '1',
        user_id: '1',
        order_id: '1',
        title: 'Order Approved',
        message: 'Your sand order PN-1001 has been approved for delivery on Jan 15',
        type: 'order_approved',
        read: false,
        created_at: now,
        updated_at: now
      },
      {
        id: '2',
        user_id: '1',
        order_id: '3',
        title: 'Order Completed',
        message: 'Your lentil order PN-1003 has been marked as completed',
        type: 'order_completed',
        read: true,
        created_at: now,
        updated_at: now
      }
    ];

    // Load from localStorage if available
    const storedOrders = localStorage.getItem('mockOrders');
    const storedNotifications = localStorage.getItem('mockNotifications');
    
    if (storedOrders) {
      try {
        const parsedOrders = JSON.parse(storedOrders);
        // Ensure all orders have order_number
        this.orders = parsedOrders.map((order: any) => ({
          ...order,
          order_number: order.order_number || `PN-${this.generateOrderNumber()}`
        }));
      } catch (e) {
        console.error('Error loading stored orders:', e);
      }
    }
    
    if (storedNotifications) {
      try {
        this.notifications = JSON.parse(storedNotifications);
      } catch (e) {
        console.error('Error loading stored notifications:', e);
      }
    }

    // Update counter to be higher than existing orders
    const maxOrderNumber = Math.max(
      ...this.orders.map(order => {
        const match = order.order_number.match(/PN-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      }),
      this.orderCounter
    );
    this.orderCounter = maxOrderNumber + 1;
    this.saveCounter();
  }

  private saveToStorage() {
    localStorage.setItem('mockOrders', JSON.stringify(this.orders));
    localStorage.setItem('mockNotifications', JSON.stringify(this.notifications));
  }

  private saveCounter() {
    localStorage.setItem('orderCounter', this.orderCounter.toString());
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateOrderNumber(): string {
    const orderNumber = `PN-${this.orderCounter}`;
    this.orderCounter++;
    this.saveCounter();
    return orderNumber;
  }

  // Order methods
  async getOrders(filter?: any, sort?: string): Promise<MockOrder[]> {
    let result = [...this.orders];
    
    if (filter) {
      result = result.filter(order => {
        return Object.keys(filter).every(key => order[key] === filter[key]);
      });
    }
    
    if (sort) {
      const isDesc = sort.startsWith('-');
      const field = isDesc ? sort.substring(1) : sort;
      result.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return isDesc ? -comparison : comparison;
      });
    }
    
    return result;
  }

  async createOrder(orderData: Omit<MockOrder, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<MockOrder> {
    const now = new Date().toISOString();
    const newOrder: MockOrder = {
      ...orderData,
      id: this.generateId(),
      order_number: this.generateOrderNumber(),
      created_at: now,
      updated_at: now
    };
    
    this.orders.push(newOrder);
    this.saveToStorage();
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<MockOrder>): Promise<MockOrder | null> {
    const index = this.orders.findIndex(order => order.id === id);
    if (index === -1) return null;
    
    this.orders[index] = {
      ...this.orders[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveToStorage();
    return this.orders[index];
  }

  // Notification methods
  async getNotifications(filter?: any, sort?: string): Promise<MockNotification[]> {
    let result = [...this.notifications];
    
    if (filter) {
      result = result.filter(notification => {
        return Object.keys(filter).every(key => notification[key] === filter[key]);
      });
    }
    
    if (sort) {
      const isDesc = sort.startsWith('-');
      const field = isDesc ? sort.substring(1) : sort;
      result.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return isDesc ? -comparison : comparison;
      });
    }
    
    return result;
  }

  async createNotification(notificationData: Omit<MockNotification, 'id' | 'created_at' | 'updated_at'>): Promise<MockNotification> {
    const now = new Date().toISOString();
    const newNotification: MockNotification = {
      ...notificationData,
      id: this.generateId(),
      created_at: now,
      updated_at: now
    };
    
    this.notifications.push(newNotification);
    this.saveToStorage();
    return newNotification;
  }

  async updateNotification(id: string, updates: Partial<MockNotification>): Promise<MockNotification | null> {
    const index = this.notifications.findIndex(notification => notification.id === id);
    if (index === -1) return null;
    
    this.notifications[index] = {
      ...this.notifications[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveToStorage();
    return this.notifications[index];
  }

  // Get unread notification count for a user
  async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.notifications.filter(n => n.user_id === userId && !n.read).length;
  }
}

export const mockDataService = new MockDataService();