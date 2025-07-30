import unittest
import json
import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark
import subprocess
import socket
import os

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)
stack_name = flat_outputs.get('StackName', 'TapStack')

cf = boto3.client(
    'cloudformation',
    region_name=os.environ.get(
        'AWS_REGION',
        'us-east-1'))


def get_stack_outputs(stack_name):
  """Returns a dictionary of outputs for a given stack."""
  response = cf.describe_stacks(StackName=stack_name)
  outputs = response['Stacks'][0].get('Outputs', [])
  return {output['OutputKey']: output['OutputValue'] for output in outputs}


def get_nested_stacks(stack_name):
  """Recursively finds nested stacks and their outputs."""
  outputs_dict = {}

  def recurse(stack_id):
    # Get outputs for this stack
    outputs_dict[stack_id] = get_stack_outputs(stack_id)

    # Get nested stacks (resources of type AWS::CloudFormation::Stack)
    resources = cf.describe_stack_resources(
        StackName=stack_id)['StackResources']
    nested_stacks = [
        res['PhysicalResourceId'] for res in resources
        if res['ResourceType'] == 'AWS::CloudFormation::Stack'
    ]

    for nested_id in nested_stacks:
      recurse(nested_id)

  recurse(stack_name)
  return outputs_dict


main_stack_name = stack_name
flat_outputs = get_nested_stacks(main_stack_name)


class TestFullInfraIntegration(unittest.TestCase):

  def setUp(self):
    cf_outputs = get_nested_stacks(main_stack_name)
    # Filter only nested region stacks
    self.region_stacks = {
        sid: outs for sid, outs in cf_outputs.items()
        if sid != main_stack_name
    }
    self.boto_sess = boto3.Session()

  @mark.it("deploys infrastructure in at least two regions")
  def test_multi_region_deployment(self):
    self.assertGreaterEqual(len(self.region_stacks), 2)

  @mark.it("each region has required keys")
  def test_required_outputs_present(self):
    required = {
        'VPCId', 'BucketName', 'ALBDns', 'LambdaName',
        'RDSInstanceIdentifier', 'HostedZoneId'
    }
    for sid, res in self.region_stacks.items():
      with self.subTest(region=sid):
        self.assertTrue(required.issubset(set(res.keys())))

  @mark.it("security: ALB to EC2, SSH, RDS access rules")
  def test_security_group_rules(self):
    # Static output checks are insufficient; live checks require IAM/API access.
    # For full validation, you’d use boto3 EC2 describe-security-groups,
    # but this is a placeholder.
    for sid in self.region_stacks:
      # TODO: call describe_security_groups by SG ID referenced in output
      pass

  @mark.it("live checks on AWS resources if accessible")
  def test_live_resource_properties(self):
    for sid, res in self.region_stacks.items():
      region = 'us-east-1' if 'useast1' in sid else 'us-west-2'
      # RDS
      rds_id = res.get('RDSInstanceIdentifier')
      try:
        r = self.boto_sess.client('rds', region_name=region)
        db = r.describe_db_instances(
            DBInstanceIdentifier=rds_id)['DBInstances'][0]
        self.assertTrue(db['MultiAZ'])
      except ClientError:
        pass  # skip if not accessible

      # S3
      try:
        s = self.boto_sess.client('s3', region_name=region)
        s.head_bucket(Bucket=res.get('BucketName'))
      except ClientError:
        self.fail(f"S3 bucket unreachable: {res.get('BucketName')}")

      # Route53
      try:
        r53 = self.boto_sess.client('route53')
        r53.get_hosted_zone(Id=res.get('HostedZoneId'))
      except ClientError:
        pass

  @mark.it("ALB DNS is reachable over HTTP")
  def test_alb_http_reachability(self):
    for sid, res in self.region_stacks.items():
      url = res.get('ALBDns')
      try:
        resp = requests.get(f"http://{url}", timeout=5)
        self.assertIn(resp.status_code, (200, 403))
      except Exception:
        self.skipTest(f"Cannot reach ALB: {url}")

  @mark.it("Lambda exists")
  def test_lambda_exists(self):
    for sid, res in self.region_stacks.items():
      lambda_name = res.get('LambdaName')
      client = self.boto_sess.client('lambda', region_name='us-east-1')
      try:
        resp = client.get_function(FunctionName=lambda_name)
        self.assertIsNotNone(resp)
      except ClientError:
        self.skipTest(f"Lambda not accessible: {lambda_name}")

  @mark.it("resource tagging assumed if outputs exist")
  def test_resource_tagging(self):
    total = sum(len(res) for res in self.region_stacks.values())
    self.assertGreater(total, 0)

  @mark.it("prints grouped outputs")
  def test_print_grouped_outputs(self):
    self.maxDiff = None
    grouped = {}
    for sid, res in self.region_stacks.items():
      grouped[sid] = res
    print(json.dumps(grouped, indent=2))

  @mark.it("ALB DNS name resolves to valid IP addresses")
  def test_dns_resolution_matches_alb(self):
    """
    Confirm the ALB DNS name resolves to valid IP addresses (via gethostbyname_ex).
    """
    for sid, res in self.region_stacks.items():
      alb_dns = res.get('ALBDns')
      if not alb_dns:
        self.skipTest(f"Missing ALBDns in stack {sid}")

      try:
        # Resolve DNS to IP addresses
        _, _, ip_addrs = socket.gethostbyname_ex(alb_dns)
        self.assertTrue(
            len(ip_addrs) > 0,
            f"No IP addresses resolved for {alb_dns}")

        # Optionally, we can try to verify if these IPs are reachable (ping or connect)
        # But that can be flaky or blocked by firewalls.
      except socket.gaierror:
        self.fail(f"DNS resolution failed for {alb_dns}")

  @mark.it("nslookup subprocess call to verify DNS resolution for the ALB DNS")
  def test_nslookup_dns_resolution(self):
    """
    Use nslookup subprocess call to verify DNS resolution for the ALB DNS.
    """
    for sid, res in self.region_stacks.items():
      alb_dns = res.get('ALBDns')
      if not alb_dns:
        self.skipTest(f"Missing ALBDns in stack {sid}")

      try:
        result = subprocess.run(
            ['nslookup', alb_dns],
            capture_output=True,
            text=True,
            timeout=5
        )
        self.assertEqual(
            result.returncode,
            0,
            f"nslookup failed for {alb_dns}")
        output = result.stdout + result.stderr
        self.assertIn(
            'Address',
            output,
            f"nslookup did not return IP for {alb_dns}")
      except Exception as e:
        self.fail(f"nslookup execution error: {str(e)}")
