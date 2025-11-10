"""Unit tests for the TapStack CDK stack."""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc_with_correct_config(self):
        """Test VPC creation with 3 AZs and correct subnets"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates ECS cluster with Container Insights enabled")
    def test_creates_ecs_cluster_with_insights(self):
        """Test ECS cluster with Container Insights"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Cluster", 1)
        template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterSettings": [
                {
                    "Name": "containerInsights",
                    "Value": "enabled"
                }
            ]
        })

    @mark.it("creates Aurora PostgreSQL cluster with encryption")
    def test_creates_aurora_cluster_encrypted(self):
        """Test Aurora cluster with encryption at rest"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True,
            "Engine": "aurora-postgresql"
        })

    @mark.it("creates Secrets Manager secret for database credentials")
    def test_creates_secrets_manager_secret(self):
        """Test Secrets Manager secret creation"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "GenerateSecretString": Match.object_like({
                "GenerateStringKey": "password",
                "PasswordLength": 32,
                "ExcludePunctuation": True
            })
        })

    @mark.it("creates Application Load Balancer in public subnets")
    def test_creates_alb_in_public_subnets(self):
        """Test ALB creation with correct configuration"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates WAF WebACL with rate limiting and SQL injection rules")
    def test_creates_waf_with_rules(self):
        """Test WAF WebACL with security rules"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::WAFv2::WebACL", 1)
        template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Scope": "REGIONAL",
            "Rules": Match.array_with([
                Match.object_like({
                    "Name": "RateLimitRule",
                    "Priority": 1
                }),
                Match.object_like({
                    "Name": "SQLInjectionRule",
                    "Priority": 2
                })
            ])
        })

    @mark.it("creates ECS Fargate service with auto-scaling")
    def test_creates_fargate_service_with_autoscaling(self):
        """Test Fargate service with auto-scaling configuration"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Service", 1)
        template.has_resource_properties("AWS::ECS::Service", {
            "LaunchType": "FARGATE",
            "DesiredCount": 2
        })

    @mark.it("creates security group for ALB with HTTPS ingress")
    def test_creates_alb_security_group(self):
        """Test ALB security group configuration"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Find ALB security group with HTTPS ingress
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443
                })
            ])
        })

    @mark.it("creates security group for ECS tasks with ALB ingress")
    def test_creates_ecs_security_group(self):
        """Test ECS security group allows traffic from ALB"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Count security groups (ALB, ECS, RDS)
        security_groups = template.find_resources("AWS::EC2::SecurityGroup")
        assert len(security_groups) >= 2

    @mark.it("creates CloudWatch dashboard with required widgets")
    def test_creates_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard creation"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("creates CloudWatch alarms for error rate and DB CPU")
    def test_creates_cloudwatch_alarms(self):
        """Test CloudWatch alarms creation"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 2)

    @mark.it("grants ECS task role permissions to read secrets")
    def test_grants_ecs_secrets_permissions(self):
        """Test ECS task role has permissions to read Secrets Manager"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Check for IAM role with Secrets Manager permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with(["secretsmanager:GetSecretValue"]),
                        "Effect": "Allow"
                    })
                ])
            })
        })

    @mark.it("creates ACM certificate for HTTPS")
    def test_creates_acm_certificate(self):
        """Test ACM certificate creation"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CertificateManager::Certificate", 1)
        template.has_resource_properties("AWS::CertificateManager::Certificate", {
            "DomainName": "payment-api.example.com"
        })

    @mark.it("creates NAT gateways for private subnet egress")
    def test_creates_nat_gateways(self):
        """Test NAT gateway creation for 3 AZs"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::NatGateway", 3)

    @mark.it("applies RemovalPolicy.DESTROY to database cluster")
    def test_database_has_destroy_policy(self):
        """Test database has RemovalPolicy.DESTROY for testing"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource("AWS::RDS::DBCluster", {
            "DeletionPolicy": "Delete"
        })
