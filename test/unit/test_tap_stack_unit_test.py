"""
Unit tests for the TAP (Three-tier Application Platform) Stack.
Tests infrastructure components including VPC, ECS, RDS, ALB, CloudFront, and API Gateway.
"""

import aws_cdk as cdk
import aws_cdk.assertions as assertions
import pytest
from lib.tap_stack import TapStack


@pytest.fixture
def app():
    """Create a CDK app for testing."""
    return cdk.App()


@pytest.fixture
def stack(app):
    """Create a TapStack instance for testing."""
    from lib.tap_stack import TapStackProps
    props = TapStackProps(environment_suffix="test")
    return TapStack(app, "TestTapStack", props=props)


class TestVPCConfiguration:
    """Test VPC configuration and networking."""

    def test_vpc_created(self, stack):
        """Test that VPC is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::VPC", 1)

    def test_vpc_cidr_block(self, stack):
        """Test VPC CIDR block configuration."""
        template = assertions.Template.from_stack(stack)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })

    def test_subnets_created(self, stack):
        """Test that public and private subnets are created."""
        template = assertions.Template.from_stack(stack)
        # Should have 4 subnets: 2 public + 2 private
        template.resource_count_is("AWS::EC2::Subnet", 4)

    def test_internet_gateway_created(self, stack):
        """Test that Internet Gateway is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::InternetGateway", 1)

    def test_nat_gateway_created(self, stack):
        """Test that NAT Gateway is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    def test_eip_created(self, stack):
        """Test that Elastic IP is created for NAT Gateway."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::EIP", 1)


class TestSecurityGroups:
    """Test security group configurations."""

    def test_security_groups_created(self, stack):
        """Test that all required security groups are created."""
        template = assertions.Template.from_stack(stack)
        # ALB, ECS, and Database security groups
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)

    def test_alb_security_group_ingress(self, stack):
        """Test ALB security group ingress rules."""
        template = assertions.Template.from_stack(stack)
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupIngress": assertions.Match.array_with([
                {
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 80,
                    "IpProtocol": "tcp",
                    "ToPort": 80
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 443,
                    "IpProtocol": "tcp",
                    "ToPort": 443
                }
            ])
        })


class TestRDSConfiguration:
    """Test RDS Aurora PostgreSQL configuration."""

    def test_rds_cluster_created(self, stack):
        """Test that RDS cluster is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    def test_rds_engine(self, stack):
        """Test RDS engine configuration."""
        template = assertions.Template.from_stack(stack)
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": "14.6"
        })

    def test_rds_instances(self, stack):
        """Test that RDS instances (writer and reader) are created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::RDS::DBInstance", 2)

    def test_rds_subnet_group(self, stack):
        """Test that DB subnet group is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    def test_db_secret_created(self, stack):
        """Test that database credentials secret is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::SecretsManager::Secret", 1)


class TestECSConfiguration:
    """Test ECS cluster and service configuration."""

    def test_ecs_cluster_created(self, stack):
        """Test that ECS cluster is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ECS::Cluster", 1)

    def test_ecs_task_definitions(self, stack):
        """Test that task definitions for frontend and backend are created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ECS::TaskDefinition", 2)

    def test_ecs_services(self, stack):
        """Test that ECS services for frontend and backend are created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ECS::Service", 2)

    def test_ecr_repositories(self, stack):
        """Test that ECR repositories are created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ECR::Repository", 2)

    def test_log_groups(self, stack):
        """Test that CloudWatch log groups are created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::Logs::LogGroup", 2)


class TestLoadBalancer:
    """Test Application Load Balancer configuration."""

    def test_alb_created(self, stack):
        """Test that Application Load Balancer is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    def test_alb_internet_facing(self, stack):
        """Test that ALB is internet-facing."""
        template = assertions.Template.from_stack(stack)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing"
        })

    def test_target_groups(self, stack):
        """Test that target groups are created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 2)

    def test_listener_created(self, stack):
        """Test that ALB listener is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)


class TestCloudFront:
    """Test CloudFront distribution configuration."""

    def test_cloudfront_distribution_created(self, stack):
        """Test that CloudFront distribution is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFront::Distribution", 1)

    def test_cloudfront_cache_policy(self, stack):
        """Test that CloudFront cache policy is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFront::CachePolicy", 1)


class TestAPIGateway:
    """Test API Gateway configuration."""

    def test_api_gateway_created(self, stack):
        """Test that REST API is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    def test_api_gateway_methods(self, stack):
        """Test that API Gateway methods are created."""
        template = assertions.Template.from_stack(stack)
        # Should have proxy methods
        assert template.find_resources("AWS::ApiGateway::Method")

    def test_api_gateway_deployment(self, stack):
        """Test that API Gateway deployment is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)

    def test_api_gateway_stage(self, stack):
        """Test that API Gateway stage is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ApiGateway::Stage", 1)


class TestAutoScaling:
    """Test Auto Scaling configuration."""

    def test_autoscaling_targets(self, stack):
        """Test that auto scaling targets are created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 2)

    def test_autoscaling_policies(self, stack):
        """Test that auto scaling policies are created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 2)


class TestMonitoring:
    """Test monitoring configuration."""

    def test_cloudwatch_dashboard(self, stack):
        """Test that CloudWatch dashboard is created."""
        template = assertions.Template.from_stack(stack)
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)


class TestIAMRoles:
    """Test IAM role configuration."""

    def test_iam_roles_created(self, stack):
        """Test that necessary IAM roles are created."""
        template = assertions.Template.from_stack(stack)
        # Should have task execution role and task roles for frontend and backend
        roles = template.find_resources("AWS::IAM::Role")
        assert len(roles) >= 3

    def test_task_execution_role_policy(self, stack):
        """Test that task execution role has proper policies."""
        template = assertions.Template.from_stack(stack)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": assertions.Match.array_with([
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        }
                    }
                ])
            }
        })


class TestStackOutputs:
    """Test stack outputs."""

    def test_stack_has_outputs(self, stack):
        """Test that stack defines outputs."""
        template = assertions.Template.from_stack(stack)
        outputs = template.find_outputs("*")
        assert len(outputs) > 0

    def test_alb_dns_output(self, stack):
        """Test that ALB DNS name is exported."""
        template = assertions.Template.from_stack(stack)
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())
        assert any("ALB" in key for key in output_keys)

    def test_api_gateway_output(self, stack):
        """Test that API Gateway endpoint is exported."""
        template = assertions.Template.from_stack(stack)
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())
        assert any("API" in key for key in output_keys)


class TestResourceTags:
    """Test resource tagging."""

    def test_resources_have_environment_tags(self, stack):
        """Test that resources have environment tags."""
        template = assertions.Template.from_stack(stack)
        # Check that VPC has environment tag
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": assertions.Match.array_with([
                {
                    "Key": "Environment",
                    "Value": "test"
                }
            ])
        })
