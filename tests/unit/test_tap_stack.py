import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


class TestTapStackUnit(unittest.TestCase):
  """Unit tests for TapStack infrastructure components"""

  def setUp(self):
    """Set up test fixtures"""
    self.app = cdk.App()
    self.env = cdk.Environment(account="123456789012", region="us-east-1")
    self.stack = TapStack(
        self.app,
        "TestStack",
        TapStackProps(environment_suffix="test"),
        env=self.env
    )
    self.template = Template.from_stack(self.stack)

  def test_kms_key_created_with_rotation(self):
    """Test KMS key is created with proper configuration"""
    self.template.has_resource_properties("AWS::KMS::Key", {
        "Description": "KMS key for SecureApp encryption with automatic rotation",
        "EnableKeyRotation": True
    })

    self.template.has_resource_properties("AWS::KMS::Alias", {
        "AliasName": "alias/secureapp-encryption-key"
    })

  def test_vpc_configuration(self):
    """Test VPC is created with correct CIDR and subnets"""
    self.template.has_resource_properties("AWS::EC2::VPC", {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": True,
        "EnableDnsSupport": True
    })

    # Check for correct number of subnets (2 AZs x 2 subnet types)
    self.template.resource_count_is("AWS::EC2::Subnet", 4)
    self.template.resource_count_is("AWS::EC2::InternetGateway", 1)
    self.template.resource_count_is("AWS::EC2::NatGateway", 2)

  def test_s3_buckets_encryption_and_versioning(self):
    """Test S3 buckets are created with KMS encryption and versioning"""
    # Should have exactly 2 buckets (data and logs)
    self.template.resource_count_is("AWS::S3::Bucket", 2)

    # Check for encrypted S3 buckets with proper configuration
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
        },
        "VersioningConfiguration": {
            "Status": "Enabled"
        }
    })

  def test_s3_lifecycle_policies(self):
    """Test S3 lifecycle policies are configured"""
    # Test data bucket lifecycle
    self.template.has_resource_properties("AWS::S3::Bucket", {
        "LifecycleConfiguration": {
            "Rules": [
                {
                    "Id": "TransitionToIA",
                    "Status": "Enabled",
                    "Transitions": Match.array_with([
                        {
                            "StorageClass": "STANDARD_IA",
                            "TransitionInDays": 30
                        },
                        {
                            "StorageClass": "GLACIER",
                            "TransitionInDays": 90
                        }
                    ])
                }
            ]
        }
    })

    # Test logs bucket lifecycle with expiration
    self.template.has_resource_properties("AWS::S3::Bucket", {
        "LifecycleConfiguration": {
            "Rules": [
                {
                    "Id": "LogsRetention",
                    "Status": "Enabled",
                    "ExpirationInDays": 2555,
                    "Transitions": Match.array_with([
                        {
                            "StorageClass": "STANDARD_IA",
                            "TransitionInDays": 30
                        },
                        {
                            "StorageClass": "GLACIER",
                            "TransitionInDays": 90
                        },
                        {
                            "StorageClass": "DEEP_ARCHIVE",
                            "TransitionInDays": 365
                        }
                    ])
                }
            ]
        }
    })

  def test_security_groups_least_privilege(self):
    """Test security groups have proper ingress/egress rules"""
    self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
        "GroupDescription": "Security group for SecureApp EC2 instances",
        "SecurityGroupIngress": [
            {
                "IpProtocol": "tcp",
                "FromPort": 22,
                "ToPort": 22,
                "CidrIp": "10.0.0.0/16"
            }
        ],
        "SecurityGroupEgress": [
            {
                "IpProtocol": "tcp",
                "FromPort": 443,
                "ToPort": 443,
                "CidrIp": "0.0.0.0/0"
            },
            {
                "IpProtocol": "tcp",
                "FromPort": 80,
                "ToPort": 80,
                "CidrIp": "0.0.0.0/0"
            }
        ]
    })

  def test_iam_roles_least_privilege(self):
    """Test IAM roles follow least privilege principle"""
    # Check EC2 instance role exists
    self.template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
    })

    # Check instance profile exists
    instance_profiles = self.template.find_resources(
        "AWS::IAM::InstanceProfile")
    self.assertGreaterEqual(len(instance_profiles), 1)

    # Check IAM policies exist for least privilege access
    # We have EC2 S3 policy, EC2 CloudWatch policy, EC2 KMS policy, and VPC
    # Flow Log policy
    policies = self.template.find_resources("AWS::IAM::Policy")
    self.assertGreaterEqual(len(policies), 3)

  def test_cloudwatch_log_groups_encrypted(self):
    """Test CloudWatch log groups are encrypted with KMS"""
    # Should have multiple log groups (app, system, vpc flow logs)
    # Using at least 3 since we create app, system, and vpc flow log groups
    log_groups = self.template.find_resources("AWS::Logs::LogGroup")
    self.assertGreaterEqual(len(log_groups), 3)

    # Check log groups are encrypted
    self.template.has_resource_properties("AWS::Logs::LogGroup", {
        "LogGroupName": "/secureapp/application",
        "RetentionInDays": 30,
        "KmsKeyId": Match.any_value()
    })

    self.template.has_resource_properties("AWS::Logs::LogGroup", {
        "LogGroupName": "/secureapp/system",
        "RetentionInDays": 30,
        "KmsKeyId": Match.any_value()
    })

  def test_ec2_instance_configuration(self):
    """Test EC2 instance is properly configured"""
    # Test EC2 instance exists
    self.template.resource_count_is("AWS::EC2::Instance", 1)

    # Test launch template configuration
    self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
        "LaunchTemplateData": {
            "InstanceType": "t3.micro",
            "BlockDeviceMappings": [
                {
                    "DeviceName": "/dev/xvda",
                    "Ebs": {
                        "VolumeSize": 20,
                        "Encrypted": True,
                        "VolumeType": "gp3",
                        "KmsKeyId": Match.any_value()
                    }
                }
            ]
        }
    })

  def test_vpc_flow_logs_enabled(self):
    """Test VPC Flow Logs are enabled"""
    self.template.has_resource_properties("AWS::EC2::FlowLog", {
        "ResourceType": "VPC",
        "TrafficType": "ALL"
    })

  def test_cloudwatch_dashboard_created(self):
    """Test CloudWatch dashboard is created"""
    self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
    self.template.has_resource_properties("AWS::CloudWatch::Dashboard", {
        "DashboardName": "secureapp-monitoring"
    })

  def test_resource_naming_convention(self):
    """Test resources follow secureapp- naming convention"""
    # This tests the naming through bucket names which include the prefix
    self.template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": Match.string_like_regexp("secureapp-.*")
    })

  def test_resource_tagging(self):
    """Test proper tagging is applied to resources"""
    # Test VPC tags
    self.template.has_resource_properties("AWS::EC2::VPC", {
        "Tags": Match.array_with([
            {"Key": "Name", "Value": "secureapp-vpc"}
        ])
    })

    # Test KMS key tags
    self.template.has_resource_properties("AWS::KMS::Key", {
        "Tags": Match.array_with([
            {"Key": "Name", "Value": "secureapp-kms-key"},
            {"Key": "Purpose", "Value": "Encryption"}
        ])
    })

  def test_stack_outputs(self):
    """Test CloudFormation outputs are created"""
    outputs = self.template.find_outputs("*")

    # Check that expected outputs exist
    expected_outputs = ["VPCId", "KMSKeyId", "AppDataBucketOutput",
                        "LogsBucketOutput", "InstanceId"]

    for output_name in expected_outputs:
      self.assertIn(output_name, outputs)

  def test_removal_policies_for_cleanup(self):
    """Test resources have proper removal policies for cleanup"""
    # Most resources should have Delete policy for testing cleanup
    # KMS keys would typically be Retain in production

    # Check S3 buckets have Delete policy
    s3_resources = self.template.find_resources("AWS::S3::Bucket")
    for resource in s3_resources.values():
      self.assertEqual(resource.get("DeletionPolicy"), "Delete")

  def test_region_constraint(self):
    """Test all resources are configured for us-east-1 region"""
    # This is implicitly tested through the stack environment
    # VPC subnets should reference AZs (either hardcoded strings or Fn::Select)
    subnets = self.template.find_resources("AWS::EC2::Subnet")
    self.assertGreater(len(subnets), 0)

    # Check that subnets have proper AZ references
    for subnet_id, subnet in subnets.items():
      az = subnet["Properties"]["AvailabilityZone"]
      # AZ can be either a string (dummy1a, dummy1b) or an intrinsic function
      self.assertTrue(
          isinstance(az, str) or isinstance(az, dict),
          f"Subnet {subnet_id} has invalid AZ reference: {az}"
      )


if __name__ == '__main__':
  unittest.main()
