import json
import os
import boto3
import logging
from datetime import datetime
from typing import Dict, Any
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
ENVIRONMENT = os.environ['ENVIRONMENT']

# DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)

def update_job_status(asset_id: str, job_id: str, status: str, job_detail: Dict[str, Any]) -> None:
    """Update asset record with MediaConvert job status"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        # Map MediaConvert status to asset status
        asset_status_map = {
            'SUBMITTED': 'PROCESSING',
            'PROGRESSING': 'PROCESSING',
            'COMPLETE': 'COMPLETED',
            'CANCELED': 'FAILED',
            'ERROR': 'FAILED'
        }
        
        # Prepare update
        update_expression = "SET updatedAt = :timestamp"
        expression_values = {
            ':timestamp': timestamp
        }
        expression_names = {}
        
        # Update job-specific information
        if status == 'COMPLETE':
            # Extract output details
            output_details = []
            for output_group in job_detail.get('outputGroupDetails', []):
                for output_detail in output_group.get('outputDetails', []):
                    output_details.append({
                        'outputPath': output_detail.get('outputFilePaths', [None])[0],
                        'duration': output_detail.get('durationInMs', 0),
                        'preset': job_detail.get('userMetadata', {}).get('preset', 'unknown')
                    })
            
            if output_details:
                update_expression += ", outputs = list_append(if_not_exists(outputs, :empty_list), :outputs)"
                expression_values[':outputs'] = output_details
                expression_values[':empty_list'] = []
            
            # Add completed format
            preset_name = job_detail.get('userMetadata', {}).get('preset', 'unknown')
            update_expression += ", formats = list_append(if_not_exists(formats, :empty_list), :format)"
            expression_values[':format'] = [preset_name]
            
        elif status in ['ERROR', 'CANCELED']:
            # Add error information
            error_msg = job_detail.get('errorMessage', 'Unknown error')
            error_code = job_detail.get('errorCode', 'UNKNOWN')
            
            update_expression += ", errors = list_append(if_not_exists(errors, :empty_list), :error)"
            expression_values[':error'] = [{
                'timestamp': timestamp,
                'jobId': job_id,
                'code': error_code,
                'message': error_msg
            }]
            expression_values[':empty_list'] = []
        
        # Check if all jobs are complete for this asset
        asset_record = table.get_item(Key={'assetId': asset_id})
        if 'Item' in asset_record:
            item = asset_record['Item']
            job_ids = item.get('jobIds', [])
            
            # Query MediaConvert for all job statuses (would need MediaConvert client)
            # For now, we'll update the main status based on current job
            if status == 'COMPLETE' and len(item.get('formats', [])) >= 2:  # Assuming 3 formats total
                update_expression += ", #status = :status"
                expression_values[':status'] = 'COMPLETED'
                expression_names['#status'] = 'status'
            elif status in ['ERROR', 'CANCELED']:
                update_expression += ", #status = :status"
                expression_values[':status'] = 'FAILED'
                expression_names['#status'] = 'status'
        
        # Execute update
        update_params = {
            'Key': {'assetId': asset_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_values
        }
        
        if expression_names:
            update_params['ExpressionAttributeNames'] = expression_names
        
        table.update_item(**update_params)
        
        logger.info(f"Updated asset {asset_id} for job {job_id} with status {status}")
        
    except Exception as e:
        logger.error(f"Error updating job status: {str(e)}")
        raise

def emit_job_metrics(status: str, preset: str, processing_time: int = None) -> None:
    """Emit MediaConvert job metrics to CloudWatch"""
    try:
        # Job completion metric
        if status == 'COMPLETE':
            cloudwatch.put_metric_data(
                Namespace='MediaPipeline',
                MetricData=[
                    {
                        'MetricName': 'CompletedJobs',
                        'Value': 1,
                        'Unit': 'Count',
                        'Dimensions': [
                            {'Name': 'Environment', 'Value': ENVIRONMENT},
                            {'Name': 'Preset', 'Value': preset}
                        ]
                    }
                ]
            )
            
            # Processing time metric
            if processing_time:
                cloudwatch.put_metric_data(
                    Namespace='MediaPipeline',
                    MetricData=[
                        {
                            'MetricName': 'JobProcessingTime',
                            'Value': processing_time,
                            'Unit': 'Milliseconds',
                            'Dimensions': [
                                {'Name': 'Environment', 'Value': ENVIRONMENT},
                                {'Name': 'Preset', 'Value': preset}
                            ]
                        }
                    ]
                )
        
        elif status in ['ERROR', 'CANCELED']:
            cloudwatch.put_metric_data(
                Namespace='MediaPipeline',
                MetricData=[
                    {
                        'MetricName': 'FailedJobs',
                        'Value': 1,
                        'Unit': 'Count',
                        'Dimensions': [
                            {'Name': 'Environment', 'Value': ENVIRONMENT},
                            {'Name': 'Preset', 'Value': preset}
                        ]
                    }
                ]
            )
            
    except Exception as e:
        logger.error(f"Error emitting metrics: {str(e)}")

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process MediaConvert job state change events from EventBridge
    
    Updates DynamoDB with job status and emits CloudWatch metrics
    """
    try:
        # Parse EventBridge event
        detail = event.get('detail', {})
        job_id = detail.get('jobId')
        status = detail.get('status')
        user_metadata = detail.get('userMetadata', {})
        asset_id = user_metadata.get('assetId')
        preset = user_metadata.get('preset', 'unknown')
        
        if not job_id or not status or not asset_id:
            logger.error(f"Missing required fields in event: {event}")
            return {'statusCode': 400, 'body': 'Missing required fields'}
        
        logger.info(f"Processing job status update: Job={job_id}, Status={status}, Asset={asset_id}")
        
        # Calculate processing time if complete
        processing_time = None
        if status == 'COMPLETE':
            created_at = detail.get('createdAt')
            completed_at = detail.get('completedAt')
            if created_at and completed_at:
                try:
                    start_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                    processing_time = int((end_time - start_time).total_seconds() * 1000)
                except Exception as e:
                    logger.warning(f"Could not calculate processing time: {str(e)}")
        
        # Update DynamoDB
        update_job_status(asset_id, job_id, status, detail)
        
        # Emit metrics
        emit_job_metrics(status, preset, processing_time)
        
        # Log significant events
        if status == 'COMPLETE':
            logger.info(f"Job {job_id} completed successfully for asset {asset_id}")
        elif status in ['ERROR', 'CANCELED']:
            error_msg = detail.get('errorMessage', 'Unknown error')
            logger.error(f"Job {job_id} failed for asset {asset_id}: {error_msg}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed job status update for {job_id}',
                'status': status,
                'assetId': asset_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing job status event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }