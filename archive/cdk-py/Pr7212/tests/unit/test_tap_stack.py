"""
Unit tests for the Zero-Trust Data Processing Pipeline Stack.

These tests verify that the CDK stack creates all required resources
with the correct configurations for security, encryption, and compliance.
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Unit Tests")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)


@mark.describe("TapStackProps")
class TestTapStackProps(unittest.TestCase):
    """Test cases for TapStackProps"""

    @mark.it("should store environment suffix")
    def test_props_stores_environment_suffix(self):
        props = TapStackProps(environment_suffix="prod")
        assert props.environment_suffix == "prod"

    @mark.it("should allow None environment suffix")
    def test_props_allows_none_suffix(self):
        props = TapStackProps()
        assert props.environment_suffix is None


@mark.describe("KMS Keys")
class TestKMSKeys(unittest.TestCase):
    """Test cases for KMS key resources"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should create three KMS keys")
    def test_creates_three_kms_keys(self):
        self.template.resource_count_is("AWS::KMS::Key", 3)

    @mark.it("should enable key rotation on all KMS keys")
    def test_kms_keys_have_rotation_enabled(self):
        self.template.has_resource_properties(
            "AWS::KMS::Key",
            {"EnableKeyRotation": True}
        )

    @mark.it("should set pending window to 7 days")
    def test_kms_keys_pending_window(self):
        self.template.has_resource_properties(
            "AWS::KMS::Key",
            {"PendingWindowInDays": 7}
        )

    @mark.it("should have CloudWatch Logs permission in logs KMS key policy")
    def test_logs_kms_key_has_cloudwatch_permission(self):
        self.template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "KeyPolicy": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Sid": "Enable CloudWatch Logs",
                            "Effect": "Allow",
                            "Action": Match.array_with([
                                "kms:Encrypt",
                                "kms:Decrypt"
                            ])
                        })
                    ])
                })
            }
        )


@mark.describe("VPC Configuration")
class TestVPCConfiguration(unittest.TestCase):
    """Test cases for VPC resources"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should create a VPC")
    def test_creates_vpc(self):
        self.template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("should enable DNS hostnames on VPC")
    def test_vpc_has_dns_hostnames(self):
        self.template.has_resource_properties(
            "AWS::EC2::VPC",
            {"EnableDnsHostnames": True}
        )

    @mark.it("should enable DNS support on VPC")
    def test_vpc_has_dns_support(self):
        self.template.has_resource_properties(
            "AWS::EC2::VPC",
            {"EnableDnsSupport": True}
        )

    @mark.it("should create two private subnets")
    def test_creates_two_subnets(self):
        self.template.resource_count_is("AWS::EC2::Subnet", 2)

    @mark.it("should not map public IP on subnets")
    def test_subnets_no_public_ip(self):
        self.template.has_resource_properties(
            "AWS::EC2::Subnet",
            {"MapPublicIpOnLaunch": False}
        )

    @mark.it("should create route tables for subnets")
    def test_creates_route_tables(self):
        self.template.resource_count_is("AWS::EC2::RouteTable", 2)


@mark.describe("VPC Endpoints")
class TestVPCEndpoints(unittest.TestCase):
    """Test cases for VPC endpoint resources"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should create five VPC endpoints")
    def test_creates_five_vpc_endpoints(self):
        self.template.resource_count_is("AWS::EC2::VPCEndpoint", 5)

    @mark.it("should create S3 gateway endpoint")
    def test_creates_s3_gateway_endpoint(self):
        self.template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {"VpcEndpointType": "Gateway"}
        )

    @mark.it("should create interface endpoints with private DNS enabled")
    def test_interface_endpoints_private_dns(self):
        self.template.has_resource_properties(
            "AWS::EC2::VPCEndpoint",
            {
                "VpcEndpointType": "Interface",
                "PrivateDnsEnabled": True
            }
        )


@mark.describe("Security Groups")
class TestSecurityGroups(unittest.TestCase):
    """Test cases for security group resources"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should create two security groups")
    def test_creates_two_security_groups(self):
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 2)

    @mark.it("should create VPC endpoint security group with HTTPS ingress")
    def test_vpc_endpoint_sg_https_ingress(self):
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "SecurityGroupIngress": Match.array_with([
                    Match.object_like({
                        "FromPort": 443,
                        "ToPort": 443,
                        "IpProtocol": "tcp"
                    })
                ])
            }
        )

    @mark.it("should create Lambda security group with HTTPS egress")
    def test_lambda_sg_https_egress(self):
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "SecurityGroupEgress": Match.array_with([
                    Match.object_like({
                        "FromPort": 443,
                        "ToPort": 443,
                        "IpProtocol": "tcp"
                    })
                ])
            }
        )


@mark.describe("S3 Bucket")
class TestS3Bucket(unittest.TestCase):
    """Test cases for S3 bucket resources"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should create one S3 bucket")
    def test_creates_one_bucket(self):
        self.template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("should create bucket with correct name")
    def test_bucket_name(self):
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {"BucketName": f"zero-trust-data-{self.env_suffix}"}
        )

    @mark.it("should enable versioning on bucket")
    def test_bucket_versioning(self):
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {"VersioningConfiguration": {"Status": "Enabled"}}
        )

    @mark.it("should block all public access")
    def test_bucket_blocks_public_access(self):
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True
                }
            }
        )

    @mark.it("should use KMS encryption")
    def test_bucket_kms_encryption(self):
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.array_with([
                        Match.object_like({
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms"
                            }
                        })
                    ])
                }
            }
        )

    @mark.it("should create bucket policy enforcing SSL")
    def test_bucket_policy_enforces_ssl(self):
        self.template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Deny",
                            "Condition": {
                                "Bool": {"aws:SecureTransport": "false"}
                            }
                        })
                    ])
                })
            }
        )


@mark.describe("Secrets Manager")
class TestSecretsManager(unittest.TestCase):
    """Test cases for Secrets Manager resources"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should create one secret")
    def test_creates_one_secret(self):
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("should generate secret string with password")
    def test_secret_generates_password(self):
        self.template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {
                "GenerateSecretString": Match.object_like({
                    "GenerateStringKey": "password",
                    "PasswordLength": 32,
                    "ExcludePunctuation": True
                })
            }
        )

    @mark.it("should encrypt secret with KMS key")
    def test_secret_uses_kms(self):
        self.template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {"KmsKeyId": Match.any_value()}
        )


@mark.describe("CloudWatch Logs")
class TestCloudWatchLogs(unittest.TestCase):
    """Test cases for CloudWatch Log Group resources"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should create one log group")
    def test_creates_one_log_group(self):
        self.template.resource_count_is("AWS::Logs::LogGroup", 1)

    @mark.it("should set 90-day retention")
    def test_log_group_retention(self):
        self.template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {"RetentionInDays": 90}
        )

    @mark.it("should encrypt log group with KMS")
    def test_log_group_encryption(self):
        self.template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {"KmsKeyId": Match.any_value()}
        )

    @mark.it("should set correct log group name")
    def test_log_group_name(self):
        self.template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {"LogGroupName": f"/aws/lambda/data-processing-{self.env_suffix}"}
        )


@mark.describe("Lambda Function")
class TestLambdaFunction(unittest.TestCase):
    """Test cases for Lambda function resources"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should create Lambda function")
    def test_creates_lambda_function(self):
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {"FunctionName": f"data-processing-{self.env_suffix}"}
        )

    @mark.it("should use Python 3.11 runtime")
    def test_lambda_runtime(self):
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {"Runtime": "python3.11"}
        )

    @mark.it("should set correct handler")
    def test_lambda_handler(self):
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {"Handler": "index.handler"}
        )

    @mark.it("should set timeout to 30 seconds")
    def test_lambda_timeout(self):
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {"Timeout": 30}
        )

    @mark.it("should set memory to 256 MB")
    def test_lambda_memory(self):
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {"MemorySize": 256}
        )

    @mark.it("should have environment variables")
    def test_lambda_environment_variables(self):
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Environment": {
                    "Variables": Match.object_like({
                        "SECRET_ARN": Match.any_value(),
                        "BUCKET_NAME": Match.any_value()
                    })
                }
            }
        )

    @mark.it("should be configured in VPC")
    def test_lambda_vpc_config(self):
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "VpcConfig": Match.object_like({
                    "SubnetIds": Match.any_value(),
                    "SecurityGroupIds": Match.any_value()
                })
            }
        )


@mark.describe("IAM Role")
class TestIAMRole(unittest.TestCase):
    """Test cases for IAM role resources"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should create Lambda execution role")
    def test_creates_lambda_role(self):
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"}
                        })
                    ])
                })
            }
        )

    @mark.it("should have VPC access execution role policy")
    def test_lambda_role_vpc_policy(self):
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "ManagedPolicyArns": Match.any_value()
            }
        )
        # Verify the template contains the VPC access role
        template_json = self.template.to_json()
        resources = template_json.get('Resources', {})
        lambda_role_found = False
        for resource_id, resource in resources.items():
            if resource.get('Type') == 'AWS::IAM::Role':
                props = resource.get('Properties', {})
                managed_policies = props.get('ManagedPolicyArns', [])
                for policy in managed_policies:
                    if isinstance(policy, dict) and 'Fn::Join' in policy:
                        join_parts = policy['Fn::Join']
                        if len(join_parts) > 1 and isinstance(join_parts[1], list):
                            for part in join_parts[1]:
                                if isinstance(part, str) and 'AWSLambdaVPCAccessExecutionRole' in part:
                                    lambda_role_found = True
                                    break
        assert lambda_role_found, "Lambda VPC access execution role not found"


@mark.describe("Resource Tags")
class TestResourceTags(unittest.TestCase):
    """Test cases for resource tagging"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should tag resources with Environment")
    def test_environment_tag(self):
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "Tags": Match.array_with([
                    Match.object_like({
                        "Key": "Environment",
                        "Value": self.env_suffix
                    })
                ])
            }
        )

    @mark.it("should tag resources with DataClassification")
    def test_data_classification_tag(self):
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "Tags": Match.array_with([
                    Match.object_like({
                        "Key": "DataClassification",
                        "Value": "Sensitive"
                    })
                ])
            }
        )

    @mark.it("should tag resources with Owner")
    def test_owner_tag(self):
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "Tags": Match.array_with([
                    Match.object_like({
                        "Key": "Owner",
                        "Value": "SecurityTeam"
                    })
                ])
            }
        )


@mark.describe("Stack Outputs")
class TestStackOutputs(unittest.TestCase):
    """Test cases for stack outputs"""

    def setUp(self):
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("should output VPC ID")
    def test_outputs_vpc_id(self):
        self.template.has_output(
            "VPCId",
            {"Description": "VPC ID for zero-trust pipeline"}
        )

    @mark.it("should output Data Bucket Name")
    def test_outputs_bucket_name(self):
        self.template.has_output(
            "DataBucketName",
            {"Description": "S3 bucket for encrypted data storage"}
        )

    @mark.it("should output Processing Function ARN")
    def test_outputs_function_arn(self):
        self.template.has_output(
            "ProcessingFunctionArn",
            {"Description": "ARN of data processing Lambda function"}
        )

    @mark.it("should output Secret ARN")
    def test_outputs_secret_arn(self):
        self.template.has_output(
            "SecretArn",
            {"Description": "ARN of Secrets Manager secret"}
        )


@mark.describe("Default Environment Suffix")
class TestDefaultEnvironmentSuffix(unittest.TestCase):
    """Test cases for default environment suffix behavior"""

    def setUp(self):
        self.app = cdk.App()

    @mark.it("should default to 'dev' when no suffix provided")
    def test_defaults_to_dev(self):
        stack = TapStack(self.app, "TapStackDefault")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {"BucketName": "zero-trust-data-dev"}
        )

    @mark.it("should use provided suffix")
    def test_uses_provided_suffix(self):
        stack = TapStack(
            self.app,
            "TapStackCustom",
            TapStackProps(environment_suffix="prod")
        )
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {"BucketName": "zero-trust-data-prod"}
        )


if __name__ == "__main__":
    unittest.main()
