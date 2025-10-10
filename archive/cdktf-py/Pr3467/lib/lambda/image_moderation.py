import json
import boto3
import os
from datetime import datetime

# Initialize clients as None - will be created in handler or get_clients
rekognition = None
dynamodb = None
sqs = None
sns = None

def get_clients():
    """Initialize AWS clients."""
    global rekognition, dynamodb, sqs, sns
    region = os.environ.get('AWS_REGION', 'us-east-1')
    if rekognition is None:
        rekognition = boto3.client('rekognition', region_name=region)
    if dynamodb is None:
        dynamodb = boto3.resource('dynamodb', region_name=region)
    if sqs is None:
        sqs = boto3.client('sqs', region_name=region)
    if sns is None:
        sns = boto3.client('sns', region_name=region)
    return rekognition, dynamodb, sqs, sns

MODERATION_TABLE = os.environ['MODERATION_TABLE']
HUMAN_REVIEW_QUEUE = os.environ['HUMAN_REVIEW_QUEUE']
NOTIFICATION_TOPIC = os.environ['NOTIFICATION_TOPIC']
CONFIDENCE_THRESHOLD = float(os.environ.get('CONFIDENCE_THRESHOLD', 75))

def handler(event, context):
    """Process image moderation using AWS Rekognition."""
    global rekognition, dynamodb, sqs, sns
    rekognition, dynamodb, sqs, sns = get_clients()

    try:
        content_id = event['contentId']
        s3_bucket = event['s3Bucket']
        s3_key = event['s3Key']

        # Call Rekognition to detect moderation labels
        response = rekognition.detect_moderation_labels(
            Image={
                'S3Object': {
                    'Bucket': s3_bucket,
                    'Name': s3_key
                }
            },
            MinConfidence=60.0
        )

        moderation_labels = response.get('ModerationLabels', [])

        # Check if any labels exceed threshold
        requires_review = False
        high_confidence_labels = []

        for label in moderation_labels:
            if label['Confidence'] >= CONFIDENCE_THRESHOLD:
                requires_review = True
                high_confidence_labels.append({
                    'Name': label['Name'],
                    'Confidence': label['Confidence'],
                    'ParentName': label.get('ParentName', '')
                })

        # Store result in DynamoDB
        table = dynamodb.Table(MODERATION_TABLE)
        timestamp = int(datetime.utcnow().timestamp() * 1000)

        result = {
            'contentId': content_id,
            'timestamp': timestamp,
            'contentType': 'image',
            's3Location': f"s3://{s3_bucket}/{s3_key}",
            'moderationLabels': high_confidence_labels,
            'requiresReview': requires_review,
            'reviewStatus': 'pending' if requires_review else 'approved',
            'processedAt': datetime.utcnow().isoformat()
        }

        table.put_item(Item=result)

        # If requires review, send notification
        if requires_review:
            message = {
                'contentId': content_id,
                'contentType': 'image',
                'labels': high_confidence_labels,
                's3Location': f"s3://{s3_bucket}/{s3_key}"
            }

            sns.publish(
                TopicArn=NOTIFICATION_TOPIC,
                Message=json.dumps(message),
                Subject='Content Requires Manual Review'
            )

        return {
            'statusCode': 200,
            'contentId': content_id,
            'requiresReview': requires_review,
            'moderationResult': result
        }

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise