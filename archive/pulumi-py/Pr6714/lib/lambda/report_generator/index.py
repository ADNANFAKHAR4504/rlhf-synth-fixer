"""
Report Generator Lambda function.

This function generates daily reports from transaction data and stores
them in S3 for long-term archival and analysis.
"""
import json
import os
import boto3
from typing import Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import csv
from io import StringIO

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
s3 = boto3.client('s3', region_name='us-east-1')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
BUCKET_NAME = os.environ['BUCKET_NAME']
table = dynamodb.Table(TABLE_NAME)


def generate_report(transactions: list) -> str:
    """
    Generate CSV report from transaction data.

    Args:
        transactions: List of transaction records

    Returns:
        CSV string containing report data
    """
    output = StringIO()

    if not transactions:
        return "No transactions for the reporting period"

    # Define CSV headers
    fieldnames = ['transaction_id', 'timestamp', 'amount', 'customer_id', 'merchant']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    # Calculate summary statistics
    total_amount = Decimal('0')
    transaction_count = 0

    for txn in transactions:
        # Convert Decimal to float for CSV
        row = {
            'transaction_id': txn.get('transaction_id', ''),
            'timestamp': txn.get('timestamp', ''),
            'amount': float(txn.get('amount', 0)),
            'customer_id': txn.get('customer_id', ''),
            'merchant': txn.get('merchant', '')
        }
        writer.writerow(row)

        total_amount += txn.get('amount', Decimal('0'))
        transaction_count += 1

    # Add summary section
    output.write('\n')
    output.write('Summary Statistics\n')
    output.write(f'Total Transactions,{transaction_count}\n')
    output.write(f'Total Amount,{float(total_amount)}\n')
    output.write(f'Average Amount,{float(total_amount / transaction_count) if transaction_count > 0 else 0}\n')

    return output.getvalue()


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for report generation.

    Args:
        event: EventBridge event
        context: Lambda context object

    Returns:
        Response with report generation status
    """
    try:
        # Calculate time window (last 24 hours)
        current_time = datetime.now()
        yesterday = current_time - timedelta(days=1)
        timestamp_threshold = int(yesterday.timestamp())

        # Scan DynamoDB for transactions in the last 24 hours
        response = table.scan(
            FilterExpression='#ts >= :threshold',
            ExpressionAttributeNames={
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues={
                ':threshold': timestamp_threshold
            }
        )

        transactions = response.get('Items', [])

        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='#ts >= :threshold',
                ExpressionAttributeNames={
                    '#ts': 'timestamp'
                },
                ExpressionAttributeValues={
                    ':threshold': timestamp_threshold
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            transactions.extend(response.get('Items', []))

        # Generate report
        report_content = generate_report(transactions)

        # Create report filename with timestamp
        report_date = current_time.strftime('%Y-%m-%d')
        report_key = f"reports/{report_date}/fraud-detection-report.csv"

        # Upload report to S3
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=report_key,
            Body=report_content.encode('utf-8'),
            ContentType='text/csv'
        )

        print(f"Report generated successfully: {report_key}")
        print(f"Processed {len(transactions)} transactions")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Report generated successfully',
                'report_key': report_key,
                'transactions_processed': len(transactions)
            })
        }

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        raise
