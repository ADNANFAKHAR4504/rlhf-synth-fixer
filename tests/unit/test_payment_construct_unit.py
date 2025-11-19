"""
Unit tests for PaymentProcessingConstruct - comprehensive coverage
"""
import pytest
from aws_cdk import App, Stack
from aws_cdk.assertions import Template, Match
from aws_cdk import aws_kms as kms, RemovalPolicy
from lib.payment_construct import PaymentProcessingConstruct


@pytest.fixture
def app():
    """Create CDK App instance"""
    return App()


@pytest.fixture
def stack(app):
    """Create a test stack"""
    return Stack(app, "TestStack")


@pytest.fixture
def kms_key(stack):
    """Create a KMS key for testing"""
    return kms.Key(
        stack,
        "TestKey",
        removal_policy=RemovalPolicy.DESTROY,
        enable_key_rotation=True
    )


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


class TestPaymentConstructStructure:
    """Test basic construct structure"""

    def test_construct_creates_successfully(self, stack, kms_key, dev_env_config):
        """Test that construct can be created without errors"""
        construct = PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        assert construct is not None
        assert construct.table is not None
        assert construct.bucket is not None
        assert construct.function is not None
        assert construct.api is not None

    def test_construct_creates_all_resources(self, stack, kms_key, dev_env_config):
        """Test that construct creates all required resources"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # Should have DynamoDB, S3, Lambda, API Gateway
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.resource_count_is("AWS::S3::Bucket", 1)
        assert len([r for r in template.to_json()["Resources"].values()
                   if r["Type"] == "AWS::Lambda::Function"]) >= 1
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)


class TestConstructDynamoDBTable:
    """Test DynamoDB table creation in construct"""

    def test_table_has_correct_name(self, stack, kms_key, dev_env_config):
        """Test table name includes environment suffix"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "payment-data-test123"
        })

    def test_table_dev_uses_on_demand(self, stack, kms_key, dev_env_config):
        """Test dev uses PAY_PER_REQUEST billing"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST"
        })

    def test_table_production_uses_provisioned(self, stack, kms_key, production_env_config):
        """Test production uses PROVISIONED billing"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=production_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            }
        })

    def test_table_has_encryption(self, stack, kms_key, dev_env_config):
        """Test table has KMS encryption"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True,
                "SSEType": "KMS"
            }
        })

    def test_table_has_correct_key(self, stack, kms_key, dev_env_config):
        """Test table has correct partition key"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {"AttributeName": "id", "KeyType": "HASH"}
            ]
        })


class TestConstructS3Bucket:
    """Test S3 bucket creation in construct"""

    def test_bucket_has_correct_name(self, stack, kms_key, dev_env_config):
        """Test bucket name includes environment suffix"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "payment-data-test123"
        })

    def test_bucket_has_versioning(self, stack, kms_key, dev_env_config):
        """Test bucket has versioning enabled"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    def test_bucket_has_encryption(self, stack, kms_key, dev_env_config):
        """Test bucket has KMS encryption"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

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

    def test_bucket_dev_has_30_day_glacier(self, stack, kms_key, dev_env_config):
        """Test dev bucket has 30-day Glacier transition"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": [
                    Match.object_like({
                        "Status": "Enabled",
                        "Transitions": [
                            {
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 30
                            }
                        ]
                    })
                ]
            }
        })

    def test_bucket_production_has_90_day_glacier(self, stack, kms_key, production_env_config):
        """Test production bucket has 90-day Glacier transition"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=production_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": [
                    Match.object_like({
                        "Status": "Enabled",
                        "Transitions": [
                            {
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 90
                            }
                        ]
                    })
                ]
            }
        })


class TestConstructLambdaFunction:
    """Test Lambda function creation in construct"""

    def test_function_has_correct_name(self, stack, kms_key, dev_env_config):
        """Test function name includes environment suffix"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # Find the payment construct function (not custom resource functions)
        functions = template.find_resources("AWS::Lambda::Function")
        construct_function = None
        for logical_id, props in functions.items():
            if "payment-construct-fn" in props["Properties"].get("FunctionName", ""):
                construct_function = props
                break

        assert construct_function is not None
        assert "test123" in construct_function["Properties"]["FunctionName"]

    def test_function_has_512mb_memory(self, stack, kms_key, dev_env_config):
        """Test function has 512MB memory"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 512
        })

    def test_function_has_30_second_timeout(self, stack, kms_key, dev_env_config):
        """Test function has 30 second timeout"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "Timeout": 30
        })

    def test_function_has_iam_role(self, stack, kms_key, dev_env_config):
        """Test function has IAM role with correct name"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "payment-construct-role-test123"
        })


class TestConstructAPIGateway:
    """Test API Gateway creation in construct"""

    def test_api_has_correct_name(self, stack, kms_key, dev_env_config):
        """Test API name includes environment suffix"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "payment-construct-api-test123"
        })

    def test_api_dev_has_100_rate_limit(self, stack, kms_key, dev_env_config):
        """Test dev API has correct throttling"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": [
                Match.object_like({
                    "ThrottlingRateLimit": 100,
                    "ThrottlingBurstLimit": 200
                })
            ]
        })

    def test_api_production_has_10000_rate_limit(self, stack, kms_key, production_env_config):
        """Test production API has correct throttling"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=production_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": [
                Match.object_like({
                    "ThrottlingRateLimit": 10000,
                    "ThrottlingBurstLimit": 20000
                })
            ]
        })


class TestConstructIntegration:
    """Test integration between construct components"""

    def test_lambda_has_table_permissions(self, stack, kms_key, dev_env_config):
        """Test Lambda has permissions to access DynamoDB table"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # Check for IAM policy granting DynamoDB permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            Match.string_like_regexp("dynamodb:.*")
                        ])
                    })
                ])
            }
        })

    def test_lambda_has_s3_permissions(self, stack, kms_key, dev_env_config):
        """Test Lambda has permissions to access S3 bucket"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # Check for IAM policy granting S3 permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            Match.string_like_regexp("s3:.*")
                        ])
                    })
                ])
            }
        })

    def test_api_integrates_with_lambda(self, stack, kms_key, dev_env_config):
        """Test API Gateway is integrated with Lambda function"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        # Check for API Gateway method with Lambda integration
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST"
        })

    def test_lambda_has_environment_variables(self, stack, kms_key, dev_env_config):
        """Test Lambda has required environment variables"""
        PaymentProcessingConstruct(
            stack,
            "TestConstruct",
            environment_suffix="test123",
            kms_key=kms_key,
            env_config=dev_env_config
        )
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "TABLE_NAME": Match.any_value(),
                    "BUCKET_NAME": Match.any_value()
                })
            }
        })
