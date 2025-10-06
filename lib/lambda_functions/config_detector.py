"""
AWS Config Detector Management Lambda Function
Handles creation and management of Config recorders and delivery channels
with proper resource limit handling.
"""
import boto3
import json
import urllib3
import time
import hashlib


def handler(event, context):
    """
    Lambda handler for Config recorder management
    
    Args:
        event: CloudFormation custom resource event
        context: Lambda context object
        
    Returns:
        dict: Response with Config recorder details
    """
    try:
        config_client = boto3.client('config')
        
        if event['RequestType'] == 'Delete':
            # Don't delete existing recorders on stack deletion
            return send_response(event, context, 'SUCCESS', {
                'RecorderName': event.get('PhysicalResourceId', 'not-found'),
                'RecorderArn': f"arn:aws:config:us-east-1:123456789012:configuration-recorder/not-found"
            })
        
        bucket_name = event['ResourceProperties']['BucketName']
        role_arn = event['ResourceProperties']['RoleArn']
        kms_key_id = event['ResourceProperties'].get('KmsKeyId', '')
        s3_prefix = event['ResourceProperties'].get('S3Prefix', 'AWSConfig')
        
        # List existing configuration recorders
        response = config_client.describe_configuration_recorders()
        
        if response['ConfigurationRecorders']:
            # Use existing recorder
            recorder = response['ConfigurationRecorders'][0]
            recorder_name = recorder['name']
            
            # Update recorder settings to match our requirements
            try:
                config_client.put_configuration_recorder(
                    ConfigurationRecorder={
                        'name': recorder_name,
                        'roleARN': role_arn,
                        'recordingGroup': {
                            'allSupported': True,
                            'includeGlobalResourceTypes': True
                        }
                    }
                )
                
                # Start the recorder if it's not already started
                config_client.start_configuration_recorder(
                    ConfigurationRecorderName=recorder_name
                )
            except Exception as e:
                print(f"Warning: Could not update recorder settings: {e}")
            
            # Check for delivery channels
            delivery_response = config_client.describe_delivery_channels()
            if not delivery_response['DeliveryChannels']:
                # Create delivery channel if none exists
                try:
                    delivery_channel = {
                        'name': f'DeliveryChannel-{recorder_name}',
                        's3BucketName': bucket_name,
                        's3KeyPrefix': s3_prefix,
                        'configSnapshotDeliveryProperties': {
                            'deliveryFrequency': 'TwentyFour_Hours'
                        }
                    }
                    
                    # Add KMS encryption if key is provided
                    if kms_key_id:
                        delivery_channel['s3KmsKeyArn'] = kms_key_id
                    
                    config_client.put_delivery_channel(
                        DeliveryChannel=delivery_channel
                    )
                except Exception as e:
                    print(f"Warning: Could not create delivery channel: {e}")
            
            recorder_arn = _build_recorder_arn(context, recorder_name)
            
            return send_response(event, context, 'SUCCESS', {
                'RecorderName': recorder_name,
                'RecorderArn': recorder_arn,
                'Mode': 'existing'
            }, recorder_name)
        else:
            # Create new recorder
            config_unique_id = hashlib.md5(f"config-{int(time.time())}".encode()).hexdigest()[:8]
            recorder_name = f"ZeroTrustConfig-{config_unique_id}"
            
            config_client.put_configuration_recorder(
                ConfigurationRecorder={
                    'name': recorder_name,
                    'roleARN': role_arn,
                    'recordingGroup': {
                        'allSupported': True,
                        'includeGlobalResourceTypes': True
                    }
                }
            )
            
            # Create delivery channel
            channel_name = f"ZeroTrustDelivery-{config_unique_id}"
            delivery_channel = {
                'name': channel_name,
                's3BucketName': bucket_name,
                's3KeyPrefix': s3_prefix,
                'configSnapshotDeliveryProperties': {
                    'deliveryFrequency': 'TwentyFour_Hours'
                }
            }
            
            # Add KMS encryption if key is provided
            if kms_key_id:
                delivery_channel['s3KmsKeyArn'] = kms_key_id
            
            config_client.put_delivery_channel(
                DeliveryChannel=delivery_channel
            )
            
            # Start the recorder
            config_client.start_configuration_recorder(
                ConfigurationRecorderName=recorder_name
            )
            
            recorder_arn = _build_recorder_arn(context, recorder_name)
            
            return send_response(event, context, 'SUCCESS', {
                'RecorderName': recorder_name,
                'RecorderArn': recorder_arn,
                'Mode': 'new'
            }, recorder_name)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return send_response(event, context, 'FAILED', {'Error': str(e)})


def _build_recorder_arn(context, recorder_name):
    """Build the ARN for a Config recorder"""
    region = context.invoked_function_arn.split(':')[3]
    account_id = context.invoked_function_arn.split(':')[4]
    return f"arn:aws:config:{region}:{account_id}:configuration-recorder/{recorder_name}"


def send_response(event, context, status, data, physical_id=None):
    """Send response back to CloudFormation"""
    response_body = json.dumps({
        'Status': status,
        'Reason': f'See CloudWatch Log Stream: {context.log_stream_name}',
        'PhysicalResourceId': physical_id or context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': data
    })
    
    http = urllib3.PoolManager()
    try:
        response = http.request('PUT', event['ResponseURL'], body=response_body,
                              headers={'Content-Type': 'application/json'})
        print(f"Response status: {response.status}")
    except Exception as e:
        print(f"Failed to send response: {e}")
    
    return {'statusCode': 200, 'body': 'Complete'}