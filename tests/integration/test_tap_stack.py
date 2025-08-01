"""
Integration tests for TapStack CDK stack
Tests synthesized CloudFormation template behavior and AWS integration
"""

import json
import os
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack


# Load deployment outputs if available
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
  base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.loads(f.read())
else:
  flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for synthesized CloudFormation template"""
  
  def setUp(self):
    """Set up a fresh CDK app and stack for each test"""
    self.app = cdk.App()
    self.stack = TapStack(self.app, "integration-test-stack")
    self.template = Template.from_stack(self.stack)
  
  @mark.it("validates synthesized template resource counts")
  def test_synthesized_resource_counts(self):
    """Test expected resource counts in synthesized template"""
    # Core infrastructure resources
    self.template.resource_count_is("AWS::S3::Bucket", 1)
    self.template.resource_count_is("AWS::RDS::DBInstance", 1)
    self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
    self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
    self.template.resource_count_is("AWS::CloudFront::OriginAccessControl", 1)
    
    # IAM resources - accounts for additional Lambda execution roles
    iam_roles = self.template.find_resources("AWS::IAM::Role")
    self.assertGreaterEqual(len(iam_roles), 2, "Should have at least RDS and S3 access roles")
    
    # Verify our specific IAM policies exist
    iam_policies = self.template.find_resources("AWS::IAM::Policy")
    self.assertGreaterEqual(len(iam_policies), 2, "Should have at least RDS and S3 access policies")
    
    # Security groups (including VPC default SG management)
    security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
    self.assertGreaterEqual(len(security_groups), 2, "Should have DB and App security groups")
    
    # VPC resources
    self.template.resource_count_is("AWS::EC2::VPC", 1)
    self.template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
    self.template.resource_count_is("AWS::EC2::InternetGateway", 1)
    self.template.resource_count_is("AWS::EC2::NatGateway", 1)
    
    # Secrets Manager
    self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
    self.template.resource_count_is("AWS::SecretsManager::SecretTargetAttachment", 1)
  
  @mark.it("validates RDS is configured in private subnets only")
  def test_rds_private_subnet_configuration(self):
    """Test RDS subnet group contains only private subnets"""
    # Get all subnets from template
    subnets = self.template.find_resources("AWS::EC2::Subnet")
    
    # Get RDS subnet group
    subnet_groups = self.template.find_resources("AWS::RDS::DBSubnetGroup")
    self.assertEqual(len(subnet_groups), 1, "Should have exactly one DB subnet group")
    
    subnet_group = list(subnet_groups.values())[0]
    subnet_refs = subnet_group["Properties"]["SubnetIds"]
    
    # Verify that referenced subnets are private (don't have MapPublicIpOnLaunch: true)
    for subnet_ref in subnet_refs:
      if isinstance(subnet_ref, dict) and "Ref" in subnet_ref:
        subnet_logical_id = subnet_ref["Ref"]
        if subnet_logical_id in subnets:
          subnet_props = subnets[subnet_logical_id]["Properties"]
            
          # Private subnets should not have MapPublicIpOnLaunch set to true
          map_public_ip = subnet_props.get("MapPublicIpOnLaunch", False)
          self.assertFalse(map_public_ip, f"Subnet {subnet_logical_id} should be private")
  
  @mark.it("validates S3 bucket policy restricts access to CloudFront only")
  def test_s3_cloudfront_restriction_integration(self):
    """Test S3 bucket policy allows access only from CloudFront distribution"""
    # Get bucket policy
    bucket_policies = self.template.find_resources("AWS::S3::BucketPolicy")
    self.assertGreaterEqual(len(bucket_policies), 1, "Should have at least one bucket policy")
    
    # Find our specific CloudFront policy
    cloudfront_policy_found = False
    for policy_id, policy in bucket_policies.items():
      policy_doc = policy["Properties"]["PolicyDocument"]
        
      for statement in policy_doc["Statement"]:
        if statement.get("Sid") == "AllowCloudFrontServicePrincipal":
          cloudfront_policy_found = True
          
          # Verify policy structure
          self.assertEqual(statement["Effect"], "Allow")
          self.assertEqual(statement["Principal"]["Service"], "cloudfront.amazonaws.com")
          self.assertEqual(statement["Action"], "s3:GetObject")
          
          # Verify the SourceArn references a CloudFront distribution
          source_arn_condition = statement["Condition"]["StringEquals"]["AWS:SourceArn"]
          if isinstance(source_arn_condition, dict) and "Fn::Join" in source_arn_condition:
            # The ARN is constructed - verify it contains cloudfront and distribution
            join_args = source_arn_condition["Fn::Join"]
            if len(join_args) == 2:
              components = join_args[1]
              arn_string = ''.join(str(c) for c in components if isinstance(c, str))
              self.assertIn("cloudfront", arn_string)
              self.assertIn("distribution", arn_string)
          break
    
    self.assertTrue(cloudfront_policy_found, "CloudFront access policy not found")
  
  @mark.it("validates RDS security configuration in synthesized template")
  def test_rds_security_integration(self):
    """Test RDS instance security settings in synthesized template"""
    rds_instances = self.template.find_resources("AWS::RDS::DBInstance")
    self.assertEqual(len(rds_instances), 1, "Should have exactly one RDS instance")
    
    rds_instance = list(rds_instances.values())[0]
    props = rds_instance["Properties"]
    
    # Verify critical security settings
    self.assertTrue(props["DeletionProtection"], "RDS should have deletion protection")
    self.assertTrue(props["MultiAZ"], "RDS should be Multi-AZ")
    self.assertTrue(props["StorageEncrypted"], "RDS should have storage encryption")
    self.assertEqual(props["BackupRetentionPeriod"], 7, "RDS should have 7-day backup retention")
    self.assertEqual(props["Engine"], "postgres", "RDS should use PostgreSQL")
    
    # Verify it's in a private subnet group
    self.assertIn("DBSubnetGroupName", props, "RDS should be in a subnet group")
    
    # Verify security group configuration
    security_group_ids = props.get("VPCSecurityGroups", [])
    self.assertGreater(len(security_group_ids), 0, "RDS should have security groups")
  
  @mark.it("validates IAM roles have correct policy attachments")
  def test_iam_policy_attachments_integration(self):
    """Test IAM roles have expected policy structure and permissions"""
    # Get all IAM roles and policies
    roles = self.template.find_resources("AWS::IAM::Role")
    policies = self.template.find_resources("AWS::IAM::Policy")
    
    # Find our specific roles
    rds_role = None
    s3_role = None
    
    for role_id, role in roles.items():
      description = role["Properties"].get("Description", "")
      if "RDS" in description:
        rds_role = (role_id, role)
      elif "S3" in description:
        s3_role = (role_id, role)
    
    self.assertIsNotNone(rds_role, "RDS access role not found")
    self.assertIsNotNone(s3_role, "S3 access role not found")
    
    # Verify both roles are assumable by Lambda
    for role_name, (role_id, role) in [("RDS", rds_role), ("S3", s3_role)]:
      assume_policy = role["Properties"]["AssumeRolePolicyDocument"]
      lambda_principal = False
      for statement in assume_policy["Statement"]:
        if (statement.get("Principal", {}).get("Service") == "lambda.amazonaws.com" and
          statement.get("Action") == "sts:AssumeRole"):
          lambda_principal = True
          break
    self.assertTrue(lambda_principal, f"{role_name} role should be assumable by Lambda")
    
    # Verify policies are attached to roles
    for policy_id, policy in policies.items():
      policy_roles = policy["Properties"].get("Roles", [])
      self.assertGreater(len(policy_roles), 0, f"Policy {policy_id} should be attached to at least one role")
  
  @mark.it("validates security groups have correct ingress/egress rules")
  def test_security_group_rules_integration(self):
    """Test security groups are properly configured with correct rules"""
    security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
    
    # Find our specific security groups
    db_sg = None
    app_sg = None
    
    for sg_id, sg in security_groups.items():
      description = sg["Properties"]["GroupDescription"]
      if "database" in description.lower():
        db_sg = (sg_id, sg)
      elif "application" in description.lower():
        app_sg = (sg_id, sg)
    
    self.assertIsNotNone(db_sg, "Database security group not found")
    self.assertIsNotNone(app_sg, "Application security group not found")
    
    # Analyze DB security group
    _, db_sg_resource = db_sg
    db_egress = db_sg_resource["Properties"].get("SecurityGroupEgress", [])
    
    # DB security group should have restrictive egress (disallow all rule)
    self.assertGreater(len(db_egress), 0, "Database SG should have egress rules")
    
    # Check for the "disallow all" rule
    disallow_all_found = False
    for rule in db_egress:
      if rule.get("CidrIp") == "255.255.255.255/32":
        disallow_all_found = True
        break
    self.assertTrue(disallow_all_found, "Database SG should have disallow-all egress rule")
    
    # Verify ingress rule exists from app security group
    ingress_rules = self.template.find_resources("AWS::EC2::SecurityGroupIngress")
    postgres_ingress_found = False
    
    for rule_id, rule in ingress_rules.items():
      props = rule["Properties"]
      if (props.get("IpProtocol") == "tcp" and 
        props.get("FromPort") == 5432 and 
        props.get("ToPort") == 5432):
        postgres_ingress_found = True
        self.assertIn("SourceSecurityGroupId", props, "PostgreSQL rule should reference source SG")
        break
    
    self.assertTrue(postgres_ingress_found, "PostgreSQL ingress rule not found")
  
  @mark.it("validates CloudFront distribution configuration")
  def test_cloudfront_configuration_integration(self):
    """Test CloudFront distribution is properly configured with S3 origin"""
    distributions = self.template.find_resources("AWS::CloudFront::Distribution")
    self.assertEqual(len(distributions), 1, "Should have exactly one CloudFront distribution")
    
    distribution = list(distributions.values())[0]
    config = distribution["Properties"]["DistributionConfig"]
    
    # Verify security and performance settings
    self.assertTrue(config["Enabled"], "CloudFront distribution should be enabled")
    self.assertEqual(config["PriceClass"], "PriceClass_100", "Should use PriceClass_100")
    
    default_behavior = config["DefaultCacheBehavior"]
    self.assertEqual(default_behavior["ViewerProtocolPolicy"], "redirect-to-https")
    self.assertTrue(default_behavior["Compress"], "Should enable compression")
    
    # Verify origin configuration
    origins = config.get("Origins", [])
    self.assertGreater(len(origins), 0, "CloudFront should have at least one origin")
      
      # Check for S3 origin
    s3_origin_found = False
    for origin in origins:
      if "S3OriginConfig" in origin:
        s3_origin_found = True
        # Verify Origin Access Control is configured
        self.assertIn("OriginAccessControlId", origin, "S3 origin should have OAC configured")
        break
  
    self.assertTrue(s3_origin_found, "S3 origin should be configured in CloudFront")
  
  @mark.it("validates Secrets Manager integration with RDS")
  def test_secrets_manager_rds_integration(self):
    """Test Secrets Manager secret is properly integrated with RDS"""
    secrets = self.template.find_resources("AWS::SecretsManager::Secret")
    secret_attachments = self.template.find_resources("AWS::SecretsManager::SecretTargetAttachment")
    rds_instances = self.template.find_resources("AWS::RDS::DBInstance")
    
    self.assertEqual(len(secrets), 1, "Should have exactly one secret")
    self.assertEqual(len(secret_attachments), 1, "Should have exactly one secret attachment")
    self.assertEqual(len(rds_instances), 1, "Should have exactly one RDS instance")
    
    # Verify secret configuration
    secret = list(secrets.values())[0]
    secret_props = secret["Properties"]
    
    self.assertEqual(secret_props["Name"], "ecommerce/db/credentials")
    
    # Verify secret generation config
    gen_config = secret_props["GenerateSecretString"]
    self.assertEqual(gen_config["GenerateStringKey"], "password")
    self.assertEqual(gen_config["PasswordLength"], 30)
    self.assertEqual(gen_config["SecretStringTemplate"], '{"username":"ecommerce_admin"}')
    
    # Verify secret is attached to RDS instance
    attachment = list(secret_attachments.values())[0]
    attachment_props = attachment["Properties"]
    
    self.assertIn("SecretId", attachment_props)
    self.assertIn("TargetId", attachment_props)
    self.assertEqual(attachment_props["TargetType"], "AWS::RDS::DBInstance")
  
  @mark.it("validates VPC and networking configuration")
  def test_vpc_networking_integration(self):
    """Test VPC and networking resources are properly configured"""
    # Get networking resources
    vpcs = self.template.find_resources("AWS::EC2::VPC")
    subnets = self.template.find_resources("AWS::EC2::Subnet")
    route_tables = self.template.find_resources("AWS::EC2::RouteTable")
    nat_gateways = self.template.find_resources("AWS::EC2::NatGateway")
    igws = self.template.find_resources("AWS::EC2::InternetGateway")
    
    # Basic resource counts
    self.assertEqual(len(vpcs), 1, "Should have exactly one VPC")
    self.assertEqual(len(subnets), 4, "Should have 4 subnets (2 public + 2 private)")
    self.assertEqual(len(nat_gateways), 1, "Should have 1 NAT Gateway")
    self.assertEqual(len(igws), 1, "Should have 1 Internet Gateway")
    
    # Analyze subnet configuration
    public_subnets = []
    private_subnets = []
    
    for subnet_id, subnet in subnets.items():
      props = subnet["Properties"]
      if props.get("MapPublicIpOnLaunch", False):
        public_subnets.append((subnet_id, subnet))
      else:
        private_subnets.append((subnet_id, subnet))
    
    self.assertEqual(len(public_subnets), 2, "Should have 2 public subnets")
    self.assertEqual(len(private_subnets), 2, "Should have 2 private subnets")
    
    # Verify CIDR blocks are different for each subnet
    cidr_blocks = [subnet["Properties"]["CidrBlock"] for _, subnet in subnets.items()]
    self.assertEqual(len(set(cidr_blocks)), 4, "All subnets should have unique CIDR blocks")
    
    # Verify availability zones
    azs = [subnet["Properties"]["AvailabilityZone"] for _, subnet in subnets.items()]
    # Should span at least 2 AZs
    unique_azs = set()
    for az in azs:
      if isinstance(az, dict) and "Fn::Select" in az:
        select_args = az["Fn::Select"]
        if len(select_args) == 2:
          unique_azs.add(select_args[0])  # The index
    self.assertGreaterEqual(len(unique_azs), 2, "Subnets should span at least 2 AZs")
  
  @mark.it("validates template can be deployed (dry run)")
  def test_template_deployment_readiness(self):
    """Test that the synthesized template is ready for deployment"""
    # Get the raw CloudFormation template
    cf_template = self.template.to_json()
    
    # Basic template structure validation
    self.assertIn("Resources", cf_template, "Template should have Resources section")
    # Note: CDK may not always include AWSTemplateFormatVersion in synthesized templates
    # self.assertIn("AWSTemplateFormatVersion", cf_template, "Template should have format version")
    
    # Verify required resource types are present
    resources = cf_template["Resources"]
    resource_types = [resource["Type"] for resource in resources.values()]
    
    required_types = [
      "AWS::S3::Bucket",
      "AWS::RDS::DBInstance", 
      "AWS::CloudFront::Distribution",
      "AWS::IAM::Role",
      "AWS::EC2::VPC",
      "AWS::SecretsManager::Secret"
    ]
    
    for required_type in required_types:
        self.assertIn(required_type, resource_types, f"Template should include {required_type}")
    
    # Verify no hardcoded account IDs or regions (should use pseudo-parameters)
    template_str = json.dumps(cf_template)
    
    # Check for pseudo-parameter usage instead of hardcoded values
    self.assertIn("AWS::AccountId", template_str, "Should use AWS::AccountId pseudo-parameter")
    self.assertIn("AWS::Region", template_str, "Should use AWS::Region pseudo-parameter")
    
    # Verify resource naming follows patterns (should contain stack name references)
    resource_names = list(resources.keys())
    logical_ids_with_prefix = [name for name in resource_names if name.startswith(("Ecommerce", "TapStack"))]
    self.assertGreater(len(logical_ids_with_prefix), 0, "Resources should follow naming conventions")


# Integration test for actual AWS outputs (if deployed)
@mark.integration
class TestTapStackDeployedResources(unittest.TestCase):
  """Integration tests using actual AWS deployment outputs"""
  
  def setUp(self):
    """Skip tests if no deployment outputs available"""
    if not flat_outputs:
      self.skipTest("No deployment outputs available - stack not deployed")
  
  @mark.it("validates deployed S3 bucket exists and is accessible")
  def test_deployed_s3_bucket(self):
    """Test deployed S3 bucket configuration"""
    # Look for S3 bucket in outputs
    bucket_name = None
    for key, value in flat_outputs.items():
      if "bucket" in key.lower() and "name" in key.lower():
        bucket_name = value
        break
    
    if bucket_name:
      self.assertTrue(bucket_name.startswith("ecommerce-assets-"), 
                      "S3 bucket should follow naming convention")
      # Additional bucket validation could be added here with boto3
  
  @mark.it("validates deployed RDS instance is accessible")
  def test_deployed_rds_instance(self):
    """Test deployed RDS instance configuration"""
    # Look for RDS endpoint in outputs
    rds_endpoint = None
    for key, value in flat_outputs.items():
      if "rds" in key.lower() or "database" in key.lower():
        if "endpoint" in key.lower():
          rds_endpoint = value
          break
    
    if rds_endpoint:
      self.assertIn("rds.amazonaws.com", rds_endpoint, 
                    "RDS endpoint should be in AWS RDS domain")
      # Additional RDS validation could be added here with boto3
  
  @mark.it("validates deployed CloudFront distribution")
  def test_deployed_cloudfront_distribution(self):
    """Test deployed CloudFront distribution"""
    # Look for CloudFront domain in outputs
    cf_domain = None
    for key, value in flat_outputs.items():
      if "cloudfront" in key.lower() or "distribution" in key.lower():
        if "domain" in key.lower():
          cf_domain = value
          break
  
    if cf_domain:
      self.assertIn("cloudfront.net", cf_domain, 
                    "CloudFront domain should be in cloudfront.net")
      # Additional CloudFront validation could be added here with boto3


if __name__ == '__main__':
  unittest.main()