"""
Analytics processor Lambda function.

This function processes transactions from the analytics queue
for analytics and reporting purposes.
"""

import json
import os

import boto3

cloudwatch = boto3.client('cloudwatch')


def handler(event, context):
    """
    Lambda handler for processing analytics data.
    
    Args:
        event: SQS event
        context: Lambda context
        
    Returns:
        Success response
    """
    try:
        processed_count = 0
        
        for record in event.get('Records', []):
            message_body = record.get('body', '{}')
            message_data = json.loads(message_body)
            
            processed_count += 1
        
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'AnalyticsProcessed',
                    'Value': processed_count,
                    'Unit': 'Count'
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Analytics processed successfully',
                'processed_count': processed_count
            })
        }
        
    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'AnalyticsErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
