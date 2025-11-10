### Reasoning Trace

---

Alright, so I'm being asked to create a Pulumi Python program that provisions a robust AWS infrastructure. Let's break down the requirements:

1. Create a VPC with CIDR block `10.0.0.0/16` in the `us-east-1` region.
2. Deploy two EC2 instances, each in a different availability zone.
3. Set up a security group allowing SSH access only from a given IP range.
4. Create both public and private subnets in each availability zone.
5. Configure a NAT Gateway in one of the public subnets.
6. Attach an Internet Gateway to the VPC.
7. Enable VPC Flow Logs with lifecycle policies.
8. Create IAM roles for EC2 instances to access S3 and CloudWatch.
9. Set up CloudWatch alarms for EC2 instances and the NAT Gateway.
10. Use AWS Systems Manager (SSM) for instance configuration and key management.
11. Tag all resources consistently.
12. Ensure idempotency.
13. Incorporate redundancy mechanisms for high availability.

Let's create a Pulumi Python program that addresses all these requirements. I'll structure the code in a modular way to make it easy to understand and maintain.

First, I'll set up the basic structure of the program:

```python
import pulumi
import pulumi_aws as aws
import json
from typing import List, Dict, Any
import os
from datetime import datetime

# Configuration
project_name = "infra001"
environment_suffix = "dev"  # This could be parameterized based on deployment environment
region = "us-east-1"
cidr_block = "10.0.0.0/16"
ssh_allowed_cidr = ["10.20.30.40/32"]  # Replace with actual allowed IP range
availability_zones = ["us-east-1a", "us-east-1b"]
instance_type = "t2.micro"
ami_id = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2 AMI in us-east-1, should be replaced with a parameter
```

Now, let's start defining our resources. I'll start with the VPC and its components:

```python
# Define common tags for all resources
def create_tags(additional_tags=None):
    tags = {
        "ProjectName": project_name,
        "Environment": environment_suffix,
        "ManagedBy": "Pulumi",
        "CreationDate": datetime.now().strftime("%Y-%m-%d")
    }
    if additional_tags:
        tags.update(additional_tags)
    return tags

# Create VPC
vpc = aws.ec2.Vpc(
    "vpc",
    cidr_block=cidr_block,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags=create_tags({"Name": f"{project_name}-vpc-{environment_suffix}"})
)

# Create Internet Gateway
igw = aws.ec2.InternetGateway(
    "igw",
    vpc_id=vpc.id,
    tags=create_tags({"Name": f"{project_name}-igw-{environment_suffix}"})
)

# Create Public and Private Subnets
public_subnets = []
private_subnets = []

for i, az in enumerate(availability_zones):
    # Public subnet in this AZ
    public_subnet = aws.ec2.Subnet(
        f"public-subnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags=create_tags({"Name": f"{project_name}-public-subnet-{i}-{environment_suffix}", "Type": "Public"})
    )
    public_subnets.append(public_subnet)

    # Private subnet in this AZ
    private_subnet = aws.ec2.Subnet(
        f"private-subnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i + 100}.0/24",
        availability_zone=az,
        tags=create_tags({"Name": f"{project_name}-private-subnet-{i}-{environment_suffix}", "Type": "Private"})
    )
    private_subnets.append(private_subnet)

# Create route tables
public_route_table = aws.ec2.RouteTable(
    "public-route-table",
    vpc_id=vpc.id,
    tags=create_tags({"Name": f"{project_name}-public-rt-{environment_suffix}"})
)

# Create route to Internet Gateway in public route table
public_internet_route = aws.ec2.Route(
    "public-internet-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# Associate public subnets with the public route table
public_route_table_associations = []
for i, subnet in enumerate(public_subnets):
    association = aws.ec2.RouteTableAssociation(
        f"public-subnet-{i}-association",
        subnet_id=subnet.id,
        route_table_id=public_route_table.id
    )
    public_route_table_associations.append(association)

# Create NAT Gateway for outbound internet access from private subnets
eip = aws.ec2.Eip(
    "nat-gateway-eip",
    vpc=True,
    tags=create_tags({"Name": f"{project_name}-nat-eip-{environment_suffix}"})
)

nat_gateway = aws.ec2.NatGateway(
    "nat-gateway",
    allocation_id=eip.id,
    subnet_id=public_subnets[0].id,
    tags=create_tags({"Name": f"{project_name}-nat-gateway-{environment_suffix}"})
)

# Create private route table with route to NAT Gateway
private_route_table = aws.ec2.RouteTable(
    "private-route-table",
    vpc_id=vpc.id,
    tags=create_tags({"Name": f"{project_name}-private-rt-{environment_suffix}"})
)

# Create route to NAT Gateway in private route table
private_nat_route = aws.ec2.Route(
    "private-nat-route",
    route_table_id=private_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway.id
)

# Associate private subnets with the private route table
private_route_table_associations = []
for i, subnet in enumerate(private_subnets):
    association = aws.ec2.RouteTableAssociation(
        f"private-subnet-{i}-association",
        subnet_id=subnet.id,
        route_table_id=private_route_table.id
    )
    private_route_table_associations.append(association)
```

Next, let's set up VPC Flow Logs for detailed network monitoring:

```python
# Create CloudWatch Log Group for VPC Flow Logs
flow_logs_group = aws.cloudwatch.LogGroup(
    "vpc-flow-logs-group",
    name=f"/aws/vpc/flow-logs/{project_name}-{environment_suffix}",
    retention_in_days=30,
    tags=create_tags({"Name": f"{project_name}-flow-logs-group-{environment_suffix}"})
)

# Create IAM role for VPC Flow Logs
flow_logs_role_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}

flow_logs_role = aws.iam.Role(
    "vpc-flow-logs-role",
    assume_role_policy=json.dumps(flow_logs_role_policy),
    tags=create_tags({"Name": f"{project_name}-flow-logs-role-{environment_suffix}"})
)

# Create IAM policy for VPC Flow Logs
flow_logs_policy_document = aws.iam.get_policy_document(statements=[
    aws.iam.GetPolicyDocumentStatementArgs(
        actions=[
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams"
        ],
        resources=["*"],  # In a production environment, this should be more restricted
        effect="Allow"
    )
])

flow_logs_policy = aws.iam.Policy(
    "vpc-flow-logs-policy",
    policy=flow_logs_policy_document.json,
    tags=create_tags({"Name": f"{project_name}-flow-logs-policy-{environment_suffix}"})
)

# Attach policy to role
flow_logs_role_policy_attachment = aws.iam.RolePolicyAttachment(
    "vpc-flow-logs-policy-attachment",
    role=flow_logs_role.name,
    policy_arn=flow_logs_policy.arn
)

# Enable VPC Flow Logs
vpc_flow_log = aws.ec2.FlowLog(
    "vpc-flow-log",
    iam_role_arn=flow_logs_role.arn,
    log_destination=flow_logs_group.arn,
    traffic_type="ALL",
    vpc_id=vpc.id,
    log_destination_type="cloud-watch-logs",
    tags=create_tags({"Name": f"{project_name}-vpc-flow-log-{environment_suffix}"})
)
```

Now, let's create a security group for EC2 instances:

```python
# Create Security Group for EC2 instances
ec2_security_group = aws.ec2.SecurityGroup(
    "ec2-security-group",
    vpc_id=vpc.id,
    description=f"Security group for {project_name} EC2 instances",
    ingress=[
        # Allow SSH from specified IP range
        {
            "protocol": "tcp",
            "from_port": 22,
            "to_port": 22,
            "cidr_blocks": ssh_allowed_cidr,
            "description": "SSH access"
        }
    ],
    egress=[
        # Allow all outbound traffic
        {
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "Allow all outbound traffic"
        }
    ],
    tags=create_tags({"Name": f"{project_name}-ec2-sg-{environment_suffix}"})
)
```

Next, let's create IAM roles for EC2 instances to access S3 and CloudWatch:

```python
# Create IAM role for EC2 instances
ec2_role_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}

ec2_role = aws.iam.Role(
    "ec2-role",
    assume_role_policy=json.dumps(ec2_role_policy),
    tags=create_tags({"Name": f"{project_name}-ec2-role-{environment_suffix}"})
)

# Create IAM policy for EC2 instances to access S3
s3_access_policy_document = aws.iam.get_policy_document(statements=[
    aws.iam.GetPolicyDocumentStatementArgs(
        actions=[
            "s3:GetObject",
            "s3:ListBucket",
            "s3:PutObject"
        ],
        resources=[
            "arn:aws:s3:::your-bucket-name",  # Replace with actual bucket name
            "arn:aws:s3:::your-bucket-name/*"  # Replace with actual bucket name
        ],
        effect="Allow"
    )
])

s3_access_policy = aws.iam.Policy(
    "ec2-s3-access-policy",
    policy=s3_access_policy_document.json,
    tags=create_tags({"Name": f"{project_name}-ec2-s3-access-policy-{environment_suffix}"})
)

# Attach S3 access policy to EC2 role
ec2_s3_policy_attachment = aws.iam.RolePolicyAttachment(
    "ec2-s3-policy-attachment",
    role=ec2_role.name,
    policy_arn=s3_access_policy.arn
)

# Create IAM policy for EC2 instances to access CloudWatch
cloudwatch_access_policy_document = aws.iam.get_policy_document(statements=[
    aws.iam.GetPolicyDocumentStatementArgs(
        actions=[
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams"
        ],
        resources=["*"],  # In a production environment, this should be more restricted
        effect="Allow"
    )
])

cloudwatch_access_policy = aws.iam.Policy(
    "ec2-cloudwatch-access-policy",
    policy=cloudwatch_access_policy_document.json,
    tags=create_tags({"Name": f"{project_name}-ec2-cloudwatch-access-policy-{environment_suffix}"})
)

# Attach CloudWatch access policy to EC2 role
ec2_cloudwatch_policy_attachment = aws.iam.RolePolicyAttachment(
    "ec2-cloudwatch-policy-attachment",
    role=ec2_role.name,
    policy_arn=cloudwatch_access_policy.arn
)

# Attach SSM policy to EC2 role for secure management
ec2_ssm_policy_attachment = aws.iam.RolePolicyAttachment(
    "ec2-ssm-policy-attachment",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
)

# Create instance profile for EC2 instances
ec2_instance_profile = aws.iam.InstanceProfile(
    "ec2-instance-profile",
    role=ec2_role.name
)
```

Now, let's deploy the EC2 instances:

```python
# Deploy EC2 instances in different availability zones
ec2_instances = []

for i, subnet in enumerate(private_subnets):
    instance_name = f"{project_name}-ec2-{i}-{environment_suffix}"

    instance = aws.ec2.Instance(
        f"ec2-instance-{i}",
        ami=ami_id,
        instance_type=instance_type,
        subnet_id=subnet.id,
        vpc_security_group_ids=[ec2_security_group.id],
        iam_instance_profile=ec2_instance_profile.name,
        user_data=f"""#!/bin/bash
        echo "Hello from {instance_name}" > /home/ec2-user/instance-info.txt
        """,
        tags=create_tags({"Name": instance_name})
    )

    ec2_instances.append(instance)
```

Let's set up CloudWatch alarms for the EC2 instances and the NAT Gateway:

```python
# Create CloudWatch alarms for EC2 instances
for i, instance in enumerate(ec2_instances):
    cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"ec2-cpu-alarm-{i}",
        alarm_name=f"{project_name}-ec2-{i}-cpu-alarm-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period=300,
        statistic="Average",
        threshold=80,
        alarm_description=f"Alarm when CPU exceeds 80% for EC2 instance {i}",
        dimensions={
            "InstanceId": instance.id
        },
        tags=create_tags({"Name": f"{project_name}-ec2-{i}-cpu-alarm-{environment_suffix}"})
    )

    status_check_alarm = aws.cloudwatch.MetricAlarm(
        f"ec2-status-alarm-{i}",
        alarm_name=f"{project_name}-ec2-{i}-status-alarm-{environment_suffix}",
        comparison_operator="GreaterThanOrEqualToThreshold",
        evaluation_periods=2,
        metric_name="StatusCheckFailed",
        namespace="AWS/EC2",
        period=300,
        statistic="Maximum",
        threshold=1,
        alarm_description=f"Alarm when status check fails for EC2 instance {i}",
        dimensions={
            "InstanceId": instance.id
        },
        tags=create_tags({"Name": f"{project_name}-ec2-{i}-status-alarm-{environment_suffix}"})
    )

# Create CloudWatch alarm for NAT Gateway
nat_gateway_packet_drops_alarm = aws.cloudwatch.MetricAlarm(
    "nat-gateway-packet-drops-alarm",
    alarm_name=f"{project_name}-nat-gateway-packet-drops-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="PacketsDropCount",
    namespace="AWS/NATGateway",
    period=300,
    statistic="Sum",
    threshold=10,
    alarm_description="Alarm when NAT Gateway drops more than 10 packets over 5 minutes",
    dimensions={
        "NatGatewayId": nat_gateway.id
    },
    tags=create_tags({"Name": f"{project_name}-nat-gateway-packet-drops-alarm-{environment_suffix}"})
)
```

Finally, let's export some useful outputs from our Pulumi program:

```python
# Export outputs
pulumi.export('vpc_id', vpc.id)
pulumi.export('public_subnet_ids', [subnet.id for subnet in public_subnets])
pulumi.export('private_subnet_ids', [subnet.id for subnet in private_subnets])
pulumi.export('nat_gateway_id', nat_gateway.id)
pulumi.export('ec2_instance_ids', [instance.id for instance in ec2_instances])
pulumi.export('ec2_security_group_id', ec2_security_group.id)
```

Now, let's put it all together in a more modular structure. I'll create separate modules for different components of our infrastructure:

1. `vpc_module.py`: For VPC and networking components
2. `security_module.py`: For security groups and IAM roles
3. `compute_module.py`: For EC2 instances
4. `monitoring_module.py`: For CloudWatch alarms and monitoring

Let me update the code to make it more modular:

First, let's create a `config.py` file to hold our configuration:

```python
import pulumi
from datetime import datetime

# Configuration
config = pulumi.Config()

project_name = "infra001"
environment_suffix = config.get("environment") or "dev"
region = "us-east-1"
cidr_block = "10.0.0.0/16"
ssh_allowed_cidr = config.get_object("ssh_allowed_cidr") or ["10.20.30.40/32"]
availability_zones = ["us-east-1a", "us-east-1b"]
instance_type = config.get("instance_type") or "t2.micro"
ami_id = config.get("ami_id") or "ami-0c55b159cbfafe1f0"  # Amazon Linux 2 AMI

# Define common tags for all resources
def create_tags(additional_tags=None):
    tags = {
        "ProjectName": project_name,
        "Environment": environment_suffix,
        "ManagedBy": "Pulumi",
        "CreationDate": datetime.now().strftime("%Y-%m-%d")
    }
    if additional_tags:
        tags.update(additional_tags)
    return tags
```

Now, let's create `vpc_module.py`:

```python
import pulumi
import pulumi_aws as aws
import json
from config import create_tags, project_name, environment_suffix, cidr_block, availability_zones

def create_vpc_infrastructure():
    # Create VPC
    vpc = aws.ec2.Vpc(
        "vpc",
        cidr_block=cidr_block,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags=create_tags({"Name": f"{project_name}-vpc-{environment_suffix}"})
    )

    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        "igw",
        vpc_id=vpc.id,
        tags=create_tags({"Name": f"{project_name}-igw-{environment_suffix}"})
    )

    # Create Public and Private Subnets
    public_subnets = []
    private_subnets = []

    for i, az in enumerate(availability_zones):
        # Public subnet in this AZ
        public_subnet = aws.ec2.Subnet(
            f"public-subnet-{i}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags=create_tags({"Name": f"{project_name}-public-subnet-{i}-{environment_suffix}", "Type": "Public"})
        )
        public_subnets.append(public_subnet)

        # Private subnet in this AZ
        private_subnet = aws.ec2.Subnet(
            f"private-subnet-{i}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i + 100}.0/24",
            availability_zone=az,
            tags=create_tags({"Name": f"{project_name}-private-subnet-{i}-{environment_suffix}", "Type": "Private"})
        )
        private_subnets.append(private_subnet)

    # Create route tables
    public_route_table = aws.ec2.RouteTable(
        "public-route-table",
        vpc_id=vpc.id,
        tags=create_tags({"Name": f"{project_name}-public-rt-{environment_suffix}"})
    )

    # Create route to Internet Gateway in public route table
    public_internet_route = aws.ec2.Route(
        "public-internet-route",
        route_table_id=public_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    # Associate public subnets with the public route table
    public_route_table_associations = []
    for i, subnet in enumerate(public_subnets):
        association = aws.ec2.RouteTableAssociation(
            f"public-subnet-{i}-association",
            subnet_id=subnet.id,
            route_table_id=public_route_table.id
        )
        public_route_table_associations.append(association)

    # Create NAT Gateway for outbound internet access from private subnets
    eip = aws.ec2.Eip(
        "nat-gateway-eip",
        vpc=True,
        tags=create_tags({"Name": f"{project_name}-nat-eip-{environment_suffix}"})
    )

    nat_gateway = aws.ec2.NatGateway(
        "nat-gateway",
        allocation_id=eip.id,
        subnet_id=public_subnets[0].id,
        tags=create_tags({"Name": f"{project_name}-nat-gateway-{environment_suffix}"})
    )

    # Create private route table with route to NAT Gateway
    private_route_table = aws.ec2.RouteTable(
        "private-route-table",
        vpc_id=vpc.id,
        tags=create_tags({"Name": f"{project_name}-private-rt-{environment_suffix}"})
    )

    # Create route to NAT Gateway in private route table
    private_nat_route = aws.ec2.Route(
        "private-nat-route",
        route_table_id=private_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id
    )

    # Associate private subnets with the private route table
    private_route_table_associations = []
    for i, subnet in enumerate(private_subnets):
        association = aws.ec2.RouteTableAssociation(
            f"private-subnet-{i}-association",
            subnet_id=subnet.id,
            route_table_id=private_route_table.id
        )
        private_route_table_associations.append(association)

    # Create CloudWatch Log Group for VPC Flow Logs
    flow_logs_group = aws.cloudwatch.LogGroup(
        "vpc-flow-logs-group",
        name=f"/aws/vpc/flow-logs/{project_name}-{environment_suffix}",
        retention_in_days=30,
        tags=create_tags({"Name": f"{project_name}-flow-logs-group-{environment_suffix}"})
    )

    # Create IAM role for VPC Flow Logs
    flow_logs_role_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    flow_logs_role = aws.iam.Role(
        "vpc-flow-logs-role",
        assume_role_policy=json.dumps(flow_logs_role_policy),
        tags=create_tags({"Name": f"{project_name}-flow-logs-role-{environment_suffix}"})
    )

    # Create IAM policy for VPC Flow Logs
    flow_logs_policy_document = aws.iam.get_policy_document(statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            resources=["*"],  # In a production environment, this should be more restricted
            effect="Allow"
        )
    ])

    flow_logs_policy = aws.iam.Policy(
        "vpc-flow-logs-policy",
        policy=flow_logs_policy_document.json,
        tags=create_tags({"Name": f"{project_name}-flow-logs-policy-{environment_suffix}"})
    )

    # Attach policy to role
    flow_logs_role_policy_attachment = aws.iam.RolePolicyAttachment(
        "vpc-flow-logs-policy-attachment",
        role=flow_logs_role.name,
        policy_arn=flow_logs_policy.arn
    )

    # Enable VPC Flow Logs
    vpc_flow_log = aws.ec2.FlowLog(
        "vpc-flow-log",
        iam_role_arn=flow_logs_role.arn,
        log_destination=flow_logs_group.arn,
        traffic_type="ALL",
        vpc_id=vpc.id,
        log_destination_type="cloud-watch-logs",
        tags=create_tags({"Name": f"{project_name}-vpc-flow-log-{environment_suffix}"})
    )

    return {
        "vpc": vpc,
        "igw": igw,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "nat_gateway": nat_gateway,
        "flow_logs_group": flow_logs_group
    }
```

Next, let's create `security_module.py`:

```python
import pulumi
import pulumi_aws as aws
import json
from config import create_tags, project_name, environment_suffix, ssh_allowed_cidr

def create_security_infrastructure(vpc_id):
    # Create Security Group for EC2 instances
    ec2_security_group = aws.ec2.SecurityGroup(
        "ec2-security-group",
        vpc_id=vpc_id,
        description=f"Security group for {project_name} EC2 instances",
        ingress=[
            # Allow SSH from specified IP range
            {
                "protocol": "tcp",
                "from_port": 22,
                "to_port": 22,
                "cidr_blocks": ssh_allowed_cidr,
                "description": "SSH access"
            }
        ],
        egress=[
            # Allow all outbound traffic
            {
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "Allow all outbound traffic"
            }
        ],
        tags=create_tags({"Name": f"{project_name}-ec2-sg-{environment_suffix}"})
    )

    # Create IAM role for EC2 instances
    ec2_role_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    ec2_role = aws.iam.Role(
        "ec2-role",
        assume_role_policy=json.dumps(ec2_role_policy),
        tags=create_tags({"Name": f"{project_name}-ec2-role-{environment_suffix}"})
    )

    # Create IAM policy for EC2 instances to access S3
    s3_access_policy_document = aws.iam.get_policy_document(statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=[
                "s3:GetObject",
                "s3:ListBucket",
                "s3:PutObject"
            ],
            resources=[
                "arn:aws:s3:::your-bucket-name",  # Replace with actual bucket name
                "arn:aws:s3:::your-bucket-name/*"  # Replace with actual bucket name
            ],
            effect="Allow"
        )
    ])

    s3_access_policy = aws.iam.Policy(
        "ec2-s3-access-policy",
        policy=s3_access_policy_document.json,
        tags=create_tags({"Name": f"{project_name}-ec2-s3-access-policy-{environment_suffix}"})
    )

    # Attach S3 access policy to EC2 role
    ec2_s3_policy_attachment = aws.iam.RolePolicyAttachment(
        "ec2-s3-policy-attachment",
        role=ec2_role.name,
        policy_arn=s3_access_policy.arn
    )

    # Create IAM policy for EC2 instances to access CloudWatch
    cloudwatch_access_policy_document = aws.iam.get_policy_document(statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            resources=["*"],  # In a production environment, this should be more restricted
            effect="Allow"
        )
    ])

    cloudwatch_access_policy = aws.iam.Policy(
        "ec2-cloudwatch-access-policy",
        policy=cloudwatch_access_policy_document.json,
        tags=create_tags({"Name": f"{project_name}-ec2-cloudwatch-access-policy-{environment_suffix}"})
    )

    # Attach CloudWatch access policy to EC2 role
    ec2_cloudwatch_policy_attachment = aws.iam.RolePolicyAttachment(
        "ec2-cloudwatch-policy-attachment",
        role=ec2_role.name,
        policy_arn=cloudwatch_access_policy.arn
    )

    # Attach SSM policy to EC2 role for secure management
    ec2_ssm_policy_attachment = aws.iam.RolePolicyAttachment(
        "ec2-ssm-policy-attachment",
        role=ec2_role.name,
        policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    )

    # Create instance profile for EC2 instances
    ec2_instance_profile = aws.iam.InstanceProfile(
        "ec2-instance-profile",
        role=ec2_role.name
    )

    return {
        "ec2_security_group": ec2_security_group,
        "ec2_role": ec2_role,
        "ec2_instance_profile": ec2_instance_profile
    }
```

Now, let's create `compute_module.py`:

```python
import pulumi
import pulumi_aws as aws
from config import create_tags, project_name, environment_suffix, instance_type, ami_id

def create_compute_infrastructure(private_subnets, security_group_id, instance_profile_name):
    # Deploy EC2 instances in different availability zones
    ec2_instances = []

    for i, subnet in enumerate(private_subnets):
        instance_name = f"{project_name}-ec2-{i}-{environment_suffix}"

        instance = aws.ec2.Instance(
            f"ec2-instance-{i}",
            ami=ami_id,
            instance_type=instance_type,
            subnet_id=subnet.id,
            vpc_security_group_ids=[security_group_id],
            iam_instance_profile=instance_profile_name,
            user_data=f"""#!/bin/bash
            echo "Hello from {instance_name}" > /home/ec2-user/instance-info.txt
            """,
            tags=create_tags({"Name": instance_name})
        )

        ec2_instances.append(instance)

    return {
        "ec2_instances": ec2_instances
    }
```

Finally, let's create `monitoring_module.py`:

```python
import pulumi
import pulumi_aws as aws
from config import create_tags, project_name, environment_suffix

def create_monitoring_infrastructure(ec2_instances, nat_gateway_id):
    # Create CloudWatch alarms for EC2 instances
    ec2_alarms = []
    for i, instance in enumerate(ec2_instances):
        cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"ec2-cpu-alarm-{i}",
            alarm_name=f"{project_name}-ec2-{i}-cpu-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description=f"Alarm when CPU exceeds 80% for EC2 instance {i}",
            dimensions={
                "InstanceId": instance.id
            },
            tags=create_tags({"Name": f"{project_name}-ec2-{i}-cpu-alarm-{environment_suffix}"})
        )

        status_check_alarm = aws.cloudwatch.MetricAlarm(
            f"ec2-status-alarm-{i}",
            alarm_name=f"{project_name}-ec2-{i}-status-alarm-{environment_suffix}",
            comparison_operator="GreaterThanOrEqualToThreshold",
            evaluation_periods=2,
            metric_name="StatusCheckFailed",
            namespace="AWS/EC2",
            period=300,
            statistic="Maximum",
            threshold=1,
            alarm_description=f"Alarm when status check fails for EC2 instance {i}",
            dimensions={
                "InstanceId": instance.id
            },
            tags=create_tags({"Name": f"{project_name}-ec2-{i}-status-alarm-{environment_suffix}"})
        )
        ec2_alarms.append({"cpu_alarm": cpu_alarm, "status_alarm": status_check_alarm})

    # Create CloudWatch alarm for NAT Gateway
    nat_gateway_packet_drops_alarm = aws.cloudwatch.MetricAlarm(
        "nat-gateway-packet-drops-alarm",
        alarm_name=f"{project_name}-nat-gateway-packet-drops-alarm-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="PacketsDropCount",
        namespace="AWS/NATGateway",
        period=300,
        statistic="Sum",
        threshold=10,
        alarm_description="Alarm when NAT Gateway drops more than 10 packets over 5 minutes",
        dimensions={
            "NatGatewayId": nat_gateway_id
        },
        tags=create_tags({"Name": f"{project_name}-nat-gateway-packet-drops-alarm-{environment_suffix}"})
    )

    return {
        "ec2_alarms": ec2_alarms,
        "nat_gateway_alarm": nat_gateway_packet_drops_alarm
    }
```

Finally, let's create the main Pulumi program `__main__.py`:

```python
import pulumi
import pulumi_aws as aws
from vpc_module import create_vpc_infrastructure
from security_module import create_security_infrastructure
from compute_module import create_compute_infrastructure
from monitoring_module import create_monitoring_infrastructure

# Set up provider
aws_provider = aws.Provider("aws", region="us-east-1")

# Create VPC infrastructure
vpc_resources = create_vpc_infrastructure()

# Create security infrastructure
security_resources = create_security_infrastructure(vpc_resources["vpc"].id)

# Create compute infrastructure
compute_resources = create_compute_infrastructure(
    vpc_resources["private_subnets"],
    security_resources["ec2_security_group"].id,
    security_resources["ec2_instance_profile"].name
)

# Create monitoring infrastructure
monitoring_resources = create_monitoring_infrastructure(
    compute_resources["ec2_instances"],
    vpc_resources["nat_gateway"].id
)

# Export outputs
pulumi.export('vpc_id', vpc_resources["vpc"].id)
pulumi.export('public_subnet_ids', [subnet.id for subnet in vpc_resources["public_subnets"]])
pulumi.export('private_subnet_ids', [subnet.id for subnet in vpc_resources["private_subnets"]])
pulumi.export('nat_gateway_id', vpc_resources["nat_gateway"].id)
pulumi.export('ec2_instance_ids', [instance.id for instance in compute_resources["ec2_instances"]])
pulumi.export('ec2_security_group_id', security_resources["ec2_security_group"].id)
```

This is a comprehensive and modular Pulumi Python program that provisions a robust AWS infrastructure according to the requirements. The code is organized into logical modules, making it easier to understand and maintain. The infrastructure includes VPC, subnets, NAT Gateway, Internet Gateway, security groups, IAM roles, EC2 instances, CloudWatch alarms, and VPC Flow Logs.

The setup ensures high availability by distributing EC2 instances across different availability zones and implementing proper security measures such as restricted security groups and IAM roles with least privilege permissions. It also includes monitoring through CloudWatch alarms and VPC Flow Logs.

The program is idempotent, meaning that running it multiple times will not recreate unchanged resources, which is a core feature of Pulumi's infrastructure as code approach.

Let me know if you need any further clarification or adjustments to the code!

### Answer

---

# Building a Robust AWS Infrastructure with Pulumi

I'll create a modular Pulumi Python program to provision the AWS infrastructure according to your requirements. This solution focuses on reliability, security, and idempotent provisioning across multiple availability zones.

## Project Structure

```
infrastructure/
├── __main__.py          # Main Pulumi program
├── config.py            # Configuration settings
├── modules/
│   ├── vpc.py           # VPC, subnets, gateways, flow logs
│   ├── security.py      # Security groups and IAM roles
│   ├── compute.py       # EC2 instances
│   └── monitoring.py    # CloudWatch alarms
```

## Implementation

### 1. Configuration (`config.py`)

```python
import pulumi
from datetime import datetime

# Configuration
config = pulumi.Config()

project_name = "infra001"
environment_suffix = config.get("environment") or "dev"
region = "us-east-1"
cidr_block = "10.0.0.0/16"
ssh_allowed_cidr = config.get_object("ssh_allowed_cidr") or ["10.20.30.40/32"]
availability_zones = ["us-east-1a", "us-east-1b"]
instance_type = config.get("instance_type") or "t2.micro"
ami_id = config.get("ami_id") or "ami-0c55b159cbfafe1f0"  # Amazon Linux 2 AMI

def create_tags(additional_tags=None):
    """Create standardized resource tags"""
    tags = {
        "ProjectName": project_name,
        "Environment": environment_suffix,
        "ManagedBy": "Pulumi",
        "CreationDate": datetime.now().strftime("%Y-%m-%d")
    }
    if additional_tags:
        tags.update(additional_tags)
    return tags
```

### 2. VPC Module (`modules/vpc.py`)

```python
import pulumi
import pulumi_aws as aws
import json
from config import create_tags, project_name, environment_suffix, cidr_block, availability_zones

def create_vpc_infrastructure():
    """Create VPC and related networking infrastructure"""
    # Create VPC
    vpc = aws.ec2.Vpc(
        "vpc",
        cidr_block=cidr_block,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags=create_tags({"Name": f"{project_name}-vpc-{environment_suffix}"})
    )

    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        "igw",
        vpc_id=vpc.id,
        tags=create_tags({"Name": f"{project_name}-igw-{environment_suffix}"})
    )

    # Create Public and Private Subnets
    public_subnets = []
    private_subnets = []

    for i, az in enumerate(availability_zones):
        # Public subnet in this AZ
        public_subnet = aws.ec2.Subnet(
            f"public-subnet-{i}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags=create_tags({
                "Name": f"{project_name}-public-subnet-{i}-{environment_suffix}",
                "Type": "Public"
            })
        )
        public_subnets.append(public_subnet)

        # Private subnet in this AZ
        private_subnet = aws.ec2.Subnet(
            f"private-subnet-{i}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i + 100}.0/24",
            availability_zone=az,
            tags=create_tags({
                "Name": f"{project_name}-private-subnet-{i}-{environment_suffix}",
                "Type": "Private"
            })
        )
        private_subnets.append(private_subnet)

    # Create route tables
    public_route_table = aws.ec2.RouteTable(
        "public-route-table",
        vpc_id=vpc.id,
        tags=create_tags({"Name": f"{project_name}-public-rt-{environment_suffix}"})
    )

    # Create route to Internet Gateway in public route table
    public_internet_route = aws.ec2.Route(
        "public-internet-route",
        route_table_id=public_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    # Associate public subnets with the public route table
    public_route_table_associations = []
    for i, subnet in enumerate(public_subnets):
        association = aws.ec2.RouteTableAssociation(
            f"public-subnet-{i}-association",
            subnet_id=subnet.id,
            route_table_id=public_route_table.id
        )
        public_route_table_associations.append(association)

    # Create NAT Gateway for outbound internet access from private subnets
    eip = aws.ec2.Eip(
        "nat-gateway-eip",
        vpc=True,
        tags=create_tags({"Name": f"{project_name}-nat-eip-{environment_suffix}"})
    )

    nat_gateway = aws.ec2.NatGateway(
        "nat-gateway",
        allocation_id=eip.id,
        subnet_id=public_subnets[0].id,
        tags=create_tags({"Name": f"{project_name}-nat-gateway-{environment_suffix}"})
    )

    # Create private route table with route to NAT Gateway
    private_route_table = aws.ec2.RouteTable(
        "private-route-table",
        vpc_id=vpc.id,
        tags=create_tags({"Name": f"{project_name}-private-rt-{environment_suffix}"})
    )

    # Create route to NAT Gateway in private route table
    private_nat_route = aws.ec2.Route(
        "private-nat-route",
        route_table_id=private_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id
    )

    # Associate private subnets with the private route table
    private_route_table_associations = []
    for i, subnet in enumerate(private_subnets):
        association = aws.ec2.RouteTableAssociation(
            f"private-subnet-{i}-association",
            subnet_id=subnet.id,
            route_table_id=private_route_table.id
        )
        private_route_table_associations.append(association)

    # Set up VPC Flow Logs
    flow_logs = setup_vpc_flow_logs(vpc.id)

    return {
        "vpc": vpc,
        "igw": igw,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "nat_gateway": nat_gateway,
        "flow_logs_group": flow_logs["flow_logs_group"]
    }

def setup_vpc_flow_logs(vpc_id):
    """Set up VPC Flow Logs with appropriate IAM roles and policies"""
    # Create CloudWatch Log Group for VPC Flow Logs
    flow_logs_group = aws.cloudwatch.LogGroup(
        "vpc-flow-logs-group",
        name=f"/aws/vpc/flow-logs/{project_name}-{environment_suffix}",
        retention_in_days=30,
        tags=create_tags({"Name": f"{project_name}-flow-logs-group-{environment_suffix}"})
    )

    # Create IAM role for VPC Flow Logs
    flow_logs_role_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    flow_logs_role = aws.iam.Role(
        "vpc-flow-logs-role",
        assume_role_policy=json.dumps(flow_logs_role_policy),
        tags=create_tags({"Name": f"{project_name}-flow-logs-role-{environment_suffix}"})
    )

    # Create IAM policy for VPC Flow Logs
    flow_logs_policy_document = aws.iam.get_policy_document(statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            resources=[flow_logs_group.arn],
            effect="Allow"
        )
    ])

    flow_logs_policy = aws.iam.Policy(
        "vpc-flow-logs-policy",
        policy=flow_logs_policy_document.json,
        tags=create_tags({"Name": f"{project_name}-flow-logs-policy-{environment_suffix}"})
    )

    # Attach policy to role
    flow_logs_role_policy_attachment = aws.iam.RolePolicyAttachment(
        "vpc-flow-logs-policy-attachment",
        role=flow_logs_role.name,
        policy_arn=flow_logs_policy.arn
    )

    # Enable VPC Flow Logs
    vpc_flow_log = aws.ec2.FlowLog(
        "vpc-flow-log",
        iam_role_arn=flow_logs_role.arn,
        log_destination=flow_logs_group.arn,
        traffic_type="ALL",
        vpc_id=vpc_id,
        log_destination_type="cloud-watch-logs",
        max_aggregation_interval=60,
        tags=create_tags({"Name": f"{project_name}-vpc-flow-log-{environment_suffix}"})
    )

    return {
        "flow_logs_group": flow_logs_group,
        "flow_logs_role": flow_logs_role
    }
```

### 3. Security Module (`modules/security.py`)

```python
import pulumi
import pulumi_aws as aws
import json
from config import create_tags, project_name, environment_suffix, ssh_allowed_cidr

def create_security_infrastructure(vpc_id):
    """Create security groups and IAM roles"""
    # Create Security Group for EC2 instances
    ec2_security_group = aws.ec2.SecurityGroup(
        "ec2-security-group",
        vpc_id=vpc_id,
        description=f"Security group for {project_name} EC2 instances",
        ingress=[
            # Allow SSH from specified IP range only
            {
                "protocol": "tcp",
                "from_port": 22,
                "to_port": 22,
                "cidr_blocks": ssh_allowed_cidr,
                "description": "SSH access"
            }
        ],
        egress=[
            # Allow all outbound traffic
            {
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "Allow all outbound traffic"
            }
        ],
        tags=create_tags({"Name": f"{project_name}-ec2-sg-{environment_suffix}"})
    )

    # Create IAM role for EC2 instances
    ec2_role_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    ec2_role = aws.iam.Role(
        "ec2-role",
        assume_role_policy=json.dumps(ec2_role_policy),
        tags=create_tags({"Name": f"{project_name}-ec2-role-{environment_suffix}"})
    )

    # Create S3 access policy with restrictive bucket policies
    s3_bucket_name = f"{project_name}-{environment_suffix}-data"
    s3_access_policy_document = aws.iam.get_policy_document(statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=[
                "s3:GetObject",
                "s3:ListBucket",
                "s3:PutObject"
            ],
            resources=[
                f"arn:aws:s3:::{s3_bucket_name}",
                f"arn:aws:s3:::{s3_bucket_name}/*"
            ],
            effect="Allow"
        )
    ])

    s3_access_policy = aws.iam.Policy(
        "ec2-s3-access-policy",
        policy=s3_access_policy_document.json,
        tags=create_tags({"Name": f"{project_name}-ec2-s3-access-policy-{environment_suffix}"})
    )

    # Attach S3 access policy to EC2 role
    ec2_s3_policy_attachment = aws.iam.RolePolicyAttachment(
        "ec2-s3-policy-attachment",
        role=ec2_role.name,
        policy_arn=s3_access_policy.arn
    )

    # Create CloudWatch access policy
    cloudwatch_access_policy_document = aws.iam.get_policy_document(statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            resources=[f"arn:aws:logs:*:*:log-group:/aws/ec2/{project_name}-*"],
            effect="Allow"
        )
    ])

    cloudwatch_access_policy = aws.iam.Policy(
        "ec2-cloudwatch-access-policy",
        policy=cloudwatch_access_policy_document.json,
        tags=create_tags({"Name": f"{project_name}-ec2-cloudwatch-access-policy-{environment_suffix}"})
    )

    # Attach CloudWatch access policy to EC2 role
    ec2_cloudwatch_policy_attachment = aws.iam.RolePolicyAttachment(
        "ec2-cloudwatch-policy-attachment",
        role=ec2_role.name,
        policy_arn=cloudwatch_access_policy.arn
    )

    # Attach SSM policy to EC2 role for secure management
    ec2_ssm_policy_attachment = aws.iam.RolePolicyAttachment(
        "ec2-ssm-policy-attachment",
        role=ec2_role.name,
        policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    )

    # Create instance profile for EC2 instances
    ec2_instance_profile = aws.iam.InstanceProfile(
        "ec2-instance-profile",
        role=ec2_role.name
    )

    return {
        "ec2_security_group": ec2_security_group,
        "ec2_role": ec2_role,
        "ec2_instance_profile": ec2_instance_profile
    }
```

### 4. Compute Module (`modules/compute.py`)

```python
import pulumi
import pulumi_aws as aws
from config import create_tags, project_name, environment_suffix, instance_type, ami_id

def create_compute_infrastructure(private_subnets, security_group_id, instance_profile_name):
    """Deploy EC2 instances in different availability zones"""
    ec2_instances = []

    for i, subnet in enumerate(private_subnets):
        instance_name = f"{project_name}-ec2-{i}-{environment_suffix}"

        # User data script to initialize the instance
        user_data = f"""#!/bin/bash
echo "Initializing {instance_name}" > /tmp/init.log
# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{{
  "metrics": {{
    "metrics_collected": {{
      "cpu": {{
        "measurement": ["usage_active"],
        "metrics_collection_interval": 60
      }},
      "mem": {{
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60
      }},
      "disk": {{
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      }}
    }}
  }},
  "logs": {{
    "logs_collected": {{
      "files": {{
        "collect_list": [
          {{
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/{instance_name}/messages",
            "log_stream_name": "{{instance_id}}"
          }},
          {{
            "file_path": "/tmp/init.log",
            "log_group_name": "/aws/ec2/{instance_name}/init",
            "log_stream_name": "{{instance_id}}"
          }}
        ]
      }}
    }}
  }}
}}
EOF
# Start CloudWatch agent
systemctl start amazon-cloudwatch-agent
"""

        instance = aws.ec2.Instance(
            f"ec2-instance-{i}",
            ami=ami_id,
            instance_type=instance_type,
            subnet_id=subnet.id,
            vpc_security_group_ids=[security_group_id],
            iam_instance_profile=instance_profile_name,
            user_data=user_data,
            tags=create_tags({
                "Name": instance_name,
                "AZ": subnet.availability_zone
            })
        )

        ec2_instances.append(instance)

    return {
        "ec2_instances": ec2_instances
    }
```

### 5. Monitoring Module (`modules/monitoring.py`)

```python
import pulumi
import pulumi_aws as aws
from config import create_tags, project_name, environment_suffix

def create_monitoring_infrastructure(ec2_instances, nat_gateway_id):
    """Set up CloudWatch alarms for EC2 instances and NAT Gateway"""
    # Create CloudWatch alarms for EC2 instances
    ec2_alarms = []
    for i, instance in enumerate(ec2_instances):
        # CPU utilization alarm
        cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"ec2-cpu-alarm-{i}",
            alarm_name=f"{project_name}-ec2-{i}-cpu-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description=f"Alarm when CPU exceeds 80% for EC2 instance {i}",
            dimensions={
                "InstanceId": instance.id
            },
            tags=create_tags({"Name": f"{project_name}-ec2-{i}-cpu-alarm-{environment_suffix}"})
        )

        # System status check alarm
        status_check_alarm = aws.cloudwatch.MetricAlarm(
            f"ec2-status-alarm-{i}",
            alarm_name=f"{project_name}-ec2-{i}-status-alarm-{environment_suffix}",
            comparison_operator="GreaterThanOrEqualToThreshold",
            evaluation_periods=2,
            metric_name="StatusCheckFailed",
            namespace="AWS/EC2",
            period=300,
            statistic="Maximum",
            threshold=1,
            alarm_description=f"Alarm when status check fails for EC2 instance {i}",
            dimensions={
                "InstanceId": instance.id
            },
            tags=create_tags({"Name": f"{project_name}-ec2-{i}-status-alarm-{environment_suffix}"})
        )

        # Memory utilization alarm (requires CloudWatch agent)
        memory_alarm = aws.cloudwatch.MetricAlarm(
            f"ec2-memory-alarm-{i}",
            alarm_name=f"{project_name}-ec2-{i}-memory-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="mem_used_percent",
            namespace="CWAgent",
            period=300,
            statistic="Average",
            threshold=85,
            alarm_description=f"Alarm when memory usage exceeds 85% for EC2 instance {i}",
            dimensions={
                "InstanceId": instance.id
            },
            tags=create_tags({"Name": f"{project_name}-ec2-{i}-memory-alarm-{environment_suffix}"})
        )

        ec2_alarms.append({
            "cpu_alarm": cpu_alarm,
            "status_alarm": status_check_alarm,
            "memory_alarm": memory_alarm
        })

    # Create CloudWatch alarms for NAT Gateway
    nat_gateway_packet_drops_alarm = aws.cloudwatch.MetricAlarm(
        "nat-gateway-packet-drops-alarm",
        alarm_name=f"{project_name}-nat-gateway-packet-drops-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="PacketsDropCount",
        namespace="AWS/NATGateway",
        period=300,
        statistic="Sum",
        threshold=10,
        alarm_description="Alarm when NAT Gateway drops more than 10 packets over 5 minutes",
        dimensions={
            "NatGatewayId": nat_gateway_id
        },
        tags=create_tags({"Name": f"{project_name}-nat-gateway-drops-{environment_suffix}"})
    )

    nat_gateway_error_port_alarm = aws.cloudwatch.MetricAlarm(
        "nat-gateway-error-port-alarm",
        alarm_name=f"{project_name}-nat-gateway-error-port-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="ErrorPortAllocation",
        namespace="AWS/NATGateway",
        period=300,
        statistic="Sum",
        threshold=5,
        alarm_description="Alarm when NAT Gateway has port allocation errors",
        dimensions={
            "NatGatewayId": nat_gateway_id
        },
        tags=create_tags({"Name": f"{project_name}-nat-gateway-error-port-{environment_suffix}"})
    )

    return {
        "ec2_alarms": ec2_alarms,
        "nat_gateway_alarms": {
            "packet_drops": nat_gateway_packet_drops_alarm,
            "error_port": nat_gateway_error_port_alarm
        }
    }
```

### 6. Main Program (`__main__.py`)

```python
import pulumi
import pulumi_aws as aws

# Import modules
from modules.vpc import create_vpc_infrastructure
from modules.security import create_security_infrastructure
from modules.compute import create_compute_infrastructure
from modules.monitoring import create_monitoring_infrastructure

# Set up AWS provider
aws_provider = aws.Provider("aws", region="us-east-1")

# Create VPC infrastructure
vpc_resources = create_vpc_infrastructure()

# Create security infrastructure
security_resources = create_security_infrastructure(vpc_resources["vpc"].id)

# Create compute infrastructure
compute_resources = create_compute_infrastructure(
    vpc_resources["private_subnets"],
    security_resources["ec2_security_group"].id,
    security_resources["ec2_instance_profile"].name
)

# Create monitoring infrastructure
monitoring_resources = create_monitoring_infrastructure(
    compute_resources["ec2_instances"],
    vpc_resources["nat_gateway"].id
)

# Export outputs
pulumi.export('vpc_id', vpc_resources["vpc"].id)
pulumi.export('public_subnet_ids', [subnet.id for subnet in vpc_resources["public_subnets"]])
pulumi.export('private_subnet_ids', [subnet.id for subnet in vpc_resources["private_subnets"]])
pulumi.export('nat_gateway_id', vpc_resources["nat_gateway"].id)
pulumi.export('ec2_instance_ids', [instance.id for instance in compute_resources["ec2_instances"]])
pulumi.export('ec2_security_group_id', security_resources["ec2_security_group"].id)
```

## Key Features Implemented

1. **High Availability Architecture**
   - Resources deployed across multiple availability zones
   - Redundant subnets (public and private) in each AZ
   - NAT Gateway for private subnet outbound connectivity

2. **Security Best Practices**
   - Restricted SSH access only from specified IP range
   - Principle of least privilege IAM roles
   - EC2 instances in private subnets
   - AWS Systems Manager (SSM) for secure instance management

3. **Monitoring and Observability**
   - VPC Flow Logs for network traffic analysis
   - CloudWatch alarms for EC2 and NAT Gateway metrics
   - CloudWatch agent configured for system-level monitoring

4. **Idempotency and Infrastructure as Code**
   - Fully declarative Pulumi code ensuring idempotent deployments
   - Consistent tagging for all resources
   - Modular design for maintainability

## Usage

1. Install dependencies:

   ```
   pip install pulumi pulumi_aws
   ```

2. Configure AWS credentials:

   ```
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   ```

3. Preview the deployment:

   ```
   pulumi preview
   ```

4. Deploy the infrastructure:
   ```
   pulumi up
   ```

This infrastructure follows best practices for AWS deployment, focusing on security, reliability, and operational excellence. The code is modular, well-structured, and follows Pulumi's idempotent infrastructure provisioning model.
