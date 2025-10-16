"""
Metric Aggregator Lambda Function
Aggregates CloudWatch metrics and stores them in DynamoDB
"""
import json
import boto3
import os
import logging
from datetime import datetime, timedelta
from decimal import Decimal

# Configure logging
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger = logging.getLogger()
logger.setLevel(log_level)

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    """
    Main handler function for metric aggregation
    Triggered by EventBridge on a schedule
    """
    logger.info(f"Starting metric aggregation at {datetime.utcnow().isoformat()}")
    
    table_name = os.environ.get('DYNAMODB_TABLE_NAME')
    api_gateway_name = os.environ.get('API_GATEWAY_NAME')
    lambda_function_name = os.environ.get('LAMBDA_FUNCTION_NAME')
    rds_instance_id = os.environ.get('RDS_INSTANCE_ID')
    
    if not table_name:
        logger.error("DYNAMODB_TABLE_NAME environment variable not set")
        return {
            'statusCode': 500,
            'body': json.dumps('Configuration error: Missing table name')
        }
    
    table = dynamodb.Table(table_name)
    
    # Define time range for aggregation (last 5 minutes)
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=5)
    
    metrics_aggregated = 0
    errors = []
    
    # Define metrics to aggregate
    metrics_to_aggregate = []
    
    if api_gateway_name:
        metrics_to_aggregate.extend([
            {
                'namespace': 'AWS/ApiGateway',
                'metric_name': 'Count',
                'dimensions': [{'Name': 'ApiName', 'Value': api_gateway_name}],
                'stat': 'Sum',
                'unit': 'Count'
            },
            {
                'namespace': 'AWS/ApiGateway',
                'metric_name': 'Latency',
                'dimensions': [{'Name': 'ApiName', 'Value': api_gateway_name}],
                'stat': 'Average',
                'unit': 'Milliseconds'
            },
            {
                'namespace': 'AWS/ApiGateway',
                'metric_name': '4XXError',
                'dimensions': [{'Name': 'ApiName', 'Value': api_gateway_name}],
                'stat': 'Sum',
                'unit': 'Count'
            },
            {
                'namespace': 'AWS/ApiGateway',
                'metric_name': '5XXError',
                'dimensions': [{'Name': 'ApiName', 'Value': api_gateway_name}],
                'stat': 'Sum',
                'unit': 'Count'
            }
        ])
    
    if lambda_function_name:
        metrics_to_aggregate.extend([
            {
                'namespace': 'AWS/Lambda',
                'metric_name': 'Invocations',
                'dimensions': [{'Name': 'FunctionName', 'Value': lambda_function_name}],
                'stat': 'Sum',
                'unit': 'Count'
            },
            {
                'namespace': 'AWS/Lambda',
                'metric_name': 'Duration',
                'dimensions': [{'Name': 'FunctionName', 'Value': lambda_function_name}],
                'stat': 'Average',
                'unit': 'Milliseconds'
            },
            {
                'namespace': 'AWS/Lambda',
                'metric_name': 'Errors',
                'dimensions': [{'Name': 'FunctionName', 'Value': lambda_function_name}],
                'stat': 'Sum',
                'unit': 'Count'
            }
        ])
    
    if rds_instance_id:
        metrics_to_aggregate.extend([
            {
                'namespace': 'AWS/RDS',
                'metric_name': 'CPUUtilization',
                'dimensions': [{'Name': 'DBInstanceIdentifier', 'Value': rds_instance_id}],
                'stat': 'Average',
                'unit': 'Percent'
            },
            {
                'namespace': 'AWS/RDS',
                'metric_name': 'DatabaseConnections',
                'dimensions': [{'Name': 'DBInstanceIdentifier', 'Value': rds_instance_id}],
                'stat': 'Average',
                'unit': 'Count'
            },
            {
                'namespace': 'AWS/RDS',
                'metric_name': 'ReadLatency',
                'dimensions': [{'Name': 'DBInstanceIdentifier', 'Value': rds_instance_id}],
                'stat': 'Average',
                'unit': 'Seconds'
            },
            {
                'namespace': 'AWS/RDS',
                'metric_name': 'WriteLatency',
                'dimensions': [{'Name': 'DBInstanceIdentifier', 'Value': rds_instance_id}],
                'stat': 'Average',
                'unit': 'Seconds'
            }
        ])
    
    # Aggregate each metric
    for metric_config in metrics_to_aggregate:
        try:
            metric_id = f"{metric_config['namespace']}/{metric_config['metric_name']}"
            if metric_config.get('dimensions'):
                dim_str = '-'.join([f"{d['Name']}:{d['Value']}" for d in metric_config['dimensions']])
                metric_id = f"{metric_id}/{dim_str}"
            
            logger.info(f"Aggregating metric: {metric_id}")
            
            response = cloudwatch.get_metric_statistics(
                Namespace=metric_config['namespace'],
                MetricName=metric_config['metric_name'],
                Dimensions=metric_config['dimensions'],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=[metric_config['stat']]
            )
            
            datapoints = response.get('Datapoints', [])
            
            if datapoints:
                for datapoint in datapoints:
                    timestamp = int(datapoint['Timestamp'].timestamp())
                    value = datapoint.get(metric_config['stat'], 0)
                    
                    # Store in DynamoDB
                    item = {
                        'metricId': metric_id,
                        'timestamp': timestamp,
                        'dateHour': datapoint['Timestamp'].strftime('%Y-%m-%d-%H'),
                        'value': Decimal(str(value)),
                        'unit': metric_config.get('unit', 'None'),
                        'stat': metric_config['stat'],
                        'namespace': metric_config['namespace'],
                        'metricName': metric_config['metric_name']
                    }
                    
                    table.put_item(Item=item)
                    metrics_aggregated += 1
                    logger.info(f"Stored metric: {metric_id} = {value}")
            else:
                logger.info(f"No datapoints found for metric: {metric_id}")
                
        except Exception as e:
            error_msg = f"Error aggregating metric {metric_config['metric_name']}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            errors.append(error_msg)
    
    result = {
        'statusCode': 200 if not errors else 207,
        'body': json.dumps({
            'message': 'Metrics aggregated successfully',
            'metrics_aggregated': metrics_aggregated,
            'errors': errors,
            'timestamp': end_time.isoformat()
        })
    }
    
    logger.info(f"Aggregation complete. Metrics aggregated: {metrics_aggregated}")
    
    return result
