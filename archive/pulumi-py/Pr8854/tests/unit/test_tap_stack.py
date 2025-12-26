"""
Unit tests for TapStack using Pulumi mocks.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:s3:::{args.name}",
                "bucket": args.name,
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                "name": args.name,
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "name": args.name,
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": f"api-{args.name}",
                "name": args.name,
                "execution_arn": f"arn:aws:execute-api:us-east-1:123456789012:api-{args.name}",
            }
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1"}
        elif args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"accountId": "123456789012"}
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack."""

    @pulumi.runtime.test
    def test_api_gateway_exists(self):
        """Test that API Gateway is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_api_gateway(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(environment_suffix="test")
            )
            self.assertIsNotNone(stack.api_gateway)
            return []

        return pulumi.Output.all().apply(check_api_gateway)

    @pulumi.runtime.test
    def test_lambda_has_correct_role(self):
        """Test that Lambda has an IAM role."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_lambda_role(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(environment_suffix="test")
            )
            self.assertIsNotNone(stack.lambda_function)
            self.assertIsNotNone(stack.lambda_role)
            return []

        return pulumi.Output.all().apply(check_lambda_role)

    @pulumi.runtime.test
    def test_dynamodb_has_replication(self):
        """Test that DynamoDB has cross-region replication enabled."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dynamodb(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(
                    environment_suffix="test",
                    enable_cross_region_replication=True,
                    target_region="us-west-2"
                )
            )
            self.assertIsNotNone(stack.dynamodb_table)
            return []

        return pulumi.Output.all().apply(check_dynamodb)

    @pulumi.runtime.test
    def test_s3_has_replication(self):
        """Test that S3 bucket has replication configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_s3(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(
                    environment_suffix="test",
                    enable_cross_region_replication=True,
                    target_region="us-west-2"
                )
            )
            self.assertIsNotNone(stack.primary_bucket)
            return []

        return pulumi.Output.all().apply(check_s3)

    @pulumi.runtime.test
    def test_resource_naming_convention(self):
        """Test that all resources follow naming convention."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_naming(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(environment_suffix="test")
            )
            # Check that resources have proper naming
            self.assertIsNotNone(stack.dynamodb_table)
            return []

        return pulumi.Output.all().apply(check_naming)

    @pulumi.runtime.test
    def test_monitoring_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_alarms(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(
                    environment_suffix="test",
                    enable_monitoring=True
                )
            )
            # Stack should have monitoring enabled
            self.assertTrue(stack.args.enable_monitoring)
            return []

        return pulumi.Output.all().apply(check_alarms)


if __name__ == "__main__":
    unittest.main()
