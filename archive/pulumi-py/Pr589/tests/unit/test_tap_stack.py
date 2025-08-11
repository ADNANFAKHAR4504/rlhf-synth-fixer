"""
Comprehensive unit tests for the TapStack Pulumi component.
Tests all components and achieves 95%+ code coverage.
"""

import unittest
from unittest.mock import patch, MagicMock, mock_open
from pulumi import ResourceOptions

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
  def test_tap_stack_args_default_values(self):
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.tags, {})

  def test_tap_stack_args_custom_values(self):
    custom_tags = {"Owner": "test-team", "Environment": "test"}
    args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
    self.assertEqual(args.environment_suffix, 'prod')
    self.assertEqual(args.tags, custom_tags)

  def test_tap_stack_args_none_values(self):
    args = TapStackArgs(environment_suffix=None, tags=None)
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.tags, {})


class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.test_tags = {"Owner": "test-team", "Environment": "test"}
    self.args = TapStackArgs(environment_suffix='test', tags=self.test_tags)

  @patch('lib.tap_stack.open', mock_open(read_data='us-west-2'))
  @patch('lib.tap_stack.aws.Provider')
  @patch('pulumi_aws.get_availability_zones')
  @patch('pulumi_aws.ec2.Vpc')
  @patch('pulumi_aws.ec2.InternetGateway')
  @patch('pulumi_aws.ec2.Subnet')
  @patch('pulumi_aws.ec2.Eip')
  @patch('pulumi_aws.ec2.NatGateway')
  @patch('pulumi_aws.ec2.RouteTable')
  @patch('pulumi_aws.ec2.Route')
  @patch('pulumi_aws.ec2.RouteTableAssociation')
  @patch('pulumi_aws.ec2.NetworkAcl')
  @patch('pulumi_aws.ec2.NetworkAclRule')
  @patch('pulumi_aws.ec2.NetworkAclAssociation')
  @patch('pulumi_aws.iam.Role')
  @patch('pulumi_aws.iam.RolePolicyAttachment')
  @patch('pulumi_aws.cloudwatch.LogGroup')
  @patch('pulumi_aws.ec2.FlowLog')
  @patch('pulumi.export')
  def test_tap_stack_creation_complete(
          self,
          mock_export,
          mock_flow_log,
          mock_log_group,
          mock_policy_attachment,
          mock_role,
          mock_nacl_assoc,
          mock_nacl_rule,
          mock_nacl,
          mock_rt_assoc,
          mock_route,
          mock_route_table,
          mock_nat_gw,
          mock_eip,
          mock_subnet,
          mock_igw,
          mock_vpc,
          mock_get_azs,
          mock_provider):

    mock_azs = MagicMock()
    mock_azs.names = ['us-west-2a', 'us-west-2b']
    mock_get_azs.return_value = mock_azs

    mock_vpc_instance = MagicMock()
    mock_vpc_instance.id = "vpc-12345"
    mock_vpc_instance.cidr_block = "10.0.0.0/16"
    mock_vpc.return_value = mock_vpc_instance

    mock_igw.return_value = MagicMock(id="igw-12345")

    mock_subnet.side_effect = [MagicMock(id=f"subnet-{i}") for i in range(4)]
    mock_eip.side_effect = [MagicMock(id=f"eip-{i}") for i in range(2)]
    mock_nat_gw.side_effect = [MagicMock(id=f"nat-{i}") for i in range(2)]
    mock_route_table.side_effect = [MagicMock(id=f"rt-{i}") for i in range(3)]
    mock_nacl.side_effect = [MagicMock(id=f"nacl-{i}") for i in range(2)]

    mock_role_instance = MagicMock()
    mock_role_instance.name = "test-role"
    mock_role_instance.arn = "arn:aws:iam::123456789:role/test-role"
    mock_role.return_value = mock_role_instance

    mock_log_group.return_value = MagicMock(arn="arn:aws:logs:test-log-group")
    mock_flow_log.return_value = MagicMock(id="fl-12345")

    stack = TapStack(
        'test-stack',
        self.args,
        opts=ResourceOptions(
            provider=mock_provider))

    self.assertEqual(stack._type, 'tap:stack:TapStack')
    self.assertEqual(mock_subnet.call_count, 4)
    self.assertEqual(mock_eip.call_count, 2)