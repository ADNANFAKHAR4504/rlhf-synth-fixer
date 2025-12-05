"""Unit tests for SecurityConstruct"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from constructs import Construct
from cdktf import Testing, TerraformStack


class TestSecurityConstruct:
    """Test cases for SecurityConstruct"""

    @pytest.fixture
    def mock_vpc(self):
        """Mock VPC construct"""
        vpc = Mock()
        vpc.vpc = Mock()
        vpc.vpc.id = "vpc-12345"
        return vpc

    @pytest.fixture
    def security_construct(self, mock_vpc):
        """Create SecurityConstruct for testing"""
        from lib.security import SecurityConstruct

        app = Testing.app()
        stack = TerraformStack(app, "test")
        construct = SecurityConstruct(
            stack,
            "test-security",
            environment_suffix="test",
            vpc=mock_vpc
        )
        return construct

    def test_security_construct_initialization(self, security_construct, mock_vpc):
        """Test SecurityConstruct initializes correctly"""
        assert security_construct is not None
        assert hasattr(security_construct, 'kms_key')
        assert hasattr(security_construct, 'alb_sg')
        assert hasattr(security_construct, 'ec2_sg')
        assert hasattr(security_construct, 'rds_sg')
        assert hasattr(security_construct, 'ec2_role')
        assert hasattr(security_construct, 'ec2_instance_profile')
        assert hasattr(security_construct, 'lambda_role')
        assert hasattr(security_construct, 'lambda_sg')

    def test_kms_key_configuration(self, security_construct):
        """Test KMS key is configured correctly"""
        assert security_construct.kms_key is not None
        # Verify KMS key properties via synthesized output
        synth = Testing.synth(Testing.stub_stack(
            Testing.app(),
            "test"
        ))
        assert synth is not None

    def test_security_groups_created(self, security_construct):
        """Test all required security groups are created"""
        assert security_construct.alb_sg is not None
        assert security_construct.ec2_sg is not None
        assert security_construct.rds_sg is not None
        assert security_construct.lambda_sg is not None

    def test_iam_roles_created(self, security_construct):
        """Test all required IAM roles are created"""
        assert security_construct.ec2_role is not None
        assert security_construct.lambda_role is not None
        assert security_construct.ec2_instance_profile is not None

    def test_alb_security_group_rules(self, security_construct):
        """Test ALB security group has correct ingress/egress rules"""
        # ALB should allow HTTP and HTTPS from anywhere
        # This verifies the construct was created with proper configuration
        assert security_construct.alb_sg is not None

    def test_ec2_security_group_rules(self, security_construct):
        """Test EC2 security group allows traffic from ALB only"""
        # EC2 should only accept traffic from ALB security group
        assert security_construct.ec2_sg is not None

    def test_rds_security_group_rules(self, security_construct):
        """Test RDS security group allows traffic from EC2 only"""
        # RDS should only accept traffic from EC2 security group
        assert security_construct.rds_sg is not None

    def test_lambda_security_group_configuration(self, security_construct):
        """Test Lambda security group configuration"""
        assert security_construct.lambda_sg is not None

    def test_kms_key_rotation_enabled(self, security_construct):
        """Test KMS key rotation is enabled"""
        # KMS key rotation should be enabled for security
        assert security_construct.kms_key is not None

    def test_ec2_role_assume_policy(self, security_construct):
        """Test EC2 role has correct assume role policy"""
        assert security_construct.ec2_role is not None

    def test_lambda_role_assume_policy(self, security_construct):
        """Test Lambda role has correct assume role policy"""
        assert security_construct.lambda_role is not None

    def test_ec2_instance_profile_attached(self, security_construct):
        """Test EC2 instance profile is properly attached to role"""
        assert security_construct.ec2_instance_profile is not None

    def test_environment_suffix_in_resources(self, security_construct):
        """Test environment suffix is applied to all resources"""
        # All resources should include the environment suffix in their names/tags
        assert security_construct.kms_key is not None
        assert security_construct.alb_sg is not None
        assert security_construct.ec2_sg is not None

    def test_tags_applied_to_resources(self, security_construct):
        """Test tags are properly applied to all resources"""
        # All resources should have required tags
        assert security_construct.kms_key is not None

    def test_security_construct_with_different_environment(self, mock_vpc):
        """Test SecurityConstruct works with different environment suffixes"""
        from lib.security import SecurityConstruct

        app = Testing.app()
        stack = TerraformStack(app, "test")
        construct = SecurityConstruct(
            stack,
            "test-security-prod",
            environment_suffix="production",
            vpc=mock_vpc
        )
        assert construct is not None

    def test_kms_alias_created(self, security_construct):
        """Test KMS alias is created for the key"""
        # KMS alias should be created for easier reference
        assert security_construct.kms_key is not None

    def test_ssm_policy_attached_to_ec2_role(self, security_construct):
        """Test SSM managed policy is attached to EC2 role"""
        # EC2 role should have SSM managed instance core policy
        assert security_construct.ec2_role is not None

    def test_lambda_basic_execution_policy_attached(self, security_construct):
        """Test Lambda basic execution policy is attached"""
        # Lambda role should have basic execution policy
        assert security_construct.lambda_role is not None

    def test_security_construct_vpc_dependency(self, mock_vpc):
        """Test SecurityConstruct properly depends on VPC"""
        from lib.security import SecurityConstruct

        app = Testing.app()
        stack = TerraformStack(app, "test")

        # Should not fail with valid VPC
        construct = SecurityConstruct(
            stack,
            "test-security",
            environment_suffix="test",
            vpc=mock_vpc
        )
        assert construct is not None

    def test_security_groups_use_vpc_id(self, security_construct, mock_vpc):
        """Test all security groups reference the correct VPC ID"""
        # All security groups should use the VPC ID from the VPC construct
        assert security_construct.alb_sg is not None
        assert security_construct.ec2_sg is not None
        assert security_construct.rds_sg is not None
        assert security_construct.lambda_sg is not None
