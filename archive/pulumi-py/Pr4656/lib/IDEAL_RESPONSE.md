# Ideal Implementation: Blue-Green ECS Deployment with Pulumi

## Overview

This document describes the actual implementation of a blue-green deployment infrastructure on AWS using Pulumi with Python. The infrastructure enables zero-downtime deployments with automatic rollback capabilities for containerized applications.

## Architecture Components

### Core Infrastructure
1. VPC with 3 availability zones
2. Public, private, and database subnets
3. Internet Gateway and NAT Gateways
4. Security groups for ALB, ECS, and RDS
5. IAM roles with least privilege
6. RDS Aurora PostgreSQL with encryption
7. ECS Fargate cluster with Container Insights
8. Application Load Balancer with weighted routing
9. Blue and Green ECS services
10. CloudWatch monitoring and alarms
11. Auto-scaling based on CPU and memory

## Detailed Implementation


### 1. TapStackArgs Configuration Class

```python
class TapStackArgs:
    """
    Defines input arguments for the TapStack Pulumi component.
    
    Args:
        environment_suffix (Optional[str]): Environment identifier (e.g., 'dev', 'prod')
        tags (Optional[dict]): Optional default tags to apply to resources
    """
    
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags
```

### 2. TapStack ComponentResource

Main orchestration component that creates all infrastructure:

```python
class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi ComponentResource for blue-green ECS deployment.
    
    Orchestrates:
    - Networking: VPC, subnets, NAT gateways, routing
    - Security: Security groups and IAM roles
    - Database: RDS Aurora PostgreSQL with encryption
    - ECS: Fargate cluster with blue/green services and ALB
    - Monitoring: CloudWatch dashboards and alarms
    """
    
    def __init__(self, name: str, args: TapStackArgs, 
                 opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}
```

### 3. Configuration Management

All configuration is read inside the TapStack component:

```python
config = pulumi.Config()
project_name = config.get("project_name") or name
environment = self.environment_suffix

# Container settings
self.container_image = config.get("container_image") or "nginx:latest"
self.container_port = config.get_int("container_port") or 80
self.cpu = config.get_int("cpu") or 256
self.memory = config.get_int("memory") or 512

# Service settings
self.desired_count = config.get_int("desired_count") or 2
self.min_capacity = config.get_int("min_capacity") or 1
self.max_capacity = config.get_int("max_capacity") or 10

# Auto-scaling thresholds
self.scale_target_cpu = config.get_int("scale_target_cpu") or 70
self.scale_target_memory = config.get_int("scale_target_memory") or 80

# Traffic weights (blue-green)
self.blue_weight = config.get_int("blue_weight") or 100
self.green_weight = config.get_int("green_weight") or 0

# Database settings
self.db_username = config.get("db_username") or "dbadmin"
self.db_name = config.get("db_name") or "appdb"

# Monitoring
self.alert_email = config.get("alert_email")

# Common tags
common_tags = {
    **self.tags,
    "Project": project_name,
    "Environment": environment,
    "ManagedBy": "Pulumi"
}
```

### 4. NetworkingStack Component

Creates VPC, subnets, NAT gateways, and routing across 3 availability zones.

**Constructor:**
```python
class NetworkingStack:
    def __init__(self, name: str):
        self.name = name
```

Note: Missing config parameter from MODEL_RESPONSE.

**VPC Creation:**
```python
self.vpc = aws.ec2.Vpc(
    f"{name}-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={"Name": f"{name}-vpc"}
)
```

**Subnet Creation (3 availability zones):**
```python
azs = aws.get_availability_zones(state="available")
self.availability_zones = azs.names[:3]

# Public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
self.public_subnets = []
for i, az in enumerate(self.availability_zones):
    subnet = aws.ec2.Subnet(
        f"{name}-public-subnet-{i+1}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={"Name": f"{name}-public-subnet-{i+1}"}
    )
    self.public_subnets.append(subnet)

# Private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
self.private_subnets = []
for i, az in enumerate(self.availability_zones):
    subnet = aws.ec2.Subnet(
        f"{name}-private-subnet-{i+1}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={"Name": f"{name}-private-subnet-{i+1}"}
    )
    self.private_subnets.append(subnet)

# Database subnets (10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24)
self.db_subnets = []
for i, az in enumerate(self.availability_zones):
    subnet = aws.ec2.Subnet(
        f"{name}-db-subnet-{i+1}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+20}.0/24",
        availability_zone=az,
        tags={"Name": f"{name}-db-subnet-{i+1}"}
    )
    self.db_subnets.append(subnet)
```

**Internet Gateway and NAT Gateways:**
```python
self.igw = aws.ec2.InternetGateway(
    f"{name}-igw",
    vpc_id=self.vpc.id,
    tags={"Name": f"{name}-igw"}
)

# Elastic IPs for NAT Gateways (one per AZ)
self.eips = []
for i in range(len(self.availability_zones)):
    eip = aws.ec2.Eip(
        f"{name}-eip-{i+1}",
        domain="vpc",
        tags={"Name": f"{name}-eip-{i+1}"}
    )
    self.eips.append(eip)

# NAT Gateways (one per AZ for high availability)
self.nat_gateways = []
for i, subnet in enumerate(self.public_subnets):
    nat = aws.ec2.NatGateway(
        f"{name}-nat-{i+1}",
        allocation_id=self.eips[i].id,
        subnet_id=subnet.id,
        tags={"Name": f"{name}-nat-{i+1}"}
    )
    self.nat_gateways.append(nat)
```

**Route Tables:**
```python
# Public route table - routes to Internet Gateway
self.public_route_table = aws.ec2.RouteTable(
    f"{name}-public-rt",
    vpc_id=self.vpc.id,
    routes=[{
        "cidr_block": "0.0.0.0/0",
        "gateway_id": self.igw.id
    }],
    tags={"Name": f"{name}-public-rt"}
)

# Associate public subnets
for i, subnet in enumerate(self.public_subnets):
    aws.ec2.RouteTableAssociation(
        f"{name}-public-rta-{i+1}",
        subnet_id=subnet.id,
        route_table_id=self.public_route_table.id
    )

# Private route tables - one per AZ, routes to NAT Gateway
self.private_route_tables = []
for i, nat in enumerate(self.nat_gateways):
    rt = aws.ec2.RouteTable(
        f"{name}-private-rt-{i+1}",
        vpc_id=self.vpc.id,
        routes=[{
            "cidr_block": "0.0.0.0/0",
            "nat_gateway_id": nat.id
        }],
        tags={"Name": f"{name}-private-rt-{i+1}"}
    )
    self.private_route_tables.append(rt)
    
    aws.ec2.RouteTableAssociation(
        f"{name}-private-rta-{i+1}",
        subnet_id=self.private_subnets[i].id,
        route_table_id=rt.id
    )

# DB subnet group
self.db_subnet_group = aws.rds.SubnetGroup(
    f"{name}-db-subnet-group",
    subnet_ids=[s.id for s in self.db_subnets],
    tags={"Name": f"{name}-db-subnet-group"}
)
```

### 5. SecurityStack Component

Creates security groups and IAM roles with least privilege access.

**Constructor:**
```python
class SecurityStack:
    def __init__(self, name: str, vpc_id: pulumi.Output[str], container_port: int):
        self.name = name
        self.vpc_id = vpc_id
        self.container_port = container_port
```

Note: Missing config parameter. Container port passed directly instead of from config.

**Security Groups:**
```python
# ALB Security Group - Allow HTTP/HTTPS from internet
self.alb_sg = aws.ec2.SecurityGroup(
    f"{name}-alb-sg",
    vpc_id=vpc_id,
    description="Security group for Application Load Balancer",
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 80,
            "to_port": 80,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "Allow HTTP"
        },
        {
            "protocol": "tcp",
            "from_port": 443,
            "to_port": 443,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "Allow HTTPS"
        }
    ],
    egress=[{
        "protocol": "-1",
        "from_port": 0,
        "to_port": 0,
        "cidr_blocks": ["0.0.0.0/0"],
        "description": "Allow all outbound"
    }],
    tags={"Name": f"{name}-alb-sg"}
)

# ECS Tasks Security Group - Allow traffic from ALB only
self.ecs_sg = aws.ec2.SecurityGroup(
    f"{name}-ecs-sg",
    vpc_id=vpc_id,
    description="Security group for ECS tasks",
    ingress=[{
        "protocol": "tcp",
        "from_port": self.container_port,
        "to_port": self.container_port,
        "security_groups": [self.alb_sg.id],
        "description": f"Allow traffic from ALB on port {self.container_port}"
    }],
    egress=[{
        "protocol": "-1",
        "from_port": 0,
        "to_port": 0,
        "cidr_blocks": ["0.0.0.0/0"],
        "description": "Allow all outbound"
    }],
    tags={"Name": f"{name}-ecs-sg"}
)

# RDS Security Group - Allow traffic from ECS tasks only
self.rds_sg = aws.ec2.SecurityGroup(
    f"{name}-rds-sg",
    vpc_id=vpc_id,
    description="Security group for RDS database",
    ingress=[{
        "protocol": "tcp",
        "from_port": 5432,
        "to_port": 5432,
        "security_groups": [self.ecs_sg.id],
        "description": "Allow PostgreSQL from ECS tasks"
    }],
    egress=[{
        "protocol": "-1",
        "from_port": 0,
        "to_port": 0,
        "cidr_blocks": ["0.0.0.0/0"],
        "description": "Allow all outbound"
    }],
    tags={"Name": f"{name}-rds-sg"}
)
```

**IAM Roles:**
```python
# ECS Task Execution Role - For pulling images and logging
self.ecs_execution_role = aws.iam.Role(
    f"{name}-ecs-execution-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "ecs-tasks.amazonaws.com"},
            "Effect": "Allow"
        }]
    })
)

aws.iam.RolePolicyAttachment(
    f"{name}-ecs-execution-policy",
    role=self.ecs_execution_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
)

# ECS Task Role - For application permissions
self.ecs_task_role = aws.iam.Role(
    f"{name}-ecs-task-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "ecs-tasks.amazonaws.com"},
            "Effect": "Allow"
        }]
    })
)

# Task role policy with least privilege
task_policy = aws.iam.RolePolicy(
    f"{name}-ecs-task-policy",
    role=self.ecs_task_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:PutObject"],
                "Resource": "arn:aws:s3:::my-app-bucket/*"
            },
            {
                "Effect": "Allow",
                "Action": ["secretsmanager:GetSecretValue"],
                "Resource": "arn:aws:secretsmanager:*:*:secret:*"
            },
            {
                "Effect": "Allow",
                "Action": ["ssm:GetParameter", "ssm:GetParameters"],
                "Resource": "arn:aws:ssm:*:*:parameter/*"
            }
        ]
    })
)

# Auto-scaling role
self.autoscaling_role = aws.iam.Role(
    f"{name}-autoscaling-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "application-autoscaling.amazonaws.com"},
            "Effect": "Allow"
        }]
    })
)

aws.iam.RolePolicyAttachment(
    f"{name}-autoscaling-policy",
    role=self.autoscaling_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceAutoscaleRole"
)
```

### 6. DatabaseStack Component

Creates RDS Aurora PostgreSQL cluster with encryption and backups.

**Constructor:**
```python
class DatabaseStack:
    def __init__(self, name: str, 
                 subnet_group_name: Output[str], 
                 security_group_id: Output[str],
                 db_username: str,
                 db_name: str,
                 environment: str):
        self.name = name
        self.db_username = db_username
        self.db_name = db_name
        self.environment = environment
```

Note: Missing config parameter. All values passed directly.

**Password Generation:**
```python
# Uses Python secrets module instead of AWS Secrets Manager API
alphabet = string.ascii_letters + string.digits + "!#$%&*()-_=+[]{}<>:?"
password = ''.join(secrets.choice(alphabet) for i in range(32))

db_password = aws.secretsmanager.Secret(
    f"{name}-db-password",
    description="RDS Aurora password",
    recovery_window_in_days=0 if self.environment == "dev" else 7
)

db_password_version = aws.secretsmanager.SecretVersion(
    f"{name}-db-password-version",
    secret_id=db_password.id,
    secret_string=pulumi.Output.secret(password)
)
```

**KMS Encryption:**
```python
self.kms_key = aws.kms.Key(
    f"{name}-rds-kms-key",
    description=f"KMS key for RDS encryption - {name}",
    enable_key_rotation=True,
    tags={"Name": f"{name}-rds-kms-key"}
)
```

**Parameter Groups:**
```python
self.cluster_parameter_group = aws.rds.ClusterParameterGroup(
    f"{name}-aurora-cluster-params",
    family="aurora-postgresql15",
    description=f"Cluster parameter group for {name}",
    parameters=[
        {"name": "shared_preload_libraries", "value": "pg_stat_statements"},
        {"name": "log_statement", "value": "all"},
        {"name": "log_min_duration_statement", "value": "1000"},
        {"name": "rds.force_ssl", "value": "1"}
    ],
    tags={"Name": f"{name}-aurora-cluster-params"}
)

self.db_parameter_group = aws.rds.ParameterGroup(
    f"{name}-aurora-db-params",
    family="aurora-postgresql15",
    description=f"DB parameter group for {name}",
    parameters=[
        {"name": "log_connections", "value": "1"},
        {"name": "log_disconnections", "value": "1"}
    ],
    tags={"Name": f"{name}-aurora-db-params"}
)
```

**Aurora Cluster:**
```python
scaling_config = {
    "min_capacity": 0.5 if self.environment == "dev" else 1,
    "max_capacity": 1 if self.environment == "dev" else 4
}

self.cluster = aws.rds.Cluster(
    f"{name}-aurora-cluster",
    engine="aurora-postgresql",
    engine_mode="provisioned",
    engine_version="15.3",
    database_name=self.db_name,
    master_username=self.db_username,
    master_password=db_password_version.secret_string,
    db_subnet_group_name=subnet_group_name,
    vpc_security_group_ids=[security_group_id],
    storage_encrypted=True,
    kms_key_id=self.kms_key.arn,
    backup_retention_period=7 if self.environment == "dev" else 30,
    preferred_backup_window="03:00-04:00",
    preferred_maintenance_window="sun:04:00-sun:05:00",
    enabled_cloudwatch_logs_exports=["postgresql"],
    deletion_protection=False if self.environment == "dev" else True,
    skip_final_snapshot=True if self.environment == "dev" else False,
    final_snapshot_identifier=f"{name}-final-snapshot" if self.environment != "dev" else None,
    serverlessv2_scaling_configuration=scaling_config,
    db_cluster_parameter_group_name=self.cluster_parameter_group.name,
    tags={"Name": f"{name}-aurora-cluster", "Environment": self.environment}
)
```

**Cluster Instances with Environment-Based Configuration:**
```python
self.instances = []
instance_count = 1 if self.environment == "dev" else 2

for i in range(instance_count):
    instance_args = {
        "cluster_identifier": self.cluster.id,
        "instance_class": "db.serverless",
        "engine": "aurora-postgresql",
        "db_parameter_group_name": self.db_parameter_group.name,
        "tags": {"Name": f"{name}-aurora-instance-{i+1}"}
    }
    
    # Add performance insights and monitoring only for non-dev environments
    if self.environment != "dev":
        instance_args["performance_insights_enabled"] = True
        instance_args["performance_insights_retention_period"] = 7
        instance_args["monitoring_interval"] = 60
        instance_args["monitoring_role_arn"] = self._create_monitoring_role().arn
    else:
        instance_args["performance_insights_enabled"] = False
        instance_args["monitoring_interval"] = 0
    
    instance = aws.rds.ClusterInstance(
        f"{name}-aurora-instance-{i+1}",
        **instance_args
    )
    self.instances.append(instance)
```

**Parameter Store for Connection Info:**
```python
aws.ssm.Parameter(
    f"{name}-db-endpoint",
    type="String",
    value=self.cluster.endpoint,
    tags={"Name": f"{name}-db-endpoint"}
)

aws.ssm.Parameter(
    f"{name}-db-name",
    type="String",
    value=self.db_name,
    tags={"Name": f"{name}-db-name"}
)

aws.ssm.Parameter(
    f"{name}-db-username",
    type="String",
    value=self.db_username,
    tags={"Name": f"{name}-db-username"}
)

self.db_secret_arn = db_password.arn
self.endpoint = self.cluster.endpoint
self.reader_endpoint = self.cluster.reader_endpoint
```

### 7. EcsStack Component

Creates ECS cluster, ALB, target groups, and blue/green services.

**Constructor:**
```python
class EcsStack:
    def __init__(self, name: str,
                 vpc_id: Output[str], 
                 public_subnet_ids: list,
                 private_subnet_ids: list,
                 security_groups: dict,
                 iam_roles: dict,
                 db_endpoint: Output[str],
                 db_secret_arn: Output[str],
                 container_image: str,
                 container_port: int,
                 cpu: int,
                 memory: int,
                 desired_count: int,
                 environment: str,
                 blue_weight: int,
                 green_weight: int,
                 min_capacity: int,
                 max_capacity: int,
                 scale_target_cpu: int,
                 scale_target_memory: int):
```

Note: Missing config parameter. Takes 13 explicit parameters instead.

**ECS Cluster with Container Insights:**
```python
self.cluster = aws.ecs.Cluster(
    f"{name}-cluster",
    settings=[{
        "name": "containerInsights",
        "value": "enabled"
    }],
    tags={"Name": f"{name}-cluster", "Environment": self.environment}
)

self.log_group = aws.cloudwatch.LogGroup(
    f"{name}-ecs-logs",
    retention_in_days=7 if self.environment == "dev" else 30,
    tags={"Name": f"{name}-ecs-logs"}
)
```

**Task Definitions:**
```python
self.blue_task_definition = self._create_task_definition("blue", iam_roles)
self.green_task_definition = self._create_task_definition("green", iam_roles)

def _create_task_definition(self, deployment_type: str, iam_roles: dict):
    container_definitions = Output.all(self.db_endpoint, self.db_secret_arn).apply(
        lambda args: json.dumps([{
            "name": f"{self.name}-{deployment_type}",
            "image": self.container_image,
            "cpu": self.cpu,
            "memory": self.memory,
            "essential": True,
            "portMappings": [{
                "containerPort": self.container_port,
                "protocol": "tcp"
            }],
            "environment": [
                {"name": "DEPLOYMENT_TYPE", "value": deployment_type},
                {"name": "DB_ENDPOINT", "value": args[0]},
                {"name": "APP_ENV", "value": self.environment}
            ],
            "secrets": [{
                "name": "DB_PASSWORD",
                "valueFrom": args[1]
            }],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": f"/ecs/{self.name}",
                    "awslogs-region": aws.get_region().name,
                    "awslogs-stream-prefix": deployment_type
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }])
    )
    
    return aws.ecs.TaskDefinition(
        f"{self.name}-{deployment_type}-task",
        family=f"{self.name}-{deployment_type}",
        network_mode="awsvpc",
        requires_compatibilities=["FARGATE"],
        cpu=str(self.cpu),
        memory=str(self.memory),
        execution_role_arn=iam_roles["execution_role"].arn,
        task_role_arn=iam_roles["task_role"].arn,
        container_definitions=container_definitions,
        tags={"Name": f"{self.name}-{deployment_type}-task", "Deployment": deployment_type}
    )
```

**Application Load Balancer:**
```python
self.alb = aws.lb.LoadBalancer(
    f"{name}-alb",
    load_balancer_type="application",
    security_groups=[security_groups["alb_sg"].id],
    subnets=[subnet.id for subnet in public_subnet_ids],  # Correctly uses public subnets
    enable_deletion_protection=False if self.environment == "dev" else True,
    enable_http2=True,
    enable_cross_zone_load_balancing=True,
    tags={"Name": f"{name}-alb", "Environment": self.environment}
)
```

**Target Groups with Name Truncation:**
```python
# Use shorter names to avoid AWS 32-character limit
short_name = name[:15] if len(name) > 15 else name

self.blue_target_group = aws.lb.TargetGroup(
    f"{short_name}-blue",
    port=self.container_port,
    protocol="HTTP",
    vpc_id=self.vpc_id,
    target_type="ip",
    health_check={
        "enabled": True,
        "healthy_threshold": 2,
        "unhealthy_threshold": 3,
        "timeout": 10,
        "interval": 30,
        "path": "/health",
        "matcher": "200-299"
    },
    deregistration_delay=30 if self.environment == "dev" else 300,
    stickiness={
        "enabled": True,
        "type": "lb_cookie",
        "cookie_duration": 86400
    },
    tags={"Name": f"{name}-blue-tg", "Deployment": "blue"}
)

self.green_target_group = aws.lb.TargetGroup(
    f"{short_name}-green",
    port=self.container_port,
    protocol="HTTP",
    vpc_id=self.vpc_id,
    target_type="ip",
    health_check={
        "enabled": True,
        "healthy_threshold": 2,
        "unhealthy_threshold": 3,
        "timeout": 10,
        "interval": 30,
        "path": "/health",
        "matcher": "200-299"
    },
    deregistration_delay=30 if self.environment == "dev" else 300,
    stickiness={
        "enabled": True,
        "type": "lb_cookie",
        "cookie_duration": 86400
    },
    tags={"Name": f"{name}-green-tg", "Deployment": "green"}
)
```

**ALB Listener with Weighted Routing:**
```python
self.listener = aws.lb.Listener(
    f"{name}-listener",
    load_balancer_arn=self.alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[{
        "type": "forward",
        "forward": {
            "target_groups": [
                {
                    "arn": self.blue_target_group.arn,
                    "weight": self.blue_weight
                },
                {
                    "arn": self.green_target_group.arn,
                    "weight": self.green_weight
                }
            ],
            "stickiness": {
                "enabled": True,
                "duration": 3600
            }
        }
    }]
)
```

**ECS Services with Typed Args:**
```python
def _create_ecs_service(self, deployment_type: str, 
                       task_definition: aws.ecs.TaskDefinition,
                       target_group: aws.lb.TargetGroup,
                       subnets: list,
                       security_group: aws.ec2.SecurityGroup):
    return aws.ecs.Service(
        f"{self.name}-{deployment_type}-service",
        cluster=self.cluster.arn,
        task_definition=task_definition.arn,
        desired_count=self.desired_count,
        launch_type="FARGATE",
        deployment_maximum_percent=200,
        deployment_minimum_healthy_percent=100,
        deployment_circuit_breaker=aws.ecs.ServiceDeploymentCircuitBreakerArgs(
            enable=True,
            rollback=True
        ),
        network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
            assign_public_ip=False,
            subnets=[subnet.id for subnet in subnets],
            security_groups=[security_group.id]
        ),
        load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
            target_group_arn=target_group.arn,
            container_name=f"{self.name}-{deployment_type}",
            container_port=self.container_port
        )],
        health_check_grace_period_seconds=60,
        enable_ecs_managed_tags=True,
        propagate_tags="SERVICE",
        tags={"Name": f"{self.name}-{deployment_type}-service", "Deployment": deployment_type}
    )

self.blue_service = self._create_ecs_service(
    "blue", self.blue_task_definition, self.blue_target_group,
    private_subnet_ids, security_groups["ecs_sg"]
)

self.green_service = self._create_ecs_service(
    "green", self.green_task_definition, self.green_target_group,
    private_subnet_ids, security_groups["ecs_sg"]
)
```

**Auto-Scaling:**
```python
def _setup_autoscaling(self, deployment_type: str, 
                      service: aws.ecs.Service,
                      autoscaling_role: aws.iam.Role):
    # Register scalable target
    scalable_target = aws.appautoscaling.Target(
        f"{self.name}-{deployment_type}-scaling-target",
        max_capacity=self.max_capacity,
        min_capacity=self.min_capacity,
        resource_id=Output.all(self.cluster.name, service.name).apply(
            lambda args: f"service/{args[0]}/{args[1]}"
        ),
        scalable_dimension="ecs:service:DesiredCount",
        service_namespace="ecs",
        role_arn=autoscaling_role.arn
    )
    
    # CPU scaling policy
    aws.appautoscaling.Policy(
        f"{self.name}-{deployment_type}-cpu-scaling",
        policy_type="TargetTrackingScaling",
        resource_id=scalable_target.resource_id,
        scalable_dimension=scalable_target.scalable_dimension,
        service_namespace=scalable_target.service_namespace,
        target_tracking_scaling_policy_configuration={
            "target_value": self.scale_target_cpu,
            "predefined_metric_specification": {
                "predefined_metric_type": "ECSServiceAverageCPUUtilization"
            },
            "scale_in_cooldown": 300,
            "scale_out_cooldown": 60
        }
    )
    
    # Memory scaling policy
    aws.appautoscaling.Policy(
        f"{self.name}-{deployment_type}-memory-scaling",
        policy_type="TargetTrackingScaling",
        resource_id=scalable_target.resource_id,
        scalable_dimension=scalable_target.scalable_dimension,
        service_namespace=scalable_target.service_namespace,
        target_tracking_scaling_policy_configuration={
            "target_value": self.scale_target_memory,
            "predefined_metric_specification": {
                "predefined_metric_type": "ECSServiceAverageMemoryUtilization"
            },
            "scale_in_cooldown": 300,
            "scale_out_cooldown": 60
        }
    )

# Setup auto-scaling for both services
self._setup_autoscaling("blue", self.blue_service, iam_roles["autoscaling_role"])
self._setup_autoscaling("green", self.green_service, iam_roles["autoscaling_role"])
```

### 8. MonitoringStack Component

Creates CloudWatch dashboards, alarms, and SNS notifications.

**Constructor:**
```python
class MonitoringStack:
    def __init__(self, name: str,
                 cluster_name: Output[str],
                 blue_service_name: Output[str],
                 green_service_name: Output[str],
                 alb_arn: Output[str],
                 environment: str,
                 alert_email: str = None):
        self.name = name
        self.environment = environment
        self.alert_email = alert_email
```

Note: Missing config parameter. Environment and alert_email passed directly.

**SNS Topic:**
```python
self.sns_topic = aws.sns.Topic(
    f"{name}-alerts",
    display_name=f"{name} ECS Alerts",
    tags={"Name": f"{name}-alerts", "Environment": self.environment}
)

if self.alert_email:
    aws.sns.TopicSubscription(
        f"{name}-email-subscription",
        topic=self.sns_topic.arn,
        protocol="email",
        endpoint=self.alert_email
    )
```

**CloudWatch Dashboard:**
```python
dashboard_body = Output.all(
    cluster_name, blue_service, green_service, alb_arn
).apply(lambda args: self._generate_dashboard_json(
    args[0], args[1], args[2], args[3]
))

aws.cloudwatch.Dashboard(
    f"{self.name}-dashboard",
    dashboard_name=f"{self.name}-ecs-dashboard",
    dashboard_body=dashboard_body
)
```

**Dashboard JSON:**
```python
def _generate_dashboard_json(self, cluster: str, blue: str, green: str, alb: str):
    region = aws.get_region().name
    
    return json.dumps({
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/ECS", "CPUUtilization", 
                         "ServiceName", blue, "ClusterName", cluster,
                         {"label": "Blue CPU"}],
                        [".", ".", "ServiceName", green, ".", ".",
                         {"label": "Green CPU"}],
                        [".", "MemoryUtilization", 
                         "ServiceName", blue, "ClusterName", cluster,
                         {"label": "Blue Memory"}],
                        [".", ".", "ServiceName", green, ".", ".",
                         {"label": "Green Memory"}]
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": region,
                    "title": "ECS Service Utilization",
                    "yAxis": {"left": {"min": 0, "max": 100}}
                }
            },
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/ApplicationELB", "TargetResponseTime",
                         "LoadBalancer", alb.split("/", 1)[1]],
                        [".", "RequestCount", ".", "."],
                        [".", "HTTPCode_Target_2XX_Count", ".", "."],
                        [".", "HTTPCode_Target_5XX_Count", ".", "."]
                    ],
                    "period": 300,
                    "stat": "Sum",
                    "region": region,
                    "title": "ALB Metrics"
                }
            },
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/ECS", "DesiredTaskCount", 
                         "ServiceName", blue, "ClusterName", cluster],
                        [".", "RunningTaskCount", ".", ".", ".", "."],
                        [".", "DesiredTaskCount", 
                         "ServiceName", green, "ClusterName", cluster],
                        [".", "RunningTaskCount", ".", ".", ".", "."]
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": region,
                    "title": "Task Count"
                }
            }
        ]
    })
```

**CloudWatch Alarms:**
```python
def _create_service_alarms(self, deployment_type: str, 
                          cluster_name: Output[str],
                          service_name: Output[str]):
    # High CPU alarm
    aws.cloudwatch.MetricAlarm(
        f"{self.name}-{deployment_type}-high-cpu",  # Missing alarm_name property
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        threshold=80,
        metric_name="CPUUtilization",
        namespace="AWS/ECS",
        period=300,
        statistic="Average",
        dimensions={
            "ClusterName": cluster_name,
            "ServiceName": service_name
        },
        alarm_description=f"Triggers when {deployment_type} CPU exceeds 80%",
        alarm_actions=[self.sns_topic.arn],
        treat_missing_data="notBreaching"
    )
    
    # High Memory alarm
    aws.cloudwatch.MetricAlarm(
        f"{self.name}-{deployment_type}-high-memory",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        threshold=85,
        metric_name="MemoryUtilization",
        namespace="AWS/ECS",
        period=300,
        statistic="Average",
        dimensions={
            "ClusterName": cluster_name,
            "ServiceName": service_name
        },
        alarm_description=f"Triggers when {deployment_type} memory exceeds 85%",
        alarm_actions=[self.sns_topic.arn],
        treat_missing_data="notBreaching"
    )
    
    # Running task count alarm
    aws.cloudwatch.MetricAlarm(
        f"{self.name}-{deployment_type}-low-tasks",
        comparison_operator="LessThanThreshold",
        evaluation_periods=2,
        threshold=1,
        metric_name="RunningTaskCount",
        namespace="AWS/ECS",
        period=300,
        statistic="Average",
        dimensions={
            "ClusterName": cluster_name,
            "ServiceName": service_name
        },
        alarm_description=f"Triggers when {deployment_type} has less than 1 running task",
        alarm_actions=[self.sns_topic.arn],
        treat_missing_data="breaching"
    )

# ALB Alarms
def _create_alb_alarms(self, alb_arn: Output[str]):
    alb_name = alb_arn.apply(lambda arn: arn.split("/", 1)[1] if "/" in arn else arn)
    
    # High latency alarm
    aws.cloudwatch.MetricAlarm(
        f"{self.name}-alb-high-latency",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        threshold=1.0,
        metric_name="TargetResponseTime",
        namespace="AWS/ApplicationELB",
        period=300,
        statistic="Average",
        dimensions={"LoadBalancer": alb_name},
        alarm_description="Triggers when ALB response time exceeds 1 second",
        alarm_actions=[self.sns_topic.arn],
        treat_missing_data="notBreaching"
    )
    
    # High 5xx errors alarm
    aws.cloudwatch.MetricAlarm(
        f"{self.name}-alb-high-5xx",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        threshold=10,
        metric_name="HTTPCode_Target_5XX_Count",
        namespace="AWS/ApplicationELB",
        period=300,
        statistic="Sum",
        dimensions={"LoadBalancer": alb_name},
        alarm_description="Triggers when ALB 5xx errors exceed 10 in 5 minutes",
        alarm_actions=[self.sns_topic.arn],
        treat_missing_data="notBreaching"
    )
```

### 9. Component Instantiation in TapStack

```python
# Step 1: Create networking infrastructure
pulumi.log.info("Creating networking infrastructure...")
self.networking = NetworkingStack(f"{project_name}-{environment}")

# Step 2: Create security groups and IAM roles
pulumi.log.info("Creating security resources...")
self.security = SecurityStack(
    f"{project_name}-{environment}", 
    self.networking.vpc.id,
    self.container_port
)

# Step 3: Create RDS Aurora database
pulumi.log.info("Creating RDS Aurora database...")
self.database = DatabaseStack(
    f"{project_name}-{environment}",
    self.networking.db_subnet_group.name,
    self.security.rds_sg.id,
    self.db_username,
    self.db_name,
    self.environment
)

# Step 4: Create ECS infrastructure
pulumi.log.info("Creating ECS cluster and services...")
self.ecs = EcsStack(
    f"{project_name}-{environment}",
    self.networking.vpc.id,
    self.networking.public_subnets,
    self.networking.private_subnets,
    {
        "alb_sg": self.security.alb_sg,
        "ecs_sg": self.security.ecs_sg
    },
    {
        "execution_role": self.security.ecs_execution_role,
        "task_role": self.security.ecs_task_role,
        "autoscaling_role": self.security.autoscaling_role
    },
    self.database.endpoint,
    self.database.db_secret_arn,
    self.container_image,
    self.container_port,
    self.cpu,
    self.memory,
    self.desired_count,
    self.environment,
    self.blue_weight,
    self.green_weight,
    self.min_capacity,
    self.max_capacity,
    self.scale_target_cpu,
    self.scale_target_memory
)

# Step 5: Setup monitoring and alerting
pulumi.log.info("Setting up CloudWatch monitoring...")
self.monitoring = MonitoringStack(
    f"{project_name}-{environment}",
    self.ecs.cluster.name,
    self.ecs.blue_service.name,
    self.ecs.green_service.name,
    self.ecs.alb.arn,
    self.environment,
    self.alert_email
)
```

### 10. Stack Outputs

```python
# Store outputs as instance variables
self.vpc_id = self.networking.vpc.id
self.alb_dns = self.ecs.alb.dns_name
self.alb_url = Output.concat("http://", self.ecs.alb.dns_name)
self.cluster_name = self.ecs.cluster.name
self.blue_service_name = self.ecs.blue_service.name
self.green_service_name = self.ecs.green_service.name
self.blue_target_group_arn = self.ecs.blue_target_group.arn
self.green_target_group_arn = self.ecs.green_target_group.arn
self.database_endpoint = self.database.endpoint
self.database_reader_endpoint = self.database.reader_endpoint
self.sns_topic_arn = self.monitoring.sns_topic.arn

# Export outputs
pulumi.export("vpc_id", self.vpc_id)
pulumi.export("alb_dns", self.alb_dns)
pulumi.export("alb_url", self.alb_url)
pulumi.export("cluster_name", self.cluster_name)
pulumi.export("blue_service", self.blue_service_name)
pulumi.export("green_service", self.green_service_name)
pulumi.export("blue_target_group", self.blue_target_group_arn)
pulumi.export("green_target_group", self.green_target_group_arn)
pulumi.export("database_endpoint", self.database_endpoint)
pulumi.export("database_reader_endpoint", self.database_reader_endpoint)
pulumi.export("sns_topic", self.sns_topic_arn)
```

### 11. Deployment Instructions Export

```python
pulumi.export("deployment_instructions", """
Blue-Green Deployment Instructions:
====================================
1. Deploy new version to inactive environment (green if blue is active)
2. Update task definition with new container image
3. Verify green deployment health via target group health checks
4. Gradually shift traffic using weighted routing:
   - pulumi config set blue_weight 90 && pulumi config set green_weight 10
   - pulumi config set blue_weight 50 && pulumi config set green_weight 50
   - pulumi config set blue_weight 0 && pulumi config set green_weight 100
5. Monitor CloudWatch metrics and alarms during traffic shift
6. If issues detected, quickly rollback:
   - pulumi config set blue_weight 100 && pulumi config set green_weight 0
7. Once stable, the inactive environment becomes standby for next deployment

Traffic Control Commands:
========================
# All traffic to blue:
pulumi config set blue_weight 100 && pulumi config set green_weight 0 && pulumi up

# 50/50 traffic split:
pulumi config set blue_weight 50 && pulumi config set green_weight 50 && pulumi up

# All traffic to green:
pulumi config set blue_weight 0 && pulumi config set green_weight 100 && pulumi up

Monitoring:
==========
- CloudWatch Dashboard: Check the AWS Console for the generated dashboard
- Container Insights: Enabled on ECS cluster
- Alarms: CPU, Memory, Task count, ALB latency and errors
""")

self.register_outputs({})
```

## Usage

### Deploy the Stack

```python
import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Create the stack
stack = TapStack(
    "my-app",
    TapStackArgs(
        environment_suffix="dev",
        tags={"Team": "Platform", "CostCenter": "Engineering"}
    )
)
```

### Configure via Pulumi Config

```bash
pulumi config set project_name my-app
pulumi config set container_image nginx:latest
pulumi config set container_port 80
pulumi config set cpu 256
pulumi config set memory 512
pulumi config set desired_count 2
pulumi config set min_capacity 1
pulumi config set max_capacity 10
pulumi config set scale_target_cpu 70
pulumi config set scale_target_memory 80
pulumi config set blue_weight 100
pulumi config set green_weight 0
pulumi config set db_username dbadmin
pulumi config set db_name appdb
pulumi config set alert_email your-email@example.com
```

### Deploy

```bash
pulumi up
```

### Perform Blue-Green Deployment

```bash
# Update container image
pulumi config set container_image my-app:v2.0.0

# Gradual traffic shift
pulumi config set blue_weight 90 && pulumi config set green_weight 10 && pulumi up
pulumi config set blue_weight 50 && pulumi config set green_weight 50 && pulumi up
pulumi config set blue_weight 0 && pulumi config set green_weight 100 && pulumi up

# Rollback if needed
pulumi config set blue_weight 100 && pulumi config set green_weight 0 && pulumi up
```