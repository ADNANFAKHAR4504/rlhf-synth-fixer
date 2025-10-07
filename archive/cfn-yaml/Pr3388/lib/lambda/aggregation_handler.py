import json
import boto3
import os
import datetime
import logging
from boto3.dynamodb.conditions import Key
from decimal import Decimal

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
s3 = boto3.client('s3', region_name=os.environ['REGION'])
sns = boto3.client('sns', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['TABLE_NAME'])

# Custom JSON encoder to handle Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    """
    Lambda function handler for daily survey data aggregation
    Aggregates yesterday's responses by survey and stores results in S3
    """
    try:
        logger.info("Starting daily aggregation process")
        
        # Get yesterday's date for aggregation
        yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        
        logger.info(f"Aggregating data for date: {yesterday}")
        
        # Get all survey responses from yesterday using scan with filter
        surveys = {}
        total_items_processed = 0
        
        # Scan with pagination to handle large datasets
        scan_kwargs = {
            'FilterExpression': Key('timestamp').begins_with(yesterday)
        }
        
        while True:
            response = table.scan(**scan_kwargs)
            
            # Group by survey ID
            for item in response.get('Items', []):
                survey_id = item['surveyId']
                if survey_id not in surveys:
                    surveys[survey_id] = []
                surveys[survey_id].append(item)
                total_items_processed += 1
            
            # Check if we need to continue scanning
            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        
        logger.info(f"Processed {total_items_processed} items across {len(surveys)} surveys")
        
        # Process aggregations for each survey
        aggregation_results = {
            'date': yesterday,
            'generated_at': datetime.datetime.now().isoformat(),
            'total_surveys': len(surveys),
            'total_responses': total_items_processed,
            'survey_data': {}
        }
        
        for survey_id, responses in surveys.items():
            # Enhanced aggregation with question analysis
            question_counts = {}
            response_times = []
            respondent_ids = set()
            
            for response in responses:
                # Track unique respondents
                if 'respondentId' in response:
                    respondent_ids.add(response['respondentId'])
                
                # Store response timestamp for analysis
                response_times.append(response['timestamp'])
                
                # Analyze each question-answer pair
                for question, answer in response.get('responses', {}).items():
                    if question not in question_counts:
                        question_counts[question] = {
                            'total_responses': 0,
                            'answer_distribution': {}
                        }
                    
                    question_counts[question]['total_responses'] += 1
                    
                    # Convert answer to string for consistent aggregation
                    answer_str = str(answer)
                    if answer_str not in question_counts[question]['answer_distribution']:
                        question_counts[question]['answer_distribution'][answer_str] = 0
                    
                    question_counts[question]['answer_distribution'][answer_str] += 1
            
            # Calculate response rate and timing statistics
            aggregation_results['survey_data'][survey_id] = {
                'total_responses': len(responses),
                'unique_respondents': len(respondent_ids),
                'first_response': min(response_times) if response_times else None,
                'last_response': max(response_times) if response_times else None,
                'questions': question_counts
            }
        
        # Save aggregation to S3
        s3_key = f"aggregations/daily/{yesterday}-aggregation.json"
        
        s3.put_object(
            Bucket=os.environ['BUCKET_NAME'],
            Key=s3_key,
            Body=json.dumps(aggregation_results, cls=DecimalEncoder, indent=2),
            ContentType='application/json',
            Metadata={
                'aggregation-date': yesterday,
                'generated-by': 'survey-aggregation-lambda',
                'total-responses': str(total_items_processed)
            }
        )
        
        logger.info(f"Aggregation saved to S3: {s3_key}")
        
        # Send success notification
        message = f"""Daily survey aggregation for {yesterday} completed successfully.

Summary:
- Date: {yesterday}
- Total Surveys: {len(surveys)}
- Total Responses: {total_items_processed}
- Aggregation File: s3://{os.environ['BUCKET_NAME']}/{s3_key}

Survey Breakdown:
{chr(10).join([f"- {survey_id}: {data['total_responses']} responses" for survey_id, data in aggregation_results['survey_data'].items()])}

Generated at: {aggregation_results['generated_at']}"""
        
        sns.publish(
            TopicArn=os.environ['TOPIC_ARN'],
            Subject=f"Survey Aggregation Complete - {yesterday}",
            Message=message
        )
        
        logger.info("Success notification sent")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Aggregation completed successfully',
                'date': yesterday,
                'total_surveys': len(surveys),
                'total_responses': total_items_processed,
                's3_location': f"s3://{os.environ['BUCKET_NAME']}/{s3_key}"
            })
        }
        
    except Exception as e:
        error_msg = f"Error during aggregation: {str(e)}"
        logger.error(error_msg)
        
        # Send error notification
        try:
            sns.publish(
                TopicArn=os.environ['TOPIC_ARN'],
                Subject="Error: Survey Aggregation Failed",
                Message=f"""An error occurred during the daily survey aggregation process.

Error Details:
{error_msg}

Date Attempted: {yesterday}
Timestamp: {datetime.datetime.now().isoformat()}

Please check CloudWatch logs for more details."""
            )
        except Exception as sns_error:
            logger.error(f"Failed to send error notification: {str(sns_error)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Aggregation failed', 'details': str(e)})
        }