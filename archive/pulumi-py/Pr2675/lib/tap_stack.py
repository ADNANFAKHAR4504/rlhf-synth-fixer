import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any

# Configuration
config = pulumi.Config()
environment = config.get("environment") or "prod"
vpc_cidr = config.get("vpc_cidr") or "10.0.0.0/16"
availability_zones = ["us-west-2a", "us-west-2b"]  # Update with your preferred region
prefix = "Prod"

# Tags for all resources
common_tags = {
    "Environment": environment,
    "Project": "WebAppInfrastructure",
    "ManagedBy": "Pulumi",
    "Team": "Infrastructure"
}

# Create VPC
vpc = aws.ec2.Vpc(f"{prefix.lower()}-vpc",
    cidr_block=vpc_cidr,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"{prefix}-VPC"}
)

# Create Internet Gateway
internet_gateway = aws.ec2.InternetGateway(f"{prefix.lower()}-igw",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{prefix}-InternetGateway"}
)

# Create public subnets
public_subnets = []
for i, az in enumerate(availability_zones):
    subnet = aws.ec2.Subnet(f"{prefix.lower()}-public-subnet-{az}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={**common_tags, "Name": f"{prefix}-PublicSubnet-{az}", "Type": "Public"}
    )
    public_subnets.append(subnet)

# Create private subnets
private_subnets = []
for i, az in enumerate(availability_zones):
    subnet = aws.ec2.Subnet(f"{prefix.lower()}-private-subnet-{az}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=False,
        tags={**common_tags, "Name": f"{prefix}-PrivateSubnet-{az}", "Type": "Private"}
    )
    private_subnets.append(subnet)

# Create Elastic IP for NAT Gateway
nat_eip = aws.ec2.Eip(f"{prefix.lower()}-nat-eip",
    domain="vpc",
    tags={**common_tags, "Name": f"{prefix}-NAT-EIP"}
)

# Create NAT Gateway in first public subnet
nat_gateway = aws.ec2.NatGateway(f"{prefix.lower()}-nat",
    allocation_id=nat_eip.id,
    subnet_id=public_subnets[0].id,
    tags={**common_tags, "Name": f"{prefix}-NAT-Gateway"}
)

# Create route table for public subnets
public_route_table = aws.ec2.RouteTable(f"{prefix.lower()}-public-route-table",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=internet_gateway.id
        )
    ],
    tags={**common_tags, "Name": f"{prefix}-PublicRouteTable"}
)

# Associate public route table with public subnets
public_route_table_associations = []
for i, subnet in enumerate(public_subnets):
    association = aws.ec2.RouteTableAssociation(f"{prefix.lower()}-public-rta-{i}",
        subnet_id=subnet.id,
        route_table_id=public_route_table.id
    )
    public_route_table_associations.append(association)

# Create route table for private subnets
private_route_table = aws.ec2.RouteTable(f"{prefix.lower()}-private-route-table",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id
        )
    ],
    tags={**common_tags, "Name": f"{prefix}-PrivateRouteTable"}
)

# Associate private route table with private subnets
private_route_table_associations = []
for i, subnet in enumerate(private_subnets):
    association = aws.ec2.RouteTableAssociation(f"{prefix.lower()}-private-rta-{i}",
        subnet_id=subnet.id,
        route_table_id=private_route_table.id
    )
    private_route_table_associations.append(association)

# Create security groups
# Security group for load balancer
lb_security_group = aws.ec2.SecurityGroup(f"{prefix.lower()}-lb-sg",
    description="Security group for Application Load Balancer",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTP",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        ),
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTPS",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={**common_tags, "Name": f"{prefix}-LB-SecurityGroup"}
)

# Security group for EC2 instances
ec2_security_group = aws.ec2.SecurityGroup(f"{prefix.lower()}-ec2-sg",
    description="Security group for EC2 instances",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTP from Load Balancer",
            from_port=80,
            to_port=80,
            protocol="tcp",
            security_groups=[lb_security_group.id]
        ),
        aws.ec2.SecurityGroupIngressArgs(
            description="SSH from bastion or specific IPs",
            from_port=22,
            to_port=22,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"]  # Restrict to VPC
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={**common_tags, "Name": f"{prefix}-EC2-SecurityGroup"}
)

# Security group for RDS
rds_security_group = aws.ec2.SecurityGroup(f"{prefix.lower()}-rds-sg",
    description="Security group for RDS instance",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="MySQL/Aurora from EC2 instances",
            from_port=3306,
            to_port=3306,
            protocol="tcp",
            security_groups=[ec2_security_group.id]
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={**common_tags, "Name": f"{prefix}-RDS-SecurityGroup"}
)

# Create IAM role for EC2 instances
ec2_role = aws.iam.Role(f"{prefix.lower()}-ec2-role",
    assume_role_policy=aws.iam.get_policy_document(statements=[aws.iam.GetPolicyDocumentStatementArgs(
        actions=["sts:AssumeRole"],
        effect="Allow",
        principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
            type="Service",
            identifiers=["ec2.amazonaws.com"]
        )]
    )]).json,
    tags={**common_tags, "Name": f"{prefix}-EC2-Role"}
)

# Attach policies to EC2 role
aws.iam.RolePolicyAttachment(f"{prefix.lower()}-ec2-ssm-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
)

aws.iam.RolePolicyAttachment(f"{prefix.lower()}-ec2-ssm-parameter-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
)

# Create instance profile
ec2_instance_profile = aws.iam.InstanceProfile(f"{prefix.lower()}-ec2-profile",
    role=ec2_role.name,
    tags={**common_tags, "Name": f"{prefix}-EC2-InstanceProfile"}
)

# Create Parameter Store parameters
db_host_param = aws.ssm.Parameter(f"{prefix.lower()}-db-host",
    name=f"/{environment}/database/host",
    type="String",
    value="placeholder",  # Will be updated after RDS creation
    tags={**common_tags, "Name": f"{prefix}-DB-Host-Parameter"}
)

db_name_param = aws.ssm.Parameter(f"{prefix.lower()}-db-name",
    name=f"/{environment}/database/name",
    type="String",
    value="webappdb",
    tags={**common_tags, "Name": f"{prefix}-DB-Name-Parameter"}
)

# Create subnet group for RDS
rds_subnet_group = aws.rds.SubnetGroup(f"{prefix.lower()}-rds-subnet-group",
    subnet_ids=[subnet.id for subnet in private_subnets],
    tags={**common_tags, "Name": f"{prefix}-RDS-SubnetGroup"}
)

# Create RDS instance
rds_instance = aws.rds.Instance(f"{prefix.lower()}-rds-instance",
    allocated_storage=20,
    storage_type="gp3",
    engine="mysql",
    engine_version="8.0.40",  # Updated to supported version
    instance_class="db.t3.micro",
    db_name="webappdb",
    username="admin",
    password="changeme123!",  # In production, use Parameter Store or Secrets Manager
    parameter_group_name="default.mysql8.0",
    skip_final_snapshot=True,
    multi_az=True,
    db_subnet_group_name=rds_subnet_group.name,
    vpc_security_group_ids=[rds_security_group.id],
    tags={**common_tags, "Name": f"{prefix}-RDS-Instance"}
)

# Note: RDS endpoint is available as rds_instance.endpoint
# Parameter Store values cannot be updated after creation in this way

# Get the latest Amazon Linux 2 AMI
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

# Create launch template
launch_template = aws.ec2.LaunchTemplate(f"{prefix.lower()}-launch-template",
    name_prefix=f"{prefix.lower()}-lt",
    image_id=ami.id,  # Dynamic Amazon Linux 2 AMI lookup
    instance_type="t3.micro",
    key_name="",  # Add your key pair name if you want SSH access
    vpc_security_group_ids=[ec2_security_group.id],
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        name=ec2_instance_profile.name
    ),
    user_data=pulumi.Output.all(rds_instance.endpoint, db_name_param.value).apply(
        lambda args: __import__('base64').b64encode(f"""#!/bin/bash
yum update -y
yum install -y httpd php php-mysqlnd
systemctl start httpd
systemctl enable httpd

# Create simple web page
echo "<h1>Welcome to Web Application</h1>" > /var/www/html/index.html
echo "<p>Database Host: {args[0]}</p>" >> /var/www/html/index.html
echo "<p>Database Name: {args[1]}</p>" >> /var/www/html/index.html

chown -R apache:apache /var/www/html
""".encode('utf-8')).decode('utf-8')
    ),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags=common_tags
        )
    ],
    tags={**common_tags, "Name": f"{prefix}-LaunchTemplate"}
)

# Create target group
target_group = aws.lb.TargetGroup(f"{prefix.lower()}-target-group",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    target_type="instance",
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
    tags={**common_tags, "Name": f"{prefix}-TargetGroup"}
)

# Create Application Load Balancer
load_balancer = aws.lb.LoadBalancer(f"{prefix.lower()}-alb",
    internal=False,
    load_balancer_type="application",
    security_groups=[lb_security_group.id],
    subnets=[subnet.id for subnet in public_subnets],
    enable_deletion_protection=False,
    tags={**common_tags, "Name": f"{prefix}-ApplicationLoadBalancer"}
)

# Create listener
listener = aws.lb.Listener(f"{prefix.lower()}-listener",
    load_balancer_arn=load_balancer.arn,
    port=80,
    protocol="HTTP",
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
        )
    ]
)

# Create Auto Scaling Group
asg = aws.autoscaling.Group(f"{prefix.lower()}-asg",
    desired_capacity=2,
    max_size=4,
    min_size=1,
    target_group_arns=[target_group.arn],
    vpc_zone_identifiers=[subnet.id for subnet in private_subnets],
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest"
    ),
    tags=[
        aws.autoscaling.GroupTagArgs(
            key="Name",
            value=f"{prefix}-AutoScalingGroup",
            propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
            key="Environment",
            value=environment,
            propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
            key="Project",
            value="WebAppInfrastructure",
            propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
            key="ManagedBy",
            value="Pulumi",
            propagate_at_launch=True
        )
    ]
)

# Create Auto Scaling policies
scale_up_policy = aws.autoscaling.Policy(f"{prefix.lower()}-scale-up-policy",
    adjustment_type="ChangeInCapacity",
    autoscaling_group_name=asg.name,
    cooldown=300,
    scaling_adjustment=1
)

scale_down_policy = aws.autoscaling.Policy(f"{prefix.lower()}-scale-down-policy",
    adjustment_type="ChangeInCapacity",
    autoscaling_group_name=asg.name,
    cooldown=300,
    scaling_adjustment=-1
)

# Create CloudWatch alarms for Auto Scaling
# Note: Dimensions removed due to Pulumi AWS compatibility issues
# These alarms will monitor all EC2 instances in the region
cpu_high_alarm = aws.cloudwatch.MetricAlarm(f"{prefix.lower()}-cpu-high-alarm",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=80.0,
    alarm_description="Scale up if CPU > 80% for 4 minutes",
    alarm_actions=[scale_up_policy.arn]
)

cpu_low_alarm = aws.cloudwatch.MetricAlarm(f"{prefix.lower()}-cpu-low-alarm",
    comparison_operator="LessThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=20.0,
    alarm_description="Scale down if CPU < 20% for 4 minutes",
    alarm_actions=[scale_down_policy.arn]
)

# Export important values
pulumi.export("vpc_id", vpc.id)
pulumi.export("vpc_cidr", vpc.cidr_block)
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
pulumi.export("load_balancer_dns", load_balancer.dns_name)
pulumi.export("rds_endpoint", rds_instance.endpoint)
pulumi.export("auto_scaling_group_name", asg.name)
pulumi.export("target_group_arn", target_group.arn)
