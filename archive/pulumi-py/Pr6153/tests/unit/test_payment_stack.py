"""Unit tests for payment_stack.py"""
import datetime
import unittest.mock as mock
from typing import Any, Dict

import pulumi
import pytest

from lib.payment_stack import PaymentProcessingStack


class MockRandomPassword:
    """Mock for pulumi_random.RandomPassword"""
    def __init__(self, name: str, length: int = 16, **kwargs):
        self.name = name
        self.length = length
        self.result = "MockedPassword123!"


class MockPulumiRandom:
    """Mock pulumi_random module"""
    RandomPassword = MockRandomPassword


@pytest.fixture
def mock_payment_config():
    """Fixture to provide mock payment stack configuration"""
    return {
        'name': 'test-payment',
        'environment': 'test',
        'environment_suffix': 'a',
        'vpc_cidr': '10.0.0.0/16',
        'region': 'us-east-1',
        'cost_center': 'test-cc',
        'enable_multi_az': False,
        'db_instance_class': 'db.t3.micro',
        'dynamodb_read_capacity': 5,
        'dynamodb_write_capacity': 5,
        'log_retention_days': 7
    }


@pytest.fixture
def mock_current_time(monkeypatch):
    """Mock datetime for consistent tests"""
    mock_now = datetime.datetime(2024, 1, 1, 12, 0, 0)
    monkeypatch.setattr(datetime, 'datetime', mock.Mock(now=lambda: mock_now))
    return mock_now


class TestingMocks(pulumi.runtime.Mocks):
    """Custom testing mocks for Pulumi resources"""

    def __init__(self):
        """Initialize with mock resource defaults"""
        super().__init__()
        self.mock_ids = {
            'vpc': 'vpc-12345678',
            'subnet': 'subnet-12345678',
            'igw': 'igw-12345678',
            'natgw': 'nat-12345678',
            'eip': 'eip-12345678',
            'sg': 'sg-12345678',
            'db-password': 'MockedPassword123!',
        }

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation"""
        outputs: Dict[str, Any] = {
            "id": self.mock_ids.get(args.name, f"{args.name}-12345678"),
            "arn": f"arn:aws:{args.name}:us-east-1:123456789012:{args.name}-12345678",
        }
        if "password" in args.name.lower():
            outputs["result"] = self.mock_ids["db-password"]
        return [f"{args.name}-12345678", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock AWS API calls"""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": [
                    "us-east-1a",
                    "us-east-1b",
                    "us-east-1c",
                ],
                "zoneIds": [
                    "use1-az1",
                    "use1-az2",
                    "use1-az3",
                ],
            }
        return {}


def test_payment_stack_creates_network(mock_payment_config, mock_current_time):
    """Test network stack creation"""
    # Setup Pulumi mocks
    pulumi.runtime.set_mocks(TestingMocks())

    with mock.patch('pulumi.ComponentResource.__init__', mock.Mock()), \
         mock.patch('lib.payment_stack.NetworkStack') as mock_network_stack, \
         mock.patch('lib.payment_stack.StorageStack') as mock_storage_stack, \
         mock.patch('lib.payment_stack.ComputeStack') as mock_compute_stack, \
         mock.patch.dict('sys.modules', {'pulumi_random': MockPulumiRandom()}):

        # Arrange
        mock_network_instance = mock.Mock()
        mock_network_stack.return_value = mock_network_instance
        mock_storage_instance = mock.Mock()
        mock_storage_stack.return_value = mock_storage_instance
        mock_compute_instance = mock.Mock()
        mock_compute_stack.return_value = mock_compute_instance

        # Act
        payment_stack = PaymentProcessingStack(**mock_payment_config)

        # Assert
        mock_network_stack.assert_called_once_with(
            name=f"network-{mock_payment_config['environment']}-{mock_payment_config['environment_suffix']}",
            vpc_cidr=mock_payment_config['vpc_cidr'],
            environment=mock_payment_config['environment'],
            tags={
                "Environment": mock_payment_config['environment'],
                "CostCenter": mock_payment_config['cost_center'],
                "DeploymentTimestamp": mock_current_time.isoformat(),
                "ManagedBy": "Pulumi",
                "Project": "PaymentProcessing",
            },
            opts=mock.ANY
        )
        assert payment_stack.network == mock_network_instance
