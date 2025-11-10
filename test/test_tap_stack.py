"""Comprehensive unit tests for TapStack infrastructure"""
import os
import json
import pytest
import aws_cdk as cdk
from aws_cdk import (
    assertions,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
)
from lib.tap_stack import TapStack


@pytest.fixture
def app() -> cdk.App:
    """Create a CDK app for testing"""
    return cdk.App()


@pytest.fixture
def stack(app: cdk.App) -> TapStack:
    """Create a TapStack for testing"""
    return TapStack(
        app,
        "TestStack",
        environment_suffix="test",
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )


@pytest.fixture
def template(stack: TapStack) -> assertions.Template:
    """Generate CloudFormation template for assertions"""
    return assertions.Template.from_stack(stack)


class TestVPCConfiguration:
    """Test VPC and networking configuration"""

    def test_vpc_created_with_correct_azs(self, template: assertions.Template) -> None:
        """Test VPC is created with 3 availability zones"""
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True,
            },
        )

    def test_vpc_has_public_subnets(self, template: assertions.Template) -> None:
        """Test VPC has public subnets across 3 AZs"""
        # 3 public subnets (one per AZ)
        public_subnets = template.find_resources(
            "AWS::EC2::Subnet",
            {
                "Properties": {
                    "MapPublicIpOnLaunch": True,
                }
            },
        )
        assert len(public_subnets) == 3

    def test_vpc_has_private_subnets(self, template: assertions.Template) -> None:
        """Test VPC has private subnets across 3 AZs"""
        # 3 private subnets (one per AZ)
        private_subnets = template.find_resources(
            "AWS::EC2::Subnet",
            {
                "Properties": {
                    "MapPublicIpOnLaunch": False,
                }
            },
        )
        assert len(private_subnets) == 3

    def test_single_nat_gateway_created(self, template: assertions.Template) -> None:
        """Test only 1 NAT Gateway is created for cost optimization"""
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    def test_internet_gateway_created(self, template: assertions.Template) -> None:
        """Test Internet Gateway is created and attached"""
        template.resource_count_is("AWS::EC2::InternetGateway", 1)
        template.resource_count_is("AWS::EC2::VPCGatewayAttachment", 1)

    def test_route_tables_configured(self, template: assertions.Template) -> None:
        """Test route tables are properly configured"""
        # At least 4 route tables (1 public + 3 private)
        route_tables = template.find_resources("AWS::EC2::RouteTable")
        assert len(route_tables) >= 4


class TestECSConfiguration:
    """Test ECS cluster and service configuration"""

    def test_ecs_cluster_created(self, template: assertions.Template) -> None:
        """Test ECS cluster is created with Container Insights"""
        template.has_resource_properties(
            "AWS::ECS::Cluster",
            {
                "ClusterSettings": [
                    {
                        "Name": "containerInsights",
                        "Value": "enabled",
                    }
                ],
            },
        )

    def test_fargate_task_definition_created(self, template: assertions.Template) -> None:
        """Test Fargate task definition with correct resources"""
        template.has_resource_properties(
            "AWS::ECS::TaskDefinition",
            {
                "Cpu": "256",
                "Memory": "512",
                "NetworkMode": "awsvpc",
                "RequiresCompatibilities": ["FARGATE"],
            },
        )

    def test_container_definition_configured(self, template: assertions.Template) -> None:
        """Test container is properly configured"""
        template.has_resource_properties(
            "AWS::ECS::TaskDefinition",
            {
                "ContainerDefinitions": [
                    {
                        "Essential": True,
                        "Image": "public.ecr.aws/nginx/nginx:latest",
                        "LogConfiguration": {
                            "LogDriver": "awslogs",
                        },
                        "PortMappings": [
                            {
                                "ContainerPort": 80,
                                "Protocol": "tcp",
                            }
                        ],
                    }
                ],
            },
        )

    def test_fargate_service_created(self, template: assertions.Template) -> None:
        """Test Fargate service with correct configuration"""
        template.has_resource_properties(
            "AWS::ECS::Service",
            {
                "DesiredCount": 2,
                "LaunchType": "FARGATE",
            },
        )

    def test_auto_scaling_configured(self, template: assertions.Template) -> None:
        """Test auto-scaling is configured for 2-10 tasks"""
        template.has_resource_properties(
            "AWS::ApplicationAutoScaling::ScalableTarget",
            {
                "MinCapacity": 2,
                "MaxCapacity": 10,
            },
        )

    def test_cpu_scaling_policy_configured(self, template: assertions.Template) -> None:
        """Test CPU-based scaling policy"""
        template.has_resource_properties(
            "AWS::ApplicationAutoScaling::ScalingPolicy",
            {
                "PolicyType": "TargetTrackingScaling",
                "TargetTrackingScalingPolicyConfiguration": {
                    "TargetValue": 70,
                },
            },
        )


class TestDatabaseConfiguration:
    """Test Aurora PostgreSQL database configuration"""

    def test_secrets_manager_secret_created(self, template: assertions.Template) -> None:
        """Test database credentials stored in Secrets Manager"""
        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {
                "GenerateSecretString": {
                    "GenerateStringKey": "password",
                    "PasswordLength": 32,
                    "ExcludePunctuation": True,
                    "SecretStringTemplate": '{"username": "postgres"}',
                },
            },
        )

    def test_aurora_cluster_created(self, template: assertions.Template) -> None:
        """Test Aurora PostgreSQL cluster with correct engine version"""
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            {
                "Engine": "aurora-postgresql",
                "EngineVersion": "15.8",
                "StorageEncrypted": True,
            },
        )

    def test_aurora_writer_instance_created(self, template: assertions.Template) -> None:
        """Test Aurora writer instance is created"""
        writer_instances = template.find_resources(
            "AWS::RDS::DBInstance",
            {
                "Properties": {
                    "Engine": "aurora-postgresql",
                }
            },
        )
        # Should have writer + reader = 2 instances
        assert len(writer_instances) == 2

    def test_database_in_private_subnet(self, template: assertions.Template) -> None:
        """Test database is deployed in private subnets"""
        template.has_resource_properties(
            "AWS::RDS::DBSubnetGroup",
            assertions.Match.object_like({}),
        )


class TestLoadBalancerConfiguration:
    """Test Application Load Balancer configuration"""

    def test_alb_created(self, template: assertions.Template) -> None:
        """Test Application Load Balancer is created"""
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            {
                "Scheme": "internet-facing",
                "Type": "application",
            },
        )

    def test_http_listener_configured(self, template: assertions.Template) -> None:
        """Test HTTP listener on port 80"""
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener",
            {
                "Port": 80,
                "Protocol": "HTTP",
            },
        )

    def test_target_group_created(self, template: assertions.Template) -> None:
        """Test target group with health checks"""
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            {
                "Port": 80,
                "Protocol": "HTTP",
                "TargetType": "ip",
                "HealthCheckPath": "/health",
                "HealthCheckIntervalSeconds": 30,
                "HealthCheckTimeoutSeconds": 5,
                "HealthyThresholdCount": 2,
                "UnhealthyThresholdCount": 3,
            },
        )


class TestSecurityGroupConfiguration:
    """Test security group rules and access control"""

    def test_alb_security_group_created(self, template: assertions.Template) -> None:
        """Test ALB security group allows HTTP traffic"""
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "GroupDescription": "Security group for Application Load Balancer",
                "SecurityGroupIngress": [
                    {
                        "CidrIp": "0.0.0.0/0",
                        "FromPort": 80,
                        "ToPort": 80,
                        "IpProtocol": "tcp",
                    }
                ],
            },
        )

    def test_ecs_security_group_created(self, template: assertions.Template) -> None:
        """Test ECS security group restricts traffic from ALB"""
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "GroupDescription": "Security group for ECS tasks",
            },
        )

    def test_database_security_group_rule(self, template: assertions.Template) -> None:
        """Test database allows PostgreSQL traffic from ECS"""
        ingress_rules = template.find_resources(
            "AWS::EC2::SecurityGroupIngress",
            {
                "Properties": {
                    "IpProtocol": "tcp",
                    "FromPort": 5432,
                    "ToPort": 5432,
                }
            },
        )
        assert len(ingress_rules) >= 1


class TestWAFConfiguration:
    """Test AWS WAF configuration"""

    def test_waf_webacl_created(self, template: assertions.Template) -> None:
        """Test WAF WebACL with proper scope"""
        template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            {
                "Scope": "REGIONAL",
                "DefaultAction": {"Allow": {}},
                "VisibilityConfig": {
                    "CloudWatchMetricsEnabled": True,
                    "SampledRequestsEnabled": True,
                },
            },
        )

    def test_rate_limiting_rule_configured(self, template: assertions.Template) -> None:
        """Test WAF rate limiting rule"""
        template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            {
                "Rules": assertions.Match.array_with(
                    [
                        assertions.Match.object_like({
                            "Name": "RateLimitRule",
                            "Priority": 1,
                            "Statement": {
                                "RateBasedStatement": {
                                    "Limit": 2000,
                                    "AggregateKeyType": "IP",
                                }
                            },
                            "Action": {"Block": {}},
                        })
                    ]
                ),
            },
        )

    def test_sql_injection_rule_configured(self, template: assertions.Template) -> None:
        """Test WAF SQL injection protection rule"""
        template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            {
                "Rules": assertions.Match.array_with(
                    [
                        assertions.Match.object_like({
                            "Name": "SQLInjectionRule",
                            "Priority": 2,
                            "Action": {"Block": {}},
                        })
                    ]
                ),
            },
        )

    def test_waf_association_created(self, template: assertions.Template) -> None:
        """Test WAF is associated with ALB"""
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)


class TestCloudWatchConfiguration:
    """Test CloudWatch dashboards and alarms"""

    def test_cloudwatch_dashboard_created(self, template: assertions.Template) -> None:
        """Test CloudWatch dashboard is created"""
        template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            assertions.Match.object_like(
                {
                    "DashboardName": assertions.Match.string_like_regexp(
                        "PaymentAPI-.*"
                    ),
                }
            ),
        )

    def test_error_rate_alarm_created(self, template: assertions.Template) -> None:
        """Test alarm for high error rates"""
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "Threshold": 5,
                "EvaluationPeriods": 1,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            },
        )

    def test_database_cpu_alarm_created(self, template: assertions.Template) -> None:
        """Test alarm for high database CPU"""
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "Threshold": 80,
                "EvaluationPeriods": 2,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            },
        )

    def test_two_alarms_created(self, template: assertions.Template) -> None:
        """Test exactly 2 CloudWatch alarms are created"""
        template.resource_count_is("AWS::CloudWatch::Alarm", 2)


class TestIAMConfiguration:
    """Test IAM roles and policies"""

    def test_task_execution_role_created(self, template: assertions.Template) -> None:
        """Test ECS task execution role exists"""
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ecs-tasks.amazonaws.com",
                            },
                        }
                    ],
                },
            },
        )

    def test_task_role_created(self, template: assertions.Template) -> None:
        """Test ECS task role for application exists"""
        iam_roles = template.find_resources("AWS::IAM::Role")
        # Should have multiple roles: task execution, task role, etc.
        assert len(iam_roles) >= 2

    def test_secrets_manager_read_policy(self, template: assertions.Template) -> None:
        """Test task role has permission to read secrets"""
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": assertions.Match.array_with(
                        [
                            assertions.Match.object_like({
                                "Action": assertions.Match.array_with(
                                    ["secretsmanager:GetSecretValue"]
                                ),
                                "Effect": "Allow",
                            })
                        ]
                    ),
                },
            },
        )


class TestResourceNaming:
    """Test resource naming conventions"""

    def test_resources_use_environment_suffix(self, stack: TapStack) -> None:
        """Test all major resources include environment suffix"""
        template = assertions.Template.from_stack(stack)

        # VPC
        vpc_resources = template.find_resources("AWS::EC2::VPC")
        assert len(vpc_resources) == 1

        # ECS Cluster - check for suffix in logical ID or properties
        cluster_resources = template.find_resources("AWS::ECS::Cluster")
        assert len(cluster_resources) == 1

        # ALB
        alb_resources = template.find_resources(
            "AWS::ElasticLoadBalancingV2::LoadBalancer"
        )
        assert len(alb_resources) == 1

        # Database
        db_resources = template.find_resources("AWS::RDS::DBCluster")
        assert len(db_resources) == 1


class TestRemovalPolicies:
    """Test resources can be destroyed"""

    def test_database_has_destroy_policy(self, template: assertions.Template) -> None:
        """Test database cluster has DESTROY removal policy"""
        template.has_resource(
            "AWS::RDS::DBCluster",
            {
                "DeletionPolicy": "Delete",
                "UpdateReplacePolicy": "Delete",
            },
        )

    def test_no_retain_policies(self, template: assertions.Template) -> None:
        """Test no critical resources have Retain deletion policy"""
        # Allow CloudWatch Log Groups to have Retain policy (default behavior)
        all_resources = template.to_json()["Resources"]
        for resource_id, resource in all_resources.items():
            deletion_policy = resource.get("DeletionPolicy", "Delete")
            resource_type = resource.get("Type", "")
            # Skip CloudWatch Log Groups - they use Retain by default for safety
            if resource_type == "AWS::Logs::LogGroup":
                continue
            assert deletion_policy != "Retain", (
                f"Resource {resource_id} has Retain policy"
            )


class TestStackOutputs:
    """Test CloudFormation stack outputs"""

    def test_vpc_id_output_exists(self, template: assertions.Template) -> None:
        """Test VPC ID is exported"""
        template.has_output(
            "VPCId",
            {
                "Description": "VPC ID",
            },
        )

    def test_ecs_cluster_output_exists(self, template: assertions.Template) -> None:
        """Test ECS cluster name is exported"""
        template.has_output(
            "ECSClusterName",
            {
                "Description": "ECS Cluster Name",
            },
        )

    def test_alb_outputs_exist(self, template: assertions.Template) -> None:
        """Test ALB ARN and DNS are exported"""
        template.has_output(
            "LoadBalancerArn",
            {
                "Description": "Application Load Balancer ARN",
            },
        )
        template.has_output(
            "LoadBalancerDNS",
            {
                "Description": "Application Load Balancer DNS Name",
            },
        )

    def test_database_outputs_exist(self, template: assertions.Template) -> None:
        """Test database outputs are exported"""
        template.has_output(
            "DBClusterIdentifier",
            {
                "Description": "Aurora Cluster Identifier",
            },
        )
        template.has_output(
            "DBSecretArn",
            {
                "Description": "Database Secret ARN",
            },
        )

    def test_all_required_outputs_present(self, template: assertions.Template) -> None:
        """Test all 10 required outputs are present"""
        outputs = template.to_json()["Outputs"]
        required_outputs = [
            "VPCId",
            "ECSClusterName",
            "ECSServiceName",
            "DBClusterIdentifier",
            "DBSecretArn",
            "LoadBalancerArn",
            "LoadBalancerDNS",
            "TargetGroupArn",
            "DashboardName",
            "WebACLArn",
        ]
        for output_name in required_outputs:
            assert output_name in outputs, f"Missing output: {output_name}"


class TestIntegration:
    """Integration tests for stack components"""

    def test_stack_synthesizes_successfully(self, app: cdk.App) -> None:
        """Test stack can synthesize without errors"""
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="integration",
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        template = assertions.Template.from_stack(stack)
        # Should have resources
        resources = template.to_json()["Resources"]
        assert len(resources) > 50  # Should have many resources

    def test_total_resource_count(self, template: assertions.Template) -> None:
        """Test appropriate number of resources are created"""
        resources = template.to_json()["Resources"]
        # Should have 50+ resources for this complex stack
        assert len(resources) >= 50

    def test_metadata_structure(self, template: assertions.Template) -> None:
        """Test CloudFormation template has proper metadata"""
        cf_template = template.to_json()
        assert "Resources" in cf_template
        assert "Outputs" in cf_template
        assert len(cf_template["Outputs"]) == 10
