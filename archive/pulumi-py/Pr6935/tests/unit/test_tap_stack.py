"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.
Tests all methods and branches using Pulumi's testing framework.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {}
        # Copy inputs to outputs
        outputs.update(args.inputs)

        # Add standard outputs
        outputs['id'] = args.name + '_id'
        outputs['urn'] = f'urn:pulumi:test::project::aws:{args.typ}::{args.name}'
        outputs['arn'] = f'arn:aws:{args.typ}:us-east-1:123456789012:{args.name}'

        # Resource-specific outputs
        if 'Vpc' in args.typ:
            outputs['cidr_block'] = '10.0.0.0/16'
        elif 'Subnet' in args.typ:
            outputs['availability_zone'] = 'us-east-1a'
        elif 'Cluster' in args.typ:
            outputs['endpoint'] = f'{args.name}.cluster-abc123.us-east-1.rds.amazonaws.com'
            outputs['reader_endpoint'] = f'{args.name}.cluster-ro-abc123.us-east-1.rds.amazonaws.com'
        elif 'LoadBalancer' in args.typ:
            outputs['dns_name'] = f'{args.name}-1234567890.us-east-1.elb.amazonaws.com'
        elif 'Bucket' in args.typ:
            outputs['bucket'] = args.inputs.get('bucket', args.name)
        elif 'Secret' in args.typ:
            outputs['name'] = args.inputs.get('name', args.name)

        return [outputs['id'], outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls like aws.get_availability_zones()."""
        if args.token == 'aws:index/getAvailabilityZones:getAvailabilityZones':
            return {
                'id': 'us-east-1',
                'names': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
                'zone_ids': ['use1-az1', 'use1-az2', 'use1-az3']
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
        self.assertEqual(args.tenants, ['acme-corp', 'globex-inc', 'initech-llc'])

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Project': 'Test', 'Owner': 'TestUser'}
        custom_tenants = ['tenant1', 'tenant2']

        args = TapStackArgs(
            environment_suffix='prod',
            tags=custom_tags,
            tenants=custom_tenants
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.tenants, custom_tenants)

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags converts to empty dict."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(tags=None)

        self.assertEqual(args.tags, {})

    def test_tap_stack_args_none_tenants(self):
        """Test TapStackArgs with None tenants uses default list."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(tenants=None)

        self.assertEqual(args.tenants, ['acme-corp', 'globex-inc', 'initech-llc'])


class TestTapStackIntegration(unittest.TestCase):
    """Integration-style tests for TapStack with full resource creation."""

    @pulumi.runtime.test
    def test_tap_stack_creates_all_resources(self):
        """Test that TapStack creates all expected resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        def check_vpc(vpc_id):
            # VPC created
            self.assertIsNotNone(vpc_id)

        def check_public_subnets(subnets):
            # 3 public subnets created
            self.assertEqual(len(subnets), 3)

        def check_private_subnets(subnets):
            # 3 private subnets created
            self.assertEqual(len(subnets), 3)

        def check_nat_gateways(nat_gateways):
            # 3 NAT gateways created
            self.assertEqual(len(nat_gateways), 3)

        # Verify VPC resources
        pulumi.Output.from_input(stack.vpc.id).apply(check_vpc)
        pulumi.Output.from_input(stack.public_subnets).apply(check_public_subnets)
        pulumi.Output.from_input(stack.private_subnets).apply(check_private_subnets)
        pulumi.Output.from_input(stack.nat_gateways).apply(check_nat_gateways)

    @pulumi.runtime.test
    def test_security_groups_per_tenant(self):
        """Test that security groups are created for each tenant."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify security groups
        self.assertIsNotNone(stack.alb_sg)
        self.assertIsNotNone(stack.rds_sg)
        self.assertEqual(len(stack.ecs_sgs), 3)

    @pulumi.runtime.test
    def test_aurora_cluster_configuration(self):
        """Test Aurora cluster is configured correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify Aurora resources
        self.assertIsNotNone(stack.aurora_cluster)
        self.assertIsNotNone(stack.aurora_instance)
        self.assertIsNotNone(stack.db_subnet_group)
        self.assertIsNotNone(stack.db_cluster_param_group)
        self.assertIsNotNone(stack.master_secret)

    @pulumi.runtime.test
    def test_tenant_resources_all_created(self):
        """Test all tenant-specific resources are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify tenant resources for all 3 tenants
        self.assertEqual(len(stack.tenant_resources), 3)

        for tenant_id in ['acme-corp', 'globex-inc', 'initech-llc']:
            self.assertIn(tenant_id, stack.tenant_resources)
            resources = stack.tenant_resources[tenant_id]

            # Check all expected resources exist
            self.assertIn('secret', resources)
            self.assertIn('secret_version', resources)
            self.assertIn('bucket', resources)
            self.assertIn('task_role', resources)
            self.assertIn('s3_policy', resources)
            self.assertIn('execution_role', resources)
            self.assertIn('log_group', resources)
            self.assertIn('task_definition', resources)
            self.assertIn('target_group', resources)

    @pulumi.runtime.test
    def test_alb_and_routing(self):
        """Test ALB and routing configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify ALB resources
        self.assertIsNotNone(stack.alb)
        self.assertIsNotNone(stack.alb_listener)
        self.assertIsNotNone(stack.default_tg)
        self.assertEqual(len(stack.listener_rules), 3)

    @pulumi.runtime.test
    def test_ecs_cluster_and_services(self):
        """Test ECS cluster and services configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify ECS resources
        self.assertIsNotNone(stack.ecs_cluster)
        self.assertEqual(len(stack.ecs_services), 3)

    @pulumi.runtime.test
    def test_custom_environment_suffix(self):
        """Test stack with custom environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='custom123')
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.environment_suffix, 'custom123')

    @pulumi.runtime.test
    def test_custom_tags(self):
        """Test stack with custom tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {'Project': 'TestProject', 'Environment': 'testing'}
        args = TapStackArgs(tags=custom_tags)
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.tags, custom_tags)

    @pulumi.runtime.test
    def test_custom_tenants(self):
        """Test stack with custom tenant list."""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tenants = ['tenant-a', 'tenant-b']
        args = TapStackArgs(tenants=custom_tenants)
        stack = TapStack('test-stack', args)

        self.assertEqual(len(stack.tenant_resources), 2)
        self.assertIn('tenant-a', stack.tenant_resources)
        self.assertIn('tenant-b', stack.tenant_resources)

    @pulumi.runtime.test
    def test_vpc_cidr_and_subnets(self):
        """Test VPC CIDR configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # VPC should be created
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.igw)

    @pulumi.runtime.test
    def test_route_tables_created(self):
        """Test route tables are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Public route table should exist
        self.assertIsNotNone(stack.public_rt)

    @pulumi.runtime.test
    def test_eips_created(self):
        """Test Elastic IPs are created for NAT gateways."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # 3 EIPs for 3 NAT gateways
        self.assertEqual(len(stack.eips), 3)

    @pulumi.runtime.test
    def test_single_tenant(self):
        """Test stack with single tenant."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(tenants=['single-tenant'])
        stack = TapStack('test-stack', args)

        self.assertEqual(len(stack.tenant_resources), 1)
        self.assertIn('single-tenant', stack.tenant_resources)

    @pulumi.runtime.test
    def test_multiple_ecs_security_groups(self):
        """Test ECS security groups match tenant count."""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tenants = ['t1', 't2', 't3', 't4']
        args = TapStackArgs(tenants=custom_tenants)
        stack = TapStack('test-stack', args)

        # One security group per tenant
        self.assertEqual(len(stack.ecs_sgs), 4)

    @pulumi.runtime.test
    def test_listener_rules_match_tenants(self):
        """Test listener rules match tenant count."""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tenants = ['t1', 't2']
        args = TapStackArgs(tenants=custom_tenants)
        stack = TapStack('test-stack', args)

        # One listener rule per tenant
        self.assertEqual(len(stack.listener_rules), 2)

    @pulumi.runtime.test
    def test_ecs_services_match_tenants(self):
        """Test ECS services match tenant count."""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tenants = ['t1', 't2']
        args = TapStackArgs(tenants=custom_tenants)
        stack = TapStack('test-stack', args)

        # One ECS service per tenant
        self.assertEqual(len(stack.ecs_services), 2)


if __name__ == '__main__':
    unittest.main()
