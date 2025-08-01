import unittest
from unittest.mock import patch, Mock
import pulumi
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

  def setUp(self):
    # Setup patchers for each test
    self.patcher_aws = patch('lib.tap_stack.aws')
    self.patcher_super = patch('pulumi.ComponentResource.__init__', return_value=None)
    self.patcher_config = patch('pulumi.Config')
    self.patcher_get_stack = patch('pulumi.get_stack', return_value='test-stack')
    self.patcher_export = patch('pulumi.export')

    self.mock_aws = self.patcher_aws.start()
    self.mock_super_init = self.patcher_super.start()
    self.mock_config = self.patcher_config.start()
    self.mock_get_stack = self.patcher_get_stack.start()
    self.mock_export = self.patcher_export.start()

    self._setup_minimal_aws_mocks(self.mock_aws)

  def tearDown(self):
    patch.stopall()

  def _setup_minimal_aws_mocks(self, mock_aws):
    # Setup minimal mocks with Pulumi Outputs
    mock_aws.get_availability_zones.return_value = Mock(
      names=pulumi.Output.from_input(['us-east-1a', 'us-east-1b'])
    )
    mock_aws.ec2.Vpc.return_value = Mock(id=pulumi.Output.from_input("vpc-123"))
    mock_aws.ec2.InternetGateway.return_value = Mock(id=pulumi.Output.from_input("igw-123"))
    mock_aws.ec2.RouteTable.return_value = Mock(id=pulumi.Output.from_input("rt-123"))
    mock_aws.ec2.Subnet.return_value = Mock(id=pulumi.Output.from_input("subnet-123"))
    mock_aws.ec2.RouteTableAssociation.return_value = Mock(id=pulumi.Output.from_input("rta-123"))
    mock_aws.ec2.SecurityGroup.return_value = Mock(id=pulumi.Output.from_input("sg-123"))

    mock_role = Mock()
    mock_role.name = pulumi.Output.from_input("role-name")
    mock_role.arn = pulumi.Output.from_input("arn:aws:iam::123:role/test")
    mock_aws.iam.Role.return_value = mock_role
    mock_aws.iam.InstanceProfile.return_value = Mock(name=pulumi.Output.from_input("profile-name"))
    mock_aws.iam.RolePolicyAttachment.return_value = Mock()

    mock_aws.get_ami.return_value = Mock(id=pulumi.Output.from_input("ami-123"))
    mock_aws.ec2.Instance.return_value = Mock(id=pulumi.Output.from_input("i-123"))

    mock_aws.cloudwatch.LogGroup.return_value = Mock(id=pulumi.Output.from_input("log-group-123"))

  def test_unique_suffix_method(self):
    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    # Test unique suffix generation
    suffix1 = stack._unique_suffix("test-string")
    suffix2 = stack._unique_suffix("different-string")

    self.assertEqual(len(suffix1), 6)
    self.assertEqual(len(suffix2), 6)
    self.assertNotEqual(suffix1, suffix2)

    suffix3 = stack._unique_suffix("test-string")
    self.assertEqual(suffix1, suffix3)

  def test_merge_tags_method(self):
    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    extra_tags = {"Name": "test-resource", "Type": "networking"}
    merged = stack._merge_tags(extra_tags)

    self.assertIn("Name", merged)
    self.assertIn("Type", merged)
    self.assertIn("Environment", merged)
    self.assertIn("Project", merged)

    self.assertEqual(merged["Name"], "test-resource")
    self.assertEqual(merged["Type"], "networking")
    self.assertEqual(merged["Environment"], "Dev")

  def test_networking_resources_created(self):
    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    self.mock_aws.ec2.Vpc.assert_called()
    self.mock_aws.ec2.InternetGateway.assert_called()
    self.mock_aws.ec2.RouteTable.assert_called()

    self.assertIsNotNone(stack.vpc)
    self.assertIsNotNone(stack.igw)
    self.assertIsNotNone(stack.route_table)

  def test_security_resources_created(self):
    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    self.mock_aws.ec2.SecurityGroup.assert_called()
    self.mock_aws.iam.Role.assert_called()
    self.mock_aws.iam.InstanceProfile.assert_called()
    self.mock_aws.iam.RolePolicyAttachment.assert_called()

    self.assertIsNotNone(stack.security_group)
    self.assertIsNotNone(stack.iam_role)
    self.assertIsNotNone(stack.iam_instance_profile)

  def test_monitoring_enabled(self):
    args = TapStackArgs(enable_monitoring=True)
    TapStack("test-stack", args)
    self.mock_aws.cloudwatch.LogGroup.assert_called()

  def test_monitoring_disabled(self):
    args = TapStackArgs(enable_monitoring=False)
    TapStack("test-stack", args)
    self.mock_aws.cloudwatch.LogGroup.assert_not_called()

  def test_ec2_instances_created(self):
    args = TapStackArgs(environment_suffix='dev')
    stack = TapStack("test-stack", args)

    self.mock_aws.ec2.Instance.assert_called()
    self.mock_aws.ec2.get_ami.assert_called()
    self.assertIsInstance(stack.instances, list)

  def test_outputs_registered(self):
    args = TapStackArgs(environment_suffix='dev')
    TapStack("test-stack", args)

    expected_exports = [
      "vpc_id",
      "subnet_ids",
      "security_group_id",
      "iam_role_arn",
      "ec2_instance_ids"
    ]

    export_calls = [call[0][0] for call in self.mock_export.call_args_list]
    for expected in expected_exports:
      self.assertIn(expected, export_calls)


class TestCreateTapStackFunction(unittest.TestCase):
  @patch('lib.tap_stack.TapStack')
  def test_create_tap_stack_function(self, mock_tap_stack):
    from lib.tap_stack import create_tap_stack

    mock_instance = Mock()
    mock_tap_stack.return_value = mock_instance

    result = create_tap_stack(
      stack_name="test-stack",
      environment="dev",
      project_name="TestProject"
    )

    mock_tap_stack.assert_called_once()
    args_used = mock_tap_stack.call_args[0][1]

    self.assertEqual(args_used.environment_suffix, "dev")
    self.assertEqual(args_used.project_name, "TestProject")
    self.assertEqual(result, mock_instance)


if __name__ == "__main__":
  unittest.main()
