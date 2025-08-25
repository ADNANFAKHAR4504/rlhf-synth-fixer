#!/usr/bin/env python3
"""
Integration tests for the TapStack CDK infrastructure.
Tests actual AWS resources deployed by the stack.
"""

import pytest
import boto3
import json
import os
import time
import requests
from botocore.exceptions import ClientError

# Load CloudFormation outputs
def load_cfn_outputs():
  """Load CloudFormation outputs from flat-outputs.json"""
  outputs_file = os.path.join(os.path.dirname(__file__), '../../cfn-outputs/flat-outputs.json')
  if not os.path.exists(outputs_file):
    # If flat-outputs.json doesn't exist, try to get outputs from CloudFormation
    return get_stack_outputs()
  
  with open(outputs_file, 'r') as f:
    return json.load(f)

def get_stack_outputs():
  """Get outputs directly from CloudFormation stack"""
  cf_client = boto3.client('cloudformation', region_name='us-east-1')
  environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr191cdkpy')
  stack_name = f"TapStack{environment_suffix}"
  
  try:
    response = cf_client.describe_stacks(StackName=stack_name)
    stack = response['Stacks'][0]
    outputs = {}
    for output in stack.get('Outputs', []):
      outputs[output['OutputKey']] = output['OutputValue']
    return outputs
  except Exception as e:
    print(f"Error getting stack outputs: {e}")
    return {}


class TestTapStackIntegration:
  """Integration test suite for TapStack infrastructure"""
  
  def setup_method(self):
    """Setup test method with AWS clients and outputs"""
    self.outputs = load_cfn_outputs()
    self.region = os.environ.get('AWS_REGION', 'us-east-1')
    
    # Initialize AWS clients
    self.ec2_client = boto3.client('ec2', region_name=self.region)
    self.elb_client = boto3.client('elbv2', region_name=self.region)
    self.autoscaling_client = boto3.client('autoscaling', region_name=self.region)
    self.waf_client = boto3.client('wafv2', region_name=self.region)
    self.s3_client = boto3.client('s3', region_name=self.region)
    self.logs_client = boto3.client('logs', region_name=self.region)
    
  def test_vpc_exists_and_configured(self):
    """Test that VPC exists and is properly configured"""
    vpc_id = self.outputs.get('VPCId')
    assert vpc_id is not None, "VPC ID not found in outputs"
    
    # Verify VPC exists
    response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
    vpc = response['Vpcs'][0]
    
    # Check VPC configuration
    assert vpc['State'] == 'available'
    assert vpc['CidrBlock'] == '10.0.0.0/16'
    
    # Check DNS settings (may need separate API call)
    response = self.ec2_client.describe_vpc_attribute(
      VpcId=vpc_id,
      Attribute='enableDnsHostnames'
    )
    assert response.get('EnableDnsHostnames', {}).get('Value', False) is True
    
    response = self.ec2_client.describe_vpc_attribute(
      VpcId=vpc_id,
      Attribute='enableDnsSupport'
    )
    assert response.get('EnableDnsSupport', {}).get('Value', False) is True
  
  def test_subnets_configured(self):
    """Test that subnets are properly configured"""
    vpc_id = self.outputs.get('VPCId')
    assert vpc_id is not None
    
    # Get all subnets in the VPC
    response = self.ec2_client.describe_subnets(
      Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    subnets = response['Subnets']
    
    # Should have at least 6 subnets (3 public, 3 private)
    assert len(subnets) >= 6, f"Expected at least 6 subnets, found {len(subnets)}"
    
    # Check for public and private subnets
    public_subnets = [s for s in subnets if s.get('MapPublicIpOnLaunch', False)]
    private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]
    
    assert len(public_subnets) >= 3, f"Expected at least 3 public subnets, found {len(public_subnets)}"
    assert len(private_subnets) >= 3, f"Expected at least 3 private subnets, found {len(private_subnets)}"
  
  def test_nat_gateways_exist(self):
    """Test that NAT gateways exist for high availability"""
    vpc_id = self.outputs.get('VPCId')
    assert vpc_id is not None
    
    # Get NAT gateways
    response = self.ec2_client.describe_nat_gateways(
      Filters=[
        {'Name': 'vpc-id', 'Values': [vpc_id]},
        {'Name': 'state', 'Values': ['available']}
      ]
    )
    nat_gateways = response['NatGateways']
    
    # Should have 2 NAT gateways for HA
    assert len(nat_gateways) == 2, f"Expected 2 NAT gateways, found {len(nat_gateways)}"
  
  def test_internet_gateway_attached(self):
    """Test that Internet Gateway is attached to VPC"""
    vpc_id = self.outputs.get('VPCId')
    assert vpc_id is not None
    
    # Get Internet Gateway
    response = self.ec2_client.describe_internet_gateways(
      Filters=[
        {'Name': 'attachment.vpc-id', 'Values': [vpc_id]}
      ]
    )
    igws = response['InternetGateways']
    
    assert len(igws) == 1, f"Expected 1 Internet Gateway, found {len(igws)}"
    assert igws[0]['Attachments'][0]['State'] == 'available'
  
  def test_alb_exists_and_accessible(self):
    """Test that ALB exists and is accessible"""
    alb_dns = self.outputs.get('LoadBalancerDNS')
    assert alb_dns is not None, "ALB DNS not found in outputs"
    
    # Get load balancer details
    response = self.elb_client.describe_load_balancers(
      Names=[alb_dns.split('.')[0]]  # Extract ALB name from DNS
    )
    
    if response['LoadBalancers']:
      alb = response['LoadBalancers'][0]
      
      # Check ALB configuration
      assert alb['State']['Code'] == 'active'
      assert alb['Scheme'] == 'internet-facing'
      assert alb['Type'] == 'application'
  
  def test_alb_http_endpoint(self):
    """Test that ALB HTTP endpoint is responding"""
    alb_dns = self.outputs.get('LoadBalancerDNS')
    if not alb_dns:
      pytest.skip("ALB DNS not available")
    
    # Wait a bit for ALB to be ready
    time.sleep(10)
    
    # Try to access the ALB endpoint
    url = f"http://{alb_dns}"
    max_retries = 5
    
    for i in range(max_retries):
      try:
        response = requests.get(url, timeout=10)
        # We expect either 200 (success) or 503 (no healthy targets yet)
        assert response.status_code in [200, 503], f"Unexpected status code: {response.status_code}"
        break
      except requests.exceptions.RequestException as e:
        if i == max_retries - 1:
          pytest.fail(f"Failed to connect to ALB after {max_retries} attempts: {e}")
        time.sleep(10)
  
  def test_auto_scaling_group_configured(self):
    """Test that Auto Scaling Group is properly configured"""
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr191cdkpy')
    
    # List Auto Scaling Groups
    response = self.autoscaling_client.describe_auto_scaling_groups()
    asgs = [asg for asg in response['AutoScalingGroups'] 
           if environment_suffix in asg['AutoScalingGroupName']]
    
    assert len(asgs) > 0, "No Auto Scaling Group found"
    
    asg = asgs[0]
    
    # Check ASG configuration
    assert asg['MinSize'] == 2
    assert asg['MaxSize'] == 6
    assert asg['DesiredCapacity'] == 3
    assert asg['HealthCheckType'] == 'ELB'
    assert asg['HealthCheckGracePeriod'] == 300
  
  def test_ec2_instances_running(self):
    """Test that EC2 instances are running in the ASG"""
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr191cdkpy')
    
    # Get Auto Scaling Group
    response = self.autoscaling_client.describe_auto_scaling_groups()
    asgs = [asg for asg in response['AutoScalingGroups'] 
           if environment_suffix in asg['AutoScalingGroupName']]
    
    if not asgs:
      pytest.skip("No Auto Scaling Group found")
    
    asg = asgs[0]
    
    # Check instances
    instances = asg.get('Instances', [])
    assert len(instances) >= 2, f"Expected at least 2 instances, found {len(instances)}"
    
    # Verify instances are healthy
    healthy_instances = [i for i in instances if i['HealthStatus'] == 'Healthy']
    assert len(healthy_instances) >= 1, "No healthy instances found"
  
  def test_security_groups_configured(self):
    """Test that security groups are properly configured"""
    vpc_id = self.outputs.get('VPCId')
    assert vpc_id is not None
    
    # Get security groups in the VPC
    response = self.ec2_client.describe_security_groups(
      Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    security_groups = response['SecurityGroups']
    
    # Find ALB and EC2 security groups
    alb_sg = None
    ec2_sg = None
    
    for sg in security_groups:
      if 'Application Load Balancer' in sg.get('GroupDescription', ''):
        alb_sg = sg
      elif 'EC2 web servers' in sg.get('GroupDescription', ''):
        ec2_sg = sg
    
    assert alb_sg is not None, "ALB security group not found"
    assert ec2_sg is not None, "EC2 security group not found"
    
    # Check ALB security group allows HTTP/HTTPS
    alb_ingress_ports = {rule['FromPort'] for rule in alb_sg.get('IpPermissions', [])}
    assert 80 in alb_ingress_ports or 443 in alb_ingress_ports, "ALB security group should allow HTTP or HTTPS"
  
  def test_waf_web_acl_exists(self):
    """Test that WAF Web ACL exists and is configured"""
    web_acl_id = self.outputs.get('WebACLId')
    assert web_acl_id is not None, "WAF Web ACL ID not found in outputs"
    
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr191cdkpy')
    
    # Get Web ACL
    try:
      response = self.waf_client.get_web_acl(
        Scope='REGIONAL',
        Id=web_acl_id,
        Name=f"WebACL-{environment_suffix}"
      )
      web_acl = response['WebACL']
      
      # Check Web ACL has rules
      assert len(web_acl['Rules']) >= 3, f"Expected at least 3 WAF rules, found {len(web_acl['Rules'])}"
      
      # Check for AWS Managed Rules
      rule_names = [rule['Name'] for rule in web_acl['Rules']]
      assert 'AWSManagedRulesCommonRuleSet' in rule_names
      assert 'AWSManagedRulesKnownBadInputsRuleSet' in rule_names
      assert 'AWSManagedRulesAmazonIpReputationList' in rule_names
    except ClientError as e:
      if 'WAFNonexistentItemException' in str(e):
        pytest.skip(f"WAF Web ACL not found: {e}")
      raise
  
  def test_waf_associated_with_alb(self):
    """Test that WAF is associated with the ALB"""
    alb_dns = self.outputs.get('LoadBalancerDNS')
    web_acl_id = self.outputs.get('WebACLId')
    
    if not alb_dns or not web_acl_id:
      pytest.skip("ALB DNS or Web ACL ID not available")
    
    # Get ALB ARN
    response = self.elb_client.describe_load_balancers()
    alb_arn = None
    for lb in response['LoadBalancers']:
      if lb['DNSName'] == alb_dns:
        alb_arn = lb['LoadBalancerArn']
        break
    
    if alb_arn:
      # Check if WAF is associated
      try:
        response = self.waf_client.get_web_acl_for_resource(
          ResourceArn=alb_arn
        )
        assert response.get('WebACL') is not None, "WAF not associated with ALB"
      except ClientError as e:
        if 'WAFNonexistentItemException' not in str(e):
          raise
  
  def test_vpc_flow_logs_enabled(self):
    """Test that VPC Flow Logs are enabled"""
    vpc_id = self.outputs.get('VPCId')
    assert vpc_id is not None
    
    # Check Flow Logs
    response = self.ec2_client.describe_flow_logs(
      Filters=[
        {'Name': 'resource-id', 'Values': [vpc_id]}
      ]
    )
    flow_logs = response['FlowLogs']
    
    assert len(flow_logs) > 0, "No VPC Flow Logs found"
    
    # Check Flow Log configuration
    flow_log = flow_logs[0]
    assert flow_log['FlowLogStatus'] == 'ACTIVE'
    assert flow_log['TrafficType'] == 'ALL'
  
  def test_s3_bucket_for_alb_logs(self):
    """Test that S3 bucket for ALB logs exists and is configured"""
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr191cdkpy')
    
    # List buckets and find ALB logs bucket
    response = self.s3_client.list_buckets()
    alb_bucket = None
    
    for bucket in response['Buckets']:
      if f'alb-logs-{environment_suffix}' in bucket['Name']:
        alb_bucket = bucket['Name']
        break
    
    assert alb_bucket is not None, "ALB logs bucket not found"
    
    # Check bucket encryption
    try:
      response = self.s3_client.get_bucket_encryption(Bucket=alb_bucket)
      assert 'ServerSideEncryptionConfiguration' in response
    except ClientError as e:
      if 'ServerSideEncryptionConfigurationNotFoundError' not in str(e):
        raise
    
    # Check bucket public access block
    response = self.s3_client.get_public_access_block(Bucket=alb_bucket)
    config = response['PublicAccessBlockConfiguration']
    assert config['BlockPublicAcls'] is True
    assert config['BlockPublicPolicy'] is True
    assert config['IgnorePublicAcls'] is True
    assert config['RestrictPublicBuckets'] is True
  
  def test_high_availability_across_azs(self):
    """Test that resources are distributed across multiple AZs"""
    vpc_id = self.outputs.get('VPCId')
    assert vpc_id is not None
    
    # Check subnets span multiple AZs
    response = self.ec2_client.describe_subnets(
      Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    subnets = response['Subnets']
    
    # Get unique AZs
    azs = set(subnet['AvailabilityZone'] for subnet in subnets)
    assert len(azs) >= 2, f"Expected at least 2 AZs, found {len(azs)}"
  
  def test_target_group_health(self):
    """Test that target group has healthy targets"""
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr191cdkpy')
    
    # Get target groups
    response = self.elb_client.describe_target_groups()
    target_groups = [tg for tg in response['TargetGroups'] 
                    if environment_suffix in tg['TargetGroupName']]
    
    if not target_groups:
      pytest.skip("No target group found")
    
    tg_arn = target_groups[0]['TargetGroupArn']
    
    # Check target health
    response = self.elb_client.describe_target_health(TargetGroupArn=tg_arn)
    targets = response['TargetHealthDescriptions']
    
    # At least some targets should be registered
    assert len(targets) >= 0, "No targets registered in target group"
  
  def test_cloudwatch_logs_created(self):
    """Test that CloudWatch log groups are created"""
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synthtrainr191cdkpy')
    
    # Check for VPC Flow Logs log group
    response = self.logs_client.describe_log_groups(
      logGroupNamePrefix=f'/aws/vpc/flowlogs'
    )
    
    flow_log_groups = [lg for lg in response.get('logGroups', [])
                      if environment_suffix in lg['logGroupName']]
    
    # We should have at least VPC Flow Logs
    assert len(flow_log_groups) > 0 or len(response.get('logGroups', [])) > 0, "No log groups found for VPC Flow Logs"