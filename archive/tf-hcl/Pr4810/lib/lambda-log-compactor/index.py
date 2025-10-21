import json
import os
import boto3

s3 = boto3.client('s3')
glue = boto3.client('glue')

SOURCE_BUCKET = os.environ['SOURCE_BUCKET']
GLUE_DATABASE = os.environ['GLUE_DATABASE']
GLUE_TABLE = os.environ['GLUE_TABLE']


def lambda_handler(event, context):
    """
    Compact small CloudTrail log files into larger Parquet files
    """
    try:
        # List small files in enriched logs bucket
        response = s3.list_objects_v2(
            Bucket=SOURCE_BUCKET,
            MaxKeys=1000
        )

        small_files = []
        for obj in response.get('Contents', []):
            if obj['Size'] < 5 * 1024 * 1024:  # Less than 5MB
                small_files.append(obj['Key'])

        if not small_files:
            return {'statusCode': 200, 'message': 'No small files to compact'}

        # Group files by partition
        partitions = {}
        for file_key in small_files:
            partition = extract_partition(file_key)
            if partition not in partitions:
                partitions[partition] = []
            partitions[partition].append(file_key)

        compacted_count = 0
        for partition, files in partitions.items():
            if len(files) >= 10:  # Only compact if we have at least 10 small files
                compact_files(files, partition)
                compacted_count += len(files)

        return {
            'statusCode': 200,
            'compacted_files': compacted_count,
            'partitions_processed': len(partitions)
        }

    except Exception as e:
        print(f"Error compacting logs: {str(e)}")
        raise


def extract_partition(file_key):
    """
    Extract partition from file key
    """
    parts = file_key.split('/')
    return '/'.join(p for p in parts if p.startswith(('year=', 'month=', 'day=', 'account=')))


def compact_files(files, partition):
    """
    Read multiple small files and write as one large file
    """
    combined_records = []

    for file_key in files:
        response = s3.get_object(Bucket=SOURCE_BUCKET, Key=file_key)
        content = json.loads(response['Body'].read())
        if isinstance(content, list):
            combined_records.extend(content)

    if combined_records:
        output_key = f"{partition}/compacted-{len(combined_records)}-records.json"

        s3.put_object(
            Bucket=SOURCE_BUCKET,
            Key=output_key,
            Body=json.dumps(combined_records),
            ServerSideEncryption='aws:kms'
        )

        # Delete original small files
        for file_key in files:
            s3.delete_object(Bucket=SOURCE_BUCKET, Key=file_key)
