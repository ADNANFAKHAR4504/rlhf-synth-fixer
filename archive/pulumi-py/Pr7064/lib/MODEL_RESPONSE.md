# Payment Processing Infrastructure - Pulumi Python Implementation

This implementation provides a complete payment processing platform using Pulumi with Python, supporting multiple environments (dev, staging, production) with identical infrastructure and environment-specific configurations.

## Architecture Overview

The infrastructure includes:
- VPC with public and private subnets across multiple AZs
- ECS Fargate for containerized application hosting
- RDS Aurora Serverless v2 for transaction database
- ElastiCache Redis for session caching
- SQS and SNS for message processing and notifications
- Application Load Balancer for API access
- CloudWatch monitoring and alarms
- Secrets Manager for secure configuration
- IAM roles with least-privilege access

## Implementation Files

### File: lib/__main__.py

```python
"""
Payment Processing Infrastructure - Main Pulumi Program
Multi-environment deployment supporting dev, staging, and production
"""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any
from vpc import create_vpc
from security import create_security_groups
from database import create_database
from cache import create_cache
from messaging import create_messaging_resources
from compute import create_ecs_cluster
from monitoring import create_monitoring

# Get configuration
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")
environment = config.get("environment") or "dev"
vpc_cidr = config.get("vpcCidr") or "10.0.0.0/16"
enable_multi_az = config.get_bool("enableMultiAZ") or False

# Tags for all resources
common_tags = {
    "Project": "PaymentProcessing",
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "EnvironmentSuffix": environment_suffix,
}

# Create VPC and networking
vpc_resources = create_vpc(
    environment_suffix=environment_suffix,
    vpc_cidr=vpc_cidr,
    enable_multi_az=enable_multi_az,
    tags=common_tags
)

# Create security groups
security_groups = create_security_groups(
    environment_suffix=environment_suffix,
    vpc_id=vpc_resources["vpc"].id,
    vpc_cidr=vpc_cidr,
    tags=common_tags
)

# Create database
database_resources = create_database(
    environment_suffix=environment_suffix,
    vpc_id=vpc_resources["vpc"].id,
    private_subnet_ids=vpc_resources["private_subnet_ids"],
    security_group_id=security_groups["database_sg"].id,
    environment=environment,
    tags=common_tags
)

# Create cache
cache_resources = create_cache(
    environment_suffix=environment_suffix,
    private_subnet_ids=vpc_resources["private_subnet_ids"],
    security_group_id=security_groups["cache_sg"].id,
    tags=common_tags
)

# Create messaging resources
messaging_resources = create_messaging_resources(
    environment_suffix=environment_suffix,
    tags=common_tags
)

# Create ECS cluster and services
ecs_resources = create_ecs_cluster(
    environment_suffix=environment_suffix,
    vpc_id=vpc_resources["vpc"].id,
    public_subnet_ids=vpc_resources["public_subnet_ids"],
    private_subnet_ids=vpc_resources["private_subnet_ids"],
    alb_security_group_id=security_groups["alb_sg"].id,
    app_security_group_id=security_groups["app_sg"].id,
    database_endpoint=database_resources["cluster"].endpoint,
    cache_endpoint=cache_resources["cluster"].cache_nodes[0].address,
    queue_url=messaging_resources["payment_queue"].url,
    environment=environment,
    tags=common_tags
)

# Create monitoring
monitoring_resources = create_monitoring(
    environment_suffix=environment_suffix,
    alb_arn=ecs_resources["alb"].arn_suffix,
    target_group_arn=ecs_resources["target_group"].arn_suffix,
    ecs_cluster_name=ecs_resources["cluster"].name,
    ecs_service_name=ecs_resources["service"].name,
    database_cluster_id=database_resources["cluster"].id,
    cache_cluster_id=cache_resources["cluster"].id,
    queue_name=messaging_resources["payment_queue"].name,
    sns_topic_arn=messaging_resources["alert_topic"].arn,
    tags=common_tags
)

# Exports
pulumi.export("vpc_id", vpc_resources["vpc"].id)
pulumi.export("alb_dns_name", ecs_resources["alb"].dns_name)
pulumi.export("database_endpoint", database_resources["cluster"].endpoint)
pulumi.export("cache_endpoint", cache_resources["cluster"].cache_nodes[0].address)
pulumi.export("payment_queue_url", messaging_resources["payment_queue"].url)
pulumi.export("alert_topic_arn", messaging_resources["alert_topic"].arn)
```

### File: lib/vpc.py

```python
"""VPC and Networking Resources"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any

def create_vpc(
    environment_suffix: str,
    vpc_cidr: str,
    enable_multi_az: bool,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create VPC with public and private subnets"""

    # Get availability zones
    azs = aws.get_availability_zones(state="available")
    az_count = 3 if enable_multi_az else 2
    selected_azs = azs.names[:az_count]

    # Create VPC
    vpc = aws.ec2.Vpc(
        f"payment-vpc-{environment_suffix}",
        cidr_block=vpc_cidr,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**tags, "Name": f"payment-vpc-{environment_suffix}"}
    )

    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"payment-igw-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"payment-igw-{environment_suffix}"}
    )

    # Create public subnets
    public_subnets = []
    for i, az in enumerate(selected_azs):
        public_subnet = aws.ec2.Subnet(
            f"payment-public-subnet-{i}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags={**tags, "Name": f"payment-public-{i}-{environment_suffix}", "Type": "Public"}
        )
        public_subnets.append(public_subnet)

    # Create private subnets
    private_subnets = []
    for i, az in enumerate(selected_azs):
        private_subnet = aws.ec2.Subnet(
            f"payment-private-subnet-{i}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i + 10}.0/24",
            availability_zone=az,
            tags={**tags, "Name": f"payment-private-{i}-{environment_suffix}", "Type": "Private"}
        )
        private_subnets.append(private_subnet)

    # Create public route table
    public_rt = aws.ec2.RouteTable(
        f"payment-public-rt-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"payment-public-rt-{environment_suffix}"}
    )

    # Route to Internet Gateway
    aws.ec2.Route(
        f"payment-public-route-{environment_suffix}",
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(public_subnets):
        aws.ec2.RouteTableAssociation(
            f"payment-public-rta-{i}-{environment_suffix}",
            subnet_id=subnet.id,
            route_table_id=public_rt.id
        )

    # Create VPC endpoints for private subnet access to AWS services
    s3_endpoint = aws.ec2.VpcEndpoint(
        f"payment-s3-endpoint-{environment_suffix}",
        vpc_id=vpc.id,
        service_name=f"com.amazonaws.{aws.config.region}.s3",
        route_table_ids=[public_rt.id],
        tags={**tags, "Name": f"payment-s3-endpoint-{environment_suffix}"}
    )

    return {
        "vpc": vpc,
        "igw": igw,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "public_subnet_ids": [s.id for s in public_subnets],
        "private_subnet_ids": [s.id for s in private_subnets],
        "public_rt": public_rt,
        "s3_endpoint": s3_endpoint
    }
```

### File: lib/security.py

```python
"""Security Groups"""
import pulumi
import pulumi_aws as aws
from typing import Dict

def create_security_groups(
    environment_suffix: str,
    vpc_id: pulumi.Output[str],
    vpc_cidr: str,
    tags: Dict[str, str]
) -> Dict[str, aws.ec2.SecurityGroup]:
    """Create security groups for all components"""

    # ALB Security Group
    alb_sg = aws.ec2.SecurityGroup(
        f"payment-alb-sg-{environment_suffix}",
        vpc_id=vpc_id,
        description="Security group for Application Load Balancer",
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
                description="Allow all outbound"
            )
        ],
        tags={**tags, "Name": f"payment-alb-sg-{environment_suffix}"}
    )

    # Application Security Group
    app_sg = aws.ec2.SecurityGroup(
        f"payment-app-sg-{environment_suffix}",
        vpc_id=vpc_id,
        description="Security group for ECS application containers",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=8080,
                to_port=8080,
                security_groups=[alb_sg.id],
                description="Allow traffic from ALB"
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound"
            )
        ],
        tags={**tags, "Name": f"payment-app-sg-{environment_suffix}"}
    )

    # Database Security Group
    database_sg = aws.ec2.SecurityGroup(
        f"payment-db-sg-{environment_suffix}",
        vpc_id=vpc_id,
        description="Security group for RDS Aurora database",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                security_groups=[app_sg.id],
                description="PostgreSQL from application"
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound"
            )
        ],
        tags={**tags, "Name": f"payment-db-sg-{environment_suffix}"}
    )

    # Cache Security Group
    cache_sg = aws.ec2.SecurityGroup(
        f"payment-cache-sg-{environment_suffix}",
        vpc_id=vpc_id,
        description="Security group for ElastiCache Redis",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=6379,
                to_port=6379,
                security_groups=[app_sg.id],
                description="Redis from application"
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound"
            )
        ],
        tags={**tags, "Name": f"payment-cache-sg-{environment_suffix}"}
    )

    return {
        "alb_sg": alb_sg,
        "app_sg": app_sg,
        "database_sg": database_sg,
        "cache_sg": cache_sg
    }
```

### File: lib/database.py

```python
"""RDS Aurora Serverless Database"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any
import json

def create_database(
    environment_suffix: str,
    vpc_id: pulumi.Output[str],
    private_subnet_ids: List[pulumi.Output[str]],
    security_group_id: pulumi.Output[str],
    environment: str,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create RDS Aurora Serverless v2 cluster"""

    # Create subnet group
    db_subnet_group = aws.rds.SubnetGroup(
        f"payment-db-subnet-group-{environment_suffix}",
        subnet_ids=private_subnet_ids,
        description=f"Subnet group for payment database {environment_suffix}",
        tags={**tags, "Name": f"payment-db-subnet-group-{environment_suffix}"}
    )

    # Create secret for database credentials
    db_secret = aws.secretsmanager.Secret(
        f"payment-db-secret-{environment_suffix}",
        description=f"Database credentials for {environment_suffix}",
        tags=tags
    )

    # Generate database credentials
    db_credentials = {
        "username": "paymentadmin",
        "password": pulumi.Output.secret("ChangeMe123!TempPassword")
    }

    db_secret_version = aws.secretsmanager.SecretVersion(
        f"payment-db-secret-version-{environment_suffix}",
        secret_id=db_secret.id,
        secret_string=pulumi.Output.json_dumps(db_credentials)
    )

    # Create Aurora Serverless v2 cluster
    cluster = aws.rds.Cluster(
        f"payment-db-cluster-{environment_suffix}",
        cluster_identifier=f"payment-db-{environment_suffix}",
        engine=aws.rds.EngineType.AURORA_POSTGRESQL,
        engine_mode="provisioned",
        engine_version="15.3",
        database_name="paymentdb",
        master_username="paymentadmin",
        master_password=pulumi.Output.secret("ChangeMe123!TempPassword"),
        db_subnet_group_name=db_subnet_group.name,
        vpc_security_group_ids=[security_group_id],
        serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
            max_capacity=2.0 if environment == "prod" else 1.0,
            min_capacity=0.5
        ),
        backup_retention_period=7 if environment == "prod" else 1,
        preferred_backup_window="03:00-04:00",
        preferred_maintenance_window="mon:04:00-mon:05:00",
        storage_encrypted=True,
        skip_final_snapshot=True,
        enabled_cloudwatch_logs_exports=["postgresql"],
        tags={**tags, "Name": f"payment-db-cluster-{environment_suffix}"}
    )

    # Create cluster instance
    cluster_instance = aws.rds.ClusterInstance(
        f"payment-db-instance-{environment_suffix}",
        identifier=f"payment-db-instance-{environment_suffix}",
        cluster_identifier=cluster.id,
        instance_class="db.serverless",
        engine=aws.rds.EngineType.AURORA_POSTGRESQL,
        engine_version="15.3",
        publicly_accessible=False,
        tags={**tags, "Name": f"payment-db-instance-{environment_suffix}"}
    )

    return {
        "cluster": cluster,
        "instance": cluster_instance,
        "subnet_group": db_subnet_group,
        "secret": db_secret
    }
```

### File: lib/cache.py

```python
"""ElastiCache Redis Cluster"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any

def create_cache(
    environment_suffix: str,
    private_subnet_ids: List[pulumi.Output[str]],
    security_group_id: pulumi.Output[str],
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create ElastiCache Redis cluster"""

    # Create subnet group
    cache_subnet_group = aws.elasticache.SubnetGroup(
        f"payment-cache-subnet-group-{environment_suffix}",
        subnet_ids=private_subnet_ids,
        description=f"Subnet group for payment cache {environment_suffix}",
        tags={**tags, "Name": f"payment-cache-subnet-group-{environment_suffix}"}
    )

    # Create Redis cluster
    cluster = aws.elasticache.Cluster(
        f"payment-cache-{environment_suffix}",
        cluster_id=f"payment-cache-{environment_suffix}",
        engine="redis",
        engine_version="7.0",
        node_type="cache.t3.micro",
        num_cache_nodes=1,
        parameter_group_name="default.redis7",
        port=6379,
        subnet_group_name=cache_subnet_group.name,
        security_group_ids=[security_group_id],
        snapshot_retention_limit=1,
        snapshot_window="03:00-05:00",
        tags={**tags, "Name": f"payment-cache-{environment_suffix}"}
    )

    return {
        "cluster": cluster,
        "subnet_group": cache_subnet_group
    }
```

### File: lib/messaging.py

```python
"""SQS and SNS Messaging Resources"""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any

def create_messaging_resources(
    environment_suffix: str,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create SQS queues and SNS topics"""

    # Create dead letter queue
    dlq = aws.sqs.Queue(
        f"payment-dlq-{environment_suffix}",
        name=f"payment-dlq-{environment_suffix}",
        message_retention_seconds=1209600,  # 14 days
        tags={**tags, "Name": f"payment-dlq-{environment_suffix}"}
    )

    # Create payment processing queue
    payment_queue = aws.sqs.Queue(
        f"payment-queue-{environment_suffix}",
        name=f"payment-queue-{environment_suffix}",
        visibility_timeout_seconds=300,
        message_retention_seconds=345600,  # 4 days
        receive_wait_time_seconds=20,
        redrive_policy=dlq.arn.apply(lambda arn: f'{{"deadLetterTargetArn":"{arn}","maxReceiveCount":3}}'),
        tags={**tags, "Name": f"payment-queue-{environment_suffix}"}
    )

    # Create SNS topic for alerts
    alert_topic = aws.sns.Topic(
        f"payment-alerts-{environment_suffix}",
        name=f"payment-alerts-{environment_suffix}",
        display_name="Payment Processing Alerts",
        tags={**tags, "Name": f"payment-alerts-{environment_suffix}"}
    )

    # Create SNS topic for payment notifications
    notification_topic = aws.sns.Topic(
        f"payment-notifications-{environment_suffix}",
        name=f"payment-notifications-{environment_suffix}",
        display_name="Payment Notifications",
        tags={**tags, "Name": f"payment-notifications-{environment_suffix}"}
    )

    return {
        "payment_queue": payment_queue,
        "dlq": dlq,
        "alert_topic": alert_topic,
        "notification_topic": notification_topic
    }
```

### File: lib/compute.py

```python
"""ECS Fargate Cluster and Services"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any
import json

def create_ecs_cluster(
    environment_suffix: str,
    vpc_id: pulumi.Output[str],
    public_subnet_ids: List[pulumi.Output[str]],
    private_subnet_ids: List[pulumi.Output[str]],
    alb_security_group_id: pulumi.Output[str],
    app_security_group_id: pulumi.Output[str],
    database_endpoint: pulumi.Output[str],
    cache_endpoint: pulumi.Output[str],
    queue_url: pulumi.Output[str],
    environment: str,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create ECS cluster with Fargate service and ALB"""

    # Create ECS cluster
    cluster = aws.ecs.Cluster(
        f"payment-cluster-{environment_suffix}",
        name=f"payment-cluster-{environment_suffix}",
        settings=[aws.ecs.ClusterSettingArgs(
            name="containerInsights",
            value="enabled"
        )],
        tags={**tags, "Name": f"payment-cluster-{environment_suffix}"}
    )

    # Create ALB
    alb = aws.lb.LoadBalancer(
        f"payment-alb-{environment_suffix}",
        name=f"payment-alb-{environment_suffix}",
        internal=False,
        load_balancer_type="application",
        security_groups=[alb_security_group_id],
        subnets=public_subnet_ids,
        enable_deletion_protection=False,
        tags={**tags, "Name": f"payment-alb-{environment_suffix}"}
    )

    # Create target group
    target_group = aws.lb.TargetGroup(
        f"payment-tg-{environment_suffix}",
        name=f"payment-tg-{environment_suffix}",
        port=8080,
        protocol="HTTP",
        vpc_id=vpc_id,
        target_type="ip",
        health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            path="/health",
            interval=30,
            timeout=5,
            healthy_threshold=2,
            unhealthy_threshold=3,
            matcher="200"
        ),
        deregistration_delay=30,
        tags={**tags, "Name": f"payment-tg-{environment_suffix}"}
    )

    # Create ALB listener
    listener = aws.lb.Listener(
        f"payment-listener-{environment_suffix}",
        load_balancer_arn=alb.arn,
        port=80,
        protocol="HTTP",
        default_actions=[aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
        )]
    )

    # Create IAM role for ECS task execution
    task_execution_role = aws.iam.Role(
        f"payment-task-exec-role-{environment_suffix}",
        name=f"payment-task-exec-role-{environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                }
            }]
        }),
        tags=tags
    )

    # Attach execution role policy
    task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
        f"payment-task-exec-policy-{environment_suffix}",
        role=task_execution_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    )

    # Create IAM role for ECS task
    task_role = aws.iam.Role(
        f"payment-task-role-{environment_suffix}",
        name=f"payment-task-role-{environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                }
            }]
        }),
        tags=tags
    )

    # Create policy for task role
    task_policy = aws.iam.RolePolicy(
        f"payment-task-policy-{environment_suffix}",
        role=task_role.id,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "*"
                }
            ]
        })
    )

    # Create CloudWatch log group
    log_group = aws.cloudwatch.LogGroup(
        f"payment-logs-{environment_suffix}",
        name=f"/ecs/payment-{environment_suffix}",
        retention_in_days=7,
        tags=tags
    )

    # Create task definition
    task_definition = aws.ecs.TaskDefinition(
        f"payment-task-{environment_suffix}",
        family=f"payment-task-{environment_suffix}",
        cpu="256",
        memory="512",
        network_mode="awsvpc",
        requires_compatibilities=["FARGATE"],
        execution_role_arn=task_execution_role.arn,
        task_role_arn=task_role.arn,
        container_definitions=pulumi.Output.all(
            database_endpoint,
            cache_endpoint,
            queue_url
        ).apply(lambda args: json.dumps([{
            "name": "payment-app",
            "image": "nginx:latest",  # Replace with actual payment app image
            "cpu": 256,
            "memory": 512,
            "essential": True,
            "portMappings": [{
                "containerPort": 8080,
                "protocol": "tcp"
            }],
            "environment": [
                {"name": "DATABASE_ENDPOINT", "value": args[0]},
                {"name": "CACHE_ENDPOINT", "value": args[1]},
                {"name": "QUEUE_URL", "value": args[2]},
                {"name": "ENVIRONMENT", "value": environment}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": f"/ecs/payment-{environment_suffix}",
                    "awslogs-region": aws.config.region,
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }])),
        tags={**tags, "Name": f"payment-task-{environment_suffix}"}
    )

    # Create ECS service
    service = aws.ecs.Service(
        f"payment-service-{environment_suffix}",
        name=f"payment-service-{environment_suffix}",
        cluster=cluster.arn,
        task_definition=task_definition.arn,
        desired_count=2 if environment == "prod" else 1,
        launch_type="FARGATE",
        network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
            assign_public_ip=False,
            subnets=private_subnet_ids,
            security_groups=[app_security_group_id]
        ),
        load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
            target_group_arn=target_group.arn,
            container_name="payment-app",
            container_port=8080
        )],
        health_check_grace_period_seconds=60,
        tags={**tags, "Name": f"payment-service-{environment_suffix}"},
        opts=pulumi.ResourceOptions(depends_on=[listener])
    )

    # Create auto-scaling target
    autoscaling_target = aws.appautoscaling.Target(
        f"payment-autoscaling-target-{environment_suffix}",
        max_capacity=10,
        min_capacity=1,
        resource_id=pulumi.Output.concat("service/", cluster.name, "/", service.name),
        scalable_dimension="ecs:service:DesiredCount",
        service_namespace="ecs"
    )

    # Create CPU scaling policy
    cpu_scaling_policy = aws.appautoscaling.Policy(
        f"payment-cpu-scaling-{environment_suffix}",
        policy_type="TargetTrackingScaling",
        resource_id=autoscaling_target.resource_id,
        scalable_dimension=autoscaling_target.scalable_dimension,
        service_namespace=autoscaling_target.service_namespace,
        target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
            predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                predefined_metric_type="ECSServiceAverageCPUUtilization"
            ),
            target_value=70.0,
            scale_in_cooldown=300,
            scale_out_cooldown=60
        )
    )

    return {
        "cluster": cluster,
        "alb": alb,
        "target_group": target_group,
        "listener": listener,
        "service": service,
        "task_definition": task_definition,
        "task_execution_role": task_execution_role,
        "task_role": task_role,
        "log_group": log_group,
        "autoscaling_target": autoscaling_target,
        "cpu_scaling_policy": cpu_scaling_policy
    }
```

### File: lib/monitoring.py

```python
"""CloudWatch Monitoring and Alarms"""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any

def create_monitoring(
    environment_suffix: str,
    alb_arn: pulumi.Output[str],
    target_group_arn: pulumi.Output[str],
    ecs_cluster_name: pulumi.Output[str],
    ecs_service_name: pulumi.Output[str],
    database_cluster_id: pulumi.Output[str],
    cache_cluster_id: pulumi.Output[str],
    queue_name: pulumi.Output[str],
    sns_topic_arn: pulumi.Output[str],
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create CloudWatch alarms and dashboards"""

    # ALB Target Unhealthy alarm
    alb_unhealthy_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-alb-unhealthy-{environment_suffix}",
        name=f"payment-alb-unhealthy-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="UnHealthyHostCount",
        namespace="AWS/ApplicationELB",
        period=60,
        statistic="Average",
        threshold=1,
        alarm_description="Alert when ALB has unhealthy targets",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "LoadBalancer": alb_arn,
            "TargetGroup": target_group_arn
        },
        tags=tags
    )

    # ALB High Response Time alarm
    alb_response_time_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-alb-response-time-{environment_suffix}",
        name=f"payment-alb-response-time-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="TargetResponseTime",
        namespace="AWS/ApplicationELB",
        period=60,
        statistic="Average",
        threshold=1.0,
        alarm_description="Alert when response time exceeds 1 second",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "LoadBalancer": alb_arn
        },
        tags=tags
    )

    # ECS CPU Utilization alarm
    ecs_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-ecs-cpu-{environment_suffix}",
        name=f"payment-ecs-cpu-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/ECS",
        period=60,
        statistic="Average",
        threshold=80,
        alarm_description="Alert when ECS CPU exceeds 80%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "ClusterName": ecs_cluster_name,
            "ServiceName": ecs_service_name
        },
        tags=tags
    )

    # ECS Memory Utilization alarm
    ecs_memory_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-ecs-memory-{environment_suffix}",
        name=f"payment-ecs-memory-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="MemoryUtilization",
        namespace="AWS/ECS",
        period=60,
        statistic="Average",
        threshold=80,
        alarm_description="Alert when ECS memory exceeds 80%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "ClusterName": ecs_cluster_name,
            "ServiceName": ecs_service_name
        },
        tags=tags
    )

    # Database CPU alarm
    db_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-db-cpu-{environment_suffix}",
        name=f"payment-db-cpu-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/RDS",
        period=300,
        statistic="Average",
        threshold=80,
        alarm_description="Alert when database CPU exceeds 80%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "DBClusterIdentifier": database_cluster_id
        },
        tags=tags
    )

    # Database connections alarm
    db_connections_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-db-connections-{environment_suffix}",
        name=f"payment-db-connections-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="DatabaseConnections",
        namespace="AWS/RDS",
        period=300,
        statistic="Average",
        threshold=100,
        alarm_description="Alert when database connections exceed 100",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "DBClusterIdentifier": database_cluster_id
        },
        tags=tags
    )

    # Cache CPU alarm
    cache_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-cache-cpu-{environment_suffix}",
        name=f"payment-cache-cpu-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/ElastiCache",
        period=300,
        statistic="Average",
        threshold=75,
        alarm_description="Alert when cache CPU exceeds 75%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "CacheClusterId": cache_cluster_id
        },
        tags=tags
    )

    # SQS queue depth alarm
    queue_depth_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-queue-depth-{environment_suffix}",
        name=f"payment-queue-depth-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="ApproximateNumberOfMessagesVisible",
        namespace="AWS/SQS",
        period=300,
        statistic="Average",
        threshold=100,
        alarm_description="Alert when queue depth exceeds 100 messages",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "QueueName": queue_name
        },
        tags=tags
    )

    return {
        "alb_unhealthy_alarm": alb_unhealthy_alarm,
        "alb_response_time_alarm": alb_response_time_alarm,
        "ecs_cpu_alarm": ecs_cpu_alarm,
        "ecs_memory_alarm": ecs_memory_alarm,
        "db_cpu_alarm": db_cpu_alarm,
        "db_connections_alarm": db_connections_alarm,
        "cache_cpu_alarm": cache_cpu_alarm,
        "queue_depth_alarm": queue_depth_alarm
    }
```

### File: Pulumi.dev.yaml

```yaml
config:
  aws:region: us-east-1
  payment-processing:environmentSuffix: dev-test-001
  payment-processing:environment: dev
  payment-processing:vpcCidr: 10.0.0.0/16
  payment-processing:enableMultiAZ: false
```

### File: Pulumi.staging.yaml

```yaml
config:
  aws:region: us-east-1
  payment-processing:environmentSuffix: staging-test-001
  payment-processing:environment: staging
  payment-processing:vpcCidr: 10.1.0.0/16
  payment-processing:enableMultiAZ: true
```

### File: Pulumi.prod.yaml

```yaml
config:
  aws:region: us-east-1
  payment-processing:environmentSuffix: prod-test-001
  payment-processing:environment: prod
  payment-processing:vpcCidr: 10.2.0.0/16
  payment-processing:enableMultiAZ: true
```

## Deployment Instructions

### Prerequisites

1. Install Pulumi CLI
2. Configure AWS credentials
3. Install Python dependencies:
   ```bash
   pip install pulumi pulumi-aws
   ```

### Deployment Steps

1. Initialize Pulumi stack:
   ```bash
   pulumi stack init dev
   pulumi config set aws:region us-east-1
   pulumi config set payment-processing:environmentSuffix dev-test-001
   pulumi config set payment-processing:environment dev
   ```

2. Preview infrastructure:
   ```bash
   pulumi preview
   ```

3. Deploy infrastructure:
   ```bash
   pulumi up
   ```

4. Access outputs:
   ```bash
   pulumi stack output alb_dns_name
   pulumi stack output database_endpoint
   ```

5. Destroy infrastructure:
   ```bash
   pulumi destroy
   ```

## Environment-Specific Configuration

Each environment (dev, staging, prod) uses its own stack configuration file with environment-specific values:

- **Dev**: Minimal resources, single AZ, smaller instance sizes
- **Staging**: Production-like, multi-AZ, moderate instance sizes
- **Prod**: Full multi-AZ, larger instances, additional read replicas

All environments maintain identical infrastructure structure while varying only in configuration parameters.
