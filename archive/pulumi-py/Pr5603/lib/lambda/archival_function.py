import json
import os
import time
import boto3
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

table_name = os.environ['TABLE_NAME']
bucket_name = os.environ['BUCKET_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Archive old transactions from DynamoDB to S3.
    Runs daily to move transactions older than 30 days.
    """
    try:
        # Calculate cutoff timestamp (30 days ago)
        cutoff_date = datetime.now() - timedelta(days=30)
        cutoff_timestamp = int(cutoff_date.timestamp() * 1000)

        archived_count = 0
        batch_size = 100

        # Scan for old transactions
        scan_kwargs = {
            'FilterExpression': 'timestamp < :cutoff',
            'ExpressionAttributeValues': {':cutoff': cutoff_timestamp}
        }

        transactions_to_archive = []

        done = False
        start_key = None

        while not done:
            if start_key:
                scan_kwargs['ExclusiveStartKey'] = start_key

            response = table.scan(**scan_kwargs)
            transactions_to_archive.extend(response.get('Items', []))

            start_key = response.get('LastEvaluatedKey', None)
            done = start_key is None

        # Archive transactions to S3
        if transactions_to_archive:
            date_str = datetime.now().strftime('%Y-%m-%d')
            s3_key = f"archived-transactions/{date_str}/transactions.json"

            # Upload to S3
            s3.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=json.dumps(transactions_to_archive, default=str),
                ContentType='application/json',
                ServerSideEncryption='AES256'
            )

            # Delete archived transactions from DynamoDB
            with table.batch_writer() as batch:
                for transaction in transactions_to_archive:
                    batch.delete_item(
                        Key={
                            'transaction_id': transaction['transaction_id'],
                            'timestamp': transaction['timestamp']
                        }
                    )
                    archived_count += 1

        print(f"Archived {archived_count} transactions to S3: {s3_key if transactions_to_archive else 'none'}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Archived {archived_count} transactions',
                'archived_count': archived_count
            })
        }

    except Exception as e:
        print(f"Error archiving transactions: {str(e)}")
        raise
