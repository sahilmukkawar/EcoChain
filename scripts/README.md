# Database Cleanup Script

This script cleans up the EcoChain database by removing all data except for the essential test accounts.

## Essential Accounts Preserved

The following accounts are always preserved:
- admin@ecochain.com (Admin)
- factory@ecochain.com (Factory)
- collector@ecochain.com (Collector)
- user@ecochain.com (Regular User)

## Data Handling

- **Products**: Preserved (as per project requirements)
- **Users**: All deleted except essential accounts
- **Orders**: All deleted except those linked to essential accounts
- **Garbage Collections**: All deleted except those linked to essential accounts
- **Transactions**: All deleted except those linked to essential accounts
- **EcoToken Transactions**: All deleted except those linked to essential accounts
- **Factories**: All deleted except those linked to essential accounts
- **Factory Applications**: All deleted except those linked to essential accounts
- **Collector Applications**: All deleted except those linked to essential accounts
- **Product Reviews**: All deleted
- **Material Requests**: All deleted except those linked to essential accounts
- **Admin Payments**: All deleted except those linked to essential accounts
- **System Configuration**: Preserved
- **Analytics**: Preserved

## How to Run

```bash
npm run cleanup-db
```

## Use Cases

1. **Development Environment Reset**: Clean up test data while preserving essential accounts
2. **Database Maintenance**: Periodic cleanup of old data
3. **Testing Setup**: Prepare a clean database state for testing

## Warning

This script will permanently delete data from the database. Make sure to backup any important data before running this script.