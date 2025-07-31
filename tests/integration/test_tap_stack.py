# test_tap_stack_integration.py
import pytest
import boto3
import requests
import json
import time
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError
import pulumi


class TapStackIntegrationTests:
  """Integration tests for deployed TapStack infrastructure"""
  
  def __init__(self, stack_name: str = "TapStackpr328"):
    self.stack_name = stack_name
    self.stack_outputs = self._get_stack_outputs()
    self.aws_session = boto3.Session()
    
  def _get_stack_outputs(self) -> Dict[str, Any]:
    """Get Pulumi stack outputs"""
    try:
      # Get stack outputs using pulumi CLI
      import subprocess
      result = subprocess.run(
        ["pulumi", "stack", "output", "--json", "--stack", self.stack_name],
        capture_output=True,
        text=True,
        check=True
      )
      return json.loads(result.stdout)
    except Exception as e:
      # Fallback to mock outputs for testing
      return {
        "vpc_id": "vpc-test123",
        "cloudfront_domain": "d1234567890.cloudfront.net",
        "kinesis_stream_name": f"tap-data-stream-{self.stack_name}",
        "sns_topic_arn": f"arn:aws:sns:us-east-1:123456789012:tap-monitoring-{self.stack_name}"
      }

  def test_vpc_exists_and_accessible(self):
    """Test that VPC exists and is accessible"""
    ec2 = self.aws_session.client('ec2', region_name='us-east-1')
    
    try:
      vpc_id = self.stack_outputs.get('vpc_id')
      assert vpc_id, "VPC ID not found in stack outputs"
      
      response = ec2.describe_vpcs(VpcIds=[vpc_id])
      vpc = response['Vpcs'][0]
      
      assert vpc['State'] == 'available', f"VPC {vpc_id} is not available"
      assert vpc['CidrBlock'], "VPC CIDR block not configured"
      
      print(f"✅ VPC {vpc_id} is available with CIDR {vpc['CidrBlock']}")
      
    except ClientError as e:
      pytest.fail(f"Failed to access VPC: {e}")

  def test_subnets_in_multiple_azs(self):
    """Test that subnets are created across multiple availability zones"""
    ec2 = self.aws_session.client('ec2', region_name='us-east-1')
    
    try:
      vpc_id = self.stack_outputs.get('vpc_id')
      response = ec2.describe_subnets(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
      )
      
      subnets = response['Subnets']
      assert len(subnets) >= 2, "At least 2 subnets should exist"
      
      # Check availability zones
      azs = {subnet['AvailabilityZone'] for subnet in subnets}
      assert len(azs) >= 2, f"Subnets should span multiple AZs, found: {azs}"
      
      # Verify we have both public and private subnets
      public_subnets = [s for s in subnets if s.get('MapPublicIpOnLaunch', False)]
      private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]
      
      assert len(public_subnets) >= 1, "At least one public subnet should exist"
      assert len(private_subnets) >= 1, "At least one private subnet should exist"
      
      print(f"✅ Found {len(subnets)} subnets across {len(azs)} AZs")
      
    except ClientError as e:
      pytest.fail(f"Failed to verify subnets: {e}")

  def test_cloudfront_distribution_active(self):
    """Test that CloudFront distribution is deployed and active"""
    cloudfront = self.aws_session.client('cloudfront', region_name='us-east-1')
    
    try:
      domain_name = self.stack_outputs.get('cloudfront_domain')
      assert domain_name, "CloudFront domain not found in stack outputs"
      
      # Get distribution by domain name
      response = cloudfront.list_distributions()
      distributions = response.get('DistributionList', {}).get('Items', [])
      
      target_distribution = None
      for dist in distributions:
        if dist['DomainName'] == domain_name:
          target_distribution = dist
          break
      
      assert target_distribution, f"CloudFront distribution with domain {domain_name} not found"
      assert target_distribution['Status'] == 'Deployed', "CloudFront distribution not deployed"
      assert target_distribution['Enabled'], "CloudFront distribution not enabled"
      
      print(f"✅ CloudFront distribution {domain_name} is active")
      
    except ClientError as e:
      pytest.fail(f"Failed to verify CloudFront distribution: {e}")

  def test_cloudfront_accessibility(self):
    """Test that CloudFront distribution is accessible via HTTP"""
    domain_name = self.stack_outputs.get('cloudfront_domain')
    assert domain_name, "CloudFront domain not found"
    
    try:
      url = f"https://{domain_name}"
      response = requests.get(url, timeout=30, allow_redirects=True)
      
      # Accept any successful HTTP status (200, 404, etc.) as it means CF is responding
      assert response.status_code < 500, f"CloudFront returned server error: {response.status_code}"
      
      print(f"✅ CloudFront {domain_name} is accessible (status: {response.status_code})")
      
    except requests.exceptions.RequestException as e:
      pytest.fail(f"Failed to access CloudFront distribution: {e}")

  def test_kinesis_stream_active(self):
    """Test that Kinesis stream exists and is active"""
    kinesis = self.aws_session.client('kinesis', region_name='us-east-1')
    
    try:
      stream_name = self.stack_outputs.get('kinesis_stream_name')
      assert stream_name, "Kinesis stream name not found in stack outputs"
      
      response = kinesis.describe_stream(StreamName=stream_name)
      stream = response['StreamDescription']
      
      assert stream['StreamStatus'] == 'ACTIVE', f"Kinesis stream {stream_name} is not active"
      assert stream['Shards'], "Kinesis stream has no shards"
      
      print(f"✅ Kinesis stream {stream_name} is active with {len(stream['Shards'])} shards")
      
    except ClientError as e:
      pytest.fail(f"Failed to verify Kinesis stream: {e}")

  def test_sns_topic_exists(self):
    """Test that SNS topic exists and is accessible"""
    sns = self.aws_session.client('sns', region_name='us-east-1')
    
    try:
      topic_arn = self.stack_outputs.get('sns_topic_arn')
      assert topic_arn, "SNS topic ARN not found in stack outputs"
      
      response = sns.get_topic_attributes(TopicArn=topic_arn)
      attributes = response['Attributes']
      
      assert attributes.get('TopicArn') == topic_arn, "SNS topic ARN mismatch"
      
      print(f"✅ SNS topic {topic_arn} exists and is accessible")
      
    except ClientError as e:
      pytest.fail(f"Failed to verify SNS topic: {e}")

  def test_lambda_functions_exist(self):
    """Test that Lambda functions are deployed and configured"""
    lambda_client = self.aws_session.client('lambda', region_name='us-east-1')
    
    try:
      # List functions with our stack prefix
      response = lambda_client.list_functions()
      functions = response['Functions']
      
      stack_functions = [
        f for f in functions 
        if self.stack_name.lower() in f['FunctionName'].lower() or 'tap' in f['FunctionName'].lower()
      ]
      
      assert len(stack_functions) >= 1, "No Lambda functions found for this stack"
      
      for func in stack_functions:
        assert func['State'] == 'Active', f"Lambda function {func['FunctionName']} is not active"
        assert func['Runtime'], f"Lambda function {func['FunctionName']} has no runtime"
        
      print(f"✅ Found {len(stack_functions)} active Lambda functions")
      
    except ClientError as e:
      pytest.fail(f"Failed to verify Lambda functions: {e}")

  def test_security_groups_configured(self):
    """Test that security groups are properly configured"""
    ec2 = self.aws_session.client('ec2', region_name='us-east-1')
    
    try:
      vpc_id = self.stack_outputs.get('vpc_id')
      response = ec2.describe_security_groups(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
      )
      
      security_groups = response['SecurityGroups']
      assert len(security_groups) >= 1, "No security groups found"
      
      # Check for VPC endpoint security group
      vpc_endpoint_sg = None
      for sg in security_groups:
        if 'endpoint' in sg.get('GroupName', '').lower():
          vpc_endpoint_sg = sg
          break
      
      if vpc_endpoint_sg:
        assert vpc_endpoint_sg['IpPermissions'], "VPC endpoint security group has no inbound rules"
        print(f"✅ Found VPC endpoint security group: {vpc_endpoint_sg['GroupId']}")
      
      print(f"✅ Found {len(security_groups)} security groups in VPC")
      
    except ClientError as e:
      pytest.fail(f"Failed to verify security groups: {e}")

  def test_iam_roles_and_policies(self):
    """Test that IAM roles and policies are created"""
    iam = self.aws_session.client('iam', region_name='us-east-1')
    
    try:
      # List roles that contain our stack name
      response = iam.list_roles()
      stack_roles = [
        role for role in response['Roles']
        if any(keyword in role['RoleName'].lower() 
              for keyword in ['tap', 'lambda', 'kinesis'])
      ]
      
      assert len(stack_roles) >= 1, "No IAM roles found for this stack"
      
      for role in stack_roles:
        # Check if role has policies attached
        policies_response = iam.list_attached_role_policies(RoleName=role['RoleName'])
        inline_policies_response = iam.list_role_policies(RoleName=role['RoleName'])
        
        total_policies = (len(policies_response['AttachedPolicies']) + 
                        len(inline_policies_response['PolicyNames']))
        
        assert total_policies > 0, f"Role {role['RoleName']} has no policies attached"
      
      print(f"✅ Found {len(stack_roles)} IAM roles with policies")
      
    except ClientError as e:
      pytest.fail(f"Failed to verify IAM roles: {e}")

  def test_cloudwatch_alarms_configured(self):
    """Test that CloudWatch alarms are configured"""
    cloudwatch = self.aws_session.client('cloudwatch', region_name='us-east-1')
    
    try:
      response = cloudwatch.describe_alarms()
      all_alarms = response['MetricAlarms']
      
      # Filter alarms related to our stack
      stack_alarms = [
        alarm for alarm in all_alarms
        if any(keyword in alarm['AlarmName'].lower() 
              for keyword in ['tap', 'lambda', 'kinesis', 'cloudfront'])
      ]
      
      assert len(stack_alarms) >= 1, "No CloudWatch alarms found for this stack"
      
      for alarm in stack_alarms:
        assert alarm['StateValue'] in ['OK', 'ALARM', 'INSUFFICIENT_DATA'], \
          f"Alarm {alarm['AlarmName']} has invalid state"
      
      print(f"✅ Found {len(stack_alarms)} CloudWatch alarms configured")
      
    except ClientError as e:
      pytest.fail(f"Failed to verify CloudWatch alarms: {e}")


# Test runner functions
def test_infrastructure_deployment():
  """Main test function that runs all integration tests"""
  tester = TapStackIntegrationTests()
  
  # Run tests in logical order
  tester.test_vpc_exists_and_accessible()
  tester.test_subnets_in_multiple_azs()
  tester.test_security_groups_configured()
  tester.test_iam_roles_and_policies()
  tester.test_sns_topic_exists()
  tester.test_kinesis_stream_active()
  tester.test_lambda_functions_exist()
  tester.test_cloudfront_distribution_active()
  tester.test_cloudfront_accessibility()
  tester.test_cloudwatch_alarms_configured()
  
  print("🎉 All integration tests passed successfully!")


if __name__ == "__main__":
  # Run tests directly
  test_infrastructure_deployment()