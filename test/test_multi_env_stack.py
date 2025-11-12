import pytest
from cdktf import Testing
from lib.multi_env_stack import MultiEnvStack
import json


class TestMultiEnvStack:
    """Unit tests for Multi-Environment Stack"""

    def test_stack_creation_dev(self):
        """Test that dev stack creates successfully"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "dev", "test-001", config)
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_stack_creation_prod(self):
        """Test that prod stack creates successfully"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.large', 'multi_az': True},
            'autoscaling': {'min_size': 3, 'max_size': 10, 'desired': 5},
            'storage': {'versioning': True},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "prod", "prod-001", config)
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_rds_instance_created(self):
        """Test that RDS instance is created with correct configuration"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "dev", "test-001", config)
        synthesized = Testing.synth(stack)

        # Parse the synthesized JSON
        stack_json = json.loads(synthesized)
        resources = stack_json.get('resource', {})

        # Check RDS instance exists
        assert 'aws_db_instance' in resources
        db_instances = resources['aws_db_instance']
        assert len(db_instances) > 0

        # Verify RDS properties
        db_instance = list(db_instances.values())[0]
        assert db_instance['engine'] == 'postgres'
        assert db_instance['instance_class'] == 't3.micro'
        assert db_instance['storage_encrypted'] == True

    def test_multi_az_only_for_prod(self):
        """Test that Multi-AZ is only enabled for production"""
        # Test dev - Multi-AZ disabled
        app_dev = Testing.app()
        config_dev = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack_dev = MultiEnvStack(app_dev, "test-stack-dev", "dev", "test-001", config_dev)
        synthesized_dev = Testing.synth(stack_dev)
        stack_json_dev = json.loads(synthesized_dev)
        db_instance_dev = list(stack_json_dev['resource']['aws_db_instance'].values())[0]
        assert db_instance_dev['multi_az'] == False

        # Test prod - Multi-AZ enabled
        app_prod = Testing.app()
        config_prod = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.large', 'multi_az': True},
            'autoscaling': {'min_size': 3, 'max_size': 10, 'desired': 5},
            'storage': {'versioning': True},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack_prod = MultiEnvStack(app_prod, "test-stack-prod", "prod", "prod-001", config_prod)
        synthesized_prod = Testing.synth(stack_prod)
        stack_json_prod = json.loads(synthesized_prod)
        db_instance_prod = list(stack_json_prod['resource']['aws_db_instance'].values())[0]
        assert db_instance_prod['multi_az'] == True

    def test_autoscaling_group_created(self):
        """Test that Auto Scaling Group is created with correct capacity"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 2, 'max_size': 4, 'desired': 2},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "staging", "staging-001", config)
        synthesized = Testing.synth(stack)
        stack_json = json.loads(synthesized)

        # Check ASG exists
        resources = stack_json.get('resource', {})
        assert 'aws_autoscaling_group' in resources
        asg = list(resources['aws_autoscaling_group'].values())[0]

        assert asg['min_size'] == 2
        assert asg['max_size'] == 4
        assert asg['desired_capacity'] == 2

    def test_load_balancer_created(self):
        """Test that Application Load Balancer is created"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "dev", "test-001", config)
        synthesized = Testing.synth(stack)
        stack_json = json.loads(synthesized)

        resources = stack_json.get('resource', {})
        assert 'aws_lb' in resources
        alb = list(resources['aws_lb'].values())[0]
        assert alb['load_balancer_type'] == 'application'

    def test_s3_bucket_versioning_prod_only(self):
        """Test that S3 versioning is only enabled for production"""
        # Test dev - no versioning
        app_dev = Testing.app()
        config_dev = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack_dev = MultiEnvStack(app_dev, "test-stack-dev", "dev", "test-001", config_dev)
        synthesized_dev = Testing.synth(stack_dev)
        stack_json_dev = json.loads(synthesized_dev)
        resources_dev = stack_json_dev.get('resource', {})
        assert 'aws_s3_bucket_versioning' not in resources_dev

        # Test prod - versioning enabled
        app_prod = Testing.app()
        config_prod = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.large', 'multi_az': True},
            'autoscaling': {'min_size': 3, 'max_size': 10, 'desired': 5},
            'storage': {'versioning': True},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack_prod = MultiEnvStack(app_prod, "test-stack-prod", "prod", "prod-001", config_prod)
        synthesized_prod = Testing.synth(stack_prod)
        stack_json_prod = json.loads(synthesized_prod)
        resources_prod = stack_json_prod.get('resource', {})
        assert 'aws_s3_bucket_versioning' in resources_prod

    def test_resource_naming_with_suffix(self):
        """Test that all resources include environment suffix in names"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "dev", "dev-test-001", config)
        synthesized = Testing.synth(stack)
        stack_json = json.loads(synthesized)

        resources = stack_json.get('resource', {})

        # Check RDS identifier includes suffix
        db_instance = list(resources['aws_db_instance'].values())[0]
        assert 'dev-test-001' in db_instance['identifier']

        # Check S3 bucket includes suffix
        s3_bucket = list(resources['aws_s3_bucket'].values())[0]
        assert 'dev-test-001' in s3_bucket['bucket']

        # Check security groups include suffix
        security_groups = resources.get('aws_security_group', {})
        for sg in security_groups.values():
            assert 'dev-test-001' in sg['name']

    def test_required_tags_present(self):
        """Test that all resources have required tags"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "dev", "test-001", config)
        synthesized = Testing.synth(stack)
        stack_json = json.loads(synthesized)

        # Check provider default tags
        provider = stack_json.get('provider', {}).get('aws', [{}])[0]
        default_tags = provider.get('default_tags', [{}])[0]
        tags = default_tags.get('tags', {})

        assert 'Environment' in tags
        assert tags['Environment'] == 'dev'
        assert 'Project' in tags
        assert tags['Project'] == 'multi-env-infrastructure'
        assert 'ManagedBy' in tags
        assert tags['ManagedBy'] == 'CDKTF'

    def test_security_group_restrictions(self):
        """Test that security groups have proper CIDR restrictions"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "dev", "test-001", config)
        synthesized = Testing.synth(stack)
        stack_json = json.loads(synthesized)

        resources = stack_json.get('resource', {})
        security_groups = resources.get('aws_security_group', {})

        # Find DB security group
        db_sg = None
        for sg in security_groups.values():
            if 'db-sg' in sg.get('name', ''):
                db_sg = sg
                break

        assert db_sg is not None
        ingress_rules = db_sg.get('ingress', [])
        assert len(ingress_rules) > 0
        # Verify restricted CIDR
        assert '10.0.0.0/16' in ingress_rules[0]['cidr_blocks']

    def test_s3_encryption_enabled(self):
        """Test that S3 bucket has encryption enabled"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "dev", "test-001", config)
        synthesized = Testing.synth(stack)
        stack_json = json.loads(synthesized)

        resources = stack_json.get('resource', {})
        assert 'aws_s3_bucket_server_side_encryption_configuration' in resources

    def test_stack_outputs_present(self):
        """Test that stack creates all required outputs"""
        app = Testing.app()
        config = {
            'region': 'ap-southeast-1',
            'database': {'instance_class': 't3.micro', 'multi_az': False},
            'autoscaling': {'min_size': 1, 'max_size': 2, 'desired': 1},
            'storage': {'versioning': False},
            'allowed_cidrs': ['10.0.0.0/16']
        }
        stack = MultiEnvStack(app, "test-stack", "dev", "test-001", config)
        synthesized = Testing.synth(stack)
        stack_json = json.loads(synthesized)

        outputs = stack_json.get('output', {})

        # Check all required outputs exist
        assert 'db_endpoint' in outputs
        assert 'db_address' in outputs
        assert 'alb_dns' in outputs
        assert 'alb_arn' in outputs
        assert 'bucket_name' in outputs
        assert 'bucket_arn' in outputs
        assert 'asg_name' in outputs
        assert 'vpc_id' in outputs
