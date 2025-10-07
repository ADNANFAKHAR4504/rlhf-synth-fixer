import json
import logging
import os
import uuid
from datetime import datetime, timedelta

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ses = boto3.client('ses')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """Process SNS order confirmation events and send emails via SES"""
    try:
        # Parse SNS message
        for record in event.get('Records', []):
            if record.get('EventSource') == 'aws:sns':
                message = json.loads(record['Sns']['Message'])
                process_order_confirmation(message)
        
        return {'statusCode': 200, 'body': json.dumps('Success')}
    
    except Exception as e:
        logger.error(f"Error processing order confirmation: {str(e)}")
        raise

def process_order_confirmation(order_data):
    """Process individual order confirmation"""
    # Extract order information
    order_id = order_data.get('orderId')
    customer_email = order_data.get('customerEmail') 
    customer_name = order_data.get('customerName')
    
    # Validate required fields
    if not all([order_id, customer_email, customer_name]):
        raise ValueError("Missing required fields in order data")
    
    # Check for duplicate processing
    table = dynamodb.Table(os.environ['EMAIL_DELIVERIES_TABLE'])
    message_id = str(uuid.uuid4())
    
    # Send email via SES
    ses_message_id = send_order_confirmation_email(order_data, message_id)
    
    # Record in DynamoDB
    record_email_delivery(table, order_id, message_id, customer_email, order_data, ses_message_id)

def send_order_confirmation_email(order_data, message_id):
    """Send email via SES"""
    try:
        # Check if production SES is enabled
        enable_production = os.environ.get('ENABLE_PRODUCTION_SES', 'false').lower() == 'true'
        verified_domain = os.environ.get('VERIFIED_DOMAIN', 'example.com')
        from_address = os.environ.get('SES_FROM_ADDRESS', f'no-reply@{verified_domain}')
        test_email = os.environ.get('TEST_EMAIL_ADDRESS', 'test@example.com')
        
        # Use test email in sandbox mode
        recipient_email = order_data.get('customerEmail') if enable_production else test_email
        
        # Create email content
        customer_name = order_data.get('customerName', 'Valued Customer')
        order_id = order_data.get('orderId', 'Unknown')
        total = order_data.get('total', '0.00')
        items = order_data.get('items', [])
        
        # Build email body
        subject = f"Order Confirmation - {order_id}"
        
        # Create order details text
        order_details = []
        for item in items:
            name = item.get('name', 'Item')
            quantity = item.get('quantity', 1)
            price = item.get('price', '0.00')
            order_details.append(f"- {name} x{quantity} - ${price}")
        
        body_text = f"""Dear {customer_name},

Thank you for your order! Your order #{order_id} has been confirmed.

Order Details:
{chr(10).join(order_details)}

Total: ${total}

We'll send you another email when your order ships.

Best regards,
The Team"""
        
        # Create order details HTML
        order_details_html = []
        for item in items:
            name = item.get('name', 'Item')
            quantity = item.get('quantity', 1)
            price = item.get('price', '0.00')
            order_details_html.append(f"<li>{name} x{quantity} - ${price}</li>")
        
        body_html = f"""<html>
<body>
<h2>Order Confirmation</h2>
<p>Dear {customer_name},</p>
<p>Thank you for your order! Your order <strong>#{order_id}</strong> has been confirmed.</p>
<h3>Order Details:</h3>
<ul>
{''.join(order_details_html)}
</ul>
<p><strong>Total: ${total}</strong></p>
<p>We'll send you another email when your order ships.</p>
<p>Best regards,<br>The Team</p>
</body>
</html>"""
        
        # Send email via SES
        ses_response = ses.send_email(
            Source=from_address,
            Destination={'ToAddresses': [recipient_email]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Text': {'Data': body_text, 'Charset': 'UTF-8'},
                    'Html': {'Data': body_html, 'Charset': 'UTF-8'}
                }
            },
            ConfigurationSetName=os.environ.get('SES_CONFIG_SET')
        )
        
        logger.info(f"Email sent successfully for order {order_id}, MessageId: {ses_response['MessageId']}")
        return ses_response['MessageId']
        
    except Exception as e:
        logger.error(f"Failed to send email for order {order_data.get('orderId')}: {str(e)}")
        raise

def record_email_delivery(table, order_id, message_id, email, order_data, ses_message_id=None):
    """Record email delivery in DynamoDB"""
    try:
        # Calculate TTL (30 days from now)
        ttl = int((datetime.utcnow() + timedelta(days=30)).timestamp())
        
        # Prepare item data
        item = {
            'orderId': order_id,
            'messageId': message_id,
            'to': email,
            'status': 'SENT',
            'timestamp': int(datetime.utcnow().timestamp() * 1000),
            'customerName': order_data.get('customerName', 'Unknown'),
            'total': str(order_data.get('total', '0.00')),
            'itemCount': len(order_data.get('items', [])),
            'attempts': 1,
            'lastUpdated': datetime.utcnow().isoformat(),
            'ttl': ttl
        }
        
        # Add SES message ID if available
        if ses_message_id:
            item['sesMessageId'] = ses_message_id
        
        # Add items details if available
        if order_data.get('items'):
            item['items'] = order_data['items']
        
        # Add metadata if available
        if order_data.get('metadata'):
            item['metadata'] = order_data['metadata']
        
        # Use conditional write to prevent duplicates
        table.put_item(
            Item=item,
            ConditionExpression='attribute_not_exists(orderId) OR attribute_not_exists(messageId)'
        )
        
        logger.info(f"Email delivery record created for order {order_id}")
        
    except table.meta.client.exceptions.ConditionalCheckFailedException:
        logger.warning(f"Duplicate email delivery record for order {order_id}, message {message_id}")
    except Exception as e:
        logger.error(f"Failed to record email delivery for order {order_id}: {str(e)}")
        raise 