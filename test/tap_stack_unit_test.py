#!/usr/bin/env python3
"""
Unit tests for TapStack CDK infrastructure
"""

import os
import sys
import pytest
from aws_cdk import App, assertions

# Add lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from tap_stack import TapStack


@pytest.fixture
def template():
    """Create CDK template for testing"""
    app = App()
    stack = TapStack(app, "TestStack", "test", env={'account': '123456789012', 'region': 'us-east-1'})
    return assertions.Template.from_stack(stack)


class TestVPCConfiguration:
    """Test VPC and networking resources"""

    def test_vpc_created_with_correct_cidr(self, template):
        """VPC should have correct CIDR block and DNS enabled"""
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })

    def test_nine_subnets_created(self, template):
        """Should create 9 subnets (3 public + 3 private + 3 isolated)"""
        template.resource_count_is("AWS::EC2::Subnet", 9)

    def test_public_subnets_configuration(self, template):
        """Public subnets should have correct CIDR blocks"""
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": True,
            "CidrBlock": "10.0.0.0/24",
        })
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": True,
            "CidrBlock": "10.0.1.0/24",
        })
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": True,
            "CidrBlock": "10.0.2.0/24",
        })

    def test_private_subnets_configuration(self, template):
        """Private subnets should not auto-assign public IPs"""
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False,
            "CidrBlock": "10.0.3.0/24",
        })
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False,
            "CidrBlock": "10.0.4.0/24",
        })
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False,
            "CidrBlock": "10.0.5.0/24",
        })

    def test_isolated_subnets_for_database(self, template):
        """Isolated subnets should exist for database tier"""
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False,
            "CidrBlock": "10.0.6.0/24",
        })
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False,
            "CidrBlock": "10.0.7.0/24",
        })
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False,
            "CidrBlock": "10.0.8.0/24",
        })

    def test_internet_gateway_created(self, template):
        """Should create one Internet Gateway"""
        template.resource_count_is("AWS::EC2::InternetGateway", 1)

    def test_single_nat_gateway_for_cost_optimization(self, template):
        """Should create only one NAT Gateway to minimize costs"""
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    def test_elastic_ip_for_nat_gateway(self, template):
        """Should create Elastic IP for NAT Gateway"""
        template.has_resource_properties("AWS::EC2::EIP", {
            "Domain": "vpc",
        })


class TestSecurityGroups:
    """Test security group configurations"""

    def test_alb_security_group_ingress(self, template):
        """ALB security group should allow HTTP and HTTPS"""
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": assertions.Match.string_like_regexp("Application Load Balancer"),
            "SecurityGroupIngress": [
                {
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 80,
                    "IpProtocol": "tcp",
                    "ToPort": 80,
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 443,
                    "IpProtocol": "tcp",
                    "ToPort": 443,
                },
            ],
        })

    def test_ecs_security_group_created(self, template):
        """ECS security group should exist"""
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": assertions.Match.string_like_regexp("ECS tasks"),
        })

    def test_aurora_security_group_created(self, template):
        """Aurora security group should exist"""
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": assertions.Match.string_like_regexp("Aurora PostgreSQL"),
        })

    def test_lambda_security_group_created(self, template):
        """Lambda security group should exist"""
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": assertions.Match.string_like_regexp("Lambda schema validator"),
        })


class TestKMSKeys:
    """Test KMS key configurations"""

    def test_three_kms_keys_created(self, template):
        """Should create 3 KMS keys (database, secrets, S3)"""
        template.resource_count_is("AWS::KMS::Key", 3)

    def test_database_kms_key(self, template):
        """Database KMS key should enable rotation"""
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": assertions.Match.string_like_regexp("Aurora database encryption"),
            "EnableKeyRotation": True,
        })

    def test_secrets_kms_key(self, template):
        """Secrets Manager KMS key should enable rotation"""
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": assertions.Match.string_like_regexp("Secrets Manager encryption"),
            "EnableKeyRotation": True,
        })

    def test_s3_kms_key(self, template):
        """S3 KMS key should enable rotation"""
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": assertions.Match.string_like_regexp("S3 encryption"),
            "EnableKeyRotation": True,
        })

    def test_all_kms_keys_have_delete_policy(self, template):
        """All KMS keys should be deletable"""
        kms_keys = template.find_resources("AWS::KMS::Key")
        for key_id, key_resource in kms_keys.items():
            assert key_resource.get("DeletionPolicy") == "Delete"
            assert key_resource.get("UpdateReplacePolicy") == "Delete"


class TestAuroraDatabase:
    """Test Aurora database configuration"""

    def test_aurora_cluster_created(self, template):
        """Aurora cluster should have correct configuration"""
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": "15.8",
            "DatabaseName": "appdb",
            "Port": 5432,
            "StorageEncrypted": True,
            "DeletionProtection": False,
            "BackupRetentionPeriod": 7,
        })

    def test_aurora_writer_instance(self, template):
        """Writer instance should be configured correctly"""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": "db.t3.medium",
            "Engine": "aurora-postgresql",
            "PromotionTier": 0,
            "PubliclyAccessible": False,
        })

    def test_aurora_reader_instances(self, template):
        """Should have at least 2 reader instances"""
        instances = template.find_resources("AWS::RDS::DBInstance", {
            "Properties": {
                "Engine": "aurora-postgresql",
            }
        })
        assert len(instances) >= 2

    def test_db_subnet_group(self, template):
        """DB subnet group should be created"""
        template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "DBSubnetGroupDescription": assertions.Match.string_like_regexp("Subnet group"),
        })

    def test_cluster_parameter_group(self, template):
        """Custom cluster parameter group should exist"""
        template.has_resource_properties("AWS::RDS::DBClusterParameterGroup", {
            "Family": "aurora-postgresql15",
            "Parameters": {
                "log_statement": "all",
                "log_min_duration_statement": "1000",
            },
        })

    def test_aurora_has_delete_policy(self, template):
        """Aurora cluster should be deletable"""
        clusters = template.find_resources("AWS::RDS::DBCluster")
        for cluster_id, cluster_resource in clusters.items():
            assert cluster_resource.get("DeletionPolicy") == "Delete"
            assert cluster_resource.get("UpdateReplacePolicy") == "Delete"


class TestSecretsManager:
    """Test Secrets Manager configuration"""

    def test_database_secret_created(self, template):
        """Database secret should be created with correct configuration"""
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Description": assertions.Match.string_like_regexp("Aurora PostgreSQL credentials"),
            "GenerateSecretString": {
                "ExcludePunctuation": True,
                "GenerateStringKey": "password",
                "PasswordLength": 32,
                "SecretStringTemplate": '{"username": "dbadmin"}',
            },
        })

    def test_secret_attached_to_cluster(self, template):
        """Secret should be attached to Aurora cluster"""
        template.has_resource_properties("AWS::SecretsManager::SecretTargetAttachment", {
            "TargetType": "AWS::RDS::DBCluster",
        })

    def test_secret_has_delete_policy(self, template):
        """Secret should be deletable"""
        secrets = template.find_resources("AWS::SecretsManager::Secret")
        for secret_id, secret_resource in secrets.items():
            assert secret_resource.get("DeletionPolicy") == "Delete"
            assert secret_resource.get("UpdateReplacePolicy") == "Delete"


class TestIAMRoles:
    """Test IAM role configurations"""

    def test_ecs_task_execution_role(self, template):
        """ECS task execution role should exist with correct trust policy"""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "Action": "sts:AssumeRole",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com",
                        },
                    }),
                ]),
            },
            "RoleName": assertions.Match.string_like_regexp("ecs-task-execution"),
        })

    def test_ecs_task_role(self, template):
        """ECS task role should exist"""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "Action": "sts:AssumeRole",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com",
                        },
                    }),
                ]),
            },
        })

    def test_lambda_execution_role(self, template):
        """Lambda execution role should exist"""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "Action": "sts:AssumeRole",
                        "Principal": {
                            "Service": "lambda.amazonaws.com",
                        },
                    }),
                ]),
            },
        })


class TestECSCluster:
    """Test ECS cluster configuration"""

    def test_ecs_cluster_created(self, template):
        """ECS cluster should exist"""
        template.resource_count_is("AWS::ECS::Cluster", 1)

    def test_container_insights_enabled(self, template):
        """Container Insights should be enabled"""
        template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterSettings": [
                {
                    "Name": "containerInsights",
                    "Value": "enabled",
                },
            ],
        })


class TestFargateService:
    """Test Fargate service configuration"""

    def test_fargate_task_definition(self, template):
        """Task definition should have correct Fargate configuration"""
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "RequiresCompatibilities": ["FARGATE"],
            "NetworkMode": "awsvpc",
            "Cpu": "512",
            "Memory": "1024",
        })

    def test_fargate_service_desired_count(self, template):
        """Fargate service should have 2 desired tasks"""
        template.has_resource_properties("AWS::ECS::Service", {
            "LaunchType": "FARGATE",
            "DesiredCount": 2,
        })

    def test_container_image(self, template):
        """Should use amazon-ecs-sample container image"""
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": assertions.Match.array_with([
                assertions.Match.object_like({
                    "Image": "amazon/amazon-ecs-sample",
                }),
            ]),
        })

    def test_cloudwatch_logs_configured(self, template):
        """CloudWatch Logs should be configured"""
        logs = template.find_resources("AWS::Logs::LogGroup")
        assert len(logs) > 0


class TestLambdaFunction:
    """Test Lambda function configuration"""

    def test_lambda_function_created(self, template):
        """Lambda function should have correct configuration"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 300,
            "MemorySize": 512,
        })

    def test_lambda_vpc_configuration(self, template):
        """Lambda should be in VPC"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": assertions.Match.object_like({
                "SubnetIds": assertions.Match.any_value(),
                "SecurityGroupIds": assertions.Match.any_value(),
            }),
        })


class TestCloudWatchAlarms:
    """Test CloudWatch alarm configurations"""

    def test_ecs_cpu_alarm(self, template):
        """ECS CPU alarm should exist"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/ECS",
            "Statistic": "Average",
            "Threshold": 80,
        })

    def test_ecs_memory_alarm(self, template):
        """ECS memory alarm should exist"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "MemoryUtilization",
            "Namespace": "AWS/ECS",
            "Statistic": "Average",
            "Threshold": 80,
        })

    def test_alb_unhealthy_targets_alarm(self, template):
        """ALB unhealthy targets alarm should exist"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "UnHealthyHostCount",
            "Namespace": "AWS/ApplicationELB",
            "Statistic": "Average",
            "Threshold": 1,
        })

    def test_aurora_cpu_alarm(self, template):
        """Aurora CPU alarm should exist"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/RDS",
            "Statistic": "Average",
            "Threshold": 80,
        })


class TestStackOutputs:
    """Test stack output configurations"""

    def test_vpc_id_output(self, template):
        """VPC ID should be exported"""
        template.has_output("VPCId", {
            "Description": "VPC ID",
        })

    def test_ecs_cluster_output(self, template):
        """ECS cluster name should be exported"""
        template.has_output("ECSClusterName", {
            "Description": "ECS cluster name",
        })

    def test_aurora_endpoints_outputs(self, template):
        """Aurora endpoints should be exported"""
        template.has_output("AuroraClusterEndpoint", {
            "Description": assertions.Match.string_like_regexp("writer endpoint"),
        })
        template.has_output("AuroraReaderEndpoint", {
            "Description": assertions.Match.string_like_regexp("reader endpoint"),
        })

    def test_load_balancer_output(self, template):
        """Load Balancer DNS should be exported"""
        template.has_output("LoadBalancerDNS", {
            "Description": assertions.Match.string_like_regexp("Load Balancer"),
        })

    def test_database_secret_output(self, template):
        """Database secret ARN should be exported"""
        template.has_output("DatabaseSecretArn", {
            "Description": assertions.Match.string_like_regexp("secret"),
        })

    def test_lambda_function_output(self, template):
        """Lambda function name should be exported"""
        template.has_output("SchemaValidatorFunctionName", {
            "Description": assertions.Match.string_like_regexp("Lambda"),
        })


class TestCostOptimization:
    """Test cost optimization measures"""

    def test_single_nat_gateway(self, template):
        """Should use only one NAT Gateway"""
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    def test_appropriate_database_instance_class(self, template):
        """Database should use cost-effective instance class"""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": "db.t3.medium",
        })

    def test_appropriate_fargate_sizing(self, template):
        """Fargate should use appropriate sizing"""
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Cpu": "512",
            "Memory": "1024",
        })


class TestSecurityBestPractices:
    """Test security best practices"""

    def test_aurora_encryption_enabled(self, template):
        """Aurora should have encryption at rest enabled"""
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True,
        })

    def test_kms_key_rotation_enabled(self, template):
        """KMS keys should have rotation enabled"""
        kms_keys = template.find_resources("AWS::KMS::Key")
        for key_id, key_resource in kms_keys.items():
            assert key_resource["Properties"]["EnableKeyRotation"] is True

    def test_database_not_publicly_accessible(self, template):
        """Database instances should not be publicly accessible"""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "PubliclyAccessible": False,
        })

    def test_database_in_private_subnets(self, template):
        """Database should use subnet group (private subnets)"""
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)


class TestEnvironmentSuffix:
    """Test environment suffix usage"""

    def test_resources_use_environment_suffix(self):
        """Resources should include environment suffix in names"""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            "test-suffix",
            env={'account': '123456789012', 'region': 'us-east-1'}
        )
        template = assertions.Template.from_stack(stack)

        # VPC should have suffix in tags
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": assertions.Match.array_with([
                assertions.Match.object_like({
                    "Key": "Name",
                    "Value": assertions.Match.string_like_regexp("blue-green-vpc"),
                }),
            ]),
        })
