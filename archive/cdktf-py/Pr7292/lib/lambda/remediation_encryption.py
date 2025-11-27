import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
config_client = boto3.client('config')
kms_client = boto3.client('kms')

def lambda_handler(event, context):
    """Enable KMS encryption for non-compliant S3 buckets"""

    logger.info(f"Received event: {json.dumps(event)}")

    try:
        # Extract information from Config event
        invoking_event = json.loads(event.get('configRuleInvokingEvent', '{}'))
        configuration_item = invoking_event.get('configurationItem', {})

        resource_type = configuration_item.get('resourceType')
        bucket_name = configuration_item.get('resourceId')
        compliance_type = event.get('complianceType', 'NON_COMPLIANT')

        kms_key_id = os.environ.get('KMS_KEY_ID')

        if resource_type != 'AWS::S3::Bucket':
            logger.warning(f"Unsupported resource type: {resource_type}")
            return {
                'statusCode': 400,
                'body': json.dumps('Unsupported resource type')
            }

        if not bucket_name:
            logger.error("No bucket name found in event")
            return {
                'statusCode': 400,
                'body': json.dumps('No bucket name provided')
            }

        # Only remediate if non-compliant
        if compliance_type == 'NON_COMPLIANT':
            logger.info(f"Enabling KMS encryption for bucket: {bucket_name}")

            try:
                encryption_config = {
                    'Rules': [
                        {
                            'ApplyServerSideEncryptionByDefault': {
                                'SSEAlgorithm': 'aws:kms'
                            },
                            'BucketKeyEnabled': True
                        }
                    ]
                }

                # Add KMS key if provided
                if kms_key_id:
                    encryption_config['Rules'][0]['ApplyServerSideEncryptionByDefault']['KMSMasterKeyID'] = kms_key_id

                s3_client.put_bucket_encryption(
                    Bucket=bucket_name,
                    ServerSideEncryptionConfiguration=encryption_config
                )

                # Log to CloudWatch
                log_message = {
                    'timestamp': context.aws_request_id,
                    'action': 'enable_kms_encryption',
                    'resource': bucket_name,
                    'resource_type': 'S3_BUCKET',
                    'status': 'SUCCESS',
                    'kms_key': kms_key_id or 'default',
                    'message': f'KMS encryption enabled for {bucket_name}'
                }

                logger.info(f"Remediation successful: {json.dumps(log_message)}")

                # Put evaluation result back to Config
                if 'resultToken' in event:
                    config_client.put_evaluations(
                        Evaluations=[
                            {
                                'ComplianceResourceType': resource_type,
                                'ComplianceResourceId': bucket_name,
                                'ComplianceType': 'COMPLIANT',
                                'Annotation': 'KMS encryption enabled by automatic remediation',
                                'OrderingTimestamp': configuration_item.get('configurationItemCaptureTime')
                            }
                        ],
                        ResultToken=event['resultToken']
                    )

                return {
                    'statusCode': 200,
                    'body': json.dumps(log_message)
                }

            except Exception as remediation_error:
                logger.error(f"Remediation failed for {bucket_name}: {str(remediation_error)}")

                log_message = {
                    'timestamp': context.aws_request_id,
                    'action': 'enable_kms_encryption',
                    'resource': bucket_name,
                    'resource_type': 'S3_BUCKET',
                    'status': 'FAILED',
                    'message': str(remediation_error)
                }

                logger.error(f"Remediation failed: {json.dumps(log_message)}")

                return {
                    'statusCode': 500,
                    'body': json.dumps(log_message)
                }
        else:
            logger.info(f"Bucket {bucket_name} is already compliant")
            return {
                'statusCode': 200,
                'body': json.dumps('Bucket already compliant')
            }

    except Exception as e:
        logger.error(f"Lambda execution error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
