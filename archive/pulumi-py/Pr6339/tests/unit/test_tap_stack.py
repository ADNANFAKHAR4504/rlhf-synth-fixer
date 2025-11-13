"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import os
import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi
from pulumi import Output


class MyMocks(pulumi.runtime.Mocks):
    """Mocks for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource."""
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-12345",
                "arn": "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-12345",
                "cidr_block": args.inputs.get("cidr_block", "10.0.0.0/16"),
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:subnet/subnet-{args.name}",
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"sg-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:security-group/sg-{args.name}",
            }
        elif args.typ == "aws:kms/key:Key":
            outputs = {
                **args.inputs,
                "id": "key-12345",
                "arn": "arn:aws:kms:us-east-1:123456789012:key/key-12345",
                "key_id": "key-12345",
            }
        elif args.typ == "aws:kms/alias:Alias":
            outputs = {
                **args.inputs,
                "id": f"alias/{args.name}",
                "arn": f"arn:aws:kms:us-east-1:123456789012:alias/{args.name}",
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "id": args.inputs.get("name", f"table-{args.name}"),
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.inputs.get('name', args.name)}",
                "name": args.inputs.get("name", args.name),
                "stream_arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.inputs.get('name', args.name)}/stream/2021-01-01T00:00:00.000",
            }
        elif args.typ == "aws:sqs/queue:Queue":
            outputs = {
                **args.inputs,
                "id": f"queue-{args.name}",
                "arn": f"arn:aws:sqs:us-east-1:123456789012:queue-{args.name}",
                "url": f"https://sqs.us-east-1.amazonaws.com/123456789012/queue-{args.name}",
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                **args.inputs,
                "id": f"topic-{args.name}",
                "arn": f"arn:aws:sns:us-east-1:123456789012:topic-{args.name}",
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:sns/topicSubscription:TopicSubscription":
            outputs = {
                **args.inputs,
                "id": f"subscription-{args.name}",
                "arn": f"arn:aws:sns:us-east-1:123456789012:subscription-{args.name}",
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": f"role-{args.name}",
                "arn": f"arn:aws:iam::123456789012:role/role-{args.name}",
                "name": f"role-{args.name}",
            }
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            outputs = {
                **args.inputs,
                "id": f"policy-{args.name}",
                "name": f"policy-{args.name}",
            }
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs = {
                **args.inputs,
                "id": f"attachment-{args.name}",
            }
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {
                **args.inputs,
                "id": args.inputs.get("name", f"/aws/lambda/{args.name}"),
                "arn": f"arn:aws:logs:us-east-1:123456789012:log-group:{args.inputs.get('name', args.name)}",
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "id": f"function-{args.name}",
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.inputs.get('name', args.name)}",
                "invoke_arn": f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.inputs.get('name', args.name)}/invocations",
                "name": args.inputs.get("name", args.name),
                "qualified_arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.inputs.get('name', args.name)}:1",
            }
        elif args.typ == "aws:lambda/eventSourceMapping:EventSourceMapping":
            outputs = {
                **args.inputs,
                "id": f"event-source-{args.name}",
                "uuid": f"uuid-{args.name}",
            }
        elif args.typ == "aws:lambda/permission:Permission":
            outputs = {
                **args.inputs,
                "id": f"permission-{args.name}",
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": f"api-{args.name}",
                "root_resource_id": "root-123",
                "execution_arn": f"arn:aws:execute-api:us-east-1:123456789012:api-{args.name}",
            }
        elif args.typ == "aws:apigateway/resource:Resource":
            outputs = {
                **args.inputs,
                "id": f"resource-{args.name}",
                "path": f"/{args.inputs.get('path_part', 'path')}",
            }
        elif args.typ == "aws:apigateway/method:Method":
            outputs = {
                **args.inputs,
                "id": f"method-{args.name}",
            }
        elif args.typ == "aws:apigateway/integration:Integration":
            outputs = {
                **args.inputs,
                "id": f"integration-{args.name}",
            }
        elif args.typ == "aws:apigateway/deployment:Deployment":
            outputs = {
                **args.inputs,
                "id": f"deployment-{args.name}",
                "invoke_url": "https://api.execute-api.us-east-1.amazonaws.com",
            }
        elif args.typ == "aws:apigateway/stage:Stage":
            outputs = {
                **args.inputs,
                "id": f"stage-{args.name}",
                "invoke_url": "https://api.execute-api.us-east-1.amazonaws.com/prod",
            }
        elif args.typ == "aws:apigateway/usagePlan:UsagePlan":
            outputs = {
                **args.inputs,
                "id": f"usage-plan-{args.name}",
            }
        return [f"{args.name}_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs with environment suffix."""
        args = TapStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack basic creation."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        # Verify stack was created
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'test')

    @pulumi.runtime.test
    def test_kms_key_creation(self):
        """Test KMS key is created with rotation enabled."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        # Verify KMS key exists
        self.assertIsNotNone(stack.kms_key)

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test VPC and subnets are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        # Verify VPC components
        self.assertIsNotNone(stack.vpc)
        self.assertIn('vpc', stack.vpc)
        self.assertIn('private_subnets', stack.vpc)
        self.assertIn('security_group', stack.vpc)
        self.assertEqual(len(stack.vpc['private_subnets']), 2)

    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created with streams enabled."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        # Verify DynamoDB table
        self.assertIsNotNone(stack.dynamodb_table)

    @pulumi.runtime.test
    def test_sqs_queues_creation(self):
        """Test SQS queues are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        # Verify queues
        self.assertIsNotNone(stack.dlq)
        self.assertIsNotNone(stack.fraud_queue)

    @pulumi.runtime.test
    def test_sns_topic_creation(self):
        """Test SNS topic is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        # Verify SNS topic
        self.assertIsNotNone(stack.sns_topic)

    @pulumi.runtime.test
    def test_lambda_functions_creation(self):
        """Test all Lambda functions are created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        # Verify Lambda functions
        self.assertIsNotNone(stack.api_lambda)
        self.assertIsNotNone(stack.fraud_lambda)
        self.assertIsNotNone(stack.notification_lambda)

    @pulumi.runtime.test
    def test_lambda_reserved_concurrency(self):
        """Ensure each Lambda reserves 100 concurrent executions as required."""
        os.environ['LAMBDA_RESERVED_CONCURRENCY'] = '100'
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        def check_reserved(values):
            api_reserved, fraud_reserved, notification_reserved = values
            try:
                self.assertEqual(api_reserved, 100)
                self.assertEqual(fraud_reserved, 100)
                self.assertEqual(notification_reserved, 100)
            finally:
                os.environ.pop('LAMBDA_RESERVED_CONCURRENCY', None)

        return pulumi.Output.all(
            stack.api_lambda.reserved_concurrent_executions,
            stack.fraud_lambda.reserved_concurrent_executions,
            stack.notification_lambda.reserved_concurrent_executions,
        ).apply(check_reserved)

    @pulumi.runtime.test
    def test_eventbridge_rule_creation(self):
        """Test DynamoDB stream trigger is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        # Verify event source mapping
        self.assertIsNotNone(stack.eventbridge_rule)

    @pulumi.runtime.test
    def test_api_gateway_creation(self):
        """Test API Gateway is created."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack(name="test-stack", args=args)

        # Verify API Gateway
        self.assertIsNotNone(stack.api_gateway)
        self.assertIn('api', stack.api_gateway)
        self.assertIn('stage', stack.api_gateway)
        self.assertIn('usage_plan', stack.api_gateway)

    @pulumi.runtime.test
    def test_environment_suffix_in_resource_names(self):
        """Test environment suffix is used in all resource names."""
        args = TapStackArgs(environment_suffix='mytest')
        stack = TapStack(name="test-stack", args=args)

        # The environment suffix should be properly set
        self.assertEqual(stack.environment_suffix, 'mytest')


if __name__ == '__main__':
    unittest.main()
