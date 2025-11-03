import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with environment suffix")
    def test_creates_s3_bucket_with_env_suffix(self):
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"catalog-archive-{env_suffix}"
        })

    @mark.it("creates S3 bucket with KMS encryption")
    def test_s3_bucket_has_kms_encryption(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            }
        })

    @mark.it("creates S3 bucket with versioning enabled")
    def test_s3_bucket_has_versioning(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    @mark.it("creates S3 bucket with lifecycle rule")
    def test_s3_bucket_has_lifecycle_rule(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        s3_buckets = template.find_resources("AWS::S3::Bucket")
        assert len(s3_buckets) == 1

        for bucket in s3_buckets.values():
            assert "LifecycleConfiguration" in bucket["Properties"]

    @mark.it("creates VPC with DNS support")
    def test_creates_vpc_with_dns(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates VPC with subnets")
    def test_creates_vpc_subnets(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        subnets = template.find_resources("AWS::EC2::Subnet")
        assert len(subnets) >= 2

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key_with_rotation(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    @mark.it("creates Kinesis stream with encryption")
    def test_creates_kinesis_stream_encrypted(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Kinesis::Stream", 1)
        template.has_resource_properties("AWS::Kinesis::Stream", {
            "StreamEncryption": {
                "EncryptionType": "KMS"
            }
        })

    @mark.it("creates Kinesis stream with shard count")
    def test_kinesis_stream_has_shards(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Kinesis::Stream", {
            "ShardCount": 2
        })

    @mark.it("creates RDS database instance")
    def test_creates_rds_instance(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::RDS::DBInstance", 1)

    @mark.it("creates RDS with storage encryption")
    def test_rds_has_encryption(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })

    @mark.it("creates RDS with backup retention")
    def test_rds_has_backups(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7
        })

    @mark.it("creates RDS with PostgreSQL engine")
    def test_rds_uses_postgres(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres"
        })

    @mark.it("creates ElastiCache cluster")
    def test_creates_elasticache_cluster(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ElastiCache::CacheCluster", 1)

    @mark.it("creates ElastiCache with Redis engine")
    def test_elasticache_uses_redis(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::ElastiCache::CacheCluster", {
            "Engine": "redis"
        })

    @mark.it("creates CloudWatch log group")
    def test_creates_cloudwatch_log_group(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Logs::LogGroup", 1)

    @mark.it("creates CloudWatch log group with retention")
    def test_log_group_has_retention(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30
        })

    @mark.it("creates stack outputs")
    def test_creates_stack_outputs(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        outputs = template.find_outputs("*")
        assert len(outputs) == 3

    @mark.it("stack has StreamName output")
    def test_has_stream_name_output(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_output("StreamName", {})

    @mark.it("stack has DbEndpoint output")
    def test_has_db_endpoint_output(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_output("DbEndpoint", {})

    @mark.it("stack has ArchiveBucketName output")
    def test_has_archive_bucket_output(self):
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        template.has_output("ArchiveBucketName", {})
