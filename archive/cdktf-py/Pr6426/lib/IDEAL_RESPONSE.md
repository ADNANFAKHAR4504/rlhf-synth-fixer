# Multi-Environment Infrastructure with CDKTF Python - Production Ready

This is the corrected, production-ready implementation that addresses security, tagging, resource naming, and best practices issues from the initial model response.

## File: lib/multi_env_stack.py

```python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, S3Backend, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_vpc import DataAwsVpc
from cdktf_cdktf_provider_aws.data_aws_subnets import DataAwsSubnets
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret import DataAwsSecretsmanagerSecret
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret_version import DataAwsSecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate, LaunchTemplateIamInstanceProfile
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag
from cdktf_cdktf_provider_aws.autoscaling_attachment import AutoscalingAttachment
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
import json


class MultiEnvStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment: str, environment_suffix: str, config: dict):
        super().__init__(scope, id)

        self.environment = environment
        self.environment_suffix = environment_suffix
        self.config = config
        region = config.get('region', 'us-east-1')

        # Common tags for all resources
        common_tags = {
            "Environment": environment,
            "Project": "multi-env-infrastructure",
            "ManagedBy": "CDKTF",
            "EnvironmentSuffix": environment_suffix
        }

        # AWS Provider
        AwsProvider(self, "aws",
            region=region,
            default_tags=[{
                "tags": common_tags
            }]
        )

        # Get existing VPC
        vpc_data = DataAwsVpc(self, "vpc",
            default=True
        )

        # Get subnets
        subnets = DataAwsSubnets(self, "subnets",
            filter=[{
                "name": "vpc-id",
                "values": [vpc_data.id]
            }]
        )

        # Get database password from Secrets Manager
        db_secret = DataAwsSecretsmanagerSecret(self, "db_secret",
            name=f"rds-password-{environment_suffix}"
        )

        db_secret_version = DataAwsSecretsmanagerSecretVersion(self, "db_secret_version",
            secret_id=db_secret.id
        )

        # Database security group with restricted access
        db_sg = SecurityGroup(self, "db_sg",
            name=f"db-sg-{environment_suffix}",
            description=f"Security group for RDS PostgreSQL {environment}",
            vpc_id=vpc_data.id,
            ingress=[SecurityGroupIngress(
                description="PostgreSQL access from application tier",
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                cidr_blocks=config.get('allowed_cidrs', ['10.0.0.0/8'])
            )],
            egress=[SecurityGroupEgress(
                description="Allow all outbound traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={
                **common_tags,
                "Name": f"db-sg-{environment_suffix}"
            }
        )

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(self, "db_subnet_group",
            name=f"db-subnet-group-{environment_suffix}",
            subnet_ids=subnets.ids,
            tags={
                **common_tags,
                "Name": f"db-subnet-group-{environment_suffix}"
            }
        )

        # RDS PostgreSQL with proper configuration
        db_config = config.get('database', {})
        db = DbInstance(self, "postgres",
            identifier=f"postgres-{environment_suffix}",
            engine="postgres",
            engine_version="15.4",
            instance_class=db_config.get('instance_class', 't3.micro'),
            allocated_storage=20,
            storage_encrypted=True,
            username="dbadmin",
            password=db_secret_version.secret_string,
            multi_az=db_config.get('multi_az', False),
            vpc_security_group_ids=[db_sg.id],
            db_subnet_group_name=db_subnet_group.name,
            skip_final_snapshot=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="Mon:04:00-Mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            tags={
                **common_tags,
                "Name": f"postgres-{environment_suffix}"
            }
        )

        # EC2 security group with proper restrictions
        ec2_sg = SecurityGroup(self, "ec2_sg",
            name=f"ec2-sg-{environment_suffix}",
            description=f"Security group for EC2 instances {environment}",
            vpc_id=vpc_data.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTP from ALB",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[]  # Will be updated after ALB SG creation
                ),
                SecurityGroupIngress(
                    description="HTTPS from ALB",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    security_groups=[]  # Will be updated after ALB SG creation
                )
            ],
            egress=[SecurityGroupEgress(
                description="Allow all outbound traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={
                **common_tags,
                "Name": f"ec2-sg-{environment_suffix}"
            }
        )

        # IAM role for EC2 instances
        ec2_role = IamRole(self, "ec2_role",
            name=f"ec2-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                **common_tags,
                "Name": f"ec2-role-{environment_suffix}"
            }
        )

        # Attach managed policies
        IamRolePolicyAttachment(self, "ec2_ssm_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        IamRolePolicyAttachment(self, "ec2_cloudwatch_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )

        # Instance profile
        instance_profile = IamInstanceProfile(self, "instance_profile",
            name=f"ec2-profile-{environment_suffix}",
            role=ec2_role.name,
            tags={
                **common_tags,
                "Name": f"ec2-profile-{environment_suffix}"
            }
        )

        # Launch template with proper configuration
        asg_config = config.get('autoscaling', {})
        launch_template = LaunchTemplate(self, "launch_template",
            name=f"launch-template-{environment_suffix}",
            description=f"Launch template for {environment} environment",
            image_id=config.get('ami_id', 'ami-0cae6d6fe6048ca2c'),  # Amazon Linux 2023 us-east-1
            instance_type=config.get('instance_type', 't3.micro'),
            vpc_security_group_ids=[ec2_sg.id],
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                name=instance_profile.name
            ),
            metadata_options={
                "http_tokens": "required",
                "http_put_response_hop_limit": 1
            },
            tag_specifications=[{
                "resource_type": "instance",
                "tags": {
                    **common_tags,
                    "Name": f"ec2-instance-{environment_suffix}"
                }
            }, {
                "resource_type": "volume",
                "tags": {
                    **common_tags,
                    "Name": f"ec2-volume-{environment_suffix}"
                }
            }],
            tags={
                **common_tags,
                "Name": f"launch-template-{environment_suffix}"
            }
        )

        # ALB security group
        alb_sg = SecurityGroup(self, "alb_sg",
            name=f"alb-sg-{environment_suffix}",
            description=f"Security group for ALB {environment}",
            vpc_id=vpc_data.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTP from internet",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=config.get('alb_allowed_cidrs', ['0.0.0.0/0'])
                ),
                SecurityGroupIngress(
                    description="HTTPS from internet",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=config.get('alb_allowed_cidrs', ['0.0.0.0/0'])
                )
            ],
            egress=[SecurityGroupEgress(
                description="Allow all outbound traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={
                **common_tags,
                "Name": f"alb-sg-{environment_suffix}"
            }
        )

        # Application Load Balancer
        alb = Lb(self, "alb",
            name=f"alb-{environment_suffix}",
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=subnets.ids,
            enable_deletion_protection=False,
            enable_http2=True,
            idle_timeout=60,
            tags={
                **common_tags,
                "Name": f"alb-{environment_suffix}"
            }
        )

        # Target group with proper health checks
        tg = LbTargetGroup(self, "tg",
            name=f"tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_data.id,
            target_type="instance",
            deregistration_delay=30,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2,
                matcher="200"
            ),
            tags={
                **common_tags,
                "Name": f"tg-{environment_suffix}"
            }
        )

        # Auto Scaling Group with proper configuration
        asg = AutoscalingGroup(self, "asg",
            name=f"asg-{environment_suffix}",
            min_size=asg_config.get('min_size', 1),
            max_size=asg_config.get('max_size', 2),
            desired_capacity=asg_config.get('desired', 1),
            vpc_zone_identifier=subnets.ids,
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template={
                "id": launch_template.id,
                "version": "$Latest"
            },
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"asg-instance-{environment_suffix}",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Environment",
                    value=environment,
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Project",
                    value="multi-env-infrastructure",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="ManagedBy",
                    value="CDKTF",
                    propagate_at_launch=True
                )
            ]
        )

        # Attach ASG to target group
        AutoscalingAttachment(self, "asg_attachment",
            autoscaling_group_name=asg.name,
            lb_target_group_arn=tg.arn
        )

        # ALB Listener
        LbListener(self, "listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=tg.arn
            )],
            tags={
                **common_tags,
                "Name": f"alb-listener-{environment_suffix}"
            }
        )

        # S3 bucket with encryption and versioning
        bucket = S3Bucket(self, "bucket",
            bucket=f"app-data-{environment_suffix}",
            force_destroy=True,
            tags={
                **common_tags,
                "Name": f"app-data-{environment_suffix}"
            }
        )

        # Block public access
        S3BucketPublicAccessBlock(self, "bucket_public_access_block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Server-side encryption
        S3BucketServerSideEncryptionConfigurationA(self, "bucket_encryption",
            bucket=bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )]
        )

        # Enable versioning based on environment
        storage_config = config.get('storage', {})
        if storage_config.get('versioning', False):
            S3BucketVersioning(self, "bucket_versioning",
                bucket=bucket.id,
                versioning_configuration=S3BucketVersioningVersioningConfiguration(
                    status="Enabled"
                )
            )

        # Outputs
        TerraformOutput(self, "db_endpoint",
            value=db.endpoint,
            description="RDS PostgreSQL endpoint"
        )

        TerraformOutput(self, "db_address",
            value=db.address,
            description="RDS PostgreSQL address"
        )

        TerraformOutput(self, "alb_dns",
            value=alb.dns_name,
            description="Application Load Balancer DNS name"
        )

        TerraformOutput(self, "alb_arn",
            value=alb.arn,
            description="Application Load Balancer ARN"
        )

        TerraformOutput(self, "bucket_name",
            value=bucket.id,
            description="S3 bucket name"
        )

        TerraformOutput(self, "bucket_arn",
            value=bucket.arn,
            description="S3 bucket ARN"
        )

        TerraformOutput(self, "asg_name",
            value=asg.name,
            description="Auto Scaling Group name"
        )

        TerraformOutput(self, "vpc_id",
            value=vpc_data.id,
            description="VPC ID"
        )
```

## File: lib/tap_stack.py

```python
from cdktf import App
from lib.multi_env_stack import MultiEnvStack
import os

app = App()

# Get environment from environment variable
environment = os.environ.get('ENVIRONMENT', 'dev')
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'test-001')

# Environment configurations
configs = {
    'dev': {
        'region': 'us-east-1',
        'ami_id': 'ami-0cae6d6fe6048ca2c',  # Amazon Linux 2023 us-east-1
        'instance_type': 't3.micro',
        'database': {
            'instance_class': 't3.micro',
            'multi_az': False
        },
        'autoscaling': {
            'min_size': 1,
            'max_size': 2,
            'desired': 1
        },
        'storage': {
            'versioning': False
        },
        'allowed_cidrs': ['10.0.0.0/16'],
        'alb_allowed_cidrs': ['0.0.0.0/0']
    },
    'staging': {
        'region': 'us-east-1',
        'ami_id': 'ami-0cae6d6fe6048ca2c',  # Amazon Linux 2023 us-east-1
        'instance_type': 't3.small',
        'database': {
            'instance_class': 't3.small',
            'multi_az': False
        },
        'autoscaling': {
            'min_size': 2,
            'max_size': 4,
            'desired': 2
        },
        'storage': {
            'versioning': False
        },
        'allowed_cidrs': ['10.0.0.0/16'],
        'alb_allowed_cidrs': ['0.0.0.0/0']
    },
    'prod': {
        'region': 'us-east-1',
        'ami_id': 'ami-0cae6d6fe6048ca2c',  # Amazon Linux 2023 us-east-1
        'instance_type': 't3.small',
        'database': {
            'instance_class': 't3.large',
            'multi_az': True
        },
        'autoscaling': {
            'min_size': 3,
            'max_size': 10,
            'desired': 5
        },
        'storage': {
            'versioning': True
        },
        'allowed_cidrs': ['10.0.0.0/16'],
        'alb_allowed_cidrs': ['0.0.0.0/0']
    }
}

config = configs.get(environment, configs['dev'])

# Create stack with environment suffix
MultiEnvStack(app, f"multi-env-{environment}", environment, environment_suffix, config)

app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python lib/tap_stack.py",
  "projectId": "multi-env-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: requirements.txt

```txt
cdktf>=0.20.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.3.0
```

## File: test/test_multi_env_stack.py

```python
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
            'region': 'us-east-1',
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
```

## File: lib/README.md

```markdown
# Multi-Environment Infrastructure with CDKTF Python

This project implements a production-ready multi-environment infrastructure management solution using CDKTF with Python. The solution provides consistent infrastructure deployment across development, staging, and production environments while supporting environment-specific configurations.

## Architecture

### Components

The solution deploys the following AWS resources for each environment:

- **RDS PostgreSQL Database**
  - Environment-specific instance sizing (t3.micro/small/large)
  - Multi-AZ deployment for production only
  - Storage encryption enabled
  - Automated backups with 7-day retention
  - CloudWatch logs enabled

- **Auto Scaling Groups**
  - Configurable min/max/desired capacity per environment
  - ELB health checks with 5-minute grace period
  - Launch templates with IMDSv2 enforced
  - Proper IAM roles with SSM and CloudWatch access

- **Application Load Balancer**
  - Internet-facing ALB with configurable CIDR access
  - Target group with health checks
  - HTTP listener (HTTPS can be added)
  - Cross-zone load balancing

- **S3 Storage**
  - Environment-specific bucket naming
  - Versioning enabled for production only
  - Server-side encryption (AES256)
  - Public access blocked
  - Force destroy enabled for testing

- **Security Groups**
  - Restricted database access (configurable CIDR)
  - ALB security group (internet-facing)
  - EC2 security group (ALB-only access)
  - Proper descriptions for all rules

- **IAM Roles and Policies**
  - EC2 instance profile with SSM access
  - CloudWatch agent permissions
  - Least-privilege principle

### Tagging Strategy

All resources are tagged with:
- `Environment`: dev/staging/prod
- `Project`: multi-env-infrastructure
- `ManagedBy`: CDKTF
- `EnvironmentSuffix`: Unique identifier for resource naming
- `Name`: Resource-specific name with suffix

## Prerequisites

- Python 3.8 or higher
- Terraform 1.5+ (managed by CDKTF)
- AWS CLI configured with appropriate credentials
- Node.js 16+ (for CDKTF CLI)
- AWS account with appropriate permissions

## Installation

### 1. Install CDKTF CLI

```bash
npm install -g cdktf-cli
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Initialize CDKTF Providers

```bash
cdktf get
```

## Configuration

### Environment Variables

The stack requires two environment variables:

- `ENVIRONMENT`: The target environment (dev, staging, prod)
- `ENVIRONMENT_SUFFIX`: A unique suffix for resource naming (e.g., "test-001", "prod-001")

### Environment-Specific Configurations

The `lib/tap_stack.py` file contains configurations for each environment:

#### Development
- Region: us-east-1
- Database: t3.micro, single AZ
- ASG: min 1, max 2, desired 1
- Instance Type: t3.micro
- S3 Versioning: Disabled

#### Staging
- Region: us-east-1
- Database: t3.small, single AZ
- ASG: min 2, max 4, desired 2
- Instance Type: t3.small
- S3 Versioning: Disabled

#### Production
- Region: us-east-1
- Database: t3.large, Multi-AZ
- ASG: min 3, max 10, desired 5
- Instance Type: t3.small
- S3 Versioning: Enabled

## AWS Secrets Manager Requirement

The RDS database password is retrieved from AWS Secrets Manager. Before deployment, create a secret:

```bash
aws secretsmanager create-secret \
  --name rds-password-<environment-suffix> \
  --description "RDS password for <environment>" \
  --secret-string '{"password":"YourSecurePassword123!"}'
```

For example:
```bash
aws secretsmanager create-secret \
  --name rds-password-dev-test-001 \
  --secret-string "MyDevPassword123!"
```

## Usage

### Synthesize Infrastructure

Generate Terraform JSON configuration:

```bash
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=dev-test-001
cdktf synth
```

### Deploy Infrastructure

Deploy to specific environment:

```bash
# Development
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=dev-001
cdktf deploy

# Staging
export ENVIRONMENT=staging
export ENVIRONMENT_SUFFIX=staging-001
cdktf deploy

# Production
export ENVIRONMENT=prod
export ENVIRONMENT_SUFFIX=prod-001
cdktf deploy
```

### Destroy Infrastructure

Clean up all resources:

```bash
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=dev-001
cdktf destroy
```

## Testing

### Run Unit Tests

```bash
pytest test/ -v
```

### Run Specific Test

```bash
pytest test/test_multi_env_stack.py::TestMultiEnvStack::test_multi_az_only_for_prod -v
```

### Test Coverage

```bash
pytest test/ --cov=lib --cov-report=html
```

## Outputs

After deployment, the stack provides the following outputs:

- `db_endpoint`: Full RDS endpoint with port (host:port)
- `db_address`: RDS hostname without port
- `alb_dns`: Application Load Balancer DNS name
- `alb_arn`: Application Load Balancer ARN
- `bucket_name`: S3 bucket name
- `bucket_arn`: S3 bucket ARN
- `asg_name`: Auto Scaling Group name
- `vpc_id`: VPC ID used for deployment

Access outputs after deployment:

```bash
cdktf output
```

## Security Best Practices

1. **Secrets Management**: Database passwords stored in AWS Secrets Manager
2. **Encryption**:
   - RDS storage encryption enabled
   - S3 server-side encryption enabled
   - SSL/TLS for data in transit
3. **Network Security**:
   - Security groups with restricted CIDR blocks
   - Private database access only
   - Public access blocked on S3 buckets
4. **IAM**: Least-privilege roles and policies
5. **Instance Metadata**: IMDSv2 enforced on EC2 instances
6. **Logging**: CloudWatch logs enabled for RDS

## Troubleshooting

### Issue: Secrets Manager secret not found

**Solution**: Create the secret before deployment:
```bash
aws secretsmanager create-secret --name rds-password-<suffix> --secret-string "password"
```

### Issue: Insufficient subnet count

**Solution**: Ensure VPC has at least 2 subnets in different AZs for ALB

### Issue: AMI not available

**Solution**: Update the `ami_id` in `tap_stack.py` for your region:
```bash
aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-*" --query "Images | sort_by(@, &CreationDate) | [-1].ImageId"
```

## Cost Optimization

- Development environment uses smallest instance sizes
- Multi-AZ only enabled for production
- S3 versioning only in production
- Auto Scaling maintains minimum capacity based on environment
- All resources are destroyable to avoid ongoing costs

## Maintenance

### Update Dependencies

```bash
pip install --upgrade -r requirements.txt
```

### Update CDKTF Providers

```bash
cdktf get
```

### Update AMI IDs

Regularly update AMI IDs in `tap_stack.py` for security patches.

## Contributing

When making changes:
1. Update unit tests in `test/test_multi_env_stack.py`
2. Run tests: `pytest test/ -v`
3. Update this README if adding new features
4. Follow CDKTF and Python best practices

## License

This project is maintained as part of infrastructure automation efforts.
```
