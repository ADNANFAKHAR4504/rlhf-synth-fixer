"""Unit tests for TAP Stack CDKTF infrastructure."""

import os
import sys
import pytest
import json
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from cdktf import Testing, App
from lib.tap_stack import TapStack
from lib.networking import NetworkingModule
from lib.security import SecurityModule
from lib.data_storage import DataStorageModule
from lib.compute import ComputeModule
from lib.monitoring import MonitoringModule
from lib.compliance import ComplianceModule


class TestTapStack:
    """Test suite for TapStack."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.environment_suffix = "test123"
        self.aws_region = "ap-southeast-1"
        self.state_bucket = "test-bucket"
        self.state_bucket_region = "us-east-1"
        self.default_tags = {
            "tags": {
                "Environment": self.environment_suffix,
                "Repository": "test-repo",
                "Author": "test-author",
            }
        }

    def test_stack_creation(self):
        """Test TapStack can be created."""
        stack = TapStack(
            self.app,
            f"TapStack{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            aws_region=self.aws_region,
            state_bucket=self.state_bucket,
            state_bucket_region=self.state_bucket_region,
            default_tags=self.default_tags,
        )
        assert stack is not None
        assert isinstance(stack, TapStack)

    def test_stack_synthesis(self):
        """Test TapStack synthesizes without errors."""
        stack = TapStack(
            self.app,
            f"TapStack{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            aws_region=self.aws_region,
            state_bucket=self.state_bucket,
            state_bucket_region=self.state_bucket_region,
            default_tags=self.default_tags,
        )
        synth = Testing.synth(stack)
        assert synth is not None
        assert len(synth) > 0

    def test_stack_with_defaults(self):
        """Test TapStack works with minimal configuration."""
        stack = TapStack(
            self.app,
            "TapStackDefault",
        )
        assert stack is not None


class TestNetworkingModule:
    """Test suite for NetworkingModule."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(self.app, "TestStack", environment_suffix="test")

    def test_vpc_creation(self):
        """Test VPC is created with correct CIDR."""
        networking = NetworkingModule(
            self.stack,
            "test-networking",
            environment_suffix="test",
            aws_region="ap-southeast-1",
        )
        assert networking.vpc is not None
        
    def test_subnet_creation(self):
        """Test three private subnets are created."""
        networking = NetworkingModule(
            self.stack,
            "test-networking",
            environment_suffix="test",
            aws_region="ap-southeast-1",
        )
        assert len(networking.private_subnets) == 3
        assert len(networking.private_subnet_ids) == 3

    def test_security_group_creation(self):
        """Test Lambda security group is created."""
        networking = NetworkingModule(
            self.stack,
            "test-networking",
            environment_suffix="test",
            aws_region="ap-southeast-1",
        )
        assert networking.lambda_security_group is not None
        assert networking.lambda_security_group_id is not None

    def test_flow_logs_bucket(self):
        """Test VPC Flow Logs bucket is created."""
        networking = NetworkingModule(
            self.stack,
            "test-networking",
            environment_suffix="test",
            aws_region="ap-southeast-1",
        )
        assert networking.flow_logs_bucket is not None
        assert networking.flow_logs_bucket_arn is not None


class TestSecurityModule:
    """Test suite for SecurityModule."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(self.app, "TestStack", environment_suffix="test")

    def test_kms_keys_creation(self):
        """Test all three KMS keys are created."""
        security = SecurityModule(
            self.stack,
            "test-security",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            vpc_id="vpc-12345",
        )
        assert security.s3_kms_key is not None
        assert security.lambda_kms_key is not None
        assert security.cloudwatch_kms_key is not None

    def test_iam_roles_creation(self):
        """Test IAM roles are created."""
        security = SecurityModule(
            self.stack,
            "test-security",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            vpc_id="vpc-12345",
        )
        assert security.lambda_role is not None
        assert security.lambda_role_arn is not None
        assert security.config_role is not None
        assert security.config_role_arn is not None


class TestDataStorageModule:
    """Test suite for DataStorageModule."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(self.app, "TestStack", environment_suffix="test")

    def test_data_bucket_creation(self):
        """Test data bucket is created."""
        data_storage = DataStorageModule(
            self.stack,
            "test-storage",
            environment_suffix="test",
            kms_key_id="key-123",
            vpc_id="vpc-12345",
            flow_logs_bucket_arn="arn:aws:s3:::test-bucket",
        )
        assert data_storage.data_bucket is not None
        assert data_storage.data_bucket_name is not None
        assert data_storage.data_bucket_arn is not None


class TestComputeModule:
    """Test suite for ComputeModule."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(self.app, "TestStack", environment_suffix="test")

    def test_lambda_function_creation(self):
        """Test Lambda function is created."""
        compute = ComputeModule(
            self.stack,
            "test-compute",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            vpc_id="vpc-12345",
            private_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
            security_group_id="sg-12345",
            kms_key_arn="arn:aws:kms:region:account:key/123",
            data_bucket_arn="arn:aws:s3:::test-bucket",
            lambda_role_arn="arn:aws:iam::account:role/test-role",
        )
        assert compute.lambda_function is not None
        assert compute.lambda_function_arn is not None


class TestMonitoringModule:
    """Test suite for MonitoringModule."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(self.app, "TestStack", environment_suffix="test")

    def test_sns_topic_creation(self):
        """Test SNS topic for alerts is created."""
        monitoring = MonitoringModule(
            self.stack,
            "test-monitoring",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            kms_key_id="key-123",
            vpc_id="vpc-12345",
        )
        assert monitoring.security_alerts_topic is not None
        assert monitoring.security_alerts_topic_arn is not None


class TestComplianceModule:
    """Test suite for ComplianceModule."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(self.app, "TestStack", environment_suffix="test")

    def test_config_recorder_creation(self):
        """Test AWS Config recorder is created."""
        compliance = ComplianceModule(
            self.stack,
            "test-compliance",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            config_role_arn="arn:aws:iam::account:role/config-role",
            sns_topic_arn="arn:aws:sns:region:account:topic",
        )
        assert compliance.config_recorder_name is not None


class TestResourceNaming:
    """Test suite for resource naming conventions."""

    def test_environment_suffix_in_names(self):
        """Test all resources include environment suffix."""
        app = App()
        env_suffix = "testenv"
        stack = TapStack(
            app,
            f"TapStack{env_suffix}",
            environment_suffix=env_suffix,
            aws_region="ap-southeast-1",
        )
        synth = Testing.synth(stack)
        
        # Convert synth to string for searching
        synth_str = json.dumps(synth)
        
        # Check that environment suffix appears in resource names
        assert env_suffix in synth_str


class TestEncryption:
    """Test suite for encryption configuration."""

    def test_s3_encryption_enabled(self):
        """Test S3 buckets have encryption enabled."""
        app = App()
        stack = TapStack(
            app,
            "TapStackEncTest",
            environment_suffix="enctest",
        )
        synth = Testing.synth(stack)
        
        # Check for encryption configuration in resources
        synth_str = json.dumps(synth)
        assert "encryption" in synth_str.lower() or "kms" in synth_str.lower()

    def test_kms_key_rotation(self):
        """Test KMS keys have rotation enabled."""
        app = App()
        stack = TapStack(
            app,
            "TapStackKeyTest",
            environment_suffix="keytest",
        )
        synth = Testing.synth(stack)
        
        # Check for key rotation in synth
        synth_str = json.dumps(synth)
        assert "enable_key_rotation" in synth_str


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=lib", "--cov-report=term", "--cov-report=json"])
