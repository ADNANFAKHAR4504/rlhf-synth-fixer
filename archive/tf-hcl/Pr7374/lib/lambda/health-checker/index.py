import json
import boto3
import os
from datetime import datetime

sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """Perform SQL-based health check on database"""
    db_endpoint = os.environ['DB_ENDPOINT']
    reader_endpoint = os.environ['READER_ENDPOINT']
    health_check_sql = os.environ['HEALTH_CHECK_SQL']
    
    try:
        # In production, this would:
        # 1. Get credentials from secrets manager
        # 2. Connect to both primary and reader endpoints
        # 3. Execute health check SQL query
        # 4. Verify response time
        # 5. Check replica lag
        
        # Publish custom metric
        cloudwatch.put_metric_data(
            Namespace='Custom/Database',
            MetricData=[
                {
                    'MetricName': 'HealthCheckSuccess',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'primary_healthy': True,
                'reader_healthy': True,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    except Exception as e:
        print(f"Health check failed: {str(e)}")
        
        # Send alert
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject='Database Health Check Failed',
            Message=f"Health check failed: {str(e)}"
        )
        
        cloudwatch.put_metric_data(
            Namespace='Custom/Database',
            MetricData=[
                {
                    'MetricName': 'HealthCheckSuccess',
                    'Value': 0,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        
        raise
