/**
 * Utility to identify and fix orphaned references from the 'Piter' user
 *
 * This script helps identify data that references a user/client that no longer exists
 * and provides methods to safely reassign or clean up that data.
 */

import { Order, Site, Client, Message, Notification, User } from '@/entities';

export interface OrphanedDataReport {
  orphanedOrders: any[];
  orphanedSites: any[];
  orphanedMessages: any[];
  orphanedNotifications: any[];
  potentialPiterClientId: string | null;
}

export class OrphanedReferencesFixer {
  private systemClientId: string | null = null;

  /**
   * Scan the database for orphaned references
   */
  async scanForOrphanedData(): Promise<OrphanedDataReport> {
    console.log('🔍 Scanning for orphaned references...');

    const report: OrphanedDataReport = {
      orphanedOrders: [],
      orphanedSites: [],
      orphanedMessages: [],
      orphanedNotifications: [],
      potentialPiterClientId: null,
    };

    try {
      // Get all clients
      const clients = await Client.list('-created_at', 1000);
      const clientIds = new Set(clients.map((c: any) => c.id));
      console.log(`Found ${clients.length} clients in the database`);

      // Find client with 'Piter' in the name
      const piterClient = clients.find((c: any) =>
        c.name?.toLowerCase().includes('piter')
      );

      if (piterClient) {
        console.log(`⚠️  Found potential Piter client: ${piterClient.name} (ID: ${piterClient.id})`);
        report.potentialPiterClientId = piterClient.id;
      }

      // Get all sites
      const sites = await Site.list('-created_at', 1000);
      const siteIds = new Set(sites.map((s: any) => s.id));
      console.log(`Found ${sites.length} sites in the database`);

      // Check for orphaned sites (sites with invalid client_id)
      for (const site of sites) {
        if (site.client_id && !clientIds.has(site.client_id)) {
          console.log(`⚠️  Orphaned site: ${site.site_name} (references non-existent client: ${site.client_id})`);
          report.orphanedSites.push(site);
        }
      }

      // Get all orders
      const orders = await Order.list('-created_at', 1000);
      console.log(`Found ${orders.length} orders in the database`);

      // Check for orphaned orders (orders with invalid client_id or site_id)
      for (const order of orders) {
        const hasInvalidClient = order.client_id && !clientIds.has(order.client_id);
        const hasInvalidSite = order.site_id && !siteIds.has(order.site_id);

        if (hasInvalidClient || hasInvalidSite) {
          console.log(`⚠️  Orphaned order #${order.order_number} (ID: ${order.id})`);
          if (hasInvalidClient) {
            console.log(`   - Invalid client_id: ${order.client_id}`);
          }
          if (hasInvalidSite) {
            console.log(`   - Invalid site_id: ${order.site_id}`);
          }
          report.orphanedOrders.push(order);
        }
      }

      // Get all messages
      const messages = await Message.list('-created_at', 1000);
      console.log(`Found ${messages.length} messages in the database`);

      // Note: We can't easily validate user IDs without a User.list() method
      // So we'll flag messages that might be problematic
      report.orphanedMessages = messages.filter((m: any) =>
        !m.from_user_id || !m.to_user_id
      );

      // Get all notifications
      const notifications = await Notification.list('-created_at', 1000);
      console.log(`Found ${notifications.length} notifications in the database`);

      // Check for notifications with invalid order references
      const orderIds = new Set(orders.map((o: any) => o.id));
      report.orphanedNotifications = notifications.filter((n: any) =>
        n.order_id && !orderIds.has(n.order_id)
      );

      console.log('\n📊 Scan Results:');
      console.log(`   - Orphaned orders: ${report.orphanedOrders.length}`);
      console.log(`   - Orphaned sites: ${report.orphanedSites.length}`);
      console.log(`   - Orphaned messages: ${report.orphanedMessages.length}`);
      console.log(`   - Orphaned notifications: ${report.orphanedNotifications.length}`);

      return report;
    } catch (error) {
      console.error('Error scanning for orphaned data:', error);
      throw error;
    }
  }

  /**
   * Get or create a "System" client to use for reassigning orphaned data
   */
  async getOrCreateSystemClient(): Promise<string> {
    if (this.systemClientId) {
      return this.systemClientId;
    }

    try {
      // Try to find existing System client
      const clients = await Client.list('-created_at', 1000);
      const systemClient = clients.find((c: any) =>
        c.name === 'System' || c.name === 'מערכת'
      );

      if (systemClient) {
        console.log(`✓ Found existing System client (ID: ${systemClient.id})`);
        this.systemClientId = systemClient.id;
        return systemClient.id;
      }

      // Create new System client
      console.log('Creating new System client...');
      const newClient = await Client.create({
        name: 'מערכת (System)',
        is_active: false, // Mark as inactive so it doesn't show in regular lists
        category: 'client',
      });

      console.log(`✓ Created System client (ID: ${newClient.id})`);
      this.systemClientId = newClient.id;
      return newClient.id;
    } catch (error) {
      console.error('Error getting/creating System client:', error);
      throw error;
    }
  }

  /**
   * Fix orphaned orders by reassigning them to the System client
   */
  async fixOrphanedOrders(orders: any[]): Promise<void> {
    if (orders.length === 0) {
      console.log('✓ No orphaned orders to fix');
      return;
    }

    const systemClientId = await this.getOrCreateSystemClient();
    console.log(`\n🔧 Fixing ${orders.length} orphaned orders...`);

    for (const order of orders) {
      try {
        const updates: any = {};

        // Update client_id if it's invalid
        if (order.client_id && !await this.clientExists(order.client_id)) {
          updates.client_id = systemClientId;
          console.log(`   - Order #${order.order_number}: Reassigning client_id to System`);
        }

        // Clear site_id if it's invalid (set unlinked_site flag)
        if (order.site_id && !await this.siteExists(order.site_id)) {
          updates.site_id = null;
          updates.unlinked_site = true;
          console.log(`   - Order #${order.order_number}: Clearing invalid site_id`);
        }

        if (Object.keys(updates).length > 0) {
          await Order.update(order.id, updates);
          console.log(`   ✓ Fixed order #${order.order_number}`);
        }
      } catch (error) {
        console.error(`   ✗ Failed to fix order #${order.order_number}:`, error);
      }
    }
  }

  /**
   * Fix orphaned sites by reassigning them to the System client
   */
  async fixOrphanedSites(sites: any[]): Promise<void> {
    if (sites.length === 0) {
      console.log('✓ No orphaned sites to fix');
      return;
    }

    const systemClientId = await this.getOrCreateSystemClient();
    console.log(`\n🔧 Fixing ${sites.length} orphaned sites...`);

    for (const site of sites) {
      try {
        await Site.update(site.id, {
          client_id: systemClientId,
        });
        console.log(`   ✓ Fixed site: ${site.site_name}`);
      } catch (error) {
        console.error(`   ✗ Failed to fix site ${site.site_name}:`, error);
      }
    }
  }

  /**
   * Delete orphaned notifications
   */
  async deleteOrphanedNotifications(notifications: any[]): Promise<void> {
    if (notifications.length === 0) {
      console.log('✓ No orphaned notifications to delete');
      return;
    }

    console.log(`\n🔧 Deleting ${notifications.length} orphaned notifications...`);

    for (const notification of notifications) {
      try {
        await Notification.delete(notification.id);
        console.log(`   ✓ Deleted notification: ${notification.id}`);
      } catch (error) {
        console.error(`   ✗ Failed to delete notification ${notification.id}:`, error);
      }
    }
  }

  /**
   * Delete orphaned messages
   */
  async deleteOrphanedMessages(messages: any[]): Promise<void> {
    if (messages.length === 0) {
      console.log('✓ No orphaned messages to delete');
      return;
    }

    console.log(`\n🔧 Deleting ${messages.length} orphaned messages...`);

    for (const message of messages) {
      try {
        await Message.delete(message.id);
        console.log(`   ✓ Deleted message: ${message.id}`);
      } catch (error) {
        console.error(`   ✗ Failed to delete message ${message.id}:`, error);
      }
    }
  }

  /**
   * Check if a client exists
   */
  private async clientExists(clientId: string): Promise<boolean> {
    try {
      await Client.get(clientId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a site exists
   */
  private async siteExists(siteId: string): Promise<boolean> {
    try {
      await Site.get(siteId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run the complete fix process
   */
  async fixAll(): Promise<OrphanedDataReport> {
    console.log('🚀 Starting orphaned reference fix process...\n');

    const report = await this.scanForOrphanedData();

    // Fix orphaned data
    await this.fixOrphanedSites(report.orphanedSites);
    await this.fixOrphanedOrders(report.orphanedOrders);
    await this.deleteOrphanedNotifications(report.orphanedNotifications);
    await this.deleteOrphanedMessages(report.orphanedMessages);

    console.log('\n✅ Orphaned reference fix process completed!');
    return report;
  }
}

// Export singleton instance
export const orphanedReferencesFixer = new OrphanedReferencesFixer();
