import json
import os
import boto3
import logging
from datetime import datetime
from collections import defaultdict
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

results_table_name = os.environ['RESULTS_TABLE_NAME']
snapshot_bucket_name = os.environ['SNAPSHOT_BUCKET_NAME']

results_table = dynamodb.Table(results_table_name)

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal types to JSON."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    """
    Lambda function to aggregate voting results from DynamoDB Stream.
    """
    logger.info(f"Received {len(event['Records'])} records from DynamoDB Stream")

    try:
        # Process stream records
        vote_changes = process_stream_records(event['Records'])

        # Update aggregated results
        update_results(vote_changes)

        # Take periodic snapshots (every 100 records as example)
        if len(event['Records']) >= 50:
            take_snapshot()

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Results aggregated successfully',
                'recordsProcessed': len(event['Records'])
            })
        }

    except Exception as e:
        logger.error(f"Error processing stream records: {str(e)}")
        raise

def process_stream_records(records):
    """
    Process DynamoDB stream records and extract vote changes.
    """
    vote_changes = defaultdict(lambda: defaultdict(int))

    for record in records:
        event_name = record['eventName']

        if event_name in ['INSERT', 'MODIFY']:
            new_image = record['dynamodb'].get('NewImage', {})
            poll_id = new_image.get('pollId', {}).get('S', '')
            choice = new_image.get('choice', {}).get('S', '')

            if poll_id and choice:
                vote_changes[poll_id][choice] += 1

        elif event_name == 'REMOVE':
            old_image = record['dynamodb'].get('OldImage', {})
            poll_id = old_image.get('pollId', {}).get('S', '')
            choice = old_image.get('choice', {}).get('S', '')

            if poll_id and choice:
                vote_changes[poll_id][choice] -= 1

    return vote_changes

def update_results(vote_changes):
    """
    Update aggregated results in DynamoDB.
    """
    for poll_id, choices in vote_changes.items():
        for choice, count_delta in choices.items():
            try:
                results_table.update_item(
                    Key={'pollId': poll_id},
                    UpdateExpression='ADD #choices.#choice :delta SET lastUpdated = :timestamp',
                    ExpressionAttributeNames={
                        '#choices': 'choices',
                        '#choice': choice
                    },
                    ExpressionAttributeValues={
                        ':delta': count_delta,
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
                logger.info(f"Updated results for poll {poll_id}, choice {choice}, delta {count_delta}")

            except Exception as e:
                logger.error(f"Error updating results: {str(e)}")
                raise

def take_snapshot():
    """
    Take a snapshot of current results and save to S3.
    """
    try:
        # Scan results table
        response = results_table.scan()
        items = response.get('Items', [])

        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = results_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))

        # Create snapshot
        timestamp = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
        snapshot_key = f"snapshots/results-{timestamp}.json"

        snapshot_data = {
            'timestamp': timestamp,
            'results': items
        }

        # Upload to S3
        s3_client.put_object(
            Bucket=snapshot_bucket_name,
            Key=snapshot_key,
            Body=json.dumps(snapshot_data, cls=DecimalEncoder),
            ContentType='application/json'
        )

        logger.info(f"Snapshot saved to s3://{snapshot_bucket_name}/{snapshot_key}")

    except Exception as e:
        logger.error(f"Error taking snapshot: {str(e)}")
        # Don't raise - snapshots are not critical
