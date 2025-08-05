import unittest
from unittest.mock import Mock, patch, MagicMock, call
import os
import sys

# Set environment variable for Pulumi testing
os.environ['PULUMI_TEST_MODE'] = 'true'


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


class TestTapStackComponents(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    cls.mock_pulumi = Mock()
    cls.mock_pulumi.ComponentResource = MockComponentResource
    cls.mock_pulumi.ResourceOptions = Mock
    cls.mock_pulumi.Output = MockOutput
    cls.mock_pulumi.Output.concat = MockOutput.concat
    cls.mock_pulumi.Output.all = MockOutput.all
    cls.mock_pulumi.AssetArchive = Mock()
    cls.mock_pulumi.StringAsset = Mock()
    cls.mock_pulumi.get_stack = Mock(return_value="test")

    cls.mock_aws = Mock()
    cls.mock_aws.get_region.return_value = Mock(name='us-east-1')
    cls.mock_aws.get_availability_zones.return_value = Mock(
        names=['us-east-1a', 'us-east-1b']
    )

    sys.modules['pulumi'] = cls.mock_pulumi
    sys.modules['pulumi_aws'] = cls.mock_aws

  def setUp(self):
    modules_to_clear = [m for m in sys.modules.keys() if m.startswith('lib.')]
    for module in modules_to_clear:
      if module in sys.modules:
        del sys.modules[module]

    from lib.tap_stack import TapStack, TapStackArgs
    from lib.components.vpc import ComputeComponent
    from lib.components.iam import IAMComponent
    from lib.components.database import DatabaseComponent
    from lib.components.serverless import ServerlessComponent

    self.TapStack = TapStack
    self.TapStackArgs = TapStackArgs
    self.ComputeComponent = ComputeComponent
    self.IAMComponent = IAMComponent
    self.DatabaseComponent = DatabaseComponent
    self.ServerlessComponent = ServerlessComponent

    self.test_args = TapStackArgs(
        environment_suffix='test',
        tags={'Environment': 'test', 'Project': 'tap-stack'}
    )

  def test_iam_component_initialization(self):
    iam = self.IAMComponent(name="test-iam", tags=self.test_args.tags)
    self.assertIsNotNone(iam.lambda_role)

  def test_compute_component_initialization(self):
    compute = self.ComputeComponent(
        name="test-compute", environment="test", tags=self.test_args.tags)
    self.assertIsNotNone(compute.vpc)
    self.assertIsInstance(compute.private_subnet_ids, list)
    self.assertIsNotNone(compute.lambda_sg)

  def test_database_component_initialization(self):
    compute = self.ComputeComponent(
        name="test-compute", environment="test", tags=self.test_args.tags)
    db = self.DatabaseComponent(
        name="test-db",
        vpc_id=compute.vpc.id,
        private_subnet_ids=compute.private_subnet_ids,
        db_security_group_id=compute.db_sg.id,
        tags=self.test_args.tags
    )
    self.assertIsNotNone(db.rds_instance)

  def test_serverless_component_initialization(self):
    compute = self.ComputeComponent(
        name="test-compute", environment="test", tags=self.test_args.tags)
    db = self.DatabaseComponent(
        name="test-db",
        vpc_id=compute.vpc.id,
        private_subnet_ids=compute.private_subnet_ids,
        db_security_group_id=compute.db_sg.id,
        tags=self.test_args.tags
    )
    iam = self.IAMComponent(name="test-iam", tags=self.test_args.tags)

    serverless = self.ServerlessComponent(
        name="test-serverless",
        lambda_role_arn=iam.lambda_role.arn,
        vpc_id=compute.vpc.id,
        private_subnet_ids=compute.private_subnet_ids,
        lambda_security_group_id=compute.lambda_sg.id,
        rds_endpoint=db.rds_instance.endpoint,
        tags=self.test_args.tags
    )
    self.assertIsNotNone(serverless.lambda_function)
    self.assertIsNotNone(serverless.api)
