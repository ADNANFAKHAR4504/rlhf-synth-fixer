import json
import os
import unittest
import boto3
from pytest import mark

# Load flat outputs from cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.load(f)
else:
  flat_outputs = {}

@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):

  def setUp(self):
    self.region = os.environ.get("AWS_REGION", "us-east-1")
    self.s3 = boto3.client("s3", region_name=self.region)
    self.iam = boto3.client("iam", region_name=self.region)
    self.kms = boto3.client("kms", region_name=self.region)
    self.logs = boto3.client("logs", region_name=self.region)
    self.ec2 = boto3.client("ec2", region_name=self.region)
    self.elb = boto3.client("elbv2", region_name=self.region)
    self.rds = boto3.client("rds", region_name=self.region)

    self.bucket_name = flat_outputs.get("S3BucketName")
    self.role_name = flat_outputs.get("IamRoleName")
    self.kms_key_id = flat_outputs.get("KMSKeyId")
    self.log_group_name = "/aws/vpc/flowlogs"
    self.ec2_instance_id = flat_outputs.get("EC2InstanceId")
    self.rds_endpoint = flat_outputs.get("RDSEndpoint")
    self.alb_dns = flat_outputs.get("ALBDNSName")

  # --- S3 Bucket Checks ---

  @mark.it("✅ S3 bucket exists and has KMS encryption")
  def test_s3_bucket_encrypted_with_kms(self):
    if not self.bucket_name:
      self.fail("❌ 'S3BucketName' not found in flat-outputs.json")
    resp = self.s3.get_bucket_encryption(Bucket=self.bucket_name)
    algos = [r['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
             for r in resp['ServerSideEncryptionConfiguration']['Rules']]
    self.assertIn("aws:kms", algos)

  @mark.it("✅ S3 bucket blocks public access")
  def test_s3_block_public_access(self):
    if not self.bucket_name:
      self.fail("❌ 'S3BucketName' not found in flat-outputs.json")
    resp = self.s3.get_bucket_policy_status(Bucket=self.bucket_name)
    self.assertFalse(resp["PolicyStatus"]["IsPublic"])

  # --- IAM Role Checks ---

  @mark.it("✅ IAM Role exists and trusts EC2")
  def test_iam_role_trusts_ec2(self):
    if not self.role_name:
      self.fail("❌ 'IamRoleName' not found in flat-outputs.json")
    resp = self.iam.get_role(RoleName=self.role_name)
    assume_doc = resp["Role"]["AssumeRolePolicyDocument"]
    services = [s.get("Principal", {}).get("Service")
                for s in assume_doc.get("Statement", [])]
    self.assertIn("ec2.amazonaws.com", services)

  # --- KMS Key ---

  @mark.it("✅ KMS key exists and rotation is enabled")
  def test_kms_key_rotation(self):
    if not self.kms_key_id:
      self.fail("❌ 'KMSKeyId' not found in flat-outputs.json")
    resp = self.kms.get_key_rotation_status(KeyId=self.kms_key_id)
    self.assertTrue(resp["KeyRotationEnabled"])

  # --- VPC Flow Logs ---

  @mark.it("✅ VPC Flow Log group exists")
  def test_vpc_flow_log_group_exists(self):
    resp = self.logs.describe_log_groups(logGroupNamePrefix=self.log_group_name)
    log_groups = [g["logGroupName"] for g in resp.get("logGroups", [])]
    self.assertIn(self.log_group_name, log_groups)

  # --- EC2 ---

  @mark.it("✅ EC2 instance exists and is running")
  def test_ec2_instance_running(self):
    if not self.ec2_instance_id:
      self.fail("❌ 'EC2InstanceId' not found in flat-outputs.json")
    resp = self.ec2.describe_instances(InstanceIds=[self.ec2_instance_id])
    state = resp["Reservations"][0]["Instances"][0]["State"]["Name"]
    self.assertEqual(state, "running")

  # --- ALB ---

  @mark.it("✅ ALB ARN is valid and listener is available")
  def test_alb_listener_exists(self):
    alb_arn = flat_outputs.get("ALBArn")
    if not alb_arn:
      self.fail("❌ 'ALBArn' not found in flat-outputs.json")
    resp = self.elb.describe_listeners(LoadBalancerArn=alb_arn)
    ports = [l["Port"] for l in resp["Listeners"]]
    self.assertIn(80, ports)

  # --- RDS ---

  @mark.it("✅ RDS instance is available and engine is PostgreSQL")
  def test_rds_instance_postgres(self):
    if not self.rds_endpoint:
      self.fail("❌ 'RDSEndpoint' not found in flat-outputs.json")
    resp = self.rds.describe_db_instances()
    found = False
    for db in resp["DBInstances"]:
      if self.rds_endpoint in db["Endpoint"]["Address"]:
        self.assertEqual(db["Engine"], "postgres")
        self.assertEqual(db["DBInstanceStatus"], "available")
        found = True
        break
    self.assertTrue(found, f"❌ RDS endpoint {self.rds_endpoint} not found")
  
  @mark.it("✅ EC2 SG allows HTTP from ALB SG on port 80")
  def test_ec2_sg_allows_http_from_alb_sg(self):
    ec2_sg_id = flat_outputs.get("EC2SecurityGroupId")
    alb_sg_id = flat_outputs.get("ALBSecurityGroupId")

    if not ec2_sg_id or not alb_sg_id:
      self.fail("❌ 'EC2SecurityGroupId' or 'ALBSecurityGroupId' not found in flat-outputs.json")

    resp = self.ec2.describe_security_groups(GroupIds=[ec2_sg_id])
    permissions = resp["SecurityGroups"][0].get("IpPermissions", [])

    found = any(
      perm.get("FromPort") == 80 and
      perm.get("ToPort") == 80 and
      any(pair.get("GroupId") == alb_sg_id for pair in perm.get("UserIdGroupPairs", []))
      for perm in permissions
    )

    self.assertTrue(found, "❌ EC2 SG does not allow HTTP (port 80) from ALB SG")
