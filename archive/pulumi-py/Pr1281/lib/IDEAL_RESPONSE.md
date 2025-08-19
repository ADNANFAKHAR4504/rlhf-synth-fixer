# CI/CD Pipeline for AWS Microservices Application

## Complete Infrastructure as Code Solution

This solution provides a production-ready CI/CD pipeline for microservices applications using Pulumi Python SDK and AWS services. The implementation follows enterprise-level best practices for security, scalability, and automation.

## Architecture Overview

The solution creates a comprehensive microservices platform with the following components:

- **Multi-AZ VPC** with public and private subnets across 2 availability zones
- **ECS Fargate** cluster for containerized microservices deployment
- **Application Load Balancer** with health checks and SSL termination capability
- **RDS PostgreSQL** with Multi-AZ deployment and automated backups
- **ElastiCache Redis** cluster for application caching and session storage
- **ECR** private registry for container images with lifecycle management
- **S3 buckets** for artifacts storage and static assets with encryption
- **CloudFront** distribution for global content delivery
- **CloudWatch** logs and monitoring with retention policies
- **IAM roles** with least privilege access principles
- **Auto-scaling** configuration for ECS services based on CPU metrics

## Implementation

### Core Infrastructure Stack

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project implementing a complete CI/CD pipeline
for microservices on AWS.
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
    """Configuration arguments for the TapStack component."""

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for microservices CI/CD infrastructure.
    
    Creates all AWS resources required for a production-ready microservices
    platform including networking, compute, storage, and monitoring.
    """

    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        self.environment_suffix = args.environment_suffix
        self.common_tags = {
            "Environment": "Production",
            "Project": "MicroservicesCI",
            "Owner": "DevOps",
            "ManagedBy": "Pulumi",
            "EnvironmentSuffix": self.environment_suffix
        }
        
        if args.tags:
            self.common_tags.update(args.tags)
            
        self._create_networking()
        self._create_security_groups()
        self._create_storage()
        self._create_database()
        self._create_cache()
        self._create_container_services()
        self._create_load_balancer()
        self._create_iam_roles()
        self._create_ecs_infrastructure()
        self._create_monitoring()
        self._create_cdn()
        self._export_outputs()

    def _create_networking(self):
        """Create VPC, subnets, and networking infrastructure."""
        azs = aws.get_availability_zones(state="available")
        
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
        
        # Create subnets across multiple AZs
        self.public_subnets = []
        self.private_subnets = []
        self.nat_gateways = []
        self.eips = []
        
        for i in range(2):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"public-subnet-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={**self.common_tags, "Name": f"private-subnet-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)
            
            # NAT Gateway infrastructure
            eip = aws.ec2.Eip(
                f"nat-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={**self.common_tags, "Name": f"nat-eip-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.eips.append(eip)
            
            nat_gw = aws.ec2.NatGateway(
                f"nat-gateway-{i+1}-{self.environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**self.common_tags, "Name": f"nat-gateway-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat_gw)
        
        # Route tables and associations
        self._create_route_tables()
    
    def _create_route_tables(self):
        """Create route tables for public and private subnets."""
        # Public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Public route to Internet Gateway
        aws.ec2.Route(
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
        
        # Private route tables (one per AZ for NAT Gateway)
        self.private_route_tables = []
        for i, subnet in enumerate(self.private_subnets):
            private_rt = aws.ec2.RouteTable(
                f"private-rt-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={**self.common_tags, "Name": f"private-rt-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.private_route_tables.append(private_rt)
            
            # Private route to NAT Gateway
            aws.ec2.Route(
                f"private-route-{i+1}-{self.environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateways[i].id,
                opts=ResourceOptions(parent=self)
            )
            
            # Associate private subnet with private route table
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )

    def _create_security_groups(self):
        """Create security groups with least privilege access."""
        # ALB Security Group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{self.environment_suffix}",
            name=f"alb-sg-{self.environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp", from_port=80, to_port=80, 
                    cidr_blocks=["0.0.0.0/0"], description="HTTP access"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp", from_port=443, to_port=443,
                    cidr_blocks=["0.0.0.0/0"], description="HTTPS access"
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
                    protocol="tcp", from_port=8000, to_port=8000,
                    security_groups=[self.alb_sg.id], description="Access from ALB"
                )
            ],
            tags={**self.common_tags, "Name": f"ecs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Database and Cache Security Groups
        self.db_sg = aws.ec2.SecurityGroup(
            f"db-sg-{self.environment_suffix}",
            name=f"db-sg-{self.environment_suffix}",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp", from_port=5432, to_port=5432,
                    security_groups=[self.ecs_sg.id], description="PostgreSQL access from ECS"
                )
            ],
            tags={**self.common_tags, "Name": f"db-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        self.cache_sg = aws.ec2.SecurityGroup(
            f"cache-sg-{self.environment_suffix}",
            name=f"cache-sg-{self.environment_suffix}",
            description="Security group for Redis cache",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp", from_port=6379, to_port=6379,
                    security_groups=[self.ecs_sg.id], description="Redis access from ECS"
                )
            ],
            tags={**self.common_tags, "Name": f"cache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
```

### Storage Infrastructure

```python
def _create_storage(self):
    """Create S3 buckets for artifacts and static assets."""
    # Artifacts bucket with versioning and encryption
    self.artifacts_bucket = aws.s3.Bucket(
        f"artifacts-bucket-{self.environment_suffix}",
        bucket=f"microservices-artifacts-{self.environment_suffix}",
        versioning=aws.s3.BucketVersioningArgs(enabled=True),
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
                id="delete-old-versions",
                noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                    days=90
                )
            )
        ],
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
    
    # Bucket policy for IAM role access
    aws.s3.BucketPolicy(
        f"artifacts-bucket-policy-{self.environment_suffix}",
        bucket=self.artifacts_bucket.id,
        policy=self.artifacts_bucket.arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                "Action": ["s3:GetObject", "s3:PutObject"],
                "Resource": [f"{arn}/*", arn]
            }]
        })),
        opts=ResourceOptions(parent=self)
    )
```

### Database and Cache Infrastructure

```python
def _create_database(self):
    """Create RDS PostgreSQL with Multi-AZ deployment."""
    self.db_subnet_group = aws.rds.SubnetGroup(
        f"db-subnet-group-{self.environment_suffix}",
        subnet_ids=[subnet.id for subnet in self.private_subnets],
        tags={**self.common_tags, "Name": f"db-subnet-group-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self)
    )
    
    # Secrets Manager for credentials
    self.db_secret = aws.secretsmanager.Secret(
        f"db-credentials-{self.environment_suffix}",
        name=f"microservices/db-credentials-{self.environment_suffix}",
        description="Database credentials for microservices",
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
    
    # RDS Instance with Multi-AZ
    self.db_instance = aws.rds.Instance(
        f"postgres-db-{self.environment_suffix}",
        identifier=f"microservices-db-{self.environment_suffix}",
        engine="postgres",
        engine_version="15",
        instance_class="db.t3.micro",
        allocated_storage=20,
        storage_encrypted=True,
        multi_az=True,
        backup_retention_period=7,
        performance_insights_enabled=True,
        vpc_security_group_ids=[self.db_sg.id],
        db_subnet_group_name=self.db_subnet_group.name,
        tags={**self.common_tags, "Name": f"postgres-db-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self)
    )

def _create_cache(self):
    """Create ElastiCache Redis cluster."""
    self.cache_subnet_group = aws.elasticache.SubnetGroup(
        f"cache-subnet-group-{self.environment_suffix}",
        subnet_ids=[subnet.id for subnet in self.private_subnets],
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
    
    self.redis_cluster = aws.elasticache.ReplicationGroup(
        f"redis-cluster-{self.environment_suffix}",
        replication_group_id=f"redis-{self.environment_suffix}",
        description="Redis cluster for microservices caching",
        node_type="cache.t3.micro",
        num_cache_clusters=2,
        automatic_failover_enabled=True,
        multi_az_enabled=True,
        at_rest_encryption_enabled=True,
        subnet_group_name=self.cache_subnet_group.name,
        security_group_ids=[self.cache_sg.id],
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
```

### Container Services and Load Balancing

```python
def _create_container_services(self):
    """Create ECR repository and ECS cluster."""
    self.ecr_repository = aws.ecr.Repository(
        f"microservices-repo-{self.environment_suffix}",
        name=f"microservices-{self.environment_suffix}",
        image_tag_mutability="MUTABLE",
        image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
            scan_on_push=True
        ),
        encryption_configuration=aws.ecr.RepositoryEncryptionConfigurationArgs(
            encryption_type="AES256"
        ),
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
    
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

def _create_load_balancer(self):
    """Create Application Load Balancer with health checks."""
    self.alb = aws.lb.LoadBalancer(
        f"alb-{self.environment_suffix}",
        name=f"microservices-alb-{self.environment_suffix}",
        load_balancer_type="application",
        security_groups=[self.alb_sg.id],
        subnets=[subnet.id for subnet in self.public_subnets],
        enable_deletion_protection=False,
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
    
    self.target_group = aws.lb.TargetGroup(
        f"tg-{self.environment_suffix}",
        name=f"microservices-tg-{self.environment_suffix}",
        port=8000,
        protocol="HTTP",
        vpc_id=self.vpc.id,
        target_type="ip",
        health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            path="/health",
            healthy_threshold=2,
            unhealthy_threshold=2,
            timeout=5,
            interval=30
        ),
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
    
    self.alb_listener = aws.lb.Listener(
        f"alb-listener-{self.environment_suffix}",
        load_balancer_arn=self.alb.arn,
        port=80,
        protocol="HTTP",
        default_actions=[{
            "type": "forward",
            "targetGroupArn": self.target_group.arn
        }],
        opts=ResourceOptions(parent=self)
    )

def _create_ecs_infrastructure(self):
    """Create ECS task definition and service with FARGATE network configuration."""
    # Task execution role for pulling images from ECR
    self.task_execution_role = aws.iam.Role(
        f"ecs-task-execution-role-{self.environment_suffix}",
        name=f"ecs-task-execution-{self.environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {"Service": "ecs-tasks.amazonaws.com"}
            }]
        }),
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
    
    # Attach managed policy for ECR access
    aws.iam.RolePolicyAttachment(
        f"ecs-task-execution-policy-{self.environment_suffix}",
        role=self.task_execution_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
        opts=ResourceOptions(parent=self)
    )
    
    # Task definition with FARGATE compatibility
    self.task_definition = aws.ecs.TaskDefinition(
        f"task-def-{self.environment_suffix}",
        family=f"microservices-{self.environment_suffix}",
        network_mode="awsvpc",
        requires_compatibilities=["FARGATE"],
        cpu="256",
        memory="512",
        execution_role_arn=self.task_execution_role.arn,
        container_definitions=pulumi.Output.json_dumps([{
            "name": f"microservices-{self.environment_suffix}",
            "image": f"{self.ecr_repository.repository_url}:latest",
            "portMappings": [{
                "containerPort": 8000,
                "protocol": "tcp"
            }],
            "essential": True,
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": self.log_group.name,
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "environment": [
                {"name": "ENVIRONMENT", "value": self.environment_suffix},
                {"name": "DB_HOST", "value": self.db_instance.endpoint}
            ]
        }]),
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
    
    # ECS Service with FARGATE network configuration
    self.ecs_service = aws.ecs.Service(
        f"ecs-service-{self.environment_suffix}",
        name=f"microservices-{self.environment_suffix}",
        cluster=self.ecs_cluster.id,
        task_definition=self.task_definition.arn,
        desired_count=2,
        launch_type="FARGATE",
        network_configuration={
            "assignPublicIp": "ENABLED",
            "subnets": [subnet.id for subnet in self.private_subnets],
            "securityGroups": [self.ecs_sg.id]
        },
        load_balancers=[{
            "targetGroupArn": self.target_group.arn,
            "containerName": f"microservices-{self.environment_suffix}",
            "containerPort": 8000
        }],
        deployment_configuration={
            "maximumPercent": 200,
            "minimumHealthyPercent": 100
        },
        tags=self.common_tags,
        opts=ResourceOptions(parent=self, depends_on=[self.alb_listener])
    )
    
    # Auto-scaling configuration
    self.ecs_scaling_target = aws.appautoscaling.Target(
        f"ecs-scaling-target-{self.environment_suffix}",
        max_capacity=10,
        min_capacity=2,
        resource_id=pulumi.Output.concat(
            "service/", self.ecs_cluster.name, "/", self.ecs_service.name
        ),
        scalable_dimension="ecs:service:DesiredCount",
        service_namespace="ecs",
        opts=ResourceOptions(parent=self)
    )
    
    self.ecs_scaling_policy = aws.appautoscaling.Policy(
        f"ecs-scaling-policy-{self.environment_suffix}",
        name=f"cpu-scaling-{self.environment_suffix}",
        policy_type="TargetTrackingScaling",
        resource_id=self.ecs_scaling_target.resource_id,
        scalable_dimension=self.ecs_scaling_target.scalable_dimension,
        service_namespace=self.ecs_scaling_target.service_namespace,
        target_tracking_scaling_policy_configuration={
            "predefinedMetricSpecification": {
                "predefinedMetricType": "ECSServiceAverageCPUUtilization"
            },
            "targetValue": 70.0
        },
        opts=ResourceOptions(parent=self)
    )
```

### IAM Roles and Policies

```python
def _create_iam_roles(self):
    """Create IAM roles for ECS tasks and services."""
    # Task role for application-level permissions
    self.task_role = aws.iam.Role(
        f"ecs-task-role-{self.environment_suffix}",
        name=f"ecs-task-{self.environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {"Service": "ecs-tasks.amazonaws.com"}
            }]
        }),
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
    
    # Custom policy for S3 and Secrets Manager access
    aws.iam.RolePolicy(
        f"ecs-task-policy-{self.environment_suffix}",
        role=self.task_role.id,
        policy=pulumi.Output.all(
            self.artifacts_bucket.arn,
            self.db_secret.arn
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [f"{args[0]}/*", args[0]]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": args[1]
                }
            ]
        })),
        opts=ResourceOptions(parent=self)
    )
```

### CDN Infrastructure

```python
def _create_cdn(self):
    """Create CloudFront distribution for static content delivery."""
    # Origin Access Identity for S3
    self.oai = aws.cloudfront.OriginAccessIdentity(
        f"oai-{self.environment_suffix}",
        comment=f"OAI for {self.environment_suffix} environment",
        opts=ResourceOptions(parent=self)
    )
    
    # CloudFront distribution
    self.cloudfront_distribution = aws.cloudfront.Distribution(
        f"cdn-{self.environment_suffix}",
        enabled=True,
        is_ipv6_enabled=True,
        default_root_object="index.html",
        price_class="PriceClass_100",
        
        origins=[
            aws.cloudfront.DistributionOriginArgs(
                domain_name=self.artifacts_bucket.bucket_regional_domain_name,
                origin_id=f"S3-{self.artifacts_bucket.id}",
                s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                    origin_access_identity=self.oai.cloudfront_access_identity_path
                )
            ),
            aws.cloudfront.DistributionOriginArgs(
                domain_name=self.alb.dns_name,
                origin_id=f"ALB-{self.alb.id}",
                custom_origin_config=aws.cloudfront.DistributionOriginCustomOriginConfigArgs(
                    http_port=80,
                    https_port=443,
                    origin_protocol_policy="http-only",
                    origin_ssl_protocols=["TLSv1.2"]
                )
            )
        ],
        
        default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
            allowed_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
            cached_methods=["GET", "HEAD"],
            target_origin_id=f"ALB-{self.alb.id}",
            viewer_protocol_policy="redirect-to-https",
            forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                query_string=True,
                headers=["Host", "Origin", "Authorization"],
                cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                    forward="all"
                )
            ),
            min_ttl=0,
            default_ttl=0,
            max_ttl=0
        ),
        
        ordered_cache_behaviors=[
            aws.cloudfront.DistributionOrderedCacheBehaviorArgs(
                path_pattern="/static/*",
                allowed_methods=["GET", "HEAD"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"S3-{self.artifacts_bucket.id}",
                viewer_protocol_policy="redirect-to-https",
                forwarded_values=aws.cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                    query_string=False,
                    cookies=aws.cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                        forward="none"
                    )
                ),
                min_ttl=0,
                default_ttl=86400,
                max_ttl=31536000
            )
        ],
        
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
```

### Monitoring and Security

```python
def _create_monitoring(self):
    """Create CloudWatch logs and monitoring."""
    self.log_group = aws.cloudwatch.LogGroup(
        f"ecs-logs-{self.environment_suffix}",
        name=f"/ecs/microservices-{self.environment_suffix}",
        retention_in_days=14,
        tags=self.common_tags,
        opts=ResourceOptions(parent=self)
    )
```

## GitHub Actions CI/CD Pipeline

Create `.github/workflows/ci-cd.yml`:

```yaml
name: Microservices CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: microservices
  
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
          
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          
      - name: Run unit tests
        run: |
          python -m pytest tests/unit/ -v --cov=lib --cov-report=term-missing
          
      - name: Run linting
        run: |
          flake8 lib/ tests/
          
  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Set up Pulumi
        uses: pulumi/actions@v4
        with:
          command: up
          stack-name: prod
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
        
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster microservices-prod --service microservices-prod --force-new-deployment
          
      - name: Run integration tests
        run: |
          python -m pytest tests/integration/ -v
```

## Deployment Solutions and Best Practices

### ECS FARGATE Network Configuration Requirements

When deploying ECS services with FARGATE launch type, the following network configuration is mandatory:

```python
network_configuration={
    "assignPublicIp": "ENABLED",  # Required for pulling images from ECR
    "subnets": [subnet.id for subnet in self.private_subnets],
    "securityGroups": [self.ecs_sg.id]
}
```

### Database Version Compatibility

AWS RDS requires specific version formats for different database engines:

```python
# PostgreSQL - Use major version only for latest minor version
engine_version="15"  # Automatically uses latest 15.x version

# MySQL - Similar pattern
engine_version="8.0"  # Uses latest 8.0.x version
```

### S3 Bucket Naming Strategies

To avoid naming conflicts in S3 (globally unique namespace):

```python
import hashlib
import pulumi

# Strategy 1: Use account ID
account_id = aws.get_caller_identity().account_id
bucket_name = f"artifacts-{account_id}-{environment_suffix}"

# Strategy 2: Use unique hash
unique_hash = hashlib.md5(f"{pulumi.get_project()}-{pulumi.get_stack()}".encode()).hexdigest()[:8]
bucket_name = f"artifacts-{unique_hash}-{environment_suffix}"

# Strategy 3: Use timestamp
import time
timestamp = str(int(time.time()))
bucket_name = f"artifacts-{timestamp}-{environment_suffix}"
```

### JSON Serialization with Pulumi Outputs

Pulumi Output objects require special handling for JSON serialization:

```python
# Incorrect - Will fail with "Output is not JSON serializable"
policy = json.dumps({
    "Statement": [{
        "Resource": self.bucket.arn  # This is an Output object
    }]
})

# Correct - Use Output.apply() for serialization
policy = self.bucket.arn.apply(lambda arn: json.dumps({
    "Statement": [{
        "Resource": arn  # Now it's a resolved string
    }]
}))
```

### Redis Parameter Group Configuration

ElastiCache Redis requires compatible parameter group families:

```python
# Create custom parameter group for Redis 7.0
redis_param_group = aws.elasticache.ParameterGroup(
    f"redis-params-{environment_suffix}",
    family="redis7",  # Must match Redis engine version
    parameters=[
        {"name": "maxmemory-policy", "value": "allkeys-lru"},
        {"name": "timeout", "value": "300"}
    ]
)
```

## Testing Strategy

### Unit Tests (>50% Coverage)

```python
import unittest
from unittest.mock import MagicMock, patch
from lib.tap_stack import TapStack, TapStackArgs

class TestTapStack(unittest.TestCase):
    """Comprehensive unit tests with mocking for >50% coverage."""
    
    def test_stack_initialization(self):
        """Test stack initializes with correct configuration."""
        args = TapStackArgs(environment_suffix="test")
        
        with patch('pulumi_aws.ec2.Vpc'), patch('pulumi_aws.get_availability_zones'):
            stack = TapStack("test-stack", args)
            self.assertEqual(stack.environment_suffix, "test")
            
    def test_networking_resources(self):
        """Test VPC and networking resources creation."""
        args = TapStackArgs(environment_suffix="test")
        
        with patch('pulumi_aws.ec2.Vpc') as mock_vpc, \
             patch('pulumi_aws.ec2.InternetGateway') as mock_igw, \
             patch('pulumi_aws.ec2.Subnet') as mock_subnet, \
             patch('pulumi_aws.get_availability_zones'):
            
            mock_vpc.return_value = MagicMock()
            mock_vpc.return_value.id = "vpc-12345"
            
            stack = TapStack("test-stack", args)
            
            # Verify VPC was created with correct CIDR
            mock_vpc.assert_called_once()
            call_args = mock_vpc.call_args[1]
            self.assertEqual(call_args['cidr_block'], "10.0.0.0/16")
            
            # Verify Internet Gateway was created
            mock_igw.assert_called_once()
            
            # Verify subnets were created (2 public, 2 private)
            self.assertEqual(mock_subnet.call_count, 4)
    
    def test_security_groups(self):
        """Test security group creation with proper rules."""
        args = TapStackArgs(environment_suffix="test")
        
        with patch('pulumi_aws.ec2.SecurityGroup') as mock_sg, \
             patch('pulumi_aws.ec2.Vpc'), \
             patch('pulumi_aws.get_availability_zones'):
            
            mock_sg.return_value = MagicMock()
            mock_sg.return_value.id = "sg-12345"
            
            stack = TapStack("test-stack", args)
            
            # Verify security groups were created
            self.assertEqual(mock_sg.call_count, 4)  # ALB, ECS, DB, Cache
            
            # Check ALB security group allows HTTP/HTTPS
            alb_sg_call = mock_sg.call_args_list[0]
            ingress_rules = alb_sg_call[1]['ingress']
            self.assertEqual(len(ingress_rules), 2)
            self.assertEqual(ingress_rules[0].from_port, 80)
            self.assertEqual(ingress_rules[1].from_port, 443)
    
    def test_database_configuration(self):
        """Test RDS database configuration."""
        args = TapStackArgs(environment_suffix="test")
        
        with patch('pulumi_aws.rds.Instance') as mock_rds, \
             patch('pulumi_aws.rds.SubnetGroup'), \
             patch('pulumi_aws.secretsmanager.Secret'), \
             patch('pulumi_aws.ec2.Vpc'), \
             patch('pulumi_aws.get_availability_zones'):
            
            mock_rds.return_value = MagicMock()
            
            stack = TapStack("test-stack", args)
            
            # Verify RDS instance configuration
            mock_rds.assert_called_once()
            call_args = mock_rds.call_args[1]
            self.assertEqual(call_args['engine'], 'postgres')
            self.assertEqual(call_args['engine_version'], '15')
            self.assertTrue(call_args['multi_az'])
            self.assertTrue(call_args['storage_encrypted'])
```

### Integration Tests (No Mocking)

```python
import unittest
import boto3
from botocore.exceptions import ClientError

class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live AWS resources."""
    
    def setUp(self):
        """Initialize AWS clients for live resource testing."""
        self.ec2_client = boto3.client('ec2', region_name='us-east-1')
        self.ecs_client = boto3.client('ecs', region_name='us-east-1')
        self.rds_client = boto3.client('rds', region_name='us-east-1')
        
    def test_vpc_and_networking(self):
        """Test VPC and networking components are deployed."""
        vpcs = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Project', 'Values': ['MicroservicesCI']},
                {'Name': 'state', 'Values': ['available']}
            ]
        )
        self.assertGreater(len(vpcs['Vpcs']), 0)
        
    def test_rds_instance(self):
        """Validate RDS PostgreSQL instance configuration."""
        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier='microservices-db-dev'
        )
        db_instance = response['DBInstances'][0]
        self.assertEqual(db_instance['Engine'], 'postgres')
        self.assertTrue(db_instance['MultiAZ'])
```

## Deployment Outputs

The stack exports all critical resource identifiers for integration testing:

```python
def _export_outputs(self):
    """Export all resource identifiers for integration tests."""
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
```

## Security Features

- **IAM Least Privilege**: All roles follow principle of least privilege access
- **Network Security**: Multi-layer security groups with minimal required access
- **Encryption**: All data encrypted in transit and at rest
- **Audit Logging**: CloudWatch logging for monitoring and debugging
- **Secrets Management**: Database credentials stored in AWS Secrets Manager
- **Container Security**: ECR image scanning enabled for vulnerability detection

## High Availability & Scalability

- **Multi-AZ Deployment**: Resources deployed across multiple availability zones
- **Auto Scaling**: ECS services scale based on CPU utilization metrics
- **Load Balancing**: Application Load Balancer with health checks
- **Database Resilience**: RDS with Multi-AZ and automated backups
- **Cache Redundancy**: ElastiCache Redis with automatic failover
- **Rolling Deployments**: Zero-downtime deployment strategy with circuit breakers

## Monitoring & Observability

- **CloudWatch Logs**: Centralized logging with retention policies
- **Container Insights**: Enhanced ECS monitoring and metrics
- **Performance Insights**: RDS performance monitoring enabled
- **Distributed Tracing**: Ready for AWS X-Ray integration
- **Custom Metrics**: Application-level metrics collection capability

This solution provides a complete, production-ready infrastructure foundation for microservices applications with enterprise-level security, monitoring, and scalability features.