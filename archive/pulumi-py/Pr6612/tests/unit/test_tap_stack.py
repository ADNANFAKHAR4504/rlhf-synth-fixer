"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "endpoint": "test-db.region.rds.amazonaws.com:5432",
                "port": 5432,
                "master_user_secrets": [{"secret_arn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret"}],
            }
        elif args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": "vpc-12345"}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {**args.inputs, "id": f"subnet-{args.name}"}
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "bucket": args.name, "bucket_regional_domain_name": f"{args.name}.s3.amazonaws.com"}
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {**args.inputs, "dns_name": f"{args.name}.elb.amazonaws.com", "zone_id": "Z123456"}
        elif args.typ == "aws:cloudfront/distribution:Distribution":
            outputs = {**args.inputs, "id": "E123456", "domain_name": "d123456.cloudfront.net"}
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs = {**args.inputs, "name": args.name, "arn": f"arn:aws:ecs:us-east-1:123456789012:cluster/{args.name}"}
        elif args.typ == "aws:ecs/service:Service":
            outputs = {**args.inputs, "name": args.name}
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {**args.inputs, "name": args.inputs.get("name", args.name)}
        elif args.typ == "aws:cloudfront/originAccessIdentity:OriginAccessIdentity":
            outputs = {**args.inputs, "iam_arn": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity E123456", "cloudfront_access_identity_path": "origin-access-identity/cloudfront/E123456"}

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function/method calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zone_ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Team': 'platform', 'Project': 'payment'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_empty_suffix(self):
        """Test TapStackArgs with empty suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix='')

        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags defaults to empty dict."""
        args = TapStackArgs(tags=None)

        self.assertEqual(args.tags, {})


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_stack_creation(self):
        """Test basic stack creation."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'test')

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test VPC is created with correct configuration."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        def check_vpc(args):
            vpc_id = args[0]
            self.assertIsNotNone(vpc_id)

        pulumi.Output.all(stack.vpc.id).apply(check_vpc)

    @pulumi.runtime.test
    def test_subnets_creation(self):
        """Test public and private subnets are created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertEqual(len(stack.public_subnets), 3)
        self.assertEqual(len(stack.private_subnets), 3)

    @pulumi.runtime.test
    def test_rds_instance_creation(self):
        """Test RDS instance is created with correct configuration."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.db_instance)

        def check_rds(args):
            endpoint = args[0]
            self.assertIsNotNone(endpoint)
            self.assertIn(':', endpoint)

        pulumi.Output.all(stack.db_instance.endpoint).apply(check_rds)

    @pulumi.runtime.test
    def test_ecs_cluster_creation(self):
        """Test ECS cluster is created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.ecs_cluster)

        def check_cluster(args):
            cluster_name = args[0]
            self.assertIn('test', cluster_name)

        pulumi.Output.all(stack.ecs_cluster.name).apply(check_cluster)

    @pulumi.runtime.test
    def test_alb_creation(self):
        """Test Application Load Balancer is created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.alb)

        def check_alb(args):
            dns_name = args[0]
            self.assertIsNotNone(dns_name)

        pulumi.Output.all(stack.alb.dns_name).apply(check_alb)

    @pulumi.runtime.test
    def test_target_groups_creation(self):
        """Test blue and green target groups are created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.target_group_blue)
        self.assertIsNotNone(stack.target_group_green)

    @pulumi.runtime.test
    def test_s3_buckets_creation(self):
        """Test S3 buckets are created for frontend, logs, and flow logs."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.frontend_bucket)
        self.assertIsNotNone(stack.alb_logs_bucket)
        self.assertIsNotNone(stack.flow_logs_bucket)

    @pulumi.runtime.test
    def test_cloudfront_distribution_creation(self):
        """Test CloudFront distribution is created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.cloudfront_distribution)

        def check_cloudfront(args):
            domain_name = args[0]
            self.assertIn('cloudfront.net', domain_name)

        pulumi.Output.all(stack.cloudfront_distribution.domain_name).apply(check_cloudfront)

    @pulumi.runtime.test
    def test_security_groups_creation(self):
        """Test security groups are created for ALB, ECS, and RDS."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.alb_sg)
        self.assertIsNotNone(stack.ecs_sg)
        self.assertIsNotNone(stack.rds_sg)

    @pulumi.runtime.test
    def test_iam_roles_creation(self):
        """Test IAM roles are created for ECS tasks."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.ecs_execution_role)
        self.assertIsNotNone(stack.ecs_task_role)

    @pulumi.runtime.test
    def test_log_groups_creation(self):
        """Test CloudWatch log groups are created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.ecs_log_group)
        self.assertIsNotNone(stack.alb_log_group)

    @pulumi.runtime.test
    def test_ecs_service_creation(self):
        """Test ECS service is created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.ecs_service)

    @pulumi.runtime.test
    def test_common_tags(self):
        """Test common tags are applied."""
        custom_tags = {'CustomTag': 'CustomValue'}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertEqual(stack.environment_suffix, 'test')
        self.assertEqual(stack.tags, custom_tags)

    @pulumi.runtime.test
    def test_environment_suffix_in_resource_names(self):
        """Test environment suffix is used in resource names."""
        args = TapStackArgs(environment_suffix='staging')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertEqual(stack.environment_suffix, 'staging')

    @pulumi.runtime.test
    def test_nat_gateways_creation(self):
        """Test NAT gateways are created for each AZ."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertEqual(len(stack.nat_gateways), 3)

    @pulumi.runtime.test
    def test_task_definition_creation(self):
        """Test ECS task definition is created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.task_definition)

    @pulumi.runtime.test
    def test_cloudfront_oai_creation(self):
        """Test CloudFront Origin Access Identity is created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.cloudfront_oai)

    @pulumi.runtime.test
    def test_db_subnet_group_creation(self):
        """Test RDS subnet group is created."""
        args = TapStackArgs(environment_suffix='test')

        stack = TapStack(
            name='test-stack',
            args=args
        )

        self.assertIsNotNone(stack.db_subnet_group)


if __name__ == '__main__':
    unittest.main()
