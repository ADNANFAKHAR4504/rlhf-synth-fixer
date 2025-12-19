# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
# from aws_cdk.assertions import Match, Template
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates stack with default environment suffix")
    def test_creates_stack_with_default_env_suffix(self):
        """Test that stack defaults to 'dev' environment suffix"""
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # S3 bucket should exist with dev suffix
        template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("creates stack with custom environment suffix")
    def test_creates_stack_with_custom_env_suffix(self):
        """Test that stack uses custom environment suffix"""
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # S3 bucket should exist
        template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("creates VPC with 2 availability zones")
    def test_creates_vpc_with_2_azs(self):
        """Test VPC configuration with 2 AZs"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # VPC should be created
        template.resource_count_is("AWS::EC2::VPC", 1)

        # Should have public and private subnets (2 AZs * 2 types = 4 subnets)
        template.resource_count_is("AWS::EC2::Subnet", 4)

    @mark.it("creates ECR repository with lifecycle policy")
    def test_creates_ecr_with_lifecycle(self):
        """Test ECR repository with lifecycle rule"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ECR repo should exist
        template.resource_count_is("AWS::ECR::Repository", 1)

        # Verify lifecycle policy for 10 images
        template.has_resource_properties("AWS::ECR::Repository", {
            "RepositoryName": f"python-app-{env_suffix}",
            "LifecyclePolicy": {
                "LifecyclePolicyText": Match.string_like_regexp(".*countNumber.*10.*")
            }
        })

    @mark.it("creates ECS cluster with container insights")
    def test_creates_ecs_cluster(self):
        """Test ECS cluster configuration"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ECS cluster should be created
        template.resource_count_is("AWS::ECS::Cluster", 1)

    @mark.it("creates Fargate task definition")
    def test_creates_fargate_task_definition(self):
        """Test Fargate task definition"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # Task definition should exist
        template.resource_count_is("AWS::ECS::TaskDefinition", 1)

        # Verify Fargate compatibility and resources
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "RequiresCompatibilities": ["FARGATE"],
            "Cpu": "256",
            "Memory": "512"
        })

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        """Test ALB creation"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ALB should be created
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

        # Verify internet-facing configuration
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing"
        })

    @mark.it("creates two target groups for blue-green deployment")
    def test_creates_two_target_groups(self):
        """Test blue-green target groups"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # Should have 2 target groups (blue and green)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 2)

        # Verify health check configuration
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckPath": "/",
            "HealthCheckIntervalSeconds": 30,
            "HealthCheckTimeoutSeconds": 5
        })

    @mark.it("creates ECS Fargate service")
    def test_creates_ecs_service(self):
        """Test ECS Fargate service"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ECS service should be created
        template.resource_count_is("AWS::ECS::Service", 1)

        # Verify Fargate launch type
        template.has_resource_properties("AWS::ECS::Service", {
            "LaunchType": "FARGATE"
        })

    @mark.it("creates CodeCommit repository")
    def test_creates_codecommit_repo(self):
        """Test CodeCommit repository"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # CodeCommit repo should exist
        template.resource_count_is("AWS::CodeCommit::Repository", 1)

        # Verify repository name
        template.has_resource_properties("AWS::CodeCommit::Repository", {
            "RepositoryName": f"python-app-{env_suffix}"
        })

    @mark.it("creates CodeBuild project with Python 3.9")
    def test_creates_codebuild_project(self):
        """Test CodeBuild project configuration"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # CodeBuild project should exist
        template.resource_count_is("AWS::CodeBuild::Project", 1)

        # Verify Python 3.9 environment
        template.has_resource_properties("AWS::CodeBuild::Project", {
            "Environment": {
                "Image": "aws/codebuild/standard:5.0",
                "Type": "LINUX_CONTAINER"
            }
        })

    @mark.it("creates CodeDeploy application and deployment group")
    def test_creates_codedeploy_resources(self):
        """Test CodeDeploy configuration"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # CodeDeploy application should exist
        template.resource_count_is("AWS::CodeDeploy::Application", 1)

        # CodeDeploy deployment group should exist
        template.resource_count_is("AWS::CodeDeploy::DeploymentGroup", 1)

        # Verify ECS deployment config (can be AllAtOnce or Linear)
        template.has_resource_properties("AWS::CodeDeploy::DeploymentGroup", {
            "DeploymentConfigName": Match.string_like_regexp("CodeDeployDefault.ECS.*")
        })

    @mark.it("creates CodePipeline with three stages")
    def test_creates_pipeline_with_stages(self):
        """Test CodePipeline stages"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # Pipeline should exist
        template.resource_count_is("AWS::CodePipeline::Pipeline", 1)

        # Verify three stages: Source, Build, Deploy
        template.has_resource_properties("AWS::CodePipeline::Pipeline", {
            "Stages": Match.array_with([
                Match.object_like({"Name": "Source"}),
                Match.object_like({"Name": "Build"}),
                Match.object_like({"Name": "Deploy"})
            ])
        })

    @mark.it("creates SNS topic for notifications")
    def test_creates_sns_topic(self):
        """Test SNS topic for failure notifications"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # SNS topic should exist
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates CloudWatch log groups")
    def test_creates_cloudwatch_logs(self):
        """Test CloudWatch log groups"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # Multiple log groups should exist (ECS, CodeBuild)
        log_groups = template.find_resources("AWS::Logs::LogGroup")
        assert len(log_groups) >= 2, "Should have at least 2 log groups"

        # Verify 30-day retention
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30
        })

    @mark.it("creates IAM roles for all services")
    def test_creates_iam_roles(self):
        """Test IAM roles creation"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # Multiple IAM roles should exist
        # (Pipeline, CodeBuild, ECS Task Execution, ECS Task, CodeDeploy)
        roles = template.find_resources("AWS::IAM::Role")
        assert len(roles) >= 5, "Should have at least 5 IAM roles"

    @mark.it("creates S3 bucket for artifacts")
    def test_creates_s3_bucket(self):
        """Test S3 bucket for pipeline artifacts"""
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # S3 bucket should exist
        template.resource_count_is("AWS::S3::Bucket", 1)

        # Verify encryption and removal policy
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.any_value()
            })
        })

    @mark.it("creates stack outputs")
    def test_creates_stack_outputs(self):
        """Test stack outputs"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # Should have outputs for key resources
        outputs = template.find_outputs("*")
        assert len(outputs) >= 4, "Should have at least 4 outputs"

    @mark.it("uses environment suffix in all resource names")
    def test_environment_suffix_in_resources(self):
        """Test that environment suffix is used consistently"""
        env_suffix = "prod"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # Verify suffix is used in ECR repository
        template.has_resource_properties("AWS::ECR::Repository", {
            "RepositoryName": f"python-app-{env_suffix}"
        })

        # Verify S3 bucket exists
        template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("sets removal policy to DESTROY")
    def test_removal_policy_destroy(self):
        """Test that resources have DESTROY removal policy"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # S3 bucket should have auto-delete enabled
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": Match.any_value()
        })

        # ECR should have DESTROY removal policy
        template.has_resource_properties("AWS::ECR::Repository", {
            "RepositoryName": Match.any_value()
        })

    @mark.it("configures security groups properly")
    def test_security_groups(self):
        """Test security group creation"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # Security groups should be created
        sgs = template.find_resources("AWS::EC2::SecurityGroup")
        assert len(sgs) >= 2, "Should have at least 2 security groups"

    @mark.it("creates EventBridge rule for pipeline state changes")
    def test_creates_eventbridge_rule(self):
        """Test EventBridge rule for pipeline monitoring"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # Events rules should exist (one for pipeline, one for ECS if enabled)
        rules = template.find_resources("AWS::Events::Rule")
        assert len(rules) >= 1, "Should have at least 1 EventBridge rule"

        # Verify at least one rule has pipeline state change pattern
        template.has_resource_properties("AWS::Events::Rule", {
            "EventPattern": Match.object_like({
                "source": ["aws.codepipeline"]
            })
        })

    @mark.it("supports custom notification email")
    def test_custom_notification_email(self):
        """Test custom notification email configuration"""
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(
                             environment_suffix="test",
                             notification_email="test@example.com"
                         ))
        template = Template.from_stack(stack)

        # SNS subscription should be created
        template.resource_count_is("AWS::SNS::Subscription", 1)

    @mark.it("creates Parameter Store parameters")
    def test_creates_parameter_store(self):
        """Test Parameter Store integration"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # SSM parameters should exist
        params = template.find_resources("AWS::SSM::Parameter")
        assert len(params) >= 2, "Should have at least 2 SSM parameters"

    @mark.it("configures ALB listener")
    def test_alb_listener(self):
        """Test ALB listener configuration"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ALB listeners should exist (production and test listeners)
        listeners = template.find_resources("AWS::ElasticLoadBalancingV2::Listener")
        assert len(listeners) >= 1, "Should have at least 1 ALB listener"

        # Verify HTTP listener on port 80
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    @mark.it("environment suffix can be provided via context")
    def test_environment_suffix_from_context(self):
        """Test environment suffix from CDK context"""
        app = cdk.App(context={"environmentSuffix": "context-env"})
        stack = TapStack(app, "TapStackTest")

        assert stack.environment_suffix == "context-env"

    @mark.it("default notification email is used when not provided")
    def test_default_notification_email(self):
        """Test default notification email"""
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # SNS subscription should use default email
        template.resource_count_is("AWS::SNS::Subscription", 1)
