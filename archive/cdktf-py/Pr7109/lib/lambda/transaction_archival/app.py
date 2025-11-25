"""
Transaction Archival Lambda Function
Archives processed transactions to S3 after 24 hours.
"""
import json
import os
import boto3
from datetime import datetime, timedelta
from decimal import Decimal
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK for X-Ray tracing
patch_all()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']

table = dynamodb.Table(DYNAMODB_TABLE)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


@xray_recorder.capture('scan_old_transactions')
def scan_old_transactions():
    """
    Scan DynamoDB for transactions older than 24 hours.

    Returns:
        list: List of transactions to archive
    """
    cutoff_time = (datetime.utcnow() - timedelta(hours=24)).isoformat()

    response = table.scan(
        FilterExpression='#ts < :cutoff',
        ExpressionAttributeNames={
            '#ts': 'timestamp'
        },
        ExpressionAttributeValues={
            ':cutoff': cutoff_time
        }
    )

    return response.get('Items', [])


@xray_recorder.capture('archive_to_s3')
def archive_to_s3(transactions):
    """
    Archive transactions to S3 with date-based partitioning.

    Args:
        transactions: List of transactions to archive

    Returns:
        int: Number of transactions archived
    """
    if not transactions:
        return 0

    # Group transactions by date
    transactions_by_date = {}
    for txn in transactions:
        date = txn['timestamp'][:10]  # Extract YYYY-MM-DD
        if date not in transactions_by_date:
            transactions_by_date[date] = []
        transactions_by_date[date].append(txn)

    # Upload each date partition to S3
    archived_count = 0
    for date, txn_list in transactions_by_date.items():
        key = f"transactions/{date[:4]}/{date[5:7]}/{date[8:]}/transactions.json"

        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(txn_list, cls=DecimalEncoder, indent=2),
            ContentType='application/json',
            ServerSideEncryption='AES256'
        )

        archived_count += len(txn_list)

    return archived_count


@xray_recorder.capture('delete_archived_transactions')
def delete_archived_transactions(transactions):
    """
    Delete archived transactions from DynamoDB.

    Args:
        transactions: List of transactions to delete
    """
    with table.batch_writer() as batch:
        for txn in transactions:
            batch.delete_item(
                Key={
                    'transaction_id': txn['transaction_id'],
                    'timestamp': txn['timestamp']
                }
            )


def lambda_handler(event, context):
    """
    Main Lambda handler for transaction archival.

    Args:
        event: CloudWatch Events scheduled event
        context: Lambda context

    Returns:
        dict: Archival results
    """
    try:
        # Scan for old transactions
        old_transactions = scan_old_transactions()

        if not old_transactions:
            return {
                'statusCode': 200,
                'message': 'No transactions to archive',
                'archived_count': 0
            }

        # Archive to S3
        archived_count = archive_to_s3(old_transactions)

        # Delete from DynamoDB
        delete_archived_transactions(old_transactions)

        return {
            'statusCode': 200,
            'message': f'Successfully archived {archived_count} transactions',
            'archived_count': archived_count
        }

    except Exception as e:
        print(f"Error archiving transactions: {str(e)}")
        raise
