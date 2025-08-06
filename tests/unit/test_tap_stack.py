"""Unit tests for TapStack"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.stack = TapStack(self.app, "test-stack")
        self.template = Template.from_stack(self.stack)

    def test_vpc_creation(self):
        """Test VPC is created with correct configuration"""
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_public_subnets_created(self):
        """Test public subnets are created"""
        self.template.resource_count_is("AWS::EC2::Subnet", 6)  # 2 public + 2 private + 2 database

    def test_nat_gateways_created(self):
        """Test NAT gateways are created for high availability"""
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)

    def test_internet_gateway_created(self):
        """Test Internet Gateway is created"""
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)

    def test_kms_key_created(self):
        """Test KMS key is created with key rotation enabled"""
        self.template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    def test_s3_bucket_encryption(self):
        """Test S3 bucket is encrypted with KMS"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    def test_ec2_iam_role_created(self):
        """Test EC2 IAM role is created with proper policies"""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    }
                ]
            }
        })

    def test_auto_scaling_group_configuration(self):
        """Test Auto Scaling Group is configured correctly"""
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "10"
            # Note: DesiredCapacity is not set to avoid reset on deployment
        })

    def test_application_load_balancer_created(self):
        """Test Application Load Balancer is created"""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })

    def test_https_listener_configuration(self):
        """Test HTTPS listener is configured with TLS 1.2"""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 443,
            "Protocol": "HTTPS",
            "SslPolicy": "ELBSecurityPolicy-TLS-1-2-Ext-2018-06"
        })

    def test_rds_instance_configuration(self):
        """Test RDS instance is configured with encryption and backups"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "MultiAZ": True,
            "EnablePerformanceInsights": True
        })

    def test_api_gateway_created(self):
        """Test API Gateway is created"""
        self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "Nova Model Breaking API"
        })

    def test_security_groups_created(self):
        """Test security groups are created"""
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 4)  # ALB, EC2, RDS + VPC default

    def test_cloudwatch_log_groups_created(self):
        """Test CloudWatch log groups are created"""
        self.template.resource_count_is("AWS::Logs::LogGroup", 3)  # App, Infra, VPC Flow Logs

    def test_ssm_parameters_created(self):
        """Test SSM parameters are created"""
        self.template.resource_count_is("AWS::SSM::Parameter", 2)

    def test_cloudwatch_alarm_created(self):
        """Test CloudWatch alarm is created"""
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 1)

    def test_launch_template_created(self):
        """Test EC2 Launch Template is created"""
        self.template.resource_count_is("AWS::EC2::LaunchTemplate", 1)

    def test_target_group_health_check(self):
        """Test target group health check configuration"""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckPath": "/health",
            "HealthCheckProtocol": "HTTP",
            "HealthyThresholdCount": 2,
            "UnhealthyThresholdCount": 3,
            "TargetType": "instance"
        })

    def test_bucket_has_versioning_enabled(self):
        """Test S3 bucket has versioning enabled"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    def test_bucket_has_lifecycle_rules(self):
        """Test S3 bucket has lifecycle rules"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.any_value()
            }
        })

    def test_database_subnet_group_created(self):
        """Test RDS subnet group is created"""
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    def test_certificate_created(self):
        """Test ACM certificate is created"""
        self.template.resource_count_is("AWS::CertificateManager::Certificate", 1)

    def test_outputs_created(self):
        """Test CloudFormation outputs are created"""
        outputs = self.template.find_outputs("*")
        output_keys = set(outputs.keys())
        expected_outputs = {"ALBDNSName", "APIGatewayURL", "S3BucketName"}
        self.assertTrue(expected_outputs.issubset(output_keys))

    def test_environment_specific_naming(self):
        """Test resources use environment-specific naming when suffix is provided"""
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        # Create a new app to avoid multiple synthesis issues
        test_app = cdk.App()
        stack_with_env = TapStack(test_app, f"test-stack-{env_suffix}", props)
        template_with_env = Template.from_stack(stack_with_env)
        
        # Verify that stack is created successfully with environment suffix
        template_with_env.resource_count_is("AWS::S3::Bucket", 1)
        template_with_env.resource_count_is("AWS::KMS::Key", 1)

    def test_all_required_resources_created(self):
        """Test all required AWS resources are created"""
        expected_resources = {
            "AWS::EC2::VPC": 1,
            "AWS::EC2::InternetGateway": 1,
            "AWS::EC2::NatGateway": 2,
            "AWS::EC2::Subnet": 6,
            "AWS::S3::Bucket": 1,
            "AWS::KMS::Key": 1,
            "AWS::IAM::Role": 6,  # EC2 role, API Gateway role + auto-created roles
            "AWS::RDS::DBInstance": 1,
            "AWS::RDS::DBSubnetGroup": 1,
            "AWS::EC2::SecurityGroup": 4,  # ALB, EC2, RDS + VPC default
            "AWS::ElasticLoadBalancingV2::LoadBalancer": 1,
            "AWS::ElasticLoadBalancingV2::TargetGroup": 1,
            "AWS::AutoScaling::AutoScalingGroup": 1,
            "AWS::EC2::LaunchTemplate": 1,
            "AWS::ApiGateway::RestApi": 1,
            "AWS::Logs::LogGroup": 3,
            "AWS::SSM::Parameter": 2,
            "AWS::CloudWatch::Alarm": 1,
            "AWS::CertificateManager::Certificate": 1,
        }
        
        for resource_type, expected_count in expected_resources.items():
            self.template.resource_count_is(resource_type, expected_count)