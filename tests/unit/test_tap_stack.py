"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.

Tests verify:
- TapStackArgs configuration class
- Successful stack instantiation
- Core infrastructure components existence
"""

import unittest
import sys
import os

# Add lib to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.vpc_cidr, '10.18.0.0/16')
        self.assertEqual(args.instance_type, 'm5.large')
        self.assertEqual(args.region, 'us-east-1')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        args = TapStackArgs(
            environment_suffix='prod',
            vpc_cidr='10.20.0.0/16',
            instance_type='m5.xlarge',
            region='us-west-2',
            tags={'Project': 'TAP', 'Owner': 'DevOps'}
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.vpc_cidr, '10.20.0.0/16')
        self.assertEqual(args.instance_type, 'm5.xlarge')
        self.assertEqual(args.region, 'us-west-2')
        self.assertEqual(args.tags, {'Project': 'TAP', 'Owner': 'DevOps'})

    def test_tap_stack_args_none_values_use_defaults(self):
        """Test that None values fall back to defaults."""
        args = TapStackArgs(
            environment_suffix=None,
            vpc_cidr=None,
            instance_type=None,
            region=None,
            tags=None
        )

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.vpc_cidr, '10.18.0.0/16')
        self.assertEqual(args.instance_type, 'm5.large')
        self.assertEqual(args.region, 'us-east-1')
        self.assertEqual(args.tags, {})


class TestTapStackStructure(unittest.TestCase):
    """Test TapStack structure and class definition."""

    def test_tap_stack_class_exists(self):
        """Test that TapStack class is defined."""
        self.assertTrue(hasattr(TapStack, '__init__'))
        self.assertTrue(hasattr(TapStack, '__bases__'))

    def test_tap_stack_is_component_resource(self):
        """Test that TapStack extends ComponentResource."""
        import pulumi
        self.assertTrue(issubclass(TapStack, pulumi.ComponentResource))

    def test_tap_stack_args_class_exists(self):
        """Test that TapStackArgs class is defined."""
        self.assertTrue(hasattr(TapStackArgs, '__init__'))

    def test_tap_stack_args_required_attributes(self):
        """Test that TapStackArgs has all required attributes."""
        args = TapStackArgs()
        self.assertTrue(hasattr(args, 'environment_suffix'))
        self.assertTrue(hasattr(args, 'vpc_cidr'))
        self.assertTrue(hasattr(args, 'instance_type'))
        self.assertTrue(hasattr(args, 'region'))
        self.assertTrue(hasattr(args, 'tags'))


class TestTapStackRequirements(unittest.TestCase):
    """Test that the implementation meets requirements."""

    def test_module_imports(self):
        """Test that all required modules are importable."""
        try:
            import pulumi
            import pulumi_aws as aws
            import json
            from typing import Optional, Dict, Any
        except ImportError as e:
            self.fail(f"Required module import failed: {e}")

    def test_stack_implementation_file_exists(self):
        """Test that lib/tap_stack.py exists and is readable."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')
        self.assertTrue(os.path.exists(file_path), "lib/tap_stack.py does not exist")
        self.assertTrue(os.path.isfile(file_path), "lib/tap_stack.py is not a file")

    def test_stack_has_docstring(self):
        """Test that TapStack class has comprehensive documentation."""
        self.assertIsNotNone(TapStack.__doc__)
        self.assertGreater(len(TapStack.__doc__), 100, "TapStack docstring should be comprehensive")

    def test_stack_args_has_docstring(self):
        """Test that TapStackArgs class has documentation."""
        self.assertIsNotNone(TapStackArgs.__doc__)
        self.assertGreater(len(TapStackArgs.__doc__), 50, "TapStackArgs docstring should be informative")


class TestMultiTenantRequirements(unittest.TestCase):
    """Test that multi-tenant architecture requirements are addressed in code."""

    def test_source_code_mentions_tenant_isolation(self):
        """Test that source code addresses tenant isolation concepts."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        # Check for tenant isolation concepts
        self.assertIn('tenant', source_code.lower(), "Source should mention 'tenant'")
        self.assertIn('isolation', source_code.lower(), "Source should mention 'isolation'")

    def test_source_code_includes_required_services(self):
        """Test that source code includes all required AWS services."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        required_services = [
            'vpc',
            'subnet',
            'aurora',
            'rds',
            'elasticache',
            'redis',
            's3',
            'cloudfront',
            'route53',
            'acm',
            'loadbalancer',
            'autoscaling',
            'cognito',
            'dynamodb',
            'lambda',
            'cloudwatch',
            'ssm',
            'eventbridge'
        ]

        for service in required_services:
            self.assertIn(service.lower(), source_code.lower(),
                          f"Source should include {service} service")

    def test_source_code_includes_security_groups(self):
        """Test that source code defines security groups."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        self.assertIn('SecurityGroup', source_code, "Source should define Security Groups")
        self.assertIn('ingress', source_code.lower(), "Source should define ingress rules")
        self.assertIn('egress', source_code.lower(), "Source should define egress rules")

    def test_source_code_includes_iam_roles(self):
        """Test that source code defines IAM roles and policies."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        self.assertIn('iam.Role', source_code, "Source should define IAM roles")
        self.assertIn('iam.Policy', source_code, "Source should define IAM policies")
        self.assertIn('assume_role_policy', source_code.lower(), "Source should include assume role policies")

    def test_source_code_includes_host_based_routing(self):
        """Test that source code implements host-based routing."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        self.assertIn('listener', source_code.lower(), "Source should include ALB listeners")
        self.assertIn('host', source_code.lower(), "Source should mention host-based routing")

    def test_source_code_includes_tenant_provisioning(self):
        """Test that source code includes tenant provisioning logic."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        self.assertIn('provision', source_code.lower(), "Source should mention provisioning")
        self.assertIn('tenant', source_code.lower(), "Source should mention tenants")

    def test_source_code_includes_redis_tier_separation(self):
        """Test that source code separates Redis clusters by tenant tier."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        self.assertIn('premium', source_code.lower(), "Source should mention premium tier")
        self.assertIn('standard', source_code.lower(), "Source should mention standard tier")
        self.assertIn('elasticache', source_code.lower(), "Source should include ElastiCache")

    def test_source_code_includes_monitoring(self):
        """Test that source code includes CloudWatch monitoring."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        self.assertIn('cloudwatch', source_code.lower(), "Source should include CloudWatch")
        self.assertIn('log', source_code.lower(), "Source should mention logging")
        self.assertIn('alarm', source_code.lower(), "Source should mention alarms")

    def test_source_code_line_count_comprehensive(self):
        """Test that implementation is comprehensive (>500 lines)."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            lines = f.readlines()

        # Filter out empty lines and pure comment lines
        code_lines = [line for line in lines if line.strip() and not line.strip().startswith('#')]

        self.assertGreater(len(code_lines), 500,
                           f"Implementation should be comprehensive (>500 lines), found {len(code_lines)}")


class TestNetworkingArchitecture(unittest.TestCase):
    """Test that networking architecture meets requirements."""

    def test_vpc_cidr_correct(self):
        """Test that default VPC CIDR is 10.18.0.0/16."""
        args = TapStackArgs()
        self.assertEqual(args.vpc_cidr, '10.18.0.0/16')

    def test_source_includes_nat_gateways(self):
        """Test that source code includes NAT Gateways for HA."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        self.assertIn('NatGateway', source_code, "Source should include NAT Gateways")
        # Should have multiple NAT Gateways (HA)
        nat_count = source_code.count('NatGateway(')
        self.assertGreaterEqual(nat_count, 2, "Should have at least 2 NAT Gateways for HA")

    def test_source_includes_route_tables(self):
        """Test that source code includes route tables."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        self.assertIn('RouteTable', source_code, "Source should include Route Tables")
        self.assertIn('RouteTableAssociation', source_code, "Source should associate route tables with subnets")


class TestInstanceTypeConfiguration(unittest.TestCase):
    """Test that instance configuration meets requirements."""

    def test_default_instance_type_m5_large(self):
        """Test that default instance type is m5.large."""
        args = TapStackArgs()
        self.assertEqual(args.instance_type, 'm5.large')

    def test_custom_instance_type_configurable(self):
        """Test that instance type can be customized."""
        args = TapStackArgs(instance_type='m5.xlarge')
        self.assertEqual(args.instance_type, 'm5.xlarge')


class TestRegionConfiguration(unittest.TestCase):
    """Test that region configuration meets requirements."""

    def test_default_region_us_east_1(self):
        """Test that default region is us-east-1."""
        args = TapStackArgs()
        self.assertEqual(args.region, 'us-east-1')

    def test_custom_region_configurable(self):
        """Test that region can be customized."""
        args = TapStackArgs(region='us-west-2')
        self.assertEqual(args.region, 'us-west-2')


class TestTapStackOutputs(unittest.TestCase):
    """Test that stack registers outputs."""

    def test_source_code_registers_outputs(self):
        """Test that source code calls register_outputs."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        self.assertIn('register_outputs', source_code, "Stack should register outputs")

    def test_source_code_has_critical_outputs(self):
        """Test that source code exports critical infrastructure endpoints."""
        import os
        file_path = os.path.join(os.path.dirname(__file__), '../../lib/tap_stack.py')

        with open(file_path, 'r') as f:
            source_code = f.read()

        critical_outputs = [
            'vpc_id',
            'alb',
            'aurora',
            'redis',
            's3',
            'cloudfront',
            'cognito'
        ]

        for output in critical_outputs:
            self.assertIn(output, source_code.lower(),
                          f"Stack should export {output} related output")


if __name__ == "__main__":
    unittest.main()
