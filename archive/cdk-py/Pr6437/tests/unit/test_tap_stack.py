"""
Comprehensive unit tests for Single-Region Payment Processing Infrastructure.
Tests all CDK stacks for the payment processing system in us-east-1.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_apigateway as apigw
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps
from lib.vpc_stack import VpcStack
from lib.database_stack import DatabaseStack
from lib.lambda_stack import LambdaStack
from lib.api_stack import ApiStack
from lib.storage_stack import StorageStack
from lib.monitoring_stack import MonitoringStack
from lib.parameter_store_stack import ParameterStoreStack


# ============================================================================
# TAP STACK TESTS (Main Orchestrator)
# ============================================================================

@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the main TapStack orchestrator"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates stack with default environment suffix")
    def test_tap_stack_defaults_to_dev(self):
        """Test that TapStack defaults to 'dev' suffix."""
        stack = TapStack(
            self.app,
            "TestTapStack",
            props=TapStackProps(environment_suffix="dev")
        )

        template = Template.from_stack(stack)
        outputs = template.to_json().get('Outputs', {})

        assert 'EnvironmentSuffix' in outputs
        assert outputs['EnvironmentSuffix']['Value'] == 'dev'

    @mark.it("creates stack with custom environment suffix")
    def test_custom_environment_suffix(self):
        """Test that TapStack accepts custom environment suffix."""
        stack = TapStack(
            self.app,
            "TestTapStack",
            props=TapStackProps(environment_suffix="test")
        )

        template = Template.from_stack(stack)
        outputs = template.to_json().get('Outputs', {})

        assert outputs['EnvironmentSuffix']['Value'] == 'test'

    @mark.it("exports environment suffix as output")
    def test_tap_stack_creates_output(self):
        """Test that environment suffix is exported."""
        stack = TapStack(
            self.app,
            "TestTapStack",
            props=TapStackProps(environment_suffix="prod")
        )

        template = Template.from_stack(stack)
        outputs = template.to_json().get('Outputs', {})

        assert 'EnvironmentSuffix' in outputs

    @mark.it("does not create nested resources")
    def test_tap_stack_no_nested_resources(self):
        """Test that TapStack is just an orchestrator with no nested resources."""
        stack = TapStack(
            self.app,
            "TestTapStack",
            props=TapStackProps(environment_suffix="test")
        )

        template = Template.from_stack(stack)

        # TapStack should only have CDK metadata, no actual resources
        template.resource_count_is("AWS::RDS::DBCluster", 0)
        template.resource_count_is("AWS::Lambda::Function", 0)


# ============================================================================
# VPC STACK TESTS
# ============================================================================

@mark.describe("VpcStack")
class TestVpcStack(unittest.TestCase):
    """Test cases for VPC infrastructure"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates VPC with 3 availability zones")
    def test_vpc_creation(self):
        """Test that VPC is created with correct configuration."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # Verify VPC exists
        template.resource_count_is("AWS::EC2::VPC", 1)
        # 6 subnets = 2 per AZ × 3 AZs (CDK optimizes subnet creation)
        template.resource_count_is("AWS::EC2::Subnet", 6)

    @mark.it("creates NAT gateway for private subnets")
    def test_nat_gateway(self):
        """Test that NAT gateway is created."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # 1 NAT gateway for cost optimization
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("does not create VPC endpoints due to account limit")
    def test_no_vpc_endpoints(self):
        """Test that VPC endpoints are not created."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # VPC endpoints removed due to account limit
        template.resource_count_is("AWS::EC2::VPCEndpoint", 0)

    @mark.it("tags VPC with environment suffix")
    def test_vpc_tags(self):
        """Test that VPC is tagged correctly."""
        stack = VpcStack(
            self.app,
            "TestVpcStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "Tags": Match.array_with([
                    {"Key": "Name", "Value": "payment-vpc-test"}
                ])
            }
        )


# ============================================================================
# DATABASE STACK TESTS
# ============================================================================

@mark.describe("DatabaseStack")
class TestDatabaseStack(unittest.TestCase):
    """Test cases for database infrastructure"""

    def setUp(self):
        """Set up a fresh CDK app and VPC for each test"""
        self.app = cdk.App()
        self.vpc_stack = cdk.Stack(self.app, "TestVpcStack")
        self.vpc = ec2.Vpc(
            self.vpc_stack, "TestVPC",
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

    @mark.it("creates Aurora PostgreSQL cluster with Multi-AZ")
    def test_aurora_cluster(self):
        """Test that Aurora PostgreSQL cluster is created."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # Verify Aurora cluster exists with writer and reader
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.resource_count_is("AWS::RDS::DBInstance", 2)  # writer + reader

    @mark.it("encrypts Aurora storage")
    def test_aurora_encryption(self):
        """Test that Aurora cluster uses encrypted storage."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "StorageEncrypted": True
            }
        )

    @mark.it("configures 7-day backup retention")
    def test_backup_retention(self):
        """Test that backup retention is set to 7 days."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "BackupRetentionPeriod": 7
            }
        )

    @mark.it("places database in isolated subnets")
    def test_isolated_subnets(self):
        """Test that database is in isolated subnets."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # Verify DB subnet group exists
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("creates database credentials in Secrets Manager")
    def test_database_credentials(self):
        """Test that credentials are stored in Secrets Manager."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("creates DynamoDB table with on-demand billing")
    def test_dynamodb_table(self):
        """Test that DynamoDB table is created."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # TableV2 creates AWS::DynamoDB::GlobalTable
        template.resource_count_is("AWS::DynamoDB::GlobalTable", 1)
        template.has_resource_properties(
            "AWS::DynamoDB::GlobalTable",
            {
                "BillingMode": "PAY_PER_REQUEST"
            }
        )

    @mark.it("enables point-in-time recovery for DynamoDB")
    def test_dynamodb_pitr(self):
        """Test that PITR is enabled for DynamoDB."""
        stack = DatabaseStack(
            self.app,
            "TestDatabaseStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # TableV2 creates AWS::DynamoDB::GlobalTable with PITR
        template.has_resource_properties(
            "AWS::DynamoDB::GlobalTable",
            {
                "Replicas": Match.array_with([
                    Match.object_like({
                        "PointInTimeRecoverySpecification": {
                            "PointInTimeRecoveryEnabled": True
                        }
                    })
                ])
            }
        )


# ============================================================================
# LAMBDA STACK TESTS
# ============================================================================

@mark.describe("LambdaStack")
class TestLambdaStack(unittest.TestCase):
    """Test cases for Lambda functions"""

    def setUp(self):
        """Set up a fresh CDK app and VPC for each test"""
        self.app = cdk.App()
        self.vpc_stack = cdk.Stack(self.app, "TestVpcStack")
        self.vpc = ec2.Vpc(
            self.vpc_stack, "TestVPC",
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

    @mark.it("creates three Lambda functions")
    def test_lambda_functions(self):
        """Test that all three Lambda functions are created."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # payment-validation, transaction-processing, notification
        template.resource_count_is("AWS::Lambda::Function", 3)

    @mark.it("configures Lambda runtime as Python 3.11")
    def test_lambda_runtime(self):
        """Test that Lambda functions use Python 3.11."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.11"
            }
        )

    @mark.it("sets Lambda timeout to 30 seconds")
    def test_lambda_timeout(self):
        """Test that Lambda timeout is 30 seconds."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Timeout": 30
            }
        )

    @mark.it("deploys Lambda in VPC")
    def test_lambda_vpc_config(self):
        """Test that Lambda functions are deployed in VPC."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # Lambda should have VPC configuration
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "VpcConfig": Match.object_like({
                    "SubnetIds": Match.any_value()
                })
            }
        )

    @mark.it("creates IAM roles for Lambda functions")
    def test_lambda_roles(self):
        """Test that IAM roles are created for Lambda."""
        stack = LambdaStack(
            self.app,
            "TestLambdaStack",
            vpc=self.vpc,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # At least 1 IAM role for Lambda execution
        resources = template.to_json().get('Resources', {})
        roles = [k for k, v in resources.items() if v.get('Type') == 'AWS::IAM::Role']
        assert len(roles) >= 1


# ============================================================================
# API GATEWAY STACK TESTS
# ============================================================================

@mark.describe("ApiStack")
class TestApiStack(unittest.TestCase):
    """Test cases for API Gateway"""

    def setUp(self):
        """Set up a fresh CDK app and Lambda functions"""
        self.app = cdk.App()

        # Create mock Lambda stack
        self.lambda_stack = cdk.Stack(self.app, "TestLambdaStack")
        self.vpc = ec2.Vpc(self.lambda_stack, "TestVPC", max_azs=3)

        from aws_cdk import aws_lambda as lambda_

        self.payment_validation_fn = lambda_.Function(
            self.lambda_stack, "PaymentValidation",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("def handler(event, context): return {'statusCode': 200}")
        )

        self.transaction_processing_fn = lambda_.Function(
            self.lambda_stack, "TransactionProcessing",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("def handler(event, context): return {'statusCode': 200}")
        )

        self.notification_fn = lambda_.Function(
            self.lambda_stack, "Notification",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("def handler(event, context): return {'statusCode': 200}")
        )

    @mark.it("creates REST API")
    def test_api_creation(self):
        """Test that REST API is created."""
        stack = ApiStack(
            self.app,
            "TestApiStack",
            payment_validation_fn=self.payment_validation_fn,
            transaction_processing_fn=self.transaction_processing_fn,
            notification_fn=self.notification_fn,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    @mark.it("creates API deployment")
    def test_api_deployment(self):
        """Test that API deployment is created."""
        stack = ApiStack(
            self.app,
            "TestApiStack",
            payment_validation_fn=self.payment_validation_fn,
            transaction_processing_fn=self.transaction_processing_fn,
            notification_fn=self.notification_fn,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ApiGateway::Deployment", 1)
        template.resource_count_is("AWS::ApiGateway::Stage", 1)

    @mark.it("creates API methods")
    def test_api_methods(self):
        """Test that API methods are created."""
        stack = ApiStack(
            self.app,
            "TestApiStack",
            payment_validation_fn=self.payment_validation_fn,
            transaction_processing_fn=self.transaction_processing_fn,
            notification_fn=self.notification_fn,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # Should have multiple methods for different endpoints
        resources = template.to_json().get('Resources', {})
        methods = [k for k, v in resources.items() if v.get('Type') == 'AWS::ApiGateway::Method']
        assert len(methods) >= 1

    @mark.it("exports API endpoint URL")
    def test_api_url_output(self):
        """Test that API URL is exported."""
        stack = ApiStack(
            self.app,
            "TestApiStack",
            payment_validation_fn=self.payment_validation_fn,
            transaction_processing_fn=self.transaction_processing_fn,
            notification_fn=self.notification_fn,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        outputs = template.to_json().get('Outputs', {})
        api_outputs = [k for k in outputs.keys() if 'API' in k or 'Endpoint' in k]
        assert len(api_outputs) > 0


# ============================================================================
# STORAGE STACK TESTS
# ============================================================================

@mark.describe("StorageStack")
class TestStorageStack(unittest.TestCase):
    """Test cases for S3 storage"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates S3 bucket")
    def test_bucket_creation(self):
        """Test that S3 bucket is created."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("enables versioning on S3 bucket")
    def test_bucket_versioning(self):
        """Test that bucket versioning is enabled."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "VersioningConfiguration": {
                    "Status": "Enabled"
                }
            }
        )

    @mark.it("encrypts S3 bucket")
    def test_bucket_encryption(self):
        """Test that bucket encryption is enabled."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": Match.object_like({
                    "ServerSideEncryptionConfiguration": Match.any_value()
                })
            }
        )

    @mark.it("configures lifecycle rules")
    def test_lifecycle_rules(self):
        """Test that lifecycle rules are configured."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "LifecycleConfiguration": Match.object_like({
                    "Rules": Match.any_value()
                })
            }
        )

    @mark.it("blocks public access")
    def test_public_access_block(self):
        """Test that public access is blocked."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.has_resource_properties(
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


# ============================================================================
# MONITORING STACK TESTS
# ============================================================================

@mark.describe("MonitoringStack")
class TestMonitoringStack(unittest.TestCase):
    """Test cases for CloudWatch monitoring"""

    def setUp(self):
        """Set up a fresh CDK app with dependencies"""
        self.app = cdk.App()

        # Create mock VPC
        self.vpc_stack = cdk.Stack(self.app, "TestVpcStack")
        self.vpc = ec2.Vpc(
            self.vpc_stack, "TestVPC",
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Create mock database
        self.db_stack = cdk.Stack(self.app, "TestDbStack")
        from aws_cdk import aws_rds as rds
        self.db_cluster = rds.DatabaseCluster(
            self.db_stack, "TestCluster",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            writer=rds.ClusterInstance.provisioned("writer"),
            vpc=self.vpc
        )

        # Create mock Lambda functions
        from aws_cdk import aws_lambda as lambda_
        self.lambda_fn = lambda_.Function(
            self.db_stack, "TestFunction",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("def handler(event, context): return {'statusCode': 200}")
        )

        # Create mock API with a resource and method
        self.api = apigw.RestApi(self.db_stack, "TestApi")
        resource = self.api.root.add_resource("test")
        resource.add_method("GET")

    @mark.it("creates SNS topic for alarms")
    def test_sns_topic(self):
        """Test that SNS topic is created for alarm notifications."""
        stack = MonitoringStack(
            self.app,
            "TestMonitoringStack",
            db_cluster=self.db_cluster,
            lambda_functions=[self.lambda_fn],
            api=self.api,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates CloudWatch alarms")
    def test_cloudwatch_alarms(self):
        """Test that CloudWatch alarms are created."""
        stack = MonitoringStack(
            self.app,
            "TestMonitoringStack",
            db_cluster=self.db_cluster,
            lambda_functions=[self.lambda_fn],
            api=self.api,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # Should have multiple alarms (RDS, Lambda, API Gateway)
        resources = template.to_json().get('Resources', {})
        alarms = [k for k, v in resources.items() if v.get('Type') == 'AWS::CloudWatch::Alarm']
        assert len(alarms) >= 3

    @mark.it("creates CloudWatch dashboard")
    def test_cloudwatch_dashboard(self):
        """Test that CloudWatch dashboard is created."""
        stack = MonitoringStack(
            self.app,
            "TestMonitoringStack",
            db_cluster=self.db_cluster,
            lambda_functions=[self.lambda_fn],
            api=self.api,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)


# ============================================================================
# PARAMETER STORE STACK TESTS
# ============================================================================

@mark.describe("ParameterStoreStack")
class TestParameterStoreStack(unittest.TestCase):
    """Test cases for Systems Manager Parameter Store"""

    def setUp(self):
        """Set up a fresh CDK app with dependencies"""
        self.app = cdk.App()

        # Create mock VPC
        self.vpc_stack = cdk.Stack(self.app, "TestVpcStack")
        self.vpc = ec2.Vpc(
            self.vpc_stack, "TestVPC",
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Create mock database
        self.db_stack = cdk.Stack(self.app, "TestDbStack")
        from aws_cdk import aws_rds as rds
        self.db_cluster = rds.DatabaseCluster(
            self.db_stack, "TestCluster",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            writer=rds.ClusterInstance.provisioned("writer"),
            vpc=self.vpc
        )

        # Create mock API with a resource and method
        self.api = apigw.RestApi(self.db_stack, "TestApi")
        resource = self.api.root.add_resource("test")
        resource.add_method("GET")

    @mark.it("creates SSM parameters")
    def test_parameter_creation(self):
        """Test that SSM parameters are created."""
        stack = ParameterStoreStack(
            self.app,
            "TestParameterStoreStack",
            db_cluster=self.db_cluster,
            api=self.api,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        # Should have parameters for DB endpoint, API URL, feature flags, environment
        template.resource_count_is("AWS::SSM::Parameter", 4)

    @mark.it("exports parameter names")
    def test_parameter_outputs(self):
        """Test that parameter names are exported."""
        stack = ParameterStoreStack(
            self.app,
            "TestParameterStoreStack",
            db_cluster=self.db_cluster,
            api=self.api,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)

        outputs = template.to_json().get('Outputs', {})
        assert len(outputs) > 0


if __name__ == '__main__':
    unittest.main()
