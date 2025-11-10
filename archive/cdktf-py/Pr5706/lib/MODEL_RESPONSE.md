# Product Catalog API Infrastructure - MODEL RESPONSE

This implementation creates a complete containerized product catalog API infrastructure using CDKTF with Python.

## Architecture Overview

The infrastructure includes:
- VPC with public and private subnets across 2 availability zones
- ECS Fargate service with auto-scaling
- Application Load Balancer with health checks
- RDS Aurora PostgreSQL cluster
- CloudFront distribution for global content delivery
- Secrets Manager for database credentials
- CloudWatch logging for all components
- S3 bucket for logs with lifecycle policy

## File: lib/tap_stack.py

```py
"""TAP Stack module for cdktf py infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer, EcsServiceCapacityProviderStrategy
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy, AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration, AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification
from cdktf_cdktf_provider_aws.cloudfront_distribution import CloudfrontDistribution, CloudfrontDistributionOrigin, CloudfrontDistributionOriginCustomOriginConfig, CloudfrontDistributionDefaultCacheBehavior, CloudfrontDistributionDefaultCacheBehaviorForwardedValues, CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies, CloudfrontDistributionRestrictions, CloudfrontDistributionRestrictionsGeoRestriction, CloudfrontDistributionViewerCertificate
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import S3BucketLifecycleConfiguration, S3BucketLifecycleConfigurationRule, S3BucketLifecycleConfigurationRuleExpiration
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json


class TapStack(TerraformStack):
    """cdktf py stack for TAP infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'eu-north-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Add required tags
        merged_tags = default_tags.copy()
        if 'tags' not in merged_tags:
            merged_tags['tags'] = {}
        merged_tags['tags']['Environment'] = 'production'
        merged_tags['tags']['Project'] = 'catalog-api'

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[merged_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Get availability zones
        azs = DataAwsAvailabilityZones(self, "azs", state="available")

        # Create VPC
        vpc = Vpc(
            self,
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"catalog-api-vpc-{environment_suffix}"
            }
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            f"igw-{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"catalog-api-igw-{environment_suffix}"
            }
        )

        # Create Public Subnets
        public_subnet_1 = Subnet(
            self,
            f"public-subnet-1-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=Fn.element(azs.names, 0),
            map_public_ip_on_launch=True,
            tags={
                "Name": f"catalog-api-public-1-{environment_suffix}"
            }
        )

        public_subnet_2 = Subnet(
            self,
            f"public-subnet-2-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=Fn.element(azs.names, 1),
            map_public_ip_on_launch=True,
            tags={
                "Name": f"catalog-api-public-2-{environment_suffix}"
            }
        )

        # Create Private Subnets
        private_subnet_1 = Subnet(
            self,
            f"private-subnet-1-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone=Fn.element(azs.names, 0),
            tags={
                "Name": f"catalog-api-private-1-{environment_suffix}"
            }
        )

        private_subnet_2 = Subnet(
            self,
            f"private-subnet-2-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.4.0/24",
            availability_zone=Fn.element(azs.names, 1),
            tags={
                "Name": f"catalog-api-private-2-{environment_suffix}"
            }
        )

        # Create Public Route Table
        public_rt = RouteTable(
            self,
            f"public-rt-{environment_suffix}",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"catalog-api-public-rt-{environment_suffix}"
            }
        )

        # Associate Public Subnets with Public Route Table
        RouteTableAssociation(
            self,
            f"public-rta-1-{environment_suffix}",
            subnet_id=public_subnet_1.id,
            route_table_id=public_rt.id
        )

        RouteTableAssociation(
            self,
            f"public-rta-2-{environment_suffix}",
            subnet_id=public_subnet_2.id,
            route_table_id=public_rt.id
        )

        # Create S3 bucket for logs
        log_bucket = S3Bucket(
            self,
            f"log-bucket-{environment_suffix}",
            bucket=f"catalog-api-logs-{environment_suffix}",
            tags={
                "Name": f"catalog-api-logs-{environment_suffix}"
            }
        )

        # Create lifecycle policy for log bucket
        S3BucketLifecycleConfiguration(
            self,
            f"log-bucket-lifecycle-{environment_suffix}",
            bucket=log_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="delete-old-logs",
                    status="Enabled",
                    expiration=S3BucketLifecycleConfigurationRuleExpiration(
                        days=30
                    )
                )
            ]
        )

        # Create CloudWatch Log Group
        ecs_log_group = CloudwatchLogGroup(
            self,
            f"ecs-log-group-{environment_suffix}",
            name=f"/ecs/catalog-api-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"catalog-api-ecs-logs-{environment_suffix}"
            }
        )

        # Create Security Group for ALB
        alb_sg = SecurityGroup(
            self,
            f"alb-sg-{environment_suffix}",
            name=f"catalog-api-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTP from internet",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="All traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"catalog-api-alb-sg-{environment_suffix}"
            }
        )

        # Create Security Group for ECS
        ecs_sg = SecurityGroup(
            self,
            f"ecs-sg-{environment_suffix}",
            name=f"catalog-api-ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="API port from ALB",
                    from_port=3000,
                    to_port=3000,
                    protocol="tcp",
                    security_groups=[alb_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="All traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"catalog-api-ecs-sg-{environment_suffix}"
            }
        )

        # Create Security Group for RDS
        rds_sg = SecurityGroup(
            self,
            f"rds-sg-{environment_suffix}",
            name=f"catalog-api-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="PostgreSQL from ECS",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[ecs_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="All traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"catalog-api-rds-sg-{environment_suffix}"
            }
        )

        # Create DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            f"db-subnet-group-{environment_suffix}",
            name=f"catalog-api-db-subnet-{environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={
                "Name": f"catalog-api-db-subnet-{environment_suffix}"
            }
        )

        # Create Secrets Manager secret for database password
        db_secret = SecretsmanagerSecret(
            self,
            f"db-secret-{environment_suffix}",
            name=f"catalog-api-db-password-{environment_suffix}",
            description="Database password for catalog API",
            tags={
                "Name": f"catalog-api-db-password-{environment_suffix}"
            }
        )

        # Generate and store database password
        SecretsmanagerSecretVersion(
            self,
            f"db-secret-version-{environment_suffix}",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": "dbadmin",
                "password": "ChangeMe123456!"
            })
        )

        # Create RDS Aurora PostgreSQL Cluster
        rds_cluster = RdsCluster(
            self,
            f"rds-cluster-{environment_suffix}",
            cluster_identifier=f"catalog-api-db-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.3",
            database_name="catalogdb",
            master_username="dbadmin",
            master_password="ChangeMe123456!",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            skip_final_snapshot=True,
            tags={
                "Name": f"catalog-api-rds-cluster-{environment_suffix}"
            }
        )

        # Create RDS Cluster Instances
        RdsClusterInstance(
            self,
            f"rds-instance-1-{environment_suffix}",
            identifier=f"catalog-api-db-instance-1-{environment_suffix}",
            cluster_identifier=rds_cluster.id,
            instance_class="db.t3.medium",
            engine=rds_cluster.engine,
            engine_version=rds_cluster.engine_version,
            publicly_accessible=False,
            tags={
                "Name": f"catalog-api-rds-instance-1-{environment_suffix}"
            }
        )

        # Create Application Load Balancer
        alb = Lb(
            self,
            f"alb-{environment_suffix}",
            name=f"catalog-api-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[public_subnet_1.id, public_subnet_2.id],
            enable_deletion_protection=False,
            tags={
                "Name": f"catalog-api-alb-{environment_suffix}"
            }
        )

        # Create Target Group
        target_group = LbTargetGroup(
            self,
            f"tg-{environment_suffix}",
            name=f"catalog-api-tg-{environment_suffix}",
            port=3000,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            deregistration_delay="30",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                port="3000",
                protocol="HTTP",
                healthy_threshold=2,
                unhealthy_threshold=2,
                interval=30,
                timeout=5
            ),
            tags={
                "Name": f"catalog-api-tg-{environment_suffix}"
            }
        )

        # Create ALB Listener
        LbListener(
            self,
            f"alb-listener-{environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ]
        )

        # Create ECS Cluster
        ecs_cluster = EcsCluster(
            self,
            f"ecs-cluster-{environment_suffix}",
            name=f"catalog-api-cluster-{environment_suffix}",
            tags={
                "Name": f"catalog-api-cluster-{environment_suffix}"
            }
        )

        # Configure ECS Cluster Capacity Providers
        EcsClusterCapacityProviders(
            self,
            f"ecs-capacity-providers-{environment_suffix}",
            cluster_name=ecs_cluster.name,
            capacity_providers=["FARGATE_SPOT", "FARGATE"]
        )

        # Create ECS Task Execution Role
        task_execution_role = IamRole(
            self,
            f"task-execution-role-{environment_suffix}",
            name=f"catalog-api-task-execution-{environment_suffix}",
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
            tags={
                "Name": f"catalog-api-task-execution-{environment_suffix}"
            }
        )

        # Attach ECS Task Execution Policy
        IamRolePolicyAttachment(
            self,
            f"task-execution-policy-{environment_suffix}",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Create policy for Secrets Manager access
        secrets_policy = IamPolicy(
            self,
            f"secrets-policy-{environment_suffix}",
            name=f"catalog-api-secrets-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": db_secret.arn
                    }
                ]
            })
        )

        IamRolePolicyAttachment(
            self,
            f"secrets-policy-attachment-{environment_suffix}",
            role=task_execution_role.name,
            policy_arn=secrets_policy.arn
        )

        # Create ECS Task Definition
        task_definition = EcsTaskDefinition(
            self,
            f"task-definition-{environment_suffix}",
            family=f"catalog-api-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            execution_role_arn=task_execution_role.arn,
            task_role_arn=task_execution_role.arn,
            container_definitions=json.dumps([
                {
                    "name": f"catalog-api-{environment_suffix}",
                    "image": "nginx:latest",
                    "cpu": 1024,
                    "memory": 2048,
                    "essential": True,
                    "portMappings": [
                        {
                            "containerPort": 3000,
                            "protocol": "tcp"
                        }
                    ],
                    "environment": [
                        {
                            "name": "DB_HOST",
                            "value": rds_cluster.endpoint
                        },
                        {
                            "name": "DB_PORT",
                            "value": "5432"
                        },
                        {
                            "name": "DB_NAME",
                            "value": "catalogdb"
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": ecs_log_group.name,
                            "awslogs-region": aws_region,
                            "awslogs-stream-prefix": "ecs"
                        }
                    }
                }
            ]),
            tags={
                "Name": f"catalog-api-task-{environment_suffix}"
            }
        )

        # Create ECS Service
        ecs_service = EcsService(
            self,
            f"ecs-service-{environment_suffix}",
            name=f"catalog-api-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[private_subnet_1.id, private_subnet_2.id],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[
                EcsServiceLoadBalancer(
                    target_group_arn=target_group.arn,
                    container_name=f"catalog-api-{environment_suffix}",
                    container_port=3000
                )
            ],
            capacity_provider_strategy=[
                EcsServiceCapacityProviderStrategy(
                    capacity_provider="FARGATE_SPOT",
                    weight=100,
                    base=0
                )
            ],
            tags={
                "Name": f"catalog-api-service-{environment_suffix}"
            },
            depends_on=[target_group]
        )

        # Create Auto Scaling Target
        scaling_target = AppautoscalingTarget(
            self,
            f"scaling-target-{environment_suffix}",
            max_capacity=10,
            min_capacity=2,
            resource_id=f"service/{ecs_cluster.name}/{ecs_service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs"
        )

        # Create Auto Scaling Policy
        AppautoscalingPolicy(
            self,
            f"scaling-policy-{environment_suffix}",
            name=f"catalog-api-cpu-scaling-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            service_namespace=scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=70.0,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # Create CloudFront Distribution
        cloudfront = CloudfrontDistribution(
            self,
            f"cloudfront-{environment_suffix}",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"CloudFront distribution for catalog API {environment_suffix}",
            price_class="PriceClass_100",
            origin=[
                CloudfrontDistributionOrigin(
                    domain_name=alb.dns_name,
                    origin_id=f"alb-origin-{environment_suffix}",
                    custom_origin_config=CloudfrontDistributionOriginCustomOriginConfig(
                        http_port=80,
                        https_port=443,
                        origin_protocol_policy="http-only",
                        origin_ssl_protocols=["TLSv1.2"]
                    )
                )
            ],
            default_cache_behavior=CloudfrontDistributionDefaultCacheBehavior(
                allowed_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"alb-origin-{environment_suffix}",
                viewer_protocol_policy="redirect-to-https",
                compress=True,
                cache_policy_id="4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
                forwarded_values=CloudfrontDistributionDefaultCacheBehaviorForwardedValues(
                    query_string=True,
                    cookies=CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies(
                        forward="all"
                    ),
                    headers=["*"]
                )
            ),
            restrictions=CloudfrontDistributionRestrictions(
                geo_restriction=CloudfrontDistributionRestrictionsGeoRestriction(
                    restriction_type="none"
                )
            ),
            viewer_certificate=CloudfrontDistributionViewerCertificate(
                cloudfront_default_certificate=True
            ),
            tags={
                "Name": f"catalog-api-cloudfront-{environment_suffix}"
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="DNS name of the Application Load Balancer"
        )

        TerraformOutput(
            self,
            "cloudfront_distribution_url",
            value=f"https://{cloudfront.domain_name}",
            description="CloudFront distribution URL"
        )

        TerraformOutput(
            self,
            "rds_cluster_endpoint",
            value=rds_cluster.endpoint,
            description="RDS Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=ecs_cluster.name,
            description="ECS cluster name"
        )
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export AWS_REGION=eu-north-1
export ENVIRONMENT_SUFFIX=prod
export TERRAFORM_STATE_BUCKET=iac-rlhf-tf-states
export TERRAFORM_STATE_BUCKET_REGION=us-east-1
```

3. Synthesize the CDKTF application:
```bash
cdktf synth
```

4. Deploy the infrastructure:
```bash
cdktf deploy
```

5. After deployment, the outputs will show:
   - ALB DNS name
   - CloudFront distribution URL
   - RDS cluster endpoint
   - ECS cluster name

## Implementation Notes

- All resources include the environment_suffix for uniqueness
- Security groups follow least privilege principle with explicit port definitions
- ECS tasks use FARGATE_SPOT capacity provider for cost optimization
- Auto-scaling configured for 2-10 tasks based on CPU utilization
- RDS Aurora uses db.t3.medium instances with automatic backups
- CloudFront uses managed caching policy (Managed-CachingOptimized)
- CloudWatch logging enabled for ECS tasks
- S3 log bucket has 30-day lifecycle policy
- All resources tagged with Environment=production and Project=catalog-api
- No deletion protection or retain policies for clean teardown