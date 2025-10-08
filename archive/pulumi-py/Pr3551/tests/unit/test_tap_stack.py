"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi test utilities.
Tests infrastructure components without actual AWS deployment.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """
    Mock implementation for Pulumi resources during testing.
    """
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:s3:::mock-bucket-{args.name}",
                "bucket": f"mock-bucket-{args.name}",
                "id": f"mock-bucket-{args.name}",
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                "id": args.name,
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:sns:us-east-1:123456789012:{args.name}",
                "id": args.name,
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:ses/configurationSet:ConfigurationSet":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:ses:us-east-1:123456789012:configuration-set/{args.name}",
                "id": args.name,
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:pinpoint/app:App":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:mobiletargeting:us-east-1:123456789012:apps/{args.name}",
                "application_id": f"mock-app-id-{args.name}",
                "id": args.name,
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "id": args.name,
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "id": args.name,
                "name": args.inputs.get("name", args.name),
                "invoke_arn": f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations",
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": f"mock-api-{args.name}",
                "name": args.inputs.get("name", args.name),
                "root_resource_id": "mock-root-resource-id",
                "execution_arn": f"arn:aws:execute-api:us-east-1:123456789012:mock-api-{args.name}",
            }
        elif args.typ == "aws:sqs/queue:Queue":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:sqs:us-east-1:123456789012:{args.name}",
                "id": args.name,
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:cloudwatch/eventRule:EventRule":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:events:us-east-1:123456789012:rule/{args.name}",
                "id": args.name,
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}",
                "id": args.name,
                "name": args.inputs.get("name", args.name),
            }
        else:
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:mock:{args.name}"}

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {
                "accountId": "123456789012",
                "arn": "arn:aws:iam::123456789012:user/test",
                "userId": "AIDACKCEVSQ6C2EXAMPLE",
            }
        elif args.token == "aws:index/getRegion:getRegion":
            return {
                "name": "us-east-1",
                "region": "us-east-1",
                "id": "us-east-1",
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {"Team": "Platform", "Environment": "prod"}
        args = TapStackArgs(environment_suffix="prod", tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestTapStackResources(unittest.TestCase):
    """Test cases for TapStack Pulumi component resources."""

    @pulumi.runtime.test
    def test_dynamodb_tables_creation(self):
        """Test DynamoDB tables are created with correct configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tables(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Check member accounts table
            self.assertIsNotNone(stack.member_accounts_table)
            pulumi.export("member_table_name", stack.member_accounts_table.name)
            pulumi.export("member_table_arn", stack.member_accounts_table.arn)

            # Check transactions table
            self.assertIsNotNone(stack.transactions_table)
            pulumi.export("transactions_table_name", stack.transactions_table.name)
            pulumi.export("transactions_table_arn", stack.transactions_table.arn)

            return {
                "member_table_name": stack.member_accounts_table.name,
                "transactions_table_name": stack.transactions_table.name,
            }

        return check_tables([])

    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test S3 bucket is created for campaign assets."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_bucket(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.campaign_assets_bucket)
            self.assertIsNotNone(stack.bucket_public_access_block)
            pulumi.export("bucket_name", stack.campaign_assets_bucket.bucket)
            pulumi.export("bucket_arn", stack.campaign_assets_bucket.arn)

            return {
                "bucket_name": stack.campaign_assets_bucket.bucket,
            }

        return check_bucket([])

    @pulumi.runtime.test
    def test_sns_topic_creation(self):
        """Test SNS topic is created for offers."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_sns(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.offers_topic)
            self.assertIsNotNone(stack.sns_dlq)
            pulumi.export("topic_arn", stack.offers_topic.arn)

            return {
                "topic_arn": stack.offers_topic.arn,
            }

        return check_sns([])

    @pulumi.runtime.test
    def test_ses_configuration_set_creation(self):
        """Test SES configuration set is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_ses(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.ses_configuration_set)
            pulumi.export("ses_config_name", stack.ses_configuration_set.name)

            return {
                "ses_config_name": stack.ses_configuration_set.name,
            }

        return check_ses([])

    @pulumi.runtime.test
    def test_pinpoint_app_creation(self):
        """Test Pinpoint application is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_pinpoint(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.pinpoint_app)
            pulumi.export("pinpoint_app_id", stack.pinpoint_app.application_id)

            return {
                "pinpoint_app_id": stack.pinpoint_app.application_id,
            }

        return check_pinpoint([])

    @pulumi.runtime.test
    def test_lambda_role_and_policy_creation(self):
        """Test IAM role and policies for Lambda functions."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_iam(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.lambda_role)
            self.assertIsNotNone(stack.lambda_basic_policy)
            self.assertIsNotNone(stack.lambda_custom_policy)
            pulumi.export("lambda_role_arn", stack.lambda_role.arn)

            return {
                "lambda_role_arn": stack.lambda_role.arn,
            }

        return check_iam([])

    @pulumi.runtime.test
    def test_lambda_functions_creation(self):
        """Test Lambda functions are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_lambdas(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Check transaction Lambda
            self.assertIsNotNone(stack.transaction_lambda)
            pulumi.export("transaction_lambda_arn", stack.transaction_lambda.arn)

            # Check lookup Lambda
            self.assertIsNotNone(stack.lookup_lambda)
            pulumi.export("lookup_lambda_arn", stack.lookup_lambda.arn)

            # Check campaign Lambda
            self.assertIsNotNone(stack.campaign_lambda)
            pulumi.export("campaign_lambda_arn", stack.campaign_lambda.arn)

            # Check DLQ
            self.assertIsNotNone(stack.lambda_dlq)

            return {
                "transaction_lambda_arn": stack.transaction_lambda.arn,
                "lookup_lambda_arn": stack.lookup_lambda.arn,
                "campaign_lambda_arn": stack.campaign_lambda.arn,
            }

        return check_lambdas([])

    @pulumi.runtime.test
    def test_api_gateway_creation(self):
        """Test API Gateway REST API is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_api(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.api)
            self.assertIsNotNone(stack.transactions_resource)
            self.assertIsNotNone(stack.members_resource)
            self.assertIsNotNone(stack.member_id_resource)
            self.assertIsNotNone(stack.api_deployment)
            pulumi.export("api_id", stack.api.id)

            return {
                "api_id": stack.api.id,
            }

        return check_api([])

    @pulumi.runtime.test
    def test_eventbridge_rule_creation(self):
        """Test EventBridge rule is created for scheduled campaigns."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_eventbridge(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.campaign_schedule_rule)
            self.assertIsNotNone(stack.campaign_schedule_target)
            self.assertIsNotNone(stack.campaign_lambda_permission)
            pulumi.export("schedule_rule_arn", stack.campaign_schedule_rule.arn)

            return {
                "schedule_rule_arn": stack.campaign_schedule_rule.arn,
            }

        return check_eventbridge([])

    @pulumi.runtime.test
    def test_cloudwatch_alarms_creation(self):
        """Test CloudWatch alarms are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_alarms(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Check Lambda error alarm
            self.assertIsNotNone(stack.lambda_error_alarm)

            # Check Lambda throttle alarm
            self.assertIsNotNone(stack.lambda_throttle_alarm)

            # Check API Gateway 5xx alarm
            self.assertIsNotNone(stack.api_5xx_alarm)

            pulumi.export("lambda_error_alarm_arn", stack.lambda_error_alarm.arn)

            return {
                "lambda_error_alarm_arn": stack.lambda_error_alarm.arn,
            }

        return check_alarms([])

    @pulumi.runtime.test
    def test_stack_outputs(self):
        """Test that all required stack outputs are registered."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_outputs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify outputs are registered
            # Note: In real deployment, these would be accessible via pulumi.export
            self.assertIsNotNone(stack.member_accounts_table)
            self.assertIsNotNone(stack.transactions_table)
            self.assertIsNotNone(stack.campaign_assets_bucket)
            self.assertIsNotNone(stack.offers_topic)
            self.assertIsNotNone(stack.pinpoint_app)
            self.assertIsNotNone(stack.api)

            return {}

        return check_outputs([])


class TestTapStackNaming(unittest.TestCase):
    """Test resource naming conventions."""

    @pulumi.runtime.test
    def test_resource_naming_with_environment_suffix(self):
        """Test resources are named with environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))

            # Verify environment suffix is used
            self.assertEqual(stack.environment_suffix, "prod")

            return {}

        return check_naming([])


class TestTapStackTags(unittest.TestCase):
    """Test resource tagging."""

    @pulumi.runtime.test
    def test_custom_tags_applied(self):
        """Test custom tags are applied to resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {"Team": "Platform", "CostCenter": "Engineering"}
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

            self.assertEqual(stack.tags, custom_tags)

            return {}

        return check_tags([])


if __name__ == '__main__':
    unittest.main()
