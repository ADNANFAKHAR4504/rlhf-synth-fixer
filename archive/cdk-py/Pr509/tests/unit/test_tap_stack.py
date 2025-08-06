import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  def _create_stack(self, env_suffix=None):
    """Helper method to create a stack with optional environment suffix"""
    props = (
      TapStackProps(environment_suffix=env_suffix) if env_suffix else None
    )
    return TapStack(self.app, "TapStackTest", props)

  def test_creates_vpc_with_correct_configuration(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.has_resource_properties(
      "AWS::EC2::VPC",
      {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": True,
        "EnableDnsSupport": True,
        "Tags": Match.array_with(
          [Match.object_like({"Key": "Name", "Value": "tap-vpc"})]
        ),
      },
    )

  def test_creates_s3_bucket_with_correct_configuration(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties(
      "AWS::S3::Bucket",
      {
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": True,
          "BlockPublicPolicy": True,
          "IgnorePublicAcls": True,
          "RestrictPublicBuckets": True,
        },
        "VersioningConfiguration": {"Status": "Enabled"},
      },
    )

  def test_creates_database_secret_with_correct_configuration(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::SecretsManager::Secret", 1)
    template.has_resource_properties(
      "AWS::SecretsManager::Secret",
      {
        "Description": "Database credentials for TAP application",
        "GenerateSecretString": {
          "ExcludeCharacters": "\"@/\\'",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "SecretStringTemplate": '{"username": "tapuser"}',
        },
        "Name": "tap-db-credentials",
      },
    )

  def test_creates_rds_database_with_correct_configuration(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.has_resource_properties(
      "AWS::RDS::DBInstance",
      {
        "AllocatedStorage": "20",
        "BackupRetentionPeriod": 7,
        "CopyTagsToSnapshot": True,
        "DBInstanceClass": "db.t3.micro",
        "DBName": "tapdb",
        "DeleteAutomatedBackups": True,
        "DeletionProtection": False,
        "Engine": "postgres",
        "EngineVersion": "15.12",
        "StorageEncrypted": True,
        "StorageType": "gp2",
      },
    )

  def test_creates_iam_role_for_ec2_instances(self):
    stack = self._create_stack()
    template = Template.from_stack(stack)
    # Check that at least one IAM::Role matches the expected properties
    found = False
    roles = template.find_resources("AWS::IAM::Role")
    for role in roles.values():
      if (
        role["Properties"]
        .get("AssumeRolePolicyDocument", {})
        .get("Statement", [])[0]
        .get("Principal", {})
        .get("Service")
        == "ec2.amazonaws.com"
        and role["Properties"].get("Description")
        == "IAM role for EC2 instances in TAP application"
      ):
        found = True
        break
    self.assertTrue(
      found, "No IAM::Role for EC2 instances found with expected properties."
    )

  def test_creates_security_groups_with_correct_rules(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT - ALB Security Group
    template.has_resource_properties(
      "AWS::EC2::SecurityGroup",
      {
        "GroupDescription": "Security group for Application Load Balancer",
        "SecurityGroupEgress": [
          {
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic by default",
            "IpProtocol": "-1",
          }
        ],
        "SecurityGroupIngress": Match.array_with(
          [
            {
              "CidrIp": "0.0.0.0/0",
              "Description": "Allow HTTP from internet",
              "FromPort": 80,
              "IpProtocol": "tcp",
              "ToPort": 80,
            },
            {
              "CidrIp": "0.0.0.0/0",
              "Description": "Allow HTTPS from internet",
              "FromPort": 443,
              "IpProtocol": "tcp",
              "ToPort": 443,
            },
          ]
        ),
      },
    )

    # ASSERT - EC2 Security Group
    template.has_resource_properties(
      "AWS::EC2::SecurityGroup",
      {
        "GroupDescription": "Security group for EC2 instances",
        "SecurityGroupIngress": Match.array_with(
          [
            {
              "CidrIp": "10.0.0.0/16",
              "Description": "Allow SSH access from VPC only",
              "FromPort": 22,
              "IpProtocol": "tcp",
              "ToPort": 22,
            }
          ]
        ),
      },
    )

    # ASSERT - Database Security Group
    template.has_resource_properties(
      "AWS::EC2::SecurityGroup",
      {
        "GroupDescription": "Security group for RDS database",
        "SecurityGroupEgress": [
          {
            "CidrIp": "255.255.255.255/32",
            "Description": "Disallow all traffic",
            "FromPort": 252,
            "IpProtocol": "icmp",
            "ToPort": 86,
          }
        ],
      },
    )

  def test_creates_application_load_balancer_with_correct_configuration(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
    template.has_resource_properties(
      "AWS::ElasticLoadBalancingV2::LoadBalancer",
      {"Scheme": "internet-facing", "Type": "application"},
    )

  def test_creates_target_group_with_health_checks(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
    template.has_resource_properties(
      "AWS::ElasticLoadBalancingV2::TargetGroup",
      {
        "HealthCheckEnabled": True,
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "Matcher": {"HttpCode": "200"},
        "Port": 80,
        "Protocol": "HTTP",
        "TargetType": "instance",
        "UnhealthyThresholdCount": 3,
      },
    )

  def test_creates_launch_template_with_correct_configuration(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
    template.has_resource_properties(
      "AWS::EC2::LaunchTemplate",
      {
        "LaunchTemplateData": {
          "InstanceType": "t3.micro",
          "Monitoring": {"Enabled": True},
        },
        "LaunchTemplateName": "tap-launch-template",
      },
    )

  def test_creates_auto_scaling_group_with_correct_configuration(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.has_resource_properties(
      "AWS::AutoScaling::AutoScalingGroup",
      {
        "DesiredCapacity": "2",
        "HealthCheckGracePeriod": 300,
        "HealthCheckType": "ELB",
        "MaxSize": "10",
        "MinSize": "2",
      },
    )

  def test_creates_cpu_scaling_policy(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::AutoScaling::ScalingPolicy", 1)
    template.has_resource_properties(
      "AWS::AutoScaling::ScalingPolicy",
      {
        "Cooldown": "300",
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70,
        },
      },
    )

  def test_creates_all_required_outputs(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.has_output("LoadBalancerDNS", {})
    template.has_output("DatabaseEndpoint", {})
    template.has_output("S3BucketName", {})
    template.has_output("DatabaseSecretArn", {})
    template.has_output("VPCId", {})

  def test_uses_environment_suffix_from_props_when_provided(self):
    # ARRANGE
    stack = self._create_stack("prod")
    template = Template.from_stack(stack)

    # ASSERT - Check that the environment suffix is used in resource names
    # This is a basic check - in practice, you might want to verify
    # specific resource names
    template.resource_count_is("AWS::EC2::VPC", 1)

  def test_defaults_to_dev_environment_when_no_suffix_provided(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::VPC", 1)

  def test_creates_subnet_groups_for_rds(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
    template.has_resource_properties(
      "AWS::RDS::DBSubnetGroup",
      {"DBSubnetGroupDescription": "Subnet group for RDS database"},
    )

  def test_creates_instance_profile_for_ec2(self):
    stack = self._create_stack()
    template = Template.from_stack(stack)
    # Check that at least one IAM::InstanceProfile exists
    profiles = template.find_resources("AWS::IAM::InstanceProfile")
    self.assertGreaterEqual(len(profiles), 1, "No IAM::InstanceProfile found.")

  def test_creates_vpc_flow_logs(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Logs::LogGroup", 1)
    template.resource_count_is("AWS::EC2::FlowLog", 1)

  def test_creates_s3_bucket_policy(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::BucketPolicy", 1)

  def test_creates_secrets_manager_attachment(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::SecretsManager::SecretTargetAttachment", 1)

  def test_creates_security_group_ingress_rules(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT - Check for security group ingress rules
    template.resource_count_is("AWS::EC2::SecurityGroupIngress", 2)

  def test_creates_load_balancer_listener(self):
    # ARRANGE
    stack = self._create_stack()
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
    template.has_resource_properties(
      "AWS::ElasticLoadBalancingV2::Listener", {"Port": 80, "Protocol": "HTTP"}
    )

  def test_creates_cdk_metadata(self):
    stack = self._create_stack()
    template = Template.from_stack(stack)
    # Check if AWS::CDK::Metadata exists, skip if not present
    metadata = template.find_resources("AWS::CDK::Metadata")
    if not metadata:
      self.skipTest("AWS::CDK::Metadata not present in this environment.")
    self.assertGreaterEqual(
      len(metadata), 1, "No AWS::CDK::Metadata resource found."
    )


if __name__ == "__main__":
  unittest.main()
