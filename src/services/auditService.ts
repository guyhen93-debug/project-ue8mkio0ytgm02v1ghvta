/**
 * Audit Service
 *
 * Provides audit logging functionality for tracking all changes to entities.
 * Creates an audit trail that can be used for compliance, debugging, and analytics.
 */

import { AuditLog } from '@/entities';

export type AuditAction = 'create' | 'update' | 'delete' | 'soft_delete' | 'restore' | 'status_change';
export type EntityType = 'Order' | 'Client' | 'Site' | 'Product' | 'User' | 'Notification' | 'Message';

export interface AuditEntry {
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  userEmail: string;
  userRole?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    fields?: string[];
  };
  metadata?: Record<string, any>;
}

export interface AuditLogRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_email: string;
  user_role: string;
  changes: Record<string, any>;
  metadata: Record<string, any>;
  timestamp: string;
  created_at: string;
}

class AuditService {
  private enabled: boolean = true;
  private batchQueue: AuditEntry[] = [];
  private batchTimeout: number | null = null;
  private readonly BATCH_DELAY_MS = 1000;
  private readonly MAX_BATCH_SIZE = 10;

  /**
   * Enable or disable audit logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log an audit entry immediately
   */
  async log(entry: AuditEntry): Promise<void> {
    if (!this.enabled) return;

    try {
      await AuditLog.create({
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        action: entry.action,
        user_email: entry.userEmail,
        user_role: entry.userRole || 'unknown',
        changes: entry.changes || {},
        metadata: entry.metadata || {},
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Don't let audit failures break the main operation
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Queue an audit entry for batch processing
   * Useful for high-frequency operations
   */
  queueLog(entry: AuditEntry): void {
    if (!this.enabled) return;

    this.batchQueue.push(entry);

    // Flush immediately if batch is full
    if (this.batchQueue.length >= this.MAX_BATCH_SIZE) {
      this.flushBatch();
      return;
    }

    // Set up delayed flush
    if (!this.batchTimeout) {
      this.batchTimeout = window.setTimeout(() => {
        this.flushBatch();
      }, this.BATCH_DELAY_MS);
    }
  }

  /**
   * Flush queued audit entries
   */
  private async flushBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batchQueue.length === 0) return;

    const entries = [...this.batchQueue];
    this.batchQueue = [];

    // Create all audit logs in parallel
    await Promise.all(entries.map(entry => this.log(entry)));
  }

  /**
   * Helper: Log order creation
   */
  async logOrderCreated(orderId: string, orderNumber: string, userEmail: string, userRole?: string): Promise<void> {
    await this.log({
      entityType: 'Order',
      entityId: orderId,
      action: 'create',
      userEmail,
      userRole,
      changes: {
        after: { order_number: orderNumber }
      }
    });
  }

  /**
   * Helper: Log order update
   */
  async logOrderUpdated(
    orderId: string,
    userEmail: string,
    before: Record<string, any>,
    after: Record<string, any>,
    userRole?: string
  ): Promise<void> {
    // Find changed fields
    const changedFields = Object.keys(after).filter(
      key => JSON.stringify(before[key]) !== JSON.stringify(after[key])
    );

    if (changedFields.length === 0) return;

    await this.log({
      entityType: 'Order',
      entityId: orderId,
      action: 'update',
      userEmail,
      userRole,
      changes: {
        before: Object.fromEntries(changedFields.map(k => [k, before[k]])),
        after: Object.fromEntries(changedFields.map(k => [k, after[k]])),
        fields: changedFields
      }
    });
  }

  /**
   * Helper: Log order status change
   */
  async logOrderStatusChange(
    orderId: string,
    orderNumber: string,
    oldStatus: string,
    newStatus: string,
    userEmail: string,
    userRole?: string
  ): Promise<void> {
    await this.log({
      entityType: 'Order',
      entityId: orderId,
      action: 'status_change',
      userEmail,
      userRole,
      changes: {
        before: { status: oldStatus },
        after: { status: newStatus }
      },
      metadata: { order_number: orderNumber }
    });
  }

  /**
   * Helper: Log order deletion
   */
  async logOrderDeleted(orderId: string, orderNumber: string, userEmail: string, userRole?: string): Promise<void> {
    await this.log({
      entityType: 'Order',
      entityId: orderId,
      action: 'delete',
      userEmail,
      userRole,
      metadata: { order_number: orderNumber }
    });
  }

  /**
   * Helper: Log entity soft delete
   */
  async logSoftDelete(
    entityType: EntityType,
    entityId: string,
    userEmail: string,
    userRole?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      action: 'soft_delete',
      userEmail,
      userRole,
      metadata
    });
  }

  /**
   * Helper: Log entity restore
   */
  async logRestore(
    entityType: EntityType,
    entityId: string,
    userEmail: string,
    userRole?: string
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      action: 'restore',
      userEmail,
      userRole
    });
  }

  /**
   * Query audit logs for an entity
   */
  async getEntityHistory(entityType: EntityType, entityId: string): Promise<AuditLogRecord[]> {
    try {
      const logs = await AuditLog.filter(
        { entity_type: entityType, entity_id: entityId },
        '-timestamp',
        100
      );
      return logs as AuditLogRecord[];
    } catch (error) {
      console.error('Failed to get entity history:', error);
      return [];
    }
  }

  /**
   * Query audit logs by user
   */
  async getUserActivity(userEmail: string, limit: number = 50): Promise<AuditLogRecord[]> {
    try {
      const logs = await AuditLog.filter(
        { user_email: userEmail },
        '-timestamp',
        limit
      );
      return logs as AuditLogRecord[];
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return [];
    }
  }

  /**
   * Query recent audit logs
   */
  async getRecentActivity(limit: number = 100): Promise<AuditLogRecord[]> {
    try {
      const logs = await AuditLog.list('-timestamp', limit);
      return logs as AuditLogRecord[];
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();
