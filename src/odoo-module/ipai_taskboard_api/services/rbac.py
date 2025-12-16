# -*- coding: utf-8 -*-
"""
RBAC Service — Role-Based Access Control

Enforces permissions at board and card level.
All checks enforce server-side ACL + record rules.
"""

from odoo.http import request
from odoo.exceptions import AccessError
import logging

_logger = logging.getLogger(__name__)


def check_board_access(project, mode='read'):
    """
    Check if current user has access to board
    
    Args:
        project: project.project record
        mode: 'read' | 'write' | 'create' | 'unlink'
    
    Raises:
        AccessError if user doesn't have permission
    """
    try:
        project.check_access_rights(mode)
        project.check_access_rule(mode)
        return True
    except AccessError as e:
        _logger.warning(
            f"User {request.env.user.id} denied {mode} access to board {project.id}"
        )
        raise e


def check_card_access(task, mode='read'):
    """
    Check if current user has access to card
    
    Args:
        task: project.task record
        mode: 'read' | 'write' | 'create' | 'unlink'
    
    Raises:
        AccessError if user doesn't have permission
    """
    try:
        task.check_access_rights(mode)
        task.check_access_rule(mode)
        return True
    except AccessError as e:
        _logger.warning(
            f"User {request.env.user.id} denied {mode} access to card {task.id}"
        )
        raise e


def is_board_member(project, user=None):
    """
    Check if user is a member of the board
    
    Args:
        project: project.project record
        user: res.users record (default: current user)
    
    Returns:
        bool
    """
    if not user:
        user = request.env.user
    
    # Check if user is project manager
    if project.user_id == user:
        return True
    
    # TODO: Check project.member_ids if using project members
    # For now, rely on Odoo's built-in access rules
    
    return False


def get_user_role(project, user=None):
    """
    Get user's role on board
    
    Args:
        project: project.project record
        user: res.users record (default: current user)
    
    Returns:
        'admin' | 'manager' | 'contributor' | 'viewer' | None
    """
    if not user:
        user = request.env.user
    
    # Check if user is project manager
    if project.user_id == user:
        return 'manager'
    
    # Check groups
    if user.has_group('project.group_project_manager'):
        return 'admin'
    
    if user.has_group('project.group_project_user'):
        return 'contributor'
    
    # Portal users are viewers
    if user.has_group('base.group_portal'):
        return 'viewer'
    
    return None
