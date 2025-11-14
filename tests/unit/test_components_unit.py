"""
Unit tests for multi-environment infrastructure components.
Tests component logic, configuration, and resource creation patterns.
"""

import unittest
import os
import yaml
from unittest.mock import Mock, patch, MagicMock
import pulumi


class TestComponentConfiguration(unittest.TestCase):
    """Test component configuration and structure."""

    def test_vpc_component_file_exists(self):
        """Test VPC component file exists."""
        self.assertTrue(os.path.exists("lib/components/vpc.py"))

    def test_alb_component_file_exists(self):
        """Test ALB component file exists."""
        self.assertTrue(os.path.exists("lib/components/alb.py"))

    def test_asg_component_file_exists(self):
        """Test ASG component file exists."""
        self.assertTrue(os.path.exists("lib/components/asg.py"))

    def test_rds_component_file_exists(self):
        """Test RDS component file exists."""
        self.assertTrue(os.path.exists("lib/components/rds.py"))

    def test_s3_component_file_exists(self):
        """Test S3 component file exists."""
        self.assertTrue(os.path.exists("lib/components/s3.py"))

    def test_component_imports(self):
        """Test that all components can be imported."""
        from lib.components.vpc import VpcComponent
        from lib.components.alb import AlbComponent
        from lib.components.asg import AsgComponent
        from lib.components.rds import RdsComponent
        from lib.components.s3 import S3Component

        # Verify classes are defined
        self.assertTrue(callable(VpcComponent))
        self.assertTrue(callable(AlbComponent))
        self.assertTrue(callable(AsgComponent))
        self.assertTrue(callable(RdsComponent))
        self.assertTrue(callable(S3Component))


class TestStackConfiguration(unittest.TestCase):
    """Test stack configuration files."""

    def test_pulumi_yaml_exists(self):
        """Test main Pulumi.yaml exists."""
        self.assertTrue(os.path.exists("Pulumi.yaml"))


class TestMainProgram(unittest.TestCase):
    """Test main Pulumi program."""

    def test_entry_point_exists(self):
        """Test entry point file exists."""
        self.assertTrue(os.path.exists("lib/tap_stack.py"))

    def test_tap_stack_exists(self):
        """Test TapStack class exists in lib folder."""
        self.assertTrue(os.path.exists("lib/tap_stack.py"))

    def test_tap_stack_imports(self):
        """Test TapStack imports required modules."""
        # Read lib/tap_stack.py to verify imports
        with open("lib/tap_stack.py", 'r') as f:
            content = f.read()

        # Check for required imports
        self.assertIn('import pulumi', content)
        self.assertIn('import pulumi_aws', content)
        self.assertIn('from lib.components.vpc import VpcComponent', content)
        self.assertIn('from lib.components.alb import AlbComponent', content)
        self.assertIn('from lib.components.asg import AsgComponent', content)
        self.assertIn('from lib.components.rds import RdsComponent', content)
        self.assertIn('from lib.components.s3 import S3Component', content)

    def test_main_program_config_usage(self):
        """Test main program reads configuration."""
        with open("lib/tap_stack.py", 'r') as f:
            content = f.read()

        # Verify configuration is read
        self.assertIn('pulumi.Config()', content)
        self.assertIn('environment_suffix', content)

    def test_main_program_exports(self):
        """Test main program exports required outputs."""
        with open("lib/tap_stack.py", 'r') as f:
            content = f.read()

        # Check for stack exports
        self.assertIn('pulumi.export', content)
        self.assertIn('vpc_id', content)
        self.assertIn('alb_dns_name', content)
        self.assertIn('rds_endpoint', content)
        self.assertIn('s3_bucket_name', content)


class TestVpcComponent(unittest.TestCase):
    """Test VPC component structure."""

    def test_vpc_component_class_definition(self):
        """Test VPC component has proper class structure."""
        with open("lib/components/vpc.py", 'r') as f:
            content = f.read()

        # Verify class definition
        self.assertIn('class VpcComponent', content)
        self.assertIn('ComponentResource', content)
        self.assertIn('def __init__', content)

    def test_vpc_component_creates_subnets(self):
        """Test VPC component creates public and private subnets."""
        with open("lib/components/vpc.py", 'r') as f:
            content = f.read()

        self.assertIn('public_subnets', content)
        self.assertIn('private_subnets', content)
        self.assertIn('aws.ec2.Subnet', content)

    def test_vpc_component_creates_nat_gateway(self):
        """Test VPC component creates NAT gateway."""
        with open("lib/components/vpc.py", 'r') as f:
            content = f.read()

        self.assertIn('NatGateway', content)
        self.assertIn('Eip', content)

    def test_vpc_component_uses_environment_suffix(self):
        """Test VPC component uses environment suffix in naming."""
        with open("lib/components/vpc.py", 'r') as f:
            content = f.read()

        self.assertIn('environment_suffix', content)


class TestAlbComponent(unittest.TestCase):
    """Test ALB component structure."""

    def test_alb_component_class_definition(self):
        """Test ALB component has proper class structure."""
        with open("lib/components/alb.py", 'r') as f:
            content = f.read()

        self.assertIn('class AlbComponent', content)
        self.assertIn('ComponentResource', content)

    def test_alb_component_creates_security_group(self):
        """Test ALB component creates security group."""
        with open("lib/components/alb.py", 'r') as f:
            content = f.read()

        self.assertIn('SecurityGroup', content)
        self.assertIn('ingress', content)
        self.assertIn('egress', content)

    def test_alb_component_creates_load_balancer(self):
        """Test ALB component creates load balancer."""
        with open("lib/components/alb.py", 'r') as f:
            content = f.read()

        self.assertIn('LoadBalancer', content)
        self.assertIn('application', content)

    def test_alb_component_creates_target_group(self):
        """Test ALB component creates target group."""
        with open("lib/components/alb.py", 'r') as f:
            content = f.read()

        self.assertIn('TargetGroup', content)
        self.assertIn('health_check', content)

    def test_alb_component_deletion_protection_disabled(self):
        """Test ALB has deletion protection disabled."""
        with open("lib/components/alb.py", 'r') as f:
            content = f.read()

        self.assertIn('enable_deletion_protection=False', content)


class TestAsgComponent(unittest.TestCase):
    """Test ASG component structure."""

    def test_asg_component_class_definition(self):
        """Test ASG component has proper class structure."""
        with open("lib/components/asg.py", 'r') as f:
            content = f.read()

        self.assertIn('class AsgComponent', content)
        self.assertIn('ComponentResource', content)

    def test_asg_component_creates_launch_template(self):
        """Test ASG component creates launch template."""
        with open("lib/components/asg.py", 'r') as f:
            content = f.read()

        self.assertIn('LaunchTemplate', content)
        self.assertIn('instance_type', content)
        self.assertIn('ami_id', content)

    def test_asg_component_creates_auto_scaling_group(self):
        """Test ASG component creates auto scaling group."""
        with open("lib/components/asg.py", 'r') as f:
            content = f.read()

        self.assertIn('autoscaling.Group', content)
        self.assertIn('min_size', content)
        self.assertIn('max_size', content)
        self.assertIn('desired_capacity', content)

    def test_asg_component_has_user_data(self):
        """Test ASG component includes user data script."""
        with open("lib/components/asg.py", 'r') as f:
            content = f.read()

        self.assertIn('user_data', content)


class TestRdsComponent(unittest.TestCase):
    """Test RDS component structure."""

    def test_rds_component_class_definition(self):
        """Test RDS component has proper class structure."""
        with open("lib/components/rds.py", 'r') as f:
            content = f.read()

        self.assertIn('class RdsComponent', content)
        self.assertIn('ComponentResource', content)

    def test_rds_component_creates_secret(self):
        """Test RDS component creates Secrets Manager secret."""
        with open("lib/components/rds.py", 'r') as f:
            content = f.read()

        self.assertIn('secretsmanager.Secret', content)
        self.assertIn('SecretVersion', content)

    def test_rds_component_creates_database(self):
        """Test RDS component creates RDS instance."""
        with open("lib/components/rds.py", 'r') as f:
            content = f.read()

        self.assertIn('rds.Instance', content)
        self.assertIn('engine', content)
        self.assertIn('mysql', content)

    def test_rds_component_skip_final_snapshot(self):
        """Test RDS instance is configured for clean deletion."""
        with open("lib/components/rds.py", 'r') as f:
            content = f.read()

        self.assertIn('skip_final_snapshot=True', content)

    def test_rds_component_generates_random_password(self):
        """Test RDS component generates random password."""
        with open("lib/components/rds.py", 'r') as f:
            content = f.read()

        self.assertIn('password', content)
        self.assertIn('random', content)


class TestS3Component(unittest.TestCase):
    """Test S3 component structure."""

    def test_s3_component_class_definition(self):
        """Test S3 component has proper class structure."""
        with open("lib/components/s3.py", 'r') as f:
            content = f.read()

        self.assertIn('class S3Component', content)
        self.assertIn('ComponentResource', content)

    def test_s3_component_creates_bucket(self):
        """Test S3 component creates bucket."""
        with open("lib/components/s3.py", 'r') as f:
            content = f.read()

        self.assertIn('s3.Bucket', content)

    def test_s3_component_enables_versioning(self):
        """Test S3 component enables versioning."""
        with open("lib/components/s3.py", 'r') as f:
            content = f.read()

        self.assertIn('BucketVersioning', content)
        self.assertIn('Enabled', content)

    def test_s3_component_enables_encryption(self):
        """Test S3 component enables encryption."""
        with open("lib/components/s3.py", 'r') as f:
            content = f.read()

        self.assertIn('BucketServerSideEncryptionConfiguration', content)
        self.assertIn('AES256', content)

    def test_s3_component_blocks_public_access(self):
        """Test S3 component blocks public access."""
        with open("lib/components/s3.py", 'r') as f:
            content = f.read()

        self.assertIn('BucketPublicAccessBlock', content)
        self.assertIn('block_public_acls=True', content)
        self.assertIn('block_public_policy=True', content)


class TestResourceNaming(unittest.TestCase):
    """Test resource naming conventions."""

    def test_vpc_uses_environment_suffix(self):
        """Test VPC resources use environment suffix."""
        with open("lib/components/vpc.py", 'r') as f:
            content = f.read()

        # Verify environment_suffix parameter exists
        self.assertIn('environment_suffix', content)
        # Verify it's used in resource names
        self.assertIn('f"vpc-{environment}-{environment_suffix}"', content)

    def test_alb_uses_environment_suffix(self):
        """Test ALB resources use environment suffix."""
        with open("lib/components/alb.py", 'r') as f:
            content = f.read()

        self.assertIn('environment_suffix', content)
        self.assertIn('f"alb-{environment}-{environment_suffix}"', content)

    def test_asg_uses_environment_suffix(self):
        """Test ASG resources use environment suffix."""
        with open("lib/components/asg.py", 'r') as f:
            content = f.read()

        self.assertIn('environment_suffix', content)
        self.assertIn('f"asg-{environment}-{environment_suffix}"', content)

    def test_rds_uses_environment_suffix(self):
        """Test RDS resources use environment suffix."""
        with open("lib/components/rds.py", 'r') as f:
            content = f.read()

        self.assertIn('environment_suffix', content)
        self.assertIn('f"rds-{environment}-{environment_suffix}"', content)

    def test_s3_uses_environment_suffix(self):
        """Test S3 resources use environment suffix."""
        with open("lib/components/s3.py", 'r') as f:
            content = f.read()

        self.assertIn('environment_suffix', content)
        self.assertIn('f"static-assets-{environment}-{environment_suffix}"', content)


class TestTagging(unittest.TestCase):
    """Test resource tagging."""

    def test_main_program_defines_common_tags(self):
        """Test main program defines common tags."""
        with open("lib/tap_stack.py", 'r') as f:
            content = f.read()

        self.assertIn('common_tags', content)
        self.assertIn('Environment', content)
        self.assertIn('ManagedBy', content)

    def test_components_accept_tags(self):
        """Test all components accept tags parameter."""
        for component_file in ["lib/components/vpc.py", "lib/components/alb.py",
                               "lib/components/asg.py", "lib/components/rds.py",
                               "lib/components/s3.py"]:
            with open(component_file, 'r') as f:
                content = f.read()

            self.assertIn('tags:', content)


class TestSecurityConfiguration(unittest.TestCase):
    """Test security best practices."""

    def test_rds_password_not_hardcoded(self):
        """Test RDS password is generated, not hardcoded."""
        with open("lib/components/rds.py", 'r') as f:
            content = f.read()

        # Should have password generation
        self.assertIn('random', content)
        # Should not have obvious hardcoded passwords
        self.assertNotIn('password="password123"', content)
        self.assertNotIn('password="admin"', content)

    def test_rds_uses_secrets_manager(self):
        """Test RDS stores credentials in Secrets Manager."""
        with open("lib/components/rds.py", 'r') as f:
            content = f.read()

        self.assertIn('secretsmanager', content)
        self.assertIn('Secret', content)

    def test_s3_encryption_enabled(self):
        """Test S3 buckets have encryption enabled."""
        with open("lib/components/s3.py", 'r') as f:
            content = f.read()

        self.assertIn('BucketServerSideEncryptionConfiguration', content)

    def test_s3_public_access_blocked(self):
        """Test S3 buckets block public access."""
        with open("lib/components/s3.py", 'r') as f:
            content = f.read()

        self.assertIn('BucketPublicAccessBlock', content)


if __name__ == "__main__":
    unittest.main()
