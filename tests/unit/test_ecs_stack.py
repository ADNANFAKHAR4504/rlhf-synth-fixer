"""Unit tests for EcsStack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.ecs_stack import EcsStack


@mark.describe("EcsStack")
class TestEcsStack(unittest.TestCase):
    """Test cases for the EcsStack"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    @mark.it("creates VPC")
    def test_creates_vpc(self):
        """Test that VPC is created"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("creates ECS cluster")
    def test_creates_ecs_cluster(self):
        """Test that ECS cluster is created"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.has_resource_properties(
            "AWS::ECS::Cluster",
            Match.object_like({
                "ClusterName": "app-cluster-test"
            })
        )

    @mark.it("creates Fargate task definition")
    def test_creates_task_definition(self):
        """Test that Fargate task definition is created"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.has_resource_properties(
            "AWS::ECS::TaskDefinition",
            Match.object_like({
                "RequiresCompatibilities": ["FARGATE"]
            })
        )

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        """Test that Application Load Balancer is created"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            Match.object_like({
                "Type": "application"
            })
        )

    @mark.it("creates target groups for blue/green deployment")
    def test_creates_target_groups(self):
        """Test that target groups for blue/green are created"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        # Should have at least 2 target groups (blue and green)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 2)

    @mark.it("creates Fargate service")
    def test_creates_fargate_service(self):
        """Test that Fargate service is created"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.has_resource_properties(
            "AWS::ECS::Service",
            Match.object_like({
                "LaunchType": "FARGATE"
            })
        )

    @mark.it("creates CloudWatch log group")
    def test_creates_log_group(self):
        """Test that CloudWatch log group is created"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.resource_count_is("AWS::Logs::LogGroup", 1)

    @mark.it("configures container insights")
    def test_configures_container_insights(self):
        """Test that container insights is configured"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.has_resource_properties(
            "AWS::ECS::Cluster",
            Match.object_like({
                "ClusterSettings": Match.array_with([
                    {"Name": "containerInsights", "Value": "enabled"}
                ])
            })
        )

    @mark.it("creates CodeDeploy Application")
    def test_creates_codedeploy_application(self):
        """Test that CodeDeploy Application is created"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.has_resource_properties(
            "AWS::CodeDeploy::Application",
            Match.object_like({
                "ApplicationName": "ecs-app-test",
                "ComputePlatform": "ECS"
            })
        )

    @mark.it("creates CodeDeploy Deployment Group")
    def test_creates_codedeploy_deployment_group(self):
        """Test that CodeDeploy Deployment Group is created with blue/green configuration"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.has_resource_properties(
            "AWS::CodeDeploy::DeploymentGroup",
            Match.object_like({
                "DeploymentGroupName": "ecs-deployment-test",
                "DeploymentConfigName": "CodeDeployDefault.ECSLinear10PercentEvery1Minutes"
            })
        )

    @mark.it("configures auto-rollback for deployment group")
    def test_configures_auto_rollback(self):
        """Test that deployment group has auto-rollback configured"""
        ecs_stack = EcsStack(
            self.stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        template.has_resource_properties(
            "AWS::CodeDeploy::DeploymentGroup",
            Match.object_like({
                "AutoRollbackConfiguration": Match.object_like({
                    "Enabled": True,
                    "Events": Match.array_with(["DEPLOYMENT_FAILURE"])
                })
            })
        )
