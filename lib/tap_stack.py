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
vpc = aws.ec2.Vpc(f"{prefix}-VPC",
    cidr_block=vpc_cidr,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"{prefix}-VPC"}
)

# Create Internet Gateway
internet_gateway = aws.ec2.InternetGateway(f"{prefix}-IGW",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{prefix}-InternetGateway"}
)

# Create public subnets
public_subnets = []
for i, az in enumerate(availability_zones):
    subnet = aws.ec2.Subnet(f"{prefix}-PublicSubnet-{az}",
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
    subnet = aws.ec2.Subnet(f"{prefix}-PrivateSubnet-{az}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=False,
        tags={**common_tags, "Name": f"{prefix}-PrivateSubnet-{az}", "Type": "Private"}
    )
    private_subnets.append(subnet)

# Create Elastic IP for NAT Gateway
nat_eip = aws.ec2.Eip(f"{prefix}-NAT-EIP",
    domain="vpc",
    tags={**common_tags, "Name": f"{prefix}-NAT-EIP"}
)

# Create NAT Gateway in first public subnet
nat_gateway = aws.ec2.NatGateway(f"{prefix}-NAT",
    allocation_id=nat_eip.id,
    subnet_id=public_subnets[0].id,
    tags={**common_tags, "Name": f"{prefix}-NAT-Gateway"}
)

# Create route table for public subnets
public_route_table = aws.ec2.RouteTable(f"{prefix}-PublicRouteTable",
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
    association = aws.ec2.RouteTableAssociation(f"{prefix}-PublicRTA-{i}",
        subnet_id=subnet.id,
        route_table_id=public_route_table.id
    )
    public_route_table_associations.append(association)

# Create route table for private subnets
private_route_table = aws.ec2.RouteTable(f"{prefix}-PrivateRouteTable",
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
    association = aws.ec2.RouteTableAssociation(f"{prefix}-PrivateRTA-{i}",
        subnet_id=subnet.id,
        route_table_id=private_route_table.id
    )
    private_route_table_associations.append(association)

# Create security groups
# Security group for load balancer
lb_security_group = aws.ec2.SecurityGroup(f"{prefix}-LB-SG",
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
ec2_security_group = aws.ec2.SecurityGroup(f"{prefix}-EC2-SG",
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
rds_security_group = aws.ec2.SecurityGroup(f"{prefix}-RDS-SG",
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
ec2_role = aws.iam.Role(f"{prefix}-EC2-Role",
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
aws.iam.RolePolicyAttachment(f"{prefix}-EC2-SSM-Policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
)

aws.iam.RolePolicyAttachment(f"{prefix}-EC2-SSM-Parameter-Policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
)

# Create instance profile
ec2_instance_profile = aws.iam.InstanceProfile(f"{prefix}-EC2-Profile",
    role=ec2_role.name,
    tags={**common_tags, "Name": f"{prefix}-EC2-InstanceProfile"}
)

# Create Parameter Store parameters
db_host_param = aws.ssm.Parameter(f"{prefix}-DB-Host",
    name=f"/{environment}/database/host",
    type="String",
    value="placeholder",  # Will be updated after RDS creation
    tags={**common_tags, "Name": f"{prefix}-DB-Host-Parameter"}
)

db_name_param = aws.ssm.Parameter(f"{prefix}-DB-Name",
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
rds_instance = aws.rds.Instance(f"{prefix}-RDS",
    allocated_storage=20,
    storage_type="gp2",
    engine="mysql",
    engine_version="8.0.35",
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

# Update DB host parameter with actual RDS endpoint
db_host_param.value = rds_instance.endpoint

# Create launch template
launch_template = aws.ec2.LaunchTemplate(f"{prefix}-LaunchTemplate",
    name_prefix=f"{prefix}-LT",
    image_id="ami-0c02fb55956c7d316",  # Amazon Linux 2 AMI - update for your region
    instance_type="t3.micro",
    key_name="",  # Add your key pair name if you want SSH access
    vpc_security_group_ids=[ec2_security_group.id],
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        name=ec2_instance_profile.name
    ),
    user_data=pulumi.Output.all(rds_instance.endpoint, db_name_param.value).apply(
        lambda args: f"""#!/bin/bash
yum update -y
yum install -y httpd php php-mysqlnd
systemctl start httpd
systemctl enable httpd

# Create simple PHP application
cat > /var/www/html/index.php << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
</head>
<body>
    <h1>Welcome to the Web Application</h1>
    <p>This is a sample web application deployed with Pulumi.</p>
    <p>Database Host: {args[0]}</p>
    <p>Database Name: {args[1]}</p>
    <p>Instance ID: <?php echo gethostname(); ?></p>
</body>
</html>
EOF

# Configure PHP to connect to RDS
cat > /var/www/html/db-test.php << 'EOF'
<?php
$servername = "{args[0]}";
$username = "admin";
$password = "changeme123!";
$dbname = "{args[1]}";

try {{
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected successfully to database";
}} catch(PDOException $e) {{
    echo "Connection failed: " . $e->getMessage();
}}
?>
EOF

chown -R apache:apache /var/www/html
"""
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
target_group = aws.lb.TargetGroup(f"{prefix}-TargetGroup",
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
load_balancer = aws.lb.LoadBalancer(f"{prefix}-ALB",
    internal=False,
    load_balancer_type="application",
    security_groups=[lb_security_group.id],
    subnets=[subnet.id for subnet in public_subnets],
    enable_deletion_protection=False,
    tags={**common_tags, "Name": f"{prefix}-ApplicationLoadBalancer"}
)

# Create listener
listener = aws.lb.Listener(f"{prefix}-Listener",
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
asg = aws.autoscaling.Group(f"{prefix}-ASG",
    desired_capacity=2,
    max_size=4,
    min_size=1,
    target_group_arns=[target_group.arn],
    vpc_zone_identifier=[subnet.id for subnet in private_subnets],
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest"
    ),
    tag=[
        aws.autoscaling.GroupTagArgs(
            key="Name",
            value=f"{prefix}-WebServer",
            propagate_at_launch=True
        )
    ],
    tags={**common_tags, "Name": f"{prefix}-AutoScalingGroup"}
)

# Create Auto Scaling policies
scale_up_policy = aws.autoscaling.Policy(f"{prefix}-ScaleUpPolicy",
    adjustment_type="ChangeInCapacity",
    autoscaling_group_name=asg.name,
    cooldown=300,
    scaling_adjustment=1
)

scale_down_policy = aws.autoscaling.Policy(f"{prefix}-ScaleDownPolicy",
    adjustment_type="ChangeInCapacity",
    autoscaling_group_name=asg.name,
    cooldown=300,
    scaling_adjustment=-1
)

# Create CloudWatch alarms for Auto Scaling
cpu_high_alarm = aws.cloudwatch.MetricAlarm(f"{prefix}-CPUHighAlarm",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=80.0,
    alarm_description="Scale up if CPU > 80% for 4 minutes",
    alarm_actions=[scale_up_policy.arn],
    dimensions=[aws.cloudwatch.MetricAlarmDimensionArgs(
        name="AutoScalingGroupName",
        value=asg.name
    )]
)

cpu_low_alarm = aws.cloudwatch.MetricAlarm(f"{prefix}-CPULowAlarm",
    comparison_operator="LessThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=20.0,
    alarm_description="Scale down if CPU < 20% for 4 minutes",
    alarm_actions=[scale_down_policy.arn],
    dimensions=[aws.cloudwatch.MetricAlarmDimensionArgs(
        name="AutoScalingGroupName",
        value=asg.name
    )]
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
