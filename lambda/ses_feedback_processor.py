import json
import logging
import os
from datetime import datetime

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """Process SES feedback events (delivery, bounce, complaint)"""
    try:
        for record in event.get('Records', []):
            if record.get('EventSource') == 'aws:sns':
                process_ses_feedback(json.loads(record['Sns']['Message']))
        
        return {'statusCode': 200, 'body': json.dumps('Success')}
    
    except Exception as e:
        logger.error(f"Error processing SES feedback: {str(e)}")
        raise

def process_ses_feedback(feedback_data):
    """Process SES feedback and update DynamoDB"""
    try:
        table = dynamodb.Table(os.environ['EMAIL_DELIVERIES_TABLE'])
        
        # Extract feedback information
        event_type = feedback_data.get('eventType', '')
        message_id = feedback_data.get('mail', {}).get('messageId', '')
        timestamp = feedback_data.get('mail', {}).get('timestamp', datetime.utcnow().isoformat())
        
        # Find the corresponding record in DynamoDB
        # We need to search by sesMessageId since that's what we store
        if not message_id:
            logger.warning("No message ID found in SES feedback")
            return
        
        # Query DynamoDB to find the record with this SES message ID
        response = table.scan(
            FilterExpression='sesMessageId = :message_id',
            ExpressionAttributeValues={':message_id': message_id}
        )
        
        if not response.get('Items'):
            logger.warning(f"No record found for SES message ID: {message_id}")
            return
        
        # Update the record based on event type
        for item in response['Items']:
            order_id = item['orderId']
            message_id_key = item['messageId']
            
            # Determine new status based on event type
            new_status = 'UNKNOWN'
            reason = ''
            
            if event_type == 'delivery':
                new_status = 'DELIVERED'
                reason = 'Email delivered successfully'
            elif event_type == 'bounce':
                new_status = 'BOUNCED'
                bounce_type = feedback_data.get('bounce', {}).get('bounceType', 'Unknown')
                bounce_reason = feedback_data.get('bounce', {}).get('bounceSubType', 'Unknown')
                reason = f"Bounce: {bounce_type} - {bounce_reason}"
            elif event_type == 'complaint':
                new_status = 'COMPLAINT'
                complaint_type = feedback_data.get('complaint', {}).get('complaintFeedbackType', 'Unknown')
                reason = f"Complaint: {complaint_type}"
            elif event_type == 'reject':
                new_status = 'REJECTED'
                reason = 'Email rejected by SES'
            
            # Update the record
            update_expression = "SET #status = :status, lastUpdated = :last_updated, reason = :reason"
            expression_attribute_names = {'#status': 'status'}
            expression_attribute_values = {
                ':status': new_status,
                ':last_updated': datetime.utcnow().isoformat(),
                ':reason': reason
            }
            
            # Add event-specific fields
            if event_type == 'bounce':
                update_expression += ", bounceType = :bounce_type, bounceReason = :bounce_reason"
                expression_attribute_values[':bounce_type'] = feedback_data.get('bounce', {}).get('bounceType', 'Unknown')
                expression_attribute_values[':bounce_reason'] = feedback_data.get('bounce', {}).get('bounceSubType', 'Unknown')
            elif event_type == 'complaint':
                update_expression += ", complaintType = :complaint_type"
                expression_attribute_values[':complaint_type'] = feedback_data.get('complaint', {}).get('complaintFeedbackType', 'Unknown')
            
            table.update_item(
                Key={'orderId': order_id, 'messageId': message_id_key},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values
            )
            
            # Publish CloudWatch metrics
            publish_feedback_metrics(event_type, new_status)
            
            logger.info(f"Updated email delivery record for order {order_id}: {new_status}")
            
    except Exception as e:
        logger.error(f"Failed to process SES feedback: {str(e)}")
        raise

def publish_feedback_metrics(event_type, status):
    """Publish CloudWatch metrics for SES feedback"""
    try:
        namespace = f"{os.environ.get('ENVIRONMENT', 'dev')}/EmailNotifications"
        
        metrics = []
        
        # Count the event type
        metrics.append({
            'MetricName': f'{event_type.title()}Events',
            'Value': 1,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        })
        
        # Count by status
        metrics.append({
            'MetricName': f'{status}Emails',
            'Value': 1,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        })
        
        # Calculate bounce rate if this is a bounce
        if event_type == 'bounce':
            metrics.append({
                'MetricName': 'BounceRate',
                'Value': 1,
                'Unit': 'Percent',
                'Timestamp': datetime.utcnow()
            })
        
        cloudwatch.put_metric_data(
            Namespace=namespace,
            MetricData=metrics
        )
        
    except Exception as e:
        logger.error(f"Failed to publish feedback metrics: {str(e)}")
