# tests/unit/test_tap_stack.py

import pytest
import pulumi
from unittest.mock import Mock, patch, MagicMock
from lib.tap_stack import TapStack, TapStackArgs

class MockComponentResource(pulumi.ComponentResource):
  def __init__(self, resource_type, name, props=None, opts=None):
    # Don't call super().__init__ to avoid Pulumi registration issues
    self.resource_type = resource_type
    self.name = name
    self.props = props or {}
    self.opts = opts
    
    # Add common attributes that the TapStack expects
    self.kms_key = Mock()
    self.kms_key.arn = pulumi.Output.from_input("arn:aws:kms:us-west-2:123456789012:key/test-key")
    self.rds_monitoring_role = Mock()
    self.rds_monitoring_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/rds-monitoring")
    self.vpc_id = pulumi.Output.from_input("vpc-12345678")
    self.private_subnet_ids = pulumi.Output.from_input(["subnet-123", "subnet-456"])
    self.public_subnet_ids = pulumi.Output.from_input(["subnet-789", "subnet-abc"])
    self.database_security_group_id = pulumi.Output.from_input("sg-database")
    self.sns_topic = Mock()
    self.sns_topic.arn = pulumi.Output.from_input("arn:aws:sns:us-west-2:123456789012:topic")
    self.guardduty_detector = Mock()
    self.guardduty_detector.id = pulumi.Output.from_input("detector-123")
    self.secure_s3_bucket = Mock()
    self.secure_s3_bucket.bucket = pulumi.Output.from_input("secure-projectx-data-uswest2-test")
    self.rds_instance = Mock()
    self.rds_instance.identifier = pulumi.Output.from_input("test-db-instance")
    self.rds_instance_endpoint = pulumi.Output.from_input("db.region.rds.amazonaws.com")
    self.setup_security_alarms = Mock()
    self.setup_vpc_flow_logs = Mock()

class MockResource:
  def __init__(self, id_, **kwargs):
    self.id = id_
    for key, value in kwargs.items():
      setattr(self, key, pulumi.Output.from_input(value))

@pytest.fixture
def mock_pulumi():
  pulumi.runtime.MOCK_STACKS = {}
  pulumi.runtime.MOCK_RESOURCES = {}
  pulumi.runtime.set_mocks({
    "new_resource": lambda type_, name, inputs, provider, id_: MockResource(
      id_=f"{name}-id",
      **inputs
    )
  })
  yield
  pulumi.runtime.MOCK_STACKS = {}
  pulumi.runtime.MOCK_RESOURCES = {}

@patch('lib.tap_stack.DataProtectionInfrastructure')
@patch('lib.tap_stack.SecurityMonitoringInfrastructure')
@patch('lib.tap_stack.NetworkSecurityInfrastructure')
@patch('lib.tap_stack.IdentityAccessInfrastructure')
@patch('pulumi_aws.Provider')
def test_tapstack_initialization(mock_provider, mock_identity, mock_network, mock_monitoring, mock_data_protection, mock_pulumi):
  # Create mock instances that inherit from ComponentResource
  mock_identity_instance = MockComponentResource("identity", "test-identity")
  mock_identity.return_value = mock_identity_instance
  
  mock_network_instance = MockComponentResource("network", "test-network")
  mock_network.return_value = mock_network_instance
  
  mock_monitoring_instance = MockComponentResource("monitoring", "test-monitoring")
  mock_monitoring.return_value = mock_monitoring_instance
  
  mock_data_protection_instance = MockComponentResource("data-protection", "test-data-protection")
  mock_data_protection.return_value = mock_data_protection_instance
  
  # Mock the AWS Provider
  mock_provider_instance = Mock()
  mock_provider.return_value = mock_provider_instance
  
  args = TapStackArgs(
    environment_suffix="test",
    regions=["us-west-2"],
    tags={"Project": "ProjectX", "Environment": "test"}
  )
  
  stack = TapStack("test-stack", args)
  
  # Verify basic properties
  assert stack.environment_suffix == "test"
  assert stack.regions == ["us-west-2"]
  
  # Verify components were created
  mock_identity.assert_called_once()
  mock_network.assert_called_once()
  mock_monitoring.assert_called_once()
  mock_data_protection.assert_called_once()
  
  # Verify the components are stored in the stack
  assert stack.identity_access == mock_identity_instance
  assert stack.regional_networks["us-west-2"] == mock_network_instance
  assert stack.regional_monitoring["us-west-2"] == mock_monitoring_instance
  assert stack.regional_data_protection["us-west-2"] == mock_data_protection_instance

@patch('lib.tap_stack.DataProtectionInfrastructure')
@patch('lib.tap_stack.SecurityMonitoringInfrastructure')
@patch('lib.tap_stack.NetworkSecurityInfrastructure')
@patch('lib.tap_stack.IdentityAccessInfrastructure')
@patch('pulumi_aws.Provider')
def test_tapstack_outputs(mock_provider, mock_identity, mock_network, mock_monitoring, mock_data_protection, mock_pulumi):
  # Create mock instances that inherit from ComponentResource
  mock_identity_instance = MockComponentResource("identity", "test-identity")
  mock_identity.return_value = mock_identity_instance
  
  mock_network_instance = MockComponentResource("network", "test-network")
  mock_network.return_value = mock_network_instance
  
  mock_monitoring_instance = MockComponentResource("monitoring", "test-monitoring")
  mock_monitoring.return_value = mock_monitoring_instance
  
  mock_data_protection_instance = MockComponentResource("data-protection", "test-data-protection")
  mock_data_protection.return_value = mock_data_protection_instance
  
  # Mock the AWS Provider
  mock_provider_instance = Mock()
  mock_provider.return_value = mock_provider_instance
  
  args = TapStackArgs(
    environment_suffix="test",
    regions=["us-west-2"],
    tags={"Project": "ProjectX", "Environment": "test"}
  )
  
  stack = TapStack("test-stack", args)
  
  # Verify the outputs are accessible
  assert stack.regional_networks["us-west-2"].vpc_id == mock_network_instance.vpc_id
  assert stack.identity_access.kms_key.arn == mock_identity_instance.kms_key.arn
  assert stack.regional_monitoring["us-west-2"].sns_topic.arn == mock_monitoring_instance.sns_topic.arn
  assert stack.regional_data_protection["us-west-2"].secure_s3_bucket.bucket == mock_data_protection_instance.secure_s3_bucket.bucket

@patch('lib.tap_stack.DataProtectionInfrastructure')
@patch('lib.tap_stack.SecurityMonitoringInfrastructure')
@patch('lib.tap_stack.NetworkSecurityInfrastructure')
@patch('lib.tap_stack.IdentityAccessInfrastructure')
@patch('pulumi_aws.Provider')
def test_tapstack_vpc_flow_logs(mock_provider, mock_identity, mock_network, mock_monitoring, mock_data_protection, mock_pulumi):
  # Create mock instances that inherit from ComponentResource
  mock_identity_instance = MockComponentResource("identity", "test-identity")
  mock_identity.return_value = mock_identity_instance
  
  mock_network_instance = MockComponentResource("network", "test-network")
  mock_network.return_value = mock_network_instance
  
  mock_monitoring_instance = MockComponentResource("monitoring", "test-monitoring")
  mock_monitoring.return_value = mock_monitoring_instance
  
  mock_data_protection_instance = MockComponentResource("data-protection", "test-data-protection")
  mock_data_protection.return_value = mock_data_protection_instance
  
  # Mock the AWS Provider
  mock_provider_instance = Mock()
  mock_provider.return_value = mock_provider_instance
  
  args = TapStackArgs(
    environment_suffix="test",
    regions=["us-west-2"],
    tags={"Project": "ProjectX", "Environment": "test"}
  )
  
  # Create the stack (this will trigger the setup_vpc_flow_logs call)
  stack = TapStack("test-stack", args)
  
  # Verify the VPC flow logs setup method was called
  mock_monitoring_instance.setup_vpc_flow_logs.assert_called_once()
  
  # Verify it was called with the correct VPC ID
  call_args = mock_monitoring_instance.setup_vpc_flow_logs.call_args
  assert call_args is not None
  assert 'vpc_id' in call_args.kwargs
  assert call_args.kwargs['vpc_id'] == mock_network_instance.vpc_id

@patch('lib.tap_stack.DataProtectionInfrastructure')
@patch('lib.tap_stack.SecurityMonitoringInfrastructure')
@patch('lib.tap_stack.NetworkSecurityInfrastructure')
@patch('lib.tap_stack.IdentityAccessInfrastructure')
@patch('pulumi_aws.Provider')
def test_tapstack_security_alarms(mock_provider, mock_identity, mock_network, mock_monitoring, mock_data_protection, mock_pulumi):
  # Create mock instances that inherit from ComponentResource
  mock_identity_instance = MockComponentResource("identity", "test-identity")
  mock_identity.return_value = mock_identity_instance
  
  mock_network_instance = MockComponentResource("network", "test-network")
  mock_network.return_value = mock_network_instance
  
  mock_monitoring_instance = MockComponentResource("monitoring", "test-monitoring")
  mock_monitoring.return_value = mock_monitoring_instance
  
  mock_data_protection_instance = MockComponentResource("data-protection", "test-data-protection")
  mock_data_protection.return_value = mock_data_protection_instance
  
  # Mock the AWS Provider
  mock_provider_instance = Mock()
  mock_provider.return_value = mock_provider_instance
  
  args = TapStackArgs(
    environment_suffix="test",
    regions=["us-west-2"],
    tags={"Project": "ProjectX", "Environment": "test"}
  )
  
  # Create the stack (this will trigger the setup_security_alarms call)
  stack = TapStack("test-stack", args)
  
  # Verify the security alarms setup method was called
  mock_monitoring_instance.setup_security_alarms.assert_called_once()
  
  # Verify it was called with the correct parameters
  call_args = mock_monitoring_instance.setup_security_alarms.call_args
  assert call_args is not None
  assert 'vpc_id' in call_args.kwargs
  assert 's3_bucket_names' in call_args.kwargs
  assert 'rds_instance_identifiers' in call_args.kwargs

@patch('lib.tap_stack.DataProtectionInfrastructure')
@patch('lib.tap_stack.SecurityMonitoringInfrastructure')
@patch('lib.tap_stack.NetworkSecurityInfrastructure')
@patch('lib.tap_stack.IdentityAccessInfrastructure')
@patch('pulumi_aws.Provider')
def test_tapstack_multi_region(mock_provider, mock_identity, mock_network, mock_monitoring, mock_data_protection, mock_pulumi):
  # Create mock instances that inherit from ComponentResource
  mock_identity_instance = MockComponentResource("identity", "test-identity")
  mock_identity.return_value = mock_identity_instance
  
  mock_network_instance = MockComponentResource("network", "test-network")
  mock_network.return_value = mock_network_instance
  
  mock_monitoring_instance = MockComponentResource("monitoring", "test-monitoring")
  mock_monitoring.return_value = mock_monitoring_instance
  
  mock_data_protection_instance = MockComponentResource("data-protection", "test-data-protection")
  mock_data_protection.return_value = mock_data_protection_instance
  
  # Mock the AWS Provider
  mock_provider_instance = Mock()
  mock_provider.return_value = mock_provider_instance
  
  # Test with multiple regions
  args = TapStackArgs(
    environment_suffix="test",
    regions=["us-west-2", "us-east-1"],
    tags={"Project": "ProjectX", "Environment": "test"}
  )
  
  stack = TapStack("test-stack", args)
  
  # Verify components were created for each region
  assert len(stack.regional_networks) == 2
  assert len(stack.regional_monitoring) == 2
  assert len(stack.regional_data_protection) == 2
  
  # Verify all regions are present
  assert "us-west-2" in stack.regional_networks
  assert "us-east-1" in stack.regional_networks
  
  # Verify providers were created for each region
  assert mock_provider.call_count >= 2

@patch('lib.tap_stack.DataProtectionInfrastructure')
@patch('lib.tap_stack.SecurityMonitoringInfrastructure')
@patch('lib.tap_stack.NetworkSecurityInfrastructure')
@patch('lib.tap_stack.IdentityAccessInfrastructure')
@patch('pulumi_aws.Provider')
def test_tapstack_args_defaults(mock_provider, mock_identity, mock_network, mock_monitoring, mock_data_protection, mock_pulumi):
  # Create mock instances
  mock_identity_instance = MockComponentResource("identity", "test-identity")
  mock_identity.return_value = mock_identity_instance
  
  mock_network_instance = MockComponentResource("network", "test-network")
  mock_network.return_value = mock_network_instance
  
  mock_monitoring_instance = MockComponentResource("monitoring", "test-monitoring")
  mock_monitoring.return_value = mock_monitoring_instance
  
  mock_data_protection_instance = MockComponentResource("data-protection", "test-data-protection")
  mock_data_protection.return_value = mock_data_protection_instance
  
  mock_provider.return_value = Mock()
  
  # Test with default arguments
  args = TapStackArgs()
  stack = TapStack("test-stack", args)
  
  # Verify defaults
  assert stack.environment_suffix == "dev"
  assert stack.regions == ["us-west-2", "us-east-1"]
  assert stack.tags["Project"] == "ProjectX"
  assert stack.tags["Security"] == "High"
  assert stack.tags["Environment"] == "dev"

@patch('lib.tap_stack.DataProtectionInfrastructure')
@patch('lib.tap_stack.SecurityMonitoringInfrastructure')
@patch('lib.tap_stack.NetworkSecurityInfrastructure')
@patch('lib.tap_stack.IdentityAccessInfrastructure')
@patch('pulumi_aws.Provider')
def test_tapstack_component_dependencies(mock_provider, mock_identity, mock_network, mock_monitoring, mock_data_protection, mock_pulumi):
  # Create mock instances
  mock_identity_instance = MockComponentResource("identity", "test-identity")
  mock_identity.return_value = mock_identity_instance
  
  mock_network_instance = MockComponentResource("network", "test-network")
  mock_network.return_value = mock_network_instance
  
  mock_monitoring_instance = MockComponentResource("monitoring", "test-monitoring")
  mock_monitoring.return_value = mock_monitoring_instance
  
  mock_data_protection_instance = MockComponentResource("data-protection", "test-data-protection")
  mock_data_protection.return_value = mock_data_protection_instance
  
  mock_provider.return_value = Mock()
  
  args = TapStackArgs(
    environment_suffix="test",
    regions=["us-west-2"],
    tags={"Project": "ProjectX", "Environment": "test"}
  )
  
  stack = TapStack("test-stack", args)
  
  # Verify identity component is created first (no dependencies check)
  mock_identity.assert_called_once()
  
  # Verify network component gets KMS key from identity
  network_call_args = mock_network.call_args
  assert 'kms_key_arn' in network_call_args.kwargs
  assert network_call_args.kwargs['kms_key_arn'] == mock_identity_instance.kms_key.arn
  
  # Verify monitoring component gets KMS key from identity
  monitoring_call_args = mock_monitoring.call_args
  assert 'kms_key_arn' in monitoring_call_args.kwargs
  assert monitoring_call_args.kwargs['kms_key_arn'] == mock_identity_instance.kms_key.arn
  
  # Verify data protection component gets multiple dependencies
  data_protection_call_args = mock_data_protection.call_args
  assert 'vpc_id' in data_protection_call_args.kwargs
  assert 'kms_key_arn' in data_protection_call_args.kwargs
  assert 'sns_topic_arn' in data_protection_call_args.kwargs
  assert 'rds_monitoring_role_arn' in data_protection_call_args.kwargs

@patch('lib.tap_stack.DataProtectionInfrastructure')
@patch('lib.tap_stack.SecurityMonitoringInfrastructure')
@patch('lib.tap_stack.NetworkSecurityInfrastructure')
@patch('lib.tap_stack.IdentityAccessInfrastructure')
@patch('pulumi_aws.Provider')
def test_tapstack_rds_instance_handling(mock_provider, mock_identity, mock_network, mock_monitoring, mock_data_protection, mock_pulumi):
  # Create mock instances with and without RDS instance
  mock_identity_instance = MockComponentResource("identity", "test-identity")
  mock_identity.return_value = mock_identity_instance
  
  mock_network_instance = MockComponentResource("network", "test-network")
  mock_network.return_value = mock_network_instance
  
  mock_monitoring_instance = MockComponentResource("monitoring", "test-monitoring")
  mock_monitoring.return_value = mock_monitoring_instance
  
  # Data protection instance without rds_instance attribute
  mock_data_protection_instance = MockComponentResource("data-protection", "test-data-protection")
  # Remove rds_instance to test hasattr check
  delattr(mock_data_protection_instance, 'rds_instance')
  mock_data_protection.return_value = mock_data_protection_instance
  
  mock_provider.return_value = Mock()
  
  args = TapStackArgs(
    environment_suffix="test",
    regions=["us-west-2"],
    tags={"Project": "ProjectX", "Environment": "test"}
  )
  
  # Create the stack - should handle missing rds_instance gracefully
  stack = TapStack("test-stack", args)
  
  # Verify security alarms was still called (with empty RDS list)
  mock_monitoring_instance.setup_security_alarms.assert_called_once()
  call_args = mock_monitoring_instance.setup_security_alarms.call_args
  rds_identifiers = call_args.kwargs['rds_instance_identifiers']
  assert rds_identifiers == []  # Should be empty list when no RDS instance

@patch('lib.tap_stack.DataProtectionInfrastructure')
@patch('lib.tap_stack.SecurityMonitoringInfrastructure')
@patch('lib.tap_stack.NetworkSecurityInfrastructure')
@patch('lib.tap_stack.IdentityAccessInfrastructure')
@patch('pulumi_aws.Provider')
def test_tapstack_resource_options(mock_provider, mock_identity, mock_network, mock_monitoring, mock_data_protection, mock_pulumi):
  # Create mock instances
  mock_identity_instance = MockComponentResource("identity", "test-identity")
  mock_identity.return_value = mock_identity_instance
  
  mock_network_instance = MockComponentResource("network", "test-network")
  mock_network.return_value = mock_network_instance
  
  mock_monitoring_instance = MockComponentResource("monitoring", "test-monitoring")
  mock_monitoring.return_value = mock_monitoring_instance
  
  mock_data_protection_instance = MockComponentResource("data-protection", "test-data-protection")
  mock_data_protection.return_value = mock_data_protection_instance
  
  mock_provider.return_value = Mock()
  
  args = TapStackArgs(
    environment_suffix="test",
    regions=["us-west-2"],
    tags={"Project": "ProjectX", "Environment": "test"}
  )
  
  stack = TapStack("test-stack", args)
  
  # Verify resource options are passed correctly
  # Check that components have proper parent and dependencies
  network_call_args = mock_network.call_args
  assert 'opts' in network_call_args.kwargs
  network_opts = network_call_args.kwargs['opts']
  assert hasattr(network_opts, 'parent')
  assert hasattr(network_opts, 'depends_on')
  assert hasattr(network_opts, 'provider')
  
  # Check monitoring component options
  monitoring_call_args = mock_monitoring.call_args
  assert 'opts' in monitoring_call_args.kwargs
  monitoring_opts = monitoring_call_args.kwargs['opts']
  assert hasattr(monitoring_opts, 'parent')
  assert hasattr(monitoring_opts, 'depends_on')
  assert hasattr(monitoring_opts, 'provider')
  
  # Check data protection component options
  data_protection_call_args = mock_data_protection.call_args
  assert 'opts' in data_protection_call_args.kwargs
  data_protection_opts = data_protection_call_args.kwargs['opts']
  assert hasattr(data_protection_opts, 'parent')
  assert hasattr(data_protection_opts, 'depends_on')
  assert hasattr(data_protection_opts, 'provider')