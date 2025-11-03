// Mock data service to replace entity calls for MVP
interface MockOrder {
  id: string;
  order_number: number;
  client_id: string;
  client_name: string;
  client_company: string;
  site_id?: string;
  unlinked_site?: boolean;
  product: string;
  quantity: number;
  delivery_date: string;
  delivery_type: string;
  status: string;
  notes?: string;
  notes_preview?: string;
  quarry_or_crossing?: string;
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

interface MockMessage {
  id: string;
  order_id?: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

interface MockProduct {
  id: string;
  name: string;
  display_name_he: string;
  size_label: string;
  description_en: string;
  description_he: string;
  image_url: string;
}

interface MockClient {
  id: string;
  name: string;
  category: 'manager' | 'client';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MockSite {
  id: string;
  client_id: string;
  site_name: string;
  region_type: 'eilat' | 'outside_eilat';
  contact_name: string;
  contact_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class MockDataService {
  private orders: MockOrder[] = [];
  private notifications: MockNotification[] = [];
  private messages: MockMessage[] = [];
  private clients: MockClient[] = [];
  private sites: MockSite[] = [];
  private orderCounter: number = 1000;
  
  // Product data with descriptions and images
  private products: MockProduct[] = [
    {
      id: 'p_new_sand_0_4',
      name: 'Sand 0-4mm',
      display_name_he: 'חול מחצבה (0-4) מ"מ',
      size_label: '0-4 מ"מ',
      description_en: 'Quarry sand 0-4 mm - high quality, suitable for construction work.',
      description_he: 'חול מחצבה (0-4 מ"מ) - איכותי, מותאם לעבודות בנייה.',
      image_url: '/favicon.ico'
    },
    {
      id: 'sesame_4_9_5',
      name: 'Sesame 4-9.5mm',
      display_name_he: 'שומשום (4-9.5) מ"מ',
      size_label: '4-9.5 מ"מ',
      description_en: 'Sesame aggregate 4-9.5 mm for concrete and construction.',
      description_he: 'אגרגט שומשום 4-9.5 מ"מ לבטון ועבודות בנייה.',
      image_url: '/favicon.ico'
    },
    {
      id: 'lentil_9_5_19',
      name: 'Lentil 9.5-19mm',
      display_name_he: 'עדש (9.5–19) מ"מ',
      size_label: '9.5–19 מ"מ',
      description_en: 'Lentil aggregate 9.5-19 mm for heavy construction.',
      description_he: 'אגרגט עדש 9.5–19 מ"מ לעבודות בנייה כבדות.',
      image_url: '/favicon.ico'
    },
    {
      id: 'polia_19_25',
      name: 'Polia 19-25mm',
      display_name_he: 'פוליה (19-25) מ"מ',
      size_label: '19-25 מ"מ',
      description_en: 'Polia aggregate 19-25 mm for infrastructure projects.',
      description_he: 'אגרגט פוליה 19-25 מ"מ לפרויקטי תשתית.',
      image_url: '/favicon.ico'
    },
    {
      id: 'granite_10_60',
      name: 'Granite 10-60cm',
      display_name_he: 'אבן גרניט (10-60) ס"מ',
      size_label: '10-60 ס"מ',
      description_en: 'Granite stone 10-60 cm for landscaping and construction.',
      description_he: 'אבן גרניט 10-60 ס"מ לגינון ועבודות בנייה.',
      image_url: '/favicon.ico'
    }
  ];

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
    
    // Initialize clients
    this.clients = [
      {
        id: 'c1',
        name: 'דן עבודות עפר',
        category: 'client',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 'c2',
        name: 'ארד בנייה',
        category: 'client',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 'c3',
        name: 'שפיר הנדסה',
        category: 'client',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    // Initialize sites
    this.sites = [
      {
        id: 's1',
        client_id: 'c1',
        site_name: 'אתר שדרות ירושלים (אילת)',
        region_type: 'eilat',
        contact_name: 'אבי כהן',
        contact_phone: '050-1234567',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 's2',
        client_id: 'c1',
        site_name: 'אתר צוקי ים (ליטבתה)',
        region_type: 'outside_eilat',
        contact_name: 'דניאל לוי',
        contact_phone: '052-6543210',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 's3',
        client_id: 'c2',
        site_name: 'אתר נווה מדבר (אילת)',
        region_type: 'eilat',
        contact_name: 'משה מימון',
        contact_phone: '054-9988776',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 's4',
        client_id: 'c3',
        site_name: 'אתר סולל בונה צפון',
        region_type: 'outside_eilat',
        contact_name: '',
        contact_phone: '',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];
    
    this.orders = [
      {
        id: '1',
        order_number: 1001,
        client_id: 'c1',
        client_name: 'דן עבודות עפר',
        client_company: 'דן עבודות עפר',
        site_id: 's1',
        unlinked_site: false,
        product: 'p_new_sand_0_4',
        quantity: 20,
        delivery_date: '2024-01-15T09:00:00',
        delivery_type: 'external',
        status: 'approved',
        notes: 'Please deliver to the back entrance. Contact site manager before arrival.',
        notes_preview: 'Please deliver to the back entrance...',
        quarry_or_crossing: 'default',
        created_at: now,
        updated_at: now
      },
      {
        id: '2',
        order_number: 1002,
        client_id: 'c2',
        client_name: 'ארד בנייה',
        client_company: 'ארד בנייה',
        site_id: 's3',
        unlinked_site: false,
        product: 'granite_10_60',
        quantity: 25.0,
        delivery_date: '2024-01-18T14:30:00',
        delivery_type: 'self_transport',
        status: 'pending',
        notes: 'Contact site manager before delivery. Gate code: 1234',
        notes_preview: 'Contact site manager before delivery...',
        quarry_or_crossing: 'yitzhak_rabin',
        created_at: now,
        updated_at: now
      }
    ];

    this.notifications = [
      {
        id: '1',
        user_id: '1',
        order_id: '1',
        title: 'order_approved',
        message: 'Your sand order #1001 has been approved for delivery on Jan 15',
        type: 'order_approved',
        read: false,
        created_at: now,
        updated_at: now
      }
    ];

    this.messages = [
      {
        id: '1',
        order_id: '1',
        from_user_id: '3',
        to_user_id: '1',
        content: 'Your order has been approved. Delivery scheduled for tomorrow morning.',
        read: false,
        created_at: now,
        updated_at: now
      }
    ];

    // Load from localStorage if available
    const storedOrders = localStorage.getItem('mockOrders');
    const storedNotifications = localStorage.getItem('mockNotifications');
    const storedMessages = localStorage.getItem('mockMessages');
    const storedClients = localStorage.getItem('mockClients');
    const storedSites = localStorage.getItem('mockSites');
    
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

    if (storedMessages) {
      try {
        this.messages = JSON.parse(storedMessages);
      } catch (e) {
        console.error('Error loading stored messages:', e);
      }
    }

    if (storedClients) {
      try {
        this.clients = JSON.parse(storedClients);
      } catch (e) {
        console.error('Error loading stored clients:', e);
      }
    }

    if (storedSites) {
      try {
        this.sites = JSON.parse(storedSites);
      } catch (e) {
        console.error('Error loading stored sites:', e);
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
    localStorage.setItem('mockMessages', JSON.stringify(this.messages));
    localStorage.setItem('mockClients', JSON.stringify(this.clients));
    localStorage.setItem('mockSites', JSON.stringify(this.sites));
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
      return { valid: false, error: 'past_date' };
    }
    
    // Check if it's today and time slot is in the past or after hours
    if (orderDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      if (currentHour >= 17) {
        return { valid: false, error: 'invalid_time' };
      }
      if (deliveryTime === 'morning' && currentHour >= 12) {
        return { valid: false, error: 'morning_slot_passed' };
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

  private validateOutsideEilatDelivery(siteId: string, deliveryType: string, quantity: number): { valid: boolean; error?: string } {
    const site = this.sites.find(s => s.id === siteId);
    if (site && site.region_type === 'outside_eilat' && deliveryType === 'external' && quantity < 40) {
      return { valid: false, error: 'outside_eilat_min' };
    }
    return { valid: true };
  }

  // Product methods
  async getProducts(): Promise<MockProduct[]> {
    return [...this.products];
  }

  async getProductPreview(productId: string): Promise<MockProduct | null> {
    return this.products.find(p => p.id === productId) || null;
  }

  // Client methods
  async getClients(filter?: any, sort?: string): Promise<MockClient[]> {
    let result = [...this.clients];
    
    if (filter) {
      result = result.filter(client => {
        return Object.keys(filter).every(key => client[key] === filter[key]);
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

  async createClient(clientData: Omit<MockClient, 'id' | 'created_at' | 'updated_at'>): Promise<MockClient> {
    const now = new Date().toISOString();
    const newClient: MockClient = {
      ...clientData,
      id: this.generateId(),
      created_at: now,
      updated_at: now
    };
    
    this.clients.push(newClient);
    this.saveToStorage();
    return newClient;
  }

  async updateClient(id: string, updates: Partial<MockClient>): Promise<MockClient | null> {
    const index = this.clients.findIndex(client => client.id === id);
    if (index === -1) return null;
    
    this.clients[index] = {
      ...this.clients[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveToStorage();
    return this.clients[index];
  }

  async deleteClient(id: string): Promise<boolean> {
    const index = this.clients.findIndex(client => client.id === id);
    if (index === -1) return false;
    
    this.clients.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Site methods
  async getSites(filter?: any, sort?: string): Promise<MockSite[]> {
    let result = [...this.sites];
    
    if (filter) {
      result = result.filter(site => {
        return Object.keys(filter).every(key => site[key] === filter[key]);
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

  async createSite(siteData: Omit<MockSite, 'id' | 'created_at' | 'updated_at'>): Promise<MockSite> {
    const now = new Date().toISOString();
    const newSite: MockSite = {
      ...siteData,
      id: this.generateId(),
      created_at: now,
      updated_at: now
    };
    
    this.sites.push(newSite);
    this.saveToStorage();
    return newSite;
  }

  async updateSite(id: string, updates: Partial<MockSite>): Promise<MockSite | null> {
    const index = this.sites.findIndex(site => site.id === id);
    if (index === -1) return null;
    
    this.sites[index] = {
      ...this.sites[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveToStorage();
    return this.sites[index];
  }

  async deleteSite(id: string): Promise<boolean> {
    const index = this.sites.findIndex(site => site.id === id);
    if (index === -1) return false;
    
    this.sites.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Get site by ID
  async getSiteById(id: string): Promise<MockSite | null> {
    return this.sites.find(site => site.id === id) || null;
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

  async createOrder(orderData: Omit<MockOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'notes_preview' | 'unlinked_site'>): Promise<{ success: boolean; order?: MockOrder; error?: string }> {
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

    // Validate outside Eilat delivery requirements
    if (orderData.site_id) {
      const outsideEilatValidation = this.validateOutsideEilatDelivery(orderData.site_id, orderData.delivery_type, orderData.quantity);
      if (!outsideEilatValidation.valid) {
        return { success: false, error: outsideEilatValidation.error };
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
      unlinked_site: !orderData.site_id,
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

  // Admin quantity reduction
  async reduceOrderQuantity(orderId: string, reduceByTons: number, reason: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      return { success: false, error: 'order_not_found' };
    }

    if (order.quantity - reduceByTons < 0) {
      return { success: false, error: 'invalid_reduction_amount' };
    }

    // Update order quantity
    order.quantity -= reduceByTons;
    order.updated_at = new Date().toISOString();

    // Create notification for order owner
    await this.createNotification({
      user_id: order.client_id,
      order_id: orderId,
      title: 'quantity_reduced',
      message: `Order #${order.order_number} quantity reduced by ${reduceByTons} tons. Reason: ${reason}`,
      type: 'quantity_reduced',
      read: false
    });

    this.saveToStorage();
    return { success: true };
  }

  // Message methods
  async getMessages(filter?: any, sort?: string): Promise<MockMessage[]> {
    let result = [...this.messages];
    
    if (filter) {
      result = result.filter(message => {
        return Object.keys(filter).every(key => message[key] === filter[key]);
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

  async createMessage(messageData: Omit<MockMessage, 'id' | 'created_at' | 'updated_at'>): Promise<MockMessage> {
    const now = new Date().toISOString();
    const newMessage: MockMessage = {
      ...messageData,
      id: this.generateId(),
      created_at: now,
      updated_at: now
    };
    
    this.messages.push(newMessage);
    this.saveToStorage();
    return newMessage;
  }

  async updateMessage(id: string, updates: Partial<MockMessage>): Promise<MockMessage | null> {
    const index = this.messages.findIndex(message => message.id === id);
    if (index === -1) return null;
    
    this.messages[index] = {
      ...this.messages[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveToStorage();
    return this.messages[index];
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    return this.messages.filter(m => m.to_user_id === userId && !m.read).length;
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

  async getTotalUnreadCount(userId: string): Promise<number> {
    const notificationCount = await this.getUnreadNotificationCount(userId);
    const messageCount = await this.getUnreadMessageCount(userId);
    return notificationCount + messageCount;
  }
}

export const mockDataService = new MockDataService();