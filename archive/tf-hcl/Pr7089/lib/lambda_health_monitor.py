import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.client('dynamodb')

def handler(event, context):
    """
    Health monitoring Lambda function that checks DynamoDB table status.
    """
    table_name = os.environ.get('DYNAMODB_TABLE_NAME', 'transactions')
    sns_topic_arn = os.environ.get('SNS_TOPIC_ARN', '')
    
    try:
        # Check DynamoDB table status
        response = dynamodb.describe_table(TableName=table_name)
        
        table_status = response['Table']['TableStatus']
        item_count = response['Table'].get('ItemCount', 0)
        table_size = response['Table'].get('TableSizeBytes', 0)
        
        # Check if table is healthy
        is_healthy = table_status == 'ACTIVE'
        
        health_response = {
            'statusCode': 200 if is_healthy else 503,
            'body': json.dumps({
                'status': 'healthy' if is_healthy else 'unhealthy',
                'table_status': table_status,
                'item_count': item_count,
                'table_size_bytes': table_size,
                'timestamp': datetime.utcnow().isoformat(),
                'region': os.environ.get('AWS_REGION', 'unknown')
            })
        }
        
        # Send notification if unhealthy
        if not is_healthy and sns_topic_arn:
            sns = boto3.client('sns')
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject='DynamoDB Table Health Alert',
                Message=f'DynamoDB table {table_name} is not healthy. Status: {table_status}'
            )
        
        return health_response
        
    except Exception as e:
        error_response = {
            'statusCode': 503,
            'body': json.dumps({
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'region': os.environ.get('AWS_REGION', 'unknown')
            })
        }
        
        # Send error notification
        if sns_topic_arn:
            try:
                sns = boto3.client('sns')
                sns.publish(
                    TopicArn=sns_topic_arn,
                    Subject='Health Check Error',
                    Message=f'Error checking health: {str(e)}'
                )
            except:
                pass  # Don't fail health check due to SNS error
        
        return error_response