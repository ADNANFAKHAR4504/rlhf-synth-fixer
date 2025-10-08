"""Leaderboard handler for quiz platform."""
import json
import boto3
import redis
import os

dynamodb = boto3.resource('dynamodb')
participants_table = dynamodb.Table(os.environ['PARTICIPANTS_TABLE'])


def handler(event, context):
    """Get leaderboard for a quiz."""
    quiz_id = event['pathParameters']['quiz_id']
    top_n = int(event.get('queryStringParameters', {}).get('top', 10))

    try:
        # Get leaderboard from Redis
        redis_endpoint = os.environ.get('REDIS_ENDPOINT')
        if redis_endpoint:
            r = redis.Redis(host=redis_endpoint, port=6379, decode_responses=True)
            leaderboard = r.zrevrange(
                f'leaderboard:{quiz_id}', 0, top_n-1, withscores=True
            )

            # Enrich with participant info
            result = []
            for rank, (participant_id, score) in enumerate(leaderboard, 1):
                participant_data = participants_table.get_item(
                    Key={'participant_id': participant_id, 'quiz_id': quiz_id}
                ).get('Item', {})

                result.append({
                    'rank': rank,
                    'participant_id': participant_id,
                    'score': score,
                    'user_info': participant_data.get('user_info', {})
                })

            return {
                'statusCode': 200,
                'body': json.dumps(result)
            }
    except Exception as e:
        # Fallback to DynamoDB if Redis fails
        response = participants_table.query(
            IndexName='QuizParticipantsIndex',
            KeyConditionExpression='quiz_id = :quiz_id',
            ExpressionAttributeValues={':quiz_id': quiz_id},
            ScanIndexForward=False,
            Limit=top_n
        )

        result = []
        for rank, item in enumerate(response['Items'], 1):
            result.append({
                'rank': rank,
                'participant_id': item['participant_id'],
                'score': float(item.get('total_score', 0)),
                'user_info': item.get('user_info', {})
            })

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
