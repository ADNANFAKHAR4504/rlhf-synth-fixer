"""Lambda function to check RDS encryption compliance."""
import json
import boto3

def lambda_handler(event, context):
    """
    Evaluate RDS instances for encryption compliance.

    Args:
        event: AWS Config rule evaluation event
        context: Lambda context object

    Returns:
        dict: Compliance evaluation result
    """
    # Initialize AWS Config client
    config_client = boto3.client('config')

    # Extract configuration item from event
    invoking_event = json.loads(event['invokingEvent'])
    configuration_item = invoking_event['configurationItem']

    # Check if resource is RDS instance
    if configuration_item['resourceType'] != 'AWS::RDS::DBInstance':
        return {
            'complianceType': 'NOT_APPLICABLE',
            'annotation': 'Resource is not an RDS instance'
        }

    # Get configuration details
    configuration = configuration_item.get('configuration', {})
    storage_encrypted = configuration.get('storageEncrypted', False)

    # Determine compliance
    if storage_encrypted:
        compliance_type = 'COMPLIANT'
        annotation = 'RDS instance has encryption enabled'
    else:
        compliance_type = 'NON_COMPLIANT'
        annotation = 'RDS instance does not have encryption enabled'

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
