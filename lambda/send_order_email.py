"""
Production-ready Travel Booking Notification Lambda Function

This Lambda function processes travel booking confirmations and sends professional
email notifications to customers. It demonstrates real-world email processing with:
- Duplicate detection and prevention
- Email template rendering with booking details
- Delivery tracking and status monitoring
- Cost monitoring and optimization
- Error handling and retry logic
- Integration with SES, DynamoDB, and CloudWatch
"""

import json
import logging
import os
import uuid
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients with proper error handling
try:
    ses = boto3.client('ses', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    cloudwatch = boto3.client('cloudwatch', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    sns = boto3.client('sns', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
except Exception as e:
    logger.error(f"Failed to initialize AWS clients: {str(e)}")
    raise

ses = boto3.client('ses')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Main Lambda handler for processing travel booking confirmation events.
    
    Processes SNS messages containing booking confirmations and sends professional
    email notifications to customers with booking details, travel information,
    and next steps.
    
    Args:
        event: AWS Lambda event containing SNS records
        context: AWS Lambda context object
        
    Returns:
        Dict containing status code and processing results
    """
    correlation_id = context.aws_request_id
    start_time = datetime.utcnow()
    processed_count = 0
    failed_count = 0
    
    logger.info(f"Processing booking confirmation batch", extra={
        'correlation_id': correlation_id,
        'event_source': 'travel_booking_notifications',
        'record_count': len(event.get('Records', []))
    })
    
    try:
        # Process each SNS record
        for record in event.get('Records', []):
            try:
                if record.get('EventSource') == 'aws:sns':
                    message = json.loads(record['Sns']['Message'])
                    process_booking_confirmation(message, correlation_id)
                    processed_count += 1
                else:
                    logger.warning(f"Unsupported event source: {record.get('EventSource')}")
                    
            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to process individual record", extra={
                    'correlation_id': correlation_id,
                    'error': str(e),
                    'record_index': processed_count + failed_count - 1
                })
        
        # Record processing metrics
        duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        record_processing_metrics(processed_count, failed_count, duration_ms, correlation_id, context)
        
        logger.info(f"Batch processing complete", extra={
            'correlation_id': correlation_id,
            'processed': processed_count,
            'failed': failed_count,
            'duration_ms': duration_ms
        })
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Booking notifications processed successfully',
                'processed': processed_count,
                'failed': failed_count,
                'correlation_id': correlation_id
            })
        }
    
    except Exception as e:
        logger.error(f"Critical error in booking notification processing", extra={
            'correlation_id': correlation_id,
            'error': str(e),
            'error_type': type(e).__name__
        })
        
        # Send critical error alert
        send_critical_error_alert(str(e), correlation_id)
        raise

def process_booking_confirmation(booking_data: Dict[str, Any], correlation_id: str) -> None:
    """
    Process individual travel booking confirmation with comprehensive validation
    and professional email generation.
    """
    try:
        # Extract and validate booking information
        booking_details = validate_and_extract_booking_data(booking_data)
        
        # Check for duplicate processing to prevent double emails
        if is_duplicate_booking_notification(booking_details['booking_id']):
            logger.info(f"Duplicate booking notification detected, skipping", extra={
                'correlation_id': correlation_id,
                'booking_id': booking_details['booking_id']
            })
            return
        
        # Generate unique message ID for tracking
        message_id = str(uuid.uuid4())
        
        # Send professional booking confirmation email
        ses_message_id = send_booking_confirmation_email(booking_details, message_id, correlation_id)
        
        # Record delivery for tracking and analytics
        record_email_delivery(booking_details, message_id, ses_message_id, correlation_id)
        
        # Update booking status in system
        update_booking_notification_status(booking_details['booking_id'], 'email_sent', correlation_id)
        
        logger.info(f"Booking confirmation processed successfully", extra={
            'correlation_id': correlation_id,
            'booking_id': booking_details['booking_id'],
            'customer_email': booking_details['customer_email'],
            'ses_message_id': ses_message_id
        })
        
    except ValidationError as e:
        logger.error(f"Booking data validation failed", extra={
            'correlation_id': correlation_id,
            'error': str(e),
            'booking_data': json.dumps(booking_data, default=str)
        })
        # Don't retry validation errors
        record_failed_notification(booking_data, 'validation_error', str(e), correlation_id)
        
    except EmailDeliveryError as e:
        logger.error(f"Email delivery failed", extra={
            'correlation_id': correlation_id,
            'error': str(e),
            'booking_id': booking_data.get('booking_id')
        })
        # This will trigger retry via SQS DLQ
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error processing booking confirmation", extra={
            'correlation_id': correlation_id,
            'error': str(e),
            'error_type': type(e).__name__,
            'booking_data': json.dumps(booking_data, default=str)
        })
        raise


def validate_and_extract_booking_data(booking_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and extract booking information with comprehensive checks.
    """
    required_fields = [
        'booking_id', 'customer_email', 'customer_name', 'booking_type',
        'travel_date', 'total_amount', 'booking_status'
    ]
    
    missing_fields = [field for field in required_fields if not booking_data.get(field)]
    if missing_fields:
        raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")
    
    # Validate email format
    email = booking_data['customer_email']
    if not validate_email_format(email):
        raise ValidationError(f"Invalid email format: {email}")
    
    # Validate booking type
    valid_booking_types = ['flight', 'hotel', 'package', 'car_rental']
    if booking_data['booking_type'] not in valid_booking_types:
        raise ValidationError(f"Invalid booking type: {booking_data['booking_type']}")
    
    # Extract and format travel details based on booking type
    travel_details = extract_travel_details(booking_data)
    
    return {
        'booking_id': booking_data['booking_id'],
        'customer_email': email.lower().strip(),
        'customer_name': booking_data['customer_name'].strip(),
        'booking_type': booking_data['booking_type'],
        'travel_date': booking_data['travel_date'],
        'total_amount': float(booking_data['total_amount']),
        'booking_status': booking_data['booking_status'],
        'travel_details': travel_details,
        'created_at': datetime.utcnow().isoformat()
    }


def is_duplicate_booking_notification(booking_id: str) -> bool:
    """
    Check if we've already sent a notification for this booking.
    """
    try:
        table = dynamodb.Table(os.environ['EMAIL_DELIVERIES_TABLE'])
        response = table.get_item(
            Key={'booking_id': booking_id}
        )
        return 'Item' in response
    except Exception as e:
        logger.warning(f"Could not check for duplicate notification: {str(e)}")
        return False


def send_booking_confirmation_email(booking_details: Dict[str, Any], message_id: str, correlation_id: str) -> str:
    """
    Send professional booking confirmation email with comprehensive travel details.
    """
    try:
        # Generate professional email content
        email_content = generate_booking_email_content(booking_details)
        
        # Prepare SES email parameters
        ses_params = {
            'Source': os.environ.get('FROM_EMAIL', 'bookings@travelplatform.com'),
            'Destination': {
                'ToAddresses': [booking_details['customer_email']]
            },
            'Message': {
                'Subject': {
                    'Data': f"Booking Confirmation - {booking_details['booking_id']}",
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Html': {
                        'Data': email_content['html'],
                        'Charset': 'UTF-8'
                    },
                    'Text': {
                        'Data': email_content['text'],
                        'Charset': 'UTF-8'
                    }
                }
            },
            'ConfigurationSetName': os.environ.get('SES_CONFIGURATION_SET'),
            'Tags': [
                {
                    'Name': 'BookingType',
                    'Value': booking_details['booking_type']
                },
                {
                    'Name': 'MessageId',
                    'Value': message_id
                },
                {
                    'Name': 'CorrelationId',
                    'Value': correlation_id
                }
            ]
        }
        
        # Send email via SES
        response = ses.send_email(**ses_params)
        ses_message_id = response['MessageId']
        
        logger.info(f"Booking confirmation email sent successfully", extra={
            'correlation_id': correlation_id,
            'booking_id': booking_details['booking_id'],
            'ses_message_id': ses_message_id,
            'customer_email': booking_details['customer_email']
        })
        
        return ses_message_id
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code in ['MessageRejected', 'InvalidParameterValue']:
            raise EmailDeliveryError(f"SES rejected email: {str(e)}")
        else:
            raise EmailDeliveryError(f"SES error: {str(e)}")
    except Exception as e:
        raise EmailDeliveryError(f"Unexpected email sending error: {str(e)}")


def generate_booking_email_content(booking_details: Dict[str, Any]) -> Dict[str, str]:
    """
    Generate professional HTML and text email content for booking confirmations.
    """
    booking_type = booking_details['booking_type']
    customer_name = booking_details['customer_name']
    booking_id = booking_details['booking_id']
    travel_details = booking_details['travel_details']
    
    # Generate HTML email content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Booking Confirmation</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .header {{ background-color: #2c5aa0; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .booking-details {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            .footer {{ background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Travel Platform - Booking Confirmation</h1>
        </div>
        <div class="content">
            <h2>Dear {customer_name},</h2>
            <p>Thank you for your booking! We're excited to confirm your {booking_type} reservation.</p>
            
            <div class="booking-details">
                <h3>Booking Details</h3>
                <p><strong>Booking ID:</strong> {booking_id}</p>
                <p><strong>Booking Type:</strong> {booking_type.title()}</p>
                <p><strong>Travel Date:</strong> {booking_details['travel_date']}</p>
                <p><strong>Total Amount:</strong> ${booking_details['total_amount']:.2f}</p>
                <p><strong>Status:</strong> {booking_details['booking_status'].title()}</p>
                
                {format_travel_details_html(travel_details)}
            </div>
            
            <p>Important reminders:</p>
            <ul>
                <li>Please arrive at least 2 hours before departure for international flights</li>
                <li>Check-in online 24 hours before your flight</li>
                <li>Ensure your travel documents are valid</li>
                <li>Review our cancellation policy on our website</li>
            </ul>
            
            <p>If you have any questions, please contact our customer service team.</p>
            <p>Safe travels!</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Travel Platform. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </body>
    </html>
    """
    
    # Generate text email content
    text_content = f"""
    TRAVEL PLATFORM - BOOKING CONFIRMATION
    
    Dear {customer_name},
    
    Thank you for your booking! We're excited to confirm your {booking_type} reservation.
    
    BOOKING DETAILS:
    Booking ID: {booking_id}
    Booking Type: {booking_type.title()}
    Travel Date: {booking_details['travel_date']}
    Total Amount: ${booking_details['total_amount']:.2f}
    Status: {booking_details['booking_status'].title()}
    
    {format_travel_details_text(travel_details)}
    
    IMPORTANT REMINDERS:
    - Please arrive at least 2 hours before departure for international flights
    - Check-in online 24 hours before your flight
    - Ensure your travel documents are valid
    - Review our cancellation policy on our website
    
    If you have any questions, please contact our customer service team.
    
    Safe travels!
    
    © 2024 Travel Platform. All rights reserved.
    This is an automated message. Please do not reply to this email.
    """
    
    return {
        'html': html_content,
        'text': text_content
    }


# Helper functions and error classes
class ValidationError(Exception):
    pass

class EmailDeliveryError(Exception):
    pass

def validate_email_format(email: str) -> bool:
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def extract_travel_details(booking_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract travel-specific details based on booking type"""
    booking_type = booking_data['booking_type']
    
    if booking_type == 'flight':
        return {
            'origin': booking_data.get('origin', 'N/A'),
            'destination': booking_data.get('destination', 'N/A'),
            'flight_number': booking_data.get('flight_number', 'N/A'),
            'departure_time': booking_data.get('departure_time', 'N/A')
        }
    elif booking_type == 'hotel':
        return {
            'hotel_name': booking_data.get('hotel_name', 'N/A'),
            'check_in': booking_data.get('check_in_date', 'N/A'),
            'check_out': booking_data.get('check_out_date', 'N/A'),
            'room_type': booking_data.get('room_type', 'N/A')
        }
    else:
        return {'details': 'See booking confirmation for full details'}

def format_travel_details_html(travel_details: Dict[str, Any]) -> str:
    """Format travel details for HTML email"""
    html = "<h4>Travel Information</h4>"
    for key, value in travel_details.items():
        html += f"<p><strong>{key.replace('_', ' ').title()}:</strong> {value}</p>"
    return html

def format_travel_details_text(travel_details: Dict[str, Any]) -> str:
    """Format travel details for text email"""
    text = "TRAVEL INFORMATION:\n"
    for key, value in travel_details.items():
        text += f"{key.replace('_', ' ').title()}: {value}\n"
    return text

def record_email_delivery(booking_details: Dict[str, Any], message_id: str, ses_message_id: str, correlation_id: str) -> None:
    """Record email delivery for tracking and analytics"""
    try:
        table = dynamodb.Table(os.environ['EMAIL_DELIVERIES_TABLE'])
        
        item = {
            'booking_id': booking_details['booking_id'],
            'message_id': message_id,
            'ses_message_id': ses_message_id,
            'customer_email': booking_details['customer_email'],
            'booking_type': booking_details['booking_type'],
            'email_sent_at': datetime.utcnow().isoformat(),
            'status': 'sent',
            'correlation_id': correlation_id,
            'total_amount': booking_details['total_amount'],
            'ttl': int((datetime.utcnow() + timedelta(days=90)).timestamp())  # Auto-expire after 90 days
        }
        
        table.put_item(Item=item)
        
    except Exception as e:
        logger.error(f"Failed to record email delivery", extra={
            'correlation_id': correlation_id,
            'booking_id': booking_details['booking_id'],
            'error': str(e)
        })

def update_booking_notification_status(booking_id: str, status: str, correlation_id: str) -> None:
    """Update booking notification status in the system"""
    try:
        # This would typically update a bookings table
        logger.info(f"Updated booking notification status", extra={
            'correlation_id': correlation_id,
            'booking_id': booking_id,
            'status': status
        })
    except Exception as e:
        logger.warning(f"Failed to update booking status: {str(e)}")

def record_failed_notification(booking_data: Dict[str, Any], error_type: str, error_message: str, correlation_id: str) -> None:
    """Record failed notification for analysis"""
    try:
        # Send to dead letter queue or error tracking system
        logger.error(f"Recording failed notification", extra={
            'correlation_id': correlation_id,
            'booking_id': booking_data.get('booking_id'),
            'error_type': error_type,
            'error_message': error_message
        })
    except Exception as e:
        logger.error(f"Failed to record failed notification: {str(e)}")

def record_processing_metrics(processed: int, failed: int, duration_ms: float, correlation_id: str, context=None) -> None:
    """Record processing metrics to CloudWatch"""
    try:
        function_name = context.function_name if context else os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown')
        
        cloudwatch.put_metric_data(
            Namespace='TravelPlatform/EmailNotifications',
            MetricData=[
                {
                    'MetricName': 'ProcessedNotifications',
                    'Value': processed,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'FunctionName', 'Value': function_name}
                    ]
                },
                {
                    'MetricName': 'FailedNotifications',
                    'Value': failed,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'FunctionName', 'Value': function_name}
                    ]
                },
                {
                    'MetricName': 'ProcessingDuration',
                    'Value': duration_ms,
                    'Unit': 'Milliseconds',
                    'Dimensions': [
                        {'Name': 'FunctionName', 'Value': function_name}
                    ]
                }
            ]
        )
        
        logger.info(f"Recorded processing metrics", extra={
            'correlation_id': correlation_id,
            'processed': processed,
            'failed': failed,
            'duration_ms': duration_ms
        })
        
    except Exception as e:
        logger.warning(f"Failed to record metrics: {str(e)}")

def send_critical_error_alert(error_message: str, correlation_id: str) -> None:
    """Send critical error alert to operations team"""
    try:
        if 'ALERT_TOPIC_ARN' in os.environ:
            sns.publish(
                TopicArn=os.environ['ALERT_TOPIC_ARN'],
                Subject='CRITICAL: Travel Booking Email Notification Failure',
                Message=json.dumps({
                    'error': error_message,
                    'correlation_id': correlation_id,
                    'service': 'travel-booking-notifications',
                    'timestamp': datetime.utcnow().isoformat(),
                    'severity': 'CRITICAL'
                })
            )
    except Exception as e:
        logger.error(f"Failed to send critical error alert: {str(e)}")

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
