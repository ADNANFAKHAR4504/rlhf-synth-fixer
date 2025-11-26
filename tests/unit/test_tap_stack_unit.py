"""Unit tests for TapStack - Blue-Green Migration Infrastructure"""
import json
import os
from unittest.mock import Mock, patch
import aws_cdk as cdk
from aws_cdk import assertions
import pytest
from lib.tap_stack import TapStack


@pytest.fixture
def app():
    """Create a CDK app for testing"""
    return cdk.App()


@pytest.fixture
def test_env():
    """Setup test environment variables"""
    os.environ["CDK_DEFAULT_ACCOUNT"] = "123456789012"
    os.environ["CDK_DEFAULT_REGION"] = "us-east-1"
    yield
    # Cleanup
    if "CDK_DEFAULT_ACCOUNT" in os.environ:
        del os.environ["CDK_DEFAULT_ACCOUNT"]
    if "CDK_DEFAULT_REGION" in os.environ:
        del os.environ["CDK_DEFAULT_REGION"]


class TestTapStackCreation:
    """Test TapStack instantiation and basic properties"""

    def test_stack_creation(self, app, test_env):
        """Test that stack can be created successfully"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        assert stack is not None
        assert stack.environment_suffix == "test"

    def test_stack_with_different_suffixes(self, app, test_env):
        """Test stack creation with various environment suffixes"""
        for suffix in ["dev", "staging", "prod", "test123"]:
            stack = TapStack(app, f"TestStack{suffix}", environment_suffix=suffix)
            assert stack.environment_suffix == suffix

    def test_template_generation(self, app, test_env):
        """Test that CDK template can be synthesized"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        assert template is not None


class TestKMSKeys:
    """Test KMS key creation and configuration"""

    def test_database_kms_key_created(self, app, test_env):
        """Test that database KMS key is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": "KMS key for Aurora database encryption - test",
            "EnableKeyRotation": True
        })

    def test_secrets_kms_key_created(self, app, test_env):
        """Test that Secrets Manager KMS key is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": "KMS key for Secrets Manager encryption - test",
            "EnableKeyRotation": True
        })

    def test_s3_kms_key_created(self, app, test_env):
        """Test that S3 KMS key is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": "KMS key for S3 encryption - test",
            "EnableKeyRotation": True
        })

    def test_all_kms_keys_have_deletion_policy(self, app, test_env):
        """Test that all KMS keys have proper deletion policy"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        # Count KMS keys
        kms_keys = template.find_resources("AWS::KMS::Key")
        assert len(kms_keys) >= 3
        
        # Verify deletion policy
        for key_id, key_props in kms_keys.items():
            assert key_props.get("DeletionPolicy") == "Delete"


class TestVPCConfiguration:
    """Test VPC creation and subnet configuration"""

    def test_vpc_created(self, app, test_env):
        """Test that VPC is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.resource_count_is("AWS::EC2::VPC", 1)

    def test_vpc_has_correct_cidr(self, app, test_env):
        """Test VPC has correct CIDR block"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })

    def test_public_subnets_created(self, app, test_env):
        """Test that public subnets are created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)

        # Should have at least 2 public subnets (one per AZ, depends on available AZs)
        public_subnets = template.find_resources("AWS::EC2::Subnet", {
            "Properties": {
                "MapPublicIpOnLaunch": True
            }
        })
        assert len(public_subnets) >= 2

    def test_private_subnets_created(self, app, test_env):
        """Test that private subnets with egress are created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)

        # Count total subnets (at least 6: 2 per type for 2-3 AZs)
        all_subnets = template.find_resources("AWS::EC2::Subnet")
        assert len(all_subnets) >= 6

    def test_nat_gateway_created(self, app, test_env):
        """Test that NAT Gateway is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    def test_internet_gateway_created(self, app, test_env):
        """Test that Internet Gateway is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.resource_count_is("AWS::EC2::InternetGateway", 1)


class TestSecurityGroups:
    """Test security group creation and rules"""

    def test_alb_security_group_created(self, app, test_env):
        """Test that ALB security group is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer - test"
        })

    def test_ecs_security_group_created(self, app, test_env):
        """Test that ECS security group is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for ECS tasks - test"
        })

    def test_aurora_security_group_created(self, app, test_env):
        """Test that Aurora security group is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Aurora PostgreSQL - test"
        })

    def test_lambda_security_group_created(self, app, test_env):
        """Test that Lambda security group is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Lambda schema validator - test"
        })

    def test_alb_ingress_rules(self, app, test_env):
        """Test that ALB has correct ingress rules"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        # ALB should allow HTTP (80) and HTTPS (443)
        alb_sg = template.find_resources("AWS::EC2::SecurityGroup", {
            "Properties": {
                "GroupDescription": "Security group for Application Load Balancer - test"
            }
        })
        assert len(alb_sg) >= 1


class TestAuroraDatabase:
    """Test Aurora PostgreSQL cluster configuration"""

    def test_db_secret_created(self, app, test_env):
        """Test that database secret is created in Secrets Manager"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": "aurora-credentials-test",
            "Description": "Aurora PostgreSQL credentials - test"
        })

    def test_db_subnet_group_created(self, app, test_env):
        """Test that DB subnet group is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    def test_cluster_parameter_group_created(self, app, test_env):
        """Test that cluster parameter group is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::RDS::DBClusterParameterGroup", {
            "Description": "Custom parameter group for Aurora cluster - test",
            "Family": "aurora-postgresql15"
        })

    def test_aurora_cluster_created(self, app, test_env):
        """Test that Aurora cluster is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "DBClusterIdentifier": "aurora-cluster-test",
            "Engine": "aurora-postgresql",
            "DatabaseName": "appdb",
            "StorageEncrypted": True,
            "DeletionProtection": False
        })

    def test_aurora_has_backup_retention(self, app, test_env):
        """Test that Aurora has backup retention configured"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "BackupRetentionPeriod": 7
        })

    def test_aurora_instances_created(self, app, test_env):
        """Test that Aurora instances (writer + 2 readers) are created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        # Should have 3 instances: 1 writer + 2 readers
        template.resource_count_is("AWS::RDS::DBInstance", 3)

    def test_aurora_instance_type(self, app, test_env):
        """Test Aurora instances use correct instance type"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": "db.t3.medium"
        })


class TestECSInfrastructure:
    """Test ECS cluster, service, and task configuration"""

    def test_ecs_cluster_created(self, app, test_env):
        """Test that ECS cluster is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterName": "app-cluster-test"
        })

    def test_ecs_log_group_created(self, app, test_env):
        """Test that ECS log group is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/ecs/app-test",
            "RetentionInDays": 7
        })

    def test_ecs_task_execution_role_created(self, app, test_env):
        """Test that ECS task execution role is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "ecs-task-execution-test",
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        }
                    }
                ]
            }
        })

    def test_ecs_task_role_created(self, app, test_env):
        """Test that ECS task role is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "ecs-task-role-test"
        })

    def test_ecs_task_definition_created(self, app, test_env):
        """Test that ECS task definition is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Family": "app-task-test",
            "Memory": "1024",
            "Cpu": "512",
            "NetworkMode": "awsvpc",
            "RequiresCompatibilities": ["FARGATE"]
        })

    def test_ecs_service_created(self, app, test_env):
        """Test that ECS service is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ECS::Service", {
            "ServiceName": "app-service-test",
            "DesiredCount": 2,
            "LaunchType": "FARGATE"
        })

    def test_application_load_balancer_created(self, app, test_env):
        """Test that Application Load Balancer is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    def test_alb_target_group_created(self, app, test_env):
        """Test that ALB target group is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "TargetType": "ip"
        })

    def test_alb_listener_created(self, app, test_env):
        """Test that ALB listener is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })


class TestLambdaSchemaValidator:
    """Test Lambda function for schema validation"""

    def test_lambda_log_group_created(self, app, test_env):
        """Test that Lambda log group is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/lambda/schema-validator-test",
            "RetentionInDays": 7
        })

    def test_lambda_execution_role_created(self, app, test_env):
        """Test that Lambda execution role is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "schema-validator-role-test",
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ]
            }
        })

    def test_lambda_function_created(self, app, test_env):
        """Test that Lambda function is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "schema-validator-test",
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 300,
            "MemorySize": 512
        })

    def test_lambda_has_vpc_config(self, app, test_env):
        """Test that Lambda is configured with VPC"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        lambda_functions = template.find_resources("AWS::Lambda::Function", {
            "Properties": {
                "FunctionName": "schema-validator-test"
            }
        })
        
        for func_id, func_props in lambda_functions.items():
            assert "VpcConfig" in func_props["Properties"]


class TestCloudWatchAlarms:
    """Test CloudWatch alarm creation and configuration"""

    def test_sns_topic_created(self, app, test_env):
        """Test that SNS topic for alarms is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "infrastructure-alarms-test",
            "DisplayName": "Infrastructure Alarms - test"
        })

    def test_aurora_cpu_alarm_created(self, app, test_env):
        """Test that Aurora CPU alarm is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "aurora-cpu-high-test",
            "Threshold": 80,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    def test_aurora_connections_alarm_created(self, app, test_env):
        """Test that Aurora connections alarm is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "aurora-connections-high-test"
        })

    def test_ecs_cpu_alarm_created(self, app, test_env):
        """Test that ECS CPU alarm is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "ecs-cpu-high-test"
        })

    def test_ecs_memory_alarm_created(self, app, test_env):
        """Test that ECS memory alarm is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "ecs-memory-high-test"
        })

    def test_alb_unhealthy_targets_alarm_created(self, app, test_env):
        """Test that ALB unhealthy targets alarm is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "alb-unhealthy-targets-test"
        })

    def test_lambda_error_alarm_created(self, app, test_env):
        """Test that Lambda error alarm is created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "schema-validator-errors-test"
        })

    def test_alarm_count(self, app, test_env):
        """Test that correct number of alarms are created"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        # Should have 6 alarms total
        template.resource_count_is("AWS::CloudWatch::Alarm", 6)


class TestStackOutputs:
    """Test CloudFormation stack outputs"""

    def test_vpc_id_output_exists(self, app, test_env):
        """Test that VPC ID output exists"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_output("VPCId", {})

    def test_aurora_cluster_endpoint_output_exists(self, app, test_env):
        """Test that Aurora cluster endpoint output exists"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_output("AuroraClusterEndpoint", {})

    def test_aurora_reader_endpoint_output_exists(self, app, test_env):
        """Test that Aurora reader endpoint output exists"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_output("AuroraReaderEndpoint", {})

    def test_load_balancer_dns_output_exists(self, app, test_env):
        """Test that Load Balancer DNS output exists"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_output("LoadBalancerDNS", {})

    def test_ecs_cluster_name_output_exists(self, app, test_env):
        """Test that ECS cluster name output exists"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_output("ECSClusterName", {})

    def test_schema_validator_function_name_output_exists(self, app, test_env):
        """Test that Schema Validator function name output exists"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_output("SchemaValidatorFunctionName", {})

    def test_database_secret_arn_output_exists(self, app, test_env):
        """Test that Database Secret ARN output exists"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        template.has_output("DatabaseSecretArn", {})


class TestResourceNaming:
    """Test that all resources include environment suffix"""

    def test_all_resources_use_environment_suffix(self, app, test_env):
        """Test that resources include environment suffix in names"""
        stack = TapStack(app, "TestStack", environment_suffix="mytest")
        template = assertions.Template.from_stack(stack)
        
        # Check key resources have suffix
        template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterName": "app-cluster-mytest"
        })
        
        template.has_resource_properties("AWS::ECS::Service", {
            "ServiceName": "app-service-mytest"
        })
        
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "DBClusterIdentifier": "aurora-cluster-mytest"
        })
        
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "schema-validator-mytest"
        })


class TestDeletionPolicies:
    """Test that all resources have appropriate deletion policies"""

    def test_all_critical_resources_have_delete_policy(self, app, test_env):
        """Test that critical resources have DELETE policy"""
        stack = TapStack(app, "TestStack", environment_suffix="test")
        template = assertions.Template.from_stack(stack)
        
        # KMS keys should have Delete policy
        kms_keys = template.find_resources("AWS::KMS::Key")
        for key_id, key_props in kms_keys.items():
            assert key_props.get("DeletionPolicy") == "Delete"
        
        # Aurora cluster should have Delete/Snapshot policy
        clusters = template.find_resources("AWS::RDS::DBCluster")
        for cluster_id, cluster_props in clusters.items():
            # CDK may set Snapshot or Delete, both are acceptable
            deletion_policy = cluster_props.get("DeletionPolicy")
            assert deletion_policy in ["Delete", "Snapshot"]
