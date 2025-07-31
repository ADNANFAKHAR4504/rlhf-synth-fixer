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
      self.skipTest(
          "Integration tests require deployment outputs in cfn-outputs/flat-outputs.json")

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
      self.assertEqual(
          table_info['Table']['BillingModeSummary']['BillingMode'],
          'PAY_PER_REQUEST')
      self.assertEqual(table_info['Table']['KeySchema']
                       [0]['AttributeName'], 'itemId')
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
        if resource.get('pathPart') == 'item' or resource.get(
                'path') == '/item':
          item_resource = resource
          break

      self.assertIsNotNone(item_resource,
                           "API Gateway /item resource not found")

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
      public_subnets = [
          s for s in subnets['Subnets'] if s.get(
              'MapPublicIpOnLaunch', False)]
      self.assertGreaterEqual(
          len(public_subnets),
          2,
          "VPC should have at least 2 public subnets")

    except ClientError as e:
      self.fail(f"VPC configuration check failed: {e}")

  @mark.it("Subnet configuration verification")
  def test_subnet_configuration(self):
    """Test that subnets are properly configured and accessible"""
    subnet_ids_str = flat_outputs.get('PublicSubnetIdsOutput')
    if not subnet_ids_str:
      self.fail("Public subnet IDs not available in deployment outputs")

    subnet_ids = subnet_ids_str.split(',')
    self.assertGreaterEqual(
        len(subnet_ids),
        2,
        "Should have at least 2 public subnets")

    try:
      subnets = self.ec2.describe_subnets(SubnetIds=subnet_ids)

      for subnet in subnets['Subnets']:
        self.assertTrue(subnet.get('MapPublicIpOnLaunch', False),
                        "Subnet should be configured to map public IPs")
        self.assertEqual(subnet['State'], 'available',
                         "Subnet should be in available state")

    except ClientError as e:
      self.fail(f"Subnet configuration check failed: {e}")

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
      self.assertGreater(
          len(egress_rules),
          0,
          "Security group should have outbound rules")

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
      attached_policies = self.iam.list_attached_role_policies(
          RoleName=role_name)
      policy_names = [p['PolicyName']
                      for p in attached_policies['AttachedPolicies']]
      self.assertIn('AWSLambdaBasicExecutionRole', policy_names)

      # Check inline policies for DynamoDB and VPC permissions
      inline_policies = self.iam.list_role_policies(RoleName=role_name)
      self.assertGreater(
          len(
              inline_policies['PolicyNames']),
          0,
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

      self.assertIn(
          'TABLE_NAME',
          env_vars,
          "Lambda should have TABLE_NAME environment variable")
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

      self.assertEqual(
          vpc['CidrBlock'],
          cidr_block,
          "VPC CIDR block should match output")
      self.assertRegex(
          cidr_block,
          r'^\d+\.\d+\.\d+\.\d+/\d+$',
          "CIDR block should be valid format")

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
      self.assertIn(
          table_name,
          table_arn,
          "Table ARN should contain table name")

    except ClientError as e:
      self.fail(f"DynamoDB table ARN check failed: {e}")

  @mark.it("Lambda function version verification")
  def test_lambda_function_version(self):
    """Test that Lambda function version is properly tracked"""
    function_name = flat_outputs.get('LambdaFunctionNameOutput')
    function_version = flat_outputs.get('LambdaFunctionVersionOutput')
    if not function_name or not function_version:
      self.fail(
          "Lambda function name or version not available in deployment outputs")

    try:
      response = self.lambda_client.get_function(FunctionName=function_name)

      # Check that version is available and valid
      self.assertIsNotNone(function_version,
                           "Lambda function version should be available")
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
      self.assertIn(
          stage_name,
          stage_names,
          f"Stage {stage_name} should exist in API Gateway")

      # Verify stage configuration
      stage_info = next(
          stage for stage in stages['item'] if stage['stageName'] == stage_name)
      self.assertIsNotNone(stage_info, "Stage information should be available")

    except ClientError as e:
      self.fail(f"API Gateway stage name check failed: {e}")

  @mark.it("Lambda CloudWatch log group exists")
  def test_lambda_log_group(self):
    """Test that Lambda CloudWatch log group is properly created"""
    log_group_name = flat_outputs.get('LambdaLogGroupNameOutput')
    if not log_group_name:
      self.fail("Lambda log group name not available in deployment outputs")

    try:
      # Verify log group exists
      logs_client = boto3.client('logs')
      response = logs_client.describe_log_groups(
          logGroupNamePrefix=log_group_name)

      log_groups = [lg for lg in response['logGroups']
                    if lg['logGroupName'] == log_group_name]
      self.assertEqual(
          len(log_groups),
          1,
          f"Log group {log_group_name} should exist")

      log_group = log_groups[0]
      self.assertIn('/aws/lambda/', log_group['logGroupName'])

    except ClientError as e:
      self.fail(f"Lambda log group check failed: {e}")

  @mark.it("Route tables configuration")
  def test_route_tables_configuration(self):
    """Test that route tables are properly configured for public subnets"""
    route_table_ids_str = flat_outputs.get('PublicRouteTableIdsOutput')
    if not route_table_ids_str:
      self.fail("Public route table IDs not available in deployment outputs")

    vpc_id = flat_outputs.get('VpcIdOutput')
    igw_id = flat_outputs.get('InternetGatewayIdOutput')
    if not vpc_id or not igw_id:
      self.fail("VPC ID or Internet Gateway ID not available in deployment outputs")

    route_table_ids = route_table_ids_str.split(',')
    self.assertGreater(
        len(route_table_ids),
        0,
        "Should have at least one public route table")

    try:
      # Verify route tables exist and have routes to IGW
      route_tables = self.ec2.describe_route_tables(
          RouteTableIds=route_table_ids)

      for rt in route_tables['RouteTables']:
        self.assertEqual(
            rt['VpcId'],
            vpc_id,
            "Route table should be in correct VPC")

        # Check for route to Internet Gateway
        routes = rt.get('Routes', [])
        igw_route = None
        for route in routes:
          if route.get('GatewayId') == igw_id:
            igw_route = route
            break

        self.assertIsNotNone(
            igw_route, "Route table should have route to Internet Gateway")
        self.assertEqual(
            igw_route['State'],
            'active',
            "IGW route should be active")

    except ClientError as e:
      self.fail(f"Route tables configuration check failed: {e}")

  @mark.it("Lambda VPC subnet configuration")
  def test_lambda_vpc_subnets(self):
    """Test that Lambda VPC subnet configuration is correct"""
    lambda_subnet_ids_str = flat_outputs.get('LambdaSubnetIdsOutput')
    public_subnet_ids_str = flat_outputs.get('PublicSubnetIdsOutput')

    if not lambda_subnet_ids_str or not public_subnet_ids_str:
      self.fail("Lambda or public subnet IDs not available in deployment outputs")

    lambda_subnet_ids = set(lambda_subnet_ids_str.split(','))
    public_subnet_ids = set(public_subnet_ids_str.split(','))

    # Lambda should be deployed to the same subnets as public subnets
    self.assertEqual(lambda_subnet_ids, public_subnet_ids,
                     "Lambda should be deployed to the same public subnets")

    try:
      # Verify all subnets are accessible and public
      subnets = self.ec2.describe_subnets(SubnetIds=list(lambda_subnet_ids))

      for subnet in subnets['Subnets']:
        self.assertTrue(subnet.get('MapPublicIpOnLaunch', False),
                        "Lambda subnets should be public subnets")
        self.assertEqual(subnet['State'], 'available',
                         "Lambda subnets should be available")

    except ClientError as e:
      self.fail(f"Lambda VPC subnet check failed: {e}")

  @mark.it("API Gateway resource structure")
  def test_api_gateway_resource_structure(self):
    """Test that API Gateway resource structure is correct"""
    api_id = flat_outputs.get('ApiGatewayIdOutput')
    item_resource_id = flat_outputs.get('ApiGatewayItemResourceIdOutput')

    if not api_id or not item_resource_id:
      self.fail(
          "API Gateway ID or item resource ID not available in deployment outputs")

    try:
      # Verify resource exists and has correct configuration
      resource = self.apigateway.get_resource(
          restApiId=api_id, resourceId=item_resource_id)

      self.assertEqual(
          resource['pathPart'],
          'item',
          "Resource should have 'item' path part")
      self.assertIn(
          'resourceMethods',
          resource,
          "Resource should have methods")
      self.assertIn(
          'GET',
          resource['resourceMethods'],
          "Resource should have GET method")

      # Verify GET method configuration
      get_method = self.apigateway.get_method(
          restApiId=api_id,
          resourceId=item_resource_id,
          httpMethod='GET'
      )

      self.assertEqual(get_method['httpMethod'], 'GET')
      self.assertIn(
          'methodIntegration',
          get_method,
          "GET method should have integration")
      self.assertEqual(get_method['methodIntegration']['type'], 'AWS_PROXY',
                       "Should use Lambda proxy integration")

    except ClientError as e:
      self.fail(f"API Gateway resource structure check failed: {e}")

  @mark.it("DynamoDB table stream configuration")
  def test_dynamodb_stream_status(self):
    """Test that DynamoDB table stream status is as expected"""
    table_name = flat_outputs.get('DynamoTableNameOutput')
    stream_status = flat_outputs.get('DynamoTableStreamStatusOutput')

    if not table_name or not stream_status:
      self.fail(
          "DynamoDB table name or stream status not available in deployment outputs")

    try:
      table = self.dynamodb.Table(table_name)
      table_info = table.meta.client.describe_table(TableName=table_name)

      # Verify stream configuration matches output
      table_stream_spec = table_info['Table'].get('StreamSpecification')
      if stream_status == "DISABLED":
        self.assertIsNone(
            table_stream_spec,
            "Table should not have stream when status is DISABLED")
      else:
        self.assertIsNotNone(
            table_stream_spec,
            "Table should have stream configuration")
        self.assertTrue(table_stream_spec.get('StreamEnabled', False),
                        "Stream should be enabled when status is not DISABLED")

    except ClientError as e:
      self.fail(f"DynamoDB stream status check failed: {e}")

  @mark.it("Lambda memory and timeout configuration")
  def test_lambda_memory_timeout_configuration(self):
    """Test that Lambda function memory and timeout are properly configured"""
    function_name = flat_outputs.get('LambdaFunctionNameOutput')
    memory_size = flat_outputs.get('LambdaMemorySizeOutput')
    timeout_seconds = flat_outputs.get('LambdaTimeoutOutput')

    if not function_name or not memory_size or not timeout_seconds:
      self.fail("Lambda function configuration outputs not available")

    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      config = response['Configuration']

      self.assertEqual(config['MemorySize'], int(memory_size),
                       "Lambda memory size should match output")
      self.assertEqual(config['Timeout'], int(float(timeout_seconds)),
                       "Lambda timeout should match output")

      # Verify memory size is reasonable (between 128MB and 10240MB)
      self.assertGreaterEqual(
          int(memory_size),
          128,
          "Memory should be at least 128MB")
      self.assertLessEqual(
          int(memory_size),
          10240,
          "Memory should not exceed 10240MB")

    except ClientError as e:
      self.fail(f"Lambda memory/timeout configuration check failed: {e}")

  @mark.it("API Gateway deployment verification")
  def test_api_gateway_deployment(self):
    """Test that API Gateway deployment is properly configured"""
    api_id = flat_outputs.get('ApiGatewayIdOutput')
    deployment_id = flat_outputs.get('ApiGatewayDeploymentIdOutput')

    if not api_id or not deployment_id:
      self.fail(
          "API Gateway ID or deployment ID not available in deployment outputs")

    try:
      # Verify deployment exists
      deployment = self.apigateway.get_deployment(
          restApiId=api_id, deploymentId=deployment_id)

      self.assertIsNotNone(deployment, "API Gateway deployment should exist")
      self.assertEqual(
          deployment['id'],
          deployment_id,
          "Deployment ID should match output")

      # Verify deployment has been created (has a creation date)
      self.assertIn(
          'createdDate',
          deployment,
          "Deployment should have creation date")

    except ClientError as e:
      self.fail(f"API Gateway deployment check failed: {e}")

  @mark.it("DynamoDB table operational status")
  def test_dynamodb_table_operational_status(self):
    """Test that DynamoDB table operational status is correct"""
    table_name = flat_outputs.get('DynamoTableNameOutput')
    table_status = flat_outputs.get('DynamoTableStatusOutput')
    billing_mode = flat_outputs.get('DynamoTableBillingModeOutput')

    if not table_name or not table_status or not billing_mode:
      self.fail("DynamoDB table operational outputs not available")

    try:
      table = self.dynamodb.Table(table_name)
      table_info = table.meta.client.describe_table(TableName=table_name)

      # Verify table status
      actual_status = table_info['Table']['TableStatus']
      self.assertEqual(
          actual_status,
          table_status,
          "Table status should match output")

      # Verify billing mode
      actual_billing = table_info['Table']['BillingModeSummary']['BillingMode']
      self.assertEqual(
          actual_billing,
          billing_mode,
          "Billing mode should match output")

      # Verify table is operational
      self.assertEqual(
          actual_status,
          'ACTIVE',
          "Table should be in ACTIVE state")

    except ClientError as e:
      self.fail(f"DynamoDB table operational status check failed: {e}")

  @mark.it("Lambda security group rules verification")
  def test_lambda_security_group_rules(self):
    """Test that Lambda security group rules are properly configured"""
    sg_id = flat_outputs.get('LambdaSecurityGroupIdOutput')
    egress_rule_count = flat_outputs.get('LambdaSecurityGroupEgressRuleCount')

    if not sg_id or not egress_rule_count:
      self.fail("Lambda security group rule outputs not available")

    try:
      sgs = self.ec2.describe_security_groups(GroupIds=[sg_id])
      sg = sgs['SecurityGroups'][0]

      # Verify egress rules count
      actual_egress_count = len(sg.get('IpPermissionsEgress', []))
      self.assertEqual(actual_egress_count, int(egress_rule_count),
                       "Egress rules count should match output")

      # Verify outbound access is allowed (essential for Lambda in VPC)
      self.assertGreater(
          actual_egress_count,
          0,
          "Security group should have outbound rules for Lambda functionality")

    except ClientError as e:
      self.fail(f"Lambda security group rules check failed: {e}")

  @mark.it("VPC operational state verification")
  def test_vpc_operational_state(self):
    """Test that VPC operational state is correct"""
    vpc_id = flat_outputs.get('VpcIdOutput')
    vpc_tenancy = flat_outputs.get('VpcTenancyOutput')
    vpc_state = flat_outputs.get('VpcStateOutput')

    if not vpc_id or not vpc_tenancy or not vpc_state:
      self.fail("VPC operational outputs not available")

    try:
      vpcs = self.ec2.describe_vpcs(VpcIds=[vpc_id])
      vpc = vpcs['Vpcs'][0]

      # Verify VPC state
      actual_state = vpc['State']
      self.assertEqual(
          actual_state,
          vpc_state,
          "VPC state should match output")

      # Verify VPC tenancy
      actual_tenancy = vpc['InstanceTenancy']
      self.assertEqual(
          actual_tenancy,
          vpc_tenancy,
          "VPC tenancy should match output")

      # Verify VPC is operational
      self.assertEqual(
          actual_state,
          'available',
          "VPC should be in available state")
      self.assertEqual(
          actual_tenancy,
          'default',
          "VPC should use default tenancy for cost efficiency")

    except ClientError as e:
      self.fail(f"VPC operational state check failed: {e}")
