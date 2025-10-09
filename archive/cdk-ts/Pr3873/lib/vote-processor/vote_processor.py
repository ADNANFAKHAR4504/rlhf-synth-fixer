import json
import os
import boto3
import logging
from datetime import datetime
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
votes_table_name = os.environ['VOTES_TABLE_NAME']
votes_table = dynamodb.Table(votes_table_name)

def handler(event, context):
    """
    Lambda function to process vote submissions with duplicate prevention.
    """
    logger.info(f"Received event: {json.dumps(event)}")

    try:
        # Handle API Gateway request
        http_method = event.get('httpMethod', '')

        if http_method == 'POST':
            return handle_vote_submission(event)
        elif http_method == 'GET':
            return handle_get_vote(event)
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }

def handle_vote_submission(event):
    """
    Handle POST request to submit a vote with conditional write.
    """
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        poll_id = body.get('pollId')
        choice = body.get('choice')

        # Validate required fields
        if not all([user_id, poll_id, choice]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required fields: userId, pollId, choice'
                })
            }

        timestamp = datetime.utcnow().isoformat()

        # Use conditional write to prevent duplicate votes
        try:
            response = votes_table.put_item(
                Item={
                    'userId': user_id,
                    'pollId': poll_id,
                    'choice': choice,
                    'timestamp': timestamp,
                    'ttl': int(datetime.utcnow().timestamp()) + 86400 * 90  # 90 days TTL
                },
                ConditionExpression='attribute_not_exists(userId) AND attribute_not_exists(pollId)',
                ReturnValuesOnConditionCheckFailure='ALL_OLD'
            )

            logger.info(f"Vote recorded: userId={user_id}, pollId={poll_id}, choice={choice}")

            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Vote recorded successfully',
                    'userId': user_id,
                    'pollId': poll_id,
                    'choice': choice,
                    'timestamp': timestamp
                })
            }

        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                # User has already voted
                existing_vote = e.response.get('Item', {})
                logger.warning(f"Duplicate vote attempt: userId={user_id}, pollId={poll_id}")

                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'User has already voted in this poll',
                        'existingVote': {
                            'choice': existing_vote.get('choice', ''),
                            'timestamp': existing_vote.get('timestamp', '')
                        }
                    })
                }
            else:
                raise

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON body'})
        }

def handle_get_vote(event):
    """
    Handle GET request to retrieve a user's vote for a poll.
    """
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        user_id = query_params.get('userId')
        poll_id = query_params.get('pollId')

        if not all([user_id, poll_id]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required parameters: userId, pollId'
                })
            }

        response = votes_table.get_item(
            Key={
                'userId': user_id,
                'pollId': poll_id
            }
        )

        if 'Item' in response:
            item = response['Item']
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'userId': item['userId'],
                    'pollId': item['pollId'],
                    'choice': item['choice'],
                    'timestamp': item['timestamp']
                })
            }
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Vote not found'
                })
            }

    except Exception as e:
        logger.error(f"Error retrieving vote: {str(e)}")
        raise
