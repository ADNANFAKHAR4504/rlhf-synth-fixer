import json
import os
import boto3
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Any
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
mediaconvert_client = None  # Initialized in handler
ssm_client = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
MEDIACONVERT_ROLE = os.environ['MEDIACONVERT_ROLE']
OUTPUT_BUCKET = os.environ['OUTPUT_BUCKET']
ENVIRONMENT = os.environ['ENVIRONMENT']

# DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)

def get_mediaconvert_client():
    """Get MediaConvert client with proper endpoint"""
    global mediaconvert_client
    if mediaconvert_client is None:
        # Get MediaConvert endpoint
        endpoint_url = os.environ.get('MEDIACONVERT_ENDPOINT')
        if not endpoint_url:
            # Fetch the account-specific endpoint
            mc = boto3.client('mediaconvert')
            response = mc.describe_endpoints()
            endpoint_url = response['Endpoints'][0]['Url']
        
        mediaconvert_client = boto3.client('mediaconvert', endpoint_url=endpoint_url)
    return mediaconvert_client

def get_job_settings(preset_name: str, input_path: str, output_prefix: str) -> Dict[str, Any]:
    """Construct MediaConvert job settings from preset"""
    try:
        # Fetch presets from SSM Parameter Store
        param_name = f'/media-pipeline/{ENVIRONMENT}/mediaconvert-presets'
        response = ssm_client.get_parameter(Name=param_name)
        presets_config = json.loads(response['Parameter']['Value'])
        
        preset = presets_config['presets'].get(preset_name)
        if not preset:
            raise ValueError(f"Preset {preset_name} not found")
        
        # Build job settings
        job_settings = {
            'Role': MEDIACONVERT_ROLE,
            'Settings': {
                'Inputs': [{
                    'FileInput': input_path,
                    'AudioSelectors': {
                        'Audio Selector 1': {
                            'Offset': 0,
                            'DefaultSelection': 'DEFAULT',
                            'ProgramSelection': 1
                        }
                    },
                    'VideoSelector': {
                        'ColorSpace': 'FOLLOW'
                    }
                }],
                'OutputGroups': []
            }
        }
        
        # Configure output group based on preset type
        output_group = {
            'Name': preset['name'],
            'Outputs': []
        }
        
        # Set output group settings based on type
        if preset['outputGroup']['type'] == 'HLS_GROUP':
            output_group['OutputGroupSettings'] = {
                'Type': 'HLS_GROUP_SETTINGS',
                'HlsGroupSettings': {
                    'ManifestDurationFormat': 'FLOATING_POINT',
                    'SegmentLength': preset['outputGroup'].get('segmentDuration', 10),
                    'MinSegmentLength': preset['outputGroup'].get('minSegmentLength', 0),
                    'Destination': f"{preset['outputGroup']['destination']}{output_prefix}/"
                }
            }
        elif preset['outputGroup']['type'] == 'DASH_ISO_GROUP':
            output_group['OutputGroupSettings'] = {
                'Type': 'DASH_ISO_GROUP_SETTINGS',
                'DashIsoGroupSettings': {
                    'SegmentLength': preset['outputGroup'].get('segmentLength', 30),
                    'FragmentLength': preset['outputGroup'].get('fragmentLength', 2),
                    'Destination': f"{preset['outputGroup']['destination']}{output_prefix}/"
                }
            }
        elif preset['outputGroup']['type'] == 'FILE_GROUP':
            output_group['OutputGroupSettings'] = {
                'Type': 'FILE_GROUP_SETTINGS',
                'FileGroupSettings': {
                    'Destination': f"{preset['outputGroup']['destination']}{output_prefix}"
                }
            }
        
        # Add outputs for each quality level
        for output_config in preset['outputs']:
            output = {
                'NameModifier': output_config['nameModifier'],
                'VideoDescription': {
                    'ScalingBehavior': 'DEFAULT',
                    'TimecodeInsertion': 'DISABLED',
                    'AntiAlias': 'ENABLED',
                    'Sharpness': 50,
                    'CodecSettings': {
                        'Codec': output_config['videoSettings']['codec'],
                        'H264Settings': {
                            'InterlaceMode': 'PROGRESSIVE',
                            'NumberReferenceFrames': 3,
                            'Syntax': 'DEFAULT',
                            'Softness': 0,
                            'GopClosedCadence': 1,
                            'GopSize': 90,
                            'Slices': 1,
                            'GopBReference': 'DISABLED',
                            'MaxBitrate': output_config['videoSettings']['bitrate'],
                            'SlowPal': 'DISABLED',
                            'SpatialAdaptiveQuantization': 'ENABLED',
                            'TemporalAdaptiveQuantization': 'ENABLED',
                            'FlickerAdaptiveQuantization': 'DISABLED',
                            'EntropyEncoding': 'CABAC',
                            'Bitrate': output_config['videoSettings']['bitrate'],
                            'FramerateControl': 'INITIALIZE_FROM_SOURCE',
                            'RateControlMode': 'CBR',
                            'CodecProfile': 'MAIN',
                            'Telecine': 'NONE',
                            'MinIInterval': 0,
                            'AdaptiveQuantization': 'HIGH',
                            'CodecLevel': 'AUTO',
                            'FieldEncoding': 'PAFF',
                            'SceneChangeDetect': 'ENABLED',
                            'QualityTuningLevel': 'SINGLE_PASS',
                            'FramerateConversionAlgorithm': 'DUPLICATE_DROP',
                            'UnregisteredSeiTimecode': 'DISABLED',
                            'GopSizeUnits': 'FRAMES'
                        }
                    },
                    'Width': output_config['videoSettings']['width'],
                    'Height': output_config['videoSettings']['height']
                }
            }
            
            # Add audio description if specified
            if 'audioSettings' in output_config:
                output['AudioDescriptions'] = [{
                    'AudioTypeControl': 'FOLLOW_INPUT',
                    'AudioSourceName': 'Audio Selector 1',
                    'CodecSettings': {
                        'Codec': output_config['audioSettings']['codec'],
                        'AacSettings': {
                            'AudioDescriptionBroadcasterMix': 'NORMAL',
                            'Bitrate': output_config['audioSettings']['bitrate'],
                            'RateControlMode': 'CBR',
                            'CodecProfile': 'LC',
                            'CodingMode': 'CODING_MODE_2_0',
                            'RawFormat': 'NONE',
                            'SampleRate': output_config['audioSettings']['sampleRate'],
                            'Specification': 'MPEG4'
                        }
                    }
                }]
            
            output_group['Outputs'].append(output)
        
        job_settings['Settings']['OutputGroups'].append(output_group)
        
        return job_settings
        
    except Exception as e:
        logger.error(f"Error building job settings: {str(e)}")
        raise

def create_asset_record(asset_id: str, s3_key: str, uploader_id: str, file_size: int) -> None:
    """Create initial asset record in DynamoDB"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        # Conditional write to ensure idempotency
        table.put_item(
            Item={
                'assetId': asset_id,
                'status': 'PENDING',
                'uploaderId': uploader_id,
                's3Key': s3_key,
                'createdAt': timestamp,
                'updatedAt': timestamp,
                'fileSize': file_size,
                'jobIds': [],
                'formats': [],
                'errors': []
            },
            ConditionExpression='attribute_not_exists(assetId)'
        )
        logger.info(f"Created asset record for {asset_id}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.info(f"Asset {asset_id} already exists, skipping creation")
        else:
            raise

def submit_mediaconvert_job(asset_id: str, input_path: str, preset_name: str) -> str:
    """Submit MediaConvert job for a specific preset"""
    try:
        mc_client = get_mediaconvert_client()
        
        # Build job settings
        output_prefix = f"{asset_id}/{preset_name}"
        job_settings = get_job_settings(preset_name, input_path, output_prefix)
        
        # Add metadata
        job_settings['Settings']['TimecodeConfig'] = {'Source': 'ZEROBASED'}
        job_settings['UserMetadata'] = {
            'assetId': asset_id,
            'preset': preset_name,
            'environment': ENVIRONMENT
        }
        
        # Submit job
        response = mc_client.create_job(**job_settings)
        job_id = response['Job']['Id']
        
        logger.info(f"Submitted MediaConvert job {job_id} for asset {asset_id} preset {preset_name}")
        
        return job_id
        
    except Exception as e:
        logger.error(f"Error submitting MediaConvert job: {str(e)}")
        raise

def update_asset_status(asset_id: str, status: str, job_ids: List[str] = None, error: str = None) -> None:
    """Update asset status and metadata in DynamoDB"""
    try:
        update_expression = "SET #status = :status, updatedAt = :timestamp"
        expression_values = {
            ':status': status,
            ':timestamp': datetime.utcnow().isoformat()
        }
        
        if job_ids:
            update_expression += ", jobIds = list_append(if_not_exists(jobIds, :empty_list), :job_ids)"
            expression_values[':job_ids'] = job_ids
            expression_values[':empty_list'] = []
        
        if error:
            update_expression += ", errors = list_append(if_not_exists(errors, :empty_list), :error)"
            expression_values[':error'] = [{'timestamp': datetime.utcnow().isoformat(), 'message': error}]
            expression_values[':empty_list'] = []
        
        table.update_item(
            Key={'assetId': asset_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues=expression_values
        )
        
        logger.info(f"Updated asset {asset_id} status to {status}")
        
    except Exception as e:
        logger.error(f"Error updating asset status: {str(e)}")
        raise

def emit_cloudwatch_metric(metric_name: str, value: float, unit: str = 'Count') -> None:
    """Emit custom CloudWatch metric"""
    try:
        cloudwatch.put_metric_data(
            Namespace='MediaPipeline',
            MetricData=[{
                'MetricName': metric_name,
                'Value': value,
                'Unit': unit,
                'Dimensions': [
                    {
                        'Name': 'Environment',
                        'Value': ENVIRONMENT
                    }
                ]
            }]
        )
    except Exception as e:
        logger.error(f"Error emitting metric: {str(e)}")

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process S3 upload events from SQS and orchestrate MediaConvert jobs
    
    Expected SQS message body contains EventBridge event with S3 object details
    """
    processed_count = 0
    failed_count = 0
    
    for record in event.get('Records', []):
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            
            # Extract S3 event details from EventBridge event
            detail = message_body.get('detail', {})
            bucket_name = detail.get('bucket', {}).get('name')
            object_key = detail.get('object', {}).get('key')
            object_size = detail.get('object', {}).get('size', 0)
            
            if not bucket_name or not object_key:
                logger.error(f"Missing S3 details in event: {message_body}")
                failed_count += 1
                continue
            
            # Generate asset ID and extract uploader ID from S3 key
            # Expected format: uploads/{uploaderId}/{filename}
            key_parts = object_key.split('/')
            if len(key_parts) < 3 or key_parts[0] != 'uploads':
                logger.error(f"Invalid S3 key format: {object_key}")
                failed_count += 1
                continue
            
            uploader_id = key_parts[1]
            filename = key_parts[2]
            asset_id = str(uuid.uuid4())
            
            # Verify object exists
            try:
                s3_client.head_object(Bucket=bucket_name, Key=object_key)
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    logger.error(f"Object not found: s3://{bucket_name}/{object_key}")
                    failed_count += 1
                    continue
                raise
            
            # Create asset record (idempotent)
            create_asset_record(asset_id, object_key, uploader_id, object_size)
            
            # Submit MediaConvert jobs for each preset
            input_path = f"s3://{bucket_name}/{object_key}"
            job_ids = []
            
            for preset_name in ['hls', 'dash', 'mp4']:
                try:
                    job_id = submit_mediaconvert_job(asset_id, input_path, preset_name)
                    job_ids.append(job_id)
                except Exception as e:
                    logger.error(f"Failed to submit {preset_name} job for {asset_id}: {str(e)}")
                    update_asset_status(asset_id, 'FAILED', error=f"Failed to submit {preset_name} job: {str(e)}")
                    failed_count += 1
                    break
            else:
                # All jobs submitted successfully
                update_asset_status(asset_id, 'PROCESSING', job_ids=job_ids)
                processed_count += 1
                
                # Emit processing metric
                emit_cloudwatch_metric('ProcessingStarted', 1)
            
            logger.info(f"Processed asset {asset_id} from {object_key}")
            
        except Exception as e:
            logger.error(f"Error processing record: {str(e)}")
            failed_count += 1
            
            # Re-raise to let Lambda retry via SQS
            raise
    
    # Emit batch metrics
    if processed_count > 0:
        emit_cloudwatch_metric('ProcessedAssets', processed_count)
    if failed_count > 0:
        emit_cloudwatch_metric('FailedAssets', failed_count)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'failed': failed_count
        })
    }