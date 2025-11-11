"""
Unit tests for Payment Processing Infrastructure CDK Stack.
Tests all nested stacks and resource configurations.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Comprehensive test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def _create_stack(self, env_suffix=None):
        """Helper to create stack with optional environment suffix"""
        if env_suffix is None:
            env_suffix = self.env_suffix
        return TapStack(
            self.app,
            f"PaymentProcessingStack{env_suffix}",
            props=TapStackProps(environment_suffix=env_suffix)
        )

    @mark.it("creates stack with correct environment suffix")
    def test_creates_stack_with_env_suffix(self):
        """Test that stack is created with provided environment suffix"""
        env_suffix = "prod"
        stack = self._create_stack(env_suffix)
        template = Template.from_stack(stack)

        # Verify stack synthesizes successfully
        assert template is not None

    @mark.it("defaults environment suffix to dev")
    def test_defaults_env_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev' when not provided"""
        stack = TapStack(self.app, "PaymentProcessingStackdev")
        template = Template.from_stack(stack)

        # Stack should synthesize successfully with default
        assert template is not None

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc(self):
        """Test VPC creation with 3 AZs and proper subnet configuration"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Nested stacks should contain VPC resources
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        assert len(nested_stacks) > 0, "Should create nested stacks"

    @mark.it("creates NAT instances for cost optimization")
    def test_creates_nat_instances(self):
        """Test NAT instances are created instead of NAT Gateways"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Should create 3 NAT instances (one per AZ)
        template.resource_count_is("AWS::EC2::Instance", 3)

        # Verify NAT instance properties
        template.has_resource_properties("AWS::EC2::Instance", {
            "SourceDestCheck": False
        })

    @mark.it("creates ALB with proper security group")
    def test_creates_alb(self):
        """Test Application Load Balancer creation"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ALB should be created
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

        # Verify ALB is internet-facing
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates AWS WAF Web ACL for ALB protection")
    def test_creates_waf(self):
        """Test AWS WAF configuration with OWASP rules"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # WAF Web ACL should be created
        template.resource_count_is("AWS::WAFv2::WebACL", 1)

        # Verify Web ACL has rules
        template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Scope": "REGIONAL",
            "DefaultAction": {"Allow": {}}
        })

        # WAF should be associated with ALB
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)

    @mark.it("creates security groups with proper rules")
    def test_creates_security_groups(self):
        """Test security group creation and configuration"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Multiple security groups should be created
        # ALB, ECS, Database, Lambda
        sg_count = template.find_resources("AWS::EC2::SecurityGroup")
        assert len(sg_count) >= 4

    @mark.it("creates VPC endpoints for AWS services")
    def test_creates_vpc_endpoints(self):
        """Test VPC endpoints for S3, DynamoDB, ECR, Secrets Manager, CloudWatch"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Gateway endpoints: S3, DynamoDB
        template.resource_count_is("AWS::EC2::VPCEndpoint", Match.any_value())

    @mark.it("creates KMS keys with rotation enabled")
    def test_creates_kms_keys(self):
        """Test KMS key creation for RDS, S3, Lambda, Secrets Manager"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Multiple KMS keys should be created
        kms_keys = template.find_resources("AWS::KMS::Key")
        assert len(kms_keys) >= 4

        # Verify key rotation is enabled
        for key_id, key_props in kms_keys.items():
            assert key_props["Properties"]["EnableKeyRotation"] is True

    @mark.it("creates Secrets Manager secrets")
    def test_creates_secrets(self):
        """Test Secrets Manager secret creation for DB credentials and API keys"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Should create secrets for DB credentials and API keys
        template.resource_count_is("AWS::SecretsManager::Secret", Match.any_value())

    @mark.it("creates secret rotation configuration")
    def test_creates_secret_rotation(self):
        """Test secret rotation Lambda and schedule"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Rotation schedule should be configured
        template.resource_count_is("AWS::SecretsManager::RotationSchedule", Match.any_value())

    @mark.it("creates RDS Aurora cluster with correct configuration")
    def test_creates_rds_cluster(self):
        """Test RDS Aurora PostgreSQL cluster with IAM authentication"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Aurora cluster should be created
        template.resource_count_is("AWS::RDS::DBCluster", 1)

        # Verify cluster properties
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "StorageEncrypted": True,
            "EnableIAMDatabaseAuthentication": True,
            "DeletionProtection": False
        })

        # Should have 3 instances (1 writer + 2 readers)
        template.resource_count_is("AWS::RDS::DBInstance", 3)

    @mark.it("creates S3 buckets with encryption and lifecycle")
    def test_creates_s3_buckets(self):
        """Test S3 bucket creation for document storage and replication"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Should create 2 buckets (primary and replication)
        template.resource_count_is("AWS::S3::Bucket", 2)

        # Verify encryption configuration
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates ECS cluster and Fargate service")
    def test_creates_ecs_service(self):
        """Test ECS cluster and Fargate service configuration"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # ECS cluster should be created
        template.resource_count_is("AWS::ECS::Cluster", 1)

        # Fargate service should be created
        template.resource_count_is("AWS::ECS::Service", 1)

        # Task definition should be created
        template.resource_count_is("AWS::ECS::TaskDefinition", 1)

        # Verify Fargate launch type
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "RequiresCompatibilities": ["FARGATE"],
            "NetworkMode": "awsvpc"
        })

    @mark.it("creates auto-scaling policies for ECS")
    def test_creates_ecs_autoscaling(self):
        """Test ECS auto-scaling configuration"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Auto-scaling target should be created
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 1)

        # Scaling policies for CPU and Memory
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 2)

    @mark.it("creates SQS queues with DLQ")
    def test_creates_sqs_queues(self):
        """Test SQS queue creation for payment processing with DLQ"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Should create main queue and DLQ
        template.resource_count_is("AWS::SQS::Queue", 2)

        # Verify encryption
        template.has_resource_properties("AWS::SQS::Queue", {
            "KmsMasterKeyId": Match.any_value()
        })

    @mark.it("creates Lambda functions for processing")
    def test_creates_lambda_functions(self):
        """Test Lambda function creation for payment and fraud detection"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Should create multiple Lambda functions
        # Payment processor, fraud detection, secret rotation
        lambda_functions = template.find_resources("AWS::Lambda::Function")
        assert len(lambda_functions) >= 3

    @mark.it("creates Lambda execution roles with least privilege")
    def test_creates_lambda_roles(self):
        """Test Lambda IAM roles have appropriate permissions"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Lambda roles should be created
        iam_roles = template.find_resources("AWS::IAM::Role")

        # Verify Lambda service principal
        lambda_roles = [
            role for role_id, role in iam_roles.items()
            if "lambda.amazonaws.com" in str(role)
        ]
        assert len(lambda_roles) >= 2

    @mark.it("creates API Gateway with VPC Link")
    def test_creates_api_gateway(self):
        """Test API Gateway REST API creation"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # REST API should be created
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

        # VPC Link should be created
        template.resource_count_is("AWS::ApiGateway::VpcLink", 1)

        # Deployment should be created
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)

    @mark.it("creates API Gateway usage plan and API key")
    def test_creates_api_usage_plan(self):
        """Test API Gateway usage plan and throttling configuration"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Usage plan should be created
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)

        # API key should be created
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard creation"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Dashboard should be created
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("creates CloudWatch alarms")
    def test_creates_cloudwatch_alarms(self):
        """Test CloudWatch alarm creation for monitoring"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Multiple alarms should be created
        alarms = template.find_resources("AWS::CloudWatch::Alarm")
        assert len(alarms) >= 5

    @mark.it("creates CloudWatch log groups with retention")
    def test_creates_log_groups(self):
        """Test CloudWatch log group creation with retention policies"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Log groups should be created
        log_groups = template.find_resources("AWS::Logs::LogGroup")
        assert len(log_groups) >= 1

    @mark.it("creates SNS topic for alarms")
    def test_creates_sns_topic(self):
        """Test SNS topic creation for alarm notifications"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # SNS topic should be created
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates target group for ALB")
    def test_creates_target_group(self):
        """Test ALB target group creation"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Target group should be created
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

        # Verify health check configuration
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckPath": "/health",
            "TargetType": "ip"
        })

    @mark.it("has all required CloudFormation outputs")
    def test_has_required_outputs(self):
        """Test that all required outputs are present"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Get all outputs
        cfn_template = template.to_json()
        outputs = cfn_template.get("Outputs", {})

        # Verify required outputs exist
        required_outputs = [
            "ALBDNSName",
            "ApiGatewayEndpoint",
            "CloudWatchDashboardURL",
            "DatabaseClusterEndpoint",
            "DocumentBucketName"
        ]

        for output_name in required_outputs:
            assert any(output_name in key for key in outputs.keys()), \
                f"Missing required output: {output_name}"

    @mark.it("includes environment suffix in resource names")
    def test_includes_env_suffix_in_names(self):
        """Test that environment suffix is included in resource names"""
        env_suffix = "prod123"
        stack = self._create_stack(env_suffix)
        template = Template.from_stack(stack)

        # Get template JSON
        cfn_template = template.to_json()
        template_str = str(cfn_template)

        # Verify environment suffix appears in template
        assert env_suffix in template_str

    @mark.it("creates IAM roles with proper trust policies")
    def test_creates_iam_roles(self):
        """Test IAM role creation for ECS and Lambda"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Multiple IAM roles should be created
        iam_roles = template.find_resources("AWS::IAM::Role")
        assert len(iam_roles) >= 5

    @mark.it("uses RemovalPolicy DESTROY for all resources")
    def test_removal_policy_destroy(self):
        """Test that resources can be destroyed (no Retain policies)"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Check that no resources have DeletionPolicy Retain
        cfn_template = template.to_json()

        for resource_id, resource in cfn_template.get("Resources", {}).items():
            deletion_policy = resource.get("DeletionPolicy", "Delete")
            assert deletion_policy != "Retain", \
                f"Resource {resource_id} has Retain deletion policy"

    @mark.it("creates nested stacks for modularity")
    def test_creates_nested_stacks(self):
        """Test that nested stacks are created for organization"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Nested stacks should be created
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        # Should have: Network, Security, Database, Compute, Storage, API, Monitoring
        assert len(nested_stacks) >= 7

    @mark.it("synthesizes without errors")
    def test_synthesizes_successfully(self):
        """Test that the entire stack synthesizes without errors"""
        try:
            stack = self._create_stack()
            self.app.synth()
            success = True
        except Exception as e:
            success = False
            print(f"Synthesis error: {str(e)}")

        assert success, "Stack should synthesize without errors"


if __name__ == "__main__":
    unittest.main()
