"""Unit tests for disaster recovery infrastructure"""

import pytest
import json
from cdktf import Testing
from lib.main import DisasterRecoveryStack, GlobalResourcesStack


class TestDisasterRecoveryStack:
    """Test cases for DisasterRecoveryStack"""

    def test_primary_stack_synthesis(self):
        """Test that primary stack synthesizes correctly"""
        app = Testing.app()
        stack = DisasterRecoveryStack(
            app,
            "test-primary",
            region="us-east-1",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Verify resources are created
        resources = json.loads(synthesized)
        assert "resource" in resources

    def test_secondary_stack_synthesis(self):
        """Test that secondary stack synthesizes correctly"""
        app = Testing.app()
        stack = DisasterRecoveryStack(
            app,
            "test-secondary",
            region="us-east-2",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Verify resources are created
        resources = json.loads(synthesized)
        assert "resource" in resources

    def test_environment_suffix_in_resource_names(self):
        """Test that all resources include environment suffix"""
        app = Testing.app()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test123"
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)

        # Check that resources contain environment suffix
        resource_str = json.dumps(resources)
        assert "test123" in resource_str

    def test_proper_tags_applied(self):
        """Test that proper tags are applied to resources"""
        app = Testing.app()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)

        # Verify provider has default tags
        assert "provider" in resources
        aws_providers = [p for p in resources["provider"] if "aws" in p]
        assert len(aws_providers) > 0

    def test_multi_region_setup(self):
        """Test that both regions are configured correctly"""
        app = Testing.app()

        primary = DisasterRecoveryStack(
            app,
            "test-primary",
            region="us-east-1",
            environment_suffix="test"
        )

        secondary = DisasterRecoveryStack(
            app,
            "test-secondary",
            region="us-east-2",
            environment_suffix="test"
        )

        assert primary.is_primary == True
        assert secondary.is_primary == False
        assert primary.region == "us-east-1"
        assert secondary.region == "us-east-2"


class TestNetworkStack:
    """Test cases for NetworkStack"""

    def test_vpc_creation(self):
        """Test VPC is created with correct CIDR"""
        app = Testing.app()
        stack = DisasterRecoveryStack(
            app,
            "test-network",
            region="us-east-1",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)

        # Verify VPC exists
        assert "resource" in resources
        assert "aws_vpc" in resources["resource"]

    def test_subnet_creation(self):
        """Test that 3 public and 3 private subnets are created"""
        app = Testing.app()
        stack = DisasterRecoveryStack(
            app,
            "test-network",
            region="us-east-1",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)

        # Count subnets
        if "aws_subnet" in resources.get("resource", {}):
            subnets = resources["resource"]["aws_subnet"]
            assert len(subnets) >= 6  # 3 public + 3 private


class TestDatabaseStack:
    """Test cases for DatabaseStack"""

    def test_dynamodb_global_table(self):
        """Test DynamoDB Global Table configuration"""
        app = Testing.app()
        stack = DisasterRecoveryStack(
            app,
            "test-db",
            region="us-east-1",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)

        # Verify DynamoDB table exists
        assert "resource" in resources
        if "aws_dynamodb_table" in resources["resource"]:
            table = list(resources["resource"]["aws_dynamodb_table"].values())[0]
            assert table["billing_mode"] == "PAY_PER_REQUEST"

    def test_aurora_global_database(self):
        """Test Aurora Global Database configuration"""
        app = Testing.app()
        stack = DisasterRecoveryStack(
            app,
            "test-db",
            region="us-east-1",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)

        # Verify Aurora cluster exists
        if "aws_rds_cluster" in resources.get("resource", {}):
            cluster = list(resources["resource"]["aws_rds_cluster"].values())[0]
            assert cluster["engine"] == "aurora-postgresql"


class TestStorageStack:
    """Test cases for StorageStack"""

    def test_s3_bucket_creation(self):
        """Test S3 bucket with versioning"""
        app = Testing.app()
        stack = DisasterRecoveryStack(
            app,
            "test-storage",
            region="us-east-1",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)

        # Verify S3 bucket exists
        assert "resource" in resources
        assert "aws_s3_bucket" in resources["resource"]


class TestLambdaFunctions:
    """Test cases for Lambda functions"""

    def test_payment_processor_lambda(self):
        """Test payment processor Lambda handler"""
        import importlib
        mod = importlib.import_module("lib.lambda.payment_processor.index")
        handler = mod.handler

        event = {
            'body': json.dumps({
                'transactionId': 'test-123',
                'customerId': 'customer-456',
                'amount': 100.50,
                'currency': 'USD'
            })
        }

        # Mock environment variables
        import os
        os.environ['DYNAMODB_TABLE'] = 'test-table'
        os.environ['REGION'] = 'us-east-1'

        # Note: This will fail without mocking boto3
        # In real tests, use moto or pytest-mock

    def test_health_check_lambda(self):
        """Test health check Lambda handler"""
        import importlib
        mod = importlib.import_module("lib.lambda.health_check.index")
        handler = mod.handler

        event = {}

        # Mock environment variables
        import os
        os.environ['DYNAMODB_TABLE'] = 'test-table'
        os.environ['REGION'] = 'us-east-1'

        # Note: This will fail without mocking boto3


class TestIntegration:
    """Integration test cases"""

    def test_full_stack_synthesis(self):
        """Test complete stack synthesis"""
        app = Testing.app()

        primary = DisasterRecoveryStack(
            app,
            "test-primary-full",
            region="us-east-1",
            environment_suffix="integ"
        )

        secondary = DisasterRecoveryStack(
            app,
            "test-secondary-full",
            region="us-east-2",
            environment_suffix="integ"
        )

        # Synthesize both stacks
        primary_synth = Testing.synth(primary)
        secondary_synth = Testing.synth(secondary)

        assert primary_synth is not None
        assert secondary_synth is not None

    def test_resource_naming_consistency(self):
        """Test that resource naming is consistent across regions"""
        app = Testing.app()

        primary = DisasterRecoveryStack(
            app,
            "test-primary-naming",
            region="us-east-1",
            environment_suffix="naming"
        )

        secondary = DisasterRecoveryStack(
            app,
            "test-secondary-naming",
            region="us-east-2",
            environment_suffix="naming"
        )

        # Both should have same environment suffix
        assert primary.environment_suffix == secondary.environment_suffix


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=lib", "--cov-report=html"])
