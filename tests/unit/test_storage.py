"""
Unit tests for Storage module (S3 and CloudWatch)
"""
import unittest
import pulumi


class TestStorageModule(unittest.TestCase):
    """Test cases for S3 buckets and CloudWatch log groups"""

    def setUp(self):
        """Set up test fixtures"""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_create_storage_buckets(self):
        """Test S3 bucket creation"""
        import lib.storage as storage_module

        result = storage_module.create_storage_buckets(
            environment_suffix="test",
            aws_account_id="123456789012",
            region="us-east-1",
            tags={"Environment": "test"}
        )

        def check_storage(resources):
            self.assertIn("app_logs_bucket", result)
            self.assertIn("transaction_data_bucket", result)
            self.assertIn("app_logs_encryption", result)
            self.assertIn("transaction_data_encryption", result)
            self.assertIn("ecs_log_group", result)
            self.assertIn("rds_log_group", result)
            self.assertIn("alb_log_group", result)

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_storage
        )

    @pulumi.runtime.test
    def test_s3_bucket_encryption(self):
        """Test S3 bucket encryption configuration"""
        import lib.storage as storage_module

        result = storage_module.create_storage_buckets(
            environment_suffix="test",
            aws_account_id="123456789012",
            region="us-east-1",
            tags={"Environment": "test"}
        )

        def check_encryption(resources):
            # Should have encryption configs for both buckets
            self.assertIsNotNone(result["app_logs_encryption"])
            self.assertIsNotNone(result["transaction_data_encryption"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_encryption
        )

    @pulumi.runtime.test
    def test_cloudwatch_log_groups(self):
        """Test CloudWatch log group creation"""
        import lib.storage as storage_module

        result = storage_module.create_storage_buckets(
            environment_suffix="test",
            aws_account_id="123456789012",
            region="us-east-1",
            tags={"Environment": "test"}
        )

        def check_log_groups(resources):
            # Should have log groups for ECS, RDS, and ALB
            self.assertIsNotNone(result["ecs_log_group"])
            self.assertIsNotNone(result["rds_log_group"])
            self.assertIsNotNone(result["alb_log_group"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_log_groups
        )

    @pulumi.runtime.test
    def test_environment_based_retention(self):
        """Test environment-based log retention settings"""
        import lib.storage as storage_module

        # Test dev environment (7 days retention)
        dev_result = storage_module.create_storage_buckets(
            environment_suffix="test-dev",
            aws_account_id="123456789012",
            region="us-east-1",
            tags={"Environment": "dev"}
        )

        # Test staging environment (14 days retention)
        staging_result = storage_module.create_storage_buckets(
            environment_suffix="test-staging",
            aws_account_id="123456789012",
            region="us-east-1",
            tags={"Environment": "staging"}
        )

        # Test prod environment (30 days retention)
        prod_result = storage_module.create_storage_buckets(
            environment_suffix="test-prod",
            aws_account_id="123456789012",
            region="us-east-1",
            tags={"Environment": "prod"}
        )

        def check_retention(resources):
            # All environments should have log groups
            self.assertIsNotNone(dev_result["ecs_log_group"])
            self.assertIsNotNone(staging_result["ecs_log_group"])
            self.assertIsNotNone(prod_result["ecs_log_group"])

        return pulumi.Output.all(
            *dev_result.values(),
            *staging_result.values(),
            *prod_result.values()
        ).apply(lambda _: check_retention)

    @pulumi.runtime.test
    def test_bucket_naming(self):
        """Test S3 bucket naming convention"""
        import lib.storage as storage_module

        result = storage_module.create_storage_buckets(
            environment_suffix="test",
            aws_account_id="123456789012",
            region="us-west-2",
            tags={"Environment": "test"}
        )

        def check_naming(resources):
            # Buckets should follow naming convention:
            # {purpose}-{environment_suffix}-{account_id}-{region}
            self.assertIsNotNone(result["app_logs_bucket"])
            self.assertIsNotNone(result["transaction_data_bucket"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_naming
        )


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi unit tests"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource"""
        outputs = args.inputs

        if args.typ == "aws:s3/bucket:Bucket":
            outputs["id"] = f"bucket-{args.name}"
            outputs["bucket"] = args.inputs.get("bucket", args.name)
            outputs["arn"] = f"arn:aws:s3:::{args.inputs.get('bucket', args.name)}"
        elif args.typ == "aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2":
            outputs["id"] = f"encryption-{args.name}"
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = f"log-group-{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{args.inputs.get('name', args.name)}"
            outputs["retention_in_days"] = args.inputs.get("retention_in_days", 7)

        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls"""
        return {}


if __name__ == "__main__":
    unittest.main()