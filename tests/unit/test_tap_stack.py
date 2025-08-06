import os
import sys
import unittest
from unittest.mock import Mock

# Set environment variable for Pulumi testing
os.environ["PULUMI_TEST_MODE"] = "true"


class MockComponentResource:
  def __init__(self, *args, **kwargs):
    self.type_name = args[0] if len(args) > 0 else None
    self.name = args[1] if len(args) > 1 else None
    self.props = kwargs.get("props", {})
    self.opts = kwargs.get("opts", None)
    self.outputs = None

  def register_outputs(self, outputs):
    self.outputs = True


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


class TestTapStackComponents(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    # Pulumi Mocks
    cls.mock_pulumi = Mock()
    cls.mock_pulumi.ComponentResource = MockComponentResource
    cls.mock_pulumi.ResourceOptions = Mock
    cls.mock_pulumi.Output = MockOutput
    cls.mock_pulumi.Output.concat = MockOutput.concat
    cls.mock_pulumi.Output.all = MockOutput.all
    cls.mock_pulumi.AssetArchive = Mock()
    cls.mock_pulumi.StringAsset = Mock()
    cls.mock_pulumi.get_stack = Mock(return_value="test")

    # AWS mocks
    cls.mock_aws = Mock()
    cls.mock_aws.get_region.return_value = Mock(name="us-east-1")
    cls.mock_aws.get_availability_zones.return_value = Mock(
        names=["us-east-1a", "us-east-1b"]
    )

    # Inject mocks into sys.modules
    sys.modules["pulumi"] = cls.mock_pulumi
    sys.modules["pulumi_aws"] = cls.mock_aws

    # Re-import components after mocks
    from lib.tap_stack import TapStackArgs
    from lib.components.iam import IAMComponent
    from lib.components.vpc import ComputeComponent
    from lib.components.database import DatabaseComponent
    from lib.components.serverless import ServerlessComponent

    cls.TapStackArgs = TapStackArgs
    cls.IAMComponent = IAMComponent
    cls.ComputeComponent = ComputeComponent
    cls.DatabaseComponent = DatabaseComponent
    cls.ServerlessComponent = ServerlessComponent

  def setUp(self):
    self.test_args = self.TapStackArgs(
        environment_suffix="test",
        tags={"Environment": "test", "Project": "tap-stack"}
    )

  def test_iam_component_initialization(self):
    iam = self.IAMComponent(
        name="test-iam",
        environment="test",
        tags=self.test_args.tags
    )
    self.assertTrue(hasattr(iam, "lambda_role"))

  def test_compute_component_initialization(self):
    compute = self.ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        instance_profile="test-profile",
        tags=self.test_args.tags
    )
    self.assertTrue(hasattr(compute, "vpc"))
    self.assertIsInstance(compute.private_subnet_ids, list)
    self.assertTrue(hasattr(compute, "lambda_sg"))

  def test_database_component_initialization(self):
    compute = self.ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        instance_profile="test-profile",
        tags=self.test_args.tags
    )
    db = self.DatabaseComponent(
        name="test-db",
        environment="test",
        vpc_id=compute.vpc.id,
        private_subnet_ids=compute.private_subnet_ids,
        db_security_group_id=compute.db_sg.id,
        db_name="tapdb",
        db_username="admin",
        db_password="passw0rd",
        tags=self.test_args.tags
    )
    self.assertTrue(hasattr(db, "rds_instance"))

  def test_serverless_component_initialization(self):
    compute = self.ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        instance_profile="test-profile",
        tags=self.test_args.tags
    )
    db = self.DatabaseComponent(
        name="test-db",
        environment="test",
        vpc_id=compute.vpc.id,
        private_subnet_ids=compute.private_subnet_ids,
        db_security_group_id=compute.db_sg.id,
        db_name="tapdb",
        db_username="admin",
        db_password="passw0rd",
        tags=self.test_args.tags
    )
    iam = self.IAMComponent(
        name="test-iam",
        environment="test",
        tags=self.test_args.tags
    )
    serverless = self.ServerlessComponent(
        name="test-serverless",
        environment="test",
        lambda_role_arn=iam.lambda_role.arn,
        vpc_id=compute.vpc.id,
        private_subnet_ids=compute.private_subnet_ids,
        lambda_security_group_id=compute.lambda_sg.id,
        rds_endpoint=db.rds_instance.endpoint,
        tags=self.test_args.tags
    )
    self.assertTrue(hasattr(serverless, "lambda_function"))
    self.assertTrue(hasattr(serverless, "api"))


if __name__ == "__main__":
  unittest.main(verbosity=2, buffer=True)
