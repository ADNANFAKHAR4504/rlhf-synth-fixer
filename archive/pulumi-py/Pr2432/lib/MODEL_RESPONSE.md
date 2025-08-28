``````python
import pulumi
import pulumi_aws as aws
import json

# Configuration
config = pulumi.Config()
environment = config.require("environment")
project = config.require("project")
owner = config.require("owner")
region = "us-west-2"

# Create VPC
vpc = aws.ec2.Vpc(f"{environment}-{project}-{owner}-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_support=True,
    enable_dns_hostnames=True,
    tags={
        "Name": f"{environment}-{project}-{owner}-vpc",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

# Create public and private subnets
public_subnets = []
private_subnets = []
availability_zones = aws.get_availability_zones(state="available", region=region).names

for i, az in enumerate(availability_zones[:2]):
    public_subnet = aws.ec2.Subnet(f"{environment}-{project}-{owner}-public-subnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
            "Name": f"{environment}-{project}-{owner}-public-subnet-{i}",
            "Environment": environment,
            "Project": project,
            "Owner": owner
        })
    private_subnet = aws.ec2.Subnet(f"{environment}-{project}-{owner}-private-subnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+2}.0/24",
        availability_zone=az,
        tags={
            "Name": f"{environment}-{project}-{owner}-private-subnet-{i}",
            "Environment": environment,
            "Project": project,
            "Owner": owner
        })
    public_subnets.append(public_subnet)
    private_subnets.append(private_subnet)

# Create Internet Gateway
igw = aws.ec2.InternetGateway(f"{environment}-{project}-{owner}-igw",
    vpc_id=vpc.id,
    tags={
        "Name": f"{environment}-{project}-{owner}-igw",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

# Create NAT Gateway
eip = aws.ec2.Eip(f"{environment}-{project}-{owner}-eip",
    vpc=True,
    tags={
        "Name": f"{environment}-{project}-{owner}-eip",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

nat_gateway = aws.ec2.NatGateway(f"{environment}-{project}-{owner}-nat",
    allocation_id=eip.id,
    subnet_id=public_subnets[0].id,
    tags={
        "Name": f"{environment}-{project}-{owner}-nat",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

# Create Route Tables
public_route_table = aws.ec2.RouteTable(f"{environment}-{project}-{owner}-public-rt",
    vpc_id=vpc.id,
    routes=[aws.ec2.RouteTableRouteArgs(
        cidr_block="0.0.0.0/0",
        gateway_id=igw.id,
    )],
    tags={
        "Name": f"{environment}-{project}-{owner}-public-rt",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

private_route_table = aws.ec2.RouteTable(f"{environment}-{project}-{owner}-private-rt",
    vpc_id=vpc.id,
    routes=[aws.ec2.RouteTableRouteArgs(
        cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id,
    )],
    tags={
        "Name": f"{environment}-{project}-{owner}-private-rt",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

# Associate subnets with route tables
for subnet in public_subnets:
    aws.ec2.RouteTableAssociation(f"{environment}-{project}-{owner}-public-rta-{subnet._name}",
        subnet_id=subnet.id,
        route_table_id=public_route_table.id)

for subnet in private_subnets:
    aws.ec2.RouteTableAssociation(f"{environment}-{project}-{owner}-private-rta-{subnet._name}",
        subnet_id=subnet.id,
        route_table_id=private_route_table.id)

# Create Security Groups
web_sg = aws.ec2.SecurityGroup(f"{environment}-{project}-{owner}-web-sg",
    vpc_id=vpc.id,
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
        "Name": f"{environment}-{project}-{owner}-web-sg",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

db_sg = aws.ec2.SecurityGroup(f"{environment}-{project}-{owner}-db-sg",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=5432,
            to_port=5432,
            cidr_blocks=[vpc.cidr_block],
        )
    ],
    egress=[aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
        cidr_blocks=["0.0.0.0/0"],
    )],
    tags={
        "Name": f"{environment}-{project}-{owner}-db-sg",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

# Create IAM Role for EC2
ec2_role = aws.iam.Role(f"{environment}-{project}-{owner}-ec2-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Effect": "Allow",
            "Sid": "",
        }]
    }))

# Attach policies to EC2 Role
ec2_policy = aws.iam.RolePolicy(f"{environment}-{project}-{owner}-ec2-policy",
    role=ec2_role.id,
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
    }))

# Create EC2 Instances
ami = aws.ec2.get_ami(most_recent=True,
    owners=["amazon"],
    filters=[{"name":"name","values":["amzn2-ami-hvm-*-x86_64-gp2"]}])

user_data = """#!/bin/bash
yum update -y
amazon-linux-extras install -y nginx1
systemctl start nginx
systemctl enable nginx
"""

for i, subnet in enumerate(public_subnets):
    instance = aws.ec2.Instance(f"{environment}-{project}-{owner}-web-{i}",
        instance_type="t2.micro",
        ami=ami.id,
        subnet_id=subnet.id,
        vpc_security_group_ids=[web_sg.id],
        iam_instance_profile=aws.ec2.InstanceProfile(f"{environment}-{project}-{owner}-instance-profile-{i}", role=ec2_role.name),
        user_data=user_data,
        tags={
            "Name": f"{environment}-{project}-{owner}-web-{i}",
            "Environment": environment,
            "Project": project,
            "Owner": owner
        })

# Create Application Load Balancer
alb = aws.lb.LoadBalancer(f"{environment}-{project}-{owner}-alb",
    security_groups=[web_sg.id],
    subnets=[subnet.id for subnet in public_subnets],
    tags={
        "Name": f"{environment}-{project}-{owner}-alb",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

target_group = aws.lb.TargetGroup(f"{environment}-{project}-{owner}-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        path="/",
        port="traffic-port",
        protocol="HTTP",
        interval=30,
        timeout=5,
        healthy_threshold=5,
        unhealthy_threshold=2,
        matcher="200"
    ))

listener = aws.lb.Listener(f"{environment}-{project}-{owner}-listener",
    load_balancer_arn=alb.arn,
    port=80,
    default_actions=[aws.lb.ListenerDefaultActionArgs(
        type="forward",
        target_group_arn=target_group.arn,
    )])

# Create RDS Instance
db_subnet_group = aws.rds.SubnetGroup(f"{environment}-{project}-{owner}-db-subnet-group",
    subnet_ids=[subnet.id for subnet in private_subnets],
    tags={
        "Name": f"{environment}-{project}-{owner}-db-subnet-group",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

db_password = aws.secretsmanager.Secret(f"{environment}-{project}-{owner}-db-password",
    name=f"{environment}-{project}-{owner}-db-password")

db_instance = aws.rds.Instance(f"{environment}-{project}-{owner}-db",
    engine="postgres",
    instance_class="db.t2.micro",
    allocated_storage=20,
    vpc_security_group_ids=[db_sg.id],
    db_subnet_group_name=db_subnet_group.name,
    skip_final_snapshot=True,
    backup_retention_period=7,
    username="postgres",
    password=db_password.id.apply(lambda id: f"{{resolve:secretsmanager:{id}:SecretString:password::}}"),
    tags={
        "Name": f"{environment}-{project}-{owner}-db",
        "Environment": environment,
        "Project": project,
        "Owner": owner
    })

# Enable RDS Enhanced Monitoring
aws.rds.ClusterInstance(f"{environment}-{project}-{owner}-db-monitoring",
    cluster_identifier=db_instance.id,
    identifier=db_instance.id.apply(lambda id: f"{id}-monitoring"),
    engine="postgres",
    engine_version=db_instance.engine_version,
    monitoring_interval=60,
    performance_insights_enabled=True)

# Outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("alb_dns_name", alb.dns_name)
pulumi.export("db_endpoint", db_instance.endpoint)