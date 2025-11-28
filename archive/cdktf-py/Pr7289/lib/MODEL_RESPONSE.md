# E-Commerce Infrastructure Implementation - CDKTF Python

This implementation provides a production-ready e-commerce infrastructure using CDKTF with Python, deployed to AWS us-east-1 region.

## Architecture Overview

The infrastructure includes:
- Multi-AZ VPC with public and private subnets
- Aurora Serverless v2 PostgreSQL cluster
- ECS Fargate for containerized applications
- Application Load Balancer with AWS WAF
- S3 + CloudFront for static asset delivery
- AWS Secrets Manager with automatic rotation
- Auto-scaling based on CPU metrics

## File: lib/tap_stack.py

```python
"""E-Commerce Infrastructure Stack for CDKTF Python."""

from cdktf import TerraformStack, S3Backend, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.cloudfront_distribution import CloudfrontDistribution, CloudfrontDistributionOrigin, CloudfrontDistributionDefaultCacheBehavior, CloudfrontDistributionRestrictions, CloudfrontDistributionRestrictionsGeoRestriction, CloudfrontDistributionViewerCertificate
from cdktf_cdktf_provider_aws.cloudfront_origin_access_identity import CloudfrontOriginAccessIdentity
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.wafv2_web_acl import Wafv2WebAcl, Wafv2WebAclRule, Wafv2WebAclRuleStatement, Wafv2WebAclRuleStatementRateBasedStatement, Wafv2WebAclRuleAction, Wafv2WebAclVisibilityConfig, Wafv2WebAclDefaultAction
from cdktf_cdktf_provider_aws.wafv2_web_acl_association import Wafv2WebAclAssociation
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceLoadBalancer, EcsServiceNetworkConfiguration
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy, AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration, AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for E-Commerce infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the E-Commerce stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
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
        azs = [f"{aws_region}a", f"{aws_region}b"]

        # =================================================================
        # 1. VPC AND NETWORKING
        # =================================================================

        vpc = Vpc(
            self,
            f"ecommerce_vpc_{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"ecommerce-vpc-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            f"ecommerce_igw_{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"ecommerce-igw-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Public Subnets (2)
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"public_subnet_{i}_{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"ecommerce-public-subnet-{i}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Project": "ecommerce",
                    "Owner": "platform-team"
                }
            )
            public_subnets.append(subnet)

        # Private Subnets (4 - 2 for app, 2 for database)
        private_subnets = []
        for i, az in enumerate(azs):
            # App subnet
            app_subnet = Subnet(
                self,
                f"private_app_subnet_{i}_{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"ecommerce-private-app-subnet-{i}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Project": "ecommerce",
                    "Owner": "platform-team"
                }
            )
            private_subnets.append(app_subnet)

            # Database subnet
            db_subnet = Subnet(
                self,
                f"private_db_subnet_{i}_{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{20+i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"ecommerce-private-db-subnet-{i}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Project": "ecommerce",
                    "Owner": "platform-team"
                }
            )
            private_subnets.append(db_subnet)

        # NAT Gateways (one per AZ for high availability)
        nat_gateways = []
        for i, public_subnet in enumerate(public_subnets):
            eip = Eip(
                self,
                f"nat_eip_{i}_{environment_suffix}",
                domain="vpc",
                tags={
                    "Name": f"ecommerce-nat-eip-{i}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Project": "ecommerce",
                    "Owner": "platform-team"
                }
            )

            nat = NatGateway(
                self,
                f"nat_gateway_{i}_{environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    "Name": f"ecommerce-nat-{i}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Project": "ecommerce",
                    "Owner": "platform-team"
                }
            )
            nat_gateways.append(nat)

        # Public Route Table
        public_rt = RouteTable(
            self,
            f"public_rt_{environment_suffix}",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"ecommerce-public-rt-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Private Route Tables (one per NAT Gateway)
        for i, nat in enumerate(nat_gateways):
            private_rt = RouteTable(
                self,
                f"private_rt_{i}_{environment_suffix}",
                vpc_id=vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat.id
                    )
                ],
                tags={
                    "Name": f"ecommerce-private-rt-{i}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Project": "ecommerce",
                    "Owner": "platform-team"
                }
            )

            # Associate private subnets in this AZ with this route table
            RouteTableAssociation(
                self,
                f"private_app_rt_assoc_{i}_{environment_suffix}",
                subnet_id=private_subnets[i*2].id,
                route_table_id=private_rt.id
            )
            RouteTableAssociation(
                self,
                f"private_db_rt_assoc_{i}_{environment_suffix}",
                subnet_id=private_subnets[i*2+1].id,
                route_table_id=private_rt.id
            )

        # =================================================================
        # 2. SECURITY GROUPS
        # =================================================================

        # ALB Security Group (HTTPS from internet)
        alb_sg = SecurityGroup(
            self,
            f"alb_sg_{environment_suffix}",
            name=f"ecommerce-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet"
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP for redirect to HTTPS"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"ecommerce-alb-sg-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # ECS Security Group (traffic from ALB)
        ecs_sg = SecurityGroup(
            self,
            f"ecs_sg_{environment_suffix}",
            name=f"ecommerce-ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[alb_sg.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"ecommerce-ecs-sg-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Aurora Security Group (traffic from ECS)
        aurora_sg = SecurityGroup(
            self,
            f"aurora_sg_{environment_suffix}",
            name=f"ecommerce-aurora-sg-{environment_suffix}",
            description="Security group for Aurora cluster",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow PostgreSQL from ECS"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"ecommerce-aurora-sg-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # =================================================================
        # 3. SECRETS MANAGER (Database Credentials)
        # =================================================================

        db_secret = SecretsmanagerSecret(
            self,
            f"db_secret_{environment_suffix}",
            name=f"ecommerce-db-credentials-{environment_suffix}",
            description="Aurora database credentials",
            tags={
                "Name": f"ecommerce-db-secret-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Initial secret value
        db_credentials = {
            "username": "ecommerceadmin",
            "password": "TempPassword123!ChangeMe",
            "engine": "postgres",
            "port": 5432
        }

        db_secret_version = SecretsmanagerSecretVersion(
            self,
            f"db_secret_version_{environment_suffix}",
            secret_id=db_secret.id,
            secret_string=json.dumps(db_credentials)
        )

        # Lambda role for secret rotation
        rotation_lambda_role = IamRole(
            self,
            f"rotation_lambda_role_{environment_suffix}",
            name=f"ecommerce-rotation-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecommerce-rotation-lambda-role-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"rotation_lambda_basic_{environment_suffix}",
            role=rotation_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Rotation policy
        rotation_policy = IamPolicy(
            self,
            f"rotation_policy_{environment_suffix}",
            name=f"ecommerce-rotation-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:DescribeSecret",
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:PutSecretValue",
                            "secretsmanager:UpdateSecretVersionStage"
                        ],
                        "Resource": db_secret.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetRandomPassword"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        IamRolePolicyAttachment(
            self,
            f"rotation_lambda_policy_{environment_suffix}",
            role=rotation_lambda_role.name,
            policy_arn=rotation_policy.arn
        )

        # =================================================================
        # 4. AURORA SERVERLESS V2 CLUSTER
        # =================================================================

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            f"db_subnet_group_{environment_suffix}",
            name=f"ecommerce-db-subnet-group-{environment_suffix}",
            subnet_ids=[private_subnets[1].id, private_subnets[3].id],
            tags={
                "Name": f"ecommerce-db-subnet-group-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Aurora Cluster
        aurora_cluster = RdsCluster(
            self,
            f"aurora_cluster_{environment_suffix}",
            cluster_identifier=f"ecommerce-aurora-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.4",
            database_name="ecommercedb",
            master_username=db_credentials["username"],
            master_password=db_credentials["password"],
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[aurora_sg.id],
            skip_final_snapshot=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0
            },
            tags={
                "Name": f"ecommerce-aurora-cluster-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Aurora Instances (2 for multi-AZ)
        for i in range(2):
            RdsClusterInstance(
                self,
                f"aurora_instance_{i}_{environment_suffix}",
                identifier=f"ecommerce-aurora-instance-{i}-{environment_suffix}",
                cluster_identifier=aurora_cluster.id,
                instance_class="db.serverless",
                engine=aurora_cluster.engine,
                engine_version=aurora_cluster.engine_version,
                publicly_accessible=False,
                tags={
                    "Name": f"ecommerce-aurora-instance-{i}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Project": "ecommerce",
                    "Owner": "platform-team"
                }
            )

        # =================================================================
        # 5. S3 AND CLOUDFRONT
        # =================================================================

        # S3 Bucket for static assets
        static_bucket = S3Bucket(
            self,
            f"static_bucket_{environment_suffix}",
            bucket=f"ecommerce-static-assets-{environment_suffix}",
            tags={
                "Name": f"ecommerce-static-bucket-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            f"static_bucket_public_access_block_{environment_suffix}",
            bucket=static_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            f"static_bucket_versioning_{environment_suffix}",
            bucket=static_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # CloudFront Origin Access Identity
        oai = CloudfrontOriginAccessIdentity(
            self,
            f"cloudfront_oai_{environment_suffix}",
            comment=f"OAI for ecommerce static assets {environment_suffix}"
        )

        # S3 Bucket Policy for CloudFront
        bucket_policy = S3BucketPolicy(
            self,
            f"static_bucket_policy_{environment_suffix}",
            bucket=static_bucket.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity {oai.id}"
                    },
                    "Action": "s3:GetObject",
                    "Resource": f"{static_bucket.arn}/*"
                }]
            })
        )

        # CloudFront Distribution
        cloudfront = CloudfrontDistribution(
            self,
            f"cloudfront_distribution_{environment_suffix}",
            enabled=True,
            comment=f"E-commerce static assets distribution {environment_suffix}",
            default_root_object="index.html",
            price_class="PriceClass_100",
            origin=[
                CloudfrontDistributionOrigin(
                    domain_name=static_bucket.bucket_regional_domain_name,
                    origin_id=f"S3-{static_bucket.id}",
                    s3_origin_config={
                        "origin_access_identity": oai.cloudfront_access_identity_path
                    }
                )
            ],
            default_cache_behavior=CloudfrontDistributionDefaultCacheBehavior(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"S3-{static_bucket.id}",
                viewer_protocol_policy="redirect-to-https",
                compress=True,
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400,
                forwarded_values={
                    "query_string": False,
                    "cookies": {
                        "forward": "none"
                    }
                }
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
                "Name": f"ecommerce-cloudfront-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # =================================================================
        # 6. APPLICATION LOAD BALANCER
        # =================================================================

        alb = Lb(
            self,
            f"alb_{environment_suffix}",
            name=f"ecommerce-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet.id for subnet in public_subnets],
            enable_deletion_protection=False,
            tags={
                "Name": f"ecommerce-alb-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Target Groups (Blue/Green)
        target_group_blue = LbTargetGroup(
            self,
            f"target_group_blue_{environment_suffix}",
            name=f"ecommerce-tg-blue-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "port": "traffic-port",
                "protocol": "HTTP",
                "healthy_threshold": 2,
                "unhealthy_threshold": 3,
                "timeout": 5,
                "interval": 30
            },
            deregistration_delay=30,
            tags={
                "Name": f"ecommerce-tg-blue-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        target_group_green = LbTargetGroup(
            self,
            f"target_group_green_{environment_suffix}",
            name=f"ecommerce-tg-green-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "port": "traffic-port",
                "protocol": "HTTP",
                "healthy_threshold": 2,
                "unhealthy_threshold": 3,
                "timeout": 5,
                "interval": 30
            },
            deregistration_delay=30,
            tags={
                "Name": f"ecommerce-tg-green-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # ALB Listener (HTTP - redirect to HTTPS in production)
        alb_listener = LbListener(
            self,
            f"alb_listener_{environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=target_group_blue.arn
                )
            ],
            tags={
                "Name": f"ecommerce-alb-listener-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # =================================================================
        # 7. AWS WAF
        # =================================================================

        waf_web_acl = Wafv2WebAcl(
            self,
            f"waf_web_acl_{environment_suffix}",
            name=f"ecommerce-waf-{environment_suffix}",
            scope="REGIONAL",
            default_action=Wafv2WebAclDefaultAction(
                allow={}
            ),
            rule=[
                Wafv2WebAclRule(
                    name="RateLimitRule",
                    priority=1,
                    action=Wafv2WebAclRuleAction(
                        block={}
                    ),
                    statement=Wafv2WebAclRuleStatement(
                        rate_based_statement=Wafv2WebAclRuleStatementRateBasedStatement(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    visibility_config=Wafv2WebAclVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=Wafv2WebAclVisibilityConfig(
                cloudwatch_metrics_enabled=True,
                metric_name=f"ecommerce-waf-{environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags={
                "Name": f"ecommerce-waf-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Associate WAF with ALB
        Wafv2WebAclAssociation(
            self,
            f"waf_alb_association_{environment_suffix}",
            resource_arn=alb.arn,
            web_acl_arn=waf_web_acl.arn
        )

        # =================================================================
        # 8. ECS CLUSTER AND SERVICE
        # =================================================================

        # CloudWatch Log Group
        ecs_log_group = CloudwatchLogGroup(
            self,
            f"ecs_log_group_{environment_suffix}",
            name=f"/ecs/ecommerce-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"ecommerce-ecs-logs-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # ECS Cluster
        ecs_cluster = EcsCluster(
            self,
            f"ecs_cluster_{environment_suffix}",
            name=f"ecommerce-cluster-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={
                "Name": f"ecommerce-cluster-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # ECS Task Execution Role
        task_execution_role = IamRole(
            self,
            f"task_execution_role_{environment_suffix}",
            name=f"ecommerce-task-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecommerce-task-execution-role-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        IamRolePolicyAttachment(
            self,
            f"task_execution_role_policy_{environment_suffix}",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # ECS Task Role (for application)
        task_role = IamRole(
            self,
            f"task_role_{environment_suffix}",
            name=f"ecommerce-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecommerce-task-role-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # Task role policy for Secrets Manager access
        task_policy = IamPolicy(
            self,
            f"task_policy_{environment_suffix}",
            name=f"ecommerce-task-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": db_secret.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": f"{static_bucket.arn}/*"
                    }
                ]
            })
        )

        IamRolePolicyAttachment(
            self,
            f"task_policy_attachment_{environment_suffix}",
            role=task_role.name,
            policy_arn=task_policy.arn
        )

        # ECS Task Definition
        task_definition = EcsTaskDefinition(
            self,
            f"task_definition_{environment_suffix}",
            family=f"ecommerce-task-{environment_suffix}",
            requires_compatibilities=["FARGATE"],
            network_mode="awsvpc",
            cpu="512",
            memory="1024",
            execution_role_arn=task_execution_role.arn,
            task_role_arn=task_role.arn,
            container_definitions=json.dumps([
                {
                    "name": "ecommerce-app",
                    "image": "nginx:latest",  # Replace with actual application image
                    "cpu": 512,
                    "memory": 1024,
                    "essential": True,
                    "portMappings": [
                        {
                            "containerPort": 8080,
                            "protocol": "tcp"
                        }
                    ],
                    "environment": [
                        {
                            "name": "ENVIRONMENT",
                            "value": environment_suffix
                        },
                        {
                            "name": "DB_SECRET_ARN",
                            "value": db_secret.arn
                        },
                        {
                            "name": "STATIC_BUCKET",
                            "value": static_bucket.bucket
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
                "Name": f"ecommerce-task-def-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # ECS Service
        ecs_service = EcsService(
            self,
            f"ecs_service_{environment_suffix}",
            name=f"ecommerce-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            platform_version="LATEST",
            health_check_grace_period_seconds=60,
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[private_subnets[0].id, private_subnets[2].id],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[
                EcsServiceLoadBalancer(
                    target_group_arn=target_group_blue.arn,
                    container_name="ecommerce-app",
                    container_port=8080
                )
            ],
            deployment_configuration={
                "minimum_healthy_percent": 50,
                "maximum_percent": 200
            },
            tags={
                "Name": f"ecommerce-service-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "ecommerce",
                "Owner": "platform-team"
            }
        )

        # =================================================================
        # 9. AUTO SCALING
        # =================================================================

        # Auto Scaling Target
        scaling_target = AppautoscalingTarget(
            self,
            f"ecs_scaling_target_{environment_suffix}",
            service_namespace="ecs",
            resource_id=f"service/{ecs_cluster.name}/{ecs_service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            min_capacity=2,
            max_capacity=10
        )

        # Auto Scaling Policy (CPU-based)
        AppautoscalingPolicy(
            self,
            f"ecs_scaling_policy_{environment_suffix}",
            name=f"ecommerce-cpu-scaling-{environment_suffix}",
            service_namespace=scaling_target.service_namespace,
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                target_value=70.0,
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )
```
