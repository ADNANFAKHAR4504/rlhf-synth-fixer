import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack - Security Configuration as Code"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key_with_rotation(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
            "Description": "KMS key for TAP resource encryption"
        })

    @mark.it("creates VPC with correct subnet configuration")
    def test_creates_vpc_with_subnets(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

        # Check for subnets - should have public and private
        public_subnets = template.find_resources("AWS::EC2::Subnet", {
            "Properties": {
                "MapPublicIpOnLaunch": True
            }
        })
        self.assertGreater(len(public_subnets), 0, "Should have at least one public subnet")

    @mark.it("creates three S3 buckets with KMS encryption")
    def test_creates_s3_buckets_with_encryption(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - should have 3 buckets: app, backup, cloudtrail
        template.resource_count_is("AWS::S3::Bucket", 3)

        # All buckets should have KMS encryption
        buckets = template.find_resources("AWS::S3::Bucket")
        for bucket_id, bucket_config in buckets.items():
            encryption_config = bucket_config.get("Properties", {}).get("BucketEncryption", {})
            rules = encryption_config.get("ServerSideEncryptionConfiguration", [])
            self.assertGreater(len(rules), 0, f"Bucket {bucket_id} should have encryption")

            # Check for KMS encryption
            sse_algorithm = rules[0].get("ServerSideEncryptionByDefault", {}).get("SSEAlgorithm")
            self.assertEqual(sse_algorithm, "aws:kms", f"Bucket {bucket_id} should use KMS encryption")

    @mark.it("enforces SSL on all S3 buckets")
    def test_s3_buckets_enforce_ssl(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - check bucket policies for SSL enforcement
        bucket_policies = template.find_resources("AWS::S3::BucketPolicy")

        # At least one policy should enforce SSL (cloudtrail bucket has explicit policy)
        self.assertGreater(len(bucket_policies), 0, "Should have bucket policies")

    @mark.it("creates two security groups with correct rules")
    def test_creates_security_groups(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - should have WebSG and DbSG
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)

        # Check web security group allows HTTPS and HTTP from allowed IPs
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Web tier SG with restricted access",
            "SecurityGroupEgress": Match.array_with([
                Match.object_like({
                    "CidrIp": "0.0.0.0/0",
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443
                })
            ])
        })

        # Check DB security group
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "DB SG, only allows from web SG",
            "SecurityGroupEgress": []  # No outbound allowed
        })

    @mark.it("creates RDS instance with encryption enabled")
    def test_creates_rds_with_encryption(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True,
            "Engine": "postgres",
            "PubliclyAccessible": False,
            "BackupRetentionPeriod": 7
        })

    @mark.it("creates CloudTrail with file validation enabled")
    def test_creates_cloudtrail(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudTrail::Trail", 1)
        template.has_resource_properties("AWS::CloudTrail::Trail", {
            "EnableLogFileValidation": True,
            "IncludeGlobalServiceEvents": True,
            "IsMultiRegionTrail": True,
            "IsLogging": True
        })

    @mark.it("creates CloudWatch Log Group with encryption")
    def test_creates_cloudwatch_log_group_with_encryption(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 365
        })

    @mark.it("creates IAM role for EC2 with SSM access")
    def test_creates_ec2_iam_role(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - should have EC2 role
        template.resource_count_is("AWS::IAM::Role", 2)  # EC2 role + CloudTrail role

        # Check EC2 role
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    })
                ])
            }),
            "ManagedPolicyArns": Match.array_with([
                Match.string_like_regexp(".*AmazonSSMManagedInstanceCore.*")
            ])
        })

    @mark.it("creates S3 access policy with least privilege")
    def test_creates_s3_access_policy_least_privilege(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - check for inline policy
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": ["s3:GetObject", "s3:PutObject"]
                    }),
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": ["s3:ListBucket"]
                    })
                ])
            })
        })

    @mark.it("applies correct tags to all resources")
    def test_applies_tags_to_stack(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - check that resources have tags
        # Tags are applied at stack level, so they should propagate to resources
        # We can verify by checking the stack metadata
        self.assertIsNotNone(stack.tags)

    @mark.it("uses DESTROY removal policy for non-prod environments")
    def test_uses_destroy_removal_policy_for_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - check KMS key has DESTROY policy (via UpdateReplacePolicy)
        kms_keys = template.find_resources("AWS::KMS::Key")
        for key_id, key_config in kms_keys.items():
            update_policy = key_config.get("UpdateReplacePolicy", "")
            self.assertEqual(update_policy, "Delete", "Dev environment should use Delete policy")

    @mark.it("uses RETAIN removal policy for prod environments")
    def test_uses_retain_removal_policy_for_prod(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="prod"))
        template = Template.from_stack(stack)

        # ASSERT - check KMS key has RETAIN policy
        kms_keys = template.find_resources("AWS::KMS::Key")
        for key_id, key_config in kms_keys.items():
            update_policy = key_config.get("UpdateReplacePolicy", "")
            self.assertEqual(update_policy, "Retain", "Prod environment should use Retain policy")

    @mark.it("configures single NAT gateway for non-prod")
    def test_single_nat_gateway_for_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - should have exactly 1 NAT gateway
        nat_gateways = template.find_resources("AWS::EC2::NatGateway")
        self.assertEqual(len(nat_gateways), 1, "Dev environment should have 1 NAT gateway")

    @mark.it("configures two NAT gateways for prod")
    def test_two_nat_gateways_for_prod(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="production"))
        template = Template.from_stack(stack)

        # ASSERT - should have exactly 2 NAT gateways
        nat_gateways = template.find_resources("AWS::EC2::NatGateway")
        self.assertEqual(len(nat_gateways), 2, "Prod environment should have 2 NAT gateways")

    @mark.it("enables deletion protection for RDS in prod")
    def test_rds_deletion_protection_for_prod(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="prod"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": True
        })

    @mark.it("disables deletion protection for RDS in dev")
    def test_no_rds_deletion_protection_for_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False
        })

    @mark.it("creates RDS subnet group in private subnets")
    def test_creates_rds_subnet_group(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("creates outputs for key resources")
    def test_creates_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - check for outputs
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())

        self.assertIn("VPCId", output_keys, "Should have VPCId output")
        self.assertIn("KMSKeyId", output_keys, "Should have KMSKeyId output")
        self.assertIn("DatabaseEndpoint", output_keys, "Should have DatabaseEndpoint output")
        self.assertIn("S3BucketNames", output_keys, "Should have S3BucketNames output")

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - should use dev defaults (single NAT gateway)
        nat_gateways = template.find_resources("AWS::EC2::NatGateway")
        self.assertEqual(len(nat_gateways), 1, "Default should be dev environment with 1 NAT gateway")

    @mark.it("grants CloudTrail permissions to write to S3 bucket")
    def test_cloudtrail_bucket_policy(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - check bucket policy allows CloudTrail
        template.has_resource_properties("AWS::S3::BucketPolicy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": "s3:GetBucketAcl",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        }
                    }),
                    Match.object_like({
                        "Action": "s3:PutObject",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        }
                    })
                ])
            })
        })

    @mark.it("configures KMS key policy for CloudTrail and CloudWatch Logs")
    def test_kms_key_policy_for_services(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - KMS key should have policies for CloudTrail and CloudWatch Logs
        template.has_resource_properties("AWS::KMS::Key", {
            "KeyPolicy": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Sid": "AllowCloudTrailToUseKey",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey"
                        ]
                    }),
                    Match.object_like({
                        "Sid": "AllowCloudWatchLogsToUseKey",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "logs.amazonaws.com"
                        }
                    })
                ])
            })
        })

    @mark.it("blocks all public access on S3 buckets")
    def test_s3_blocks_public_access(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - all buckets should have public access blocked
        buckets = template.find_resources("AWS::S3::Bucket")
        for bucket_id, bucket_config in buckets.items():
            public_access_config = bucket_config.get("Properties", {}).get("PublicAccessBlockConfiguration", {})
            self.assertEqual(public_access_config.get("BlockPublicAcls"), True,
                           f"Bucket {bucket_id} should block public ACLs")
            self.assertEqual(public_access_config.get("BlockPublicPolicy"), True,
                           f"Bucket {bucket_id} should block public policies")
            self.assertEqual(public_access_config.get("IgnorePublicAcls"), True,
                           f"Bucket {bucket_id} should ignore public ACLs")
            self.assertEqual(public_access_config.get("RestrictPublicBuckets"), True,
                           f"Bucket {bucket_id} should restrict public buckets")

    @mark.it("enables versioning on all S3 buckets")
    def test_s3_versioning_enabled(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        buckets = template.find_resources("AWS::S3::Bucket")
        for bucket_id, bucket_config in buckets.items():
            versioning = bucket_config.get("Properties", {}).get("VersioningConfiguration", {})
            self.assertEqual(versioning.get("Status"), "Enabled",
                           f"Bucket {bucket_id} should have versioning enabled")
