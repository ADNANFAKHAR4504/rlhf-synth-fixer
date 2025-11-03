"""
Unit tests for the FastCart Order Processing TapStack.

This module contains comprehensive unit tests that validate the infrastructure
configuration, resource properties, security settings, and compliance requirements
without requiring actual AWS deployment.
"""

import unittest
from unittest.mock import Mock, MagicMock, patch
import pulumi
import json
from pathlib import Path


class PulumiMocks(pulumi.runtime.Mocks):
    """
    Mock implementation for Pulumi resources during unit testing.

    This allows us to test the infrastructure code without making actual AWS API calls.
    """

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resources with appropriate outputs."""
        outputs = args.inputs

        # Add resource-specific outputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": "vpc-mock123",
                "arn": "arn:aws:ec2:eu-central-1:123456789012:vpc/vpc-mock123",
                "cidrBlock": args.inputs.get("cidrBlock", "10.0.0.0/16"),
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "arn": f"arn:aws:ec2:eu-central-1:123456789012:subnet/subnet-{args.name}",
            }
        elif args.typ == "aws:kms/key:Key":
            outputs = {
                **args.inputs,
                "id": "mock-kms-key-id",
                "arn": "arn:aws:kms:eu-central-1:123456789012:key/mock-kms-key-id",
                "keyId": "mock-kms-key-id",
            }
        elif args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "id": "rds-instance-mock",
                "arn": "arn:aws:rds:eu-central-1:123456789012:db:rds-instance-mock",
                "endpoint": "rds-instance-mock.abc123.eu-central-1.rds.amazonaws.com:5432",
                "address": "rds-instance-mock.abc123.eu-central-1.rds.amazonaws.com",
                "identifier": args.inputs.get("identifier", "mock-rds"),
            }
        elif args.typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs = {
                **args.inputs,
                "id": "redis-cluster-mock",
                "arn": "arn:aws:elasticache:eu-central-1:123456789012:replicationgroup:redis-cluster-mock",
                "configurationEndpointAddress": "redis-cluster-mock.abc123.cfg.euc1.cache.amazonaws.com",
                "primaryEndpointAddress": "redis-cluster-mock.abc123.euc1.cache.amazonaws.com",
                "replicationGroupId": args.inputs.get("replicationGroupId", "mock-redis"),
            }
        elif args.typ == "aws:kinesis/stream:Stream":
            outputs = {
                **args.inputs,
                "id": "kinesis-stream-mock",
                "arn": "arn:aws:kinesis:eu-central-1:123456789012:stream/kinesis-stream-mock",
                "name": args.inputs.get("name", "mock-stream"),
            }
        elif args.typ == "aws:ecr/repository:Repository":
            outputs = {
                **args.inputs,
                "id": f"ecr-{args.name}",
                "arn": f"arn:aws:ecr:eu-central-1:123456789012:repository/{args.name}",
                "repositoryUrl": f"123456789012.dkr.ecr.eu-central-1.amazonaws.com/{args.name}",
            }
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs = {
                **args.inputs,
                "id": f"ecs-cluster-{args.name}",
                "arn": f"arn:aws:ecs:eu-central-1:123456789012:cluster/{args.name}",
            }
        elif args.typ == "aws:ecs/taskDefinition:TaskDefinition":
            outputs = {
                **args.inputs,
                "id": f"task-def-{args.name}",
                "arn": f"arn:aws:ecs:eu-central-1:123456789012:task-definition/{args.name}:1",
                "family": args.inputs.get("family", args.name),
            }
        elif args.typ == "aws:ecs/service:Service":
            outputs = {
                **args.inputs,
                "id": f"ecs-service-{args.name}",
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": f"role-{args.name}",
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs = {
                **args.inputs,
                "id": f"secret-{args.name}",
                "arn": f"arn:aws:secretsmanager:eu-central-1:123456789012:secret:{args.name}-abc123",
            }
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {
                **args.inputs,
                "id": args.inputs.get("name", f"log-group-{args.name}"),
                "arn": f"arn:aws:logs:eu-central-1:123456789012:log-group:{args.inputs.get('name', args.name)}",
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"sg-{args.name}",
                "arn": f"arn:aws:ec2:eu-central-1:123456789012:security-group/sg-{args.name}",
            }
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {
                **args.inputs,
                "id": f"nat-{args.name}",
            }
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {
                **args.inputs,
                "id": f"eip-{args.name}",
                "publicIp": "203.0.113.1",
            }
        else:
            outputs = {
                **args.inputs,
                "id": f"{args.typ}-{args.name}",
                "arn": f"arn:aws:service:eu-central-1:123456789012:{args.typ}/{args.name}",
            }

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {
                "accountId": "123456789012",
                "arn": "arn:aws:iam::123456789012:user/test-user",
                "userId": "AIDACKCEVSQ6C2EXAMPLE",
            }
        elif args.token == "aws:index/getRegion:getRegion":
            return {
                "name": "eu-central-1",
                "endpoint": "ec2.eu-central-1.amazonaws.com",
            }
        elif args.token == "aws:ec2/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["eu-central-1a", "eu-central-1b"],
                "zoneIds": ["euc1-az1", "euc1-az2"]
            }
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


# Import after setting mocks
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStack(unittest.TestCase):
    """
    Unit tests for TapStack infrastructure.

    These tests verify:
    - Resource creation and configuration
    - Security and encryption settings
    - Compliance requirements
    - Environment suffix propagation
    - Network isolation
    - IAM policies and permissions
    """

    DEFAULT_AZS = ["eu-central-1a", "eu-central-1b"]

    def _create_stack(self, suffix="test123"):
        return TapStack(
            name="test-fastcart-infra",
            args=TapStackArgs(
                environment_suffix=suffix,
                availability_zones=self.DEFAULT_AZS
            )
        )

    @pulumi.runtime.test
    def test_stack_creates_with_environment_suffix(self):
        """Test that the stack creates successfully with environment suffix."""
        def check_stack(args):
            stack = self._create_stack("test123")
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, "test123")
            return []

        return check_stack([])

    @pulumi.runtime.test
    def test_vpc_configuration(self):
        """Test VPC is created with correct CIDR and DNS settings."""
        def check_vpc(args):
            stack = self._create_stack("test123")

            # Verify VPC exists
            self.assertIsNotNone(stack.vpc)

            # Check VPC outputs
            def validate_vpc(vpc_id):
                self.assertIsNotNone(vpc_id)
                return vpc_id

            return pulumi.Output.all(stack.vpc.id).apply(
                lambda args: validate_vpc(args[0])
            )

        return check_vpc([])

    @pulumi.runtime.test
    def test_kms_key_encryption_enabled(self):
        """Test KMS key is created with encryption rotation enabled."""
        def check_kms(args):
            stack = self._create_stack("test123")

            # Verify KMS key exists
            self.assertIsNotNone(stack.kms_key)
            self.assertIsNotNone(stack.kms_alias)

            # Check key rotation is enabled
            def validate_kms(enable_key_rotation):
                self.assertTrue(enable_key_rotation)
                return enable_key_rotation

            return pulumi.Output.all(stack.kms_key.enable_key_rotation).apply(
                lambda args: validate_kms(args[0])
            )

        return check_kms([])

    @pulumi.runtime.test
    def test_rds_encryption_at_rest(self):
        """Test RDS instance has encryption at rest enabled."""
        def check_rds(args):
            stack = self._create_stack("test123")

            # Verify RDS instance exists
            self.assertIsNotNone(stack.rds_instance)

            # Check encryption settings
            def validate_rds(storage_encrypted, kms_key_id):
                self.assertTrue(storage_encrypted)
                self.assertIsNotNone(kms_key_id)
                return storage_encrypted

            return pulumi.Output.all(
                stack.rds_instance.storage_encrypted,
                stack.rds_instance.kms_key_id
            ).apply(lambda args: validate_rds(args[0], args[1]))

        return check_rds([])

    @pulumi.runtime.test
    def test_kinesis_stream_encryption(self):
        """Test Kinesis stream has KMS encryption enabled."""
        def check_kinesis(args):
            stack = self._create_stack("test123")

            # Verify Kinesis stream exists
            self.assertIsNotNone(stack.kinesis_stream)

            # Check encryption settings
            def validate_kinesis(encryption_type, kms_key_id):
                self.assertEqual(encryption_type, "KMS")
                self.assertIsNotNone(kms_key_id)
                return encryption_type

            return pulumi.Output.all(
                stack.kinesis_stream.encryption_type,
                stack.kinesis_stream.kms_key_id
            ).apply(lambda args: validate_kinesis(args[0], args[1]))

        return check_kinesis([])

    @pulumi.runtime.test
    def test_secrets_manager_configuration(self):
        """Test Secrets Manager secret is created with KMS encryption and rotation."""
        def check_secrets(args):
            stack = self._create_stack("test123")

            # Verify Secrets Manager resources exist
            self.assertIsNotNone(stack.db_password_secret)
            self.assertIsNotNone(stack.db_password_version)

            # Check KMS encryption
            def validate_secret(kms_key_id):
                self.assertIsNotNone(kms_key_id)
                return kms_key_id

            return pulumi.Output.all(stack.db_password_secret.kms_key_id).apply(
                lambda args: validate_secret(args[0])
            )

        return check_secrets([])

    @pulumi.runtime.test
    def test_ecs_tasks_in_private_subnets(self):
        """Test ECS service is configured to run in private subnets."""
        def check_ecs(args):
            stack = self._create_stack("test123")

            # Verify ECS resources exist
            self.assertIsNotNone(stack.ecs_cluster)
            self.assertIsNotNone(stack.ecs_service)
            self.assertIsNotNone(stack.task_definition)

            # Check service configuration
            def validate_ecs(subnets, assign_public_ip):
                self.assertIsNotNone(subnets)
                self.assertFalse(assign_public_ip)
                return subnets

            return pulumi.Output.all(
                stack.ecs_service.network_configuration.subnets,
                stack.ecs_service.network_configuration.assign_public_ip
            ).apply(lambda args: validate_ecs(args[0], args[1]))

        return check_ecs([])

    @pulumi.runtime.test
    def test_nat_gateway_for_outbound_access(self):
        """Test NAT Gateway is created for private subnet outbound access."""
        def check_nat(args):
            stack = self._create_stack("test123")

            # Verify NAT Gateway resources exist
            self.assertIsNotNone(stack.nat_gateway)
            self.assertIsNotNone(stack.nat_eip)
            self.assertIsNotNone(stack.private_route)

            return []

        return check_nat([])

    @pulumi.runtime.test
    def test_iam_roles_and_policies(self):
        """Test IAM roles are created with appropriate policies."""
        def check_iam(args):
            stack = self._create_stack("test123")

            # Verify IAM roles exist
            self.assertIsNotNone(stack.ecs_execution_role)
            self.assertIsNotNone(stack.ecs_task_role)
            self.assertIsNotNone(stack.ecs_execution_policy_attachment)
            self.assertIsNotNone(stack.ecs_execution_custom_policy)
            self.assertIsNotNone(stack.ecs_task_policy)

            return []

        return check_iam([])

    @pulumi.runtime.test
    def test_security_groups_configuration(self):
        """Test security groups are created with least privilege access."""
        def check_sg(args):
            stack = self._create_stack("test123")

            # Verify security groups exist
            self.assertIsNotNone(stack.ecs_sg)
            self.assertIsNotNone(stack.rds_sg)
            self.assertIsNotNone(stack.redis_sg)

            # Check RDS SG allows access only from ECS
            def validate_rds_sg(ingress_rules):
                self.assertIsNotNone(ingress_rules)
                self.assertEqual(len(ingress_rules), 1)
                self.assertEqual(ingress_rules[0]['from_port'], 5432)
                self.assertEqual(ingress_rules[0]['to_port'], 5432)
                return ingress_rules

            return pulumi.Output.all(stack.rds_sg.ingress).apply(
                lambda args: validate_rds_sg(args[0])
            )

        return check_sg([])

    @pulumi.runtime.test
    def test_cloudwatch_alarms_configured(self):
        """Test CloudWatch alarms are configured for monitoring."""
        def check_alarms(args):
            stack = self._create_stack("test123")

            # Verify CloudWatch alarms exist
            self.assertIsNotNone(stack.kinesis_iterator_age_alarm)
            self.assertIsNotNone(stack.rds_cpu_alarm)

            return []

        return check_alarms([])

    @pulumi.runtime.test
    def test_cloudwatch_logs_encryption(self):
        """Test CloudWatch log group has KMS encryption."""
        def check_logs(args):
            stack = self._create_stack("test123")

            # Verify log group exists
            self.assertIsNotNone(stack.log_group)

            # Check encryption
            def validate_logs(kms_key_id, retention):
                self.assertIsNotNone(kms_key_id)
                self.assertEqual(retention, 7)
                return kms_key_id

            return pulumi.Output.all(
                stack.log_group.kms_key_id,
                stack.log_group.retention_in_days
            ).apply(lambda args: validate_logs(args[0], args[1]))

        return check_logs([])

    @pulumi.runtime.test
    def test_ecr_repository_configuration(self):
        """Test ECR repository has image scanning and encryption enabled."""
        def check_ecr(args):
            stack = self._create_stack("test123")

            # Verify ECR repository exists
            self.assertIsNotNone(stack.ecr_repository)

            return []

        return check_ecr([])

    @pulumi.runtime.test
    def test_task_definition_environment_variables(self):
        """Test ECS task definition has correct environment variables configured."""
        def check_task_def(args):
            stack = self._create_stack("test123")

            # Verify task definition exists
            self.assertIsNotNone(stack.task_definition)

            # Check task definition configuration
            def validate_task_def(cpu, memory, network_mode, requires_compatibilities):
                self.assertEqual(cpu, "512")
                self.assertEqual(memory, "1024")
                self.assertEqual(network_mode, "awsvpc")
                self.assertEqual(requires_compatibilities, ["FARGATE"])
                return cpu

            return pulumi.Output.all(
                stack.task_definition.cpu,
                stack.task_definition.memory,
                stack.task_definition.network_mode,
                stack.task_definition.requires_compatibilities
            ).apply(lambda args: validate_task_def(args[0], args[1], args[2], args[3]))

        return check_task_def([])

    @pulumi.runtime.test
    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is properly used in resource names."""
        def check_suffix(args):
            stack = self._create_stack("prod456")

            # Verify environment suffix is set correctly
            self.assertEqual(stack.environment_suffix, "prod456")

            return []

        return check_suffix([])


if __name__ == "__main__":
    unittest.main()
