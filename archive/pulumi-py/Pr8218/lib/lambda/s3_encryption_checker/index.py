"""
S3 Encryption Checker Lambda Function

Checks S3 buckets for encryption configuration and reports compliance status.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, Any

s3_client = boto3.client('s3')
dynamodb_client = boto3.client('dynamodb')
sns_client = boto3.client('sns')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for S3 encryption compliance checking.

    Args:
        event: Lambda event containing Config rule evaluation or scheduled trigger
        context: Lambda context

    Returns:
        Dict with evaluation results
    """
    try:
        print(f"Event received: {json.dumps(event)}")

        # Get all S3 buckets
        response = s3_client.list_buckets()

        evaluation_results = []
        non_compliant_resources = []

        for bucket in response.get('Buckets', []):
            bucket_name = bucket['Name']

            # Check encryption configuration
            has_encryption = False
            encryption_type = 'None'

            try:
                encryption_response = s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption_response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
                if rules:
                    has_encryption = True
                    encryption_type = rules[0].get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm', 'Unknown')
            except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                has_encryption = False
            except Exception as e:
                print(f"Error checking encryption for bucket {bucket_name}: {str(e)}")
                continue

            is_compliant = has_encryption
            compliance_type = 'COMPLIANT' if is_compliant else 'NON_COMPLIANT'

            timestamp = datetime.utcnow().isoformat()

            # Store evaluation in DynamoDB
            dynamodb_client.put_item(
                TableName=DYNAMODB_TABLE,
                Item={
                    'resource_id': {'S': bucket_name},
                    'evaluation_timestamp': {'S': timestamp},
                    'compliance_type': {'S': compliance_type},
                    'resource_type': {'S': 'AWS::S3::Bucket'},
                    'encryption_type': {'S': encryption_type},
                    'rule': {'S': 's3-encryption-enabled'}
                }
            )

            evaluation_results.append({
                'resource_id': bucket_name,
                'compliance_type': compliance_type,
                'encryption_type': encryption_type
            })

            if not is_compliant:
                non_compliant_resources.append({
                    'bucket_name': bucket_name,
                    'encryption_type': encryption_type
                })

        # Send SNS alert if non-compliant resources found
        if non_compliant_resources:
            message = f"S3 Encryption Compliance Alert\n\n"
            message += f"Found {len(non_compliant_resources)} non-compliant S3 buckets:\n\n"
            for resource in non_compliant_resources:
                message += f"Bucket: {resource['bucket_name']}\n"
                message += f"Encryption: {resource['encryption_type']}\n\n"

            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="S3 Encryption Compliance Violation",
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'S3 encryption compliance check completed',
                'total_buckets': len(evaluation_results),
                'non_compliant': len(non_compliant_resources)
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise
