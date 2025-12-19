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
            return pulumi.Output.all(
                stack.vpc.id,
                stack.vpc.cidr_block,
                stack.vpc.enable_dns_hostnames,
                stack.vpc.enable_dns_support
            ).apply(lambda vals: {
                "vpc_id": vals[0],
                "vpc_cidr": vals[1],
                "vpc_dns_hostnames": vals[2],
                "vpc_dns_support": vals[3],
            })

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
            return pulumi.Output.all(
                stack.private_subnets[0].cidr_block,
                stack.private_subnets[1].cidr_block,
                stack.private_subnets[2].cidr_block,
                stack.private_subnets[0].availability_zone,
                stack.private_subnets[1].availability_zone,
                stack.private_subnets[2].availability_zone
            ).apply(lambda vals: {
                "subnet_count": len(stack.private_subnets),
                "subnet_1_cidr": vals[0],
                "subnet_2_cidr": vals[1],
                "subnet_3_cidr": vals[2],
                "subnet_1_az": vals[3],
                "subnet_2_az": vals[4],
                "subnet_3_az": vals[5],
            })

        result = pulumi.Output.all().apply(check_subnets)

        def validate(outputs):
            self.assertEqual(outputs["subnet_count"], 3)
            self.assertEqual(outputs["subnet_1_cidr"], "10.0.1.0/24")
            self.assertEqual(outputs["subnet_2_cidr"], "10.0.2.0/24")
            self.assertEqual(outputs["subnet_3_cidr"], "10.0.3.0/24")
            self.assertEqual(outputs["subnet_1_az"], "us-east-1a")
            self.assertEqual(outputs["subnet_2_az"], "us-east-1b")
            self.assertEqual(outputs["subnet_3_az"], "us-east-1c")

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
            return pulumi.Output.all(
                stack.merchant_table.name,
                stack.merchant_table.hash_key,
                stack.transaction_table.name,
                stack.transaction_table.hash_key,
                stack.transaction_table.range_key
            ).apply(lambda vals: {
                "merchant_table_name": vals[0],
                "merchant_hash_key": vals[1],
                "transaction_table_name": vals[2],
                "transaction_hash_key": vals[3],
                "transaction_range_key": vals[4],
            })

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
            return pulumi.Output.all(
                stack.transaction_queue.name,
                stack.transaction_queue.visibility_timeout_seconds,
                stack.dlq.name,
                stack.dlq.message_retention_seconds
            ).apply(lambda vals: {
                "queue_name": vals[0],
                "queue_visibility": vals[1],
                "dlq_name": vals[2],
                "dlq_retention": vals[3],
            })

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
            return pulumi.Output.all(
                stack.validation_lambda.name,
                stack.validation_lambda.runtime,
                stack.validation_lambda.memory_size,
                stack.validation_lambda.timeout,
                stack.validation_lambda.reserved_concurrent_executions,
                stack.fraud_detection_lambda.name,
                stack.fraud_detection_lambda.runtime,
                stack.failed_transaction_lambda.name,
                stack.failed_transaction_lambda.runtime
            ).apply(lambda vals: {
                "validation_name": vals[0],
                "validation_runtime": vals[1],
                "validation_memory": vals[2],
                "validation_timeout": vals[3],
                "validation_concurrency": vals[4],
                "fraud_name": vals[5],
                "fraud_runtime": vals[6],
                "failed_name": vals[7],
                "failed_runtime": vals[8],
            })

        result = pulumi.Output.all().apply(check_lambdas)

        def validate(outputs):
            # Validation Lambda
            self.assertEqual(outputs["validation_name"], "validation-lambda-test")
            self.assertEqual(outputs["validation_runtime"], "python3.11")
            self.assertEqual(outputs["validation_memory"], 512)
            self.assertEqual(outputs["validation_timeout"], 60)
            self.assertEqual(outputs["validation_concurrency"], 100)  # Reserved capacity for burst traffic

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
            return pulumi.Output.all(
                stack.merchant_table.name,
                stack.transaction_table.name,
                stack.transaction_queue.name,
                stack.dlq.name,
                stack.fraud_alert_topic.name,
                stack.validation_lambda.name,
                stack.fraud_detection_lambda.name,
                stack.failed_transaction_lambda.name,
                stack.api_gateway.name,
                stack.waf_web_acl.name
            ).apply(lambda vals: {
                "merchant_table": vals[0],
                "transaction_table": vals[1],
                "queue": vals[2],
                "dlq": vals[3],
                "sns": vals[4],
                "validation_lambda": vals[5],
                "fraud_lambda": vals[6],
                "failed_lambda": vals[7],
                "api": vals[8],
                "waf": vals[9],
            })

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
    def test_region_is_us_east_1(self):
        """Test region is correctly set to us-east-1 for deployment"""

        def check_region(args):
            stack = TapStack(
                "test-stack", TapStackArgs(environment_suffix="test"), None
            )
            return {"region": stack.region}

        result = pulumi.Output.all().apply(check_region)

        def validate(outputs):
            self.assertEqual(outputs["region"], "us-east-1")

        return result.apply(validate)


if __name__ == "__main__":
    unittest.main()
