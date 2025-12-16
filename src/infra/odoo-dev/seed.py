#!/usr/bin/env python3
"""
Seed test data in Odoo (IDEMPOTENT)
Run via: docker exec odoo-app odoo shell -d odoo < seed.py
"""

import sys

# ============================================================================
# Seed Data Configuration
# ============================================================================

BOARD_NAME = "Finance SSC Month-End"
BOARD_XMLID = "ipai_taskboard_seed.project_finance_ssc"

STAGES = [
    {"name": "Backlog", "sequence": 10, "xmlid": "ipai_taskboard_seed.stage_backlog"},
    {"name": "To Do", "sequence": 20, "xmlid": "ipai_taskboard_seed.stage_todo"},
    {"name": "Doing", "sequence": 30, "xmlid": "ipai_taskboard_seed.stage_doing"},
    {"name": "Review", "sequence": 40, "xmlid": "ipai_taskboard_seed.stage_review"},
    {"name": "Done", "sequence": 50, "xmlid": "ipai_taskboard_seed.stage_done"},
]

USERS = [
    {
        "name": "Maria Santos",
        "login": "maria.santos@company.com",
        "email": "maria.santos@company.com",
        "xmlid": "ipai_taskboard_seed.user_maria",
    },
    {
        "name": "Juan Cruz",
        "login": "juan.cruz@company.com",
        "email": "juan.cruz@company.com",
        "xmlid": "ipai_taskboard_seed.user_juan",
    },
    {
        "name": "Ana Reyes",
        "login": "ana.reyes@company.com",
        "email": "ana.reyes@company.com",
        "xmlid": "ipai_taskboard_seed.user_ana",
    },
]

TASKS = [
    {
        "name": "Reconcile VAT input tax",
        "stage_index": 2,  # Doing
        "user_index": 1,   # Juan Cruz
        "description": "Reconcile VAT input tax for December",
        "priority": "2",
        "xmlid": "ipai_taskboard_seed.task_vat_reconcile",
    },
    {
        "name": "Process payroll for December",
        "stage_index": 3,  # Review
        "user_index": 2,   # Ana Reyes
        "description": "Complete payroll processing",
        "priority": "2",
        "xmlid": "ipai_taskboard_seed.task_payroll",
    },
    {
        "name": "Submit BIR Form 2550M",
        "stage_index": 4,  # Done
        "user_index": 1,   # Juan Cruz
        "description": "Submit monthly VAT return",
        "priority": "1",
        "xmlid": "ipai_taskboard_seed.task_bir_form",
    },
]

# ============================================================================
# Seed Script (IDEMPOTENT via XML IDs)
# ============================================================================

print("=" * 60)
print("SEEDING TEST DATA (IDEMPOTENT)")
print("=" * 60)

# Check if we're in Odoo shell context
if 'env' not in dir():
    print("ERROR: This script must be run via Odoo shell")
    print("Usage: docker exec odoo-app odoo shell -d odoo < seed.py")
    sys.exit(1)

IrModelData = env['ir.model.data']

# Helper function: Get or create by XML ID
def get_or_create(model_name, xmlid, values):
    """Get existing record by XML ID or create new one"""
    module, name = xmlid.split('.')
    existing = IrModelData.search([
        ('module', '=', module),
        ('name', '=', name),
        ('model', '=', model_name),
    ], limit=1)
    
    if existing:
        record = env[model_name].browse(existing.res_id)
        if record.exists():
            return record, False  # False = not created
    
    # Create new record
    record = env[model_name].create(values)
    
    # Create XML ID reference
    IrModelData.create({
        'module': module,
        'name': name,
        'model': model_name,
        'res_id': record.id,
    })
    
    return record, True  # True = created

# ============================================================================
# 1. Create users and partners
# ============================================================================

print("\n[1/5] Creating users and partners...")
created_users = []
for user_data in USERS:
    # Check by login first (XML ID might not exist)
    existing_user = env['res.users'].search([('login', '=', user_data['login'])], limit=1)
    if existing_user:
        print(f"  ✓ User exists: {user_data['login']} (ID: {existing_user.id})")
        created_users.append(existing_user)
        
        # Ensure XML ID exists for future idempotency
        module, name = user_data['xmlid'].split('.')
        existing_xmlid = IrModelData.search([
            ('module', '=', module),
            ('name', '=', name),
            ('model', '=', 'res.users'),
        ], limit=1)
        if not existing_xmlid:
            IrModelData.create({
                'module': module,
                'name': name,
                'model': 'res.users',
                'res_id': existing_user.id,
            })
        continue
    
    # Create partner
    partner = env['res.partner'].create({
        'name': user_data['name'],
        'email': user_data['email'],
        'type': 'contact',
    })
    
    # Create user
    user = env['res.users'].create({
        'name': user_data['name'],
        'login': user_data['login'],
        'email': user_data['email'],
        'partner_id': partner.id,
        'groups_id': [(6, 0, [
            env.ref('base.group_user').id,
            env.ref('project.group_project_user').id,
        ])],
    })
    
    # Create XML ID
    module, name = user_data['xmlid'].split('.')
    IrModelData.create({
        'module': module,
        'name': name,
        'model': 'res.users',
        'res_id': user.id,
    })
    
    created_users.append(user)
    print(f"  ✓ Created user: {user_data['login']} (ID: {user.id})")

env.cr.commit()

# ============================================================================
# 2. Create project (board)
# ============================================================================

print("\n[2/5] Creating project (board)...")
project, created = get_or_create('project.project', BOARD_XMLID, {
    'name': BOARD_NAME,
    'user_id': created_users[0].id,  # Maria Santos as manager
    'privacy_visibility': 'employees',
})

if created:
    print(f"  ✓ Created project: {BOARD_NAME} (ID: {project.id})")
else:
    print(f"  ✓ Project exists: {BOARD_NAME} (ID: {project.id})")

env.cr.commit()

# ============================================================================
# 3. Create stages
# ============================================================================

print("\n[3/5] Creating stages...")
created_stages = []
for stage_data in STAGES:
    stage, created = get_or_create('project.task.type', stage_data['xmlid'], {
        'name': stage_data['name'],
        'sequence': stage_data['sequence'],
    })
    created_stages.append(stage)
    
    if created:
        print(f"  ✓ Created stage: {stage_data['name']} (ID: {stage.id})")
    else:
        print(f"  ✓ Stage exists: {stage_data['name']} (ID: {stage.id})")

# Link stages to project (idempotent)
current_stage_ids = set(project.type_ids.ids)
required_stage_ids = set([s.id for s in created_stages])

if current_stage_ids != required_stage_ids:
    project.write({'type_ids': [(6, 0, list(required_stage_ids))]})
    print(f"  ✓ Updated project stages")

env.cr.commit()

# ============================================================================
# 4. Create tasks
# ============================================================================

print("\n[4/5] Creating tasks...")
created_tasks = []
for task_data in TASKS:
    task, created = get_or_create('project.task', task_data['xmlid'], {
        'name': task_data['name'],
        'project_id': project.id,
        'stage_id': created_stages[task_data['stage_index']].id,
        'user_id': created_users[task_data['user_index']].id,
        'description': task_data.get('description', ''),
        'priority': task_data.get('priority', '1'),
    })
    created_tasks.append(task)
    
    if created:
        print(f"  ✓ Created task: {task_data['name']} (ID: {task.id})")
    else:
        print(f"  ✓ Task exists: {task_data['name']} (ID: {task.id})")

env.cr.commit()

# ============================================================================
# 5. Create comment with mention (idempotent)
# ============================================================================

print("\n[5/5] Creating comment with mention...")
if created_tasks:
    task = created_tasks[0]  # First task
    mentioned_email = "juan.cruz@company.com"
    
    # Check if comment already exists
    existing_message = env['mail.message'].search([
        ('model', '=', 'project.task'),
        ('res_id', '=', task.id),
        ('body', 'ilike', f'%{mentioned_email}%'),
    ], limit=1)
    
    if existing_message:
        print(f"  ✓ Comment with mention already exists (ID: {existing_message.id})")
    else:
        # Find mentioned partner
        mentioned_partner = env['res.partner'].search([('email', '=', mentioned_email)], limit=1)
        
        if mentioned_partner:
            # Post message
            task.message_post(
                body=f"Please confirm totals by EOD @{mentioned_email}",
                message_type='comment',
                subtype_xmlid='mail.mt_comment',
                partner_ids=[mentioned_partner.id],
            )
            print(f"  ✓ Posted comment with mention to: {mentioned_email}")
        else:
            print(f"  ✗ Partner not found for: {mentioned_email}")

env.cr.commit()

# ============================================================================
# Summary
# ============================================================================

print("\n" + "=" * 60)
print("SEED DATA SUMMARY")
print("=" * 60)
print(f"Project:   {project.name} (project:{project.id})")
print(f"Stages:    {len(created_stages)}")
for stage in created_stages:
    print(f"  - {stage.name} (stage:{stage.id})")
print(f"Users:     {len(created_users)}")
for user in created_users:
    print(f"  - {user.login}")
print(f"Tasks:     {len(created_tasks)}")
for task in created_tasks:
    print(f"  - {task.name} (task:{task.id})")
print("=" * 60)
print("✓ SEEDING COMPLETE (IDEMPOTENT)")
print("=" * 60)
