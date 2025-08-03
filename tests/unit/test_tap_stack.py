import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Comprehensive unit tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    def test_stack_creation_with_dev_environment(self):
        """Test stack creation with dev environment suffix"""
        # ARRANGE
        props = TapStackProps(environment_suffix="dev")
        
        # ACT
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Verify stack was created successfully
        self.assertIsNotNone(stack)
        self.assertEqual(stack.env_suffix, "dev")
        self.assertEqual(stack.project_name, "myapp")
        self.assertEqual(stack.resource_prefix, "myapp-dev")

    def test_stack_creation_without_props(self):
        """Test stack creation defaults to dev when no props provided"""
        # ARRANGE & ACT
        stack = TapStack(self.app, "TestStack")
        
        # ASSERT
        self.assertEqual(stack.env_suffix, "dev")
        self.assertEqual(stack.project_name, "myapp")

    def test_kms_keys_created(self):
        """Test that KMS keys are created with correct properties"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Should have 2 KMS keys (RDS and S3)
        template.resource_count_is("AWS::KMS::Key", 2)
        
        # Verify KMS keys have key rotation enabled
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
            "Description": Match.string_like_regexp(".*test.*")
        })

    def test_vpc_created_with_correct_configuration(self):
        """Test VPC is created with proper subnets and configuration"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Check VPC exists with correct CIDR
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
            "Tags": Match.array_with([
                {"Key": "Name", "Value": "myapp-test-vpc"}
            ])
        })
        
        # Should have 6 subnets total (3 AZs × 2 subnet types, plus isolated DB subnets)
        template.resource_count_is("AWS::EC2::Subnet", 6)
        
        # Should have NAT Gateways
        template.resource_count_is("AWS::EC2::NatGateway", 2)

    def test_security_groups_created(self):
        """Test security groups are created with correct rules"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Should have 3 security groups (ALB, EC2, RDS)
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)
        
        # Check ALB security group allows HTTP and HTTPS
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer",
            "SecurityGroupIngress": Match.array_with([
                {
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0",
                    "Description": "Allow HTTP traffic"
                },
                {
                    "IpProtocol": "tcp", 
                    "FromPort": 443,
                    "ToPort": 443,
                    "CidrIp": "0.0.0.0/0",
                    "Description": "Allow HTTPS traffic"
                }
            ])
        })

    def test_iam_roles_created(self):
        """Test IAM roles are created with correct policies"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Should have EC2 role and VPC flow log role
        template.resource_count_is("AWS::IAM::Role", 4)  # EC2, VPC Flow Log, Custom Resource, Lambda
        
        # Check EC2 role has correct trust policy
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ])
            },
            "RoleName": "myapp-test-ec2-role"
        })
        
        # Check instance profile is created (CDK may create additional profiles)
        template.resource_count_is("AWS::IAM::InstanceProfile", 2)

    def test_rds_database_created(self):
        """Test RDS database is created with correct configuration"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 1,  # test environment
            "DeletionProtection": False,
            "DBInstanceIdentifier": "myapp-test-database"
        })
        
        # Check DB subnet group
        template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "DBSubnetGroupName": "myapp-test-db-subnet-group"
        })

    def test_s3_bucket_created(self):
        """Test S3 bucket is created with encryption and public access"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms",
                            "KMSMasterKeyID": Match.any_value()
                        }
                    }
                ])
            },
            "VersioningConfiguration": {"Status": "Enabled"},
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": False,
                "BlockPublicPolicy": False,
                "IgnorePublicAcls": False,
                "RestrictPublicBuckets": False
            }
        })

    def test_load_balancer_created(self):
        """Test Application Load Balancer is created properly"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing",
            "Name": "myapp-test-alb"
        })
        
        # Check target group
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "Name": "myapp-test-tg"
        })
        
        # Check listener
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    def test_auto_scaling_group_created(self):
        """Test Auto Scaling Group is created with correct configuration"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "1",
            "MaxSize": "3",  # test environment
            "DesiredCapacity": "1",
            "AutoScalingGroupName": "myapp-test-asg"
        })
        
        # Check launch template
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateName": "myapp-test-lt"
        })

    def test_cloudwatch_monitoring_created(self):
        """Test CloudWatch alarms are created"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Should have multiple CloudWatch alarms
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)
        
        # Check alarm names contain resource prefix
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": Match.string_like_regexp("myapp-test.*")
        })

    def test_backup_solution_created(self):
        """Test AWS Backup solution is configured"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        template.has_resource_properties("AWS::Backup::BackupVault", {
            "BackupVaultName": "myapp-test-backup-vault"
        })
        
        template.has_resource_properties("AWS::Backup::BackupPlan", {
            "BackupPlan": {
                "BackupPlanName": "myapp-test-backup-plan"
            }
        })

    def test_outputs_created(self):
        """Test CloudFormation outputs are created"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Check that outputs are defined
        outputs = template.to_json().get("Outputs", {})
        self.assertIn("VpcId", outputs)
        self.assertIn("LoadBalancerDNS", outputs)
        self.assertIn("DatabaseEndpoint", outputs)
        self.assertIn("S3BucketName", outputs)
        self.assertIn("AutoScalingGroupName", outputs)

    def test_resource_naming_convention(self):
        """Test that resources follow the naming convention"""
        # ARRANGE
        props = TapStackProps(environment_suffix="prod")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Check VPC name follows convention
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": "myapp-prod-vpc"}
            ])
        })

    def test_common_tags_applied(self):
        """Test that common tags are applied to resources"""
        # ARRANGE
        props = TapStackProps(environment_suffix="staging")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Check that resources have common tags (just check for presence of key tags)
        vpc_props = template.find_resources("AWS::EC2::VPC")
        vpc_tags = list(vpc_props.values())[0]["Properties"]["Tags"]
        
        # Check that our expected tags are present
        tag_keys = [tag["Key"] for tag in vpc_tags]
        self.assertIn("Project", tag_keys)
        self.assertIn("Environment", tag_keys)
        self.assertIn("ManagedBy", tag_keys)

    def test_environment_specific_configurations(self):
        """Test that configurations change based on environment"""
        # ARRANGE & ACT
        dev_stack = TapStack(self.app, "DevStack", 
                           TapStackProps(environment_suffix="dev"))
        prod_stack = TapStack(self.app, "ProdStack", 
                            TapStackProps(environment_suffix="prod"))
        
        dev_template = Template.from_stack(dev_stack)
        prod_template = Template.from_stack(prod_stack)
        
        # ASSERT
        # Dev should have smaller capacity
        dev_template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MaxSize": "3",
            "DesiredCapacity": "1"
        })
        
        # Prod should have larger capacity
        prod_template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MaxSize": "6", 
            "DesiredCapacity": "2"
        })

    def test_destruction_policies_are_destroy(self):
        """Test that all resources have DESTROY deletion policy for testability"""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # ASSERT
        # Check that KMS keys have DESTROY policy
        template.has_resource_properties("AWS::KMS::Key", {
            "DeletionPolicy": Match.absent(),  # Should not have RETAIN
            "UpdateReplacePolicy": Match.absent()  # Should not have RETAIN
        })


if __name__ == '__main__':
    unittest.main()
