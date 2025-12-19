"""
Unit tests for TapStack CDK infrastructure
Tests all constructs and configurations without AWS deployment
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Comprehensive unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates VPC with proper configuration")
    def test_vpc_with_proper_config(self):
        """Test VPC is created with proper subnet configuration"""
        self.template.resource_count_is("AWS::EC2::VPC", 1)

        # CDK synth uses max_azs but actual AZs depend on environment
        # Should have at least 2 subnets
        subnets = self.template.find_resources("AWS::EC2::Subnet")
        self.assertGreaterEqual(len(subnets), 4)

        # Should have NAT gateways
        nat_gateways = self.template.find_resources("AWS::EC2::NatGateway")
        self.assertGreaterEqual(len(nat_gateways), 1)

    @mark.it("creates three ECR repositories with proper configuration")
    def test_ecr_repositories(self):
        """Test ECR repositories for all three microservices"""
        self.template.resource_count_is("AWS::ECR::Repository", 3)

        # Verify repository names include environment suffix
        self.template.has_resource_properties("AWS::ECR::Repository", {
            "RepositoryName": f"data-ingestion-{self.env_suffix}"
        })
        self.template.has_resource_properties("AWS::ECR::Repository", {
            "RepositoryName": f"analytics-engine-{self.env_suffix}"
        })
        self.template.has_resource_properties("AWS::ECR::Repository", {
            "RepositoryName": f"api-gateway-{self.env_suffix}"
        })

        # Verify image scanning is enabled
        self.template.has_resource_properties("AWS::ECR::Repository", {
            "ImageScanningConfiguration": {"ScanOnPush": True}
        })

        # Verify lifecycle policy for max 10 images
        self.template.has_resource_properties("AWS::ECR::Repository", {
            "LifecyclePolicy": Match.object_like({
                "LifecyclePolicyText": Match.string_like_regexp(".*imageCountMoreThan.*10.*")
            })
        })

    @mark.it("creates ECS cluster with proper naming")
    def test_ecs_cluster(self):
        """Test ECS cluster creation and configuration"""
        self.template.resource_count_is("AWS::ECS::Cluster", 1)
        self.template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterName": f"trading-cluster-{self.env_suffix}"
        })

    @mark.it("creates App Mesh with proper naming")
    def test_app_mesh(self):
        """Test App Mesh creation"""
        self.template.resource_count_is("AWS::AppMesh::Mesh", 1)
        self.template.has_resource_properties("AWS::AppMesh::Mesh", {
            "MeshName": f"trading-mesh-{self.env_suffix}"
        })

    @mark.it("creates Cloud Map namespace for service discovery")
    def test_cloud_map_namespace(self):
        """Test Cloud Map private DNS namespace"""
        self.template.resource_count_is("AWS::ServiceDiscovery::PrivateDnsNamespace", 1)
        self.template.has_resource_properties("AWS::ServiceDiscovery::PrivateDnsNamespace", {
            "Name": f"trading.local-{self.env_suffix}"
        })

    @mark.it("creates two Secrets Manager secrets")
    def test_secrets_manager(self):
        """Test Secrets Manager secrets for database and API keys"""
        self.template.resource_count_is("AWS::SecretsManager::Secret", 2)

        # Database secret
        self.template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"trading-db-credentials-{self.env_suffix}"
        })

        # API secret
        self.template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"trading-api-keys-{self.env_suffix}"
        })

    @mark.it("creates Application Load Balancer")
    def test_application_load_balancer(self):
        """Test ALB creation and configuration"""
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": f"trading-alb-{self.env_suffix}",
            "Scheme": "internet-facing",
            "Type": "application"
        })

        # Should have a listener
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    @mark.it("creates IAM task execution role with proper permissions")
    def test_task_execution_role(self):
        """Test IAM task execution role"""
        # Should have execution role with proper managed policy
        # The task execution role has the specific role name pattern
        roles = self.template.find_resources("AWS::IAM::Role")

        # Find the task execution role (not task roles)
        execution_role_found = False
        for role_id, role in roles.items():
            props = role.get("Properties", {})
            role_name = props.get("RoleName", "")
            managed_policies = props.get("ManagedPolicyArns", [])

            # Task execution role has ManagedPolicyArns
            if managed_policies and isinstance(managed_policies, list):
                for policy_arn in managed_policies:
                    if "AmazonECSTaskExecutionRolePolicy" in str(policy_arn):
                        execution_role_found = True
                        break

            if execution_role_found:
                break

        self.assertTrue(execution_role_found, "Task execution role with ECS policy not found")

    @mark.it("creates three ECS task definitions")
    def test_ecs_task_definitions(self):
        """Test ECS Fargate task definitions for all services"""
        self.template.resource_count_is("AWS::ECS::TaskDefinition", 3)

        # Each should be Fargate compatible with correct CPU/memory
        task_defs = self.template.find_resources("AWS::ECS::TaskDefinition")
        for task_def in task_defs.values():
            props = task_def["Properties"]
            self.assertEqual(props["Cpu"], "512")
            self.assertEqual(props["Memory"], "1024")
            self.assertIn("FARGATE", props["RequiresCompatibilities"])

    @mark.it("creates three ECS services with proper configuration")
    def test_ecs_services(self):
        """Test ECS services creation and configuration"""
        self.template.resource_count_is("AWS::ECS::Service", 3)

        # Verify service names include environment suffix
        self.template.has_resource_properties("AWS::ECS::Service", {
            "ServiceName": f"data-ingestion-{self.env_suffix}"
        })
        self.template.has_resource_properties("AWS::ECS::Service", {
            "ServiceName": f"analytics-engine-{self.env_suffix}"
        })
        self.template.has_resource_properties("AWS::ECS::Service", {
            "ServiceName": f"api-gateway-{self.env_suffix}"
        })

        # Verify capacity provider strategies (Fargate Spot)
        self.template.has_resource_properties("AWS::ECS::Service", {
            "CapacityProviderStrategy": Match.array_with([
                Match.object_like({
                    "CapacityProvider": "FARGATE_SPOT"
                })
            ])
        })

    @mark.it("creates three App Mesh virtual nodes")
    def test_app_mesh_virtual_nodes(self):
        """Test App Mesh virtual nodes"""
        self.template.resource_count_is("AWS::AppMesh::VirtualNode", 3)

        # Verify DNS service discovery
        self.template.has_resource_properties("AWS::AppMesh::VirtualNode", {
            "Spec": Match.object_like({
                "ServiceDiscovery": Match.object_like({
                    "DNS": Match.object_like({
                        "Hostname": Match.string_like_regexp(f".*trading\\.local-{self.env_suffix}")
                    })
                })
            })
        })

        # Verify HTTP listener on port 80
        self.template.has_resource_properties("AWS::AppMesh::VirtualNode", {
            "Spec": Match.object_like({
                "Listeners": Match.array_with([
                    Match.object_like({
                        "PortMapping": {"Port": 80, "Protocol": "http"}
                    })
                ])
            })
        })

    @mark.it("creates three App Mesh virtual routers")
    def test_app_mesh_virtual_routers(self):
        """Test App Mesh virtual routers"""
        self.template.resource_count_is("AWS::AppMesh::VirtualRouter", 3)

        # Verify HTTP listener on port 80
        self.template.has_resource_properties("AWS::AppMesh::VirtualRouter", {
            "Spec": Match.object_like({
                "Listeners": Match.array_with([
                    Match.object_like({
                        "PortMapping": {"Port": 80, "Protocol": "http"}
                    })
                ])
            })
        })

    @mark.it("creates three App Mesh routes with retry policies")
    def test_app_mesh_routes(self):
        """Test App Mesh routes with circuit breaker retry policies"""
        self.template.resource_count_is("AWS::AppMesh::Route", 3)

        # Verify retry policy configuration
        # Note: CDK converts Duration.seconds(5) to milliseconds (5000ms)
        self.template.has_resource_properties("AWS::AppMesh::Route", {
            "Spec": Match.object_like({
                "HttpRoute": Match.object_like({
                    "RetryPolicy": Match.object_like({
                        "MaxRetries": 3,
                        "PerRetryTimeout": {"Unit": "ms", "Value": 5000}
                    })
                })
            })
        })

    @mark.it("creates three App Mesh virtual services")
    def test_app_mesh_virtual_services(self):
        """Test App Mesh virtual services"""
        self.template.resource_count_is("AWS::AppMesh::VirtualService", 3)

    @mark.it("creates CloudWatch log groups with 30-day retention")
    def test_cloudwatch_log_groups(self):
        """Test CloudWatch log groups for each service"""
        self.template.resource_count_is("AWS::Logs::LogGroup", 3)

        # Verify retention period (30 days)
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30
        })

        # Verify metric filters for error tracking
        self.template.resource_count_is("AWS::Logs::MetricFilter", 3)

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarms for CPU, memory, and errors"""
        # Should have alarms for services (CPU, memory, errors per service)
        # Plus additional alarms from auto-scaling
        alarms = self.template.find_resources("AWS::CloudWatch::Alarm")
        self.assertGreaterEqual(len(alarms), 9)

        # Verify CPU alarm exists
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 80,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("creates auto-scaling targets for ECS services")
    def test_autoscaling_targets(self):
        """Test auto-scaling configuration"""
        self.template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 3)

        # Verify min/max capacity
        self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 2,
            "MaxCapacity": 10
        })

    @mark.it("creates auto-scaling policies")
    def test_autoscaling_policies(self):
        """Test auto-scaling policies for CPU, memory, and custom metrics"""
        # Each service should have scaling policies (CPU, memory, custom)
        # Some policies create additional step scaling resources
        policies = self.template.find_resources("AWS::ApplicationAutoScaling::ScalingPolicy")
        self.assertGreaterEqual(len(policies), 9)

    @mark.it("creates ALB target group for api-gateway")
    def test_alb_target_group(self):
        """Test ALB target group for api-gateway service"""
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "TargetType": "ip",
            "HealthCheckEnabled": True,
            "HealthCheckPath": "/"
        })

    @mark.it("creates IAM task roles with least-privilege permissions")
    def test_iam_task_roles(self):
        """Test IAM task roles for services"""
        # Should have task roles with CloudWatch and X-Ray permissions
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "cloudwatch:PutMetricData"
                        ])
                    })
                ])
            })
        })

        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "xray:PutTraceSegments"
                        ])
                    })
                ])
            })
        })

    @mark.it("creates stack outputs for key resources")
    def test_stack_outputs(self):
        """Test CloudFormation stack outputs"""
        template_json = self.template.to_json()
        outputs = template_json.get("Outputs", {})

        # Should have outputs for LoadBalancer, Cluster, Mesh, and ECR repos
        self.assertIn("LoadBalancerDNS", outputs)
        self.assertIn("ClusterName", outputs)
        self.assertIn("MeshName", outputs)

        # Should have ECR repo outputs for all 3 services
        ecr_outputs = [k for k in outputs.keys() if k.startswith("EcrRepo")]
        self.assertEqual(len(ecr_outputs), 3)

    @mark.it("ensures all resources include environment suffix")
    def test_environment_suffix_in_resources(self):
        """Test that resource names include environment suffix"""
        template_json = self.template.to_json()
        resources = template_json.get("Resources", {})

        # Count resources with env suffix in logical IDs or properties
        suffix_count = 0
        for resource_id, resource in resources.items():
            if self.env_suffix in resource_id:
                suffix_count += 1
            elif "Properties" in resource:
                props_str = str(resource["Properties"])
                if self.env_suffix in props_str:
                    suffix_count += 1

        # Should have significant number of resources with suffix
        self.assertGreater(suffix_count, 50)

    @mark.it("ensures no Retain policies on resources")
    def test_no_retain_policies(self):
        """Test that resources are destroyable (no Retain policies)"""
        template_json = self.template.to_json()
        resources = template_json.get("Resources", {})

        for resource_id, resource in resources.items():
            deletion_policy = resource.get("DeletionPolicy", "Delete")
            self.assertNotEqual(
                deletion_policy,
                "Retain",
                f"Resource {resource_id} has Retain policy"
            )

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test default environment suffix behavior"""
        # Create a new app to avoid multiple synth() calls
        app_default = cdk.App()
        stack_default = TapStack(app_default, "TapStackTestDefault")
        template_default = Template.from_stack(stack_default)

        # Check that 'dev' suffix is used
        template_default.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterName": "trading-cluster-dev"
        })

    @mark.it("configures Fargate Spot capacity provider strategy")
    def test_fargate_spot_strategy(self):
        """Test Fargate Spot capacity provider configuration"""
        self.template.has_resource_properties("AWS::ECS::Service", {
            "CapacityProviderStrategy": [
                Match.object_like({
                    "CapacityProvider": "FARGATE_SPOT",
                    "Weight": 2,
                    "Base": 1
                }),
                Match.object_like({
                    "CapacityProvider": "FARGATE",
                    "Weight": 1
                })
            ]
        })

    @mark.it("configures circuit breaker for ECS deployments")
    def test_ecs_circuit_breaker(self):
        """Test ECS deployment circuit breaker configuration"""
        self.template.has_resource_properties("AWS::ECS::Service", {
            "DeploymentConfiguration": Match.object_like({
                "DeploymentCircuitBreaker": {
                    "Enable": True,
                    "Rollback": True
                }
            })
        })

    @mark.it("configures service discovery for ECS services")
    def test_ecs_service_discovery(self):
        """Test Cloud Map service discovery integration"""
        self.template.has_resource_properties("AWS::ECS::Service", {
            "ServiceRegistries": Match.array_with([
                Match.object_like({
                    "RegistryArn": Match.any_value()
                })
            ])
        })


if __name__ == "__main__":
    unittest.main()
