# Collector → Admin Payment Workflow

## Overview
This document explains the complete workflow from when a collector accepts a waste request to when the admin processes payment for the collector.

## Workflow Steps

### 1. User Submits Waste Request
- User creates waste submission via WasteSubmission page
- Status: `requested`
- Available for collectors to accept

### 2. Collector Accepts Request
- Collector sees request in "Pickup Requests" section
- Clicks "Accept Request" button
- Backend: `assignCollector` function is called
- Status changes: `requested` → `scheduled`
- User receives EcoTokens immediately
- Collection appears in collector's "Current Work" section

### 3. Collector Starts Pickup
- Collector sees collection in "Today's Schedule" or "Current Work"
- Clicks "🚀 Start Pickup" button
- Status changes: `scheduled` → `in_progress`

### 4. Collector Collects Waste
- Collector clicks "✅ Collect Waste" button
- Backend: `markAsCollected` function is called
- Status changes: `in_progress` → `collected`
- Collection now appears in admin dashboard for payment processing

### 5. Admin Processes Payment
- Admin sees collection in "Collector Payments" section
- System suggests payment (30% of user tokens earned)
- Admin clicks "Process Payment"
- Backend: `processCollectorPayment` function is called
- Collector receives payment tokens
- Status changes: `collected` → `delivered`
- Collection removed from admin payment queue

## Key Files

### Backend
- `controllers/garbageCollectionController.js` - assignCollector, markAsCollected
- `controllers/adminController.js` - getCollectionsForPayment, processCollectorPayment
- `database/models/GarbageCollection.js` - Schema with payment field
- `routes/garbageCollectionRoutes.js` - Collector endpoints
- `routes/adminRoutes.js` - Admin endpoints

### Frontend
- `pages/CollectorDashboard.tsx` - Collector interface
- `pages/AdminDashboard.tsx` - Admin payment processing
- `services/wasteService.ts` - Collector API calls
- `services/adminService.ts` - Admin API calls

## Database Schema

### GarbageCollection.payment
```javascript
payment: {
  collectorPaid: { type: Boolean, default: false },
  collectorPaymentAmount: { type: Number },
  collectorPaymentDate: { type: Date },
  collectorPaymentMethod: { type: String },
  adminNotes: { type: String }
}
```

## API Endpoints

### Collector Endpoints
- `POST /api/collections/:collectionId/assign` - Accept request
- `POST /api/collections/:collectionId/collected` - Mark as collected
- `PUT /api/collections/:collectionId/status` - Update status
- `GET /api/collections?assignedToMe=true` - Get assigned collections

### Admin Endpoints
- `GET /api/admin/collections/payment-pending` - Get collections ready for payment
- `POST /api/admin/collections/:collectionId/pay-collector` - Process payment
- `GET /api/admin/stats` - Get dashboard statistics

## Status Flow
```
requested → scheduled → in_progress → collected → delivered → verified → completed
              ↑            ↑            ↑         ↑
        collector    collector    collector   admin
        accepts      starts       collects    pays
```

## Testing the Workflow

### Prerequisites
1. Backend server running on port 4000
2. Frontend running on port 3000
3. MongoDB connected
4. At least one user, collector, and admin account

### Test Steps
1. **Create waste request** (as user)
2. **Accept request** (as collector) - should appear in Current Work
3. **Start pickup** (as collector) - status → in_progress
4. **Mark collected** (as collector) - status → collected
5. **Process payment** (as admin) - should appear in Collector Payments section

### Debugging
- Check browser console for API calls and responses
- Check server logs for backend processing
- Use the test script: `node test-collector-workflow.js`

## Common Issues

### Collections Not Showing in Collector Dashboard
- Check if `getMyAssignedCollections` API is working
- Verify `assignedToMe=true` parameter is being sent
- Check collector authentication

### Collections Not Showing in Admin Dashboard
- Verify collections have status `collected`
- Check that `payment.collectorPaid` is not `true`
- Ensure admin authentication is working

### Payment Processing Fails
- Check if collection exists and has correct status
- Verify admin has proper permissions
- Check if collector exists and can receive tokens

## Success Indicators
✅ User receives tokens when collector accepts
✅ Collector sees accepted collections in Current Work
✅ Status updates work correctly
✅ Collected items appear in admin dashboard
✅ Admin can process payments successfully
✅ Collector receives payment tokens