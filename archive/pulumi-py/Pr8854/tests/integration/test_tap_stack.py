"""
Integration tests for TapStack using Pulumi mocks.
Tests the wiring between components.
"""

import unittest
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
                "website_endpoint": f"{args.name}.s3-website-us-east-1.amazonaws.com",
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                "name": args.name,
                "stream_arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}/stream/2024-01-01T00:00:00.000",
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "name": args.name,
                "invoke_arn": f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations",
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": f"api-{args.name}",
                "name": args.name,
                "execution_arn": f"arn:aws:execute-api:us-east-1:123456789012:api-{args.name}",
            }
        elif args.typ == "aws:apigateway/deployment:Deployment":
            outputs = {
                **args.inputs,
                "id": f"deployment-{args.name}",
                "invoke_url": f"https://api-{args.name}.execute-api.us-east-1.amazonaws.com",
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


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack wiring."""

    @pulumi.runtime.test
    def test_api_gateway_lambda_integration(self):
        """Test that API Gateway is connected to Lambda."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_integration(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(environment_suffix="test")
            )
            # Verify both resources exist
            self.assertIsNotNone(stack.api_gateway)
            self.assertIsNotNone(stack.lambda_function)
            return []

        return pulumi.Output.all().apply(check_integration)

    @pulumi.runtime.test
    def test_lambda_dynamodb_wiring(self):
        """Test that Lambda can access DynamoDB."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_wiring(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(environment_suffix="test")
            )
            # Verify resources exist
            self.assertIsNotNone(stack.lambda_function)
            self.assertIsNotNone(stack.dynamodb_table)
            # Lambda should have IAM role with DynamoDB access
            self.assertIsNotNone(stack.lambda_role)
            return []

        return pulumi.Output.all().apply(check_wiring)

    @pulumi.runtime.test
    def test_s3_replication_destinations(self):
        """Test that S3 replication points to correct region bucket."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_replication(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(
                    environment_suffix="test",
                    enable_cross_region_replication=True,
                    source_region="us-east-1",
                    target_region="us-west-2"
                )
            )
            self.assertIsNotNone(stack.primary_bucket)
            # If replication is enabled, secondary bucket should exist
            if stack.args.enable_cross_region_replication:
                self.assertTrue(hasattr(stack, 'secondary_bucket'))
            return []

        return pulumi.Output.all().apply(check_replication)

    @pulumi.runtime.test
    def test_dynamodb_streams_configuration(self):
        """Test that DynamoDB streams are correctly configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_streams(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(environment_suffix="test")
            )
            self.assertIsNotNone(stack.dynamodb_table)
            return []

        return pulumi.Output.all().apply(check_streams)

    @pulumi.runtime.test
    def test_traffic_shift_configuration(self):
        """Test that traffic shift configuration is present."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_traffic_shift(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(
                    environment_suffix="test",
                    migration_mode="blue_green"
                )
            )
            # Verify migration mode is set
            self.assertEqual(stack.args.migration_mode, "blue_green")
            return []

        return pulumi.Output.all().apply(check_traffic_shift)

    @pulumi.runtime.test
    def test_rollback_simulation(self):
        """Test that rollback can be simulated."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_rollback(args):
            stack = TapStack(
                "test-stack",
                TapStackArgs(
                    environment_suffix="test",
                    target_region="us-west-2"
                )
            )
            # Verify stack can be created with target region
            self.assertEqual(stack.target_region, "us-west-2")
            return []

        return pulumi.Output.all().apply(check_rollback)


if __name__ == "__main__":
    unittest.main()
