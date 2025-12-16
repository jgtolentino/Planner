# -*- coding: utf-8 -*-
{
    'name': 'IPAI Taskboard API',
    'version': '1.0.0',
    'category': 'Project',
    'summary': 'REST API for Notion-style Kanban backed by project.task',
    'description': """
Notion-Style Kanban Task & Goals API
====================================

Provides a production-grade REST API over Odoo CE + OCA 18 data models:

* Board → project.project
* Stage → project.task.type
* Card → project.task
* Activity → mail.message
* Partner → res.partner

Key Features:
* Email-based identity (res.partner canonical)
* RBAC enforced server-side
* Mentions create followers + notifications
* Audit trail via mail.thread
* Contract version: 1.0.0

Security:
* All endpoints enforce Odoo ACL + record rules
* No sudo() except controlled partner resolution
* Audit logging on all writes

Dependencies:
* base
* project
* mail
* contacts
    """,
    'author': 'IPAI',
    'website': 'https://example.com',
    'depends': [
        'base',
        'project',
        'mail',
        'contacts',
    ],
    'data': [
        'security/ir.model.access.csv',
        'security/record_rules.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
