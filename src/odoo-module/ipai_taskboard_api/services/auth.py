# -*- coding: utf-8 -*-
"""
Authentication Service

Validates user authentication for API requests.
"""

from odoo.http import request
from odoo.exceptions import AccessDenied
import logging

_logger = logging.getLogger(__name__)


def require_auth():
    """
    Verify user is authenticated.
    
    Raises:
        AccessDenied if user is not authenticated
    """
    if not request.env.user or request.env.user.id == request.env.ref('base.public_user').id:
        _logger.warning("Unauthenticated API access attempt")
        raise AccessDenied("Authentication required")
    
    return request.env.user


def get_current_user():
    """Get current authenticated user"""
    return request.env.user


def get_current_partner():
    """Get current authenticated user's partner"""
    return request.env.user.partner_id
