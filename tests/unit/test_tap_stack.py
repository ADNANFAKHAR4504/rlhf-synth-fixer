import unittest
import pulumi
from unittest.mock import patch, Mock
from pulumi import Output
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
  def test_default_values(self):
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.aws_region, 'us-east-1')
    self.assertEqual(args.vpc_cidr, '10.0.0.0/16')
    self.assertTrue(args.enable_monitoring)
    self.assertIn('Environment', args.tags)
    self.assertEqual(args.tags['Environment'], 'Dev')
    self.assertEqual(args.project_name, 'CloudEnvironmentSetup')

  def test_invalid_environment_suffix(self):
    with self.assertRaises(ValueError):
      TapStackArgs(environment_suffix='bad_env')

  def test_invalid_cidr_raises(self):
    with self.assertRaises(ValueError):
      TapStackArgs(vpc_cidr='192.168.0.0/8')

  def test_invalid_region_format(self):
    with self.assertRaises(ValueError):
      TapStackArgs(aws_region='uswest1')

  def test_valid_pull_request_environment_suffix(self):
    args = TapStackArgs(environment_suffix='pr456')
    self.assertEqual(args.environment_suffix, 'pr456')
    self.assertEqual(args.tags['Environment'], 'Pr456')

  def test_custom_tags_merge_with_defaults(self):
    custom_tags = {
      'Environment': 'CustomEnv',
      'Department': 'Engineering',
      'Owner': 'Alice'
    }
    args = TapStackArgs(tags=custom_tags)
    self.assertIn('Project', args.tags)
    self.assertIn('Department', args.tags)
    self.assertEqual(args.tags['Department'], 'Engineering')
    self.assertEqual(args.tags['Environment'], 'CustomEnv')
    self.assertEqual(args.tags['Owner'], 'Alice')


class TestTagging(unittest.TestCase):
  def test_enterprise_tags_applied(self):
    args = TapStackArgs(environment_suffix='prod')
    expected_keys = [
      'Environment',
      'ManagedBy',
      'Project',
      'CreatedDate',
      'Owner'
    ]
    for key in expected_keys:
      self.assertIn(key, args.tags)
    self.assertEqual(args.tags['Project'], 'CloudEnvironmentSetup')
    self.assertEqual(args.tags['Environment'], 'Prod')


class TestTapStack(unittest.TestCase):
  """Simple tests for TapStack class methods"""

  @patch('lib.tap_stack.aws')
  @patch('pulumi.ComponentResource.__init__')
  @patch('pulumi.Config')
  @patch('pulumi.get_stack', return_value='test-stack')
  @patch('pulumi.export')
  def test_unique_suffix_method(self, mock_export, mock_get_stack, mock_config,
                              mock_super_init, mock_aws):
    """Test the _unique_suffix method"""
    # Mock the parent class initialization
    mock_super_init.return_value = None

    # Create minimal mocks for AWS resources
    self._setup_minimal_aws_mocks(mock_aws)

    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    # Test unique suffix generation
    suffix1 = stack._unique_suffix("test-string")
    suffix2 = stack._unique_suffix("different-string")

    self.assertEqual(len(suffix1), 6)
    self.assertEqual(len(suffix2), 6)
    self.assertNotEqual(suffix1, suffix2)

    # Same input should give same output
    suffix3 = stack._unique_suffix("test-string")
    self.assertEqual(suffix1, suffix3)

  @patch('lib.tap_stack.aws')
  @patch('pulumi.ComponentResource.__init__')
  @patch('pulumi.Config')
  @patch('pulumi.get_stack', return_value='test-stack')
  @patch('pulumi.export')
  def test_merge_tags_method(self, mock_export, mock_get_stack, mock_config,
                            mock_super_init, mock_aws):
    """Test the _merge_tags method"""
    mock_super_init.return_value = None
    self._setup_minimal_aws_mocks(mock_aws)

    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    # Test tag merging
    extra_tags = {"Name": "test-resource", "Type": "networking"}
    merged = stack._merge_tags(extra_tags)

    self.assertIn("Name", merged)
    self.assertIn("Type", merged)
    self.assertIn("Environment", merged)  # From default tags
    self.assertIn("Project", merged)      # From default tags

    self.assertEqual(merged["Name"], "test-resource")
    self.assertEqual(merged["Type"], "networking")
    self.assertEqual(merged["Environment"], "Dev")

  @patch('lib.tap_stack.aws')
  @patch('pulumi.ComponentResource.__init__')
  @patch('pulumi.Config')
  @patch('pulumi.get_stack', return_value='test-stack')
  @patch('pulumi.export')
  def test_networking_resources_created(self, mock_export, mock_get_stack, mock_config,
                                       mock_super_init, mock_aws):
    """Test that networking resources are created"""
    mock_super_init.return_value = None
    self._setup_minimal_aws_mocks(mock_aws)

    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    # Verify networking resources were called
    mock_aws.ec2.Vpc.assert_called()
    mock_aws.ec2.InternetGateway.assert_called()
    mock_aws.ec2.RouteTable.assert_called()

    # Verify stack has networking attributes
    self.assertIsNotNone(stack.vpc)
    self.assertIsNotNone(stack.igw)
    self.assertIsNotNone(stack.route_table)

  @patch('lib.tap_stack.aws')
  @patch('pulumi.ComponentResource.__init__')
  @patch('pulumi.Config')
  @patch('pulumi.get_stack', return_value='test-stack')
  @patch('pulumi.export')
  def test_security_resources_created(self, mock_export, mock_get_stack, mock_config,
                                     mock_super_init, mock_aws):
    """Test that security resources are created"""
    mock_super_init.return_value = None
    self._setup_minimal_aws_mocks(mock_aws)

    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    # Verify security resources were called
    mock_aws.ec2.SecurityGroup.assert_called()
    mock_aws.iam.Role.assert_called()
    mock_aws.iam.InstanceProfile.assert_called()
    mock_aws.iam.RolePolicyAttachment.assert_called()

    # Verify stack has security attributes
    self.assertIsNotNone(stack.security_group)
    self.assertIsNotNone(stack.iam_role)
    self.assertIsNotNone(stack.iam_instance_profile)

  @patch('lib.tap_stack.aws')
  @patch('pulumi.ComponentResource.__init__')
  @patch('pulumi.Config')
  @patch('pulumi.get_stack', return_value='test-stack')
  @patch('pulumi.export')
  def test_monitoring_enabled(self, mock_export, mock_get_stack, mock_config,
                              mock_super_init, mock_aws):
    """Test monitoring is created when enable_monitoring=True"""
    mock_super_init.return_value = None
    self._setup_minimal_aws_mocks(mock_aws)

    args = TapStackArgs(enable_monitoring=True)
    TapStack("test-stack", args)

    mock_aws.cloudwatch.LogGroup.assert_called()

  @patch('lib.tap_stack.aws')
  @patch('pulumi.ComponentResource.__init__')
  @patch('pulumi.Config')
  @patch('pulumi.get_stack', return_value='test-stack')
  @patch('pulumi.export')
  def test_monitoring_disabled(self, mock_export, mock_get_stack, mock_config,
                               mock_super_init, mock_aws):
    """Test monitoring is not created when enable_monitoring=False"""
    mock_super_init.return_value = None
    self._setup_minimal_aws_mocks(mock_aws)

    args = TapStackArgs(enable_monitoring=False)
    TapStack("test-stack", args)

    mock_aws.cloudwatch.LogGroup.assert_not_called()

  @patch('lib.tap_stack.aws')
  @patch('pulumi.ComponentResource.__init__')
  @patch('pulumi.Config')
  @patch('pulumi.get_stack', return_value='test-stack')
  @patch('pulumi.export')
  def test_ec2_instances_created(self, mock_export, mock_get_stack, mock_config,
                                mock_super_init, mock_aws):
    """Test that EC2 instances are created"""
    mock_super_init.return_value = None
    self._setup_minimal_aws_mocks(mock_aws)

    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    # Verify EC2 instances were created
    mock_aws.ec2.Instance.assert_called()
    mock_aws.ec2.get_ami.assert_called()

    # Verify stack has instances
    self.assertIsInstance(stack.instances, list)

  @patch('lib.tap_stack.aws')
  @patch('pulumi.ComponentResource.__init__')
  @patch('pulumi.Config')
  @patch('pulumi.get_stack', return_value='test-stack')
  @patch('pulumi.export')
  def test_outputs_registered(self, mock_export, mock_get_stack, mock_config,
                              mock_super_init, mock_aws):
    """Test that stack outputs are registered"""
    mock_super_init.return_value = None
    self._setup_minimal_aws_mocks(mock_aws)

    args = TapStackArgs(environment_suffix='dev')
    TapStack("test-stack", args)

    # Verify pulumi.export was called for various outputs
    expected_exports = [
      "vpc_id",
      "subnet_ids",
      "security_group_id",
      "iam_role_arn",
      "ec2_instance_ids"
    ]

    export_calls = [call[0][0] for call in mock_export.call_args_list]
    for expected in expected_exports:
      self.assertIn(expected, export_calls)

  def _setup_minimal_aws_mocks(self, mock_aws):
    """Helper to set up minimal AWS mocks needed for stack creation"""

    # Make azs an Output
    mock_aws.get_availability_zones.return_value = Mock(
      names=pulumi.Output.from_input(['us-east-1a', 'us-east-1b'])
    )

    # Mock AWS resources with Pulumi Outputs
    mock_aws.ec2.Vpc.return_value = Mock(id=pulumi.Output.from_input("vpc-123"))
    mock_aws.ec2.InternetGateway.return_value = Mock(id=pulumi.Output.from_input("igw-123"))
    mock_aws.ec2.RouteTable.return_value = Mock(id=pulumi.Output.from_input("rt-123"))
    mock_aws.ec2.Subnet.return_value = Mock(id=pulumi.Output.from_input("subnet-123"))
    mock_aws.ec2.RouteTableAssociation.return_value = Mock(id=pulumi.Output.from_input("rta-123"))
    mock_aws.ec2.SecurityGroup.return_value = Mock(id=pulumi.Output.from_input("sg-123"))

    # IAM mocks with Outputs
    mock_role = Mock()
    mock_role.name = pulumi.Output.from_input("role-name")
    mock_role.arn = pulumi.Output.from_input("arn:aws:iam::123:role/test")
    mock_aws.iam.Role.return_value = mock_role
    mock_aws.iam.InstanceProfile.return_value = Mock(name=pulumi.Output.from_input("profile-name"))
    mock_aws.iam.RolePolicyAttachment.return_value = Mock()

    # EC2 instance + get_ami
    mock_aws.get_ami.return_value = Mock(id=pulumi.Output.from_input("ami-123"))
    mock_aws.ec2.Instance.return_value = Mock(id=pulumi.Output.from_input("i-123"))

    # CloudWatch LogGroup
    mock_aws.cloudwatch.LogGroup.return_value = Mock(id=pulumi.Output.from_input("log-group-123"))

    # JSON dumps for IAM trust policy
    with patch('pulumi.Output.json_dumps') as mock_json:
      mock_json.return_value = pulumi.Output.from_input('{"Version": "2012-10-17"}')


class TestCreateTapStackFunction(unittest.TestCase):
  """Test the create_tap_stack helper function"""

  @patch('lib.tap_stack.TapStack')
  def test_create_tap_stack_function(self, mock_tap_stack):
    """Test the create_tap_stack helper function"""
    from lib.tap_stack import create_tap_stack

    mock_instance = Mock()
    mock_tap_stack.return_value = mock_instance

    result = create_tap_stack(
      stack_name="test-stack",
      environment="dev",
      project_name="TestProject"
    )

    # Verify TapStack was called with correct arguments
    mock_tap_stack.assert_called_once()
    args_used = mock_tap_stack.call_args[0][1]  # Second argument is TapStackArgs

    self.assertEqual(args_used.environment_suffix, "dev")
    self.assertEqual(args_used.project_name, "TestProject")
    self.assertEqual(result, mock_instance)


if __name__ == "__main__":
  unittest.main()
