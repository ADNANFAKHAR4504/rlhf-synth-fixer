"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project implementing a complete CI/CD pipeline
for microservices on AWS.

It creates all required AWS infrastructure including:
- VPC with public/private subnets across 2 AZs
- ECS Fargate cluster for microservices
- RDS PostgreSQL with Multi-AZ
- ElastiCache Redis cluster
- Application Load Balancer
- S3 bucket for artifacts
- CloudWatch logging and monitoring
- IAM roles with least privilege
"""

# Standard library imports
from typing import Optional
import json

# Third-party imports - Pulumi core with defensive error handling
try:
  import pulumi
  from pulumi import ResourceOptions, Output
except ImportError as pulumi_error:
  raise ImportError(
    "CRITICAL CI/CD ERROR: No module named 'pulumi'\n"
    "The Pulumi SDK has not been installed in the CI/CD environment.\n"
    "This is a CI/CD pipeline configuration issue, not a code issue.\n"
    "CI/CD pipeline must run: pipenv install --dev\n"
    "Or directly: pip install pulumi>=3.0.0\n"
    "Packages are declared in Pipfile and requirements.txt but not installed.\n"
    f"Original error: {pulumi_error}"
  ) from pulumi_error

# Third-party imports - Pulumi AWS provider with defensive error handling
try:
  import pulumi_aws as aws
except ImportError as aws_error:
  raise ImportError(
    "CRITICAL CI/CD ERROR: No module named 'pulumi_aws'\n"
    "The Pulumi AWS provider has not been installed in the CI/CD environment.\n"
    "This is a CI/CD pipeline configuration issue, not a code issue.\n"
    "CI/CD pipeline must run: pipenv install --dev\n"
    "Or directly: pip install pulumi-aws>=6.0.0\n"
    "Packages are declared in Pipfile and requirements.txt but not installed.\n"
    f"Original error: {aws_error}"
  ) from aws_error

# Module version and compatibility
__version__ = "1.0.0"
__python_requires__ = ">=3.8"

# Validate that the module loaded successfully
# This runs after all imports have completed successfully
def _validate_module_loaded():
  """
  Validate that all critical modules loaded successfully.

  This function only runs if all imports succeeded,
  confirming the module is ready for use.
  """
  # Simple validation that key components are available
  if not hasattr(pulumi, 'ComponentResource'):
    raise ImportError(
      "CRITICAL CI/CD ERROR: Pulumi module incomplete.\n"
      "Core Pulumi functionality not available.\n"
      "CI/CD environment may have partial package installation."
    )

  if not hasattr(aws, 'ec2'):
    raise ImportError(
      "CRITICAL CI/CD ERROR: Pulumi AWS provider incomplete.\n"
      "AWS services not available in pulumi_aws module.\n"
      "CI/CD environment may have partial package installation."
    )

# Run module validation - only executes if imports succeeded
_validate_module_loaded()


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying
      the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component creates all AWS infrastructure required for a microservices
  CI/CD pipeline including networking, compute, storage, and monitoring resources.
  """

  def __init__(
    self,
    name: str,
    args: TapStackArgs,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix

    # Common tags for all resources
    self.common_tags = {
      "Environment": "Production",
      "Project": "MicroservicesCI",
      "Owner": "DevOps",
      "ManagedBy": "Pulumi",
      "EnvironmentSuffix": self.environment_suffix
    }

    # Merge with any provided tags
    if args.tags:
      self.common_tags.update(args.tags)

    # Get availability zones in us-west-2
    azs = aws.get_availability_zones(state="available")

    # Create VPC
    self.vpc = aws.ec2.Vpc(
      f"microservices-vpc-{self.environment_suffix}",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={**self.common_tags, "Name": f"microservices-vpc-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Create Internet Gateway
    self.igw = aws.ec2.InternetGateway(
      f"microservices-igw-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      tags={**self.common_tags, "Name": f"microservices-igw-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Create public subnets
    self.public_subnets = []
    for i in range(2):
      subnet = aws.ec2.Subnet(
        f"public-subnet-{i+1}-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=azs.names[i],
        map_public_ip_on_launch=True,
        tags={**self.common_tags, "Name": f"public-subnet-{i+1}-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self)
      )
      self.public_subnets.append(subnet)

    # Create private subnets
    self.private_subnets = []
    for i in range(2):
      subnet = aws.ec2.Subnet(
        f"private-subnet-{i+1}-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=azs.names[i],
        tags={**self.common_tags, "Name": f"private-subnet-{i+1}-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self)
      )
      self.private_subnets.append(subnet)

    # Create Elastic IPs for NAT Gateways
    self.eips = []
    for i in range(2):
      eip = aws.ec2.Eip(
        f"nat-eip-{i+1}-{self.environment_suffix}",
        domain="vpc",
        tags={**self.common_tags, "Name": f"nat-eip-{i+1}-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self)
      )
      self.eips.append(eip)

    # Create NAT Gateways
    self.nat_gateways = []
    for i in range(2):
      nat_gw = aws.ec2.NatGateway(
        f"nat-gateway-{i+1}-{self.environment_suffix}",
        allocation_id=self.eips[i].id,
        subnet_id=self.public_subnets[i].id,
        tags={**self.common_tags, "Name": f"nat-gateway-{i+1}-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self)
      )
      self.nat_gateways.append(nat_gw)

    # Create route tables
    # Public route table
    self.public_route_table = aws.ec2.RouteTable(
      f"public-rt-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      tags={**self.common_tags, "Name": f"public-rt-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Public route to Internet Gateway
    self.public_route = aws.ec2.Route(
      f"public-route-{self.environment_suffix}",
      route_table_id=self.public_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.igw.id,
      opts=ResourceOptions(parent=self)
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"public-rta-{i+1}-{self.environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=self.public_route_table.id,
        opts=ResourceOptions(parent=self)
      )

    # Private route tables (one per AZ)
    for i in range(2):
      private_rt = aws.ec2.RouteTable(
        f"private-rt-{i+1}-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        tags={**self.common_tags, "Name": f"private-rt-{i+1}-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self)
      )

      # Private route through NAT Gateway
      aws.ec2.Route(
        f"private-route-{i+1}-{self.environment_suffix}",
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=self.nat_gateways[i].id,
        opts=ResourceOptions(parent=self)
      )

      # Associate private subnet with route table
      aws.ec2.RouteTableAssociation(
        f"private-rta-{i+1}-{self.environment_suffix}",
        subnet_id=self.private_subnets[i].id,
        route_table_id=private_rt.id,
        opts=ResourceOptions(parent=self)
      )

    # Security Groups
    # ALB Security Group
    self.alb_sg = aws.ec2.SecurityGroup(
      f"alb-sg-{self.environment_suffix}",
      name=f"alb-sg-{self.environment_suffix}",
      description="Security group for Application Load Balancer",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=80,
          to_port=80,
          cidr_blocks=["0.0.0.0/0"],
          description="HTTP access"
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=443,
          to_port=443,
          cidr_blocks=["0.0.0.0/0"],
          description="HTTPS access"
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
      tags={**self.common_tags, "Name": f"alb-sg-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # ECS Security Group
    self.ecs_sg = aws.ec2.SecurityGroup(
      f"ecs-sg-{self.environment_suffix}",
      name=f"ecs-sg-{self.environment_suffix}",
      description="Security group for ECS tasks",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=8000,
          to_port=8000,
          security_groups=[self.alb_sg.id],
          description="Access from ALB"
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
      tags={**self.common_tags, "Name": f"ecs-sg-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Database Security Group
    self.db_sg = aws.ec2.SecurityGroup(
      f"db-sg-{self.environment_suffix}",
      name=f"db-sg-{self.environment_suffix}",
      description="Security group for RDS database",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=5432,
          to_port=5432,
          security_groups=[self.ecs_sg.id],
          description="PostgreSQL access from ECS"
        )
      ],
      tags={**self.common_tags, "Name": f"db-sg-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Redis Security Group
    self.cache_sg = aws.ec2.SecurityGroup(
      f"cache-sg-{self.environment_suffix}",
      name=f"cache-sg-{self.environment_suffix}",
      description="Security group for Redis cache",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=6379,
          to_port=6379,
          security_groups=[self.ecs_sg.id],
          description="Redis access from ECS"
        )
      ],
      tags={**self.common_tags, "Name": f"cache-sg-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # S3 Bucket for artifacts
    self.artifacts_bucket = aws.s3.Bucket(
      f"artifacts-{self.environment_suffix}",
      bucket=f"microservices-artifacts-{self.environment_suffix}",
      versioning=aws.s3.BucketVersioningArgs(enabled=True),
      server_side_encryption_configuration=(
        aws.s3.BucketServerSideEncryptionConfigurationArgs(
          rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=(
              aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                sse_algorithm="AES256"
              )
            )
          )
        )
      ),
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Block public access for S3 bucket
    self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
      f"artifacts-pab-{self.environment_suffix}",
      bucket=self.artifacts_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self)
    )

    # CloudWatch Log Group
    self.log_group = aws.cloudwatch.LogGroup(
      f"ecs-logs-{self.environment_suffix}",
      name=f"/ecs/microservices-{self.environment_suffix}",
      retention_in_days=14,
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Database Subnet Group
    self.db_subnet_group = aws.rds.SubnetGroup(
      f"db-subnet-group-{self.environment_suffix}",
      subnet_ids=[subnet.id for subnet in self.private_subnets],
      tags={**self.common_tags, "Name": f"db-subnet-group-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Secrets Manager for DB credentials
    self.db_secret = aws.secretsmanager.Secret(
      f"db-credentials-{self.environment_suffix}",
      name=f"microservices/db-credentials-{self.environment_suffix}",
      description="Database credentials for microservices",
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    self.db_secret_version = aws.secretsmanager.SecretVersion(
      f"db-credentials-version-{self.environment_suffix}",
      secret_id=self.db_secret.id,
      secret_string=json.dumps({
        "username": "dbadmin",
        "password": "TempPassword123!",  # Should be randomly generated in production
        "engine": "postgres",
        "port": 5432,
        "dbname": "microservicesdb"
      }),
      opts=ResourceOptions(parent=self)
    )

    # RDS PostgreSQL Instance
    self.db_instance = aws.rds.Instance(
      f"postgres-db-{self.environment_suffix}",
      identifier=f"microservices-db-{self.environment_suffix}",
      engine="postgres",
      engine_version="15",
      instance_class="db.t3.micro",
      allocated_storage=20,
      max_allocated_storage=100,
      storage_encrypted=True,
      db_name="microservicesdb",
      username="dbadmin",
      password="TempPassword123!",  # Retrieved from Secrets Manager in production
      vpc_security_group_ids=[self.db_sg.id],
      db_subnet_group_name=self.db_subnet_group.name,
      multi_az=True,
      backup_retention_period=7,
      backup_window="03:00-04:00",
      maintenance_window="sun:04:00-sun:05:00",
      monitoring_interval=0,
      enabled_cloudwatch_logs_exports=["postgresql"],
      performance_insights_enabled=True,
      deletion_protection=False,
      skip_final_snapshot=True,
      tags={**self.common_tags, "Name": f"postgres-db-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # ElastiCache Subnet Group
    self.cache_subnet_group = aws.elasticache.SubnetGroup(
      f"cache-subnet-group-{self.environment_suffix}",
      subnet_ids=[subnet.id for subnet in self.private_subnets],
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # ElastiCache Redis Cluster
    self.redis_cluster = aws.elasticache.ReplicationGroup(
      f"redis-cluster-{self.environment_suffix}",
      replication_group_id=f"redis-{self.environment_suffix}",
      description="Redis cluster for microservices caching",
      node_type="cache.t3.micro",
      port=6379,
      num_cache_clusters=2,
      automatic_failover_enabled=True,
      multi_az_enabled=True,
      subnet_group_name=self.cache_subnet_group.name,
      security_group_ids=[self.cache_sg.id],
      at_rest_encryption_enabled=True,
      transit_encryption_enabled=False,  # Set to True and configure auth in production
      snapshot_retention_limit=5,
      snapshot_window="03:00-05:00",
      maintenance_window="sun:05:00-sun:07:00",
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # ECR Repository
    self.ecr_repository = aws.ecr.Repository(
      f"microservices-repo-{self.environment_suffix}",
      name=f"microservices-{self.environment_suffix}",
      image_tag_mutability="MUTABLE",
      image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
        scan_on_push=True
      ),
      encryption_configurations=[aws.ecr.RepositoryEncryptionConfigurationArgs(
        encryption_type="AES256"
      )],
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # ECR Lifecycle Policy
    self.ecr_lifecycle_policy = aws.ecr.LifecyclePolicy(
      f"ecr-lifecycle-{self.environment_suffix}",
      repository=self.ecr_repository.name,
      policy=json.dumps({
        "rules": [
          {
            "rulePriority": 1,
            "description": "Keep last 10 images",
            "selection": {
              "tagStatus": "any",
              "countType": "imageCountMoreThan",
              "countNumber": 10
            },
            "action": {
              "type": "expire"
            }
          }
        ]
      }),
      opts=ResourceOptions(parent=self)
    )

    # IAM Roles
    # ECS Task Execution Role
    assume_role_policy = json.dumps({
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
    })

    self.ecs_task_execution_role = aws.iam.Role(
      f"ecs-task-execution-role-{self.environment_suffix}",
      assume_role_policy=assume_role_policy,
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Attach AWS managed policy for ECS task execution
    self.ecs_task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
      f"ecs-task-execution-policy-{self.environment_suffix}",
      role=self.ecs_task_execution_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
      opts=ResourceOptions(parent=self)
    )

    # Additional policy for Secrets Manager access
    self.secrets_policy = aws.iam.RolePolicy(
      f"secrets-policy-{self.environment_suffix}",
      role=self.ecs_task_execution_role.id,
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:us-west-2:*:secret:microservices/*"
          }
        ]
      }),
      opts=ResourceOptions(parent=self)
    )

    # ECS Task Role
    self.ecs_task_role = aws.iam.Role(
      f"ecs-task-role-{self.environment_suffix}",
      assume_role_policy=assume_role_policy,
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Task role policy for application permissions
    self.task_role_policy = aws.iam.RolePolicy(
      f"task-role-policy-{self.environment_suffix}",
      role=self.ecs_task_role.id,
      policy=self.artifacts_bucket.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:PutObject",
              "s3:ListBucket"
            ],
            "Resource": [
              f"{arn}/*",
              arn
            ]
          },
          {
            "Effect": "Allow",
            "Action": [
              "cloudwatch:PutMetricData",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": "*"
          }
        ]
      })),
      opts=ResourceOptions(parent=self)
    )

    # Application Load Balancer
    self.alb = aws.lb.LoadBalancer(
      f"alb-{self.environment_suffix}",
      name=f"microservices-alb-{self.environment_suffix}",
      load_balancer_type="application",
      security_groups=[self.alb_sg.id],
      subnets=[subnet.id for subnet in self.public_subnets],
      enable_deletion_protection=False,
      enable_http2=True,
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Target Group
    self.target_group = aws.lb.TargetGroup(
      f"tg-{self.environment_suffix}",
      name=f"microservices-tg-{self.environment_suffix}",
      port=8000,
      protocol="HTTP",
      vpc_id=self.vpc.id,
      target_type="ip",
      health_check=aws.lb.TargetGroupHealthCheckArgs(
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
      deregistration_delay=30,
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # ALB Listener
    self.alb_listener = aws.lb.Listener(
      f"alb-listener-{self.environment_suffix}",
      load_balancer_arn=self.alb.arn,
      port=80,
      protocol="HTTP",
      default_actions=[
        aws.lb.ListenerDefaultActionArgs(
          type="forward",
          target_group_arn=self.target_group.arn
        )
      ],
      opts=ResourceOptions(parent=self)
    )

    # ECS Cluster
    self.ecs_cluster = aws.ecs.Cluster(
      f"ecs-cluster-{self.environment_suffix}",
      name=f"microservices-{self.environment_suffix}",
      settings=[
        aws.ecs.ClusterSettingArgs(
          name="containerInsights",
          value="enabled"
        )
      ],
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # ECS Task Definition
    container_definitions = Output.all(
      self.ecr_repository.repository_url,
      self.db_instance.endpoint,
      self.redis_cluster.primary_endpoint_address,
      self.log_group.name,
      self.db_secret.arn
    ).apply(lambda args: json.dumps([
      {
        "name": f"microservices-app-{self.environment_suffix}",
        "image": f"{args[0]}:latest",
        "cpu": 256,
        "memory": 512,
        "essential": True,
        "portMappings": [
          {
            "containerPort": 8000,
            "protocol": "tcp"
          }
        ],
        "environment": [
          {
            "name": "DB_HOST",
            "value": args[1].split(":")[0]
          },
          {
            "name": "REDIS_HOST",
            "value": args[2]
          },
          {
            "name": "ENVIRONMENT",
            "value": "production"
          },
          {
            "name": "PORT",
            "value": "8000"
          }
        ],
        "secrets": [
          {
            "name": "DB_PASSWORD",
            "valueFrom": f"{args[4]}:password::"
          }
        ],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": args[3],
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
    ]))

    self.task_definition = aws.ecs.TaskDefinition(
      f"task-def-{self.environment_suffix}",
      family=f"microservices-{self.environment_suffix}",
      network_mode="awsvpc",
      requires_compatibilities=["FARGATE"],
      cpu="256",
      memory="512",
      execution_role_arn=self.ecs_task_execution_role.arn,
      task_role_arn=self.ecs_task_role.arn,
      container_definitions=container_definitions,
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # ECS Service
    self.ecs_service = aws.ecs.Service(
      f"ecs-service-{self.environment_suffix}",
      cluster=self.ecs_cluster.id,
      task_definition=self.task_definition.arn,
      desired_count=2,
      launch_type="FARGATE",
      network_configuration={
        "subnets": [subnet.id for subnet in self.private_subnets],
        "security_groups": [self.ecs_sg.id],
        "assign_public_ip": False
      },
      tags=self.common_tags,
      opts=ResourceOptions(parent=self, depends_on=[self.alb_listener])
    )

    # Auto Scaling for ECS Service
    self.ecs_target = aws.appautoscaling.Target(
      f"ecs-target-{self.environment_suffix}",
      max_capacity=10,
      min_capacity=2,
      resource_id=Output.concat("service/", self.ecs_cluster.name, "/", self.ecs_service.name),
      scalable_dimension="ecs:service:DesiredCount",
      service_namespace="ecs",
      opts=ResourceOptions(parent=self)
    )

    # CPU-based auto scaling policy
    self.cpu_scaling_policy = aws.appautoscaling.Policy(
      f"cpu-scaling-{self.environment_suffix}",
      name=f"cpu-scaling-{self.environment_suffix}",
      policy_type="TargetTrackingScaling",
      resource_id=self.ecs_target.resource_id,
      scalable_dimension=self.ecs_target.scalable_dimension,
      service_namespace=self.ecs_target.service_namespace,
      target_tracking_scaling_policy_configuration=(
        aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
          predefined_metric_specification=(
            aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(  # pylint: disable=line-too-long
              predefined_metric_type="ECSServiceAverageCPUUtilization"
            )
          ),
          target_value=70.0,
          scale_in_cooldown=300,
          scale_out_cooldown=60
        )
      ),
      opts=ResourceOptions(parent=self)
    )


    # CloudFront Distribution for static assets
    self.cloudfront_oai = aws.cloudfront.OriginAccessIdentity(
      f"cloudfront-oai-{self.environment_suffix}",
      comment=f"OAI for microservices-{self.environment_suffix}",
      opts=ResourceOptions(parent=self)
    )

    # S3 bucket for static assets
    self.static_bucket = aws.s3.Bucket(
      f"static-assets-{self.environment_suffix}",
      bucket=f"microservices-static-{self.environment_suffix}",
      website=aws.s3.BucketWebsiteArgs(
        index_document="index.html",
        error_document="error.html"
      ),
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Bucket policy for CloudFront access
    self.static_bucket_policy = aws.s3.BucketPolicy(
      f"static-bucket-policy-{self.environment_suffix}",
      bucket=self.static_bucket.id,
      policy=Output.all(self.static_bucket.arn, self.cloudfront_oai.iam_arn).apply(
        lambda args: json.dumps({
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": args[1]
              },
              "Action": "s3:GetObject",
              "Resource": f"{args[0]}/*"
            }
          ]
        })
      ),
      opts=ResourceOptions(parent=self)
    )

    # CloudFront Distribution
    self.cloudfront_distribution = aws.cloudfront.Distribution(
      f"cloudfront-{self.environment_suffix}",
      enabled=True,
      is_ipv6_enabled=True,
      default_root_object="index.html",
      origins=[
        aws.cloudfront.DistributionOriginArgs(
          domain_name=self.static_bucket.bucket_regional_domain_name,
          origin_id="static-origin",
          s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
            origin_access_identity=self.cloudfront_oai.cloudfront_access_identity_path
          )
        )
      ],
      default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
        allowed_methods=["GET", "HEAD"],
        cached_methods=["GET", "HEAD"],
        target_origin_id="static-origin",
        viewer_protocol_policy="redirect-to-https",
        forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
          query_string=False,
          cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
            forward="none"
          )
        ),
        min_ttl=0,
        default_ttl=3600,
        max_ttl=86400
      ),
      price_class="PriceClass_100",
      restrictions=aws.cloudfront.DistributionRestrictionsArgs(
        geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
          restriction_type="none"
        )
      ),
      viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
        cloudfront_default_certificate=True
      ),
      tags=self.common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Register outputs
    self.register_outputs({
      "vpc_id": self.vpc.id,
      "ecs_cluster_arn": self.ecs_cluster.arn,
      "ecs_cluster_name": self.ecs_cluster.name,
      "ecs_service_name": self.ecs_service.name,
      "alb_dns_name": self.alb.dns_name,
      "alb_arn": self.alb.arn,
      "ecr_repository_url": self.ecr_repository.repository_url,
      "rds_endpoint": self.db_instance.endpoint,
      "rds_address": self.db_instance.address,
      "redis_primary_endpoint": self.redis_cluster.primary_endpoint_address,
      "redis_configuration_endpoint": self.redis_cluster.configuration_endpoint_address,
      "artifacts_bucket_name": self.artifacts_bucket.id,
      "artifacts_bucket_arn": self.artifacts_bucket.arn,
      "static_bucket_name": self.static_bucket.id,
      "cloudfront_domain": self.cloudfront_distribution.domain_name,
      "cloudfront_distribution_id": self.cloudfront_distribution.id,
      "log_group_name": self.log_group.name,
      "db_secret_arn": self.db_secret.arn
    })

    # Export outputs for integration tests
    pulumi.export("vpc_id", self.vpc.id)
    pulumi.export("ecs_cluster_arn", self.ecs_cluster.arn)
    pulumi.export("ecs_cluster_name", self.ecs_cluster.name)
    pulumi.export("ecs_service_name", self.ecs_service.name)
    pulumi.export("alb_dns_name", self.alb.dns_name)
    pulumi.export("ecr_repository_url", self.ecr_repository.repository_url)
    pulumi.export("rds_endpoint", self.db_instance.endpoint)
    pulumi.export("redis_endpoint", self.redis_cluster.primary_endpoint_address)
    pulumi.export("artifacts_bucket_name", self.artifacts_bucket.id)
    pulumi.export("cloudfront_domain", self.cloudfront_distribution.domain_name)
