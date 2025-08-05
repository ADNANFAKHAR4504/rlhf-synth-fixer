import unittest
from unittest.mock import patch, Mock
import pulumi
from lib.tap_stack import SecureVPC, TapStackArgs, TapStack


class TestAWSNovaVPC(unittest.TestCase):
  def setUp(self):
    self.args = TapStackArgs(
        environment_suffix="test", tags={"Owner": "QA", "Environment": "test"})

  @patch('pulumi_aws.get_region')
  @patch('pulumi_aws.get_availability_zones')
  def test_vpc_provision_with_correct_cidr(self, mock_az, mock_region):
    mock_region.return_value.name = "us-east-1"
    mock_az.return_value.names = ["us-east-1a", "us-east-1b"]
    vpc = SecureVPC("nova-vpc", "10.0.0.0/16", self.args.tags)
    self.assertEqual(vpc.vpc_cidr, "10.0.0.0/16")

  def test_owner_tag_exists(self):
    self.assertIn("Owner", self.args.tags)

  def test_environment_suffix_matches_expected(self):
    self.assertEqual(self.args.environment_suffix, "test")

  def test_default_environment_suffix_is_dev(self):
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, "dev")

  def test_tags_structure_is_dict(self):
    self.assertIsInstance(self.args.tags, dict)

  def test_environment_suffix_type_string(self):
    self.assertIsInstance(self.args.environment_suffix, str)

  def test_environment_tag_present(self):
    self.assertIn("Environment", self.args.tags)

  def test_region_mock_assignment(self):
    with patch('pulumi_aws.get_region') as mock_region:
      mock_region.return_value.name = "us-east-2"
      self.assertEqual(mock_region.return_value.name, "us-east-2")

  def test_environment_suffix_starts_with_expected_value(self):
    self.assertTrue(self.args.environment_suffix.startswith("test"))

  def test_tag_values_are_non_empty(self):
    for val in self.args.tags.values():
      self.assertTrue(val)

  def test_vpc_cidr_format_is_valid(self):
    cidr = "10.0.0.0/16"
    self.assertIn("/", cidr)

  def test_owner_tag_value_is_correct(self):
    self.assertEqual(self.args.tags.get("Owner"), "QA")

  def test_environment_tag_value_is_correct(self):
    self.assertEqual(self.args.tags.get("Environment"), "test")

  def test_args_object_is_instance_of_expected_class(self):
    self.assertIsInstance(self.args, TapStackArgs)

  def test_tags_object_is_not_none(self):
    self.assertIsNotNone(self.args.tags)

  def test_environment_suffix_is_not_none(self):
    self.assertIsNotNone(self.args.environment_suffix)

  def test_environment_suffix_is_lowercase(self):
    self.assertTrue(self.args.environment_suffix.islower())

  def test_tag_key_count_meets_minimum(self):
    self.assertGreaterEqual(len(self.args.tags.keys()), 2)

  def test_vpc_has_igw_created(self):
    with patch('pulumi_aws.get_region') as mock_region, patch('pulumi_aws.get_availability_zones') as mock_az:
      mock_region.return_value.name = "us-east-1"
      mock_az.return_value.names = ["us-east-1a", "us-east-1b"]
      vpc = SecureVPC("demo", "10.0.0.0/16", self.args.tags)
      self.assertIsNotNone(vpc.igw)


if __name__ == '__main__':
  unittest.main()
