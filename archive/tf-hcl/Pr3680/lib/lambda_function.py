import json
import os
import boto3
from botocore.exceptions import ClientError

mediaconvert = boto3.client('mediaconvert', region_name=os.environ.get('AWS_REGION_CUSTOM', 'us-east-1'))
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION_CUSTOM', 'us-east-1'))
s3 = boto3.client('s3', region_name=os.environ.get('AWS_REGION_CUSTOM', 'us-east-1'))

INPUT_BUCKET = os.environ['INPUT_BUCKET']
OUTPUT_BUCKET = os.environ['OUTPUT_BUCKET']
ASSETS_TABLE = os.environ['ASSETS_TABLE']
MEDIACONVERT_ROLE = os.environ['MEDIACONVERT_ROLE']

table = dynamodb.Table(ASSETS_TABLE)

def get_mediaconvert_endpoint():
    try:
        response = mediaconvert.describe_endpoints()
        return response['Endpoints'][0]['Url']
    except Exception as e:
        print(f"Error getting MediaConvert endpoint: {str(e)}")
        raise

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    for record in event.get('Records', []):
        try:
            if 'eventSource' in record and record['eventSource'] == 'aws:sqs':
                message_body = json.loads(record['body'])
                
                if 'source' in message_body and message_body['source'] == 'aws.mediaconvert':
                    handle_mediaconvert_status(message_body)
                elif 'Records' in message_body:
                    for s3_record in message_body['Records']:
                        if s3_record.get('eventSource') == 'aws:s3':
                            handle_s3_upload(s3_record)
                else:
                    print(f"Unknown message type: {message_body}")
        except Exception as e:
            print(f"Error processing record: {str(e)}")
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }

def handle_s3_upload(s3_record):
    bucket = s3_record['s3']['bucket']['name']
    key = s3_record['s3']['object']['key']
    
    print(f"Processing S3 upload: {bucket}/{key}")
    
    asset_id = key.split('/')[-1].split('.')[0]
    
    table.put_item(Item={
        'AssetId': asset_id,
        'Status': 'PENDING',
        'InputFile': f"s3://{bucket}/{key}",
        'Renditions': []
    })
    
    try:
        mediaconvert_endpoint = get_mediaconvert_endpoint()
        mc_client = boto3.client('mediaconvert', endpoint_url=mediaconvert_endpoint, 
                                region_name=os.environ.get('AWS_REGION_CUSTOM', 'us-east-1'))
        
        job_settings = {
            'Role': MEDIACONVERT_ROLE,
            'Settings': {
                'Inputs': [{
                    'FileInput': f"s3://{bucket}/{key}",
                    'AudioSelectors': {
                        'Audio Selector 1': {
                            'DefaultSelection': 'DEFAULT'
                        }
                    },
                    'VideoSelector': {}
                }],
                'OutputGroups': [{
                    'Name': 'File Group',
                    'OutputGroupSettings': {
                        'Type': 'FILE_GROUP_SETTINGS',
                        'FileGroupSettings': {
                            'Destination': f"s3://{OUTPUT_BUCKET}/{asset_id}/"
                        }
                    },
                    'Outputs': [
                        {
                            'ContainerSettings': {
                                'Container': 'MP4'
                            },
                            'VideoDescription': {
                                'Width': 1920,
                                'Height': 1080,
                                'CodecSettings': {
                                    'Codec': 'H_264',
                                    'H264Settings': {
                                        'Bitrate': 5000000,
                                        'RateControlMode': 'CBR'
                                    }
                                }
                            },
                            'AudioDescriptions': [{
                                'CodecSettings': {
                                    'Codec': 'AAC',
                                    'AacSettings': {
                                        'Bitrate': 96000,
                                        'CodingMode': 'CODING_MODE_2_0',
                                        'SampleRate': 48000
                                    }
                                }
                            }],
                            'NameModifier': '_1080p'
                        },
                        {
                            'ContainerSettings': {
                                'Container': 'MP4'
                            },
                            'VideoDescription': {
                                'Width': 1280,
                                'Height': 720,
                                'CodecSettings': {
                                    'Codec': 'H_264',
                                    'H264Settings': {
                                        'Bitrate': 3000000,
                                        'RateControlMode': 'CBR'
                                    }
                                }
                            },
                            'AudioDescriptions': [{
                                'CodecSettings': {
                                    'Codec': 'AAC',
                                    'AacSettings': {
                                        'Bitrate': 96000,
                                        'CodingMode': 'CODING_MODE_2_0',
                                        'SampleRate': 48000
                                    }
                                }
                            }],
                            'NameModifier': '_720p'
                        }
                    ]
                }]
            },
            'UserMetadata': {
                'AssetId': asset_id
            }
        }
        
        response = mc_client.create_job(**job_settings)
        job_id = response['Job']['Id']
        
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status, JobId = :job_id',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'PROCESSING',
                ':job_id': job_id
            }
        )
        
        print(f"Created MediaConvert job {job_id} for asset {asset_id}")
        
    except Exception as e:
        print(f"Error creating MediaConvert job: {str(e)}")
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status, ErrorMessage = :error',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'FAILED',
                ':error': str(e)
            }
        )
        raise

def handle_mediaconvert_status(message):
    detail = message.get('detail', {})
    status = detail.get('status')
    job_id = detail.get('jobId')
    user_metadata = detail.get('userMetadata', {})
    asset_id = user_metadata.get('AssetId')
    
    if not asset_id:
        print(f"No AssetId in job metadata for job {job_id}")
        return
    
    print(f"MediaConvert job {job_id} status: {status} for asset {asset_id}")
    
    if status == 'COMPLETE':
        output_group_details = detail.get('outputGroupDetails', [])
        renditions = []
        for group in output_group_details:
            for output_detail in group.get('outputDetails', []):
                renditions.append({
                    'OutputFile': output_detail.get('outputFilePaths', [''])[0],
                    'DurationInMs': output_detail.get('durationInMs', 0)
                })
        
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status, Renditions = :renditions',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'COMPLETED',
                ':renditions': renditions
            }
        )
        print(f"Asset {asset_id} processing completed with {len(renditions)} renditions")
        
    elif status in ['ERROR', 'CANCELED']:
        error_message = detail.get('errorMessage', 'Unknown error')
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status, ErrorMessage = :error',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'FAILED',
                ':error': error_message
            }
        )
        print(f"Asset {asset_id} processing failed: {error_message}")
    
    else:
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': status
            }
        )
