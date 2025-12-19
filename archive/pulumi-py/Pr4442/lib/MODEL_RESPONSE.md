First, let's start with the imports and setting up the Pulumi program:

```python
import pulumi
import pulumi_aws as aws
import json
from datetime import datetime

# Configuration
config = pulumi.Config()
app_name = config.get("appName") or "web-app"
env = config.get("environment") or "dev"
instance_type = config.get("instanceType") or "t3.micro"
min_size = config.get_int("minSize") or 2
max_size = config.get_int("maxSize") or 10
desired_capacity = config.get_int("desiredCapacity") or 2
```

Next, I'll define the basic tags that will be applied to all resources:

```python
# Common tags for all resources
common_tags = {
    "Name": app_name,
    "Environment": env,
    "ManagedBy": "Pulumi",
    "CreatedDate": datetime.utcnow().strftime("%Y-%m-%d")
}
```

Now, let's create a VPC, subnets, and other network components needed for our infrastructure:

```python
# Create a VPC
vpc = aws.ec2.Vpc(
    f"{app_name}-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags=common_tags
)

# Create 3 public subnets in different AZs
public_subnet_a = aws.ec2.Subnet(
    f"{app_name}-subnet-public-a",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone="us-west-2a",
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": f"{app_name}-subnet-public-a"}
)

public_subnet_b = aws.ec2.Subnet(
    f"{app_name}-subnet-public-b",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone="us-west-2b",
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": f"{app_name}-subnet-public-b"}
)

public_subnet_c = aws.ec2.Subnet(
    f"{app_name}-subnet-public-c",
    vpc_id=vpc.id,
    cidr_block="10.0.3.0/24",
    availability_zone="us-west-2c",
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": f"{app_name}-subnet-public-c"}
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"{app_name}-igw",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{app_name}-igw"}
)

# Route Table
route_table = aws.ec2.RouteTable(
    f"{app_name}-rt",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
        ),
    ],
    tags={**common_tags, "Name": f"{app_name}-rt"}
)

# Associate Route Table with Subnets
route_table_assoc_a = aws.ec2.RouteTableAssociation(
    f"{app_name}-rt-assoc-a",
    subnet_id=public_subnet_a.id,
    route_table_id=route_table.id
)

route_table_assoc_b = aws.ec2.RouteTableAssociation(
    f"{app_name}-rt-assoc-b",
    subnet_id=public_subnet_b.id,
    route_table_id=route_table.id
)

route_table_assoc_c = aws.ec2.RouteTableAssociation(
    f"{app_name}-rt-assoc-c",
    subnet_id=public_subnet_c.id,
    route_table_id=route_table.id
)
```

Now, let's create the IAM role and instance profile for our EC2 instances following the principle of least privilege:

```python
# IAM role for EC2 instances with the principle of least privilege
ec2_role = aws.iam.Role(
    f"{app_name}-ec2-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            }
        }]
    }),
    tags=common_tags
)

# IAM policy to allow access to the S3 logs bucket (will create this bucket later)
ec2_s3_policy = aws.iam.Policy(
    f"{app_name}-ec2-s3-policy",
    policy=pulumi.Output.all(bucket_name=f"{app_name}-logs").apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{args['bucket_name']}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{args['bucket_name']}"
                    ]
                }
            ]
        })
    )
)

# Attach policy to role
ec2_role_policy_attachment = aws.iam.RolePolicyAttachment(
    f"{app_name}-ec2-policy-attachment",
    role=ec2_role.name,
    policy_arn=ec2_s3_policy.arn
)

# Create instance profile
instance_profile = aws.iam.InstanceProfile(
    f"{app_name}-instance-profile",
    role=ec2_role.name
)
```

Next, let's create the S3 bucket for storing application logs with encryption and lifecycle rules:

```python
# Create S3 bucket for application logs with encryption and lifecycle rules
logs_bucket = aws.s3.Bucket(
    f"{app_name}-logs",
    acl="private",
    tags=common_tags,
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            )
        )
    ),
    lifecycle_rules=[
        aws.s3.BucketLifecycleRuleArgs(
            enabled=True,
            id="delete-after-30-days",
            expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                days=30
            )
        )
    ]
)
```

Now, let's create security groups for our instances and load balancer:

```python
# Security group for the load balancer
lb_sg = aws.ec2.SecurityGroup(
    f"{app_name}-lb-sg",
    vpc_id=vpc.id,
    description="Security group for the load balancer",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"]
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={**common_tags, "Name": f"{app_name}-lb-sg"}
)

# Security group for EC2 instances
instance_sg = aws.ec2.SecurityGroup(
    f"{app_name}-instance-sg",
    vpc_id=vpc.id,
    description="Security group for EC2 instances",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            security_groups=[lb_sg.id]
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=22,
            to_port=22,
            cidr_blocks=["0.0.0.0/0"]  # Restrict this to specific IPs in production
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={**common_tags, "Name": f"{app_name}-instance-sg"}
)
```

Next, let's create a launch template for our EC2 instances:

```python
# Get the latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"]
        ),
        aws.ec2.GetAmiFilterArgs(
            name="virtualization-type",
            values=["hvm"]
        )
    ]
)

# Create a launch template for EC2 instances
user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from Pulumi!</h1>" > /var/www/html/index.html
"""

launch_template = aws.ec2.LaunchTemplate(
    f"{app_name}-launch-template",
    name=f"{app_name}-launch-template",
    image_id=ami.id,
    instance_type=instance_type,
    key_name=config.get("keyName"),  # Optional SSH key
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        name=instance_profile.name
    ),
    network_interfaces=[
        aws.ec2.LaunchTemplateNetworkInterfaceArgs(
            associate_public_ip_address=True,
            security_groups=[instance_sg.id]
        )
    ],
    user_data=pulumi.Output.from_input(user_data).apply(
        lambda ud: ud.encode("utf-8").encode("base64").decode("utf-8")
    ),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={
                **common_tags,
                "Name": f"{app_name}-instance"
            }
        )
    ]
)
```

Now, let's create the Application Load Balancer, target group, and listeners:

```python
# Create Application Load Balancer
alb = aws.lb.LoadBalancer(
    f"{app_name}-alb",
    internal=False,
    load_balancer_type="application",
    security_groups=[lb_sg.id],
    subnets=[
        public_subnet_a.id,
        public_subnet_b.id,
        public_subnet_c.id
    ],
    tags=common_tags
)

# Create target group
target_group = aws.lb.TargetGroup(
    f"{app_name}-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        path="/",
        port="80",
        protocol="HTTP",
        healthy_threshold=3,
        unhealthy_threshold=3,
        timeout=5,
        interval=30
    ),
    tags=common_tags
)

# Create HTTP listener
http_listener = aws.lb.Listener(
    f"{app_name}-http-listener",
    load_balancer_arn=alb.arn,
    port=80,
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
        )
    ]
)
```

Finally, let's create the Auto Scaling group:

```python
# Create Auto Scaling group
asg = aws.autoscaling.Group(
    f"{app_name}-asg",
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest"
    ),
    min_size=min_size,
    max_size=max_size,
    desired_capacity=desired_capacity,
    vpc_zone_identifiers=[
        public_subnet_a.id,
        public_subnet_b.id,
        public_subnet_c.id
    ],
    target_group_arns=[target_group.arn],
    health_check_type="ELB",
    health_check_grace_period=300,
    tags=[
        aws.autoscaling.GroupTagArgs(
            key="Name",
            value=f"{app_name}-instance",
            propagate_at_launch=True
        ),
        *[
            aws.autoscaling.GroupTagArgs(
                key=k,
                value=v,
                propagate_at_launch=True
            ) for k, v in common_tags.items()
        ]
    ]
)
```

Now, let's add some scaling policies to our Auto Scaling group:

```python
# Create scaling policies
scale_up_policy = aws.autoscaling.Policy(
    f"{app_name}-scale-up-policy",
    autoscaling_group_name=asg.name,
    adjustment_type="ChangeInCapacity",
    scaling_adjustment=1,
    cooldown=300
)

scale_down_policy = aws.autoscaling.Policy(
    f"{app_name}-scale-down-policy",
    autoscaling_group_name=asg.name,
    adjustment_type="ChangeInCapacity",
    scaling_adjustment=-1,
    cooldown=300
)

# CloudWatch alarms for scaling
high_cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"{app_name}-high-cpu-alarm",
    comparison_operator="GreaterThanOrEqualToThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=300,
    statistic="Average",
    threshold=75,
    alarm_description="Scale up if CPU > 75%",
    alarm_actions=[scale_up_policy.arn],
    dimensions={
        "AutoScalingGroupName": asg.name
    }
)

low_cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"{app_name}-low-cpu-alarm",
    comparison_operator="LessThanOrEqualToThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=300,
    statistic="Average",
    threshold=25,
    alarm_description="Scale down if CPU < 25%",
    alarm_actions=[scale_down_policy.arn],
    dimensions={
        "AutoScalingGroupName": asg.name
    }
)
```

Finally, let's export some important outputs:

```python
# Export outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("alb_dns_name", alb.dns_name)
pulumi.export("logs_bucket_name", logs_bucket.id)
pulumi.export("logs_bucket_arn", logs_bucket.arn)
pulumi.export("auto_scaling_group_name", asg.name)
```

# Scalable Secure Web Application Environment on AWS with Pulumi

I'll create a comprehensive Pulumi Python solution for a scalable and secure web application environment on AWS, following all your requirements. Let's break this down into modular components.

## Project Structure

```
project/
├── __main__.py           # Main entrypoint for Pulumi program
├── config.py             # Configuration parameters
├── modules/
│   ├── networking.py     # VPC, subnets, route tables, etc.
│   ├── security.py       # Security groups, IAM roles
│   ├── storage.py        # S3 bucket for logs
│   ├── compute.py        # EC2 launch template, Auto Scaling Group
│   └── loadbalancing.py  # Application Load Balancer components
└── Pulumi.yaml           # Pulumi project file
```

## Main Configuration (`config.py`)

```python
import pulumi

# Configuration with defaults
config = pulumi.Config()

# General settings
APP_NAME = config.get("appName") or "web-app"
ENVIRONMENT = config.get("environment") or "dev"
AWS_REGION = "us-west-2"

# Compute settings
INSTANCE_TYPE = config.get("instanceType") or "t3.micro"
KEY_PAIR_NAME = config.get("keyName") or None  # SSH key for instances (optional)

# Auto Scaling settings
MIN_INSTANCES = config.get_int("minSize") or 2
MAX_INSTANCES = config.get_int("maxSize") or 10
DESIRED_CAPACITY = config.get_int("desiredCapacity") or 2

# Networking
VPC_CIDR = "10.0.0.0/16"
SUBNET_CIDRS = {
    "us-west-2a": "10.0.1.0/24",
    "us-west-2b": "10.0.2.0/24",
    "us-west-2c": "10.0.3.0/24"
}

# Common tags for all resources
def get_tags(name=None):
    tags = {
        "Project": APP_NAME,
        "Environment": ENVIRONMENT,
        "ManagedBy": "Pulumi"
    }
    if name:
        tags["Name"] = f"{APP_NAME}-{name}"
    return tags
```

## Networking Module (`modules/networking.py`)

```python
import pulumi
import pulumi_aws as aws
from config import VPC_CIDR, SUBNET_CIDRS, get_tags

def create_network_infrastructure():
    # Create VPC
    vpc = aws.ec2.Vpc(
        "vpc",
        cidr_block=VPC_CIDR,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags=get_tags("vpc")
    )

    # Internet Gateway
    igw = aws.ec2.InternetGateway(
        "igw",
        vpc_id=vpc.id,
        tags=get_tags("igw")
    )

    # Create a route table for public subnets
    public_rt = aws.ec2.RouteTable(
        "public-rt",
        vpc_id=vpc.id,
        routes=[
            aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )
        ],
        tags=get_tags("public-rt")
    )

    # Create public subnets in 3 AZs
    public_subnets = []
    for az, cidr in SUBNET_CIDRS.items():
        subnet = aws.ec2.Subnet(
            f"public-subnet-{az[-1]}",
            vpc_id=vpc.id,
            cidr_block=cidr,
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags=get_tags(f"public-subnet-{az[-1]}")
        )

        # Associate with the public route table
        aws.ec2.RouteTableAssociation(
            f"public-rt-assoc-{az[-1]}",
            subnet_id=subnet.id,
            route_table_id=public_rt.id
        )

        public_subnets.append(subnet)

    return {
        "vpc": vpc,
        "public_subnets": public_subnets,
    }
```

## Security Module (`modules/security.py`)

```python
import pulumi
import pulumi_aws as aws
import json
from config import get_tags, APP_NAME

def create_security_resources(vpc_id, logs_bucket_arn):
    # Security group for Application Load Balancer
    alb_sg = aws.ec2.SecurityGroup(
        "alb-sg",
        vpc_id=vpc_id,
        description="Allow HTTP/HTTPS traffic to the load balancer",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=80,
                to_port=80,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow HTTP from anywhere"
            ),
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=443,
                to_port=443,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow HTTPS from anywhere"
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )
        ],
        tags=get_tags("alb-sg")
    )

    # Security group for EC2 instances
    instance_sg = aws.ec2.SecurityGroup(
        "instance-sg",
        vpc_id=vpc_id,
        description="Allow traffic from ALB to instances",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=80,
                to_port=80,
                security_groups=[alb_sg.id],
                description="Allow HTTP from ALB"
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )
        ],
        tags=get_tags("instance-sg")
    )

    # IAM role for EC2 instances with least privilege
    instance_role = aws.iam.Role(
        "ec2-role",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {"Service": "ec2.amazonaws.com"},
                "Effect": "Allow"
            }]
        }),
        tags=get_tags("ec2-role")
    )

    # Custom policy for S3 logs access with least privilege
    logs_access_policy = aws.iam.Policy(
        "logs-access-policy",
        description="Policy allowing EC2 instances to write logs to S3",
        policy=logs_bucket_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                    ],
                    "Resource": f"{arn}/*"
                }
            ]
        })),
        tags=get_tags("logs-policy")
    )

    # Attach the policy to the role
    role_policy_attachment = aws.iam.RolePolicyAttachment(
        "logs-policy-attachment",
        role=instance_role.name,
        policy_arn=logs_access_policy.arn
    )

    # Create instance profile
    instance_profile = aws.iam.InstanceProfile(
        "instance-profile",
        role=instance_role.name,
        tags=get_tags("instance-profile")
    )

    return {
        "alb_sg": alb_sg,
        "instance_sg": instance_sg,
        "instance_profile": instance_profile
    }
```

## Storage Module (`modules/storage.py`)

```python
import pulumi
import pulumi_aws as aws
from config import get_tags, APP_NAME

def create_logs_bucket():
    # Encrypted S3 bucket for application logs with 30-day lifecycle
    logs_bucket = aws.s3.Bucket(
        "logs-bucket",
        bucket=f"{APP_NAME}-logs",  # Unique bucket name
        acl="private",

        # Server-side encryption configuration
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        ),

        # Lifecycle rules for automatic deletion after 30 days
        lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
            enabled=True,
            expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                days=30
            ),
            id="delete-logs-after-30-days"
        )],

        # Block public access
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,

        tags=get_tags("logs-bucket")
    )

    return logs_bucket
```

## Compute Module (`modules/compute.py`)

```python
import pulumi
import pulumi_aws as aws
import base64
from config import INSTANCE_TYPE, MIN_INSTANCES, MAX_INSTANCES, DESIRED_CAPACITY, get_tags, KEY_PAIR_NAME

def create_compute_resources(subnets, instance_sg_id, instance_profile_name, target_group_arn):
    # Get latest Amazon Linux 2 AMI
    amazon_linux = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[
            aws.ec2.GetAmiFilterArgs(
                name="name",
                values=["amzn2-ami-hvm-*-x86_64-gp2"]
            ),
            aws.ec2.GetAmiFilterArgs(
                name="virtualization-type",
                values=["hvm"]
            )
        ]
    )

    # User data script for instance initialization
    user_data = """#!/bin/bash
yum update -y
yum install -y httpd
echo "<h1>Web Application Server - Deployed with Pulumi</h1>" > /var/www/html/index.html
systemctl start httpd
systemctl enable httpd
"""

    # Launch template for EC2 instances
    launch_template = aws.ec2.LaunchTemplate(
        "launch-template",
        name_prefix="web-",
        image_id=amazon_linux.id,
        instance_type=INSTANCE_TYPE,
        key_name=KEY_PAIR_NAME,
        user_data=base64.b64encode(user_data.encode("utf-8")).decode("utf-8"),

        iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
            name=instance_profile_name
        ),

        network_interfaces=[aws.ec2.LaunchTemplateNetworkInterfaceArgs(
            associate_public_ip_address=True,
            security_groups=[instance_sg_id]
        )],

        monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
            enabled=True  # Enable detailed monitoring for better auto scaling
        ),

        tag_specifications=[aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags=get_tags("web-instance")
        )],

        tags=get_tags("launch-template")
    )

    # Auto Scaling Group
    asg = aws.autoscaling.Group(
        "asg",
        name=f"web-asg",
        min_size=MIN_INSTANCES,
        max_size=MAX_INSTANCES,
        desired_capacity=DESIRED_CAPACITY,

        # Use all three subnets (AZs) for high availability
        vpc_zone_identifiers=[subnet.id for subnet in subnets],

        launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
            id=launch_template.id,
            version="$Latest"
        ),

        # Use ALB health checks for better instance health monitoring
        health_check_type="ELB",
        health_check_grace_period=300,

        # Set target group for load balancer
        target_group_arns=[target_group_arn],

        # Instance refresh settings
        instance_refresh=aws.autoscaling.GroupInstanceRefreshArgs(
            strategy="Rolling",
            preferences=aws.autoscaling.GroupInstanceRefreshPreferencesArgs(
                min_healthy_percentage=90
            )
        ),

        # Propagate tags to EC2 instances
        tags=[
            aws.autoscaling.GroupTagArgs(
                key="Name",
                value="web-instance",
                propagate_at_launch=True
            ),
            aws.autoscaling.GroupTagArgs(
                key="Project",
                value=get_tags()["Project"],
                propagate_at_launch=True
            ),
            aws.autoscaling.GroupTagArgs(
                key="Environment",
                value=get_tags()["Environment"],
                propagate_at_launch=True
            ),
            aws.autoscaling.GroupTagArgs(
                key="ManagedBy",
                value="Pulumi",
                propagate_at_launch=True
            )
        ]
    )

    # Scaling policies
    scale_up = aws.autoscaling.Policy(
        "scale-up",
        scaling_adjustment=1,
        adjustment_type="ChangeInCapacity",
        cooldown=300,
        autoscaling_group_name=asg.name
    )

    scale_down = aws.autoscaling.Policy(
        "scale-down",
        scaling_adjustment=-1,
        adjustment_type="ChangeInCapacity",
        cooldown=300,
        autoscaling_group_name=asg.name
    )

    # CloudWatch alarms for scaling
    cpu_high_alarm = aws.cloudwatch.MetricAlarm(
        "cpu-high",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period=300,
        statistic="Average",
        threshold=70.0,
        alarm_description="Scale up if CPU > 70% for 10 minutes",
        alarm_actions=[scale_up.arn],
        dimensions={"AutoScalingGroupName": asg.name},
        tags=get_tags("cpu-high-alarm")
    )

    cpu_low_alarm = aws.cloudwatch.MetricAlarm(
        "cpu-low",
        comparison_operator="LessThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period=300,
        statistic="Average",
        threshold=30.0,
        alarm_description="Scale down if CPU < 30% for 10 minutes",
        alarm_actions=[scale_down.arn],
        dimensions={"AutoScalingGroupName": asg.name},
        tags=get_tags("cpu-low-alarm")
    )

    return {
        "asg": asg,
        "launch_template": launch_template
    }
```

## Load Balancing Module (`modules/loadbalancing.py`)

```python
import pulumi
import pulumi_aws as aws
from config import get_tags

def create_load_balancer(vpc_id, public_subnets, security_group_id):
    # Application Load Balancer
    alb = aws.lb.LoadBalancer(
        "alb",
        load_balancer_type="application",
        security_groups=[security_group_id],
        subnets=[subnet.id for subnet in public_subnets],
        internal=False,
        enable_deletion_protection=False,
        tags=get_tags("alb")
    )

    # Target Group for ALB
    target_group = aws.lb.TargetGroup(
        "web-target-group",
        port=80,
        protocol="HTTP",
        vpc_id=vpc_id,

        # Configure health checks
        health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            healthy_threshold=2,
            interval=30,
            path="/",
            port="traffic-port",
            protocol="HTTP",
            timeout=5,
            unhealthy_threshold=2,
            matcher="200-399"
        ),

        tags=get_tags("web-target-group")
    )

    # HTTP Listener
    http_listener = aws.lb.Listener(
        "http-listener",
        load_balancer_arn=alb.arn,
        port=80,
        default_actions=[
            aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )
        ],
        tags=get_tags("http-listener")
    )

    return {
        "alb": alb,
        "target_group": target_group,
        "http_listener": http_listener
    }
```

## Main Program (`__main__.py`)

```python
import pulumi
import pulumi_aws as aws
from modules.networking import create_network_infrastructure
from modules.storage import create_logs_bucket
from modules.security import create_security_resources
from modules.loadbalancing import create_load_balancer
from modules.compute import create_compute_resources
from config import AWS_REGION

# Set AWS region
aws_provider = aws.Provider("aws", region=AWS_REGION)

# Create resources in order of dependency
# 1. Create logs bucket first (for IAM policies)
logs_bucket = create_logs_bucket()

# 2. Create networking infrastructure
network = create_network_infrastructure()

# 3. Create security resources (IAM, Security Groups)
security = create_security_resources(
    network["vpc"].id,
    logs_bucket.arn
)

# 4. Create load balancer and target group
lb = create_load_balancer(
    network["vpc"].id,
    network["public_subnets"],
    security["alb_sg"].id
)

# 5. Finally, create compute resources
compute = create_compute_resources(
    network["public_subnets"],
    security["instance_sg"].id,
    security["instance_profile"].name,
    lb["target_group"].arn
)

# Export important stack outputs
pulumi.export("vpc_id", network["vpc"].id)
pulumi.export("alb_dns_name", lb["alb"].dns_name)
pulumi.export("logs_bucket_name", logs_bucket.id)
pulumi.export("auto_scaling_group_name", compute["asg"].name)
```

## `Pulumi.yaml`

```yaml
name: web-application-environment
runtime: python
description: A scalable, secure web application environment on AWS
```

## Deployment Instructions

1. Make sure Pulumi CLI and AWS CLI are installed and configured.
2. Create a new directory for your project and copy the code structure above.
3. Install required packages:
   ```bash
   pip install pulumi pulumi-aws
   ```
4. Set configuration values (optional):
   ```bash
   pulumi config set appName my-web-app
   pulumi config set environment production
   pulumi config set instanceType t3.small
   pulumi config set minSize 3
   pulumi config set maxSize 12
   pulumi config set desiredCapacity 3
   ```
5. Deploy the stack:
   ```bash
   pulumi up
   ```
