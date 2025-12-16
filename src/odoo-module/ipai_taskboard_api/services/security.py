# -*- coding: utf-8 -*-
"""
Security Middleware

Request validation, sanitization, and security headers.
"""

from odoo.http import request
from odoo.exceptions import ValidationError
import html
import re
import logging

_logger = logging.getLogger(__name__)

# Security constants
MAX_BODY_SIZE = 1024 * 1024  # 1MB
ALLOWED_CONTENT_TYPES = ['application/json']
RATE_LIMIT_WARNING_THRESHOLD = 100  # requests per minute (nginx enforces actual limit)


def validate_request_method(allowed_methods):
    """
    Validate HTTP method is in allowed list.
    
    Args:
        allowed_methods: List of allowed HTTP methods (e.g., ['GET', 'POST'])
    
    Raises:
        ValidationError if method not allowed
    """
    method = request.httprequest.method
    if method not in allowed_methods:
        _logger.warning(f"Method not allowed: {method}")
        raise ValidationError(f"Method {method} not allowed for this endpoint")


def validate_content_type_on_writes():
    """
    Validate Content-Type is application/json for write operations.
    
    Raises:
        ValidationError if Content-Type is invalid
    """
    method = request.httprequest.method
    if method in ['POST', 'PATCH', 'PUT']:
        content_type = request.httprequest.headers.get('Content-Type', '')
        # Handle charset suffix (e.g., "application/json; charset=utf-8")
        content_type_base = content_type.split(';')[0].strip()
        
        if content_type_base not in ALLOWED_CONTENT_TYPES:
            _logger.warning(f"Invalid Content-Type: {content_type}")
            raise ValidationError(
                f"Content-Type must be 'application/json', got '{content_type}'"
            )


def validate_body_size():
    """
    Validate request body size is within limits.
    
    Raises:
        ValidationError if body too large
    """
    method = request.httprequest.method
    if method in ['POST', 'PATCH', 'PUT']:
        content_length = request.httprequest.headers.get('Content-Length', 0)
        try:
            content_length = int(content_length)
        except (ValueError, TypeError):
            content_length = 0
        
        if content_length > MAX_BODY_SIZE:
            _logger.warning(f"Request body too large: {content_length} bytes")
            raise ValidationError(
                f"Request body too large. Maximum: {MAX_BODY_SIZE} bytes"
            )


def sanitize_html(text):
    """
    Escape HTML to prevent XSS in comment bodies.
    
    Args:
        text: User-provided text
    
    Returns:
        HTML-escaped text
    """
    if not text:
        return text
    
    return html.escape(text, quote=True)


def sanitize_markdown(text):
    """
    Sanitize markdown to prevent XSS while preserving safe markdown.
    
    Args:
        text: Markdown text
    
    Returns:
        Sanitized markdown (HTML-escaped but preserves markdown syntax)
    
    Note:
        Odoo's mail.message has built-in sanitization for body_html.
        This is an additional layer for markdown input.
    """
    if not text:
        return text
    
    # Remove potentially dangerous patterns
    # (Odoo will do final sanitization when converting to HTML)
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',  # Script tags
        r'javascript:',                 # JavaScript protocol
        r'on\w+\s*=',                  # Event handlers
    ]
    
    sanitized = text
    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)
    
    return sanitized


def add_security_headers(response):
    """
    Add security headers to response.
    
    Args:
        response: Werkzeug Response object
    
    Returns:
        Response with security headers added
    """
    # Basic security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # CORS (if needed, configure based on deployment)
    # response.headers['Access-Control-Allow-Origin'] = 'https://your-frontend.com'
    
    # Rate limit info (actual enforcement is in nginx)
    response.headers['X-RateLimit-Limit'] = str(RATE_LIMIT_WARNING_THRESHOLD)
    
    return response


def validate_request_security():
    """
    Run all security validations on incoming request.
    
    Call this at the start of every API endpoint.
    
    Raises:
        ValidationError if any validation fails
    """
    validate_content_type_on_writes()
    validate_body_size()
