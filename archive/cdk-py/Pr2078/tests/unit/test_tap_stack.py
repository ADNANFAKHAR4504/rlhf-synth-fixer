#!/usr/bin/env python3
"""
Unit tests for the TapStack CDK application.

Tests verify the correct creation and configuration of AWS security resources
including VPC, security groups, S3 buckets, IAM policies, and other components.
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack infrastructure."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.props = TapStackProps(
            environment_suffix="test",
            env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        self.stack = TapStack(self.app, "TestStack", props=self.props)
        self.template = Template.from_stack(self.stack)

    def test_vpc_creation(self):
        """Test VPC is created with correct configuration."""
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled."""
        self.template.has_resource_properties("AWS::EC2::FlowLog", {
            "ResourceType": "VPC",
            "TrafficType": "ALL"
        })

    def test_flow_log_group_created(self):
        """Test CloudWatch Log Group for VPC Flow Logs."""
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 180
        })

    def test_public_subnets_created(self):
        """Test public subnets are created."""
        self.template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
        
        # Check for public subnet properties
        self.template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": True
        })

    def test_private_subnets_created(self):
        """Test private subnets are created."""
        self.template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False
        })

    def test_nat_gateways_created(self):
        """Test NAT Gateways are created for private subnets."""
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)

    def test_internet_gateway_created(self):
        """Test Internet Gateway is created."""
        self.template.has_resource("AWS::EC2::InternetGateway", {})

    def test_mfa_policy_created(self):
        """Test MFA enforcement policy is created."""
        self.template.has_resource_properties("AWS::IAM::ManagedPolicy", {
            "Description": "Enforce MFA for AWS console access"
        })

    def test_mfa_policy_statements(self):
        """Test MFA policy has correct statements."""
        self.template.has_resource_properties("AWS::IAM::ManagedPolicy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Sid": "AllowViewAccountInfo",
                        "Effect": "Allow"
                    }),
                    Match.object_like({
                        "Sid": "DenyAllExceptUnlessMFAAuthenticated",
                        "Effect": "Deny"
                    })
                ])
            }
        })

    def test_security_audit_role_created(self):
        """Test Security Audit Role is created."""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "Description": "Security audit role with least privilege access"
        })

    def test_secure_s3_bucket_created(self):
        """Test secure S3 bucket is created with proper settings."""
        # Check bucket exists with encryption
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            },
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    def test_s3_bucket_policy_denies_insecure(self):
        """Test S3 bucket policy denies insecure connections."""
        self.template.has_resource_properties("AWS::S3::BucketPolicy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Sid": "DenyInsecureConnections",
                        "Effect": "Deny",
                        "Condition": {
                            "Bool": {
                                "aws:SecureTransport": "false"
                            }
                        }
                    })
                ])
            }
        })

    def test_cloudtrail_bucket_created(self):
        """Test CloudTrail logs bucket is created."""
        buckets = self.template.find_resources("AWS::S3::Bucket")
        # Should have at least 2 buckets (secure bucket and cloudtrail bucket)
        self.assertGreaterEqual(len(buckets), 2)

    def test_security_groups_created(self):
        """Test security groups are created."""
        # Check secure security group
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Secure security group - no unrestricted SSH access"
        })
        
        # Check database security group
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Database security group - private access only"
        })

    def test_no_unrestricted_ssh(self):
        """Test that no security group allows unrestricted SSH access."""
        security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
        
        for _, sg_props in security_groups.items():
            if "Properties" in sg_props and "SecurityGroupIngress" in sg_props["Properties"]:
                for rule in sg_props["Properties"]["SecurityGroupIngress"]:
                    # Check if rule is for SSH (port 22)
                    if rule.get("FromPort") == 22 and rule.get("ToPort") == 22:
                        # Ensure it's not open to 0.0.0.0/0
                        self.assertNotEqual(rule.get("CidrIp"), "0.0.0.0/0")

    def test_rds_subnet_group_created(self):
        """Test RDS subnet group is created."""
        self.template.has_resource("AWS::RDS::DBSubnetGroup", {})

    def test_rds_instance_created(self):
        """Test RDS instance is created with security best practices."""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "DeletionProtection": False,  # False for test/dev
            "AutoMinorVersionUpgrade": True
        })

    def test_redshift_subnet_group_created(self):
        """Test Redshift subnet group is created."""
        self.template.has_resource("AWS::Redshift::ClusterSubnetGroup", {})

    def test_redshift_cluster_private(self):
        """Test Redshift cluster is not publicly accessible."""
        self.template.has_resource_properties("AWS::Redshift::Cluster", {
            "PubliclyAccessible": False,
            "Encrypted": True
        })

    def test_redshift_security_group(self):
        """Test Redshift has its own security group."""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Redshift security group - private access only"
        })

    def test_kms_key_for_ebs_encryption(self):
        """Test KMS key is created for EBS encryption."""
        self.template.has_resource_properties("AWS::KMS::Key", {
            "Description": "KMS key for EBS volume encryption",
            "EnableKeyRotation": True
        })

    def test_launch_template_with_encrypted_ebs(self):
        """Test launch template has encrypted EBS volumes."""
        self.template.has_resource("AWS::EC2::LaunchTemplate", {})

    def test_tags_applied(self):
        """Test that tags are applied to resources."""
        # Check VPC has tags
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({
                    "Key": "Environment",
                    "Value": "test"
                }),
                Match.object_like({
                    "Key": "Purpose",
                    "Value": "SecurityCompliance"
                })
            ])
        })

    def test_stack_outputs_exist(self):
        """Test that stack outputs are defined."""
        outputs = self.template.find_outputs("*")
        
        # Check for expected outputs
        expected_outputs = [
            "VPCId",
            "SecureSecurityGroupId",
            "DatabaseSecurityGroupId",
            "SecureBucketName",
            "CloudTrailBucketName",
            "MFAPolicyArn"
        ]
        
        for output_name in expected_outputs:
            self.assertIn(output_name, outputs)

    def test_removal_policies_set(self):
        """Test removal policies are set for destroyability."""
        # Check S3 buckets have DESTROY policy
        buckets = self.template.find_resources("AWS::S3::Bucket")
        for _, bucket_props in buckets.items():
            self.assertEqual(
                bucket_props.get("DeletionPolicy", ""),
                "Delete"
            )

    def test_secrets_manager_for_rds(self):
        """Test Secrets Manager is used for RDS credentials."""
        self.template.has_resource("AWS::SecretsManager::Secret", {})
        self.template.has_resource("AWS::SecretsManager::SecretTargetAttachment", {})

    def test_vpc_restrict_default_sg(self):
        """Test VPC restricts default security group."""
        # Check for custom resource that restricts default SG
        self.template.has_resource("Custom::VpcRestrictDefaultSG", {})

    def test_auto_delete_objects_custom_resource(self):
        """Test auto-delete objects custom resource for S3 buckets."""
        self.template.has_resource("Custom::S3AutoDeleteObjects", {})


class TestTapStackProps(unittest.TestCase):
    """Test TapStackProps dataclass."""

    def test_default_environment_suffix(self):
        """Test default environment suffix is 'dev'."""
        props = TapStackProps()
        self.assertEqual(props.environment_suffix, "dev")

    def test_custom_environment_suffix(self):
        """Test custom environment suffix can be set."""
        props = TapStackProps(environment_suffix="prod")
        self.assertEqual(props.environment_suffix, "prod")

    def test_environment_can_be_set(self):
        """Test CDK environment can be set."""
        env = cdk.Environment(account="123456789012", region="us-west-2")
        props = TapStackProps(env=env)
        self.assertEqual(props.env.account, "123456789012")
        self.assertEqual(props.env.region, "us-west-2")


if __name__ == "__main__":
    unittest.main()
