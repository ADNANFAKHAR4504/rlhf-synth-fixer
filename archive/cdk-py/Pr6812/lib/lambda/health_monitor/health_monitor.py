import json
import os
import boto3
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')
apigateway = boto3.client('apigateway')

ALARM_TOPIC_ARN = os.environ['ALARM_TOPIC_ARN']
API_NAME = os.environ['API_NAME']


def handler(event, context):
    """
    Monitors system health metrics and triggers recovery actions if needed.
    Checks API Gateway, Lambda, and DynamoDB metrics.
    """
    try:
        health_status = {
            'timestamp': datetime.utcnow().isoformat(),
            'checks': []
        }

        # Check API Gateway metrics
        api_health = check_api_gateway_health()
        health_status['checks'].append(api_health)

        # Check Lambda error rates
        lambda_health = check_lambda_health()
        health_status['checks'].append(lambda_health)

        # Check DynamoDB throttling
        dynamodb_health = check_dynamodb_health()
        health_status['checks'].append(dynamodb_health)

        # Overall health status
        all_healthy = all(check['status'] == 'healthy' for check in health_status['checks'])
        health_status['overall_status'] = 'healthy' if all_healthy else 'degraded'

        # If degraded, send notification
        if not all_healthy:
            send_health_alert(health_status)

        return {
            'statusCode': 200,
            'body': json.dumps(health_status)
        }

    except Exception as e:
        print(f"Health monitor error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Health check failed',
                'message': str(e)
            })
        }


def check_api_gateway_health():
    """Check API Gateway latency and error rates"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        # Get average latency
        latency_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/ApiGateway',
            MetricName='Latency',
            Dimensions=[
                {'Name': 'ApiName', 'Value': API_NAME},
                {'Name': 'Stage', 'Value': 'prod'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Average']
        )

        avg_latency = 0
        if latency_response['Datapoints']:
            avg_latency = latency_response['Datapoints'][0]['Average']

        status = 'healthy' if avg_latency < 1000 else 'unhealthy'

        return {
            'service': 'API Gateway',
            'metric': 'latency',
            'value': avg_latency,
            'threshold': 1000,
            'status': status
        }

    except Exception as e:
        print(f"API Gateway health check error: {str(e)}")
        return {
            'service': 'API Gateway',
            'status': 'unknown',
            'error': str(e)
        }


def check_lambda_health():
    """Check Lambda error rates"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        # Get error count
        error_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Errors',
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Sum']
        )

        total_errors = 0
        if error_response['Datapoints']:
            total_errors = sum(dp['Sum'] for dp in error_response['Datapoints'])

        status = 'healthy' if total_errors < 10 else 'unhealthy'

        return {
            'service': 'Lambda',
            'metric': 'errors',
            'value': total_errors,
            'threshold': 10,
            'status': status
        }

    except Exception as e:
        print(f"Lambda health check error: {str(e)}")
        return {
            'service': 'Lambda',
            'status': 'unknown',
            'error': str(e)
        }


def check_dynamodb_health():
    """Check DynamoDB throttling"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        # Get throttle count
        throttle_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/DynamoDB',
            MetricName='UserErrors',
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Sum']
        )

        throttle_count = 0
        if throttle_response['Datapoints']:
            throttle_count = sum(dp['Sum'] for dp in throttle_response['Datapoints'])

        status = 'healthy' if throttle_count < 10 else 'unhealthy'

        return {
            'service': 'DynamoDB',
            'metric': 'throttles',
            'value': throttle_count,
            'threshold': 10,
            'status': status
        }

    except Exception as e:
        print(f"DynamoDB health check error: {str(e)}")
        return {
            'service': 'DynamoDB',
            'status': 'unknown',
            'error': str(e)
        }


def send_health_alert(health_status):
    """Send health alert to SNS topic"""
    try:
        message = {
            'subject': 'Payment System Health Alert',
            'timestamp': health_status['timestamp'],
            'overall_status': health_status['overall_status'],
            'checks': health_status['checks']
        }

        sns.publish(
            TopicArn=ALARM_TOPIC_ARN,
            Subject='Payment System Health Alert',
            Message=json.dumps(message, indent=2)
        )

        print(f"Health alert sent: {health_status['overall_status']}")

    except Exception as e:
        print(f"Failed to send health alert: {str(e)}")
