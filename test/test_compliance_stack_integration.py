"""
Integration tests for Compliance Stack deployment using real AWS resources
"""
import json
import pytest
import boto3
import os
import time

# Load deployment outputs
with open('cfn-outputs/flat-outputs.json', 'r') as f:
    outputs = json.load(f)


class TestComplianceStackIntegration:
    """Integration tests validating real deployed resources"""

    @classmethod
    def setup_class(cls):
        """Setup AWS clients"""
        cls.s3 = boto3.client('s3')
        cls.sns = boto3.client('sns')
        cls.lambda_client = boto3.client('lambda')
        cls.config = boto3.client('config')
        cls.ssm = boto3.client('ssm')
        cls.cloudwatch = boto3.client('cloudwatch')
        cls.environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

    def test_s3_bucket_exists(self):
        """Test that compliance reports S3 bucket exists"""
        bucket_name = outputs['ComplianceReportsBucketName']
        assert bucket_name is not None
        assert self.environment_suffix in bucket_name

        # Verify bucket exists and has versioning enabled
        response = self.s3.get_bucket_versioning(Bucket=bucket_name)
        assert response['Status'] == 'Enabled', "S3 bucket versioning should be enabled"

    def test_s3_bucket_encryption(self):
        """Test that S3 bucket has encryption enabled"""
        bucket_name = outputs['ComplianceReportsBucketName']

        # Check bucket encryption
        response = self.s3.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0, "Bucket should have encryption rules"
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

    def test_s3_bucket_public_access_block(self):
        """Test that S3 bucket has public access blocked"""
        bucket_name = outputs['ComplianceReportsBucketName']

        # Check public access block configuration
        response = self.s3.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']

        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['RestrictPublicBuckets'] is True

    def test_s3_bucket_lifecycle(self):
        """Test that S3 bucket has lifecycle policy for Glacier transition"""
        bucket_name = outputs['ComplianceReportsBucketName']

        # Check lifecycle configuration
        response = self.s3.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        rules = response['Rules']

        assert len(rules) > 0, "Bucket should have lifecycle rules"
        glacier_rule = next((r for r in rules if r['ID'] == 'TransitionToGlacier'), None)
        assert glacier_rule is not None, "Should have Glacier transition rule"
        assert glacier_rule['Status'] == 'Enabled'
        assert glacier_rule['Transitions'][0]['Days'] == 30
        assert glacier_rule['Transitions'][0]['StorageClass'] == 'GLACIER'

    def test_sns_topic_exists(self):
        """Test that SNS topic exists"""
        topic_arn = outputs['ComplianceNotificationTopicArn']
        assert topic_arn is not None
        assert 'compliance-notifications' in topic_arn

        # Verify topic attributes
        response = self.sns.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes'] is not None
        assert response['Attributes']['DisplayName'] == 'Compliance Notifications'

    def test_lambda_functions_exist(self):
        """Test that all three Lambda functions are deployed"""
        function_names = [
            f'tag-compliance-validator-{self.environment_suffix}',
            f'drift-detection-validator-{self.environment_suffix}',
            f'security-policy-validator-{self.environment_suffix}'
        ]

        for function_name in function_names:
            response = self.lambda_client.get_function(FunctionName=function_name)
            assert response['Configuration']['FunctionName'] == function_name
            assert response['Configuration']['Runtime'] == 'python3.9'
            assert response['Configuration']['MemorySize'] == 256
            assert response['Configuration']['Handler'] == 'index.lambda_handler'

    def test_lambda_environment_variables(self):
        """Test that Lambda functions have correct environment variables"""
        topic_arn = outputs['ComplianceNotificationTopicArn']

        # Check tag compliance function
        function_name = f'tag-compliance-validator-{self.environment_suffix}'
        response = self.lambda_client.get_function(FunctionName=function_name)
        env_vars = response['Configuration']['Environment']['Variables']
        assert env_vars['SNS_TOPIC_ARN'] == topic_arn

        # Check drift detection function
        function_name = f'drift-detection-validator-{self.environment_suffix}'
        response = self.lambda_client.get_function(FunctionName=function_name)
        env_vars = response['Configuration']['Environment']['Variables']
        assert env_vars['SNS_TOPIC_ARN'] == topic_arn
        assert env_vars['REPORTS_BUCKET'] == outputs['ComplianceReportsBucketName']

    def test_config_rules_exist(self):
        """Test that AWS Config rules are deployed"""
        rule_names = [
            f'tag-compliance-rule-{self.environment_suffix}',
            f'drift-detection-rule-{self.environment_suffix}',
            f'security-policy-rule-{self.environment_suffix}'
        ]

        response = self.config.describe_config_rules()
        deployed_rules = [rule['ConfigRuleName'] for rule in response['ConfigRules']]

        for rule_name in rule_names:
            assert rule_name in deployed_rules, f"Config rule {rule_name} should be deployed"

            # Get rule details
            rule_response = self.config.describe_config_rules(ConfigRuleNames=[rule_name])
            rule = rule_response['ConfigRules'][0]

            assert rule['Source']['Owner'] == 'CUSTOM_LAMBDA'
            assert rule['ConfigRuleState'] == 'ACTIVE'

    def test_ssm_parameters_exist(self):
        """Test that SSM Parameter Store entries exist"""
        param_names = [
            f'/compliance/approved-amis-{self.environment_suffix}',
            f'/compliance/security-group-rules-{self.environment_suffix}',
            f'/compliance/thresholds-{self.environment_suffix}'
        ]

        for param_name in param_names:
            response = self.ssm.get_parameter(Name=param_name)
            assert response['Parameter']['Name'] == param_name
            assert response['Parameter']['Type'] == 'String'
            assert len(response['Parameter']['Value']) > 0

            # Verify value is valid JSON
            value = json.loads(response['Parameter']['Value'])
            assert value is not None

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard exists"""
        dashboard_name = f'compliance-dashboard-{self.environment_suffix}'

        response = self.cloudwatch.get_dashboard(DashboardName=dashboard_name)
        assert response['DashboardName'] == dashboard_name
        assert response['DashboardBody'] is not None

        # Verify dashboard body contains expected widgets
        dashboard_body = json.loads(response['DashboardBody'])
        assert 'widgets' in dashboard_body
        assert len(dashboard_body['widgets']) > 0

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch Log Groups exist for Lambda functions"""
        logs = boto3.client('logs')
        log_group_names = [
            f'/aws/lambda/tag-compliance-validator-{self.environment_suffix}',
            f'/aws/lambda/drift-detection-validator-{self.environment_suffix}',
            f'/aws/lambda/security-policy-validator-{self.environment_suffix}'
        ]

        for log_group_name in log_group_names:
            response = logs.describe_log_groups(logGroupNamePrefix=log_group_name)
            assert len(response['logGroups']) > 0, f"Log group {log_group_name} should exist"

            log_group = response['logGroups'][0]
            assert log_group['logGroupName'] == log_group_name
            assert log_group['retentionInDays'] == 30

    def test_resource_naming_convention(self):
        """Test that all resources follow naming convention with environment suffix"""
        bucket_name = outputs['ComplianceReportsBucketName']
        topic_arn = outputs['ComplianceNotificationTopicArn']

        # Verify environment suffix is included in resource names
        assert self.environment_suffix in bucket_name
        assert self.environment_suffix in topic_arn

    def test_iam_roles_exist(self):
        """Test that IAM roles are created with proper permissions"""
        iam = boto3.client('iam')

        # Check Lambda execution role
        role_name = f'lambda-compliance-role-{self.environment_suffix}'
        response = iam.get_role(RoleName=role_name)
        assert response['Role']['RoleName'] == role_name

        # Verify attached managed policies
        policies = iam.list_attached_role_policies(RoleName=role_name)
        policy_arns = [p['PolicyArn'] for p in policies['AttachedPolicies']]
        assert 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' in policy_arns

        # Verify inline policies exist
        inline_policies = iam.list_role_policies(RoleName=role_name)
        assert 'ComplianceValidationPolicy' in inline_policies['PolicyNames']

    def test_lambda_permissions_exist(self):
        """Test that Lambda functions have Config service permissions"""
        function_names = [
            f'tag-compliance-validator-{self.environment_suffix}',
            f'drift-detection-validator-{self.environment_suffix}',
            f'security-policy-validator-{self.environment_suffix}'
        ]

        for function_name in function_names:
            response = self.lambda_client.get_policy(FunctionName=function_name)
            policy = json.loads(response['Policy'])

            # Verify Config service can invoke the function
            statements = policy['Statement']
            config_permission = next((s for s in statements if s['Principal'].get('Service') == 'config.amazonaws.com'), None)
            assert config_permission is not None, f"Config should have permission to invoke {function_name}"
            assert config_permission['Effect'] == 'Allow'
            assert config_permission['Action'] == 'lambda:InvokeFunction'
