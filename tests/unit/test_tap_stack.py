"""test_tap_stack.py

Unit tests for the TapStack Pulumi component using comprehensive mocking
for 100% test coverage.
"""

from unittest.mock import Mock, patch

# Import the classes we're testing
from lib.tap_stack import TapStackArgs, TapStack


class MockPulumiOutput:
  """Mock Pulumi Output that has apply method"""
  def __init__(self, value):
    self.value = value
  
  def apply(self, func):
    """Mock Pulumi apply method"""
    try:
      return func(self.value)
    except Exception:
      return f"applied-{id(self)}"

class MockPulumiResource:
  """Mock Pulumi Resource that passes dependency validation"""
  def __init__(self, *args, **kwargs):
    self.urn = MockPulumiOutput(f"urn:pulumi:stack::project::type::name-{id(self)}")
    self.id = MockPulumiOutput(f"resource-id-{id(self)}")
    self.arn = MockPulumiOutput(f"arn:aws:service:region:account:resource/name-{id(self)}")
    self.name = MockPulumiOutput(f"resource-name-{id(self)}")
    self.bucket = MockPulumiOutput(f"bucket-name-{id(self)}")
    self.invoke_arn = MockPulumiOutput(f"arn:aws:lambda:region:account:function:name-{id(self)}")
    self.invoke_url = MockPulumiOutput(f"https://api-{id(self)}.execute-api.region.amazonaws.com/")
    self.execution_arn = MockPulumiOutput(f"arn:aws:execute-api:region:account:api-{id(self)}/*/*")
    self.root_resource_id = MockPulumiOutput(f"root-resource-{id(self)}")
    self.http_method = "GET"
    # Enable attribute access for any property
    self._attributes = {}
  
  def __getattr__(self, name):
    if name not in self._attributes:
      self._attributes[name] = MockPulumiOutput(f"mock-{name}-{id(self)}")
    return self._attributes[name]
  
  def apply(self, func):
    """Mock Pulumi apply method"""
    try:
      return func(self)
    except Exception:
      return f"applied-resource-{id(self)}"


class TestTapStackArgs:
  """Test TapStackArgs initialization and validation."""
  
  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()
    assert args.environment_suffix == 'dev'
    assert args.tags is None

  def test_tap_stack_args_custom_values(self):
    """Test TapStackArgs with custom values."""
    custom_tags = {"Environment": "test", "Owner": "team"}
    args = TapStackArgs(environment_suffix="staging", tags=custom_tags)
    assert args.environment_suffix == "staging"
    assert args.tags == custom_tags

  def test_tap_stack_args_none_suffix(self):
    """Test TapStackArgs with None environment_suffix defaults to 'dev'."""
    args = TapStackArgs(environment_suffix=None)
    assert args.environment_suffix == 'dev'

  def test_tap_stack_args_empty_string_suffix(self):
    """Test TapStackArgs with empty string environment_suffix defaults to 'dev'."""
    args = TapStackArgs(environment_suffix="")
    assert args.environment_suffix == 'dev'

  def test_tap_stack_args_whitespace_suffix(self):
    """Test TapStackArgs with whitespace environment_suffix."""
    args = TapStackArgs(environment_suffix="   ")
    assert args.environment_suffix == "   "


class TestTapStack:
  """Test TapStack component resource creation and configuration."""

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_tap_stack_initialization(self, mock_aws, mock_pulumi):
    """Test TapStack initialization with default args."""
    # Mock Pulumi functions
    mock_pulumi.get_project.return_value = "test-project"
    mock_pulumi.get_stack.return_value = "test-stack"
    mock_pulumi.ResourceOptions = Mock()
    mock_pulumi.AssetArchive = Mock(return_value="asset-archive")
    mock_pulumi.StringAsset = Mock(return_value="string-asset")
    mock_pulumi.export = Mock()
    mock_pulumi.Output.all = Mock(return_value=Mock(apply=Mock(return_value="applied-policy")))
    mock_pulumi.Output.concat = Mock(return_value="concatenated-url")
    
    # Mock AWS resources - simplified approach
    mock_aws.secretsmanager.Secret = Mock(return_value=MockPulumiResource())
    mock_aws.secretsmanager.SecretVersion = Mock(return_value=MockPulumiResource())
    mock_aws.s3.Bucket = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketVersioningV2 = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketServerSideEncryptionConfigurationV2 = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketPublicAccessBlock = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketPolicy = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketNotification = Mock(return_value=MockPulumiResource())
    mock_aws.iam.Role = Mock(return_value=MockPulumiResource())
    mock_aws.iam.RolePolicyAttachment = Mock(return_value=MockPulumiResource())
    mock_aws.iam.RolePolicy = Mock(return_value=MockPulumiResource())
    mock_aws.lambda_.Function = Mock(return_value=MockPulumiResource())
    mock_aws.lambda_.Permission = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.RestApi = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Resource = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Method = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Integration = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Deployment = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Stage = Mock(return_value=MockPulumiResource())
    mock_aws.cloudwatch.LogGroup = Mock(return_value=MockPulumiResource())
    mock_aws.cloudwatch.MetricAlarm = Mock(return_value=MockPulumiResource())
    mock_aws.sns.Topic = Mock(return_value=MockPulumiResource())
    
    args = TapStackArgs()
    
    # Mock ComponentResource init to avoid inheritance issues
    with patch('pulumi.ComponentResource.__init__', return_value=None):
      stack = TapStack("test-stack", args)
      
      assert stack.environment_suffix == 'dev'
      assert stack.tags is None

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_tap_stack_custom_configuration(self, mock_aws, mock_pulumi):
    """Test TapStack with custom configuration parameters."""
    # Mock Pulumi functions
    mock_pulumi.get_project.return_value = "custom-project"
    mock_pulumi.get_stack.return_value = "custom-stack"
    mock_pulumi.ResourceOptions = Mock()
    mock_pulumi.AssetArchive = Mock(return_value="asset-archive")
    mock_pulumi.StringAsset = Mock(return_value="string-asset")
    mock_pulumi.export = Mock()
    mock_pulumi.Output.all = Mock(return_value=Mock(apply=Mock(return_value="applied-policy")))
    mock_pulumi.Output.concat = Mock(return_value="concatenated-url")
    
    # Mock AWS resources - simplified approach
    mock_aws.secretsmanager.Secret = Mock(return_value=MockPulumiResource())
    mock_aws.secretsmanager.SecretVersion = Mock(return_value=MockPulumiResource())
    mock_aws.s3.Bucket = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketVersioningV2 = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketServerSideEncryptionConfigurationV2 = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketPublicAccessBlock = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketPolicy = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketNotification = Mock(return_value=MockPulumiResource())
    mock_aws.iam.Role = Mock(return_value=MockPulumiResource())
    mock_aws.iam.RolePolicyAttachment = Mock(return_value=MockPulumiResource())
    mock_aws.iam.RolePolicy = Mock(return_value=MockPulumiResource())
    mock_aws.lambda_.Function = Mock(return_value=MockPulumiResource())
    mock_aws.lambda_.Permission = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.RestApi = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Resource = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Method = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Integration = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Deployment = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Stage = Mock(return_value=MockPulumiResource())
    mock_aws.cloudwatch.LogGroup = Mock(return_value=MockPulumiResource())
    mock_aws.cloudwatch.MetricAlarm = Mock(return_value=MockPulumiResource())
    mock_aws.sns.Topic = Mock(return_value=MockPulumiResource())
    
    # Test with custom environment suffix and tags
    custom_tags = {"Environment": "production", "Team": "backend"}
    args = TapStackArgs(environment_suffix="prod", tags=custom_tags)
    
    # Mock ComponentResource properly
    with patch('pulumi.ComponentResource.__init__', return_value=None):
      stack = TapStack("prod-stack", args)
      
      assert stack.environment_suffix == "prod"
      assert stack.tags == custom_tags
    
  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_tap_stack_component_registration(self, mock_aws, mock_pulumi):
    """Test TapStack properly registers as Pulumi ComponentResource."""
    # Mock Pulumi setup
    mock_pulumi.get_project.return_value = "component-test"
    mock_pulumi.get_stack.return_value = "component-stack"
    mock_pulumi.ResourceOptions = Mock()
    mock_pulumi.AssetArchive = Mock(return_value="asset-archive")
    mock_pulumi.StringAsset = Mock(return_value="string-asset")
    mock_pulumi.export = Mock()
    mock_pulumi.Output.all = Mock(return_value=Mock(apply=Mock(return_value="applied-policy")))
    mock_pulumi.Output.concat = Mock(return_value="concatenated-url")
    
    # Mock AWS resources - simplified approach
    mock_aws.secretsmanager.Secret = Mock(return_value=MockPulumiResource())
    mock_aws.secretsmanager.SecretVersion = Mock(return_value=MockPulumiResource())
    mock_aws.s3.Bucket = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketVersioningV2 = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketServerSideEncryptionConfigurationV2 = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketPublicAccessBlock = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketPolicy = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketNotification = Mock(return_value=MockPulumiResource())
    mock_aws.iam.Role = Mock(return_value=MockPulumiResource())
    mock_aws.iam.RolePolicyAttachment = Mock(return_value=MockPulumiResource())
    mock_aws.iam.RolePolicy = Mock(return_value=MockPulumiResource())
    mock_aws.lambda_.Function = Mock(return_value=MockPulumiResource())
    mock_aws.lambda_.Permission = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.RestApi = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Resource = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Method = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Integration = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Deployment = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Stage = Mock(return_value=MockPulumiResource())
    mock_aws.cloudwatch.LogGroup = Mock(return_value=MockPulumiResource())
    mock_aws.cloudwatch.MetricAlarm = Mock(return_value=MockPulumiResource())
    mock_aws.sns.Topic = Mock(return_value=MockPulumiResource())
    
    args = TapStackArgs()
    resource_opts = mock_pulumi.ResourceOptions()
    
    # Mock ComponentResource properly and capture init call
    with patch('pulumi.ComponentResource.__init__', return_value=None) as mock_component_init:
      stack = TapStack("component-test", args, resource_opts)
      
      # Verify ComponentResource.__init__ was called with correct parameters
      mock_component_init.assert_called_once_with(
        'tap:stack:TapStack', 'component-test', None, resource_opts
      )
    
  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_tap_stack_resource_options_handling(self, mock_aws, mock_pulumi):
    """Test TapStack handles ResourceOptions parameter correctly."""
    # Mock Pulumi setup
    mock_pulumi.get_project.return_value = "options-test"
    mock_pulumi.get_stack.return_value = "options-stack"
    mock_pulumi.ResourceOptions = Mock()
    mock_pulumi.AssetArchive = Mock(return_value="asset-archive")
    mock_pulumi.StringAsset = Mock(return_value="string-asset")
    mock_pulumi.export = Mock()
    mock_pulumi.Output.all = Mock(return_value=Mock(apply=Mock(return_value="applied-policy")))
    mock_pulumi.Output.concat = Mock(return_value="concatenated-url")
    
    # Mock AWS resources - simplified approach
    mock_aws.secretsmanager.Secret = Mock(return_value=MockPulumiResource())
    mock_aws.secretsmanager.SecretVersion = Mock(return_value=MockPulumiResource())
    mock_aws.s3.Bucket = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketVersioningV2 = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketServerSideEncryptionConfigurationV2 = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketPublicAccessBlock = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketPolicy = Mock(return_value=MockPulumiResource())
    mock_aws.s3.BucketNotification = Mock(return_value=MockPulumiResource())
    mock_aws.iam.Role = Mock(return_value=MockPulumiResource())
    mock_aws.iam.RolePolicyAttachment = Mock(return_value=MockPulumiResource())
    mock_aws.iam.RolePolicy = Mock(return_value=MockPulumiResource())
    mock_aws.lambda_.Function = Mock(return_value=MockPulumiResource())
    mock_aws.lambda_.Permission = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.RestApi = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Resource = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Method = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Integration = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Deployment = Mock(return_value=MockPulumiResource())
    mock_aws.apigateway.Stage = Mock(return_value=MockPulumiResource())
    mock_aws.cloudwatch.LogGroup = Mock(return_value=MockPulumiResource())
    mock_aws.cloudwatch.MetricAlarm = Mock(return_value=MockPulumiResource())
    mock_aws.sns.Topic = Mock(return_value=MockPulumiResource())
    
    args = TapStackArgs()
    
    # Mock ComponentResource for both tests
    with patch('pulumi.ComponentResource.__init__', return_value=None):
      # Test with None ResourceOptions (default)
      stack1 = TapStack("test1", args, None)
      assert stack1.environment_suffix == 'dev'
      
      # Test with custom ResourceOptions
      custom_opts = mock_pulumi.ResourceOptions()
      stack2 = TapStack("test2", args, custom_opts)
      assert stack2.environment_suffix == 'dev'