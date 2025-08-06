from lib.tap_stack import TapStackArgs, TapStack
from lib.components.iam import IAMComponent
from lib.components.vpc import ComputeComponent
from lib.components.database import DatabaseComponent
from lib.components.serverless import ServerlessComponent
import builtins
import pulumi
import os
import sys
import unittest
from unittest.mock import Mock, MagicMock, patch
import types
import zipfile

# Set environment variable for Pulumi testing FIRST
os.environ["PULUMI_TEST_MODE"] = "true"

# Helper to create mock packages


def create_mock_package(name):
  mod = types.ModuleType(name)
  mod.__path__ = []  # makes it a package
  return mod


# Setup comprehensive pulumi mock before any imports
pulumi_mock = MagicMock()
pulumi_mock.Invoke = MagicMock(return_value=MagicMock())
pulumi_mock.get_region = Mock(return_value=MagicMock(name="us-east-1"))
pulumi_mock.export = MagicMock()
pulumi_mock.Config = MagicMock()
pulumi_mock.get_stack = MagicMock(return_value="test")
sys.modules["pulumi"] = pulumi_mock

sys.modules["pulumi_aws"] = create_mock_package("pulumi_aws")
# Add get_region directly to pulumi_aws mock
mock_region = MagicMock()
mock_region.name = "us-east-1"
sys.modules["pulumi_aws"].get_region = Mock(return_value=mock_region)
sys.modules["pulumi_aws"].get_availability_zones = Mock(
    return_value=MagicMock(names=["us-east-1a", "us-east-1b"])
)

# Create proper mock structure for AWS modules
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

# FIXED: Improved MockOutput implementation with proper iterator


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
    """FIXED: Proper iterator implementation that never raises StopIteration unexpectedly"""
    if isinstance(self.value, (list, tuple)):
      return (MockOutput(x) if not isinstance(x, MockOutput) else x
              for x in self.value)
    elif self.value is not None:
      # FIXED: Return proper single-item iterator
      return iter([self])
    else:
      # FIXED: Return empty iterator instead of implicit None
      return iter([])

  def __class_getitem__(cls, item):
    """Handle MockOutput[type] syntax for type hints"""
    return cls

  @staticmethod
  def all(*args):
    """FIXED: Handle empty or None arguments gracefully"""
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
    """FIXED: Safely concatenate values"""
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


# Make MockOutput subscriptable at the class level
MockOutput.__class_getitem__ = classmethod(lambda cls, item: cls)

# Enhanced MockComponentResource that inherits from MockResource


class MockResource:
  """Base mock resource class that Pulumi resources should inherit from"""

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


# Apply patches - ensure pulumi module has all necessary attributes
pulumi.Output = MockOutput
pulumi.ComponentResource = MockComponentResource
pulumi.ResourceOptions = MockResourceOptions
pulumi.AssetArchive = MagicMock()
pulumi.StringAsset = MagicMock()
pulumi.FileArchive = MagicMock()
pulumi.get_stack = MagicMock(return_value="test")
pulumi.Config = MagicMock()
pulumi.export = MagicMock()
# FIXED: Ensure Invoke is properly mocked at both levels
pulumi.Invoke = MagicMock(return_value=MagicMock())
pulumi.get_region = Mock(return_value=MagicMock(name="us-east-1"))

# Create a base Resource class for Pulumi


class MockPulumiResource(MockResource):
  pass


pulumi.Resource = MockPulumiResource

# FIXED: Also patch the pulumi module's ResourceOptions in sys.modules with all attributes
sys.modules["pulumi"].ResourceOptions = MockResourceOptions
sys.modules["pulumi"].Output = MockOutput
sys.modules["pulumi"].ComponentResource = MockComponentResource
# FIXED: Ensure Invoke is available at module level
sys.modules["pulumi"].Invoke = MagicMock(return_value=MagicMock())
sys.modules["pulumi"].get_region = Mock(
    return_value=MagicMock(name="us-east-1"))
sys.modules["pulumi"].export = MagicMock()
sys.modules["pulumi"].Config = MagicMock()
sys.modules["pulumi"].get_stack = MagicMock(return_value="test")
sys.modules["pulumi"].AssetArchive = MagicMock()
sys.modules["pulumi"].StringAsset = MagicMock()
sys.modules["pulumi"].FileArchive = MagicMock()
sys.modules["pulumi"].Resource = MockPulumiResource

# Monkey patch isinstance
builtins.isinstance = patched_isinstance

# Now import the actual components after all mocking is set up


class TestTapStackComponents(unittest.TestCase):
  def setUp(self):
    self.test_args = TapStackArgs(
        environment_suffix="test",
        tags={"Environment": "test", "Project": "tap-stack"}
    )

    # FIXED: Verify critical mocks are in place
    self.assertIsNotNone(
        sys.modules["pulumi"].Invoke, "Pulumi Invoke mock missing")
    self.assertIsNotNone(pulumi.Invoke, "Direct pulumi.Invoke missing")

  def debug_mock_state(self, mock_obj, name):
    """Debug helper to check mock state"""
    print(f"\n=== Debugging {name} ===")
    print(f"Type: {type(mock_obj)}")
    print(f"Has Invoke: {hasattr(mock_obj, 'Invoke')}")
    print(f"Invoke value: {getattr(mock_obj, 'Invoke', 'MISSING')}")
    if hasattr(mock_obj, '__dict__'):
      print(f"Attributes: {list(mock_obj.__dict__.keys())}")

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_iam_component_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """FIXED: Test with enhanced error handling"""
    mock_exists.return_value = True

    try:
      iam = IAMComponent(
          name="test-iam",
          environment="test",
          opts=pulumi.ResourceOptions(),
      )
      self.assertTrue(hasattr(iam, "lambda_role"))

    except Exception as e:
      print(f"\nDetailed error info:")
      print(f"Error type: {type(e)}")
      print(f"Error message: {str(e)}")
      # Debug mock state if there's an error
      self.debug_mock_state(sys.modules["pulumi"], "pulumi module")
      self.debug_mock_state(pulumi, "pulumi direct")
      import traceback
      traceback.print_exc()
      raise

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_compute_component_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """FIXED: Test with enhanced error handling"""
    mock_exists.return_value = True

    try:
      compute = ComputeComponent(
          name="test-compute",
          cidr_block="10.3.0.0/16",
          environment="test",
          opts=pulumi.ResourceOptions(),
      )
      self.assertTrue(hasattr(compute, "vpc"))
      self.assertTrue(hasattr(compute, "private_subnet_ids"))
      self.assertTrue(hasattr(compute, "lambda_sg"))

    except Exception as e:
      print(f"\nDetailed error info:")
      print(f"Error type: {type(e)}")
      print(f"Error message: {str(e)}")
      import traceback
      traceback.print_exc()
      raise

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_database_component_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """FIXED: Test with enhanced error handling"""
    mock_exists.return_value = True

    try:
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

    except Exception as e:
      print(f"\nDetailed error info:")
      print(f"Error type: {type(e)}")
      print(f"Error message: {str(e)}")
      import traceback
      traceback.print_exc()
      raise

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_serverless_component_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """FIXED: Test with enhanced error handling and improved mocking"""
    # Setup file operation mocks
    mock_exists.return_value = True
    mock_walk.return_value = [
        ('lambda_files', [], ['handler.py', 'requirements.txt'])]

    # Setup zipfile mock
    mock_zipfile_instance = MagicMock()
    mock_zipfile.return_value.__enter__.return_value = mock_zipfile_instance

    try:
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

      # Create a proper mock resource that will pass the isinstance check
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

    except Exception as e:
      print(f"\nDetailed error info:")
      print(f"Error type: {type(e)}")
      print(f"Error message: {str(e)}")
      import traceback
      traceback.print_exc()
      raise

  @patch('os.path.exists')
  @patch('os.walk')
  @patch('zipfile.ZipFile')
  def test_tap_stack_initialization(self, mock_zipfile, mock_walk, mock_exists):
    """FIXED: Test with enhanced error handling"""
    # Setup file operation mocks
    mock_exists.return_value = True
    mock_walk.return_value = [
        ('lambda_files', [], ['handler.py', 'requirements.txt'])]

    # Setup zipfile mock
    mock_zipfile_instance = MagicMock()
    mock_zipfile.return_value.__enter__.return_value = mock_zipfile_instance

    try:
      stack = TapStack(
          name="tap-test",
          args=self.test_args,
          opts=pulumi.ResourceOptions(),
      )
      self.assertTrue(hasattr(stack, "iam_component"))
      self.assertTrue(hasattr(stack, "compute_component"))
      self.assertTrue(hasattr(stack, "database_component"))
      self.assertTrue(hasattr(stack, "serverless_component"))

    except Exception as e:
      print(f"\nDetailed error info:")
      print(f"Error type: {type(e)}")
      print(f"Error message: {str(e)}")
      import traceback
      traceback.print_exc()
      raise


if __name__ == "__main__":
  unittest.main(verbosity=2, buffer=True)
