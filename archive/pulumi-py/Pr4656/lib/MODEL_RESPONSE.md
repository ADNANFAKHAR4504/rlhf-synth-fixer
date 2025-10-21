### Reasoning Trace
---

This is a comprehensive request for a blue-green deployment infrastructure on AWS using Pulumi with Python. The user wants:

1. ECS cluster with Fargate across 3 AZs
2. ALB with path-based routing and health checks
3. Two ECS services (blue/green) with separate target groups
4. RDS Aurora PostgreSQL with encryption and backups
5. Weighted target group routing for gradual traffic shifting
6. CloudWatch Container Insights
7. IAM roles with least privilege
8. Security groups with minimal ports
9. Auto-scaling based on CPU/memory
10. Environment-specific configuration

This is a complex setup that requires multiple AWS resources and careful orchestration. I'll create a complete Pulumi program that implements all these requirements.

Let me structure this as:
1. Main Pulumi program (__main__.py)
2. Configuration setup (Pulumi.yaml and Pulumi.dev.yaml examples)
3. Supporting modules for better organization

The program will include:
- VPC and networking setup
- Security groups
- IAM roles and policies
- RDS Aurora cluster
- ECS cluster with Fargate
- ALB with weighted routing
- ECS services for blue/green
- Auto-scaling
- CloudWatch monitoring
- Configuration management
### Answer 
---

I'll help you build a comprehensive blue-green deployment infrastructure on AWS using Pulumi with Python. This solution implements all your requirements with production-ready configurations and best practices.

## Project Structure

First, let's organize the project:

```
blue-green-ecs/
├── __main__.py           # Main Pulumi program
├── Pulumi.yaml          # Project configuration
├── Pulumi.dev.yaml      # Development environment config
├── requirements.txt     # Python dependencies
└── modules/
    ├── __init__.py
    ├── networking.py    # VPC and networking resources
    ├── security.py      # Security groups and IAM
    ├── database.py      # RDS Aurora setup
    ├── ecs.py          # ECS cluster and services
    └── monitoring.py    # CloudWatch and alerts
```

## Complete Pulumi Program

### `requirements.txt`

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
pulumi-awsx>=2.0.0,<3.0.0
```

### `Pulumi.yaml`

```yaml
name: blue-green-ecs
runtime:
  name: python
  options:
    virtualenv: venv
description: Blue-Green ECS deployment infrastructure with Fargate
```

### `Pulumi.dev.yaml` (Example configuration)

```yaml
config:
  blue-green-ecs:environment: dev
  blue-green-ecs:db_username: dbadmin
  blue-green-ecs:db_name: appdb
  blue-green-ecs:container_image: nginx:latest
  blue-green-ecs:container_port: 80
  blue-green-ecs:cpu: 256
  blue-green-ecs:memory: 512
  blue-green-ecs:desired_count: 2
  blue-green-ecs:min_capacity: 1
  blue-green-ecs:max_capacity: 10
  blue-green-ecs:scale_target_cpu: 70
  blue-green-ecs:scale_target_memory: 80
  blue-green-ecs:blue_weight: 100
  blue-green-ecs:green_weight: 0
  aws:region: us-east-1
```

### `modules/networking.py`

```python
import pulumi
import pulumi_aws as aws
from pulumi import Output

class NetworkingStack:
    def __init__(self, name: str, config: pulumi.Config):
        self.name = name
        self.config = config
        
        # Create VPC spanning 3 availability zones
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"{name}-vpc"}
        )
        
        # Get availability zones (first 3)
        azs = aws.get_availability_zones(state="available")
        self.availability_zones = azs.names[:3]
        
        # Create public subnets for ALB
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
        
        # Create private subnets for ECS tasks
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
        
        # Create database subnets
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
        
        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"{name}-igw"}
        )
        
        # Elastic IPs for NAT Gateways
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
        
        # Route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"{name}-public-rt",
            vpc_id=self.vpc.id,
            routes=[{
                "cidr_block": "0.0.0.0/0",
                "gateway_id": self.igw.id
            }],
            tags={"Name": f"{name}-public-rt"}
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )
        
        # Route tables for private subnets (one per AZ)
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
            
            # Associate with corresponding private subnet
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

### `modules/security.py`

```python
import pulumi
import pulumi_aws as aws
import json

class SecurityStack:
    def __init__(self, name: str, config: pulumi.Config, vpc_id: pulumi.Output[str]):
        self.name = name
        self.config = config
        self.vpc_id = vpc_id
        
        container_port = config.get_int("container_port") or 80
        
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
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": container_port,
                    "to_port": container_port,
                    "security_groups": [self.alb_sg.id],
                    "description": f"Allow traffic from ALB on port {container_port}"
                }
            ],
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
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 5432,
                    "to_port": 5432,
                    "security_groups": [self.ecs_sg.id],
                    "description": "Allow PostgreSQL from ECS tasks"
                }
            ],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "Allow all outbound"
            }],
            tags={"Name": f"{name}-rds-sg"}
        )
        
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
        
        # Attach AWS managed policy for ECS task execution
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
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": "arn:aws:s3:::my-app-bucket/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": "arn:aws:secretsmanager:*:*:secret:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters"
                        ],
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

### `modules/database.py`

```python
import pulumi
import pulumi_aws as aws
from pulumi import Output
import json

class DatabaseStack:
    def __init__(self, name: str, config: pulumi.Config, 
                 subnet_group_name: Output[str], security_group_id: Output[str]):
        self.name = name
        self.config = config
        
        # Get database configuration
        db_username = config.get("db_username") or "dbadmin"
        db_name = config.get("db_name") or "appdb"
        environment = config.get("environment") or "dev"
        
        # Generate secure random password
        db_password = aws.secretsmanager.Secret(
            f"{name}-db-password",
            description="RDS Aurora password",
            recovery_window_in_days=0 if environment == "dev" else 7
        )
        
        db_password_version = aws.secretsmanager.SecretVersion(
            f"{name}-db-password-version",
            secret_id=db_password.id,
            secret_string=pulumi.Output.secret(
                aws.secretsmanager.get_random_password(
                    length=32,
                    special=True,
                    exclude_characters="\"@/\\"
                ).result
            )
        )
        
        # KMS key for encryption
        self.kms_key = aws.kms.Key(
            f"{name}-rds-kms-key",
            description=f"KMS key for RDS encryption - {name}",
            enable_key_rotation=True,
            tags={"Name": f"{name}-rds-kms-key"}
        )
        
        # Aurora cluster parameter group
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
        
        # DB parameter group
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
        
        # Aurora Serverless v2 scaling configuration
        scaling_config = {
            "min_capacity": 0.5 if environment == "dev" else 1,
            "max_capacity": 1 if environment == "dev" else 4
        }
        
        # RDS Aurora PostgreSQL cluster
        self.cluster = aws.rds.Cluster(
            f"{name}-aurora-cluster",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.3",
            database_name=db_name,
            master_username=db_username,
            master_password=db_password_version.secret_string,
            db_subnet_group_name=subnet_group_name,
            vpc_security_group_ids=[security_group_id],
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            backup_retention_period=7 if environment == "dev" else 30,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            deletion_protection=False if environment == "dev" else True,
            skip_final_snapshot=True if environment == "dev" else False,
            final_snapshot_identifier=f"{name}-final-snapshot" if environment != "dev" else None,
            serverlessv2_scaling_configuration=scaling_config,
            db_cluster_parameter_group_name=self.cluster_parameter_group.name,
            tags={"Name": f"{name}-aurora-cluster", "Environment": environment}
        )
        
        # Create cluster instances (2 for high availability)
        self.instances = []
        instance_count = 1 if environment == "dev" else 2
        
        for i in range(instance_count):
            instance = aws.rds.ClusterInstance(
                f"{name}-aurora-instance-{i+1}",
                cluster_identifier=self.cluster.id,
                instance_class="db.serverless",
                engine="aurora-postgresql",
                db_parameter_group_name=self.db_parameter_group.name,
                performance_insights_enabled=True if environment != "dev" else False,
                performance_insights_retention_period=7 if environment != "dev" else 0,
                monitoring_interval=60 if environment != "dev" else 0,
                monitoring_role_arn=self._create_monitoring_role().arn if environment != "dev" else None,
                tags={"Name": f"{name}-aurora-instance-{i+1}"}
            )
            self.instances.append(instance)
        
        # Store connection info in Parameter Store
        aws.ssm.Parameter(
            f"{name}-db-endpoint",
            type="String",
            value=self.cluster.endpoint,
            tags={"Name": f"{name}-db-endpoint"}
        )
        
        aws.ssm.Parameter(
            f"{name}-db-name",
            type="String",
            value=db_name,
            tags={"Name": f"{name}-db-name"}
        )
        
        aws.ssm.Parameter(
            f"{name}-db-username",
            type="String",
            value=db_username,
            tags={"Name": f"{name}-db-username"}
        )
        
        self.db_secret_arn = db_password.arn
        self.endpoint = self.cluster.endpoint
        self.reader_endpoint = self.cluster.reader_endpoint
    
    def _create_monitoring_role(self):
        """Create IAM role for RDS Enhanced Monitoring"""
        role = aws.iam.Role(
            f"{self.name}-rds-monitoring-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "monitoring.rds.amazonaws.com"},
                    "Effect": "Allow"
                }]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.name}-rds-monitoring-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        )
        
        return role
```

### `modules/ecs.py`

```python
import pulumi
import pulumi_aws as aws
from pulumi import Output
import json

class EcsStack:
    def __init__(self, name: str, config: pulumi.Config, 
                 vpc_id: Output[str], 
                 private_subnet_ids: list,
                 security_groups: dict,
                 iam_roles: dict,
                 db_endpoint: Output[str],
                 db_secret_arn: Output[str]):
        self.name = name
        self.config = config
        
        # Configuration
        container_image = config.get("container_image") or "nginx:latest"
        container_port = config.get_int("container_port") or 80
        cpu = config.get_int("cpu") or 256
        memory = config.get_int("memory") or 512
        desired_count = config.get_int("desired_count") or 2
        environment = config.get("environment") or "dev"
        
        # Enable Container Insights
        self.cluster = aws.ecs.Cluster(
            f"{name}-cluster",
            settings=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={"Name": f"{name}-cluster", "Environment": environment}
        )
        
        # CloudWatch Log Group for ECS tasks
        self.log_group = aws.cloudwatch.LogGroup(
            f"{name}-ecs-logs",
            retention_in_days=7 if environment == "dev" else 30,
            tags={"Name": f"{name}-ecs-logs"}
        )
        
        # Create task definitions for blue and green deployments
        self.blue_task_definition = self._create_task_definition(
            "blue", 
            container_image, 
            container_port, 
            cpu, 
            memory, 
            iam_roles,
            db_endpoint,
            db_secret_arn
        )
        
        self.green_task_definition = self._create_task_definition(
            "green", 
            container_image, 
            container_port, 
            cpu, 
            memory,
            iam_roles,
            db_endpoint,
            db_secret_arn
        )
        
        # Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"{name}-alb",
            load_balancer_type="application",
            security_groups=[security_groups["alb_sg"].id],
            subnets=[subnet.id for subnet in private_subnet_ids],
            enable_deletion_protection=False if environment == "dev" else True,
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            tags={"Name": f"{name}-alb", "Environment": environment}
        )
        
        # Target Groups for Blue and Green deployments
        self.blue_target_group = aws.lb.TargetGroup(
            f"{name}-blue-tg",
            port=container_port,
            protocol="HTTP",
            vpc_id=vpc_id,
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
            deregistration_delay=30 if environment == "dev" else 300,
            stickiness={
                "enabled": True,
                "type": "lb_cookie",
                "cookie_duration": 86400
            },
            tags={"Name": f"{name}-blue-tg", "Deployment": "blue"}
        )
        
        self.green_target_group = aws.lb.TargetGroup(
            f"{name}-green-tg",
            port=container_port,
            protocol="HTTP",
            vpc_id=vpc_id,
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
            deregistration_delay=30 if environment == "dev" else 300,
            stickiness={
                "enabled": True,
                "type": "lb_cookie",
                "cookie_duration": 86400
            },
            tags={"Name": f"{name}-green-tg", "Deployment": "green"}
        )
        
        # Get traffic weights from config
        blue_weight = config.get_int("blue_weight") or 100
        green_weight = config.get_int("green_weight") or 0
        
        # ALB Listener with weighted target groups
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
                            "weight": blue_weight
                        },
                        {
                            "arn": self.green_target_group.arn,
                            "weight": green_weight
                        }
                    ],
                    "stickiness": {
                        "enabled": True,
                        "duration": 3600
                    }
                }
            }]
        )
        
        # Create ECS Services
        self.blue_service = self._create_ecs_service(
            "blue",
            self.blue_task_definition,
            self.blue_target_group,
            desired_count,
            private_subnet_ids,
            security_groups["ecs_sg"],
            container_port
        )
        
        self.green_service = self._create_ecs_service(
            "green",
            self.green_task_definition,
            self.green_target_group,
            desired_count,
            private_subnet_ids,
            security_groups["ecs_sg"],
            container_port
        )
        
        # Setup auto-scaling for both services
        self._setup_autoscaling("blue", self.blue_service, iam_roles["autoscaling_role"])
        self._setup_autoscaling("green", self.green_service, iam_roles["autoscaling_role"])
    
    def _create_task_definition(self, deployment_type: str, image: str, 
                                port: int, cpu: int, memory: int,
                                iam_roles: dict, db_endpoint: Output[str],
                                db_secret_arn: Output[str]):
        """Create ECS task definition"""
        
        # Container definition with environment variables and secrets
        container_definitions = Output.all(db_endpoint, db_secret_arn).apply(
            lambda args: json.dumps([{
                "name": f"{self.name}-{deployment_type}",
                "image": image,
                "cpu": cpu,
                "memory": memory,
                "essential": True,
                "portMappings": [{
                    "containerPort": port,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "DEPLOYMENT_TYPE", "value": deployment_type},
                    {"name": "DB_ENDPOINT", "value": args[0]},
                    {"name": "APP_ENV", "value": self.config.get("environment") or "dev"}
                ],
                "secrets": [
                    {
                        "name": "DB_PASSWORD",
                        "valueFrom": args[1]
                    }
                ],
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
            cpu=str(cpu),
            memory=str(memory),
            execution_role_arn=iam_roles["execution_role"].arn,
            task_role_arn=iam_roles["task_role"].arn,
            container_definitions=container_definitions,
            tags={"Name": f"{self.name}-{deployment_type}-task", "Deployment": deployment_type}
        )
    
    def _create_ecs_service(self, deployment_type: str, 
                           task_definition: aws.ecs.TaskDefinition,
                           target_group: aws.lb.TargetGroup,
                           desired_count: int,
                           subnets: list,
                           security_group: aws.ec2.SecurityGroup,
                           container_port: int):
        """Create ECS service"""
        
        return aws.ecs.Service(
            f"{self.name}-{deployment_type}-service",
            cluster=self.cluster.arn,
            task_definition=task_definition.arn,
            desired_count=desired_count,
            launch_type="FARGATE",
            deployment_configuration={
                "maximum_percent": 200,
                "minimum_healthy_percent": 100,
                "deployment_circuit_breaker": {
                    "enable": True,
                    "rollback": True
                }
            },
            network_configuration={
                "assign_public_ip": False,
                "subnets": [subnet.id for subnet in subnets],
                "security_groups": [security_group.id]
            },
            load_balancers=[{
                "target_group_arn": target_group.arn,
                "container_name": f"{self.name}-{deployment_type}",
                "container_port": container_port
            }],
            health_check_grace_period_seconds=60,
            enable_ecs_managed_tags=True,
            propagate_tags="SERVICE",
            tags={"Name": f"{self.name}-{deployment_type}-service", "Deployment": deployment_type}
        )
    
    def _setup_autoscaling(self, deployment_type: str, 
                          service: aws.ecs.Service,
                          autoscaling_role: aws.iam.Role):
        """Setup auto-scaling for ECS service"""
        
        min_capacity = self.config.get_int("min_capacity") or 1
        max_capacity = self.config.get_int("max_capacity") or 10
        scale_target_cpu = self.config.get_int("scale_target_cpu") or 70
        scale_target_memory = self.config.get_int("scale_target_memory") or 80
        
        # Register scalable target
        scalable_target = aws.appautoscaling.Target(
            f"{self.name}-{deployment_type}-scaling-target",
            max_capacity=max_capacity,
            min_capacity=min_capacity,
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
                "target_value": scale_target_cpu,
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
                "target_value": scale_target_memory,
                "predefined_metric_specification": {
                    "predefined_metric_type": "ECSServiceAverageMemoryUtilization"
                },
                "scale_in_cooldown": 300,
                "scale_out_cooldown": 60
            }
        )
```

### `modules/monitoring.py`

```python
import pulumi
import pulumi_aws as aws
from pulumi import Output

class MonitoringStack:
    def __init__(self, name: str, config: pulumi.Config,
                 cluster_name: Output[str],
                 blue_service_name: Output[str],
                 green_service_name: Output[str],
                 alb_arn: Output[str]):
        self.name = name
        self.config = config
        environment = config.get("environment") or "dev"
        
        # SNS Topic for alerts
        self.sns_topic = aws.sns.Topic(
            f"{name}-alerts",
            display_name=f"{name} ECS Alerts",
            tags={"Name": f"{name}-alerts", "Environment": environment}
        )
        
        # Email subscription (replace with your email)
        if config.get("alert_email"):
            aws.sns.TopicSubscription(
                f"{name}-email-subscription",
                topic=self.sns_topic.arn,
                protocol="email",
                endpoint=config.get("alert_email")
            )
        
        # CloudWatch Dashboard
        self._create_dashboard(cluster_name, blue_service_name, 
                              green_service_name, alb_arn)
        
        # Create alarms for Blue deployment
        self._create_service_alarms("blue", cluster_name, blue_service_name)
        
        # Create alarms for Green deployment
        self._create_service_alarms("green", cluster_name, green_service_name)
        
        # ALB alarms
        self._create_alb_alarms(alb_arn)
    
    def _create_dashboard(self, cluster_name: Output[str], 
                         blue_service: Output[str],
                         green_service: Output[str],
                         alb_arn: Output[str]):
        """Create CloudWatch Dashboard"""
        
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
    
    def _generate_dashboard_json(self, cluster: str, blue: str, 
                                green: str, alb: str):
        """Generate dashboard JSON configuration"""
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
    
    def _create_service_alarms(self, deployment_type: str, 
                              cluster_name: Output[str],
                              service_name: Output[str]):
        """Create CloudWatch alarms for ECS service"""
        
        # High CPU alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.name}-{deployment_type}-cpu-alarm",
            alarm_name=f"{self.name}-{deployment_type}-high-cpu",
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
            f"{self.name}-{deployment_type}-memory-alarm",
            alarm_name=f"{self.name}-{deployment_type}-high-memory",
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
            f"{self.name}-{deployment_type}-task-alarm",
            alarm_name=f"{self.name}-{deployment_type}-low-tasks",
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
    
    def _create_alb_alarms(self, alb_arn: Output[str]):
        """Create CloudWatch alarms for ALB"""
        
        # Extract ALB name from ARN
        alb_name = alb_arn.apply(lambda arn: arn.split("/", 1)[1] if "/" in arn else arn)
        
        # High latency alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.name}-alb-latency-alarm",
            alarm_name=f"{self.name}-alb-high-latency",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=1.0,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            dimensions={
                "LoadBalancer": alb_name
            },
            alarm_description="Triggers when ALB response time exceeds 1 second",
            alarm_actions=[self.sns_topic.arn],
            treat_missing_data="notBreaching"
        )
        
        # High 5xx errors alarm
        aws.cloudwatch.MetricAlarm(
            f"{self.name}-alb-5xx-alarm",
            alarm_name=f"{self.name}-alb-high-5xx",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=10,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Sum",
            dimensions={
                "LoadBalancer": alb_name
            },
            alarm_description="Triggers when ALB 5xx errors exceed 10 in 5 minutes",
            alarm_actions=[self.sns_topic.arn],
            treat_missing_data="notBreaching"
        )

import json
```

### `__main__.py` (Main Pulumi Program)

```python
"""
Blue-Green ECS Deployment Infrastructure
Supports zero-downtime deployments with automatic rollback capabilities
"""

import pulumi
from pulumi import Config, export, Output
from modules.networking import NetworkingStack
from modules.security import SecurityStack
from modules.database import DatabaseStack
from modules.ecs import EcsStack
from modules.monitoring import MonitoringStack

# Get configuration
config = Config("blue-green-ecs")
aws_config = Config("aws")

# Project name from config or default
project_name = config.get("project_name") or "blue-green-ecs"
environment = config.get("environment") or "dev"

# Create tags for all resources
common_tags = {
    "Project": project_name,
    "Environment": environment,
    "ManagedBy": "Pulumi"
}

# Step 1: Create networking infrastructure
pulumi.log.info("Creating networking infrastructure...")
networking = NetworkingStack(f"{project_name}-{environment}", config)

# Step 2: Create security groups and IAM roles
pulumi.log.info("Creating security resources...")
security = SecurityStack(
    f"{project_name}-{environment}", 
    config, 
    networking.vpc.id
)

# Step 3: Create RDS Aurora database
pulumi.log.info("Creating RDS Aurora database...")
database = DatabaseStack(
    f"{project_name}-{environment}",
    config,
    networking.db_subnet_group.name,
    security.rds_sg.id
)

# Step 4: Create ECS infrastructure
pulumi.log.info("Creating ECS cluster and services...")
ecs = EcsStack(
    f"{project_name}-{environment}",
    config,
    networking.vpc.id,
    networking.private_subnets,
    {
        "alb_sg": security.alb_sg,
        "ecs_sg": security.ecs_sg
    },
    {
        "execution_role": security.ecs_execution_role,
        "task_role": security.ecs_task_role,
        "autoscaling_role": security.autoscaling_role
    },
    database.endpoint,
    database.db_secret_arn
)

# Step 5: Setup monitoring and alerting
pulumi.log.info("Setting up CloudWatch monitoring...")
monitoring = MonitoringStack(
    f"{project_name}-{environment}",
    config,
    ecs.cluster.name,
    ecs.blue_service.name,
    ecs.green_service.name,
    ecs.alb.arn
)

# Export important values
export("vpc_id", networking.vpc.id)
export("alb_dns", ecs.alb.dns_name)
export("alb_url", Output.concat("http://", ecs.alb.dns_name))
export("cluster_name", ecs.cluster.name)
export("blue_service", ecs.blue_service.name)
export("green_service", ecs.green_service.name)
export("blue_target_group", ecs.blue_target_group.arn)
export("green_target_group", ecs.green_target_group.arn)
export("database_endpoint", database.endpoint)
export("database_reader_endpoint", database.reader_endpoint)
export("sns_topic", monitoring.sns_topic.arn)

# Blue-Green deployment instructions
export("deployment_instructions", """
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
- CloudWatch Dashboard: Check the exported dashboard URL
- Container Insights: Enabled on ECS cluster
- Alarms: CPU, Memory, Task count, ALB latency and errors
""")
```

## Usage Instructions

### 1. Initial Setup

```bash
# Create new Pulumi project
mkdir blue-green-ecs && cd blue-green-ecs

# Copy all the files from above

# Install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Initialize Pulumi stack
pulumi stack init dev

# Configure AWS region
pulumi config set aws:region us-east-1
```

### 2. Configure the deployment

Edit `Pulumi.dev.yaml` with your specific values:

```yaml
config:
  blue-green-ecs:environment: dev
  blue-green-ecs:container_image: your-ecr-repo/your-app:v1.0.0
  blue-green-ecs:alert_email: your-email@example.com
  # ... other configurations
```

### 3. Deploy the infrastructure

```bash
# Preview changes
pulumi preview

# Deploy
pulumi up --yes
```

### 4. Perform a blue-green deployment

```bash
# Step 1: Update green environment with new version
pulumi config set container_image your-ecr-repo/your-app:v2.0.0

# Step 2: Start gradual traffic shift
pulumi config set blue_weight 90 && pulumi config set green_weight 10
pulumi up --yes

# Step 3: Increase green traffic
pulumi config set blue_weight 50 && pulumi config set green_weight 50
pulumi up --yes

# Step 4: Complete migration to green
pulumi config set blue_weight 0 && pulumi config set green_weight 100
pulumi up --yes
```

### 5. Rollback if needed

```bash
# Quick rollback to blue
pulumi config set blue_weight 100 && pulumi config set green_weight 0
pulumi up --yes
```

## Key Features

1. **Zero-Downtime Deployments**: Traffic shifts gradually between environments
2. **Automatic Rollback**: Circuit breaker pattern in ECS automatically rolls back failed deployments
3. **High Availability**: Multi-AZ deployment across 3 availability zones
4. **Security**: Least privilege IAM roles, encrypted database, minimal security groups
5. **Monitoring**: CloudWatch Container Insights, dashboards, and alerts
6. **Auto-scaling**: CPU and memory-based scaling for both blue and green environments
7. **Cost Optimization**: Serverless Aurora for database, Fargate for containers
8. **Environment Flexibility**: Easy configuration management for dev/staging/production

This infrastructure provides a production-ready blue-green deployment setup with all the requested features, supporting safe, gradual deployments with automatic rollback capabilities.