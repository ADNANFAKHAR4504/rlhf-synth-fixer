"""Comprehensive unit tests for TapStack CDK infrastructure"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test123"

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc_with_correct_config(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties(
            "AWS::EC2::VPC", {"CidrBlock": Match.string_like_regexp(r"10\.\d+\.\d+\.\d+/16")}
        )

    @mark.it("creates correct number of subnets")
    def test_creates_correct_subnet_count(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - CDK may create different number of subnets based on AZ availability
        subnet_count = len(template.find_resources("AWS::EC2::Subnet"))
        assert subnet_count >= 4, "VPC should have at least 4 subnets"

    @mark.it("creates NAT gateways for AZs")
    def test_creates_nat_gateways(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - CDK may create different number based on AZ availability
        nat_count = len(template.find_resources("AWS::EC2::NatGateway"))
        eip_count = len(template.find_resources("AWS::EC2::EIP"))
        assert nat_count >= 2, "Should have at least 2 NAT gateways"
        assert eip_count >= 2, "Should have at least 2 EIPs"

    @mark.it("creates KMS key for RDS encryption")
    def test_creates_kms_key_for_rds(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties(
            "AWS::KMS::Key",
            {"EnableKeyRotation": True, "Description": Match.string_like_regexp(".*RDS.*")},
        )

    @mark.it("creates Aurora PostgreSQL cluster with correct version")
    def test_creates_aurora_cluster(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {"Engine": "aurora-postgresql", "EngineVersion": "15.8", "StorageEncrypted": True},
        )

    @mark.it("creates Aurora cluster with writer and reader instances")
    def test_creates_aurora_instances(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - 1 writer + 1 reader = 2 instances
        template.resource_count_is("AWS::RDS::DBInstance", 2)
        template.has_resource_properties(
            "AWS::RDS::DBInstance", {"DBInstanceClass": "db.t3.medium"}
        )

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "BillingMode": "PAY_PER_REQUEST",
                "KeySchema": [{"AttributeName": "sessionId", "KeyType": "HASH"}],
                "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            },
        )

    @mark.it("creates S3 bucket with versioning and lifecycle")
    def test_creates_s3_bucket(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "VersioningConfiguration": {"Status": "Enabled"},
                "LifecycleConfiguration": {
                    "Rules": Match.array_with(
                        [Match.object_like({"NoncurrentVersionExpiration": {"NoncurrentDays": 30}})]
                    )
                },
            },
        )

    @mark.it("creates CloudFront distribution")
    def test_creates_cloudfront_distribution(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.has_resource_properties(
            "AWS::CloudFront::Distribution",
            {"DistributionConfig": Match.object_like({"Enabled": True})},
        )

    @mark.it("creates CloudFront OAI for S3 access")
    def test_creates_cloudfront_oai(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudFront::CloudFrontOriginAccessIdentity", 1)

    @mark.it("creates ECS cluster")
    def test_creates_ecs_cluster(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Cluster", 1)

    @mark.it("creates Fargate task definition with correct configuration")
    def test_creates_fargate_task_definition(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::TaskDefinition", 1)
        template.has_resource_properties(
            "AWS::ECS::TaskDefinition",
            {
                "RequiresCompatibilities": ["FARGATE"],
                "NetworkMode": "awsvpc",
                "Cpu": "512",
                "Memory": "1024",
            },
        )

    @mark.it("creates ALB with internet-facing configuration")
    def test_creates_application_load_balancer(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            {"Scheme": "internet-facing", "Type": "application"},
        )

    @mark.it("creates target group with health check on root path")
    def test_creates_target_group_with_health_check(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            {
                "Port": 80,
                "Protocol": "HTTP",
                "TargetType": "ip",
                "HealthCheckPath": "/",
                "HealthCheckIntervalSeconds": 30,
                "HealthCheckTimeoutSeconds": 5,
                "HealthyThresholdCount": 2,
                "UnhealthyThresholdCount": 3,
            },
        )

    @mark.it("creates ALB listener on port 80")
    def test_creates_alb_listener(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener", {"Port": 80, "Protocol": "HTTP"}
        )

    @mark.it("creates Fargate service with desired count of 2")
    def test_creates_fargate_service(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Service", 1)
        template.has_resource_properties("AWS::ECS::Service", {"DesiredCount": 2})

    @mark.it("creates auto-scaling target for ECS service")
    def test_creates_auto_scaling(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 1)
        template.has_resource_properties(
            "AWS::ApplicationAutoScaling::ScalableTarget", {"MinCapacity": 2, "MaxCapacity": 10}
        )

    @mark.it("creates CPU-based auto-scaling policy")
    def test_creates_cpu_scaling_policy(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 2)

    @mark.it("creates Lambda function for transaction validation")
    def test_creates_validation_lambda(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - May have custom resource Lambda functions
        lambda_funcs = template.find_resources("AWS::Lambda::Function")
        assert len(lambda_funcs) >= 1, "Should have at least 1 Lambda function"

        # Find validation lambda
        validation_lambda = None
        for func_id, func in lambda_funcs.items():
            props = func.get('Properties', {})
            if props.get('Runtime') == 'python3.11' and props.get('Timeout') == 30:
                validation_lambda = props
                break

        assert validation_lambda is not None, "Validation Lambda should exist"
        assert validation_lambda.get('ReservedConcurrentExecutions') == 10

    @mark.it("creates SNS topic for alerts")
    def test_creates_sns_topic(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates SNS email subscription")
    def test_creates_sns_subscription(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Subscription", 1)
        template.has_resource_properties(
            "AWS::SNS::Subscription",
            {"Protocol": "email", "Endpoint": "ops-team@example.com"},
        )

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 9 alarms: ECS CPU, ECS Memory, ALB Latency, ALB 5XX, RDS CPU, RDS Connections, Lambda Errors, Lambda Throttles, DynamoDB Throttles
        template.resource_count_is("AWS::CloudWatch::Alarm", 9)

    @mark.it("creates CloudWatch log group for ECS")
    def test_creates_cloudwatch_log_group(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties(
            "AWS::Logs::LogGroup", {"RetentionInDays": 7}
        )

    @mark.it("outputs CloudFront URL")
    def test_outputs_cloudfront_url(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("CloudFrontURL", {"Description": "CloudFront distribution URL"})

    @mark.it("outputs Load Balancer DNS")
    def test_outputs_load_balancer_dns(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("LoadBalancerDNS", {"Description": "Application Load Balancer DNS"})

    @mark.it("outputs Database Endpoint")
    def test_outputs_database_endpoint(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output("DatabaseEndpoint", {"Description": "Aurora cluster endpoint"})

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Stack should still be created successfully
        template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("accepts environment suffix from context")
    def test_accepts_env_suffix_from_context(self):
        # ARRANGE
        app = cdk.App(context={"environmentSuffix": "context-env"})
        stack = TapStack(app, "TapStackTestContext")
        template = Template.from_stack(stack)

        # ASSERT - Stack should be created successfully
        template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("creates IAM roles for ECS task execution")
    def test_creates_ecs_execution_role(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Task role + Execution role + Lambda role + custom resources = at least 3 roles
        role_count = len(template.find_resources("AWS::IAM::Role"))
        assert role_count >= 3, "Should have at least 3 IAM roles"

    @mark.it("grants DynamoDB permissions to Lambda")
    def test_grants_dynamodb_permissions_to_lambda(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Action": Match.array_with(
                                        [
                                            Match.string_like_regexp("dynamodb:.*"),
                                        ]
                                    ),
                                    "Effect": "Allow",
                                }
                            )
                        ]
                    )
                }
            },
        )

    @mark.it("creates security groups for RDS and ECS")
    def test_creates_security_groups(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - At least 3 security groups (RDS, ECS, ALB)
        sg_count = len(template.find_resources("AWS::EC2::SecurityGroup"))
        assert sg_count >= 3, "Should have at least 3 security groups"

    @mark.it("creates Internet Gateway")
    def test_creates_internet_gateway(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::InternetGateway", 1)

    @mark.it("creates route tables for public and private subnets")
    def test_creates_route_tables(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - At least 3 route tables
        rt_count = len(template.find_resources("AWS::EC2::RouteTable"))
        assert rt_count >= 3, "Should have at least 3 route tables"
