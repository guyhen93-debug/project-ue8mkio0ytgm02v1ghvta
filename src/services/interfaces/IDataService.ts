/**
 * IDataService Interface
 *
 * Defines the contract for data access layer implementations.
 * Both RealDataService and MockDataService should implement this interface.
 */

import type {
  Order, CreateOrderData, UpdateOrderData,
  Client, CreateClientData, UpdateClientData,
  Site, CreateSiteData, UpdateSiteData,
  Product, CreateProductData, UpdateProductData
} from '@/types/schemas';

export interface DataServiceResult<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  sort?: string;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface IDataService {
  // ==================== Orders ====================
  loadOrders(userEmail?: string, isAdmin?: boolean): Promise<DataServiceResult<Order[]>>;
  getOrder(orderId: string): Promise<DataServiceResult<Order | null>>;
  createOrder(orderData: CreateOrderData): Promise<DataServiceResult<Order>>;
  updateOrder(orderId: string, updateData: UpdateOrderData): Promise<DataServiceResult<Order>>;
  deleteOrder(orderId: string): Promise<DataServiceResult<boolean>>;
  getOrdersWithRelations(userEmail?: string, isAdmin?: boolean): Promise<DataServiceResult<Order[]>>;

  // ==================== Clients ====================
  loadClients(filter?: FilterOptions): Promise<DataServiceResult<Client[]>>;
  getClient(clientId: string): Promise<DataServiceResult<Client | null>>;
  createClient(clientData: CreateClientData): Promise<DataServiceResult<Client>>;
  updateClient(clientId: string, updateData: UpdateClientData): Promise<DataServiceResult<Client>>;
  deleteClient(clientId: string): Promise<DataServiceResult<boolean>>;

  // ==================== Sites ====================
  loadSites(filter?: FilterOptions): Promise<DataServiceResult<Site[]>>;
  loadActiveSites(): Promise<DataServiceResult<Site[]>>;
  getSite(siteId: string): Promise<DataServiceResult<Site | null>>;
  createSite(siteData: CreateSiteData): Promise<DataServiceResult<Site>>;
  updateSite(siteId: string, updateData: UpdateSiteData): Promise<DataServiceResult<Site>>;
  deleteSite(siteId: string): Promise<DataServiceResult<boolean>>;

  // ==================== Products ====================
  loadProducts(filter?: FilterOptions): Promise<DataServiceResult<Product[]>>;
  getProduct(productId: string): Promise<DataServiceResult<Product | null>>;
  createProduct(productData: CreateProductData): Promise<DataServiceResult<Product>>;
  updateProduct(productId: string, updateData: UpdateProductData): Promise<DataServiceResult<Product>>;
  deleteProduct(productId: string): Promise<DataServiceResult<boolean>>;
}

/**
 * Data Service Factory
 *
 * Returns the appropriate data service based on environment configuration.
 */
export type DataServiceType = 'real' | 'mock';

export function getDataServiceType(): DataServiceType {
  // Check environment variable
  const useMock = import.meta.env?.VITE_USE_MOCK === 'true';
  return useMock ? 'mock' : 'real';
}
