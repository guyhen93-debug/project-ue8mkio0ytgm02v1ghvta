/**
 * Migration Script: Order Fields Normalization
 *
 * This script migrates old field names to new standardized names:
 * - quantity → quantity_tons
 * - time_slot → delivery_window
 * - delivery_type → delivery_method
 *
 * Run this script once to normalize all existing orders.
 */

import { Order } from '@/entities';

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

interface FieldMapping {
  oldField: string;
  newField: string;
  defaultValue?: any;
}

const FIELD_MAPPINGS: FieldMapping[] = [
  { oldField: 'quantity', newField: 'quantity_tons', defaultValue: 0 },
  { oldField: 'time_slot', newField: 'delivery_window', defaultValue: 'morning' },
  { oldField: 'delivery_type', newField: 'delivery_method', defaultValue: 'self' }
];

/**
 * Check if an order needs migration
 */
function needsMigration(order: any): boolean {
  for (const mapping of FIELD_MAPPINGS) {
    // If old field exists and new field is empty or different
    if (order[mapping.oldField] !== undefined &&
        (order[mapping.newField] === undefined || order[mapping.newField] === null)) {
      return true;
    }
  }
  return false;
}

/**
 * Get the updates needed for an order
 */
function getOrderUpdates(order: any): Record<string, any> | null {
  const updates: Record<string, any> = {};
  let hasUpdates = false;

  for (const mapping of FIELD_MAPPINGS) {
    // If old field has value and new field is empty
    if (order[mapping.oldField] !== undefined &&
        (order[mapping.newField] === undefined || order[mapping.newField] === null)) {
      updates[mapping.newField] = order[mapping.oldField];
      hasUpdates = true;
    }
    // If new field is empty and we have a default
    else if (order[mapping.newField] === undefined && mapping.defaultValue !== undefined) {
      updates[mapping.newField] = mapping.defaultValue;
      hasUpdates = true;
    }
  }

  return hasUpdates ? updates : null;
}

/**
 * Run the migration for all orders
 */
export async function migrateOrderFields(dryRun: boolean = true): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Load all orders
    const orders = await Order.list('-created_at', 10000);
    result.total = orders.length;

    console.log(`Found ${orders.length} orders to check`);

    for (const order of orders) {
      try {
        if (!needsMigration(order)) {
          result.skipped++;
          continue;
        }

        const updates = getOrderUpdates(order);
        if (!updates) {
          result.skipped++;
          continue;
        }

        console.log(`Order ${order.order_number || order.id}: Migrating fields`, updates);

        if (!dryRun) {
          await Order.update(order.id, updates);
        }

        result.migrated++;
      } catch (error) {
        const errorMsg = `Error migrating order ${order.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    console.log(`\nMigration ${dryRun ? '(DRY RUN) ' : ''}complete:`);
    console.log(`  Total orders: ${result.total}`);
    console.log(`  Migrated: ${result.migrated}`);
    console.log(`  Skipped: ${result.skipped}`);
    console.log(`  Errors: ${result.errors.length}`);

  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Verify migration results
 */
export async function verifyMigration(): Promise<{
  valid: number;
  invalid: number;
  issues: string[];
}> {
  const result = {
    valid: 0,
    invalid: 0,
    issues: [] as string[]
  };

  try {
    const orders = await Order.list('-created_at', 10000);

    for (const order of orders) {
      let isValid = true;

      // Check required new fields exist
      if (order.quantity_tons === undefined || order.quantity_tons === null) {
        result.issues.push(`Order ${order.order_number || order.id}: missing quantity_tons`);
        isValid = false;
      }

      if (!order.delivery_window) {
        result.issues.push(`Order ${order.order_number || order.id}: missing delivery_window`);
        isValid = false;
      }

      if (!order.delivery_method) {
        result.issues.push(`Order ${order.order_number || order.id}: missing delivery_method`);
        isValid = false;
      }

      if (isValid) {
        result.valid++;
      } else {
        result.invalid++;
      }
    }

    console.log(`\nVerification complete:`);
    console.log(`  Valid orders: ${result.valid}`);
    console.log(`  Invalid orders: ${result.invalid}`);
    console.log(`  Issues found: ${result.issues.length}`);

  } catch (error) {
    console.error('Verification failed:', error);
  }

  return result;
}

/**
 * CLI usage example (can be run from admin panel or script)
 */
export async function runMigration(mode: 'dry-run' | 'execute' | 'verify' = 'dry-run') {
  console.log(`\n=== Order Fields Migration (${mode}) ===\n`);

  switch (mode) {
    case 'dry-run':
      return await migrateOrderFields(true);
    case 'execute':
      return await migrateOrderFields(false);
    case 'verify':
      return await verifyMigration();
    default:
      console.log('Invalid mode. Use: dry-run, execute, or verify');
  }
}
