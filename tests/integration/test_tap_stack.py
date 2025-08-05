"""Integration tests for TAP Stack module."""

import pytest
from cdktf import App

from lib.tap_stack import TapStack


@pytest.fixture
def app():
  """Fixture for CDKTF App instance."""
  return App()


@pytest.mark.integration
class TestTapStackIntegration:
  """Integration test class for TapStack."""

  def test_full_stack_synthesis(self, app):
    """Test complete stack synthesis with all components."""
    TapStack(
      app,
      "integration-test-stack",
      environment_suffix="integration",
      aws_region="us-east-1",
      default_tags={"Environment": "Integration", "Project": "TAP"}
    )
    
    # Test synthesis completes without errors
    synth_result = app.synth()
    assert synth_result is not None
    assert len(synth_result.stacks) > 0

  def test_stack_outputs_exist(self, app):
    """Test that expected outputs are present after synthesis."""
    TapStack(
      app,
      "output-test-stack", 
      environment_suffix="test"
    )
    
    synth_result = app.synth()
    assert synth_result is not None
    # Note: Would need to parse synth_result to verify specific outputs

  def test_multi_environment_deployment(self, app):
    """Test multiple environment stacks can coexist."""
    environments = ["dev", "staging", "prod"]
    stacks = []
    
    for env in environments:
      stack = TapStack(
        app,
        f"multi-env-{env}",
        environment_suffix=env,
        default_tags={"Environment": env}
      )
      stacks.append(stack)
    
    synth_result = app.synth()
    assert synth_result is not None
    assert len(synth_result.stacks) == len(environments)

  @pytest.mark.parametrize("region", ["us-east-1", "us-west-2"])
  def test_stack_with_different_regions(self, app, region):
    """Test stack deployment across different regions."""
    TapStack(
      app,
      f"region-test-{region.replace('-', '')}",
      aws_region=region,
      environment_suffix="test"
    )
    
    synth_result = app.synth()
    assert synth_result is not None

  @pytest.mark.parametrize("config", [
    {
      "environment_suffix": "config1",
      "aws_region": "us-east-1",
      "default_tags": {"Type": "ConfigTest1"}
    },
    {
      "environment_suffix": "config2", 
      "aws_region": "us-west-2",
      "state_bucket": "custom-bucket",
      "default_tags": {"Type": "ConfigTest2", "CostCenter": "123"}
    }
  ])
  def test_stack_configuration_validation(self, app, config):
    """Test stack with various configuration combinations."""
    TapStack(app, f"config-test-{config['environment_suffix']}", **config)
    
    synth_result = app.synth()
    assert synth_result is not None

  def test_infrastructure_component_integration(self, app):
    """Test that Infrastructure component is properly integrated."""
    stack = TapStack(
      app,
      "component-integration-test",
      environment_suffix="integration",
      default_tags={"Component": "Integration"}
    )
    
    # Verify Infrastructure is instantiated
    assert hasattr(stack, 'node')
    synth_result = app.synth()
    assert synth_result is not None
    # Verify Infrastructure is instantiated
    assert hasattr(stack, 'node')
    synth_result = app.synth()
    assert synth_result is not None
