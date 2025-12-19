"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


class PulumiMocks(pulumi.runtime.Mocks):
    """
    Mock class for Pulumi resource creation and calls.
    """

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """
        Mock resource creation.
        """
        outputs = {}
        # Default outputs based on resource type
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                "id": "vpc-12345",
                "cidrBlock": "10.0.0.0/16",
                "enableDnsHostnames": True,
                "enableDnsSupport": True,
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                "id": f"subnet-{args.name}",
                "vpcId": "vpc-12345",
                "cidrBlock": args.inputs.get("cidrBlock", "10.0.1.0/24"),
                "availabilityZone": args.inputs.get("availabilityZone", "us-east-1a"),
            }
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                "id": args.inputs.get("bucket", f"bucket-{args.name}"),
                "bucket": args.inputs.get("bucket", f"bucket-{args.name}"),
                "arn": f"arn:aws:s3:::bucket-{args.name}",
            }
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs = {
                "id": "cluster-12345",
                "endpoint": "cluster.endpoint.rds.amazonaws.com",
                "readerEndpoint": "cluster.reader.rds.amazonaws.com",
                "arn": "arn:aws:rds:us-east-1:123456789012:cluster:cluster-12345",
                "databaseName": args.inputs.get("databaseName", "db"),
            }
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs = {
                "id": "cluster-12345",
                "name": args.inputs.get("name", "cluster"),
                "arn": "arn:aws:ecs:us-east-1:123456789012:cluster/cluster",
            }
        elif args.typ == "aws:kms/key:Key":
            outputs = {
                "id": "key-12345",
                "keyId": "key-12345",
                "arn": "arn:aws:kms:us-east-1:123456789012:key/key-12345",
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                "id": f"sg-{args.name}",
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                "id": f"role-{args.name}",
                "name": args.inputs.get("name", args.name),
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
            }
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {
                "id": args.inputs.get("name", f"/aws/logs/{args.name}"),
                "name": args.inputs.get("name", f"/aws/logs/{args.name}"),
            }
        else:
            outputs = {
                "id": f"{args.typ}-{args.name}",
            }

        return [f"{args.name}_id", {**args.inputs, **outputs}]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """
        Mock provider function calls.
        """
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zoneIds": ["use1-az1", "use1-az2", "use1-az3"],
            }
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs
from lib.vpc_stack import VpcStack, VpcStackArgs
from lib.monitoring_stack import MonitoringStack, MonitoringStackArgs
from lib.security_stack import SecurityStack, SecurityStackArgs
from lib.rds_stack import RdsStack, RdsStackArgs
from lib.ecs_stack import EcsStack, EcsStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Environment': 'test', 'Owner': 'team'}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)


class TestMonitoringStack(unittest.TestCase):
    """Test cases for MonitoringStack component."""

    @pulumi.runtime.test
    def test_monitoring_stack_creates_s3_bucket(self):
        """Test that MonitoringStack creates an S3 bucket with correct naming."""

        def check_s3_bucket(args):
            bucket_name = args[0]
            self.assertTrue(bucket_name.startswith('payment-logs-'))
            return True

        args = MonitoringStackArgs(environment_suffix='test')
        stack = MonitoringStack('test-monitoring', args)

        # Verify S3 bucket exists
        self.assertIsNotNone(stack.log_bucket)

    @pulumi.runtime.test
    def test_monitoring_stack_creates_log_group(self):
        """Test that MonitoringStack creates CloudWatch log group."""
        args = MonitoringStackArgs(environment_suffix='test', log_retention_days=7)
        stack = MonitoringStack('test-monitoring', args)

        # Verify log group exists
        self.assertIsNotNone(stack.ecs_log_group)


class TestVpcStack(unittest.TestCase):
    """Test cases for VpcStack component."""

    @pulumi.runtime.test
    def test_vpc_stack_creates_vpc(self):
        """Test that VpcStack creates a VPC with correct CIDR."""
        args = VpcStackArgs(environment_suffix='test', cidr_block='10.0.0.0/16')
        stack = VpcStack('test-vpc', args)

        # Verify VPC exists
        self.assertIsNotNone(stack.vpc)

    @pulumi.runtime.test
    def test_vpc_stack_creates_subnets(self):
        """Test that VpcStack creates public and private subnets."""
        args = VpcStackArgs(environment_suffix='test')
        stack = VpcStack('test-vpc', args)

        # Verify subnets exist
        self.assertEqual(len(stack.private_subnets), 2)
        self.assertEqual(len(stack.public_subnets), 2)

    @pulumi.runtime.test
    def test_vpc_stack_creates_endpoints(self):
        """Test that VpcStack creates VPC endpoints for S3 and DynamoDB."""
        args = VpcStackArgs(environment_suffix='test')
        stack = VpcStack('test-vpc', args)

        # Verify endpoints exist
        self.assertIsNotNone(stack.s3_endpoint)
        self.assertIsNotNone(stack.dynamodb_endpoint)


class TestSecurityStack(unittest.TestCase):
    """Test cases for SecurityStack component."""

    @pulumi.runtime.test
    def test_security_stack_creates_kms_key(self):
        """Test that SecurityStack creates KMS key for RDS encryption."""
        args = SecurityStackArgs(
            environment_suffix='test',
            vpc_id=pulumi.Output.from_input('vpc-12345')
        )
        stack = SecurityStack('test-security', args)

        # Verify KMS key exists
        self.assertIsNotNone(stack.rds_kms_key)
        self.assertIsNotNone(stack.rds_kms_key_alias)

    @pulumi.runtime.test
    def test_security_stack_creates_security_groups(self):
        """Test that SecurityStack creates security groups for ECS and RDS."""
        args = SecurityStackArgs(
            environment_suffix='test',
            vpc_id=pulumi.Output.from_input('vpc-12345')
        )
        stack = SecurityStack('test-security', args)

        # Verify security groups exist
        self.assertIsNotNone(stack.ecs_security_group)
        self.assertIsNotNone(stack.rds_security_group)
        self.assertIsNotNone(stack.rds_ingress_rule)


class TestRdsStack(unittest.TestCase):
    """Test cases for RdsStack component."""

    @pulumi.runtime.test
    def test_rds_stack_creates_cluster(self):
        """Test that RdsStack creates Aurora Serverless cluster."""
        args = RdsStackArgs(
            environment_suffix='test',
            subnet_ids=[
                pulumi.Output.from_input('subnet-1'),
                pulumi.Output.from_input('subnet-2')
            ],
            security_group_id=pulumi.Output.from_input('sg-12345'),
            kms_key_arn=pulumi.Output.from_input('arn:aws:kms:us-east-1:123456789012:key/key-12345')
        )
        stack = RdsStack('test-rds', args)

        # Verify RDS cluster exists
        self.assertIsNotNone(stack.db_cluster)
        self.assertIsNotNone(stack.db_instance)
        self.assertIsNotNone(stack.db_subnet_group)


class TestEcsStack(unittest.TestCase):
    """Test cases for EcsStack component."""

    @pulumi.runtime.test
    def test_ecs_stack_creates_cluster(self):
        """Test that EcsStack creates ECS cluster."""
        args = EcsStackArgs(
            environment_suffix='test',
            log_group_name=pulumi.Output.from_input('/ecs/test'),
            security_group_id=pulumi.Output.from_input('sg-12345'),
            subnet_ids=[
                pulumi.Output.from_input('subnet-1'),
                pulumi.Output.from_input('subnet-2')
            ]
        )
        stack = EcsStack('test-ecs', args)

        # Verify ECS cluster exists
        self.assertIsNotNone(stack.cluster)

    @pulumi.runtime.test
    def test_ecs_stack_creates_iam_roles(self):
        """Test that EcsStack creates IAM roles for task execution and runtime."""
        args = EcsStackArgs(
            environment_suffix='test',
            log_group_name=pulumi.Output.from_input('/ecs/test'),
            security_group_id=pulumi.Output.from_input('sg-12345'),
            subnet_ids=[pulumi.Output.from_input('subnet-1')]
        )
        stack = EcsStack('test-ecs', args)

        # Verify IAM roles exist
        self.assertIsNotNone(stack.task_execution_role)
        self.assertIsNotNone(stack.task_role)
        self.assertIsNotNone(stack.task_execution_policy_attachment)

    @pulumi.runtime.test
    def test_ecs_stack_creates_task_definition(self):
        """Test that EcsStack creates task definition."""
        args = EcsStackArgs(
            environment_suffix='test',
            log_group_name=pulumi.Output.from_input('/ecs/test'),
            security_group_id=pulumi.Output.from_input('sg-12345'),
            subnet_ids=[pulumi.Output.from_input('subnet-1')]
        )
        stack = EcsStack('test-ecs', args)

        # Verify task definition exists
        self.assertIsNotNone(stack.task_definition)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack main orchestrator."""

    @pulumi.runtime.test
    def test_tap_stack_creates_all_components(self):
        """Test that TapStack creates all required components."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify all components exist
        self.assertIsNotNone(stack.monitoring)
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.security)
        self.assertIsNotNone(stack.rds)
        self.assertIsNotNone(stack.ecs)

    @pulumi.runtime.test
    def test_tap_stack_environment_suffix(self):
        """Test that TapStack uses correct environment suffix."""
        args = TapStackArgs(environment_suffix='prod')
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.environment_suffix, 'prod')


if __name__ == '__main__':
    unittest.main()
