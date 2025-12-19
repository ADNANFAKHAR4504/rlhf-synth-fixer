"""Unit tests for the WorkflowStack CDK infrastructure.

This module contains unit tests for the Step Functions workflow infrastructure.
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from aws_cdk import aws_ec2 as ec2, aws_ecs as ecs, aws_sns as sns
from pytest import mark

from lib.workflow_stack import WorkflowStack, WorkflowStackProps


@mark.describe("WorkflowStack - Step Functions State Machine")
class TestWorkflowStack(unittest.TestCase):
    """Test cases for the WorkflowStack CDK nested stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(self.app, "ParentStack")

        # Create mock VPC
        self.vpc = ec2.Vpc(
            self.parent_stack,
            "TestVpc",
            max_azs=2,
            nat_gateways=1,
        )

        # Create mock ECS cluster
        self.cluster = ecs.Cluster(
            self.parent_stack,
            "TestCluster",
            vpc=self.vpc,
        )

        # Create mock security group
        self.security_group = ec2.SecurityGroup(
            self.parent_stack,
            "TestSecurityGroup",
            vpc=self.vpc,
        )

        # Create mock SNS topics
        self.completion_topic = sns.Topic(
            self.parent_stack,
            "TestCompletionTopic",
        )

        self.error_topic = sns.Topic(
            self.parent_stack,
            "TestErrorTopic",
        )

    @mark.it("creates Step Functions state machine")
    def test_creates_state_machine(self):
        """Verify Step Functions state machine is created"""
        # ARRANGE
        env_suffix = "test"
        stack = WorkflowStack(
            self.parent_stack,
            "WorkflowStackTest",
            WorkflowStackProps(
                environment_suffix=env_suffix,
                vpc=self.vpc,
                ecs_cluster=self.cluster,
                ecs_security_group=self.security_group,
                completion_topic=self.completion_topic,
                error_topic=self.error_topic,
            )
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::StepFunctions::StateMachine", 1)
        template.has_resource_properties("AWS::StepFunctions::StateMachine", {
            "StateMachineName": f"video-processing-workflow-{env_suffix}",
            "TracingConfiguration": {
                "Enabled": True,
            },
        })

    @mark.it("creates ECS task definition for video processing")
    def test_creates_task_definition(self):
        """Verify ECS task definition is created for video processing"""
        # ARRANGE
        env_suffix = "test"
        stack = WorkflowStack(
            self.parent_stack,
            "WorkflowStackTest",
            WorkflowStackProps(
                environment_suffix=env_suffix,
                vpc=self.vpc,
                ecs_cluster=self.cluster,
                ecs_security_group=self.security_group,
                completion_topic=self.completion_topic,
                error_topic=self.error_topic,
            )
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::TaskDefinition", 1)
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "RequiresCompatibilities": ["FARGATE"],
            "Cpu": "1024",
            "Memory": "2048",
        })

    @mark.it("creates CloudWatch log group for state machine")
    def test_creates_log_group(self):
        """Verify CloudWatch log group is created"""
        # ARRANGE
        env_suffix = "test"
        stack = WorkflowStack(
            self.parent_stack,
            "WorkflowStackTest",
            WorkflowStackProps(
                environment_suffix=env_suffix,
                vpc=self.vpc,
                ecs_cluster=self.cluster,
                ecs_security_group=self.security_group,
                completion_topic=self.completion_topic,
                error_topic=self.error_topic,
            )
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/stepfunctions/video-processing-{env_suffix}",
            "RetentionInDays": 7,
        })

    @mark.it("state machine has IAM role with necessary permissions")
    def test_state_machine_has_iam_role(self):
        """Verify state machine has IAM role with necessary permissions"""
        # ARRANGE
        env_suffix = "test"
        stack = WorkflowStack(
            self.parent_stack,
            "WorkflowStackTest",
            WorkflowStackProps(
                environment_suffix=env_suffix,
                vpc=self.vpc,
                ecs_cluster=self.cluster,
                ecs_security_group=self.security_group,
                completion_topic=self.completion_topic,
                error_topic=self.error_topic,
            )
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for state machine IAM role
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "states.amazonaws.com",
                        },
                    }),
                ]),
            },
        })

    @mark.it("state machine grants permissions to publish to SNS topics")
    def test_state_machine_sns_permissions(self):
        """Verify state machine has permissions to publish to SNS topics"""
        # ARRANGE
        env_suffix = "test"
        stack = WorkflowStack(
            self.parent_stack,
            "WorkflowStackTest",
            WorkflowStackProps(
                environment_suffix=env_suffix,
                vpc=self.vpc,
                ecs_cluster=self.cluster,
                ecs_security_group=self.security_group,
                completion_topic=self.completion_topic,
                error_topic=self.error_topic,
            )
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for SNS publish policy
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": "sns:Publish",
                        "Effect": "Allow",
                    }),
                ]),
            },
        })

    @mark.it("raises error when VPC is not provided")
    def test_raises_error_without_vpc(self):
        """Verify error is raised when VPC is not provided"""
        # ARRANGE & ACT & ASSERT
        with self.assertRaises(ValueError) as context:
            WorkflowStack(
                self.parent_stack,
                "WorkflowStackTest",
                WorkflowStackProps(
                    environment_suffix="test",
                    vpc=None,
                    ecs_cluster=self.cluster,
                )
            )
        self.assertIn("VPC and ECS cluster must be provided", str(context.exception))

    @mark.it("raises error when ECS cluster is not provided")
    def test_raises_error_without_cluster(self):
        """Verify error is raised when ECS cluster is not provided"""
        # ARRANGE & ACT & ASSERT
        with self.assertRaises(ValueError) as context:
            WorkflowStack(
                self.parent_stack,
                "WorkflowStackTest",
                WorkflowStackProps(
                    environment_suffix="test",
                    vpc=self.vpc,
                    ecs_cluster=None,
                )
            )
        self.assertIn("VPC and ECS cluster must be provided", str(context.exception))
