# -*- coding: utf-8 -*-
"""
Board Controller — GET /api/v1/boards, GET /api/v1/boards/{id}

Canonical mapping: project.project → Board DTO

Security:
* All endpoints enforce Odoo ACL + record rules
* Returns only boards where current user is member or has access
"""

from odoo import http
from odoo.http import request
from ..services.mapping import (
    map_board,
    map_board_with_card_counts,
    CONTRACT_VERSION,
)
from ..services.auth import require_auth
from ..services.rbac import check_board_access
from ..services.security import (
    validate_request_method,
    validate_request_security,
    add_security_headers,
)
import logging

_logger = logging.getLogger(__name__)


class BoardController(http.Controller):
    """Board endpoints (project.project)"""

    @http.route('/api/v1/boards', type='json', auth='user', methods=['GET'], csrf=False)
    def list_boards(self, page=0, limit=20):
        """
        List all boards accessible to current user
        
        Query params:
            page (int): Page number (0-based)
            limit (int): Items per page
        
        Returns:
            {
                "boards": [Board, ...],
                "total": int,
                "page": int,
                "limit": int
            }
        """
        validate_request_method(['GET'])
        validate_request_security()
        require_auth()
        
        try:
            # Fetch accessible projects (ACL enforced automatically)
            Project = request.env['project.project']
            
            # Search with pagination
            offset = page * limit
            projects = Project.search([], offset=offset, limit=limit, order='id desc')
            total_count = Project.search_count([])
            
            # Map to DTOs
            boards = [map_board(project) for project in projects]
            
            response = {
                'boards': boards,
                'total': total_count,
                'page': page,
                'limit': limit,
            }
            
            # Add contract version header
            request.httprequest.environ['HTTP_X_CONTRACT_VERSION'] = CONTRACT_VERSION
            
            _logger.info(f"User {request.env.user.id} listed {len(boards)} boards")
            return response
            
        except Exception as e:
            _logger.error(f"Error listing boards: {str(e)}", exc_info=True)
            return {
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e),
                }
            }

    @http.route('/api/v1/boards/<string:board_id>', type='json', auth='user', methods=['GET'], csrf=False)
    def get_board(self, board_id):
        """
        Get board detail with card counts
        
        Path params:
            board_id (str): Board ID in format "project:123"
        
        Returns:
            Board DTO with card_counts
        """
        validate_request_method(['GET'])
        validate_request_security()
        require_auth()
        
        try:
            # Parse board_id: "project:123" → 123
            if not board_id.startswith('project:'):
                return {
                    'error': {
                        'code': 'INVALID_BOARD_ID',
                        'message': f'Invalid board_id format: {board_id}',
                    }
                }
            
            project_id = int(board_id.split(':')[1])
            
            # Fetch project (ACL enforced)
            Project = request.env['project.project']
            project = Project.browse(project_id)
            
            if not project.exists():
                return {
                    'error': {
                        'code': 'BOARD_NOT_FOUND',
                        'message': 'Board not found or access denied',
                    }
                }
            
            # Check access
            project.check_access_rights('read')
            project.check_access_rule('read')
            
            # Map to DTO with card counts
            board = map_board_with_card_counts(project)
            
            # Add contract version header
            request.httprequest.environ['HTTP_X_CONTRACT_VERSION'] = CONTRACT_VERSION
            
            _logger.info(f"User {request.env.user.id} viewed board {board_id}")
            return board
            
        except ValueError:
            return {
                'error': {
                    'code': 'INVALID_BOARD_ID',
                    'message': f'Invalid board_id format: {board_id}',
                }
            }
        except Exception as e:
            _logger.error(f"Error fetching board {board_id}: {str(e)}", exc_info=True)
            return {
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e),
                }
            }

    @http.route('/api/v1/boards', type='json', auth='user', methods=['POST'], csrf=False)
    def create_board(self, name, description=None, visibility='team'):
        """
        Create a new board (project.project)
        
        Body:
            {
                "name": "Board name",
                "description": "Optional description",
                "visibility": "private|team|public"
            }
        
        Returns:
            { "board": Board DTO }
        """
        validate_request_method(['POST'])
        validate_request_security()
        require_auth()
        
        try:
            if not name or not name.strip():
                return {
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Board name is required',
                        'details': {'field': 'name'},
                    }
                }
            
            # Create project
            Project = request.env['project.project']
            project = Project.create({
                'name': name.strip(),
                'description': description,
                'user_id': request.env.user.id,  # Set current user as manager
                'privacy_visibility': visibility,
            })
            
            # Map to DTO
            board = map_board(project)
            
            # Add contract version header
            request.httprequest.environ['HTTP_X_CONTRACT_VERSION'] = CONTRACT_VERSION
            
            _logger.info(f"User {request.env.user.id} created board {project.id}")
            return {'board': board}
            
        except Exception as e:
            _logger.error(f"Error creating board: {str(e)}", exc_info=True)
            return {
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e),
                }
            }