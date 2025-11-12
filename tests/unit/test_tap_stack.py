"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi testing"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation"""
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-12345",
                "arn": "arn:aws:ec2:us-east-2:123456789012:vpc/vpc-12345",
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "arn": f"arn:aws:ec2:us-east-2:123456789012:subnet/subnet-{args.name}",
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "id": f"lambda-{args.name}",
                "arn": f"arn:aws:lambda:us-east-2:123456789012:function:{args.name}",
                "invoke_arn": (
                    f"arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/"
                    f"arn:aws:lambda:us-east-2:123456789012:function:{args.name}/invocations"
                ),
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "id": f"table-{args.name}",
                "arn": f"arn:aws:dynamodb:us-east-2:123456789012:table/{args.name}",
            }
        elif args.typ == "aws:sqs/queue:Queue":
            outputs = {
                **args.inputs,
                "id": f"queue-{args.name}",
                "arn": f"arn:aws:sqs:us-east-2:123456789012:{args.name}",
                "url": f"https://sqs.us-east-2.amazonaws.com/123456789012/{args.name}",
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                **args.inputs,
                "id": f"topic-{args.name}",
                "arn": f"arn:aws:sns:us-east-2:123456789012:{args.name}",
            }
        elif args.typ == "aws:kms/key:Key":
            outputs = {
                **args.inputs,
                "id": f"key-{args.name}",
                "arn": f"arn:aws:kms:us-east-2:123456789012:key/{args.name}",
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": f"api-{args.name}",
                "execution_arn": f"arn:aws:execute-api:us-east-2:123456789012:{args.name}",
                "root_resource_id": "root123",
            }
        elif args.typ == "aws:cloudwatch/dashboard:Dashboard":
            outputs = {
                **args.inputs,
                "dashboard_name": args.inputs.get("dashboard_name", args.name),
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": f"role-{args.name}",
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
            }
        elif args.typ == "aws:wafv2/webAcl:WebAcl":
            outputs = {
                **args.inputs,
                "id": f"waf-{args.name}",
                "arn": f"arn:aws:wafv2:us-east-2:123456789012:regional/webacl/{args.name}/12345",
            }
        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls"""
        if args.token == "aws:iam/getPolicyDocument:getPolicyDocument":
            return {
                "json": '{"Version":"2012-10-17","Statement":[]}',
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStack(unittest.TestCase):
    """Test suite for TapStack"""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test VPC is created with correct configuration"""

        def check_vpc(args):
            stack = TapStack(
                "test-stack", TapStackArgs(environment_suffix="test"), None
            )
            return {
                "vpc_id": stack.vpc.id,
                "vpc_cidr": stack.vpc.cidr_block,
                "vpc_dns_hostnames": stack.vpc.enable_dns_hostnames,
                "vpc_dns_support": stack.vpc.enable_dns_support,
            }

        result = pulumi.Output.all().apply(check_vpc)

        def validate(outputs):
            self.assertIsNotNone(outputs["vpc_id"])
            self.assertEqual(outputs["vpc_cidr"], "10.0.0.0/16")
            self.assertTrue(outputs["vpc_dns_hostnames"])
            self.assertTrue(outputs["vpc_dns_support"])

        return result.apply(validate)

    @pulumi.runtime.test
    def test_private_subnets_creation(self):
        """Test 3 private subnets are created across 3 AZs"""

        def check_subnets(args):
            stack = TapStack(
                "test-stack", TapStackArgs(environment_suffix="test"), None
            )
            return {
                "subnet_count": len(stack.private_subnets),
                "subnet_1_cidr": stack.private_subnets[0].cidr_block,
                "subnet_2_cidr": stack.private_subnets[1].cidr_block,
                "subnet_3_cidr": stack.private_subnets[2].cidr_block,
                "subnet_1_az": stack.private_subnets[0].availability_zone,
                "subnet_2_az": stack.private_subnets[1].availability_zone,
                "subnet_3_az": stack.private_subnets[2].availability_zone,
            }

        result = pulumi.Output.all().apply(check_subnets)

        def validate(outputs):
            self.assertEqual(outputs["subnet_count"], 3)
            self.assertEqual(outputs["subnet_1_cidr"], "10.0.1.0/24")
            self.assertEqual(outputs["subnet_2_cidr"], "10.0.2.0/24")
            self.assertEqual(outputs["subnet_3_cidr"], "10.0.3.0/24")
            self.assertEqual(outputs["subnet_1_az"], "us-east-2a")
            self.assertEqual(outputs["subnet_2_az"], "us-east-2b")
            self.assertEqual(outputs["subnet_3_az"], "us-east-2c")

        return result.apply(validate)

    @pulumi.runtime.test
    def test_kms_key_creation(self):
        """Test KMS key is created with encryption enabled"""

        def check_kms(args):
            stack = TapStack(
                "test-stack", TapStackArgs(environment_suffix="test"), None
            )
            return {
                "kms_id": stack.kms_key.id,
                "kms_rotation": stack.kms_key.enable_key_rotation,
            }

        result = pulumi.Output.all().apply(check_kms)

        def validate(outputs):
            self.assertIsNotNone(outputs["kms_id"])
            self.assertTrue(outputs["kms_rotation"])

        return result.apply(validate)

    @pulumi.runtime.test
    def test_dynamodb_tables(self):
        """Test DynamoDB tables are created correctly"""

        def check_tables(args):
            stack = TapStack(
                "test-stack", TapStackArgs(environment_suffix="test"), None
            )
            return {
                "merchant_table_name": stack.merchant_table.name,
                "merchant_hash_key": stack.merchant_table.hash_key,
                "transaction_table_name": stack.transaction_table.name,
                "transaction_hash_key": stack.transaction_table.hash_key,
                "transaction_range_key": stack.transaction_table.range_key,
            }

        result = pulumi.Output.all().apply(check_tables)

        def validate(outputs):
            self.assertEqual(outputs["merchant_table_name"], "merchant-config-test")
            self.assertEqual(outputs["merchant_hash_key"], "merchant_id")
            self.assertEqual(
                outputs["transaction_table_name"], "processed-transactions-test"
            )
            self.assertEqual(outputs["transaction_hash_key"], "transaction_id")
            self.assertEqual(outputs["transaction_range_key"], "timestamp")

        return result.apply(validate)

    @pulumi.runtime.test
    def test_sqs_queues(self):
        """Test SQS queue and DLQ with correct configuration"""

        def check_queues(args):
            stack = TapStack(
                "test-stack", TapStackArgs(environment_suffix="test"), None
            )
            return {
                "queue_name": stack.transaction_queue.name,
                "queue_visibility": stack.transaction_queue.visibility_timeout_seconds,
                "dlq_name": stack.dlq.name,
                "dlq_retention": stack.dlq.message_retention_seconds,
            }

        result = pulumi.Output.all().apply(check_queues)

        def validate(outputs):
            self.assertEqual(outputs["queue_name"], "transaction-queue-test")
            self.assertEqual(outputs["queue_visibility"], 300)
            self.assertEqual(outputs["dlq_name"], "transaction-dlq-test")
            self.assertEqual(outputs["dlq_retention"], 1209600)  # 14 days

        return result.apply(validate)

    @pulumi.runtime.test
    def test_lambda_functions(self):
        """Test all 3 Lambda functions are configured correctly"""

        def check_lambdas(args):
            stack = TapStack(
                "test-stack", TapStackArgs(environment_suffix="test"), None
            )
            return {
                "validation_name": stack.validation_lambda.name,
                "validation_runtime": stack.validation_lambda.runtime,
                "validation_memory": stack.validation_lambda.memory_size,
                "validation_timeout": stack.validation_lambda.timeout,
                "validation_concurrency": stack.validation_lambda.reserved_concurrent_executions,
                "fraud_name": stack.fraud_detection_lambda.name,
                "fraud_runtime": stack.fraud_detection_lambda.runtime,
                "failed_name": stack.failed_transaction_lambda.name,
                "failed_runtime": stack.failed_transaction_lambda.runtime,
            }

        result = pulumi.Output.all().apply(check_lambdas)

        def validate(outputs):
            # Validation Lambda
            self.assertEqual(outputs["validation_name"], "validation-lambda-test")
            self.assertEqual(outputs["validation_runtime"], "python3.11")
            self.assertEqual(outputs["validation_memory"], 512)
            self.assertEqual(outputs["validation_timeout"], 60)
            self.assertEqual(outputs["validation_concurrency"], 100)

            # Fraud Detection Lambda
            self.assertEqual(
                outputs["fraud_name"], "fraud-detection-lambda-test"
            )
            self.assertEqual(outputs["fraud_runtime"], "python3.11")

            # Failed Transaction Lambda
            self.assertEqual(
                outputs["failed_name"], "failed-transaction-lambda-test"
            )
            self.assertEqual(outputs["failed_runtime"], "python3.11")

        return result.apply(validate)

    @pulumi.runtime.test
    def test_environment_suffix_in_all_resources(self):
        """Test all resources include environment suffix for uniqueness"""

        def check_suffix(args):
            stack = TapStack(
                "test-stack", TapStackArgs(environment_suffix="test123"), None
            )
            return {
                "merchant_table": stack.merchant_table.name,
                "transaction_table": stack.transaction_table.name,
                "queue": stack.transaction_queue.name,
                "dlq": stack.dlq.name,
                "sns": stack.fraud_alert_topic.name,
                "validation_lambda": stack.validation_lambda.name,
                "fraud_lambda": stack.fraud_detection_lambda.name,
                "failed_lambda": stack.failed_transaction_lambda.name,
                "api": stack.api_gateway.name,
                "waf": stack.waf_web_acl.name,
            }

        result = pulumi.Output.all().apply(check_suffix)

        def validate(outputs):
            # All resource names must contain the environment suffix
            for key, value in outputs.items():
                self.assertIn(
                    "test123",
                    value,
                    f"Resource {key} missing environment suffix: {value}",
                )

        return result.apply(validate)

    @pulumi.runtime.test
    def test_region_is_us_east_2(self):
        """Test region is correctly set to us-east-2 as required by task"""

        def check_region(args):
            stack = TapStack(
                "test-stack", TapStackArgs(environment_suffix="test"), None
            )
            return {"region": stack.region}

        result = pulumi.Output.all().apply(check_region)

        def validate(outputs):
            self.assertEqual(outputs["region"], "us-east-2")

        return result.apply(validate)


if __name__ == "__main__":
    unittest.main()
