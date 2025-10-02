import json
import os
import boto3
import time
from typing import Dict, Any, List
from decimal import Decimal
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.metrics import MetricUnit

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

# Initialize Powertools
logger = Logger()
metrics = Metrics()
tracer = Tracer()

# Environment variables
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'test-table')
DLQ_URL = os.environ.get('DLQ_URL')

# Get DynamoDB table (will be set in handler if not already set)
table = None

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal types to JSON."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

@tracer.capture_method
def process_leaderboard_update(record: Dict[str, Any]) -> bool:
    """
    Process a single leaderboard update.

    Args:
        record: SQS message record containing leaderboard update data

    Returns:
        bool: True if successful, False otherwise
    """
    global table
    if table is None:
        table = dynamodb.Table(TABLE_NAME)

    try:
        # Parse message body
        body = json.loads(record['body'])

        # Validate required fields
        player_id = body.get('player_id')
        score = body.get('score')
        game_id = body.get('game_id')

        if not all([player_id, score is not None, game_id]):
            logger.error(f"Missing required fields in message: {body}")
            metrics.add_metric(name="InvalidMessage", unit=MetricUnit.Count, value=1)
            return False

        # Prepare item for DynamoDB
        timestamp = int(time.time() * 1000)  # Milliseconds
        item = {
            'player_id': player_id,
            'timestamp': timestamp,
            'score': Decimal(str(score)),
            'game_id': game_id,
            'update_type': body.get('update_type', 'score_update'),
            'metadata': body.get('metadata', {}),
            'processing_timestamp': int(time.time()),
            'message_id': record.get('messageId')
        }

        # Write to DynamoDB
        response = table.put_item(Item=item)

        logger.info(f"Successfully processed leaderboard update for player {player_id}",
                   extra={"player_id": player_id, "score": score, "game_id": game_id})

        metrics.add_metric(name="LeaderboardUpdateSuccess", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="PlayerScore", unit=MetricUnit.Count, value=float(score))

        return True

    except Exception as e:
        logger.error(f"Error processing leaderboard update: {str(e)}",
                    extra={"error": str(e), "record": record})
        metrics.add_metric(name="LeaderboardUpdateError", unit=MetricUnit.Count, value=1)

        # Send to DLQ if configured
        if DLQ_URL:
            try:
                message_params = {
                    'QueueUrl': DLQ_URL,
                    'MessageBody': json.dumps({
                        'original_message': record,
                        'error': str(e),
                        'timestamp': int(time.time())
                    }),
                    'MessageAttributes': {
                        'ErrorType': {
                            'StringValue': type(e).__name__,
                            'DataType': 'String'
                        }
                    }
                }

                # Add FIFO queue parameters if DLQ is FIFO
                if DLQ_URL.endswith('.fifo'):
                    message_params['MessageGroupId'] = record.get('attributes', {}).get('MessageGroupId', 'default')
                    message_params['MessageDeduplicationId'] = f"{record.get('messageId', '')}-{int(time.time())}"

                sqs.send_message(**message_params)
                logger.info(f"Sent failed message to DLQ: {record.get('messageId')}")
            except Exception as dlq_error:
                logger.error(f"Failed to send message to DLQ: {str(dlq_error)}")

        raise

@logger.inject_lambda_context
@metrics.log_metrics
@tracer.capture_lambda_handler
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing SQS messages containing leaderboard updates.

    Args:
        event: SQS event containing messages
        context: Lambda context object

    Returns:
        dict: Response with batch item failures
    """
    logger.info(f"Processing {len(event.get('Records', []))} messages")

    batch_item_failures = []
    successful_count = 0
    failed_count = 0

    for record in event.get('Records', []):
        try:
            if process_leaderboard_update(record):
                successful_count += 1
            else:
                # Mark as failure if validation fails
                batch_item_failures.append({
                    'itemIdentifier': record['messageId']
                })
                failed_count += 1

        except Exception as e:
            # Mark as failure for processing errors
            batch_item_failures.append({
                'itemIdentifier': record['messageId']
            })
            failed_count += 1
            logger.error(f"Failed to process message {record['messageId']}: {str(e)}")

    # Log summary
    logger.info(f"Processing complete. Success: {successful_count}, Failed: {failed_count}")
    metrics.add_metric(name="BatchProcessingSuccess", unit=MetricUnit.Count, value=successful_count)
    metrics.add_metric(name="BatchProcessingFailed", unit=MetricUnit.Count, value=failed_count)

    # Return batch item failures for retry
    return {
        'batchItemFailures': batch_item_failures
    }