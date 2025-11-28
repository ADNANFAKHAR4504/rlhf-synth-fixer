"""Lambda function to check EC2 instance tagging compliance."""
import json
import boto3

# Required tags for compliance
REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']

def lambda_handler(event, context):
    """
    Evaluate EC2 instances for required tags compliance.

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

    # Check if resource is EC2 instance
    if configuration_item['resourceType'] != 'AWS::EC2::Instance':
        return {
            'complianceType': 'NOT_APPLICABLE',
            'annotation': 'Resource is not an EC2 instance'
        }

    # Get instance tags
    instance_tags = configuration_item.get('tags', {})

    # Check for required tags
    missing_tags = []
    for required_tag in REQUIRED_TAGS:
        if required_tag not in instance_tags:
            missing_tags.append(required_tag)

    # Determine compliance
    if missing_tags:
        compliance_type = 'NON_COMPLIANT'
        annotation = f'Missing required tags: {", ".join(missing_tags)}'
    else:
        compliance_type = 'COMPLIANT'
        annotation = 'All required tags are present'

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
