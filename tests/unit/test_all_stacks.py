"""
test_all_stacks.py

Comprehensive unit tests for all infrastructure stacks.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
import os
import pulumi

# Mocking utilities
def pulumi_set_mocks():
    """Set up Pulumi mocks for testing."""
    pulumi.runtime.set_mocks(MyMocks())

class MyMocks(pulumi.runtime.Mocks):
    """Custom Pulumi mocks."""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:s3/bucketV2:BucketV2":
            outputs = {
                **args.inputs,
                "bucket": args.inputs.get("bucket", f"test-bucket-{args.name}"),
                "arn": f"arn:aws:s3:::{args.inputs.get('bucket', args.name)}",
                "id": f"test-bucket-{args.name}"
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "name": args.inputs.get("name", args.name),
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                "id": args.name
            }
        elif args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": f"vpc-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:vpc/{args.name}"
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:subnet/{args.name}"
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"sg-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789012:security-group/{args.name}"
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "invoke_arn": f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations",
                "id": args.name
            }
        elif args.typ == "aws:apigatewayv2/api:Api":
            outputs = {
                **args.inputs,
                "id": f"api-{args.name}",
                "api_endpoint": f"https://test-api.execute-api.us-east-1.amazonaws.com"
            }
        elif args.typ == "aws:route53/zone:Zone":
            outputs = {
                **args.inputs,
                "id": f"Z{args.name}",
                "zone_id": f"Z{args.name}",
                "name_servers": ["ns1.example.com", "ns2.example.com"]
            }
        elif args.typ == "aws:cloudfront/distribution:Distribution":
            outputs = {
                **args.inputs,
                "id": f"dist-{args.name}",
                "domain_name": "d123456.cloudfront.net",
                "arn": f"arn:aws:cloudfront::123456789012:distribution/{args.name}"
            }
        elif args.typ == "aws:acm/certificate:Certificate":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:acm:us-east-1:123456789012:certificate/{args.name}",
                "id": f"cert-{args.name}",
                "domain_validation_options": [
                    {
                        "resource_record_name": "_test.example.com",
                        "resource_record_type": "CNAME",
                        "resource_record_value": "test-value.acm-validations.aws"
                    }
                ],
                "status": "ISSUED"
            }
        return [f"{args.name}_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789012", "user_id": "test-user", "arn": "arn:aws:iam::123456789012:user/test"}
        elif args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1", "id": "us-east-1"}
        return {}


class TestVpcStack(unittest.TestCase):
    """Test cases for VPC stack."""

    @pulumi.runtime.test
    def test_vpc_stack_creation(self):
        """Test VPC stack resource creation."""
        import lib.vpc_stack as vpc_stack

        stack = vpc_stack.VpcStack(
            "test-vpc",
            environment_suffix="dev",
            tags={"Environment": "test"}
        )

        # Verify VPC is created
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.lambda_sg)
        self.assertIsNotNone(stack.vpc_endpoint_sg)

    @pulumi.runtime.test
    def test_vpc_stack_dev_no_nat_gateway(self):
        """Test VPC stack skips NAT Gateway for dev environment."""
        import lib.vpc_stack as vpc_stack

        stack = vpc_stack.VpcStack(
            "test-vpc-dev",
            environment_suffix="dev",
            tags={"Environment": "dev"}
        )

        # For dev environment, NAT Gateway should be None
        self.assertIsNone(stack.nat_gateway)
        self.assertIsNone(stack.eip)

    @pulumi.runtime.test
    def test_vpc_stack_prod_has_nat_gateway(self):
        """Test VPC stack creates NAT Gateway for prod environment."""
        import lib.vpc_stack as vpc_stack

        stack = vpc_stack.VpcStack(
            "test-vpc-prod",
            environment_suffix="prod",
            tags={"Environment": "prod"}
        )

        # For prod environment, NAT Gateway should exist
        self.assertIsNotNone(stack.nat_gateway)
        self.assertIsNotNone(stack.eip)


class TestDynamoDBStack(unittest.TestCase):
    """Test cases for DynamoDB stack."""

    @pulumi.runtime.test
    def test_dynamodb_stack_creation(self):
        """Test DynamoDB stack resource creation."""
        import lib.dynamodb_stack as dynamodb_stack

        stack = dynamodb_stack.DynamoDBStack(
            "test-dynamodb",
            environment_suffix="dev",
            read_capacity=5,
            write_capacity=5,
            enable_pitr=False,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.transactions_table)
        self.assertIsNotNone(stack.sessions_table)


class TestS3Stack(unittest.TestCase):
    """Test cases for S3 stack."""

    @pulumi.runtime.test
    def test_s3_stack_creation(self):
        """Test S3 stack resource creation."""
        import lib.s3_stack as s3_stack

        stack = s3_stack.S3Stack(
            "test-s3",
            environment_suffix="dev",
            log_retention_days=7,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.api_logs_bucket)


class TestLambdaStack(unittest.TestCase):
    """Test cases for Lambda stack."""

    @pulumi.runtime.test
    def test_lambda_stack_creation(self):
        """Test Lambda stack resource creation."""
        import lib.lambda_stack as lambda_stack
        import pulumi

        stack = lambda_stack.LambdaStack(
            "test-lambda",
            environment_suffix="dev",
            memory_size=256,
            timeout=30,
            transactions_table_name=pulumi.Output.from_input("test-transactions"),
            transactions_table_arn=pulumi.Output.from_input("arn:aws:dynamodb:us-east-1:123456789012:table/test-transactions"),
            sessions_table_name=pulumi.Output.from_input("test-sessions"),
            sessions_table_arn=pulumi.Output.from_input("arn:aws:dynamodb:us-east-1:123456789012:table/test-sessions"),
            subnet_ids=[pulumi.Output.from_input("subnet-1"), pulumi.Output.from_input("subnet-2")],
            security_group_id=pulumi.Output.from_input("sg-test"),
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.payment_processor)
        self.assertIsNotNone(stack.session_manager)


class TestApiGatewayStack(unittest.TestCase):
    """Test cases for API Gateway stack."""

    @pulumi.runtime.test
    def test_api_gateway_stack_creation(self):
        """Test API Gateway stack resource creation."""
        import lib.api_gateway_stack as api_gateway_stack
        import pulumi

        stack = api_gateway_stack.ApiGatewayStack(
            "test-api",
            environment_suffix="dev",
            payment_processor_invoke_arn=pulumi.Output.from_input("arn:aws:lambda:invoke"),
            payment_processor_arn=pulumi.Output.from_input("arn:aws:lambda:function"),
            session_manager_invoke_arn=pulumi.Output.from_input("arn:aws:lambda:invoke"),
            session_manager_arn=pulumi.Output.from_input("arn:aws:lambda:function"),
            api_logs_bucket_arn=pulumi.Output.from_input("arn:aws:s3:::test-bucket"),
            throttle_burst=500,
            throttle_rate=250,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.api)


class TestRoute53Stack(unittest.TestCase):
    """Test cases for Route53 stack."""

    @pulumi.runtime.test
    def test_route53_stack_creation(self):
        """Test Route53 stack resource creation."""
        import lib.route53_stack as route53_stack
        import pulumi

        stack = route53_stack.Route53Stack(
            "test-route53",
            environment_suffix="dev",
            domain="dev.api.example.com",
            cloudfront_domain=pulumi.Output.from_input("d123456.cloudfront.net"),
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.hosted_zone)


class TestAcmStack(unittest.TestCase):
    """Test cases for ACM stack."""

    @pulumi.runtime.test
    def test_acm_stack_creation_without_validation(self):
        """Test ACM stack resource creation without hosted zone."""
        import lib.acm_stack as acm_stack

        stack = acm_stack.AcmStack(
            "test-acm",
            environment_suffix="dev",
            domain="dev.api.example.com",
            hosted_zone_id=None,
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.certificate)
        self.assertIsNone(stack.certificate_validation)

    @pulumi.runtime.test
    def test_acm_stack_creation_with_validation(self):
        """Test ACM stack resource creation with hosted zone."""
        import lib.acm_stack as acm_stack
        import pulumi

        stack = acm_stack.AcmStack(
            "test-acm-validated",
            environment_suffix="dev",
            domain="dev.api.example.com",
            hosted_zone_id=pulumi.Output.from_input("Z123456"),
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.certificate)
        self.assertIsNotNone(stack.certificate_validation)


class TestCloudFrontStack(unittest.TestCase):
    """Test cases for CloudFront stack."""

    @pulumi.runtime.test
    def test_cloudfront_stack_creation(self):
        """Test CloudFront stack resource creation."""
        import lib.cloudfront_stack as cloudfront_stack
        import pulumi

        stack = cloudfront_stack.CloudFrontStack(
            "test-cloudfront",
            environment_suffix="dev",
            api_domain=pulumi.Output.from_input("test-api.execute-api.us-east-1.amazonaws.com"),
            certificate_arn=pulumi.Output.from_input("arn:aws:acm:us-east-1:123456789012:certificate/test"),
            domain="dev.api.example.com",
            tags={"Environment": "test"}
        )

        self.assertIsNotNone(stack.distribution)


class TestSessionManagerLambda(unittest.TestCase):
    """Additional test cases for session manager Lambda function."""

    @patch('session_manager.dynamodb_client')
    def test_session_manager_error_handling(self, mock_dynamodb_client):
        """Test session manager error handling."""
        import sys
        import os

        # Add lambda directory to path
        lambda_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', 'lambda')
        if lambda_dir not in sys.path:
            sys.path.insert(0, lambda_dir)

        import session_manager

        mock_dynamodb_client.put_item.side_effect = Exception('DynamoDB error')
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'POST',
            'body': '{"userId": "user-123"}'
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 500)
        self.assertIn('Internal server error', response['body'])


if __name__ == '__main__':
    pulumi_set_mocks()
    unittest.main()
