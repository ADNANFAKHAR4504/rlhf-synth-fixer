import json
import os
import boto3

SOURCE_REGION = os.environ['SOURCE_REGION']
TARGET_REGION = os.environ['TARGET_REGION']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']

source_ssm = boto3.client('ssm', region_name=SOURCE_REGION)
target_ssm = boto3.client('ssm', region_name=TARGET_REGION)

def handler(event, context):
    detail = event.get('detail', {})
    param_name = detail.get('name')

    if not param_name or not param_name.startswith(f'/app/{ENVIRONMENT_SUFFIX}/'):
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Parameter not in scope'})
        }

    try:
        response = source_ssm.get_parameter(
            Name=param_name,
            WithDecryption=True
        )

        param = response['Parameter']

        target_ssm.put_parameter(
            Name=param_name,
            Value=param['Value'],
            Type=param['Type'],
            Description=param.get('Description', 'Replicated from primary region'),
            Overwrite=True
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully replicated {param_name}',
                'sourceRegion': SOURCE_REGION,
                'targetRegion': TARGET_REGION
            })
        }

    except Exception as e:
        print(f'Error replicating parameter: {str(e)}')
        raise