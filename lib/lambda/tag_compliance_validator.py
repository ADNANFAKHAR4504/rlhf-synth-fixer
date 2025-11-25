import json
import boto3
import os

config = boto3.client('config')
sns = boto3.client('sns')

REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']

def lambda_handler(event, context):
    """
    Validates that resources have required tags: Environment, Owner, CostCenter
    """
    configuration_item = json.loads(event['configurationItem'])
    resource_type = configuration_item['resourceType']
    resource_id = configuration_item['resourceId']
    tags = configuration_item.get('tags', {})

    # Check for missing required tags
    missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

    compliance_type = 'COMPLIANT' if not missing_tags else 'NON_COMPLIANT'
    annotation = f'Missing required tags: {missing_tags}' if missing_tags else 'All required tags present'

    evaluation = {
        'ComplianceResourceType': resource_type,
        'ComplianceResourceId': resource_id,
        'ComplianceType': compliance_type,
        'Annotation': annotation,
        'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
    }

    # Submit evaluation to AWS Config
    config.put_evaluations(
        Evaluations=[evaluation],
        ResultToken=event['resultToken']
    )

    # Send SNS notification for non-compliant resources
    if compliance_type == 'NON_COMPLIANT':
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        if sns_topic_arn:
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject='Non-Compliant Resource Detected - Missing Tags',
                Message=f'Resource {resource_id} ({resource_type}) is missing required tags: {missing_tags}'
            )

    return {'statusCode': 200, 'body': json.dumps(evaluation)}
