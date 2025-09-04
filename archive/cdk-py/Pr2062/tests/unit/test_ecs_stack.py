"""Unit tests for ECS Stack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.vpc_stack import VpcStack
from lib.ecs_stack import EcsStack


@mark.describe("EcsStack")
class TestEcsStack(unittest.TestCase):
    """Test cases for the EcsStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        
        # Create VPC stack first (dependency)
        self.vpc_stack = VpcStack(self.app, "TestVpcStack", environment_suffix=self.env_suffix)
        
        # Create ECS stack
        self.stack = EcsStack(
            self.app, "TestEcsStack",
            vpc_stack=self.vpc_stack,
            environment_suffix=self.env_suffix
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates an ECS cluster with container insights")
    def test_creates_ecs_cluster(self):
        """Test that an ECS cluster is created with container insights enabled"""
        self.template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterName": f"webapp-cluster-{self.env_suffix.lower()}",
            "ClusterSettings": Match.array_with([
                {"Name": "containerInsights", "Value": "enabled"}
            ])
        })

    @mark.it("creates task definition with proper configuration")
    def test_creates_task_definition(self):
        """Test that task definition is created with correct configuration"""
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Cpu": "1024",
            "Memory": "2048",
            "NetworkMode": "awsvpc",
            "RequiresCompatibilities": ["FARGATE"],
            "RuntimePlatform": {
                "CpuArchitecture": "X86_64",
                "OperatingSystemFamily": "LINUX"
            }
        })

    @mark.it("creates IAM roles for task execution and task")
    def test_creates_iam_roles(self):
        """Test that proper IAM roles are created"""
        # Check task execution role
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {"Service": "ecs-tasks.amazonaws.com"}
                    })
                ])
            })
        })

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        """Test that ALB is created with correct configuration"""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing",
            "Name": f"webapp-alb-{self.env_suffix.lower()}"
        })

    @mark.it("creates target group with health check")
    def test_creates_target_group(self):
        """Test that target group is created with health check"""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "TargetType": "ip",
            "HealthCheckPath": "/",
            "HealthCheckIntervalSeconds": 30
        })

    @mark.it("creates Fargate service with desired count")
    def test_creates_fargate_service(self):
        """Test that Fargate service is created"""
        self.template.has_resource_properties("AWS::ECS::Service", {
            "DesiredCount": 2,
            "LaunchType": "FARGATE",
            "PlatformVersion": "1.4.0",
            "DeploymentConfiguration": {
                "MaximumPercent": 200,
                "MinimumHealthyPercent": 50
            }
        })

    @mark.it("configures auto-scaling for the service")
    def test_configures_auto_scaling(self):
        """Test that auto-scaling is configured"""
        # Check scalable target
        self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 2,
            "MaxCapacity": 20,
            "ServiceNamespace": "ecs"
        })
        
        # Check CPU scaling policy
        self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalingPolicy", {
            "PolicyType": "TargetTrackingScaling",
            "TargetTrackingScalingPolicyConfiguration": Match.object_like({
                "PredefinedMetricSpecification": Match.object_like({
                    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
                })
            })
        })

    @mark.it("creates CloudWatch log group")
    def test_creates_log_group(self):
        """Test that CloudWatch log group is created"""
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/ecs/webapp-{self.env_suffix.lower()}",
            "RetentionInDays": 7
        })

    @mark.it("exports load balancer DNS")
    def test_exports_alb_dns(self):
        """Test that ALB DNS is exported"""
        outputs = self.template.find_outputs("*")
        alb_output_exists = any(
            f"LoadBalancerDns{self.env_suffix}" in key for key in outputs.keys()
        )
        self.assertTrue(alb_output_exists, "ALB DNS should be exported")

    @mark.it("provides access to cluster and service")
    def test_provides_access_to_resources(self):
        """Test that the stack provides access to created resources"""
        self.assertIsNotNone(self.stack.cluster)
        self.assertIsNotNone(self.stack.service)
        self.assertIsNotNone(self.stack.alb)