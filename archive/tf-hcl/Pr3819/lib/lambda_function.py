import json
import boto3
import os
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
# Note: Comprehend is not available in us-west-1, using us-west-2 instead
comprehend = boto3.client('comprehend', region_name='us-west-2')
dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
s3 = boto3.client('s3', region_name='us-west-1')
cloudwatch = boto3.client('cloudwatch', region_name='us-west-1')

# Get environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']

# Get DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])
        feedback_text = body.get('feedback', '')
        customer_id = body.get('customer_id', 'anonymous')

        if not feedback_text:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Feedback text is required'})
            }

        # Generate unique feedback ID
        feedback_id = str(uuid.uuid4())
        timestamp = int(datetime.utcnow().timestamp())

        # Analyze sentiment using AWS Comprehend
        sentiment_response = comprehend.detect_sentiment(
            Text=feedback_text,
            LanguageCode='en'
        )

        sentiment = sentiment_response['Sentiment']
        sentiment_scores = sentiment_response['SentimentScore']

        # Prepare feedback data
        feedback_data = {
            'feedbackId': feedback_id,
            'timestamp': timestamp,
            'customerId': customer_id,
            'feedbackText': feedback_text,
            'sentiment': sentiment,
            'sentimentScores': {
                'positive': Decimal(str(sentiment_scores['Positive'])),
                'negative': Decimal(str(sentiment_scores['Negative'])),
                'neutral': Decimal(str(sentiment_scores['Neutral'])),
                'mixed': Decimal(str(sentiment_scores['Mixed']))
            }
        }

        # Store in DynamoDB
        table.put_item(Item=feedback_data)

        # Export to S3 with year/month/day partitioning
        dt = datetime.utcnow()
        s3_key = f"feedback/year={dt.year}/month={dt.month:02d}/day={dt.day:02d}/{feedback_id}.json"

        # Convert Decimal to float for JSON serialization
        s3_data = {
            'feedbackId': feedback_id,
            'timestamp': timestamp,
            'customerId': customer_id,
            'feedbackText': feedback_text,
            'sentiment': sentiment,
            'sentimentScores': {
                'positive': float(sentiment_scores['Positive']),
                'negative': float(sentiment_scores['Negative']),
                'neutral': float(sentiment_scores['Neutral']),
                'mixed': float(sentiment_scores['Mixed'])
            }
        }

        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(s3_data),
            ContentType='application/json'
        )

        # Publish custom CloudWatch metric
        cloudwatch.put_metric_data(
            Namespace='FeedbackProcessing',
            MetricData=[
                {
                    'MetricName': 'FeedbackProcessed',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'Sentiment',
                            'Value': sentiment
                        }
                    ]
                }
            ]
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Feedback processed successfully',
                'feedbackId': feedback_id,
                'sentiment': sentiment
            })
        }

    except Exception as e:
        # Log error and publish error metric
        print(f"Error processing feedback: {str(e)}")

        cloudwatch.put_metric_data(
            Namespace='FeedbackProcessing',
            MetricData=[
                {
                    'MetricName': 'ProcessingErrors',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to process feedback'})
        }
