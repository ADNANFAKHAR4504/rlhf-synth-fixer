"""Quiz scheduler handler for quiz platform."""
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
questions_table = dynamodb.Table(os.environ['QUESTIONS_TABLE'])
participants_table = dynamodb.Table(os.environ['PARTICIPANTS_TABLE'])
apigateway = boto3.client(
    'apigatewaymanagementapi',
    endpoint_url=f"https://{os.environ['API_ID']}.execute-api."
                 f"{os.environ['AWS_REGION']}.amazonaws.com/{os.environ['STAGE']}"
)


def handler(event, context):
    """Schedule and manage quiz sessions."""
    # Parse scheduled quiz details from event
    quiz_details = json.loads(event.get('detail', '{}'))
    quiz_id = quiz_details.get('quiz_id')
    action = quiz_details.get('action', 'start')

    if action == 'start':
        # Get quiz questions
        response = questions_table.query(
            KeyConditionExpression='quiz_id = :quiz_id',
            ExpressionAttributeValues={':quiz_id': quiz_id}
        )

        questions = response['Items']

        # Get all connected participants for this quiz
        participants = participants_table.query(
            IndexName='QuizParticipantsIndex',
            KeyConditionExpression='quiz_id = :quiz_id',
            FilterExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':quiz_id': quiz_id,
                ':status': 'connected'
            }
        )

        # Send first question to all participants
        if questions and participants['Items']:
            first_question = questions[0]
            message = {
                'action': 'new_question',
                'question': {
                    'id': first_question['question_id'],
                    'text': first_question['question_text'],
                    'options': first_question.get('options', []),
                    'time_limit': first_question.get('time_limit', 30),
                    'media_url': first_question.get('media_url')
                }
            }

            # Broadcast to all participants
            for participant in participants['Items']:
                try:
                    apigateway.post_to_connection(
                        ConnectionId=participant['participant_id'],
                        Data=json.dumps(message)
                    )
                except Exception as e:
                    print(f"Failed to send to {participant['participant_id']}: {e}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': f'Quiz {quiz_id} started successfully'})
        }

    if action == 'end':
        # Quiz ending logic - notify winners
        return {
            'statusCode': 200,
            'body': json.dumps({'message': f'Quiz {quiz_id} ended'})
        }

    return {'statusCode': 200}
