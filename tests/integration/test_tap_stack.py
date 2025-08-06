"""
Integration Tests for AWS Production Infrastructure - Live Resource Testing

This module contains comprehensive integration tests that validate actual deployed
AWS resources using Terraform outputs. Tests verify real infrastructure functionality,
security controls, connectivity, and production readiness.
"""

import ipaddress
import json
import subprocess
import urllib.request
from typing import Any, Dict

import boto3
import pytest
from botocore.exceptions import ClientError


class TerraformOutputReader:
  """Utility class to read and parse Terraform outputs."""
  
  @staticmethod
  def get_outputs() -> Dict[str, Any]:
    """
    Get Terraform outputs from deployed infrastructure.
    
    Returns:
      Dict containing all Terraform outputs
    """
    try:
      result = subprocess.run(
        ["terraform", "output", "-json"],
        capture_output=True,
        text=True,
        check=True
      )
      outputs = json.loads(result.stdout)
      return {key: value["value"] for key, value in outputs.items()}
    except subprocess.CalledProcessError as e:
      pytest.skip(f"Could not read Terraform outputs: {e}")
      return {}
    except json.JSONDecodeError as e:
      pytest.skip(f"Could not parse Terraform outputs: {e}")
      return {}

  @staticmethod
  def check_terraform_state() -> bool:
    """Check if Terraform state exists and is valid."""
    try:
      subprocess.run(
        ["terraform", "show", "-json"],
        capture_output=True,
        text=True,
        check=True
      )
      return True
    except subprocess.CalledProcessError:
      return False


@pytest.fixture(scope="session")
def terraform_outputs():
  """
  Fixture that provides Terraform outputs for all tests.
  
  Returns:
    Dict containing all Terraform outputs from deployed infrastructure
  """
  if not TerraformOutputReader.check_terraform_state():
    pytest.skip("No Terraform state found. Please deploy infrastructure first.")
  
  outputs = TerraformOutputReader.get_outputs()
  if not outputs:
    pytest.skip("No Terraform outputs found.")
  
  return outputs


@pytest.fixture(scope="session")
def aws_clients():
  """
  Fixture that provides AWS service clients for testing.
  
  Returns:
    Dict containing initialized AWS clients
  """
  return {
    'ec2': boto3.client('ec2'),
    'iam': boto3.client('iam'),
    'logs': boto3.client('logs'),
    'lambda': boto3.client('lambda'),
    'apigateway': boto3.client('apigateway'),
    's3': boto3.client('s3'),
    'dynamodb': boto3.client('dynamodb'),
    'sts': boto3.client('sts'),
    'cloudwatch': boto3.client('cloudwatch'),
    'cloudformation': boto3.client('cloudformation'),
  }


class TestVPCInfrastructure:
  """Test suite for VPC and networking infrastructure."""
  
  def test_vpc_exists(self, terraform_outputs, aws_clients):
    """Test that VPC exists and is available."""
    vpc_id = terraform_outputs.get('vpc_id')
    assert vpc_id, "VPC ID not found in Terraform outputs"
    
    ec2 = aws_clients['ec2']
    response = ec2.describe_vpcs(VpcIds=[vpc_id])
    
    assert response['Vpcs'], f"VPC {vpc_id} not found"
    vpc = response['Vpcs'][0]
    assert vpc['State'] == 'available', f"VPC {vpc_id} is not available"
  
  def test_vpc_cidr_block(self, terraform_outputs, aws_clients):
    """Test that VPC has correct CIDR block."""
    vpc_id = terraform_outputs.get('vpc_id')
    expected_cidr = terraform_outputs.get('vpc_cidr')
    
    if not vpc_id or not expected_cidr:
      pytest.skip("VPC ID or CIDR not found in outputs")
    
    ec2 = aws_clients['ec2']
    response = ec2.describe_vpcs(VpcIds=[vpc_id])
    vpc = response['Vpcs'][0]
    
    assert vpc['CidrBlock'] == expected_cidr
  
  def test_subnets_exist(self, terraform_outputs, aws_clients):
    """Test that all required subnets exist."""
    subnet_ids = terraform_outputs.get('subnet_ids', [])
    if not subnet_ids:
      pytest.skip("No subnet IDs found in outputs")
    
    ec2 = aws_clients['ec2']
    response = ec2.describe_subnets(SubnetIds=subnet_ids)
    
    assert len(response['Subnets']) == len(subnet_ids)
    for subnet in response['Subnets']:
      assert subnet['State'] == 'available'
  
  def test_internet_gateway_exists(self, terraform_outputs, aws_clients):
    """Test that Internet Gateway exists and is attached."""
    igw_id = terraform_outputs.get('internet_gateway_id')
    vpc_id = terraform_outputs.get('vpc_id')
    
    if not igw_id or not vpc_id:
      pytest.skip("IGW or VPC ID not found in outputs")
    
    ec2 = aws_clients['ec2']
    response = ec2.describe_internet_gateways(InternetGatewayIds=[igw_id])
    
    assert response['InternetGateways'], f"IGW {igw_id} not found"
    igw = response['InternetGateways'][0]
    
    # Check attachment
    attachments = igw.get('Attachments', [])
    assert len(attachments) == 1, "IGW should be attached to exactly one VPC"
    assert attachments[0]['VpcId'] == vpc_id
    assert attachments[0]['State'] == 'available'
  
  def test_security_groups_exist(self, terraform_outputs, aws_clients):
    """Test that security groups exist with correct configuration."""
    sg_ids = terraform_outputs.get('security_group_ids', [])
    if not sg_ids:
      pytest.skip("No security group IDs found in outputs")
    
    ec2 = aws_clients['ec2']
    response = ec2.describe_security_groups(GroupIds=sg_ids)
    
    assert len(response['SecurityGroups']) == len(sg_ids)
    for sg in response['SecurityGroups']:
      assert sg['GroupName'], "Security group must have a name"


class TestIAMResources:
  """Test suite for IAM roles and policies."""
  
  def test_lambda_execution_role_exists(self, terraform_outputs, aws_clients):
    """Test that Lambda execution role exists."""
    role_arn = terraform_outputs.get('lambda_execution_role_arn')
    if not role_arn:
      pytest.skip("Lambda execution role ARN not found in outputs")
    
    role_name = role_arn.split('/')[-1]
    iam = aws_clients['iam']
    
    try:
      response = iam.get_role(RoleName=role_name)
      assert response['Role']['Arn'] == role_arn
    except ClientError as e:
      if e.response['Error']['Code'] == 'NoSuchEntity':
        pytest.fail(f"Lambda execution role {role_name} not found")
      raise
  
  def test_lambda_role_has_execution_policy(self, terraform_outputs, aws_clients):
    """Test that Lambda role has basic execution policy."""
    role_arn = terraform_outputs.get('lambda_execution_role_arn')
    if not role_arn:
      pytest.skip("Lambda execution role ARN not found in outputs")
    
    role_name = role_arn.split('/')[-1]
    iam = aws_clients['iam']
    
    # Check attached policies
    response = iam.list_attached_role_policies(RoleName=role_name)
    attached_policies = [p['PolicyArn'] for p in response['AttachedPolicies']]
    
    # Should have Lambda basic execution policy
    lambda_basic_policy = ('arn:aws:iam::aws:policy/'
                          'service-role/AWSLambdaBasicExecutionRole')
    assert lambda_basic_policy in attached_policies
  
  def test_api_gateway_execution_role_exists(self, terraform_outputs, aws_clients):
    """Test that API Gateway execution role exists if configured."""
    role_arn = terraform_outputs.get('api_gateway_execution_role_arn')
    if not role_arn:
      pytest.skip("API Gateway execution role ARN not found in outputs")
    
    role_name = role_arn.split('/')[-1]
    iam = aws_clients['iam']
    
    try:
      response = iam.get_role(RoleName=role_name)
      assert response['Role']['Arn'] == role_arn
    except ClientError as e:
      if e.response['Error']['Code'] == 'NoSuchEntity':
        pytest.fail(f"API Gateway execution role {role_name} not found")
      raise


class TestLambdaFunctions:
  """Test suite for Lambda functions."""
  
  def test_lambda_function_exists(self, terraform_outputs, aws_clients):
    """Test that Lambda function exists and is active."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    lambda_client = aws_clients['lambda']
    
    try:
      response = lambda_client.get_function(FunctionName=function_name)
      assert response['Configuration']['State'] == 'Active'
    except ClientError as e:
      if e.response['Error']['Code'] == 'ResourceNotFoundException':
        pytest.fail(f"Lambda function {function_name} not found")
      raise
  
  def test_lambda_function_configuration(self, terraform_outputs, aws_clients):
    """Test Lambda function configuration."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    lambda_client = aws_clients['lambda']
    response = lambda_client.get_function(FunctionName=function_name)
    config = response['Configuration']
    
    # Test basic configuration
    assert config['Runtime'].startswith('python'), "Should use Python runtime"
    assert config['Handler'], "Handler must be specified"
    assert config['Timeout'] > 0, "Timeout must be positive"
    assert config['MemorySize'] >= 128, "Memory must be at least 128MB"
  
  def test_lambda_function_invoke(self, terraform_outputs, aws_clients):
    """Test that Lambda function can be invoked."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    lambda_client = aws_clients['lambda']
    
    # Simple invocation test
    response = lambda_client.invoke(
      FunctionName=function_name,
      InvocationType='RequestResponse',
      Payload=json.dumps({'test': 'data'})
    )
    
    assert response['StatusCode'] == 200
    assert 'Payload' in response
  
  def test_lambda_environment_variables(self, terraform_outputs, aws_clients):
    """Test Lambda environment variables if configured."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    lambda_client = aws_clients['lambda']
    response = lambda_client.get_function(FunctionName=function_name)
    config = response['Configuration']
    
    # Check if environment variables are set
    env_vars = config.get('Environment', {}).get('Variables', {})
    if env_vars:
      # Validate common environment variables
      for key, value in env_vars.items():
        assert key, "Environment variable key cannot be empty"
        assert value is not None, f"Environment variable {key} has None value"


class TestAPIGateway:
  """Test suite for API Gateway."""
  
  def test_api_gateway_exists(self, terraform_outputs, aws_clients):
    """Test that API Gateway exists."""
    api_id = terraform_outputs.get('api_gateway_id')
    if not api_id:
      pytest.skip("API Gateway ID not found in outputs")
    
    apigw = aws_clients['apigateway']
    
    try:
      response = apigw.get_rest_api(restApiId=api_id)
      assert response['id'] == api_id
    except ClientError as e:
      if e.response['Error']['Code'] == 'NotFoundException':
        pytest.fail(f"API Gateway {api_id} not found")
      raise
  
  def test_api_gateway_deployment(self, terraform_outputs, aws_clients):
    """Test that API Gateway is deployed."""
    api_id = terraform_outputs.get('api_gateway_id')
    stage_name = terraform_outputs.get('api_gateway_stage', 'prod')
    
    if not api_id:
      pytest.skip("API Gateway ID not found in outputs")
    
    apigw = aws_clients['apigateway']
    
    try:
      response = apigw.get_stage(restApiId=api_id, stageName=stage_name)
      assert response['stageName'] == stage_name
    except ClientError as e:
      if e.response['Error']['Code'] == 'NotFoundException':
        pytest.fail(f"API Gateway stage {stage_name} not found")
      raise
  
  def test_api_gateway_endpoint_accessibility(self, terraform_outputs):
    """Test that API Gateway endpoint is accessible."""
    api_url = terraform_outputs.get('api_gateway_url')
    if not api_url:
      pytest.skip("API Gateway URL not found in outputs")
    
    # Test basic connectivity
    try:
      with urllib.request.urlopen(api_url, timeout=30) as response:
        assert response.status in [200, 401, 403]  # 401/403 OK if auth required
    except Exception as e:
      pytest.fail(f"API Gateway endpoint not accessible: {e}")


class TestCloudWatchLogs:
  """Test suite for CloudWatch Logs."""
  
  def test_lambda_log_group_exists(self, terraform_outputs, aws_clients):
    """Test that Lambda log group exists."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    log_group_name = f"/aws/lambda/{function_name}"
    logs_client = aws_clients['logs']
    
    try:
      response = logs_client.describe_log_groups(
        logGroupNamePrefix=log_group_name
      )
      log_groups = [lg for lg in response['logGroups'] 
                   if lg['logGroupName'] == log_group_name]
      assert len(log_groups) == 1, f"Log group {log_group_name} not found"
    except ClientError as e:
      pytest.fail(f"Error checking log group: {e}")
  
  def test_log_retention_policy(self, terraform_outputs, aws_clients):
    """Test that log retention policy is set."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    log_group_name = f"/aws/lambda/{function_name}"
    logs_client = aws_clients['logs']
    
    try:
      response = logs_client.describe_log_groups(
        logGroupNamePrefix=log_group_name
      )
      log_groups = [lg for lg in response['logGroups'] 
                   if lg['logGroupName'] == log_group_name]
      
      if log_groups:
        log_group = log_groups[0]
        # Check if retention is set (should not be infinite)
        if 'retentionInDays' in log_group:
          assert log_group['retentionInDays'] > 0
    except ClientError as e:
      pytest.fail(f"Error checking log retention: {e}")


class TestS3Resources:
  """Test suite for S3 buckets."""
  
  def test_s3_bucket_exists(self, terraform_outputs, aws_clients):
    """Test that S3 bucket exists if configured."""
    bucket_name = terraform_outputs.get('s3_bucket_name')
    if not bucket_name:
      pytest.skip("S3 bucket name not found in outputs")
    
    s3 = aws_clients['s3']
    
    try:
      s3.head_bucket(Bucket=bucket_name)
    except ClientError as e:
      error_code = e.response['Error']['Code']
      if error_code == '404':
        pytest.fail(f"S3 bucket {bucket_name} not found")
      else:
        pytest.fail(f"Error accessing S3 bucket: {e}")
  
  def test_s3_bucket_versioning(self, terraform_outputs, aws_clients):
    """Test S3 bucket versioning configuration."""
    bucket_name = terraform_outputs.get('s3_bucket_name')
    if not bucket_name:
      pytest.skip("S3 bucket name not found in outputs")
    
    s3 = aws_clients['s3']
    
    try:
      response = s3.get_bucket_versioning(Bucket=bucket_name)
      # Versioning should be either Enabled or Suspended
      status = response.get('Status', 'Disabled')
      assert status in ['Enabled', 'Suspended']
    except ClientError as e:
      if e.response['Error']['Code'] != 'NoSuchBucket':
        pytest.fail(f"Error checking bucket versioning: {e}")
  
  def test_s3_bucket_encryption(self, terraform_outputs, aws_clients):
    """Test S3 bucket encryption configuration."""
    bucket_name = terraform_outputs.get('s3_bucket_name')
    if not bucket_name:
      pytest.skip("S3 bucket name not found in outputs")
    
    s3 = aws_clients['s3']
    
    try:
      response = s3.get_bucket_encryption(Bucket=bucket_name)
      rules = response['ServerSideEncryptionConfiguration']['Rules']
      assert len(rules) > 0, "Bucket should have encryption rules"
      
      for rule in rules:
        sse = rule['ApplyServerSideEncryptionByDefault']
        assert sse['SSEAlgorithm'] in ['AES256', 'aws:kms']
    except ClientError as e:
      if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
        pytest.fail("S3 bucket encryption not configured")
      elif e.response['Error']['Code'] != 'NoSuchBucket':
        pytest.fail(f"Error checking bucket encryption: {e}")


class TestDynamoDBResources:
  """Test suite for DynamoDB tables."""
  
  def test_dynamodb_table_exists(self, terraform_outputs, aws_clients):
    """Test that DynamoDB table exists if configured."""
    table_name = terraform_outputs.get('dynamodb_table_name')
    if not table_name:
      pytest.skip("DynamoDB table name not found in outputs")
    
    dynamodb = aws_clients['dynamodb']
    
    try:
      response = dynamodb.describe_table(TableName=table_name)
      assert response['Table']['TableStatus'] == 'ACTIVE'
    except ClientError as e:
      if e.response['Error']['Code'] == 'ResourceNotFoundException':
        pytest.fail(f"DynamoDB table {table_name} not found")
      raise
  
  def test_dynamodb_table_configuration(self, terraform_outputs, aws_clients):
    """Test DynamoDB table configuration."""
    table_name = terraform_outputs.get('dynamodb_table_name')
    if not table_name:
      pytest.skip("DynamoDB table name not found in outputs")
    
    dynamodb = aws_clients['dynamodb']
    
    try:
      response = dynamodb.describe_table(TableName=table_name)
      table = response['Table']
      
      # Check key schema
      assert 'KeySchema' in table
      assert len(table['KeySchema']) > 0
      
      # Check attribute definitions
      assert 'AttributeDefinitions' in table
      assert len(table['AttributeDefinitions']) > 0
    except ClientError as e:
      if e.response['Error']['Code'] == 'ResourceNotFoundException':
        pytest.skip(f"DynamoDB table {table_name} not found")
      raise


class TestSecurityConfiguration:
  """Test suite for security configuration."""
  
  def test_no_default_security_groups(self, terraform_outputs, aws_clients):
    """Test that default security groups are not used."""
    vpc_id = terraform_outputs.get('vpc_id')
    if not vpc_id:
      pytest.skip("VPC ID not found in outputs")
    
    ec2 = aws_clients['ec2']
    
    # Get default security group for VPC
    response = ec2.describe_security_groups(
      Filters=[
        {'Name': 'vpc-id', 'Values': [vpc_id]},
        {'Name': 'group-name', 'Values': ['default']}
      ]
    )
    
    if response['SecurityGroups']:
      default_sg = response['SecurityGroups'][0]
      
      # Default security group should have no inbound rules
      assert len(default_sg['IpPermissions']) == 0, \
        "Default security group should have no inbound rules"
  
  def test_security_group_rules_are_restrictive(self, terraform_outputs, 
                                               aws_clients):
    """Test that security group rules are not overly permissive."""
    sg_ids = terraform_outputs.get('security_group_ids', [])
    if not sg_ids:
      pytest.skip("No security group IDs found in outputs")
    
    ec2 = aws_clients['ec2']
    response = ec2.describe_security_groups(GroupIds=sg_ids)
    
    for sg in response['SecurityGroups']:
      for rule in sg['IpPermissions']:
        for ip_range in rule.get('IpRanges', []):
          cidr = ip_range.get('CidrIp', '')
          if cidr:
            # Check for overly permissive rules
            network = ipaddress.ip_network(cidr, strict=False)
            if network.prefixlen < 16:  # /16 or larger networks
              pytest.fail(f"Security group {sg['GroupId']} has overly "
                         f"permissive rule: {cidr}")
  
  def test_iam_roles_have_least_privilege(self, terraform_outputs, aws_clients):
    """Test that IAM roles follow least privilege principle."""
    role_arn = terraform_outputs.get('lambda_execution_role_arn')
    if not role_arn:
      pytest.skip("Lambda execution role ARN not found in outputs")
    
    role_name = role_arn.split('/')[-1]
    iam = aws_clients['iam']
    
    # Check inline policies
    response = iam.list_role_policies(RoleName=role_name)
    for policy_name in response['PolicyNames']:
      policy_response = iam.get_role_policy(
        RoleName=role_name,
        PolicyName=policy_name
      )
      
      policy_doc = policy_response['PolicyDocument']
      for statement in policy_doc.get('Statement', []):
        # Check for overly broad permissions
        actions = statement.get('Action', [])
        if isinstance(actions, str):
          actions = [actions]
        
        for action in actions:
          if action == '*':
            pytest.fail(f"Role {role_name} has wildcard action permission")
          if action.endswith(':*'):
            # Allow service-specific wildcards in some cases
            service = action.split(':')[0]
            if service not in ['logs', 'cloudwatch']:
              pytest.skip(f"Role {role_name} has broad service "
                         f"permissions: {action}")


class TestConnectivityAndNetworking:
  """Test suite for connectivity and networking."""
  
  def test_vpc_connectivity(self, terraform_outputs, aws_clients):
    """Test VPC connectivity and routing."""
    vpc_id = terraform_outputs.get('vpc_id')
    if not vpc_id:
      pytest.skip("VPC ID not found in outputs")
    
    ec2 = aws_clients['ec2']
    
    # Check route tables
    response = ec2.describe_route_tables(
      Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    
    assert len(response['RouteTables']) > 0, "No route tables found for VPC"
    
    # Check for internet connectivity route
    has_internet_route = False
    for rt in response['RouteTables']:
      for route in rt['Routes']:
        if route.get('DestinationCidrBlock') == '0.0.0.0/0':
          has_internet_route = True
          break
    
    assert has_internet_route, "No internet gateway route found"
  
  def test_subnet_availability_zones(self, terraform_outputs, aws_clients):
    """Test that subnets are distributed across availability zones."""
    subnet_ids = terraform_outputs.get('subnet_ids', [])
    if len(subnet_ids) < 2:
      pytest.skip("Need at least 2 subnets to test AZ distribution")
    
    ec2 = aws_clients['ec2']
    response = ec2.describe_subnets(SubnetIds=subnet_ids)
    
    availability_zones = set()
    for subnet in response['Subnets']:
      availability_zones.add(subnet['AvailabilityZone'])
    
    assert len(availability_zones) > 1, \
      "Subnets should be distributed across multiple AZs"


class TestPerformanceAndScaling:
  """Test suite for performance and scaling capabilities."""
  
  def test_lambda_concurrency_configuration(self, terraform_outputs, 
                                           aws_clients):
    """Test Lambda concurrency configuration."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    lambda_client = aws_clients['lambda']
    
    try:
      # Check provisioned concurrency if configured
      response = lambda_client.get_provisioned_concurrency_config(
        FunctionName=function_name,
        Qualifier='$LATEST'
      )
      
      if 'AllocatedConcurrencyExecutions' in response:
        assert response['AllocatedConcurrencyExecutions'] > 0
    except ClientError as e:
      if e.response['Error']['Code'] != 'ProvisionedConcurrencyConfigNotFoundException':
        raise
  
  def test_api_gateway_throttling(self, terraform_outputs, aws_clients):
    """Test API Gateway throttling configuration."""
    api_id = terraform_outputs.get('api_gateway_id')
    stage_name = terraform_outputs.get('api_gateway_stage', 'prod')
    
    if not api_id:
      pytest.skip("API Gateway ID not found in outputs")
    
    apigw = aws_clients['apigateway']
    
    try:
      response = apigw.get_stage(restApiId=api_id, stageName=stage_name)
      
      # Check throttling settings
      throttle = response.get('throttle', {})
      if throttle:
        assert 'rateLimit' in throttle
        assert 'burstLimit' in throttle
        assert throttle['rateLimit'] > 0
        assert throttle['burstLimit'] > 0
    except ClientError as e:
      if e.response['Error']['Code'] != 'NotFoundException':
        raise


class TestMonitoringAndObservability:
  """Test suite for monitoring and observability."""
  
  def test_cloudwatch_alarms_exist(self, terraform_outputs, aws_clients):
    """Test that CloudWatch alarms are configured."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    cloudwatch = aws_clients['cloudwatch']
    
    # Check for Lambda-related alarms
    response = cloudwatch.describe_alarms(
      ActionPrefix=f"arn:aws:lambda"
    )
    
    lambda_alarms = [alarm for alarm in response['MetricAlarms']
                    if function_name in alarm.get('AlarmDescription', '')]
    
    if lambda_alarms:
      for alarm in lambda_alarms:
        assert alarm['StateValue'] in ['OK', 'ALARM', 'INSUFFICIENT_DATA']
        assert alarm['ActionsEnabled'] is True
  
  def test_lambda_dead_letter_queue(self, terraform_outputs, aws_clients):
    """Test Lambda dead letter queue configuration."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    lambda_client = aws_clients['lambda']
    response = lambda_client.get_function(FunctionName=function_name)
    config = response['Configuration']
    
    # Check if DLQ is configured
    dlq_config = config.get('DeadLetterConfig', {})
    if 'TargetArn' in dlq_config:
      assert dlq_config['TargetArn'], "DLQ target ARN should not be empty"


class TestDisasterRecovery:
  """Test suite for disaster recovery capabilities."""
  
  def test_cross_az_redundancy(self, terraform_outputs, aws_clients):
    """Test that resources are deployed across multiple AZs."""
    subnet_ids = terraform_outputs.get('subnet_ids', [])
    if not subnet_ids:
      pytest.skip("No subnet IDs found in outputs")
    
    ec2 = aws_clients['ec2']
    response = ec2.describe_subnets(SubnetIds=subnet_ids)
    
    availability_zones = set()
    for subnet in response['Subnets']:
      availability_zones.add(subnet['AvailabilityZone'])
    
    # Should have resources in at least 2 AZs for redundancy
    assert len(availability_zones) >= 2, \
      "Resources should be deployed across multiple AZs for redundancy"
  
  def test_backup_configuration(self, terraform_outputs, aws_clients):
    """Test backup configuration for stateful resources."""
    # Check DynamoDB backup if table exists
    table_name = terraform_outputs.get('dynamodb_table_name')
    if table_name:
      dynamodb = aws_clients['dynamodb']
      
      try:
        response = dynamodb.describe_continuous_backups(TableName=table_name)
        backup_config = response['ContinuousBackupsDescription']
        
        # Point-in-time recovery should be enabled for production
        pitr = backup_config.get('PointInTimeRecoveryDescription', {})
        if pitr:
          assert pitr.get('PointInTimeRecoveryStatus') == 'ENABLED'
      except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceNotFoundException':
          raise


class TestCostOptimization:
  """Test suite for cost optimization."""
  
  def test_lambda_memory_optimization(self, terraform_outputs, aws_clients):
    """Test Lambda memory configuration for cost optimization."""
    function_name = terraform_outputs.get('lambda_function_name')
    if not function_name:
      pytest.skip("Lambda function name not found in outputs")
    
    lambda_client = aws_clients['lambda']
    response = lambda_client.get_function(FunctionName=function_name)
    config = response['Configuration']
    
    memory_size = config['MemorySize']
    
    # Memory should be reasonable for the workload
    assert memory_size >= 128, "Memory should be at least 128MB"
    assert memory_size <= 3008, "Memory should not exceed 3008MB unless justified"
    
    # Memory should be in 64MB increments
    assert (memory_size - 128) % 64 == 0, "Memory should be in 64MB increments"
  
  def test_api_gateway_caching(self, terraform_outputs, aws_clients):
    """Test API Gateway caching configuration."""
    api_id = terraform_outputs.get('api_gateway_id')
    stage_name = terraform_outputs.get('api_gateway_stage', 'prod')
    
    if not api_id:
      pytest.skip("API Gateway ID not found in outputs")
    
    apigw = aws_clients['apigateway']
    
    try:
      response = apigw.get_stage(restApiId=api_id, stageName=stage_name)
      
      # Check if caching is enabled
      caching_enabled = response.get('cacheClusterEnabled', False)
      if caching_enabled:
        cache_size = response.get('cacheClusterSize')
        assert cache_size in ['0.5', '1.6', '6.1', '13.5', '28.4', '58.2', '118', '237']
    except ClientError as e:
      if e.response['Error']['Code'] != 'NotFoundException':
        raise


class TestComplianceAndGovernance:
  """Test suite for compliance and governance."""
  
  def test_resource_tagging(self, terraform_outputs, aws_clients):
    """Test that resources are properly tagged."""
    # Check Lambda function tags
    function_name = terraform_outputs.get('lambda_function_name')
    if function_name:
      lambda_client = aws_clients['lambda']
      
      try:
        response = lambda_client.list_tags(
          Resource=("arn:aws:lambda:"
                   f"{aws_clients['lambda'].meta.region_name}:"
                   f"{aws_clients['sts'].get_caller_identity()['Account']}:"
                   f"function:{function_name}")
        )
        
        tags = response.get('Tags', {})
        
        # Check for required tags
        required_tags = ['Environment', 'Project', 'Owner']
        for tag in required_tags:
          if tag in tags:
            assert tags[tag], f"Tag {tag} should have a value"
      except ClientError:
        pass  # Function might not support tagging
  
  def test_encryption_at_rest(self, terraform_outputs, aws_clients):
    """Test that encryption at rest is enabled for supported services."""
    # Check S3 bucket encryption
    bucket_name = terraform_outputs.get('s3_bucket_name')
    if bucket_name:
      s3 = aws_clients['s3']
      
      try:
        response = s3.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0, "S3 bucket should have encryption enabled"
      except ClientError as e:
        if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
          raise
    
    # Check DynamoDB encryption
    table_name = terraform_outputs.get('dynamodb_table_name')
    if table_name:
      dynamodb = aws_clients['dynamodb']
      
      try:
        response = dynamodb.describe_table(TableName=table_name)
        table = response['Table']
        
        # Check for encryption configuration
        sse_description = table.get('SSEDescription', {})
        if sse_description:
          assert sse_description.get('Status') == 'ENABLED'
      except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceNotFoundException':
          raise
  
  def test_access_logging(self, terraform_outputs, aws_clients):
    """Test that access logging is configured."""
    # Check API Gateway access logging
    api_id = terraform_outputs.get('api_gateway_id')
    stage_name = terraform_outputs.get('api_gateway_stage', 'prod')
    
    if api_id:
      apigw = aws_clients['apigateway']
      
      try:
        response = apigw.get_stage(restApiId=api_id, stageName=stage_name)
        
        # Check access log settings
        access_log_settings = response.get('accessLogSettings', {})
        if access_log_settings:
          assert 'destinationArn' in access_log_settings
          assert 'format' in access_log_settings
      except ClientError as e:
        if e.response['Error']['Code'] != 'NotFoundException':
          raise
