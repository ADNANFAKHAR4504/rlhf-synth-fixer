"""
AWS Production Infrastructure - Nova Model Breaking
Pulumi Python implementation with security best practices
"""
```python

import pulumi
import pulumi_aws as aws
from pulumi import Config, export

# Configuration
config = Config()
project_name = "nova-model-breaking"
environment = "Production"

# Common tags for all resources
common_tags = {
    "Environment": environment,
    "Project": project_name,
    "ManagedBy": "Pulumi",
    "Owner": "Infrastructure-Team"
}

# Get availability zones for us-west-2
availability_zones = aws.get_availability_zones(
    state="available",
    filters=[
        aws.GetAvailabilityZonesFilterArgs(
            name="region-name",
            values=["us-west-2"]
        )
    ]
)

# VPC Configuration
vpc = aws.ec2.Vpc(
    "nova-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        **common_tags,
        "Name": f"{project_name}-vpc"
    }
)

# Internet Gateway
internet_gateway = aws.ec2.InternetGateway(
    "nova-igw",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": f"{project_name}-igw"
    }
)

# Public Subnets (2 AZs for high availability)
public_subnet_1 = aws.ec2.Subnet(
    "nova-public-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone=availability_zones.names[0],
    map_public_ip_on_launch=True,
    tags={
        **common_tags,
        "Name": f"{project_name}-public-subnet-1",
        "Type": "Public"
    }
)

public_subnet_2 = aws.ec2.Subnet(
    "nova-public-subnet-2",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone=availability_zones.names[1],
    map_public_ip_on_launch=True,
    tags={
        **common_tags,
        "Name": f"{project_name}-public-subnet-2",
        "Type": "Public"
    }
)

# Private Subnets (2 AZs for high availability)
private_subnet_1 = aws.ec2.Subnet(
    "nova-private-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.10.0/24",
    availability_zone=availability_zones.names[0],
    tags={
        **common_tags,
        "Name": f"{project_name}-private-subnet-1",
        "Type": "Private"
    }
)

private_subnet_2 = aws.ec2.Subnet(
    "nova-private-subnet-2",
    vpc_id=vpc.id,
    cidr_block="10.0.11.0/24",
    availability_zone=availability_zones.names[1],
    tags={
        **common_tags,
        "Name": f"{project_name}-private-subnet-2",
        "Type": "Private"
    }
)

# Database Subnets (isolated for RDS)
db_subnet_1 = aws.ec2.Subnet(
    "nova-db-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.20.0/24",
    availability_zone=availability_zones.names[0],
    tags={
        **common_tags,
        "Name": f"{project_name}-db-subnet-1",
        "Type": "Database"
    }
)

db_subnet_2 = aws.ec2.Subnet(
    "nova-db-subnet-2",
    vpc_id=vpc.id,
    cidr_block="10.0.21.0/24",
    availability_zone=availability_zones.names[1],
    tags={
        **common_tags,
        "Name": f"{project_name}-db-subnet-2",
        "Type": "Database"
    }
)

# NAT Gateways for private subnet internet access (for updates, etc.)
eip_1 = aws.ec2.Eip(
    "nova-eip-1",
    domain="vpc",
    tags={
        **common_tags,
        "Name": f"{project_name}-eip-1"
    }
)

eip_2 = aws.ec2.Eip(
    "nova-eip-2",
    domain="vpc",
    tags={
        **common_tags,
        "Name": f"{project_name}-eip-2"
    }
)

nat_gateway_1 = aws.ec2.NatGateway(
    "nova-nat-1",
    allocation_id=eip_1.id,
    subnet_id=public_subnet_1.id,
    tags={
        **common_tags,
        "Name": f"{project_name}-nat-1"
    }
)

nat_gateway_2 = aws.ec2.NatGateway(
    "nova-nat-2",
    allocation_id=eip_2.id,
    subnet_id=public_subnet_2.id,
    tags={
        **common_tags,
        "Name": f"{project_name}-nat-2"
    }
)

# Route Tables
# Public Route Table
public_route_table = aws.ec2.RouteTable(
    "nova-public-rt",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": f"{project_name}-public-rt"
    }
)

# Public Route to Internet Gateway
public_route = aws.ec2.Route(
    "nova-public-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=internet_gateway.id
)

# Associate public subnets with public route table
public_rt_association_1 = aws.ec2.RouteTableAssociation(
    "nova-public-rt-assoc-1",
    subnet_id=public_subnet_1.id,
    route_table_id=public_route_table.id
)

public_rt_association_2 = aws.ec2.RouteTableAssociation(
    "nova-public-rt-assoc-2",
    subnet_id=public_subnet_2.id,
    route_table_id=public_route_table.id
)

# Private Route Tables (one per AZ for high availability)
private_route_table_1 = aws.ec2.RouteTable(
    "nova-private-rt-1",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": f"{project_name}-private-rt-1"
    }
)

private_route_table_2 = aws.ec2.RouteTable(
    "nova-private-rt-2",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": f"{project_name}-private-rt-2"
    }
)

# Private Routes to NAT Gateways
private_route_1 = aws.ec2.Route(
    "nova-private-route-1",
    route_table_id=private_route_table_1.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway_1.id
)

private_route_2 = aws.ec2.Route(
    "nova-private-route-2",
    route_table_id=private_route_table_2.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway_2.id
)

# Associate private subnets with private route tables
private_rt_association_1 = aws.ec2.RouteTableAssociation(
    "nova-private-rt-assoc-1",
    subnet_id=private_subnet_1.id,
    route_table_id=private_route_table_1.id
)

private_rt_association_2 = aws.ec2.RouteTableAssociation(
    "nova-private-rt-assoc-2",
    subnet_id=private_subnet_2.id,
    route_table_id=private_route_table_2.id
)

# Security Groups
# ALB Security Group
alb_security_group = aws.ec2.SecurityGroup(
    "nova-alb-sg",
    name="nova-alb-security-group",
    description="Security group for Application Load Balancer",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="HTTP from internet"
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=["0.0.0.0/0"],
            description="HTTPS from internet"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="All outbound traffic"
        )
    ],
    tags={
        **common_tags,
        "Name": f"{project_name}-alb-sg"
    }
)

# EC2 Security Group
ec2_security_group = aws.ec2.SecurityGroup(
    "nova-ec2-sg",
    name="nova-ec2-security-group",
    description="Security group for EC2 instances",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            security_groups=[alb_security_group.id],
            description="HTTP from ALB only"
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=22,
            to_port=22,
            security_groups=[alb_security_group.id],
            description="SSH from ALB only"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="All outbound traffic"
        )
    ],
    tags={
        **common_tags,
        "Name": f"{project_name}-ec2-sg"
    }
)

# RDS Security Group
rds_security_group = aws.ec2.SecurityGroup(
    "nova-rds-sg",
    name="nova-rds-security-group",
    description="Security group for RDS PostgreSQL",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=5432,
            to_port=5432,
            security_groups=[ec2_security_group.id],
            description="PostgreSQL from EC2 instances only"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="All outbound traffic"
        )
    ],
    tags={
        **common_tags,
        "Name": f"{project_name}-rds-sg"
    }
)

# Get latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"]
        )
    ]
)

# Launch Template for EC2 instances
launch_template = aws.ec2.LaunchTemplate(
    "nova-launch-template",
    name_prefix=f"{project_name}-lt-",
    image_id=ami.id,
    instance_type="t3.medium",
    vpc_security_group_ids=[ec2_security_group.id],
    user_data=pulumi.Output.from_input("""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Nova Model Breaking - Production Server</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
""").apply(lambda x: x.encode('utf-8').decode('utf-8')),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={
                **common_tags,
                "Name": f"{project_name}-instance"
            }
        )
    ],
    tags={
        **common_tags,
        "Name": f"{project_name}-launch-template"
    }
)

# Application Load Balancer
alb = aws.lb.LoadBalancer(
    "nova-alb",
    name=f"{project_name}-alb",
    load_balancer_type="application",
    security_groups=[alb_security_group.id],
    subnets=[public_subnet_1.id, public_subnet_2.id],
    enable_deletion_protection=False,  # Set to True for production
    tags={
        **common_tags,
        "Name": f"{project_name}-alb"
    }
)

# Target Group for ALB
target_group = aws.lb.TargetGroup(
    "nova-tg",
    name=f"{project_name}-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        healthy_threshold=2,
        interval=30,
        matcher="200",
        path="/",
        port="traffic-port",
        protocol="HTTP",
        timeout=5,
        unhealthy_threshold=2
    ),
    tags={
        **common_tags,
        "Name": f"{project_name}-tg"
    }
)

# ALB Listener
alb_listener = aws.lb.Listener(
    "nova-alb-listener",
    load_balancer_arn=alb.arn,
    port="80",
    protocol="HTTP",
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
        )
    ]
)

# Auto Scaling Group
auto_scaling_group = aws.autoscaling.Group(
    "nova-asg",
    name=f"{project_name}-asg",
    vpc_zone_identifiers=[private_subnet_1.id, private_subnet_2.id],
    target_group_arns=[target_group.arn],
    health_check_type="ELB",
    health_check_grace_period=300,
    min_size=2,
    max_size=6,
    desired_capacity=2,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest"
    ),
    tags=[
        aws.autoscaling.GroupTagArgs(
            key="Name",
            value=f"{project_name}-asg-instance",
            propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
            key="Environment",
            value=environment,
            propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
            key="Project",
            value=project_name,
            propagate_at_launch=True
        )
    ]
)

# RDS Subnet Group
rds_subnet_group = aws.rds.SubnetGroup(
    "nova-rds-subnet-group",
    name=f"{project_name}-rds-subnet-group",
    subnet_ids=[db_subnet_1.id, db_subnet_2.id],
    tags={
        **common_tags,
        "Name": f"{project_name}-rds-subnet-group"
    }
)

# RDS PostgreSQL Instance
rds_instance = aws.rds.Instance(
    "nova-rds",
    identifier=f"{project_name}-postgres",
    engine="postgres",
    engine_version="14.9",
    instance_class="db.t3.micro",
    allocated_storage=20,
    storage_type="gp2",
    storage_encrypted=True,
    db_name="novadb",
    username="admin",
    password="SecurePassword123!",  # In production, use AWS Secrets Manager
    vpc_security_group_ids=[rds_security_group.id],
    db_subnet_group_name=rds_subnet_group.name,
    backup_retention_period=7,
    backup_window="03:00-04:00",
    maintenance_window="sun:04:00-sun:05:00",
    multi_az=True,
    publicly_accessible=False,
    skip_final_snapshot=True,  # Set to False for production
    tags={
        **common_tags,
        "Name": f"{project_name}-postgres"
    }
)

# Outputs
export("vpc_id", vpc.id)
export("vpc_cidr", vpc.cidr_block)
export("public_subnet_ids", [public_subnet_1.id, public_subnet_2.id])
export("private_subnet_ids", [private_subnet_1.id, private_subnet_2.id])
export("alb_dns_name", alb.dns_name)
export("alb_zone_id", alb.zone_id)
export("rds_endpoint", rds_instance.endpoint)
export("rds_port", rds_instance.port)
export("availability_zones", availability_zones.names)