# Multi-Environment Infrastructure Implementation

This implementation provides a complete multi-environment infrastructure solution using Pulumi with Python, supporting dev, staging, and production environments with appropriate resource configurations for each.

## File: lib/__init__.py

```python
"""
TAP Infrastructure Library

This package contains the Pulumi infrastructure components for the TAP project.
"""
```

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Main Pulumi stack orchestrating multi-environment infrastructure deployment.
This stack creates VPC, compute, database, load balancing, storage, and monitoring resources
with environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import Config, ResourceOptions

from .vpc_stack import VpcStack
from .compute_stack import ComputeStack
from .database_stack import DatabaseStack
from .load_balancer_stack import LoadBalancerStack
from .storage_stack import StorageStack
from .monitoring_stack import MonitoringStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix: Environment identifier (dev, staging, prod)
        tags: Optional default tags to apply to resources
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource orchestrating the multi-environment infrastructure.

    This component creates a complete infrastructure stack including:
    - VPC with public/private subnets across multiple AZs
    - Auto Scaling Group with environment-specific instance types
    - Application Load Balancer
    - RDS MySQL database (Single-AZ for dev/staging, Multi-AZ for prod)
    - S3 buckets for static assets
    - CloudWatch monitoring and alarms

    Args:
        name: The logical name of this Pulumi component
        args: Configuration arguments including environment suffix and tags
        opts: Pulumi resource options
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        config = Config()

        # Get environment-specific configuration
        cost_center = config.get('costCenter') or 'engineering'

        # Merge tags
        self.tags = {
            'Environment': self.environment_suffix,
            'CostCenter': cost_center,
            'ManagedBy': 'Pulumi',
            **args.tags
        }

        # Create VPC infrastructure
        self.vpc_stack = VpcStack(
            f'vpc-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create storage resources (needed for ALB logs)
        self.storage_stack = StorageStack(
            f'storage-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create load balancer
        self.load_balancer_stack = LoadBalancerStack(
            f'alb-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            vpc_id=self.vpc_stack.vpc_id,
            public_subnet_ids=self.vpc_stack.public_subnet_ids,
            log_bucket_name=self.storage_stack.alb_logs_bucket_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create compute resources
        self.compute_stack = ComputeStack(
            f'compute-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            vpc_id=self.vpc_stack.vpc_id,
            private_subnet_ids=self.vpc_stack.private_subnet_ids,
            alb_security_group_id=self.load_balancer_stack.alb_security_group_id,
            alb_target_group_arn=self.load_balancer_stack.target_group_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create database
        self.database_stack = DatabaseStack(
            f'database-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            vpc_id=self.vpc_stack.vpc_id,
            private_subnet_ids=self.vpc_stack.private_subnet_ids,
            app_security_group_id=self.compute_stack.instance_security_group_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring
        self.monitoring_stack = MonitoringStack(
            f'monitoring-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            alb_arn_suffix=self.load_balancer_stack.alb_arn_suffix,
            target_group_arn_suffix=self.load_balancer_stack.target_group_arn_suffix,
            asg_name=self.compute_stack.asg_name,
            db_instance_id=self.database_stack.db_instance_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc_stack.vpc_id,
            'alb_dns_name': self.load_balancer_stack.alb_dns_name,
            'alb_zone_id': self.load_balancer_stack.alb_zone_id,
            'rds_endpoint': self.database_stack.db_endpoint,
            'rds_port': self.database_stack.db_port,
            'static_assets_bucket': self.storage_stack.static_assets_bucket_name,
            'sns_topic_arn': self.monitoring_stack.sns_topic_arn,
        })
```

## File: lib/vpc_stack.py

```python
"""
vpc_stack.py

VPC infrastructure component with environment-specific CIDR blocks,
public/private subnets, internet gateway, NAT gateway, and route tables.
"""

from typing import List

import pulumi
from pulumi import Output, ResourceOptions
import pulumi_aws as aws


class VpcStack(pulumi.ComponentResource):
    """
    VPC infrastructure component.

    Creates VPC with environment-specific CIDR, public/private subnets across 2 AZs,
    internet gateway, NAT gateway, and route tables.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:vpc:VpcStack', name, None, opts)

        # Environment-specific CIDR blocks
        cidr_blocks = {
            'dev': '10.0.0.0/16',
            'staging': '10.1.0.0/16',
            'prod': '10.2.0.0/16'
        }
        vpc_cidr = cidr_blocks.get(environment_suffix, '10.0.0.0/16')

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f'vpc-{environment_suffix}',
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, 'Name': f'vpc-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state='available')

        # Create public subnets (2 AZs)
        self.public_subnets: List[aws.ec2.Subnet] = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'public-subnet-{environment_suffix}-{i+1}',
                vpc_id=self.vpc.id,
                cidr_block=f'{vpc_cidr[:-4]}{i*16}.0/20',
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**tags, 'Name': f'public-subnet-{environment_suffix}-{i+1}', 'Type': 'public'},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create private subnets (2 AZs)
        self.private_subnets: List[aws.ec2.Subnet] = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'private-subnet-{environment_suffix}-{i+1}',
                vpc_id=self.vpc.id,
                cidr_block=f'{vpc_cidr[:-4]}{(i+2)*16}.0/20',
                availability_zone=azs.names[i],
                tags={**tags, 'Name': f'private-subnet-{environment_suffix}-{i+1}', 'Type': 'private'},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create internet gateway
        self.igw = aws.ec2.InternetGateway(
            f'igw-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'igw-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Allocate Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f'nat-eip-{environment_suffix}',
            domain='vpc',
            tags={**tags, 'Name': f'nat-eip-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create NAT Gateway in first public subnet
        self.nat = aws.ec2.NatGateway(
            f'nat-{environment_suffix}',
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={**tags, 'Name': f'nat-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f'public-rt-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'public-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Add route to internet gateway
        aws.ec2.Route(
            f'public-route-{environment_suffix}',
            route_table_id=self.public_rt.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-rta-{environment_suffix}-{i+1}',
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private route table
        self.private_rt = aws.ec2.RouteTable(
            f'private-rt-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'private-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Add route to NAT gateway
        aws.ec2.Route(
            f'private-route-{environment_suffix}',
            route_table_id=self.private_rt.id,
            destination_cidr_block='0.0.0.0/0',
            nat_gateway_id=self.nat.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f'private-rta-{environment_suffix}-{i+1}',
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Export properties
        self.vpc_id = self.vpc.id
        self.vpc_cidr = self.vpc.cidr_block
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'vpc_cidr': self.vpc_cidr,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids,
        })
```

## File: lib/compute_stack.py

```python
"""
compute_stack.py

Compute infrastructure with Auto Scaling Group, launch template, and IAM roles.
Instance types are environment-specific: t3.micro (dev), t3.small (staging), t3.medium (prod).
"""

from typing import List

import pulumi
from pulumi import Output, ResourceOptions
import pulumi_aws as aws


class ComputeStack(pulumi.ComponentResource):
    """
    Compute infrastructure component.

    Creates Auto Scaling Group with environment-appropriate instance types,
    launch template, IAM roles, and security groups.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        alb_security_group_id: Output[str],
        alb_target_group_arn: Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:compute:ComputeStack', name, None, opts)

        # Environment-specific instance types
        instance_types = {
            'dev': 't3.micro',
            'staging': 't3.small',
            'prod': 't3.medium'
        }
        instance_type = instance_types.get(environment_suffix, 't3.micro')

        # Environment-specific scaling configuration
        scaling_config = {
            'dev': {'min': 1, 'max': 2, 'desired': 1},
            'staging': {'min': 2, 'max': 4, 'desired': 2},
            'prod': {'min': 2, 'max': 6, 'desired': 2}
        }
        scaling = scaling_config.get(environment_suffix, scaling_config['dev'])

        # Create security group for instances
        self.instance_sg = aws.ec2.SecurityGroup(
            f'instance-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for EC2 instances in {environment_suffix}',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow HTTP from ALB',
                    from_port=80,
                    to_port=80,
                    protocol='tcp',
                    security_groups=[alb_security_group_id],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow HTTPS from ALB',
                    from_port=443,
                    to_port=443,
                    protocol='tcp',
                    security_groups=[alb_security_group_id],
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description='Allow all outbound traffic',
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                ),
            ],
            tags={**tags, 'Name': f'instance-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for EC2 instances
        self.instance_role = aws.iam.Role(
            f'instance-role-{environment_suffix}',
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={**tags, 'Name': f'instance-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Attach SSM policy for management
        aws.iam.RolePolicyAttachment(
            f'instance-role-ssm-{environment_suffix}',
            role=self.instance_role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
            opts=ResourceOptions(parent=self)
        )

        # Attach CloudWatch policy
        aws.iam.RolePolicyAttachment(
            f'instance-role-cloudwatch-{environment_suffix}',
            role=self.instance_role.name,
            policy_arn='arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
            opts=ResourceOptions(parent=self)
        )

        # Create instance profile
        self.instance_profile = aws.iam.InstanceProfile(
            f'instance-profile-{environment_suffix}',
            role=self.instance_role.name,
            tags={**tags, 'Name': f'instance-profile-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Get latest Amazon Linux 2023 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=['amazon'],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name='name',
                    values=['al2023-ami-*-x86_64']
                ),
                aws.ec2.GetAmiFilterArgs(
                    name='virtualization-type',
                    values=['hvm']
                ),
            ]
        )

        # User data script
        user_data = f"""#!/bin/bash
set -e
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Environment: {environment_suffix}</h1>" > /var/www/html/index.html
"""

        # Create launch template
        self.launch_template = aws.ec2.LaunchTemplate(
            f'launch-template-{environment_suffix}',
            name_prefix=f'lt-{environment_suffix}-',
            image_id=ami.id,
            instance_type=instance_type,
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile.arn
            ),
            vpc_security_group_ids=[self.instance_sg.id],
            user_data=pulumi.Output.secret(user_data).apply(
                lambda ud: __import__('base64').b64encode(ud.encode()).decode()
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='instance',
                    tags={**tags, 'Name': f'instance-{environment_suffix}'}
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='volume',
                    tags={**tags, 'Name': f'volume-{environment_suffix}'}
                ),
            ],
            tags={**tags, 'Name': f'launch-template-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f'asg-{environment_suffix}',
            name=f'asg-{environment_suffix}',
            min_size=scaling['min'],
            max_size=scaling['max'],
            desired_capacity=scaling['desired'],
            health_check_type='ELB',
            health_check_grace_period=300,
            vpc_zone_identifiers=private_subnet_ids,
            target_group_arns=[alb_target_group_arn],
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version='$Latest'
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=k,
                    value=v,
                    propagate_at_launch=True
                ) for k, v in {**tags, 'Name': f'asg-{environment_suffix}'}.items()
            ],
            opts=ResourceOptions(parent=self)
        )

        # Create scaling policy - target tracking based on CPU
        aws.autoscaling.Policy(
            f'asg-policy-cpu-{environment_suffix}',
            autoscaling_group_name=self.asg.name,
            policy_type='TargetTrackingScaling',
            target_tracking_configuration=aws.autoscaling.PolicyTargetTrackingConfigurationArgs(
                predefined_metric_specification=aws.autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='ASGAverageCPUUtilization'
                ),
                target_value=70.0
            ),
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.instance_security_group_id = self.instance_sg.id
        self.asg_name = self.asg.name
        self.asg_arn = self.asg.arn

        self.register_outputs({
            'instance_security_group_id': self.instance_security_group_id,
            'asg_name': self.asg_name,
            'asg_arn': self.asg_arn,
        })
```

## File: lib/load_balancer_stack.py

```python
"""
load_balancer_stack.py

Application Load Balancer with target groups, listeners, and security groups.
"""

from typing import List

import pulumi
from pulumi import Output, ResourceOptions
import pulumi_aws as aws


class LoadBalancerStack(pulumi.ComponentResource):
    """
    Load Balancer infrastructure component.

    Creates Application Load Balancer, target groups, listeners, and security groups.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        public_subnet_ids: List[Output[str]],
        log_bucket_name: Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:loadbalancer:LoadBalancerStack', name, None, opts)

        # Create security group for ALB
        self.alb_sg = aws.ec2.SecurityGroup(
            f'alb-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for ALB in {environment_suffix}',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow HTTP from internet',
                    from_port=80,
                    to_port=80,
                    protocol='tcp',
                    cidr_blocks=['0.0.0.0/0'],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow HTTPS from internet',
                    from_port=443,
                    to_port=443,
                    protocol='tcp',
                    cidr_blocks=['0.0.0.0/0'],
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description='Allow all outbound traffic',
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                ),
            ],
            tags={**tags, 'Name': f'alb-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f'alb-{environment_suffix}',
            name=f'alb-{environment_suffix}',
            internal=False,
            load_balancer_type='application',
            security_groups=[self.alb_sg.id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            access_logs=aws.lb.LoadBalancerAccessLogsArgs(
                bucket=log_bucket_name,
                enabled=True,
                prefix=f'alb-logs-{environment_suffix}'
            ),
            tags={**tags, 'Name': f'alb-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create target group
        self.target_group = aws.lb.TargetGroup(
            f'tg-{environment_suffix}',
            name=f'tg-{environment_suffix}',
            port=80,
            protocol='HTTP',
            vpc_id=vpc_id,
            target_type='instance',
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher='200',
                path='/',
                port='traffic-port',
                protocol='HTTP',
                timeout=5,
                unhealthy_threshold=2,
            ),
            deregistration_delay=30,
            tags={**tags, 'Name': f'tg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create HTTP listener
        self.listener = aws.lb.Listener(
            f'alb-listener-http-{environment_suffix}',
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol='HTTP',
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type='forward',
                    target_group_arn=self.target_group.arn,
                )
            ],
            tags={**tags, 'Name': f'alb-listener-http-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.alb_dns_name = self.alb.dns_name
        self.alb_zone_id = self.alb.zone_id
        self.alb_arn = self.alb.arn
        self.alb_arn_suffix = self.alb.arn_suffix
        self.alb_security_group_id = self.alb_sg.id
        self.target_group_arn = self.target_group.arn
        self.target_group_arn_suffix = self.target_group.arn_suffix

        self.register_outputs({
            'alb_dns_name': self.alb_dns_name,
            'alb_zone_id': self.alb_zone_id,
            'alb_arn': self.alb_arn,
            'alb_arn_suffix': self.alb_arn_suffix,
            'target_group_arn': self.target_group_arn,
            'target_group_arn_suffix': self.target_group_arn_suffix,
        })
```

## File: lib/database_stack.py

```python
"""
database_stack.py

RDS MySQL database with environment-specific configuration.
Single-AZ for dev/staging, Multi-AZ for production with automated backups.
"""

from typing import List

import pulumi
from pulumi import Config, Output, ResourceOptions
import pulumi_aws as aws


class DatabaseStack(pulumi.ComponentResource):
    """
    Database infrastructure component.

    Creates RDS MySQL with environment-specific configuration:
    - Single-AZ for dev and staging
    - Multi-AZ for production with automated backups
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        app_security_group_id: Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:database:DatabaseStack', name, None, opts)

        config = Config()

        # Environment-specific configuration
        db_config = {
            'dev': {
                'instance_class': 'db.t3.micro',
                'allocated_storage': 20,
                'multi_az': False,
                'backup_retention': 1,
            },
            'staging': {
                'instance_class': 'db.t3.small',
                'allocated_storage': 50,
                'multi_az': False,
                'backup_retention': 3,
            },
            'prod': {
                'instance_class': 'db.t3.medium',
                'allocated_storage': 100,
                'multi_az': True,
                'backup_retention': 7,
            }
        }
        db_settings = db_config.get(environment_suffix, db_config['dev'])

        # Get database credentials from config (or use defaults for testing)
        db_username = config.get('dbUsername') or 'admin'
        db_password = config.get_secret('dbPassword') or pulumi.Output.secret('TempPassword123!')

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f'db-subnet-group-{environment_suffix}',
            name=f'db-subnet-group-{environment_suffix}',
            subnet_ids=private_subnet_ids,
            description=f'DB subnet group for {environment_suffix}',
            tags={**tags, 'Name': f'db-subnet-group-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create security group for RDS
        self.db_sg = aws.ec2.SecurityGroup(
            f'db-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for RDS in {environment_suffix}',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow MySQL from application instances',
                    from_port=3306,
                    to_port=3306,
                    protocol='tcp',
                    security_groups=[app_security_group_id],
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description='Allow all outbound traffic',
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                ),
            ],
            tags={**tags, 'Name': f'db-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create parameter group
        self.db_parameter_group = aws.rds.ParameterGroup(
            f'db-params-{environment_suffix}',
            name=f'db-params-{environment_suffix}',
            family='mysql8.0',
            description=f'Custom parameter group for {environment_suffix}',
            parameters=[
                aws.rds.ParameterGroupParameterArgs(
                    name='max_connections',
                    value='100' if environment_suffix == 'prod' else '50',
                ),
            ],
            tags={**tags, 'Name': f'db-params-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create RDS instance
        self.db_instance = aws.rds.Instance(
            f'db-{environment_suffix}',
            identifier=f'db-{environment_suffix}',
            engine='mysql',
            engine_version='8.0',
            instance_class=db_settings['instance_class'],
            allocated_storage=db_settings['allocated_storage'],
            storage_type='gp3',
            storage_encrypted=True,
            username=db_username,
            password=db_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_sg.id],
            parameter_group_name=self.db_parameter_group.name,
            multi_az=db_settings['multi_az'],
            backup_retention_period=db_settings['backup_retention'],
            backup_window='03:00-04:00',
            maintenance_window='mon:04:00-mon:05:00',
            skip_final_snapshot=True,
            copy_tags_to_snapshot=True,
            enabled_cloudwatch_logs_exports=['error', 'general', 'slowquery'],
            tags={**tags, 'Name': f'db-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.db_instance_id = self.db_instance.id
        self.db_endpoint = self.db_instance.endpoint
        self.db_address = self.db_instance.address
        self.db_port = self.db_instance.port
        self.db_name = self.db_instance.db_name

        self.register_outputs({
            'db_instance_id': self.db_instance_id,
            'db_endpoint': self.db_endpoint,
            'db_address': self.db_address,
            'db_port': self.db_port,
        })
```

## File: lib/storage_stack.py

```python
"""
storage_stack.py

S3 buckets for static assets and ALB logs.
Versioning enabled only for production environment.
"""

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class StorageStack(pulumi.ComponentResource):
    """
    Storage infrastructure component.

    Creates S3 buckets for static assets and ALB logs with environment-specific configuration.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:storage:StorageStack', name, None, opts)

        # Get current AWS account and region
        current = aws.get_caller_identity()
        current_region = aws.get_region()

        # Create bucket for static assets
        self.static_assets_bucket = aws.s3.Bucket(
            f'static-assets-{environment_suffix}',
            bucket=f'tap-static-assets-{environment_suffix}-{current.account_id}',
            tags={**tags, 'Name': f'static-assets-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning for production
        if environment_suffix == 'prod':
            aws.s3.BucketVersioningV2(
                f'static-assets-versioning-{environment_suffix}',
                bucket=self.static_assets_bucket.id,
                versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                    status='Enabled'
                ),
                opts=ResourceOptions(parent=self)
            )

        # Enable encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f'static-assets-encryption-{environment_suffix}',
            bucket=self.static_assets_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='AES256'
                    ),
                    bucket_key_enabled=True,
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Block public access for static assets bucket
        aws.s3.BucketPublicAccessBlock(
            f'static-assets-public-access-block-{environment_suffix}',
            bucket=self.static_assets_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Create bucket for ALB logs
        self.alb_logs_bucket = aws.s3.Bucket(
            f'alb-logs-{environment_suffix}',
            bucket=f'tap-alb-logs-{environment_suffix}-{current.account_id}',
            force_destroy=True,  # Allow deletion with logs for testing
            tags={**tags, 'Name': f'alb-logs-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Enable encryption for ALB logs bucket
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f'alb-logs-encryption-{environment_suffix}',
            bucket=self.alb_logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='AES256'
                    ),
                    bucket_key_enabled=True,
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Block public access for ALB logs bucket
        aws.s3.BucketPublicAccessBlock(
            f'alb-logs-public-access-block-{environment_suffix}',
            bucket=self.alb_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Get ELB service account for the region
        elb_service_account = aws.elb.get_service_account()

        # Create bucket policy to allow ALB to write logs
        alb_logs_policy = pulumi.Output.all(
            self.alb_logs_bucket.arn,
            elb_service_account.arn
        ).apply(lambda args: f"""{{
            "Version": "2012-10-17",
            "Statement": [
                {{
                    "Effect": "Allow",
                    "Principal": {{
                        "AWS": "{args[1]}"
                    }},
                    "Action": "s3:PutObject",
                    "Resource": "{args[0]}/alb-logs-{environment_suffix}/*"
                }}
            ]
        }}""")

        aws.s3.BucketPolicy(
            f'alb-logs-policy-{environment_suffix}',
            bucket=self.alb_logs_bucket.id,
            policy=alb_logs_policy,
            opts=ResourceOptions(parent=self)
        )

        # Add lifecycle policy for log retention
        aws.s3.BucketLifecycleConfigurationV2(
            f'alb-logs-lifecycle-{environment_suffix}',
            bucket=self.alb_logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id='delete-old-logs',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                        days=90 if environment_suffix == 'prod' else 30
                    ),
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.static_assets_bucket_name = self.static_assets_bucket.bucket
        self.static_assets_bucket_arn = self.static_assets_bucket.arn
        self.alb_logs_bucket_name = self.alb_logs_bucket.bucket
        self.alb_logs_bucket_arn = self.alb_logs_bucket.arn

        self.register_outputs({
            'static_assets_bucket_name': self.static_assets_bucket_name,
            'alb_logs_bucket_name': self.alb_logs_bucket_name,
        })
```

## File: lib/monitoring_stack.py

```python
"""
monitoring_stack.py

CloudWatch alarms and SNS notifications with environment-specific thresholds.
"""

import pulumi
from pulumi import Config, Output, ResourceOptions
import pulumi_aws as aws


class MonitoringStack(pulumi.ComponentResource):
    """
    Monitoring infrastructure component.

    Creates CloudWatch alarms for ALB, ASG, and RDS with environment-specific thresholds.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        alb_arn_suffix: Output[str],
        target_group_arn_suffix: Output[str],
        asg_name: Output[str],
        db_instance_id: Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        config = Config()

        # Get notification email from config
        alarm_email = config.get('alarmEmail') or f'alerts-{environment_suffix}@example.com'

        # Create SNS topic for alarms
        self.sns_topic = aws.sns.Topic(
            f'alarms-topic-{environment_suffix}',
            name=f'alarms-topic-{environment_suffix}',
            tags={**tags, 'Name': f'alarms-topic-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create SNS subscription
        aws.sns.TopicSubscription(
            f'alarms-subscription-{environment_suffix}',
            topic=self.sns_topic.arn,
            protocol='email',
            endpoint=alarm_email,
            opts=ResourceOptions(parent=self)
        )

        # Environment-specific thresholds
        thresholds = {
            'dev': {
                'alb_response_time': 2.0,
                'alb_error_rate': 10.0,
                'asg_cpu': 80.0,
                'rds_cpu': 80.0,
                'rds_connections': 40,
                'rds_storage': 85.0,
            },
            'staging': {
                'alb_response_time': 1.5,
                'alb_error_rate': 5.0,
                'asg_cpu': 75.0,
                'rds_cpu': 75.0,
                'rds_connections': 60,
                'rds_storage': 80.0,
            },
            'prod': {
                'alb_response_time': 1.0,
                'alb_error_rate': 2.0,
                'asg_cpu': 70.0,
                'rds_cpu': 70.0,
                'rds_connections': 80,
                'rds_storage': 75.0,
            }
        }
        threshold = thresholds.get(environment_suffix, thresholds['dev'])

        # ALB Response Time Alarm
        aws.cloudwatch.MetricAlarm(
            f'alb-response-time-{environment_suffix}',
            name=f'alb-response-time-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='TargetResponseTime',
            namespace='AWS/ApplicationELB',
            period=300,
            statistic='Average',
            threshold=threshold['alb_response_time'],
            alarm_description=f'ALB response time high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'LoadBalancer': alb_arn_suffix,
            },
            tags={**tags, 'Name': f'alb-response-time-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ALB Error Rate Alarm
        aws.cloudwatch.MetricAlarm(
            f'alb-error-rate-{environment_suffix}',
            name=f'alb-error-rate-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='HTTPCode_Target_5XX_Count',
            namespace='AWS/ApplicationELB',
            period=300,
            statistic='Sum',
            threshold=threshold['alb_error_rate'],
            alarm_description=f'ALB 5xx errors high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'LoadBalancer': alb_arn_suffix,
            },
            tags={**tags, 'Name': f'alb-error-rate-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ALB Target Health Alarm
        aws.cloudwatch.MetricAlarm(
            f'alb-unhealthy-targets-{environment_suffix}',
            name=f'alb-unhealthy-targets-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='UnHealthyHostCount',
            namespace='AWS/ApplicationELB',
            period=300,
            statistic='Average',
            threshold=0,
            alarm_description=f'ALB has unhealthy targets in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'TargetGroup': target_group_arn_suffix,
                'LoadBalancer': alb_arn_suffix,
            },
            tags={**tags, 'Name': f'alb-unhealthy-targets-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ASG CPU Alarm
        aws.cloudwatch.MetricAlarm(
            f'asg-cpu-{environment_suffix}',
            name=f'asg-cpu-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='CPUUtilization',
            namespace='AWS/EC2',
            period=300,
            statistic='Average',
            threshold=threshold['asg_cpu'],
            alarm_description=f'ASG CPU high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'AutoScalingGroupName': asg_name,
            },
            tags={**tags, 'Name': f'asg-cpu-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # RDS CPU Alarm
        aws.cloudwatch.MetricAlarm(
            f'rds-cpu-{environment_suffix}',
            name=f'rds-cpu-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='CPUUtilization',
            namespace='AWS/RDS',
            period=300,
            statistic='Average',
            threshold=threshold['rds_cpu'],
            alarm_description=f'RDS CPU high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'DBInstanceIdentifier': db_instance_id,
            },
            tags={**tags, 'Name': f'rds-cpu-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # RDS Connections Alarm
        aws.cloudwatch.MetricAlarm(
            f'rds-connections-{environment_suffix}',
            name=f'rds-connections-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='DatabaseConnections',
            namespace='AWS/RDS',
            period=300,
            statistic='Average',
            threshold=threshold['rds_connections'],
            alarm_description=f'RDS connections high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'DBInstanceIdentifier': db_instance_id,
            },
            tags={**tags, 'Name': f'rds-connections-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # RDS Storage Alarm
        aws.cloudwatch.MetricAlarm(
            f'rds-storage-{environment_suffix}',
            name=f'rds-storage-{environment_suffix}',
            comparison_operator='LessThanThreshold',
            evaluation_periods=1,
            metric_name='FreeStorageSpace',
            namespace='AWS/RDS',
            period=300,
            statistic='Average',
            threshold=(100 - threshold['rds_storage']) * 1024 * 1024 * 1024,  # Convert to bytes
            alarm_description=f'RDS storage low in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'DBInstanceIdentifier': db_instance_id,
            },
            tags={**tags, 'Name': f'rds-storage-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.sns_topic_arn = self.sns_topic.arn
        self.sns_topic_name = self.sns_topic.name

        self.register_outputs({
            'sns_topic_arn': self.sns_topic_arn,
            'sns_topic_name': self.sns_topic_name,
        })
```

## Deployment Instructions

This implementation is ready for deployment using Pulumi. To deploy:

1. Install dependencies:
   ```bash
   pip install pulumi pulumi-aws
   ```

2. Initialize a stack for your environment:
   ```bash
   pulumi stack init dev
   ```

3. Configure the stack:
   ```bash
   pulumi config set aws:region us-east-1
   pulumi config set pulumi-infra:env dev
   pulumi config set pulumi-infra:costCenter engineering
   pulumi config set --secret pulumi-infra:dbPassword YourSecurePassword123!
   ```

4. Deploy the infrastructure:
   ```bash
   pulumi up
   ```

5. After deployment, outputs will include:
   - ALB DNS name for accessing the application
   - RDS endpoint for database connections
   - S3 bucket names for static assets
   - SNS topic ARN for alarm notifications

The infrastructure is fully configured with environment-specific settings, proper security groups, encryption, monitoring, and follows AWS best practices.
