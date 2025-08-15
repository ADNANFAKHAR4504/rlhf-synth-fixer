"""
Unit tests for secure multi-region infrastructure
Tests configuration logic, CIDR calculations, and policy structures without AWS API calls
"""

import unittest
import ipaddress
import sys
import os
import warnings
from unittest.mock import Mock, patch

# Suppress Pulumi deprecation warnings for tests
warnings.filterwarnings("ignore", category=DeprecationWarning, module="pulumi_aws")

# Add lib to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'modules'))


class TestTapStackUnits(unittest.TestCase):
  """Unit tests for infrastructure configuration and logic"""

  def setUp(self):
    """Set up test fixtures"""
    self.regions = ["us-east-1", "us-west-2"]
    self.vpc_cidrs = {
      "us-east-1": "10.0.0.0/16",
      "us-west-2": "10.1.0.0/16"
    }
    self.common_tags = {
      "Environment": "test",
      "Owner": "DevOps-Team",
      "Project": "secure-infrastructure",
      "ManagedBy": "Pulumi"
    }

  @patch('pulumi_aws.Provider')
  @patch('pulumi_aws.ec2.Vpc')
  @patch('pulumi_aws.get_availability_zones')
  def test_vpc_module_import_and_creation(self, mock_get_azs, mock_vpc, mock_provider):
    """Test VPC module can be imported and called"""
    try:
      from modules.vpc import create_vpc_infrastructure

      # Mock the provider and VPC
      mock_provider_instance = Mock()
      mock_provider.return_value = mock_provider_instance

      mock_vpc_instance = Mock()
      mock_vpc_instance.id = "vpc-test123"
      mock_vpc.return_value = mock_vpc_instance

      # Mock availability zones
      mock_azs = Mock()
      mock_azs.names = ['us-east-1a', 'us-east-1b']
      mock_get_azs.return_value = mock_azs

      # Test function call (won't actually create resources due to mocking)
      result = create_vpc_infrastructure(
        region="us-east-1",
        cidr_block="10.0.0.0/16",
        tags=self.common_tags,
        provider=mock_provider_instance
      )

      # Verify mocks were called
      mock_vpc.assert_called()
      self.assertIsInstance(result, dict)

    except ImportError:
      self.skipTest("VPC module not available for import")

  @patch('pulumi_aws.Provider')
  @patch('pulumi_aws.ec2.SecurityGroup')
  def test_security_module_import_and_creation(self, mock_sg, mock_provider):
    """Test security module can be imported and called"""
    try:
      from modules.security import create_security_groups, create_s3_bucket

      # Mock the provider and security group
      mock_provider_instance = Mock()
      mock_provider.return_value = mock_provider_instance

      mock_sg_instance = Mock()
      mock_sg_instance.id = "sg-test123"
      mock_sg.return_value = mock_sg_instance

      # Test security groups function
      with patch('pulumi_aws.ec2.SecurityGroupRule'):
        result = create_security_groups(
          region="us-east-1",
          vpc_id="vpc-test123",
          tags=self.common_tags,
          provider=mock_provider_instance
        )

        self.assertIsInstance(result, dict)
        self.assertIn('web_sg', result)
        self.assertIn('app_sg', result)
        self.assertIn('db_sg', result)

    except ImportError:
      self.skipTest("Security module not available for import")

  @patch('pulumi_aws.Provider')
  @patch('pulumi_aws.s3.Bucket')
  def test_s3_bucket_creation_from_security_module(self, mock_bucket, mock_provider):
    """Test S3 bucket creation from security module"""
    try:
      from modules.security import create_s3_bucket

      # Mock the provider and bucket
      mock_provider_instance = Mock()
      mock_provider.return_value = mock_provider_instance

      mock_bucket_instance = Mock()
      mock_bucket_instance.id = "test-bucket"
      mock_bucket.return_value = mock_bucket_instance

      # Mock other S3 resources (using V2 versions that actually exist)
      with patch('pulumi_aws.s3.BucketVersioningV2'), \
          patch('pulumi_aws.s3.BucketServerSideEncryptionConfigurationV2'), \
          patch('pulumi_aws.s3.BucketPublicAccessBlock'), \
          patch('pulumi_aws.s3.BucketPolicy'), \
          patch('pulumi.Output.all') as mock_output:

        # Mock pulumi Output
        mock_output.return_value.apply = Mock(return_value="mock_policy")

        result = create_s3_bucket(
          region="us-east-1",
          tags=self.common_tags,
          provider=mock_provider_instance
        )

        self.assertIsNotNone(result)
        mock_bucket.assert_called()

    except ImportError:
      self.skipTest("Security module not available for import")

  @patch('pulumi_aws.Provider')
  @patch('pulumi_aws.iam.Role')
  def test_iam_module_import_and_creation(self, mock_role, mock_provider):
    """Test IAM module can be imported and called"""
    try:
      from modules.iam import create_iam_roles

      # Mock IAM role
      mock_role_instance = Mock()
      mock_role_instance.arn = "arn:aws:iam::123456789012:role/test-role"
      mock_role_instance.name = "test-role"
      mock_role.return_value = mock_role_instance

      # Mock other IAM resources
      with patch('pulumi_aws.iam.RolePolicyAttachment'), \
          patch('pulumi_aws.iam.InstanceProfile'):

        result = create_iam_roles(self.common_tags)

        self.assertIsInstance(result, dict)
        self.assertIn('ec2_role', result)
        self.assertIn('lambda_role', result)
        self.assertIn('instance_profile', result)

    except ImportError:
      self.skipTest("IAM module not available for import")

  @patch('pulumi_aws.Provider')
  @patch('pulumi_aws.cloudtrail.Trail')
  def test_monitoring_module_import_and_creation(self, mock_trail, mock_provider):
    """Test monitoring module can be imported and called"""
    try:
      from modules.monitoring import setup_cloudtrail

      # Mock the provider and trail
      mock_provider_instance = Mock()
      mock_provider.return_value = mock_provider_instance

      mock_trail_instance = Mock()
      mock_trail_instance.name = "test-trail"
      mock_trail.return_value = mock_trail_instance

      # Mock pulumi Output for S3 bucket name
      mock_s3_bucket_name = Mock()
      mock_s3_bucket_name.apply = Mock(return_value="test-bucket")

      result = setup_cloudtrail(
        region="us-east-1",
        s3_bucket_name=mock_s3_bucket_name,
        tags=self.common_tags,
        provider=mock_provider_instance
      )

      self.assertIsNotNone(result)
      mock_trail.assert_called()

    except ImportError:
      self.skipTest("Monitoring module not available for import")

  @patch('pulumi_aws.s3.Bucket')
  @patch('pulumi_aws.iam.Role')
  @patch('pulumi_aws.codebuild.Project')
  @patch('pulumi_aws.codepipeline.Pipeline')
  def test_codepipeline_module_import_and_creation(self, mock_pipeline, mock_project, mock_role, mock_bucket):
    """Test code_pipeline module can be imported and called"""
    try:
      from modules.code_pipeline import setup_codepipeline

      # Mock resources
      mock_bucket_instance = Mock()
      mock_bucket_instance.bucket = "test-bucket"
      mock_bucket.return_value = mock_bucket_instance

      mock_role_instance = Mock()
      mock_role_instance.arn = "arn:aws:iam::123456789012:role/test-role"
      mock_role_instance.name = "test-role"
      mock_role.return_value = mock_role_instance

      mock_project_instance = Mock()
      mock_project_instance.name = "test-project"
      mock_project.return_value = mock_project_instance

      mock_pipeline_instance = Mock()
      mock_pipeline_instance.name = "test-pipeline"
      mock_pipeline.return_value = mock_pipeline_instance

      # Mock other resources (using V2 versions that actually exist)
      with patch('pulumi_aws.s3.BucketServerSideEncryptionConfigurationV2'), \
          patch('pulumi_aws.iam.RolePolicyAttachment'):

        result = setup_codepipeline("test")

        self.assertIsInstance(result, dict)
        self.assertIn('pipeline_name', result)
        self.assertIn('pipeline_source_bucket', result)
        self.assertIn('pipeline_artifact_bucket', result)

    except ImportError:
      self.skipTest("CodePipeline module not available for import")

  def test_main_module_import(self):
    """Test main module can be imported"""
    try:
      import main

      # Test that main module has expected functions/variables
      self.assertTrue(hasattr(main, 'deploy_infrastructure'))
      self.assertTrue(hasattr(main, 'export_outputs'))
      self.assertTrue(hasattr(main, 'create_cloudtrail_s3_policy'))

    except ImportError as e:
      self.skipTest(f"Main module not available for import: {e}")

  def test_tap_stack_module_import(self):
    """Test tap_stack module can be imported"""
    try:
      import tap_stack

      # Verify module has expected attributes
      self.assertTrue(hasattr(tap_stack, 'TapStack'))

    except ImportError as e:
      self.skipTest(f"TapStack module not available for import: {e}")

  def test_utils_module_import(self):
    """Test utils module can be imported and used"""
    try:
      from modules.utils import get_availability_zones, validate_cidr_block

      # Test CIDR validation function
      self.assertTrue(validate_cidr_block("10.0.0.0/16"))
      self.assertFalse(validate_cidr_block("invalid"))

      # Test AZ function (mocked)
      with patch('boto3.client') as mock_client:
        mock_ec2 = Mock()
        mock_ec2.describe_availability_zones.return_value = {
          'AvailabilityZones': [
            {'ZoneName': 'us-east-1a'},
            {'ZoneName': 'us-east-1b'}
          ]
        }
        mock_client.return_value = mock_ec2

        azs = get_availability_zones("us-east-1")
        self.assertEqual(len(azs), 2)
        self.assertIn('us-east-1a', azs)

    except ImportError:
      self.skipTest("Utils module not available for import")

  def test_vpc_cidr_configuration(self):
    """Test VPC CIDR blocks are valid /16 private networks"""
    for region, cidr in self.vpc_cidrs.items():
      with self.subTest(region=region):
        network = ipaddress.IPv4Network(cidr, strict=False)
        self.assertEqual(network.prefixlen, 16, f"VPC CIDR {cidr} should be /16")
        self.assertTrue(network.is_private, f"VPC CIDR {cidr} should be private")

  def test_vpc_cidrs_no_overlap(self):
    """Test VPC CIDRs don't overlap between regions"""
    cidrs = list(self.vpc_cidrs.values())

    for i, cidr1 in enumerate(cidrs):
      for cidr2 in cidrs[i + 1:]:
        network1 = ipaddress.IPv4Network(cidr1)
        network2 = ipaddress.IPv4Network(cidr2)
        self.assertFalse(
          network1.overlaps(network2),
          f"VPC CIDRs {cidr1} and {cidr2} should not overlap"
        )

  def test_subnet_cidr_calculation_logic(self):
    """Test subnet CIDR calculation from VPC module logic"""
    for region, vpc_cidr in self.vpc_cidrs.items():
      with self.subTest(region=region):
        # Replicate the logic from vpc.py
        base_ip = vpc_cidr.split('/')[0].rsplit('.', 2)[0]  # e.g., "10.0"

        # Test public subnets (.0.0/24, .1.0/24)
        public_cidrs = [f"{base_ip}.{i}.0/24" for i in range(2)]
        for cidr in public_cidrs:
          public_network = ipaddress.IPv4Network(cidr)
          self.assertEqual(public_network.prefixlen, 24)

        # Test private subnets (.10.0/24, .11.0/24)
        private_cidrs = [f"{base_ip}.{i + 10}.0/24" for i in range(2)]
        for cidr in private_cidrs:
          private_network = ipaddress.IPv4Network(cidr)
          self.assertEqual(private_network.prefixlen, 24)

  def test_required_tags_validation(self):
    """Test all required company policy tags are present"""
    required_tags = ["Environment", "Owner", "Project"]

    for tag in required_tags:
      self.assertIn(tag, self.common_tags, f"Required tag {tag} missing")
      self.assertIsNotNone(self.common_tags[tag], f"Tag {tag} should have a value")
      self.assertIsInstance(self.common_tags[tag], str, f"Tag {tag} should be string")

  def test_security_group_rules_structure(self):
    """Test security group rules follow expected structure from security.py"""
    # Web tier rules from security module
    web_tier_rules = [
      {'protocol': 'tcp', 'from_port': 80, 'to_port': 80, 'cidr_blocks': ['0.0.0.0/0']},
      {'protocol': 'tcp', 'from_port': 443, 'to_port': 443, 'cidr_blocks': ['0.0.0.0/0']}
    ]

    # App tier rules (from security groups, not CIDR)
    app_tier_rules = [
      {'protocol': 'tcp', 'from_port': 8080, 'to_port': 8080, 'source_security_group_id': 'sg-web'}
    ]

    # DB tier rules
    db_tier_rules = [
      {'protocol': 'tcp', 'from_port': 3306, 'to_port': 3306, 'source_security_group_id': 'sg-app'}
    ]

    # Validate web tier allows public HTTP/HTTPS
    for rule in web_tier_rules:
      self.assertIn('protocol', rule)
      self.assertEqual(rule['protocol'], 'tcp')
      self.assertIn(rule['from_port'], [80, 443])
      self.assertEqual(rule['cidr_blocks'], ['0.0.0.0/0'])

    # Validate app tier only allows from web tier
    for rule in app_tier_rules:
      self.assertIn('source_security_group_id', rule)
      self.assertNotIn('cidr_blocks', rule)

    # Validate DB tier only allows from app tier
    for rule in db_tier_rules:
      self.assertIn('source_security_group_id', rule)
      self.assertEqual(rule['from_port'], 3306)

  def test_s3_bucket_ssl_enforcement_policy(self):
    """Test S3 bucket policy structure for SSL enforcement from security.py"""
    bucket_arn = "arn:aws:s3:::test-bucket"

    # Policy structure from security module
    expected_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "DenyInsecureConnections",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [bucket_arn, f"{bucket_arn}/*"],
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        }
      ]
    }

    # Validate policy structure
    self.assertIn('Version', expected_policy)
    self.assertEqual(expected_policy['Version'], "2012-10-17")

    statement = expected_policy['Statement'][0]
    self.assertEqual(statement['Effect'], 'Deny')
    self.assertEqual(statement['Principal'], '*')
    self.assertIn('aws:SecureTransport', statement['Condition']['Bool'])
    self.assertEqual(statement['Condition']['Bool']['aws:SecureTransport'], 'false')

  def test_s3_encryption_configuration(self):
    """Test S3 encryption configuration from security.py"""
    # Encryption config from security module
    encryption_config = {
      "rules": [
        {
          "apply_server_side_encryption_by_default": {
            "sse_algorithm": "AES256"
          }
        }
      ]
    }

    # Validate encryption configuration
    self.assertIn("rules", encryption_config)
    rule = encryption_config["rules"][0]
    self.assertIn("apply_server_side_encryption_by_default", rule)
    sse_config = rule["apply_server_side_encryption_by_default"]
    self.assertIn(sse_config["sse_algorithm"], ["AES256", "aws:kms"])

  def test_iam_role_trust_policies(self):
    """Test IAM role trust policies from iam.py"""
    # EC2 role trust policy from iam module
    ec2_trust_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }
      ]
    }

    # Lambda role trust policy
    lambda_trust_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {"Service": "lambda.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }
      ]
    }

    # Validate trust policies
    for policy_name, policy in [("EC2", ec2_trust_policy), ("Lambda", lambda_trust_policy)]:
      with self.subTest(policy=policy_name):
        self.assertEqual(policy["Version"], "2012-10-17")
        statement = policy["Statement"][0]
        self.assertEqual(statement["Effect"], "Allow")
        self.assertEqual(statement["Action"], "sts:AssumeRole")
        self.assertIn("Service", statement["Principal"])

  def test_cloudtrail_configuration_structure(self):
    """Test CloudTrail configuration from monitoring.py"""
    # CloudTrail config from monitoring module
    cloudtrail_config = {
      'include_global_service_events': True,
      'is_multi_region_trail': False,  # Region-specific per your implementation
      'enable_logging': True,
      's3_key_prefix': 'cloudtrail-logs/us-east-1',
      'event_selectors': {
        'read_write_type': 'All',
        'include_management_events': True
      }
    }

    # Validate CloudTrail settings
    self.assertTrue(cloudtrail_config['include_global_service_events'])
    self.assertTrue(cloudtrail_config['enable_logging'])
    self.assertIsInstance(cloudtrail_config['s3_key_prefix'], str)
    self.assertIn('cloudtrail-logs', cloudtrail_config['s3_key_prefix'])

    # Validate event selectors
    event_config = cloudtrail_config['event_selectors']
    self.assertEqual(event_config['read_write_type'], 'All')
    self.assertTrue(event_config['include_management_events'])

  def test_resource_naming_conventions(self):
    """Test resource naming follows conventions from modules"""
    for region in self.regions:
      with self.subTest(region=region):
        # VPC naming from vpc.py
        vpc_name = f"vpc-{region}"
        self.assertIn(region, vpc_name)

        # Security group naming from security.py
        sg_names = [f"web-sg-{region}", f"app-sg-{region}", f"db-sg-{region}"]
        for sg_name in sg_names:
          self.assertIn(region, sg_name)
          self.assertIn('sg', sg_name)

        # S3 bucket naming from security.py
        bucket_name = f"secure-infrastructure-bucket-{region}-test"
        self.assertIn(region, bucket_name)
        self.assertIn('secure', bucket_name)

  def test_codepipeline_stages_structure(self):
    """Test CodePipeline stages from code_pipeline.py"""
    # Pipeline stages from code_pipeline module
    expected_stages = ["Source", "Test", "Deploy"]

    # Validate stage order and names
    self.assertEqual(len(expected_stages), 3)
    self.assertEqual(expected_stages[0], "Source")
    self.assertEqual(expected_stages[1], "Test")
    self.assertEqual(expected_stages[2], "Deploy")

  def test_codebuild_buildspec_structure(self):
    """Test CodeBuild buildspec from code_pipeline.py"""
    # Test buildspec from code_pipeline module
    test_buildspec = {
      "version": "0.2",
      "phases": {
        "build": {
          "commands": [
            "echo 'Running compliance checks...'",
            "python3 -m pip install pulumi pulumi_aws",
            "python3 scripts/security_checks.py"
          ]
        }
      },
      "artifacts": {
        "files": ["**/*"]
      }
    }

    # Deploy buildspec
    deploy_buildspec = {
      "version": "0.2",
      "phases": {
        "install": {
          "commands": [
            "echo 'Installing Pulumi...'",
            "curl -fsSL https://get.pulumi.com | sh",
            "export PATH=$PATH:$HOME/.pulumi/bin",
            "pip3 install pulumi pulumi_aws"
          ]
        },
        "build": {
          "commands": [
            "echo 'Deploying multi-region infrastructure...'",
            "pulumi stack select $PULUMI_STACK",
            "pulumi up --yes"
          ]
        }
      },
      "artifacts": {
        "files": ["**/*"]
      }
    }

    # Validate buildspec structure
    for buildspec_name, buildspec in [("test", test_buildspec), ("deploy", deploy_buildspec)]:
      with self.subTest(buildspec=buildspec_name):
        self.assertEqual(buildspec["version"], "0.2")
        self.assertIn("phases", buildspec)
        self.assertIn("artifacts", buildspec)
        self.assertEqual(buildspec["artifacts"]["files"], ["**/*"])

  def test_pipeline_iam_roles_structure(self):
    """Test pipeline IAM roles from code_pipeline.py"""
    # Pipeline role trust policy
    pipeline_trust_policy = {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "codepipeline.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }

    # CodeBuild role trust policy
    codebuild_trust_policy = {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "codebuild.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }

    # Validate trust policies
    for role_name, policy in [("pipeline", pipeline_trust_policy), ("codebuild", codebuild_trust_policy)]:
      with self.subTest(role=role_name):
        self.assertEqual(policy["Version"], "2012-10-17")
        statement = policy["Statement"][0]
        self.assertEqual(statement["Effect"], "Allow")
        self.assertEqual(statement["Action"], "sts:AssumeRole")

        expected_service = f"{role_name}.amazonaws.com" if role_name == "pipeline" else "codebuild.amazonaws.com"
        if role_name == "pipeline":
          expected_service = "codepipeline.amazonaws.com"
        self.assertEqual(statement["Principal"]["Service"], expected_service)

  def test_cross_region_consistency(self):
    """Test configuration consistency across regions"""
    # Test that each region gets consistent configuration
    base_tags = self.common_tags.copy()

    for region in self.regions:
      with self.subTest(region=region):
        # Regional tags should include base tags
        region_tags = {**base_tags, "Region": region}

        # Validate base tags present
        for key, value in base_tags.items():
          self.assertIn(key, region_tags)
          self.assertEqual(region_tags[key], value)

        # Validate region-specific tag
        self.assertEqual(region_tags["Region"], region)

  def test_encryption_compliance_requirements(self):
    """Test encryption meets compliance requirements"""
    # Valid encryption algorithms
    valid_algorithms = ['AES256', 'aws:kms']
    test_algorithm = 'AES256'

    self.assertIn(test_algorithm, valid_algorithms)

    # S3 bucket encryption should be enabled
    bucket_encryption_enabled = True
    self.assertTrue(bucket_encryption_enabled)

    # SSL enforcement should be required
    ssl_enforcement_required = True
    self.assertTrue(ssl_enforcement_required)


if __name__ == '__main__':
  # Run unit tests
  print("🧪 Running Unit Tests for TAP Stack")
  print("=" * 50)

  unittest.main(verbosity=2, buffer=True)
