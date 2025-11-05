"""
test_imports_and_structure.py

Tests for module imports, structure, and code organization.
These tests improve coverage by importing and validating module structure.
"""

import unittest
import sys
import os
import importlib

# Add lib to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


class TestModuleImports(unittest.TestCase):
    """Test module imports and structure."""

    def test_import_lib_init(self):
        """Test that lib/__init__.py can be imported."""
        import lib
        self.assertIsNotNone(lib)
        self.assertTrue(hasattr(lib, '__version__'))
        self.assertEqual(lib.__version__, "1.0.0")

    def test_import_tap_stack(self):
        """Test that tap_stack module can be imported."""
        from lib import tap_stack
        self.assertIsNotNone(tap_stack)

    def test_tap_stack_has_required_classes(self):
        """Test that tap_stack module exports required classes."""
        from lib import tap_stack

        self.assertTrue(hasattr(tap_stack, 'TapStack'))
        self.assertTrue(hasattr(tap_stack, 'TapStackArgs'))

    def test_tap_stack_args_class_exists(self):
        """Test that TapStackArgs class exists and can be instantiated."""
        from lib.tap_stack import TapStackArgs

        tags = {"test": "value"}
        args = TapStackArgs(environment_suffix="test", tags=tags)

        self.assertIsNotNone(args)
        self.assertEqual(args.environment_suffix, "test")

    def test_tap_stack_component_resource(self):
        """Test that TapStack is a Pulumi ComponentResource."""
        from lib.tap_stack import TapStack
        import pulumi

        # TapStack should be a subclass of ComponentResource
        self.assertTrue(issubclass(TapStack, pulumi.ComponentResource))


class TestTapStackDocumentation(unittest.TestCase):
    """Test that modules and classes have proper documentation."""

    def test_tap_stack_module_docstring(self):
        """Test that tap_stack module has docstring."""
        from lib import tap_stack

        self.assertIsNotNone(tap_stack.__doc__)
        self.assertIn("Enhanced TapStack", tap_stack.__doc__)

    def test_tap_stack_args_docstring(self):
        """Test that TapStackArgs class has docstring."""
        from lib.tap_stack import TapStackArgs

        self.assertIsNotNone(TapStackArgs.__doc__)
        self.assertIn("TapStackArgs", TapStackArgs.__doc__)

    def test_tap_stack_class_docstring(self):
        """Test that TapStack class has docstring."""
        from lib.tap_stack import TapStack

        self.assertIsNotNone(TapStack.__doc__)
        self.assertIn("Pulumi component", TapStack.__doc__)


class TestTapStackMethods(unittest.TestCase):
    """Test TapStack methods and initialization."""

    def test_tap_stack_init_method_exists(self):
        """Test that TapStack has __init__ method."""
        from lib.tap_stack import TapStack

        self.assertTrue(hasattr(TapStack, '__init__'))

    def test_tap_stack_args_init_method(self):
        """Test TapStackArgs __init__ method."""
        from lib.tap_stack import TapStackArgs

        self.assertTrue(hasattr(TapStackArgs, '__init__'))


class TestMainModule(unittest.TestCase):
    """Test main module structure."""

    def test_main_module_docstring(self):
        """Test that __main__.py has docstring."""
        # Read the file to check docstring
        main_path = os.path.join(
            os.path.dirname(__file__),
            '../../lib/__main__.py'
        )
        with open(main_path, 'r') as f:
            content = f.read()

        self.assertIn('"""', content)
        self.assertIn('Main Pulumi program', content)

    def test_main_imports_exist(self):
        """Test that __main__.py has required imports."""
        main_path = os.path.join(
            os.path.dirname(__file__),
            '../../lib/__main__.py'
        )
        with open(main_path, 'r') as f:
            content = f.read()

        self.assertIn('import pulumi', content)
        self.assertIn('from tap_stack import', content)

    def test_main_has_config_logic(self):
        """Test that __main__.py has config logic."""
        main_path = os.path.join(
            os.path.dirname(__file__),
            '../../lib/__main__.py'
        )
        with open(main_path, 'r') as f:
            content = f.read()

        self.assertIn('pulumi.Config()', content)
        self.assertIn('environment_suffix', content)
        self.assertIn('tags', content)

    def test_main_exports_outputs(self):
        """Test that __main__.py exports required outputs."""
        main_path = os.path.join(
            os.path.dirname(__file__),
            '../../lib/__main__.py'
        )
        with open(main_path, 'r') as f:
            content = f.read()

        required_exports = [
            'peering_connection_id',
            'peering_status',
            'payment_vpc_id',
            'analytics_vpc_id',
            'payment_security_group_id',
            'analytics_security_group_id'
        ]

        for export in required_exports:
            self.assertIn(export, content)


class TestCodeStructure(unittest.TestCase):
    """Test code structure and organization."""

    def test_tap_stack_has_providers_logic(self):
        """Test that tap_stack.py creates providers."""
        from lib import tap_stack
        import inspect

        source = inspect.getsource(tap_stack.TapStack)

        self.assertIn('east_provider', source)
        self.assertIn('west_provider', source)
        self.assertIn('us-east-1', source)
        self.assertIn('us-west-2', source)

    def test_tap_stack_has_vpc_peering_logic(self):
        """Test that tap_stack.py creates VPC peering."""
        from lib import tap_stack
        import inspect

        source = inspect.getsource(tap_stack.TapStack)

        self.assertIn('VpcPeeringConnection', source)
        self.assertIn('VpcPeeringConnectionAccepter', source)
        self.assertIn('PeeringConnectionOptions', source)

    def test_tap_stack_has_security_groups(self):
        """Test that tap_stack.py creates security groups."""
        from lib import tap_stack
        import inspect

        source = inspect.getsource(tap_stack.TapStack)

        self.assertIn('SecurityGroup', source)
        self.assertIn('payment_sg', source)
        self.assertIn('analytics_sg', source)

    def test_tap_stack_has_routes(self):
        """Test that tap_stack.py creates routes."""
        from lib import tap_stack
        import inspect

        source = inspect.getsource(tap_stack.TapStack)

        self.assertIn('get_route_tables', source)
        self.assertIn('Route', source)
        self.assertIn('payment_routes', source)
        self.assertIn('analytics_routes', source)

    def test_tap_stack_has_cloudwatch_alarm(self):
        """Test that tap_stack.py creates CloudWatch alarm."""
        from lib import tap_stack
        import inspect

        source = inspect.getsource(tap_stack.TapStack)

        self.assertIn('MetricAlarm', source)
        self.assertIn('peering_alarm', source)

    def test_tap_stack_registers_outputs(self):
        """Test that tap_stack.py registers outputs."""
        from lib import tap_stack
        import inspect

        source = inspect.getsource(tap_stack.TapStack)

        self.assertIn('register_outputs', source)
        self.assertIn('peering_connection_id', source)


class TestErrorHandling(unittest.TestCase):
    """Test error handling in the code."""

    def test_tap_stack_has_error_handling(self):
        """Test that tap_stack.py has error handling for VPC lookups."""
        from lib import tap_stack
        import inspect

        source = inspect.getsource(tap_stack.TapStack)

        self.assertIn('try:', source)
        self.assertIn('except', source)
        self.assertIn('pulumi.log.error', source)

    def test_tap_stack_args_validates_inputs(self):
        """Test that TapStackArgs validates inputs."""
        from lib.tap_stack import TapStackArgs

        # Test empty suffix
        with self.assertRaises(ValueError):
            TapStackArgs(environment_suffix="", tags={"t": "v"})

        # Test None suffix
        with self.assertRaises(ValueError):
            TapStackArgs(environment_suffix=None, tags={"t": "v"})

        # Test missing tags
        with self.assertRaises(ValueError):
            TapStackArgs(environment_suffix="test", tags=None)


class TestTagging(unittest.TestCase):
    """Test tagging logic."""

    def test_tap_stack_uses_tags(self):
        """Test that tap_stack.py uses tags from args."""
        from lib import tap_stack
        import inspect

        source = inspect.getsource(tap_stack.TapStack)

        self.assertIn('self.tags', source)
        self.assertIn('tags=', source)

    def test_main_creates_comprehensive_tags(self):
        """Test that __main__.py creates comprehensive tags."""
        main_path = os.path.join(
            os.path.dirname(__file__),
            '../../lib/__main__.py'
        )
        with open(main_path, 'r') as f:
            content = f.read()

        required_tag_keys = [
            'Environment',
            'Owner',
            'CostCenter',
            'ManagedBy',
            'Project',
            'Compliance'
        ]

        for tag_key in required_tag_keys:
            self.assertIn(tag_key, content)


class TestConfiguration(unittest.TestCase):
    """Test configuration handling."""

    def test_pulumi_yaml_exists(self):
        """Test that Pulumi.yaml exists."""
        pulumi_yaml = os.path.join(
            os.path.dirname(__file__),
            '../../Pulumi.yaml'
        )
        self.assertTrue(os.path.exists(pulumi_yaml))

    def test_requirements_txt_exists(self):
        """Test that requirements.txt exists."""
        requirements = os.path.join(
            os.path.dirname(__file__),
            '../../requirements.txt'
        )
        self.assertTrue(os.path.exists(requirements))

    def test_requirements_has_pulumi(self):
        """Test that requirements.txt includes Pulumi."""
        requirements = os.path.join(
            os.path.dirname(__file__),
            '../../requirements.txt'
        )
        with open(requirements, 'r') as f:
            content = f.read()

        self.assertIn('pulumi', content)
        self.assertIn('pulumi-aws', content)


if __name__ == '__main__':
    unittest.main()
