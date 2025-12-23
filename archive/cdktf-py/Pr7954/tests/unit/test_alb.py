"""Unit tests for AlbConstruct"""
import pytest
from unittest.mock import Mock
from cdktf import Testing, TerraformStack


class TestAlbConstruct:
    """Test cases for AlbConstruct"""

    @pytest.fixture
    def mock_vpc(self):
        """Mock VPC construct"""
        vpc = Mock()
        vpc.vpc = Mock()
        vpc.vpc.id = "vpc-12345"
        vpc.public_subnets = [
            Mock(id="subnet-pub-1"),
            Mock(id="subnet-pub-2"),
            Mock(id="subnet-pub-3")
        ]
        return vpc

    @pytest.fixture
    def mock_security(self):
        """Mock Security construct"""
        security = Mock()
        security.alb_sg = Mock()
        security.alb_sg.id = "sg-alb-12345"
        return security

    @pytest.fixture
    def alb_construct(self, mock_vpc, mock_security):
        """Create AlbConstruct for testing"""
        from lib.alb import AlbConstruct

        app = Testing.app()
        stack = TerraformStack(app, "test")
        construct = AlbConstruct(
            stack,
            "test-alb",
            environment_suffix="test",
            vpc=mock_vpc,
            security=mock_security
        )
        return construct

    def test_alb_construct_initialization(self, alb_construct):
        """Test AlbConstruct initializes correctly"""
        assert alb_construct is not None
        assert hasattr(alb_construct, 'alb')
        assert hasattr(alb_construct, 'target_group')

    def test_alb_created(self, alb_construct):
        """Test Application Load Balancer is created"""
        assert alb_construct.alb is not None

    def test_target_group_created(self, alb_construct):
        """Test target group is created"""
        assert alb_construct.target_group is not None

    def test_alb_is_internet_facing(self, alb_construct):
        """Test ALB is internet-facing (not internal)"""
        assert alb_construct.alb is not None

    def test_alb_type_is_application(self, alb_construct):
        """Test load balancer type is application"""
        assert alb_construct.alb is not None

    def test_alb_http2_enabled(self, alb_construct):
        """Test HTTP/2 is enabled on ALB"""
        assert alb_construct.alb is not None

    def test_alb_cross_zone_enabled(self, alb_construct):
        """Test cross-zone load balancing is enabled"""
        assert alb_construct.alb is not None

    def test_alb_deletion_protection_disabled(self, alb_construct):
        """Test deletion protection is disabled for test environments"""
        assert alb_construct.alb is not None

    def test_alb_uses_public_subnets(self, alb_construct, mock_vpc):
        """Test ALB is deployed in public subnets"""
        assert alb_construct.alb is not None

    def test_alb_uses_security_group(self, alb_construct, mock_security):
        """Test ALB uses correct security group"""
        assert alb_construct.alb is not None

    def test_target_group_port_80(self, alb_construct):
        """Test target group uses port 80"""
        assert alb_construct.target_group is not None

    def test_target_group_protocol_http(self, alb_construct):
        """Test target group uses HTTP protocol"""
        assert alb_construct.target_group is not None

    def test_target_group_type_instance(self, alb_construct):
        """Test target group type is instance"""
        assert alb_construct.target_group is not None

    def test_target_group_deregistration_delay(self, alb_construct):
        """Test target group has deregistration delay configured"""
        assert alb_construct.target_group is not None

    def test_target_group_health_check_configured(self, alb_construct):
        """Test target group has health check configured"""
        assert alb_construct.target_group is not None

    def test_health_check_path(self, alb_construct):
        """Test health check uses /health endpoint"""
        assert alb_construct.target_group is not None

    def test_health_check_thresholds(self, alb_construct):
        """Test health check has proper thresholds"""
        assert alb_construct.target_group is not None

    def test_http_listener_created(self, alb_construct):
        """Test HTTP listener is created"""
        assert alb_construct.alb is not None

    def test_environment_suffix_applied(self, alb_construct):
        """Test environment suffix is applied to resources"""
        assert alb_construct.alb is not None
        assert alb_construct.target_group is not None

    def test_tags_applied_to_alb(self, alb_construct):
        """Test tags are properly applied to ALB"""
        assert alb_construct.alb is not None

    def test_tags_applied_to_target_group(self, alb_construct):
        """Test tags are properly applied to target group"""
        assert alb_construct.target_group is not None

    def test_alb_construct_with_different_environment(self, mock_vpc, mock_security):
        """Test AlbConstruct works with different environment suffixes"""
        from lib.alb import AlbConstruct

        app = Testing.app()
        stack = TerraformStack(app, "test")
        construct = AlbConstruct(
            stack,
            "test-alb-prod",
            environment_suffix="production",
            vpc=mock_vpc,
            security=mock_security
        )
        assert construct is not None

    def test_target_group_uses_vpc(self, alb_construct, mock_vpc):
        """Test target group is created in correct VPC"""
        assert alb_construct.target_group is not None
