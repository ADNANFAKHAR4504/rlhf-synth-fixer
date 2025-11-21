"""Main Pulumi program for transaction processing infrastructure."""
import pulumi
import pulumi_aws as aws
import boto3
import os
from typing import Optional

# Get configuration
config = pulumi.Config()
environment_suffix: str = (
    config.get("environment_suffix")
    or os.environ.get("ENVIRONMENT_SUFFIX")
    or pulumi.get_stack()
)
region: str = config.get("region") or "us-east-1"

# Get db_password from environment variable or config
db_password_env = os.environ.get('TF_VAR_db_password')
if not db_password_env:
    # If no environment variable, try to get from config
    db_password_config = config.get_secret("db_password")
    if db_password_config:
        db_password = db_password_config
    else:
        # Use a default password if nothing else is available
        db_password = 'TempPassword123!'
else:
    db_password = db_password_env

# Get AWS account ID for unique bucket names
sts = boto3.client('sts')
aws_account_id = sts.get_caller_identity()['Account']

# Availability zones
azs = [f"{region}a", f"{region}b"]

# VPC Configuration
vpc = aws.ec2.Vpc(
    f"transaction-vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"transaction-vpc-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"transaction-igw-{environment_suffix}",
    vpc_id=vpc.id,
    tags={
        "Name": f"transaction-igw-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Public Subnets
public_subnets = []
for i, az in enumerate(azs):
    subnet = aws.ec2.Subnet(
        f"public-subnet-{i+1}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
            "Name": f"public-subnet-{i+1}-{environment_suffix}",
            "Environment": environment_suffix,
            "Type": "public",
        },
    )
    public_subnets.append(subnet)

# Private Subnets
private_subnets = []
for i, az in enumerate(azs):
    subnet = aws.ec2.Subnet(
        f"private-subnet-{i+1}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={
            "Name": f"private-subnet-{i+1}-{environment_suffix}",
            "Environment": environment_suffix,
            "Type": "private",
        },
    )
    private_subnets.append(subnet)

# Elastic IP for NAT Gateway
eip = aws.ec2.Eip(
    f"nat-eip-{environment_suffix}",
    domain="vpc",
    tags={
        "Name": f"nat-eip-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# NAT Gateway (single for cost optimization)
nat_gateway = aws.ec2.NatGateway(
    f"nat-gateway-{environment_suffix}",
    subnet_id=public_subnets[0].id,
    allocation_id=eip.id,
    tags={
        "Name": f"nat-gateway-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Public Route Table
public_route_table = aws.ec2.RouteTable(
    f"public-rt-{environment_suffix}",
    vpc_id=vpc.id,
    tags={
        "Name": f"public-rt-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Public Route to Internet Gateway
public_route = aws.ec2.Route(
    f"public-route-{environment_suffix}",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id,
)

# Associate public subnets with public route table
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
        f"public-rta-{i+1}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=public_route_table.id,
    )

# Private Route Table
private_route_table = aws.ec2.RouteTable(
    f"private-rt-{environment_suffix}",
    vpc_id=vpc.id,
    tags={
        "Name": f"private-rt-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Private Route to NAT Gateway
private_route = aws.ec2.Route(
    f"private-route-{environment_suffix}",
    route_table_id=private_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway.id,
)

# Associate private subnets with private route table
for i, subnet in enumerate(private_subnets):
    aws.ec2.RouteTableAssociation(
        f"private-rta-{i+1}-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=private_route_table.id,
    )

# VPC Endpoints for S3 and DynamoDB (commented out due to quota limits in test account)
# s3_endpoint = aws.ec2.VpcEndpoint(
#     f"s3-endpoint-{environment_suffix}",
#     vpc_id=vpc.id,
#     service_name=f"com.amazonaws.{region}.s3",
#     route_table_ids=[private_route_table.id],
#     tags={
#         "Name": f"s3-endpoint-{environment_suffix}",
#         "Environment": environment_suffix,
#     },
# )
#
# dynamodb_endpoint = aws.ec2.VpcEndpoint(
#     f"dynamodb-endpoint-{environment_suffix}",
#     vpc_id=vpc.id,
#     service_name=f"com.amazonaws.{region}.dynamodb",
#     route_table_ids=[private_route_table.id],
#     tags={
#         "Name": f"dynamodb-endpoint-{environment_suffix}",
#         "Environment": environment_suffix,
#     },
# )

# Security Group for ALB
alb_sg = aws.ec2.SecurityGroup(
    f"alb-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for Application Load Balancer",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow HTTP from internet",
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow HTTPS from internet",
        ),
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound",
        ),
    ],
    tags={
        "Name": f"alb-sg-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Security Group for ECS Tasks
ecs_sg = aws.ec2.SecurityGroup(
    f"ecs-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for ECS tasks",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=8080,
            to_port=8080,
            security_groups=[alb_sg.id],
            description="Allow traffic from ALB",
        ),
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound",
        ),
    ],
    tags={
        "Name": f"ecs-sg-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Security Group for RDS
rds_sg = aws.ec2.SecurityGroup(
    f"rds-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for RDS Aurora",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=5432,
            to_port=5432,
            security_groups=[ecs_sg.id],
            description="Allow PostgreSQL from ECS tasks",
        ),
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound",
        ),
    ],
    tags={
        "Name": f"rds-sg-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# S3 Buckets (with globally unique names)
bucket_suffix = f"{environment_suffix}-{aws_account_id}-{region}"
app_logs_bucket = aws.s3.Bucket(
    f"app-logs-{environment_suffix}",
    bucket=f"app-logs-{bucket_suffix}",
    tags={
        "Name": f"app-logs-{environment_suffix}",
        "Environment": environment_suffix,
        "Purpose": "application-logs",
    },
)

transaction_data_bucket = aws.s3.Bucket(
    f"transaction-data-{environment_suffix}",
    bucket=f"transaction-data-{bucket_suffix}",
    tags={
        "Name": f"transaction-data-{environment_suffix}",
        "Environment": environment_suffix,
        "Purpose": "transaction-data",
    },
)

# Enable S3 bucket encryption
app_logs_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"app-logs-encryption-{environment_suffix}",
    bucket=app_logs_bucket.id,
    rules=[
        aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=(
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                )
            ),
        ),
    ],
)

transaction_data_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"transaction-data-encryption-{environment_suffix}",
    bucket=transaction_data_bucket.id,
    rules=[
        aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=(
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                )
            ),
        ),
    ],
)

# CloudWatch Log Groups
ecs_log_group = aws.cloudwatch.LogGroup(
    f"ecs-logs-{environment_suffix}",
    name=f"/ecs/transaction-processing-{environment_suffix}",
    retention_in_days=30,
    tags={
        "Name": f"ecs-logs-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

rds_log_group = aws.cloudwatch.LogGroup(
    f"rds-logs-{environment_suffix}",
    name=f"/aws/rds/aurora-{environment_suffix}",
    retention_in_days=30,
    tags={
        "Name": f"rds-logs-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

alb_log_group = aws.cloudwatch.LogGroup(
    f"alb-logs-{environment_suffix}",
    name=f"/aws/alb/transaction-{environment_suffix}",
    retention_in_days=30,
    tags={
        "Name": f"alb-logs-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# IAM Role for ECS Task Execution
ecs_task_execution_role = aws.iam.Role(
    f"ecs-task-execution-role-{environment_suffix}",
    assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }""",
    tags={
        "Name": f"ecs-task-execution-role-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Attach AWS managed policy for ECS task execution
ecs_task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
    f"ecs-task-execution-policy-{environment_suffix}",
    role=ecs_task_execution_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
)

# IAM Role for ECS Task (application-level permissions)
ecs_task_role = aws.iam.Role(
    f"ecs-task-role-{environment_suffix}",
    assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }""",
    tags={
        "Name": f"ecs-task-role-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# IAM Policy for ECS Task to access S3 and RDS
ecs_task_policy = aws.iam.RolePolicy(
    f"ecs-task-policy-{environment_suffix}",
    role=ecs_task_role.id,
    policy=pulumi.Output.all(
        app_logs_bucket.arn,
        transaction_data_bucket.arn,
    ).apply(
        lambda args: f"""{{
        "Version": "2012-10-17",
        "Statement": [
            {{
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "{args[0]}",
                    "{args[0]}/*",
                    "{args[1]}",
                    "{args[1]}/*"
                ]
            }},
            {{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "*"
            }}
        ]
    }}"""
    ),
)

# DB Subnet Group
db_subnet_group = aws.rds.SubnetGroup(
    f"aurora-subnet-group-{environment_suffix}",
    subnet_ids=[subnet.id for subnet in private_subnets],
    tags={
        "Name": f"aurora-subnet-group-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# RDS Aurora Cluster
# Ensure password is properly set as a Pulumi secret
aurora_cluster = aws.rds.Cluster(
    f"aurora-cluster-{environment_suffix}",
    cluster_identifier=f"aurora-cluster-{environment_suffix}",
    engine="aurora-postgresql",
    engine_version="15.6",
    database_name="transactions",
    master_username="dbadmin",
    master_password=pulumi.Output.secret(db_password),
    db_subnet_group_name=db_subnet_group.name,
    vpc_security_group_ids=[rds_sg.id],
    skip_final_snapshot=True,
    backup_retention_period=1,
    preferred_backup_window="03:00-04:00",
    enabled_cloudwatch_logs_exports=["postgresql"],
    tags={
        "Name": f"aurora-cluster-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Aurora Writer Instance
aurora_writer = aws.rds.ClusterInstance(
    f"aurora-writer-{environment_suffix}",
    identifier=f"aurora-writer-{environment_suffix}",
    cluster_identifier=aurora_cluster.id,
    instance_class="db.t4g.medium",
    engine=aurora_cluster.engine,
    engine_version=aurora_cluster.engine_version,
    publicly_accessible=False,
    tags={
        "Name": f"aurora-writer-{environment_suffix}",
        "Environment": environment_suffix,
        "Role": "writer",
    },
)

# Aurora Reader Instance
aurora_reader = aws.rds.ClusterInstance(
    f"aurora-reader-{environment_suffix}",
    identifier=f"aurora-reader-{environment_suffix}",
    cluster_identifier=aurora_cluster.id,
    instance_class="db.t4g.medium",
    engine=aurora_cluster.engine,
    engine_version=aurora_cluster.engine_version,
    publicly_accessible=False,
    tags={
        "Name": f"aurora-reader-{environment_suffix}",
        "Environment": environment_suffix,
        "Role": "reader",
    },
)

# Application Load Balancer
alb = aws.lb.LoadBalancer(
    f"transaction-alb-{environment_suffix}",
    name=f"transaction-alb-{environment_suffix}",
    load_balancer_type="application",
    security_groups=[alb_sg.id],
    subnets=[subnet.id for subnet in public_subnets],
    tags={
        "Name": f"transaction-alb-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# ALB Target Group
alb_target_group = aws.lb.TargetGroup(
    f"ecs-target-group-{environment_suffix}",
    name=f"ecs-tg-{environment_suffix}",
    port=8080,
    protocol="HTTP",
    vpc_id=vpc.id,
    target_type="ip",
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        path="/health",
        port="8080",
        protocol="HTTP",
        healthy_threshold=2,
        unhealthy_threshold=2,
        timeout=5,
        interval=30,
    ),
    tags={
        "Name": f"ecs-target-group-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# ALB Listener
alb_listener = aws.lb.Listener(
    f"alb-listener-{environment_suffix}",
    load_balancer_arn=alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=alb_target_group.arn,
        ),
    ],
)

# ECS Cluster
ecs_cluster = aws.ecs.Cluster(
    f"transaction-cluster-{environment_suffix}",
    name=f"transaction-cluster-{environment_suffix}",
    tags={
        "Name": f"transaction-cluster-{environment_suffix}",
        "Environment": environment_suffix,
    },
)

# Exports
pulumi.export("vpc_id", vpc.id)
pulumi.export("alb_dns_name", alb.dns_name)
pulumi.export("rds_endpoint", aurora_cluster.endpoint)
pulumi.export("rds_reader_endpoint", aurora_cluster.reader_endpoint)
pulumi.export("app_logs_bucket", app_logs_bucket.bucket)
pulumi.export("transaction_data_bucket", transaction_data_bucket.bucket)
pulumi.export("ecs_cluster_name", ecs_cluster.name)
pulumi.export("ecs_task_role_arn", ecs_task_role.arn)
pulumi.export("ecs_task_execution_role_arn", ecs_task_execution_role.arn)
pulumi.export("ecs_security_group_id", ecs_sg.id)
pulumi.export("alb_target_group_arn", alb_target_group.arn)
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
