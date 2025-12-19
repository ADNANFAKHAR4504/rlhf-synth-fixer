"""Answer validation handler for quiz platform."""
import json
import boto3
import redis
import os

dynamodb = boto3.resource('dynamodb')
questions_table = dynamodb.Table(os.environ['QUESTIONS_TABLE'])
answers_table = dynamodb.Table(os.environ['ANSWERS_TABLE'])
participants_table = dynamodb.Table(os.environ['PARTICIPANTS_TABLE'])


def handler(event, context):
    """Validate quiz answers and update scores."""
    body = json.loads(event['body'])
    participant_id = body['participant_id']
    quiz_id = body['quiz_id']
    question_id = body['question_id']
    answer = body['answer']

    # Get the correct answer from questions table
    question_response = questions_table.get_item(
        Key={
            'quiz_id': quiz_id,
            'question_id': question_id
        }
    )

    if 'Item' not in question_response:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Question not found'})
        }

    question = question_response['Item']
    correct_answer = question['correct_answer']
    points = question.get('points', 10)

    # Check if answer is correct
    is_correct = answer == correct_answer
    score_earned = points if is_correct else 0

    # Store the answer
    answers_table.put_item(
        Item={
            'participant_id': participant_id,
            'question_id': question_id,
            'quiz_id': quiz_id,
            'answer': answer,
            'is_correct': is_correct,
            'score_earned': score_earned,
            'answered_at': context.aws_request_id
        }
    )

    # Update participant's total score
    participants_table.update_item(
        Key={
            'participant_id': participant_id,
            'quiz_id': quiz_id
        },
        UpdateExpression='ADD total_score :score, questions_answered :one',
        ExpressionAttributeValues={
            ':score': score_earned,
            ':one': 1
        }
    )

    # Update Redis leaderboard (sorted set)
    try:
        redis_endpoint = os.environ.get('REDIS_ENDPOINT')
        if redis_endpoint:
            r = redis.Redis(host=redis_endpoint, port=6379, decode_responses=True)
            r.zincrby(f'leaderboard:{quiz_id}', score_earned, participant_id)
    except Exception as e:
        print(f"Redis update failed: {e}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'is_correct': is_correct,
            'score_earned': score_earned,
            'correct_answer': correct_answer if not is_correct else None
        })
    }
