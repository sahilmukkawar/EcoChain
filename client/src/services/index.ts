export { default as api } from './api';
export { default as userService } from './userService';
export { default as garbageCollectionService } from './garbageCollectionService';
export { default as marketplaceService } from './marketplaceService';
export { default as transactionService } from './transactionService';

// Re-export types
export type { User, LoginCredentials, RegisterData, AuthResponse } from './userService';
export type { GarbageCollection, CreateCollectionData } from './garbageCollectionService';
export type { MarketplaceItem, CreateMarketplaceItemData } from './marketplaceService';
export type { Transaction, CreateTransactionData } from './transactionService';