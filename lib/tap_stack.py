"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3  # example import for any AWS resource
from typing import Optional
import pulumi_aws as aws
import json

class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment (str): The deployment environment (e.g., 'Production', 'Development').
        project (str): The project name.
        owner (str): The owner/team responsible for this infrastructure.
        region (str): The AWS region to deploy resources (e.g., 'us-east-1', 'us-west-2').
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, 
                 environment: str,
                 project: str, 
                 owner: str,
                 region: str,
                 environment_suffix: Optional[str] = None, 
                 tags: Optional[dict] = None):
        self.environment = "prod"
        self.project = "cloudsetup"
        self.owner = "mgt"
        self.region = "us-west-2"
        self.environment_suffix = environment_suffix or 'prod'
        self.tags = tags or {}


class NetworkingStack(pulumi.ComponentResource):
    """Component for VPC, subnets, and networking resources."""
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('tap:networking:NetworkingStack', name, None, opts)
        
        # Create VPC
        self.vpc = aws.ec2.Vpc(f"{args.environment}-{args.project}-{args.owner}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-vpc",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        # Get availability zones
        availability_zones = aws.get_availability_zones(state="available")
        az_names = availability_zones.names

        self.public_subnets = []
        self.private_subnets = []

        # Create subnets in first 2 AZs
        for i in range(min(2, len(az_names))):
            az = az_names[i]
            
            public_subnet = aws.ec2.Subnet(
                f"{args.environment}-{args.project}-{args.owner}-public-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"{args.environment}-{args.project}-{args.owner}-public-subnet-{i}",
                    "Environment": args.environment,
                    "Project": args.project,
                    "Owner": args.owner,
                    **args.tags
                },
                opts=ResourceOptions(parent=self))
            
            private_subnet = aws.ec2.Subnet(
                f"{args.environment}-{args.project}-{args.owner}-private-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+2}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"{args.environment}-{args.project}-{args.owner}-private-subnet-{i}",
                    "Environment": args.environment,
                    "Project": args.project,
                    "Owner": args.owner,
                    **args.tags
                },
                opts=ResourceOptions(parent=self))
            
            self.public_subnets.append(public_subnet)
            self.private_subnets.append(private_subnet)

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(f"{args.environment}-{args.project}-{args.owner}-igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-igw",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        # Create EIP and NAT Gateway
        self.eip = aws.ec2.Eip(f"{args.environment}-{args.project}-{args.owner}-eip",
            domain="vpc",
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-eip",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        self.nat_gateway = aws.ec2.NatGateway(f"{args.environment}-{args.project}-{args.owner}-nat",
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-nat",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        # Create Route Tables
        self.public_route_table = aws.ec2.RouteTable(f"{args.environment}-{args.project}-{args.owner}-public-rt",
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id,
            )],
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-public-rt",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        self.private_route_table = aws.ec2.RouteTable(f"{args.environment}-{args.project}-{args.owner}-private-rt",
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateway.id,
            )],
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-private-rt",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        # Associate subnets with route tables
        for subnet in self.public_subnets:
            aws.ec2.RouteTableAssociation(f"{args.environment}-{args.project}-{args.owner}-public-rta-{subnet._name}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self))

        for subnet in self.private_subnets:
            aws.ec2.RouteTableAssociation(f"{args.environment}-{args.project}-{args.owner}-private-rta-{subnet._name}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self))

        self.register_outputs({
            "vpc_id": self.vpc.id,
            "public_subnet_ids": [subnet.id for subnet in self.public_subnets],
            "private_subnet_ids": [subnet.id for subnet in self.private_subnets]
        })


class SecurityStack(pulumi.ComponentResource):
    """Component for security groups and IAM resources."""
    
    def __init__(self, name: str, args: TapStackArgs, vpc_id: pulumi.Output[str], vpc_cidr: pulumi.Output[str], opts: Optional[ResourceOptions] = None):
        super().__init__('tap:security:SecurityStack', name, None, opts)
        
        # Web Security Group
        self.web_sg = aws.ec2.SecurityGroup(f"{args.environment}-{args.project}-{args.owner}-web-sg",
            vpc_id=vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
            )],
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-web-sg",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        # Database Security Group
        self.db_sg = aws.ec2.SecurityGroup(f"{args.environment}-{args.project}-{args.owner}-db-sg",
            vpc_id=vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=[vpc_cidr],
                )
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
            )],
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-db-sg",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        # EC2 IAM Role
        self.ec2_role = aws.iam.Role(f"{args.environment}-{args.project}-{args.owner}-ec2-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Effect": "Allow",
                    "Sid": "",
                }]
            }),
            opts=ResourceOptions(parent=self))

        # EC2 Role Policy
        self.ec2_policy = aws.iam.RolePolicy(f"{args.environment}-{args.project}-{args.owner}-ec2-policy",
            role=self.ec2_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:Get*",
                            "s3:List*",
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "ssm:GetParameter"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=self))

        self.register_outputs({
            "web_security_group_id": self.web_sg.id,
            "db_security_group_id": self.db_sg.id,
            "ec2_role_name": self.ec2_role.name
        })


class ComputeStack(pulumi.ComponentResource):
    """Component for EC2 instances and load balancer."""
    
    def __init__(self, name: str, args: TapStackArgs, public_subnets: list, web_sg_id: pulumi.Output[str], ec2_role_name: pulumi.Output[str], opts: Optional[ResourceOptions] = None):
        super().__init__('tap:compute:ComputeStack', name, None, opts)
        
        # Get AMI
        ami = aws.ec2.get_ami(most_recent=True,
            owners=["amazon"],
            filters=[{"name":"name","values":["amzn2-ami-hvm-*-x86_64-gp2"]}])

        user_data = """#!/bin/bash
yum update -y
amazon-linux-extras install -y nginx1
systemctl start nginx
systemctl enable nginx
"""

        # Create EC2 instances
        self.instances = []
        for i, subnet in enumerate(public_subnets):
            instance = aws.ec2.Instance(f"{args.environment}-{args.project}-{args.owner}-web-{i}",
                instance_type="t2.micro",
                ami=ami.id,
                subnet_id=subnet.id,
                vpc_security_group_ids=[web_sg_id],
                iam_instance_profile=aws.iam.InstanceProfile(f"{args.environment}-{args.project}-{args.owner}-instance-profile-{i}", role=ec2_role_name, opts=ResourceOptions(parent=self)),
                user_data=user_data,
                tags={
                    "Name": f"{args.environment}-{args.project}-{args.owner}-web-{i}",
                    "Environment": args.environment,
                    "Project": args.project,
                    "Owner": args.owner,
                    **args.tags
                },
                opts=ResourceOptions(parent=self))
            self.instances.append(instance)

        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(f"{args.environment}-{args.project}-{args.owner}-alb",
            security_groups=[web_sg_id],
            subnets=[subnet.id for subnet in public_subnets],
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-alb",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        self.target_group = aws.lb.TargetGroup(f"{args.environment}-{args.project}-{args.owner}-tg",
            port=80,
            protocol="HTTP",
            vpc_id=public_subnets[0].vpc_id,  # Get VPC ID from subnet
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                path="/",
                port="traffic-port",
                protocol="HTTP",
                interval=30,
                timeout=5,
                healthy_threshold=5,
                unhealthy_threshold=2,
                matcher="200"
            ),
            opts=ResourceOptions(parent=self))

        self.listener = aws.lb.Listener(f"{args.environment}-{args.project}-{args.owner}-listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.target_group.arn,
            )],
            opts=ResourceOptions(parent=self))

        self.register_outputs({
            "alb_dns_name": self.alb.dns_name,
            "instance_ids": [instance.id for instance in self.instances]
        })


class DatabaseStack(pulumi.ComponentResource):
    """Component for RDS database and related resources."""
    
    def __init__(self, name: str, args: TapStackArgs, private_subnets: list, db_sg_id: pulumi.Output[str], opts: Optional[ResourceOptions] = None):
        super().__init__('tap:database:DatabaseStack', name, None, opts)
        
        # Create DB Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(f"{args.environment}-{args.project}-{args.owner}-db-subnet-group",
            subnet_ids=[subnet.id for subnet in private_subnets],
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-db-subnet-group",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        # Create RDS monitoring role
        self.rds_monitoring_role = aws.iam.Role(
            f"{args.environment}-{args.project}-{args.owner}-rds-monitoring-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "monitoring.rds.amazonaws.com"
                        }
                    }
                ]
            }),
            opts=ResourceOptions(parent=self))

        self.rds_monitoring_policy_attachment = aws.iam.RolePolicyAttachment(
            f"{args.environment}-{args.project}-{args.owner}-rds-monitoring-policy",
            role=self.rds_monitoring_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
            opts=ResourceOptions(parent=self))

        # Create simple database password
        self.db_password = aws.secretsmanager.Secret(f"{args.environment}-{args.project}-dp",
            name=f"{args.environment}-{args.project}-dp")

        # Create RDS Instance
        self.db_instance = aws.rds.Instance(
            f"{args.environment}-{args.project}-{args.owner}-db",
            engine="postgres",
            engine_version="15.13",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            vpc_security_group_ids=[db_sg_id],
            db_subnet_group_name=self.db_subnet_group.name,
            skip_final_snapshot=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            username="postgres",
            password=self.db_password.id.apply(lambda id: f"{{resolve:secretsmanager:{id}:SecretString:password::}}"),
            monitoring_interval=60,
            monitoring_role_arn=self.rds_monitoring_role.arn,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={
                "Name": f"{args.environment}-{args.project}-{args.owner}-db",
                "Environment": args.environment,
                "Project": args.project,
                "Owner": args.owner,
                **args.tags
            },
            opts=ResourceOptions(parent=self))

        self.register_outputs({
            "db_endpoint": self.db_instance.endpoint,
            "db_port": self.db_instance.port
        })


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for the TAP project.
    
    This component orchestrates all infrastructure stacks and manages
    the overall deployment configuration including AWS provider setup.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment = args.environment
        self.project = args.project
        self.owner = args.owner
        self.region = args.region
        self.tags = args.tags

        # Create AWS provider for the specified region
        self.aws_provider = aws.Provider(
            f"{args.environment}-{args.project}-aws-provider",
            region=args.region,
            opts=ResourceOptions(parent=self)
        )

        # Create networking stack
        self.networking = NetworkingStack("networking", args, ResourceOptions(parent=self, provider=self.aws_provider))
        
        # Create security stack
        self.security = SecurityStack("security", args, self.networking.vpc.id, self.networking.vpc.cidr_block, ResourceOptions(parent=self, provider=self.aws_provider))
        
        # Create compute stack
        self.compute = ComputeStack("compute", args, self.networking.public_subnets, self.security.web_sg.id, self.security.ec2_role.name, ResourceOptions(parent=self, provider=self.aws_provider))
        
        # Create database stack
        self.database = DatabaseStack("database", args, self.networking.private_subnets, self.security.db_sg.id, ResourceOptions(parent=self, provider=self.aws_provider))

        # Register main outputs
        self.register_outputs({
            "vpc_id": self.networking.vpc.id,
            "alb_dns_name": self.compute.alb.dns_name,
            "db_endpoint": self.database.db_instance.endpoint,
            "region": args.region
        })


# Usage example (you would put this in your main __main__.py file)
if __name__ == "__main__":
    config = pulumi.Config()
    aws_config = pulumi.Config("aws")
    
    # Create the stack args
    stack_args = TapStackArgs(
        environment=config.require("environment"),
        project=config.require("project"),
        owner=config.require("owner"),
        region=aws_config.get("region") or "us-east-1",  # Default to us-east-1 if not specified
        tags={
            "ManagedBy": "Pulumi",
            "Environment": config.require("environment"),
            "Project": config.require("project"),
            "Owner": config.require("owner")
        }
    )
    
    # Create the main stack
    tap_stack = TapStack("tap", stack_args)
    
    # Export main outputs
    pulumi.export("vpc_id", tap_stack.networking.vpc.id)
    pulumi.export("alb_dns_name", tap_stack.compute.alb.dns_name)
    pulumi.export("db_endpoint", tap_stack.database.db_instance.endpoint)
    pulumi.export("region", tap_stack.region)