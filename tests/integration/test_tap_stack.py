import json
import os
import unittest
import boto3
from pytest import mark
from botocore.exceptions import ClientError

# LocalStack configuration
LOCALSTACK_ENDPOINT = os.environ.get("LOCALSTACK_ENDPOINT", "http://localhost:4566")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, "..", "..", "cfn-outputs", "flat-outputs.json"
)

# Check if deployment outputs are available
DEPLOYMENT_OUTPUTS_AVAILABLE = os.path.exists(flat_outputs_path)

if DEPLOYMENT_OUTPUTS_AVAILABLE:
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


def get_boto3_client(service_name):
    """Create a boto3 client configured for LocalStack"""
    return boto3.client(
        service_name,
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )


def get_boto3_resource(service_name):
    """Create a boto3 resource configured for LocalStack"""
    return boto3.resource(
        service_name,
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients for each test"""
        if not DEPLOYMENT_OUTPUTS_AVAILABLE:
            self.skipTest(
                "Integration tests require deployment outputs in cfn-outputs/flat-outputs.json"
            )

        # Use LocalStack clients with deployment outputs
        self.dynamodb = get_boto3_resource("dynamodb")
        self.lambda_client = get_boto3_client("lambda")
        self.apigateway = get_boto3_client("apigateway")
        self.cloudwatch = get_boto3_client("cloudwatch")
        self.iam = get_boto3_client("iam")
        self.ec2 = get_boto3_client("ec2")
        self.logs_client = get_boto3_client("logs")

    @mark.it("DynamoDB table exists and is accessible")
    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and has correct configuration"""
        table_name = flat_outputs.get("DynamoTableName")
        if not table_name:
            self.skipTest("DynamoDB table name not available in deployment outputs")

        try:
            table = self.dynamodb.Table(table_name)
            # Check table exists by calling describe
            table_info = table.meta.client.describe_table(TableName=table_name)

            # Verify table configuration
            self.assertEqual(
                table_info["Table"]["BillingModeSummary"]["BillingMode"],
                "PAY_PER_REQUEST",
            )
            self.assertEqual(
                table_info["Table"]["KeySchema"][0]["AttributeName"], "itemId"
            )
            self.assertEqual(table_info["Table"]["KeySchema"][0]["KeyType"], "HASH")

        except ClientError as e:
            self.fail(f"DynamoDB table {table_name} not accessible: {e}")

    @mark.it("Lambda function exists and is properly configured")
    def test_lambda_function_exists(self):
        """Test that Lambda function exists with correct configuration"""
        function_name = flat_outputs.get("LambdaFunctionName")
        if not function_name:
            self.skipTest("Lambda function name not available in deployment outputs")

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)

            # Verify function configuration
            config = response["Configuration"]
            self.assertEqual(config["Runtime"], "python3.9")
            self.assertEqual(config["Handler"], "handler.handler")
            self.assertIn("TABLE_NAME", config["Environment"]["Variables"])

        except ClientError as e:
            self.fail(f"Lambda function {function_name} not accessible: {e}")

    @mark.it("API Gateway exists and is accessible")
    def test_api_gateway_exists(self):
        """Test that API Gateway exists and is properly configured"""
        api_id = flat_outputs.get("ApiGatewayId")
        if not api_id:
            self.skipTest("API Gateway ID not available in deployment outputs")

        try:
            response = self.apigateway.get_rest_api(restApiId=api_id)
            self.assertEqual(response["name"], "Item Service")

            # Check that the /item resource exists
            resources = self.apigateway.get_resources(restApiId=api_id)
            item_resource = None
            for resource in resources["items"]:
                if (
                    resource.get("pathPart") == "item"
                    or resource.get("path") == "/item"
                ):
                    item_resource = resource
                    break

            self.assertIsNotNone(item_resource, "API Gateway /item resource not found")

        except ClientError as e:
            self.fail(f"API Gateway {api_id} not accessible: {e}")

    @mark.it("CloudWatch alarm exists")
    def test_cloudwatch_alarm_exists(self):
        """Test that CloudWatch alarm exists for Lambda errors"""
        alarm_name = flat_outputs.get("AlarmName")
        if not alarm_name:
            self.skipTest("CloudWatch alarm name not available in deployment outputs")

        try:
            response = self.cloudwatch.describe_alarms(AlarmNames=[alarm_name])
            self.assertEqual(len(response["MetricAlarms"]), 1)

            alarm = response["MetricAlarms"][0]
            self.assertEqual(alarm["MetricName"], "Errors")
            self.assertEqual(alarm["Threshold"], 1.0)
            self.assertEqual(alarm["EvaluationPeriods"], 1)

        except ClientError as e:
            self.fail(f"CloudWatch alarm {alarm_name} not accessible: {e}")

    @mark.it("VPC and networking configuration")
    def test_vpc_configuration(self):
        """Test that VPC and networking are properly configured"""
        vpc_id = flat_outputs.get("VpcId")
        if not vpc_id:
            self.skipTest("VPC ID not available in deployment outputs")

        try:
            # Verify VPC exists
            vpcs = self.ec2.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(vpcs["Vpcs"]), 1)

            # Check that VPC has subnets
            subnets = self.ec2.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )

            # Check for public subnets
            public_subnets = [
                s for s in subnets["Subnets"] if s.get("MapPublicIpOnLaunch", False)
            ]
            self.assertGreaterEqual(
                len(public_subnets), 2, "VPC should have at least 2 public subnets"
            )

        except ClientError as e:
            self.fail(f"VPC configuration check failed: {e}")

    @mark.it("Lambda security group configuration")
    def test_lambda_security_group(self):
        """Test that Lambda security group is properly configured"""
        sg_id = flat_outputs.get("LambdaSecurityGroupId")
        if not sg_id:
            self.skipTest(
                "Lambda security group ID not available in deployment outputs"
            )

        vpc_id = flat_outputs.get("VpcId")
        if not vpc_id:
            self.skipTest("VPC ID not available in deployment outputs")

        try:
            # Verify security group exists
            sgs = self.ec2.describe_security_groups(GroupIds=[sg_id])
            self.assertEqual(len(sgs["SecurityGroups"]), 1)

            sg = sgs["SecurityGroups"][0]
            self.assertEqual(sg["VpcId"], vpc_id)
            self.assertIn("Lambda", sg["Description"])

            # Check that outbound rules exist (allow all outbound)
            egress_rules = sg.get("IpPermissionsEgress", [])
            self.assertGreater(
                len(egress_rules), 0, "Security group should have outbound rules"
            )

        except ClientError as e:
            self.fail(f"Lambda security group check failed: {e}")

    @mark.it("Lambda IAM role permissions")
    def test_lambda_iam_role_permissions(self):
        """Test that Lambda IAM role has correct permissions"""
        role_arn = flat_outputs.get("LambdaRoleArn")
        if not role_arn:
            self.skipTest("Lambda role ARN not available in deployment outputs")

        role_name = flat_outputs.get("LambdaRoleName")
        if not role_name:
            self.skipTest("Lambda role name not available in deployment outputs")

        try:
            # Verify role exists
            role = self.iam.get_role(RoleName=role_name)
            self.assertEqual(role["Role"]["Arn"], role_arn)

            # Check attached managed policies
            attached_policies = self.iam.list_attached_role_policies(RoleName=role_name)
            policy_names = [
                p["PolicyName"] for p in attached_policies["AttachedPolicies"]
            ]
            self.assertIn("AWSLambdaBasicExecutionRole", policy_names)

            # Check inline policies for DynamoDB and VPC permissions
            inline_policies = self.iam.list_role_policies(RoleName=role_name)
            self.assertGreater(
                len(inline_policies["PolicyNames"]),
                0,
                "Role should have inline policies for DynamoDB and VPC",
            )

        except ClientError as e:
            self.fail(f"Lambda IAM role check failed: {e}")

    @mark.it("Lambda environment variables")
    def test_lambda_environment_variables(self):
        """Test that Lambda function has correct environment variables"""
        function_name = flat_outputs.get("LambdaFunctionName")
        if not function_name:
            self.skipTest("Lambda function name not available in deployment outputs")

        table_name = flat_outputs.get("DynamoTableName")
        if not table_name:
            self.skipTest("DynamoDB table name not available in deployment outputs")

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)

            config = response["Configuration"]
            env_vars = config.get("Environment", {}).get("Variables", {})

            self.assertIn(
                "TABLE_NAME",
                env_vars,
                "Lambda should have TABLE_NAME environment variable",
            )
            self.assertEqual(
                env_vars["TABLE_NAME"],
                table_name,
                "TABLE_NAME should match DynamoDB table name",
            )

        except ClientError as e:
            self.fail(f"Lambda environment variables check failed: {e}")

    @mark.it("VPC CIDR block configuration")
    def test_vpc_cidr_block(self):
        """Test that VPC CIDR block is properly configured"""
        vpc_id = flat_outputs.get("VpcId")
        cidr_block = flat_outputs.get("VpcCidrBlock")
        if not vpc_id or not cidr_block:
            self.skipTest("VPC ID or CIDR block not available in deployment outputs")

        try:
            vpcs = self.ec2.describe_vpcs(VpcIds=[vpc_id])
            vpc = vpcs["Vpcs"][0]

            self.assertEqual(
                vpc["CidrBlock"], cidr_block, "VPC CIDR block should match output"
            )
            self.assertRegex(
                cidr_block,
                r"^\d+\.\d+\.\d+\.\d+/\d+$",
                "CIDR block should be valid format",
            )

        except ClientError as e:
            self.fail(f"VPC CIDR block check failed: {e}")

    @mark.it("DynamoDB table ARN verification")
    def test_dynamodb_table_arn(self):
        """Test that DynamoDB table ARN is correctly configured"""
        table_name = flat_outputs.get("DynamoTableName")
        table_arn = flat_outputs.get("DynamoTableArn")
        if not table_name or not table_arn:
            self.skipTest(
                "DynamoDB table name or ARN not available in deployment outputs"
            )

        try:
            table = self.dynamodb.Table(table_name)
            table_info = table.meta.client.describe_table(TableName=table_name)

            actual_arn = table_info["Table"]["TableArn"]
            self.assertEqual(actual_arn, table_arn, "Table ARN should match output")
            self.assertIn(table_name, table_arn, "Table ARN should contain table name")

        except ClientError as e:
            self.fail(f"DynamoDB table ARN check failed: {e}")

    @mark.it("Lambda function ARN verification")
    def test_lambda_function_arn(self):
        """Test that Lambda function ARN is correctly configured"""
        function_name = flat_outputs.get("LambdaFunctionName")
        function_arn = flat_outputs.get("LambdaFunctionArn")
        if not function_name or not function_arn:
            self.skipTest(
                "Lambda function name or ARN not available in deployment outputs"
            )

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            actual_arn = response["Configuration"]["FunctionArn"]

            self.assertEqual(
                actual_arn, function_arn, "Function ARN should match output"
            )
            self.assertIn(
                function_name, function_arn, "Function ARN should contain function name"
            )

        except ClientError as e:
            self.fail(f"Lambda function ARN check failed: {e}")

    @mark.it("API Gateway URL verification")
    def test_api_gateway_url(self):
        """Test that API Gateway URL is properly configured"""
        api_id = flat_outputs.get("ApiGatewayId")
        api_url = flat_outputs.get("ApiGatewayUrl")
        if not api_id or not api_url:
            self.skipTest("API Gateway ID or URL not available in deployment outputs")

        try:
            # Verify API exists
            response = self.apigateway.get_rest_api(restApiId=api_id)
            self.assertIsNotNone(response, "API Gateway should exist")

            # Verify URL contains the API ID
            self.assertIn(api_id, api_url, "API URL should contain API ID")

        except ClientError as e:
            self.fail(f"API Gateway URL check failed: {e}")

    @mark.it("Lambda CloudWatch log group exists")
    def test_lambda_log_group(self):
        """Test that Lambda CloudWatch log group is properly created"""
        log_group_name = flat_outputs.get("LambdaLogGroupName")
        if not log_group_name:
            self.skipTest("Lambda log group name not available in deployment outputs")

        try:
            # Verify log group exists
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )

            log_groups = [
                lg
                for lg in response["logGroups"]
                if lg["logGroupName"] == log_group_name
            ]
            self.assertEqual(
                len(log_groups), 1, f"Log group {log_group_name} should exist"
            )

            log_group = log_groups[0]
            self.assertIn("/aws/lambda/", log_group["logGroupName"])

        except ClientError as e:
            self.fail(f"Lambda log group check failed: {e}")

    @mark.it("Lambda memory and timeout configuration")
    def test_lambda_memory_timeout_configuration(self):
        """Test that Lambda function memory and timeout are properly configured"""
        function_name = flat_outputs.get("LambdaFunctionName")
        if not function_name:
            self.skipTest("Lambda function name not available in deployment outputs")

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response["Configuration"]

            # Verify memory size is reasonable (between 128MB and 10240MB)
            self.assertGreaterEqual(
                config["MemorySize"], 128, "Memory should be at least 128MB"
            )
            self.assertLessEqual(
                config["MemorySize"], 10240, "Memory should not exceed 10240MB"
            )

            # Verify timeout is set
            self.assertGreater(config["Timeout"], 0, "Timeout should be greater than 0")

        except ClientError as e:
            self.fail(f"Lambda memory/timeout configuration check failed: {e}")

    @mark.it("VPC operational state verification")
    def test_vpc_operational_state(self):
        """Test that VPC operational state is correct"""
        vpc_id = flat_outputs.get("VpcId")
        if not vpc_id:
            self.skipTest("VPC ID not available in deployment outputs")

        try:
            vpcs = self.ec2.describe_vpcs(VpcIds=[vpc_id])
            vpc = vpcs["Vpcs"][0]

            # Verify VPC state
            actual_state = vpc["State"]
            self.assertEqual(
                actual_state, "available", "VPC should be in available state"
            )

            # Verify VPC tenancy
            actual_tenancy = vpc["InstanceTenancy"]
            self.assertEqual(
                actual_tenancy,
                "default",
                "VPC should use default tenancy for cost efficiency",
            )

        except ClientError as e:
            self.fail(f"VPC operational state check failed: {e}")

    @mark.it("Lambda security group rules verification")
    def test_lambda_security_group_rules(self):
        """Test that Lambda security group rules are properly configured"""
        sg_id = flat_outputs.get("LambdaSecurityGroupId")
        if not sg_id:
            self.skipTest(
                "Lambda security group ID not available in deployment outputs"
            )

        try:
            sgs = self.ec2.describe_security_groups(GroupIds=[sg_id])
            sg = sgs["SecurityGroups"][0]

            # Verify egress rules exist
            actual_egress_count = len(sg.get("IpPermissionsEgress", []))

            # Verify outbound access is allowed (essential for Lambda in VPC)
            self.assertGreater(
                actual_egress_count,
                0,
                "Security group should have outbound rules for Lambda functionality",
            )

        except ClientError as e:
            self.fail(f"Lambda security group rules check failed: {e}")

    @mark.it("DynamoDB table operational status")
    def test_dynamodb_table_operational_status(self):
        """Test that DynamoDB table operational status is correct"""
        table_name = flat_outputs.get("DynamoTableName")
        if not table_name:
            self.skipTest("DynamoDB table name not available in deployment outputs")

        try:
            table = self.dynamodb.Table(table_name)
            table_info = table.meta.client.describe_table(TableName=table_name)

            # Verify table status
            actual_status = table_info["Table"]["TableStatus"]
            self.assertEqual(actual_status, "ACTIVE", "Table should be in ACTIVE state")

            # Verify billing mode
            actual_billing = table_info["Table"]["BillingModeSummary"]["BillingMode"]
            self.assertEqual(
                actual_billing,
                "PAY_PER_REQUEST",
                "Billing mode should be PAY_PER_REQUEST",
            )

        except ClientError as e:
            self.fail(f"DynamoDB table operational status check failed: {e}")

    @mark.it("API Gateway has item resource with GET method")
    def test_api_gateway_item_resource(self):
        """Test that API Gateway has /item resource with GET method"""
        api_id = flat_outputs.get("ApiGatewayId")
        if not api_id:
            self.skipTest("API Gateway ID not available in deployment outputs")

        try:
            # Get all resources
            resources = self.apigateway.get_resources(restApiId=api_id)

            # Find /item resource
            item_resource = None
            for resource in resources["items"]:
                if resource.get("pathPart") == "item":
                    item_resource = resource
                    break

            self.assertIsNotNone(
                item_resource, "API Gateway should have /item resource"
            )

            # Check GET method exists
            self.assertIn(
                "resourceMethods", item_resource, "Resource should have methods"
            )
            self.assertIn(
                "GET",
                item_resource["resourceMethods"],
                "Resource should have GET method",
            )

        except ClientError as e:
            self.fail(f"API Gateway item resource check failed: {e}")

    @mark.it("Subnet configuration verification")
    def test_subnet_configuration(self):
        """Test that subnets are properly configured and accessible"""
        vpc_id = flat_outputs.get("VpcId")
        if not vpc_id:
            self.skipTest("VPC ID not available in deployment outputs")

        try:
            # Get subnets for the VPC
            subnets = self.ec2.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )

            self.assertGreaterEqual(
                len(subnets["Subnets"]), 2, "Should have at least 2 subnets"
            )

            for subnet in subnets["Subnets"]:
                self.assertEqual(
                    subnet["State"], "available", "Subnet should be in available state"
                )

        except ClientError as e:
            self.fail(f"Subnet configuration check failed: {e}")

    @mark.it("Lambda VPC configuration")
    def test_lambda_vpc_configuration(self):
        """Test that Lambda is configured with VPC"""
        function_name = flat_outputs.get("LambdaFunctionName")
        vpc_id = flat_outputs.get("VpcId")
        sg_id = flat_outputs.get("LambdaSecurityGroupId")

        if not function_name or not vpc_id:
            self.skipTest(
                "Lambda function name or VPC ID not available in deployment outputs"
            )

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response["Configuration"]

            # Verify Lambda has VPC configuration
            self.assertIn("VpcConfig", config, "Lambda should have VPC configuration")
            vpc_config = config["VpcConfig"]

            # Verify subnet IDs are present
            self.assertGreater(
                len(vpc_config.get("SubnetIds", [])),
                0,
                "Lambda should be configured with subnets",
            )

            # Verify security group is present
            if sg_id:
                self.assertIn(
                    sg_id,
                    vpc_config.get("SecurityGroupIds", []),
                    "Lambda should use the configured security group",
                )

        except ClientError as e:
            self.fail(f"Lambda VPC configuration check failed: {e}")
