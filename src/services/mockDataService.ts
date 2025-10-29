// Mock data service to replace entity calls for MVP
interface MockOrder {
  id: string;
  order_number: number;
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
  notes_preview?: string;
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
        order_number: 1001,
        client_id: '1',
        client_name: 'John Smith',
        client_company: 'Smith Construction Ltd.',
        product: 'sand_0_3',
        quantity: 20,
        delivery_date: '2024-01-15T09:00:00',
        delivery_type: 'external',
        delivery_location: '123 Construction Site, Tel Aviv, Israel',
        status: 'approved',
        notes: 'Please deliver to the back entrance. Contact site manager before arrival.',
        notes_preview: 'Please deliver to the back entrance...',
        created_at: now,
        updated_at: now
      },
      {
        id: '2',
        order_number: 1002,
        client_id: '2',
        client_name: 'Ahmed Hassan',
        client_company: 'BuildCo Industries',
        product: 'granite_10_60',
        quantity: 25.0,
        delivery_date: '2024-01-18T14:30:00',
        delivery_type: 'self_transport',
        delivery_location: '456 Industrial Zone, Haifa, Israel',
        status: 'pending',
        notes: 'Contact site manager before delivery. Gate code: 1234',
        notes_preview: 'Contact site manager before delivery...',
        created_at: now,
        updated_at: now
      },
      {
        id: '3',
        order_number: 1003,
        client_id: '1',
        client_name: 'John Smith',
        client_company: 'Smith Construction Ltd.',
        product: 'lentil_9_5_19',
        quantity: 8.0,
        delivery_date: '2024-01-12T11:00:00',
        delivery_type: 'self_transport',
        delivery_location: '789 Residential Project, Jerusalem, Israel',
        status: 'completed',
        notes: '',
        notes_preview: '',
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
        message: 'Your sand order #1001 has been approved for delivery on Jan 15',
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
        message: 'Your lentil order #1003 has been marked as completed',
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
        this.orders = JSON.parse(storedOrders);
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

    // Update counter to be higher than any existing order
    if (this.orders.length > 0) {
      const maxOrderNumber = Math.max(...this.orders.map(o => o.order_number || 0));
      this.orderCounter = Math.max(this.orderCounter, maxOrderNumber + 1);
    }
  }

  private saveToStorage() {
    localStorage.setItem('mockOrders', JSON.stringify(this.orders));
    localStorage.setItem('mockNotifications', JSON.stringify(this.notifications));
    localStorage.setItem('orderCounter', this.orderCounter.toString());
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getNextOrderNumber(): number {
    const orderNumber = this.orderCounter;
    this.orderCounter++;
    return orderNumber;
  }

  private generateNotesPreview(notes: string): string {
    if (!notes || notes.trim() === '') return '';
    const firstLine = notes.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
  }

  // Validation methods
  private validateOrderDate(deliveryDate: string, deliveryTime: string): { valid: boolean; error?: string } {
    const now = new Date();
    const orderDate = new Date(deliveryDate);
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    orderDate.setHours(0, 0, 0, 0);
    
    if (orderDate < today) {
      return { valid: false, error: 'past_date_error' };
    }
    
    // Check if it's today and time slot is in the past
    if (orderDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      if (deliveryTime === 'morning' && currentHour >= 12) {
        return { valid: false, error: 'time_slot_passed' };
      }
      if (deliveryTime === 'afternoon' && currentHour >= 17) {
        return { valid: false, error: 'after_hours_error' };
      }
    }
    
    return { valid: true };
  }

  private validateExternalDelivery(quantity: number): { valid: boolean; error?: string } {
    if (quantity < 20) {
      return { valid: false, error: 'minimum_quantity_external' };
    }
    if (quantity % 20 !== 0) {
      return { valid: false, error: 'quantity_multiple_twenty' };
    }
    return { valid: true };
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

  async createOrder(orderData: Omit<MockOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'notes_preview'>): Promise<{ success: boolean; order?: MockOrder; error?: string }> {
    // Validate delivery date and time
    const dateValidation = this.validateOrderDate(orderData.delivery_date.split('T')[0], orderData.delivery_date.includes('09:00') ? 'morning' : 'afternoon');
    if (!dateValidation.valid) {
      return { success: false, error: dateValidation.error };
    }

    // Validate external delivery requirements
    if (orderData.delivery_type === 'external') {
      const externalValidation = this.validateExternalDelivery(orderData.quantity);
      if (!externalValidation.valid) {
        return { success: false, error: externalValidation.error };
      }
    }

    const now = new Date().toISOString();
    const orderNumber = this.getNextOrderNumber();
    const notesPreview = this.generateNotesPreview(orderData.notes || '');
    
    const newOrder: MockOrder = {
      ...orderData,
      id: this.generateId(),
      order_number: orderNumber,
      notes_preview: notesPreview,
      created_at: now,
      updated_at: now
    };
    
    this.orders.push(newOrder);
    this.saveToStorage();
    return { success: true, order: newOrder };
  }

  async updateOrder(id: string, updates: Partial<MockOrder>): Promise<MockOrder | null> {
    const index = this.orders.findIndex(order => order.id === id);
    if (index === -1) return null;
    
    // Update notes preview if notes are being updated
    if (updates.notes !== undefined) {
      updates.notes_preview = this.generateNotesPreview(updates.notes);
    }
    
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

  // Badge count methods
  async getUnreadNotificationCount(userId: string): Promise<number> {
    const userNotifications = await this.getNotifications({ user_id: userId });
    return userNotifications.filter(n => !n.read).length;
  }
}

export const mockDataService = new MockDataService();