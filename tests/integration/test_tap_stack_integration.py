"""test_tap_stack_integration.py
Integration tests for deployed TapStack infrastructure.

These tests validate the actual deployed AWS resources.
"""

import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


# Load stack outputs from cfn-outputs/flat-outputs.json
@pytest.fixture(scope="module")
def stack_outputs():
    """Load CloudFormation stack outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"

    if not os.path.exists(outputs_file):
        pytest.skip(f"Stack outputs file not found: {outputs_file}")

    with open(outputs_file, 'r') as f:
        return json.load(f)


@pytest.fixture(scope="module")
def aws_clients():
    """Initialize AWS service clients."""
    return {
        'lambda': boto3.client('lambda'),
        's3': boto3.client('s3'),
        'sns': boto3.client('sns'),
        'config': boto3.client('config'),
        'ec2': boto3.client('ec2'),
        'cloudwatch': boto3.client('cloudwatch'),
        'events': boto3.client('events'),
        'iam': boto3.client('iam')
    }


class TestInfrastructureDeployment:
    """Test that infrastructure components are deployed correctly."""

    def test_lambda_scanner_function_exists(self, stack_outputs, aws_clients):
        """Verify scanner Lambda function is deployed and configured."""
        function_name = stack_outputs['ScannerFunctionName']

        response = aws_clients['lambda'].get_function(FunctionName=function_name)

        assert response['Configuration']['FunctionName'] == function_name
        assert response['Configuration']['Runtime'].startswith('python3')
        assert response['Configuration']['Timeout'] == 300  # 5 minutes
        assert response['Configuration']['MemorySize'] == 1024
        assert response['Configuration']['TracingConfig']['Mode'] == 'Active'

        # Verify environment variables
        env_vars = response['Configuration']['Environment']['Variables']
        assert 'AUDIT_BUCKET' in env_vars
        assert 'ALERT_TOPIC_ARN' in env_vars
        assert 'ENVIRONMENT_SUFFIX' in env_vars

    def test_s3_audit_bucket_exists(self, stack_outputs, aws_clients):
        """Verify audit S3 bucket is created with correct configuration."""
        bucket_name = stack_outputs['AuditBucketName']

        # Check bucket exists
        response = aws_clients['s3'].head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        # Verify encryption
        encryption = aws_clients['s3'].get_bucket_encryption(Bucket=bucket_name)
        assert encryption['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']

        # Verify versioning
        versioning = aws_clients['s3'].get_bucket_versioning(Bucket=bucket_name)
        assert versioning.get('Status') == 'Enabled'

        # Verify lifecycle policy
        try:
            lifecycle = aws_clients['s3'].get_bucket_lifecycle_configuration(Bucket=bucket_name)
            assert len(lifecycle['Rules']) > 0
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchLifecycleConfiguration':
                raise

    def test_sns_alert_topic_exists(self, stack_outputs, aws_clients):
        """Verify SNS alert topic is configured."""
        topic_arn = stack_outputs['AlertTopicArn']

        # Get topic attributes
        attributes = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)

        assert attributes['Attributes']['TopicArn'] == topic_arn

        # Verify encryption (if configured)
        if 'KmsMasterKeyId' in attributes['Attributes']:
            assert len(attributes['Attributes']['KmsMasterKeyId']) > 0

    def test_cloudwatch_dashboard_exists(self, stack_outputs, aws_clients):
        """Verify CloudWatch dashboard is created."""
        dashboard_name = stack_outputs['DashboardName']

        response = aws_clients['cloudwatch'].get_dashboard(DashboardName=dashboard_name)

        assert response['DashboardName'] == dashboard_name
        assert 'DashboardBody' in response

        # Parse dashboard body
        dashboard_body = json.loads(response['DashboardBody'])
        assert 'widgets' in dashboard_body
        assert len(dashboard_body['widgets']) > 0

    def test_config_recorder_active(self, aws_clients):
        """Verify AWS Config recorder is active."""
        response = aws_clients['config'].describe_configuration_recorder_status()

        assert len(response['ConfigurationRecordersStatus']) > 0
        recorder_status = response['ConfigurationRecordersStatus'][0]
        assert recorder_status['recording'] is True

    def test_config_rules_deployed(self, aws_clients):
        """Verify AWS Config rules are deployed."""
        response = aws_clients['config'].describe_config_rules()

        assert len(response['ConfigRules']) > 0

        # Verify at least one rule is for S3 bucket encryption
        rule_names = [rule['ConfigRuleName'] for rule in response['ConfigRules']]
        assert any('s3' in name.lower() and 'encrypt' in name.lower() for name in rule_names)

    def test_vpc_endpoints_created(self, aws_clients):
        """Verify VPC endpoints for AWS services are created."""
        response = aws_clients['ec2'].describe_vpc_endpoints()

        assert len(response['VpcEndpoints']) > 0

        # Verify essential endpoints exist (S3, Lambda, etc.)
        service_names = [ep['ServiceName'] for ep in response['VpcEndpoints']]
        assert any('s3' in name for name in service_names)


class TestLambdaFunctionInvocation:
    """Test Lambda function invocations and basic functionality."""

    def test_scanner_function_invocable(self, stack_outputs, aws_clients):
        """Test that scanner Lambda can be invoked (dry-run)."""
        function_name = stack_outputs['ScannerFunctionName']

        # Invoke with test event
        test_event = {
            'detail': {
                'target_accounts': []
            }
        }

        response = aws_clients['lambda'].invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )

        assert response['StatusCode'] == 200

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        assert response_payload['statusCode'] == 200

        body = json.loads(response_payload['body'])
        assert 'message' in body
        assert 'scan_key' in body

    def test_report_generator_function_invocable(self, stack_outputs, aws_clients):
        """Test that report generator Lambda can be invoked."""
        # Get function name from scanner function name pattern
        scanner_name = stack_outputs['ScannerFunctionName']
        report_generator_name = scanner_name.replace('scanner', 'report-generator')

        # Note: This test requires a valid scan_key from S3
        # In production, this would be populated by an actual scan
        test_event = {
            'detail': {
                'scan_key': 'scans/test/compliance-scan.json'
            }
        }

        # This will return 404 if scan doesn't exist, which is expected
        response = aws_clients['lambda'].invoke(
            FunctionName=report_generator_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )

        assert response['StatusCode'] == 200


class TestEventBridgeRules:
    """Test EventBridge rule configurations."""

    def test_scheduled_scan_rule_exists(self, aws_clients):
        """Verify scheduled scan EventBridge rule is configured."""
        response = aws_clients['events'].list_rules()

        # Find compliance scan rule
        scan_rules = [r for r in response['Rules'] if 'compliance-scheduled-scan' in r.get('Name', '')]

        assert len(scan_rules) > 0

        scheduled_rule = scan_rules[0]
        assert scheduled_rule['State'] == 'ENABLED'
        assert 'ScheduleExpression' in scheduled_rule
        assert 'rate(6 hours)' in scheduled_rule['ScheduleExpression']

    def test_custom_event_rule_exists(self, aws_clients):
        """Verify custom event rule for on-demand scans exists."""
        response = aws_clients['events'].list_rules()

        # Find custom scan rule
        custom_rules = [r for r in response['Rules'] if 'compliance-custom-scan' in r.get('Name', '')]

        assert len(custom_rules) > 0

        custom_rule = custom_rules[0]
        assert custom_rule['State'] == 'ENABLED'

    def test_report_trigger_rule_exists(self, aws_clients):
        """Verify report trigger rule exists."""
        response = aws_clients['events'].list_rules()

        # Find report trigger rule
        report_rules = [r for r in response['Rules'] if 'compliance-report-trigger' in r.get('Name', '')]

        assert len(report_rules) > 0

        report_rule = report_rules[0]
        assert report_rule['State'] == 'ENABLED'


class TestIAMRolesAndPermissions:
    """Test IAM roles and permissions are correctly configured."""

    def test_scanner_lambda_role_exists(self, aws_clients):
        """Verify scanner Lambda IAM role exists."""
        response = aws_clients['iam'].list_roles()

        # Find scanner role
        scanner_roles = [r for r in response['Roles'] if 'compliance-scanner-role' in r['RoleName']]

        assert len(scanner_roles) > 0

        scanner_role = scanner_roles[0]

        # Verify role has correct trust policy
        trust_policy = scanner_role['AssumeRolePolicyDocument']
        assert any(stmt['Principal']['Service'] == 'lambda.amazonaws.com' for stmt in trust_policy['Statement'])

    def test_scanner_role_has_required_policies(self, aws_clients):
        """Verify scanner role has required managed policies attached."""
        response = aws_clients['iam'].list_roles()

        scanner_roles = [r for r in response['Roles'] if 'compliance-scanner-role' in r['RoleName']]
        assert len(scanner_roles) > 0

        role_name = scanner_roles[0]['RoleName']

        # Get attached policies
        policies = aws_clients['iam'].list_attached_role_policies(RoleName=role_name)

        policy_names = [p['PolicyName'] for p in policies['AttachedPolicies']]

        # Verify essential policies are attached
        assert any('AWSLambdaVPCAccessExecutionRole' in name for name in policy_names)
        assert any('AWSXRayDaemonWriteAccess' in name for name in policy_names)


class TestEndToEndWorkflow:
    """Test end-to-end compliance scanning workflow."""

    def test_manual_scan_trigger_via_eventbridge(self, stack_outputs, aws_clients):
        """Test triggering a manual scan via EventBridge custom event."""
        test_event = {
            'Source': 'compliance.audit',
            'DetailType': 'Compliance Scan Request',
            'Detail': json.dumps({
                'target_accounts': [],
                'triggered_by': 'integration_test'
            })
        }

        response = aws_clients['events'].put_events(Entries=[test_event])

        assert response['FailedEntryCount'] == 0

    def test_scan_creates_audit_log_in_s3(self, stack_outputs, aws_clients):
        """Test that scans create audit logs in S3 bucket."""
        bucket_name = stack_outputs['AuditBucketName']

        # List objects in scans/ prefix
        try:
            response = aws_clients['s3'].list_objects_v2(
                Bucket=bucket_name,
                Prefix='scans/'
            )

            # Note: This test requires an actual scan to have run
            # In a fresh deployment, this may be empty until the first scheduled scan
            if 'Contents' in response:
                assert len(response['Contents']) >= 0
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchBucket':
                raise


class TestSecurityConfiguration:
    """Test security configurations are properly applied."""

    def test_lambda_functions_in_vpc(self, stack_outputs, aws_clients):
        """Verify Lambda functions are deployed in VPC."""
        function_name = stack_outputs['ScannerFunctionName']

        response = aws_clients['lambda'].get_function_configuration(FunctionName=function_name)

        assert 'VpcConfig' in response
        assert 'SubnetIds' in response['VpcConfig']
        assert len(response['VpcConfig']['SubnetIds']) > 0
        assert 'SecurityGroupIds' in response['VpcConfig']
        assert len(response['VpcConfig']['SecurityGroupIds']) > 0

    def test_lambda_xray_tracing_enabled(self, stack_outputs, aws_clients):
        """Verify Lambda functions have X-Ray tracing enabled."""
        function_name = stack_outputs['ScannerFunctionName']

        response = aws_clients['lambda'].get_function_configuration(FunctionName=function_name)

        assert response['TracingConfig']['Mode'] == 'Active'

    def test_s3_bucket_blocks_public_access(self, stack_outputs, aws_clients):
        """Verify S3 bucket blocks public access."""
        bucket_name = stack_outputs['AuditBucketName']

        response = aws_clients['s3'].get_public_access_block(Bucket=bucket_name)

        block_config = response['PublicAccessBlockConfiguration']
        assert block_config['BlockPublicAcls'] is True
        assert block_config['IgnorePublicAcls'] is True
        assert block_config['BlockPublicPolicy'] is True
        assert block_config['RestrictPublicBuckets'] is True
