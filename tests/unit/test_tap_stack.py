from lib.components.serverless import ServerlessComponent
from lib.components.database import DatabaseComponent
from lib.components.iam import IAMComponent
from lib.components.vpc import ComputeComponent
from lib.tap_stack import TapStack, TapStackArgs
import os
import sys
import unittest
from unittest.mock import Mock

# Set environment variable for Pulumi testing
os.environ["PULUMI_TEST_MODE"] = "true"


class MockComponentResource:
  def __init__(self, type_name, name, props=None, opts=None):
    self.type_name = type_name
    self.name = name
    self.props = props or {}
    self.opts = opts

  def register_outputs(self, outputs):
    self.outputs = outputs


class MockOutput:
  def __init__(self, value=None):
    self.value = value

  @staticmethod
  def all(*args):
    mock_result = Mock()
    mock_result.apply = Mock(return_value=Mock())
    return mock_result

  @staticmethod
  def concat(*args):
    return Mock()


# Mock Pulumi and AWS before any import from lib.*
pulumi_mock = Mock()
pulumi_mock.ComponentResource = MockComponentResource
pulumi_mock.ResourceOptions = Mock
pulumi_mock.Output = MockOutput
pulumi_mock.Output.concat = MockOutput.concat
pulumi_mock.Output.all = MockOutput.all
pulumi_mock.AssetArchive = Mock()
pulumi_mock.StringAsset = Mock()
pulumi_mock.get_stack = Mock(return_value="test")

aws_mock = Mock()
aws_mock.get_region.return_value = Mock(name="us-east-1")
aws_mock.get_availability_zones.return_value = Mock(
    names=["us-east-1a", "us-east-1b"]
)

sys.modules["pulumi"] = pulumi_mock
sys.modules["pulumi_aws"] = aws_mock

# Now import lib modules


class TestTapStackComponents(unittest.TestCase):

  def setUp(self):
    self.test_args = TapStackArgs(
        environment_suffix="test",
        tags={"Environment": "test", "Project": "tap-stack"}
    )

  def test_iam_component_initialization(self):
    iam = IAMComponent(name="test-iam", environment="test",
                       tags=self.test_args.tags)
    self.assertIsNotNone(iam.lambda_role)

  def test_compute_component_initialization(self):
    compute = ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        instance_profile="profile-name",
        tags=self.test_args.tags
    )
    self.assertIsNotNone(compute.vpc)
    self.assertIsInstance(compute.private_subnet_ids, list)
    self.assertIsNotNone(compute.lambda_sg)

  def test_database_component_initialization(self):
    compute = ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        instance_profile="profile-name",
        tags=self.test_args.tags
    )
    db = DatabaseComponent(
        name="test-db",
        environment="test",
        vpc_id=compute.vpc.id,
        private_subnet_ids=compute.private_subnet_ids,
        db_security_group_id=compute.db_sg.id,
        db_name="tapdb",
        db_username="admin",
        db_password="password123",
        tags=self.test_args.tags
    )
    self.assertIsNotNone(db.rds_instance)

  def test_serverless_component_initialization(self):
    compute = ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        instance_profile="profile-name",
        tags=self.test_args.tags
    )
    db = DatabaseComponent(
        name="test-db",
        environment="test",
        vpc_id=compute.vpc.id,
        private_subnet_ids=compute.private_subnet_ids,
        db_security_group_id=compute.db_sg.id,
        db_name="tapdb",
        db_username="admin",
        db_password="password123",
        tags=self.test_args.tags
    )
    iam = IAMComponent(name="test-iam", environment="test",
                       tags=self.test_args.tags)

    serverless = ServerlessComponent(
        name="test-serverless",
        environment="test",
        lambda_role_arn=iam.lambda_role.arn,
        vpc_id=compute.vpc.id,
        private_subnet_ids=compute.private_subnet_ids,
        lambda_security_group_id=compute.lambda_sg.id,
        rds_endpoint=db.rds_instance.endpoint,
        tags=self.test_args.tags
    )
    self.assertIsNotNone(serverless.lambda_function)
    self.assertIsNotNone(serverless.api)


if __name__ == "__main__":
  unittest.main(verbosity=2, buffer=True)
