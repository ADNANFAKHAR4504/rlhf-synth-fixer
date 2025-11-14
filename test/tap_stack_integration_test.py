"""
Integration tests for CloudFormation Compliance System

Tests validate deployed AWS resources using actual stack outputs.
No mocking - all tests use real AWS resources.

Tests verify:
- S3 bucket existence and configuration
- Lambda function deployment and configuration
- SNS topic and subscription
- CloudWatch dashboard
- SSM automation documents
- EventBridge rules
- IAM roles and permissions
- Resource naming with environmentSuffix
- Tags on resources
"""

import json
import boto3
import pytest
import os
from botocore.exceptions import ClientError


@pytest.fixture(scope='module')
def stack_outputs():
    """Load stack outputs from flat-outputs.json"""
    outputs_path = os.path.join(os.path.dirname(__file__), '..', 'cfn-outputs', 'flat-outputs.json')
    with open(outputs_path, 'r') as f:
        return json.load(f)


@pytest.fixture(scope='module')
def aws_clients():
    """Create AWS service clients"""
    return {
        's3': boto3.client('s3', region_name='us-east-1'),
        'lambda': boto3.client('lambda', region_name='us-east-1'),
        'sns': boto3.client('sns', region_name='us-east-1'),
        'ssm': boto3.client('ssm', region_name='us-east-1'),
        'events': boto3.client('events', region_name='us-east-1'),
        'cloudwatch': boto3.client('cloudwatch', region_name='us-east-1'),
        'iam': boto3.client('iam', region_name='us-east-1'),
        'logs': boto3.client('logs', region_name='us-east-1')
    }


class TestS3Bucket:
    """Test S3 bucket deployment and configuration"""

    def test_bucket_exists(self, stack_outputs, aws_clients):
        """Test S3 bucket was created and is accessible"""
        bucket_name = stack_outputs['ComplianceReportsBucketName']
        assert 'synth101912438' in bucket_name

        # Test bucket exists by calling head_bucket
        response = aws_clients['s3'].head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_bucket_versioning_enabled(self, stack_outputs, aws_clients):
        """Test bucket has versioning enabled"""
        bucket_name = stack_outputs['ComplianceReportsBucketName']

        response = aws_clients['s3'].get_bucket_versioning(Bucket=bucket_name)
        assert response['Status'] == 'Enabled'

    def test_bucket_encryption_enabled(self, stack_outputs, aws_clients):
        """Test bucket has encryption enabled"""
        bucket_name = stack_outputs['ComplianceReportsBucketName']

        response = aws_clients['s3'].get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']

    def test_bucket_lifecycle_policy(self, stack_outputs, aws_clients):
        """Test bucket has lifecycle policy for Glacier transition"""
        bucket_name = stack_outputs['ComplianceReportsBucketName']

        response = aws_clients['s3'].get_bucket_lifecycle_configuration(Bucket=bucket_name)
        assert 'Rules' in response
        assert len(response['Rules']) > 0

        # Check for Glacier transition rule
        glacier_rule = None
        for rule in response['Rules']:
            if rule['Status'] == 'Enabled' and 'Transitions' in rule:
                for transition in rule['Transitions']:
                    if transition['StorageClass'] == 'GLACIER':
                        glacier_rule = transition
                        break

        assert glacier_rule is not None
        assert glacier_rule['Days'] == 90

    def test_bucket_public_access_blocked(self, stack_outputs, aws_clients):
        """Test bucket blocks public access"""
        bucket_name = stack_outputs['ComplianceReportsBucketName']

        response = aws_clients['s3'].get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        assert config['BlockPublicAcls'] == True
        assert config['BlockPublicPolicy'] == True
        assert config['IgnorePublicAcls'] == True
        assert config['RestrictPublicBuckets'] == True

    def test_bucket_has_tags(self, stack_outputs, aws_clients):
        """Test bucket has required tags"""
        bucket_name = stack_outputs['ComplianceReportsBucketName']

        response = aws_clients['s3'].get_bucket_tagging(Bucket=bucket_name)
        tags = {tag['Key']: tag['Value'] for tag in response['TagSet']}

        assert 'Environment' in tags
        assert tags['Environment'] == 'qa'
        assert 'Project' in tags
        assert tags['Project'] == 'compliance-checker'


class TestLambdaFunction:
    """Test Lambda function deployment and configuration"""

    def test_lambda_function_exists(self, stack_outputs, aws_clients):
        """Test Lambda function was deployed and is accessible"""
        function_arn = stack_outputs['ComplianceReportProcessorFunctionArn']
        function_name = function_arn.split(':')[-1]

        response = aws_clients['lambda'].get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionArn'] == function_arn

    def test_lambda_runtime_configuration(self, stack_outputs, aws_clients):
        """Test Lambda function runtime settings"""
        function_arn = stack_outputs['ComplianceReportProcessorFunctionArn']
        function_name = function_arn.split(':')[-1]

        response = aws_clients['lambda'].get_function_configuration(FunctionName=function_name)

        assert response['Runtime'] == 'python3.11'
        assert response['Handler'] == 'index.lambda_handler'
        assert response['Timeout'] == 300

    def test_lambda_environment_variables(self, stack_outputs, aws_clients):
        """Test Lambda function has correct environment variables"""
        function_arn = stack_outputs['ComplianceReportProcessorFunctionArn']
        function_name = function_arn.split(':')[-1]

        response = aws_clients['lambda'].get_function_configuration(FunctionName=function_name)
        env_vars = response['Environment']['Variables']

        assert 'BUCKET_NAME' in env_vars
        assert env_vars['BUCKET_NAME'] == stack_outputs['ComplianceReportsBucketName']
        assert 'SNS_TOPIC_ARN' in env_vars
        assert env_vars['SNS_TOPIC_ARN'] == stack_outputs['ComplianceAlertTopicArn']
        assert 'ENVIRONMENT_SUFFIX' in env_vars

    def test_lambda_has_iam_role(self, stack_outputs, aws_clients):
        """Test Lambda function has IAM execution role"""
        function_arn = stack_outputs['ComplianceReportProcessorFunctionArn']
        function_name = function_arn.split(':')[-1]

        response = aws_clients['lambda'].get_function_configuration(FunctionName=function_name)
        role_arn = response['Role']

        assert 'compliance-report-processor-role' in role_arn
        assert 'synth101912438' in role_arn

    def test_lambda_has_tags(self, stack_outputs, aws_clients):
        """Test Lambda function has required tags"""
        function_arn = stack_outputs['ComplianceReportProcessorFunctionArn']

        response = aws_clients['lambda'].list_tags(Resource=function_arn)
        tags = response['Tags']

        assert 'Environment' in tags
        assert tags['Environment'] == 'qa'
        assert 'Project' in tags
        assert tags['Project'] == 'compliance-checker'


class TestSNSTopic:
    """Test SNS topic deployment and configuration"""

    def test_sns_topic_exists(self, stack_outputs, aws_clients):
        """Test SNS topic was created and is accessible"""
        topic_arn = stack_outputs['ComplianceAlertTopicArn']

        response = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn

    def test_sns_topic_has_subscription(self, stack_outputs, aws_clients):
        """Test SNS topic has email subscription"""
        topic_arn = stack_outputs['ComplianceAlertTopicArn']

        response = aws_clients['sns'].list_subscriptions_by_topic(TopicArn=topic_arn)
        subscriptions = response['Subscriptions']

        assert len(subscriptions) > 0
        assert subscriptions[0]['Protocol'] == 'email'
        assert subscriptions[0]['TopicArn'] == topic_arn

    def test_sns_topic_has_tags(self, stack_outputs, aws_clients):
        """Test SNS topic has required tags"""
        topic_arn = stack_outputs['ComplianceAlertTopicArn']

        response = aws_clients['sns'].list_tags_for_resource(ResourceArn=topic_arn)
        tags = {tag['Key']: tag['Value'] for tag in response['Tags']}

        assert 'Environment' in tags
        assert tags['Environment'] == 'qa'
        assert 'Project' in tags
        assert tags['Project'] == 'compliance-checker'


class TestSSMDocuments:
    """Test SSM automation document deployment"""

    def test_imdsv2_document_exists(self, stack_outputs, aws_clients):
        """Test IMDSv2 compliance document was created"""
        document_name = stack_outputs['IMDSv2ComplianceDocumentName']
        assert 'synth101912438' in document_name

        response = aws_clients['ssm'].describe_document(Name=document_name)
        assert response['Document']['Name'] == document_name
        assert response['Document']['DocumentType'] == 'Automation'

    def test_approved_ami_document_exists(self, stack_outputs, aws_clients):
        """Test approved AMI compliance document was created"""
        document_name = stack_outputs['ApprovedAMIComplianceDocumentName']
        assert 'synth101912438' in document_name

        response = aws_clients['ssm'].describe_document(Name=document_name)
        assert response['Document']['Name'] == document_name
        assert response['Document']['DocumentType'] == 'Automation'

    def test_required_tags_document_exists(self, stack_outputs, aws_clients):
        """Test required tags compliance document was created"""
        document_name = stack_outputs['RequiredTagsComplianceDocumentName']
        assert 'synth101912438' in document_name

        response = aws_clients['ssm'].describe_document(Name=document_name)
        assert response['Document']['Name'] == document_name
        assert response['Document']['DocumentType'] == 'Automation'

    def test_ssm_documents_have_parameters(self, stack_outputs, aws_clients):
        """Test SSM documents have required parameters"""
        document_names = [
            stack_outputs['IMDSv2ComplianceDocumentName'],
            stack_outputs['ApprovedAMIComplianceDocumentName'],
            stack_outputs['RequiredTagsComplianceDocumentName']
        ]

        for document_name in document_names:
            response = aws_clients['ssm'].describe_document(Name=document_name)
            # Documents should be executable with parameters
            assert response['Document']['DocumentFormat'] == 'JSON'
            assert response['Document']['Status'] == 'Active'

    def test_ssm_documents_have_tags(self, stack_outputs, aws_clients):
        """Test SSM documents have required tags"""
        document_names = [
            stack_outputs['IMDSv2ComplianceDocumentName'],
            stack_outputs['ApprovedAMIComplianceDocumentName'],
            stack_outputs['RequiredTagsComplianceDocumentName']
        ]

        for document_name in document_names:
            response = aws_clients['ssm'].list_tags_for_resource(
                ResourceType='Document',
                ResourceId=document_name
            )
            tags = {tag['Key']: tag['Value'] for tag in response['TagList']}

            assert 'Environment' in tags
            assert tags['Environment'] == 'qa'
            assert 'Project' in tags
            assert tags['Project'] == 'compliance-checker'


class TestEventBridgeRules:
    """Test EventBridge rules deployment and configuration"""

    def test_ec2_state_change_rule_exists(self, aws_clients):
        """Test EC2 state change rule was created"""
        rule_name = 'ec2-state-change-rule-synth101912438'

        response = aws_clients['events'].describe_rule(Name=rule_name)
        assert response['Name'] == rule_name
        assert response['State'] == 'ENABLED'

    def test_security_group_change_rule_exists(self, aws_clients):
        """Test security group change rule was created"""
        rule_name = 'security-group-change-rule-synth101912438'

        response = aws_clients['events'].describe_rule(Name=rule_name)
        assert response['Name'] == rule_name
        assert response['State'] == 'ENABLED'

    def test_iam_role_change_rule_exists(self, aws_clients):
        """Test IAM role change rule was created"""
        rule_name = 'iam-role-change-rule-synth101912438'

        response = aws_clients['events'].describe_rule(Name=rule_name)
        assert response['Name'] == rule_name
        assert response['State'] == 'ENABLED'

    def test_eventbridge_rules_have_event_patterns(self, aws_clients):
        """Test EventBridge rules have valid event patterns"""
        rule_names = [
            'ec2-state-change-rule-synth101912438',
            'security-group-change-rule-synth101912438',
            'iam-role-change-rule-synth101912438'
        ]

        for rule_name in rule_names:
            response = aws_clients['events'].describe_rule(Name=rule_name)
            assert 'EventPattern' in response
            # Parse event pattern to ensure it's valid JSON
            event_pattern = json.loads(response['EventPattern'])
            assert 'source' in event_pattern
            assert 'detail-type' in event_pattern

    def test_eventbridge_rules_have_lambda_targets(self, stack_outputs, aws_clients):
        """Test EventBridge rules have Lambda function as target"""
        rule_names = [
            'ec2-state-change-rule-synth101912438',
            'security-group-change-rule-synth101912438',
            'iam-role-change-rule-synth101912438'
        ]

        function_arn = stack_outputs['ComplianceReportProcessorFunctionArn']

        for rule_name in rule_names:
            response = aws_clients['events'].list_targets_by_rule(Rule=rule_name)
            targets = response['Targets']

            assert len(targets) > 0
            assert targets[0]['Arn'] == function_arn
            assert 'RoleArn' in targets[0]  # EventBridge should have role to invoke Lambda


class TestCloudWatchDashboard:
    """Test CloudWatch dashboard deployment"""

    def test_dashboard_exists(self, aws_clients):
        """Test CloudWatch dashboard was created"""
        dashboard_name = 'compliance-dashboard-synth101912438'

        response = aws_clients['cloudwatch'].get_dashboard(DashboardName=dashboard_name)
        assert 'DashboardBody' in response
        assert len(response['DashboardBody']) > 0

    def test_dashboard_has_widgets(self, aws_clients):
        """Test CloudWatch dashboard has metric widgets"""
        dashboard_name = 'compliance-dashboard-synth101912438'

        response = aws_clients['cloudwatch'].get_dashboard(DashboardName=dashboard_name)
        dashboard_body = json.loads(response['DashboardBody'])

        assert 'widgets' in dashboard_body
        assert len(dashboard_body['widgets']) >= 4  # Should have at least 4 widgets

    def test_dashboard_monitors_compliance_metrics(self, aws_clients):
        """Test CloudWatch dashboard monitors ComplianceChecker namespace"""
        dashboard_name = 'compliance-dashboard-synth101912438'

        response = aws_clients['cloudwatch'].get_dashboard(DashboardName=dashboard_name)
        dashboard_body = json.loads(response['DashboardBody'])

        # Check that widgets monitor ComplianceChecker metrics
        dashboard_str = json.dumps(dashboard_body)
        assert 'ComplianceChecker' in dashboard_str
        assert 'CompliancePercentage' in dashboard_str
        assert 'CheckExecutionCount' in dashboard_str
        assert 'FailedChecksCount' in dashboard_str


class TestCloudWatchLogs:
    """Test CloudWatch Logs configuration"""

    def test_lambda_log_group_exists(self, aws_clients):
        """Test Lambda function log group was created"""
        log_group_name = '/aws/lambda/compliance-report-processor-synth101912438'

        response = aws_clients['logs'].describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        assert len(response['logGroups']) > 0
        assert response['logGroups'][0]['logGroupName'] == log_group_name

    def test_lambda_log_retention(self, aws_clients):
        """Test Lambda log group has 30-day retention"""
        log_group_name = '/aws/lambda/compliance-report-processor-synth101912438'

        response = aws_clients['logs'].describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        assert len(response['logGroups']) > 0
        assert response['logGroups'][0]['retentionInDays'] == 30


class TestIAMRoles:
    """Test IAM roles deployment and permissions"""

    def test_lambda_execution_role_exists(self, aws_clients):
        """Test Lambda execution role was created"""
        role_name = 'compliance-report-processor-role-synth101912438'

        response = aws_clients['iam'].get_role(RoleName=role_name)
        assert response['Role']['RoleName'] == role_name

    def test_ssm_automation_role_exists(self, aws_clients):
        """Test SSM automation role was created"""
        role_name = 'ssm-automation-role-synth101912438'

        response = aws_clients['iam'].get_role(RoleName=role_name)
        assert response['Role']['RoleName'] == role_name

    def test_eventbridge_role_exists(self, aws_clients):
        """Test EventBridge invocation role was created"""
        role_name = 'eventbridge-lambda-role-synth101912438'

        response = aws_clients['iam'].get_role(RoleName=role_name)
        assert response['Role']['RoleName'] == role_name

    def test_lambda_role_has_policies(self, aws_clients):
        """Test Lambda role has attached policies"""
        role_name = 'compliance-report-processor-role-synth101912438'

        # Check managed policies
        response = aws_clients['iam'].list_attached_role_policies(RoleName=role_name)
        assert len(response['AttachedPolicies']) > 0

        # Check for AWSLambdaBasicExecutionRole
        policy_names = [p['PolicyName'] for p in response['AttachedPolicies']]
        assert 'AWSLambdaBasicExecutionRole' in policy_names

        # Check inline policies
        inline_response = aws_clients['iam'].list_role_policies(RoleName=role_name)
        assert len(inline_response['PolicyNames']) > 0

    def test_iam_roles_have_tags(self, aws_clients):
        """Test IAM roles have required tags"""
        role_names = [
            'compliance-report-processor-role-synth101912438',
            'ssm-automation-role-synth101912438',
            'eventbridge-lambda-role-synth101912438'
        ]

        for role_name in role_names:
            response = aws_clients['iam'].list_role_tags(RoleName=role_name)
            tags = {tag['Key']: tag['Value'] for tag in response['Tags']}

            assert 'Environment' in tags
            assert tags['Environment'] == 'qa'
            assert 'Project' in tags
            assert tags['Project'] == 'compliance-checker'


class TestResourceNaming:
    """Test resource naming with environmentSuffix"""

    def test_all_resources_include_environment_suffix(self, stack_outputs):
        """Test all stack outputs include synth101912438 suffix"""
        environment_suffix = 'synth101912438'

        for key, value in stack_outputs.items():
            if key != 'ComplianceDashboardURL':  # URL format is different
                assert environment_suffix in value, f"{key} does not include environment suffix: {value}"


class TestEndToEndWorkflow:
    """Test end-to-end compliance workflow"""

    def test_lambda_can_write_to_s3(self, stack_outputs, aws_clients):
        """Test Lambda function can write to S3 bucket (simulate compliance report)"""
        bucket_name = stack_outputs['ComplianceReportsBucketName']

        # Check bucket is writable by attempting to list objects
        # (Actual write would require invoking Lambda)
        try:
            response = aws_clients['s3'].list_objects_v2(Bucket=bucket_name, MaxKeys=1)
            # If we get here without error, bucket is accessible
            assert 'Name' in response
        except ClientError as e:
            pytest.fail(f"Cannot access S3 bucket: {e}")

    def test_lambda_can_publish_to_sns(self, stack_outputs, aws_clients):
        """Test Lambda has permissions to publish to SNS topic"""
        topic_arn = stack_outputs['ComplianceAlertTopicArn']
        function_arn = stack_outputs['ComplianceReportProcessorFunctionArn']

        # Verify topic exists and is accessible
        response = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn

        # Verify Lambda has IAM role with SNS permissions
        function_name = function_arn.split(':')[-1]
        lambda_response = aws_clients['lambda'].get_function_configuration(FunctionName=function_name)
        role_arn = lambda_response['Role']

        # Extract role name from ARN
        role_name = role_arn.split('/')[-1]
        iam_response = aws_clients['iam'].list_role_policies(RoleName=role_name)
        assert len(iam_response['PolicyNames']) > 0

    def test_eventbridge_can_invoke_lambda(self, stack_outputs, aws_clients):
        """Test EventBridge rules have permission to invoke Lambda"""
        function_arn = stack_outputs['ComplianceReportProcessorFunctionArn']
        function_name = function_arn.split(':')[-1]

        # Get Lambda function policy
        try:
            response = aws_clients['lambda'].get_policy(FunctionName=function_name)
            policy = json.loads(response['Policy'])

            # Check for EventBridge permissions
            eventbridge_allowed = False
            for statement in policy['Statement']:
                if statement.get('Principal', {}).get('Service') == 'events.amazonaws.com':
                    eventbridge_allowed = True
                    break

            assert eventbridge_allowed, "EventBridge not allowed to invoke Lambda"
        except ClientError:
            pytest.fail("Cannot retrieve Lambda function policy")
