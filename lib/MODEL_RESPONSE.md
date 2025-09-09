# Complete Infrastructure Implementation
Here's the complete tap_stack.py file that implements the entire infrastructure:

```python
import pulumi
import pulumi_aws as aws
import json
import base64

# Configuration and constants
config = pulumi.Config()
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()
region = "us-east-1"
availability_zones = ["us-east-1a", "us-east-1b"]

# Common tags for all resources
common_tags = {
    "Environment": stack_name,
    "Team": "infrastructure",
    "Project": project_name,
    "ManagedBy": "pulumi"
}

# =============================================================================
# NETWORKING FOUNDATION
# =============================================================================

# Create VPC
vpc = aws.ec2.Vpc("main-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"{project_name}-vpc"}
)

# Create Internet Gateway
internet_gateway = aws.ec2.InternetGateway("main-igw",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{project_name}-igw"}
)

# Create public subnets (one per AZ)
public_subnets = []
private_subnets = []

for i, az in enumerate(availability_zones):
    # Public subnet
    public_subnet = aws.ec2.Subnet(f"public-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={**common_tags, "Name": f"{project_name}-public-subnet-{i+1}", "Type": "public"}
    )
    public_subnets.append(public_subnet)
    
    # Private subnet
    private_subnet = aws.ec2.Subnet(f"private-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={**common_tags, "Name": f"{project_name}-private-subnet-{i+1}", "Type": "private"}
    )
    private_subnets.append(private_subnet)

# Create Elastic IPs for NAT Gateways
nat_eips = []
nat_gateways = []

for i in range(len(availability_zones)):
    eip = aws.ec2.Eip(f"nat-eip-{i+1}",
        domain="vpc",
        tags={**common_tags, "Name": f"{project_name}-nat-eip-{i+1}"}
    )
    nat_eips.append(eip)
    
    # Create NAT Gateway
    nat_gateway = aws.ec2.NatGateway(f"nat-gateway-{i+1}",
        allocation_id=eip.id,
        subnet_id=public_subnets[i].id,
        tags={**common_tags, "Name": f"{project_name}-nat-gateway-{i+1}"}
    )
    nat_gateways.append(nat_gateway)

# Create route table for public subnets
public_route_table = aws.ec2.RouteTable("public-rt",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{project_name}-public-rt"}
)

# Route for public subnets to Internet Gateway
public_route = aws.ec2.Route("public-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=internet_gateway.id
)

# Associate public subnets with public route table
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(f"public-rta-{i+1}",
        subnet_id=subnet.id,
        route_table_id=public_route_table.id
    )

# Create route tables for private subnets (one per AZ)
for i, subnet in enumerate(private_subnets):
    private_route_table = aws.ec2.RouteTable(f"private-rt-{i+1}",
        vpc_id=vpc.id,
        tags={**common_tags, "Name": f"{project_name}-private-rt-{i+1}"}
    )
    
    # Route for private subnets to NAT Gateway
    aws.ec2.Route(f"private-route-{i+1}",
        route_table_id=private_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateways[i].id
    )
    
    # Associate private subnet with route table
    aws.ec2.RouteTableAssociation(f"private-rta-{i+1}",
        subnet_id=subnet.id,
        route_table_id=private_route_table.id
    )

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# ALB Security Group
alb_security_group = aws.ec2.SecurityGroup("alb-sg",
    name_prefix=f"{project_name}-alb-",
    vpc_id=vpc.id,
    description="Security group for Application Load Balancer",
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 80,
            "to_port": 80,
            "cidr_blocks": ["0.0.0.0/0"]
        },
        {
            "protocol": "tcp",
            "from_port": 443,
            "to_port": 443,
            "cidr_blocks": ["0.0.0.0/0"]
        }
    ],
    egress=[
        {
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"]
        }
    ],
    tags={**common_tags, "Name": f"{project_name}-alb-sg"}
)

# EC2 Security Group
ec2_security_group = aws.ec2.SecurityGroup("ec2-sg",
    name_prefix=f"{project_name}-ec2-",
    vpc_id=vpc.id,
    description="Security group for EC2 instances",
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 80,
            "to_port": 80,
            "security_groups": [alb_security_group.id]
        },
        {
            "protocol": "tcp",
            "from_port": 22,
            "to_port": 22,
            "cidr_blocks": ["10.0.0.0/16"]  # SSH from within VPC only
        }
    ],
    egress=[
        {
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"]
        }
    ],
    tags={**common_tags, "Name": f"{project_name}-ec2-sg"}
)

# RDS Security Group
rds_security_group = aws.ec2.SecurityGroup("rds-sg",
    name_prefix=f"{project_name}-rds-",
    vpc_id=vpc.id,
    description="Security group for RDS database",
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 5432,
            "to_port": 5432,
            "security_groups": [ec2_security_group.id]
        }
    ],
    tags={**common_tags, "Name": f"{project_name}-rds-sg"}
)

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# EC2 Instance Role
ec2_assume_role_policy = aws.iam.get_policy_document(statements=[
    {
        "effect": "Allow",
        "principals": [{
            "type": "Service",
            "identifiers": ["ec2.amazonaws.com"]
        }],
        "actions": ["sts:AssumeRole"]
    }
])

ec2_role = aws.iam.Role("ec2-role",
    name=f"{project_name}-ec2-role",
    assume_role_policy=ec2_assume_role_policy.json,
    tags=common_tags
)

# EC2 policy for accessing Secrets Manager and CloudWatch
ec2_policy_document = aws.iam.get_policy_document(statements=[
    {
        "effect": "Allow",
        "actions": [
            "secretsmanager:GetSecretValue",
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "cloudwatch:PutMetricData"
        ],
        "resources": ["*"]
    }
])

ec2_policy = aws.iam.Policy("ec2-policy",
    name=f"{project_name}-ec2-policy",
    policy=ec2_policy_document.json
)

aws.iam.RolePolicyAttachment("ec2-policy-attachment",
    role=ec2_role.name,
    policy_arn=ec2_policy.arn
)

# Attach CloudWatchAgentServerPolicy
aws.iam.RolePolicyAttachment("ec2-cloudwatch-attachment",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
)

# Create instance profile
ec2_instance_profile = aws.iam.InstanceProfile("ec2-instance-profile",
    name=f"{project_name}-ec2-instance-profile",
    role=ec2_role.name
)

# Lambda Role for RDS snapshots
lambda_assume_role_policy = aws.iam.get_policy_document(statements=[
    {
        "effect": "Allow",
        "principals": [{
            "type": "Service",
            "identifiers": ["lambda.amazonaws.com"]
        }],
        "actions": ["sts:AssumeRole"]
    }
])

lambda_role = aws.iam.Role("lambda-role",
    name=f"{project_name}-lambda-role",
    assume_role_policy=lambda_assume_role_policy.json,
    tags=common_tags
)

# Lambda policy for RDS snapshots
lambda_policy_document = aws.iam.get_policy_document(statements=[
    {
        "effect": "Allow",
        "actions": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
        ],
        "resources": ["arn:aws:logs:*:*:*"]
    },
    {
        "effect": "Allow",
        "actions": [
            "rds:CreateDBSnapshot",
            "rds:DeleteDBSnapshot",
            "rds:DescribeDBSnapshots",
            "rds:DescribeDBInstances"
        ],
        "resources": ["*"]
    }
])

lambda_policy = aws.iam.Policy("lambda-policy",
    name=f"{project_name}-lambda-policy",
    policy=lambda_policy_document.json
)

aws.iam.RolePolicyAttachment("lambda-policy-attachment",
    role=lambda_role.name,
    policy_arn=lambda_policy.arn
)

# =============================================================================
# SECRETS MANAGER
# =============================================================================

# Generate random password for database
db_password = aws.secretsmanager.Secret("db-password",
    name=f"{project_name}-db-password",
    description="PostgreSQL database password",
    generate_secret_string={
        "length": 32,
        "exclude_characters": "\"@/\\",
        "exclude_punctuation": True
    },
    tags=common_tags
)

# =============================================================================
# RDS DATABASE
# =============================================================================

# Create DB subnet group
db_subnet_group = aws.rds.SubnetGroup("db-subnet-group",
    name=f"{project_name}-db-subnet-group",
    subnet_ids=[subnet.id for subnet in private_subnets],
    tags={**common_tags, "Name": f"{project_name}-db-subnet-group"}
)

# Get the database password
db_password_value = db_password.secret_string.apply(
    lambda secret_string: json.loads(secret_string)["password"]
)

# Create RDS instance
rds_instance = aws.rds.Instance("postgresql-db",
    identifier=f"{project_name}-postgresql",
    engine="postgres",
    engine_version="13.13",
    instance_class="db.t3.micro",
    allocated_storage=20,
    max_allocated_storage=100,
    storage_type="gp2",
    storage_encrypted=True,
    
    db_name="appdb",
    username="dbadmin",
    password=db_password_value,
    
    vpc_security_group_ids=[rds_security_group.id],
    db_subnet_group_name=db_subnet_group.name,
    
    backup_retention_period=7,
    backup_window="03:00-04:00",
    maintenance_window="sun:04:00-sun:05:00",
    
    multi_az=True,
    publicly_accessible=False,
    
    skip_final_snapshot=True,
    deletion_protection=False,
    
    tags={**common_tags, "Name": f"{project_name}-postgresql"}
)

# =============================================================================
# S3 BUCKETS
# =============================================================================

# Application data bucket
app_data_bucket = aws.s3.Bucket("app-data-bucket",
    bucket=f"{project_name}-app-data-{pulumi.get_stack()}",
    versioning={
        "enabled": True
    },
    tags=common_tags
)

# Configure lifecycle policy for the bucket
app_data_lifecycle = aws.s3.BucketLifecycleConfiguration("app-data-lifecycle",
    bucket=app_data_bucket.id,
    rules=[
        {
            "id": "transition_to_ia",
            "status": "Enabled",
            "transitions": [
                {
                    "days": 30,
                    "storage_class": "STANDARD_IA"
                },
                {
                    "days": 90,
                    "storage_class": "GLACIER"
                }
            ]
        },
        {
            "id": "delete_old_versions",
            "status": "Enabled",
            "noncurrent_version_transitions": [
                {
                    "days": 30,
                    "storage_class": "STANDARD_IA"
                }
            ],
            "noncurrent_version_expiration": {
                "days": 365
            }
        }
    ]
)

# Logs bucket
logs_bucket = aws.s3.Bucket("logs-bucket",
    bucket=f"{project_name}-logs-{pulumi.get_stack()}",
    tags=common_tags
)

# =============================================================================
# CLOUDWATCH AND MONITORING
# =============================================================================

# SNS Topic for notifications
sns_topic = aws.sns.Topic("notifications",
    name=f"{project_name}-notifications",
    tags=common_tags
)

# CloudWatch Log Group for VPC Flow Logs
flow_logs_group = aws.cloudwatch.LogGroup("vpc-flow-logs",
    name=f"/aws/vpc/flowlogs/{project_name}",
    retention_in_days=7,
    tags=common_tags
)

# IAM role for VPC Flow Logs
flow_logs_role = aws.iam.Role("flow-logs-role",
    name=f"{project_name}-flow-logs-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    })
)

flow_logs_policy = aws.iam.RolePolicy("flow-logs-policy",
    role=flow_logs_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            "Resource": "*"
        }]
    })
)

# VPC Flow Logs
vpc_flow_logs = aws.ec2.FlowLog("vpc-flow-logs",
    iam_role_arn=flow_logs_role.arn,
    log_destination=flow_logs_group.arn,
    traffic_type="ALL",
    vpc_id=vpc.id,
    tags=common_tags
)

# =============================================================================
# APPLICATION LOAD BALANCER
# =============================================================================

# Application Load Balancer
alb = aws.lb.LoadBalancer("app-lb",
    name=f"{project_name}-alb",
    load_balancer_type="application",
    subnets=[subnet.id for subnet in public_subnets],
    security_groups=[alb_security_group.id],
    enable_deletion_protection=False,
    
    access_logs={
        "bucket": logs_bucket.bucket,
        "enabled": True,
        "prefix": "alb-logs"
    },
    
    tags={**common_tags, "Name": f"{project_name}-alb"}
)

# Target Group
target_group = aws.lb.TargetGroup("app-tg",
    name=f"{project_name}-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    
    health_check={
        "enabled": True,
        "healthy_threshold": 2,
        "unhealthy_threshold": 2,
        "timeout": 5,
        "interval": 30,
        "path": "/health",
        "matcher": "200"
    },
    
    tags={**common_tags, "Name": f"{project_name}-tg"}
)

# ALB Listener
alb_listener = aws.lb.Listener("app-listener",
    load_balancer_arn=alb.arn,
    port="80",
    protocol="HTTP",
    default_actions=[{
        "type": "forward",
        "target_group_arn": target_group.arn
    }]
)

# =============================================================================
# AUTO SCALING GROUP
# =============================================================================

# Get latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        {
            "name": "name",
            "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
        },
        {
            "name": "virtualization-type",
            "values": ["hvm"]
        }
    ]
)

# User data script for EC2 instances
user_data_script = f"""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Create a simple health check endpoint
echo "OK" > /var/www/html/health

# Create a simple index page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Application Server</title>
</head>
<body>
    <h1>Hello from {project_name}</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

# Restart httpd to apply changes
systemctl restart httpd
"""

# Launch Template
launch_template = aws.ec2.LaunchTemplate("app-launch-template",
    name_prefix=f"{project_name}-lt-",
    description="Launch template for application servers",
    
    image_id=ami.id,
    instance_type="t3.micro",
    
    vpc_security_group_ids=[ec2_security_group.id],
    
    iam_instance_profile={
        "name": ec2_instance_profile.name
    },
    
    user_data=base64.b64encode(user_data_script.encode()).decode(),
    
    tag_specifications=[
        {
            "resource_type": "instance",
            "tags": {**common_tags, "Name": f"{project_name}-instance"}
        }
    ],
    
    tags={**common_tags, "Name": f"{project_name}-launch-template"}
)

# Auto Scaling Group
auto_scaling_group = aws.autoscaling.Group("app-asg",
    name=f"{project_name}-asg",
    vpc_zone_identifiers=[subnet.id for subnet in private_subnets],
    target_group_arns=[target_group.arn],
    health_check_type="ELB",
    health_check_grace_period=300,
    
    min_size=2,
    max_size=6,
    desired_capacity=2,
    
    launch_template={
        "id": launch_template.id,
        "version": "$Latest"
    },
    
    tags=[
        {
            "key": k,
            "value": v,
            "propagate_at_launch": True
        } for k, v in {**common_tags, "Name": f"{project_name}-asg"}.items()
    ]
)

# Auto Scaling Policies
scale_up_policy = aws.autoscaling.Policy("scale-up-policy",
    name=f"{project_name}-scale-up",
    scaling_adjustment=1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=auto_scaling_group.name
)

scale_down_policy = aws.autoscaling.Policy("scale-down-policy",
    name=f"{project_name}-scale-down",
    scaling_adjustment=-1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=auto_scaling_group.name
)

# CloudWatch Alarms for Auto Scaling
cpu_high_alarm = aws.cloudwatch.MetricAlarm("cpu-high-alarm",
    name=f"{project_name}-cpu-high",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods="2",
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period="120",
    statistic="Average",
    threshold="80",
    alarm_description="This metric monitors ec2 cpu utilization",
    alarm_actions=[
        scale_up_policy.arn,
        sns_topic.arn
    ],
    dimensions={
        "AutoScalingGroupName": auto_scaling_group.name
    },
    tags=common_tags
)

cpu_low_alarm = aws.cloudwatch.MetricAlarm("cpu-low-alarm",
    name=f"{project_name}-cpu-low",
    comparison_operator="LessThanThreshold",
    evaluation_periods="2",
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period="120",
    statistic="Average",
    threshold="20",
    alarm_description="This metric monitors ec2 cpu utilization",
    alarm_actions=[scale_down_policy.arn],
    dimensions={
        "AutoScalingGroupName": auto_scaling_group.name
    },
    tags=common_tags
)

# =============================================================================
# LAMBDA FUNCTION FOR RDS SNAPSHOTS
# =============================================================================

# Lambda function code for RDS snapshots
lambda_code = """
import json
import boto3
import datetime
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    rds = boto3.client('rds')
    
    # Get RDS instance identifier from environment variable
    db_instance_id = event.get('db_instance_id')
    
    if not db_instance_id:
        return {
            'statusCode': 400,
            'body': json.dumps('DB instance ID not provided')
        }
    
    # Create snapshot
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    snapshot_id = f"{db_instance_id}-snapshot-{timestamp}"
    
    try:
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_id
        )
        
        print(f"Created snapshot: {snapshot_id}")
        
        # Delete old snapshots (keep last 7)
        snapshots = rds.describe_db_snapshots(
            DBInstanceIdentifier=db_instance_id,
            SnapshotType='manual'
        )
        
        # Sort by creation time and delete old ones
        snapshots_sorted = sorted(
            snapshots['DBSnapshots'], 
            key=lambda x: x['SnapshotCreateTime'], 
            reverse=True
        )
        
        # Keep the 7 most recent snapshots
        for snapshot in snapshots_sorted[7:]:
            try:
                rds.delete_db_snapshot(
                    DBSnapshotIdentifier=snapshot['DBSnapshotIdentifier']
                )
                print(f"Deleted old snapshot: {snapshot['DBSnapshotIdentifier']}")
            except ClientError as e:
                print(f"Error deleting snapshot {snapshot['DBSnapshotIdentifier']}: {e}")
        
        return {
            'statusCode': 200,
            'body': json.dumps(f'Successfully created snapshot: {snapshot_id}')
        }
        
    except ClientError as e:
        print(f"Error creating snapshot: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error creating snapshot: {str(e)}')
        }
"""

# Lambda function
lambda_function = aws.lambda_.Function("rds-snapshot-function",
    name=f"{project_name}-rds-snapshot",
    runtime="python3.9",
    code=pulumi.AssetArchive({
        ".": pulumi.StringAsset(lambda_code)
    }),
    handler="index.lambda_handler",
    role=lambda_role.arn,
    timeout=300,
    tags=common_tags
)

# EventBridge rule for daily snapshots
snapshot_schedule = aws.cloudwatch.EventRule("snapshot-schedule",
    name=f"{project_name}-snapshot-schedule",
    description="Trigger RDS snapshot daily",
    schedule_expression="cron(0 2 * * ? *)",  # Daily at 2 AM UTC
    tags=common_tags
)

# EventBridge target
snapshot_target = aws.cloudwatch.EventTarget("snapshot-target",
    rule=snapshot_schedule.name,
    arn=lambda_function.arn,
    input=pulumi.Output.concat('{"db_instance_id": "', rds_instance.id, '"}')
)

# Lambda permission for EventBridge
lambda_permission = aws.lambda_.Permission("lambda-permission",
    statement_id="AllowExecutionFromCloudWatch",
    action="lambda:InvokeFunction",
    function_name=lambda_function.name,
    principal="events.amazonaws.com",
    source_arn=snapshot_schedule.arn
)

# =============================================================================
# OUTPUTS
# =============================================================================

pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
pulumi.export("alb_dns_name", alb.dns_name)
pulumi.export("alb_zone_id", alb.zone_id)
pulumi.export("rds_endpoint", rds_instance.endpoint)
pulumi.export("app_data_bucket_name", app_data_bucket.bucket)
pulumi.export("logs_bucket_name", logs_bucket.bucket)
pulumi.export("sns_topic_arn", sns_topic.arn)
pulumi.export("auto_scaling_group_name", auto_scaling_group.name)
pulumi.export("target_group_arn", target_group.arn)

# Health check URLs
pulumi.export("application_url", pulumi.Output.concat("http://", alb.dns_name))
pulumi.export("health_check_url", pulumi.Output.concat("http://", alb.dns_name, "/health"))
```
