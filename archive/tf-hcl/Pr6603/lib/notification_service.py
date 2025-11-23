import json
import random
import logging
from datetime import datetime
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Simulate notification service with various delivery statuses and retry logic
    """
    
    # Generate notification ID
    notification_id = str(uuid.uuid4())
    
    # Define notification types
    notification_types = [
        'transaction_confirmation',
        'fraud_alert',
        'account_update',
        'payment_reminder',
        'security_notification'
    ]
    
    # Select random notification type
    notification_type = random.choice(notification_types)
    
    # Generate recipient (anonymized)
    recipient = f"user_{random.randint(1000, 9999)}@example.com"
    
    # Simulate delivery status with realistic distribution
    # Success: 85%, Failed: 10%, Pending: 5%
    status_distribution = random.random()
    if status_distribution < 0.85:
        delivery_status = 'success'
        retry_count = 0
    elif status_distribution < 0.95:
        delivery_status = 'failed'
        retry_count = random.randint(1, 5)
    else:
        delivery_status = 'pending'
        retry_count = random.randint(0, 2)
    
    # Build log entry
    log_entry = {
        'notification_id': notification_id,
        'notification_type': notification_type,
        'recipient': recipient,
        'delivery_status': delivery_status,
        'retry_count': retry_count,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    
    # Add failure reason for failed notifications
    if delivery_status == 'failed':
        failure_reasons = [
            'invalid_email',
            'mailbox_full',
            'server_unreachable',
            'spam_filter_blocked',
            'rate_limit_exceeded'
        ]
        log_entry['failure_reason'] = random.choice(failure_reasons)
    
    # Add channel information
    channels = ['email', 'sms', 'push']
    log_entry['channel'] = random.choice(channels)
    
    # Log the entry
    logger.info(json.dumps(log_entry))
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Notification service log generated',
            'notification_id': notification_id,
            'status': delivery_status
        })
    }