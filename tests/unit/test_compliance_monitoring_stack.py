"""
Unit tests for CloudFormation Compliance Monitoring Stack template.

Tests validate:
- Template syntax and structure
- Resource configurations
- Parameter definitions
- IAM roles and policies
- S3 bucket configurations
- Lambda function properties
- EventBridge rules
- SNS topics
- CloudWatch configurations
- AWS Config setup
- All security best practices
"""

import json
import os
import pytest


@pytest.fixture
def template():
    """Load CloudFormation template."""
    template_path = os.path.join(
        os.path.dirname(__file__), "../../lib/template.json"
    )
    with open(template_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def resources(template):
    """Extract resources from template."""
    return template.get("Resources", {})


@pytest.fixture
def parameters(template):
    """Extract parameters from template."""
    return template.get("Parameters", {})


@pytest.fixture
def outputs(template):
    """Extract outputs from template."""
    return template.get("Outputs", {})


class TestTemplateStructure:
    """Test overall template structure and format."""

    def test_template_has_required_keys(self, template):
        """Verify template has all required top-level keys."""
        assert "AWSTemplateFormatVersion" in template
        assert template["AWSTemplateFormatVersion"] == "2010-09-09"
        assert "Description" in template
        assert "Parameters" in template
        assert "Resources" in template
        assert "Outputs" in template

    def test_template_description(self, template):
        """Verify template description is present and meaningful."""
        description = template["Description"]
        assert len(description) > 0
        assert "Compliance" in description or "compliance" in description

    def test_all_resources_have_types(self, resources):
        """Verify all resources have Type property."""
        for resource_name, resource in resources.items():
            assert "Type" in resource, f"Resource {resource_name} missing Type"


class TestParameters:
    """Test parameter definitions."""

    def test_environment_suffix_parameter(self, parameters):
        """Test EnvironmentSuffix parameter definition."""
        assert "EnvironmentSuffix" in parameters
        env_suffix = parameters["EnvironmentSuffix"]
        assert env_suffix["Type"] == "String"
        assert "Description" in env_suffix
        assert "Default" in env_suffix
        assert env_suffix["Default"] == "dev"
        assert "AllowedPattern" in env_suffix

    def test_security_team_email_parameter(self, parameters):
        """Test SecurityTeamEmail parameter definition."""
        assert "SecurityTeamEmail" in parameters
        email_param = parameters["SecurityTeamEmail"]
        assert email_param["Type"] == "String"
        assert "Description" in email_param
        assert "AllowedPattern" in email_param

    def test_approved_amis_parameter(self, parameters):
        """Test ApprovedAMIs parameter definition."""
        assert "ApprovedAMIs" in parameters
        ami_param = parameters["ApprovedAMIs"]
        assert ami_param["Type"] == "CommaDelimitedList"
        assert "Description" in ami_param
        assert "Default" in ami_param


class TestS3Buckets:
    """Test S3 bucket configurations."""

    def test_compliance_report_bucket_exists(self, resources):
        """Test ComplianceReportBucket resource exists."""
        assert "ComplianceReportBucket" in resources
        bucket = resources["ComplianceReportBucket"]
        assert bucket["Type"] == "AWS::S3::Bucket"

    def test_compliance_report_bucket_deletion_policy(self, resources):
        """Test ComplianceReportBucket has Delete policy."""
        bucket = resources["ComplianceReportBucket"]
        assert bucket.get("DeletionPolicy") == "Delete"

    def test_compliance_report_bucket_properties(self, resources):
        """Test ComplianceReportBucket has required properties."""
        bucket = resources["ComplianceReportBucket"]["Properties"]
        assert "BucketName" in bucket
        assert "VersioningConfiguration" in bucket
        assert bucket["VersioningConfiguration"]["Status"] == "Enabled"
        assert "BucketEncryption" in bucket
        assert "LifecycleConfiguration" in bucket
        assert "PublicAccessBlockConfiguration" in bucket

    def test_compliance_report_bucket_encryption(self, resources):
        """Test ComplianceReportBucket encryption."""
        encryption = resources["ComplianceReportBucket"]["Properties"][
            "BucketEncryption"
        ]
        assert "ServerSideEncryptionConfiguration" in encryption
        sse_config = encryption["ServerSideEncryptionConfiguration"][0]
        assert sse_config["ServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"

    def test_compliance_report_bucket_lifecycle(self, resources):
        """Test ComplianceReportBucket lifecycle rules."""
        lifecycle = resources["ComplianceReportBucket"]["Properties"][
            "LifecycleConfiguration"
        ]
        assert "Rules" in lifecycle
        rules = lifecycle["Rules"]
        assert len(rules) > 0
        rule = rules[0]
        assert rule["Status"] == "Enabled"
        assert "Transitions" in rule
        assert rule["Transitions"][0]["TransitionInDays"] == 30
        assert rule["Transitions"][0]["StorageClass"] == "GLACIER"
        assert rule["ExpirationInDays"] == 90

    def test_compliance_report_bucket_public_access_block(self, resources):
        """Test ComplianceReportBucket blocks public access."""
        public_access = resources["ComplianceReportBucket"]["Properties"][
            "PublicAccessBlockConfiguration"
        ]
        assert public_access["BlockPublicAcls"] is True
        assert public_access["BlockPublicPolicy"] is True
        assert public_access["IgnorePublicAcls"] is True
        assert public_access["RestrictPublicBuckets"] is True

    def test_config_bucket_exists(self, resources):
        """Test ConfigBucket resource exists."""
        assert "ConfigBucket" in resources
        bucket = resources["ConfigBucket"]
        assert bucket["Type"] == "AWS::S3::Bucket"

    def test_config_bucket_deletion_policy(self, resources):
        """Test ConfigBucket has Delete policy."""
        bucket = resources["ConfigBucket"]
        assert bucket.get("DeletionPolicy") == "Delete"

    def test_config_bucket_encryption(self, resources):
        """Test ConfigBucket encryption."""
        encryption = resources["ConfigBucket"]["Properties"]["BucketEncryption"]
        assert "ServerSideEncryptionConfiguration" in encryption
        sse_config = encryption["ServerSideEncryptionConfiguration"][0]
        assert sse_config["ServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"

    def test_config_bucket_policy_exists(self, resources):
        """Test ConfigBucketPolicy resource exists."""
        assert "ConfigBucketPolicy" in resources
        policy = resources["ConfigBucketPolicy"]
        assert policy["Type"] == "AWS::S3::BucketPolicy"

    def test_config_bucket_policy_grants_config_access(self, resources):
        """Test ConfigBucketPolicy grants AWS Config necessary permissions."""
        policy_doc = resources["ConfigBucketPolicy"]["Properties"]["PolicyDocument"]
        statements = policy_doc["Statement"]
        assert len(statements) >= 3

        # Check for GetBucketAcl permission
        acl_statement = next(
            (s for s in statements if s.get("Sid") == "AWSConfigBucketPermissionsCheck"),
            None,
        )
        assert acl_statement is not None
        assert acl_statement["Effect"] == "Allow"
        assert acl_statement["Principal"]["Service"] == "config.amazonaws.com"
        assert "s3:GetBucketAcl" in acl_statement["Action"]

        # Check for ListBucket permission
        list_statement = next(
            (s for s in statements if s.get("Sid") == "AWSConfigBucketExistenceCheck"),
            None,
        )
        assert list_statement is not None
        assert "s3:ListBucket" in list_statement["Action"]

        # Check for PutObject permission
        put_statement = next(
            (s for s in statements if s.get("Sid") == "AWSConfigBucketPutObject"), None
        )
        assert put_statement is not None
        assert "s3:PutObject" in put_statement["Action"]


class TestIAMRoles:
    """Test IAM role configurations."""

    def test_config_role_exists(self, resources):
        """Test ConfigRole resource exists."""
        assert "ConfigRole" in resources
        role = resources["ConfigRole"]
        assert role["Type"] == "AWS::IAM::Role"

    def test_config_role_trust_policy(self, resources):
        """Test ConfigRole has correct trust policy."""
        role = resources["ConfigRole"]["Properties"]
        assume_policy = role["AssumeRolePolicyDocument"]
        statement = assume_policy["Statement"][0]
        assert statement["Effect"] == "Allow"
        assert statement["Principal"]["Service"] == "config.amazonaws.com"
        assert statement["Action"] == "sts:AssumeRole"

    def test_config_role_managed_policy(self, resources):
        """Test ConfigRole has AWS_ConfigRole managed policy."""
        role = resources["ConfigRole"]["Properties"]
        managed_policies = role["ManagedPolicyArns"]
        assert "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole" in managed_policies

    def test_config_role_inline_policies(self, resources):
        """Test ConfigRole has inline policies for S3 access."""
        role = resources["ConfigRole"]["Properties"]
        assert "Policies" in role
        policies = role["Policies"]
        assert len(policies) > 0
        policy = policies[0]
        assert policy["PolicyName"] == "ConfigS3Policy"
        statements = policy["PolicyDocument"]["Statement"]
        assert len(statements) > 0
        assert "s3:GetBucketVersioning" in statements[0]["Action"]

    def test_lambda_execution_role_exists(self, resources):
        """Test LambdaExecutionRole resource exists."""
        assert "LambdaExecutionRole" in resources
        role = resources["LambdaExecutionRole"]
        assert role["Type"] == "AWS::IAM::Role"

    def test_lambda_execution_role_trust_policy(self, resources):
        """Test LambdaExecutionRole has correct trust policy."""
        role = resources["LambdaExecutionRole"]["Properties"]
        assume_policy = role["AssumeRolePolicyDocument"]
        statement = assume_policy["Statement"][0]
        assert statement["Effect"] == "Allow"
        assert statement["Principal"]["Service"] == "lambda.amazonaws.com"
        assert statement["Action"] == "sts:AssumeRole"

    def test_lambda_execution_role_managed_policy(self, resources):
        """Test LambdaExecutionRole has basic execution policy."""
        role = resources["LambdaExecutionRole"]["Properties"]
        managed_policies = role["ManagedPolicyArns"]
        assert (
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            in managed_policies
        )

    def test_lambda_execution_role_inline_policies(self, resources):
        """Test LambdaExecutionRole has comprehensive inline policies."""
        role = resources["LambdaExecutionRole"]["Properties"]
        assert "Policies" in role
        policies = role["Policies"]
        assert len(policies) > 0
        policy = policies[0]
        assert policy["PolicyName"] == "ComplianceValidationPolicy"
        statements = policy["PolicyDocument"]["Statement"]

        # Check for required permissions
        actions = []
        for statement in statements:
            if isinstance(statement["Action"], list):
                actions.extend(statement["Action"])
            else:
                actions.append(statement["Action"])

        assert any("config:" in action for action in actions)
        assert any("s3:" in action for action in actions)
        assert any("sns:Publish" in action for action in actions)
        assert any("ssm:" in action for action in actions)


class TestAWSConfig:
    """Test AWS Config setup."""

    def test_config_recorder_exists(self, resources):
        """Test ConfigRecorder resource exists."""
        assert "ConfigRecorder" in resources
        recorder = resources["ConfigRecorder"]
        assert recorder["Type"] == "AWS::Config::ConfigurationRecorder"

    def test_config_recorder_properties(self, resources):
        """Test ConfigRecorder has correct properties."""
        recorder = resources["ConfigRecorder"]["Properties"]
        assert "Name" in recorder
        assert "RoleARN" in recorder
        assert "RecordingGroup" in recorder
        recording_group = recorder["RecordingGroup"]
        assert recording_group["AllSupported"] is True
        assert recording_group["IncludeGlobalResourceTypes"] is True

    def test_config_recorder_depends_on_bucket_policy(self, resources):
        """Test ConfigRecorder depends on ConfigBucketPolicy."""
        recorder = resources["ConfigRecorder"]
        assert "DependsOn" in recorder
        depends_on = recorder["DependsOn"]
        if isinstance(depends_on, list):
            assert "ConfigBucketPolicy" in depends_on
        else:
            assert depends_on == "ConfigBucketPolicy"

    def test_config_delivery_channel_exists(self, resources):
        """Test ConfigDeliveryChannel resource exists."""
        assert "ConfigDeliveryChannel" in resources
        channel = resources["ConfigDeliveryChannel"]
        assert channel["Type"] == "AWS::Config::DeliveryChannel"

    def test_config_delivery_channel_properties(self, resources):
        """Test ConfigDeliveryChannel has correct properties."""
        channel = resources["ConfigDeliveryChannel"]["Properties"]
        assert "Name" in channel
        assert "S3BucketName" in channel

    def test_config_rule_exists(self, resources):
        """Test at least one Config rule exists."""
        config_rules = [r for r in resources.values() if r["Type"] == "AWS::Config::ConfigRule"]
        assert len(config_rules) > 0

    def test_required_tags_config_rule(self, resources):
        """Test RequiredTagsConfigRule exists and is configured."""
        assert "RequiredTagsConfigRule" in resources
        rule = resources["RequiredTagsConfigRule"]
        assert rule["Type"] == "AWS::Config::ConfigRule"
        properties = rule["Properties"]
        assert "ConfigRuleName" in properties
        assert "Source" in properties
        assert properties["Source"]["Owner"] == "AWS"
        assert properties["Source"]["SourceIdentifier"] == "REQUIRED_TAGS"
        assert "InputParameters" in properties


class TestLambdaFunctions:
    """Test Lambda function configurations."""

    def test_tag_compliance_function_exists(self, resources):
        """Test TagComplianceFunction resource exists."""
        assert "TagComplianceFunction" in resources
        function = resources["TagComplianceFunction"]
        assert function["Type"] == "AWS::Lambda::Function"

    def test_tag_compliance_function_runtime(self, resources):
        """Test TagComplianceFunction uses Python 3.9."""
        function = resources["TagComplianceFunction"]["Properties"]
        assert function["Runtime"] == "python3.9"

    def test_tag_compliance_function_memory(self, resources):
        """Test TagComplianceFunction has 256MB memory."""
        function = resources["TagComplianceFunction"]["Properties"]
        assert function["MemorySize"] == 256

    def test_tag_compliance_function_timeout(self, resources):
        """Test TagComplianceFunction has 300 second timeout."""
        function = resources["TagComplianceFunction"]["Properties"]
        assert function["Timeout"] == 300

    def test_tag_compliance_function_environment_variables(self, resources):
        """Test TagComplianceFunction has required environment variables."""
        function = resources["TagComplianceFunction"]["Properties"]
        assert "Environment" in function
        variables = function["Environment"]["Variables"]
        assert "SNS_TOPIC_ARN" in variables
        assert "S3_BUCKET" in variables

    def test_tag_compliance_function_code(self, resources):
        """Test TagComplianceFunction has inline code."""
        function = resources["TagComplianceFunction"]["Properties"]
        assert "Code" in function
        assert "ZipFile" in function["Code"]
        code = function["Code"]["ZipFile"]
        assert "import boto3" in code
        assert "lambda_handler" in code

    def test_ami_compliance_function_exists(self, resources):
        """Test AMIComplianceFunction resource exists."""
        assert "AMIComplianceFunction" in resources
        function = resources["AMIComplianceFunction"]
        assert function["Type"] == "AWS::Lambda::Function"

    def test_ami_compliance_function_runtime(self, resources):
        """Test AMIComplianceFunction uses Python 3.9."""
        function = resources["AMIComplianceFunction"]["Properties"]
        assert function["Runtime"] == "python3.9"

    def test_ami_compliance_function_environment_variables(self, resources):
        """Test AMIComplianceFunction has required environment variables."""
        function = resources["AMIComplianceFunction"]["Properties"]
        variables = function["Environment"]["Variables"]
        assert "SNS_TOPIC_ARN" in variables
        assert "S3_BUCKET" in variables
        assert "APPROVED_AMIS_PARAM" in variables

    def test_drift_detection_function_exists(self, resources):
        """Test DriftDetectionFunction resource exists."""
        assert "DriftDetectionFunction" in resources
        function = resources["DriftDetectionFunction"]
        assert function["Type"] == "AWS::Lambda::Function"

    def test_drift_detection_function_runtime(self, resources):
        """Test DriftDetectionFunction uses Python 3.9."""
        function = resources["DriftDetectionFunction"]["Properties"]
        assert function["Runtime"] == "python3.9"

    def test_all_lambda_functions_have_log_groups(self, resources):
        """Test all Lambda functions have associated log groups."""
        lambda_functions = [
            "TagComplianceFunction",
            "AMIComplianceFunction",
            "DriftDetectionFunction",
        ]
        for func_name in lambda_functions:
            log_group_name = f"{func_name}LogGroup"
            assert log_group_name in resources
            log_group = resources[log_group_name]
            assert log_group["Type"] == "AWS::Logs::LogGroup"

    def test_log_groups_deletion_policy(self, resources):
        """Test log groups have Delete deletion policy."""
        log_groups = [r for r in resources.values() if r["Type"] == "AWS::Logs::LogGroup"]
        for log_group in log_groups:
            assert log_group.get("DeletionPolicy") == "Delete"

    def test_log_groups_retention(self, resources):
        """Test log groups have 30-day retention."""
        log_groups = [r for r in resources.values() if r["Type"] == "AWS::Logs::LogGroup"]
        for log_group in log_groups:
            assert log_group["Properties"]["RetentionInDays"] == 30


class TestEventBridge:
    """Test EventBridge rule configurations."""

    def test_config_compliance_event_rule_exists(self, resources):
        """Test ConfigComplianceEventRule resource exists."""
        assert "ConfigComplianceEventRule" in resources
        rule = resources["ConfigComplianceEventRule"]
        assert rule["Type"] == "AWS::Events::Rule"

    def test_config_compliance_event_rule_properties(self, resources):
        """Test ConfigComplianceEventRule has correct properties."""
        rule = resources["ConfigComplianceEventRule"]["Properties"]
        assert "Name" in rule
        assert "EventPattern" in rule
        assert rule["State"] == "ENABLED"
        assert "Targets" in rule

    def test_config_compliance_event_rule_pattern(self, resources):
        """Test ConfigComplianceEventRule has correct event pattern."""
        rule = resources["ConfigComplianceEventRule"]["Properties"]
        pattern = rule["EventPattern"]
        assert pattern["source"] == ["aws.config"]
        assert pattern["detail-type"] == ["Config Rules Compliance Change"]

    def test_scheduled_compliance_check_rule_exists(self, resources):
        """Test ScheduledComplianceCheckRule resource exists."""
        assert "ScheduledComplianceCheckRule" in resources
        rule = resources["ScheduledComplianceCheckRule"]
        assert rule["Type"] == "AWS::Events::Rule"

    def test_scheduled_compliance_check_rule_schedule(self, resources):
        """Test ScheduledComplianceCheckRule has 6-hour schedule."""
        rule = resources["ScheduledComplianceCheckRule"]["Properties"]
        assert rule["ScheduleExpression"] == "rate(6 hours)"
        assert rule["State"] == "ENABLED"

    def test_scheduled_compliance_check_rule_targets(self, resources):
        """Test ScheduledComplianceCheckRule targets all Lambda functions."""
        rule = resources["ScheduledComplianceCheckRule"]["Properties"]
        targets = rule["Targets"]
        assert len(targets) == 3
        target_ids = [t["Id"] for t in targets]
        assert "TagComplianceScheduled" in target_ids
        assert "AMIComplianceScheduled" in target_ids
        assert "DriftDetectionScheduled" in target_ids

    def test_lambda_permissions_for_eventbridge(self, resources):
        """Test Lambda functions have permissions for EventBridge invocation."""
        permission_resources = [
            r for r in resources.values() if r["Type"] == "AWS::Lambda::Permission"
        ]
        assert len(permission_resources) >= 3

        # Check each permission has required properties
        for permission in permission_resources:
            props = permission["Properties"]
            assert props["Action"] == "lambda:InvokeFunction"
            assert props["Principal"] == "events.amazonaws.com"
            assert "SourceArn" in props


class TestSNS:
    """Test SNS topic configurations."""

    def test_compliance_alert_topic_exists(self, resources):
        """Test ComplianceAlertTopic resource exists."""
        assert "ComplianceAlertTopic" in resources
        topic = resources["ComplianceAlertTopic"]
        assert topic["Type"] == "AWS::SNS::Topic"

    def test_compliance_alert_topic_properties(self, resources):
        """Test ComplianceAlertTopic has correct properties."""
        topic = resources["ComplianceAlertTopic"]["Properties"]
        assert "TopicName" in topic
        assert "DisplayName" in topic
        assert "Compliance" in topic["DisplayName"]

    def test_compliance_alert_topic_subscription(self, resources):
        """Test ComplianceAlertTopic has email subscription."""
        topic = resources["ComplianceAlertTopic"]["Properties"]
        assert "Subscription" in topic
        subscriptions = topic["Subscription"]
        assert len(subscriptions) > 0
        subscription = subscriptions[0]
        assert subscription["Protocol"] == "email"
        assert "Endpoint" in subscription


class TestSSMParameters:
    """Test Systems Manager Parameter Store configurations."""

    def test_approved_amis_parameter_exists(self, resources):
        """Test ApprovedAMIsParameter resource exists."""
        assert "ApprovedAMIsParameter" in resources
        param = resources["ApprovedAMIsParameter"]
        assert param["Type"] == "AWS::SSM::Parameter"

    def test_approved_amis_parameter_properties(self, resources):
        """Test ApprovedAMIsParameter has correct properties."""
        param = resources["ApprovedAMIsParameter"]["Properties"]
        assert param["Name"] == "/compliance/approved-amis"
        assert param["Type"] == "String"
        assert "Value" in param

    def test_compliance_threshold_parameter_exists(self, resources):
        """Test ComplianceThresholdParameter resource exists."""
        assert "ComplianceThresholdParameter" in resources
        param = resources["ComplianceThresholdParameter"]
        assert param["Type"] == "AWS::SSM::Parameter"

    def test_compliance_threshold_parameter_properties(self, resources):
        """Test ComplianceThresholdParameter has correct properties."""
        param = resources["ComplianceThresholdParameter"]["Properties"]
        assert param["Name"] == "/compliance/threshold"
        assert param["Type"] == "String"
        assert param["Value"] == "95"


class TestCloudWatch:
    """Test CloudWatch dashboard configurations."""

    def test_compliance_dashboard_exists(self, resources):
        """Test ComplianceDashboard resource exists."""
        assert "ComplianceDashboard" in resources
        dashboard = resources["ComplianceDashboard"]
        assert dashboard["Type"] == "AWS::CloudWatch::Dashboard"

    def test_compliance_dashboard_properties(self, resources):
        """Test ComplianceDashboard has correct properties."""
        dashboard = resources["ComplianceDashboard"]["Properties"]
        assert "DashboardName" in dashboard
        assert "DashboardBody" in dashboard


class TestResourceNaming:
    """Test resource naming conventions."""

    def test_all_named_resources_use_environment_suffix(self, resources):
        """Test all named resources use EnvironmentSuffix parameter."""
        named_resources = {
            "ComplianceReportBucket": "BucketName",
            "ConfigBucket": "BucketName",
            "ConfigRole": "RoleName",
            "ConfigRecorder": "Name",
            "ConfigDeliveryChannel": "Name",
            "ComplianceAlertTopic": "TopicName",
            "LambdaExecutionRole": "RoleName",
            "TagComplianceFunction": "FunctionName",
            "AMIComplianceFunction": "FunctionName",
            "DriftDetectionFunction": "FunctionName",
            "TagComplianceFunctionLogGroup": "LogGroupName",
            "AMIComplianceFunctionLogGroup": "LogGroupName",
            "DriftDetectionFunctionLogGroup": "LogGroupName",
            "ConfigComplianceEventRule": "Name",
            "ScheduledComplianceCheckRule": "Name",
            "RequiredTagsConfigRule": "ConfigRuleName",
            "ComplianceDashboard": "DashboardName",
        }

        for resource_name, property_name in named_resources.items():
            if resource_name in resources:
                resource = resources[resource_name]
                if "Properties" in resource and property_name in resource["Properties"]:
                    name_value = resource["Properties"][property_name]
                    # Check if it's a Fn::Sub with EnvironmentSuffix
                    if isinstance(name_value, dict) and "Fn::Sub" in name_value:
                        sub_value = name_value["Fn::Sub"]
                        if isinstance(sub_value, str):
                            assert "${EnvironmentSuffix}" in sub_value, (
                                f"{resource_name}.{property_name} should use "
                                f"${{EnvironmentSuffix}}"
                            )


class TestDeletionPolicies:
    """Test deletion policies for all resources."""

    def test_all_resources_are_deletable(self, resources):
        """Test no resources have Retain deletion policy."""
        for resource_name, resource in resources.items():
            deletion_policy = resource.get("DeletionPolicy", "Delete")
            assert deletion_policy != "Retain", (
                f"Resource {resource_name} has Retain deletion policy"
            )

    def test_buckets_have_explicit_delete_policy(self, resources):
        """Test S3 buckets have explicit Delete deletion policy."""
        buckets = [r for r in resources.values() if r["Type"] == "AWS::S3::Bucket"]
        for bucket in buckets:
            assert bucket.get("DeletionPolicy") == "Delete"


class TestOutputs:
    """Test stack outputs."""

    def test_outputs_exist(self, outputs):
        """Test outputs are defined."""
        assert len(outputs) > 0

    def test_compliance_report_bucket_output(self, outputs):
        """Test ComplianceReportBucketName output exists."""
        assert "ComplianceReportBucketName" in outputs
        output = outputs["ComplianceReportBucketName"]
        assert "Description" in output
        assert "Value" in output

    def test_compliance_alert_topic_output(self, outputs):
        """Test ComplianceAlertTopicArn output exists."""
        assert "ComplianceAlertTopicArn" in outputs
        output = outputs["ComplianceAlertTopicArn"]
        assert "Description" in output
        assert "Value" in output

    def test_lambda_function_outputs(self, outputs):
        """Test Lambda function ARN outputs exist."""
        lambda_outputs = [
            "TagComplianceFunctionArn",
            "AMIComplianceFunctionArn",
            "DriftDetectionFunctionArn",
        ]
        for output_name in lambda_outputs:
            assert output_name in outputs
            output = outputs[output_name]
            assert "Description" in output
            assert "Value" in output

    def test_config_recorder_output(self, outputs):
        """Test ConfigRecorderName output exists."""
        assert "ConfigRecorderName" in outputs
        output = outputs["ConfigRecorderName"]
        assert "Description" in output
        assert "Value" in output

    def test_dashboard_url_output(self, outputs):
        """Test ComplianceDashboardURL output exists."""
        assert "ComplianceDashboardURL" in outputs
        output = outputs["ComplianceDashboardURL"]
        assert "Description" in output
        assert "Value" in output


class TestSecurityBestPractices:
    """Test security best practices."""

    def test_no_hardcoded_secrets(self, template):
        """Test template contains no hardcoded secrets."""
        template_str = json.dumps(template)
        assert "AKIA" not in template_str  # AWS Access Key
        assert "password" not in template_str.lower() or "ParameterKey" in template_str

    def test_all_s3_buckets_have_encryption(self, resources):
        """Test all S3 buckets have encryption enabled."""
        buckets = [r for r in resources.values() if r["Type"] == "AWS::S3::Bucket"]
        for bucket in buckets:
            properties = bucket["Properties"]
            assert "BucketEncryption" in properties

    def test_all_s3_buckets_block_public_access(self, resources):
        """Test all S3 buckets block public access."""
        buckets = [r for r in resources.values() if r["Type"] == "AWS::S3::Bucket"]
        for bucket in buckets:
            properties = bucket["Properties"]
            assert "PublicAccessBlockConfiguration" in properties
            public_access = properties["PublicAccessBlockConfiguration"]
            assert public_access["BlockPublicAcls"] is True
            assert public_access["BlockPublicPolicy"] is True
            assert public_access["IgnorePublicAcls"] is True
            assert public_access["RestrictPublicBuckets"] is True

    def test_iam_policies_no_wildcard_resources(self, resources):
        """Test IAM policies minimize use of wildcard resources."""
        iam_roles = [r for r in resources.values() if r["Type"] == "AWS::IAM::Role"]
        for role in iam_roles:
            if "Policies" in role["Properties"]:
                policies = role["Properties"]["Policies"]
                for policy in policies:
                    statements = policy["PolicyDocument"]["Statement"]
                    for statement in statements:
                        # Allow wildcards for read-only actions
                        if statement.get("Action"):
                            actions = statement["Action"]
                            if not isinstance(actions, list):
                                actions = [actions]

                            # Check if actions are sensitive (write/delete operations)
                            sensitive_actions = [
                                a for a in actions
                                if any(
                                    sensitive in a.lower()
                                    for sensitive in ["delete", "create", "update", "put"]
                                )
                            ]

                            # If sensitive actions, resource should not be wildcard alone
                            if sensitive_actions and statement.get("Resource") == "*":
                                # This is acceptable for some AWS services that don't support
                                # resource-level permissions (like Config, EC2 describe operations)
                                assert any(
                                    action.startswith(prefix)
                                    for action in sensitive_actions
                                    for prefix in ["config:", "cloudformation:Describe"]
                                )
