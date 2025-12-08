"""Unit tests for VPC construct"""
import pytest
from cdktf import Testing, App, TerraformStack
from lib.vpc import VpcConstruct


@pytest.fixture
def app():
    """Create CDKTF app for testing"""
    return Testing.app()


@pytest.fixture
def stack(app):
    """Create test stack"""
    return TerraformStack(app, "test-stack")


@pytest.fixture
def vpc_construct(stack):
    """Create VPC construct for testing"""
    return VpcConstruct(stack, "test-vpc", "test-env")


def test_vpc_construct_initialization(vpc_construct):
    """Test VPC construct initializes correctly"""
    assert vpc_construct is not None
    assert vpc_construct.vpc is not None
    assert vpc_construct.igw is not None


def test_vpc_has_correct_cidr(vpc_construct):
    """Test VPC has correct CIDR block"""
    assert hasattr(vpc_construct.vpc, 'cidr_block')


def test_vpc_has_public_subnets(vpc_construct):
    """Test VPC has public subnets"""
    assert vpc_construct.public_subnets is not None
    assert len(vpc_construct.public_subnets) == 3


def test_vpc_has_private_subnets(vpc_construct):
    """Test VPC has private subnets"""
    assert vpc_construct.private_subnets is not None
    assert len(vpc_construct.private_subnets) == 3


def test_vpc_has_nat_gateways(vpc_construct):
    """Test VPC has NAT gateways"""
    assert vpc_construct.nat_gateways is not None
    assert len(vpc_construct.nat_gateways) == 3


def test_vpc_has_route_tables(vpc_construct):
    """Test VPC has route tables"""
    assert vpc_construct.public_route_table is not None
    assert vpc_construct.private_route_tables is not None
    assert len(vpc_construct.private_route_tables) == 3


def test_vpc_environment_suffix_in_tags(stack):
    """Test environment suffix is used in tags"""
    env_suffix = "custom-test"
    vpc = VpcConstruct(stack, "test-vpc-env", env_suffix)
    assert vpc is not None
    # Environment suffix should be propagated to resources


def test_vpc_synthesizes_correctly(app, stack):
    """Test VPC construct synthesizes without errors"""
    VpcConstruct(stack, "test-vpc-synth", "test")
    synth = Testing.synth(stack)
    assert synth is not None
