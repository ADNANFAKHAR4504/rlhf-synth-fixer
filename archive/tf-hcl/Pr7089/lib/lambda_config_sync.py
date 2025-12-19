import json
import os
import boto3
from datetime import datetime

def handler(event, context):
    """
    Configuration sync Lambda function that reads SSM parameters from one region
    and writes to another using cross-region assume role.
    """
    ssm_parameter_path = os.environ.get('SSM_PARAMETER_PATH', '/payment-app/dev')
    target_region = os.environ.get('TARGET_REGION', 'us-west-2')
    assume_role_arn = os.environ.get('ASSUME_ROLE_ARN', '')
    
    try:
        # Get parameters from current region
        ssm = boto3.client('ssm')
        
        response = ssm.get_parameters_by_path(
            Path=ssm_parameter_path,
            Recursive=True,
            WithDecryption=True
        )
        
        parameters = response.get('Parameters', [])
        
        if not parameters:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'success',
                    'message': 'No parameters to sync',
                    'timestamp': datetime.utcnow().isoformat()
                })
            }
        
        # Assume role for cross-region access
        sts = boto3.client('sts')
        assumed_role = sts.assume_role(
            RoleArn=assume_role_arn,
            RoleSessionName='ConfigSync',
            DurationSeconds=3600
        )
        
        # Create SSM client for target region with assumed role credentials
        target_ssm = boto3.client(
            'ssm',
            region_name=target_region,
            aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
            aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
            aws_session_token=assumed_role['Credentials']['SessionToken']
        )
        
        # Sync parameters to target region
        synced_count = 0
        errors = []
        
        for param in parameters:
            try:
                target_ssm.put_parameter(
                    Name=param['Name'],
                    Value=param['Value'],
                    Type=param['Type'],
                    Overwrite=True
                )
                synced_count += 1
            except Exception as e:
                errors.append({
                    'parameter': param['Name'],
                    'error': str(e)
                })
        
        # Prepare response
        sync_response = {
            'status': 'success' if not errors else 'partial',
            'parameters_synced': synced_count,
            'total_parameters': len(parameters),
            'target_region': target_region,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if errors:
            sync_response['errors'] = errors
        
        return {
            'statusCode': 200,
            'body': json.dumps(sync_response)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
        }