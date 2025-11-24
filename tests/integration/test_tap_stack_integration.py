"""test_tap_stack_integration.py
Integration tests for deployed TapStack infrastructure.

These tests validate the actual deployed AWS resources using live AWS SDK calls.
"""

import json
import os
import boto3
from pathlib import Path

# Load outputs from flat-outputs.json
outputs_path = Path(os.getcwd()) / 'cfn-outputs' / 'flat-outputs.json'
with open(outputs_path, 'r') as f:
    outputs = json.load(f)

# Get environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
aws_region = os.environ.get('AWS_REGION', 'us-east-1')

print(f"Testing with region={aws_region}, suffix={environment_suffix}")
print(f"Loaded outputs: {json.dumps(outputs, indent=2)}")

# Initialize AWS clients
lambda_client = boto3.client('lambda', region_name=aws_region)
s3_client = boto3.client('s3', region_name=aws_region)
sns_client = boto3.client('sns', region_name=aws_region)
ec2_client = boto3.client('ec2', region_name=aws_region)
cloudwatch_client = boto3.client('cloudwatch', region_name=aws_region)
events_client = boto3.client('events', region_name=aws_region)
iam_client = boto3.client('iam', region_name=aws_region)

# Get resource identifiers from outputs
scanner_function_name = outputs['ScannerFunctionName']
scanner_function_arn = outputs['ScannerFunctionArn']
report_generator_function_name = outputs['ReportGeneratorFunctionName']
remediation_function_name = outputs['RemediationFunctionName']
audit_bucket_name = outputs['AuditBucketName']
config_bucket_name = outputs['ConfigBucketName']
alert_topic_arn = outputs['AlertTopicArn']
vpc_id = outputs['VpcId']
dashboard_name = outputs['DashboardName']


class TestInfrastructureDeployment:
    """Test that infrastructure components are deployed correctly."""

    def test_lambda_scanner_function_exists(self):
        """Verify scanner Lambda function is deployed and configured."""
        response = lambda_client.get_function(FunctionName=scanner_function_name)

        assert response['Configuration']['FunctionName'] == scanner_function_name
        assert response['Configuration']['Runtime'].startswith('python3')
        assert response['Configuration']['Timeout'] == 300
        assert response['Configuration']['MemorySize'] == 1024
        assert response['Configuration']['TracingConfig']['Mode'] == 'Active'

        # Verify environment variables
        env_vars = response['Configuration']['Environment']['Variables']
        assert 'AUDIT_BUCKET' in env_vars
        assert env_vars['AUDIT_BUCKET'] == audit_bucket_name
        assert 'ALERT_TOPIC_ARN' in env_vars
        assert env_vars['ALERT_TOPIC_ARN'] == alert_topic_arn
        assert 'ENVIRONMENT_SUFFIX' in env_vars
        assert env_vars['ENVIRONMENT_SUFFIX'] == environment_suffix

    def test_s3_audit_bucket_exists(self):
        """Verify audit S3 bucket is created with correct configuration."""
        # Check bucket exists
        response = s3_client.head_bucket(Bucket=audit_bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        # Verify encryption
        encryption = s3_client.get_bucket_encryption(Bucket=audit_bucket_name)
        sse_algorithm = encryption['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
        assert sse_algorithm in ['AES256', 'aws:kms']

        # Verify versioning
        versioning = s3_client.get_bucket_versioning(Bucket=audit_bucket_name)
        assert versioning.get('Status') == 'Enabled'

        # Verify public access block
        public_access_block = s3_client.get_public_access_block(Bucket=audit_bucket_name)
        block_config = public_access_block['PublicAccessBlockConfiguration']
        assert block_config['BlockPublicAcls'] is True
        assert block_config['IgnorePublicAcls'] is True
        assert block_config['BlockPublicPolicy'] is True
        assert block_config['RestrictPublicBuckets'] is True

    def test_s3_config_bucket_exists(self):
        """Verify config S3 bucket is created with correct configuration."""
        # Check bucket exists
        response = s3_client.head_bucket(Bucket=config_bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        # Verify encryption
        encryption = s3_client.get_bucket_encryption(Bucket=config_bucket_name)
        sse_algorithm = encryption['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
        assert sse_algorithm in ['AES256', 'aws:kms']

        # Verify versioning
        versioning = s3_client.get_bucket_versioning(Bucket=config_bucket_name)
        assert versioning.get('Status') == 'Enabled'

    def test_sns_alert_topic_exists(self):
        """Verify SNS alert topic is configured."""
        # Get topic attributes
        attributes = sns_client.get_topic_attributes(TopicArn=alert_topic_arn)

        assert attributes['Attributes']['TopicArn'] == alert_topic_arn
        assert 'DisplayName' in attributes['Attributes']

    def test_cloudwatch_dashboard_exists(self):
        """Verify CloudWatch dashboard is created."""
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)

        assert response['DashboardName'] == dashboard_name
        assert 'DashboardBody' in response

        # Parse dashboard body
        dashboard_body = json.loads(response['DashboardBody'])
        assert 'widgets' in dashboard_body
        assert len(dashboard_body['widgets']) > 0

    def test_vpc_exists(self):
        """Verify VPC is created."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['VpcId'] == vpc_id
        assert response['Vpcs'][0]['CidrBlock'] == '10.0.0.0/16'
        assert response['Vpcs'][0]['State'] == 'available'

    def test_vpc_flow_logs_enabled(self):
        """Verify VPC has flow logs enabled."""
        response = ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        assert len(response['FlowLogs']) > 0
        flow_log = response['FlowLogs'][0]
        assert flow_log['ResourceId'] == vpc_id
        assert flow_log['TrafficType'] == 'ALL'
        assert flow_log['FlowLogStatus'] == 'ACTIVE'

    def test_vpc_endpoints_created(self):
        """Verify VPC endpoints for AWS services are created."""
        response = ec2_client.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        assert len(response['VpcEndpoints']) > 0

        # Verify essential endpoints exist
        service_names = [ep['ServiceName'] for ep in response['VpcEndpoints']]
        assert any('s3' in name for name in service_names)

    def test_report_generator_function_exists(self):
        """Test that report generator Lambda exists."""
        response = lambda_client.get_function(FunctionName=report_generator_function_name)

        assert response['Configuration']['FunctionName'] == report_generator_function_name
        assert response['Configuration']['Runtime'].startswith('python3')
        assert response['Configuration']['TracingConfig']['Mode'] == 'Active'

        # Verify environment variables
        env_vars = response['Configuration']['Environment']['Variables']
        assert 'AUDIT_BUCKET' in env_vars
        assert env_vars['AUDIT_BUCKET'] == audit_bucket_name

    def test_remediation_function_exists(self):
        """Test that remediation Lambda exists."""
        response = lambda_client.get_function(FunctionName=remediation_function_name)

        assert response['Configuration']['FunctionName'] == remediation_function_name
        assert response['Configuration']['Runtime'].startswith('python3')
        assert response['Configuration']['TracingConfig']['Mode'] == 'Active'

        # Verify environment variables
        env_vars = response['Configuration']['Environment']['Variables']
        assert 'ALERT_TOPIC_ARN' in env_vars
        assert env_vars['ALERT_TOPIC_ARN'] == alert_topic_arn
        assert 'ENVIRONMENT_SUFFIX' in env_vars


class TestEventBridgeRules:
    """Test EventBridge rule configurations."""

    def test_scheduled_scan_rule_exists(self):
        """Verify scheduled scan EventBridge rule is configured."""
        response = events_client.list_rules(
            NamePrefix=f'compliance-scheduled-scan-{environment_suffix}'
        )

        scan_rules = response['Rules']
        assert len(scan_rules) > 0

        scheduled_rule = scan_rules[0]
        assert scheduled_rule['State'] == 'ENABLED'
        assert 'ScheduleExpression' in scheduled_rule
        assert 'rate(6 hours)' in scheduled_rule['ScheduleExpression']

        # Verify rule targets
        targets = events_client.list_targets_by_rule(Rule=scheduled_rule['Name'])
        assert len(targets['Targets']) > 0
        assert targets['Targets'][0]['Arn'] == scanner_function_arn

    def test_custom_event_rule_exists(self):
        """Verify custom event rule for on-demand scans exists."""
        response = events_client.list_rules(
            NamePrefix=f'compliance-custom-scan-{environment_suffix}'
        )

        custom_rules = response['Rules']
        assert len(custom_rules) > 0

        custom_rule = custom_rules[0]
        assert custom_rule['State'] == 'ENABLED'

        # Verify rule targets
        targets = events_client.list_targets_by_rule(Rule=custom_rule['Name'])
        assert len(targets['Targets']) > 0

    def test_report_trigger_rule_exists(self):
        """Verify report trigger rule exists."""
        response = events_client.list_rules(
            NamePrefix=f'compliance-report-trigger-{environment_suffix}'
        )

        report_rules = response['Rules']
        assert len(report_rules) > 0

        report_rule = report_rules[0]
        assert report_rule['State'] == 'ENABLED'

        # Verify rule targets
        targets = events_client.list_targets_by_rule(Rule=report_rule['Name'])
        assert len(targets['Targets']) > 0


class TestIAMRolesAndPermissions:
    """Test IAM roles and permissions are correctly configured."""

    def test_scanner_lambda_role_exists(self):
        """Verify scanner Lambda IAM role exists."""
        # Get role from Lambda function
        function_config = lambda_client.get_function_configuration(FunctionName=scanner_function_name)
        role_arn = function_config['Role']
        role_name = role_arn.split('/')[-1]

        # Get role details
        response = iam_client.get_role(RoleName=role_name)

        assert response['Role']['RoleName'] == role_name
        assert 'compliance-scanner-role' in role_name.lower()

        # Verify role has correct trust policy
        trust_policy = response['Role']['AssumeRolePolicyDocument']
        assert any(
            stmt['Principal'].get('Service') == 'lambda.amazonaws.com'
            for stmt in trust_policy['Statement']
        )

    def test_scanner_role_has_required_policies(self):
        """Verify scanner role has required managed policies attached."""
        # Get role from Lambda function
        function_config = lambda_client.get_function_configuration(FunctionName=scanner_function_name)
        role_arn = function_config['Role']
        role_name = role_arn.split('/')[-1]

        # Get attached policies
        policies = iam_client.list_attached_role_policies(RoleName=role_name)
        policy_names = [p['PolicyName'] for p in policies['AttachedPolicies']]

        # Verify essential policies are attached
        assert any('AWSLambdaVPCAccessExecutionRole' in name for name in policy_names)
        assert any('AWSXRayDaemonWriteAccess' in name for name in policy_names)


class TestSecurityConfiguration:
    """Test security configurations are properly applied."""

    def test_lambda_functions_in_vpc(self):
        """Verify Lambda functions are deployed in VPC."""
        response = lambda_client.get_function_configuration(FunctionName=scanner_function_name)

        assert 'VpcConfig' in response
        assert 'SubnetIds' in response['VpcConfig']
        assert len(response['VpcConfig']['SubnetIds']) > 0
        assert 'SecurityGroupIds' in response['VpcConfig']
        assert len(response['VpcConfig']['SecurityGroupIds']) > 0
        assert response['VpcConfig']['VpcId'] == vpc_id

    def test_lambda_xray_tracing_enabled(self):
        """Verify Lambda functions have X-Ray tracing enabled."""
        # Test scanner function
        scanner_config = lambda_client.get_function_configuration(FunctionName=scanner_function_name)
        assert scanner_config['TracingConfig']['Mode'] == 'Active'

        # Test report generator function
        report_config = lambda_client.get_function_configuration(FunctionName=report_generator_function_name)
        assert report_config['TracingConfig']['Mode'] == 'Active'

        # Test remediation function
        remediation_config = lambda_client.get_function_configuration(FunctionName=remediation_function_name)
        assert remediation_config['TracingConfig']['Mode'] == 'Active'


class TestResourceTagging:
    """Test that resources have mandatory tags."""

    def test_lambda_functions_have_mandatory_tags(self):
        """Verify Lambda functions have required tags."""
        response = lambda_client.list_tags(Resource=scanner_function_arn)

        tags = response['Tags']

        # Verify mandatory tags exist
        required_tags = ['Environment', 'Owner', 'CostCenter', 'ComplianceLevel']
        for tag in required_tags:
            assert tag in tags, f"Missing required tag: {tag}"

    def test_s3_buckets_have_mandatory_tags(self):
        """Verify S3 buckets have required tags."""
        response = s3_client.get_bucket_tagging(Bucket=audit_bucket_name)

        tags = {tag['Key']: tag['Value'] for tag in response['TagSet']}

        # Verify mandatory tags exist
        required_tags = ['Environment', 'Owner', 'CostCenter', 'ComplianceLevel']
        for tag in required_tags:
            assert tag in tags, f"Missing required tag: {tag}"


class TestEndToEndWorkflow:
    """Test end-to-end compliance scanning workflow."""

    def test_manual_scan_trigger_via_eventbridge(self):
        """Test triggering a manual scan via EventBridge custom event."""
        test_event = {
            'Source': 'compliance.audit',
            'DetailType': 'Compliance Scan Request',
            'Detail': json.dumps({
                'target_accounts': [],
                'triggered_by': 'integration_test'
            })
        }

        response = events_client.put_events(Entries=[test_event])

        assert response['FailedEntryCount'] == 0
        assert len(response['Entries']) == 1
        assert 'EventId' in response['Entries'][0]
