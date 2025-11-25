import json
import boto3
import os

config_client = boto3.client('config')
ssm = boto3.client('ssm')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """
    Validates resources against security policies:
    - EC2 instances use approved AMIs
    - Security groups don't allow unrestricted access
    - S3 buckets have encryption enabled
    """
    configuration_item = json.loads(event['configurationItem'])
    resource_type = configuration_item['resourceType']
    resource_id = configuration_item['resourceId']

    violations = []

    # Validate EC2 Instance AMIs
    if resource_type == 'AWS::EC2::Instance':
        ami_id = configuration_item['configuration'].get('imageId')
        try:
            # Get approved AMIs from Parameter Store
            env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
            param_name = f'/compliance/approved-amis-{env_suffix}'
            approved_amis_param = ssm.get_parameter(Name=param_name)
            approved_amis = json.loads(approved_amis_param['Parameter']['Value'])

            if ami_id and ami_id not in approved_amis:
                violations.append(f'AMI {ami_id} is not in approved list')
        except Exception as e:
            # Handle any SSM errors (ParameterNotFound, etc.)
            print(f'Error validating AMI: {str(e)}')

    # Validate Security Group rules
    if resource_type == 'AWS::EC2::SecurityGroup':
        ingress_rules = configuration_item['configuration'].get('ipPermissions', [])
        for rule in ingress_rules:
            # Check for unrestricted access
            for ip_range in rule.get('ipRanges', []):
                if ip_range.get('cidrIp') == '0.0.0.0/0':
                    from_port = rule.get('fromPort', 'any')
                    to_port = rule.get('toPort', 'any')
                    protocol = rule.get('ipProtocol', 'all')
                    violations.append(
                        f'Security group allows unrestricted access from 0.0.0.0/0 '
                        f'on protocol {protocol} ports {from_port}-{to_port}'
                    )

            # Check IPv6 unrestricted access
            for ipv6_range in rule.get('ipv6Ranges', []):
                if ipv6_range.get('cidrIpv6') == '::/0':
                    violations.append('Security group allows unrestricted IPv6 access from ::/0')

    # Validate S3 Bucket encryption
    if resource_type == 'AWS::S3::Bucket':
        encryption = configuration_item['configuration'].get('serverSideEncryptionConfiguration')
        if not encryption:
            violations.append('S3 bucket does not have encryption enabled')

        # Check for public access
        public_access_block = configuration_item['configuration'].get('publicAccessBlockConfiguration', {})
        if not all([
            public_access_block.get('blockPublicAcls'),
            public_access_block.get('blockPublicPolicy'),
            public_access_block.get('ignorePublicAcls'),
            public_access_block.get('restrictPublicBuckets')
        ]):
            violations.append('S3 bucket does not have all public access blocks enabled')

    # Determine compliance
    compliance_type = 'COMPLIANT' if not violations else 'NON_COMPLIANT'
    annotation = '; '.join(violations) if violations else 'No security policy violations detected'

    evaluation = {
        'ComplianceResourceType': resource_type,
        'ComplianceResourceId': resource_id,
        'ComplianceType': compliance_type,
        'Annotation': annotation,
        'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
    }

    # Submit evaluation to AWS Config
    config_client.put_evaluations(
        Evaluations=[evaluation],
        ResultToken=event['resultToken']
    )

    # Send SNS notification for non-compliant resources
    if compliance_type == 'NON_COMPLIANT':
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        if sns_topic_arn:
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject=f'Security Policy Violation Detected - {resource_type}',
                Message=f'''Security policy violations detected:

Resource Type: {resource_type}
Resource ID: {resource_id}

Violations:
{chr(10).join(f'- {v}' for v in violations)}

Please remediate these violations to maintain security compliance.
'''
            )

    return {'statusCode': 200, 'body': json.dumps(evaluation)}
