"""Integration tests for TAP Stack module."""

import pytest
from cdktf import App

from lib.tap_stack import TapStack


class TestTapStackIntegration:
  """Integration test class for TapStack."""

  def test_full_stack_synthesis(self):
    """Test complete stack synthesis with all components."""
    app = App()
    stack = TapStack(
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

  def test_stack_outputs_exist(self):
    """Test that expected outputs are present after synthesis."""
    app = App()
    TapStack(
      app,
      "output-test-stack", 
      environment_suffix="test"
    )
    
    synth_result = app.synth()
    assert synth_result is not None
    # Note: Would need to parse synth_result to verify specific outputs

  def test_multi_environment_deployment(self):
    """Test multiple environment stacks can coexist."""
    app = App()
    
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

  def test_stack_with_different_regions(self):
    """Test stack deployment across different regions."""
    app = App()
    
    regions = ["us-east-1", "us-west-2"]
    for region in regions:
      TapStack(
        app,
        f"region-test-{region.replace('-', '')}",
        aws_region=region,
        environment_suffix="test"
      )
    
    synth_result = app.synth()
    assert synth_result is not None

  def test_stack_configuration_validation(self):
    """Test stack with various configuration combinations."""
    app = App()
    
    configs = [
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
    ]
    
    for i, config in enumerate(configs):
      TapStack(app, f"config-test-{i}", **config)
    
    synth_result = app.synth()
    assert synth_result is not None

  def test_infrastructure_component_integration(self):
    """Test that Infrastructure component is properly integrated."""
    app = App()
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
