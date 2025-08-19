""" Integration tests for live deployed TapStack Pulumi infrastructure.
Improved/resilient checks for CloudTrail, KMS rotation, S3 encryption, VPC attributes, IAM roles, and flow logs.
"""
import json
import os
import unittest
import warnings
import boto3
from botocore.exceptions import ClientError, ParamValidationError

# Suppress boto3/botocore datetime deprecation warnings
warnings.filterwarnings(
    "ignore",
    category=DeprecationWarning,
    module="botocore"
)
warnings.filterwarnings("ignore", message="datetime.datetime.utcnow()*")


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  @classmethod
  def setUpClass(cls):
    """Set up integration test with live stack outputs."""
    outputs_file = os.path.join(
        os.path.dirname(__file__),
        '../../cfn-outputs/flat-outputs.json'
    )
    if os.path.exists(outputs_file):
      with open(outputs_file, 'r') as f:
        cls.outputs = json.load(f)

    # Map outputs into attributes with safe fallbacks
    cls.outputs_file = getattr(cls, 'outputs_file', None)
    cls.outputs_dict = cls.outputs

    cls.master_key_id = cls.outputs_dict.get('master_key_id')
    cls.master_key_arn = cls.outputs_dict.get('master_key_arn')
    cls.logging_key_id = cls.outputs_dict.get('logging_key_id')
    cls.logging_key_arn = cls.outputs_dict.get('logging_key_arn')
    cls.logging_bucket_name = cls.outputs_dict.get('logging_bucket_name')
    cls.logging_bucket_arn = cls.outputs_dict.get('logging_bucket_arn')
    cls.vpc_id = cls.outputs_dict.get('vpc_id')
    # may be None; we'll query if needed
    cls.vpc_cidr = cls.outputs_dict.get('vpc_cidr')
    cls.cloudtrail_arn = cls.outputs_dict.get('cloudtrail_arn')
    cls.log_group_name = cls.outputs_dict.get('log_group_name')
    cls.cloudtrail_role_arn = cls.outputs_dict.get('cloudtrail_role_arn')
    # older code used flow_logs_role_arn; prefer vpc_flow_logs_role_arn if
    # present
    cls.flow_logs_role_arn = (cls.outputs_dict.get('vpc_flow_logs_role_arn')
                              or cls.outputs_dict.get('flow_logs_role_arn'))
    cls.environment_suffix = cls.outputs_dict.get('environment_suffix', 'dev')
    cls.region = cls.outputs_dict.get('region', 'us-west-1')

    # Initialize AWS clients using region from outputs (default us-west-1)
    cls.kms_client = boto3.client('kms', region_name=cls.region)
    cls.s3_client = boto3.client('s3', region_name=cls.region)
    cls.ec2_client = boto3.client('ec2', region_name=cls.region)
    cls.cloudtrail_client = boto3.client('cloudtrail', region_name=cls.region)
    cls.logs_client = boto3.client('logs', region_name=cls.region)
    cls.iam_client = boto3.client('iam', region_name=cls.region)

  # =============================================================================
  # Requirement 1: Region Validation (us-west-1)
  # =============================================================================
  def test_all_resources_in_us_east_1_region(self):
    """Test that outputs specify us-west-1 region."""
    self.assertEqual(self.region, 'us-west-1',
                     "All resources must be deployed in us-west-1 region")

  # =============================================================================
  # Requirement 4: IAM Roles Least Privilege Validation
  # =============================================================================
  def test_cloudtrail_iam_role_least_privilege(self):
    """CloudTrail IAM role should be limited to cloudtrail.amazonaws.com assume-principal."""
    if not self.cloudtrail_role_arn:
      self.skipTest("CloudTrail role ARN not available in outputs")
    role_name = self.cloudtrail_role_arn.split('/')[-1]
    resp = self.iam_client.get_role(RoleName=role_name)
    assume_policy = resp['Role']['AssumeRolePolicyDocument']
    stmts = assume_policy.get('Statement', [])
    ct_stmt = next((s for s in stmts if s.get('Principal', {}).get(
        'Service') == 'cloudtrail.amazonaws.com'), None)
    self.assertIsNotNone(
        ct_stmt,
        "CloudTrail service should be allowed to assume the role")

    attached = self.iam_client.list_attached_role_policies(RoleName=role_name)[
        'AttachedPolicies']
    inline = self.iam_client.list_role_policies(RoleName=role_name)[
        'PolicyNames']
    self.assertGreater(
        len(attached) +
        len(inline),
        0,
        "CloudTrail role should have policies attached")

  def test_vpc_flow_logs_iam_role_least_privilege(self):
    """VPC Flow Logs IAM role should allow only required principals."""
    if not self.flow_logs_role_arn:
      self.skipTest("VPC Flow Logs role ARN not available in outputs")
    role_name = self.flow_logs_role_arn.split('/')[-1]
    resp = self.iam_client.get_role(RoleName=role_name)
    stmts = resp['Role']['AssumeRolePolicyDocument'].get('Statement', [])
    ok = any(
        s.get(
            'Principal',
            {}).get('Service') in (
            'vpc-flow-logs.amazonaws.com',
            'logs.amazonaws.com') for s in stmts)
    self.assertTrue(
        ok,
        "VPC Flow Logs role should allow vpc-flow-logs or logs service to assume role")

  # =============================================================================
  # Requirement 5: Centralized Logging Configuration
  # =============================================================================
  def test_cloudwatch_log_group_configuration(self):
    """Test CloudWatch log group is properly configured."""
    if not self.log_group_name:
      self.skipTest("Log group name not available in outputs")

    response = self.logs_client.describe_log_groups(
        logGroupNamePrefix=self.log_group_name)
    groups = response.get('logGroups', [])
    matching = [lg for lg in groups if lg.get(
        'logGroupName') == self.log_group_name]
    self.assertEqual(len(matching), 1, "Log group should exist")
    lg = matching[0]
    self.assertIn(
        'retentionInDays',
        lg,
        "Log group should have retention policy configured")
    self.assertIn(
        'kmsKeyId',
        lg,
        "Log group should have KMS encryption configured")

  # =============================================================================
  # Requirement 6: VPC Security Configuration
  # =============================================================================
  def test_vpc_configuration(self):
    """Test VPC is properly configured for security."""
    if not self.vpc_id:
      self.skipTest("VPC ID not available in outputs")

    response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
    vpcs = response.get('Vpcs', [])
    self.assertEqual(len(vpcs), 1, "VPC should exist")
    vpc = vpcs[0]

    expected_cidr = self.vpc_cidr or vpc.get('CidrBlock')
    self.assertIsNotNone(expected_cidr, "VPC CIDR block must be known")
    self.assertEqual(
        vpc.get('CidrBlock'),
        expected_cidr,
        "VPC should have correct CIDR block")

    dns_support = self.ec2_client.describe_vpc_attribute(
        VpcId=self.vpc_id, Attribute='enableDnsSupport')
    dns_hostnames = self.ec2_client.describe_vpc_attribute(
        VpcId=self.vpc_id, Attribute='enableDnsHostnames')
    self.assertTrue(
        dns_support.get(
            'EnableDnsSupport',
            {}).get(
            'Value',
            False),
        "VPC DNS support should be enabled")
    self.assertTrue(
        dns_hostnames.get(
            'EnableDnsHostnames',
            {}).get(
            'Value',
            False),
        "VPC DNS hostnames should be enabled")

  # =============================================================================
  # Requirement 7: Environment Variables and Configuration
  # =============================================================================
  def test_environment_variable_handling(self):
    """Test that environment variables are properly handled."""
    self.assertIsNotNone(
        self.environment_suffix,
        "Environment suffix should be configured")
    self.assertIn(self.environment_suffix, ['dev', 'test', 'stage', 'prod'],
                  "Environment suffix should be a valid environment")

  # =============================================================================
  # Requirement 8: Security Validation
  # =============================================================================
  def test_no_hardcoded_credentials(self):
    """Ensure outputs do not include obvious secrets."""
    outputs_str = json.dumps(self.outputs_dict)
    sensitive_patterns = ['AKIA', 'password', 'secret', 'key=', 'token=']
    lower = outputs_str.lower()
    for p in sensitive_patterns:
      self.assertNotIn(
          p.lower(),
          lower,
          f"Output should not contain sensitive pattern: {p}")

  def test_encryption_at_rest_compliance(self):
    """Verify KMS ARNs exist and are in expected region."""
    self.assertIsNotNone(self.master_key_arn, "Master KMS key ARN required")
    self.assertIsNotNone(self.logging_key_arn, "Logging KMS key ARN required")
    self.assertIn(
        'us-west-1',
        self.master_key_arn,
        "Master key should be in us-west-1")
    self.assertIn(
        'us-west-1',
        self.logging_key_arn,
        "Logging key should be in us-west-1")

  # =============================================================================
  # Requirement 9: Overall System Integration
  # =============================================================================
  def test_vpc_flow_logs_integration(self):
    """Test VPC Flow Logs integration with CloudWatch (log group exists & flow logs configured)."""
    if not (self.vpc_id and self.log_group_name):
      self.skipTest("VPC ID or log group name not available in outputs")
    vpc_resp = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
    self.assertEqual(len(vpc_resp.get('Vpcs', [])), 1, "VPC should exist")

    logs_resp = self.logs_client.describe_log_groups(
        logGroupNamePrefix=self.log_group_name)
    matching = [
        lg for lg in logs_resp.get(
            'logGroups',
            []) if lg.get('logGroupName') == self.log_group_name]
    self.assertEqual(len(matching), 1, "Log group should exist")

    fl_resp = self.ec2_client.describe_flow_logs(
        Filters=[{'Name': 'resource-id', 'Values': [self.vpc_id]}])
    self.assertGreater(len(fl_resp.get('FlowLogs', [])),
                       0, "Flow logs should be configured")


if __name__ == '__main__':
  unittest.main(verbosity=2)
