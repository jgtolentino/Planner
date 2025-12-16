# API Endpoints Specification

Complete REST API specification for Notion-style Kanban backed by Odoo CE + OCA 18.

## Base URL

```
https://api.example.com/v1
```

## Authentication

All endpoints require authentication via Odoo session token or API key.

```
Authorization: Bearer <odoo_session_token>
```

Or:

```
X-API-Key: <api_key>
```

## Endpoints

### 1. List Boards

Get all boards (projects) the authenticated user has access to.

**Endpoint:** `GET /boards`

**Query Parameters:**
- `page` (integer, optional): Page number (0-based), default: 0
- `limit` (integer, optional): Items per page, default: 20

**Request:**
```http
GET /boards?page=0&limit=20
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "boards": [
    {
      "board_id": "project:42",
      "name": "Finance SSC Month-End",
      "owner": {
        "partner_id": 1201,
        "email": "maria.santos@company.com",
        "name": "Maria Santos"
      },
      "visibility": "team",
      "members": [...],
      "stages": [...],
      "tags": [...],
      "created_at": "2025-12-01T08:00:00+08:00",
      "updated_at": "2025-12-15T14:30:00+08:00"
    }
  ],
  "total": 1,
  "page": 0,
  "limit": 20
}
```

---

### 2. Get Board Detail

Get detailed information about a specific board including card counts.

**Endpoint:** `GET /boards/{board_id}`

**Path Parameters:**
- `board_id` (string): Board ID (e.g., "project:42")

**Request:**
```http
GET /boards/project:42
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "board_id": "project:42",
  "name": "Finance SSC Month-End",
  "owner": {...},
  "visibility": "team",
  "members": [
    {
      "partner_id": 1201,
      "email": "maria.santos@company.com",
      "name": "Maria Santos",
      "role": "manager"
    }
  ],
  "stages": [
    {
      "stage_id": "stage:10",
      "name": "Backlog",
      "order": 10,
      "wip_limit": null,
      "fold": false
    }
  ],
  "tags": [...],
  "description": "Month-end closing tasks...",
  "created_at": "2025-12-01T08:00:00+08:00",
  "updated_at": "2025-12-15T14:30:00+08:00",
  "card_counts": {
    "stage:10": 1,
    "stage:20": 2,
    "stage:30": 3,
    "stage:40": 1,
    "stage:50": 2
  }
}
```

**Error:** `404 Not Found`
```json
{
  "error": {
    "code": "BOARD_NOT_FOUND",
    "message": "Board not found or access denied"
  }
}
```

---

### 3. List Cards

Get cards with optional filters and pagination.

**Endpoint:** `GET /boards/{board_id}/cards`

**Query Parameters:**
- `stage` (string, optional): Filter by stage ID (e.g., "stage:20")
- `tag` (string, optional): Filter by tag ID (e.g., "tag:1")
- `owner` (string, optional): Filter by owner email or partner ID
- `due_from` (string, optional): Filter by due date from (ISO 8601 date)
- `due_to` (string, optional): Filter by due date to (ISO 8601 date)
- `q` (string, optional): Search query (searches title, description, comments)
- `page` (integer, optional): Page number, default: 0
- `limit` (integer, optional): Items per page, default: 100

**Request:**
```http
GET /boards/project:42/cards?stage=stage:30&tag=tag:1&page=0&limit=50
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "cards": [
    {
      "card_id": "task:9004",
      "board_id": "project:42",
      "stage_id": "stage:30",
      "title": "Reconcile VAT input tax",
      "description_md": "Reconcile VAT input tax for December...",
      "priority": "3",
      "due_date": "2025-12-18",
      "created_at": "2025-12-11T08:30:00+08:00",
      "updated_at": "2025-12-15T14:20:00+08:00",
      "owners": [
        {
          "partner_id": 1202,
          "email": "juan.cruz@company.com",
          "name": "Juan Cruz"
        }
      ],
      "watchers": [...],
      "tags": ["tag:1", "tag:3", "tag:4"],
      "parent_id": null,
      "subtask_ids": ["task:9005", "task:9006"],
      "checklist": [...],
      "dependencies": [...],
      "sequence": 1
    }
  ],
  "total": 1,
  "page": 0,
  "limit": 50
}
```

---

### 4. Get Card Detail

Get detailed information about a specific card.

**Endpoint:** `GET /cards/{card_id}`

**Path Parameters:**
- `card_id` (string): Card ID (e.g., "task:9004")

**Request:**
```http
GET /cards/task:9004
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "card_id": "task:9004",
  "board_id": "project:42",
  "stage_id": "stage:30",
  "title": "Reconcile VAT input tax",
  "description_md": "...",
  "priority": "3",
  "due_date": "2025-12-18",
  "created_at": "2025-12-11T08:30:00+08:00",
  "updated_at": "2025-12-15T14:20:00+08:00",
  "owners": [...],
  "watchers": [...],
  "tags": ["tag:1"],
  "parent_id": null,
  "subtask_ids": [],
  "checklist": [...],
  "dependencies": [...],
  "sequence": 1
}
```

---

### 5. Create Card

Create a new card (task).

**Endpoint:** `POST /cards`

**Request Body:**
```json
{
  "board_id": "project:42",
  "stage_id": "stage:20",
  "title": "New task",
  "description_md": "Task description in markdown",
  "priority": "2",
  "due_date": "2025-12-25",
  "owners": [1202],
  "tags": ["tag:1", "tag:2"],
  "parent_id": null
}
```

**Required Fields:**
- `board_id`
- `stage_id`
- `title`

**Optional Fields:**
- `description_md`
- `priority` (default: "1")
- `due_date`
- `owners` (array of partner_ids)
- `tags` (array of tag_ids)
- `parent_id`

**Response:** `201 Created`
```json
{
  "card": {
    "card_id": "task:9010",
    "board_id": "project:42",
    "stage_id": "stage:20",
    "title": "New task",
    "description_md": "Task description in markdown",
    "priority": "2",
    "due_date": "2025-12-25",
    "created_at": "2025-12-15T15:30:00+08:00",
    "updated_at": "2025-12-15T15:30:00+08:00",
    "owners": [...],
    "watchers": [...],
    "tags": ["tag:1", "tag:2"],
    "parent_id": null,
    "subtask_ids": []
  }
}
```

**Error:** `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {
      "field": "title"
    }
  }
}
```

---

### 6. Update Card

Update an existing card. Only provided fields will be updated (partial update).

**Endpoint:** `PATCH /cards/{card_id}`

**Path Parameters:**
- `card_id` (string): Card ID

**Request Body:**
```json
{
  "title": "Updated title",
  "stage_id": "stage:40",
  "priority": "3",
  "due_date": "2025-12-20",
  "tags": ["tag:1", "tag:3"]
}
```

**Updatable Fields:**
- `title`
- `description_md`
- `stage_id` (triggers stage change activity)
- `priority`
- `due_date`
- `owners` (array of partner_ids)
- `tags` (array of tag_ids)
- `checklist`

**Response:** `200 OK`
```json
{
  "card": {
    "card_id": "task:9004",
    "title": "Updated title",
    "stage_id": "stage:40",
    "priority": "3",
    "due_date": "2025-12-20",
    "updated_at": "2025-12-15T16:00:00+08:00",
    ...
  }
}
```

**Error:** `404 Not Found`
```json
{
  "error": {
    "code": "CARD_NOT_FOUND",
    "message": "Card not found or access denied"
  }
}
```

---

### 7. Delete Card

Delete a card (archive in Odoo).

**Endpoint:** `DELETE /cards/{card_id}`

**Path Parameters:**
- `card_id` (string): Card ID

**Request:**
```http
DELETE /cards/task:9004
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Error:** `403 Forbidden`
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to delete this card"
  }
}
```

---

### 8. Get Card Activity

Get activity history (comments, stage changes, field updates) for a card.

**Endpoint:** `GET /cards/{card_id}/activity`

**Path Parameters:**
- `card_id` (string): Card ID

**Query Parameters:**
- `type` (string, optional): Filter by activity type (comment, stage_change, field_update, assignment, mention)
- `page` (integer, optional): Page number, default: 0
- `limit` (integer, optional): Items per page, default: 50

**Request:**
```http
GET /cards/task:9004/activity?type=comment&page=0&limit=50
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "activities": [
    {
      "event_id": "msg:771",
      "type": "comment",
      "author": {
        "partner_id": 1201,
        "email": "maria.santos@company.com",
        "name": "Maria Santos"
      },
      "body_md": "Please confirm totals by EOD @juan.cruz@company.com",
      "mentions": [
        {
          "email": "juan.cruz@company.com",
          "partner_id": 1202
        }
      ],
      "created_at": "2025-12-15T10:20:00+08:00"
    },
    {
      "event_id": "msg:770",
      "type": "stage_change",
      "author": {...},
      "metadata": {
        "field_name": "stage_id",
        "old_value": "To Do",
        "new_value": "Doing"
      },
      "created_at": "2025-12-15T09:00:00+08:00"
    }
  ],
  "total": 5,
  "page": 0,
  "limit": 50
}
```

---

### 9. Create Comment

Add a comment to a card. Supports @mentions.

**Endpoint:** `POST /cards/{card_id}/comments`

**Path Parameters:**
- `card_id` (string): Card ID

**Request Body:**
```json
{
  "body_md": "This is a comment with @juan.cruz@company.com mention",
  "mentions": ["juan.cruz@company.com"]
}
```

**Required Fields:**
- `body_md`

**Optional Fields:**
- `mentions` (array of email addresses)

**Response:** `201 Created`
```json
{
  "activity": {
    "event_id": "msg:772",
    "type": "comment",
    "author": {
      "partner_id": 1201,
      "email": "maria.santos@company.com",
      "name": "Maria Santos"
    },
    "body_md": "This is a comment with @juan.cruz@company.com mention",
    "mentions": [
      {
        "email": "juan.cruz@company.com",
        "partner_id": 1202
      }
    ],
    "created_at": "2025-12-15T16:30:00+08:00"
  }
}
```

**Side Effects:**
- Creates `mail.message` record linked to task
- Adds mentioned partners as followers (if not already)
- Sends notification to mentioned users

---

### 10. Create Board

Create a new board (project).

**Endpoint:** `POST /boards`

**Request Body:**
```json
{
  "name": "Q1 2026 Planning",
  "description": "Planning board for Q1 2026",
  "visibility": "team"
}
```

**Required Fields:**
- `name`

**Optional Fields:**
- `description`
- `visibility` (default: "team")

**Response:** `201 Created`
```json
{
  "board": {
    "board_id": "project:43",
    "name": "Q1 2026 Planning",
    "owner": {...},
    "visibility": "team",
    "members": [...],
    "stages": [...],
    "tags": [],
    "description": "Planning board for Q1 2026",
    "created_at": "2025-12-15T17:00:00+08:00",
    "updated_at": "2025-12-15T17:00:00+08:00"
  }
}
```

---

### 11. Update Board

Update board settings.

**Endpoint:** `PATCH /boards/{board_id}`

**Request Body:**
```json
{
  "name": "Updated Board Name",
  "description": "Updated description",
  "visibility": "private"
}
```

**Response:** `200 OK`

---

### 12. Add Board Member

Add a member to a board.

**Endpoint:** `POST /boards/{board_id}/members`

**Request Body:**
```json
{
  "partner_id": 1203,
  "role": "contributor"
}
```

**Required Fields:**
- `partner_id`
- `role` (admin, manager, contributor, viewer)

**Response:** `201 Created`

---

### 13. Remove Board Member

Remove a member from a board.

**Endpoint:** `DELETE /boards/{board_id}/members/{partner_id}`

**Response:** `204 No Content`

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "additional": "context"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `BOARD_NOT_FOUND` | 404 | Board does not exist or user has no access |
| `CARD_NOT_FOUND` | 404 | Card does not exist or user has no access |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `PERMISSION_DENIED` | 403 | User does not have required permission |
| `UNAUTHORIZED` | 401 | Authentication required or failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

Rate limits apply per API key:

- **Read operations:** 1000 requests/minute
- **Write operations:** 100 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1702654800
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```
?page=0&limit=20
```

**Response includes:**
```json
{
  "items": [...],
  "total": 150,
  "page": 0,
  "limit": 20
}
```

Calculate total pages: `Math.ceil(total / limit)`

---

## Filtering & Search

### Card Filters

Filters can be combined:

```
GET /boards/project:42/cards?stage=stage:30&tag=tag:1&owner=juan.cruz@company.com&q=VAT
```

### Search Query (`q` parameter)

Searches in:
- Card title
- Card description
- Comment body

Case-insensitive, partial match.

---

## Webhooks (Optional)

Subscribe to events for automation.

### Event Types

- `card.created`
- `card.updated`
- `card.deleted`
- `card.stage_changed`
- `comment.created`
- `board.created`

### Webhook Payload

```json
{
  "event": "card.updated",
  "timestamp": "2025-12-15T16:00:00+08:00",
  "data": {
    "card_id": "task:9004",
    "board_id": "project:42",
    "changes": {
      "stage_id": {
        "old": "stage:30",
        "new": "stage:40"
      }
    }
  }
}
```

---

## Testing Endpoints

Use these for development/testing:

**Health Check:**
```
GET /health
```

**Schema Validation:**
```
POST /validate/board
POST /validate/card
POST /validate/activity
```

---

## Odoo Implementation Notes

### JSON-RPC Wrapper

If using Odoo's JSON-RPC instead of custom controllers:

```
POST /jsonrpc
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute",
    "args": ["database", user_id, "password", "project.task", "search_read", [...]]
  },
  "id": 1
}
```

Map to REST endpoints via API gateway or facade layer.

### Authentication

Use Odoo session cookies or token-based auth:

```python
@http.route('/api/boards', type='json', auth='user')
def list_boards(self):
    # request.env.user is authenticated user
    # request.env['project.project'] respects ACL automatically
    ...
```

---

## Next Steps

1. ✅ Review endpoint spec with backend team
2. ✅ Implement Odoo controllers matching this spec
3. ✅ Add JSON schema validation middleware
4. ✅ Set up API gateway (rate limiting, logging, auth)
5. ✅ Test with Postman/curl
6. ✅ Update frontend to use real endpoints
