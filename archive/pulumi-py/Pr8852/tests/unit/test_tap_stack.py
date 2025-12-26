import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class"""

    def test_default_initialization(self):
        """Test TapStackArgs initializes with default values"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.regions, ['us-east-1'])
        self.assertIsInstance(args.tags, dict)
        self.assertIn('Project', args.tags)
        self.assertEqual(args.tags['ManagedBy'], 'Pulumi')

    def test_custom_environment_suffix(self):
        """Test TapStackArgs accepts custom environment suffix"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix='dev')

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags['Environment'], 'dev')

    def test_custom_tags(self):
        """Test TapStackArgs accepts custom tags"""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Custom': 'Value', 'Team': 'Engineering'}
        args = TapStackArgs(tags=custom_tags)

        self.assertEqual(args.tags, custom_tags)

    def test_single_region_for_localstack(self):
        """Test that regions default to single region for LocalStack compatibility"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(regions=['us-west-2', 'eu-west-1'])

        # Should always use single region for LocalStack
        self.assertEqual(args.regions, ['us-east-1'])
        self.assertEqual(len(args.regions), 1)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack main component"""

    def setUp(self):
        """Set up test fixtures"""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_stack_initialization(self):
        """Test TapStack component initializes correctly"""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.environment_suffix, 'test')
        self.assertEqual(stack.regions, ['us-east-1'])
        self.assertIsInstance(stack.tags, dict)

    @pulumi.runtime.test
    def test_regional_deployments_created(self):
        """Test that regional deployments dictionary is initialized"""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs()
        stack = TapStack('test-stack', args)

        self.assertIsInstance(stack.regional_deployments, dict)
        self.assertIsInstance(stack.providers, dict)
        self.assertIsInstance(stack.networking, dict)
        self.assertIsInstance(stack.security, dict)

    @pulumi.runtime.test
    def test_tags_propagation(self):
        """Test that tags are properly set and propagated"""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {'Environment': 'production', 'Cost-Center': '12345'}
        args = TapStackArgs(tags=custom_tags)
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.tags, custom_tags)


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resource creation"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock new_resource to return mock outputs"""
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-12345",
                "arn": "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-12345",
                "cidrBlock": args.inputs.get("cidrBlock", "10.0.0.0/16"),
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": "subnet-12345",
                "arn": "arn:aws:ec2:us-east-1:123456789012:subnet/subnet-12345",
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": "sg-12345",
                "arn": "arn:aws:ec2:us-east-1:123456789012:security-group/sg-12345",
            }
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "id": "test-bucket-12345",
                "arn": "arn:aws:s3:::test-bucket-12345",
                "bucket": "test-bucket-12345",
            }
        elif args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "id": "db-12345",
                "endpoint": "db-12345.us-east-1.rds.amazonaws.com:5432",
                "arn": "arn:aws:rds:us-east-1:123456789012:db:db-12345",
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "id": "lambda-12345",
                "arn": "arn:aws:lambda:us-east-1:123456789012:function:lambda-12345",
                "invokeArn": "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:lambda-12345/invocations",
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "id": "table-12345",
                "arn": "arn:aws:dynamodb:us-east-1:123456789012:table/table-12345",
                "name": "table-12345",
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": "role-12345",
                "arn": "arn:aws:iam::123456789012:role/role-12345",
            }
        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock call to return mock results"""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zoneIds": ["use1-az1", "use1-az2", "use1-az3"],
            }
        return {}


if __name__ == '__main__':
    unittest.main()
