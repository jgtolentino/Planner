# -*- coding: utf-8 -*-
"""
DTO Mapping Layer — Single Source of Truth

This module converts Odoo records → API contract DTOs.

CRITICAL: Controllers NEVER build JSON directly. They ALWAYS call these functions.

Mapping rules:
* project.project → Board
* project.task.type → Stage
* project.task → Card
* mail.message → Activity
* res.partner → Partner
"""

from odoo.http import request
import logging

_logger = logging.getLogger(__name__)

# Contract version (must match frontend CONTRACT_VERSION)
CONTRACT_VERSION = '1.0.0'

# Odoo color palette (int → hex)
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


def map_partner(partner):
    """Map res.partner → Partner DTO"""
    if not partner:
        return None
    
    return {
        'partner_id': partner.id,
        'email': partner.email or '',
        'name': partner.name or '',
        'avatar_url': None,  # TODO: convert image_128 to URL
    }


def map_stage(stage):
    """Map project.task.type → Stage DTO"""
    if not stage:
        return None
    
    return {
        'stage_id': f'stage:{stage.id}',
        'name': stage.name,
        'order': stage.sequence,
        'wip_limit': None,  # TODO: OCA extension or custom field
        'fold': stage.fold if hasattr(stage, 'fold') else False,
    }


def map_tag(tag):
    """Map project.tags → Tag DTO"""
    if not tag:
        return None
    
    # Convert Odoo color int to hex
    color_hex = ODOO_COLORS.get(tag.color, '#C0C0C0') if hasattr(tag, 'color') else None
    
    return {
        'tag_id': f'tag:{tag.id}',
        'name': tag.name,
        'color': color_hex,
    }


def map_board(project):
    """Map project.project → Board DTO"""
    if not project:
        return None
    
    # Map owner (project manager)
    owner = map_partner(project.user_id.partner_id) if project.user_id else None
    if not owner:
        # Fallback to creator
        owner = map_partner(project.create_uid.partner_id)
    
    # Map members
    # TODO: map project members with roles (requires project.member or custom)
    members = []
    if owner:
        members.append({
            **owner,
            'role': 'manager',
        })
    
    # Map stages
    stages = [map_stage(stage) for stage in project.type_ids]
    
    # Map tags (tags are at task level, but we can aggregate board-level tags)
    # For now, return empty array - frontend will populate from cards
    tags = []
    
    return {
        'board_id': f'project:{project.id}',
        'name': project.name,
        'owner': owner,
        'visibility': 'team',  # TODO: map project.privacy_visibility
        'members': members,
        'stages': stages,
        'tags': tags,
        'description': project.description or '',
        'created_at': project.create_date.isoformat() if project.create_date else '',
        'updated_at': project.write_date.isoformat() if project.write_date else '',
    }


def map_board_with_card_counts(project):
    """Map project.project → Board DTO with card_counts"""
    board = map_board(project)
    
    if not board:
        return None
    
    # Count cards per stage
    card_counts = {}
    for stage in project.type_ids:
        count = request.env['project.task'].search_count([
            ('project_id', '=', project.id),
            ('stage_id', '=', stage.id),
        ])
        card_counts[f'stage:{stage.id}'] = count
    
    board['card_counts'] = card_counts
    return board


def map_card(task):
    """Map project.task → Card DTO"""
    if not task:
        return None
    
    # Map owners (CE: single user_id, OCA: user_ids)
    owners = []
    if task.user_id:
        owners.append(map_partner(task.user_id.partner_id))
    
    # Map watchers (followers)
    watchers = [map_partner(f.partner_id) for f in task.message_follower_ids]
    
    # Map tags
    tags = [f'tag:{tag.id}' for tag in task.tag_ids]
    
    # Map subtasks
    subtask_ids = [f'task:{child.id}' for child in task.child_ids]
    
    # Map parent
    parent_id = f'task:{task.parent_id.id}' if task.parent_id else None
    
    # TODO: Map checklist (OCA extension)
    checklist = None
    
    # TODO: Map dependencies (OCA extension)
    dependencies = None
    
    return {
        'card_id': f'task:{task.id}',
        'board_id': f'project:{task.project_id.id}',
        'stage_id': f'stage:{task.stage_id.id}' if task.stage_id else None,
        'title': task.name,
        'description_md': task.description or '',
        'priority': str(task.priority) if task.priority else '1',
        'due_date': task.date_deadline.isoformat() if task.date_deadline else None,
        'created_at': task.create_date.isoformat() if task.create_date else '',
        'updated_at': task.write_date.isoformat() if task.write_date else '',
        'owners': owners,
        'watchers': watchers,
        'tags': tags,
        'parent_id': parent_id,
        'subtask_ids': subtask_ids,
        'checklist': checklist,
        'dependencies': dependencies,
        'sequence': task.sequence if hasattr(task, 'sequence') else 0,
    }


def map_activity(message, task=None):
    """Map mail.message → Activity DTO"""
    if not message:
        return None
    
    # Determine activity type from message
    activity_type = 'comment'
    metadata = {}
    
    if message.message_type == 'notification':
        # Check subtype to determine if it's a stage change, field update, etc.
        if message.subtype_id:
            subtype_name = message.subtype_id.name.lower()
            if 'stage' in subtype_name:
                activity_type = 'stage_change'
                # Extract old/new values from tracking_value_ids
                for tracking in message.tracking_value_ids:
                    if tracking.field == 'stage_id':
                        metadata = {
                            'field_name': 'stage_id',
                            'old_value': tracking.old_value_char or '',
                            'new_value': tracking.new_value_char or '',
                        }
            elif 'assign' in subtype_name:
                activity_type = 'assignment'
            else:
                activity_type = 'field_update'
    
    # Parse mentions from body
    mentions = []
    if message.partner_ids:
        for partner in message.partner_ids:
            if partner.email:
                mentions.append({
                    'email': partner.email,
                    'partner_id': partner.id,
                })
    
    return {
        'event_id': f'msg:{message.id}',
        'type': activity_type,
        'author': map_partner(message.author_id),
        'body_md': message.body or '',
        'mentions': mentions if mentions else None,
        'metadata': metadata if metadata else None,
        'created_at': message.create_date.isoformat() if message.create_date else '',
    }
