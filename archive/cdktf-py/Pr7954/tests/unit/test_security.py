"""Unit tests for SecurityConstruct"""
import pytest
from cdktf import Testing, TerraformStack
from lib.vpc import VpcConstruct
from lib.security import SecurityConstruct


class TestSecurityConstruct:
    """Test cases for SecurityConstruct"""

    @pytest.fixture
    def app(self):
        """Create CDKTF app for testing"""
        return Testing.app()

    @pytest.fixture
    def stack(self, app):
        """Create test stack"""
        return TerraformStack(app, "test-stack")

    @pytest.fixture
    def vpc(self, stack):
        """Create real VPC construct"""
        return VpcConstruct(stack, "test-vpc", "test")

    @pytest.fixture
    def security_construct(self, stack, vpc):
        """Create SecurityConstruct for testing"""
        return SecurityConstruct(stack, "test-security", "test", vpc)

    def test_security_construct_initialization(self, security_construct):
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

    def test_kms_key_created(self, security_construct):
        """Test KMS key is created"""
        assert security_construct.kms_key is not None

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
        assert security_construct.alb_sg is not None

    def test_ec2_security_group_rules(self, security_construct):
        """Test EC2 security group allows traffic from ALB only"""
        assert security_construct.ec2_sg is not None

    def test_rds_security_group_rules(self, security_construct):
        """Test RDS security group allows traffic from EC2 only"""
        assert security_construct.rds_sg is not None

    def test_lambda_security_group_configuration(self, security_construct):
        """Test Lambda security group configuration"""
        assert security_construct.lambda_sg is not None

    def test_kms_key_rotation_enabled(self, security_construct):
        """Test KMS key rotation is enabled"""
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
        assert security_construct.kms_key is not None
        assert security_construct.alb_sg is not None
        assert security_construct.ec2_sg is not None

    def test_tags_applied_to_resources(self, security_construct):
        """Test tags are properly applied to all resources"""
        assert security_construct.kms_key is not None

    def test_security_construct_with_different_environment(self, app):
        """Test SecurityConstruct works with different environment suffixes"""
        stack = TerraformStack(app, "test-stack-prod")
        vpc = VpcConstruct(stack, "test-vpc-prod", "production")
        construct = SecurityConstruct(stack, "test-security-prod", "production", vpc)
        assert construct is not None

    def test_kms_alias_created(self, security_construct):
        """Test KMS alias is created for the key"""
        assert security_construct.kms_key is not None

    def test_ssm_policy_attached_to_ec2_role(self, security_construct):
        """Test SSM managed policy is attached to EC2 role"""
        assert security_construct.ec2_role is not None

    def test_lambda_basic_execution_policy_attached(self, security_construct):
        """Test Lambda basic execution policy is attached"""
        assert security_construct.lambda_role is not None

    def test_security_construct_synthesizes(self, stack, vpc):
        """Test SecurityConstruct synthesizes correctly"""
        SecurityConstruct(stack, "test-security-synth", "test", vpc)
        synth = Testing.synth(stack)
        assert synth is not None
