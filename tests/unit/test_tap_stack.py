import unittest
from unittest.mock import MagicMock, patch, call, ANY
from lib.tap_stack import TapStack, TapStackArgs

# We need a custom mock class that inherits from both MagicMock and the
# patched Pulumi Resource to pass Pulumi's internal checks.
# This is a more targeted approach than patching the base class globally.
class MockPulumiResource(MagicMock):
  """
  A special mock class that simulates a Pulumi Resource.
  This version simplifies the mock and focuses on the necessary attributes.
  """
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.name = kwargs.get('name') or "mock-resource"

  # This is the key part: we need to behave like a Pulumi Resource.
  # Pulumi's internal checks often look for these attributes.
  @property
  def id(self):
    return MagicMock()

class MyMocks(unittest.TestCase):
  """
  A class to hold the mocks for Pulumi and its providers.
  """
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.pulumi_mock = MagicMock()
    self.pulumi_aws_provider_mock = MagicMock()
    
    # We patch the Pulumi base classes that are being used in tap_stack.py
    # to control their behavior and satisfy internal type checks.
    self.resource_options_patcher = patch('lib.tap_stack.ResourceOptions', MagicMock())
    
    # We create mocks for the component classes themselves.
    self.networking_infrastructure_mock = MagicMock(side_effect=lambda name, **kwargs: MockPulumiResource(name=name))
    self.security_infrastructure_mock = MagicMock(side_effect=lambda name, **kwargs: MockPulumiResource(name=name))
    self.compute_infrastructure_mock = MagicMock(side_effect=lambda name, **kwargs: MockPulumiResource(name=name))
    self.monitoring_infrastructure_mock = MagicMock(side_effect=lambda name, **kwargs: MockPulumiResource(name=name))

  def setUp(self):
    """Start all the patches for the test run."""
    self.resource_options_patcher.start()

    # Patch the Pulumi and AWS provider imports within the module.
    self.patcher_pulumi = patch('lib.tap_stack.pulumi', self.pulumi_mock)
    self.patcher_aws_provider = patch('lib.tap_stack.aws.Provider', self.pulumi_aws_provider_mock)
    
    self.patcher_pulumi.start()
    self.patcher_aws_provider.start()

    self.addCleanup(self.resource_options_patcher.stop)
    self.addCleanup(self.patcher_pulumi.stop)
    self.addCleanup(self.patcher_aws_provider.stop)

    # Patch the component classes
    self.patcher_networking = patch('lib.tap_stack.NetworkingInfrastructure', self.networking_infrastructure_mock)
    self.patcher_security = patch('lib.tap_stack.SecurityInfrastructure', self.security_infrastructure_mock)
    self.patcher_compute = patch('lib.tap_stack.ComputeInfrastructure', self.compute_infrastructure_mock)
    self.patcher_monitoring = patch('lib.tap_stack.MonitoringInfrastructure', self.monitoring_infrastructure_mock)
    
    self.patcher_networking.start()
    self.patcher_security.start()
    self.patcher_compute.start()
    self.patcher_monitoring.start()

    self.addCleanup(self.patcher_networking.stop)
    self.addCleanup(self.patcher_security.stop)
    self.addCleanup(self.patcher_compute.stop)
    self.addCleanup(self.patcher_monitoring.stop)

    # Mock the Pulumi Output class and its methods for a clean test environment.
    self.pulumi_mock.Output = MagicMock()
    self.pulumi_mock.Output.from_input = lambda x: x
    
    # Corrected mock for Output.all to return a structured dictionary of mocks
    def mock_output_all(**kwargs):
      mock_output_dict = {}
      for k, v in kwargs.items():
        mock_output = MagicMock()
        mock_output.apply.return_value = f"mocked_value_for_{k}"
        mock_output_dict[k] = mock_output
      return mock_output_dict
    
    self.pulumi_mock.Output.all.side_effect = mock_output_all
    
    def mock_apply(func):
      return func("mocked_output")
    
    self.pulumi_mock.Output.apply = mock_apply
    self.mock_parent_opts = MagicMock()

class TestTapStack(MyMocks):
  def test_tap_stack_with_multiple_regions(self):
    test_args = TapStackArgs(
      regions=["us-east-1", "us-west-2"]
    )
    test_stack_name = "test-stack"
    TapStack(test_stack_name, args=test_args, **self.mock_parent_opts)
    self.assertEqual(self.pulumi_aws_provider_mock.call_count, 2)
    provider_calls = self.pulumi_aws_provider_mock.call_args_list
    self.assertIn(call("aws-provider-useast1-prod", region='us-east-1', opts=ANY),
                  provider_calls)
    self.assertIn(call("aws-provider-uswest1-prod", region='us-west-1', opts=ANY),
                  provider_calls)
    self.assertEqual(self.networking_infrastructure_mock.call_count, 2)
    self.assertEqual(self.security_infrastructure_mock.call_count, 2)
    self.assertEqual(self.compute_infrastructure_mock.call_count, 2)
    self.assertEqual(self.monitoring_infrastructure_mock.call_count, 2)

  def test_tap_stack_with_single_region(self):
    test_args = TapStackArgs(
      regions=["us-east-1"]
    )
    test_stack_name = "test-single-region"
    TapStack(test_stack_name, args=test_args, **self.mock_parent_opts)
    self.assertEqual(self.pulumi_aws_provider_mock.call_count, 2)
    self.assertIn(call("aws-provider-useast1-prod", region='us-east-1', opts=ANY),
                  self.pulumi_aws_provider_mock.call_args_list)
    self.assertIn(call("aws-provider-uswest1-prod", region='us-west-1', opts=ANY),
                  self.pulumi_aws_provider_mock.call_args_list)

  def test_tap_stack_with_empty_regions_list_is_ignored(self):
    test_args = TapStackArgs(
      regions=[]
    )
    test_stack_name = "test-empty-regions"
    TapStack(test_stack_name, args=test_args, **self.mock_parent_opts)
    self.assertEqual(self.pulumi_aws_provider_mock.call_count, 2)
    self.assertIn(call("aws-provider-useast1-prod", region='us-east-1', opts=ANY),
                  self.pulumi_aws_provider_mock.call_args_list)
    self.assertIn(call("aws-provider-uswest1-prod", region='us-west-1', opts=ANY),
                  self.pulumi_aws_provider_mock.call_args_list)

  def test_sub_component_provider_args(self):
    test_args = TapStackArgs(
      regions=["us-east-1", "us-west-1"]
    )
    test_stack_name = "test-sub-component-args"
    TapStack(test_stack_name, args=test_args, **self.mock_parent_opts)
    self.assertEqual(self.networking_infrastructure_mock.call_count, 2)
    networking_call_kwargs = self.networking_infrastructure_mock.call_args_list[0].kwargs
    self.assertIn('opts', networking_call_kwargs)
    self.assertIsInstance(networking_call_kwargs['opts'].provider, MagicMock)

  def test_stack_exports(self):
    test_args = TapStackArgs(
      regions=["us-east-1", "us-west-1"]
    )
    test_stack_name = "test-stack-exports"
    
    mock_networking_east = MagicMock(vpc_id="test-vpc-east")
    mock_networking_west = MagicMock(vpc_id="test-vpc-west")
    mock_compute_east = MagicMock(instance_ids="test-instance-east")
    mock_compute_west = MagicMock(instance_ids="test-instance-west")
    mock_security_east = MagicMock(web_server_sg_id="test-sg-east")
    mock_security_west = MagicMock(web_server_sg_id="test-sg-west")
    mock_monitoring_east = MagicMock(dashboard_name="test-dashboard-east")
    mock_monitoring_west = MagicMock(dashboard_name="test-dashboard-west")

    self.networking_infrastructure_mock.side_effect = [
      mock_networking_east, 
      mock_networking_west
    ]
    self.compute_infrastructure_mock.side_effect = [
      mock_compute_east,
      mock_compute_west
    ]
    self.security_infrastructure_mock.side_effect = [
      mock_security_east,
      mock_security_west
    ]
    self.monitoring_infrastructure_mock.side_effect = [
      mock_monitoring_east,
      mock_monitoring_west
    ]
    
    TapStack(test_stack_name, args=test_args, **self.mock_parent_opts)
    
    self.assertTrue(self.pulumi_mock.export.called)
    
    # Convert the call list to a list to avoid iterator consumption issues
    export_calls = list(self.pulumi_mock.export.call_args_list)

    expected_calls = [
      call("deployed_regions", ["us-east-1", "us-west-1"]),
      call("total_regions", 2),
      call("environment", "prod"),
      call("tags", {'Project': 'Pulumi-Tap-Stack', 'Environment': 'prod',
                    'Application': 'custom-app', 'ManagedBy': 'Pulumi'}),
      call("primary_region", "us-east-1"),
      call("primary_vpc_id", mock_networking_east.vpc_id),
      call("primary_instance_ids", mock_compute_east.instance_ids),
      call("primary_web_server_sg_id", mock_security_east.web_server_sg_id),
      call("primary_dashboard_name", mock_monitoring_east.dashboard_name),
      # The final `call` for `all_regions_data` now uses a dictionary with `ANY` for the values
      call("all_regions_data", {
        'us-east-1': ANY,
        'us-west-1': ANY
      })
    ]
    
    for expected_call in expected_calls:
      self.assertIn(expected_call, export_calls)

    # Fixed: Use a safer approach to find the all_regions_data_call
    all_regions_data_calls = [c for c in export_calls if c.args[0] == "all_regions_data"]
    self.assertTrue(len(all_regions_data_calls) > 0, "all_regions_data call not found")
    all_regions_data_call = all_regions_data_calls[0]
    actual_data = all_regions_data_call.args[1]

    self.assertIn('us-east-1', actual_data)
    self.assertIn('us-west-1', actual_data)

    self.assertIsInstance(actual_data['us-east-1'], dict)
    self.assertIsInstance(actual_data['us-west-1'], dict)
    self.assertIn('vpc_id', actual_data['us-east-1'])
    self.assertIn('instance_ids', actual_data['us-east-1'])
    self.assertIn('security_group_id', actual_data['us-east-1'])
    self.assertIn('dashboard_name', actual_data['us-east-1'])