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
    Batch process low priority bugs
    """
    try:
        logger.info(f"Batch processing bug: {json.dumps(event)}")

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

        # Update bug status to 'batched'
        bugs_table.update_item(
            Key={'bugId': bug_id, 'timestamp': bug['timestamp']},
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt, assignedTo = :assignedTo',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'batched',
                ':updatedAt': datetime.utcnow().isoformat(),
                ':assignedTo': 'batch-processing-queue'
            }
        )

        logger.info(f"Bug {bug_id} added to batch processing queue")

        return {
            'bugId': bug_id,
            'status': 'batched',
            'priority': 'low',
            'message': 'Bug added to batch processing queue'
        }

    except Exception as e:
        logger.error(f"Error batch processing bug: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'error': str(e)
        }
