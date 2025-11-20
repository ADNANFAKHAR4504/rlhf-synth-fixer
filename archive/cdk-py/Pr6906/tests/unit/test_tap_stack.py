"""
Unit tests for TapStack and all constructs
"""
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

    @mark.it("creates stack with environment suffix")
    def test_creates_stack_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check VPC created with suffix
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": f"microservices-vpc-{env_suffix}"}
            ])
        })

    @mark.it("creates ECS cluster with Container Insights")
    def test_creates_ecs_cluster(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Cluster", 1)
        template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterName": f"microservices-cluster-{env_suffix}",
            "ClusterSettings": Match.array_with([
                {
                    "Name": "containerInsights",
                    "Value": "enabled"
                }
            ])
        })

    @mark.it("creates App Mesh")
    def test_creates_app_mesh(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AppMesh::Mesh", 1)
        template.has_resource_properties("AWS::AppMesh::Mesh", {
            "MeshName": f"microservices-mesh-{env_suffix}"
        })

    @mark.it("creates three ECR repositories")
    def test_creates_ecr_repositories(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECR::Repository", 3)
        template.has_resource_properties("AWS::ECR::Repository", {
            "RepositoryName": f"payment-service-{env_suffix}",
            "ImageScanningConfiguration": {"ScanOnPush": True}
        })
        template.has_resource_properties("AWS::ECR::Repository", {
            "RepositoryName": f"order-service-{env_suffix}",
            "ImageScanningConfiguration": {"ScanOnPush": True}
        })
        template.has_resource_properties("AWS::ECR::Repository", {
            "RepositoryName": f"notification-service-{env_suffix}",
            "ImageScanningConfiguration": {"ScanOnPush": True}
        })

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": f"microservices-alb-{env_suffix}",
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates three ECS services")
    def test_creates_ecs_services(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Service", 3)
        template.has_resource_properties("AWS::ECS::Service", {
            "ServiceName": f"payment-service-{env_suffix}",
            "DesiredCount": 2
        })
        template.has_resource_properties("AWS::ECS::Service", {
            "ServiceName": f"order-service-{env_suffix}",
            "DesiredCount": 2
        })
        template.has_resource_properties("AWS::ECS::Service", {
            "ServiceName": f"notification-service-{env_suffix}",
            "DesiredCount": 2
        })

    @mark.it("creates KMS key for log encryption")
    def test_creates_kms_key(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": f"KMS key for CloudWatch Logs encryption - {env_suffix}",
            "EnableKeyRotation": True
        })

    @mark.it("creates Secrets Manager secret")
    def test_creates_secrets_manager(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"db-credentials-{env_suffix}"
        })

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"microservices-dashboard-{env_suffix}"
        })

    @mark.it("creates three target groups with health checks")
    def test_creates_target_groups(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 3)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckPath": "/",
            "HealthCheckIntervalSeconds": 30,
            "TargetType": "ip"
        })

    @mark.it("creates App Mesh virtual nodes")
    def test_creates_virtual_nodes(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AppMesh::VirtualNode", 3)
        template.has_resource_properties("AWS::AppMesh::VirtualNode", {
            "VirtualNodeName": f"payment-node-{env_suffix}"
        })
        template.has_resource_properties("AWS::AppMesh::VirtualNode", {
            "VirtualNodeName": f"order-node-{env_suffix}"
        })
        template.has_resource_properties("AWS::AppMesh::VirtualNode", {
            "VirtualNodeName": f"notification-node-{env_suffix}"
        })

    @mark.it("creates App Mesh virtual services")
    def test_creates_virtual_services(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AppMesh::VirtualService", 3)
        template.has_resource_properties("AWS::AppMesh::VirtualService", {
            "VirtualServiceName": "payment.local"
        })
        template.has_resource_properties("AWS::AppMesh::VirtualService", {
            "VirtualServiceName": "order.local"
        })
        template.has_resource_properties("AWS::AppMesh::VirtualService", {
            "VirtualServiceName": "notification.local"
        })

    @mark.it("creates task definitions with correct resources")
    def test_creates_task_definitions(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - 3 task definitions
        template.resource_count_is("AWS::ECS::TaskDefinition", 3)
        # Check CPU and memory
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Cpu": "1024",
            "Memory": "2048",
            "NetworkMode": "awsvpc",
            "RequiresCompatibilities": ["FARGATE"]
        })

    @mark.it("creates IAM roles for tasks")
    def test_creates_iam_roles(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Task execution roles and task roles (2 per service = 6 total)
        # Count total IAM roles (should be at least 6 for services)
        roles = template.find_resources("AWS::IAM::Role")
        assert len(roles) >= 6

    @mark.it("creates CloudWatch log groups with encryption")
    def test_creates_log_groups(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - 3 log groups for services
        template.resource_count_is("AWS::Logs::LogGroup", 3)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/ecs/payment-service-{env_suffix}",
            "RetentionInDays": 7
        })

    @mark.it("creates VPC without endpoints due to account limits")
    def test_vpc_without_endpoints(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - VPC endpoints removed due to AWS account limits in test environment
        endpoints = template.find_resources("AWS::EC2::VPCEndpoint")
        # Endpoints removed for deployment in test environment with resource limits
        assert len(endpoints) == 0

    @mark.it("creates CloudMap namespace for service discovery")
    def test_creates_cloudmap_namespace(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ServiceDiscovery::PrivateDnsNamespace", 1)
        template.has_resource_properties("AWS::ServiceDiscovery::PrivateDnsNamespace", {
            "Name": f"{env_suffix}.local"
        })

    @mark.it("creates ALB listener rules for path-based routing")
    def test_creates_listener_rules(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - 3 listener rules for 3 services
        template.resource_count_is("AWS::ElasticLoadBalancingV2::ListenerRule", 3)

    @mark.it("creates auto-scaling targets")
    def test_creates_autoscaling(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - 3 scalable targets (one per service)
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 3)
        template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 2,
            "MaxCapacity": 10
        })

    @mark.it("creates auto-scaling policies")
    def test_creates_autoscaling_policies(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - 3 scaling policies (one per service)
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 3)
        template.has_resource_properties("AWS::ApplicationAutoScaling::ScalingPolicy", {
            "PolicyType": "TargetTrackingScaling",
            "TargetTrackingScalingPolicyConfiguration": {
                "TargetValue": 70.0,
                "PredefinedMetricSpecification": {
                    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
                }
            }
        })

    @mark.it("outputs stack values")
    def test_outputs_stack_values(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check that outputs are defined
        outputs = template.find_outputs("*")
        assert "VpcId" in outputs
        assert "ClusterName" in outputs
        assert "MeshName" in outputs
        assert "LoadBalancerDns" in outputs

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Check that default 'dev' is used
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": "microservices-vpc-dev"}
            ])
        })

    @mark.it("sets removal policy to DESTROY for all resources")
    def test_removal_policy_destroy(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check KMS key has deletion policy
        template.has_resource("AWS::KMS::Key", {
            "UpdateReplacePolicy": "Delete",
            "DeletionPolicy": "Delete"
        })

        # Check ECR repositories have deletion policy (auto_delete_images is not in template)
        ecr_repos = template.find_resources("AWS::ECR::Repository")
        for repo_id, repo in ecr_repos.items():
            assert repo.get("DeletionPolicy") == "Delete"

    @mark.it("creates security groups with proper rules")
    def test_creates_security_groups(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - ALB security group and task security group
        sgs = template.find_resources("AWS::EC2::SecurityGroup")
        assert len(sgs) >= 2

    @mark.it("configures deployment settings for ECS services")
    def test_configures_deployment_settings(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Circuit breaker disabled for initial deployment
        # Check deployment configuration allows flexible rollouts
        template.has_resource_properties("AWS::ECS::Service", {
            "DeploymentConfiguration": {
                "MinimumHealthyPercent": 0,
                "MaximumPercent": 200
            }
        })

    @mark.it("configures Fargate Spot capacity provider")
    def test_configures_fargate_spot(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::ECS::Service", {
            "CapacityProviderStrategy": [
                {
                    "Base": 2,
                    "CapacityProvider": "FARGATE_SPOT",
                    "Weight": 1
                }
            ]
        })
