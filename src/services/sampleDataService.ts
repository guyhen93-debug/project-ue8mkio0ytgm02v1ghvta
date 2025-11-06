import { Client, Site, Order } from '@/entities';

export class SampleDataService {
  static async initializeSampleData(): Promise<void> {
    try {
      console.log('Initializing sample data...');
      
      // Check if we already have data with retry logic
      let existingClients;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          existingClients = await Client.list();
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          console.log(`Retry ${retryCount}/${maxRetries} for checking existing clients`);
          
          if (retryCount >= maxRetries) {
            console.log('Max retries reached, skipping sample data initialization');
            return; // Give up gracefully
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      if (existingClients && existingClients.length > 0) {
        console.log('Sample data already exists, skipping initialization');
        return;
      }

      // Create sample data with error handling for each step
      let client1, client2;
      
      try {
        // Create sample clients
        client1 = await Client.create({
          name: 'בניית הגליל',
          is_active: true
        });

        client2 = await Client.create({
          name: 'חברת בנייה דרומית',
          is_active: true
        });

        console.log('Created sample clients:', client1, client2);
      } catch (error) {
        console.error('Failed to create sample clients:', error);
        return; // Don't continue if clients can't be created
      }

      try {
        // Create sample sites
        const site1 = await Site.create({
          client_id: client1.id,
          site_name: 'פרויקט מגורים צפון',
          region_type: 'eilat',
          contact_name: 'יוסי כהן',
          contact_phone: '050-1234567',
          is_active: true
        });

        const site2 = await Site.create({
          client_id: client1.id,
          site_name: 'מתחם מסחרי מרכז',
          region_type: 'outside_eilat',
          contact_name: 'דני לוי',
          contact_phone: '052-9876543',
          is_active: true
        });

        const site3 = await Site.create({
          client_id: client2.id,
          site_name: 'פרויקט תשתיות דרום',
          region_type: 'outside_eilat',
          contact_name: 'מיכל אברהם',
          contact_phone: '054-5555555',
          is_active: true
        });

        console.log('Created sample sites:', site1, site2, site3);

        // Create sample orders
        const order1 = await Order.create({
          order_number: '2001',
          client_id: client1.id,
          site_id: site1.id,
          product_id: 'p_new_sand_0_4',
          quantity_tons: 25,
          delivery_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          delivery_window: 'morning',
          delivery_method: 'self',
          notes: 'הזמנה דחופה לפרויקט',
          status: 'pending',
          unlinked_site: false,
          created_by: 'test@example.com'
        });

        const order2 = await Order.create({
          order_number: '2002',
          client_id: client2.id,
          site_id: site3.id,
          product_id: 'granite_10_60',
          quantity_tons: 40,
          delivery_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          delivery_window: 'afternoon',
          delivery_method: 'external',
          notes: 'משלוח להובלה חיצונית',
          status: 'approved',
          unlinked_site: false,
          created_by: 'manager@example.com'
        });

        console.log('Created sample orders:', order1, order2);
        console.log('Sample data initialization completed successfully');
      } catch (error) {
        console.error('Failed to create sample sites/orders:', error);
        // Continue anyway - clients were created successfully
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
      // Don't throw - let the app continue without sample data
    }
  }

  static async withRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    delay: number = 1000
  ): Promise<T | null> {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`Operation failed, retry ${i + 1}/${maxRetries}:`, error);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    
    console.error('Operation failed after all retries:', lastError);
    return null;
  }
}