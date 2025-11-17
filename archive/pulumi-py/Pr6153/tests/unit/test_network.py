"""Unit tests for network.py"""
from unittest import mock

import pulumi
import pulumi_aws as aws
import pytest

from lib.network import NetworkStack


@pytest.fixture
def mock_availability_zones():
    """Mock AWS availability zones"""
    return mock.Mock(names=['us-east-1a', 'us-east-1b'])


@pytest.fixture
def mock_network_config():
    """Fixture to provide mock network configuration"""
    return {
        'name': 'test-network',
        'vpc_cidr': '10.0.0.0/16',
        'environment': 'test',
        'tags': {'project': 'tap', 'environment': 'test'}
    }


def test_network_stack_creates_vpc(mock_network_config):
    """Test VPC creation"""
    with mock.patch('pulumi.ComponentResource.__init__', mock.Mock()), \
         mock.patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
         mock.patch('pulumi_aws.get_availability_zones') as mock_get_azs:
        
        # Arrange
        mock_vpc_instance = mock.Mock()
        mock_vpc_instance.id = pulumi.Output.from_input("vpc-12345")
        mock_vpc.return_value = mock_vpc_instance
        mock_get_azs.return_value = mock.Mock(names=['us-east-1a', 'us-east-1b'])

        # Act
        network = NetworkStack(**mock_network_config)

        # Assert
        mock_vpc.assert_called_once_with(
            f"vpc-{mock_network_config['environment']}",
            cidr_block=mock_network_config['vpc_cidr'],
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **mock_network_config['tags'],
                'Name': f"payment-vpc-{mock_network_config['environment']}"
            },
            opts=mock.ANY
        )
        assert network.vpc == mock_vpc_instance


def test_network_stack_creates_subnets(mock_network_config):
    """Test subnet creation"""
    with mock.patch('pulumi.ComponentResource.__init__'), \
         mock.patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
         mock.patch('pulumi_aws.ec2.Subnet') as mock_subnet, \
         mock.patch('pulumi_aws.get_availability_zones') as mock_get_azs:
        
        # Arrange
        mock_vpc_instance = mock.Mock()
        mock_vpc_instance.id = pulumi.Output.from_input("vpc-12345")
        mock_vpc.return_value = mock_vpc_instance
        
        mock_subnet_instance = mock.Mock()
        mock_subnet_instance.id = pulumi.Output.from_input("subnet-12345")
        mock_subnet.return_value = mock_subnet_instance
        
        mock_get_azs.return_value = mock.Mock(names=['us-east-1a', 'us-east-1b'])

        # Act
        network = NetworkStack(**mock_network_config)

        # Assert
        assert len(mock_subnet.call_args_list) == 4  # 2 public + 2 private subnets
        assert len(network.public_subnets) == 2
        assert len(network.private_subnets) == 2


def test_network_stack_creates_internet_gateway(mock_network_config):
    """Test internet gateway creation"""
    with mock.patch('pulumi.ComponentResource.__init__'), \
         mock.patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
         mock.patch('pulumi_aws.ec2.InternetGateway') as mock_igw, \
         mock.patch('pulumi_aws.get_availability_zones'):
        
        # Arrange
        mock_vpc_instance = mock.Mock()
        mock_vpc_instance.id = pulumi.Output.from_input("vpc-12345")
        mock_vpc.return_value = mock_vpc_instance
        
        mock_igw_instance = mock.Mock()
        mock_igw_instance.id = pulumi.Output.from_input("igw-12345")
        mock_igw.return_value = mock_igw_instance

        # Act
        network = NetworkStack(**mock_network_config)

        # Assert
        mock_igw.assert_called_once_with(
            f"igw-{mock_network_config['environment']}",
            vpc_id=mock_vpc_instance.id,
            tags={
                **mock_network_config['tags'],
                'Name': f"payment-igw-{mock_network_config['environment']}"
            },
            opts=mock.ANY
        )
        assert network.igw == mock_igw_instance


def test_network_stack_creates_nat_gateway(mock_network_config):
    """Test NAT gateway creation"""
    with mock.patch('pulumi.ComponentResource.__init__'), \
         mock.patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
         mock.patch('pulumi_aws.ec2.Eip') as mock_eip, \
         mock.patch('pulumi_aws.ec2.NatGateway') as mock_nat, \
         mock.patch('pulumi_aws.get_availability_zones'), \
         mock.patch('pulumi_aws.ec2.Subnet'):
        
        # Arrange
        mock_vpc_instance = mock.Mock()
        mock_vpc_instance.id = pulumi.Output.from_input("vpc-12345")
        mock_vpc.return_value = mock_vpc_instance
        
        mock_eip_instance = mock.Mock()
        mock_eip_instance.id = pulumi.Output.from_input("eip-12345")
        mock_eip.return_value = mock_eip_instance
        
        mock_nat_instance = mock.Mock()
        mock_nat_instance.id = pulumi.Output.from_input("nat-12345")
        mock_nat.return_value = mock_nat_instance

        # Act
        network = NetworkStack(**mock_network_config)

        # Assert
        mock_eip.assert_called_once_with(
            f"nat-eip-{mock_network_config['environment']}",
            domain="vpc",
            tags={
                **mock_network_config['tags'],
                'Name': f"payment-nat-eip-{mock_network_config['environment']}"
            },
            opts=mock.ANY
        )
        
        mock_nat.assert_called_once_with(
            f"nat-{mock_network_config['environment']}",
            allocation_id=mock_eip_instance.id,
            subnet_id=mock.ANY,  # We're not testing the exact subnet ID here
            tags={
                **mock_network_config['tags'],
                'Name': f"payment-nat-{mock_network_config['environment']}"
            },
            opts=mock.ANY
        )
        assert network.nat_gateway == mock_nat_instance


def test_network_stack_creates_security_groups(mock_network_config):
    """Test security group creation"""
    with mock.patch('pulumi.ComponentResource.__init__'), \
         mock.patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
         mock.patch('pulumi_aws.ec2.SecurityGroup') as mock_sg, \
         mock.patch('pulumi_aws.get_availability_zones'):
        
        # Arrange
        mock_vpc_instance = mock.Mock()
        mock_vpc_instance.id = pulumi.Output.from_input("vpc-12345")
        mock_vpc.return_value = mock_vpc_instance
        
        mock_sg_instance = mock.Mock()
        mock_sg_instance.id = pulumi.Output.from_input("sg-12345")
        mock_sg.return_value = mock_sg_instance

        # Act
        network = NetworkStack(**mock_network_config)

        # Assert
        # Should create 2 security groups: lambda and RDS
        assert mock_sg.call_count == 2
        assert network.lambda_sg == mock_sg_instance
        assert network.db_sg == mock_sg_instance


def test_network_stack_registers_outputs(mock_network_config):
    """Test output registration"""
    with mock.patch('pulumi.ComponentResource.__init__') as mock_component_init, \
         mock.patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
         mock.patch('pulumi_aws.get_availability_zones') as mock_get_azs, \
         mock.patch('pulumi_aws.ec2.Subnet') as mock_subnet, \
         mock.patch('pulumi_aws.ec2.InternetGateway') as mock_igw, \
         mock.patch('pulumi_aws.ec2.SecurityGroup') as mock_sg:

        # Set up mocks with required outputs
        mock_vpc_instance = mock.Mock()
        mock_vpc_instance.id = pulumi.Output.from_input("vpc-12345")
        mock_vpc.return_value = mock_vpc_instance

        mock_subnet_instance = mock.Mock()
        mock_subnet_instance.id = pulumi.Output.from_input("subnet-12345")
        mock_subnet.return_value = mock_subnet_instance

        mock_igw_instance = mock.Mock()
        mock_igw_instance.id = pulumi.Output.from_input("igw-12345")
        mock_igw.return_value = mock_igw_instance

        mock_sg_instance = mock.Mock()
        mock_sg_instance.id = pulumi.Output.from_input("sg-12345")
        mock_sg.return_value = mock_sg_instance

        mock_get_azs.return_value = mock.Mock(names=['us-east-1a', 'us-east-1b'])

        # Act
        network = NetworkStack(**mock_network_config)

        # Verify outputs through network instance
        assert network.vpc.id == mock_vpc_instance.id
        assert len(network.public_subnets) == 2
        assert len(network.private_subnets) == 2
        assert network.lambda_sg.id == mock_sg_instance.id
        assert network.db_sg.id == mock_sg_instance.id
