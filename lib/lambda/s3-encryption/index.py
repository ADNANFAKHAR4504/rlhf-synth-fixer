import json
import boto3
import os

# Initialize AWS clients
config_client = boto3.client('config')
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """
    AWS Config custom rule to check if S3 buckets have encryption enabled.
    """
    try:
        # Get the configuration item from the event
        invoking_event = json.loads(event['invokingEvent'])
        configuration_item = invoking_event['configurationItem']

        # Get resource details
        resource_type = configuration_item['resourceType']
        resource_id = configuration_item['resourceId']

        # Only process S3 buckets
        if resource_type != 'AWS::S3::Bucket':
            return {
                'statusCode': 200,
                'body': json.dumps('Not an S3 bucket')
            }

        bucket_name = configuration_item['resourceName']

        # Check if bucket has encryption enabled
        try:
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            encryption_rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])

            if encryption_rules:
                compliance_type = 'COMPLIANT'
                encryption_type = encryption_rules[0].get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm', 'Unknown')
                annotation = f'Bucket has encryption enabled with {encryption_type}'
            else:
                compliance_type = 'NON_COMPLIANT'
                annotation = 'Bucket has encryption configuration but no rules defined'
        except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
            compliance_type = 'NON_COMPLIANT'
            annotation = 'Bucket does not have encryption enabled'

            # Send SNS notification for non-compliance
            try:
                sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
                environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

                message = f"""
Compliance Violation Detected

Environment: {environment_suffix}
Rule: S3 Bucket Encryption Check
Resource: {bucket_name}
Status: NON_COMPLIANT
Details: {annotation}

Please enable encryption on this S3 bucket immediately.
"""

                sns_client.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f'Compliance Violation: Unencrypted S3 Bucket in {environment_suffix}',
                    Message=message
                )
            except Exception as e:
                print(f"Error sending SNS notification: {str(e)}")

        except Exception as e:
            print(f"Error checking bucket encryption: {str(e)}")
            compliance_type = 'NON_COMPLIANT'
            annotation = f'Error checking encryption: {str(e)}'

        # Put evaluation result
        config_client.put_evaluations(
            Evaluations=[
                {
                    'ComplianceResourceType': resource_type,
                    'ComplianceResourceId': resource_id,
                    'ComplianceType': compliance_type,
                    'Annotation': annotation,
                    'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
                }
            ],
            ResultToken=event['resultToken']
        )

        return {
            'statusCode': 200,
            'body': json.dumps(f'Evaluation completed: {compliance_type}')
        }

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
