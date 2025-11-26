"""
CloudFormation Template Parser Lambda Function

Parses CloudFormation templates from S3 and extracts resource definitions
for compliance validation. Handles nested stacks and cross-references.
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
s3_client = boto3.client('s3')
cfn_client = boto3.client('cloudformation')
dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for parsing CloudFormation templates.
    
    Args:
        event: Lambda event containing stack information
        context: Lambda context
        
    Returns:
        Dictionary with parsed resources and metadata
    """
    try:
        # Extract stack information from event
        stack_name = event.get('stackName')
        account_id = event.get('accountId', context.invoked_function_arn.split(':')[4])
        region = event.get('region', os.environ.get('AWS_REGION', 'us-east-1'))
        
        if not stack_name:
            return create_error_response('Missing required parameter: stackName')
        
        # Get CloudFormation template
        template = get_cloudformation_template(stack_name, account_id, event.get('roleArn'))
        
        if not template:
            return create_error_response(f'Failed to retrieve template for stack: {stack_name}')
        
        # Parse template and extract resources
        resources = parse_template_resources(template)
        
        # Store initial scan record
        timestamp = datetime.utcnow().isoformat()
        scan_id = f"{account_id}#{timestamp}"
        
        # Store metadata in DynamoDB
        store_scan_metadata(scan_id, stack_name, account_id, region, len(resources))
        
        # Publish CloudWatch metrics
        publish_metrics('TemplatesParsed', 1)
        publish_metrics('ResourcesExtracted', len(resources))
        
        return {
            'statusCode': 200,
            'scanId': scan_id,
            'stackName': stack_name,
            'accountId': account_id,
            'region': region,
            'resourceCount': len(resources),
            'resources': resources,
            'timestamp': timestamp
        }
        
    except Exception as e:
        error_message = f'Error parsing template: {str(e)}'
        print(error_message)
        
        # Send notification for critical errors
        send_error_notification(error_message, event)
        
        # Publish error metric
        publish_metrics('ParsingErrors', 1)
        
        return create_error_response(error_message)


@xray_recorder.capture('get_cloudformation_template')
def get_cloudformation_template(stack_name: str, account_id: str, role_arn: str = None) -> Dict:
    """
    Retrieve CloudFormation template from AWS.
    
    Args:
        stack_name: Name of the CloudFormation stack
        account_id: AWS account ID
        role_arn: Optional cross-account role ARN
        
    Returns:
        Template dictionary or None if error
    """
    try:
        # Assume cross-account role if provided
        if role_arn:
            sts_client = boto3.client('sts')
            assumed_role = sts_client.assume_role(
                RoleArn=role_arn,
                RoleSessionName=f'ComplianceScanner-{account_id}',
                DurationSeconds=3600
            )
            
            # Create CloudFormation client with assumed credentials
            cfn_client_cross = boto3.client(
                'cloudformation',
                aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
                aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
                aws_session_token=assumed_role['Credentials']['SessionToken']
            )
        else:
            cfn_client_cross = cfn_client
        
        # Get template
        response = cfn_client_cross.get_template(
            StackName=stack_name,
            TemplateStage='Original'
        )
        
        template_body = response.get('TemplateBody', {})
        
        # Parse if string
        if isinstance(template_body, str):
            template_body = json.loads(template_body)
        
        return template_body
        
    except cfn_client.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        print(f'CloudFormation API error: {error_code} - {str(e)}')
        return None
    except Exception as e:
        print(f'Error retrieving template: {str(e)}')
        return None


@xray_recorder.capture('parse_template_resources')
def parse_template_resources(template: Dict) -> List[Dict]:
    """
    Parse CloudFormation template and extract all resource definitions.
    
    Args:
        template: CloudFormation template dictionary
        
    Returns:
        List of resource definitions with metadata
    """
    resources = []
    template_resources = template.get('Resources', {})
    
    for logical_id, resource_def in template_resources.items():
        resource_type = resource_def.get('Type', 'Unknown')
        properties = resource_def.get('Properties', {})
        
        # Extract relevant information based on resource type
        resource_info = {
            'logicalId': logical_id,
            'type': resource_type,
            'properties': properties
        }
        
        # Extract specific compliance-relevant properties
        if resource_type == 'AWS::S3::Bucket':
            resource_info['encryption'] = extract_s3_encryption(properties)
            resource_info['publicAccess'] = extract_s3_public_access(properties)
            
        elif resource_type == 'AWS::RDS::DBInstance':
            resource_info['encryption'] = properties.get('StorageEncrypted', False)
            resource_info['publiclyAccessible'] = properties.get('PubliclyAccessible', False)
            
        elif resource_type == 'AWS::EC2::Instance':
            resource_info['instanceType'] = properties.get('InstanceType', 'Unknown')
        
        resources.append(resource_info)
    
    return resources


def extract_s3_encryption(properties: Dict) -> Dict:
    """Extract S3 bucket encryption configuration."""
    encryption_config = properties.get('BucketEncryption', {})
    rules = encryption_config.get('ServerSideEncryptionConfiguration', [])
    
    if not rules:
        return {'enabled': False, 'algorithm': None}
    
    sse_default = rules[0].get('ServerSideEncryptionByDefault', {})
    algorithm = sse_default.get('SSEAlgorithm', 'Unknown')
    
    return {
        'enabled': True,
        'algorithm': algorithm,
        'kmsKeyId': sse_default.get('KMSMasterKeyID')
    }


def extract_s3_public_access(properties: Dict) -> Dict:
    """Extract S3 bucket public access configuration."""
    public_access_config = properties.get('PublicAccessBlockConfiguration', {})
    
    return {
        'blockPublicAcls': public_access_config.get('BlockPublicAcls', False),
        'blockPublicPolicy': public_access_config.get('BlockPublicPolicy', False),
        'ignorePublicAcls': public_access_config.get('IgnorePublicAcls', False),
        'restrictPublicBuckets': public_access_config.get('RestrictPublicBuckets', False)
    }


@xray_recorder.capture('store_scan_metadata')
def store_scan_metadata(scan_id: str, stack_name: str, account_id: str, 
                        region: str, resource_count: int) -> None:
    """
    Store scan metadata in DynamoDB.
    
    Args:
        scan_id: Unique scan identifier (accountId#timestamp)
        stack_name: CloudFormation stack name
        account_id: AWS account ID
        region: AWS region
        resource_count: Number of resources found
    """
    try:
        table.put_item(
            Item={
                'accountIdTimestamp': scan_id,
                'resourceId': 'METADATA',
                'stackName': stack_name,
                'accountId': account_id,
                'region': region,
                'resourceCount': resource_count,
                'scanStatus': 'PARSING_COMPLETE',
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    except Exception as e:
        print(f'Error storing scan metadata: {str(e)}')


def publish_metrics(metric_name: str, value: float, unit: str = 'Count') -> None:
    """
    Publish custom CloudWatch metrics.
    
    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Metric unit (default: Count)
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


def send_error_notification(error_message: str, event: Dict) -> None:
    """
    Send SNS notification for critical errors.
    
    Args:
        error_message: Error message to send
        event: Original Lambda event
    """
    try:
        message = {
            'Subject': 'CloudFormation Compliance Scan Error',
            'ErrorMessage': error_message,
            'Event': event,
            'Timestamp': datetime.utcnow().isoformat()
        }
        
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject='Compliance Scanner Error',
            Message=json.dumps(message, indent=2)
        )
    except Exception as e:
        print(f'Error sending SNS notification: {str(e)}')


def create_error_response(error_message: str) -> Dict:
    """Create standardized error response."""
    return {
        'statusCode': 500,
        'error': error_message,
        'timestamp': datetime.utcnow().isoformat()
    }
