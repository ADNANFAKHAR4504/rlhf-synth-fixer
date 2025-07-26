import json
import os
import unittest
import boto3
import requests
from pytest import mark
from botocore.exceptions import ClientError

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

# Check if deployment outputs are available
DEPLOYMENT_OUTPUTS_AVAILABLE = os.path.exists(flat_outputs_path)

if DEPLOYMENT_OUTPUTS_AVAILABLE:
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.loads(f.read())
else:
  flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up AWS clients for each test"""
    if not DEPLOYMENT_OUTPUTS_AVAILABLE:
      self.skipTest("Integration tests require deployment outputs in cfn-outputs/flat-outputs.json")
    
    # Use real AWS clients with deployment outputs
    self.dynamodb = boto3.resource('dynamodb')
    self.lambda_client = boto3.client('lambda')
    self.apigateway = boto3.client('apigateway')
    self.cloudwatch = boto3.client('cloudwatch')
    self.iam = boto3.client('iam')
    self.ec2 = boto3.client('ec2')

  @mark.it("DynamoDB table exists and is accessible")
  def test_dynamodb_table_exists(self):
    """Test that DynamoDB table exists and has correct configuration"""
    table_name = flat_outputs.get('DynamoTableNameOutput')
    if not table_name:
      self.fail("DynamoDB table name not available in deployment outputs")
    
    try:
      table = self.dynamodb.Table(table_name)
      # Check table exists by calling describe
      table_info = table.meta.client.describe_table(TableName=table_name)
      
      # Verify table configuration
      self.assertEqual(table_info['Table']['BillingMode'], 'PAY_PER_REQUEST')
      self.assertEqual(table_info['Table']['KeySchema'][0]['AttributeName'], 'itemId')
      self.assertEqual(table_info['Table']['KeySchema'][0]['KeyType'], 'HASH')
      
    except ClientError as e:
      self.fail(f"DynamoDB table {table_name} not accessible: {e}")

  @mark.it("Lambda function exists and is properly configured")
  def test_lambda_function_exists(self):
    """Test that Lambda function exists with correct configuration"""
    function_name = flat_outputs.get('LambdaFunctionNameOutput')
    if not function_name:
      self.fail("Lambda function name not available in deployment outputs")
    
    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      
      # Verify function configuration
      config = response['Configuration']
      self.assertEqual(config['Runtime'], 'python3.9')
      self.assertEqual(config['Handler'], 'handler.handler')
      self.assertIn('TABLE_NAME', config['Environment']['Variables'])
      
    except ClientError as e:
      self.fail(f"Lambda function {function_name} not accessible: {e}")

  @mark.it("API Gateway exists and is accessible")
  def test_api_gateway_exists(self):
    """Test that API Gateway exists and is properly configured"""
    api_id = flat_outputs.get('ApiGatewayIdOutput')
    if not api_id:
      self.fail("API Gateway ID not available in deployment outputs")
    
    try:
      response = self.apigateway.get_rest_api(restApiId=api_id)
      self.assertEqual(response['name'], 'Item Service')
      
      # Check that the /item resource exists
      resources = self.apigateway.get_resources(restApiId=api_id)
      item_resource = None
      for resource in resources['items']:
        if resource.get('pathPart') == 'item' or resource.get('path') == '/item':
          item_resource = resource
          break
      
      self.assertIsNotNone(item_resource, "API Gateway /item resource not found")
      
    except ClientError as e:
      self.fail(f"API Gateway {api_id} not accessible: {e}")

  @mark.it("CloudWatch alarm exists")
  def test_cloudwatch_alarm_exists(self):
    """Test that CloudWatch alarm exists for Lambda errors"""
    alarm_name = flat_outputs.get('AlarmNameOutput')
    if not alarm_name:
      self.fail("CloudWatch alarm name not available in deployment outputs")
    
    try:
      response = self.cloudwatch.describe_alarms(AlarmNames=[alarm_name])
      self.assertEqual(len(response['MetricAlarms']), 1)
      
      alarm = response['MetricAlarms'][0]
      self.assertEqual(alarm['MetricName'], 'Errors')
      self.assertEqual(alarm['Threshold'], 1.0)
      self.assertEqual(alarm['EvaluationPeriods'], 1)
      
    except ClientError as e:
      self.fail(f"CloudWatch alarm {alarm_name} not accessible: {e}")

  @mark.it("End-to-end API workflow works")
  def test_api_end_to_end(self):
    """Test complete end-to-end workflow: API Gateway -> Lambda -> DynamoDB"""
    api_url = flat_outputs.get('ApiGatewayUrlOutput')
    if not api_url:
      self.fail("API Gateway URL not available in deployment outputs")
    
    # Make sure URL ends with item endpoint
    if not api_url.endswith('/'):
      api_url += '/'
    api_url += 'item'
    
    try:
      # Make GET request to API Gateway
      response = requests.get(api_url, timeout=30)
      
      # Check response status
      self.assertEqual(response.status_code, 200)
      
      # Check response content
      response_data = response.json()
      self.assertIn('message', response_data)
      self.assertIn('itemId', response_data)
      self.assertIn('tableName', response_data)
      
      # Verify that item was actually created in DynamoDB
      table_name = flat_outputs.get('DynamoTableNameOutput')
      if table_name:
        table = self.dynamodb.Table(table_name)
        item_id = response_data['itemId']
        
        # Check if item exists in DynamoDB
        db_response = table.get_item(Key={'itemId': item_id})
        self.assertIn('Item', db_response, "Item not found in DynamoDB")
        self.assertEqual(db_response['Item']['itemId'], item_id)
      
    except requests.RequestException as e:
      self.fail(f"API Gateway request failed: {e}")
    except ClientError as e:
      self.fail(f"DynamoDB verification failed: {e}")

  @mark.it("VPC and networking configuration")
  def test_vpc_configuration(self):
    """Test that VPC and networking are properly configured"""
    vpc_id = flat_outputs.get('VpcIdOutput')
    if not vpc_id:
      self.fail("VPC ID not available in deployment outputs")
    
    try:
      # Verify VPC exists
      vpcs = self.ec2.describe_vpcs(VpcIds=[vpc_id])
      self.assertEqual(len(vpcs['Vpcs']), 1)
      
      # Check that VPC has subnets
      subnets = self.ec2.describe_subnets(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
      )
      
      # Check for public subnets
      public_subnets = [s for s in subnets['Subnets'] if s.get('MapPublicIpOnLaunch', False)]
      self.assertGreaterEqual(len(public_subnets), 2, "VPC should have at least 2 public subnets")
      
    except ClientError as e:
      self.fail(f"VPC configuration check failed: {e}")

  @mark.it("Subnet configuration verification")
  def test_subnet_configuration(self):
    """Test that subnets are properly configured and accessible"""
    subnet_ids_str = flat_outputs.get('PublicSubnetIdsOutput')
    if not subnet_ids_str:
      self.fail("Public subnet IDs not available in deployment outputs")
    
    subnet_ids = subnet_ids_str.split(',')
    self.assertGreaterEqual(len(subnet_ids), 2, "Should have at least 2 public subnets")
    
    try:
      subnets = self.ec2.describe_subnets(SubnetIds=subnet_ids)
      
      for subnet in subnets['Subnets']:
        self.assertTrue(subnet.get('MapPublicIpOnLaunch', False), 
                       "Subnet should be configured to map public IPs")
        self.assertEqual(subnet['State'], 'available', 
                        "Subnet should be in available state")
      
    except ClientError as e:
      self.fail(f"Subnet configuration check failed: {e}")

  @mark.it("Internet Gateway configuration")
  def test_internet_gateway_configuration(self):
    """Test that Internet Gateway is properly configured"""
    igw_id = flat_outputs.get('InternetGatewayIdOutput')
    if not igw_id:
      self.fail("Internet Gateway ID not available in deployment outputs")
    
    vpc_id = flat_outputs.get('VpcIdOutput')
    if not vpc_id:
      self.fail("VPC ID not available in deployment outputs")
    
    try:
      # Verify Internet Gateway exists and is attached to VPC
      igws = self.ec2.describe_internet_gateways(InternetGatewayIds=[igw_id])
      self.assertEqual(len(igws['InternetGateways']), 1)
      
      igw = igws['InternetGateways'][0]
      self.assertEqual(igw['State'], 'available')
      
      # Check attachment to VPC
      attachments = igw.get('Attachments', [])
      self.assertEqual(len(attachments), 1)
      self.assertEqual(attachments[0]['VpcId'], vpc_id)
      self.assertEqual(attachments[0]['State'], 'available')
      
    except ClientError as e:
      self.fail(f"Internet Gateway configuration check failed: {e}")

  @mark.it("Lambda security group configuration")
  def test_lambda_security_group(self):
    """Test that Lambda security group is properly configured"""
    sg_id = flat_outputs.get('LambdaSecurityGroupIdOutput')
    if not sg_id:
      self.fail("Lambda security group ID not available in deployment outputs")
    
    vpc_id = flat_outputs.get('VpcIdOutput')
    if not vpc_id:
      self.fail("VPC ID not available in deployment outputs")
    
    try:
      # Verify security group exists
      sgs = self.ec2.describe_security_groups(GroupIds=[sg_id])
      self.assertEqual(len(sgs['SecurityGroups']), 1)
      
      sg = sgs['SecurityGroups'][0]
      self.assertEqual(sg['VpcId'], vpc_id)
      self.assertIn('Lambda', sg['Description'])
      
      # Check that outbound rules exist (allow all outbound)
      egress_rules = sg.get('IpPermissionsEgress', [])
      self.assertGreater(len(egress_rules), 0, "Security group should have outbound rules")
      
    except ClientError as e:
      self.fail(f"Lambda security group check failed: {e}")

  @mark.it("Lambda IAM role permissions")
  def test_lambda_iam_role_permissions(self):
    """Test that Lambda IAM role has correct permissions"""
    role_arn = flat_outputs.get('LambdaRoleArnOutput')
    if not role_arn:
      self.fail("Lambda role ARN not available in deployment outputs")
    
    role_name = flat_outputs.get('LambdaRoleNameOutput')
    if not role_name:
      self.fail("Lambda role name not available in deployment outputs")
    
    try:
      # Verify role exists
      role = self.iam.get_role(RoleName=role_name)
      self.assertEqual(role['Role']['Arn'], role_arn)
      
      # Check attached managed policies
      attached_policies = self.iam.list_attached_role_policies(RoleName=role_name)
      policy_names = [p['PolicyName'] for p in attached_policies['AttachedPolicies']]
      self.assertIn('AWSLambdaBasicExecutionRole', policy_names)
      
      # Check inline policies for DynamoDB and VPC permissions
      inline_policies = self.iam.list_role_policies(RoleName=role_name)
      self.assertGreater(len(inline_policies['PolicyNames']), 0, 
                        "Role should have inline policies for DynamoDB and VPC")
      
    except ClientError as e:
      self.fail(f"Lambda IAM role check failed: {e}")

  @mark.it("Lambda environment variables")
  def test_lambda_environment_variables(self):
    """Test that Lambda function has correct environment variables"""
    function_name = flat_outputs.get('LambdaFunctionNameOutput')
    if not function_name:
      self.fail("Lambda function name not available in deployment outputs")
    
    table_name = flat_outputs.get('DynamoTableNameOutput')
    if not table_name:
      self.fail("DynamoDB table name not available in deployment outputs")
    
    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      
      config = response['Configuration']
      env_vars = config.get('Environment', {}).get('Variables', {})
      
      self.assertIn('TABLE_NAME', env_vars, "Lambda should have TABLE_NAME environment variable")
      self.assertEqual(env_vars['TABLE_NAME'], table_name, 
                      "TABLE_NAME should match DynamoDB table name")
      
    except ClientError as e:
      self.fail(f"Lambda environment variables check failed: {e}")

  @mark.it("VPC CIDR block configuration")
  def test_vpc_cidr_block(self):
    """Test that VPC CIDR block is properly configured"""
    vpc_id = flat_outputs.get('VpcIdOutput')
    cidr_block = flat_outputs.get('VpcCidrBlockOutput')
    if not vpc_id or not cidr_block:
      self.fail("VPC ID or CIDR block not available in deployment outputs")
    
    try:
      vpcs = self.ec2.describe_vpcs(VpcIds=[vpc_id])
      vpc = vpcs['Vpcs'][0]
      
      self.assertEqual(vpc['CidrBlock'], cidr_block, "VPC CIDR block should match output")
      self.assertRegex(cidr_block, r'^\d+\.\d+\.\d+\.\d+/\d+$', "CIDR block should be valid format")
      
    except ClientError as e:
      self.fail(f"VPC CIDR block check failed: {e}")

  @mark.it("DynamoDB table ARN verification")
  def test_dynamodb_table_arn(self):
    """Test that DynamoDB table ARN is correctly configured"""
    table_name = flat_outputs.get('DynamoTableNameOutput')
    table_arn = flat_outputs.get('DynamoTableArnOutput')
    if not table_name or not table_arn:
      self.fail("DynamoDB table name or ARN not available in deployment outputs")
    
    try:
      table = self.dynamodb.Table(table_name)
      table_info = table.meta.client.describe_table(TableName=table_name)
      
      actual_arn = table_info['Table']['TableArn']
      self.assertEqual(actual_arn, table_arn, "Table ARN should match output")
      self.assertIn(table_name, table_arn, "Table ARN should contain table name")
      
    except ClientError as e:
      self.fail(f"DynamoDB table ARN check failed: {e}")

  @mark.it("Lambda function version verification")
  def test_lambda_function_version(self):
    """Test that Lambda function version is properly tracked"""
    function_name = flat_outputs.get('LambdaFunctionNameOutput')
    function_version = flat_outputs.get('LambdaFunctionVersionOutput')
    if not function_name or not function_version:
      self.fail("Lambda function name or version not available in deployment outputs")
    
    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      
      # Check that version is available and valid
      self.assertIsNotNone(function_version, "Lambda function version should be available")
      self.assertRegex(function_version, r'^\$LATEST$|^\d+$', 
                      "Function version should be $LATEST or numeric")
      
    except ClientError as e:
      self.fail(f"Lambda function version check failed: {e}")

  @mark.it("API Gateway stage name verification")
  def test_api_gateway_stage_name(self):
    """Test that API Gateway stage name is properly configured"""
    api_id = flat_outputs.get('ApiGatewayIdOutput')
    stage_name = flat_outputs.get('ApiGatewayStageNameOutput')
    if not api_id or not stage_name:
      self.fail("API Gateway ID or stage name not available in deployment outputs")
    
    try:
      stages = self.apigateway.get_stages(restApiId=api_id)
      
      # Check that the stage exists
      stage_names = [stage['stageName'] for stage in stages['item']]
      self.assertIn(stage_name, stage_names, f"Stage {stage_name} should exist in API Gateway")
      
      # Verify stage configuration
      stage_info = next(stage for stage in stages['item'] if stage['stageName'] == stage_name)
      self.assertIsNotNone(stage_info, "Stage information should be available")
      
    except ClientError as e:
      self.fail(f"API Gateway stage name check failed: {e}")