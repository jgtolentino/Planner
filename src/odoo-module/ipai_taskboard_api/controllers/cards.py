# -*- coding: utf-8 -*-
"""
Card Controller — GET/POST/PATCH cards

Canonical mapping: project.task → Card DTO

Security:
* All endpoints enforce Odoo ACL + record rules
* Stage move triggers mail.message (audit trail)
"""

from odoo import http
from odoo.http import request
from ..services.mapping import (
    map_card,
    CONTRACT_VERSION,
)
from ..services.auth import require_auth
import logging

_logger = logging.getLogger(__name__)


class CardController(http.Controller):
    """Card endpoints (project.task)"""

    @http.route('/api/v1/boards/<string:board_id>/cards', type='json', auth='user', methods=['GET'], csrf=False)
    def list_cards(self, board_id, stage=None, tag=None, owner=None, due_from=None, due_to=None, q=None, page=0, limit=100):
        """
        List cards with filters
        
        Query params:
            stage (str): Filter by stage_id
            tag (str): Filter by tag_id
            owner (str): Filter by owner email or partner_id
            due_from (str): Filter by due date from
            due_to (str): Filter by due date to
            q (str): Search query
            page (int): Page number
            limit (int): Items per page
        
        Returns:
            {
                "cards": [Card, ...],
                "total": int,
                "page": int,
                "limit": int
            }
        """
        require_auth()
        
        try:
            # Parse board_id
            if not board_id.startswith('project:'):
                return {
                    'error': {
                        'code': 'INVALID_BOARD_ID',
                        'message': f'Invalid board_id format: {board_id}',
                    }
                }
            
            project_id = int(board_id.split(':')[1])
            
            # Build domain
            domain = [('project_id', '=', project_id)]
            
            # Filter by stage
            if stage:
                if stage.startswith('stage:'):
                    stage_id = int(stage.split(':')[1])
                    domain.append(('stage_id', '=', stage_id))
            
            # Filter by tag
            if tag:
                if tag.startswith('tag:'):
                    tag_id = int(tag.split(':')[1])
                    domain.append(('tag_ids', 'in', [tag_id]))
            
            # Filter by owner
            if owner:
                if '@' in owner:
                    # Email lookup
                    partner = request.env['res.partner'].search([('email', '=', owner)], limit=1)
                    if partner:
                        domain.append(('user_id.partner_id', '=', partner.id))
                else:
                    # Partner ID
                    try:
                        partner_id = int(owner)
                        domain.append(('user_id.partner_id', '=', partner_id))
                    except ValueError:
                        pass
            
            # Filter by due date range
            if due_from:
                domain.append(('date_deadline', '>=', due_from))
            if due_to:
                domain.append(('date_deadline', '<=', due_to))
            
            # Search query (title/description)
            if q:
                domain.append('|')
                domain.append(('name', 'ilike', q))
                domain.append(('description', 'ilike', q))
            
            # Fetch tasks (ACL enforced)
            Task = request.env['project.task']
            offset = page * limit
            tasks = Task.search(domain, offset=offset, limit=limit, order='sequence,id')
            total_count = Task.search_count(domain)
            
            # Map to DTOs
            cards = [map_card(task) for task in tasks]
            
            response = {
                'cards': cards,
                'total': total_count,
                'page': page,
                'limit': limit,
            }
            
            # Add contract version header
            request.httprequest.environ['HTTP_X_CONTRACT_VERSION'] = CONTRACT_VERSION
            
            _logger.info(f"User {request.env.user.id} listed {len(cards)} cards for board {board_id}")
            return response
            
        except Exception as e:
            _logger.error(f"Error listing cards: {str(e)}", exc_info=True)
            return {
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e),
                }
            }

    @http.route('/api/v1/cards/<string:card_id>', type='json', auth='user', methods=['GET'], csrf=False)
    def get_card(self, card_id):
        """Get card detail"""
        require_auth()
        
        try:
            # Parse card_id: "task:123" → 123
            if not card_id.startswith('task:'):
                return {
                    'error': {
                        'code': 'INVALID_CARD_ID',
                        'message': f'Invalid card_id format: {card_id}',
                    }
                }
            
            task_id = int(card_id.split(':')[1])
            
            # Fetch task (ACL enforced)
            Task = request.env['project.task']
            task = Task.browse(task_id)
            
            if not task.exists():
                return {
                    'error': {
                        'code': 'CARD_NOT_FOUND',
                        'message': 'Card not found or access denied',
                    }
                }
            
            # Check access
            task.check_access_rights('read')
            task.check_access_rule('read')
            
            # Map to DTO
            card = map_card(task)
            
            # Add contract version header
            request.httprequest.environ['HTTP_X_CONTRACT_VERSION'] = CONTRACT_VERSION
            
            return card
            
        except Exception as e:
            _logger.error(f"Error fetching card {card_id}: {str(e)}", exc_info=True)
            return {
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e),
                }
            }

    @http.route('/api/v1/cards', type='json', auth='user', methods=['POST'], csrf=False)
    def create_card(self, board_id, stage_id, title, description_md=None, priority='1', due_date=None, owners=None, tags=None, parent_id=None):
        """
        Create new card (project.task)
        
        Body:
            {
                "board_id": "project:42",
                "stage_id": "stage:20",
                "title": "Task title",
                "description_md": "Optional description",
                "priority": "1",
                "due_date": "2025-12-25",
                "owners": [1202],
                "tags": ["tag:1"],
                "parent_id": null
            }
        
        Returns:
            { "card": Card DTO }
        """
        require_auth()
        
        try:
            # Validate required fields
            if not title or not title.strip():
                return {
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Title is required',
                        'details': {'field': 'title'},
                    }
                }
            
            # Parse IDs
            project_id = int(board_id.split(':')[1])
            stage_id_int = int(stage_id.split(':')[1])
            
            # Prepare values
            vals = {
                'name': title.strip(),
                'project_id': project_id,
                'stage_id': stage_id_int,
                'priority': priority,
            }
            
            if description_md:
                vals['description'] = description_md
            
            if due_date:
                vals['date_deadline'] = due_date
            
            # Set owner (CE: single user_id)
            if owners and len(owners) > 0:
                # Find user by partner_id
                partner = request.env['res.partner'].browse(owners[0])
                if partner.user_ids:
                    vals['user_id'] = partner.user_ids[0].id
            
            # Set tags
            if tags:
                tag_ids = [int(tag.split(':')[1]) for tag in tags if tag.startswith('tag:')]
                vals['tag_ids'] = [(6, 0, tag_ids)]
            
            # Set parent
            if parent_id:
                vals['parent_id'] = int(parent_id.split(':')[1])
            
            # Create task
            Task = request.env['project.task']
            task = Task.create(vals)
            
            # Map to DTO
            card = map_card(task)
            
            # Add contract version header
            request.httprequest.environ['HTTP_X_CONTRACT_VERSION'] = CONTRACT_VERSION
            
            _logger.info(f"User {request.env.user.id} created card {task.id} in board {board_id}")
            return {'card': card}
            
        except Exception as e:
            _logger.error(f"Error creating card: {str(e)}", exc_info=True)
            return {
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e),
                }
            }

    @http.route('/api/v1/cards/<string:card_id>', type='json', auth='user', methods=['PATCH'], csrf=False)
    def update_card(self, card_id, title=None, description_md=None, stage_id=None, priority=None, due_date=None, owners=None, tags=None, checklist=None):
        """
        Update card (partial update)
        
        Body: Only fields to update
        
        Returns:
            { "card": Card DTO }
        """
        require_auth()
        
        try:
            # Parse card_id
            if not card_id.startswith('task:'):
                return {
                    'error': {
                        'code': 'INVALID_CARD_ID',
                        'message': f'Invalid card_id format: {card_id}',
                    }
                }
            
            task_id = int(card_id.split(':')[1])
            
            # Fetch task (ACL enforced)
            Task = request.env['project.task']
            task = Task.browse(task_id)
            
            if not task.exists():
                return {
                    'error': {
                        'code': 'CARD_NOT_FOUND',
                        'message': 'Card not found or access denied',
                    }
                }
            
            # Check write access
            task.check_access_rights('write')
            task.check_access_rule('write')
            
            # Build update values
            vals = {}
            
            if title is not None:
                vals['name'] = title.strip()
            
            if description_md is not None:
                vals['description'] = description_md
            
            if stage_id is not None:
                # Stage change triggers audit trail
                vals['stage_id'] = int(stage_id.split(':')[1])
            
            if priority is not None:
                vals['priority'] = priority
            
            if due_date is not None:
                vals['date_deadline'] = due_date if due_date else False
            
            if owners is not None and len(owners) > 0:
                partner = request.env['res.partner'].browse(owners[0])
                if partner.user_ids:
                    vals['user_id'] = partner.user_ids[0].id
            
            if tags is not None:
                tag_ids = [int(tag.split(':')[1]) for tag in tags if tag.startswith('tag:')]
                vals['tag_ids'] = [(6, 0, tag_ids)]
            
            # Update task
            task.write(vals)
            
            # Map to DTO
            card = map_card(task)
            
            # Add contract version header
            request.httprequest.environ['HTTP_X_CONTRACT_VERSION'] = CONTRACT_VERSION
            
            _logger.info(f"User {request.env.user.id} updated card {card_id}")
            return {'card': card}
            
        except Exception as e:
            _logger.error(f"Error updating card {card_id}: {str(e)}", exc_info=True)
            return {
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e),
                }
            }
