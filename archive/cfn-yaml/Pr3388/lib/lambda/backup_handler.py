import json
import boto3
import os
import datetime
import logging
from decimal import Decimal

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
s3 = boto3.client('s3', region_name=os.environ['REGION'])
sns = boto3.client('sns', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['TABLE_NAME'])

# Custom JSON encoder to handle Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    """
    Lambda function handler for weekly survey data backup
    Creates a complete backup of DynamoDB table data to S3
    """
    try:
        logger.info("Starting weekly backup process")
        
        # Get current date for backup filename
        today = datetime.datetime.now()
        backup_date = today.strftime('%Y-%m-%d')
        week_start = (today - datetime.timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        
        logger.info(f"Creating backup for week starting: {week_start}")
        
        # Fetch all items from DynamoDB with pagination
        items = []
        scan_kwargs = {}
        items_processed = 0
        
        # Scan with pagination to handle large datasets
        while True:
            response = table.scan(**scan_kwargs)
            
            batch_items = response.get('Items', [])
            items.extend(batch_items)
            items_processed += len(batch_items)
            
            logger.info(f"Processed {items_processed} items so far...")
            
            # Check if we need to continue scanning
            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        
        logger.info(f"Total items retrieved: {len(items)}")
        
        # Create backup metadata
        backup_metadata = {
            'backup_date': backup_date,
            'backup_timestamp': today.isoformat(),
            'week_start': week_start,
            'total_records': len(items),
            'table_name': os.environ['TABLE_NAME'],
            'backup_type': 'weekly_full',
            'generated_by': 'survey-backup-lambda'
        }
        
        # Organize data by date for better structure
        backup_data = {
            'metadata': backup_metadata,
            'data': items
        }
        
        # Create comprehensive backup file
        s3_key = f"backups/weekly/week-{week_start}-backup.json"
        
        # Upload to S3 with metadata
        s3.put_object(
            Bucket=os.environ['BUCKET_NAME'],
            Key=s3_key,
            Body=json.dumps(backup_data, cls=DecimalEncoder, indent=2),
            ContentType='application/json',
            Metadata={
                'backup-date': backup_date,
                'week-start': week_start,
                'record-count': str(len(items)),
                'backup-type': 'weekly-full'
            }
        )
        
        # Also create a compressed manifest file for quick reference
        manifest = {
            'backup_info': backup_metadata,
            'statistics': {
                'total_records': len(items),
                'date_range': {
                    'earliest_record': min([item.get('timestamp', '') for item in items]) if items else None,
                    'latest_record': max([item.get('timestamp', '') for item in items]) if items else None
                },
                'survey_counts': {}
            }
        }
        
        # Calculate survey statistics
        survey_counts = {}
        for item in items:
            survey_id = item.get('surveyId', 'unknown')
            survey_counts[survey_id] = survey_counts.get(survey_id, 0) + 1
        
        manifest['statistics']['survey_counts'] = survey_counts
        
        # Save manifest file
        manifest_key = f"backups/weekly/week-{week_start}-manifest.json"
        s3.put_object(
            Bucket=os.environ['BUCKET_NAME'],
            Key=manifest_key,
            Body=json.dumps(manifest, cls=DecimalEncoder, indent=2),
            ContentType='application/json'
        )
        
        logger.info(f"Backup saved to S3: {s3_key}")
        logger.info(f"Manifest saved to S3: {manifest_key}")
        
        # Calculate backup size estimate (rough)
        backup_size_mb = len(json.dumps(backup_data, cls=DecimalEncoder)) / (1024 * 1024)
        
        # Send success notification with detailed statistics
        message = f"""Weekly survey data backup completed successfully.

Backup Details:
- Week Starting: {week_start}
- Backup Date: {backup_date}
- Total Records: {len(items):,}
- Estimated Size: {backup_size_mb:.2f} MB

Files Created:
- Backup File: s3://{os.environ['BUCKET_NAME']}/{s3_key}
- Manifest File: s3://{os.environ['BUCKET_NAME']}/{manifest_key}

Survey Distribution:
{chr(10).join([f"- {survey_id}: {count:,} responses" for survey_id, count in sorted(survey_counts.items())])}

Date Range:
- Earliest Record: {manifest['statistics']['date_range']['earliest_record']}
- Latest Record: {manifest['statistics']['date_range']['latest_record']}

Generated at: {backup_metadata['backup_timestamp']}"""
        
        sns.publish(
            TopicArn=os.environ['TOPIC_ARN'],
            Subject=f"Survey Data Backup Complete - Week of {week_start}",
            Message=message
        )
        
        logger.info("Success notification sent")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Backup completed successfully',
                'backup_date': backup_date,
                'week_start': week_start,
                'total_records': len(items),
                'backup_location': f"s3://{os.environ['BUCKET_NAME']}/{s3_key}",
                'manifest_location': f"s3://{os.environ['BUCKET_NAME']}/{manifest_key}",
                'estimated_size_mb': round(backup_size_mb, 2)
            })
        }
        
    except Exception as e:
        error_msg = f"Error during backup: {str(e)}"
        logger.error(error_msg)
        
        # Send error notification
        try:
            sns.publish(
                TopicArn=os.environ['TOPIC_ARN'],
                Subject="Error: Survey Data Backup Failed",
                Message=f"""An error occurred during the weekly survey data backup process.

Error Details:
{error_msg}

Backup Date: {backup_date}
Week Starting: {week_start}
Timestamp: {datetime.datetime.now().isoformat()}

Please check CloudWatch logs for more details and manually verify data integrity."""
            )
        except Exception as sns_error:
            logger.error(f"Failed to send error notification: {str(sns_error)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Backup failed',
                'details': str(e),
                'backup_date': backup_date
            })
        }