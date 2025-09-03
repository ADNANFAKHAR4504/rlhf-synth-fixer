"""Integration tests for TapStack."""
import json
from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
  """Turn Around Prompt API Integration Tests."""

  def test_terraform_configuration_synthesis(self):
    """Test that stack instantiates properly and has correct resource properties."""
    app = App()
    stack = TapStack(
      app,
      "IntegrationTestStack",
      environment_suffix="test",
      aws_region="us-east-1",
    )

    # Verify stack instantiates
    assert stack is not None

    # Test VPC configuration
    assert stack.vpc is not None
    assert stack.vpc_cidr == "10.0.0.0/16"

    # Test subnet configuration
    assert len(stack.public_subnets) == 2, "Should have 2 public subnets"
    assert len(stack.private_subnets) == 2, "Should have 2 private subnets"

    # Test Auto Scaling Group configuration
    assert stack.autoscaling_group is not None
    assert stack.min_size == 2
    assert stack.max_size == 4
    assert stack.desired_capacity == 2
    assert stack.instance_type == "t3.micro"

    # Test Load Balancer configuration
    assert stack.load_balancer is not None
    assert stack.target_group is not None
    assert stack.listener is not None

    # Test Security Groups
    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None

    # Test IAM configuration
    assert stack.instance_role is not None
    assert stack.instance_profile is not None

    # Test Launch Template
    assert stack.launch_template is not None

    # Test State Management Resources
    assert stack.state_bucket_resource is not None
    assert stack.state_lock_table is not None

    # Test Network Infrastructure
    assert stack.internet_gateway is not None
    assert stack.nat_gateway is not None
    assert stack.nat_eip is not None
    assert stack.public_route_table is not None
    assert stack.private_route_table is not None

    # Test synthesized Terraform configuration
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Verify VPC resource in synthesized config
    vpc_resources = [resource for resource in synthesized.get("resource", {}).get("aws_vpc", {}).values()]
    assert len(vpc_resources) == 1, "Should have exactly one VPC"
    vpc_config = vpc_resources[0]
    assert vpc_config["cidr_block"] == "10.0.0.0/16"
    assert vpc_config["enable_dns_hostnames"] is True
    assert vpc_config["enable_dns_support"] is True

    # Verify subnet resources
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})
    assert len(subnet_resources) == 4, "Should have 4 subnets (2 public + 2 private)"

    # Verify Auto Scaling Group resource
    asg_resources = synthesized.get("resource", {}).get("aws_autoscaling_group", {})
    assert len(asg_resources) == 1, "Should have exactly one Auto Scaling Group"
    asg_config = list(asg_resources.values())[0]
    assert asg_config["desired_capacity"] == 2
    assert asg_config["min_size"] == 2
    assert asg_config["max_size"] == 4

    # Verify Load Balancer resource
    lb_resources = synthesized.get("resource", {}).get("aws_lb", {})
    assert len(lb_resources) == 1, "Should have exactly one Load Balancer"
    lb_config = list(lb_resources.values())[0]
    assert lb_config["load_balancer_type"] == "application"
    assert lb_config["internal"] is False

    # Verify Security Group resources
    sg_resources = synthesized.get("resource", {}).get("aws_security_group", {})
    assert len(sg_resources) == 2, "Should have 2 security groups (LB + Instance)"

    # Verify Launch Template resource
    lt_resources = synthesized.get("resource", {}).get("aws_launch_template", {})
    assert len(lt_resources) == 1, "Should have exactly one Launch Template"
    lt_config = list(lt_resources.values())[0]
    assert lt_config["instance_type"] == "t3.micro"

    # Verify state management resources
    s3_resources = synthesized.get("resource", {}).get("aws_s3_bucket", {})
    assert len(s3_resources) == 1, "Should have exactly one S3 bucket for state"
    
    dynamodb_resources = synthesized.get("resource", {}).get("aws_dynamodb_table", {})
    assert len(dynamodb_resources) == 1, "Should have exactly one DynamoDB table for state locking"
    dynamodb_config = list(dynamodb_resources.values())[0]
    assert dynamodb_config["hash_key"] == "LockID"
    assert dynamodb_config["billing_mode"] == "PAY_PER_REQUEST"

