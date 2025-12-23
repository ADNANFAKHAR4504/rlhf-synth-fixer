# Model Response: Production VPC Infrastructure with Pulumi Python

This implementation creates a complete production-ready VPC infrastructure for a payment processing application with PCI DSS compliance requirements.

## File: lib/lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project - VPC Infrastructure for Payment Processing.

It creates a complete production VPC with:
- Multi-AZ deployment across 3 availability zones
- Public and private subnets with proper routing
- Security groups for web and database tiers
- VPC Flow Logs with S3 storage
- PCI DSS compliant network segmentation
"""

from typing import Optional, List
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for production VPC infrastructure.

    This component creates a complete VPC infrastructure with:
    - VPC with 10.0.0.0/16 CIDR block
    - 3 public subnets across 3 availability zones
    - 3 private subnets across 3 availability zones
    - Internet Gateway and NAT Gateway
    - Route tables with proper routing
    - Security groups for web and database tiers
    - VPC Flow Logs to S3 with 7-day lifecycle

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Add standard tags
        resource_tags = {
            **self.tags,
            'Environment': 'production',
            'ManagedBy': 'pulumi'
        }

        # Define availability zones
        azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f'production-vpc-{self.environment_suffix}',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **resource_tags,
                'Name': f'production-vpc-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f'production-igw-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            tags={
                **resource_tags,
                'Name': f'production-igw-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets
        self.public_subnets: List[aws.ec2.Subnet] = []
        public_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']

        for i, (az, cidr) in enumerate(zip(azs, public_cidrs)):
            subnet = aws.ec2.Subnet(
                f'production-public-subnet-{i+1}-{self.environment_suffix}',
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **resource_tags,
                    'Name': f'production-public-subnet-{i+1}-{self.environment_suffix}',
                    'Type': 'public'
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f'production-nat-eip-{self.environment_suffix}',
            domain='vpc',
            tags={
                **resource_tags,
                'Name': f'production-nat-eip-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.igw])
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f'production-nat-gateway-{self.environment_suffix}',
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                **resource_tags,
                'Name': f'production-nat-gateway-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.eip, self.public_subnets[0]])
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f'production-public-rt-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            tags={
                **resource_tags,
                'Name': f'production-public-rt-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create route to Internet Gateway
        self.public_route = aws.ec2.Route(
            f'production-public-route-{self.environment_suffix}',
            route_table_id=self.public_route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'production-public-rta-{i+1}-{self.environment_suffix}',
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private subnets
        self.private_subnets: List[aws.ec2.Subnet] = []
        private_cidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']

        for i, (az, cidr) in enumerate(zip(azs, private_cidrs)):
            subnet = aws.ec2.Subnet(
                f'production-private-subnet-{i+1}-{self.environment_suffix}',
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **resource_tags,
                    'Name': f'production-private-subnet-{i+1}-{self.environment_suffix}',
                    'Type': 'private'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create private route table
        self.private_route_table = aws.ec2.RouteTable(
            f'production-private-rt-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            tags={
                **resource_tags,
                'Name': f'production-private-rt-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create route to NAT Gateway
        self.private_route = aws.ec2.Route(
            f'production-private-route-{self.environment_suffix}',
            route_table_id=self.private_route_table.id,
            destination_cidr_block='0.0.0.0/0',
            nat_gateway_id=self.nat_gateway.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f'production-private-rta-{i+1}-{self.environment_suffix}',
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create web server security group
        self.web_sg = aws.ec2.SecurityGroup(
            f'production-web-sg-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            description='Security group for web servers - allows HTTPS and SSH',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=443,
                    to_port=443,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow HTTPS from anywhere'
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=22,
                    to_port=22,
                    cidr_blocks=['10.0.0.0/16'],
                    description='Allow SSH from VPC'
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic'
                )
            ],
            tags={
                **resource_tags,
                'Name': f'production-web-sg-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create database security group
        self.db_sg = aws.ec2.SecurityGroup(
            f'production-db-sg-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            description='Security group for database servers - allows PostgreSQL from web servers',
            tags={
                **resource_tags,
                'Name': f'production-db-sg-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Add ingress rule for database security group (PostgreSQL from web SG)
        self.db_sg_rule = aws.ec2.SecurityGroupRule(
            f'production-db-sg-rule-{self.environment_suffix}',
            type='ingress',
            security_group_id=self.db_sg.id,
            source_security_group_id=self.web_sg.id,
            protocol='tcp',
            from_port=5432,
            to_port=5432,
            description='Allow PostgreSQL from web servers',
            opts=ResourceOptions(parent=self)
        )

        # Add egress rule for database security group
        self.db_sg_egress = aws.ec2.SecurityGroupRule(
            f'production-db-sg-egress-{self.environment_suffix}',
            type='egress',
            security_group_id=self.db_sg.id,
            cidr_blocks=['0.0.0.0/0'],
            protocol='-1',
            from_port=0,
            to_port=0,
            description='Allow all outbound traffic',
            opts=ResourceOptions(parent=self)
        )

        # Create S3 bucket for VPC Flow Logs
        self.flow_logs_bucket = aws.s3.Bucket(
            f'production-flow-logs-{self.environment_suffix}',
            bucket=f'production-flow-logs-{self.environment_suffix}',
            force_destroy=True,
            tags={
                **resource_tags,
                'Name': f'production-flow-logs-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket lifecycle policy (7-day retention)
        self.flow_logs_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f'production-flow-logs-lifecycle-{self.environment_suffix}',
            bucket=self.flow_logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id='delete-after-7-days',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                        days=7
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for VPC Flow Logs
        self.flow_logs_role = aws.iam.Role(
            f'production-flow-logs-role-{self.environment_suffix}',
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'vpc-flow-logs.amazonaws.com'
                    },
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={
                **resource_tags,
                'Name': f'production-flow-logs-role-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create IAM policy for Flow Logs to write to S3
        self.flow_logs_policy = aws.iam.RolePolicy(
            f'production-flow-logs-policy-{self.environment_suffix}',
            role=self.flow_logs_role.id,
            policy=self.flow_logs_bucket.arn.apply(lambda arn: json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': [
                        's3:PutObject',
                        's3:GetObject',
                        's3:ListBucket'
                    ],
                    'Resource': [
                        arn,
                        f'{arn}/*'
                    ]
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Enable VPC Flow Logs
        self.flow_log = aws.ec2.FlowLog(
            f'production-flow-log-{self.environment_suffix}',
            vpc_id=self.vpc.id,
            traffic_type='ALL',
            log_destination_type='s3',
            log_destination=self.flow_logs_bucket.arn,
            tags={
                **resource_tags,
                'Name': f'production-flow-log-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.flow_logs_policy])
        )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'public_subnet_ids': [subnet.id for subnet in self.public_subnets],
            'private_subnet_ids': [subnet.id for subnet in self.private_subnets],
            'web_security_group_id': self.web_sg.id,
            'database_security_group_id': self.db_sg.id,
            'nat_gateway_id': self.nat_gateway.id,
            'internet_gateway_id': self.igw.id,
            'flow_logs_bucket': self.flow_logs_bucket.bucket
        })

        # Export stack outputs
        pulumi.export('vpc_id', self.vpc.id)
        pulumi.export('public_subnet_1_id', self.public_subnets[0].id)
        pulumi.export('public_subnet_2_id', self.public_subnets[1].id)
        pulumi.export('public_subnet_3_id', self.public_subnets[2].id)
        pulumi.export('private_subnet_1_id', self.private_subnets[0].id)
        pulumi.export('private_subnet_2_id', self.private_subnets[1].id)
        pulumi.export('private_subnet_3_id', self.private_subnets[2].id)
        pulumi.export('web_security_group_id', self.web_sg.id)
        pulumi.export('database_security_group_id', self.db_sg.id)
        pulumi.export('nat_gateway_id', self.nat_gateway.id)
        pulumi.export('internet_gateway_id', self.igw.id)
        pulumi.export('flow_logs_bucket', self.flow_logs_bucket.bucket)
```

## File: lib/requirements.txt

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: lib/__main__.py

```python
#!/usr/bin/env python3
"""
Alternative entry point for Pulumi using __main__.py convention.

This file allows running the Pulumi program using the standard __main__.py pattern.
It imports and executes the same logic as tap.py.
"""
from tap import *
```

## File: lib/README.md

```markdown
# Production VPC Infrastructure - Pulumi Python

This Pulumi program creates a production-ready VPC infrastructure for a payment processing application with PCI DSS compliance requirements.

## Architecture

The infrastructure includes:

- **VPC**: 10.0.0.0/16 CIDR block with DNS hostnames and resolution enabled
- **Public Subnets**: 3 subnets across us-east-1a, us-east-1b, us-east-1c
  - 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **Private Subnets**: 3 subnets across us-east-1a, us-east-1b, us-east-1c
  - 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateway**: Single NAT Gateway in us-east-1a for private subnet internet access
- **Security Groups**:
  - Web Server SG: HTTPS (443) from anywhere, SSH (22) from VPC
  - Database SG: PostgreSQL (5432) from web server SG only
- **VPC Flow Logs**: Stored in S3 with 7-day lifecycle policy

## Prerequisites

- Python 3.9 or higher
- Pulumi CLI 3.x or higher
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC resources

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

## Deployment

1. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

2. Preview changes:
```bash
pulumi preview
```

3. Deploy infrastructure:
```bash
pulumi up
```

## Stack Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `public_subnet_1_id`, `public_subnet_2_id`, `public_subnet_3_id`: Public subnet IDs
- `private_subnet_1_id`, `private_subnet_2_id`, `private_subnet_3_id`: Private subnet IDs
- `web_security_group_id`: Web server security group ID
- `database_security_group_id`: Database security group ID
- `nat_gateway_id`: NAT Gateway ID
- `internet_gateway_id`: Internet Gateway ID
- `flow_logs_bucket`: S3 bucket name for VPC Flow Logs

## Destroy Infrastructure

To remove all resources:
```bash
pulumi destroy
```

## Compliance

This infrastructure meets PCI DSS requirements:
- Network segmentation between public and private tiers
- Least-privilege security group rules
- VPC Flow Logs for audit trails
- Multi-AZ deployment for high availability

## Cost Optimization

- Single NAT Gateway shared across all private subnets
- 7-day log retention to minimize S3 storage costs
- Serverless VPC Flow Logs (no CloudWatch Logs groups)

## Tags

All resources are tagged with:
- `Environment`: production
- `ManagedBy`: pulumi
- Additional environment-specific tags from provider configuration
