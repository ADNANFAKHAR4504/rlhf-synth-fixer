"""
Integration tests for CloudFormation Compliance Monitoring Stack.

These tests validate the deployed infrastructure using real AWS resources
and stack outputs from cfn-outputs/flat-outputs.json.

Tests cover:
- S3 bucket existence and configuration
- Lambda function invocations and responses
- SNS topic configuration
- AWS Config recorder status
- CloudWatch dashboard existence
- IAM role permissions
- Resource connectivity
"""

import json
import os
import pytest
import boto3
from datetime import datetime


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from cfn-outputs/flat-outputs.json."""
    outputs_path = os.path.join(
        os.path.dirname(__file__), "../../cfn-outputs/flat-outputs.json"
    )

    if not os.path.exists(outputs_path):
        pytest.skip(f"Stack outputs file not found: {outputs_path}")

    with open(outputs_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment or default."""
    return os.environ.get("AWS_REGION", "us-east-1")


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client."""
    return boto3.client("s3", region_name=aws_region)


@pytest.fixture(scope="module")
def lambda_client(aws_region):
    """Create Lambda client."""
    return boto3.client("lambda", region_name=aws_region)


@pytest.fixture(scope="module")
def sns_client(aws_region):
    """Create SNS client."""
    return boto3.client("sns", region_name=aws_region)


@pytest.fixture(scope="module")
def config_client(aws_region):
    """Create AWS Config client."""
    return boto3.client("config", region_name=aws_region)


@pytest.fixture(scope="module")
def cloudwatch_client(aws_region):
    """Create CloudWatch client."""
    return boto3.client("cloudwatch", region_name=aws_region)


@pytest.fixture(scope="module")
def ssm_client(aws_region):
    """Create SSM client."""
    return boto3.client("ssm", region_name=aws_region)


class TestS3Buckets:
    """Test S3 bucket deployments and configurations."""

    def test_compliance_report_bucket_exists(self, stack_outputs, s3_client):
        """Test ComplianceReportBucket was created."""
        bucket_name = stack_outputs.get("ComplianceReportBucketName")
        assert bucket_name is not None, "ComplianceReportBucketName output not found"

        # Verify bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_compliance_report_bucket_versioning(self, stack_outputs, s3_client):
        """Test ComplianceReportBucket has versioning enabled."""
        bucket_name = stack_outputs["ComplianceReportBucketName"]

        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert versioning.get("Status") == "Enabled"

    def test_compliance_report_bucket_encryption(self, stack_outputs, s3_client):
        """Test ComplianceReportBucket has encryption enabled."""
        bucket_name = stack_outputs["ComplianceReportBucketName"]

        encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption["ServerSideEncryptionConfiguration"]["Rules"]
        assert len(rules) > 0
        assert rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"

    def test_compliance_report_bucket_lifecycle(self, stack_outputs, s3_client):
        """Test ComplianceReportBucket has lifecycle rules configured."""
        bucket_name = stack_outputs["ComplianceReportBucketName"]

        lifecycle = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        rules = lifecycle["Rules"]
        assert len(rules) > 0

        # Check for Glacier transition
        rule = rules[0]
        assert rule["Status"] == "Enabled"
        transitions = rule.get("Transitions", [])
        assert len(transitions) > 0
        assert transitions[0]["Days"] == 30
        assert transitions[0]["StorageClass"] == "GLACIER"

        # Check for expiration
        assert rule.get("Expiration", {}).get("Days") == 90

    def test_compliance_report_bucket_public_access_blocked(self, stack_outputs, s3_client):
        """Test ComplianceReportBucket blocks public access."""
        bucket_name = stack_outputs["ComplianceReportBucketName"]

        public_access = s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_access["PublicAccessBlockConfiguration"]

        assert config["BlockPublicAcls"] is True
        assert config["IgnorePublicAcls"] is True
        assert config["BlockPublicPolicy"] is True
        assert config["RestrictPublicBuckets"] is True


class TestLambdaFunctions:
    """Test Lambda function deployments and invocations."""

    def test_tag_compliance_function_exists(self, stack_outputs, lambda_client):
        """Test TagComplianceFunction was deployed."""
        function_arn = stack_outputs.get("TagComplianceFunctionArn")
        assert function_arn is not None, "TagComplianceFunctionArn output not found"

        response = lambda_client.get_function(FunctionName=function_arn)
        assert response["Configuration"]["Runtime"] == "python3.9"
        assert response["Configuration"]["MemorySize"] == 256
        assert response["Configuration"]["Timeout"] == 300

    def test_ami_compliance_function_exists(self, stack_outputs, lambda_client):
        """Test AMIComplianceFunction was deployed."""
        function_arn = stack_outputs.get("AMIComplianceFunctionArn")
        assert function_arn is not None, "AMIComplianceFunctionArn output not found"

        response = lambda_client.get_function(FunctionName=function_arn)
        assert response["Configuration"]["Runtime"] == "python3.9"

    def test_drift_detection_function_exists(self, stack_outputs, lambda_client):
        """Test DriftDetectionFunction was deployed."""
        function_arn = stack_outputs.get("DriftDetectionFunctionArn")
        assert function_arn is not None, "DriftDetectionFunctionArn output not found"

        response = lambda_client.get_function(FunctionName=function_arn)
        assert response["Configuration"]["Runtime"] == "python3.9"

    def test_tag_compliance_function_invocation(self, stack_outputs, lambda_client):
        """Test TagComplianceFunction can be invoked."""
        function_arn = stack_outputs["TagComplianceFunctionArn"]

        response = lambda_client.invoke(
            FunctionName=function_arn,
            InvocationType="RequestResponse",
            Payload=json.dumps({"test": "invocation"}),
        )

        assert response["StatusCode"] == 200
        assert "FunctionError" not in response

        payload = json.loads(response["Payload"].read())
        assert payload["statusCode"] == 200

    def test_lambda_environment_variables(self, stack_outputs, lambda_client, s3_client, sns_client):
        """Test Lambda functions have correct environment variables."""
        function_arn = stack_outputs["TagComplianceFunctionArn"]

        response = lambda_client.get_function_configuration(FunctionName=function_arn)
        env_vars = response.get("Environment", {}).get("Variables", {})

        # Check SNS_TOPIC_ARN is set
        assert "SNS_TOPIC_ARN" in env_vars
        topic_arn = env_vars["SNS_TOPIC_ARN"]
        assert topic_arn == stack_outputs["ComplianceAlertTopicArn"]

        # Check S3_BUCKET is set
        assert "S3_BUCKET" in env_vars
        bucket_name = env_vars["S3_BUCKET"]
        assert bucket_name == stack_outputs["ComplianceReportBucketName"]

        # Verify the resources exist
        s3_client.head_bucket(Bucket=bucket_name)
        sns_client.get_topic_attributes(TopicArn=topic_arn)


class TestSNSTopic:
    """Test SNS topic configuration."""

    def test_compliance_alert_topic_exists(self, stack_outputs, sns_client):
        """Test ComplianceAlertTopic was created."""
        topic_arn = stack_outputs.get("ComplianceAlertTopicArn")
        assert topic_arn is not None, "ComplianceAlertTopicArn output not found"

        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        assert response["Attributes"]["TopicArn"] == topic_arn

    def test_compliance_alert_topic_subscriptions(self, stack_outputs, sns_client):
        """Test ComplianceAlertTopic has subscriptions."""
        topic_arn = stack_outputs["ComplianceAlertTopicArn"]

        response = sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
        subscriptions = response["Subscriptions"]

        # Should have at least one subscription
        assert len(subscriptions) > 0

        # Check for email protocol
        protocols = [sub["Protocol"] for sub in subscriptions]
        assert "email" in protocols


class TestAWSConfig:
    """Test AWS Config setup."""

    def test_config_recorder_exists(self, stack_outputs, config_client):
        """Test AWS Config recorder was created."""
        recorder_name = stack_outputs.get("ConfigRecorderName")
        assert recorder_name is not None, "ConfigRecorderName output not found"

        recorders = config_client.describe_configuration_recorders(
            ConfigurationRecorderNames=[recorder_name]
        )
        assert len(recorders["ConfigurationRecorders"]) == 1

        recorder = recorders["ConfigurationRecorders"][0]
        assert recorder["name"] == recorder_name
        assert recorder["recordingGroup"]["allSupported"] is True
        assert recorder["recordingGroup"]["includeGlobalResourceTypes"] is True

    def test_config_recorder_status(self, stack_outputs, config_client):
        """Test AWS Config recorder status."""
        recorder_name = stack_outputs["ConfigRecorderName"]

        # Note: Recorder may not be started automatically
        status = config_client.describe_configuration_recorder_status(
            ConfigurationRecorderNames=[recorder_name]
        )
        assert len(status["ConfigurationRecordersStatus"]) == 1

    def test_config_rules_exist(self, config_client):
        """Test AWS Config rules were created."""
        rules = config_client.describe_config_rules()
        rule_names = [rule["ConfigRuleName"] for rule in rules["ConfigRules"]]

        # Check for required tags rule
        required_tags_rules = [name for name in rule_names if "required-tags" in name]
        assert len(required_tags_rules) > 0


class TestSSMParameters:
    """Test SSM Parameter Store entries."""

    def test_approved_amis_parameter_exists(self, ssm_client):
        """Test approved AMIs parameter exists."""
        param = ssm_client.get_parameter(Name="/compliance/approved-amis")
        assert param["Parameter"]["Name"] == "/compliance/approved-amis"
        assert param["Parameter"]["Type"] == "String"

        # Validate it's valid JSON
        value = json.loads(param["Parameter"]["Value"])
        assert isinstance(value, list)

    def test_compliance_threshold_parameter_exists(self, ssm_client):
        """Test compliance threshold parameter exists."""
        param = ssm_client.get_parameter(Name="/compliance/threshold")
        assert param["Parameter"]["Name"] == "/compliance/threshold"
        assert param["Parameter"]["Type"] == "String"
        assert param["Parameter"]["Value"] == "95"


class TestCloudWatch:
    """Test CloudWatch dashboard."""

    def test_compliance_dashboard_exists(self, stack_outputs, cloudwatch_client):
        """Test CloudWatch dashboard was created."""
        dashboard_url = stack_outputs.get("ComplianceDashboardURL")
        assert dashboard_url is not None, "ComplianceDashboardURL output not found"

        # Extract dashboard name from URL
        assert "dashboards:name=" in dashboard_url
        dashboard_name = dashboard_url.split("dashboards:name=")[-1]

        # Verify dashboard exists
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        assert response["DashboardName"] == dashboard_name
        assert "DashboardBody" in response


class TestEndToEndWorkflow:
    """Test complete compliance monitoring workflow."""

    def test_compliance_check_workflow(self, stack_outputs, lambda_client, s3_client):
        """Test complete compliance check workflow."""
        # 1. Invoke tag compliance function
        function_arn = stack_outputs["TagComplianceFunctionArn"]
        bucket_name = stack_outputs["ComplianceReportBucketName"]

        response = lambda_client.invoke(
            FunctionName=function_arn,
            InvocationType="RequestResponse",
            Payload=json.dumps({"test": "workflow"}),
        )

        assert response["StatusCode"] == 200

        # 2. Verify compliance report was written to S3
        # Note: In a real test environment with EC2 instances, reports would be generated
        # This test verifies the bucket is accessible for report storage
        try:
            s3_client.list_objects_v2(Bucket=bucket_name, Prefix="tag-compliance/", MaxKeys=1)
        except Exception as e:
            pytest.fail(f"Failed to access compliance reports in S3: {e}")

    def test_resource_connectivity(self, stack_outputs, s3_client, lambda_client, sns_client):
        """Test all resources are connected and accessible."""
        # Verify all outputs are present
        required_outputs = [
            "ComplianceReportBucketName",
            "ComplianceAlertTopicArn",
            "TagComplianceFunctionArn",
            "AMIComplianceFunctionArn",
            "DriftDetectionFunctionArn",
            "ConfigRecorderName",
            "ComplianceDashboardURL",
        ]

        for output in required_outputs:
            assert output in stack_outputs, f"Missing required output: {output}"

        # Verify resources are accessible
        s3_client.head_bucket(Bucket=stack_outputs["ComplianceReportBucketName"])
        sns_client.get_topic_attributes(TopicArn=stack_outputs["ComplianceAlertTopicArn"])
        lambda_client.get_function(FunctionName=stack_outputs["TagComplianceFunctionArn"])
        lambda_client.get_function(FunctionName=stack_outputs["AMIComplianceFunctionArn"])
        lambda_client.get_function(FunctionName=stack_outputs["DriftDetectionFunctionArn"])
