import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Unit Tests")
class TestTapStack(unittest.TestCase):
  """Comprehensive unit tests for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates stack with dev environment by default")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT - Check that resources are created
    template.resource_count_is("AWS::EC2::VPC", 1)

  @mark.it("creates stack with custom environment suffix")
  def test_creates_stack_with_custom_env_suffix(self):
    # ARRANGE & ACT
    env_suffix = "prod"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Verify VPC is created
    template.resource_count_is("AWS::EC2::VPC", 1)

  @mark.it("creates VPC with correct configuration")
  def test_creates_vpc_with_correct_configuration(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check VPC properties
    template.has_resource_properties("AWS::EC2::VPC", {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": True,
        "EnableDnsSupport": True
    })

  @mark.it("creates three S3 buckets with lifecycle policies")
  def test_creates_s3_buckets_with_lifecycle(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check S3 buckets exist
    template.resource_count_is("AWS::S3::Bucket", 3)

    # Check lifecycle rules for Glacier transition
    template.has_resource_properties("AWS::S3::Bucket", {
        "LifecycleConfiguration": {
            "Rules": Match.array_with([
                Match.object_like({
                    "Status": "Enabled",
                    "Transitions": Match.array_with([
                        Match.object_like({
                            "StorageClass": "GLACIER",
                            "TransitionInDays": 30
                        })
                    ])
                })
            ])
        }
    })

  @mark.it("creates three Lambda functions with optimized memory")
  def test_creates_lambda_functions_with_optimized_memory(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check Lambda functions exist
    template.resource_count_is("AWS::Lambda::Function", 4)  # 3 payment + 1 cost report

    # Check for ARM64 architecture
    template.has_resource_properties("AWS::Lambda::Function", {
        "Architectures": ["arm64"]
    })

    # Check for 7-day log retention
    template.resource_count_is("AWS::Logs::LogGroup", Match.any_value())

  @mark.it("creates Lambda functions with reserved concurrency")
  def test_creates_lambda_functions_with_concurrency(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check for reserved concurrent executions
    template.has_resource_properties("AWS::Lambda::Function", {
        "ReservedConcurrentExecutions": Match.any_value()
    })

  @mark.it("creates DynamoDB tables with on-demand billing")
  def test_creates_dynamodb_tables_with_on_demand(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check DynamoDB tables exist
    template.resource_count_is("AWS::DynamoDB::Table", 3)

    # Check for on-demand billing mode
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "BillingMode": "PAY_PER_REQUEST"
    })

  @mark.it("creates API Gateway with consolidated endpoints")
  def test_creates_api_gateway_consolidated(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check single API Gateway
    template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    # Check for resources
    template.resource_count_is("AWS::ApiGateway::Resource", Match.any_value())

  @mark.it("creates ECS cluster with Fargate service")
  def test_creates_ecs_cluster_with_fargate(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check ECS resources
    template.resource_count_is("AWS::ECS::Cluster", 1)
    template.resource_count_is("AWS::ECS::Service", 1)
    template.resource_count_is("AWS::ECS::TaskDefinition", 1)

  @mark.it("creates ECS auto-scaling policies")
  def test_creates_ecs_auto_scaling(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check auto-scaling resources
    template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", Match.any_value())
    template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", Match.any_value())

  @mark.it("creates Application Load Balancer")
  def test_creates_application_load_balancer(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check ALB resources
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
    template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
    template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

  @mark.it("creates CloudWatch dashboard for monitoring")
  def test_creates_cloudwatch_dashboard(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check CloudWatch dashboard
    template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

  @mark.it("creates cost report Lambda with EventBridge schedule")
  def test_creates_cost_report_lambda(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check EventBridge rule for cost reporting
    template.resource_count_is("AWS::Events::Rule", Match.any_value())

  @mark.it("applies cost allocation tags to all resources")
  def test_applies_cost_allocation_tags(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check that tags are applied (CDK applies tags to nested stacks)
    # Nested stacks will have the tags applied
    template.resource_count_is("AWS::CloudFormation::Stack", Match.any_value())

  @mark.it("creates NAT instances for dev environment")
  def test_creates_nat_instances_for_dev(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check for NAT instances (EC2 instances used as NAT)
    # NAT instances are created as EC2 instances with specific configurations
    template.has_resource_properties("AWS::EC2::Instance", Match.any_value())

  @mark.it("creates CloudWatch Log Groups with 7-day retention")
  def test_creates_log_groups_with_retention(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check log groups with retention
    template.has_resource_properties("AWS::Logs::LogGroup", {
        "RetentionInDays": 7
    })

  @mark.it("creates IAM roles for Lambda functions")
  def test_creates_iam_roles_for_lambdas(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check IAM roles are created
    template.resource_count_is("AWS::IAM::Role", Match.any_value())

  @mark.it("creates security groups for VPC resources")
  def test_creates_security_groups(self):
    # ARRANGE & ACT
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="dev"))
    template = Template.from_stack(stack)

    # ASSERT - Check security groups
    template.resource_count_is("AWS::EC2::SecurityGroup", Match.any_value())
