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

# Environment variables
BUGS_TABLE_NAME = os.environ['BUGS_TABLE_NAME']
bugs_table = dynamodb.Table(BUGS_TABLE_NAME)


def lambda_handler(event, context):
    """
    Triage bug and prepare for assignment
    """
    try:
        logger.info(f"Triaging bug: {json.dumps(event)}")

        bug_id = event.get('bugId')

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
        priority = bug.get('priority', 'medium')

        # Update bug status to 'triaging'
        bugs_table.update_item(
            Key={'bugId': bug_id, 'timestamp': bug['timestamp']},
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'triaging',
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )

        logger.info(f"Bug {bug_id} triaged with priority {priority}")

        return {
            'bugId': bug_id,
            'priority': priority,
            'title': bug.get('title'),
            'description': bug.get('description'),
            'status': 'triaging'
        }

    except Exception as e:
        logger.error(f"Error triaging bug: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'error': str(e)
        }
