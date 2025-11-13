# Flask Application Infrastructure - Pulumi Python Implementation

This implementation provides a highly available, auto-scaling containerized Flask application infrastructure using Pulumi Python.

## File: __main__.py

```python
"""
Containerized Flask Application Infrastructure
Pulumi Python implementation for ECS Fargate deployment with auto-scaling
"""

import pulumi
import pulumi_aws as aws
import json

# Configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()

# AWS Region
aws_config = pulumi.Config("aws")
region = aws_config.get("region") or "us-east-1"

# Import infrastructure modules
from vpc import create_vpc
from ecr import create_ecr_repository
from rds import create_rds_instance
from dynamodb import create_dynamodb_table
from ecs import create_ecs_cluster, create_ecs_service
from alb import create_alb
from autoscaling import create_autoscaling_policy

# Create VPC and networking
vpc_resources = create_vpc(environment_suffix, region)

# Create ECR repository for container images
ecr_repo = create_ecr_repository(environment_suffix)

# Create DynamoDB table for session management
dynamodb_table = create_dynamodb_table(environment_suffix)

# Create RDS PostgreSQL database
rds_resources = create_rds_instance(
    environment_suffix,
    vpc_resources["vpc"],
    vpc_resources["private_subnets"],
    vpc_resources["database_security_group"]
)

# Create ECS cluster
ecs_cluster = create_ecs_cluster(environment_suffix)

# Create Application Load Balancer
alb_resources = create_alb(
    environment_suffix,
    vpc_resources["vpc"],
    vpc_resources["public_subnets"],
    vpc_resources["alb_security_group"]
)

# Create ECS Service
ecs_resources = create_ecs_service(
    environment_suffix,
    ecs_cluster,
    vpc_resources["private_subnets"],
    vpc_resources["ecs_security_group"],
    alb_resources["target_group"],
    ecr_repo,
    rds_resources["db_secret"]
)

# Create Auto-scaling policies
autoscaling_resources = create_autoscaling_policy(
    environment_suffix,
    ecs_cluster,
    ecs_resources["service"]
)

# Export stack outputs
pulumi.export("alb_dns_name", alb_resources["alb"].dns_name)
pulumi.export("alb_url", pulumi.Output.concat("http://", alb_resources["alb"].dns_name))
pulumi.export("vpc_id", vpc_resources["vpc"].id)
pulumi.export("ecr_repository_url", ecr_repo.repository_url)
pulumi.export("ecs_cluster_name", ecs_cluster.name)
pulumi.export("ecs_service_name", ecs_resources["service"].name)
pulumi.export("rds_endpoint", rds_resources["db_instance"].endpoint)
pulumi.export("dynamodb_table_name", dynamodb_table.name)
pulumi.export("log_group_name", ecs_resources["log_group"].name)
```

## File: vpc.py

```python
"""
VPC and Network Infrastructure
Creates VPC with public and private subnets across multiple AZs
"""

import pulumi
import pulumi_aws as aws

def create_vpc(environment_suffix: str, region: str):
    """
    Create VPC with 2 public and 2 private subnets across 2 AZs
    """

    # Create VPC
    vpc = aws.ec2.Vpc(
        f"vpc-{environment_suffix}",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            "Name": f"vpc-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"igw-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"igw-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Availability Zones
    azs = [f"{region}a", f"{region}b"]

    # Create public subnets
    public_subnet_1 = aws.ec2.Subnet(
        f"public-subnet-1-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block="10.0.1.0/24",
        availability_zone=azs[0],
        map_public_ip_on_launch=True,
        tags={
            "Name": f"public-subnet-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Type": "Public"
        }
    )

    public_subnet_2 = aws.ec2.Subnet(
        f"public-subnet-2-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block="10.0.2.0/24",
        availability_zone=azs[1],
        map_public_ip_on_launch=True,
        tags={
            "Name": f"public-subnet-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Type": "Public"
        }
    )

    # Create private subnets
    private_subnet_1 = aws.ec2.Subnet(
        f"private-subnet-1-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block="10.0.3.0/24",
        availability_zone=azs[0],
        tags={
            "Name": f"private-subnet-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Type": "Private"
        }
    )

    private_subnet_2 = aws.ec2.Subnet(
        f"private-subnet-2-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block="10.0.4.0/24",
        availability_zone=azs[1],
        tags={
            "Name": f"private-subnet-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Type": "Private"
        }
    )

    # Create Elastic IPs for NAT Gateways
    eip_1 = aws.ec2.Eip(
        f"nat-eip-1-{environment_suffix}",
        domain="vpc",
        tags={
            "Name": f"nat-eip-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    eip_2 = aws.ec2.Eip(
        f"nat-eip-2-{environment_suffix}",
        domain="vpc",
        tags={
            "Name": f"nat-eip-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create NAT Gateways
    nat_gateway_1 = aws.ec2.NatGateway(
        f"nat-gateway-1-{environment_suffix}",
        allocation_id=eip_1.id,
        subnet_id=public_subnet_1.id,
        tags={
            "Name": f"nat-gateway-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    nat_gateway_2 = aws.ec2.NatGateway(
        f"nat-gateway-2-{environment_suffix}",
        allocation_id=eip_2.id,
        subnet_id=public_subnet_2.id,
        tags={
            "Name": f"nat-gateway-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create public route table
    public_route_table = aws.ec2.RouteTable(
        f"public-rt-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"public-rt-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Add route to Internet Gateway
    public_route = aws.ec2.Route(
        f"public-route-{environment_suffix}",
        route_table_id=public_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    # Associate public subnets with public route table
    public_rt_assoc_1 = aws.ec2.RouteTableAssociation(
        f"public-rt-assoc-1-{environment_suffix}",
        subnet_id=public_subnet_1.id,
        route_table_id=public_route_table.id
    )

    public_rt_assoc_2 = aws.ec2.RouteTableAssociation(
        f"public-rt-assoc-2-{environment_suffix}",
        subnet_id=public_subnet_2.id,
        route_table_id=public_route_table.id
    )

    # Create private route tables
    private_route_table_1 = aws.ec2.RouteTable(
        f"private-rt-1-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"private-rt-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    private_route_table_2 = aws.ec2.RouteTable(
        f"private-rt-2-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"private-rt-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Add routes to NAT Gateways
    private_route_1 = aws.ec2.Route(
        f"private-route-1-{environment_suffix}",
        route_table_id=private_route_table_1.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway_1.id
    )

    private_route_2 = aws.ec2.Route(
        f"private-route-2-{environment_suffix}",
        route_table_id=private_route_table_2.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway_2.id
    )

    # Associate private subnets with private route tables
    private_rt_assoc_1 = aws.ec2.RouteTableAssociation(
        f"private-rt-assoc-1-{environment_suffix}",
        subnet_id=private_subnet_1.id,
        route_table_id=private_route_table_1.id
    )

    private_rt_assoc_2 = aws.ec2.RouteTableAssociation(
        f"private-rt-assoc-2-{environment_suffix}",
        subnet_id=private_subnet_2.id,
        route_table_id=private_route_table_2.id
    )

    # Create security group for ALB
    alb_security_group = aws.ec2.SecurityGroup(
        f"alb-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group for Application Load Balancer",
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
        tags={
            "Name": f"alb-sg-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create security group for ECS tasks
    ecs_security_group = aws.ec2.SecurityGroup(
        f"ecs-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group for ECS tasks",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5000,
                to_port=5000,
                security_groups=[alb_security_group.id],
                description="Allow traffic from ALB on port 5000"
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
        tags={
            "Name": f"ecs-sg-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create security group for RDS
    database_security_group = aws.ec2.SecurityGroup(
        f"rds-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group for RDS PostgreSQL",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                security_groups=[ecs_security_group.id],
                description="Allow PostgreSQL from ECS tasks"
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
        tags={
            "Name": f"rds-sg-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    return {
        "vpc": vpc,
        "public_subnets": [public_subnet_1, public_subnet_2],
        "private_subnets": [private_subnet_1, private_subnet_2],
        "alb_security_group": alb_security_group,
        "ecs_security_group": ecs_security_group,
        "database_security_group": database_security_group,
        "nat_gateways": [nat_gateway_1, nat_gateway_2]
    }
```

## File: ecr.py

```python
"""
ECR Repository for Container Images
Creates ECR repository with scanning and lifecycle policies
"""

import pulumi
import pulumi_aws as aws
import json

def create_ecr_repository(environment_suffix: str):
    """
    Create ECR repository with image scanning and lifecycle policy
    """

    # Create ECR repository
    repository = aws.ecr.Repository(
        f"flask-app-{environment_suffix}",
        name=f"flask-app-{environment_suffix}",
        image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
            scan_on_push=True
        ),
        image_tag_mutability="MUTABLE",
        encryption_configuration=aws.ecr.RepositoryEncryptionConfigurationArgs(
            encryption_type="AES256"
        ),
        tags={
            "Name": f"flask-app-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create lifecycle policy to keep only 5 most recent images
    lifecycle_policy = aws.ecr.LifecyclePolicy(
        f"flask-app-lifecycle-{environment_suffix}",
        repository=repository.name,
        policy=json.dumps({
            "rules": [
                {
                    "rulePriority": 1,
                    "description": "Keep only 5 most recent images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 5
                    },
                    "action": {
                        "type": "expire"
                    }
                }
            ]
        })
    )

    return repository
```

## File: rds.py

```python
"""
RDS PostgreSQL Database
Creates RDS instance with automated backups
"""

import pulumi
import pulumi_aws as aws
import json

def create_rds_instance(environment_suffix: str, vpc, private_subnets, security_group):
    """
    Create RDS PostgreSQL instance with automated backups
    """

    # Create DB subnet group
    db_subnet_group = aws.rds.SubnetGroup(
        f"db-subnet-group-{environment_suffix}",
        subnet_ids=[subnet.id for subnet in private_subnets],
        tags={
            "Name": f"db-subnet-group-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create a random password for the database
    db_password = pulumi.Output.secret("TempPassword123!")  # In production, use existing secret
    db_username = "postgres"
    db_name = "flaskapp"

    # Create RDS PostgreSQL instance
    db_instance = aws.rds.Instance(
        f"postgres-{environment_suffix}",
        identifier=f"postgres-{environment_suffix}",
        engine="postgres",
        engine_version="14.7",
        instance_class="db.t3.micro",
        allocated_storage=20,
        storage_type="gp2",
        storage_encrypted=True,
        db_name=db_name,
        username=db_username,
        password=db_password,
        db_subnet_group_name=db_subnet_group.name,
        vpc_security_group_ids=[security_group.id],
        publicly_accessible=False,
        skip_final_snapshot=True,  # For destroyable infrastructure
        backup_retention_period=5,
        backup_window="03:00-04:00",
        maintenance_window="mon:04:00-mon:05:00",
        multi_az=False,  # Single AZ for cost optimization
        tags={
            "Name": f"postgres-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create connection string secret in Secrets Manager
    db_connection_string = pulumi.Output.all(
        db_instance.endpoint,
        db_username,
        db_password,
        db_name
    ).apply(lambda args: f"postgresql://{args[1]}:{args[2]}@{args[0]}/{args[3]}")

    db_secret = aws.secretsmanager.Secret(
        f"db-connection-{environment_suffix}",
        name=f"db-connection-{environment_suffix}",
        description="Database connection string for Flask application",
        tags={
            "Name": f"db-connection-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    db_secret_version = aws.secretsmanager.SecretVersion(
        f"db-connection-version-{environment_suffix}",
        secret_id=db_secret.id,
        secret_string=db_connection_string
    )

    return {
        "db_instance": db_instance,
        "db_subnet_group": db_subnet_group,
        "db_secret": db_secret
    }
```

## File: dynamodb.py

```python
"""
DynamoDB Table for Session Management
Creates DynamoDB table with TTL enabled
"""

import pulumi
import pulumi_aws as aws

def create_dynamodb_table(environment_suffix: str):
    """
    Create DynamoDB table for user sessions with TTL
    """

    # Create DynamoDB table
    table = aws.dynamodb.Table(
        f"user-sessions-{environment_suffix}",
        name=f"user-sessions-{environment_suffix}",
        billing_mode="PAY_PER_REQUEST",  # On-demand pricing for cost optimization
        hash_key="session_id",
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="session_id",
                type="S"
            )
        ],
        ttl=aws.dynamodb.TableTtlArgs(
            enabled=True,
            attribute_name="expiry"
        ),
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True
        ),
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True
        ),
        tags={
            "Name": f"user-sessions-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    return table
```

## File: ecs.py

```python
"""
ECS Cluster and Service
Creates ECS Fargate cluster and service with task definition
"""

import pulumi
import pulumi_aws as aws
import json

def create_ecs_cluster(environment_suffix: str):
    """
    Create ECS Fargate cluster
    """

    cluster = aws.ecs.Cluster(
        f"flask-cluster-{environment_suffix}",
        name=f"flask-cluster-{environment_suffix}",
        settings=[
            aws.ecs.ClusterSettingArgs(
                name="containerInsights",
                value="enabled"
            )
        ],
        tags={
            "Name": f"flask-cluster-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    return cluster

def create_ecs_service(environment_suffix: str, cluster, private_subnets, security_group,
                      target_group, ecr_repo, db_secret):
    """
    Create ECS service with Fargate tasks
    """

    # Create CloudWatch log group
    log_group = aws.cloudwatch.LogGroup(
        f"ecs-flask-{environment_suffix}",
        name=f"/ecs/flask-{environment_suffix}",
        retention_in_days=7,
        tags={
            "Name": f"ecs-flask-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create IAM role for task execution
    task_execution_role = aws.iam.Role(
        f"ecs-task-execution-role-{environment_suffix}",
        name=f"ecs-task-execution-role-{environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }),
        tags={
            "Name": f"ecs-task-execution-role-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Attach AWS managed policy for ECS task execution
    task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
        f"ecs-task-execution-policy-{environment_suffix}",
        role=task_execution_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    )

    # Create inline policy for Secrets Manager access
    secrets_policy = aws.iam.RolePolicy(
        f"ecs-secrets-policy-{environment_suffix}",
        role=task_execution_role.id,
        policy=db_secret.arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": arn
                }
            ]
        }))
    )

    # Create IAM role for task
    task_role = aws.iam.Role(
        f"ecs-task-role-{environment_suffix}",
        name=f"ecs-task-role-{environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }),
        tags={
            "Name": f"ecs-task-role-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Add policy for DynamoDB access
    dynamodb_policy = aws.iam.RolePolicy(
        f"ecs-dynamodb-policy-{environment_suffix}",
        role=task_role.id,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": f"arn:aws:dynamodb:*:*:table/user-sessions-{environment_suffix}"
                }
            ]
        })
    )

    # Create task definition
    task_definition = aws.ecs.TaskDefinition(
        f"flask-task-{environment_suffix}",
        family=f"flask-task-{environment_suffix}",
        network_mode="awsvpc",
        requires_compatibilities=["FARGATE"],
        cpu="512",
        memory="1024",
        execution_role_arn=task_execution_role.arn,
        task_role_arn=task_role.arn,
        container_definitions=pulumi.Output.all(ecr_repo.repository_url, log_group.name, db_secret.arn).apply(
            lambda args: json.dumps([
                {
                    "name": "flask-app",
                    "image": f"{args[0]}:latest",
                    "essential": True,
                    "portMappings": [
                        {
                            "containerPort": 5000,
                            "protocol": "tcp"
                        }
                    ],
                    "environment": [
                        {
                            "name": "FLASK_ENV",
                            "value": "production"
                        },
                        {
                            "name": "DYNAMODB_TABLE",
                            "value": f"user-sessions-{environment_suffix}"
                        }
                    ],
                    "secrets": [
                        {
                            "name": "DATABASE_URL",
                            "valueFrom": args[2]
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[1],
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "flask"
                        }
                    },
                    "healthCheck": {
                        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
                        "interval": 30,
                        "timeout": 5,
                        "retries": 3,
                        "startPeriod": 60
                    }
                }
            ])
        ),
        tags={
            "Name": f"flask-task-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create ECS service
    service = aws.ecs.Service(
        f"flask-service-{environment_suffix}",
        name=f"flask-service-{environment_suffix}",
        cluster=cluster.arn,
        task_definition=task_definition.arn,
        desired_count=2,
        launch_type="FARGATE",
        network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
            subnets=[subnet.id for subnet in private_subnets],
            security_groups=[security_group.id],
            assign_public_ip=False
        ),
        load_balancers=[
            aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=target_group.arn,
                container_name="flask-app",
                container_port=5000
            )
        ],
        health_check_grace_period_seconds=60,
        tags={
            "Name": f"flask-service-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        },
        opts=pulumi.ResourceOptions(depends_on=[target_group])
    )

    return {
        "service": service,
        "task_definition": task_definition,
        "task_execution_role": task_execution_role,
        "task_role": task_role,
        "log_group": log_group
    }
```

## File: alb.py

```python
"""
Application Load Balancer
Creates ALB with target group and listener rules
"""

import pulumi
import pulumi_aws as aws

def create_alb(environment_suffix: str, vpc, public_subnets, security_group):
    """
    Create Application Load Balancer with target group
    """

    # Create ALB
    alb = aws.lb.LoadBalancer(
        f"flask-alb-{environment_suffix}",
        name=f"flask-alb-{environment_suffix}",
        load_balancer_type="application",
        subnets=[subnet.id for subnet in public_subnets],
        security_groups=[security_group.id],
        enable_deletion_protection=False,
        enable_http2=True,
        enable_cross_zone_load_balancing=True,
        tags={
            "Name": f"flask-alb-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create target group
    target_group = aws.lb.TargetGroup(
        f"flask-tg-{environment_suffix}",
        name=f"flask-tg-{environment_suffix}",
        port=5000,
        protocol="HTTP",
        vpc_id=vpc.id,
        target_type="ip",
        deregistration_delay=30,
        health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            healthy_threshold=2,
            unhealthy_threshold=3,
            timeout=5,
            interval=30,
            path="/health",
            protocol="HTTP",
            matcher="200"
        ),
        tags={
            "Name": f"flask-tg-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create default listener
    listener = aws.lb.Listener(
        f"flask-listener-{environment_suffix}",
        load_balancer_arn=alb.arn,
        port=80,
        protocol="HTTP",
        default_actions=[
            aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )
        ]
    )

    # Create listener rule for /api/* path
    api_rule = aws.lb.ListenerRule(
        f"flask-api-rule-{environment_suffix}",
        listener_arn=listener.arn,
        priority=100,
        conditions=[
            aws.lb.ListenerRuleConditionArgs(
                path_pattern=aws.lb.ListenerRuleConditionPathPatternArgs(
                    values=["/api/*"]
                )
            )
        ],
        actions=[
            aws.lb.ListenerRuleActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )
        ]
    )

    # Create listener rule for /health path
    health_rule = aws.lb.ListenerRule(
        f"flask-health-rule-{environment_suffix}",
        listener_arn=listener.arn,
        priority=101,
        conditions=[
            aws.lb.ListenerRuleConditionArgs(
                path_pattern=aws.lb.ListenerRuleConditionPathPatternArgs(
                    values=["/health"]
                )
            )
        ],
        actions=[
            aws.lb.ListenerRuleActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )
        ]
    )

    return {
        "alb": alb,
        "target_group": target_group,
        "listener": listener
    }
```

## File: autoscaling.py

```python
"""
Auto-scaling Configuration
Creates auto-scaling policies and CloudWatch alarms for ECS service
"""

import pulumi
import pulumi_aws as aws

def create_autoscaling_policy(environment_suffix: str, cluster, service):
    """
    Create auto-scaling policies for ECS service
    """

    # Create auto-scaling target
    autoscaling_target = aws.appautoscaling.Target(
        f"ecs-target-{environment_suffix}",
        service_namespace="ecs",
        resource_id=pulumi.Output.all(cluster.name, service.name).apply(
            lambda args: f"service/{args[0]}/{args[1]}"
        ),
        scalable_dimension="ecs:service:DesiredCount",
        min_capacity=2,
        max_capacity=10
    )

    # Create scale-up policy
    scale_up_policy = aws.appautoscaling.Policy(
        f"ecs-scale-up-{environment_suffix}",
        name=f"ecs-scale-up-{environment_suffix}",
        service_namespace=autoscaling_target.service_namespace,
        resource_id=autoscaling_target.resource_id,
        scalable_dimension=autoscaling_target.scalable_dimension,
        policy_type="TargetTrackingScaling",
        target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
            predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                predefined_metric_type="ECSServiceAverageCPUUtilization"
            ),
            target_value=70.0,
            scale_in_cooldown=300,
            scale_out_cooldown=300
        )
    )

    # Create CloudWatch alarm for high CPU
    high_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"ecs-high-cpu-{environment_suffix}",
        name=f"ecs-high-cpu-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/ECS",
        period=60,
        statistic="Average",
        threshold=70.0,
        alarm_description="Triggers when ECS service CPU exceeds 70%",
        dimensions={
            "ClusterName": cluster.name,
            "ServiceName": service.name
        },
        tags={
            "Name": f"ecs-high-cpu-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create CloudWatch alarm for low CPU
    low_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"ecs-low-cpu-{environment_suffix}",
        name=f"ecs-low-cpu-{environment_suffix}",
        comparison_operator="LessThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/ECS",
        period=60,
        statistic="Average",
        threshold=30.0,
        alarm_description="Triggers when ECS service CPU below 30%",
        dimensions={
            "ClusterName": cluster.name,
            "ServiceName": service.name
        },
        tags={
            "Name": f"ecs-low-cpu-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    return {
        "autoscaling_target": autoscaling_target,
        "scale_up_policy": scale_up_policy,
        "high_cpu_alarm": high_cpu_alarm,
        "low_cpu_alarm": low_cpu_alarm
    }
```

## File: Pulumi.yaml

```yaml
name: flask-app-infrastructure
runtime: python
description: Containerized Flask application infrastructure with ECS Fargate, RDS, and auto-scaling
config:
  aws:region:
    description: AWS region for deployment
    default: us-east-1
  environmentSuffix:
    description: Environment suffix for resource naming
    default: dev
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: lib/README.md

```markdown
# Flask Application Infrastructure

This Pulumi Python project deploys a highly available, auto-scaling containerized Flask application on AWS using ECS Fargate.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC with 2 public and 2 private subnets across 2 availability zones
- **Application Load Balancer**: Distributes traffic to ECS tasks with health checks
- **ECS Fargate**: Runs containerized Flask application with auto-scaling
- **RDS PostgreSQL**: Managed database with automated backups
- **DynamoDB**: Session management with TTL
- **ECR**: Private container registry with image scanning
- **CloudWatch Logs**: Centralized logging with 7-day retention
- **Secrets Manager**: Secure credential storage
- **Auto-scaling**: CPU-based scaling between 2-10 tasks

## Prerequisites

- Python 3.8 or higher
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Docker for building container images

## Project Structure

```
.
├── __main__.py              # Main entry point
├── vpc.py                   # VPC and networking resources
├── ecr.py                   # ECR repository configuration
├── rds.py                   # RDS PostgreSQL database
├── dynamodb.py              # DynamoDB table
├── ecs.py                   # ECS cluster and service
├── alb.py                   # Application Load Balancer
├── autoscaling.py           # Auto-scaling policies
├── Pulumi.yaml              # Pulumi project configuration
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## Configuration

Set the following configuration values:

```bash
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix dev
```

## Deployment

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

3. Configure AWS region and environment suffix:
```bash
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix dev
```

4. Preview changes:
```bash
pulumi preview
```

5. Deploy infrastructure:
```bash
pulumi up
```

6. Build and push Docker image to ECR:
```bash
# Get ECR repository URL
ECR_URL=$(pulumi stack output ecr_repository_url)

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL

# Build and tag image
docker build -t webapp:latest .
docker tag webapp:latest $ECR_URL:latest

# Push to ECR
docker push $ECR_URL:latest
```

7. Update ECS service to pull new image:
```bash
aws ecs update-service --cluster $(pulumi stack output ecs_cluster_name) \
  --service $(pulumi stack output ecs_service_name) --force-new-deployment
```

## Stack Outputs

After deployment, the following outputs are available:

- `alb_dns_name`: DNS name of the Application Load Balancer
- `alb_url`: Full HTTP URL to access the application
- `vpc_id`: VPC identifier
- `ecr_repository_url`: ECR repository URL for pushing images
- `ecs_cluster_name`: ECS cluster name
- `ecs_service_name`: ECS service name
- `rds_endpoint`: RDS database endpoint
- `dynamodb_table_name`: DynamoDB table name
- `log_group_name`: CloudWatch log group name

## Accessing the Application

Get the Application Load Balancer URL:

```bash
pulumi stack output alb_url
```

Access the application:
- Health endpoint: `http://<alb_dns_name>/health`
- API endpoints: `http://<alb_dns_name>/api/*`

## Auto-Scaling

The ECS service automatically scales based on CPU utilization:
- **Minimum tasks**: 2
- **Maximum tasks**: 10
- **Scale trigger**: 70% average CPU utilization
- **Cooldown**: 300 seconds

## Monitoring

View logs in CloudWatch:
```bash
aws logs tail /ecs/flask-$(pulumi config get environmentSuffix) --follow
```

View metrics in CloudWatch Console:
- ECS service CPU utilization
- ALB request count and latency
- Target group health status

## Security

- All traffic between ALB and ECS tasks is within the VPC
- Database credentials stored in AWS Secrets Manager
- RDS instance in private subnets with no public access
- Security groups restrict traffic to necessary ports only
- Encryption at rest enabled for RDS and DynamoDB
- ECR images scanned for vulnerabilities on push

## Cost Optimization

- ECS Fargate with minimum 2 tasks
- RDS db.t3.micro instance
- DynamoDB on-demand pricing
- CloudWatch logs with 7-day retention
- ECR lifecycle policy keeps only 5 recent images

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Troubleshooting

### ECS tasks not starting
- Check CloudWatch logs for task errors
- Verify ECR image exists and is accessible
- Ensure IAM roles have necessary permissions

### Health checks failing
- Verify Flask application responds on port 5000
- Check /health endpoint returns 200 status
- Review security group rules

### Database connection issues
- Verify Secrets Manager contains valid connection string
- Check RDS security group allows traffic from ECS tasks
- Ensure RDS instance is in available state

## Support

For issues or questions, refer to:
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
