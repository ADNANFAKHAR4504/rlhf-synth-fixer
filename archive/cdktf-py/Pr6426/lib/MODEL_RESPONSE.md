# Multi-Environment Infrastructure with CDKTF Python

This solution implements a multi-environment infrastructure management system using CDKTF with Python. The implementation provides separate configurations for dev, staging, and production environments.

## File: lib/multi_env_stack.py

```python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc, DataAwsVpc
from cdktf_cdktf_provider_aws.subnet import DataAwsSubnets
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class MultiEnvStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, config: dict):
        super().__init__(scope, id)

        self.config = config
        environment = config.get('environment', 'dev')
        region = config.get('region', 'us-east-1')

        # AWS Provider
        AwsProvider(self, "aws",
            region=region
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

        # Database security group
        db_sg = SecurityGroup(self, "db_sg",
            name=f"db-sg-{environment}",
            vpc_id=vpc_data.id,
            ingress=[SecurityGroupIngress(
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                cidr_blocks=config.get('allowed_cidrs', ['0.0.0.0/0'])
            )],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )]
        )

        # RDS PostgreSQL
        db_config = config.get('database', {})
        db = DbInstance(self, "postgres",
            identifier=f"postgres-{environment}",
            engine="postgres",
            engine_version="14.7",
            instance_class=db_config.get('instance_class', 't3.micro'),
            allocated_storage=20,
            username="admin",
            password="changeme123",
            multi_az=db_config.get('multi_az', False),
            vpc_security_group_ids=[db_sg.id],
            skip_final_snapshot=True
        )

        # EC2 security group
        ec2_sg = SecurityGroup(self, "ec2_sg",
            name=f"ec2-sg-{environment}",
            vpc_id=vpc_data.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )]
        )

        # IAM role for EC2
        ec2_role = IamRole(self, "ec2_role",
            name=f"ec2-role-{environment}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }"""
        )

        # Launch template
        asg_config = config.get('autoscaling', {})
        launch_template = LaunchTemplate(self, "launch_template",
            name=f"launch-template-{environment}",
            image_id="ami-0c55b159cbfafe1f0",
            instance_type="t3.micro",
            vpc_security_group_ids=[ec2_sg.id]
        )

        # Auto Scaling Group
        asg = AutoscalingGroup(self, "asg",
            name=f"asg-{environment}",
            min_size=asg_config.get('min_size', 1),
            max_size=asg_config.get('max_size', 2),
            desired_capacity=asg_config.get('desired', 1),
            vpc_zone_identifier=subnets.ids,
            launch_template={
                "id": launch_template.id,
                "version": "$Latest"
            }
        )

        # ALB security group
        alb_sg = SecurityGroup(self, "alb_sg",
            name=f"alb-sg-{environment}",
            vpc_id=vpc_data.id,
            ingress=[SecurityGroupIngress(
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"]
            )],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )]
        )

        # Application Load Balancer
        alb = Lb(self, "alb",
            name=f"alb-{environment}",
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=subnets.ids
        )

        # Target group
        tg = LbTargetGroup(self, "tg",
            name=f"tg-{environment}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_data.id,
            health_check={
                "path": "/health",
                "interval": 30
            }
        )

        # Listener
        LbListener(self, "listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[{
                "type": "forward",
                "target_group_arn": tg.arn
            }]
        )

        # S3 bucket
        bucket = S3Bucket(self, "bucket",
            bucket=f"app-data-{environment}",
            tags={
                "Environment": environment
            }
        )

        # Enable versioning for prod
        storage_config = config.get('storage', {})
        if storage_config.get('versioning', False):
            S3BucketVersioning(self, "bucket_versioning",
                bucket=bucket.id,
                versioning_configuration={
                    "status": "Enabled"
                }
            )

        # Outputs
        TerraformOutput(self, "db_endpoint",
            value=db.endpoint
        )

        TerraformOutput(self, "alb_dns",
            value=alb.dns_name
        )

        TerraformOutput(self, "bucket_name",
            value=bucket.id
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
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'test')

# Environment configurations
configs = {
    'dev': {
        'environment': 'dev',
        'region': 'ap-southeast-1',
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
        'allowed_cidrs': ['10.0.0.0/8']
    },
    'staging': {
        'environment': 'staging',
        'region': 'ap-southeast-1',
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
        'allowed_cidrs': ['10.0.0.0/8']
    },
    'prod': {
        'environment': 'prod',
        'region': 'ap-southeast-1',
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
        'allowed_cidrs': ['10.0.0.0/8']
    }
}

config = configs.get(environment, configs['dev'])

MultiEnvStack(app, f"multi-env-{environment}", config)

app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python lib/tap_stack.py",
  "projectId": "multi-env-infrastructure",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: requirements.txt

```txt
cdktf>=0.15.0
cdktf-cdktf-provider-aws>=10.0.0
constructs>=10.0.0
```

## File: lib/README.md

```markdown
# Multi-Environment Infrastructure

This project implements a multi-environment infrastructure management solution using CDKTF with Python.

## Architecture

The solution deploys the following resources for each environment:
- RDS PostgreSQL database with environment-specific sizing
- Auto Scaling Groups with configurable capacity
- Application Load Balancer with target groups
- S3 buckets with optional versioning
- Security groups with environment-specific rules

## Prerequisites

- Python 3.8+
- Terraform 1.5+
- AWS CLI configured
- pipenv

## Installation

```bash
pipenv install
```

## Usage

### Deploy to Development

```bash
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=dev-test-001
cdktf deploy
```

### Deploy to Staging

```bash
export ENVIRONMENT=staging
export ENVIRONMENT_SUFFIX=staging-001
cdktf deploy
```

### Deploy to Production

```bash
export ENVIRONMENT=prod
export ENVIRONMENT_SUFFIX=prod-001
cdktf deploy
```

## Environment Configurations

### Development
- Database: t3.micro, single AZ
- ASG: min 1, max 2, desired 1
- S3: versioning disabled

### Staging
- Database: t3.small, single AZ
- ASG: min 2, max 4, desired 2
- S3: versioning disabled

### Production
- Database: t3.large, Multi-AZ enabled
- ASG: min 3, max 10, desired 5
- S3: versioning enabled

## Outputs

After deployment, the stack outputs:
- Database endpoint
- Load balancer DNS name
- S3 bucket name
```
