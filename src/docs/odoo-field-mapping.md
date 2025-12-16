# Odoo CE + OCA 18 Field Mapping

This document maps the API contract fields to exact Odoo model fields.

## Board → project.project

| API Field | Odoo Field | Type | Notes |
|-----------|-----------|------|-------|
| `board_id` | `id` | Integer | Use pattern `project:{id}` in API |
| `name` | `name` | Char | Project name |
| `owner` | `user_id` | Many2one(res.users) | Project manager |
| `visibility` | Custom field or record rules | Selection | Map to `privacy_visibility` or custom |
| `members` | `member_ids` | Many2many(res.users) via project.member | Project members with roles |
| `stages` | `type_ids` | Many2many(project.task.type) | Available task types/stages |
| `tags` | Via project.tags | — | Tags are at task level, not project |
| `description` | `description` | Html/Text | Project description |
| `created_at` | `create_date` | Datetime | Auto |
| `updated_at` | `write_date` | Datetime | Auto |

### Member Roles Mapping

| API Role | Odoo Access Level | Implementation |
|----------|------------------|----------------|
| `admin` | Project Manager + admin group | `project.group_project_manager` |
| `manager` | Project Manager | `user_id` on project |
| `contributor` | Project User | `project.group_project_user` |
| `viewer` | Portal User or limited access | `base.group_portal` with read-only rules |

## Stage → project.task.type

| API Field | Odoo Field | Type | Notes |
|-----------|-----------|------|-------|
| `stage_id` | `id` | Integer | Use pattern `stage:{id}` |
| `name` | `name` | Char | Stage name |
| `order` | `sequence` | Integer | Display order |
| `wip_limit` | Custom field | Integer | OCA extension or custom |
| `fold` | `fold` | Boolean | Collapsed in Kanban view |

## Card → project.task

| API Field | Odoo Field | Type | Notes |
|-----------|-----------|------|-------|
| `card_id` | `id` | Integer | Use pattern `task:{id}` |
| `board_id` | `project_id` | Many2one(project.project) | Parent project |
| `stage_id` | `stage_id` | Many2one(project.task.type) | Current stage |
| `title` | `name` | Char | Task name |
| `description_md` | `description` | Html/Text | Store as markdown or HTML |
| `priority` | `priority` | Selection | '0','1','2','3' (low/normal/high/urgent) |
| `due_date` | `date_deadline` | Date | Due date |
| `created_at` | `create_date` | Datetime | Auto |
| `updated_at` | `write_date` | Datetime | Auto |
| `owners` | `user_ids` (OCA) or `user_id` (CE) | Many2many or Many2one | CE: single assignee; OCA: multi-assignee |
| `watchers` | Via `mail.followers` | Many2many(res.partner) | Followers on task |
| `tags` | `tag_ids` | Many2many(project.tags) | Task tags |
| `parent_id` | `parent_id` | Many2one(project.task) | Parent task for subtasks |
| `subtask_ids` | `child_ids` | One2many(project.task) | Child subtasks |
| `checklist` | Custom / OCA | One2many | OCA module: project_task_checklist or similar |
| `dependencies` | Custom / OCA | Many2many | OCA module: project_task_dependency or similar |
| `sequence` | `sequence` | Integer | Order within stage |

### Priority Mapping

| API Value | Odoo Value | Label |
|-----------|-----------|-------|
| `'0'` | `'0'` | Low |
| `'1'` | `'1'` | Normal |
| `'2'` | `'2'` | High |
| `'3'` | `'3'` | Urgent |

## Partner → res.partner

| API Field | Odoo Field | Type | Notes |
|-----------|-----------|------|-------|
| `partner_id` | `id` | Integer | Partner ID |
| `email` | `email` | Char | Canonical identity |
| `name` | `name` | Char | Display name |
| `avatar_url` | `image_128` or custom | Binary → URL | Convert binary image to URL |

## User → res.users

| API Field | Odoo Field | Type | Notes |
|-----------|-----------|------|-------|
| `user_id` | `id` | Integer | User ID (optional if partner has no login) |
| All Partner fields | Inherited from res.partner | — | res.users inherits res.partner |

## Activity → mail.message

| API Field | Odoo Field | Type | Notes |
|-----------|-----------|------|-------|
| `event_id` | `id` | Integer | Use pattern `msg:{id}` |
| `type` | `message_type` + subtype | Selection | Map: comment, notification, etc. |
| `author` | `author_id` | Many2one(res.partner) | Message author |
| `body_md` | `body` | Html/Text | Store markdown or convert to HTML |
| `mentions` | Via `partner_ids` | Many2many(res.partner) | Mentioned partners |
| `metadata` | Custom JSON field or tracking | — | Use `tracking_value_ids` for field changes |
| `created_at` | `create_date` | Datetime | Auto |

### Activity Type Mapping

| API Type | Odoo Message Type | Odoo Subtype | Notes |
|----------|------------------|-------------|-------|
| `comment` | `comment` | `mt_comment` | User comment |
| `stage_change` | `notification` | `mt_task_stage` | Stage change tracking |
| `field_update` | `notification` | Custom or `mt_task_*` | Field update tracking |
| `assignment` | `notification` | `mt_task_assigned` | Assignment notification |
| `mention` | `comment` | `mt_comment` | Comment with mention |

## Tag → project.tags

| API Field | Odoo Field | Type | Notes |
|-----------|-----------|------|-------|
| `tag_id` | `id` | Integer | Use pattern `tag:{id}` |
| `name` | `name` | Char | Tag name |
| `color` | `color` | Integer | Odoo uses int color index; map to hex |

### Color Mapping

Odoo stores colors as integers (0-11). Map to hex colors in API response:

```python
ODOO_COLORS = {
    0: '#F06050',  # Red
    1: '#F4A460',  # Orange
    2: '#F7CD1F',  # Yellow
    3: '#6CC1ED',  # Light Blue
    4: '#814968',  # Dark Purple
    5: '#EB7E7F',  # Salmon
    6: '#2C8397',  # Teal
    7: '#475577',  # Dark Blue
    8: '#D6145F',  # Pink
    9: '#30C381',  # Green
    10: '#9365B8', # Purple
    11: '#C0C0C0', # Gray
}
```

## OCA Extensions

### Multi-Assignee (project_task_multi_assign or similar)

- **CE:** `user_id` (Many2one) — single assignee
- **OCA:** `user_ids` (Many2many) — multiple assignees
- **API:** Always return `owners` as array for consistency

### Checklist (project_task_checklist)

```python
class ProjectTaskChecklistItem(models.Model):
    _name = 'project.task.checklist.item'
    
    task_id = fields.Many2one('project.task')
    name = fields.Char()  # checklist item text
    is_done = fields.Boolean()
    sequence = fields.Integer()
```

Map to API:
```typescript
{
  id: "c1",          // checklist item ID
  text: "...",       // name
  done: true/false,  // is_done
  order: 1           // sequence
}
```

### Dependencies (project_task_dependency)

```python
class ProjectTaskDependency(models.Model):
    _name = 'project.task.dependency'
    
    task_id = fields.Many2one('project.task')
    depends_on_id = fields.Many2one('project.task')
    dependency_type = fields.Selection([
        ('blocks', 'Blocks'),
        ('blocked_by', 'Blocked By'),
        ('relates_to', 'Relates To'),
    ])
```

Map to API:
```typescript
{
  type: "blocks" | "blocked_by" | "relates_to",
  task_id: "task:123"  // depends_on_id
}
```

## Record Rules & ACL

### Board Access

Controlled by `project.project` access rules:

- **Private:** Only members can access
- **Team:** All internal users can read
- **Public:** Portal users can read (limited fields)

### Card Access

Inherits from parent project access + task-specific rules:

- Users can only see/edit tasks in projects they're members of
- Portal users see only tasks they're assigned to or following

### Comment/Activity Access

Controlled by `mail.message` access rules:

- Followers can read all messages on task
- Only message author or project manager can edit/delete

## API Endpoint Implementation

### Odoo Controller Example

```python
from odoo import http
from odoo.http import request
import json

class KanbanAPIController(http.Controller):
    
    @http.route('/api/boards/<int:board_id>', 
                type='json', auth='user', methods=['GET'])
    def get_board(self, board_id):
        project = request.env['project.project'].browse(board_id)
        project.check_access_rights('read')
        project.check_access_rule('read')
        
        return {
            'board_id': f'project:{project.id}',
            'name': project.name,
            'owner': self._serialize_partner(project.user_id.partner_id),
            'members': [
                {**self._serialize_partner(m.partner_id), 'role': m.role}
                for m in project.member_ids
            ],
            'stages': [
                self._serialize_stage(s) for s in project.type_ids
            ],
            # ... etc
        }
    
    def _serialize_partner(self, partner):
        return {
            'partner_id': partner.id,
            'email': partner.email,
            'name': partner.name,
        }
```

## Field Validation Rules

### Required Fields

| Model | Required Fields (Odoo) |
|-------|----------------------|
| project.project | `name` |
| project.task | `name`, `project_id` |
| project.task.type | `name` |
| mail.message | `model`, `res_id`, `body` or `subject` |
| res.partner | `name` |

### Field Constraints

- **Email:** Must be valid email format (Odoo validates)
- **Priority:** Must be in `['0','1','2','3']`
- **Dates:** ISO 8601 format
- **IDs:** Positive integers

## Migration Notes

If migrating from prototype UI to Odoo backend:

1. ✅ ID format changes: `"task-123"` → `"task:123"`
2. ✅ Date format: ensure ISO 8601 with timezone
3. ✅ Owner field: single object → array (for OCA multi-assign compat)
4. ✅ Activity types: ensure Odoo subtypes are created
5. ✅ Colors: convert Odoo int → hex in API response

## Testing Checklist

- [ ] Create board → verify `project.project` record created
- [ ] Create card → verify `project.task` with correct `project_id`
- [ ] Move card stage → verify `stage_id` updated + `mail.message` created
- [ ] Add comment → verify `mail.message` with type `comment`
- [ ] Mention user → verify `mail.followers` record + notification sent
- [ ] Update checklist → verify OCA checklist items updated
- [ ] Add dependency → verify OCA dependency record created
- [ ] Filter by stage/tag/owner → verify Odoo domain search works
- [ ] RBAC: verify non-member cannot read private board
- [ ] RBAC: verify viewer cannot edit card
