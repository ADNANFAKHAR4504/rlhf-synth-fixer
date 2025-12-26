import json
import boto3
import os

def lambda_handler(event, context):
    config = boto3.client('config')
    kms = boto3.client('kms')

    # Parse the invoking event (it's a JSON string)
    invoking_event = json.loads(event['invokingEvent'])
    rule_parameters = json.loads(event['ruleParameters']) if 'ruleParameters' in event and event['ruleParameters'] else {}
    result_token = event['resultToken']

    # Access configuration item from parsed invoking event
    configuration_item = invoking_event['configurationItem']
    resource_type = configuration_item['resourceType']
    resource_id = configuration_item['resourceId']

    compliance_type = 'NOT_APPLICABLE'
    annotation = 'N/A'

    if resource_type == 'AWS::KMS::Key':
        try:
            key_id = resource_id
            response = kms.get_key_rotation_status(KeyId=key_id)
            if response['KeyRotationEnabled']:
                compliance_type = 'COMPLIANT'
                annotation = 'KMS key rotation is enabled.'
            else:
                compliance_type = 'NON_COMPLIANT'
                annotation = 'KMS key rotation is NOT enabled.'
        except Exception as e:
            compliance_type = 'NON_COMPLIANT'
            annotation = f'Error checking KMS key rotation: {str(e)}'

    config.put_evaluations(
        Evaluations=[
            {
                'ComplianceResourceType': resource_type,
                'ComplianceResourceId': resource_id,
                'ComplianceType': compliance_type,
                'Annotation': annotation,
                'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
            },
        ],
        ResultToken=result_token
    )

