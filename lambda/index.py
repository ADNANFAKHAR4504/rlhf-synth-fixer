import json
import boto3
import os
from datetime import datetime
from base64 import b64decode

# timestream_client = boto3.client('timestream-write')  # Disabled due to account quota limits
s3_client = boto3.client('s3')

# TIMESTREAM_DATABASE = os.environ['TIMESTREAM_DATABASE']  # Disabled
# TIMESTREAM_TABLE = os.environ['TIMESTREAM_TABLE']  # Disabled
S3_BUCKET = os.environ['S3_BUCKET']

def handler(event, context):
    """
    Process Kinesis records and write to Timestream and S3.
    """
    records_processed = 0

    for record in event['Records']:
        # Decode Kinesis data
        payload = json.loads(b64decode(record['kinesis']['data']))

        # Write to Timestream - DISABLED due to account quota limits
        # try:
        #     write_to_timestream(payload)
        # except Exception as e:
        #     print(f"Error writing to Timestream: {str(e)}")

        # Write to S3 data lake (partitioned by symbol and date)
        try:
            write_to_s3(payload)
        except Exception as e:
            print(f"Error writing to S3: {str(e)}")

        records_processed += 1

    return {
        'statusCode': 200,
        'body': json.dumps(f'Processed {records_processed} records')
    }

# def write_to_timestream(payload):
#     """Write market data to Timestream."""
#     current_time = str(int(datetime.now().timestamp() * 1000))
#
#     dimensions = [
#         {'Name': 'symbol', 'Value': payload['symbol']},
#         {'Name': 'exchange', 'Value': payload.get('exchange', 'UNKNOWN')}
#     ]
#
#     records = [
#         {
#             'Dimensions': dimensions,
#             'MeasureName': 'price',
#             'MeasureValue': str(payload['price']),
#             'MeasureValueType': 'DOUBLE',
#             'Time': current_time
#         },
#         {
#             'Dimensions': dimensions,
#             'MeasureName': 'volume',
#             'MeasureValue': str(payload['volume']),
#             'MeasureValueType': 'BIGINT',
#             'Time': current_time
#         }
#     ]
#
#     timestream_client.write_records(
#         DatabaseName=TIMESTREAM_DATABASE,
#         TableName=TIMESTREAM_TABLE,
#         Records=records
#     )

def write_to_s3(payload):
    """Write market data to S3 with partitioning by symbol and date."""
    symbol = payload['symbol']
    date = datetime.now().strftime('%Y-%m-%d')

    key = f"data/symbol={symbol}/date={date}/{datetime.now().timestamp()}.json"

    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=json.dumps(payload),
        ContentType='application/json'
    )
