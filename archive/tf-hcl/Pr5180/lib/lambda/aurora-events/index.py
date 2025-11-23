"""
Lambda function to process Aurora RDS events from EventBridge
Processes scaling and failover events and publishes to SNS
"""
import json
import os
import boto3
from datetime import datetime

sns = boto3.client('sns')
rds = boto3.client('rds')

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
CLUSTER_ID = os.environ.get('CLUSTER_ID')


def handler(event, context):
    """
    Process Aurora RDS events from EventBridge
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract event details
        detail = event.get('detail', {})
        event_type = event.get('detail-type', 'Unknown')
        source = event.get('source', 'Unknown')
        timestamp = event.get('time', datetime.utcnow().isoformat())
        
        # Get event message and category
        event_message = detail.get('Message', 'No message provided')
        event_categories = detail.get('EventCategories', [])
        source_identifier = detail.get('SourceIdentifier', CLUSTER_ID)
        
        # Create notification message
        notification = {
            'Environment': ENVIRONMENT,
            'Timestamp': timestamp,
            'Source': source,
            'EventType': event_type,
            'ClusterId': source_identifier,
            'EventCategories': event_categories,
            'Message': event_message,
            'RawEvent': detail
        }
        
        # Add cluster information if available
        if source_identifier:
            try:
                cluster_info = rds.describe_db_clusters(
                    DBClusterIdentifier=source_identifier
                )
                if cluster_info['DBClusters']:
                    cluster = cluster_info['DBClusters'][0]
                    notification['ClusterStatus'] = cluster.get('Status')
                    notification['ClusterCapacity'] = cluster.get('Capacity')
                    notification['ClusterEndpoint'] = cluster.get('Endpoint')
            except Exception as e:
                print(f"Could not fetch cluster info: {str(e)}")
        
        # Determine severity based on event type
        severity = 'INFO'
        if 'failover' in event_categories or 'failure' in event_categories:
            severity = 'CRITICAL'
        elif 'configuration change' in event_categories:
            severity = 'WARNING'
        
        notification['Severity'] = severity
        
        # Format message for SNS
        subject = f"[{severity}] Aurora Event - {ENVIRONMENT} - {event_type}"
        message_body = f"""
Aurora RDS Event Notification
==============================

Environment: {ENVIRONMENT}
Cluster ID: {source_identifier}
Severity: {severity}
Time: {timestamp}

Event Type: {event_type}
Event Categories: {', '.join(event_categories)}

Message:
{event_message}

"""
        
        if notification.get('ClusterStatus'):
            message_body += f"\nCluster Status: {notification['ClusterStatus']}"
        if notification.get('ClusterCapacity'):
            message_body += f"\nCurrent Capacity: {notification['ClusterCapacity']} ACUs"
        
        message_body += f"\n\nFull Event Details:\n{json.dumps(notification, indent=2)}"
        
        # Publish to SNS
        if SNS_TOPIC_ARN:
            response = sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=subject[:100],  # SNS subject limit
                Message=message_body
            )
            print(f"Published to SNS: {response['MessageId']}")
        else:
            print("SNS_TOPIC_ARN not configured, skipping notification")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event processed successfully',
                'notification': notification
            })
        }
        
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Send error notification
        if SNS_TOPIC_ARN:
            try:
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject=f"[ERROR] Aurora Event Processing Failed - {ENVIRONMENT}",
                    Message=f"Failed to process Aurora event:\n\n{str(e)}\n\nEvent:\n{json.dumps(event, indent=2)}"
                )
            except:
                pass
        
        raise

