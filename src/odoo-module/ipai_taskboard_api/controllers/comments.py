# -*- coding: utf-8 -*-
"""
Comment Controller — POST /api/v1/cards/{id}/comments, GET /api/v1/cards/{id}/activity

Canonical mapping: mail.message → Activity DTO

Security:
* Mentions create mail.followers entries (email → partner)
* Notifications sent to mentioned partners
"""

from odoo import http
from odoo.http import request
from ..services.mapping import (
    map_activity,
    CONTRACT_VERSION,
)
from ..services.auth import require_auth
from ..services.mentions import parse_mentions, resolve_mentions
import logging
import re

_logger = logging.getLogger(__name__)


class CommentController(http.Controller):
    """Comment/Activity endpoints (mail.message)"""

    @http.route('/api/v1/cards/<string:card_id>/activity', type='json', auth='user', methods=['GET'], csrf=False)
    def get_card_activity(self, card_id, activity_type=None, page=0, limit=50):
        """
        Get activity history for a card
        
        Query params:
            activity_type (str): Filter by type (comment, stage_change, field_update, assignment, mention)
            page (int): Page number
            limit (int): Items per page
        
        Returns:
            {
                "activities": [Activity, ...],
                "total": int,
                "page": int,
                "limit": int
            }
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
            
            # Check read access
            task.check_access_rights('read')
            task.check_access_rule('read')
            
            # Build domain for messages
            domain = [
                ('model', '=', 'project.task'),
                ('res_id', '=', task_id),
            ]
            
            # Filter by type
            if activity_type:
                # Map API type to Odoo message_type/subtype
                # For now, simple filter on message_type
                if activity_type == 'comment':
                    domain.append(('message_type', '=', 'comment'))
                elif activity_type in ['stage_change', 'field_update', 'assignment']:
                    domain.append(('message_type', '=', 'notification'))
            
            # Fetch messages
            Message = request.env['mail.message']
            offset = page * limit
            messages = Message.search(domain, offset=offset, limit=limit, order='create_date desc')
            total_count = Message.search_count(domain)
            
            # Map to DTOs
            activities = [map_activity(msg, task) for msg in messages]
            
            response = {
                'activities': activities,
                'total': total_count,
                'page': page,
                'limit': limit,
            }
            
            # Add contract version header
            request.httprequest.environ['HTTP_X_CONTRACT_VERSION'] = CONTRACT_VERSION
            
            return response
            
        except Exception as e:
            _logger.error(f"Error fetching activity for card {card_id}: {str(e)}", exc_info=True)
            return {
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e),
                }
            }

    @http.route('/api/v1/cards/<string:card_id>/comments', type='json', auth='user', methods=['POST'], csrf=False)
    def create_comment(self, card_id, body_md, mentions=None):
        """
        Create comment on card with optional mentions
        
        Body:
            {
                "body_md": "Comment text with @email mentions",
                "mentions": ["juan.cruz@company.com"]
            }
        
        Returns:
            { "activity": Activity DTO }
        
        Side effects:
            - Creates mail.message
            - Adds mentioned partners as followers
            - Sends notifications to mentioned users
        """
        require_auth()
        
        try:
            # Validate body
            if not body_md or not body_md.strip():
                return {
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Comment body is required',
                        'details': {'field': 'body_md'},
                    }
                }
            
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
            
            # Check write access (posting comment requires write)
            task.check_access_rights('write')
            task.check_access_rule('write')
            
            # Parse mentions from body if not provided
            if not mentions:
                mentions = parse_mentions(body_md)
            
            # Resolve mentions to partner IDs
            mentioned_partner_ids = []
            if mentions:
                mentioned_partner_ids = resolve_mentions(mentions)
            
            # Post message using Odoo's mail system
            # This automatically creates mail.message and handles notifications
            message = task.message_post(
                body=body_md,
                message_type='comment',
                subtype_xmlid='mail.mt_comment',
                partner_ids=mentioned_partner_ids,  # This adds followers + notifies
            )
            
            # Map to DTO
            activity = map_activity(message, task)
            
            # Add contract version header
            request.httprequest.environ['HTTP_X_CONTRACT_VERSION'] = CONTRACT_VERSION
            
            _logger.info(
                f"User {request.env.user.id} commented on card {card_id}, "
                f"mentioned {len(mentioned_partner_ids)} partners"
            )
            
            return {'activity': activity}
            
        except Exception as e:
            _logger.error(f"Error creating comment on card {card_id}: {str(e)}", exc_info=True)
            return {
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e),
                }
            }
