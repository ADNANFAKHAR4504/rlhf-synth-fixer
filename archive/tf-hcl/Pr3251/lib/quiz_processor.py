import json
import boto3
import os
import logging
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize X-Ray tracing
patch_all()

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

@xray_recorder.capture('process_quiz')
def process_quiz(quiz_data):
    """Process a single quiz submission"""
    try:
        # Extract quiz information
        student_id = quiz_data['student_id']
        quiz_id = quiz_data['quiz_id']
        answers = quiz_data['answers']
        correct_answers = quiz_data.get('correct_answers', {})

        # Calculate score
        score = calculate_score(answers, correct_answers)

        # Prepare result item
        timestamp = datetime.utcnow().isoformat()
        result_item = {
            'student_id': student_id,
            'submission_timestamp': timestamp,
            'quiz_id': quiz_id,
            'score': score,
            'total_questions': len(correct_answers),
            'answers': answers,
            'processing_timestamp': timestamp,
            'status': 'completed'
        }

        # Store in DynamoDB
        table.put_item(Item=result_item)

        logger.info(f"Successfully processed quiz for student {student_id}, score: {score}")
        return result_item

    except Exception as e:
        logger.error(f"Error processing quiz: {str(e)}")
        raise

def calculate_score(student_answers, correct_answers):
    """Calculate quiz score based on answers"""
    if not correct_answers:
        return 0

    correct_count = 0
    for question_id, student_answer in student_answers.items():
        if question_id in correct_answers and student_answer == correct_answers[question_id]:
            correct_count += 1

    score = (correct_count / len(correct_answers)) * 100
    return round(score, 2)

@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """Main Lambda handler for processing SQS messages"""
    processed_count = 0
    failed_count = 0

    try:
        # Process each message in the batch
        for record in event['Records']:
            try:
                # Parse message body
                message_body = json.loads(record['body'])

                # Process quiz submission
                process_quiz(message_body)
                processed_count += 1

            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in message: {str(e)}")
                failed_count += 1
                # Message will be retried or sent to DLQ
                raise
            except Exception as e:
                logger.error(f"Failed to process message: {str(e)}")
                failed_count += 1
                # Re-raise to trigger retry/DLQ
                raise

        logger.info(f"Batch processing complete. Processed: {processed_count}, Failed: {failed_count}")

        # Return success if all messages processed
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Batch processed successfully',
                'processed': processed_count,
                'failed': failed_count
            })
        }

    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        # Partial batch failure - failed messages will be retried
        raise