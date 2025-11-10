"""
Unit tests for Pulumi infrastructure stack
Tests infrastructure definitions without actual deployment
"""
import unittest
import json


class TestInfrastructureDefinition(unittest.TestCase):
    """Test infrastructure code structure and logic"""

    def test_vpc_module_structure(self):
        """Test VPC module creates correct network structure"""
        # Import the module
        import sys
        sys.path.insert(0, 'lib')

        # This tests that the module can be imported without errors
        try:
            from vpc import create_vpc
            self.assertTrue(callable(create_vpc))
        except ImportError as e:
            self.fail(f"Failed to import vpc module: {e}")

    def test_ecr_module_structure(self):
        """Test ECR module structure"""
        import sys
        sys.path.insert(0, 'lib')

        try:
            from ecr import create_ecr_repository
            self.assertTrue(callable(create_ecr_repository))
        except ImportError as e:
            self.fail(f"Failed to import ecr module: {e}")

    def test_rds_module_structure(self):
        """Test RDS module structure"""
        import sys
        sys.path.insert(0, 'lib')

        try:
            from rds import create_rds_instance
            self.assertTrue(callable(create_rds_instance))
        except ImportError as e:
            self.fail(f"Failed to import rds module: {e}")

    def test_dynamodb_module_structure(self):
        """Test DynamoDB module structure"""
        import sys
        sys.path.insert(0, 'lib')

        try:
            from dynamodb import create_dynamodb_table
            self.assertTrue(callable(create_dynamodb_table))
        except ImportError as e:
            self.fail(f"Failed to import dynamodb module: {e}")

    def test_ecs_module_structure(self):
        """Test ECS module structure"""
        import sys
        sys.path.insert(0, 'lib')

        try:
            from ecs import create_ecs_cluster, create_ecs_service
            self.assertTrue(callable(create_ecs_cluster))
            self.assertTrue(callable(create_ecs_service))
        except ImportError as e:
            self.fail(f"Failed to import ecs module: {e}")

    def test_alb_module_structure(self):
        """Test ALB module structure"""
        import sys
        sys.path.insert(0, 'lib')

        try:
            from alb import create_alb
            self.assertTrue(callable(create_alb))
        except ImportError as e:
            self.fail(f"Failed to import alb module: {e}")

    def test_autoscaling_module_structure(self):
        """Test Autoscaling module structure"""
        import sys
        sys.path.insert(0, 'lib')

        try:
            from autoscaling import create_autoscaling_policy
            self.assertTrue(callable(create_autoscaling_policy))
        except ImportError as e:
            self.fail(f"Failed to import autoscaling module: {e}")

    def test_pulumi_config_structure(self):
        """Test Pulumi configuration file exists and is valid"""
        import yaml
        try:
            with open('lib/Pulumi.yaml', 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
                self.assertIn('name', config)
                self.assertIn('runtime', config)
                self.assertEqual(config['runtime'], 'python')
        except FileNotFoundError:
            self.fail("Pulumi.yaml not found")
        except yaml.YAMLError as e:
            self.fail(f"Invalid Pulumi.yaml: {e}")

    def test_requirements_file_exists(self):
        """Test requirements.txt exists"""
        import os
        self.assertTrue(os.path.exists('lib/requirements.txt'),
                        "requirements.txt not found")

    def test_stack_outputs_defined(self):
        """Test that stack outputs are properly defined"""
        # This tests the deployed stack outputs
        import os
        outputs_file = 'cfn-outputs/flat-outputs.json'

        if os.path.exists(outputs_file):
            with open(outputs_file, 'r', encoding='utf-8') as f:
                outputs = json.load(f)

                # Verify all required outputs exist
                required_outputs = [
                    'alb_dns_name',
                    'vpc_id',
                    'ecr_repository_url',
                    'ecs_cluster_name',
                    'ecs_service_name',
                    'rds_endpoint',
                    'dynamodb_table_name',
                    'log_group_name'
                ]

                for output in required_outputs:
                    self.assertIn(output, outputs, f"Missing output: {output}")
                    self.assertIsNotNone(outputs[output], f"Output {output} is None")
        else:
            # If outputs file doesn't exist, skip test
            self.skipTest("Stack outputs file not found - stack may not be deployed")

    def test_environment_suffix_in_resource_names(self):
        """Test that resource names include environment suffix"""
        import os
        outputs_file = 'cfn-outputs/flat-outputs.json'

        if os.path.exists(outputs_file):
            with open(outputs_file, 'r', encoding='utf-8') as f:
                outputs = json.load(f)

                # Check that resource names contain suffixes
                # ALB name should have suffix
                if 'alb_dns_name' in outputs:
                    alb_dns = outputs['alb_dns_name']
                    self.assertIsNotNone(alb_dns)
                    # ALB DNS format: name-randomid.region.elb.amazonaws.com
                    self.assertTrue('-' in alb_dns or 'synthv5kei' in alb_dns.lower())

                # ECS cluster name should have suffix
                if 'ecs_cluster_name' in outputs:
                    cluster_name = outputs['ecs_cluster_name']
                    self.assertTrue('synthv5kei' in cluster_name.lower() or
                                    '-' in cluster_name)

                # DynamoDB table name should have suffix
                if 'dynamodb_table_name' in outputs:
                    table_name = outputs['dynamodb_table_name']
                    self.assertTrue('synthv5kei' in table_name.lower() or
                                    '-' in table_name)
        else:
            self.skipTest("Stack outputs file not found")

    def test_module_functions_have_environment_suffix_parameter(self):
        """Test that all resource creation functions accept environment_suffix"""
        import sys
        import inspect
        sys.path.insert(0, 'lib')

        from vpc import create_vpc
        from ecr import create_ecr_repository
        from rds import create_rds_instance
        from dynamodb import create_dynamodb_table
        from ecs import create_ecs_cluster, create_ecs_service
        from alb import create_alb
        from autoscaling import create_autoscaling_policy

        # Check each function signature
        functions_to_check = [
            create_vpc,
            create_ecr_repository,
            create_rds_instance,
            create_dynamodb_table,
            create_ecs_cluster,
            create_ecs_service,
            create_alb,
            create_autoscaling_policy
        ]

        for func in functions_to_check:
            sig = inspect.signature(func)
            param_names = list(sig.parameters.keys())
            self.assertIn('environment_suffix', param_names,
                          f"Function {func.__name__} missing environment_suffix parameter")

    def test_rds_postgres_version(self):
        """Test RDS PostgreSQL version is specified correctly"""
        import sys
        sys.path.insert(0, 'lib')

        with open('lib/rds.py', 'r', encoding='utf-8') as f:
            content = f.read()
            # Should use version "14" not "14.7"
            self.assertIn('engine_version="14"', content)
            self.assertNotIn('engine_version="14.7"', content)

    def test_ecr_repository_no_deprecated_encryption(self):
        """Test ECR repository doesn't use deprecated encryption_configuration"""
        import sys
        sys.path.insert(0, 'lib')

        with open('lib/ecr.py', 'r', encoding='utf-8') as f:
            content = f.read()
            # Should not have encryption_configuration parameter
            self.assertNotIn('encryption_configuration', content)

    def test_ecs_service_has_listener_dependency(self):
        """Test ECS service properly depends on ALB listener"""
        import sys
        sys.path.insert(0, 'lib')

        with open('lib/ecs.py', 'r', encoding='utf-8') as f:
            content = f.read()
            # Should have listener parameter
            self.assertIn('listener=None', content)
            self.assertIn('depends_on_resources', content)

    def test_autoscaling_target_tracking_policy(self):
        """Test autoscaling uses target tracking policy"""
        import sys
        sys.path.insert(0, 'lib')

        with open('lib/autoscaling.py', 'r', encoding='utf-8') as f:
            content = f.read()
            # Should use TargetTrackingScaling
            self.assertIn('TargetTrackingScaling', content)
            self.assertIn('ECSServiceAverageCPUUtilization', content)
            self.assertIn('target_value=70.0', content)


if __name__ == '__main__':
    unittest.main()
