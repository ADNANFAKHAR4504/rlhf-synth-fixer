import os
import json
import unittest
import boto3
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for TapStack with mock AWS services"""

  @classmethod
  def setUpClass(cls):
    """Set up mock AWS credentials"""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

  def setUp(self):
    """Set up test fixtures"""
    self.app = cdk.App()
    self.env = cdk.Environment(account="123456789012", region="us-east-1")
    self.stack = TapStack(
        self.app,
        "IntegrationTestStack",
        TapStackProps(environment_suffix="integration"),
        env=self.env
    )

  def test_stack_synthesis_without_errors(self):
    """Test that the stack can be synthesized without errors"""
    try:
      template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
      self.assertIsInstance(template, dict)
      self.assertIn("Resources", template)
      self.assertIn("Outputs", template)
    except Exception as e:
      self.fail(f"Stack synthesis failed: {str(e)}")

  def test_template_resource_counts(self):
    """Test that the correct number of resources are generated"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Count specific resource types
    resource_counts = {}
    for resource in resources.values():
      resource_type = resource["Type"]
      resource_counts[resource_type] = resource_counts.get(
          resource_type, 0) + 1

    # Verify expected resource counts
    expected_counts = {
        "AWS::KMS::Key": 1,
        "AWS::KMS::Alias": 1,
        "AWS::EC2::VPC": 1,
        "AWS::EC2::Subnet": 4,  # 2 public + 2 private
        "AWS::EC2::InternetGateway": 1,
        "AWS::EC2::NatGateway": 2,
        "AWS::S3::Bucket": 2,   # data + logs
        "AWS::EC2::SecurityGroup": 1,
        "AWS::IAM::Role": 3,    # EC2 role + VPC flow log role + CloudTrail log role
        "AWS::IAM::Policy": 5,  # 3 EC2 policies + 1 VPC flow log policy
        # Main + launch template profile + additional profile
        "AWS::IAM::InstanceProfile": 3,
        "AWS::Logs::LogGroup": 4,  # app, system, vpc flow logs
        "AWS::CloudWatch::Dashboard": 1,
        "AWS::EC2::LaunchTemplate": 1,
        "AWS::EC2::Instance": 1,
        "AWS::EC2::FlowLog": 1
    }

    for resource_type, expected_count in expected_counts.items():
      actual_count = resource_counts.get(resource_type, 0)
      self.assertEqual(
          actual_count,
          expected_count,
          f"Expected {expected_count} {resource_type} resources, got {actual_count}")

  def test_template_outputs_exist(self):
    """Test that all expected outputs are present"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    outputs = template.get("Outputs", {})

    expected_outputs = [
        "VPCId",
        "KMSKeyId",
        "AppDataBucketOutput",
        "LogsBucketOutput",
        "InstanceId"
    ]

    for output_name in expected_outputs:
      self.assertIn(output_name, outputs, f"Missing output: {output_name}")
      self.assertIn("Value", outputs[output_name])
      self.assertIn("Description", outputs[output_name])

  def test_kms_key_properties(self):
    """Test KMS key configuration in template"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Find KMS key resource
    kms_keys = [r for r in resources.values() if r["Type"] == "AWS::KMS::Key"]
    self.assertEqual(len(kms_keys), 1)

    kms_key = kms_keys[0]
    properties = kms_key["Properties"]

    # Verify key properties
    self.assertTrue(properties["EnableKeyRotation"])
    self.assertEqual(
        properties["Description"],
        "KMS key for SecureApp encryption with automatic rotation"
    )
    self.assertIn("KeyPolicy", properties)

  def test_vpc_configuration(self):
    """Test VPC configuration in template"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Find VPC resource
    vpcs = [r for r in resources.values() if r["Type"] == "AWS::EC2::VPC"]
    self.assertEqual(len(vpcs), 1)

    vpc = vpcs[0]
    properties = vpc["Properties"]

    # Verify VPC properties
    self.assertEqual(properties["CidrBlock"], "10.0.0.0/16")
    self.assertTrue(properties["EnableDnsHostnames"])
    self.assertTrue(properties["EnableDnsSupport"])

  def test_s3_bucket_configuration(self):
    """Test S3 bucket configuration in template"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Find S3 bucket resources
    s3_buckets = [r for r in resources.values() if r["Type"] ==
                  "AWS::S3::Bucket"]
    self.assertEqual(len(s3_buckets), 2)

    for bucket in s3_buckets:
      properties = bucket["Properties"]

      # Verify encryption
      self.assertIn("BucketEncryption", properties)
      encryption_config = properties["BucketEncryption"]["ServerSideEncryptionConfiguration"][0]
      self.assertEqual(
          encryption_config["ServerSideEncryptionByDefault"]["SSEAlgorithm"],
          "aws:kms"
      )

      # Verify public access block
      pab = properties["PublicAccessBlockConfiguration"]
      self.assertTrue(pab["BlockPublicAcls"])
      self.assertTrue(pab["BlockPublicPolicy"])
      self.assertTrue(pab["IgnorePublicAcls"])
      self.assertTrue(pab["RestrictPublicBuckets"])

      # Verify versioning
      self.assertEqual(
          properties["VersioningConfiguration"]["Status"],
          "Enabled"
      )

      # Verify lifecycle configuration
      self.assertIn("LifecycleConfiguration", properties)

  def test_security_group_rules(self):
    """Test security group configuration in template"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Find security group resources (excluding default SG)
    security_groups = [
        r for r in resources.values()
        if r["Type"] == "AWS::EC2::SecurityGroup"
        and "GroupDescription" in r.get("Properties", {})
    ]

    self.assertGreater(len(security_groups), 0)

    for sg in security_groups:
      properties = sg["Properties"]

      # Check ingress rules
      if "SecurityGroupIngress" in properties:
        ingress_rules = properties["SecurityGroupIngress"]
        for rule in ingress_rules:
          # Verify SSH rule exists and is limited to VPC
          if rule.get("FromPort") == 22:
            self.assertEqual(rule["IpProtocol"], "tcp")
            self.assertEqual(rule["CidrIp"], "10.0.1.0/24")

      # Check egress rules
      if "SecurityGroupEgress" in properties:
        egress_rules = properties["SecurityGroupEgress"]
        # Should have HTTPS and HTTP outbound rules
        ports = [rule.get("FromPort") for rule in egress_rules]
        self.assertIn(443, ports)  # HTTPS
        self.assertIn(80, ports)   # HTTP

  def test_iam_role_policies(self):
    """Test IAM role and policy configuration"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Find IAM roles
    iam_roles = [r for r in resources.values() if r["Type"] ==
                 "AWS::IAM::Role"]
    ec2_roles = [
        r for r in iam_roles if "ec2.amazonaws.com" in str(
            r.get(
                "Properties",
                {}).get(
                "AssumeRolePolicyDocument",
                {}))]

    self.assertGreater(len(ec2_roles), 0)

    # Find IAM policies
    iam_policies = [r for r in resources.values() if r["Type"]
                    == "AWS::IAM::Policy"]
    self.assertGreater(len(iam_policies), 0)

    # Verify policies have proper structure
    for policy in iam_policies:
      properties = policy["Properties"]
      self.assertIn("PolicyDocument", properties)
      self.assertIn("Statement", properties["PolicyDocument"])

  def test_cloudwatch_resources(self):
    """Test CloudWatch resources configuration"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Find log groups
    log_groups = [r for r in resources.values() if r["Type"] ==
                  "AWS::Logs::LogGroup"]
    self.assertGreaterEqual(len(log_groups), 3)  # app, system, vpc flow logs

    # Find CloudWatch dashboard
    dashboards = [r for r in resources.values() if r["Type"] ==
                  "AWS::CloudWatch::Dashboard"]
    self.assertEqual(len(dashboards), 1)

    dashboard = dashboards[0]
    properties = dashboard["Properties"]
    self.assertEqual(properties["DashboardName"], "secureapp-monitoring")

  def test_ec2_instance_configuration(self):
    """Test EC2 instance and launch template configuration"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Find EC2 instances
    ec2_instances = [r for r in resources.values() if r["Type"]
                     == "AWS::EC2::Instance"]
    self.assertEqual(len(ec2_instances), 1)

    # Find launch templates
    launch_templates = [r for r in resources.values(
    ) if r["Type"] == "AWS::EC2::LaunchTemplate"]
    self.assertEqual(len(launch_templates), 1)

    launch_template = launch_templates[0]
    properties = launch_template["Properties"]
    lt_data = properties["LaunchTemplateData"]

    # Verify instance type
    self.assertEqual(lt_data["InstanceType"], "t3.micro")

    # Verify block device configuration
    self.assertIn("BlockDeviceMappings", lt_data)
    block_devices = lt_data["BlockDeviceMappings"]
    self.assertEqual(len(block_devices), 1)

    ebs_config = block_devices[0]["Ebs"]
    self.assertTrue(ebs_config["Encrypted"])
    self.assertEqual(ebs_config["VolumeSize"], 20)
    self.assertEqual(ebs_config["VolumeType"], "gp3")

  def test_tagging_consistency(self):
    """Test that resources have consistent tagging"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Check that tagged resources have expected tags
    tagged_resource_types = [
        "AWS::EC2::VPC",
        "AWS::KMS::Key",
        "AWS::S3::Bucket",
        "AWS::EC2::SecurityGroup"
    ]

    for resource in resources.values():
      if resource["Type"] in tagged_resource_types:
        properties = resource.get("Properties", {})
        if "Tags" in properties:
          tags = properties["Tags"]
          tag_keys = [tag["Key"] for tag in tags]

          # Should have common tags (Name is always present)
          # Environment tag is applied at app level and may not be visible in
          # individual resources
          self.assertIn("Name", tag_keys)

  def test_removal_policies_for_testing(self):
    """Test that resources have appropriate removal policies for testing"""
    template = self.app.synth().get_stack_by_name("IntegrationTestStack").template
    resources = template["Resources"]

    # Resources that should have Delete policy for testing
    deletable_types = ["AWS::S3::Bucket", "AWS::Logs::LogGroup"]

    for resource in resources.values():
      if resource["Type"] in deletable_types:
        # Should have Delete policy for clean test environment
        deletion_policy = resource.get("DeletionPolicy", "Delete")
        self.assertEqual(deletion_policy, "Delete")


if __name__ == '__main__':
  unittest.main()
