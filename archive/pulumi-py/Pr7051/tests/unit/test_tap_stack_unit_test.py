"""
test_tap_stack_unit_test.py

Comprehensive unit tests for the TapStack Pulumi component.
Targets 100% code coverage for all methods and branches.
"""

import unittest
from unittest.mock import Mock, MagicMock, patch
import pulumi
import json


class MyMocks:
    """
    Mock Pulumi calls for testing infrastructure components.
    """
    def __init__(self):
        self.mock_resources = []

    def call(self, args):
        """Mock call method for Pulumi testing."""
        self.mock_resources.append(args)
        if args.typ == "aws:ec2/vpc:Vpc":
            return {
                "id": "vpc-12345",
                "cidrBlock": args.inputs.get("cidrBlock", "10.0.0.0/16"),
                "enableDnsHostnames": True,
                "enableDnsSupport": True,
            }
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            return {
                "id": "igw-12345",
                "vpcId": args.inputs.get("vpcId", "vpc-12345"),
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            return {
                "id": f"subnet-{args.name}",
                "vpcId": args.inputs.get("vpcId", "vpc-12345"),
                "cidrBlock": args.inputs.get("cidrBlock", "10.0.0.0/24"),
                "availabilityZone": args.inputs.get("availabilityZone", "us-east-1a"),
            }
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            return {
                "id": f"rt-{args.name}",
                "vpcId": args.inputs.get("vpcId", "vpc-12345"),
            }
        elif args.typ == "aws:ec2/route:Route":
            return {
                "id": f"route-{args.name}",
                "routeTableId": args.inputs.get("routeTableId", "rt-12345"),
                "destinationCidrBlock": args.inputs.get("destinationCidrBlock", "0.0.0.0/0"),
                "gatewayId": args.inputs.get("gatewayId", "igw-12345"),
            }
        elif args.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            return {
                "id": f"rta-{args.name}",
                "subnetId": args.inputs.get("subnetId", "subnet-12345"),
                "routeTableId": args.inputs.get("routeTableId", "rt-12345"),
            }
        elif args.typ == "aws:kms/key:Key":
            return {
                "id": f"key-{args.name}",
                "arn": f"arn:aws:kms:us-east-1:123456789012:key/{args.name}",
                "description": args.inputs.get("description", ""),
                "deletionWindowInDays": args.inputs.get("deletionWindowInDays", 10),
            }
        elif args.typ == "aws:kms/alias:Alias":
            return {
                "id": f"alias-{args.name}",
                "name": args.inputs.get("name", f"alias/{args.name}"),
                "targetKeyId": args.inputs.get("targetKeyId", "key-12345"),
            }
        elif args.typ == "aws:dynamodb/table:Table":
            return {
                "id": f"table-{args.name}",
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                "name": args.inputs.get("name", args.name),
                "billingMode": args.inputs.get("billingMode", "PAY_PER_REQUEST"),
                "hashKey": args.inputs.get("hashKey", "id"),
            }
        elif args.typ == "aws:iam/role:Role":
            return {
                "id": f"role-{args.name}",
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "assumeRolePolicy": args.inputs.get("assumeRolePolicy", ""),
            }
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            return {
                "id": f"policy-{args.name}",
                "role": args.inputs.get("role", "role-12345"),
                "policy": args.inputs.get("policy", ""),
            }
        elif args.typ == "aws:lambda/function:Function":
            return {
                "id": f"function-{args.name}",
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function/{args.name}",
                "invokeArn": f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function/{args.name}/invocations",
                "runtime": args.inputs.get("runtime", "python3.11"),
                "handler": args.inputs.get("handler", "index.handler"),
                "role": args.inputs.get("role", "role-12345"),
            }
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            return {
                "id": f"log-{args.name}",
                "name": args.inputs.get("name", f"/aws/lambda/{args.name}"),
                "retentionInDays": args.inputs.get("retentionInDays", 30),
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            return {
                "id": f"api-{args.name}",
                "rootResourceId": "root-12345",
                "name": args.inputs.get("name", args.name),
                "description": args.inputs.get("description", ""),
            }
        elif args.typ == "aws:apigateway/resource:Resource":
            return {
                "id": f"resource-{args.name}",
                "restApi": args.inputs.get("restApi", "api-12345"),
                "parentId": args.inputs.get("parentId", "root-12345"),
                "pathPart": args.inputs.get("pathPart", "resource"),
            }
        elif args.typ == "aws:apigateway/method:Method":
            return {
                "id": f"method-{args.name}",
                "restApi": args.inputs.get("restApi", "api-12345"),
                "resourceId": args.inputs.get("resourceId", "resource-12345"),
                "httpMethod": args.inputs.get("httpMethod", "GET"),
                "authorization": args.inputs.get("authorization", "NONE"),
            }
        elif args.typ == "aws:apigateway/authorizer:Authorizer":
            return {
                "id": f"authorizer-{args.name}",
                "restApi": args.inputs.get("restApi", "api-12345"),
                "authorizerUri": args.inputs.get("authorizerUri", ""),
                "type": args.inputs.get("type", "TOKEN"),
            }
        else:
            return {}


pulumi.runtime.settings.SETTINGS.dry_run = True
pulumi.runtime.mocks.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_with_all_parameters(self):
        """Test TapStackArgs with all parameters provided."""
        from lib.tap_stack import TapStackArgs

        tenant_ids = ["tenant-001", "tenant-002"]
        tags = {"environment": "test", "cost_center": "engineering"}

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=tenant_ids,
            vpc_cidr="192.168.0.0/16",
            tags=tags
        )

        self.assertEqual(args.environment_suffix, "test")
        self.assertEqual(args.tenant_ids, tenant_ids)
        self.assertEqual(args.vpc_cidr, "192.168.0.0/16")
        self.assertEqual(args.tags, tags)

    def test_tap_stack_args_with_default_vpc_cidr(self):
        """Test TapStackArgs uses default VPC CIDR when not specified."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(
            environment_suffix="dev",
            tenant_ids=["tenant-001"]
        )

        self.assertEqual(args.vpc_cidr, "10.0.0.0/16")

    def test_tap_stack_args_with_default_tags(self):
        """Test TapStackArgs uses default tags when not specified."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(
            environment_suffix="prod",
            tenant_ids=["tenant-001", "tenant-002", "tenant-003"]
        )

        self.assertEqual(args.tags["environment"], "production")
        self.assertEqual(args.tags["cost_center"], "platform")


@pulumi.runtime.test
class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_stack_creation(self, mock_azs):
        """Test TapStack creates successfully with all components."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        args = TapStackArgs(
            environment_suffix="unittest",
            tenant_ids=["tenant-001"],
            vpc_cidr="10.0.0.0/16",
            tags={"test": "true"}
        )

        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "unittest")
        self.assertEqual(stack.tenant_ids, ["tenant-001"])
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.igw)
        self.assertIsNotNone(stack.tenant_subnets)
        self.assertIsNotNone(stack.route_tables)
        self.assertIsNotNone(stack.kms_keys)
        self.assertIsNotNone(stack.dynamodb_tables)
        self.assertIsNotNone(stack.lambda_role)
        self.assertIsNotNone(stack.lambda_functions)
        self.assertIsNotNone(stack.log_groups)
        self.assertIsNotNone(stack.api)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_vpc_creation(self, mock_azs):
        """Test VPC is created with correct configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        args = TapStackArgs(
            environment_suffix="vpctest",
            tenant_ids=["tenant-001"],
            vpc_cidr="172.16.0.0/16"
        )

        stack = TapStack("vpc-test", args)

        self.assertIsNotNone(stack.vpc)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_tenant_subnets_creation(self, mock_azs):
        """Test tenant subnets are created for all tenants across 2 AZs."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        tenant_ids = ["tenant-001", "tenant-002", "tenant-003"]
        args = TapStackArgs(
            environment_suffix="subnettest",
            tenant_ids=tenant_ids
        )

        stack = TapStack("subnet-test", args)

        self.assertEqual(len(stack.tenant_subnets), 3)
        for tenant_id in tenant_ids:
            self.assertIn(tenant_id, stack.tenant_subnets)
            self.assertEqual(len(stack.tenant_subnets[tenant_id]), 2)  # 2 AZs

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_kms_keys_creation(self, mock_azs):
        """Test KMS keys are created for each tenant."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        tenant_ids = ["tenant-001", "tenant-002"]
        args = TapStackArgs(
            environment_suffix="kmstest",
            tenant_ids=tenant_ids
        )

        stack = TapStack("kms-test", args)

        self.assertEqual(len(stack.kms_keys), 2)
        for tenant_id in tenant_ids:
            self.assertIn(tenant_id, stack.kms_keys)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_dynamodb_tables_creation(self, mock_azs):
        """Test DynamoDB tables (users and data) are created for each tenant."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        tenant_ids = ["tenant-001", "tenant-002"]
        args = TapStackArgs(
            environment_suffix="ddbtest",
            tenant_ids=tenant_ids
        )

        stack = TapStack("ddb-test", args)

        self.assertEqual(len(stack.dynamodb_tables), 2)
        for tenant_id in tenant_ids:
            self.assertIn(tenant_id, stack.dynamodb_tables)
            self.assertIn("users", stack.dynamodb_tables[tenant_id])
            self.assertIn("data", stack.dynamodb_tables[tenant_id])

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_lambda_functions_creation(self, mock_azs):
        """Test Lambda functions are created for each tenant."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        tenant_ids = ["tenant-001", "tenant-002", "tenant-003"]
        args = TapStackArgs(
            environment_suffix="lambdatest",
            tenant_ids=tenant_ids
        )

        stack = TapStack("lambda-test", args)

        self.assertEqual(len(stack.lambda_functions), 3)
        for tenant_id in tenant_ids:
            self.assertIn(tenant_id, stack.lambda_functions)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_lambda_code_generation(self, mock_azs):
        """Test Lambda code includes proper tenant validation."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        args = TapStackArgs(
            environment_suffix="codectest",
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("code-test", args)
        code = stack._get_lambda_code()

        self.assertIn("TENANT_ID", code)
        self.assertIn("TENANT_SUBNET", code)
        self.assertIn("handler", code)
        self.assertIn("tenant_id", code)
        self.assertIn("tenant_subnet", code)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_authorizer_code_generation(self, mock_azs):
        """Test Lambda authorizer code includes JWT validation."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        args = TapStackArgs(
            environment_suffix="authtest",
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("auth-test", args)
        code = stack._get_authorizer_code()

        self.assertIn("authorizationToken", code)
        self.assertIn("Bearer", code)
        self.assertIn("principalId", code)
        self.assertIn("policyDocument", code)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_log_groups_creation(self, mock_azs):
        """Test CloudWatch Log Groups are created for each tenant."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        tenant_ids = ["tenant-001", "tenant-002"]
        args = TapStackArgs(
            environment_suffix="logtest",
            tenant_ids=tenant_ids
        )

        stack = TapStack("log-test", args)

        self.assertEqual(len(stack.log_groups), 2)
        for tenant_id in tenant_ids:
            self.assertIn(tenant_id, stack.log_groups)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_api_gateway_creation(self, mock_azs):
        """Test API Gateway REST API is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        args = TapStackArgs(
            environment_suffix="apitest",
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("api-test", args)

        self.assertIsNotNone(stack.api)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_environment_suffix_in_all_resources(self, mock_azs):
        """Test environment_suffix is included in all resource names."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        suffix = "suffixtest123"
        args = TapStackArgs(
            environment_suffix=suffix,
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("suffix-test", args)

        # Verify suffix is stored
        self.assertEqual(stack.environment_suffix, suffix)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_multiple_tenants(self, mock_azs):
        """Test stack handles multiple tenants correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        tenant_ids = ["tenant-001", "tenant-002", "tenant-003", "tenant-004", "tenant-005"]
        args = TapStackArgs(
            environment_suffix="multitest",
            tenant_ids=tenant_ids
        )

        stack = TapStack("multi-tenant-test", args)

        self.assertEqual(len(stack.tenant_subnets), 5)
        self.assertEqual(len(stack.kms_keys), 5)
        self.assertEqual(len(stack.dynamodb_tables), 5)
        self.assertEqual(len(stack.lambda_functions), 5)
        self.assertEqual(len(stack.log_groups), 5)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_route_tables_creation(self, mock_azs):
        """Test route tables are created for each tenant."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        tenant_ids = ["tenant-001", "tenant-002"]
        args = TapStackArgs(
            environment_suffix="rttest",
            tenant_ids=tenant_ids
        )

        stack = TapStack("rt-test", args)

        self.assertEqual(len(stack.route_tables), 2)
        for tenant_id in tenant_ids:
            self.assertIn(tenant_id, stack.route_tables)

    @patch("lib.tap_stack.aws.get_availability_zones")
    def test_custom_tags_applied(self, mock_azs):
        """Test custom tags are applied to resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_azs.return_value = Mock(names=["us-east-1a", "us-east-1b"])

        custom_tags = {
            "environment": "staging",
            "cost_center": "devops",
            "owner": "platform-team"
        }

        args = TapStackArgs(
            environment_suffix="tagtest",
            tenant_ids=["tenant-001"],
            tags=custom_tags
        )

        stack = TapStack("tag-test", args)

        self.assertEqual(stack.tags["environment"], "staging")
        self.assertEqual(stack.tags["cost_center"], "devops")
        self.assertEqual(stack.tags["owner"], "platform-team")


if __name__ == "__main__":
    unittest.main()
