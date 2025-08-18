"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the CI/CD pipeline implementing a complete microservices platform on AWS.
"""

from typing import Optional, Dict
import json
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class TapStackArgs:
  """Configuration arguments for the TapStack component."""

  def __init__(self, environment_suffix: Optional[str] = None,
               tags: Optional[Dict[str, str]] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
  """
  Main Pulumi component for CI/CD pipeline microservices infrastructure.

  Creates all AWS resources required for a production-ready microservices
  platform including networking, compute, storage, databases, and monitoring.
  """

  def __init__(self, name: str, args: TapStackArgs, opts: ResourceOptions = None):
    super().__init__("custom:TapStack", name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.common_tags = {
      "Environment": "Production",
      "Project": "MicroservicesCI",
      "Owner": "DevOps",
      **args.tags
    }

    # Create VPC and networking
    self._create_networking()

    # Create security groups
    self._create_security_groups()

    # Create ECR repository
    self._create_ecr_repository()

    # Create RDS database
    self._create_rds_database()

    # Create ElastiCache Redis
    self._create_elasticache_redis()

    # Create Application Load Balancer (must be before ECS service)
    self._create_application_load_balancer()

    # Create ECS cluster and services
    self._create_ecs_infrastructure()

    # Create S3 buckets
    self._create_s3_buckets()

    # Create CloudFront distribution
    self._create_cloudfront_distribution()

    # Create monitoring and logging
    self._create_monitoring()

    # Create CloudTrail
    self._create_cloudtrail()

    # Register all outputs
    self.register_outputs({
      "vpc_id": self.vpc.id,
      "ecs_cluster_arn": self.ecs_cluster.arn,
      "rds_endpoint": self.db_instance.endpoint,
      "redis_endpoint": self.redis_cluster.cache_nodes[0].address,
      "alb_dns_name": self.alb.dns_name,
      "cloudfront_domain": self.cloudfront_distribution.domain_name,
      "ecr_repository_url": self.ecr_repository.repository_url,
      "s3_bucket_name": self.s3_bucket.bucket
    })

  def _create_networking(self):
    """Create VPC and networking components."""
    # VPC
    self.vpc = aws.ec2.Vpc(
      f"microservices-vpc-{self.environment_suffix}",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={**self.common_tags, "Name": f"microservices-vpc-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Internet Gateway
    self.igw = aws.ec2.InternetGateway(
      f"microservices-igw-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      tags={**self.common_tags, "Name": f"microservices-igw-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Get availability zones
    azs = aws.get_availability_zones(state="available")

    # Public subnets
    self.public_subnets = []
    for i in range(2):
      subnet = aws.ec2.Subnet(
        f"microservices-public-subnet-{i}-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=azs.names[i],
        map_public_ip_on_launch=True,
        tags={
          **self.common_tags,
          "Name": f"microservices-public-subnet-{i}-{self.environment_suffix}"
        },
        opts=ResourceOptions(parent=self)
      )
      self.public_subnets.append(subnet)

    # Private subnets
    self.private_subnets = []
    for i in range(2):
      subnet = aws.ec2.Subnet(
        f"microservices-private-subnet-{i}-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=azs.names[i],
        tags={
          **self.common_tags,
          "Name": f"microservices-private-subnet-{i}-{self.environment_suffix}"
        },
        opts=ResourceOptions(parent=self)
      )
      self.private_subnets.append(subnet)

    # NAT Gateways
    self.nat_gateways = []
    for i, public_subnet in enumerate(self.public_subnets):
      eip = aws.ec2.Eip(
        f"microservices-nat-eip-{i}-{self.environment_suffix}",
        domain="vpc",
        tags={**self.common_tags, "Name": f"microservices-nat-eip-{i}-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self)
      )

      nat_gw = aws.ec2.NatGateway(
        f"microservices-nat-gateway-{i}-{self.environment_suffix}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={
          **self.common_tags,
          "Name": f"microservices-nat-gateway-{i}-{self.environment_suffix}"
        },
        opts=ResourceOptions(parent=self)
      )
      self.nat_gateways.append(nat_gw)

    # Route tables
    self._create_route_tables()

  def _create_route_tables(self):
    """Create route tables for public and private subnets."""
    # Public route table
    self.public_rt = aws.ec2.RouteTable(
      f"microservices-public-rt-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      tags={**self.common_tags, "Name": f"microservices-public-rt-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Public route to Internet Gateway
    aws.ec2.Route(
      f"microservices-public-route-{self.environment_suffix}",
      route_table_id=self.public_rt.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.igw.id,
      opts=ResourceOptions(parent=self)
    )

    # Associate public subnets
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"microservices-public-rt-assoc-{i}-{self.environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=self.public_rt.id,
        opts=ResourceOptions(parent=self)
      )

    # Private route tables
    for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
      private_rt = aws.ec2.RouteTable(
        f"microservices-private-rt-{i}-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        tags={
          **self.common_tags,
          "Name": f"microservices-private-rt-{i}-{self.environment_suffix}"
        },
        opts=ResourceOptions(parent=self)
      )

      aws.ec2.Route(
        f"microservices-private-route-{i}-{self.environment_suffix}",
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id,
        opts=ResourceOptions(parent=self)
      )

      aws.ec2.RouteTableAssociation(
        f"microservices-private-rt-assoc-{i}-{self.environment_suffix}",
        subnet_id=private_subnet.id,
        route_table_id=private_rt.id,
        opts=ResourceOptions(parent=self)
      )

  def _create_security_groups(self):
    """Create security groups for different tiers."""
    # ALB Security Group
    self.alb_sg = aws.ec2.SecurityGroup(
      f"microservices-alb-sg-{self.environment_suffix}",
      name=f"microservices-alb-sg-{self.environment_suffix}",
      description="Security group for Application Load Balancer",
      vpc_id=self.vpc.id,
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
      tags={**self.common_tags, "Name": f"microservices-alb-sg-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # ECS Security Group
    self.ecs_sg = aws.ec2.SecurityGroup(
      f"microservices-ecs-sg-{self.environment_suffix}",
      name=f"microservices-ecs-sg-{self.environment_suffix}",
      description="Security group for ECS services",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=80,
          to_port=80,
          security_groups=[self.alb_sg.id]
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=8080,
          to_port=8080,
          security_groups=[self.alb_sg.id]
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
      tags={**self.common_tags, "Name": f"microservices-ecs-sg-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # RDS Security Group
    self.rds_sg = aws.ec2.SecurityGroup(
      f"microservices-rds-sg-{self.environment_suffix}",
      name=f"microservices-rds-sg-{self.environment_suffix}",
      description="Security group for RDS database",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=5432,
          to_port=5432,
          security_groups=[self.ecs_sg.id]
        )
      ],
      tags={**self.common_tags, "Name": f"microservices-rds-sg-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # ElastiCache Security Group
    self.elasticache_sg = aws.ec2.SecurityGroup(
      f"microservices-elasticache-sg-{self.environment_suffix}",
      name=f"microservices-elasticache-sg-{self.environment_suffix}",
      description="Security group for ElastiCache Redis",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=6379,
          to_port=6379,
          security_groups=[self.ecs_sg.id]
        )
      ],
      tags={**self.common_tags, "Name": f"microservices-elasticache-sg-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  def _create_ecr_repository(self):
    """Create ECR repository for container images."""
    self.ecr_repository = aws.ecr.Repository(
      f"microservices-ecr-{self.environment_suffix}",
      name=f"microservices-{self.environment_suffix}",
      image_tag_mutability="MUTABLE",
      image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
        scan_on_push=True
      ),
      lifecycle_policy=json.dumps({
        "rules": [{
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
        }]
      }),
      tags={**self.common_tags, "Name": f"microservices-ecr-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  def _create_rds_database(self):
    """Create RDS PostgreSQL database."""
    # DB Subnet Group
    self.db_subnet_group = aws.rds.SubnetGroup(
      f"microservices-db-subnet-group-{self.environment_suffix}",
      name=f"microservices-db-subnet-group-{self.environment_suffix}",
      subnet_ids=[subnet.id for subnet in self.private_subnets],
      tags={**self.common_tags, "Name": f"microservices-db-subnet-group-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Database secret
    self.db_secret = aws.secretsmanager.Secret(
      f"microservices-db-secret-{self.environment_suffix}",
      name=f"microservices-db-secret-{self.environment_suffix}",
      description="Database credentials for microservices",
      generate_secret_string=aws.secretsmanager.SecretGenerateSecretStringArgs(
        secret_string_template='{"username": "dbadmin"}',
        generate_string_key="password",
        exclude_characters='"@/\\',
        password_length=32
      ),
      tags={**self.common_tags, "Name": f"microservices-db-secret-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # RDS Instance
    self.db_instance = aws.rds.Instance(
      f"microservices-db-{self.environment_suffix}",
      identifier=f"microservices-db-{self.environment_suffix}",
      engine="postgres",
      engine_version="15",
      instance_class="db.t3.micro",
      allocated_storage=20,
      max_allocated_storage=100,
      storage_type="gp2",
      storage_encrypted=True,
      db_name="microservices",
      manage_master_user_password=True,
      master_user_secret_kms_key_id="alias/aws/rds",
      db_subnet_group_name=self.db_subnet_group.name,
      vpc_security_group_ids=[self.rds_sg.id],
      backup_retention_period=7,
      backup_window="03:00-04:00",
      maintenance_window="sun:04:00-sun:05:00",
      multi_az=True,
      deletion_protection=False,
      skip_final_snapshot=True,
      tags={**self.common_tags, "Name": f"microservices-db-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  def _create_elasticache_redis(self):
    """Create ElastiCache Redis cluster."""
    # ElastiCache Subnet Group
    self.elasticache_subnet_group = aws.elasticache.SubnetGroup(
      f"microservices-redis-subnet-group-{self.environment_suffix}",
      name=f"microservices-redis-subnet-group-{self.environment_suffix}",
      subnet_ids=[subnet.id for subnet in self.private_subnets],
      tags={
        **self.common_tags,
        "Name": f"microservices-redis-subnet-group-{self.environment_suffix}"
      },
      opts=ResourceOptions(parent=self)
    )

    # Redis Cluster
    self.redis_cluster = aws.elasticache.ReplicationGroup(
      f"microservices-redis-{self.environment_suffix}",
      replication_group_id=f"microservices-redis-{self.environment_suffix}",
      description="Redis cluster for microservices caching",
      node_type="cache.t3.micro",
      port=6379,
      num_cache_clusters=2,
      automatic_failover_enabled=True,
      multi_az_enabled=True,
      subnet_group_name=self.elasticache_subnet_group.name,
      security_group_ids=[self.elasticache_sg.id],
      at_rest_encryption_enabled=True,
      transit_encryption_enabled=True,
      auth_token="MyAuthToken123!",
      tags={**self.common_tags, "Name": f"microservices-redis-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  def _create_ecs_infrastructure(self):
    """Create ECS cluster and related resources."""
    # ECS Cluster
    self.ecs_cluster = aws.ecs.Cluster(
      f"microservices-ecs-cluster-{self.environment_suffix}",
      name=f"microservices-ecs-cluster-{self.environment_suffix}",
      settings=[
        aws.ecs.ClusterSettingArgs(
          name="containerInsights",
          value="enabled"
        )
      ],
      tags={**self.common_tags, "Name": f"microservices-ecs-cluster-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # CloudWatch Log Group
    self.log_group = aws.cloudwatch.LogGroup(
      f"ecs-logs-{self.environment_suffix}",
      name=f"/ecs/microservices-{self.environment_suffix}",
      retention_in_days=14,
      tags={**self.common_tags, "Name": f"ecs-logs-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # IAM Roles
    self._create_iam_roles()

    # Task Definition
    self.task_definition = aws.ecs.TaskDefinition(
      f"microservices-task-{self.environment_suffix}",
      family=f"microservices-{self.environment_suffix}",
      network_mode="awsvpc",
      requires_compatibilities=["FARGATE"],
      cpu="256",
      memory="512",
      execution_role_arn=self.execution_role.arn,
      task_role_arn=self.task_role.arn,
      container_definitions=self.ecr_repository.repository_url.apply(
        lambda url: json.dumps([{
          "name": "microservice",
          "image": f"{url}:latest",
          "portMappings": [{
            "containerPort": 80,
            "protocol": "tcp"
          }],
          "essential": True,
          "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
              "awslogs-group": f"/ecs/microservices-{self.environment_suffix}",
              "awslogs-region": "us-west-2",
              "awslogs-stream-prefix": "ecs"
            }
          },
          "environment": [{
            "name": "ENVIRONMENT",
            "value": self.environment_suffix
          }],
          "healthCheck": {
            "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
            "interval": 30,
            "timeout": 5,
            "retries": 3
          }
        }])
      ),
      tags={**self.common_tags, "Name": f"microservices-task-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # ECS Service
    self.ecs_service = aws.ecs.Service(
      f"microservices-service-{self.environment_suffix}",
      name=f"microservices-service-{self.environment_suffix}",
      cluster=self.ecs_cluster.id,
      task_definition=self.task_definition.arn,
      desired_count=2,
      launch_type="FARGATE",
      platform_version="LATEST",
      network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
        subnets=[subnet.id for subnet in self.private_subnets],
        security_groups=[self.ecs_sg.id],
        assign_public_ip=False
      ),
      deployment_configuration=aws.ecs.ServiceDeploymentConfigurationArgs(
        maximum_percent=200,
        minimum_healthy_percent=50
      ),
      tags={**self.common_tags, "Name": f"microservices-service-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self, depends_on=[self.alb_target_group])
    )

    # Auto Scaling
    self._create_auto_scaling()

  def _create_iam_roles(self):
    """Create IAM roles for ECS tasks."""
    # Task Execution Role
    self.execution_role = aws.iam.Role(
      f"microservices-execution-role-{self.environment_suffix}",
      name=f"microservices-execution-role-{self.environment_suffix}",
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
      tags={**self.common_tags, "Name": f"microservices-execution-role-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"microservices-execution-policy-{self.environment_suffix}",
      role=self.execution_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
      opts=ResourceOptions(parent=self)
    )

    # Task Role
    self.task_role = aws.iam.Role(
      f"microservices-task-role-{self.environment_suffix}",
      name=f"microservices-task-role-{self.environment_suffix}",
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
      tags={**self.common_tags, "Name": f"microservices-task-role-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"microservices-task-secrets-policy-{self.environment_suffix}",
      role=self.task_role.name,
      policy_arn="arn:aws:iam::aws:policy/SecretsManagerReadWrite",
      opts=ResourceOptions(parent=self)
    )

  def _create_auto_scaling(self):
    """Create auto scaling for ECS service."""
    # Auto Scaling Target
    self.scaling_target = aws.appautoscaling.Target(
      f"microservices-scaling-target-{self.environment_suffix}",
      max_capacity=10,
      min_capacity=2,
      resource_id=pulumi.Output.concat(
        "service/",
        self.ecs_cluster.name,
        "/",
        self.ecs_service.name
      ),
      scalable_dimension="ecs:service:DesiredCount",
      service_namespace="ecs",
      opts=ResourceOptions(parent=self)
    )

    # CPU Scaling Policy
    aws.appautoscaling.Policy(
      f"microservices-cpu-scaling-{self.environment_suffix}",
      name=f"microservices-cpu-scaling-{self.environment_suffix}",
      policy_type="TargetTrackingScaling",
      resource_id=self.scaling_target.resource_id,
      scalable_dimension=self.scaling_target.scalable_dimension,
      service_namespace=self.scaling_target.service_namespace,
      target_tracking_scaling_policy_configuration=(
        aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
        target_value=70.0,
        predefined_metric_specification=(
          aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
            predefined_metric_type="ECSServiceAverageCPUUtilization"
          )
        ),
        scale_out_cooldown=300,
        scale_in_cooldown=300
        )
      ),
      opts=ResourceOptions(parent=self)
    )

    # Memory Scaling Policy
    aws.appautoscaling.Policy(
      f"microservices-memory-scaling-{self.environment_suffix}",
      name=f"microservices-memory-scaling-{self.environment_suffix}",
      policy_type="TargetTrackingScaling",
      resource_id=self.scaling_target.resource_id,
      scalable_dimension=self.scaling_target.scalable_dimension,
      service_namespace=self.scaling_target.service_namespace,
      target_tracking_scaling_policy_configuration=(
        aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
        target_value=80.0,
        predefined_metric_specification=(
          aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
            predefined_metric_type="ECSServiceAverageMemoryUtilization"
          )
        ),
        scale_out_cooldown=300,
        scale_in_cooldown=300
        )
      ),
      opts=ResourceOptions(parent=self)
    )

  def _create_application_load_balancer(self):
    """Create Application Load Balancer."""
    # ALB
    self.alb = aws.lb.LoadBalancer(
      f"microservices-alb-{self.environment_suffix}",
      name=f"microservices-alb-{self.environment_suffix}",
      load_balancer_type="application",
      subnets=[subnet.id for subnet in self.public_subnets],
      security_groups=[self.alb_sg.id],
      enable_deletion_protection=False,
      tags={**self.common_tags, "Name": f"microservices-alb-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Target Group
    self.alb_target_group = aws.lb.TargetGroup(
      f"microservices-tg-{self.environment_suffix}",
      name=f"microservices-tg-{self.environment_suffix}",
      port=80,
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
        protocol="HTTP"
      ),
      tags={**self.common_tags, "Name": f"microservices-tg-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # ALB Listener
    self.alb_listener = aws.lb.Listener(
      f"microservices-listener-{self.environment_suffix}",
      load_balancer_arn=self.alb.arn,
      port=80,
      protocol="HTTP",
      default_actions=[
        aws.lb.ListenerDefaultActionArgs(
          type="forward",
          target_group_arn=self.alb_target_group.arn
        )
      ],
      opts=ResourceOptions(parent=self)
    )

  def _create_s3_buckets(self):
    """Create S3 buckets for artifacts and static content."""
    # Artifacts bucket
    self.s3_bucket = aws.s3.Bucket(
      f"microservices-artifacts-{self.environment_suffix}",
      bucket=f"microservices-artifacts-{self.environment_suffix}-{pulumi.get_stack()}",
      versioning=aws.s3.BucketVersioningArgs(enabled=True),
      server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
          apply_server_side_encryption_by_default=(
            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
              sse_algorithm="AES256"
            )
          )
        )
      ),
      tags={**self.common_tags, "Name": f"microservices-artifacts-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Public access block for artifacts bucket
    aws.s3.BucketPublicAccessBlock(
      f"microservices-artifacts-pab-{self.environment_suffix}",
      bucket=self.s3_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self)
    )

  def _create_cloudfront_distribution(self):
    """Create CloudFront distribution."""
    # S3 bucket for static content
    self.static_bucket = aws.s3.Bucket(
      f"microservices-static-{self.environment_suffix}",
      bucket=f"microservices-static-{self.environment_suffix}-{pulumi.get_stack()}",
      tags={**self.common_tags, "Name": f"microservices-static-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # CloudFront OAI
    self.oai = aws.cloudfront.OriginAccessIdentity(
      f"microservices-oai-{self.environment_suffix}",
      comment=f"OAI for microservices static content {self.environment_suffix}",
      opts=ResourceOptions(parent=self)
    )

    # CloudFront Distribution
    self.cloudfront_distribution = aws.cloudfront.Distribution(
      f"microservices-cloudfront-{self.environment_suffix}",
      origins=[
        aws.cloudfront.DistributionOriginArgs(
          domain_name=self.static_bucket.bucket_domain_name,
          origin_id=f"S3-{self.static_bucket.bucket}",
          s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
            origin_access_identity=self.oai.cloudfront_access_identity_path
          )
        )
      ],
      enabled=True,
      default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
        allowed_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cached_methods=["GET", "HEAD"],
        target_origin_id=f"S3-{self.static_bucket.bucket}",
        forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
          query_string=False,
          cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
            forward="none"
          )
        ),
        viewer_protocol_policy="redirect-to-https"
      ),
      restrictions=aws.cloudfront.DistributionRestrictionsArgs(
        geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
          restriction_type="none"
        )
      ),
      viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
        cloudfront_default_certificate=True
      ),
      tags={**self.common_tags, "Name": f"microservices-cloudfront-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  def _create_monitoring(self):
    """Create CloudWatch monitoring and SNS alerting."""
    # SNS Topic
    self.sns_topic = aws.sns.Topic(
      f"microservices-alerts-{self.environment_suffix}",
      name=f"microservices-alerts-{self.environment_suffix}",
      tags={**self.common_tags, "Name": f"microservices-alerts-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # CloudWatch Alarms
    aws.cloudwatch.MetricAlarm(
      f"microservices-cpu-alarm-{self.environment_suffix}",
      alarm_name=f"microservices-cpu-alarm-{self.environment_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/ECS",
      period=300,
      statistic="Average",
      threshold=80.0,
      alarm_description="This metric monitors ECS CPU utilization",
      alarm_actions=[self.sns_topic.arn],
      dimensions={
        "ServiceName": self.ecs_service.name,
        "ClusterName": self.ecs_cluster.name
      },
      tags={**self.common_tags, "Name": f"microservices-cpu-alarm-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    aws.cloudwatch.MetricAlarm(
      f"microservices-memory-alarm-{self.environment_suffix}",
      alarm_name=f"microservices-memory-alarm-{self.environment_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="MemoryUtilization",
      namespace="AWS/ECS",
      period=300,
      statistic="Average",
      threshold=85.0,
      alarm_description="This metric monitors ECS memory utilization",
      alarm_actions=[self.sns_topic.arn],
      dimensions={
        "ServiceName": self.ecs_service.name,
        "ClusterName": self.ecs_cluster.name
      },
      tags={**self.common_tags, "Name": f"microservices-memory-alarm-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  def _create_cloudtrail(self):
    """Create CloudTrail for audit logging."""
    # CloudTrail S3 bucket
    self.cloudtrail_bucket = aws.s3.Bucket(
      f"microservices-cloudtrail-{self.environment_suffix}",
      bucket=f"microservices-cloudtrail-{self.environment_suffix}-{pulumi.get_stack()}",
      versioning=aws.s3.BucketVersioningArgs(enabled=True),
      server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
          apply_server_side_encryption_by_default=(
            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
              sse_algorithm="AES256"
            )
          )
        )
      ),
      tags={**self.common_tags, "Name": f"microservices-cloudtrail-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # CloudTrail bucket policy
    cloudtrail_policy = aws.s3.BucketPolicy(
      f"microservices-cloudtrail-policy-{self.environment_suffix}",
      bucket=self.cloudtrail_bucket.id,
      policy=pulumi.Output.all(
        bucket_arn=self.cloudtrail_bucket.arn,
        account_id=aws.get_caller_identity().account_id
      ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Sid": "AWSCloudTrailAclCheck",
          "Effect": "Allow",
          "Principal": {"Service": "cloudtrail.amazonaws.com"},
          "Action": "s3:GetBucketAcl",
          "Resource": args["bucket_arn"]
        }, {
          "Sid": "AWSCloudTrailWrite",
          "Effect": "Allow",
          "Principal": {"Service": "cloudtrail.amazonaws.com"},
          "Action": "s3:PutObject",
          "Resource": f"{args['bucket_arn']}/*",
          "Condition": {
            "StringEquals": {
              "s3:x-amz-acl": "bucket-owner-full-control"
            }
          }
        }]
      })),
      opts=ResourceOptions(parent=self)
    )

    # CloudTrail
    self.cloudtrail = aws.cloudtrail.Trail(
      f"microservices-cloudtrail-{self.environment_suffix}",
      name=f"microservices-cloudtrail-{self.environment_suffix}",
      s3_bucket_name=self.cloudtrail_bucket.id,
      include_global_service_events=True,
      is_multi_region_trail=True,
      enable_logging=True,
      tags={**self.common_tags, "Name": f"microservices-cloudtrail-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self, depends_on=[cloudtrail_policy])
    )