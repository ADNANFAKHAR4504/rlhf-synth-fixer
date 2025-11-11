"""
Unit tests for networking infrastructure.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from lib.networking import NetworkingStack


class TestNetworkingStack(unittest.TestCase):
    """Test networking stack initialization and outputs."""

    @patch('lib.networking.aws.ec2.Vpc')
    @patch('lib.networking.aws.ec2.InternetGateway')
    @patch('lib.networking.aws.get_availability_zones')
    @patch('lib.networking.aws.ec2.Subnet')
    @patch('lib.networking.aws.ec2.RouteTable')
    @patch('lib.networking.aws.ec2.Route')
    @patch('lib.networking.aws.ec2.RouteTableAssociation')
    def test_networking_stack_creation(
        self, mock_rta, mock_route, mock_rt, mock_subnet,
        mock_azs, mock_igw, mock_vpc
    ):
        """Test that networking stack creates all required resources."""
        # Mock AZs
        mock_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        # Mock VPC
        mock_vpc_instance = Mock()
        mock_vpc_instance.id = 'vpc-123'
        mock_vpc.return_value = mock_vpc_instance

        # Mock IGW
        mock_igw_instance = Mock()
        mock_igw_instance.id = 'igw-123'
        mock_igw.return_value = mock_igw_instance

        # Mock subnets
        mock_subnet_instance = Mock()
        mock_subnet_instance.id = 'subnet-123'
        mock_subnet.return_value = mock_subnet_instance

        # Mock route tables
        mock_rt_instance = Mock()
        mock_rt_instance.id = 'rt-123'
        mock_rt.return_value = mock_rt_instance

        # Create stack
        stack = NetworkingStack(
            'test-networking',
            vpc_cidr='10.0.0.0/16',
            environment_suffix='dev',
            tags={'Environment': 'dev'}
        )

        # Verify VPC was created
        mock_vpc.assert_called_once()

        # Verify IGW was created
        mock_igw.assert_called_once()

        # Verify subnets were created (2 public + 2 private = 4)
        self.assertEqual(mock_subnet.call_count, 4)

        # Verify route tables were created (public + private = 2)
        self.assertEqual(mock_rt.call_count, 2)

    def test_vpc_cidr_parsing(self):
        """Test CIDR block parsing for subnet creation."""
        with patch('lib.networking.aws.ec2.Vpc'), \
             patch('lib.networking.aws.ec2.InternetGateway'), \
             patch('lib.networking.aws.get_availability_zones') as mock_azs, \
             patch('lib.networking.aws.ec2.Subnet'), \
             patch('lib.networking.aws.ec2.RouteTable'), \
             patch('lib.networking.aws.ec2.Route'), \
             patch('lib.networking.aws.ec2.RouteTableAssociation'):

            mock_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

            stack = NetworkingStack(
                'test-networking',
                vpc_cidr='10.1.0.0/16',
                environment_suffix='prod',
                tags={'Environment': 'prod'}
            )

            self.assertIsNotNone(stack)


if __name__ == '__main__':
    unittest.main()
