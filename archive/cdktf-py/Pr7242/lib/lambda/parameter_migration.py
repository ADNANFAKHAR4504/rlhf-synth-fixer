import json
import os
import boto3
from botocore.exceptions import ClientError

ssm = boto3.client('ssm')

SOURCE_PREFIX = os.environ.get('SOURCE_PREFIX', '/dev')
TARGET_PREFIX = os.environ.get('TARGET_PREFIX', '/prod')

EXCLUDED_PARAMS = ['password', 'secret', 'api_key', 'token']


def handler(event, context):
    """Migrates parameters from dev to prod"""
    migrated = []
    skipped = []
    errors = []

    try:
        paginator = ssm.get_paginator('describe_parameters')

        for page in paginator.paginate(
            ParameterFilters=[{'Key': 'Name', 'Option': 'BeginsWith', 'Values': [SOURCE_PREFIX]}]
        ):
            for param in page['Parameters']:
                source_name = param['Name']

                if any(excluded in source_name.lower() for excluded in EXCLUDED_PARAMS):
                    skipped.append({'name': source_name, 'reason': 'sensitive'})
                    continue

                try:
                    response = ssm.get_parameter(Name=source_name, WithDecryption=False)
                    param_value = response['Parameter']['Value']
                    param_type = response['Parameter']['Type']

                    target_name = source_name.replace(SOURCE_PREFIX, TARGET_PREFIX, 1)

                    ssm.put_parameter(
                        Name=target_name,
                        Value=param_value,
                        Type=param_type,
                        Overwrite=True
                    )

                    migrated.append({'source': source_name, 'target': target_name})

                except ClientError as e:
                    errors.append({'parameter': source_name, 'error': str(e)})

        return {
            'statusCode': 200,
            'summary': {
                'migrated': len(migrated),
                'skipped': len(skipped),
                'errors': len(errors)
            },
            'migrated': migrated,
            'skipped': skipped
        }

    except Exception as e:
        return {'statusCode': 500, 'error': str(e)}
