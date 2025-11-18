import boto3
import json

def lambda_handler(event, context):
    """
    AWS Config custom rule to check if KMS keys have rotation enabled.
    """
    config = boto3.client('config')
    kms = boto3.client('kms')
    
    configuration_item = event['configurationItem']
    resource_id = configuration_item['configuration']['keyId']
    
    try:
        response = kms.describe_key(KeyId=resource_id)
        key_rotation_enabled = response['KeyMetadata'].get('KeyRotationEnabled', False)
        
        if key_rotation_enabled:
            compliance_type = 'COMPLIANT'
            annotation = 'KMS key has rotation enabled'
        else:
            compliance_type = 'NON_COMPLIANT'
            annotation = 'KMS key does not have rotation enabled'
            
    except Exception as e:
        compliance_type = 'NOT_APPLICABLE'
        annotation = f'Error checking key: {str(e)}'
    
    evaluation = {
        'ComplianceResourceType': configuration_item['resourceType'],
        'ComplianceResourceId': resource_id,
        'ComplianceType': compliance_type,
        'Annotation': annotation,
        'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
    }
    
    config.put_evaluations(
        Evaluations=[evaluation],
        ResultToken=event['resultToken']
    )
    
    return evaluation

