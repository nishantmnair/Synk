# Real-Time Inbox Updates Implementation

## Overview
Implemented real-time inbox updates using Django Channels WebSocket broadcasting and frontend listeners. Inbox items now update instantly when created, modified, or deleted.

## Changes Made

### Backend Changes

#### 1. Enhanced BroadcastMixin (`backend/api/mixins.py`)
**New Method:** `broadcast_to_user(user, event_type, data)`
- Allows broadcasting to a specific user (not just current user and partner)
- Used for sending inbox updates to the recipient of the inbox item
- Enables flexible real-time event broadcasting

```python
def broadcast_to_user(self, user, event_type, data):
    """Broadcast a WebSocket event to a specific user."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user.id}",
        {
            "type": "send_message",
            "event": event_type,
            "data": data
        }
    )
```

#### 2. InboxItemViewSet Updates (`backend/api/views.py`)
**Added:** BroadcastMixin integration
- ViewSet now inherits from `BroadcastMixin` for broadcasting support
- Simplified methods that rely on Django signals for automatic broadcasting
- `mark_as_read()` - Marks individual inbox items as read and broadcasts the change
- `mark_all_as_read()` - Marks all unread items as read and broadcasts each update

#### 3. Daily Connection Answer Broadcasting (`backend/api/views.py`)
**Enhanced:** When a user submits a daily connection answer, two events are now broadcast:
1. `connection_answer:created` - Notifies about the answer
2. `inbox:created` - Notifies that a new inbox item was created for the partner

```python
# Broadcast inbox:created event to partner
channel_layer = get_channel_layer()
async_to_sync(channel_layer.group_send)(
    f"user_{partner.id}",
    {
        "type": "send_message",
        "event": "inbox:created",
        "data": InboxItemSerializer(inbox_item).data
    }
)
```

#### 4. Django Signals for Auto-Broadcasting (`backend/api/signals.py`)
**Added:** Automatic WebSocket broadcasting when inbox items change

**Signal 1:** `broadcast_inbox_item_update()`
- Listens to `post_save` signals on InboxItem model
- Broadcasts `inbox:created` for new items
- Broadcasts `inbox:updated` for modified items
- Ensures all changes are broadcast to the recipient in real-time

**Signal 2:** `broadcast_inbox_item_deletion()`
- Listens to `post_delete` signals on InboxItem model
- Broadcasts `inbox:deleted` event when items are removed
- Notifies the user their inbox item was deleted

### Frontend Implementation (Already in Place)

#### Real-Time Listeners in `frontend/App.tsx`
The frontend already has comprehensive real-time listeners for inbox events:

```tsx
// Listen for new inbox items
djangoRealtimeService.on('inbox:created', (data: any) => {
  const transformed = transformInboxItem(data);
  setInboxItems(prev => {
    const exists = prev.some(item => item.id === transformed.id);
    if (exists) return prev;
    return [transformed, ...prev];
  });
});

// Listen for inbox item updates (e.g., mark as read)
djangoRealtimeService.on('inbox:updated', (data: any) => {
  const transformed = transformInboxItem(data);
  setInboxItems(prev => prev.map(item => item.id === transformed.id ? transformed : item));
});

// Listen for inbox item deletions
djangoRealtimeService.on('inbox:deleted', (data: { id: string | number }) => {
  const itemId = typeof data.id === 'number' ? data.id.toString() : data.id;
  setInboxItems(prev => prev.filter(item => item.id !== itemId));
});
```

#### InboxView Component (`frontend/components/InboxView.tsx`)
- Displays inbox items with proper visual indicators (unread status)
- Implements `mark_as_read()` functionality with real-time feedback
- Merges inbox items with suggestions for a unified inbox experience
- Automatically reflects changes when items are marked as read via WebSocket

## Event Flow

### Creating an Inbox Item
1. User submits a daily connection answer
2. Backend creates InboxItem in database
3. Django signal `broadcast_inbox_item_update` is triggered (created=True)
4. Signal broadcasts `inbox:created` event to recipient's WebSocket
5. Frontend receives event and adds item to `inboxItems` state
6. UI updates instantly with new inbox item

### Marking Item as Read
1. User clicks "Mark as Read" button in InboxView
2. Frontend calls `inboxApi.markAsRead(itemId)`
3. Backend updates `is_read` flag and saves
4. Django signal `broadcast_inbox_item_update` is triggered (created=False)
5. Signal broadcasts `inbox:updated` event to recipient
6. Frontend receives event and updates the item state
7. UI reflects the read status change in real-time

### Deleting an Inbox Item
1. Item is deleted via API
2. Django signal `broadcast_inbox_item_deletion` is triggered
3. Signal broadcasts `inbox:deleted` event
4. Frontend receives event and removes item from state
5. UI updates instantly

## WebSocket Events

| Event | Trigger | Data |
|-------|---------|------|
| `inbox:created` | New inbox item created | Full InboxItem serialized data |
| `inbox:updated` | Inbox item modified (e.g., marked as read) | Updated InboxItem serialized data |
| `inbox:deleted` | Inbox item deleted | `{ id: item_id }` |
| `connection_answer:created` | Daily connection answer submitted | Answer and connection data |

## Architecture Benefits

1. **Automatic Broadcasting** - Signals ensure all model changes are broadcast, regardless of how the update occurs
2. **Flexible Routing** - `broadcast_to_user()` method allows targeting specific users (useful for inbox items)
3. **Real-Time Responsiveness** - WebSocket events ensure instant UI updates across all connected clients
4. **Consistent UX** - All inbox changes (creation, updates, deletion) follow the same pattern
5. **Clean Code** - ViewSet methods focus on business logic while signals handle broadcasting

## Testing Real-Time Updates

To test the real-time inbox functionality:

1. **Multi-User Test**
   - Open two browser windows logged in as different users
   - User A submits a daily connection answer
   - User B should see the new inbox item appear instantly

2. **Mark as Read**
   - With two browsers connected, click "Mark as Read" in one
   - The item should update in both windows in real-time

3. **WebSocket Monitoring**
   - Open browser DevTools → Network → WS (WebSocket filter)
   - Submit an answer or mark items as read
   - Observe the WebSocket messages for `inbox:created`, `inbox:updated` events

## Files Modified

- `backend/api/mixins.py` - Added `broadcast_to_user()` method
- `backend/api/views.py` - Updated InboxItemViewSet and daily connection answer creation
- `backend/api/signals.py` - Added inbox item broadcast signals
- Frontend: No changes needed (already had listeners in place)

## Deployment Notes

- Django Channels WebSocket support must be enabled (already configured)
- Redis channel layer must be configured (already in docker-compose)
- Signals are automatically registered when the app loads
- No database migrations needed

## Performance Considerations

- Signals run synchronously by default (uses `async_to_sync`)
- For high-traffic systems, consider using Celery tasks for broadcasting
- Broadcasting is scoped to user groups for isolation
- Each user only receives events for their own inbox items
