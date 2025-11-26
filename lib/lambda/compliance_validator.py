"""
Compliance Validator Lambda Function

Validates parsed CloudFormation resources against AWS Config Rules
and identifies compliance violations.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, List, Any
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK clients for X-Ray tracing
patch_all()

# Initialize AWS clients
config_client = boto3.client('config')
dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)

# Compliance rules configuration
COMPLIANCE_RULES = {
    'S3_ENCRYPTION': {
        'resourceType': 'AWS::S3::Bucket',
        'requiredAlgorithms': ['AES256', 'aws:kms'],
        'severity': 'HIGH'
    },
    'RDS_ENCRYPTION': {
        'resourceType': 'AWS::RDS::DBInstance',
        'requiredEncryption': True,
        'severity': 'CRITICAL'
    },
    'EC2_INSTANCE_TYPE': {
        'resourceType': 'AWS::EC2::Instance',
        'allowedTypes': ['t3.micro', 't3.small'],
        'severity': 'MEDIUM'
    }
}


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for compliance validation.
    
    Args:
        event: Lambda event containing parsed resources
        context: Lambda context
        
    Returns:
        Dictionary with validation results and violations
    """
    try:
        # Extract data from previous step
        scan_id = event.get('scanId')
        resources = event.get('resources', [])
        stack_name = event.get('stackName')
        account_id = event.get('accountId')
        
        if not scan_id or not resources:
            return create_error_response('Missing required data from previous step')
        
        # Validate each resource against compliance rules
        validation_results = []
        violations = []
        compliant_count = 0
        
        for resource in resources:
            result = validate_resource(resource, scan_id)
            validation_results.append(result)
            
            if result['compliant']:
                compliant_count += 1
            else:
                violations.append(result)
        
        # Calculate compliance score
        total_resources = len(resources)
        compliance_score = (compliant_count / total_resources * 100) if total_resources > 0 else 0
        
        # Store validation results in DynamoDB
        store_validation_results(scan_id, validation_results, compliance_score)
        
        # Send notifications for critical violations
        critical_violations = [v for v in violations if v.get('severity') == 'CRITICAL']
        if critical_violations:
            send_violation_notifications(critical_violations, stack_name, account_id)
        
        # Publish CloudWatch metrics
        publish_metrics('ComplianceScore', compliance_score, 'Percent')
        publish_metrics('TotalResourcesScanned', total_resources)
        publish_metrics('ViolationsDetected', len(violations))
        publish_metrics_by_service(violations)
        
        return {
            'statusCode': 200,
            'scanId': scan_id,
            'totalResources': total_resources,
            'compliantResources': compliant_count,
            'violations': len(violations),
            'complianceScore': compliance_score,
            'validationResults': validation_results,
            'criticalViolations': len(critical_violations),
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_message = f'Error validating compliance: {str(e)}'
        print(error_message)
        publish_metrics('ValidationErrors', 1)
        return create_error_response(error_message)


@xray_recorder.capture('validate_resource')
def validate_resource(resource: Dict, scan_id: str) -> Dict:
    """
    Validate a single resource against compliance rules.
    
    Args:
        resource: Resource definition from template
        scan_id: Scan identifier
        
    Returns:
        Validation result dictionary
    """
    resource_type = resource.get('type')
    logical_id = resource.get('logicalId')
    
    # Initialize result
    result = {
        'resourceId': logical_id,
        'resourceType': resource_type,
        'compliant': True,
        'violations': [],
        'severity': 'NONE'
    }
    
    # Validate S3 buckets
    if resource_type == 'AWS::S3::Bucket':
        result = validate_s3_bucket(resource)
        
    # Validate RDS instances
    elif resource_type == 'AWS::RDS::DBInstance':
        result = validate_rds_instance(resource)
        
    # Validate EC2 instances
    elif resource_type == 'AWS::EC2::Instance':
        result = validate_ec2_instance(resource)
    
    return result


def validate_s3_bucket(resource: Dict) -> Dict:
    """
    Validate S3 bucket against encryption and public access rules.
    
    Args:
        resource: S3 bucket resource definition
        
    Returns:
        Validation result
    """
    logical_id = resource.get('logicalId')
    encryption_config = resource.get('encryption', {})
    public_access_config = resource.get('publicAccess', {})
    
    violations = []
    severity = 'NONE'
    
    # Check encryption
    if not encryption_config.get('enabled'):
        violations.append({
            'rule': 'S3_ENCRYPTION_REQUIRED',
            'message': 'S3 bucket does not have encryption enabled',
            'remediation': 'Enable server-side encryption with AES256 or KMS'
        })
        severity = 'HIGH'
    elif encryption_config.get('algorithm') not in ['AES256', 'aws:kms']:
        violations.append({
            'rule': 'S3_ENCRYPTION_ALGORITHM',
            'message': f'S3 bucket uses unsupported encryption algorithm: {encryption_config.get("algorithm")}',
            'remediation': 'Use AES256 or aws:kms encryption algorithm'
        })
        severity = 'HIGH'
    
    # Check public access
    if not all([
        public_access_config.get('blockPublicAcls', False),
        public_access_config.get('blockPublicPolicy', False),
        public_access_config.get('ignorePublicAcls', False),
        public_access_config.get('restrictPublicBuckets', False)
    ]):
        violations.append({
            'rule': 'S3_PUBLIC_ACCESS_BLOCK',
            'message': 'S3 bucket does not have all public access blocks enabled',
            'remediation': 'Enable all four public access block settings'
        })
        severity = 'CRITICAL'
    
    return {
        'resourceId': logical_id,
        'resourceType': 'AWS::S3::Bucket',
        'compliant': len(violations) == 0,
        'violations': violations,
        'severity': severity
    }


def validate_rds_instance(resource: Dict) -> Dict:
    """
    Validate RDS instance against encryption rules.
    
    Args:
        resource: RDS instance resource definition
        
    Returns:
        Validation result
    """
    logical_id = resource.get('logicalId')
    encryption_enabled = resource.get('encryption', False)
    publicly_accessible = resource.get('publiclyAccessible', False)
    
    violations = []
    severity = 'NONE'
    
    # Check encryption
    if not encryption_enabled:
        violations.append({
            'rule': 'RDS_ENCRYPTION_REQUIRED',
            'message': 'RDS instance does not have encryption enabled',
            'remediation': 'Enable storage encryption for RDS instance'
        })
        severity = 'CRITICAL'
    
    # Check public accessibility
    if publicly_accessible:
        violations.append({
            'rule': 'RDS_PUBLIC_ACCESS',
            'message': 'RDS instance is publicly accessible',
            'remediation': 'Set PubliclyAccessible to false'
        })
        severity = 'CRITICAL'
    
    return {
        'resourceId': logical_id,
        'resourceType': 'AWS::RDS::DBInstance',
        'compliant': len(violations) == 0,
        'violations': violations,
        'severity': severity
    }


def validate_ec2_instance(resource: Dict) -> Dict:
    """
    Validate EC2 instance against instance type rules.
    
    Args:
        resource: EC2 instance resource definition
        
    Returns:
        Validation result
    """
    logical_id = resource.get('logicalId')
    instance_type = resource.get('instanceType', 'Unknown')
    allowed_types = COMPLIANCE_RULES['EC2_INSTANCE_TYPE']['allowedTypes']
    
    violations = []
    severity = 'NONE'
    
    # Check instance type
    if instance_type not in allowed_types:
        violations.append({
            'rule': 'EC2_INSTANCE_TYPE_ALLOWED',
            'message': f'EC2 instance type {instance_type} is not in allowed list',
            'remediation': f'Use one of the allowed instance types: {", ".join(allowed_types)}'
        })
        severity = 'MEDIUM'
    
    return {
        'resourceId': logical_id,
        'resourceType': 'AWS::EC2::Instance',
        'compliant': len(violations) == 0,
        'violations': violations,
        'severity': severity
    }


@xray_recorder.capture('store_validation_results')
def store_validation_results(scan_id: str, validation_results: List[Dict], 
                             compliance_score: float) -> None:
    """
    Store validation results in DynamoDB.
    
    Args:
        scan_id: Scan identifier
        validation_results: List of validation results
        compliance_score: Overall compliance score
    """
    try:
        # Store each resource validation result
        for result in validation_results:
            table.put_item(
                Item={
                    'accountIdTimestamp': scan_id,
                    'resourceId': result['resourceId'],
                    'resourceType': result['resourceType'],
                    'compliant': result['compliant'],
                    'violations': result['violations'],
                    'severity': result['severity'],
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
        
        # Update metadata with compliance score
        table.update_item(
            Key={
                'accountIdTimestamp': scan_id,
                'resourceId': 'METADATA'
            },
            UpdateExpression='SET complianceScore = :score, scanStatus = :status',
            ExpressionAttributeValues={
                ':score': str(compliance_score),
                ':status': 'VALIDATION_COMPLETE'
            }
        )
        
    except Exception as e:
        print(f'Error storing validation results: {str(e)}')


def send_violation_notifications(violations: List[Dict], stack_name: str, 
                                 account_id: str) -> None:
    """
    Send SNS notifications for compliance violations.
    
    Args:
        violations: List of violation details
        stack_name: CloudFormation stack name
        account_id: AWS account ID
    """
    try:
        violation_summary = []
        
        for violation in violations:
            resource_id = violation.get('resourceId')
            resource_type = violation.get('resourceType')
            violation_list = violation.get('violations', [])
            
            for v in violation_list:
                violation_summary.append({
                    'Resource': f"{resource_type} - {resource_id}",
                    'Rule': v.get('rule'),
                    'Message': v.get('message'),
                    'Remediation': v.get('remediation')
                })
        
        message = {
            'Subject': f'CRITICAL: Compliance Violations Detected in {stack_name}',
            'Account': account_id,
            'Stack': stack_name,
            'ViolationCount': len(violations),
            'Violations': violation_summary,
            'Timestamp': datetime.utcnow().isoformat(),
            'Action': 'Review and remediate violations immediately'
        }
        
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'CRITICAL: Compliance Violations in {stack_name}',
            Message=json.dumps(message, indent=2)
        )
        
    except Exception as e:
        print(f'Error sending violation notifications: {str(e)}')


def publish_metrics(metric_name: str, value: float, unit: str = 'Count') -> None:
    """
    Publish custom CloudWatch metrics.
    
    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Metric unit
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='ComplianceAnalyzer',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': ENVIRONMENT_SUFFIX
                        }
                    ]
                }
            ]
        )
    except Exception as e:
        print(f'Error publishing metric {metric_name}: {str(e)}')


def publish_metrics_by_service(violations: List[Dict]) -> None:
    """
    Publish violation metrics broken down by service type.
    
    Args:
        violations: List of violations
    """
    try:
        # Count violations by service
        service_counts = {}
        for violation in violations:
            resource_type = violation.get('resourceType', 'Unknown')
            service = resource_type.split('::')[1] if '::' in resource_type else 'Unknown'
            service_counts[service] = service_counts.get(service, 0) + 1
        
        # Publish metrics for each service
        for service, count in service_counts.items():
            cloudwatch.put_metric_data(
                Namespace='ComplianceAnalyzer',
                MetricData=[
                    {
                        'MetricName': f'{service}Violations',
                        'Value': count,
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow(),
                        'Dimensions': [
                            {
                                'Name': 'Environment',
                                'Value': ENVIRONMENT_SUFFIX
                            }
                        ]
                    }
                ]
            )
    except Exception as e:
        print(f'Error publishing service metrics: {str(e)}')


def create_error_response(error_message: str) -> Dict:
    """Create standardized error response."""
    return {
        'statusCode': 500,
        'error': error_message,
        'timestamp': datetime.utcnow().isoformat()
    }
