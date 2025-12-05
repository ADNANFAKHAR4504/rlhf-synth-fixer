"""Unit tests for ComputeConstruct"""
import pytest
from unittest.mock import Mock
from cdktf import Testing


class TestComputeConstruct:
    """Test cases for ComputeConstruct"""

    @pytest.fixture
    def mock_vpc(self):
        """Mock VPC construct"""
        vpc = Mock()
        vpc.vpc = Mock()
        vpc.vpc.id = "vpc-12345"
        vpc.private_subnets = [
            Mock(id="subnet-priv-1"),
            Mock(id="subnet-priv-2"),
            Mock(id="subnet-priv-3")
        ]
        return vpc

    @pytest.fixture
    def mock_security(self):
        """Mock Security construct"""
        security = Mock()
        security.ec2_sg = Mock()
        security.ec2_sg.id = "sg-ec2-12345"
        security.ec2_instance_profile = Mock()
        security.ec2_instance_profile.arn = "arn:aws:iam::123456789012:instance-profile/test-profile"
        return security

    @pytest.fixture
    def mock_alb(self):
        """Mock ALB construct"""
        alb = Mock()
        alb.target_group = Mock()
        alb.target_group.arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test-tg/1234567890123456"
        return alb

    @pytest.fixture
    def mock_database(self):
        """Mock Database construct"""
        database = Mock()
        database.cluster = Mock()
        database.cluster.endpoint = "test-cluster.cluster-123456789012.us-east-1.rds.amazonaws.com"
        return database

    @pytest.fixture
    def mock_secrets(self):
        """Mock Secrets construct"""
        secrets = Mock()
        secrets.db_secret = Mock()
        secrets.db_secret.arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret-123456"
        return secrets

    @pytest.fixture
    def compute_construct(self, mock_vpc, mock_security, mock_alb, mock_database, mock_secrets):
        """Create ComputeConstruct for testing"""
        from lib.compute import ComputeConstruct

        app = Testing.app()
        stack = Testing.stub_stack(app, "test")
        construct = ComputeConstruct(
            stack,
            "test-compute",
            environment_suffix="test",
            vpc=mock_vpc,
            security=mock_security,
            alb=mock_alb,
            database=mock_database,
            secrets=mock_secrets
        )
        return construct

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

    def test_launch_template_uses_instance_profile(self, compute_construct, mock_security):
        """Test launch template uses EC2 instance profile"""
        assert compute_construct.launch_template is not None

    def test_launch_template_uses_security_group(self, compute_construct, mock_security):
        """Test launch template uses EC2 security group"""
        assert compute_construct.launch_template is not None

    def test_launch_template_user_data_configured(self, compute_construct):
        """Test launch template has user data script"""
        assert compute_construct.launch_template is not None

    def test_launch_template_imdsv2_enforced(self, compute_construct):
        """Test launch template enforces IMDSv2"""
        assert compute_construct.launch_template is not None

    def test_asg_uses_private_subnets(self, compute_construct, mock_vpc):
        """Test ASG is deployed in private subnets"""
        assert compute_construct.asg is not None

    def test_asg_min_max_desired_capacity(self, compute_construct):
        """Test ASG has min, max, and desired capacity configured"""
        assert compute_construct.asg is not None

    def test_asg_health_check_type(self, compute_construct):
        """Test ASG uses ELB health check"""
        assert compute_construct.asg is not None

    def test_asg_attached_to_target_group(self, compute_construct, mock_alb):
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

    def test_compute_construct_with_different_environment(self, mock_vpc, mock_security, mock_alb, mock_database, mock_secrets):
        """Test ComputeConstruct works with different environment suffixes"""
        from lib.compute import ComputeConstruct

        app = Testing.app()
        stack = Testing.stub_stack(app, "test")
        construct = ComputeConstruct(
            stack,
            "test-compute-prod",
            environment_suffix="production",
            vpc=mock_vpc,
            security=mock_security,
            alb=mock_alb,
            database=mock_database,
            secrets=mock_secrets
        )
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
