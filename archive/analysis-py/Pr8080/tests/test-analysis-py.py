"""
REQUIRED Mock Configuration Setup for AWS Resource Analysis Testing
================================================================

This setup is MANDATORY for running and testing AWS resource analysis tasks.
All new resource analysis implementations must follow this testing framework
to ensure consistent mocking and validation of AWS resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID 
     - AWS_SECRET_ACCESS_KEY

2. Create Mock Resource Setup (REQUIRED):
   a. Create a setup function (e.g., setup_your_resource()):
      - Use boto_client(service_name) to get AWS service client
      - Create your mock resources using boto3 API calls
      - Handle idempotency to avoid duplicate resources
      - Add error handling for existing resources

3. Create Test Function (REQUIRED):
   a. Define test function (e.g., test_your_resource_analysis())
   b. Call your setup function to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output:
      - Check for correct section in results
      - Validate structure and required fields
      - Verify resource counts and metrics
      - Test specific resource attributes

Standard Implementation Template:
------------------------------
```python
def setup_your_resource():
    client = boto_client("your-service")
    # Create mock resources
    # Handle existing resources
    # Add configurations

def test_your_resource_analysis():
    # Setup resources
    setup_your_resource()
    
    # Run analysis
    results = run_analysis_script()
    
    # Validate results
    assert "YourSection" in results
    assert "ExpectedField" in results["YourSection"]
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- EBS volumes (setup_ebs_volumes)
- Security groups (setup_security_groups)
- CloudWatch logs (setup_log_group_and_streams)

Note: Without this mock configuration setup, resource analysis tests will not 
function correctly and may produce invalid results.
"""

import json
import os
import subprocess
import sys
import time

import boto3
import pytest


def ensure_env():
    """Ensure required environment variables are set with defaults."""
    os.environ.setdefault("AWS_ENDPOINT_URL", "http://localhost:5001")
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
    os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")


def boto_client(service: str):
    """Create boto3 client with environment configuration."""
    ensure_env()
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def setup_ebs_volumes():
    ec2 = boto_client("ec2")
    # Create 3 unused volumes
    ec2.create_volume(AvailabilityZone="us-east-1a", Size=1)
    ec2.create_volume(AvailabilityZone="us-east-1a", Size=2)
    ec2.create_volume(AvailabilityZone="us-east-1a", Size=3)


def setup_security_groups():
    ec2 = boto_client("ec2")
    # Create two groups, one with public ingress
    # Ensure idempotency by checking if groups exist
    existing_sgs = ec2.describe_security_groups(Filters=[
        {'Name': 'group-name', 'Values': ['private', 'public']}
    ])['SecurityGroups']
    
    private_sg_id = next((sg['GroupId'] for sg in existing_sgs if sg['GroupName'] == 'private'), None)
    public_sg_id = next((sg['GroupId'] for sg in existing_sgs if sg['GroupName'] == 'public'), None)

    if not private_sg_id:
        private_sg_id = ec2.create_security_group(GroupName="private", Description="no public")['GroupId']
    if not public_sg_id:
        public_sg_id = ec2.create_security_group(GroupName="public", Description="has public")['GroupId']

    # Authorize ingress for the public group if not already authorized
    try:
        ec2.authorize_security_group_ingress(
            GroupId=public_sg_id,
            IpPermissions=[
                {'IpProtocol': 'tcp', 'FromPort': 22, 'ToPort': 22, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}
            ]
        )
    except ec2.exceptions.ClientError as e:
        if "InvalidPermission.Duplicate" not in str(e):
            raise


def setup_log_group_and_streams():
    logs = boto_client("logs")
    ts = int(time.time() * 1000)

    # Create log group and streams
    try:
        logs.create_log_group(logGroupName="/test-group")
    except logs.exceptions.ResourceAlreadyExistsException:
        pass # Group already exists

    logs.create_log_stream(logGroupName="/test-group", logStreamName="s1")
    logs.create_log_stream(logGroupName="/test-group", logStreamName="s2")

    # Put dummy events to grow storedBytes
    logs.put_log_events(
        logGroupName="/test-group",
        logStreamName="s1",
        logEvents=[{"timestamp": ts, "message": "x" + "x" * 100}]
    )
    logs.put_log_events(
        logGroupName="/test-group",
        logStreamName="s2",
        logEvents=[{"timestamp": ts, "message": "x" + "x" * 300}]
    )


def setup_infrastructure_analyzer_resources():
    """
    Setup all AWS resources needed for InfrastructureAnalyzer class.
    This includes Config, S3, DynamoDB, SNS, SSM resources.
    """
    # Setup S3 bucket for reports
    s3 = boto_client("s3")
    bucket_name = os.environ.get('S3_REPORT_BUCKET', 'aws-compliance-reports')
    try:
        s3.create_bucket(Bucket=bucket_name)
    except s3.exceptions.BucketAlreadyOwnedByYou:
        pass
    except Exception as e:
        if "BucketAlreadyExists" not in str(e):
            raise
    
    # Setup DynamoDB table for drift records
    dynamodb = boto_client("dynamodb")
    table_name = os.environ.get('DYNAMODB_TABLE', 'drift-records')
    try:
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'resourceId', 'KeyType': 'HASH'},
                {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'resourceId', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
    except dynamodb.exceptions.ResourceInUseException:
        pass
    
    # Setup SNS topic for alerts
    sns = boto_client("sns")
    topic_name = 'drift-alerts'
    try:
        response = sns.create_topic(Name=topic_name)
        topic_arn = response['TopicArn']
        # Set the SNS_TOPIC_ARN environment variable for the analysis script
        os.environ['SNS_TOPIC_ARN'] = topic_arn
    except Exception as e:
        print(f"SNS topic creation warning: {e}")
    
    # Setup SSM Parameter for baseline (optional - script falls back to Config history)
    ssm = boto_client("ssm")
    param_name = os.environ.get('SSM_BASELINE_PARAM', '/config/baseline')
    baseline_data = {
        'source': 'ssm_parameter',
        'timestamp': '2024-01-01T00:00:00Z',
        'resources': {}
    }
    try:
        ssm.put_parameter(
            Name=param_name,
            Value=json.dumps(baseline_data),
            Type='String',
            Overwrite=True
        )
    except Exception as e:
        print(f"SSM parameter creation warning: {e}")
    
    # Setup AWS Config - create mock configuration recorder and delivery channel
    config_client = boto_client("config")
    try:
        # Create configuration recorder
        config_client.put_configuration_recorder(
            ConfigurationRecorder={
                'name': 'default',
                'roleARN': 'arn:aws:iam::123456789012:role/config-role',
                'recordingGroup': {
                    'allSupported': True,
                    'includeGlobalResourceTypes': True
                }
            }
        )
    except Exception as e:
        print(f"Config recorder creation warning: {e}")
    
    try:
        # Create delivery channel
        config_client.put_delivery_channel(
            DeliveryChannel={
                'name': 'default',
                's3BucketName': bucket_name
            }
        )
    except Exception as e:
        print(f"Config delivery channel creation warning: {e}")
    
    # Create some mock Config resources for testing
    # S3 Bucket with versioning enabled
    s3_bucket_config = {
        'BucketVersioningConfiguration': {'Status': 'Enabled'},
        'BucketLifecycleConfiguration': {'Rules': [
            {'Id': 'rule1', 'Status': 'Enabled', 'ExpirationInDays': 90}
        ]}
    }
    
    # DynamoDB Table with on-demand billing
    dynamodb_table_config = {
        'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'}
    }
    
    # Lambda function with proper memory and timeout
    lambda_config = {
        'MemorySize': 3072,
        'Timeout': 300
    }
    
    # EventBridge rule with 6-hour schedule
    eventbridge_config = {
        'ScheduleExpression': 'rate(6 hours)'
    }
    
    # Mock putting these configurations into Config
    # Note: Moto's Config service has limited support, so we'll create minimal mocks
    try:
        # Create a mock S3 bucket that Config can discover
        test_bucket = 'test-config-bucket'
        try:
            s3.create_bucket(Bucket=test_bucket)
        except:
            pass
        
        # Create a Lambda function for Config to discover
        lambda_client = boto_client("lambda")
        try:
            lambda_client.create_function(
                FunctionName='test-analysis-function',
                Runtime='python3.12',
                Role='arn:aws:iam::123456789012:role/lambda-role',
                Handler='index.handler',
                Code={'ZipFile': b'fake code'},
                MemorySize=3072,
                Timeout=300
            )
        except lambda_client.exceptions.ResourceConflictException:
            pass
        
        # Create an SNS topic for Config to discover
        try:
            sns.create_topic(Name='test-config-topic')
        except:
            pass
        
    except Exception as e:
        print(f"Config resource setup warning: {e}")


def run_analysis_script():
    """Helper to run the analysis script and return JSON results"""
    # Path to script and output file
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    
    # No longer looking for aws_audit_results.json - the script outputs to stdout
    env = {**os.environ}
    result = subprocess.run([sys.executable, script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
    
    # Parse JSON from stdout - look for the "Full Report:" section
    stdout_lines = result.stdout.split('\n')
    json_start_idx = None
    for i, line in enumerate(stdout_lines):
        if 'Full Report:' in line:
            json_start_idx = i + 1
            break
    
    if json_start_idx is not None:
        json_text = '\n'.join(stdout_lines[json_start_idx:])
        # Find the first '{' and last '}'
        start = json_text.find('{')
        end = json_text.rfind('}')
        if start != -1 and end != -1:
            return json.loads(json_text[start:end+1])
    
    # Fallback - print error
    print(f"STDOUT: {result.stdout}")
    print(f"STDERR: {result.stderr}")
    return {}


def test_infrastructure_analysis_report():
    """Test infrastructure analysis report structure and content"""
    # Setup infrastructure resources first
    setup_infrastructure_analyzer_resources()
    
    results = run_analysis_script()
    
    # Check that all required sections exist
    assert "metadata" in results, "metadata key missing from JSON"
    assert "drift_analysis" in results, "drift_analysis key missing from JSON"
    assert "compliance" in results, "compliance key missing from JSON"
    
    # Validate metadata structure
    metadata = results["metadata"]
    assert "run_id" in metadata, "run_id key missing from metadata"
    assert "timestamp" in metadata, "timestamp key missing from metadata"
    assert "region" in metadata, "region key missing from metadata"
    
    # Validate drift analysis structure
    drift = results["drift_analysis"]
    assert "summary" in drift, "summary key missing from drift_analysis"
    assert "total_resources" in drift["summary"], "total_resources missing"
    assert "drift_percentage" in drift["summary"], "drift_percentage missing"
    
    # Validate compliance structure
    compliance = results["compliance"]
    assert "summary" in compliance, "summary key missing from compliance"
    assert "compliance_percentage" in compliance["summary"], "compliance_percentage missing"
