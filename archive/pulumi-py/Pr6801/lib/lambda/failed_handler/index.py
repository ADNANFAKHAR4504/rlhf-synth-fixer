import json
import os
import boto3
from datetime import datetime

# X-Ray instrumentation (FIX #12)
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all
patch_all()

dynamodb = boto3.resource('dynamodb')

TRANSACTION_TABLE = os.environ['TRANSACTION_TABLE']

transaction_table = dynamodb.Table(TRANSACTION_TABLE)


def handler(event, context):
    """
    Handles failed transactions from DLQ.
    Enhanced with X-Ray tracing and better error handling. (FIX #15)
    """
    try:
        failed_count = 0
        for record in event['Records']:
            try:
                message = json.loads(record['body'])

                transaction_id = message.get('transaction_id', 'unknown')
                timestamp = int(datetime.utcnow().timestamp())

                # Extract additional metadata
                approximate_receive_count = record.get('attributes', {}).get('ApproximateReceiveCount', 'unknown')

                # Log failed transaction with X-Ray subsegment
                with xray_recorder.capture('log_failed_transaction'):
                    transaction_table.put_item(
                        Item={
                            'transaction_id': f"failed-{transaction_id}",
                            'timestamp': timestamp,
                            'merchant_id': message.get('merchant_id', 'unknown'),
                            'amount': message.get('amount', 0),
                            'original_message': json.dumps(message),
                            'status': 'failed',
                            'failure_reason': 'Max retries exceeded',
                            'retry_count': approximate_receive_count,
                            'failed_at': datetime.utcnow().isoformat()
                        }
                    )

                print(f"Logged failed transaction: {transaction_id} (retries: {approximate_receive_count})")
                failed_count += 1

            except Exception as item_error:
                print(f"Error processing individual DLQ record: {str(item_error)}")
                # Continue processing other records
                continue

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failed transactions logged',
                'count': failed_count
            })
        }

    except Exception as e:
        print(f"Error handling failed transaction: {str(e)}")
        xray_recorder.current_subsegment().put_annotation('error', str(e))
        raise