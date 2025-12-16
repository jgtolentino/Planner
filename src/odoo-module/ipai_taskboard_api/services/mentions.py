# -*- coding: utf-8 -*-
"""
Mentions Service — Parse and resolve @email mentions

Email-based identity resolution:
1. Parse @email from comment body
2. Resolve email → res.partner (create if needed)
3. Add partner as follower on task
4. Send notification

SECURITY: Partner creation is controlled - only creates minimal record.
"""

from odoo.http import request
import re
import logging

_logger = logging.getLogger(__name__)

# Email regex pattern
EMAIL_PATTERN = re.compile(r'@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)')


def parse_mentions(body_text):
    """
    Parse @email mentions from comment body
    
    Args:
        body_text (str): Comment body with @mentions
    
    Returns:
        list[str]: List of email addresses
    """
    if not body_text:
        return []
    
    emails = EMAIL_PATTERN.findall(body_text)
    return list(set(emails))  # Deduplicate


def resolve_mentions(emails):
    """
    Resolve email addresses to partner IDs
    
    Creates partner records if they don't exist (email-only partners).
    
    Args:
        emails (list[str]): List of email addresses
    
    Returns:
        list[int]: List of partner IDs
    
    Security:
        Uses controlled sudo() only for partner lookup/creation.
        Partners created are minimal records (email + name only).
    """
    if not emails:
        return []
    
    partner_ids = []
    Partner = request.env['res.partner']
    
    for email in emails:
        if not email or '@' not in email:
            continue
        
        # Search for existing partner by email
        # Use sudo() only for lookup - we validate access on the task itself
        partner = Partner.sudo().search([('email', '=', email)], limit=1)
        
        if not partner:
            # Create minimal partner record for email identity
            # This is safe: we're only creating a name + email record
            try:
                partner = Partner.sudo().create({
                    'name': email.split('@')[0].replace('.', ' ').title(),
                    'email': email,
                    'type': 'contact',
                })
                _logger.info(f"Created partner for mentioned email: {email}")
            except Exception as e:
                _logger.error(f"Failed to create partner for {email}: {str(e)}")
                continue
        
        partner_ids.append(partner.id)
    
    return partner_ids


def add_followers(task, partner_ids):
    """
    Add partners as followers on task
    
    Args:
        task: project.task record
        partner_ids (list[int]): Partner IDs to add as followers
    """
    if not partner_ids:
        return
    
    try:
        task.message_subscribe(partner_ids=partner_ids)
        _logger.info(f"Added {len(partner_ids)} followers to task {task.id}")
    except Exception as e:
        _logger.error(f"Failed to add followers to task {task.id}: {str(e)}")
