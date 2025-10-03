"""WebSocket connection handler for quiz platform."""
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
participants_table = dynamodb.Table(os.environ['PARTICIPANTS_TABLE'])
apigateway = boto3.client(
    'apigatewaymanagementapi',
    endpoint_url=f"https://{os.environ['API_ID']}.execute-api."
                 f"{os.environ['AWS_REGION']}.amazonaws.com/{os.environ['STAGE']}"
)


def handler(event, context):
    """Handle WebSocket connection events."""
    route_key = event['requestContext']['routeKey']
    connection_id = event['requestContext']['connectionId']

    if route_key == '$connect':
        # Store connection
        participants_table.put_item(
            Item={
                'participant_id': connection_id,
                'quiz_id': 'active',
                'connected_at': datetime.utcnow().isoformat(),
                'status': 'connected'
            }
        )
        return {'statusCode': 200}

    if route_key == '$disconnect':
        # Remove connection
        participants_table.update_item(
            Key={'participant_id': connection_id, 'quiz_id': 'active'},
            UpdateExpression='SET #status = :status, disconnected_at = :timestamp',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'disconnected',
                ':timestamp': datetime.utcnow().isoformat()
            }
        )
        return {'statusCode': 200}

    if route_key == '$default':
        # Handle message
        body = json.loads(event['body'])
        action = body.get('action')

        if action == 'join_quiz':
            quiz_id = body.get('quiz_id')
            user_info = body.get('user_info')

            participants_table.update_item(
                Key={'participant_id': connection_id, 'quiz_id': quiz_id},
                UpdateExpression='SET user_info = :info, joined_at = :timestamp',
                ExpressionAttributeValues={
                    ':info': user_info,
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )

            response = {
                'action': 'quiz_joined',
                'quiz_id': quiz_id,
                'message': 'Successfully joined the quiz!'
            }

            apigateway.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps(response)
            )

        return {'statusCode': 200}

    return {'statusCode': 400}
