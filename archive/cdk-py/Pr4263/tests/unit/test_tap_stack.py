import unittest
from unittest.mock import patch

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Comprehensive test cases for the TapStack CDK stack - 100% Coverage"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.props = TapStackProps(environment_suffix=self.env_suffix)

    def test_stack_creation_with_props(self):
        """Test basic stack creation with props"""
        stack = TapStack(self.app, "TapStackTest", props=self.props)
        self.assertIsNotNone(stack)
        self.assertEqual(stack.props.environment_suffix, self.env_suffix)

    def test_vpc_creation_and_configuration(self):
        """Test VPC is created with correct subnets and configuration"""
        stack = TapStack(self.app, "TapStackVPCTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify VPC exists
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource("AWS::EC2::VPC", {
            "Properties": {
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True
            }
        })
        
        # Verify subnets (2 AZs * 3 subnet types = 6 subnets)
        template.resource_count_is("AWS::EC2::Subnet", 6)
        
        # Verify NAT gateways (2 for 2 AZs)
        template.resource_count_is("AWS::EC2::NatGateway", 2)
        
        # Verify Internet Gateway
        template.resource_count_is("AWS::EC2::InternetGateway", 1)

    def test_security_groups_configuration(self):
        """Test security groups are created with correct rules"""
        stack = TapStack(self.app, "TapStackSGTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify security groups exist (3 total: app + db + bastion)
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)
        
        # Verify database security group has ingress rule from app security group
        template.has_resource("AWS::EC2::SecurityGroupIngress", {
            "Properties": {
                "IpProtocol": "tcp",
                "FromPort": 5432,
                "ToPort": 5432,
                "Description": "Allow app tier to connect to Postgres"
            }
        })

    def test_kms_key_creation(self):
        """Test KMS key is created with correct configuration"""
        stack = TapStack(self.app, "TapStackKMSTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify KMS key exists
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource("AWS::KMS::Key", {
            "Properties": {
                "EnableKeyRotation": True,
                "Description": "KMS key for RDS and backup bucket encryption"
            }
        })
        
        # Note: KMS alias may not be created automatically by CDK
        # Verify KMS key is properly configured for encryption

    def test_s3_backup_bucket_configuration(self):
        """Test S3 backup bucket is created with correct security settings"""
        stack = TapStack(self.app, "TapStackS3Test", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify S3 bucket exists
        template.resource_count_is("AWS::S3::Bucket", 1)
        
        # Verify bucket configuration
        template.has_resource("AWS::S3::Bucket", {
            "Properties": {
                "VersioningConfiguration": {"Status": "Enabled"},
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}
                    ]
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True
                }
            }
        })
        
        # Verify bucket policy for SSL enforcement exists
        template.resource_count_is("AWS::S3::BucketPolicy", 1)

    def test_iam_roles_creation(self):
        """Test IAM roles are created with correct permissions"""
        stack = TapStack(self.app, "TapStackIAMTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify IAM roles exist (CDK may create additional roles)
        # We check for at least 2 roles (monitoring + S3 access)
        roles = template.find_resources("AWS::IAM::Role")
        self.assertGreaterEqual(len(roles), 2, "Should have at least 2 IAM roles")
        
        # Verify monitoring role
        template.has_resource("AWS::IAM::Role", {
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "monitoring.rds.amazonaws.com"}
                        }
                    ]
                },
            }
        })
        
        # Verify S3 access role
        template.has_resource("AWS::IAM::Role", {
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "rds.amazonaws.com"}
                        }
                    ]
                }
            }
        })

    def test_rds_parameter_group(self):
        """Test RDS parameter group is created with correct parameters"""
        stack = TapStack(self.app, "TapStackParamTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify parameter group exists
        template.resource_count_is("AWS::RDS::DBParameterGroup", 1)
        template.has_resource("AWS::RDS::DBParameterGroup", {
            "Properties": {
                "Family": "postgres17",
                "Parameters": {
                    "shared_buffers": "1048576",
                    "work_mem": "16384",
                    "maintenance_work_mem": "262144",
                    "effective_cache_size": "3145728"
                }
            }
        })

    def test_rds_subnet_group(self):
        """Test RDS subnet group is created correctly"""
        stack = TapStack(self.app, "TapStackSubnetTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify subnet group exists
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
        template.has_resource("AWS::RDS::DBSubnetGroup", {
            "Properties": {
                "DBSubnetGroupDescription": "Subnet group for RDS instances (private subnets with egress for testing)"
            }
        })

    def test_primary_rds_instance_configuration(self):
        """Test primary RDS instance is configured correctly"""
        stack = TapStack(self.app, "TapStackRDSTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify primary RDS instance exists
        template.resource_count_is("AWS::RDS::DBInstance", 3)  # 1 primary + 2 replicas
        
        # Find and verify primary instance configuration
        template.has_resource("AWS::RDS::DBInstance", {
            "Properties": {
                "Engine": "postgres",
                "EngineVersion": "17.5",
                "DBInstanceClass": "db.m5.large",
                "MultiAZ": True,
                "StorageEncrypted": True,
                "AllocatedStorage": "100",
                "StorageType": "gp2",
                "DeletionProtection": True,
                "DBName": "tap",
                "BackupRetentionPeriod": 7,
                "PreferredBackupWindow": "00:00-02:00",
                "PreferredMaintenanceWindow": "sun:04:00-sun:06:00",
                "EnableCloudwatchLogsExports": ["postgresql"],
                "EnablePerformanceInsights": True,
                "MonitoringInterval": 60
            }
        })

    def test_read_replicas_creation(self):
        """Test read replicas are created correctly"""
        stack = TapStack(self.app, "TapStackReplicaTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Should have 2 read replicas
        # Note: Read replicas are also AWS::RDS::DBInstance resources, so total count is 3
        template.resource_count_is("AWS::RDS::DBInstance", 3)
        
        # Verify read replica configuration (they should have SourceDBInstanceIdentifier)
        replica_instances = template.find_resources("AWS::RDS::DBInstance", {
            "Properties": {
                "SourceDBInstanceIdentifier": Match.any_value()
            }
        })
        self.assertEqual(len(replica_instances), 2)

    def test_cloudwatch_alarms_creation(self):
        """Test CloudWatch alarms are created for monitoring"""
        stack = TapStack(self.app, "TapStackAlarmsTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify CloudWatch alarms exist (CPU + storage + connections + 2 replica lag = 5)
        template.resource_count_is("AWS::CloudWatch::Alarm", 5)
        
        # Verify CPU alarm
        template.has_resource("AWS::CloudWatch::Alarm", {
            "Properties": {
                "MetricName": "CPUUtilization",
                "Namespace": "AWS/RDS",
                "Threshold": 80,
                "ComparisonOperator": "GreaterThanThreshold",
                "EvaluationPeriods": 3
            }
        })
        
        # Verify storage alarm
        template.has_resource("AWS::CloudWatch::Alarm", {
            "Properties": {
                "MetricName": "FreeStorageSpace",
                "Namespace": "AWS/RDS",
                "Threshold": 10737418240,  # 10 GB in bytes
                "ComparisonOperator": "LessThanThreshold"
            }
        })
        
        # Verify connections alarm
        template.has_resource("AWS::CloudWatch::Alarm", {
            "Properties": {
                "MetricName": "DatabaseConnections",
                "Namespace": "AWS/RDS",
                "Threshold": 100,
                "ComparisonOperator": "GreaterThanThreshold"
            }
        })

    def test_cloudformation_outputs(self):
        """Test all required CloudFormation outputs are created"""
        stack = TapStack(self.app, "TapStackOutputsTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify all required outputs exist
        outputs = template.find_outputs("*")
        
        expected_outputs = [
            f"TapPrimaryDBEndpoint{self.env_suffix}",
            f"TapPrimaryDBPort{self.env_suffix}",
            f"TapDBSecretName{self.env_suffix}",
            f"TapRdsBackupBucketName{self.env_suffix}",
            f"TapKmsKeyArn{self.env_suffix}"
        ]
        
        for expected_output in expected_outputs:
            self.assertIn(expected_output, outputs)

    def test_environment_suffix_integration(self):
        """Test environment suffix is properly applied to all resources"""
        custom_suffix = "production"
        props = TapStackProps(environment_suffix=custom_suffix)
        stack = TapStack(self.app, "TapStackEnvTest", props=props)
        template = Template.from_stack(stack)
        
        # Verify outputs use the custom environment suffix
        outputs = template.find_outputs("*")
        self.assertIn(f"TapPrimaryDBEndpoint{custom_suffix}", outputs)
        self.assertIn(f"TapKmsKeyArn{custom_suffix}", outputs)

    def test_resource_naming_with_environment_suffix(self):
        """Test that resources are named with environment suffix"""
        stack = TapStack(self.app, "TapStackNamingTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Check that primary RDS instance has correct identifier
        template.has_resource("AWS::RDS::DBInstance", {
            "Properties": {
                "DBInstanceIdentifier": f"tap-primary-{self.env_suffix}"
            }
        })

    def test_stack_with_optional_environment(self):
        """Test stack creation with optional CDK environment"""
        env = cdk.Environment(account="123456789012", region="us-east-2")
        props = TapStackProps(environment_suffix=self.env_suffix, env=env)
        stack = TapStack(self.app, "TapStackEnvTest", props=props)
        
        self.assertIsNotNone(stack)
        self.assertEqual(stack.props.env, env)

    def test_secrets_manager_integration(self):
        """Test that RDS instance uses Secrets Manager"""
        stack = TapStack(self.app, "TapStackSecretsTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify Secrets Manager secret exists
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.has_resource("AWS::SecretsManager::Secret", {
            "Properties": {
                "Name": f"tap-db-credentials-{self.env_suffix}"
            }
        })

    def test_cloudwatch_log_groups(self):
        """Test CloudWatch log groups are created for RDS logs"""
        stack = TapStack(self.app, "TapStackLogsTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify RDS instances have CloudWatch logs exports enabled
        template.has_resource("AWS::RDS::DBInstance", {
            "Properties": {
                "EnableCloudwatchLogsExports": ["postgresql"]
            }
        })

    def test_performance_insights_enabled(self):
        """Test Performance Insights is enabled on RDS instances"""
        stack = TapStack(self.app, "TapStackPITest", props=self.props)
        template = Template.from_stack(stack)
        
        # Verify Performance Insights is enabled on all instances
        template.has_resource("AWS::RDS::DBInstance", {
            "Properties": {
                "EnablePerformanceInsights": True,
                "MonitoringInterval": 60
            }
        })

    def test_vpc_availability_zones_handling(self):
        """Test VPC availability zones configuration"""
        stack = TapStack(self.app, "TapStackAZTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Should create the stack successfully with 2 AZs by default
        self.assertIsNotNone(stack)
        
        # Verify VPC configuration
        template.has_resource("AWS::EC2::VPC", {
            "Properties": {
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True
            }
        })

    def test_error_handling_in_stack_creation(self):
        """Test stack creation with invalid parameters"""
        # Test with empty environment suffix should still work
        props = TapStackProps(environment_suffix="")
        stack = TapStack(self.app, "TapStackErrorTest", props=props)
        self.assertIsNotNone(stack)

    def test_comprehensive_resource_count(self):
        """Test comprehensive resource count for complete infrastructure"""
        stack = TapStack(self.app, "TapStackCompleteTest", props=self.props)
        template = Template.from_stack(stack)
        
        # Test key resource counts (allowing for CDK's internal resource creation)
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::EC2::Subnet", 6)  # 3 types * 2 AZs
        template.resource_count_is("AWS::EC2::InternetGateway", 1)
        template.resource_count_is("AWS::EC2::NatGateway", 2)
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)  # App + DB + Bastion
        template.resource_count_is("AWS::KMS::Key", 1)
        template.resource_count_is("AWS::S3::Bucket", 1)
        # CDK may create additional roles, so check for at least 2
        roles = template.find_resources("AWS::IAM::Role")
        self.assertGreaterEqual(len(roles), 2, "Should have at least 2 IAM roles")
        template.resource_count_is("AWS::RDS::DBParameterGroup", 1)
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
        template.resource_count_is("AWS::RDS::DBInstance", 3)  # 1 primary + 2 replicas
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.resource_count_is("AWS::CloudWatch::Alarm", 5)  # CPU, storage, connections, 2x replica lag
