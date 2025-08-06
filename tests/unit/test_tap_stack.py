from lib.components.serverless import ServerlessComponent
from lib.components.database import DatabaseComponent
from lib.components.vpc import ComputeComponent
from lib.components.iam import IAMComponent
from lib.tap_stack import TapStackArgs, TapStack
import pulumi
import os
import sys
import unittest
from unittest.mock import Mock, MagicMock
import types

# Helper to create mock packages


def create_mock_package(name):
  mod = types.ModuleType(name)
  mod.__path__ = []  # makes it a package
  return mod


# Setup mock modules before importing your components
sys.modules["pulumi"] = MagicMock()
sys.modules["pulumi_aws"] = create_mock_package("pulumi_aws")
sys.modules["pulumi_aws"].get_region = Mock(return_value="us-east-1")
sys.modules["pulumi_aws"].get_availability_zones = Mock(
    return_value=Mock(names=["us-east-1a", "us-east-1b"])
)

# Create and mock all required submodules
sys.modules["pulumi_aws"].ec2 = create_mock_package("pulumi_aws.ec2")
sys.modules["pulumi_aws"].ec2._enums = create_mock_package(
    "pulumi_aws.ec2._enums")
sys.modules["pulumi_aws"].rds = create_mock_package("pulumi_aws.rds")
sys.modules["pulumi_aws"].iam = create_mock_package("pulumi_aws.iam")
sys.modules["pulumi_aws"].iam._enums = create_mock_package(
    "pulumi_aws.iam._enums")
sys.modules["pulumi_aws"].apigateway = create_mock_package(
    "pulumi_aws.apigateway")
sys.modules["pulumi_aws"].lambda_ = create_mock_package("pulumi_aws.lambda_")

# Mock specific classes and functions
sys.modules["pulumi_aws"].ec2.Vpc = Mock(return_value=MagicMock(id="vpc-123"))
sys.modules["pulumi_aws"].ec2.Subnet = Mock(
    return_value=MagicMock(id="subnet-123"))
sys.modules["pulumi_aws"].ec2.SecurityGroup = Mock(
    return_value=MagicMock(id="sg-123"))
sys.modules["pulumi_aws"].ec2.SecurityGroupRule = Mock()

sys.modules["pulumi_aws"].rds.Instance = Mock(
    return_value=MagicMock(endpoint="db-endpoint", id="db-123"))
sys.modules["pulumi_aws"].rds.SubnetGroup = Mock()

sys.modules["pulumi_aws"].iam.Role = Mock(
    return_value=MagicMock(arn="arn:aws:iam::123:role/test"))
sys.modules["pulumi_aws"].iam.RolePolicy = Mock()
sys.modules["pulumi_aws"].iam.RolePolicyAttachment = Mock()

sys.modules["pulumi_aws"].apigateway.RestApi = Mock(
    return_value=MagicMock(id="api-123"))
sys.modules["pulumi_aws"].apigateway.Deployment = Mock()
sys.modules["pulumi_aws"].apigateway.Stage = Mock()
sys.modules["pulumi_aws"].apigateway.Resource = Mock()
sys.modules["pulumi_aws"].apigateway.Method = Mock()
sys.modules["pulumi_aws"].apigateway.Integration = Mock()
sys.modules["pulumi_aws"].apigateway.IntegrationResponse = Mock()
sys.modules["pulumi_aws"].apigateway.MethodResponse = Mock()

sys.modules["pulumi_aws"].lambda_.Function = Mock()
sys.modules["pulumi_aws"].lambda_.Permission = Mock()

# Mock Pulumi specific functionality
sys.modules["pulumi"].ComponentResource = MagicMock()
sys.modules["pulumi"].ResourceOptions = pulumi.ResourceOptions
sys.modules["pulumi"].Output = MagicMock()
sys.modules["pulumi"].Output.all = MagicMock(return_value=MagicMock())
sys.modules["pulumi"].Output.concat = MagicMock(return_value=MagicMock())
sys.modules["pulumi"].AssetArchive = MagicMock()
sys.modules["pulumi"].StringAsset = MagicMock()
sys.modules["pulumi"].get_stack = MagicMock(return_value="test")
sys.modules["pulumi"].Config = MagicMock()
sys.modules["pulumi"].export = MagicMock()

# Set environment variable for Pulumi testing
os.environ["PULUMI_TEST_MODE"] = "true"


class MockOutput:
  def __init__(self, value=None):
    self.value = value

  def apply(self, func):
    return func(self.value) if self.value else MockOutput()

  @staticmethod
  def all(*args):
    return MockOutput(args)

  @staticmethod
  def concat(*args):
    return MockOutput("".join(str(arg) for arg in args))


class MockComponentResource:
  def __init__(self, *args, **kwargs):
    self.type_name = args[0] if len(args) > 0 else None
    self.name = args[1] if len(args) > 1 else None
    self.props = kwargs.get("props", {})
    self.opts = kwargs.get("opts", None)
    self.outputs = {}

  def register_outputs(self, outputs):
    self.outputs.update(outputs)


# Replace the mocks in sys.modules
sys.modules["pulumi"].Output = MockOutput
sys.modules["pulumi"].ComponentResource = MockComponentResource


class TestTapStackComponents(unittest.TestCase):
  def setUp(self):
    self.test_args = TapStackArgs(
        environment_suffix="test",
        tags={"Environment": "test", "Project": "tap-stack"}
    )

  def test_iam_component_initialization(self):
    iam = IAMComponent(
        name="test-iam",
        environment="test",
        opts=pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(iam, "lambda_role"))

  def test_compute_component_initialization(self):
    compute = ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        opts=pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(compute, "vpc"))
    self.assertTrue(hasattr(compute, "private_subnet_ids"))
    self.assertTrue(hasattr(compute, "lambda_sg"))

  def test_database_component_initialization(self):
    compute = ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        opts=pulumi.ResourceOptions(),
    )
    db = DatabaseComponent(
        name="test-db",
        environment="test",
        db_security_group_id="sg-123",  # Using direct mock value
        username="admin",
        password="passw0rd",
        private_subnet_ids=["subnet-123"],  # Using direct mock value
        opts=pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(db, "rds_instance"))

  def test_serverless_component_initialization(self):
    iam = IAMComponent(
        name="test-iam",
        environment="test",
        opts=pulumi.ResourceOptions(),
    )
    serverless = ServerlessComponent(
        name="test-serverless",
        environment="test",
        lambda_role_arn="arn:aws:iam::123:role/test",  # Using direct mock value
        private_subnet_ids=["subnet-123"],  # Using direct mock value
        lambda_security_group_id="sg-123",  # Using direct mock value
        rds_endpoint="db-endpoint",  # Using direct mock value
        db_name="tapdb",
        db_username="admin",
        db_password="passw0rd",
        opts=pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(serverless, "lambda_function"))
    self.assertTrue(hasattr(serverless, "api"))

  def test_tap_stack_initialization(self):
    stack = TapStack(
        name="tap-test",
        args=self.test_args,
        opts=pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(stack, "iam_component"))
    self.assertTrue(hasattr(stack, "compute_component"))
    self.assertTrue(hasattr(stack, "database_component"))
    self.assertTrue(hasattr(stack, "serverless_component"))


if __name__ == "__main__":
  unittest.main(verbosity=2, buffer=True)
