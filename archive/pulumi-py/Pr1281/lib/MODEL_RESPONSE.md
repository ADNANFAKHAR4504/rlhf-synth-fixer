# CI/CD Pipeline for AWS Microservices Application

I'll provide a complete, production-ready CI/CD pipeline solution for a microservices application using GitHub Actions, Pulumi, and AWS. This solution follows enterprise-level best practices for automation, scalability, and security.

## Project Structure

```
microservices-cicd/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       └── infrastructure.yml
├── infrastructure/
│   ├── __main__.py
│   ├── requirements.txt
│   ├── Pulumi.yaml
│   ├── Pulumi.prod.yaml
│   └── modules/
│       ├── __init__.py
│       ├── networking.py
│       ├── security.py
│       ├── database.py
│       ├── cache.py
│       ├── ecs.py
│       ├── ecr.py
│       └── monitoring.py
├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py
│   └── tests/
│       ├── test_unit.py
│       └── test_integration.py
├── scripts/
│   ├── deploy.sh
│   └── rollback.sh
├── docker-compose.yml
└── README.md
```

## 1. Pulumi Infrastructure Code

### infrastructure/**main**.py

```python
import pulumi
import pulumi_aws as aws
from modules.networking import create_networking
from modules.security import create_security_groups, create_iam_roles
from modules.database import create_rds_instance
from modules.cache import create_redis_cluster
from modules.ecr import create_ecr_repository
from modules.ecs import create_ecs_cluster
from modules.monitoring import create_monitoring

# Configuration
config = pulumi.Config()
project_name = "microservices-ci"
environment = "production"

# Common tags
common_tags = {
    "Environment": "Production",
    "Project": "MicroservicesCI",
    "Owner": "DevOps"
}

def main():
    # Create networking infrastructure
    vpc_resources = create_networking(project_name, common_tags)

    # Create security groups and IAM roles
    security_resources = create_security_groups(
        vpc_resources["vpc"],
        project_name,
        common_tags
    )
    iam_resources = create_iam_roles(project_name, common_tags)

    # Create RDS instance
    db_resources = create_rds_instance(
        vpc_resources["private_subnets"],
        security_resources["db_security_group"],
        project_name,
        common_tags
    )

    # Create Redis cluster
    cache_resources = create_redis_cluster(
        vpc_resources["private_subnets"],
        security_resources["cache_security_group"],
        project_name,
        common_tags
    )

    # Create ECR repository
    ecr_resources = create_ecr_repository(project_name, common_tags)

    # Create ECS cluster and services
    ecs_resources = create_ecs_cluster(
        vpc_resources,
        security_resources,
        iam_resources,
        db_resources,
        cache_resources,
        ecr_resources,
        project_name,
        common_tags
    )

    # Create monitoring and logging
    monitoring_resources = create_monitoring(
        ecs_resources["cluster"],
        project_name,
        common_tags
    )

    # Outputs
    pulumi.export("vpc_id", vpc_resources["vpc"].id)
    pulumi.export("alb_dns_name", ecs_resources["alb"].dns_name)
    pulumi.export("ecr_repository_url", ecr_resources["repository"].repository_url)
    pulumi.export("ecs_cluster_name", ecs_resources["cluster"].name)
    pulumi.export("ecs_service_name", ecs_resources["service"].name)
    pulumi.export("cloudfront_domain", ecs_resources.get("cloudfront", {}).get("domain_name", ""))

if __name__ == "__main__":
    main()
```

### infrastructure/modules/networking.py

```python
import pulumi
import pulumi_aws as aws

def create_networking(project_name: str, tags: dict):
    """Create VPC, subnets, and networking components"""

    # VPC
    vpc = aws.ec2.Vpc(
        f"{project_name}-vpc",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**tags, "Name": f"{project_name}-vpc"}
    )

    # Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"{project_name}-igw",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"{project_name}-igw"}
    )

    # Get availability zones
    azs = aws.get_availability_zones(state="available")

    # Public subnets
    public_subnets = []
    private_subnets = []

    for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
        # Public subnet
        public_subnet = aws.ec2.Subnet(
            f"{project_name}-public-subnet-{i+1}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i+1}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags={**tags, "Name": f"{project_name}-public-subnet-{i+1}"}
        )
        public_subnets.append(public_subnet)

        # Private subnet
        private_subnet = aws.ec2.Subnet(
            f"{project_name}-private-subnet-{i+1}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i+10}.0/24",
            availability_zone=az,
            tags={**tags, "Name": f"{project_name}-private-subnet-{i+1}"}
        )
        private_subnets.append(private_subnet)

    # NAT Gateways
    nat_gateways = []
    for i, public_subnet in enumerate(public_subnets):
        # Elastic IP for NAT Gateway
        eip = aws.ec2.Eip(
            f"{project_name}-nat-eip-{i+1}",
            domain="vpc",
            tags={**tags, "Name": f"{project_name}-nat-eip-{i+1}"}
        )

        # NAT Gateway
        nat_gw = aws.ec2.NatGateway(
            f"{project_name}-nat-gw-{i+1}",
            allocation_id=eip.id,
            subnet_id=public_subnet.id,
            tags={**tags, "Name": f"{project_name}-nat-gw-{i+1}"}
        )
        nat_gateways.append(nat_gw)

    # Route tables
    # Public route table
    public_rt = aws.ec2.RouteTable(
        f"{project_name}-public-rt",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"{project_name}-public-rt"}
    )

    # Public route
    aws.ec2.Route(
        f"{project_name}-public-route",
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(public_subnets):
        aws.ec2.RouteTableAssociation(
            f"{project_name}-public-rta-{i+1}",
            subnet_id=subnet.id,
            route_table_id=public_rt.id
        )

    # Private route tables (one per AZ for high availability)
    for i, (private_subnet, nat_gw) in enumerate(zip(private_subnets, nat_gateways)):
        private_rt = aws.ec2.RouteTable(
            f"{project_name}-private-rt-{i+1}",
            vpc_id=vpc.id,
            tags={**tags, "Name": f"{project_name}-private-rt-{i+1}"}
        )

        # Private route through NAT Gateway
        aws.ec2.Route(
            f"{project_name}-private-route-{i+1}",
            route_table_id=private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gw.id
        )

        # Associate private subnet with private route table
        aws.ec2.RouteTableAssociation(
            f"{project_name}-private-rta-{i+1}",
            subnet_id=private_subnet.id,
            route_table_id=private_rt.id
        )

    return {
        "vpc": vpc,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "internet_gateway": igw,
        "nat_gateways": nat_gateways
    }
```

### infrastructure/modules/security.py

```python
import pulumi
import pulumi_aws as aws
import json

def create_security_groups(vpc, project_name: str, tags: dict):
    """Create security groups for different components"""

    # ALB Security Group
    alb_sg = aws.ec2.SecurityGroup(
        f"{project_name}-alb-sg",
        name=f"{project_name}-alb-sg",
        description="Security group for Application Load Balancer",
        vpc_id=vpc.id,
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
        tags={**tags, "Name": f"{project_name}-alb-sg"}
    )

    # ECS Security Group
    ecs_sg = aws.ec2.SecurityGroup(
        f"{project_name}-ecs-sg",
        name=f"{project_name}-ecs-sg",
        description="Security group for ECS tasks",
        vpc_id=vpc.id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=8000,
                to_port=8000,
                security_groups=[alb_sg.id]
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
        tags={**tags, "Name": f"{project_name}-ecs-sg"}
    )

    # Database Security Group
    db_sg = aws.ec2.SecurityGroup(
        f"{project_name}-db-sg",
        name=f"{project_name}-db-sg",
        description="Security group for RDS database",
        vpc_id=vpc.id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                security_groups=[ecs_sg.id]
            )
        ],
        tags={**tags, "Name": f"{project_name}-db-sg"}
    )

    # Cache Security Group
    cache_sg = aws.ec2.SecurityGroup(
        f"{project_name}-cache-sg",
        name=f"{project_name}-cache-sg",
        description="Security group for Redis cache",
        vpc_id=vpc.id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=6379,
                to_port=6379,
                security_groups=[ecs_sg.id]
            )
        ],
        tags={**tags, "Name": f"{project_name}-cache-sg"}
    )

    return {
        "alb_security_group": alb_sg,
        "ecs_security_group": ecs_sg,
        "db_security_group": db_sg,
        "cache_security_group": cache_sg
    }

def create_iam_roles(project_name: str, tags: dict):
    """Create IAM roles for ECS tasks and services"""

    # ECS Task Execution Role
    task_execution_role = aws.iam.Role(
        f"{project_name}-ecs-task-execution-role",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }
            ]
        }),
        tags=tags
    )

    # Attach AWS managed policy
    aws.iam.RolePolicyAttachment(
        f"{project_name}-ecs-task-execution-role-policy",
        role=task_execution_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    )

    # Custom policy for Secrets Manager access
    secrets_policy = aws.iam.RolePolicy(
        f"{project_name}-secrets-policy",
        role=task_execution_role.id,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": f"arn:aws:secretsmanager:us-west-2:*:secret:{project_name}/*"
                }
            ]
        })
    )

    # ECS Task Role
    task_role = aws.iam.Role(
        f"{project_name}-ecs-task-role",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }
            ]
        }),
        tags=tags
    )

    # Custom policy for application permissions
    app_policy = aws.iam.RolePolicy(
        f"{project_name}-app-policy",
        role=task_role.id,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "cloudwatch:PutMetricData",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "*"
                }
            ]
        })
    )

    return {
        "task_execution_role": task_execution_role,
        "task_role": task_role
    }
```

### infrastructure/modules/database.py

```python
import pulumi
import pulumi_aws as aws

def create_rds_instance(private_subnets, db_security_group, project_name: str, tags: dict):
    """Create RDS PostgreSQL instance with Multi-AZ deployment"""

    # DB Subnet Group
    db_subnet_group = aws.rds.SubnetGroup(
        f"{project_name}-db-subnet-group",
        subnet_ids=[subnet.id for subnet in private_subnets],
        tags={**tags, "Name": f"{project_name}-db-subnet-group"}
    )

    # Database credentials in Secrets Manager
    db_credentials = aws.secretsmanager.Secret(
        f"{project_name}-db-credentials",
        name=f"{project_name}/database/credentials",
        description="Database credentials for microservices application",
        tags=tags
    )

    # Generate random password
    db_password = aws.secretsmanager.SecretVersion(
        f"{project_name}-db-password",
        secret_id=db_credentials.id,
        secret_string=pulumi.Output.secret("""{
            "username": "dbadmin",
            "password": "ChangeMe123!",
            "engine": "postgres",
            "host": "",
            "port": 5432,
            "dbname": "microservicesdb"
        }""")
    )

    # RDS Instance
    db_instance = aws.rds.Instance(
        f"{project_name}-db",
        identifier=f"{project_name}-db",
        engine="postgres",
        engine_version="13.7",
        instance_class="db.t3.micro",
        allocated_storage=20,
        max_allocated_storage=100,
        storage_encrypted=True,

        db_name="microservicesdb",
        username="dbadmin",
        password="ChangeMe123!",  # In production, use Secrets Manager

        vpc_security_group_ids=[db_security_group.id],
        db_subnet_group_name=db_subnet_group.name,

        # High Availability
        multi_az=True,

        # Backup configuration
        backup_retention_period=7,
        backup_window="03:00-04:00",
        maintenance_window="sun:04:00-sun:05:00",

        # Monitoring
        monitoring_interval=60,
        performance_insights_enabled=True,

        # Security
        deletion_protection=False,  # Set to True in production
        skip_final_snapshot=True,   # Set to False in production

        tags={**tags, "Name": f"{project_name}-db"}
    )

    # Read Replica for performance
    read_replica = aws.rds.Instance(
        f"{project_name}-db-read-replica",
        identifier=f"{project_name}-db-read-replica",
        replicate_source_db=db_instance.id,
        instance_class="db.t3.micro",
        publicly_accessible=False,
        tags={**tags, "Name": f"{project_name}-db-read-replica"}
    )

    return {
        "db_instance": db_instance,
        "read_replica": read_replica,
        "db_credentials_secret": db_credentials,
        "db_subnet_group": db_subnet_group
    }
```

### infrastructure/modules/cache.py

```python
import pulumi
import pulumi_aws as aws

def create_redis_cluster(private_subnets, cache_security_group, project_name: str, tags: dict):
    """Create ElastiCache Redis cluster"""

    # Cache Subnet Group
    cache_subnet_group = aws.elasticache.SubnetGroup(
        f"{project_name}-cache-subnet-group",
        subnet_ids=[subnet.id for subnet in private_subnets],
        tags=tags
    )

    # Redis Replication Group
    redis_cluster = aws.elasticache.ReplicationGroup(
        f"{project_name}-redis",
        replication_group_id=f"{project_name}-redis",
        description="Redis cluster for microservices application",

        # Configuration
        node_type="cache.t3.micro",
        port=6379,
        parameter_group_name="default.redis6.x",

        # High Availability
        num_cache_clusters=2,
        automatic_failover_enabled=True,
        multi_az_enabled=True,

        # Security
        subnet_group_name=cache_subnet_group.name,
        security_group_ids=[cache_security_group.id],
        at_rest_encryption_enabled=True,
        transit_encryption_enabled=True,

        # Backup
        snapshot_retention_limit=5,
        snapshot_window="03:00-05:00",
        maintenance_window="sun:05:00-sun:07:00",

        tags=tags
    )

    return {
        "redis_cluster": redis_cluster,
        "cache_subnet_group": cache_subnet_group
    }
```

### infrastructure/modules/ecr.py

```python
import pulumi
import pulumi_aws as aws
import json

def create_ecr_repository(project_name: str, tags: dict):
    """Create ECR repository for container images"""

    # ECR Repository
    repository = aws.ecr.Repository(
        f"{project_name}-app",
        name=f"{project_name}-app",
        image_tag_mutability="MUTABLE",

        # Image scanning
        image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
            scan_on_push=True
        ),

        # Encryption
        encryption_configuration=aws.ecr.RepositoryEncryptionConfigurationArgs(
            encryption_type="AES256"
        ),

        tags=tags
    )

    # Lifecycle Policy
    lifecycle_policy = aws.ecr.LifecyclePolicy(
        f"{project_name}-lifecycle-policy",
        repository=repository.name,
        policy=json.dumps({
            "rules": [
                {
                    "rulePriority": 1,
                    "description": "Keep last 10 production images",
                    "selection": {
                        "tagStatus": "tagged",
                        "tagPrefixList": ["prod"],
                        "countType": "imageCountMoreThan",
                        "countNumber": 10
                    },
                    "action": {
                        "type": "expire"
                    }
                },
                {
                    "rulePriority": 2,
                    "description": "Keep last 5 development images",
                    "selection": {
                        "tagStatus": "tagged",
                        "tagPrefixList": ["dev"],
                        "countType": "imageCountMoreThan",
                        "countNumber": 5
                    },
                    "action": {
                        "type": "expire"
                    }
                },
                {
                    "rulePriority": 3,
                    "description": "Delete untagged images older than 1 day",
                    "selection": {
                        "tagStatus": "untagged",
                        "countType": "sinceImagePushed",
                        "countUnit": "days",
                        "countNumber": 1
                    },
                    "action": {
                        "type": "expire"
                    }
                }
            ]
        })
    )

    # Repository Policy for CI/CD access
    repository_policy = aws.ecr.RepositoryPolicy(
        f"{project_name}-repo-policy",
        repository=repository.name,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowPushPull",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"
                    },
                    "Action": [
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage",
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:PutImage",
                        "ecr:InitiateLayerUpload",
                        "ecr:UploadLayerPart",
                        "ecr:CompleteLayerUpload"
                    ]
                }
            ]
        })
    )

    return {
        "repository": repository,
        "lifecycle_policy": lifecycle_policy,
        "repository_policy": repository_policy
    }
```

### infrastructure/modules/ecs.py

```python
import pulumi
import pulumi_aws as aws
import json

def create_ecs_cluster(vpc_resources, security_resources, iam_resources, db_resources, cache_resources, ecr_resources, project_name: str, tags: dict):
    """Create ECS cluster, task definition, and service"""

    # S3 bucket for build artifacts
    artifacts_bucket = aws.s3.Bucket(
        f"{project_name}-artifacts",
        bucket=f"{project_name}-artifacts-{pulumi.get_stack()}",
        versioning=aws.s3.BucketVersioningArgs(enabled=True),
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        ),
        tags=tags
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(
        f"{project_name}-artifacts-pab",
        bucket=artifacts_bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True
    )

    # Application Load Balancer
    alb = aws.elbv2.LoadBalancer(
        f"{project_name}-alb",
        name=f"{project_name}-alb",
        load_balancer_type="application",
        security_groups=[security_resources["alb_security_group"].id],
        subnets=[subnet.id for subnet in vpc_resources["public_subnets"]],
        enable_deletion_protection=False,  # Set to True in production
        tags=tags
    )

    # Target Group
    target_group = aws.elbv2.TargetGroup(
        f"{project_name}-tg",
        name=f"{project_name}-tg",
        port=8000,
        protocol="HTTP",
        vpc_id=vpc_resources["vpc"].id,
        target_type="ip",

        # Health check configuration
        health_check=aws.elbv2.TargetGroupHealthCheckArgs(
            enabled=True,
            healthy_threshold=2,
            unhealthy_threshold=2,
            timeout=5,
            interval=30,
            path="/health",
            matcher="200",
            protocol="HTTP",
            port="traffic-port"
        ),

        tags=tags
    )

    # ALB Listener
    listener = aws.elbv2.Listener(
        f"{project_name}-listener",
        load_balancer_arn=alb.arn,
        port="80",
        protocol="HTTP",
        default_actions=[
            aws.elbv2.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )
        ]
    )

    # ECS Cluster
    cluster = aws.ecs.Cluster(
        f"{project_name}-cluster",
        name=f"{project_name}-cluster",

        # Enable Container Insights
        settings=[
            aws.ecs.ClusterSettingArgs(
                name="containerInsights",
                value="enabled"
            )
        ],

        tags=tags
    )

    # CloudWatch Log Group
    log_group = aws.cloudwatch.LogGroup(
        f"{project_name}-logs",
        name=f"/ecs/{project_name}",
        retention_in_days=14,
        tags=tags
    )

    # Task Definition
    task_definition = aws.ecs.TaskDefinition(
        f"{project_name}-task",
        family=f"{project_name}-task",
        network_mode="awsvpc",
        requires_compatibilities=["FARGATE"],
        cpu="256",
        memory="512",
        execution_role_arn=iam_resources["task_execution_role"].arn,
        task_role_arn=iam_resources["task_role"].arn,

        container_definitions=pulumi.Output.all(
            ecr_resources["repository"].repository_url,
            db_resources["db_instance"].endpoint,
            cache_resources["redis_cluster"].primary_endpoint_address
        ).apply(lambda args: json.dumps([
            {
                "name": f"{project_name}-app",
                "image": f"{args[0]}:latest",
                "portMappings": [
                    {
                        "containerPort": 8000,
                        "protocol": "tcp"
                    }
                ],
                "environment": [
                    {
                        "name": "DB_HOST",
                        "value": args[1]
                    },
                    {
                        "name": "REDIS_HOST",
                        "value": args[2]
                    },
                    {
                        "name": "ENVIRONMENT",
                        "value": "production"
                    }
                ],
                "secrets": [
                    {
                        "name": "DB_PASSWORD",
                        "valueFrom": f"{db_resources['db_credentials_secret'].arn}:password::"
                    }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": log_group.name,
                        "awslogs-region": "us-west-2",
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "healthCheck": {
                    "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
                    "interval": 30,
                    "timeout": 5,
                    "retries": 3,
                    "startPeriod": 60
                }
            }
        ])),

        tags=tags
    )

    # ECS Service
    service = aws.ecs.Service(
        f"{project_name}-service",
        name=f"{project_name}-service",
        cluster=cluster.id,
        task_definition=task_definition.arn,
        desired_count=2,
        launch_type="FARGATE",

        # Network configuration
        network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
            subnets=[subnet.id for subnet in vpc_resources["private_subnets"]],
            security_groups=[security_resources["ecs_security_group"].id],
            assign_public_ip=False
        ),

        # Load balancer configuration
        load_balancers=[
            aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=target_group.arn,
                container_name=f"{project_name}-app",
                container_port=8000
            )
        ],

        # Deployment configuration
        deployment_configuration=aws.ecs.ServiceDeploymentConfigurationArgs(
            maximum_percent=200,
            minimum_healthy_percent=50
        ),

        # Auto Scaling
```
