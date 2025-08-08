"""
Unit tests for the tap_stack Pulumi code using Pulumi's testing utilities.
"""

import pulumi
import pytest

# Import the code to be tested.
from lib import tap_stack as infra


# Define the mock class for Pulumi's testing framework
class MyMocks(pulumi.runtime.Mocks):
  """A mock for Pulumi's unit testing framework."""

  def new_resource(self, args: pulumi.runtime.MockResourceArgs):
    """Mocks the creation of a new resource."""
    outputs = args.inputs
    if args.typ == "aws:ec2/securityGroup:SecurityGroup":
      outputs["id"] = f"{args.name}_id"
    elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
      outputs["arn_suffix"] = f"app/{args.name}/123"
    elif args.typ == "aws:lb/targetGroup:TargetGroup":
      outputs["arn_suffix"] = f"targetgroup/{args.name}/456"
    elif args.typ == "aws:autoscaling/group:Group":
      outputs["name"] = args.name
    elif args.typ == "aws:autoscaling/policy:Policy":
      outputs["arn"] = "arn:aws:autoscaling:us-east-1:mock:scalingPolicy:mock-arn"
    elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
      pass  # This resource doesn't need specific mock outputs for the tests.
    return [args.name + "_id", outputs]

  def call(self, args: pulumi.runtime.MockCallArgs):
    """Mocks provider calls (e.g., aws.ec2.get_vpc)."""
    if args.token == "aws:ec2/getVpc:getVpc":
      return {"id": "vpc-12345"}
    if args.token == "aws:ec2/getSubnets:getSubnets":
      return {"ids": ["subnet-123", "subnet-456"]}
    if args.token == "aws:ec2/getAmi:getAmi":
      return {"id": "ami-12345678"}
    return {}


# Apply the mocks for all tests in this file
pulumi.runtime.set_mocks(MyMocks())

# This fixture runs the infrastructure code once for all tests.


@pytest.fixture(scope="module")
def infra_resources():
  """A pytest fixture that runs the infra code and returns the resources."""
  return infra.create_infrastructure()


def test_security_group_vpc_id(infra_resources):
  """Tests that all security groups are created in the correct VPC."""
  def check_vpc_id(vpc_id):
    assert vpc_id == "vpc-12345"

  infra_resources.alb_security_group.vpc_id.apply(check_vpc_id)
  infra_resources.ec2_security_group.vpc_id.apply(check_vpc_id)


def test_ec2_sg_ingress_source(infra_resources):
  """Tests that the EC2 security group only allows traffic from the ALB's group."""
  def check_ingress_source(sg_id):
    assert sg_id == "alb-security-group_id"

  infra_resources.ec2_security_group.ingress[0].security_groups[0].apply(
      check_ingress_source
  )


def test_asg_properties(infra_resources):
  """Tests that the Auto Scaling Group has the correct size properties."""
  @pulumi.runtime.test
  def check_properties(args):
    min_size, max_size, health_check_type = args
    assert min_size == 1
    assert max_size == 3
    assert health_check_type == "ELB"

  pulumi.Output.all(
      infra_resources.auto_scaling_group.min_size,
      infra_resources.auto_scaling_group.max_size,
      infra_resources.auto_scaling_group.health_check_type,
  ).apply(check_properties)


def test_launch_template_config(infra_resources):
  """Tests the launch template for correct instance type and AMI."""
  @pulumi.runtime.test
  def check_lt_props(args):
    instance_type, image_id = args
    assert instance_type == "t3.micro"
    assert image_id == "ami-12345678"

  pulumi.Output.all(
      infra_resources.launch_template.instance_type,
      infra_resources.launch_template.image_id,
  ).apply(check_lt_props)


def test_unhealthy_host_alarm_config(infra_resources):
  """Tests the Unhealthy Host alarm for correct metric, namespace, and threshold."""
  @pulumi.runtime.test
  def check_alarm_props(args):
    metric, namespace, threshold, op = args
    assert metric == "UnHealthyHostCount"
    assert namespace == "AWS/ApplicationELB"
    assert threshold == 1
    assert op == "GreaterThanOrEqualToThreshold"

  pulumi.Output.all(
      infra_resources.unhealthy_hosts_alarm.metric_name,
      infra_resources.unhealthy_hosts_alarm.namespace,
      infra_resources.unhealthy_hosts_alarm.threshold,
      infra_resources.unhealthy_hosts_alarm.comparison_operator,
  ).apply(check_alarm_props)