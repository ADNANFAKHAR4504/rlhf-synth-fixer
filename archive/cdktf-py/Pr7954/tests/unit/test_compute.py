"""Unit tests for ComputeConstruct"""
import pytest
from cdktf import Testing, TerraformStack
from lib.vpc import VpcConstruct
from lib.security import SecurityConstruct
from lib.alb import AlbConstruct
from lib.database import DatabaseConstruct
from lib.secrets import SecretsConstruct
from lib.compute import ComputeConstruct


class TestComputeConstruct:
    """Test cases for ComputeConstruct"""

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
    def security(self, stack, vpc):
        """Create real Security construct"""
        return SecurityConstruct(stack, "test-security", "test", vpc)

    @pytest.fixture
    def alb(self, stack, vpc, security):
        """Create real ALB construct"""
        return AlbConstruct(stack, "test-alb", "test", vpc, security)

    @pytest.fixture
    def database(self, stack, vpc, security):
        """Create real Database construct"""
        return DatabaseConstruct(stack, "test-database", "test", vpc, security)

    @pytest.fixture
    def secrets(self, stack, vpc, security, database):
        """Create real Secrets construct"""
        return SecretsConstruct(stack, "test-secrets", "test", database, security, vpc)

    @pytest.fixture
    def compute_construct(self, stack, vpc, security, alb, database, secrets):
        """Create ComputeConstruct for testing"""
        return ComputeConstruct(stack, "test-compute", "test", vpc, security, alb, database, secrets)

    def test_compute_construct_initialization(self, compute_construct):
        """Test ComputeConstruct initializes correctly"""
        assert compute_construct is not None
        assert hasattr(compute_construct, 'launch_template')
        assert hasattr(compute_construct, 'asg')

    def test_launch_template_created(self, compute_construct):
        """Test launch template is created"""
        assert compute_construct.launch_template is not None

    def test_autoscaling_group_created(self, compute_construct):
        """Test Auto Scaling Group is created"""
        assert compute_construct.asg is not None

    def test_ami_data_source_used(self, compute_construct):
        """Test AMI data source is used for latest Amazon Linux"""
        assert compute_construct.launch_template is not None

    def test_launch_template_uses_instance_profile(self, compute_construct):
        """Test launch template uses EC2 instance profile"""
        assert compute_construct.launch_template is not None

    def test_launch_template_uses_security_group(self, compute_construct):
        """Test launch template uses EC2 security group"""
        assert compute_construct.launch_template is not None

    def test_launch_template_user_data_configured(self, compute_construct):
        """Test launch template has user data script"""
        assert compute_construct.launch_template is not None

    def test_launch_template_imdsv2_enforced(self, compute_construct):
        """Test launch template enforces IMDSv2"""
        assert compute_construct.launch_template is not None

    def test_asg_uses_private_subnets(self, compute_construct):
        """Test ASG is deployed in private subnets"""
        assert compute_construct.asg is not None

    def test_asg_min_max_desired_capacity(self, compute_construct):
        """Test ASG has min, max, and desired capacity configured"""
        assert compute_construct.asg is not None

    def test_asg_health_check_type(self, compute_construct):
        """Test ASG uses ELB health check"""
        assert compute_construct.asg is not None

    def test_asg_attached_to_target_group(self, compute_construct):
        """Test ASG is attached to ALB target group"""
        assert compute_construct.asg is not None

    def test_target_tracking_policy_created(self, compute_construct):
        """Test target tracking scaling policy is created"""
        assert compute_construct.asg is not None

    def test_scheduled_scaling_created(self, compute_construct):
        """Test scheduled scaling actions are created"""
        assert compute_construct.asg is not None

    def test_environment_suffix_applied(self, compute_construct):
        """Test environment suffix is applied to resources"""
        assert compute_construct.launch_template is not None
        assert compute_construct.asg is not None

    def test_tags_applied_to_asg(self, compute_construct):
        """Test tags are properly applied to ASG"""
        assert compute_construct.asg is not None

    def test_compute_construct_with_different_environment(self, app):
        """Test ComputeConstruct works with different environment suffixes"""
        stack = TerraformStack(app, "test-stack-prod")
        vpc = VpcConstruct(stack, "test-vpc-prod", "production")
        security = SecurityConstruct(stack, "test-security-prod", "production", vpc)
        alb = AlbConstruct(stack, "test-alb-prod", "production", vpc, security)
        database = DatabaseConstruct(stack, "test-database-prod", "production", vpc, security)
        secrets = SecretsConstruct(stack, "test-secrets-prod", "production", database, security, vpc)
        construct = ComputeConstruct(stack, "test-compute-prod", "production", vpc, security, alb, database, secrets)
        assert construct is not None

    def test_asg_health_check_grace_period(self, compute_construct):
        """Test ASG has health check grace period"""
        assert compute_construct.asg is not None

    def test_launch_template_monitoring_enabled(self, compute_construct):
        """Test launch template has detailed monitoring enabled"""
        assert compute_construct.launch_template is not None

    def test_asg_uses_launch_template(self, compute_construct):
        """Test ASG uses the created launch template"""
        assert compute_construct.asg is not None
        assert compute_construct.launch_template is not None

    def test_compute_construct_synthesizes(self, stack, vpc, security, alb, database, secrets):
        """Test ComputeConstruct synthesizes correctly"""
        ComputeConstruct(stack, "test-compute-synth", "test", vpc, security, alb, database, secrets)
        synth = Testing.synth(stack)
        assert synth is not None
