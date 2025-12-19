"""Lambda function to check S3 bucket policy compliance."""
import json
import boto3

def lambda_handler(event, context):
    """
    Evaluate S3 buckets for public access compliance.

    Args:
        event: AWS Config rule evaluation event
        context: Lambda context object

    Returns:
        dict: Compliance evaluation result
    """
    # Initialize AWS Config and S3 clients
    config_client = boto3.client('config')
    s3_client = boto3.client('s3')

    # Extract configuration item from event
    invoking_event = json.loads(event['invokingEvent'])
    configuration_item = invoking_event['configurationItem']

    # Check if resource is S3 bucket
    if configuration_item['resourceType'] != 'AWS::S3::Bucket':
        return {
            'complianceType': 'NOT_APPLICABLE',
            'annotation': 'Resource is not an S3 bucket'
        }

    bucket_name = configuration_item['resourceName']

    try:
        # Check public access block configuration
        public_access_block = s3_client.get_public_access_block(
            Bucket=bucket_name
        )

        config = public_access_block['PublicAccessBlockConfiguration']

        # Check if all public access blocks are enabled
        blocks_enabled = (
            config.get('BlockPublicAcls', False) and
            config.get('IgnorePublicAcls', False) and
            config.get('BlockPublicPolicy', False) and
            config.get('RestrictPublicBuckets', False)
        )

        if blocks_enabled:
            compliance_type = 'COMPLIANT'
            annotation = 'S3 bucket has public access blocks enabled'
        else:
            compliance_type = 'NON_COMPLIANT'
            annotation = 'S3 bucket does not have all public access blocks enabled'

    except s3_client.exceptions.NoSuchPublicAccessBlockConfiguration:
        compliance_type = 'NON_COMPLIANT'
        annotation = 'S3 bucket does not have public access block configuration'
    except Exception as e:
        compliance_type = 'NON_COMPLIANT'
        annotation = f'Error checking bucket configuration: {str(e)}'

    # Return compliance evaluation
    evaluation = {
        'ComplianceResourceType': configuration_item['resourceType'],
        'ComplianceResourceId': configuration_item['resourceId'],
        'ComplianceType': compliance_type,
        'Annotation': annotation,
        'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
    }

    # Put evaluation to AWS Config
    config_client.put_evaluations(
        Evaluations=[evaluation],
        ResultToken=event['resultToken']
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'complianceType': compliance_type,
            'annotation': annotation
        })
    }
