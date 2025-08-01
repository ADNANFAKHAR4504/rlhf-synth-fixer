"""
Unit tests for TapStack CDK stack
Tests resource definitions and properties without deployment
"""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Unit Tests")
class TestTapStackUnit(unittest.TestCase):
  """Unit tests for TapStack resource definitions"""
  
  def setUp(self):
    """Set up a fresh CDK app and stack for each test"""
    self.app = cdk.App()
    self.stack = TapStack(self.app, "test-stack")
    self.template = Template.from_stack(self.stack)
  
  @mark.it("creates VPC with correct subnet configuration")
  def test_vpc_configuration(self):
    """Test VPC has proper subnet configuration"""
    # Test VPC exists
    self.template.resource_count_is("AWS::EC2::VPC", 1)
    
    # Test that we have both public and private subnets (2 AZs × 2 subnet types)
    self.template.resource_count_is("AWS::EC2::Subnet", 4)
    
    # Test NAT Gateway exists
    self.template.resource_count_is("AWS::EC2::NatGateway", 1)
    
    # Test Internet Gateway exists
    self.template.resource_count_is("AWS::EC2::InternetGateway", 1)
  
  @mark.it("creates S3 bucket with security configurations")
  def test_s3_bucket_security_configuration(self):
    """Test S3 bucket has correct security configurations"""
    # Assert S3 bucket exists with versioning enabled
    self.template.has_resource_properties("AWS::S3::Bucket", {
      "VersioningConfiguration": {
        "Status": "Enabled"
      },
      "BucketEncryption": {
        "ServerSideEncryptionConfiguration": [
          {
            "ServerSideEncryptionByDefault": {
              "SSEAlgorithm": "AES256"
            }
          }
        ]
    },
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": True,
        "BlockPublicPolicy": True,
        "IgnorePublicAcls": True,
        "RestrictPublicBuckets": True
      }
    })
    
    # Test bucket has lifecycle configuration
    self.template.has_resource_properties("AWS::S3::Bucket", {
      "LifecycleConfiguration": {
        "Rules": [
          {
            "Id": "DeleteIncompleteMultipartUploads",
            "Status": "Enabled",
            "AbortIncompleteMultipartUpload": {
              "DaysAfterInitiation": 7
            }
          }
        ]
      }
    })
  
  @mark.it("creates S3 bucket policy allowing CloudFront access only")
  def test_s3_bucket_policy_cloudfront_only(self):
    """Test S3 bucket policy allows access only from CloudFront"""
    # Find bucket policy that restricts access to CloudFront
    bucket_policies = self.template.find_resources("AWS::S3::BucketPolicy")
    
    # Should have at least one bucket policy
    self.assertGreaterEqual(len(bucket_policies), 1)
    
    # Look for the CloudFront-specific policy
    found_cloudfront_policy = False
    for policy_id, policy in bucket_policies.items():
      policy_doc = policy["Properties"]["PolicyDocument"]
      for statement in policy_doc["Statement"]:
        if statement.get("Sid") == "AllowCloudFrontServicePrincipal":
          found_cloudfront_policy = True
          self.assertEqual(statement["Effect"], "Allow")
          self.assertEqual(statement["Principal"]["Service"], "cloudfront.amazonaws.com")
          self.assertEqual(statement["Action"], "s3:GetObject")
          self.assertIn("AWS:SourceArn", statement["Condition"]["StringEquals"])
          break
    
    self.assertTrue(found_cloudfront_policy, "CloudFront access policy not found")
  
  @mark.it("creates RDS instance with security configurations")
  def test_rds_security_configuration(self):
    """Test RDS instance has proper security settings"""
    # Test RDS instance configuration
    self.template.has_resource_properties("AWS::RDS::DBInstance", {
      "DeletionProtection": True,
      "MultiAZ": True,
      "StorageEncrypted": True,
      "BackupRetentionPeriod": 7,
      "Engine": "postgres",
      "EngineVersion": "15.12"
    })
      
    # Test database name
    self.template.has_resource_properties("AWS::RDS::DBInstance", {
      "DBName": "ecommerce"
    })
  
  @mark.it("creates RDS subnet group with private subnets only")
  def test_rds_subnet_group_private_only(self):
    """Test RDS subnet group uses only private subnets"""
    # Test that DB subnet group exists
    self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
    
    self.template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
      "DBSubnetGroupDescription": "Subnet group for e-commerce database"
    })
    
    # Get subnet group and verify it references private subnets
    subnet_groups = self.template.find_resources("AWS::RDS::DBSubnetGroup")
    self.assertEqual(len(subnet_groups), 1)
    
    subnet_group = list(subnet_groups.values())[0]
    subnet_refs = subnet_group["Properties"]["SubnetIds"]
    
    # Should have 2 subnet references (for 2 AZs)
    self.assertEqual(len(subnet_refs), 2)
  
  @mark.it("creates RDS security group with proper restrictions")
  def test_rds_security_group_restrictions(self):
    """Test RDS security group allows only internal access"""
    # Find RDS security group
    security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
    
    db_sg = None
    for sg_id, sg in security_groups.items():
      if "database" in sg["Properties"]["GroupDescription"].lower():
        db_sg = sg
        break
    
    self.assertIsNotNone(db_sg, "Database security group not found")
    
    # DB security group should have minimal outbound rules
    egress_rules = db_sg["Properties"].get("SecurityGroupEgress", [])
    # Should have only the "disallow all" rule
    self.assertEqual(len(egress_rules), 1)
    self.assertEqual(egress_rules[0]["CidrIp"], "255.255.255.255/32")
    
    # Test that ingress rule exists from app security group
    self.template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
      "IpProtocol": "tcp",
      "FromPort": 5432,
      "ToPort": 5432,
      "Description": "Allow PostgreSQL access from application services"
    })
  
  @mark.it("creates IAM RDS access role with least privilege")
  def test_iam_rds_role_least_privilege(self):
    """Test RDS access role has minimal required permissions"""
    # Test role creation
    roles = self.template.find_resources("AWS::IAM::Role")
    
    rds_role = None
    for role_id, role in roles.items():
      description = role["Properties"].get("Description", "")
      if "RDS" in description:
        rds_role = role
        break
    
    self.assertIsNotNone(rds_role, "RDS access role not found")
    
    # Verify role can be assumed by Lambda
    assume_policy = rds_role["Properties"]["AssumeRolePolicyDocument"]
    lambda_principal = False
    for statement in assume_policy["Statement"]:
      if (statement.get("Principal", {}).get("Service") == "lambda.amazonaws.com" and
        statement.get("Action") == "sts:AssumeRole"):
        lambda_principal = True
        break
    self.assertTrue(lambda_principal, "Role should be assumable by Lambda")
    
    # Test inline policy for RDS access
    policies = self.template.find_resources("AWS::IAM::Policy")
    rds_policy = None
    for policy_id, policy in policies.items():
      policy_doc = policy["Properties"]["PolicyDocument"]
      for statement in policy_doc["Statement"]:
        if "rds-db:connect" in statement.get("Action", []):
          rds_policy = policy
          break
      if rds_policy:
        break
    
    self.assertIsNotNone(rds_policy, "RDS access policy not found")
  
  @mark.it("creates IAM S3 access role with least privilege")
  def test_iam_s3_role_least_privilege(self):
    """Test S3 access role has minimal required permissions"""
    # Test role creation
    roles = self.template.find_resources("AWS::IAM::Role")
    
    s3_role = None
    for role_id, role in roles.items():
      description = role["Properties"].get("Description", "")
      if "S3" in description:
        s3_role = role
        break
    
    self.assertIsNotNone(s3_role, "S3 access role not found")
    
    # Verify role can be assumed by Lambda
    assume_policy = s3_role["Properties"]["AssumeRolePolicyDocument"]
    lambda_principal = False
    for statement in assume_policy["Statement"]:
      if (statement.get("Principal", {}).get("Service") == "lambda.amazonaws.com" and
        statement.get("Action") == "sts:AssumeRole"):
        lambda_principal = True
        break
    self.assertTrue(lambda_principal, "Role should be assumable by Lambda")
    
    # Test inline policy for S3 access
    policies = self.template.find_resources("AWS::IAM::Policy")
    s3_policy = None
    for policy_id, policy in policies.items():
      policy_doc = policy["Properties"]["PolicyDocument"]
      for statement in policy_doc["Statement"]:
        actions = statement.get("Action", [])
        if isinstance(actions, list) and any("s3:" in action for action in actions):
          s3_policy = policy
          break
      if s3_policy:
        break
    
    self.assertIsNotNone(s3_policy, "S3 access policy not found")
    
    # Verify policy has correct S3 actions
    s3_policy_doc = s3_policy["Properties"]["PolicyDocument"]
    found_get_put_delete = False
    found_list_bucket = False
    
    for statement in s3_policy_doc["Statement"]:
      actions = statement.get("Action", [])
      if isinstance(actions, list):
        if all(action in actions for action in ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]):
          found_get_put_delete = True
        if "s3:ListBucket" in actions:
          found_list_bucket = True
      elif isinstance(actions, str):
        if actions == "s3:ListBucket":
          found_list_bucket = True
    
    self.assertTrue(found_get_put_delete, "S3 object actions not found")
    self.assertTrue(found_list_bucket, "S3 ListBucket action not found")
  
  @mark.it("creates CloudFront distribution with proper configuration")
  def test_cloudfront_distribution_configuration(self):
    """Test CloudFront distribution is created with proper configuration"""
    self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
    
    self.template.has_resource_properties("AWS::CloudFront::Distribution", {
      "DistributionConfig": {
        "Enabled": True,
        "PriceClass": "PriceClass_100",
        "DefaultCacheBehavior": {
          "ViewerProtocolPolicy": "redirect-to-https",
          "Compress": True
        }
      }
    })
  
  @mark.it("creates CloudFront Origin Access Control")
  def test_cloudfront_origin_access_control(self):
    """Test CloudFront Origin Access Control is created"""
    self.template.resource_count_is("AWS::CloudFront::OriginAccessControl", 1)
    
    self.template.has_resource_properties("AWS::CloudFront::OriginAccessControl", {
      "OriginAccessControlConfig": {
        "Description": "OAC for e-commerce S3 bucket",
        "Name": "EcommerceS3OAC",
        "OriginAccessControlOriginType": "s3",
        "SigningBehavior": "always",
        "SigningProtocol": "sigv4"
      }
    })
  
  @mark.it("creates security groups with proper configuration")
  def test_security_groups_configuration(self):
    """Test security groups are properly configured"""
    # Should have DB and App security groups (plus VPC default)
    security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
    
    # Find specific security groups
    db_sg = None
    app_sg = None
    
    for sg_id, sg in security_groups.items():
      description = sg["Properties"]["GroupDescription"]
      if "database" in description.lower():
        db_sg = sg
      elif "application" in description.lower():
        app_sg = sg
    
    self.assertIsNotNone(db_sg, "Database security group not found")
    self.assertIsNotNone(app_sg, "Application security group not found")
    
    # App security group should allow all outbound by default
    app_egress = app_sg["Properties"].get("SecurityGroupEgress", [])
    self.assertGreater(len(app_egress), 0, "App security group should have outbound rules")
  
  @mark.it("creates secrets manager secret for RDS credentials")
  def test_rds_credentials_secret(self):
    """Test RDS credentials are stored in Secrets Manager"""
    self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
    
    self.template.has_resource_properties("AWS::SecretsManager::Secret", {
      "Name": "ecommerce/db/credentials",
      "GenerateSecretString": {
        "SecretStringTemplate": '{"username":"ecommerce_admin"}',
        "GenerateStringKey": "password",
        "PasswordLength": 30
      }
    })
    
    # Test secret attachment to RDS instance
    self.template.resource_count_is("AWS::SecretsManager::SecretTargetAttachment", 1)
  
  @mark.it("validates environment suffix handling")
  def test_environment_suffix_handling(self):
    """Test environment suffix is properly handled"""
    # Test with explicit environment suffix using a new app to avoid synthesis conflicts
    new_app = cdk.App()
    stack_with_props = TapStack(
      new_app, 
      "test-stack-with-props",
      TapStackProps(environment_suffix="test")
    )
    
    # Should still create resources (environment suffix stored but not used in naming)
    template_with_props = Template.from_stack(stack_with_props)
    template_with_props.resource_count_is("AWS::S3::Bucket", 1)
    template_with_props.resource_count_is("AWS::RDS::DBInstance", 1)
    template_with_props.resource_count_is("AWS::CloudFront::Distribution", 1)
  
  @mark.it("validates resource count totals")
  def test_resource_count_totals(self):
    """Test expected total resource counts in template"""
    # Core infrastructure resources
    self.template.resource_count_is("AWS::S3::Bucket", 1)
    self.template.resource_count_is("AWS::RDS::DBInstance", 1)
    self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
    self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
    self.template.resource_count_is("AWS::CloudFront::OriginAccessControl", 1)
    
    # IAM resources
    self.template.resource_count_is("AWS::IAM::Role", 2)  # RDS and S3 access roles
    self.template.resource_count_is("AWS::IAM::Policy", 2)  # Inline policies for roles
    
    # VPC resources
    self.template.resource_count_is("AWS::EC2::VPC", 1)
    self.template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
    self.template.resource_count_is("AWS::EC2::InternetGateway", 1)
    self.template.resource_count_is("AWS::EC2::NatGateway", 1)
    
    # Secrets Manager
    self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
    self.template.resource_count_is("AWS::SecretsManager::SecretTargetAttachment", 1)


if __name__ == '__main__':
  unittest.main()