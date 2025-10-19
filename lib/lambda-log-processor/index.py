import json
import os
import boto3
import gzip
from datetime import datetime
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
glue = boto3.client('glue')

SOURCE_BUCKET = os.environ['SOURCE_BUCKET']
TARGET_BUCKET = os.environ['TARGET_BUCKET']
RISK_ACTIONS = json.loads(os.environ['RISK_ACTIONS_LIST'])
GLUE_DATABASE = os.environ['GLUE_DATABASE']
GLUE_TABLE = os.environ['GLUE_TABLE']


def lambda_handler(event, context):
    """
    Process CloudTrail logs: parse, enrich, flag high-risk actions
    """
    try:
        processed_count = 0

        for record in event.get('Records', []):
            s3_event = record.get('s3', {})
            bucket = s3_event.get('bucket', {}).get('name')
            key = s3_event.get('object', {}).get('key')

            if not key or not key.endswith('.json.gz'):
                continue

            # Download and decompress CloudTrail log
            response = s3.get_object(Bucket=SOURCE_BUCKET, Key=key)
            with gzip.GzipFile(fileobj=response['Body']) as gzipfile:
                content = gzipfile.read()
                log_data = json.loads(content)

            # Process each record
            enriched_records = []
            for ct_record in log_data.get('Records', []):
                enriched = enrich_record(ct_record)
                enriched_records.append(enriched)

            # Write enriched data
            if enriched_records:
                write_enriched_data(enriched_records, key)
                processed_count += len(enriched_records)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed_count': processed_count,
                'message': 'CloudTrail logs processed successfully'
            })
        }

    except Exception as e:
        print(f"Error processing CloudTrail logs: {str(e)}")
        raise


def enrich_record(record):
    """
    Enrich CloudTrail record with metadata and risk flags
    """
    enriched = record.copy()

    # Flag high-risk actions
    event_name = record.get('eventName', '')
    is_high_risk = any(action in event_name for action in RISK_ACTIONS)

    enriched['enrichment'] = {
        'is_high_risk': is_high_risk,
        'processed_at': datetime.utcnow().isoformat(),
        'account_id': record.get('recipientAccountId', ''),
        'principal_id': record.get('userIdentity', {}).get('principalId', ''),
        'source_ip': record.get('sourceIPAddress', '')
    }

    return enriched


def write_enriched_data(records, original_key):
    """
    Write enriched records to S3
    """
    # Create partition path: year/month/day/account
    first_record = records[0]
    event_time = datetime.fromisoformat(first_record.get('eventTime', '').replace('Z', '+00:00'))
    account_id = first_record.get('recipientAccountId', 'unknown')

    partition_path = f"year={event_time.year}/month={event_time.month:02d}/day={event_time.day:02d}/account={account_id}"

    # Generate output key
    output_key = f"{partition_path}/enriched-{datetime.utcnow().timestamp()}.json"

    # Write to S3
    s3.put_object(
        Bucket=TARGET_BUCKET,
        Key=output_key,
        Body=json.dumps(records),
        ServerSideEncryption='aws:kms'
    )
