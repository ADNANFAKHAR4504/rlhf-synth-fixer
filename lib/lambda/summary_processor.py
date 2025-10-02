"""
summary_processor.py

Lambda function to generate daily inventory summary reports.
"""

import json
import os
import boto3
from datetime import datetime, timedelta
from decimal import Decimal
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization."""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)

def handler(event, context):
    """
    Generate daily inventory summary report.
    """
    try:
        logger.info("Starting daily inventory summary generation")

        # Get DynamoDB table
        table = dynamodb.Table(TABLE_NAME)

        # Calculate time range for the last 24 hours
        end_time = Decimal(str(datetime.utcnow().timestamp()))
        start_time = Decimal(str((datetime.utcnow() - timedelta(days=1)).timestamp()))

        # Scan table for recent updates (in production, consider using GSI for better performance)
        response = table.scan(
            FilterExpression='#ts BETWEEN :start AND :end',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':start': start_time,
                ':end': end_time
            }
        )

        items = response.get('Items', [])

        # Continue scanning if there are more items
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='#ts BETWEEN :start AND :end',
                ExpressionAttributeNames={'#ts': 'timestamp'},
                ExpressionAttributeValues={
                    ':start': start_time,
                    ':end': end_time
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))

        # Generate summary statistics
        summary = {
            'date': datetime.utcnow().isoformat(),
            'environment': ENVIRONMENT,
            'total_updates': len(items),
            'unique_products': len(set(item['product_id'] for item in items)),
            'warehouses': list(set(item.get('warehouse_id', 'unknown') for item in items)),
            'total_inventory_value': sum(
                float(item.get('quantity', 0)) * float(item.get('price', 0))
                for item in items
            )
        }

        # Group by product for detailed summary
        product_summary = {}
        for item in items:
            product_id = item['product_id']
            if product_id not in product_summary:
                product_summary[product_id] = {
                    'total_quantity': 0,
                    'average_price': 0,
                    'update_count': 0,
                    'warehouses': set()
                }

            product_summary[product_id]['total_quantity'] += float(item.get('quantity', 0))
            product_summary[product_id]['average_price'] += float(item.get('price', 0))
            product_summary[product_id]['update_count'] += 1
            product_summary[product_id]['warehouses'].add(item.get('warehouse_id', 'unknown'))

        # Calculate averages
        for product_id, data in product_summary.items():
            if data['update_count'] > 0:
                data['average_price'] = data['average_price'] / data['update_count']
            data['warehouses'] = list(data['warehouses'])

        summary['product_details'] = product_summary

        # Send metrics to CloudWatch
        send_summary_metrics(summary)

        logger.info("Summary generated successfully: %s", json.dumps(summary, cls=DecimalEncoder))

        return {
            'statusCode': 200,
            'body': json.dumps(summary, cls=DecimalEncoder)
        }

    except Exception as e:
        logger.error("Error generating summary: %s", str(e))

        # Send error metric
        cloudwatch.put_metric_data(
            Namespace='InventoryProcessing',
            MetricData=[
                {
                    'MetricName': 'SummaryGenerationErrors',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )

        raise

def send_summary_metrics(summary):
    """
    Send summary metrics to CloudWatch.
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='InventoryProcessing',
            MetricData=[
                {
                    'MetricName': 'DailyUpdates',
                    'Value': summary['total_updates'],
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                },
                {
                    'MetricName': 'UniqueProducts',
                    'Value': summary['unique_products'],
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                },
                {
                    'MetricName': 'TotalInventoryValue',
                    'Value': summary['total_inventory_value'],
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )
    except Exception as e:
        logger.error("Error sending summary metrics: %s", str(e))