# React with ❤️ & Share Your Answer Feature

## Overview
Fully fleshed out the inbox experience with two key interactive features:
1. **React with ❤️** - Recipients can express appreciation for their partner's answer with a heart reaction
2. **Share Your Answer** - Recipients can respond thoughtfully to their partner's daily connection answer

## Backend Changes

### 1. InboxItem Model Enhancement (`backend/api/models.py`)
Added three new fields to track user interactions:
```python
has_reacted = models.BooleanField(default=False)  # Whether recipient reacted with heart
response = models.TextField(blank=True)  # Recipient's response to the answer
responded_at = models.DateTimeField(null=True, blank=True)  # When the response was sent
```

### 2. Serializer Updates (`backend/api/serializers.py`)
Updated InboxItemSerializer to include the new fields in API responses:
```python
fields = ['id', 'item_type', 'title', 'description', 'content', 'sender_name', 
          'connection_answer', 'is_read', 'has_reacted', 'response', 'responded_at',
          'created_at', 'updated_at']
```

### 3. New API Endpoints (`backend/api/views.py`)

#### React Endpoint
```
POST /api/inbox/{id}/react/
```
Marks an inbox item as reacted with a heart.

**Response:**
- `has_reacted: true`
- Updated item data with broadcast event

#### Share Response Endpoint
```
POST /api/inbox/{id}/share_response/
```
Saves the recipient's response to the inbox item.

**Request Body:**
```json
{
  "response": "Your thoughtful response text..."
}
```

**Response:**
- `response: "Your response text"`
- `responded_at: "2026-02-06T01:30:00Z"`
- Updated item data with broadcast event

### 4. Real-Time Broadcasting
Both actions automatically broadcast `inbox:updated` events via WebSocket, ensuring instant UI updates for both partners.

### 5. Database Migration
Migration file: `0008_inboxitem_reactions_responses.py`
- Adds `has_reacted` (BooleanField, default=False)
- Adds `response` (TextField, blank=True)
- Adds `responded_at` (DateTimeField, null=True, blank=True)

## Frontend Changes

### 1. Type Definitions (`frontend/types.ts`)
Updated InboxItem interface:
```typescript
export interface InboxItem {
  // ... existing fields ...
  hasReacted: boolean;
  response: string;
  respondedAt: string | null;
  // ...
}
```

### 2. API Service (`frontend/services/djangoApi.ts`)
Added two new methods:
```typescript
react: (itemId: number) => request(`/api/inbox/${itemId}/react/`, {
  method: 'POST',
}),
shareResponse: (itemId: number, response: string) => request(`/api/inbox/${itemId}/share_response/`, {
  method: 'POST',
  body: JSON.stringify({ response }),
}),
```

### 3. Data Transform (`frontend/App.tsx`)
Updated `transformInboxItem()` to map new fields:
```typescript
hasReacted: item.has_reacted || item.hasReacted || false,
response: item.response || '',
respondedAt: item.responded_at || item.respondedAt || null,
```

### 4. InboxView Component (`frontend/components/InboxView.tsx`)

#### New State Variables
```typescript
const [showResponseModal, setShowResponseModal] = useState(false);
const [responseText, setResponseText] = useState('');
const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
```

#### New Handler Functions
- `handleReact()` - Sends reaction via API
- `handleShareResponse()` - Validates and submits response

#### React with ❤️ Button
- Shows heart icon when not reacted, filled heart when reacted
- Disabled after reacting (one reaction per item)
- Shows loading state during submission
- Updates in real-time via WebSocket

#### Share Your Answer Button
- Shows reply icon, changes to checkmark when response submitted
- Opens modal for response composition
- Disabled after responding
- Validates response is not empty

#### Response Modal
Beautiful modal dialog for sharing answers:
- Title: "Share Your Answer"
- Context message about who you're responding to
- Textarea with placeholder and styling
- Cancel and Submit buttons
- Loading state during submission
- Clear after successful submission

#### Your Response Display
Shows the user's response if one has been shared:
- Displayed in accent color box
- Shows full response text
- Displays date it was shared
- Appears between buttons and modal

#### Inbox List Indicators
Visual indicators on inbox items showing:
- ❤️ emoji if reacted
- ✓ checkmark icon if responded
- Animated pulse dot if unread

## User Experience

### Flow 1: React with Heart
1. User opens inbox item
2. Clicks "React with ❤️" button
3. Heart fills and button shows "Reacted ❤️"
4. Partner receives real-time notification via WebSocket
5. ❤️ indicator appears in partner's inbox list

### Flow 2: Share Your Answer
1. User opens inbox item
2. Clicks "Share Your Answer" button
3. Modal opens with textarea
4. User types their thoughtful response
5. Clicks "Share" button
6. Response is saved and displayed below buttons
7. Button changes to show "Responded" state
8. ✓ indicator appears in inbox list
9. Partner receives real-time notification
10. Partner can see the response in their view of the item

## Real-Time Interaction
Both actions trigger `inbox:updated` WebSocket events, ensuring:
- Partner sees reaction instantly
- Partner sees response instantly
- No page refresh needed
- Synchronized state across all connected clients

## Visual Design
- Heart reactions use `romantic` color theme
- Response display uses `accent` color theme for visual distinction
- Modal uses card styling consistent with applications
- All buttons have proper disabled states
- Loading states with spinners for async operations
- Toast notifications for success/error feedback

## File Summary

### Modified Files
1. `backend/api/models.py` - Added three fields to InboxItem
2. `backend/api/serializers.py` - Updated serializer fields
3. `backend/api/views.py` - Added two new API endpoints
4. `frontend/types.ts` - Updated InboxItem interface
5. `frontend/services/djangoApi.ts` - Added API methods
6. `frontend/App.tsx` - Updated data transform function
7. `frontend/components/InboxView.tsx` - Full UI implementation (buttons, modal, handlers, display)

### New Files
1. `backend/api/migrations/0008_inboxitem_reactions_responses.py` - Database migration

## Testing the Feature

### Manual Testing
1. Open two browser windows with different user accounts
2. User A submits a daily connection answer
3. User B's inbox updates in real-time
4. User B clicks "React with ❤️" - heart appears instantly
5. User B clicks "Share Your Answer"
6. In modal, type a response (e.g., "Great perspective!")
7. Click "Share"
8. Response displays with "Responded" state
9. Refresh User A's window - they see B's reaction and response
10. Open DevTools Network > WS to see WebSocket events

### Validation
- ✓ Cannot submit empty response
- ✓ Can only react once per item
- ✓ Can only submit one response per item
- ✓ Response displays with timestamp
- ✓ All changes broadcast in real-time
- ✓ Visual indicators update instantly

## Future Enhancements
- Multiple emoji reactions (not just heart)
- Edit or delete responses
- Threaded comments/replies
- Reaction counts and who reacted
- Export conversation history
