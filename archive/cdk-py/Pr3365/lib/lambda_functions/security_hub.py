"""
Security Hub Management Lambda Function
Handles detection and setup of Security Hub with proper subscription handling.
"""
import boto3
import json
import urllib3
import os


def handler(event, context):
    """
    Lambda handler for Security Hub management
    
    Args:
        event: CloudFormation custom resource event
        context: Lambda context object
        
    Returns:
        dict: Response with Security Hub details
    """
    try:
        client = boto3.client('securityhub')
        
        # Get configuration from environment variables or event properties
        environment_suffix = event.get('ResourceProperties', {}).get('EnvironmentSuffix') or os.environ.get('ENVIRONMENT_SUFFIX', 'default')
        
        if event['RequestType'] == 'Delete':
            # Don't disable existing Security Hub on stack deletion
            hub_arn = event.get('PhysicalResourceId', 'not-found')
            return send_response(event, context, 'SUCCESS', {
                'HubArn': hub_arn
            })
        
        # Check if Security Hub is already enabled
        try:
            # Try to describe the hub
            response = client.describe_hub()
            
            # Hub already exists, use it and update configuration
            hub_arn = response['HubArn']
            
            # Update hub settings to match our requirements if needed
            try:
                client.update_security_hub_configuration(
                    AutoEnableControls=False,
                    ControlFindingGenerator='SECURITY_CONTROL'
                )
            except Exception as e:
                print(f"Warning: Could not update Security Hub settings: {e}")
            
            mode = 'existing'
            
        except client.exceptions.InvalidAccessException:
            # Security Hub is not enabled, create it
            response = client.enable_security_hub(
                Tags={
                    'Name': f'ZeroTrustSecurityHub-{environment_suffix}',
                    'ManagedBy': 'CDK-AutoDetection',
                    'Environment': 'production'
                },
                EnableDefaultStandards=False,
                ControlFindingGenerator='SECURITY_CONTROL'
            )
            
            hub_arn = response['HubArn']
            mode = 'new'
            
        except Exception as e:
            # Handle other exceptions - might be already subscribed
            if "already subscribed" in str(e).lower():
                # Get hub details
                try:
                    response = client.describe_hub()
                    hub_arn = response['HubArn']
                    mode = 'existing'
                except:
                    # Fallback ARN format if describe fails
                    account_id = context.invoked_function_arn.split(':')[4]
                    region_name = context.invoked_function_arn.split(':')[3]
                    hub_arn = f"arn:aws:securityhub:{region_name}:{account_id}:hub/default"
                    mode = 'existing-fallback'
            else:
                raise e
        
        return send_response(event, context, 'SUCCESS', {
            'HubArn': hub_arn,
            'Mode': mode
        }, hub_arn)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return send_response(event, context, 'FAILED', {'Error': str(e)})


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