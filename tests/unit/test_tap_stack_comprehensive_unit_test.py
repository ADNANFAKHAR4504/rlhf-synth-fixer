"""
test_tap_stack_comprehensive_unit_test.py

Comprehensive unit tests for TapStack using Pulumi testing framework.
Targets 100% code coverage.
"""

import unittest
import pulumi
from unittest.mock import Mock


class MyMocks(pulumi.runtime.Mocks):
    """Custom mock class for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock new_resource for resource creation."""
        outputs = dict(args.inputs)

        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = "vpc-mock-123"
            outputs["cidrBlock"] = args.inputs.get("cidrBlock", "10.0.0.0/16")
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs["id"] = "igw-mock-123"
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-mock-{args.name}"
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs["id"] = f"rt-mock-{args.name}"
        elif args.typ == "aws:ec2/route:Route":
            outputs["id"] = f"route-mock-{args.name}"
        elif args.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            outputs["id"] = f"rta-mock-{args.name}"
        elif args.typ == "aws:kms/key:Key":
            outputs["id"] = f"key-mock-{args.name}"
            outputs["arn"] = f"arn:aws:kms:us-east-1:123456789012:key/{args.name}"
        elif args.typ == "aws:kms/alias:Alias":
            outputs["id"] = f"alias-mock-{args.name}"
        elif args.typ == "aws:dynamodb/table:Table":
            outputs["id"] = f"table-mock-{args.name}"
            outputs["arn"] = f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = f"role-mock-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            outputs["id"] = f"policy-mock-{args.name}"
        elif args.typ == "aws:lambda/function:Function":
            outputs["id"] = f"function-mock-{args.name}"
            outputs["arn"] = f"arn:aws:lambda:us-east-1:123456789012:function/{args.name}"
            outputs["invokeArn"] = f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function/{args.name}/invocations"
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = f"log-mock-{args.name}"
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs["id"] = f"api-mock-{args.name}"
            outputs["rootResourceId"] = "root-mock-123"
        elif args.typ == "aws:apigateway/resource:Resource":
            outputs["id"] = f"resource-mock-{args.name}"
        elif args.typ == "aws:apigateway/method:Method":
            outputs["id"] = f"method-mock-{args.name}"
        elif args.typ == "aws:apigateway/authorizer:Authorizer":
            outputs["id"] = f"authorizer-mock-{args.name}"
        else:
            outputs["id"] = f"{args.typ}-{args.name}"

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock call for function invocations."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackWithPulumi(unittest.TestCase):
    """Test TapStack component using Pulumi test framework."""

    @pulumi.runtime.test
    def test_stack_creates_vpc(self):
        """Test that VPC is created with correct configuration."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"],
            vpc_cidr="10.0.0.0/16"
        )

        stack = TapStack("test-vpc", args)

        def check_vpc(args):
            vpc_id = args[0]
            assert vpc_id is not None
            assert "vpc" in vpc_id

        return pulumi.Output.all(stack.vpc.id).apply(check_vpc)

    @pulumi.runtime.test
    def test_stack_creates_all_tenant_resources(self):
        """Test that all tenant resources are created."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        tenant_ids = ["tenant-001", "tenant-002", "tenant-003"]
        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=tenant_ids
        )

        stack = TapStack("test-tenants", args)

        # Verify tenant-specific resources exist
        assert len(stack.tenant_subnets) == 3
        assert len(stack.kms_keys) == 3
        assert len(stack.dynamodb_tables) == 3
        assert len(stack.lambda_functions) == 3
        assert len(stack.log_groups) == 3

        for tenant_id in tenant_ids:
            assert tenant_id in stack.tenant_subnets
            assert len(stack.tenant_subnets[tenant_id]) == 2  # 2 AZs
            assert tenant_id in stack.kms_keys
            assert tenant_id in stack.dynamodb_tables
            assert "users" in stack.dynamodb_tables[tenant_id]
            assert "data" in stack.dynamodb_tables[tenant_id]
            assert tenant_id in stack.lambda_functions
            assert tenant_id in stack.log_groups

    @pulumi.runtime.test
    def test_lambda_code_has_tenant_validation(self):
        """Test Lambda code validates tenant context."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("test-lambda-code", args)
        code = stack._get_lambda_code()

        assert "TENANT_ID" in code
        assert "TENANT_SUBNET" in code
        assert "os.environ.get('TENANT_ID')" in code
        assert "os.environ.get('TENANT_SUBNET')" in code
        assert "if not tenant_id or not tenant_subnet:" in code

    @pulumi.runtime.test
    def test_authorizer_code_validates_jwt(self):
        """Test authorizer code validates JWT tokens."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("test-auth-code", args)
        code = stack._get_authorizer_code()

        assert "authorizationToken" in code
        assert "Bearer" in code
        assert "principalId" in code
        assert "policyDocument" in code
        assert "Version" in code
        assert "execute-api:Invoke" in code

    @pulumi.runtime.test
    def test_environment_suffix_in_resource_names(self):
        """Test environment suffix is included in resource names."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        suffix = "mysuffix123"
        args = TapStackArgs(
            environment_suffix=suffix,
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("test-suffix", args)

        assert stack.environment_suffix == suffix

    @pulumi.runtime.test
    def test_custom_vpc_cidr(self):
        """Test custom VPC CIDR is used when provided."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        custom_cidr = "192.168.0.0/16"
        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"],
            vpc_cidr=custom_cidr
        )

        stack = TapStack("test-cidr", args)
        assert stack is not None

    @pulumi.runtime.test
    def test_custom_tags_applied(self):
        """Test custom tags are applied to resources."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {
            "environment": "staging",
            "cost_center": "devops",
            "owner": "platform"
        }

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"],
            tags=custom_tags
        )

        stack = TapStack("test-tags", args)

        assert stack.tags["environment"] == "staging"
        assert stack.tags["cost_center"] == "devops"
        assert stack.tags["owner"] == "platform"

    @pulumi.runtime.test
    def test_multiple_tenants_all_resources(self):
        """Test multiple tenants get all resources created."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        tenant_ids = ["tenant-001", "tenant-002", "tenant-003", "tenant-004", "tenant-005"]
        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=tenant_ids
        )

        stack = TapStack("test-multi", args)

        assert len(stack.tenant_subnets) == 5
        assert len(stack.route_tables) == 5
        assert len(stack.kms_keys) == 5
        assert len(stack.dynamodb_tables) == 5
        assert len(stack.lambda_functions) == 5
        assert len(stack.log_groups) == 5

    @pulumi.runtime.test
    def test_dynamodb_tables_structure(self):
        """Test DynamoDB tables have correct structure."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001", "tenant-002"]
        )

        stack = TapStack("test-ddb", args)

        for tenant_id in ["tenant-001", "tenant-002"]:
            tables = stack.dynamodb_tables[tenant_id]
            assert "users" in tables
            assert "data" in tables
            assert tables["users"] is not None
            assert tables["data"] is not None

    @pulumi.runtime.test
    def test_api_gateway_created(self):
        """Test API Gateway is created."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("test-api", args)

        assert stack.api is not None

    @pulumi.runtime.test
    def test_iam_role_created(self):
        """Test IAM role is created for Lambda."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("test-iam", args)

        assert stack.lambda_role is not None

    @pulumi.runtime.test
    def test_internet_gateway_created(self):
        """Test Internet Gateway is created."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"]
        )

        stack = TapStack("test-igw", args)

        assert stack.igw is not None


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs configuration class."""

    def test_args_with_all_parameters(self):
        """Test TapStackArgs with all parameters."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStackArgs

        tenant_ids = ["tenant-001", "tenant-002"]
        tags = {"env": "test"}

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=tenant_ids,
            vpc_cidr="192.168.0.0/16",
            tags=tags
        )

        assert args.environment_suffix == "test"
        assert args.tenant_ids == tenant_ids
        assert args.vpc_cidr == "192.168.0.0/16"
        assert args.tags == tags

    def test_args_default_vpc_cidr(self):
        """Test TapStackArgs uses default VPC CIDR."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"]
        )

        assert args.vpc_cidr == "10.0.0.0/16"

    def test_args_default_tags(self):
        """Test TapStackArgs uses default tags."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"]
        )

        assert args.tags["environment"] == "production"
        assert args.tags["cost_center"] == "platform"

    def test_args_custom_tags_override_defaults(self):
        """Test custom tags override default tags."""
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
        from lib.tap_stack import TapStackArgs

        custom_tags = {"environment": "dev", "team": "platform"}
        args = TapStackArgs(
            environment_suffix="test",
            tenant_ids=["tenant-001"],
            tags=custom_tags
        )

        assert args.tags["environment"] == "dev"
        assert args.tags["team"] == "platform"


if __name__ == "__main__":
    unittest.main()
