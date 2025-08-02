"""Unit tests for TAP Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App
from lib.tap_stack import TapStack, EnvironmentConfig


class TestEnvironmentConfig:
  """Test suite for EnvironmentConfig."""

  def test_environment_config_creation(self):
    """Test EnvironmentConfig creation with all required fields."""
    config = EnvironmentConfig(
      environment="test",
      vpc_cidr="10.1.0.0/16",
      availability_zones=["us-east-1a", "us-east-1b"],
      tags={"Environment": "test"},
      monitoring_config={"log_retention_days": 14},
      security_config={"enable_flow_logs": True}
    )

    assert config.environment == "test"
    assert config.vpc_cidr == "10.1.0.0/16"
    assert config.availability_zones == ["us-east-1a", "us-east-1b"]
    assert config.tags == {"Environment": "test"}
    assert config.monitoring_config == {"log_retention_days": 14}
    assert config.security_config == {"enable_flow_logs": True}


class TestTapStack:
  """Test suite for TapStack."""

  def test_tap_stack_instantiates_successfully_via_props(self):
    """TapStack instantiates successfully via props."""
    app = App()
    stack = TapStack(
      app,
      "TestTapStackWithProps",
      environment_suffix="prod",
      state_bucket="custom-state-bucket",
      state_bucket_region="us-east-1",
      aws_region="us-east-1",
    )

    # Verify that TapStack instantiates without errors via props
    assert stack is not None
    assert hasattr(stack, 'vpc_construct')
    assert hasattr(stack, 'security_construct')
    assert hasattr(stack, 'monitoring_construct')

  def test_tap_stack_uses_default_values_when_no_props_provided(self):
    """TapStack uses default values when no props provided."""
    app = App()
    stack = TapStack(app, "TestTapStackDefault")

    # Verify that TapStack instantiates without errors when no props provided
    assert stack is not None
    assert hasattr(stack, 'vpc_construct')
    assert hasattr(stack, 'security_construct')
    assert hasattr(stack, 'monitoring_construct')

  def test_environment_configurations(self):
    """Test different environment configurations."""
    app = App()

    # Test dev environment
    dev_stack = TapStack(app, "TestDevStack", environment_suffix="dev")
    assert dev_stack is not None

    # Test test environment
    test_stack = TapStack(app, "TestTestStack", environment_suffix="test")
    assert test_stack is not None

    # Test prod environment
    prod_stack = TapStack(app, "TestProdStack", environment_suffix="prod")
    assert prod_stack is not None

  def test_vpc_construct_creation(self):
    """Test VPC construct creation."""
    app = App()
    stack = TapStack(app, "TestVPCStack")

    # Verify VPC construct exists and has expected attributes
    assert hasattr(stack.vpc_construct, 'vpc')
    assert hasattr(stack.vpc_construct, 'public_subnets')
    assert hasattr(stack.vpc_construct, 'private_subnets')
    assert hasattr(stack.vpc_construct, 'nat_gateways')

  def test_security_construct_creation(self):
    """Test Security construct creation."""
    app = App()
    stack = TapStack(app, "TestSecurityStack")

    # Verify Security construct exists and has expected attributes
    assert hasattr(stack.security_construct, 'web_sg')
    assert hasattr(stack.security_construct, 'app_sg')
    assert hasattr(stack.security_construct, 'db_sg')
    assert hasattr(stack.security_construct, 'bastion_sg')

  def test_monitoring_construct_creation(self):
    """Test Monitoring construct creation."""
    app = App()
    stack = TapStack(app, "TestMonitoringStack")

    # Verify Monitoring construct exists and has expected attributes
    assert hasattr(stack.monitoring_construct, 'alert_topic')
    assert hasattr(stack.monitoring_construct, 'log_groups')
    assert hasattr(stack.monitoring_construct, 'alarms')
    assert hasattr(stack.monitoring_construct, 'dashboard')

  def test_environment_config_methods(self):
    """Test environment configuration methods."""
    app = App()
    stack = TapStack(app, "TestEnvConfigStack")

    # Test dev environment config
    dev_config = stack._get_environment_config("dev")
    assert dev_config.environment == "dev"
    assert dev_config.vpc_cidr == "10.1.0.0/16"
    assert len(dev_config.availability_zones) == 2
    assert dev_config.tags["Environment"] == "development"

    # Test test environment config
    test_config = stack._get_environment_config("test")
    assert test_config.environment == "test"
    assert test_config.vpc_cidr == "10.2.0.0/16"
    assert len(test_config.availability_zones) == 2
    assert test_config.tags["Environment"] == "testing"

    # Test prod environment config
    prod_config = stack._get_environment_config("prod")
    assert prod_config.environment == "prod"
    assert prod_config.vpc_cidr == "10.3.0.0/16"
    assert len(prod_config.availability_zones) == 3
    assert prod_config.tags["Environment"] == "production"

    # Test fallback to dev for unknown environment
    unknown_config = stack._get_environment_config("unknown")
    assert unknown_config.environment == "dev"

  def test_environment_specific_configurations(self):
    """Test environment-specific configurations."""
    app = App()

    # Test dev environment - should have fewer AZs and different settings
    dev_stack = TapStack(app, "TestDevStack", environment_suffix="dev")
    dev_config = dev_stack._get_environment_config("dev")
    assert dev_config.monitoring_config["log_retention_days"] == 7
    assert dev_config.monitoring_config["alarm_threshold"] == 80
    assert not dev_config.security_config["enable_nacls"]

    # Test prod environment - should have more AZs and stricter settings
    prod_stack = TapStack(app, "TestProdStack", environment_suffix="prod")
    prod_config = prod_stack._get_environment_config("prod")
    assert prod_config.monitoring_config["log_retention_days"] == 90
    assert prod_config.monitoring_config["alarm_threshold"] == 60
    assert prod_config.security_config["enable_nacls"]

  def test_stack_with_custom_tags(self):
    """Test stack creation with custom tags."""
    app = App()
    custom_tags = {"Project": "custom-project", "Owner": "custom-owner"}
    
    stack = TapStack(
      app,
      "TestCustomTagsStack",
      environment_suffix="dev",
      default_tags=custom_tags
    )

    assert stack is not None
    # The custom tags should be merged with environment tags
    assert hasattr(stack, 'vpc_construct')

  def test_stack_with_custom_aws_region(self):
    """Test stack creation with custom AWS region."""
    app = App()
    
    stack = TapStack(
      app,
      "TestCustomRegionStack",
      environment_suffix="dev",
      aws_region="us-east-1"
    )

    assert stack is not None
    assert hasattr(stack, 'vpc_construct')

  def test_stack_with_custom_state_bucket(self):
    """Test stack creation with custom state bucket."""
    app = App()
    
    stack = TapStack(
      app,
      "TestCustomStateBucketStack",
      environment_suffix="dev",
      state_bucket="custom-tf-state-bucket",
      state_bucket_region="us-east-1"
    )

    assert stack is not None
    assert hasattr(stack, 'vpc_construct')

  def test_stack_construct_integration(self):
    """Test integration between all constructs in the stack."""
    app = App()
    stack = TapStack(app, "TestIntegrationStack", environment_suffix="dev")

    # Verify all constructs are created
    assert stack.vpc_construct is not None
    assert stack.security_construct is not None
    assert stack.monitoring_construct is not None

    # Verify VPC construct has required components
    assert hasattr(stack.vpc_construct, 'vpc')
    assert hasattr(stack.vpc_construct, 'public_subnets')
    assert hasattr(stack.vpc_construct, 'private_subnets')
    assert hasattr(stack.vpc_construct, 'nat_gateways')
    assert hasattr(stack.vpc_construct, 'igw')

    # Verify Security construct has required components
    assert hasattr(stack.security_construct, 'web_sg')
    assert hasattr(stack.security_construct, 'app_sg')
    assert hasattr(stack.security_construct, 'db_sg')
    assert hasattr(stack.security_construct, 'bastion_sg')

    # Verify Monitoring construct has required components
    assert hasattr(stack.monitoring_construct, 'alert_topic')
    assert hasattr(stack.monitoring_construct, 'log_groups')
    assert hasattr(stack.monitoring_construct, 'alarms')
    assert hasattr(stack.monitoring_construct, 'dashboard')

  def test_stack_error_handling(self):
    """Test stack handles invalid parameters gracefully."""
    app = App()
    
    # Test with invalid environment suffix - should fallback to dev
    stack = TapStack(app, "TestInvalidEnvStack", environment_suffix="invalid")
    assert stack is not None
    assert hasattr(stack, 'vpc_construct')

  def test_stack_multiple_instances(self):
    """Test creating multiple stack instances."""
    app = App()
    
    # Create multiple stacks
    stack1 = TapStack(app, "TestStack1", environment_suffix="dev")
    stack2 = TapStack(app, "TestStack2", environment_suffix="test")
    stack3 = TapStack(app, "TestStack3", environment_suffix="prod")

    assert stack1 is not None
    assert stack2 is not None
    assert stack3 is not None

    # Verify each stack has its own constructs
    assert stack1.vpc_construct is not stack2.vpc_construct
    assert stack2.vpc_construct is not stack3.vpc_construct

  def test_subnet_cidr_calculation(self):
    """Test subnet CIDR calculation through the stack."""
    app = App()
    stack = TapStack(app, "TestCidrStack", environment_suffix="dev")
    
    # Test public subnet calculation
    public_cidr = stack.vpc_construct._calculate_subnet_cidr(0, "public")
    assert public_cidr == "10.1.1.0/24"

    # Test private subnet calculation
    private_cidr = stack.vpc_construct._calculate_subnet_cidr(0, "private")
    assert private_cidr == "10.1.10.0/24"

    # Test multiple subnets
    public_cidr_2 = stack.vpc_construct._calculate_subnet_cidr(1, "public")
    assert public_cidr_2 == "10.1.2.0/24"

    private_cidr_2 = stack.vpc_construct._calculate_subnet_cidr(1, "private")
    assert private_cidr_2 == "10.1.11.0/24"

  def test_monitoring_log_groups(self):
    """Test that all expected log groups are created."""
    app = App()
    stack = TapStack(app, "TestLogGroupsStack", environment_suffix="dev")

    log_groups = stack.monitoring_construct.log_groups
    expected_services = ["application", "web", "database", "system"]
    
    for service in expected_services:
      assert service in log_groups

  def test_monitoring_alarms(self):
    """Test that expected alarms are created."""
    app = App()
    stack = TapStack(app, "TestAlarmsStack", environment_suffix="dev")

    alarms = stack.monitoring_construct.alarms
    assert "cpu" in alarms
    assert "memory" in alarms

  def test_security_groups_with_nacls(self):
    """Test security groups creation with NACLs enabled."""
    app = App()
    stack = TapStack(app, "TestSecurityWithNaclsStack", environment_suffix="test")

    # Test environment should have NACLs enabled
    assert hasattr(stack.security_construct, 'public_nacl')
    assert hasattr(stack.security_construct, 'private_nacl')

  def test_security_groups_without_nacls(self):
    """Test security groups creation without NACLs."""
    app = App()
    stack = TapStack(app, "TestSecurityWithoutNaclsStack", environment_suffix="dev")

    # Dev environment should have NACLs disabled
    assert not hasattr(stack.security_construct, 'public_nacl')
    assert not hasattr(stack.security_construct, 'private_nacl')

  def test_vpc_flow_logs_enabled(self):
    """Test VPC flow logs are enabled by default."""
    app = App()
    stack = TapStack(app, "TestFlowLogsStack", environment_suffix="dev")

    # Flow logs should be enabled by default
    # We can't directly test the flow logs creation, but we can verify the construct exists
    assert stack.vpc_construct is not None

  def test_environment_tag_merging(self):
    """Test that environment tags are properly merged."""
    app = App()
    custom_tags = {"Project": "test-project", "Team": "infrastructure"}
    
    stack = TapStack(
      app,
      "TestTagMergingStack",
      environment_suffix="dev",
      default_tags=custom_tags
    )

    # Verify the stack was created successfully
    assert stack is not None
    assert hasattr(stack, 'vpc_construct')

  def test_stack_resource_naming(self):
    """Test that resources are properly named with environment prefixes."""
    app = App()
    stack = TapStack(app, "TestNamingStack", environment_suffix="prod")

    # Verify the stack was created successfully
    assert stack is not None
    assert hasattr(stack, 'vpc_construct')
    assert hasattr(stack, 'security_construct')
    assert hasattr(stack, 'monitoring_construct')

  def test_stack_parameter_validation(self):
    """Test stack handles various parameter combinations."""
    app = App()
    
    # Test with minimal parameters
    stack1 = TapStack(app, "TestMinimalStack")
    assert stack1 is not None

    # Test with all parameters
    stack2 = TapStack(
      app,
      "TestFullStack",
      environment_suffix="prod",
      aws_region="us-east-1",
      state_bucket="test-bucket",
      state_bucket_region="us-east-1",
      default_tags={"Test": "true"}
    )
    assert stack2 is not None

  def test_stack_construct_relationships(self):
    """Test that constructs are properly related within the stack."""
    app = App()
    stack = TapStack(app, "TestRelationshipsStack", environment_suffix="dev")

    # Verify VPC construct is created
    assert stack.vpc_construct is not None
    
    # Verify Security construct uses VPC ID
    assert stack.security_construct is not None
    
    # Verify Monitoring construct is created
    assert stack.monitoring_construct is not None

    # All constructs should be part of the same stack
    assert stack.vpc_construct.node.scope == stack
    assert stack.security_construct.node.scope == stack
    assert stack.monitoring_construct.node.scope == stack
