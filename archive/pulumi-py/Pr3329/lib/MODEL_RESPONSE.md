### Reasoning Trace
---

This is a comprehensive multi-tenant SaaS infrastructure request. Let me break down the requirements:

1. **Network Layer**: VPC with public/private subnets, IGW, NAT Gateways
2. **Compute & Load Balancing**: ALB with host-based routing, ASG with m5.large instances
3. **Database & Caching**: Aurora PostgreSQL with RLS, ElastiCache Redis (separated by tenant tier)
4. **Storage & CDN**: S3 with tenant isolation, CloudFront
5. **DNS & Certificates**: Route53, ACM
6. **Auth**: Cognito user pools per tenant
7. **Serverless**: Lambda for tenant provisioning, DynamoDB for metadata
8. **Monitoring**: CloudWatch logs per tenant
9. **Configuration**: Systems Manager Parameter Store

Key tenant isolation mechanisms:
- PostgreSQL RLS for database
- Host-based routing in ALB
- Separate Redis clusters for premium tenants
- S3 bucket policies
- Separate Cognito user pools
- Separate CloudWatch log groups

I need to create a comprehensive Pulumi stack that implements all these components with proper connections and dependencies.

Let me structure the code properly:

1. lib/tap_stack.py - Main infrastructure
2. tests/unit/test_tap_stack.py - Unit tests
3. tests/integration/test_tap_stack.py - Integration tests

I'll start with the main stack implementation.
### Answer 
---

I'll implement a comprehensive multi-tenant SaaS infrastructure with strict tenant isolation at every layer. Let me provide the complete solution:

## 1. lib/tap_stack.py - Full Infrastructure Implementation

```python
"""
Multi-tenant SaaS infrastructure stack with complete tenant isolation.
Supports 30,000 users across 500 organizations with custom domains.
"""

import json
import base64
from typing import Dict, List, Optional, Any
import pulumi
from pulumi import Input, Output, ResourceOptions
import pulumi_aws as aws
from pulumi_aws import ec2, rds, elasticache, s3, cloudfront, route53, acm
from pulumi_aws import iam, cognito, lambda_, dynamodb, logs, ssm, autoscaling, elbv2


class MultiTenantSaaSStack(pulumi.ComponentResource):
    """
    Production-grade multi-tenant SaaS infrastructure with strict isolation.
    
    This stack implements:
    - Network isolation with VPC and subnets
    - Database isolation with Aurora PostgreSQL RLS
    - Cache isolation with separate Redis clusters per tier
    - Storage isolation with S3 bucket policies
    - Authentication isolation with Cognito user pools per tenant
    - Custom domain support with ALB host-based routing
    """
    
    def __init__(self, name: str, opts: Optional[ResourceOptions] = None):
        super().__init__('custom:infrastructure:MultiTenantSaaSStack', name, {}, opts)
        
        # Configuration
        self.region = "us-east-1"
        self.vpc_cidr = "10.18.0.0/16"
        self.availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
        
        # Create core infrastructure
        self._create_networking()
        self._create_security_groups()
        self._create_iam_roles()
        self._create_database()
        self._create_cache_clusters()
        self._create_storage_and_cdn()
        self._create_compute_and_load_balancing()
        self._create_dns_and_certificates()
        self._create_authentication()
        self._create_serverless_components()
        self._create_monitoring()
        self._create_configuration_management()
        
        # Export critical outputs
        self._export_outputs()
    
    def _create_networking(self):
        """Create VPC with public/private subnets across multiple AZs."""
        
        # Create VPC with DNS support for internal resolution
        self.vpc = ec2.Vpc("saas-vpc",
            cidr_block=self.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": "saas-multi-tenant-vpc", "Environment": "production"}
        )
        
        # Internet Gateway for public subnet connectivity
        self.igw = ec2.InternetGateway("saas-igw",
            vpc_id=self.vpc.id,
            tags={"Name": "saas-igw"}
        )
        
        # Create public and private subnets across AZs
        self.public_subnets = []
        self.private_subnets = []
        self.database_subnets = []
        self.nat_gateways = []
        
        for idx, az in enumerate(self.availability_zones):
            # Public subnet for ALB and NAT Gateway
            public_subnet = ec2.Subnet(f"public-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.18.{idx}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"public-subnet-{az}", "Type": "public"}
            )
            self.public_subnets.append(public_subnet)
            
            # Elastic IP for NAT Gateway
            eip = ec2.Eip(f"nat-eip-{idx}",
                tags={"Name": f"nat-eip-{az}"}
            )
            
            # NAT Gateway for private subnet outbound connectivity
            nat_gw = ec2.NatGateway(f"nat-gateway-{idx}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={"Name": f"nat-gateway-{az}"}
            )
            self.nat_gateways.append(nat_gw)
            
            # Private subnet for application tier
            private_subnet = ec2.Subnet(f"private-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.18.{10 + idx}.0/24",
                availability_zone=az,
                tags={"Name": f"private-subnet-{az}", "Type": "private"}
            )
            self.private_subnets.append(private_subnet)
            
            # Database subnet for Aurora
            database_subnet = ec2.Subnet(f"database-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.18.{20 + idx}.0/24",
                availability_zone=az,
                tags={"Name": f"database-subnet-{az}", "Type": "database"}
            )
            self.database_subnets.append(database_subnet)
        
        # Route tables
        self.public_route_table = ec2.RouteTable("public-route-table",
            vpc_id=self.vpc.id,
            tags={"Name": "public-route-table"}
        )
        
        # Public route to Internet Gateway
        ec2.Route("public-route",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )
        
        # Associate public subnets with public route table
        for idx, subnet in enumerate(self.public_subnets):
            ec2.RouteTableAssociation(f"public-rta-{idx}",
                route_table_id=self.public_route_table.id,
                subnet_id=subnet.id
            )
        
        # Private route tables (one per AZ for NAT Gateway)
        for idx, nat_gw in enumerate(self.nat_gateways):
            private_route_table = ec2.RouteTable(f"private-route-table-{idx}",
                vpc_id=self.vpc.id,
                tags={"Name": f"private-route-table-{self.availability_zones[idx]}"}
            )
            
            # Private route to NAT Gateway
            ec2.Route(f"private-route-{idx}",
                route_table_id=private_route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )
            
            # Associate private subnet with route table
            ec2.RouteTableAssociation(f"private-rta-{idx}",
                route_table_id=private_route_table.id,
                subnet_id=self.private_subnets[idx].id
            )
            
            # Associate database subnet with private route table
            ec2.RouteTableAssociation(f"database-rta-{idx}",
                route_table_id=private_route_table.id,
                subnet_id=self.database_subnets[idx].id
            )
    
    def _create_security_groups(self):
        """Create security groups with least-privilege access."""
        
        # ALB Security Group - allows HTTPS traffic from internet
        self.alb_sg = ec2.SecurityGroup("alb-sg",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                ),
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet (redirect to HTTPS)"
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": "alb-security-group"}
        )
        
        # Application tier Security Group
        self.app_sg = ec2.SecurityGroup("app-sg",
            vpc_id=self.vpc.id,
            description="Security group for application instances",
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": "app-security-group"}
        )
        
        # Allow traffic from ALB to App tier
        ec2.SecurityGroupRule("alb-to-app",
            type="ingress",
            from_port=8080,
            to_port=8080,
            protocol="tcp",
            security_group_id=self.app_sg.id,
            source_security_group_id=self.alb_sg.id,
            description="Traffic from ALB"
        )
        
        # Database Security Group
        self.db_sg = ec2.SecurityGroup("db-sg",
            vpc_id=self.vpc.id,
            description="Security group for Aurora PostgreSQL",
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": "database-security-group"}
        )
        
        # Allow PostgreSQL traffic from App tier
        ec2.SecurityGroupRule("app-to-db",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            security_group_id=self.db_sg.id,
            source_security_group_id=self.app_sg.id,
            description="PostgreSQL from app tier"
        )
        
        # Redis Security Group
        self.redis_sg = ec2.SecurityGroup("redis-sg",
            vpc_id=self.vpc.id,
            description="Security group for ElastiCache Redis",
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": "redis-security-group"}
        )
        
        # Allow Redis traffic from App tier
        ec2.SecurityGroupRule("app-to-redis",
            type="ingress",
            from_port=6379,
            to_port=6379,
            protocol="tcp",
            security_group_id=self.redis_sg.id,
            source_security_group_id=self.app_sg.id,
            description="Redis from app tier"
        )
        
        # Lambda Security Group
        self.lambda_sg = ec2.SecurityGroup("lambda-sg",
            vpc_id=self.vpc.id,
            description="Security group for Lambda functions",
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": "lambda-security-group"}
        )
    
    def _create_iam_roles(self):
        """Create IAM roles with least-privilege policies."""
        
        # EC2 Instance Role for application tier
        self.ec2_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"}
            }]
        })
        
        self.ec2_role = iam.Role("ec2-app-role",
            assume_role_policy=self.ec2_assume_role_policy,
            description="IAM role for EC2 application instances",
            tags={"Name": "ec2-app-role"}
        )
        
        # Policy for EC2 instances - access to S3, SSM, CloudWatch
        self.ec2_policy = iam.Policy("ec2-app-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": "arn:aws:s3:::tenant-*/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:ExistingObjectTag/TenantId": "${aws:PrincipalTag/TenantId}"
                            }
                        }
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters"
                        ],
                        "Resource": f"arn:aws:ssm:{self.region}:*:parameter/saas/tenant/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )
        
        iam.RolePolicyAttachment("ec2-policy-attachment",
            role=self.ec2_role.name,
            policy_arn=self.ec2_policy.arn
        )
        
        self.ec2_instance_profile = iam.InstanceProfile("ec2-instance-profile",
            role=self.ec2_role.name
        )
        
        # Lambda Execution Role for tenant provisioning
        self.lambda_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"}
            }]
        })
        
        self.lambda_role = iam.Role("lambda-provisioning-role",
            assume_role_policy=self.lambda_assume_role_policy,
            description="IAM role for tenant provisioning Lambda",
            tags={"Name": "lambda-provisioning-role"}
        )
        
        # Lambda policy for tenant provisioning
        self.lambda_policy = iam.Policy("lambda-provisioning-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cognito-idp:CreateUserPool",
                            "cognito-idp:CreateUserPoolDomain",
                            "cognito-idp:UpdateUserPool"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "route53:CreateHostedZone",
                            "route53:ChangeResourceRecordSets",
                            "route53:GetHostedZone"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "acm:RequestCertificate",
                            "acm:DescribeCertificate",
                            "acm:DeleteCertificate"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "elasticloadbalancing:CreateRule",
                            "elasticloadbalancing:ModifyRule",
                            "elasticloadbalancing:DeleteRule",
                            "elasticloadbalancing:DescribeRules"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": "arn:aws:dynamodb:*:*:table/tenant-registry*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface",
                            "ec2:AssignPrivateIpAddresses",
                            "ec2:UnassignPrivateIpAddresses"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )
        
        iam.RolePolicyAttachment("lambda-policy-attachment",
            role=self.lambda_role.name,
            policy_arn=self.lambda_policy.arn
        )
        
        # Attach VPC execution policy for Lambda
        iam.RolePolicyAttachment("lambda-vpc-policy",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )
    
    def _create_database(self):
        """Create Aurora PostgreSQL cluster with Row-Level Security for tenant isolation."""
        
        # Database subnet group
        self.db_subnet_group = rds.SubnetGroup("aurora-subnet-group",
            subnet_ids=[subnet.id for subnet in self.database_subnets],
            description="Subnet group for Aurora PostgreSQL cluster",
            tags={"Name": "aurora-subnet-group"}
        )
        
        # Parameter group for PostgreSQL with RLS optimization
        self.db_parameter_group = rds.ClusterParameterGroup("aurora-pg-params",
            family="aurora-postgresql14",
            description="Parameter group for multi-tenant Aurora PostgreSQL",
            parameters=[
                {"name": "shared_preload_libraries", "value": "pg_stat_statements,pgaudit"},
                {"name": "log_statement", "value": "all"},
                {"name": "log_connections", "value": "1"},
                {"name": "log_disconnections", "value": "1"},
                {"name": "row_security", "value": "on"},  # Enable RLS
                {"name": "pgaudit.log", "value": "ALL"},
                {"name": "max_connections", "value": "1000"}  # Support scale
            ],
            tags={"Name": "aurora-pg-params"}
        )
        
        # Aurora PostgreSQL cluster with encryption
        self.aurora_cluster = rds.Cluster("aurora-cluster",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name="saasdb",
            master_username="dbadmin",
            master_password=pulumi.Config().require_secret("db_password"),
            db_subnet_group_name=self.db_subnet_group.name,
            db_cluster_parameter_group_name=self.db_parameter_group.name,
            vpc_security_group_ids=[self.db_sg.id],
            storage_encrypted=True,
            backup_retention_period=30,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            deletion_protection=True,
            skip_final_snapshot=False,
            final_snapshot_identifier="aurora-final-snapshot",
            tags={
                "Name": "aurora-multi-tenant-cluster",
                "Environment": "production",
                "TenantIsolation": "RLS"
            }
        )
        
        # Aurora instances (writer and reader)
        self.aurora_writer = rds.ClusterInstance("aurora-writer",
            cluster_identifier=self.aurora_cluster.id,
            instance_class="db.r6g.xlarge",  # Production-grade instance
            engine="aurora-postgresql",
            engine_version="14.6",
            performance_insights_enabled=True,
            monitoring_interval=60,
            monitoring_role_arn=self._create_rds_monitoring_role().arn,
            tags={"Name": "aurora-writer", "Role": "writer"}
        )
        
        self.aurora_reader = rds.ClusterInstance("aurora-reader",
            cluster_identifier=self.aurora_cluster.id,
            instance_class="db.r6g.xlarge",
            engine="aurora-postgresql",
            engine_version="14.6",
            performance_insights_enabled=True,
            monitoring_interval=60,
            monitoring_role_arn=self._create_rds_monitoring_role().arn,
            tags={"Name": "aurora-reader", "Role": "reader"}
        )
    
    def _create_rds_monitoring_role(self) -> iam.Role:
        """Create IAM role for RDS enhanced monitoring."""
        role = iam.Role("rds-monitoring-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "monitoring.rds.amazonaws.com"}
                }]
            })
        )
        
        iam.RolePolicyAttachment("rds-monitoring-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        )
        
        return role
    
    def _create_cache_clusters(self):
        """Create ElastiCache Redis clusters with tier-based separation."""
        
        # Subnet group for ElastiCache
        self.cache_subnet_group = elasticache.SubnetGroup("cache-subnet-group",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            description="Subnet group for ElastiCache Redis",
            tags={"Name": "cache-subnet-group"}
        )
        
        # Parameter group for Redis optimization
        self.redis_parameter_group = elasticache.ParameterGroup("redis-params",
            family="redis7",
            description="Parameter group for multi-tenant Redis",
            parameters=[
                {"name": "maxmemory-policy", "value": "allkeys-lru"},
                {"name": "timeout", "value": "300"},
                {"name": "tcp-keepalive", "value": "300"},
                {"name": "notify-keyspace-events", "value": "Ex"}
            ],
            tags={"Name": "redis-params"}
        )
        
        # Premium tier - Dedicated Redis cluster with replication
        self.premium_redis = elasticache.ReplicationGroup("premium-redis",
            replication_group_description="Dedicated Redis for premium tenants",
            engine="redis",
            node_type="cache.r6g.large",
            num_cache_clusters=2,  # Primary + replica
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            subnet_group_name=self.cache_subnet_group.name,
            security_group_ids=[self.redis_sg.id],
            parameter_group_name=self.redis_parameter_group.name,
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auth_token=pulumi.Config().require_secret("redis_auth_token"),
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            maintenance_window="sun:05:00-sun:06:00",
            tags={
                "Name": "premium-redis-cluster",
                "Tier": "premium",
                "TenantIsolation": "physical"
            }
        )
        
        # Standard tier - Shared Redis cluster with logical isolation
        self.standard_redis = elasticache.ReplicationGroup("standard-redis",
            replication_group_description="Shared Redis for standard tenants with key prefixing",
            engine="redis",
            node_type="cache.r6g.xlarge",  # Larger instance for multiple tenants
            num_cache_clusters=3,  # More nodes for shared workload
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            subnet_group_name=self.cache_subnet_group.name,
            security_group_ids=[self.redis_sg.id],
            parameter_group_name=self.redis_parameter_group.name,
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auth_token=pulumi.Config().require_secret("redis_auth_token"),
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            maintenance_window="sun:05:00-sun:06:00",
            tags={
                "Name": "standard-redis-cluster",
                "Tier": "standard",
                "TenantIsolation": "logical-key-prefix"
            }
        )
    
    def _create_storage_and_cdn(self):
        """Create S3 buckets with tenant isolation and CloudFront distribution."""
        
        # S3 bucket for tenant data with versioning and encryption
        self.tenant_data_bucket = s3.Bucket("tenant-data-bucket",
            bucket=f"saas-tenant-data-{pulumi.get_stack()}",
            versioning=s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
                rules=[s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )]
            ),
            lifecycle_rules=[
                s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    id="archive-old-versions",
                    noncurrent_version_transitions=[
                        s3.BucketLifecycleRuleNoncurrentVersionTransitionArgs(
                            days=30,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ],
            tags={
                "Name": "tenant-data-bucket",
                "Environment": "production",
                "DataClassification": "confidential"
            }
        )
        
        # Bucket policy for tenant isolation
        self.tenant_bucket_policy = s3.BucketPolicy("tenant-data-policy",
            bucket=self.tenant_data_bucket.id,
            policy=pulumi.Output.all(self.tenant_data_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "DenyIncorrectEncryption",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:PutObject",
                            "Resource": f"{args[0]}/*",
                            "Condition": {
                                "StringNotEquals": {
                                    "s3:x-amz-server-side-encryption": "AES256"
                                }
                            }
                        },
                        {
                            "Sid": "TenantIsolation",
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                            "Resource": f"{args[0]}/*",
                            "Condition": {
                                "StringEquals": {
                                    "s3:ExistingObjectTag/TenantId": "${{aws:PrincipalTag/TenantId}}"
                                }
                            }
                        }
                    ]
                })
            )
        )
        
        # Static assets bucket for CloudFront
        self.static_assets_bucket = s3.Bucket("static-assets-bucket",
            bucket=f"saas-static-assets-{pulumi.get_stack()}",
            website=s3.BucketWebsiteArgs(
                index_document="index.html",
                error_document="error.html"
            ),
            cors_rules=[
                s3.BucketCorsRuleArgs(
                    allowed_headers=["*"],
                    allowed_methods=["GET", "HEAD"],
                    allowed_origins=["*"],
                    max_age_seconds=3000
                )
            ],
            tags={"Name": "static-assets-bucket"}
        )
        
        # Origin Access Identity for CloudFront
        self.oai = cloudfront.OriginAccessIdentity("cloudfront-oai",
            comment="OAI for multi-tenant SaaS CloudFront distribution"
        )
        
        # Bucket policy for OAI access
        self.static_bucket_policy = s3.BucketPolicy("static-assets-policy",
            bucket=self.static_assets_bucket.id,
            policy=pulumi.Output.all(
                self.static_assets_bucket.arn,
                self.oai.iam_arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Sid": "AllowCloudFrontOAI",
                    "Effect": "Allow",
                    "Principal": {"AWS": args[1]},
                    "Action": "s3:GetObject",
                    "Resource": f"{args[0]}/*"
                }]
            }))
        )
        
        # CloudFront distribution with custom SSL
        self.cdn_distribution = cloudfront.Distribution("cdn-distribution",
            enabled=True,
            is_ipv6_enabled=True,
            comment="Multi-tenant SaaS CDN distribution",
            default_root_object="index.html",
            price_class="PriceClass_100",
            
            origins=[
                cloudfront.DistributionOriginArgs(
                    domain_name=self.static_assets_bucket.bucket_regional_domain_name,
                    origin_id="S3-static-assets",
                    s3_origin_config=cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=self.oai.cloudfront_access_identity_path
                    )
                )
            ],
            
            default_cache_behavior=cloudfront.DistributionDefaultCacheBehaviorArgs(
                target_origin_id="S3-static-assets",
                viewer_protocol_policy="redirect-to-https",
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                compress=True,
                
                forwarded_values=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=False,
                    cookies=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="none"
                    ),
                    headers=["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
                ),
                
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400
            ),
            
            restrictions=cloudfront.DistributionRestrictionsArgs(
                geo_restriction=cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            
            viewer_certificate=cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True  # Will be updated per tenant
            ),
            
            tags={
                "Name": "cdn-distribution",
                "Environment": "production"
            }
        )
    
    def _create_compute_and_load_balancing(self):
        """Create ALB, Auto Scaling Group, and EC2 instances."""
        
        # Application Load Balancer for multi-tenant routing
        self.alb = elbv2.LoadBalancer("tenant-alb",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.public_subnets],
            security_groups=[self.alb_sg.id],
            enable_deletion_protection=True,
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            access_logs=elbv2.LoadBalancerAccessLogsArgs(
                enabled=True,
                bucket=self._create_alb_logs_bucket().bucket
            ),
            tags={
                "Name": "tenant-alb",
                "Environment": "production",
                "Purpose": "multi-tenant-routing"
            }
        )
        
        # Target group for application instances
        self.target_group = elbv2.TargetGroup("app-target-group",
            port=8080,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="instance",
            
            health_check=elbv2.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                interval=30,
                timeout=10,
                path="/health",
                matcher="200-299"
            ),
            
            deregistration_delay=30,
            slow_start=60,
            
            stickiness=elbv2.TargetGroupStickinessArgs(
                enabled=True,
                type="lb_cookie",
                cookie_duration=86400  # 24 hours
            ),
            
            tags={"Name": "app-target-group"}
        )
        
        # HTTPS listener with default action
        self.https_listener = elbv2.Listener("https-listener",
            load_balancer_arn=self.alb.arn,
            port=443,
            protocol="HTTPS",
            certificate_arn=self._create_default_certificate().arn,
            
            default_actions=[elbv2.ListenerDefaultActionArgs(
                type="fixed-response",
                fixed_response=elbv2.ListenerDefaultActionFixedResponseArgs(
                    status_code="404",
                    content_type="text/plain",
                    message_body="Tenant not found"
                )
            )]
        )
        
        # HTTP listener with redirect to HTTPS
        self.http_listener = elbv2.Listener("http-listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            
            default_actions=[elbv2.ListenerDefaultActionArgs(
                type="redirect",
                redirect=elbv2.ListenerDefaultActionRedirectArgs(
                    protocol="HTTPS",
                    port="443",
                    status_code="HTTP_301"
                )
            )]
        )
        
        # Launch template for EC2 instances
        self.launch_template = ec2.LaunchTemplate("app-launch-template",
            name_prefix="saas-app-",
            image_id="ami-0c02fb55731490381",  # Amazon Linux 2 AMI
            instance_type="m5.large",
            
            iam_instance_profile=ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.ec2_instance_profile.arn
            ),
            
            vpc_security_group_ids=[self.app_sg.id],
            
            user_data=base64.b64encode("""#!/bin/bash
                # Install CloudWatch agent
                wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
                rpm -U ./amazon-cloudwatch-agent.rpm
                
                # Install application dependencies
                yum update -y
                yum install -y docker
                service docker start
                usermod -a -G docker ec2-user
                
                # Configure tenant context extraction middleware
                cat > /opt/tenant-context.sh << 'EOF'
                export TENANT_ID=$(aws ssm get-parameter --name /saas/tenant/current --query Parameter.Value --output text)
                export DB_ENDPOINT=$(aws ssm get-parameter --name /saas/db/endpoint --query Parameter.Value --output text)
                export REDIS_ENDPOINT=$(aws ssm get-parameter --name /saas/redis/endpoint --query Parameter.Value --output text)
                EOF
                
                # Start application with tenant context
                source /opt/tenant-context.sh
                docker run -d -p 8080:8080 \
                    -e TENANT_ID=$TENANT_ID \
                    -e DB_ENDPOINT=$DB_ENDPOINT \
                    -e REDIS_ENDPOINT=$REDIS_ENDPOINT \
                    your-app-image:latest
            """.encode()).decode(),
            
            block_device_mappings=[ec2.LaunchTemplateBlockDeviceMappingArgs(
                device_name="/dev/xvda",
                ebs=ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                    volume_size=30,
                    volume_type="gp3",
                    encrypted=True,
                    delete_on_termination=True
                )
            )],
            
            metadata_options=ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint="enabled",
                http_tokens="required",  # IMDSv2 only
                instance_metadata_tags="enabled"
            ),
            
            monitoring=ec2.LaunchTemplateMonitoringArgs(enabled=True),
            
            tag_specifications=[
                ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={
                        "Name": "saas-app-instance",
                        "Environment": "production",
                        "ManagedBy": "AutoScaling"
                    }
                ),
                ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="volume",
                    tags={
                        "Name": "saas-app-volume",
                        "Environment": "production"
                    }
                )
            ]
        )
        
        # Auto Scaling Group
        self.asg = autoscaling.Group("app-asg",
            name="saas-app-asg",
            vpc_zone_identifiers=[subnet.id for subnet in self.private_subnets],
            
            launch_template=autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            
            min_size=3,
            max_size=30,
            desired_capacity=6,
            
            health_check_type="ELB",
            health_check_grace_period=300,
            
            target_group_arns=[self.target_group.arn],
            
            enabled_metrics=[
                "GroupMinSize", "GroupMaxSize", "GroupDesiredCapacity",
                "GroupInServiceInstances", "GroupTotalInstances"
            ],
            
            tags=[
                autoscaling.GroupTagArgs(
                    key="Name",
                    value="saas-app-asg-instance",
                    propagate_at_launch=True
                ),
                autoscaling.GroupTagArgs(
                    key="Environment",
                    value="production",
                    propagate_at_launch=True
                )
            ]
        )
        
        # Auto Scaling Policies
        self.scale_up_policy = autoscaling.Policy("scale-up",
            autoscaling_group_name=self.asg.name,
            policy_type="TargetTrackingScaling",
            target_tracking_configuration=autoscaling.PolicyTargetTrackingConfigurationArgs(
                predefined_metric_specification=autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ASGAverageCPUUtilization"
                ),
                target_value=70.0
            )
        )
    
    def _create_alb_logs_bucket(self) -> s3.Bucket:
        """Create S3 bucket for ALB access logs."""
        logs_bucket = s3.Bucket("alb-logs-bucket",
            bucket=f"saas-alb-logs-{pulumi.get_stack()}",
            lifecycle_rules=[
                s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    id="delete-old-logs",
                    expiration=s3.BucketLifecycleRuleExpirationArgs(days=90)
                )
            ]
        )
        
        # Bucket policy for ALB logging
        s3.BucketPolicy("alb-logs-policy",
            bucket=logs_bucket.id,
            policy=pulumi.Output.all(logs_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Sid": "AllowALBLogging",
                        "Effect": "Allow",
                        "Principal": {"AWS": "arn:aws:iam::127311923021:root"},  # ALB service account for us-east-1
                        "Action": "s3:PutObject",
                        "Resource": f"{args[0]}/AWSLogs/*"
                    }]
                })
            )
        )
        
        return logs_bucket
    
    def _create_default_certificate(self) -> acm.Certificate:
        """Create default SSL certificate for ALB."""
        return acm.Certificate("default-cert",
            domain_name="*.saas-platform.example.com",
            validation_method="DNS",
            tags={"Name": "default-alb-cert"}
        )
    
    def _create_dns_and_certificates(self):
        """Create Route53 hosted zones and ACM certificates for custom domains."""
        
        # Main platform hosted zone
        self.main_zone = route53.Zone("main-zone",
            name="saas-platform.example.com",
            comment="Main hosted zone for SaaS platform",
            tags={"Name": "main-platform-zone"}
        )
        
        # ALB DNS record
        route53.Record("alb-dns",
            zone_id=self.main_zone.zone_id,
            name="app.saas-platform.example.com",
            type="A",
            aliases=[route53.RecordAliasArgs(
                name=self.alb.dns_name,
                zone_id=self.alb.zone_id,
                evaluate_target_health=True
            )]
        )
        
        # CloudFront DNS record
        route53.Record("cdn-dns",
            zone_id=self.main_zone.zone_id,
            name="cdn.saas-platform.example.com",
            type="A",
            aliases=[route53.RecordAliasArgs(
                name=self.cdn_distribution.domain_name,
                zone_id=self.cdn_distribution.hosted_zone_id,
                evaluate_target_health=False
            )]
        )
    
    def _create_authentication(self):
        """Create Cognito user pools for tenant isolation."""
        
        # Cognito user pool template for tenants
        self.user_pool_template = cognito.UserPool("user-pool-template",
            name="saas-tenant-template",
            
            account_recovery_setting=cognito.UserPoolAccountRecoverySettingArgs(
                recovery_mechanisms=[
                    cognito.UserPoolAccountRecoverySettingRecoveryMechanismArgs(
                        name="verified_email",
                        priority=1
                    )
                ]
            ),
            
            auto_verified_attributes=["email"],
            
            device_configuration=cognito.UserPoolDeviceConfigurationArgs(
                challenge_required_on_new_device=True,
                device_only_remembered_on_user_prompt=True
            ),
            
            email_configuration=cognito.UserPoolEmailConfigurationArgs(
                email_sending_account="DEVELOPER",
                from_email_address="noreply@saas-platform.example.com"
            ),
            
            mfa_configuration="OPTIONAL",
            
            password_policy=cognito.UserPoolPasswordPolicyArgs(
                minimum_length=12,
                require_lowercase=True,
                require_uppercase=True,
                require_numbers=True,
                require_symbols=True
            ),
            
            schema=[
                cognito.UserPoolSchemaArgs(
                    name="email",
                    attribute_data_type="String",
                    mutable=True,
                    required=True
                ),
                cognito.UserPoolSchemaArgs(
                    name="tenant_id",
                    attribute_data_type="String",
                    mutable=False,
                    required=False,
                    developer_only_attribute=True
                ),
                cognito.UserPoolSchemaArgs(
                    name="organization",
                    attribute_data_type="String",
                    mutable=True,
                    required=False
                )
            ],
            
            user_attribute_update_settings=cognito.UserPoolUserAttributeUpdateSettingsArgs(
                attributes_require_verification_before_update=["email"]
            ),
            
            username_attributes=["email"],
            username_configuration=cognito.UserPoolUsernameConfigurationArgs(
                case_sensitive=False
            ),
            
            tags={
                "Name": "user-pool-template",
                "Type": "template"
            }
        )
    
    def _create_serverless_components(self):
        """Create Lambda functions and DynamoDB for tenant provisioning."""
        
        # DynamoDB table for tenant registry
        self.tenant_registry = dynamodb.Table("tenant-registry",
            name="tenant-registry",
            billing_mode="PAY_PER_REQUEST",
            
            hash_key="tenant_id",
            
            attributes=[
                dynamodb.TableAttributeArgs(name="tenant_id", type="S"),
                dynamodb.TableAttributeArgs(name="domain", type="S"),
                dynamodb.TableAttributeArgs(name="tier", type="S"),
                dynamodb.TableAttributeArgs(name="organization", type="S")
            ],
            
            global_secondary_indexes=[
                dynamodb.TableGlobalSecondaryIndexArgs(
                    name="domain-index",
                    hash_key="domain",
                    projection_type="ALL"
                ),
                dynamodb.TableGlobalSecondaryIndexArgs(
                    name="tier-index",
                    hash_key="tier",
                    range_key="tenant_id",
                    projection_type="ALL"
                ),
                dynamodb.TableGlobalSecondaryIndexArgs(
                    name="org-index",
                    hash_key="organization",
                    projection_type="ALL"
                )
            ],
            
            point_in_time_recovery=dynamodb.TablePointInTimeRecoveryArgs(enabled=True),
            
            server_side_encryption=dynamodb.TableServerSideEncryptionArgs(enabled=True),
            
            tags={
                "Name": "tenant-registry",
                "Environment": "production"
            }
        )
        
        # Lambda function for tenant provisioning
        self.tenant_provisioning_lambda = lambda_.Function("tenant-provisioning",
            name="tenant-provisioning",
            runtime="python3.9",
            handler="index.handler",
            role=self.lambda_role.arn,
            timeout=300,
            memory_size=1024,
            
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    "TENANT_TABLE": self.tenant_registry.name,
                    "USER_POOL_ID": self.user_pool_template.id,
                    "ALB_LISTENER_ARN": self.https_listener.arn,
                    "TARGET_GROUP_ARN": self.target_group.arn,
                    "AURORA_ENDPOINT": self.aurora_cluster.endpoint,
                    "AURORA_SECRET_ARN": pulumi.Config().get("aurora_secret_arn") or "",
                    "PREMIUM_REDIS_ENDPOINT": self.premium_redis.configuration_endpoint_address,
                    "STANDARD_REDIS_ENDPOINT": self.standard_redis.configuration_endpoint_address
                }
            ),
            
            vpc_config=lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in self.private_subnets],
                security_group_ids=[self.lambda_sg.id]
            ),
            
            code=pulumi.AssetArchive({
                "index.py": pulumi.FileAsset("./lambda/tenant_provisioning.py")
            }),
            
            tracing_config=lambda_.FunctionTracingConfigArgs(mode="Active"),
            
            tags={
                "Name": "tenant-provisioning",
                "Purpose": "automated-tenant-onboarding"
            }
        )
    
    def _create_monitoring(self):
        """Create CloudWatch log groups and alarms for tenant isolation."""
        
        # Log group for application logs with tenant separation
        self.app_log_group = logs.LogGroup("app-logs",
            name="/aws/saas/application",
            retention_in_days=30,
            kms_key_id=self._create_logs_kms_key().arn,
            tags={"Name": "app-logs", "Type": "application"}
        )
        
        # Log group for audit logs
        self.audit_log_group = logs.LogGroup("audit-logs",
            name="/aws/saas/audit",
            retention_in_days=2557,  # 7 years for compliance
            kms_key_id=self._create_logs_kms_key().arn,
            tags={"Name": "audit-logs", "Type": "audit"}
        )
        
        # CloudWatch Logs Insights query for tenant analysis
        self.tenant_insights_query = logs.QueryDefinition("tenant-insights",
            name="TenantActivityAnalysis",
            log_group_names=[self.app_log_group.name],
            query_string="""
                fields @timestamp, tenant_id, operation, duration, status
                | filter tenant_id = "TENANT_ID_PLACEHOLDER"
                | stats count() by operation
                | sort count() desc
            """
        )
    
    def _create_logs_kms_key(self) -> aws.kms.Key:
        """Create KMS key for CloudWatch Logs encryption."""
        return aws.kms.Key("logs-kms-key",
            description="KMS key for CloudWatch Logs encryption",
            deletion_window_in_days=30,
            enable_key_rotation=True,
            tags={"Name": "logs-kms-key"}
        )
    
    def _create_configuration_management(self):
        """Create Systems Manager Parameter Store for tenant configurations."""
        
        # Database endpoint parameter
        ssm.Parameter("db-endpoint",
            name="/saas/db/endpoint",
            type="String",
            value=self.aurora_cluster.endpoint,
            description="Aurora cluster endpoint",
            tags={"Name": "db-endpoint"}
        )
        
        # Redis endpoints by tier
        ssm.Parameter("redis-premium-endpoint",
            name="/saas/redis/premium/endpoint",
            type="String",
            value=self.premium_redis.configuration_endpoint_address,
            description="Premium tier Redis endpoint",
            tags={"Name": "redis-premium-endpoint"}
        )
        
        ssm.Parameter("redis-standard-endpoint",
            name="/saas/redis/standard/endpoint",
            type="String",
            value=self.standard_redis.configuration_endpoint_address,
            description="Standard tier Redis endpoint",
            tags={"Name": "redis-standard-endpoint"}
        )
        
        # Application configuration template
        ssm.Parameter("app-config-template",
            name="/saas/config/app-template",
            type="String",
            value=json.dumps({
                "features": {
                    "max_users": 100,
                    "api_rate_limit": 1000,
                    "storage_gb": 10,
                    "custom_domains": 1
                },
                "security": {
                    "session_timeout_minutes": 30,
                    "password_rotation_days": 90,
                    "mfa_required": False
                }
            }),
            description="Default application configuration template",
            tags={"Name": "app-config-template"}
        )
    
    def _export_outputs(self):
        """Export stack outputs for external consumption."""
        
        pulumi.export("vpc_id", self.vpc.id)
        pulumi.export("alb_dns", self.alb.dns_name)
        pulumi.export("aurora_endpoint", self.aurora_cluster.endpoint)
        pulumi.export("aurora_reader_endpoint", self.aurora_cluster.reader_endpoint)
        pulumi.export("premium_redis_endpoint", self.premium_redis.configuration_endpoint_address)
        pulumi.export("standard_redis_endpoint", self.standard_redis.configuration_endpoint_address)
        pulumi.export("cdn_domain", self.cdn_distribution.domain_name)
        pulumi.export("tenant_data_bucket", self.tenant_data_bucket.bucket)
        pulumi.export("static_assets_bucket", self.static_assets_bucket.bucket)
        pulumi.export("tenant_registry_table", self.tenant_registry.name)
        pulumi.export("provisioning_function", self.tenant_provisioning_lambda.name)
        pulumi.export("main_hosted_zone_id", self.main_zone.zone_id)

# Lambda function code for tenant provisioning (referenced in stack)
TENANT_PROVISIONING_LAMBDA_CODE = """
import json
import boto3
import uuid
import os
from typing import Dict, Any

dynamodb = boto3.client('dynamodb')
cognito = boto3.client('cognito-idp')
route53 = boto3.client('route53')
acm = boto3.client('acm')
elbv2 = boto3.client('elbv2')
rds = boto3.client('rds-data')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Automated tenant provisioning workflow.
    Creates: Cognito user pool, Route53 records, ACM certificate, ALB listener rule.
    '''
    try:
        tenant_data = json.loads(event['body'])
        tenant_id = str(uuid.uuid4())
        domain = tenant_data['domain']
        tier = tenant_data.get('tier', 'standard')
        organization = tenant_data['organization']
        
        # 1. Create Cognito User Pool for tenant
        user_pool = cognito.create_user_pool(
            PoolName=f'tenant-{tenant_id}',
            Policies={
                'PasswordPolicy': {
                    'MinimumLength': 12,
                    'RequireUppercase': True,
                    'RequireLowercase': True,
                    'RequireNumbers': True,
                    'RequireSymbols': True
                }
            },
            Schema=[
                {'Name': 'email', 'AttributeDataType': 'String', 'Required': True},
                {'Name': 'tenant_id', 'AttributeDataType': 'String', 'DeveloperOnlyAttribute': True}
            ]
        )
        
        # 2. Create custom domain for Cognito
        cognito.create_user_pool_domain(
            Domain=f'{tenant_id}.auth',
            UserPoolId=user_pool['UserPool']['Id']
        )
        
        # 3. Request ACM certificate for custom domain
        cert = acm.request_certificate(
            DomainName=domain,
            ValidationMethod='DNS',
            SubjectAlternativeNames=[f'*.{domain}']
        )
        
        # 4. Create ALB listener rule for host-based routing
        elbv2.create_rule(
            ListenerArn=os.environ['ALB_LISTENER_ARN'],
            Conditions=[
                {
                    'Field': 'host-header',
                    'Values': [domain, f'*.{domain}']
                }
            ],
            Priority=get_next_priority(),
            Actions=[
                {
                    'Type': 'forward',
                    'TargetGroupArn': os.environ['TARGET_GROUP_ARN']
                }
            ]
        )
        
        # 5. Store tenant metadata in DynamoDB
        dynamodb.put_item(
            TableName=os.environ['TENANT_TABLE'],
            Item={
                'tenant_id': {'S': tenant_id},
                'domain': {'S': domain},
                'tier': {'S': tier},
                'organization': {'S': organization},
                'user_pool_id': {'S': user_pool['UserPool']['Id']},
                'certificate_arn': {'S': cert['CertificateArn']},
                'created_at': {'S': context.aws_request_id},
                'status': {'S': 'active'}
            }
        )
        
        # 6. Initialize database schema with RLS policies
        create_tenant_schema(tenant_id)
        
        return {
            'statusCode': 201,
            'body': json.dumps({
                'tenant_id': tenant_id,
                'domain': domain,
                'user_pool_id': user_pool['UserPool']['Id'],
                'message': 'Tenant provisioned successfully'
            })
        }
        
    except Exception as e:
        print(f'Error provisioning tenant: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_next_priority() -> int:
    '''Get next available priority for ALB listener rule.'''
    response = elbv2.describe_rules(
        ListenerArn=os.environ['ALB_LISTENER_ARN']
    )
    priorities = [int(rule['Priority']) for rule in response['Rules'] if rule['Priority'] != 'default']
    return max(priorities) + 1 if priorities else 1

def create_tenant_schema(tenant_id: str) -> None:
    '''Create database schema with Row-Level Security for tenant.'''
    sql = f'''
        -- Create tenant-specific schema
        CREATE SCHEMA IF NOT EXISTS tenant_{tenant_id};
        
        -- Create RLS policy for data isolation
        CREATE POLICY tenant_isolation_{tenant_id} ON public.data
            FOR ALL
            USING (tenant_id = '{tenant_id}');
        
        -- Enable RLS on tables
        ALTER TABLE public.data ENABLE ROW LEVEL SECURITY;
    '''
    
    rds.execute_statement(
        resourceArn=os.environ['AURORA_ENDPOINT'],
        secretArn=os.environ['AURORA_SECRET_ARN'],
        database='saasdb',
        sql=sql
    )
"""

# Create main stack
stack = MultiTenantSaaSStack("saas-infrastructure")
```

## 2. tests/unit/test_tap_stack.py - Unit Tests

```python
"""
Unit tests for multi-tenant SaaS infrastructure stack.
Tests resource creation, security configurations, and tenant isolation.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
import pulumi.runtime
from pulumi import Config, Output
from lib.tap_stack import MultiTenantSaaSStack


class TestMultiTenantSaaSStack(unittest.TestCase):
    """Unit tests for infrastructure components."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        pulumi.runtime.set_mocks(
            MocksPulumiRuntime(),
            project="test-project",
            stack="test-stack",
            preview=False
        )
    
    def test_vpc_creation(self):
        """Test VPC is created with correct CIDR."""
        stack = MultiTenantSaaSStack("test-stack")
        
        self.assertIsNotN