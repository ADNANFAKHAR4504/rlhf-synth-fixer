import json
import os
import boto3
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
BUGS_TABLE_NAME = os.environ['BUGS_TABLE_NAME']
NOTIFICATION_TOPIC_ARN = os.environ['NOTIFICATION_TOPIC_ARN']
bugs_table = dynamodb.Table(BUGS_TABLE_NAME)


def lambda_handler(event, context):
    """
    Assign bug to a developer team and send notification
    """
    try:
        logger.info(f"Assigning bug: {json.dumps(event)}")

        bug_id = event.get('bugId')
        priority = event.get('priority')
        assign_to = event.get('assignTo', 'regular-dev-team')

        if not bug_id:
            return {
                'statusCode': 400,
                'error': 'Bug ID is required'
            }

        # Get bug from DynamoDB
        response = bugs_table.query(
            KeyConditionExpression='bugId = :bugId',
            ExpressionAttributeValues={':bugId': bug_id},
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'error': 'Bug not found'
            }

        bug = items[0]

        # Update bug with assignment
        bugs_table.update_item(
            Key={'bugId': bug_id, 'timestamp': bug['timestamp']},
            UpdateExpression='SET assignedTo = :assignedTo, #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':assignedTo': assign_to,
                ':status': 'assigned',
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )

        # Send SNS notification
        message = {
            'bugId': bug_id,
            'title': bug.get('title'),
            'priority': priority,
            'assignedTo': assign_to,
            'description': bug.get('description', '')[:200]
        }

        sns.publish(
            TopicArn=NOTIFICATION_TOPIC_ARN,
            Subject=f"New Bug Assignment - {priority.upper()} Priority",
            Message=json.dumps(message, indent=2)
        )

        logger.info(f"Bug {bug_id} assigned to {assign_to}")

        return {
            'bugId': bug_id,
            'assignedTo': assign_to,
            'priority': priority,
            'status': 'assigned',
            'message': 'Bug assigned successfully'
        }

    except Exception as e:
        logger.error(f"Error assigning bug: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'error': str(e)
        }
