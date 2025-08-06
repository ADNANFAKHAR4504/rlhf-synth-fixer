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
pulumi_mock = MagicMock()
pulumi_mock.Invoke = MagicMock(return_value=MagicMock())
sys.modules["pulumi"] = pulumi_mock

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
aws_rds.ParameterGroup = Mock()
sys.modules["pulumi_aws"].rds = aws_rds

aws_iam = create_mock_package("pulumi_aws.iam")
aws_iam.Role = Mock(return_value=MagicMock(arn="arn:aws:iam::123:role/test"))
aws_iam.RolePolicy = Mock()
aws_iam.RolePolicyAttachment = Mock()
aws_iam.Policy = Mock()
aws_iam._enums = create_mock_package("pulumi_aws.iam._enums")
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

aws_ec2.Eip = Mock()
aws_ec2.NatGateway = Mock()
aws_ec2.InternetGateway = Mock()
aws_ec2.RouteTable = Mock()
aws_ec2.RouteTableAssociation = Mock()

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

# Enhanced MockComponentResource that inherits from MockResource


class MockResource:
  """Base mock resource class that Pulumi resources should inherit from"""

  def __init__(self, *args, **kwargs):
    self.id = "mock-resource-id"
    self.urn = "mock-resource-urn"
    self.name = args[1] if len(args) > 1 else "mock-resource"


class MockComponentResource(MockResource):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.type_name = args[0] if len(args) > 0 else None
    self.name = args[1] if len(args) > 1 else None
    self.props = kwargs.get("props", {})
    self.opts = kwargs.get("opts", None)
    self.outputs = {}
    self._childResources = []

  def register_outputs(self, outputs):
    self.outputs.update(outputs)

# Create a proper mock ResourceOptions class that matches Pulumi's expected interface


class MockResourceOptions:
  def __init__(self, parent=None, depends_on=None, **kwargs):
    self.parent = parent
    self.depends_on = depends_on or []
    if not isinstance(self.depends_on, list):
      self.depends_on = [self.depends_on]

    # Add all the attributes that Pulumi ResourceOptions expects
    self.transformations = kwargs.get('transformations', [])
    self.aliases = kwargs.get('aliases', [])
    self.additional_secret_outputs = kwargs.get(
        'additional_secret_outputs', [])
    self.custom_timeouts = kwargs.get('custom_timeouts', None)
    self.delete_before_replace = kwargs.get('delete_before_replace', None)
    self.ignore_changes = kwargs.get('ignore_changes', [])
    self.import_ = kwargs.get('import_', None)
    self.protect = kwargs.get('protect', None)
    self.provider = kwargs.get('provider', None)
    self.providers = kwargs.get('providers', None)
    self.replace_on_changes = kwargs.get('replace_on_changes', [])
    self.retain_on_delete = kwargs.get('retain_on_delete', None)
    self.version = kwargs.get('version', None)
    self.plugin_download_url = kwargs.get('plugin_download_url', None)
    self.urn = kwargs.get('urn', None)
    self.id = kwargs.get('id', None)
    self.kwargs = kwargs

  def _copy(self, **kwargs):
    """Internal method that Pulumi uses to copy ResourceOptions with modifications"""
    new_kwargs = self.kwargs.copy()
    new_kwargs.update(kwargs)

    return MockResourceOptions(
        parent=kwargs.get('parent', self.parent),
        depends_on=kwargs.get('depends_on', self.depends_on),
        **new_kwargs
    )

  def merge(self, other):
    """Merge this ResourceOptions with another"""
    if other is None:
      return self
    return self._copy()

  @staticmethod
  def merge_options(opts1, opts2):
    """Static method to merge two ResourceOptions"""
    if opts1 is None:
      return opts2
    if opts2 is None:
      return opts1
    return opts1._copy()


# Patch isinstance to handle MockOutput and Resource checks
original_isinstance = builtins.isinstance


def patched_isinstance(obj, cls):
  # Handle MockOutput checks
  if hasattr(cls, '__name__') and cls.__name__ == 'Output' and hasattr(obj, '_is_output'):
    return True

  # Handle ResourceOptions checks
  if hasattr(cls, '__name__') and cls.__name__ == 'ResourceOptions' and isinstance(obj, MockResourceOptions):
    return True

  # Handle Resource checks - allow MockResource and its subclasses
  if hasattr(cls, '__name__') and cls.__name__ == 'Resource':
    return isinstance(obj, MockResource)

  # Handle pulumi.Resource checks specifically
  if str(cls).find('pulumi') != -1 and str(cls).find('Resource') != -1:
    return isinstance(obj, MockResource)

  # Handle pulumi.ResourceOptions checks specifically
  if str(cls).find('pulumi') != -1 and str(cls).find('ResourceOptions') != -1:
    return isinstance(obj, MockResourceOptions)

  # Use original isinstance for everything else
  try:
    return original_isinstance(obj, cls)
  except TypeError:
    # If cls is not a proper type, return False
    return False


# Apply patches
pulumi.Output = MockOutput
pulumi.ComponentResource = MockComponentResource
pulumi.ResourceOptions = MockResourceOptions
pulumi.AssetArchive = MagicMock()
pulumi.StringAsset = MagicMock()
pulumi.FileArchive = MagicMock()
pulumi.get_stack = MagicMock(return_value="test")
pulumi.Config = MagicMock()
pulumi.export = MagicMock()

# Create a base Resource class for Pulumi


class MockPulumiResource(MockResource):
  pass


pulumi.Resource = MockPulumiResource

# Also patch the pulumi module's ResourceOptions in sys.modules
sys.modules["pulumi"].ResourceOptions = MockResourceOptions

# Monkey patch isinstance
builtins.isinstance = patched_isinstance

# Set environment variable for Pulumi testing
os.environ["PULUMI_TEST_MODE"] = "true"

# Mock file operations for lambda packaging
original_exists = os.path.exists
original_walk = os.walk


def mock_exists(path):
  if 'lambda.zip' in path or 'lambda_files' in path:
    return True
  return original_exists(path)


def mock_walk(path):
  if 'lambda_files' in path:
    return [('lambda_files', [], ['handler.py', 'requirements.txt'])]
  return original_walk(path)


os.path.exists = mock_exists
os.walk = mock_walk


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

    # Create a proper mock resource that will pass the isinstance check
    mock_depends_resource = MockComponentResource()

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
        opts=pulumi.ResourceOptions(depends_on=[mock_depends_resource]),
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
