export { default as api } from './api.ts';
export { default as userService } from './userService.ts';
export { default as garbageCollectionService } from './garbageCollectionService.ts';
export { default as marketplaceService } from './marketplaceService.ts';
export { default as transactionService } from './transactionService.ts';

// Re-export types
export type { User, LoginCredentials, RegisterData, AuthResponse } from './userService.ts';
export type { GarbageCollection, CreateCollectionData } from './garbageCollectionService.ts';
export type { MarketplaceItem, CreateMarketplaceItemData } from './marketplaceService.ts';
export type { Transaction, CreateTransactionData } from './transactionService.ts';