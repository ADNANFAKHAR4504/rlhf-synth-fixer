import json
import random
import boto3
from datetime import datetime

def lambda_handler(event, context):
    """
    Lambda function to publish custom business metrics to CloudWatch.
    Simulates order processing time and publishes to custom namespace.
    """
    
    try:
        # Generate random order processing time between 50 and 500 milliseconds
        processing_time = random.randint(50, 500)
        
        # Create CloudWatch client
        cloudwatch = boto3.client('cloudwatch')
        
        # Publish metric to CloudWatch
        response = cloudwatch.put_metric_data(
            Namespace='Production/ECommerce',
            MetricData=[
                {
                    'MetricName': 'OrderProcessingTime',
                    'Value': processing_time,
                    'Unit': 'Milliseconds',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        
        # Log successful metric publication
        print(f"Successfully published OrderProcessingTime metric: {processing_time}ms")
        print(f"CloudWatch response: {json.dumps(response, default=str)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Metric published successfully',
                'processing_time': processing_time,
                'unit': 'milliseconds'
            })
        }
        
    except Exception as e:
        # Log error
        print(f"Error publishing metric to CloudWatch: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to publish metric'
            })
        }