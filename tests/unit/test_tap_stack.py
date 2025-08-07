import os
import sys
import pulumi
import unittest
from unittest.mock import Mock, MagicMock, patch
import types

# Set environment variable for Pulumi testing FIRST
os.environ["PULUMI_TEST_MODE"] = "true"

# Helper to create mock packages


def create_mock_package(name):
  mod = types.ModuleType(name)
  mod.__path__ = []  # makes it a package
  return mod

# FIXED: Create a proper MockOutput class that handles subscriptable operations


class MockOutput:
  def __init__(self, value=None):
    self.value = value
    self._is_output = True

  def apply(self, func):
    if self.value is not None:
      try:
        result = func(self.value)
        return MockOutput(result) if not isinstance(result, MockOutput) else result
      except Exception:
        return MockOutput()
    return MockOutput()

  def __getitem__(self, key):
    if isinstance(self.value, (list, dict)):
      try:
        return MockOutput(self.value[key])
      except (KeyError, IndexError):
        return MockOutput()
    return MockOutput()

  def __iter__(self):
    if isinstance(self.value, (list, tuple)):
      for x in self.value:
        yield MockOutput(x) if not isinstance(x, MockOutput) else x
    elif self.value is not None:
      yield self
    else:
      return iter([])

  @staticmethod
  def all(*args):
    values = []
    for arg in args:
      if arg is None:
        continue
      if isinstance(arg, MockOutput):
        if arg.value is not None:
          values.append(arg.value)
      else:
        values.append(arg)
    return MockOutput(values)

  @staticmethod
  def concat(*args):
    result = ""
    for arg in args:
      if arg is not None:
        if isinstance(arg, MockOutput):
          if arg.value is not None:
            result += str(arg.value)
        else:
          result += str(arg)
    return MockOutput(result)

  def __str__(self):
    return str(self.value) if self.value is not None else ""

  def __repr__(self):
    return f"MockOutput({self.value})"

# FIXED: Make MockOutput work with type subscripts


def MockOutputFactory(*args, **kwargs):
  return MockOutput(*args, **kwargs)

# Add class method for subscript support


def mock_output_class_getitem(cls, item):
  return cls


MockOutput.__class_getitem__ = classmethod(mock_output_class_getitem)
MockOutputFactory.__class_getitem__ = classmethod(mock_output_class_getitem)

# Enhanced MockResource classes


class MockResource:
  def __init__(self, *args, **kwargs):
    self.id = MockOutput("mock-resource-id")
    self.urn = MockOutput("mock-resource-urn")
    self.name = args[1] if len(args) > 1 else "mock-resource"


class MockComponentResource(MockResource):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.type_name = args[0] if len(args) > 0 else None
    self.name = args[1] if len(args) > 1 else None
    self.props = kwargs.get("props", {})
    self.opts = kwargs.get("opts", None)
    self.outputs = {}

  def register_outputs(self, outputs):
    self.outputs.update(outputs)


class MockResourceOptions:
  def __init__(self, parent=None, depends_on=None, **kwargs):
    self.parent = parent
    self.depends_on = depends_on or []
    if not isinstance(self.depends_on, list):
      self.depends_on = [self.depends_on]


# Create comprehensive pulumi mock
pulumi_mock = MagicMock()
pulumi_mock.Output = MockOutputFactory
pulumi_mock.ComponentResource = MockComponentResource
pulumi_mock.ResourceOptions = MockResourceOptions
pulumi_mock.AssetArchive = MagicMock()
pulumi_mock.StringAsset = MagicMock()
pulumi_mock.FileArchive = MagicMock()
pulumi_mock.get_stack = MagicMock(return_value="test")
pulumi_mock.Config = MagicMock()
pulumi_mock.export = MagicMock()
pulumi_mock.Resource = MockResource

# CRITICAL: Add invoke method to pulumi mock (lowercase!)
pulumi_mock.invoke = MagicMock(return_value=MagicMock())
pulumi_mock.get_region = Mock(return_value=MagicMock(name="us-east-1"))

# Set up sys.modules with pulumi mock
sys.modules["pulumi"] = pulumi_mock

# Create AWS mocks
sys.modules["pulumi_aws"] = create_mock_package("pulumi_aws")
mock_region = MagicMock()
mock_region.name = "us-east-1"
sys.modules["pulumi_aws"].get_region = Mock(return_value=mock_region)
sys.modules["pulumi_aws"].get_availability_zones = Mock(
    return_value=MagicMock(names=["us-east-1a", "us-east-1b"])
)

# Create AWS service mocks
aws_ec2 = create_mock_package("pulumi_aws.ec2")
aws_ec2.Vpc = Mock(return_value=MagicMock(id="vpc-123"))
aws_ec2.Subnet = Mock(return_value=MagicMock(id="subnet-123"))
aws_ec2.SecurityGroup = Mock(return_value=MagicMock(id="sg-123"))
aws_ec2.SecurityGroupRule = Mock()
aws_ec2.Eip = Mock()
aws_ec2.NatGateway = Mock()
aws_ec2.InternetGateway = Mock()
aws_ec2.RouteTable = Mock()
aws_ec2.RouteTableAssociation = Mock()
sys.modules["pulumi_aws"].ec2 = aws_ec2

aws_rds = create_mock_package("pulumi_aws.rds")
aws_rds.Instance = Mock(return_value=MagicMock(
    endpoint="db-endpoint", id="db-123"))
aws_rds.SubnetGroup = Mock()
aws_rds.ParameterGroup = Mock()
sys.modules["pulumi_aws"].rds = aws_rds

aws_iam = create_mock_package("pulumi_aws.iam")
aws_iam.Role = Mock(return_value=MagicMock(arn="arn:aws:iam::123:role/test"))
aws_iam.RolePolicy = Mock()
aws_iam.RolePolicyAttachment = Mock()
aws_iam.Policy = Mock()
sys.modules["pulumi_aws"].iam = aws_iam

aws_apigateway = create_mock_package("pulumi_aws.apigateway")
aws_apigateway.RestApi = Mock(return_value=MagicMock(
    id="api-123", execution_arn=MagicMock(), root_resource_id="root-123"))
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

# Ensure all necessary attributes are set on the actual pulumi module
pulumi.Output = MockOutputFactory
pulumi.ComponentResource = MockComponentResource
pulumi.ResourceOptions = MockResourceOptions
pulumi.AssetArchive = MagicMock()
pulumi.StringAsset = MagicMock()
pulumi.FileArchive = MagicMock()
pulumi.get_stack = MagicMock(return_value="test")
pulumi.Config = MagicMock()
pulumi.export = MagicMock()
pulumi.Resource = MockResource
pulumi.invoke = MagicMock(return_value=MagicMock())  # Fixed: lowercase invoke
pulumi.get_region = Mock(return_value=mock_region)

# Import the components after mocking is complete
# Now import pulumi to get the actual module reference
from lib.components.serverless import ServerlessComponent
from lib.components.database import DatabaseComponent
from lib.components.vpc import ComputeComponent
from lib.components.iam import IAMComponent
from lib.tap_stack import TapStackArgs, TapStack

class TestTapStackComponents(unittest.TestCase):
  def setUp(self):
    self.test_args = TapStackArgs(
        environment_suffix="test",
        tags={"Environment": "test", "Project": "tap-stack"}
    )

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_iam_component_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """Test IAM component initialization"""
    mock_exists.return_value = True

    iam = IAMComponent(
        name="test-iam",
        environment="test",
        opts=pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(iam, "lambda_role"))

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_compute_component_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """Test Compute component initialization"""
    mock_exists.return_value = True

    compute = ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        opts=pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(compute, "vpc"))
    self.assertTrue(hasattr(compute, "private_subnet_ids"))
    self.assertTrue(hasattr(compute, "lambda_sg"))

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_database_component_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """Test Database component initialization"""
    mock_exists.return_value = True

    compute_mock = MockComponentResource()
    compute_mock.db_sg = MagicMock()
    compute_mock.db_sg.id = MockOutput("sg-123")
    compute_mock.private_subnet_ids = MockOutput(["subnet-123"])

    db = DatabaseComponent(
        name="test-db",
        environment="test",
        db_security_group_id=compute_mock.db_sg.id,
        username="admin",
        password=MockOutput("passw0rd"),
        private_subnet_ids=compute_mock.private_subnet_ids,
        opts=pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(db, "rds_instance"))

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_serverless_component_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """Test Serverless component initialization"""
    # Setup file operation mocks
    mock_exists.return_value = True
    mock_walk.return_value = [
        ('lambda_files', [], ['handler.py', 'requirements.txt'])]

    # Setup zipfile mock
    mock_zipfile_instance = MagicMock()
    mock_zipfile.return_value.__enter__.return_value = mock_zipfile_instance

    iam_mock = MockComponentResource()
    iam_mock.lambda_role = MagicMock()
    iam_mock.lambda_role.arn = MockOutput("arn:aws:iam::123:role/test")

    compute_mock = MockComponentResource()
    compute_mock.private_subnet_ids = MockOutput(["subnet-123"])
    compute_mock.lambda_sg = MagicMock()
    compute_mock.lambda_sg.id = MockOutput("sg-123")

    db_mock = MockComponentResource()
    db_mock.rds_instance = MagicMock()
    db_mock.rds_instance.endpoint = MockOutput("db-endpoint")

    mock_depends_resource = MockComponentResource()

    serverless = ServerlessComponent(
        name="test-serverless",
        environment="test",
        lambda_role_arn=iam_mock.lambda_role.arn,
        private_subnet_ids=compute_mock.private_subnet_ids,
        lambda_security_group_id=compute_mock.lambda_sg.id,
        rds_endpoint=db_mock.rds_instance.endpoint,
        db_name=MockOutput("tapdb"),
        db_username="admin",
        db_password=MockOutput("passw0rd"),
        opts=pulumi.ResourceOptions(depends_on=[mock_depends_resource]),
    )
    self.assertTrue(hasattr(serverless, "lambda_function"))
    self.assertTrue(hasattr(serverless, "api"))

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_tap_stack_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """Test TapStack initialization"""
    # Setup file operation mocks
    mock_exists.return_value = True
    mock_walk.return_value = [
        ('lambda_files', [], ['handler.py', 'requirements.txt'])]

    # Setup zipfile mock
    mock_zipfile_instance = MagicMock()
    mock_zipfile.return_value.__enter__.return_value = mock_zipfile_instance

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
  unittest.main(verbosity=2)
