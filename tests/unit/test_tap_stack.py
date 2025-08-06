import builtins
from lib.components.serverless import ServerlessComponent
from lib.components.database import DatabaseComponent
from lib.components.vpc import ComputeComponent
from lib.components.iam import IAMComponent
from lib.tap_stack import TapStackArgs, TapStack
import pulumi
import os
import sys
import unittest
from unittest.mock import Mock, MagicMock, patch
import types

# Helper to create mock packages


def create_mock_package(name):
  mod = types.ModuleType(name)
  mod.__path__ = []  # makes it a package
  return mod


# Setup mock modules before importing your components
sys.modules["pulumi"] = MagicMock()
sys.modules["pulumi_aws"] = create_mock_package("pulumi_aws")
sys.modules["pulumi_aws"].get_region = Mock(
    return_value=MagicMock(name="us-east-1"))
sys.modules["pulumi_aws"].get_availability_zones = Mock(
    return_value=MagicMock(names=["us-east-1a", "us-east-1b"])
)

# Create proper mock structure for AWS modules
aws_ec2 = create_mock_package("pulumi_aws.ec2")
aws_ec2.Vpc = Mock(return_value=MagicMock(id="vpc-123"))
aws_ec2.Subnet = Mock(return_value=MagicMock(id="subnet-123"))
aws_ec2.SecurityGroup = Mock(return_value=MagicMock(id="sg-123"))
aws_ec2.SecurityGroupRule = Mock()
aws_ec2._enums = create_mock_package("pulumi_aws.ec2._enums")
sys.modules["pulumi_aws"].ec2 = aws_ec2

aws_rds = create_mock_package("pulumi_aws.rds")
aws_rds.Instance = Mock(return_value=MagicMock(
    endpoint="db-endpoint", id="db-123"))
aws_rds.SubnetGroup = Mock()
sys.modules["pulumi_aws"].rds = aws_rds

aws_iam = create_mock_package("pulumi_aws.iam")
aws_iam.Role = Mock(return_value=MagicMock(arn="arn:aws:iam::123:role/test"))
aws_iam.RolePolicy = Mock()
aws_iam.RolePolicyAttachment = Mock()
aws_iam._enums = create_mock_package("pulumi_aws.iam._enums")
sys.modules["pulumi_aws"].iam = aws_iam

aws_apigateway = create_mock_package("pulumi_aws.apigateway")
aws_apigateway.RestApi = Mock(return_value=MagicMock(id="api-123"))
aws_apigateway.Deployment = Mock()
aws_apigateway.Stage = Mock()
aws_apigateway.Resource = Mock()
aws_apigateway.Method = Mock()
aws_apigateway.Integration = Mock()
aws_apigateway.IntegrationResponse = Mock()
aws_apigateway.MethodResponse = Mock()
sys.modules["pulumi_aws"].apigateway = aws_apigateway

aws_lambda = create_mock_package("pulumi_aws.lambda_")
aws_lambda.Function = Mock()
aws_lambda.Permission = Mock()
sys.modules["pulumi_aws"].lambda_ = aws_lambda

# Improved MockOutput implementation


class MockOutput:
  def __init__(self, value=None):
    self.value = value
    self._is_output = True

  def apply(self, func):
    if self.value is not None:
      result = func(self.value)
      return MockOutput(result) if not isinstance(result, MockOutput) else result
    return MockOutput()

  def __getitem__(self, key):
    if isinstance(self.value, (list, dict)):
      return MockOutput(self.value[key])
    return MockOutput()

  def __iter__(self):
    if isinstance(self.value, (list, tuple)):
      for x in self.value:
        yield MockOutput(x)
    else:
      yield MockOutput()

  @staticmethod
  def all(*args):
    return MockOutput([arg.value if isinstance(arg, MockOutput) else arg for arg in args])

  @staticmethod
  def concat(*args):
    return MockOutput("".join(str(arg.value if isinstance(arg, MockOutput) else arg) for arg in args))

  def __str__(self):
    return str(self.value)

# Enhanced MockComponentResource


class MockComponentResource:
  def __init__(self, *args, **kwargs):
    self.type_name = args[0] if len(args) > 0 else None
    self.name = args[1] if len(args) > 1 else None
    self.props = kwargs.get("props", {})
    self.opts = kwargs.get("opts", None)
    self.outputs = {}
    self._childResources = []
    self.id = "mock-resource-id"  # Add id attribute for depends_on
    self.urn = "mock-resource-urn"  # Add urn attribute for Pulumi resources

  def register_outputs(self, outputs):
    self.outputs.update(outputs)


# Patch isinstance to handle MockOutput checks without recursion
original_isinstance = builtins.isinstance


def patched_isinstance(obj, cls):
  # First check for MockOutput without recursion
  if cls is pulumi.Output and hasattr(obj, '_is_output'):
    return True

  # Use original isinstance for everything else
  return original_isinstance(obj, cls)


# Apply patches
pulumi.Output = MockOutput
pulumi.ComponentResource = MockComponentResource
pulumi.ResourceOptions = pulumi.ResourceOptions
pulumi.AssetArchive = MagicMock()
pulumi.StringAsset = MagicMock()
pulumi.get_stack = MagicMock(return_value="test")
pulumi.Config = MagicMock()
pulumi.export = MagicMock()

# Monkey patch isinstance carefully
builtins.isinstance = patched_isinstance

# Set environment variable for Pulumi testing
os.environ["PULUMI_TEST_MODE"] = "true"


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
    compute_mock = MockComponentResource()
    compute_mock.db_sg = MagicMock(id="sg-123")
    compute_mock.private_subnet_ids = MockOutput(["subnet-123"])

    db = DatabaseComponent(
        name="test-db",
        environment="test",
        db_security_group_id=compute_mock.db_sg.id,
        username="admin",
        password="passw0rd",
        private_subnet_ids=compute_mock.private_subnet_ids,
        opts=pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(db, "rds_instance"))

  def test_serverless_component_initialization(self):
    iam_mock = MockComponentResource()
    iam_mock.lambda_role = MagicMock(arn="arn:aws:iam::123:role/test")

    compute_mock = MockComponentResource()
    compute_mock.private_subnet_ids = MockOutput(["subnet-123"])
    compute_mock.lambda_sg = MagicMock(id="sg-123")

    db_mock = MockComponentResource()
    db_mock.rds_instance = MagicMock(endpoint="db-endpoint")

    serverless = ServerlessComponent(
        name="test-serverless",
        environment="test",
        lambda_role_arn=iam_mock.lambda_role.arn,
        private_subnet_ids=compute_mock.private_subnet_ids,
        lambda_security_group_id=compute_mock.lambda_sg.id,
        rds_endpoint=db_mock.rds_instance.endpoint,
        db_name="tapdb",
        db_username="admin",
        db_password="passw0rd",
        opts=pulumi.ResourceOptions(depends_on=[db_mock]),
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
