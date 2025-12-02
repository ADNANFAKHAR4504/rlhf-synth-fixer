"""
Unit tests for TapStack CDK stack.

Tests all infrastructure components with 100% coverage including:
- KMS key configuration
- VPC and VPC endpoints
- S3 buckets with security policies
- CloudWatch log groups
- DynamoDB table
- Secrets Manager secret
- Lambda function
- API Gateway
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack - KMS Configuration")
class TestKMSConfiguration(unittest.TestCase):
    """Test cases for KMS key configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates a customer-managed KMS key with rotation enabled")
    def test_kms_key_with_rotation(self):
        """Test KMS key is created with rotation enabled."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
            "Description": "Customer-managed KMS key for data pipeline encryption"
        })

    @mark.it("creates a KMS key alias with correct naming")
    def test_kms_key_alias(self):
        """Test KMS key alias is created with environment suffix."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::KMS::Alias", {
            "AliasName": f"alias/data-pipeline-key-{self.env_suffix}"
        })

    @mark.it("configures KMS key policy for CloudWatch Logs")
    def test_kms_key_cloudwatch_policy(self):
        """Test KMS key has CloudWatch Logs policy."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::KMS::Key", {
            "KeyPolicy": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Sid": "EnableCloudWatchLogsEncryption",
                        "Action": Match.array_with([
                            "kms:Encrypt",
                            "kms:Decrypt"
                        ])
                    })
                ])
            })
        })


@mark.describe("TapStack - VPC Configuration")
class TestVPCConfiguration(unittest.TestCase):
    """Test cases for VPC configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates a VPC with private isolated subnets")
    def test_vpc_with_private_subnets(self):
        """Test VPC is created with private isolated subnets."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates VPC without NAT gateways")
    def test_no_nat_gateways(self):
        """Test VPC has no NAT gateways for isolation."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::EC2::NatGateway", 0)

    @mark.it("creates S3 gateway VPC endpoint")
    def test_s3_vpc_endpoint(self):
        """Test S3 gateway VPC endpoint is created."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::VPCEndpoint", {
            "ServiceName": Match.object_like({
                "Fn::Join": Match.array_with([
                    "",
                    Match.array_with([
                        "com.amazonaws.",
                        Match.any_value(),
                        ".s3"
                    ])
                ])
            }),
            "VpcEndpointType": "Gateway"
        })

    @mark.it("creates DynamoDB gateway VPC endpoint")
    def test_dynamodb_vpc_endpoint(self):
        """Test DynamoDB gateway VPC endpoint is created."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::VPCEndpoint", {
            "ServiceName": Match.object_like({
                "Fn::Join": Match.array_with([
                    "",
                    Match.array_with([
                        "com.amazonaws.",
                        Match.any_value(),
                        ".dynamodb"
                    ])
                ])
            }),
            "VpcEndpointType": "Gateway"
        })

    @mark.it("creates Secrets Manager interface VPC endpoint")
    def test_secrets_manager_vpc_endpoint(self):
        """Test Secrets Manager interface VPC endpoint is created."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::VPCEndpoint", {
            "VpcEndpointType": "Interface",
            "PrivateDnsEnabled": True,
            "ServiceName": Match.object_like({
                "Fn::Join": Match.array_with([
                    "",
                    Match.array_with([
                        "com.amazonaws.",
                        Match.any_value(),
                        ".secretsmanager"
                    ])
                ])
            })
        })

    @mark.it("creates VPC endpoint security group")
    def test_vpc_endpoint_security_group(self):
        """Test security group is created for VPC endpoints."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for VPC endpoints",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443
                })
            ])
        })


@mark.describe("TapStack - S3 Buckets Configuration")
class TestS3BucketsConfiguration(unittest.TestCase):
    """Test cases for S3 bucket configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates three S3 buckets")
    def test_creates_three_buckets(self):
        """Test three S3 buckets are created."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::S3::Bucket", 3)

    @mark.it("creates S3 buckets with KMS encryption")
    def test_s3_buckets_kms_encryption(self):
        """Test S3 buckets use KMS encryption."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": Match.object_like({
                            "SSEAlgorithm": "aws:kms"
                        })
                    })
                ])
            })
        })

    @mark.it("creates S3 buckets with versioning enabled")
    def test_s3_buckets_versioning(self):
        """Test S3 buckets have versioning enabled."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
    template = Template.from_stack(stack)

    template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    @mark.it("creates S3 buckets with public access blocked")
    def test_s3_buckets_public_access_blocked(self):
        """Test S3 buckets block public access."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
    template = Template.from_stack(stack)

    template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates bucket policy denying unencrypted uploads")
    def test_bucket_policy_deny_unencrypted(self):
        """Test bucket policy denies unencrypted uploads."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::BucketPolicy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Sid": "DenyUnencryptedObjectUploads",
                        "Effect": "Deny",
                        "Action": "s3:PutObject",
                        "Condition": Match.object_like({
                            "StringNotEquals": Match.object_like({
                                "s3:x-amz-server-side-encryption": "aws:kms"
                            })
                        })
                    })
                ])
            })
        })


@mark.describe("TapStack - CloudWatch Log Groups")
class TestCloudWatchLogGroups(unittest.TestCase):
    """Test cases for CloudWatch log groups."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates CloudWatch log groups with KMS encryption")
    def test_log_groups_kms_encryption(self):
        """Test log groups use KMS encryption."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Logs::LogGroup", {
            "KmsKeyId": Match.any_value()
        })

    @mark.it("creates CloudWatch log groups with 90-day retention")
    def test_log_groups_retention(self):
        """Test log groups have 90-day retention."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 90
        })

    @mark.it("creates Lambda log group")
    def test_lambda_log_group(self):
        """Test Lambda log group is created."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/data-processor-{self.env_suffix}"
        })

    @mark.it("creates API Gateway log group")
    def test_api_gateway_log_group(self):
        """Test API Gateway log group is created."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/apigateway/data-pipeline-{self.env_suffix}"
        })


@mark.describe("TapStack - DynamoDB Table")
class TestDynamoDBTable(unittest.TestCase):
    """Test cases for DynamoDB table."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates DynamoDB table with correct schema")
    def test_dynamodb_table_schema(self):
        """Test DynamoDB table has correct schema."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {"AttributeName": "processing_id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "AttributeDefinitions": Match.array_with([
                {"AttributeName": "processing_id", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "N"}
            ])
        })

    @mark.it("creates DynamoDB table with point-in-time recovery enabled")
    def test_dynamodb_table_pitr(self):
        """Test DynamoDB table has point-in-time recovery enabled."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates DynamoDB table with KMS encryption")
    def test_dynamodb_table_encryption(self):
        """Test DynamoDB table uses customer-managed KMS encryption."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": Match.object_like({
                "SSEEnabled": True,
                "SSEType": "KMS"
            })
        })

    @mark.it("creates DynamoDB table with PAY_PER_REQUEST billing")
    def test_dynamodb_table_billing(self):
        """Test DynamoDB table uses PAY_PER_REQUEST billing."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST"
        })


@mark.describe("TapStack - Secrets Manager")
class TestSecretsManager(unittest.TestCase):
    """Test cases for Secrets Manager secret."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates Secrets Manager secret with KMS encryption")
    def test_secret_kms_encryption(self):
        """Test secret uses KMS encryption."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "KmsKeyId": Match.any_value(),
            "Description": "API certificates for mutual TLS authentication"
        })

    @mark.it("creates Secrets Manager secret with rotation schedule")
    def test_secret_rotation(self):
        """Test secret has rotation schedule."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource("AWS::SecretsManager::RotationSchedule", {})


@mark.describe("TapStack - Lambda Function")
class TestLambdaFunction(unittest.TestCase):
    """Test cases for Lambda function."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates Lambda function with 512MB memory")
    def test_lambda_memory(self):
        """Test Lambda function has 512MB memory."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 512
        })

    @mark.it("creates Lambda function with 5-minute timeout")
    def test_lambda_timeout(self):
        """Test Lambda function has 5-minute timeout."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "Timeout": 300
        })

    @mark.it("creates Lambda function in VPC")
    def test_lambda_vpc_config(self):
        """Test Lambda function runs in VPC."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.object_like({
                "SubnetIds": Match.any_value(),
                "SecurityGroupIds": Match.any_value()
            })
        })

    @mark.it("creates Lambda function with environment variables")
    def test_lambda_environment_variables(self):
        """Test Lambda function has required environment variables."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": Match.object_like({
                "Variables": Match.object_like({
                    "DYNAMODB_TABLE_NAME": Match.any_value(),
                    "RAW_BUCKET": Match.any_value(),
                    "PROCESSED_BUCKET": Match.any_value(),
                    "KMS_KEY_ID": Match.any_value()
                })
            })
        })

    @mark.it("creates Lambda function with Python 3.12 runtime")
    def test_lambda_runtime(self):
        """Test Lambda function uses Python 3.12."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.12"
        })

    @mark.it("creates Lambda security group with restricted egress")
    def test_lambda_security_group(self):
        """Test Lambda security group restricts egress to VPC."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for data processing Lambda",
            "SecurityGroupEgress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443
                })
            ])
        })


@mark.describe("TapStack - API Gateway")
class TestAPIGateway(unittest.TestCase):
    """Test cases for API Gateway."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates API Gateway REST API")
    def test_api_gateway_created(self):
        """Test API Gateway is created."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    @mark.it("creates API Gateway with regional endpoint")
    def test_api_gateway_endpoint_type(self):
        """Test API Gateway uses regional endpoint."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "EndpointConfiguration": {
                "Types": ["REGIONAL"]
            }
        })

    @mark.it("creates API Gateway with Lambda integration")
    def test_api_gateway_lambda_integration(self):
        """Test API Gateway integrates with Lambda."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST",
            "AuthorizationType": "AWS_IAM",
            "Integration": Match.object_like({
                "Type": "AWS_PROXY"
            })
        })

    @mark.it("creates API Gateway usage plan")
    def test_api_gateway_usage_plan(self):
        """Test API Gateway usage plan is created."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::UsagePlan", {
            "Throttle": Match.object_like({
                "RateLimit": 100,
                "BurstLimit": 200
            }),
            "Quota": Match.object_like({
                "Limit": 10000,
                "Period": "DAY"
            })
        })

    @mark.it("creates API Gateway API key")
    def test_api_gateway_api_key(self):
        """Test API Gateway API key is created."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::ApiKey", {
            "Enabled": True
        })


@mark.describe("TapStack - Stack Outputs")
class TestStackOutputs(unittest.TestCase):
    """Test cases for stack outputs."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("outputs KMS key ARN")
    def test_kms_key_output(self):
        """Test KMS key ARN is exported."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_output("KMSKeyARN", {
            "Description": "ARN of the customer-managed KMS key",
            "Export": {"Name": f"DataPipelineKMSKeyARN-{self.env_suffix}"}
        })

    @mark.it("outputs API Gateway endpoint URL")
    def test_api_gateway_output(self):
        """Test API Gateway endpoint is exported."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_output("APIGatewayEndpoint", {
            "Description": "API Gateway endpoint URL",
            "Export": {"Name": f"DataPipelineAPIEndpoint-{self.env_suffix}"}
        })

    @mark.it("outputs VPC endpoint IDs")
    def test_vpc_endpoint_outputs(self):
        """Test VPC endpoint IDs are exported."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_output("S3VPCEndpointID", {})
        template.has_output("DynamoDBVPCEndpointID", {})
        template.has_output("SecretsManagerVPCEndpointID", {})

    @mark.it("outputs resource names")
    def test_resource_name_outputs(self):
        """Test resource names are exported."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_output("RawDataBucketName", {})
        template.has_output("ProcessedDataBucketName", {})
        template.has_output("DynamoDBTableName", {})
        template.has_output("LambdaFunctionName", {})


@mark.describe("TapStack - IAM Policies")
class TestIAMPolicies(unittest.TestCase):
    """Test cases for IAM policies."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("creates Lambda role with VPC access policy")
    def test_lambda_vpc_access_policy(self):
        """Test Lambda role has VPC access managed policy."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::IAM::Role", {
            "ManagedPolicyArns": Match.array_with([
                Match.object_like({
                    "Fn::Join": Match.array_with([
                        "",
                        Match.array_with([
                            "arn:",
                            Match.any_value(),
                            ":iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
                        ])
                    ])
                })
            ])
        })

    @mark.it("creates Lambda role with minimal S3 permissions")
    def test_lambda_s3_permissions(self):
        """Test Lambda role has minimal S3 permissions."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Sid": "MinimalS3Read",
                        "Effect": "Allow",
                        "Action": ["s3:GetObject", "s3:GetObjectVersion"]
                    })
                ])
            })
        })


@mark.describe("TapStack - Default Configuration")
class TestDefaultConfiguration(unittest.TestCase):
    """Test cases for default configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()

    @mark.it("defaults environment suffix to dev if not provided")
    def test_default_env_suffix(self):
        """Test environment suffix defaults to dev."""
        stack = TapStack(self.app, "TestStack")
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "data-pipeline-metadata-dev"
        })

    @mark.it("accepts environment suffix from props")
    def test_custom_env_suffix(self):
        """Test environment suffix can be customized."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix="staging")
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "data-pipeline-metadata-staging"
        })


@mark.describe("TapStack - Removal Policies")
class TestRemovalPolicies(unittest.TestCase):
    """Test cases for removal policies."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env_suffix = "test"

    @mark.it("sets DESTROY removal policy for KMS key")
    def test_kms_key_removal_policy(self):
        """Test KMS key has DESTROY removal policy."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource("AWS::KMS::Key", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

    @mark.it("sets DESTROY removal policy for S3 buckets")
    def test_s3_bucket_removal_policy(self):
        """Test S3 buckets have DESTROY removal policy."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

    @mark.it("sets DESTROY removal policy for DynamoDB table")
    def test_dynamodb_removal_policy(self):
        """Test DynamoDB table has DESTROY removal policy."""
        stack = TapStack(
            self.app, "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        template.has_resource("AWS::DynamoDB::Table", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })


if __name__ == '__main__':
    unittest.main()
