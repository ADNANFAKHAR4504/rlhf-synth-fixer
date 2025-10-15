import json
import boto3
import os
from datetime import datetime

# Initialize clients as None - will be created in handler or get_clients
comprehend = None
s3 = None
dynamodb = None
sqs = None
sns = None

def get_clients():
    """Initialize AWS clients."""
    global comprehend, s3, dynamodb, sqs, sns
    region = os.environ.get('AWS_REGION', 'us-east-1')
    if comprehend is None:
        comprehend = boto3.client('comprehend', region_name=region)
    if s3 is None:
        s3 = boto3.client('s3', region_name=region)
    if dynamodb is None:
        dynamodb = boto3.resource('dynamodb', region_name=region)
    if sqs is None:
        sqs = boto3.client('sqs', region_name=region)
    if sns is None:
        sns = boto3.client('sns', region_name=region)
    return comprehend, s3, dynamodb, sqs, sns

MODERATION_TABLE = os.environ['MODERATION_TABLE']
HUMAN_REVIEW_QUEUE = os.environ['HUMAN_REVIEW_QUEUE']
NOTIFICATION_TOPIC = os.environ['NOTIFICATION_TOPIC']
TOXICITY_THRESHOLD = float(os.environ.get('TOXICITY_THRESHOLD', 0.7))

def handler(event, context):
    """Process text moderation using AWS Comprehend."""
    global comprehend, s3, dynamodb, sqs, sns
    comprehend, s3, dynamodb, sqs, sns = get_clients()

    try:
        content_id = event['contentId']
        s3_bucket = event['s3Bucket']
        s3_key = event['s3Key']

        # Get text content from S3
        response = s3.get_object(Bucket=s3_bucket, Key=s3_key)
        text_content = response['Body'].read().decode('utf-8')

        # Limit text to 1KB for toxicity detection
        text_segments = [text_content[i:i+1024] for i in range(0, min(len(text_content), 10240), 1024)]

        # Detect toxicity
        toxicity_results = []
        max_toxicity_score = 0
        toxic_categories = []

        for segment in text_segments[:10]:  # API limit: 10 segments
            toxicity_response = comprehend.detect_toxic_content(
                TextSegments=[{'Text': segment}],
                LanguageCode='en'
            )

            for result in toxicity_response['ResultList']:
                toxicity_score = result.get('Toxicity', 0)
                if toxicity_score > max_toxicity_score:
                    max_toxicity_score = toxicity_score

                for label in result.get('Labels', []):
                    if label['Score'] > TOXICITY_THRESHOLD:
                        toxic_categories.append({
                            'Name': label['Name'],
                            'Score': label['Score']
                        })

        # Detect sentiment
        sentiment_response = comprehend.detect_sentiment(
            Text=text_content[:5000],  # Limit for sentiment API
            LanguageCode='en'
        )

        sentiment = sentiment_response.get('Sentiment', 'NEUTRAL')
        sentiment_scores = sentiment_response.get('SentimentScore', {})

        # Determine if review is needed
        requires_review = max_toxicity_score > TOXICITY_THRESHOLD or len(toxic_categories) > 0

        # Store result in DynamoDB
        table = dynamodb.Table(MODERATION_TABLE)
        timestamp = int(datetime.utcnow().timestamp() * 1000)

        result = {
            'contentId': content_id,
            'timestamp': timestamp,
            'contentType': 'text',
            's3Location': f"s3://{s3_bucket}/{s3_key}",
            'toxicityScore': max_toxicity_score,
            'toxicCategories': toxic_categories,
            'sentiment': sentiment,
            'sentimentScores': sentiment_scores,
            'requiresReview': requires_review,
            'reviewStatus': 'pending' if requires_review else 'approved',
            'processedAt': datetime.utcnow().isoformat()
        }

        table.put_item(Item=result)

        # If requires review, send notification
        if requires_review:
            message = {
                'contentId': content_id,
                'contentType': 'text',
                'toxicityScore': max_toxicity_score,
                'categories': toxic_categories,
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
        print(f"Error processing text: {str(e)}")
        raise