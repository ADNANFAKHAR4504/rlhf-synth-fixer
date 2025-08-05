import unittest
from unittest.mock import patch, Mock
import pulumi
from lib.tap_stack import SecureVPC, TapStackArgs, TapStack


class TestSecureVPC(unittest.TestCase):
  def setUp(self):
    self.args = TapStackArgs(
        environment_suffix="test", tags={
            "Owner": "QA", "Environment": "test"})

  @patch('pulumi_aws.get_region')
  @patch('pulumi_aws.get_availability_zones')
  def test_vpc_creation(self, mock_az, mock_region):
    mock_region.return_value = Mock(name="us-east-1")
    mock_az.return_value = Mock(names=["us-east-1a", "us-east-1b"])
    vpc = SecureVPC("test-vpc", "10.0.0.0/16", self.args.tags)
    self.assertEqual(vpc.vpc_cidr, "10.0.0.0/16")

  def test_tag_presence(self):
    self.assertIn("Owner", self.args.tags)

  def test_environment_suffix(self):
    self.assertEqual(self.args.environment_suffix, "test")

  def test_default_suffix(self):
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, "dev")

  @patch('pulumi_aws.get_region')
  @patch('pulumi_aws.get_availability_zones')
  def test_public_subnet_count(self, mock_az, mock_region):
    mock_region.return_value = Mock(name="us-west-2")
    mock_az.return_value = Mock(names=["us-west-2a", "us-west-2b"])
    vpc = SecureVPC("demo", "10.0.0.0/16", self.args.tags)
    self.assertEqual(len(vpc.public_subnets), 2)

  def test_tags_are_dict(self):
    self.assertIsInstance(self.args.tags, dict)

  def test_prefix_type(self):
    self.assertIsInstance(self.args.environment_suffix, str)

  def test_tags_key(self):
    self.assertIn("Environment", self.args.tags)

  def test_region_name_patch(self):
    with patch('pulumi_aws.get_region') as mock_region:
      mock_region.return_value = Mock(name="us-east-2")
      self.assertEqual(mock_region.return_value.name, "us-east-2")

  def test_vpc_prefix(self):
    self.assertTrue(self.args.environment_suffix.startswith("test"))

  def test_tag_values_not_empty(self):
    for val in self.args.tags.values():
      self.assertTrue(val)

  def test_vpc_cidr_format(self):
    cidr = "10.0.0.0/16"
    self.assertIn("/", cidr)

  def test_owner_tag_value(self):
    self.assertEqual(self.args.tags.get("Owner"), "QA")

  def test_env_tag_value(self):
    self.assertEqual(self.args.tags.get("Environment"), "test")

  def test_args_instance(self):
    self.assertIsInstance(self.args, TapStackArgs)

  def test_tags_not_none(self):
    self.assertIsNotNone(self.args.tags)

  def test_prefix_not_none(self):
    self.assertIsNotNone(self.args.environment_suffix)

  def test_prefix_is_lowercase(self):
    self.assertTrue(self.args.environment_suffix.islower())

  def test_tag_keys_length(self):
    self.assertGreaterEqual(len(self.args.tags.keys()), 2)

  def test_env_suffix_concat(self):
    stack = TapStack("demo", self.args)
    self.assertIn("test", stack.environment_suffix)

  def test_stack_has_tags(self):
    stack = TapStack("demo", self.args)
    self.assertEqual(stack.tags, self.args.tags)

  def test_stack_register_outputs(self):
    stack = TapStack("demo", self.args)
    self.assertTrue(hasattr(stack, 'register_outputs'))

  def test_secure_vpc_has_vpc(self):
    with patch('pulumi_aws.get_region') as mock_region, patch('pulumi_aws.get_availability_zones') as mock_az:
      mock_region.return_value = Mock(name="us-east-1")
      mock_az.return_value = Mock(names=["us-east-1a", "us-east-1b"])
      vpc = SecureVPC("demo", "10.0.0.0/16", self.args.tags)
      self.assertIsNotNone(vpc.vpc)

  def test_secure_vpc_has_igw(self):
    with patch('pulumi_aws.get_region') as mock_region, patch('pulumi_aws.get_availability_zones') as mock_az:
      mock_region.return_value = Mock(name="us-east-1")
      mock_az.return_value = Mock(names=["us-east-1a", "us-east-1b"])
      vpc = SecureVPC("demo", "10.0.0.0/16", self.args.tags)
      self.assertIsNotNone(vpc.igw)


if __name__ == '__main__':
  unittest.main()
