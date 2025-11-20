"""
Unit tests for TapStack - comprehensive coverage for all methods and paths
"""
import os
import pytest
from aws_cdk import App, Aspects
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack
from lib.tagging_aspect import MandatoryTagsAspect


@pytest.fixture
def app():
    """Create CDK App instance"""
    return App()


@pytest.fixture
def dev_env_config():
    """Development environment configuration"""
    return {
        "environment": "dev",
        "region": "us-east-1",
        "account": "123456789012",
        "api_rate_limit": 100,
        "cost_center": "Engineering",
        "owner": "DevTeam",
        "data_classification": "Internal",
    }


@pytest.fixture
def staging_env_config():
    """Staging environment configuration"""
    return {
        "environment": "staging",
        "region": "us-east-1",
        "account": "123456789012",
        "api_rate_limit": 1000,
        "cost_center": "Engineering",
        "owner": "StagingTeam",
        "data_classification": "Confidential",
    }


@pytest.fixture
def production_env_config():
    """Production environment configuration"""
    return {
        "environment": "production",
        "region": "us-east-1",
        "account": "123456789012",
        "api_rate_limit": 10000,
        "cost_center": "Finance",
        "owner": "ProductionTeam",
        "data_classification": "Restricted",
    }


class TestTapStackStructure:
    """Test basic stack structure and resource counts"""

    def test_stack_creates_successfully(self, app, dev_env_config):
        """Test that stack can be created without errors"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)
        assert template is not None

    def test_stack_has_all_required_resources(self, app, dev_env_config):
        """Test that all required resource types are present"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # Verify resource types (allowing for custom resource handlers)
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::KMS::Key", 1)
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::SQS::Queue", 1)
        # Lambda count may be > 1 due to custom resource handlers
        assert len([r for r in template.to_json()["Resources"].values()
                   if r["Type"] == "AWS::Lambda::Function"]) >= 1
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)


class TestVPCConfiguration:
    """Test VPC creation and configuration"""

    def test_vpc_has_correct_name(self, app, dev_env_config):
        """Test VPC naming includes environment suffix"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": "payment-vpc-test123"}
            ])
        })

    def test_vpc_has_nat_gateway(self, app, dev_env_config):
        """Test that NAT gateway is created"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::EC2::NatGateway", 1)

    def test_vpc_has_internet_gateway(self, app, dev_env_config):
        """Test that Internet Gateway is created"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::EC2::InternetGateway", 1)


class TestKMSKeyConfiguration:
    """Test KMS key creation and configuration"""

    def test_kms_key_has_correct_alias(self, app, dev_env_config):
        """Test KMS key alias includes environment suffix"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::KMS::Alias", {
            "AliasName": "alias/payment-key-test123"
        })

    def test_kms_key_has_rotation_enabled(self, app, dev_env_config):
        """Test KMS key rotation is enabled"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    def test_kms_key_has_deletion_policy(self, app, dev_env_config):
        """Test KMS key has Delete removal policy"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource("AWS::KMS::Key", {
            "DeletionPolicy": "Delete"
        })


class TestDynamoDBConfiguration:
    """Test DynamoDB table configuration"""

    def test_dynamodb_dev_uses_on_demand_billing(self, app, dev_env_config):
        """Test dev environment uses PAY_PER_REQUEST billing"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST"
        })

    def test_dynamodb_staging_uses_on_demand_billing(self, app, staging_env_config):
        """Test staging environment uses PAY_PER_REQUEST billing"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=staging_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST"
        })

    def test_dynamodb_production_uses_provisioned_billing(self, app, production_env_config):
        """Test production uses PROVISIONED billing with 5 RCU/WCU"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=production_env_config
        )
        template = Template.from_stack(stack)

        # BillingMode may be omitted when PROVISIONED is default
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            }
        })

    def test_dynamodb_has_correct_keys(self, app, dev_env_config):
        """Test DynamoDB has correct partition and sort keys"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {"AttributeName": "transaction_id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ]
        })

    def test_dynamodb_has_encryption(self, app, dev_env_config):
        """Test DynamoDB has customer-managed encryption"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True,
                "SSEType": "KMS"
            }
        })

    def test_dynamodb_pitr_enabled_for_staging(self, app, staging_env_config):
        """Test point-in-time recovery enabled for staging"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=staging_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    def test_dynamodb_pitr_enabled_for_production(self, app, production_env_config):
        """Test point-in-time recovery enabled for production"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=production_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })


class TestS3Configuration:
    """Test S3 bucket configuration"""

    def test_s3_has_versioning_enabled(self, app, dev_env_config):
        """Test S3 bucket has versioning enabled"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    def test_s3_has_encryption(self, app, dev_env_config):
        """Test S3 bucket has KMS encryption"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # Check for encryption - KMSMasterKeyID may be present
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            }
        })

    def test_s3_dev_has_30_day_glacier_transition(self, app, dev_env_config):
        """Test dev S3 bucket transitions to Glacier after 30 days"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    {
                        "Id": "glacier-transition-test123",
                        "Status": "Enabled",
                        "Transitions": Match.array_with([
                            {
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 30
                            }
                        ])
                    }
                ])
            }
        })

    def test_s3_production_has_90_day_glacier_transition(self, app, production_env_config):
        """Test production S3 bucket transitions to Glacier after 90 days"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=production_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    {
                        "Id": "glacier-transition-test123",
                        "Status": "Enabled",
                        "Transitions": Match.array_with([
                            {
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 90
                            }
                        ])
                    }
                ])
            }
        })


class TestSQSConfiguration:
    """Test SQS DLQ configuration"""

    def test_sqs_dev_has_3_day_retention(self, app, dev_env_config):
        """Test dev DLQ has 3 day retention"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::SQS::Queue", {
            "MessageRetentionPeriod": 259200  # 3 days in seconds
        })

    def test_sqs_staging_has_7_day_retention(self, app, staging_env_config):
        """Test staging DLQ has 7 day retention"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=staging_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::SQS::Queue", {
            "MessageRetentionPeriod": 604800  # 7 days in seconds
        })

    def test_sqs_production_has_14_day_retention(self, app, production_env_config):
        """Test production DLQ has 14 day retention"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=production_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::SQS::Queue", {
            "MessageRetentionPeriod": 1209600  # 14 days in seconds
        })

    def test_sqs_has_kms_encryption(self, app, dev_env_config):
        """Test DLQ has KMS encryption"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::SQS::Queue", {
            "KmsMasterKeyId": Match.any_value()
        })


class TestLambdaConfiguration:
    """Test Lambda function configuration"""

    def test_lambda_has_512mb_memory(self, app, dev_env_config):
        """Test Lambda has 512MB memory"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 512
        })

    def test_lambda_has_30_second_timeout(self, app, dev_env_config):
        """Test Lambda has 30 second timeout"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "Timeout": 30
        })

    def test_lambda_has_environment_variables(self, app, dev_env_config):
        """Test Lambda has correct environment variables"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "TABLE_NAME": Match.any_value(),
                    "BUCKET_NAME": Match.any_value(),
                    "DLQ_URL": Match.any_value(),
                    "ENVIRONMENT": "dev"
                })
            }
        })

    def test_lambda_attached_to_vpc(self, app, dev_env_config):
        """Test Lambda is attached to VPC"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": Match.object_like({
                "SecurityGroupIds": Match.any_value(),
                "SubnetIds": Match.any_value()
            })
        })

    def test_lambda_has_dlq_configured(self, app, dev_env_config):
        """Test Lambda has dead letter queue configured"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "DeadLetterConfig": {
                "TargetArn": Match.any_value()
            }
        })


class TestAPIGatewayConfiguration:
    """Test API Gateway configuration"""

    def test_api_gateway_has_correct_name(self, app, dev_env_config):
        """Test API Gateway name includes environment suffix"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "payment-api-test123"
        })

    def test_api_dev_has_100_rate_limit(self, app, dev_env_config):
        """Test dev API has 100 req/sec rate limit"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # Check for throttling settings (may include DataTraceEnabled)
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": [
                Match.object_like({
                    "HttpMethod": "*",
                    "ResourcePath": "/*",
                    "ThrottlingRateLimit": 100,
                    "ThrottlingBurstLimit": 200
                })
            ]
        })

    def test_api_staging_has_1000_rate_limit(self, app, staging_env_config):
        """Test staging API has 1000 req/sec rate limit"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=staging_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": [
                Match.object_like({
                    "HttpMethod": "*",
                    "ResourcePath": "/*",
                    "ThrottlingRateLimit": 1000,
                    "ThrottlingBurstLimit": 2000
                })
            ]
        })

    def test_api_production_has_10000_rate_limit(self, app, production_env_config):
        """Test production API has 10000 req/sec rate limit"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=production_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": [
                Match.object_like({
                    "HttpMethod": "*",
                    "ResourcePath": "/*",
                    "ThrottlingRateLimit": 10000,
                    "ThrottlingBurstLimit": 20000
                })
            ]
        })

    def test_api_has_payments_resource(self, app, dev_env_config):
        """Test API has /payments resource"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::Resource", {
            "PathPart": "payments"
        })

    def test_api_has_api_key_required(self, app, dev_env_config):
        """Test API method requires API key"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::Method", {
            "ApiKeyRequired": True
        })


class TestCloudWatchAlarms:
    """Test CloudWatch alarm configuration"""

    def test_dev_has_no_alarms(self, app, dev_env_config):
        """Test dev environment does not create CloudWatch alarms"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::CloudWatch::Alarm", 0)

    def test_staging_has_alarms(self, app, staging_env_config):
        """Test staging environment creates CloudWatch alarms"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=staging_env_config
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::CloudWatch::Alarm", 3)

    def test_production_has_alarms(self, app, production_env_config):
        """Test production environment creates CloudWatch alarms"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=production_env_config
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::CloudWatch::Alarm", 3)


class TestStackOutputs:
    """Test CloudFormation stack outputs"""

    def test_stack_has_vpc_id_output(self, app, dev_env_config):
        """Test stack exports VPC ID"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_output("VPCId", {
            "Export": {"Name": "VPCId-test123"}
        })

    def test_stack_has_api_endpoint_output(self, app, dev_env_config):
        """Test stack exports API endpoint"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_output("APIEndpoint", {
            "Export": {"Name": "APIEndpoint-test123"}
        })

    def test_stack_has_all_required_outputs(self, app, dev_env_config):
        """Test stack has all required outputs"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # Check for all required outputs
        outputs = template.to_json()["Outputs"]
        assert "VPCId" in outputs
        assert "APIEndpoint" in outputs
        assert "LambdaFunctionArn" in outputs
        assert "LambdaFunctionName" in outputs
        assert "TransactionsTableName" in outputs
        assert "AuditBucketName" in outputs
        assert "DLQUrl" in outputs
        assert "KMSKeyId" in outputs


class TestTaggingAspect:
    """Test mandatory tagging aspect"""

    def test_tagging_aspect_applies_environment_tag(self, app, dev_env_config):
        """Test Environment tag is applied"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )

        mandatory_tags = {
            "Environment": "dev",
            "CostCenter": "Engineering",
            "Owner": "DevTeam",
            "DataClassification": "Internal",
        }
        Aspects.of(stack).add(MandatoryTagsAspect(mandatory_tags))

        template = Template.from_stack(stack)

        # Check that resources have tags
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Environment", "Value": "dev"}
            ])
        })

    def test_tagging_aspect_applies_all_required_tags(self, app, production_env_config):
        """Test all mandatory tags are applied"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=production_env_config
        )

        mandatory_tags = {
            "Environment": "production",
            "CostCenter": "Finance",
            "Owner": "ProductionTeam",
            "DataClassification": "Restricted",
        }
        Aspects.of(stack).add(MandatoryTagsAspect(mandatory_tags))

        template = Template.from_stack(stack)

        # Check VPC has all tags (among other tags like Name)
        vpc_resources = [r for r in template.to_json()["Resources"].values()
                        if r["Type"] == "AWS::EC2::VPC"]
        assert len(vpc_resources) == 1

        tags = {tag["Key"]: tag["Value"] for tag in vpc_resources[0]["Properties"]["Tags"]}
        assert tags.get("Environment") == "production"
        assert tags.get("CostCenter") == "Finance"
        assert tags.get("Owner") == "ProductionTeam"
        assert tags.get("DataClassification") == "Restricted"


class TestEnvironmentSuffixUsage:
    """Test that environment suffix is used consistently"""

    def test_all_named_resources_include_suffix(self, app, dev_env_config):
        """Test that all resources with names include environment suffix"""
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test123",
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # VPC name
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": Match.string_like_regexp(".*test123.*")}
            ])
        })

        # DynamoDB table name
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": Match.string_like_regexp(".*test123.*")
        })

        # S3 bucket name
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": Match.string_like_regexp(".*test123.*")
        })

        # SQS queue name
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": Match.string_like_regexp(".*test123.*")
        })

        # Lambda function name
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": Match.string_like_regexp(".*test123.*")
        })

        # API Gateway name
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": Match.string_like_regexp(".*test123.*")
        })

        # KMS alias
        template.has_resource_properties("AWS::KMS::Alias", {
            "AliasName": Match.string_like_regexp(".*test123.*")
        })
