```python
"""
Secure and Scalable AWS Cloud Environment using Pulumi with Python
"""

import pulumi
import pulumi_aws as aws
import json
import base64

# Configuration and constants
project_name = "secure-cloud-env"
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]  # Adjust based on your region

# Define VPC
vpc = aws.ec2.Vpc(
    f"{project_name}-vpc",
    cidr_block=vpc_cidr,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"{project_name}-vpc",
        "Environment": "Production"
    }
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"{project_name}-igw",
    vpc_id=vpc.id,
    tags={
        "Name": f"{project_name}-igw"
    }
)

# Public and private subnets
public_subnets = []
private_subnets = []

for i, az in enumerate(availability_zones):
    # Public subnet (for each AZ)
    public_subnet = aws.ec2.Subnet(
        f"{project_name}-public-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i*2}.0/24",  # 10.0.0.0/24, 10.0.2.0/24, etc.
        map_public_ip_on_launch=True,
        availability_zone=az,
        tags={
            "Name": f"{project_name}-public-subnet-{i+1}"
        }
    )
    public_subnets.append(public_subnet)

    # Private subnet (for each AZ)
    private_subnet = aws.ec2.Subnet(
        f"{project_name}-private-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i*2+1}.0/24",  # 10.0.1.0/24, 10.0.3.0/24, etc.
        map_public_ip_on_launch=False,
        availability_zone=az,
        tags={
            "Name": f"{project_name}-private-subnet-{i+1}"
        }
    )
    private_subnets.append(private_subnet)

# NAT Gateway (one per AZ for high availability)
eips = []
nat_gateways = []

for i, public_subnet in enumerate(public_subnets):
    # Elastic IP for NAT Gateway
    eip = aws.ec2.Eip(
        f"{project_name}-eip-{i+1}",
        vpc=True,
        tags={
            "Name": f"{project_name}-eip-{i+1}"
        }
    )
    eips.append(eip)

    # NAT Gateway
    nat_gateway = aws.ec2.NatGateway(
        f"{project_name}-nat-{i+1}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={
            "Name": f"{project_name}-nat-{i+1}"
        }
    )
    nat_gateways.append(nat_gateway)

# Route tables
public_route_table = aws.ec2.RouteTable(
    f"{project_name}-public-rt",
    vpc_id=vpc.id,
    tags={
        "Name": f"{project_name}-public-rt"
    }
)

# Internet route for public route table
internet_route = aws.ec2.Route(
    f"{project_name}-internet-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# Associate public subnets with public route table
public_route_table_associations = []

for i, public_subnet in enumerate(public_subnets):
    association = aws.ec2.RouteTableAssociation(
        f"{project_name}-public-rta-{i+1}",
        subnet_id=public_subnet.id,
        route_table_id=public_route_table.id
    )
    public_route_table_associations.append(association)

# Private route tables (one per AZ for high availability)
private_route_tables = []
private_nat_routes = []
private_route_table_associations = []

for i, (private_subnet, nat_gateway) in enumerate(zip(private_subnets, nat_gateways)):
    # Private route table
    private_route_table = aws.ec2.RouteTable(
        f"{project_name}-private-rt-{i+1}",
        vpc_id=vpc.id,
        tags={
            "Name": f"{project_name}-private-rt-{i+1}"
        }
    )
    private_route_tables.append(private_route_table)

    # NAT route for private route table
    nat_route = aws.ec2.Route(
        f"{project_name}-nat-route-{i+1}",
        route_table_id=private_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id
    )
    private_nat_routes.append(nat_route)

    # Associate private subnet with private route table
    association = aws.ec2.RouteTableAssociation(
        f"{project_name}-private-rta-{i+1}",
        subnet_id=private_subnet.id,
        route_table_id=private_route_table.id
    )
    private_route_table_associations.append(association)

# Security Group for EC2 instances in public subnet
public_sg = aws.ec2.SecurityGroup(
    f"{project_name}-public-sg",
    description="Security group for EC2 instances in public subnet",
    vpc_id=vpc.id,
    ingress=[
        # Allow HTTPS traffic (for SSM connection)
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTPS from anywhere",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],  # In production, restrict to your organization's IP range
        ),
    ],
    egress=[
        # Allow all outbound traffic
        aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
        ),
    ],
    tags={
        "Name": f"{project_name}-public-sg"
    }
)

# IAM Role for EC2 instances (to enable SSM)
ssm_role = aws.iam.Role(
    f"{project_name}-ssm-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    })
)

# Attach the AmazonSSMManagedInstanceCore policy to allow SSM
ssm_policy_attachment = aws.iam.RolePolicyAttachment(
    f"{project_name}-ssm-policy",
    role=ssm_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
)

# Create an instance profile for the role
instance_profile = aws.iam.InstanceProfile(
    f"{project_name}-instance-profile",
    role=ssm_role.name
)

# User data script to install SSM agent and other necessary software
user_data = """#!/bin/bash
# Update and install necessary packages
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
"""

# Get the latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"],
        ),
    ],
)

# Launch template for EC2 instances
launch_template = aws.ec2.LaunchTemplate(
    f"{project_name}-launch-template",
    name_prefix=f"{project_name}-",
    image_id=ami.id,
    instance_type="t3.micro",  # Adjust based on your needs
    vpc_security_group_ids=[public_sg.id],
    user_data=base64.b64encode(user_data.encode("utf-8")).decode("utf-8"),
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        name=instance_profile.name,
    ),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={
                "Name": f"{project_name}-instance",
                "Environment": "Production"
            },
        ),
    ],
)

# Auto Scaling Group
auto_scaling_group = aws.autoscaling.Group(
    f"{project_name}-asg",
    vpc_zone_identifiers=[ps.id for ps in public_subnets],
    desired_capacity=1,
    min_size=1,
    max_size=3,
    health_check_type="EC2",
    health_check_grace_period=300,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest",
    ),
    tags=[
        aws.autoscaling.GroupTagArgs(
            key="Name",
            value=f"{project_name}-asg-instance",
            propagate_at_launch=True,
        ),
    ],
)

# Auto Scaling Policy (CPU based)
scaling_policy = aws.autoscaling.Policy(
    f"{project_name}-cpu-policy",
    scaling_adjustment=1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=auto_scaling_group.name,
    policy_type="SimpleScaling",
)

# CloudWatch Alarm for high CPU
cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"{project_name}-cpu-alarm",
    comparison_operator="GreaterThanOrEqualToThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=75,
    alarm_description="This metric monitors EC2 CPU utilization",
    alarm_actions=[scaling_policy.arn],
    dimensions={
        "AutoScalingGroupName": auto_scaling_group.name,
    },
)

# CloudWatch Alarm for low CPU (to scale down)
cpu_low_alarm = aws.cloudwatch.MetricAlarm(
    f"{project_name}-cpu-low-alarm",
    comparison_operator="LessThanOrEqualToThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=30,
    alarm_description="This metric monitors EC2 CPU utilization for scale-in",
    alarm_actions=[
        aws.autoscaling.Policy(
            f"{project_name}-cpu-low-policy",
            scaling_adjustment=-1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=auto_scaling_group.name,
            policy_type="SimpleScaling",
        ).arn
    ],
    dimensions={
        "AutoScalingGroupName": auto_scaling_group.name,
    },
)

# Lambda function to monitor EC2 health and replace unhealthy instances
lambda_role = aws.iam.Role(
    f"{project_name}-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    })
)

# Attach necessary policies to the Lambda role
lambda_policy = aws.iam.RolePolicy(
    f"{project_name}-lambda-policy",
    role=lambda_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeInstances",
                    "ec2:DescribeInstanceStatus",
                    "autoscaling:DescribeAutoScalingGroups",
                    "autoscaling:DescribeAutoScalingInstances",
                    "autoscaling:SetInstanceHealth"
                ],
                "Resource": "*"
            }
        ]
    })
)

# Lambda function code to monitor EC2 health
lambda_code = """
import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.client('ec2')
autoscaling = boto3.client('autoscaling')

def lambda_handler(event, context):
    # Get all instances in the auto scaling group
    asg_name = 'secure-cloud-env-asg'
    response = autoscaling.describe_auto_scaling_groups(AutoScalingGroupNames=[asg_name])

    if not response['AutoScalingGroups']:
        logger.warning(f"Auto Scaling Group {asg_name} not found")
        return

    instance_ids = []
    for asg in response['AutoScalingGroups']:
        for instance in asg['Instances']:
            instance_ids.append(instance['InstanceId'])

    if not instance_ids:
        logger.info(f"No instances found in Auto Scaling Group {asg_name}")
        return

    # Check instance health
    response = ec2.describe_instance_status(InstanceIds=instance_ids)

    for status in response['InstanceStatuses']:
        instance_id = status['InstanceId']
        instance_status = status['InstanceStatus']['Status']
        system_status = status['SystemStatus']['Status']

        logger.info(f"Instance {instance_id} status: instance={instance_status}, system={system_status}")

        # If instance is unhealthy, mark it for replacement
        if instance_status != 'ok' or system_status != 'ok':
            logger.warning(f"Unhealthy instance detected: {instance_id}")
            try:
                autoscaling.set_instance_health(
                    InstanceId=instance_id,
                    HealthStatus='Unhealthy',
                    ShouldRespectGracePeriod=False
                )
                logger.info(f"Instance {instance_id} marked as unhealthy for replacement")
            except Exception as e:
                logger.error(f"Error marking instance {instance_id} as unhealthy: {str(e)}")
"""

# Create the Lambda function
health_check_lambda = aws.lambda_.Function(
    f"{project_name}-health-check-lambda",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda")  # Ensure this directory exists with lambda_function.py
    }),
    handler="lambda_function.lambda_handler",
    role=lambda_role.arn,
    runtime="python3.8",
    timeout=30,
    environment={
        "variables": {
            "ASG_NAME": auto_scaling_group.name
        }
    },
    tags={
        "Name": f"{project_name}-health-check-lambda"
    }
)

# CloudWatch Event Rule to trigger Lambda periodically
event_rule = aws.cloudwatch.EventRule(
    f"{project_name}-health-check-rule",
    description="Trigger EC2 health check Lambda function",
    schedule_expression="rate(5 minutes)"
)

# Connect the event rule to the Lambda function
event_target = aws.cloudwatch.EventTarget(
    f"{project_name}-health-check-target",
    rule=event_rule.name,
    arn=health_check_lambda.arn
)

# Permission for CloudWatch to invoke the Lambda
lambda_permission = aws.lambda_.Permission(
    f"{project_name}-lambda-permission",
    action="lambda:InvokeFunction",
    function=health_check_lambda.name,
    principal="events.amazonaws.com",
    source_arn=event_rule.arn
)

# Outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
pulumi.export("auto_scaling_group_name", auto_scaling_group.name)
pulumi.export("lambda_function_name", health_check_lambda.name)
pulumi.export("ssm_access_instructions", "Connect to instances using AWS Systems Manager Session Manager in the AWS Console")
```

Wait, I just realized there's an issue with the Lambda function code I provided. Let me fix that:

1. I've included the Lambda code inline, but I've also set it up to use a local directory. Let's adjust this.
2. We should ensure the EC2 instance in the public subnet is properly configured for SSM.

Let me correct those issues:

```python
# Updated Lambda function part
health_check_lambda = aws.lambda_.Function(
    f"{project_name}-health-check-lambda",
    code=pulumi.AssetArchive({
        ".": pulumi.StringAsset(lambda_code)
    }),
    handler="index.lambda_handler",
    role=lambda_role.arn,
    runtime="python3.8",
    timeout=30,
    environment={
        "variables": {
            "ASG_NAME": auto_scaling_group.name
        }
    },
    tags={
        "Name": f"{project_name}-health-check-lambda"
    }
)
```

Hmm, I don't think this is quite right either. Let's provide a proper solution for creating a Lambda function with inline code:

```python
# Lambda function with inline code
lambda_code = """
import boto3
import json
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.client('ec2')
autoscaling = boto3.client('autoscaling')

def lambda_handler(event, context):
    # Get ASG name from environment variable
    asg_name = os.environ.get('ASG_NAME')

    # Get all instances in the auto scaling group
    response = autoscaling.describe_auto_scaling_groups(AutoScalingGroupNames=[asg_name])

    if not response['AutoScalingGroups']:
        logger.warning(f"Auto Scaling Group {asg_name} not found")
        return

    instance_ids = []
    for asg in response['AutoScalingGroups']:
        for instance in asg['Instances']:
            instance_ids.append(instance['InstanceId'])

    if not instance_ids:
        logger.info(f"No instances found in Auto Scaling Group {asg_name}")
        return

    # Check instance health
    response = ec2.describe_instance_status(InstanceIds=instance_ids)

    for status in response['InstanceStatuses']:
        instance_id = status['InstanceId']
        instance_status = status['InstanceStatus']['Status']
        system_status = status['SystemStatus']['Status']

        logger.info(f"Instance {instance_id} status: instance={instance_status}, system={system_status}")

        # If instance is unhealthy, mark it for replacement
        if instance_status != 'ok' or system_status != 'ok':
            logger.warning(f"Unhealthy instance detected: {instance_id}")
            try:
                autoscaling.set_instance_health(
                    InstanceId=instance_id,
                    HealthStatus='Unhealthy',
                    ShouldRespectGracePeriod=False
                )
                logger.info(f"Instance {instance_id} marked as unhealthy for replacement")
            except Exception as e:
                logger.error(f"Error marking instance {instance_id} as unhealthy: {str(e)}")
"""

# Create a zip file for the Lambda function
import io
import zipfile
lambda_archive = io.BytesIO()
with zipfile.ZipFile(lambda_archive, 'w') as zf:
    zf.writestr('lambda_function.py', lambda_code)

# Create the Lambda function
health_check_lambda = aws.lambda_.Function(
    f"{project_name}-health-check-lambda",
    code=pulumi.asset.AssetArchive({
        ".": pulumi.asset.BytesAsset(lambda_archive.getvalue())
    }),
    handler="lambda_function.lambda_handler",
    role=lambda_role.arn,
    runtime="python3.8",
    timeout=30,
    environment={
        "variables": {
            "ASG_NAME": auto_scaling_group.name
        }
    },
    tags={
        "Name": f"{project_name}-health-check-lambda"
    }
)
```

```python
# Create the Lambda function with inline code
health_check_lambda = aws.lambda_.Function(
    f"{project_name}-health-check-lambda",
    code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(lambda_code)
    }),
    handler="lambda_function.lambda_handler",
    role=lambda_role.arn,
    runtime="python3.8",
    timeout=30,
    environment={
        "variables": {
            "ASG_NAME": auto_scaling_group.name
        }
    },
    tags={
        "Name": f"{project_name}-health-check-lambda"
    }
)
```

```python
"""
Secure and Scalable AWS Cloud Environment using Pulumi with Python
"""

import pulumi
import pulumi_aws as aws
import json
import base64

# Configuration and constants
project_name = "secure-cloud-env"
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]  # Adjust based on your region

# Define VPC
vpc = aws.ec2.Vpc(
    f"{project_name}-vpc",
    cidr_block=vpc_cidr,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"{project_name}-vpc",
        "Environment": "Production"
    }
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"{project_name}-igw",
    vpc_id=vpc.id,
    tags={
        "Name": f"{project_name}-igw"
    }
)

# Public and private subnets
public_subnets = []
private_subnets = []

for i, az in enumerate(availability_zones):
    # Public subnet (for each AZ)
    public_subnet = aws.ec2.Subnet(
        f"{project_name}-public-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i*2}.0/24",  # 10.0.0.0/24, 10.0.2.0/24, etc.
        map_public_ip_on_launch=True,
        availability_zone=az,
        tags={
            "Name": f"{project_name}-public-subnet-{i+1}"
        }
    )
    public_subnets.append(public_subnet)

    # Private subnet (for each AZ)
    private_subnet = aws.ec2.Subnet(
        f"{project_name}-private-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i*2+1}.0/24",  # 10.0.1.0/24, 10.0.3.0/24, etc.
        map_public_ip_on_launch=False,
        availability_zone=az,
        tags={
            "Name": f"{project_name}-private-subnet-{i+1}"
        }
    )
    private_subnets.append(private_subnet)

# NAT Gateway (one per AZ for high availability)
eips = []
nat_gateways = []

for i, public_subnet in enumerate(public_subnets):
    # Elastic IP for NAT Gateway
    eip = aws.ec2.Eip(
        f"{project_name}-eip-{i+1}",
        vpc=True,
        tags={
            "Name": f"{project_name}-eip-{i+1}"
        }
    )
    eips.append(eip)

    # NAT Gateway
    nat_gateway = aws.ec2.NatGateway(
        f"{project_name}-nat-{i+1}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={
            "Name": f"{project_name}-nat-{i+1}"
        }
    )
    nat_gateways.append(nat_gateway)

# Route tables
public_route_table = aws.ec2.RouteTable(
    f"{project_name}-public-rt",
    vpc_id=vpc.id,
    tags={
        "Name": f"{project_name}-public-rt"
    }
)

# Internet route for public route table
internet_route = aws.ec2.Route(
    f"{project_name}-internet-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# Associate public subnets with public route table
public_route_table_associations = []

for i, public_subnet in enumerate(public_subnets):
    association = aws.ec2.RouteTableAssociation(
        f"{project_name}-public-rta-{i+1}",
        subnet_id=public_subnet.id,
        route_table_id=public_route_table.id
    )
    public_route_table_associations.append(association)

# Private route tables (one per AZ for high availability)
private_route_tables = []
private_nat_routes = []
private_route_table_associations = []

for i, (private_subnet, nat_gateway) in enumerate(zip(private_subnets, nat_gateways)):
    # Private route table
    private_route_table = aws.ec2.RouteTable(
        f"{project_name}-private-rt-{i+1}",
        vpc_id=vpc.id,
        tags={
            "Name": f"{project_name}-private-rt-{i+1}"
        }
    )
    private_route_tables.append(private_route_table)

    # NAT route for private route table
    nat_route = aws.ec2.Route(
        f"{project_name}-nat-route-{i+1}",
        route_table_id=private_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id
    )
    private_nat_routes.append(nat_route)

    # Associate private subnet with private route table
    association = aws.ec2.RouteTableAssociation(
        f"{project_name}-private-rta-{i+1}",
        subnet_id=private_subnet.id,
        route_table_id=private_route_table.id
    )
    private_route_table_associations.append(association)

# Security Group for EC2 instances in public subnet
public_sg = aws.ec2.SecurityGroup(
    f"{project_name}-public-sg",
    description="Security group for EC2 instances in public subnet",
    vpc_id=vpc.id,
    ingress=[
        # Allow HTTPS traffic (for SSM connection)
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTPS from anywhere",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],  # In production, restrict to your organization's IP range
        ),
    ],
    egress=[
        # Allow all outbound traffic
        aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
        ),
    ],
    tags={
        "Name": f"{project_name}-public-sg"
    }
)

# IAM Role for EC2 instances (to enable SSM)
ssm_role = aws.iam.Role(
    f"{project_name}-ssm-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    })
)

# Attach the AmazonSSMManagedInstanceCore policy to allow SSM
ssm_policy_attachment = aws.iam.RolePolicyAttachment(
    f"{project_name}-ssm-policy",
    role=ssm_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
)

# Create an instance profile for the role
instance_profile = aws.iam.InstanceProfile(
    f"{project_name}-instance-profile",
    role=ssm_role.name
)

# User data script to install SSM agent and other necessary software
user_data = """#!/bin/bash
# Update and install necessary packages
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
"""

# Get the latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"],
        ),
    ],
)

# Launch template for EC2 instances
launch_template = aws.ec2.LaunchTemplate(
    f"{project_name}-launch-template",
    name_prefix=f"{project_name}-",
    image_id=ami.id,
    instance_type="t3.micro",  # Adjust based on your needs
    vpc_security_group_ids=[public_sg.id],
    user_data=base64.b64encode(user_data.encode("utf-8")).decode("utf-8"),
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        name=instance_profile.name,
    ),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={
                "Name": f"{project_name}-instance",
                "Environment": "Production"
            },
        ),
    ],
)

# Auto Scaling Group
auto_scaling_group = aws.autoscaling.Group(
    f"{project_name}-asg",
    vpc_zone_identifiers=[ps.id for ps in public_subnets],
    desired_capacity=1,
    min_size=1,
    max_size=3,
    health_check_type="EC2",
    health_check_grace_period=300,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest",
    ),
    tags=[
        aws.autoscaling.GroupTagArgs(
            key="Name",
            value=f"{project_name}-asg-instance",
            propagate_at_launch=True,
        ),
    ],
)

# Auto Scaling Policy (CPU based)
scaling_policy = aws.autoscaling.Policy(
    f"{project_name}-cpu-policy",
    scaling_adjustment=1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=auto_scaling_group.name,
    policy_type="SimpleScaling",
)

# CloudWatch Alarm for high CPU
cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"{project_name}-cpu-alarm",
    comparison_operator="GreaterThanOrEqualToThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=75,
    alarm_description="This metric monitors EC2 CPU utilization",
    alarm_actions=[scaling_policy.arn],
    dimensions={
        "AutoScalingGroupName": auto_scaling_group.name,
    },
)

# CloudWatch Alarm for low CPU (to scale down)
scale_down_policy = aws.autoscaling.Policy(
    f"{project_name}-cpu-low-policy",
    scaling_adjustment=-1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=auto_scaling_group.name,
    policy_type="SimpleScaling",
)

cpu_low_alarm = aws.cloudwatch.MetricAlarm(
    f"{project_name}-cpu-low-alarm",
    comparison_operator="LessThanOrEqualToThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=30,
    alarm_description="This metric monitors EC2 CPU utilization for scale-in",
    alarm_actions=[scale_down_policy.arn],
    dimensions={
        "AutoScalingGroupName": auto_scaling_group.name,
    },
)

# Lambda function to monitor EC2 health and replace unhealthy instances
lambda_role = aws.iam.Role(
    f"{project_name}-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    })
)

# Attach necessary policies to the Lambda role
lambda_policy = aws.iam.RolePolicy(
    f"{project_name}-lambda-policy",
    role=lambda_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeInstances",
                    "ec2:DescribeInstanceStatus",
                    "autoscaling:DescribeAutoScalingGroups",
                    "autoscaling:DescribeAutoScalingInstances",
                    "autoscaling:SetInstanceHealth"
                ],
                "Resource": "*"
            }
        ]
    })
)

# Lambda function code to monitor EC2 health
lambda_code = """
import boto3
import json
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.client('ec2')
autoscaling = boto3.client('autoscaling')

def lambda_handler(event, context):
    # Get ASG name from environment variable
    asg_name = os.environ.get('ASG_NAME')

    # Get all instances in the auto scaling group
    response = autoscaling.describe_auto_scaling_groups(AutoScalingGroupNames=[asg_name])

    if not response['AutoScalingGroups']:
        logger.warning(f"Auto Scaling Group {asg_name} not found")
        return

    instance_ids = []
    for asg in response['AutoScalingGroups']:
        for instance in asg['Instances']:
            instance_ids.append(instance['InstanceId'])

    if not instance_ids:
        logger.info(f"No instances found in Auto Scaling Group {asg_name}")
        return

    # Check instance health
    response = ec2.describe_instance_status(InstanceIds=instance_ids)

    for status in response['InstanceStatuses']:
        instance_id = status['InstanceId']
        instance_status = status['InstanceStatus']['Status']
        system_status = status['SystemStatus']['Status']

        logger.info(f"Instance {instance_id} status: instance={instance_status}, system={system_status}")

        # If instance is unhealthy, mark it for replacement
        if instance_status != 'ok' or system_status != 'ok':
            logger.warning(f"Unhealthy instance detected: {instance_id}")
            try:
                autoscaling.set_instance_health(
                    InstanceId=instance_id,
                    HealthStatus='Unhealthy',
                    ShouldRespectGracePeriod=False
                )
                logger.info(f"Instance {instance_id} marked as unhealthy for replacement")
            except Exception as e:
                logger.error(f"Error marking instance {instance_id} as unhealthy: {str(e)}")
"""

# Create the Lambda function with inline code
health_check_lambda = aws.lambda_.Function(
    f"{project_name}-health-check-lambda",
    code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(lambda_code)
    }),
    handler="lambda_function.lambda_handler",
    role=lambda_role.arn,
    runtime="python3.8",
    timeout=30,
    environment={
        "variables": {
            "ASG_NAME": auto_scaling_group.name
        }
    },
    tags={
        "Name": f"{project_name}-health-check-lambda"
    }
)

# CloudWatch Event Rule to trigger Lambda periodically
event_rule = aws.cloudwatch.EventRule(
    f"{project_name}-health-check-rule",
    description="Trigger EC2 health check Lambda function",
    schedule_expression="rate(5 minutes)"
)

# Connect the event rule to the Lambda function
event_target = aws.cloudwatch.EventTarget(
    f"{project_name}-health-check-target",
    rule=event_rule.name,
    arn=health_check_lambda.arn
)

# Permission for CloudWatch to invoke the Lambda
lambda_permission = aws.lambda_.Permission(
    f"{project_name}-lambda-permission",
    action="lambda:InvokeFunction",
    function=health_check_lambda.name,
    principal="events.amazonaws.com",
    source_arn=event_rule.arn
)

# Outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
pulumi.export("auto_scaling_group_name", auto_scaling_group.name)
pulumi.export("lambda_function_name", health_check_lambda.name)
pulumi.export("ssm_access_instructions", "Connect to instances using AWS Systems Manager Session Manager in the AWS Console")
```

## Implementation

```python
"""
Secure and Scalable AWS Cloud Environment using Pulumi with Python
"""

import pulumi
import pulumi_aws as aws
import json
import base64

# Configuration and constants
project_name = "secure-cloud-env"
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Define VPC
vpc = aws.ec2.Vpc(
    f"{project_name}-vpc",
    cidr_block=vpc_cidr,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"{project_name}-vpc",
        "Environment": "Production"
    }
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"{project_name}-igw",
    vpc_id=vpc.id,
    tags={
        "Name": f"{project_name}-igw"
    }
)

# Public and private subnets
public_subnets = []
private_subnets = []

for i, az in enumerate(availability_zones):
    # Public subnet (for each AZ)
    public_subnet = aws.ec2.Subnet(
        f"{project_name}-public-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i*2}.0/24",  # 10.0.0.0/24, 10.0.2.0/24
        map_public_ip_on_launch=True,
        availability_zone=az,
        tags={
            "Name": f"{project_name}-public-subnet-{i+1}"
        }
    )
    public_subnets.append(public_subnet)

    # Private subnet (for each AZ)
    private_subnet = aws.ec2.Subnet(
        f"{project_name}-private-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i*2+1}.0/24",  # 10.0.1.0/24, 10.0.3.0/24
        map_public_ip_on_launch=False,
        availability_zone=az,
        tags={
            "Name": f"{project_name}-private-subnet-{i+1}"
        }
    )
    private_subnets.append(private_subnet)

# NAT Gateway (one per AZ for high availability)
eips = []
nat_gateways = []

for i, public_subnet in enumerate(public_subnets):
    # Elastic IP for NAT Gateway
    eip = aws.ec2.Eip(
        f"{project_name}-eip-{i+1}",
        vpc=True,
        tags={
            "Name": f"{project_name}-eip-{i+1}"
        }
    )
    eips.append(eip)

    # NAT Gateway
    nat_gateway = aws.ec2.NatGateway(
        f"{project_name}-nat-{i+1}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={
            "Name": f"{project_name}-nat-{i+1}"
        }
    )
    nat_gateways.append(nat_gateway)

# Route tables configuration
public_route_table = aws.ec2.RouteTable(
    f"{project_name}-public-rt",
    vpc_id=vpc.id,
    tags={"Name": f"{project_name}-public-rt"}
)

# Internet route for public route table
internet_route = aws.ec2.Route(
    f"{project_name}-internet-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# Associate public subnets with public route table
public_route_table_associations = []
for i, public_subnet in enumerate(public_subnets):
    association = aws.ec2.RouteTableAssociation(
        f"{project_name}-public-rta-{i+1}",
        subnet_id=public_subnet.id,
        route_table_id=public_route_table.id
    )
    public_route_table_associations.append(association)

# Private route tables (one per AZ for high availability)
private_route_tables = []
private_nat_routes = []
private_route_table_associations = []

for i, (private_subnet, nat_gateway) in enumerate(zip(private_subnets, nat_gateways)):
    # Private route table
    private_route_table = aws.ec2.RouteTable(
        f"{project_name}-private-rt-{i+1}",
        vpc_id=vpc.id,
        tags={"Name": f"{project_name}-private-rt-{i+1}"}
    )
    private_route_tables.append(private_route_table)

    # NAT route for private route table
    nat_route = aws.ec2.Route(
        f"{project_name}-nat-route-{i+1}",
        route_table_id=private_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id
    )
    private_nat_routes.append(nat_route)

    # Associate private subnet with private route table
    association = aws.ec2.RouteTableAssociation(
        f"{project_name}-private-rta-{i+1}",
        subnet_id=private_subnet.id,
        route_table_id=private_route_table.id
    )
    private_route_table_associations.append(association)

# Security Group for EC2 instances in public subnet
public_sg = aws.ec2.SecurityGroup(
    f"{project_name}-public-sg",
    description="Security group for EC2 instances in public subnet",
    vpc_id=vpc.id,
    ingress=[
        # Allow HTTPS traffic (for SSM connection)
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTPS for SSM",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],  # In production, restrict to your IP range
        ),
    ],
    egress=[
        # Allow all outbound traffic
        aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
        ),
    ],
    tags={"Name": f"{project_name}-public-sg"}
)

# IAM Role for EC2 instances (to enable SSM)
ssm_role = aws.iam.Role(
    f"{project_name}-ssm-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Effect": "Allow",
            "Sid": ""
        }]
    })
)

# Attach the AmazonSSMManagedInstanceCore policy to allow SSM
ssm_policy_attachment = aws.iam.RolePolicyAttachment(
    f"{project_name}-ssm-policy",
    role=ssm_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
)

# Create an instance profile for the role
instance_profile = aws.iam.InstanceProfile(
    f"{project_name}-instance-profile",
    role=ssm_role.name
)

# User data script to ensure SSM agent is installed and running
user_data = """#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
"""

# Get the latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[aws.ec2.GetAmiFilterArgs(name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"])],
)

# Launch template for EC2 instances
launch_template = aws.ec2.LaunchTemplate(
    f"{project_name}-launch-template",
    name_prefix=f"{project_name}-",
    image_id=ami.id,
    instance_type="t3.micro",
    vpc_security_group_ids=[public_sg.id],
    user_data=base64.b64encode(user_data.encode("utf-8")).decode("utf-8"),
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        name=instance_profile.name,
    ),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={
                "Name": f"{project_name}-instance",
                "Environment": "Production"
            },
        ),
    ],
)

# Auto Scaling Group
auto_scaling_group = aws.autoscaling.Group(
    f"{project_name}-asg",
    vpc_zone_identifiers=[ps.id for ps in public_subnets],
    desired_capacity=1,
    min_size=1,
    max_size=3,
    health_check_type="EC2",
    health_check_grace_period=300,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest",
    ),
    tags=[
        aws.autoscaling.GroupTagArgs(
            key="Name",
            value=f"{project_name}-asg-instance",
            propagate_at_launch=True,
        ),
    ],
)

# Auto Scaling Policy (CPU based scale-out)
scaling_policy = aws.autoscaling.Policy(
    f"{project_name}-cpu-policy",
    scaling_adjustment=1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=auto_scaling_group.name,
    policy_type="SimpleScaling",
)

# CloudWatch Alarm for high CPU
cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"{project_name}-cpu-alarm",
    comparison_operator="GreaterThanOrEqualToThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=75,
    alarm_description="This metric monitors EC2 CPU utilization",
    alarm_actions=[scaling_policy.arn],
    dimensions={"AutoScalingGroupName": auto_scaling_group.name},
)

# Auto Scaling Policy (CPU based scale-in)
scale_down_policy = aws.autoscaling.Policy(
    f"{project_name}-cpu-low-policy",
    scaling_adjustment=-1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=auto_scaling_group.name,
    policy_type="SimpleScaling",
)

# CloudWatch Alarm for low CPU
cpu_low_alarm = aws.cloudwatch.MetricAlarm(
    f"{project_name}-cpu-low-alarm",
    comparison_operator="LessThanOrEqualToThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=120,
    statistic="Average",
    threshold=30,
    alarm_description="This metric monitors EC2 CPU utilization for scale-in",
    alarm_actions=[scale_down_policy.arn],
    dimensions={"AutoScalingGroupName": auto_scaling_group.name},
)

# Lambda function for EC2 health monitoring
lambda_role = aws.iam.Role(
    f"{project_name}-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Effect": "Allow",
            "Sid": ""
        }]
    })
)

# Attach necessary policies to the Lambda role
lambda_policy = aws.iam.RolePolicy(
    f"{project_name}-lambda-policy",
    role=lambda_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeInstances",
                    "ec2:DescribeInstanceStatus",
                    "autoscaling:DescribeAutoScalingGroups",
                    "autoscaling:DescribeAutoScalingInstances",
                    "autoscaling:SetInstanceHealth"
                ],
                "Resource": "*"
            }
        ]
    })
)

# Lambda function code to monitor EC2 health
lambda_code = """
import boto3
import json
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.client('ec2')
autoscaling = boto3.client('autoscaling')

def lambda_handler(event, context):
    # Get ASG name from environment variable
    asg_name = os.environ.get('ASG_NAME')

    # Get all instances in the auto scaling group
    response = autoscaling.describe_auto_scaling_groups(AutoScalingGroupNames=[asg_name])

    if not response['AutoScalingGroups']:
        logger.warning(f"Auto Scaling Group {asg_name} not found")
        return

    instance_ids = []
    for asg in response['AutoScalingGroups']:
        for instance in asg['Instances']:
            instance_ids.append(instance['InstanceId'])

    if not instance_ids:
        logger.info(f"No instances found in Auto Scaling Group {asg_name}")
        return

    # Check instance health
    response = ec2.describe_instance_status(InstanceIds=instance_ids)

    for status in response['InstanceStatuses']:
        instance_id = status['InstanceId']
        instance_status = status['InstanceStatus']['Status']
        system_status = status['SystemStatus']['Status']

        logger.info(f"Instance {instance_id} status: instance={instance_status}, system={system_status}")

        # If instance is unhealthy, mark it for replacement
        if instance_status != 'ok' or system_status != 'ok':
            logger.warning(f"Unhealthy instance detected: {instance_id}")
            try:
                autoscaling.set_instance_health(
                    InstanceId=instance_id,
                    HealthStatus='Unhealthy',
                    ShouldRespectGracePeriod=False
                )
                logger.info(f"Instance {instance_id} marked as unhealthy for replacement")
            except Exception as e:
                logger.error(f"Error marking instance {instance_id} as unhealthy: {str(e)}")
"""

# Create the Lambda function
health_check_lambda = aws.lambda_.Function(
    f"{project_name}-health-check-lambda",
    code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(lambda_code)
    }),
    handler="lambda_function.lambda_handler",
    role=lambda_role.arn,
    runtime="python3.8",
    timeout=30,
    environment={
        "variables": {
            "ASG_NAME": auto_scaling_group.name
        }
    },
    tags={"Name": f"{project_name}-health-check-lambda"}
)

# CloudWatch Event Rule to trigger Lambda every 5 minutes
event_rule = aws.cloudwatch.EventRule(
    f"{project_name}-health-check-rule",
    description="Trigger EC2 health check Lambda function",
    schedule_expression="rate(5 minutes)"
)

# Connect the event rule to the Lambda function
event_target = aws.cloudwatch.EventTarget(
    f"{project_name}-health-check-target",
    rule=event_rule.name,
    arn=health_check_lambda.arn
)

# Permission for CloudWatch to invoke the Lambda
lambda_permission = aws.lambda_.Permission(
    f"{project_name}-lambda-permission",
    action="lambda:InvokeFunction",
    function=health_check_lambda.name,
    principal="events.amazonaws.com",
    source_arn=event_rule.arn
)

# Outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
pulumi.export("auto_scaling_group_name", auto_scaling_group.name)
pulumi.export("lambda_function_name", health_check_lambda.name)
pulumi.export("ssm_access_instructions",
              "Connect to instances using AWS Systems Manager Session Manager in the AWS Console")
`
```
