
from typing import Optional
import pulumi
import pulumi_aws as aws
import json


class TapStackArgs:
    
    def __init__(self, 
                 environment: str,
                 project: str, 
                 owner: str,
                 region: str = "us-west-2", 
                 environment_suffix: Optional[str] = None, 
                 tags: Optional[dict] = None):
        self.environment = environment
        self.project = project
        self.owner = owner
        self.region = region
        self.environment_suffix = environment_suffix or environment
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[pulumi.ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        self.args = args
        
        # AWS Provider
        self.aws_provider = aws.Provider(
            f"{args.environment}-{args.project}-aws-provider",
            region=args.region,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Common tags
        self.tags = {
            "Environment": args.environment,
            "Project": args.project,
            "Owner": args.owner,
            "ManagedBy": "Pulumi",
            **args.tags
        }
        
        # Create all resources
        self._create_networking()
        self._create_security()
        self._create_compute()
        self._create_database()
        
        # Register outputs - this must be done at the end of __init__
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "alb_dns_name": self.alb.dns_name,
            "db_endpoint": self.db_instance.endpoint,
            "region": args.region
        })
    
    def _create_networking(self):
        """Create VPC and networking resources"""
        self.vpc = aws.ec2.Vpc(f"{self.args.environment}-{self.args.project}-{self.args.owner}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags={
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-vpc",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        # Get availability zones - MUST pass the provider to get correct region's AZs
        availability_zones = aws.get_availability_zones(
            state="available",
            opts=pulumi.InvokeOptions(provider=self.aws_provider)
        )
        az_names = availability_zones.names

        self.public_subnets = []
        self.private_subnets = []

        # Create subnets in first 2 AZs
        for i in range(2):
            public_subnet = aws.ec2.Subnet(
                f"{self.args.environment}-{self.args.project}-{self.args.owner}-public-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az_names[i],
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-public-subnet-{i}",
                    **self.tags
                },
                opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))
            
            private_subnet = aws.ec2.Subnet(
                f"{self.args.environment}-{self.args.project}-{self.args.owner}-private-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+2}.0/24",
                availability_zone=az_names[i],
                tags={
                    "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-private-subnet-{i}",
                    **self.tags
                },
                opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))
            
            self.public_subnets.append(public_subnet)
            self.private_subnets.append(private_subnet)

        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(f"{self.args.environment}-{self.args.project}-{self.args.owner}-igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-igw",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        # EIP and NAT Gateway
        self.eip = aws.ec2.Eip(f"{self.args.environment}-{self.args.project}-{self.args.owner}-eip",
            domain="vpc",
            tags={
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-eip",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.nat_gateway = aws.ec2.NatGateway(f"{self.args.environment}-{self.args.project}-{self.args.owner}-nat",
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-nat",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        # Route Tables
        self.public_route_table = aws.ec2.RouteTable(f"{self.args.environment}-{self.args.project}-{self.args.owner}-public-rt",
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id,
            )],
            tags={
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-public-rt",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.private_route_table = aws.ec2.RouteTable(f"{self.args.environment}-{self.args.project}-{self.args.owner}-private-rt",
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateway.id,
            )],
            tags={
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-private-rt",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        # Route Table Associations
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(f"{self.args.environment}-{self.args.project}-{self.args.owner}-public-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(f"{self.args.environment}-{self.args.project}-{self.args.owner}-private-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))
    
    def _create_security(self):
        """Create security groups and IAM resources"""
        self.web_sg = aws.ec2.SecurityGroup(f"{self.args.environment}-{self.args.project}-{self.args.owner}-web-sg",
            vpc_id=self.vpc.id,
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
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-web-sg",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.db_sg = aws.ec2.SecurityGroup(f"{self.args.environment}-{self.args.project}-{self.args.owner}-db-sg",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=[self.vpc.cidr_block],
                )
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
            )],
            tags={
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-db-sg",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.ec2_role = aws.iam.Role(f"{self.args.environment}-{self.args.project}-{self.args.owner}-ec2-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Effect": "Allow",
                    "Sid": "",
                }]
            }),
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.ec2_policy = aws.iam.RolePolicy(f"{self.args.environment}-{self.args.project}-{self.args.owner}-ec2-policy",
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
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.instance_profile = aws.iam.InstanceProfile(f"{self.args.environment}-{self.args.project}-{self.args.owner}-instance-profile",
            role=self.ec2_role.name,
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))
    
    def _create_compute(self):
        """Create EC2 instances and load balancer"""
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[{"name":"name","values":["amzn2-ami-hvm-*-x86_64-gp2"]}],
            opts=pulumi.InvokeOptions(provider=self.aws_provider)
        )

        user_data = """#!/bin/bash
yum update -y
amazon-linux-extras install -y nginx1
systemctl start nginx
systemctl enable nginx
"""

        self.instances = []
        for i, subnet in enumerate(self.public_subnets):
            instance = aws.ec2.Instance(f"{self.args.environment}-{self.args.project}-{self.args.owner}-web-{i}",
                instance_type="t2.micro",
                ami=ami.id,
                subnet_id=subnet.id,
                vpc_security_group_ids=[self.web_sg.id],
                iam_instance_profile=self.instance_profile.name,
                user_data=user_data,
                tags={
                    "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-web-{i}",
                    **self.tags
                },
                opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))
            self.instances.append(instance)

        self.alb = aws.lb.LoadBalancer(f"{self.args.environment}-{self.args.project}-{self.args.owner}-alb",
            security_groups=[self.web_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            tags={
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-alb",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.target_group = aws.lb.TargetGroup(f"{self.args.environment}-{self.args.project}-{self.args.owner}-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
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
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        for i, instance in enumerate(self.instances):
            aws.lb.TargetGroupAttachment(f"{self.args.environment}-{self.args.project}-{self.args.owner}-tg-attachment-{i}",
                target_group_arn=self.target_group.arn,
                target_id=instance.id,
                port=80,
                opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.listener = aws.lb.Listener(f"{self.args.environment}-{self.args.project}-{self.args.owner}-listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.target_group.arn,
            )],
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))
    
    def _create_database(self):
        """Create RDS database and related resources"""
        self.db_subnet_group = aws.rds.SubnetGroup(f"{self.args.environment}-{self.args.project}-{self.args.owner}-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-db-subnet-group",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.rds_monitoring_role = aws.iam.Role(
            f"{self.args.environment}-{self.args.project}-{self.args.owner}-rds-monitoring-role",
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
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.rds_monitoring_policy_attachment = aws.iam.RolePolicyAttachment(
            f"{self.args.environment}-{self.args.project}-{self.args.owner}-rds-monitoring-policy",
            role=self.rds_monitoring_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))

        self.db_password = aws.secretsmanager.Secret(f"{self.args.environment}-{self.args.project}-pw",
            name=f"{self.args.environment}-{self.args.project}-pw")

        self.db_instance = aws.rds.Instance(
            f"{self.args.environment}-{self.args.project}-{self.args.owner}-db",
            engine="postgres",
            engine_version="15.8",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            vpc_security_group_ids=[self.db_sg.id],
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
                "Name": f"{self.args.environment}-{self.args.project}-{self.args.owner}-db",
                **self.tags
            },
            opts=pulumi.ResourceOptions(parent=self, provider=self.aws_provider))


config = pulumi.Config()
aws_config = pulumi.Config("aws")

environment = config.get("environment") or "prod"
project = config.get("project") or "cloudsetup"
owner = config.get("owner") or "mgt"
region = aws_config.get("region") or "us-west-2"

stack_args = TapStackArgs(
    environment=environment,
    project=project,
    owner=owner,
    region=region,
    tags={
        "ManagedBy": "Pulumi",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    }
)

# Create the stack instance
tap_stack = TapStack("tap", stack_args)

# Export outputs at module level
pulumi.export("vpc_id", tap_stack.vpc.id)
pulumi.export("alb_dns_name", tap_stack.alb.dns_name)
pulumi.export("db_endpoint", tap_stack.db_instance.endpoint)
pulumi.export("region", region)
pulumi.export("public_subnet_ids", [subnet.id for subnet in tap_stack.public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in tap_stack.private_subnets])
pulumi.export("web_instance_ids", [instance.id for instance in tap_stack.instances])