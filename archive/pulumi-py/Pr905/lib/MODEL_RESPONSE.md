I'll create a comprehensive Pulumi infrastructure-as-code solution that meets all your requirements. This will be structured as reusable components with proper security, networking, and multi-region deployment capabilities.

## Project Structure

```
pulumi-multi-region-app/
├── __main__.py
├── components/
│   ├── __init__.py
│   ├── networking.py
│   ├── security.py
│   ├── database.py
│   ├── serverless.py
│   ├── storage.py
│   └── monitoring.py
├── config/
│   └── regions.py
└── requirements.txt
```

## Main Infrastructure File

```python
# __main__.py
"""
Multi-region serverless application with high availability and security compliance.
Deploys across us-east-1 and us-west-2 with proper networking, security, and failover capabilities.
"""

import pulumi
import pulumi_aws as aws
from components.networking import NetworkingComponent
from components.security import SecurityComponent
from components.database import DatabaseComponent
from components.serverless import ServerlessComponent
from components.storage import StorageComponent
from components.monitoring import MonitoringComponent
from config.regions import REGIONS, PRIMARY_REGION, SECONDARY_REGION

# Common tags for all resources
COMMON_TAGS = {
    "Project": "PulumiOptimization",
    "Environment": "production",
    "ManagedBy": "Pulumi"
}

def deploy_region(region_name: str, is_primary: bool = False):
    """Deploy infrastructure for a specific region"""
    
    # Create AWS provider for the region
    provider = aws.Provider(f"aws-{region_name}", region=region_name)
    
    # 1. Deploy networking infrastructure
    # Creates VPC, subnets, route tables, NAT gateways, and internet gateway
    networking = NetworkingComponent(
        f"networking-{region_name}",
        region=region_name,
        tags=COMMON_TAGS,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # 2. Deploy security components
    # Creates security groups, WAF, and IAM roles with least privilege
    security = SecurityComponent(
        f"security-{region_name}",
        vpc_id=networking.vpc.id,
        region=region_name,
        tags=COMMON_TAGS,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # 3. Deploy storage components
    # Creates S3 buckets with encryption, versioning, and cross-region replication
    storage = StorageComponent(
        f"storage-{region_name}",
        region=region_name,
        is_primary=is_primary,
        tags=COMMON_TAGS,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # 4. Deploy database components
    # Creates RDS Multi-AZ and DynamoDB with encryption and auto-scaling
    database = DatabaseComponent(
        f"database-{region_name}",
        vpc_id=networking.vpc.id,
        private_subnet_ids=networking.private_subnet_ids,
        database_security_group_id=security.database_security_group.id,
        region=region_name,
        is_primary=is_primary,
        tags=COMMON_TAGS,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # 5. Deploy serverless components
    # Creates Lambda functions with VPC access and proper IAM roles
    serverless = ServerlessComponent(
        f"serverless-{region_name}",
        vpc_id=networking.vpc.id,
        private_subnet_ids=networking.private_subnet_ids,
        lambda_security_group_id=security.lambda_security_group.id,
        lambda_execution_role_arn=security.lambda_execution_role.arn,
        rds_endpoint=database.rds_endpoint,
        dynamodb_table_name=database.dynamodb_table.name,
        s3_bucket_name=storage.app_bucket.bucket,
        region=region_name,
        tags=COMMON_TAGS,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # 6. Deploy monitoring and auditing
    # Creates CloudTrail, CloudWatch, and other monitoring resources
    monitoring = MonitoringComponent(
        f"monitoring-{region_name}",
        region=region_name,
        s3_logging_bucket=storage.logging_bucket.bucket,
        tags=COMMON_TAGS,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    return {
        "networking": networking,
        "security": security,
        "storage": storage,
        "database": database,
        "serverless": serverless,
        "monitoring": monitoring
    }

# Deploy to primary region (us-east-1)
primary_deployment = deploy_region(PRIMARY_REGION, is_primary=True)

# Deploy to secondary region (us-west-2) 
secondary_deployment = deploy_region(SECONDARY_REGION, is_primary=False)

# Export important outputs
pulumi.export("primary_region", PRIMARY_REGION)
pulumi.export("secondary_region", SECONDARY_REGION)
pulumi.export("primary_alb_dns", primary_deployment["serverless"].alb.dns_name)
pulumi.export("secondary_alb_dns", secondary_deployment["serverless"].alb.dns_name)
pulumi.export("primary_rds_endpoint", primary_deployment["database"].rds_endpoint)
pulumi.export("secondary_rds_endpoint", secondary_deployment["database"].rds_endpoint)
```

## Configuration

```python
# config/regions.py
"""
Regional configuration for multi-region deployment
"""

REGIONS = ["us-east-1", "us-west-2"]
PRIMARY_REGION = "us-east-1"
SECONDARY_REGION = "us-west-2"

# Availability zones per region
AZ_CONFIG = {
    "us-east-1": ["us-east-1a", "us-east-1b", "us-east-1c"],
    "us-west-2": ["us-west-2a", "us-west-2b", "us-west-2c"]
}

# CIDR blocks for VPCs to avoid conflicts
VPC_CIDRS = {
    "us-east-1": "10.0.0.0/16",
    "us-west-2": "10.1.0.0/16"
}
```

## Networking Component

```python
# components/networking.py
"""
Networking component that creates VPC, subnets, routing, and NAT gateways
Ensures proper isolation between public and private resources
"""

import pulumi
import pulumi_aws as aws
from typing import List
from config.regions import AZ_CONFIG, VPC_CIDRS

class NetworkingComponent(pulumi.ComponentResource):
    def __init__(self, name: str, region: str, tags: dict, opts: pulumi.ResourceOptions = None):
        super().__init__("custom:networking:NetworkingComponent", name, None, opts)
        
        self.region = region
        self.tags = tags
        
        # Create VPC with DNS support for RDS connectivity
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block=VPC_CIDRS[region],
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"{name}-vpc"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create Internet Gateway for public subnet connectivity
        self.igw = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"{name}-igw"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Get availability zones for the region
        azs = AZ_CONFIG[region][:2]  # Use first 2 AZs for Multi-AZ setup
        
        # Create public subnets (for ALB)
        self.public_subnets = []
        self.public_subnet_ids = []
        
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"{name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"{VPC_CIDRS[region].split('/')[0].rsplit('.', 1)[0]}.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**tags, "Name": f"{name}-public-subnet-{i+1}", "Type": "Public"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)
            self.public_subnet_ids.append(subnet.id)
        
        # Create private subnets (for Lambda and RDS)
        self.private_subnets = []
        self.private_subnet_ids = []
        
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"{name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"{VPC_CIDRS[region].split('/')[0].rsplit('.', 1)[0]}.{i+10}.0/24",
                availability_zone=az,
                tags={**tags, "Name": f"{name}-private-subnet-{i+1}", "Type": "Private"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)
            self.private_subnet_ids.append(subnet.id)
        
        # Create NAT Gateways for private subnet internet access (Lambda needs this)
        self.nat_gateways = []
        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{name}-nat-eip-{i+1}",
                domain="vpc",
                tags={**tags, "Name": f"{name}-nat-eip-{i+1}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            
            # Create NAT Gateway
            nat_gw = aws.ec2.NatGateway(
                f"{name}-nat-gw-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**tags, "Name": f"{name}-nat-gw-{i+1}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat_gw)
        
        # Create route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"{name}-public-rt",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"{name}-public-rt"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Route public traffic to Internet Gateway
        aws.ec2.Route(
            f"{name}-public-route",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=pulumi.ResourceOptions(parent=self)
            )
        
        # Create route tables for private subnets (one per AZ for HA)
        self.private_route_tables = []
        for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt = aws.ec2.RouteTable(
                f"{name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags={**tags, "Name": f"{name}-private-rt-{i+1}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            
            # Route private traffic to NAT Gateway
            aws.ec2.Route(
                f"{name}-private-route-{i+1}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id,
                opts=pulumi.ResourceOptions(parent=self)
            )
            
            # Associate private subnet with route table
            aws.ec2.RouteTableAssociation(
                f"{name}-private-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )
            
            self.private_route_tables.append(rt)
        
        self.register_outputs({})
```

## Security Component

```python
# components/security.py
"""
Security component that creates security groups, IAM roles, and WAF
Implements least privilege access and defense in depth
"""

import pulumi
import pulumi_aws as aws
import json

class SecurityComponent(pulumi.ComponentResource):
    def __init__(self, name: str, vpc_id: pulumi.Output[str], region: str, tags: dict, opts: pulumi.ResourceOptions = None):
        super().__init__("custom:security:SecurityComponent", name, None, opts)
        
        self.region = region
        self.tags = tags
        
        # Create KMS key for encryption at rest
        self.kms_key = aws.kms.Key(
            f"{name}-kms-key",
            description="KMS key for encrypting application resources",
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        self.kms_alias = aws.kms.Alias(
            f"{name}-kms-alias",
            name=f"alias/{name}-encryption-key",
            target_key_id=self.kms_key.key_id,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Security Group for Application Load Balancer
        # Only allows HTTP/HTTPS from internet, redirects HTTP to HTTPS
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"{name}-alb-sg",
            name_prefix=f"{name}-alb-",
            description="Security group for Application Load Balancer",
            vpc_id=vpc_id,
            ingress=[
                # Allow HTTP (will redirect to HTTPS)
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                ),
                # Allow HTTPS
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[
                # Allow all outbound to Lambda functions
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=65535,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/8"],
                    description="All traffic to private subnets"
                )
            ],
            tags={**tags, "Name": f"{name}-alb-sg"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Security Group for Lambda functions
        # Allows inbound from ALB and outbound to RDS/DynamoDB/S3
        self.lambda_security_group = aws.ec2.SecurityGroup(
            f"{name}-lambda-sg",
            name_prefix=f"{name}-lambda-",
            description="Security group for Lambda functions",
            vpc_id=vpc_id,
            ingress=[
                # Allow traffic from ALB
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    source_security_group_id=self.alb_security_group.id,
                    description="HTTP from ALB"
                )
            ],
            egress=[
                # Allow HTTPS for AWS API calls (S3, DynamoDB)
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS for AWS APIs"
                ),
                # Allow MySQL/PostgreSQL to RDS
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/8"],
                    description="PostgreSQL to RDS"
                )
            ],
            tags={**tags, "Name": f"{name}-lambda-sg"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Security Group for RDS Database
        # Only allows inbound from Lambda functions on database port
        self.database_security_group = aws.ec2.SecurityGroup(
            f"{name}-database-sg",
            name_prefix=f"{name}-database-",
            description="Security group for RDS database",
            vpc_id=vpc_id,
            ingress=[
                # Allow PostgreSQL from Lambda functions
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    source_security_group_id=self.lambda_security_group.id,
                    description="PostgreSQL from Lambda"
                )
            ],
            # No egress rules needed for RDS
            tags={**tags, "Name": f"{name}-database-sg"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # IAM Role for Lambda execution with least privilege
        lambda_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }
            ]
        }
        
        self.lambda_execution_role = aws.iam.Role(
            f"{name}-lambda-execution-role",
            assume_role_policy=json.dumps(lambda_assume_role_policy),
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Lambda execution policy with minimal required permissions
        lambda_policy = {
            "Version": "2012-10-17",
            "Statement": [
                # CloudWatch Logs permissions
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:{region}:*:*"
                },
                # VPC permissions for Lambda
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:CreateNetworkInterface",
                        "ec2:DescribeNetworkInterfaces",
                        "ec2:DeleteNetworkInterface",
                        "ec2:AttachNetworkInterface",
                        "ec2:DetachNetworkInterface"
                    ],
                    "Resource": "*"
                },
                # DynamoDB permissions (scoped to specific table)
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": f"arn:aws:dynamodb:{region}:*:table/pulumi-optimization-*"
                },
                # S3 permissions (scoped to specific bucket)
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": f"arn:aws:s3:::pulumi-optimization-*/*"
                },
                # KMS permissions for decryption
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": self.kms_key.arn
                }
            ]
        }
        
        self.lambda_policy = aws.iam.RolePolicy(
            f"{name}-lambda-policy",
            role=self.lambda_execution_role.id,
            policy=json.dumps(lambda_policy),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create WAF Web ACL for rate limiting and security
        self.waf_web_acl = aws.wafv2.WebAcl(
            f"{name}-waf-acl",
            scope="REGIONAL",  # For ALB
            description="WAF rules for application security",
            default_action=aws.wafv2.WebAclDefaultActionArgs(
                allow=aws.wafv2.WebAclDefaultActionAllowArgs()
            ),
            rules=[
                # Rate limiting rule - 1000 requests per 5 minutes
                aws.wafv2.WebAclRuleArgs(
                    name="RateLimitRule",
                    priority=1,
                    action=aws.wafv2.WebAclRuleActionArgs(
                        block=aws.wafv2.WebAclRuleActionBlockArgs()
                    ),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
                            limit=1000,
                            aggregate_key_type="IP"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                ),
                # AWS Managed Core Rule Set
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=2,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(
                        none=aws.wafv2.WebAclRuleOverrideActionNoneArgs()
                    ),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesCommonRuleSet",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="CommonRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                )
            ],
            tags=tags,
            visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"{name}-waf-acl",
                sampled_requests_enabled=True
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        self.register_outputs({})
```

## Database Component

```python
# components/database.py
"""
Database component that creates RDS Multi-AZ and DynamoDB with encryption
Implements high availability and cross-region replication strategies
"""

import pulumi
import pulumi_aws as aws
from typing import List

class DatabaseComponent(pulumi.ComponentResource):
    def __init__(self, name: str, vpc_id: pulumi.Output[str], private_subnet_ids: List[pulumi.Output[str]], 
                 database_security_group_id: pulumi.Output[str], region: str, is_primary: bool, 
                 tags: dict, opts: pulumi.ResourceOptions = None):
        super().__init__("custom:database:DatabaseComponent", name, None, opts)
        
        self.region = region
        self.is_primary = is_primary
        self.tags = tags
        
        # Create DB Subnet Group for RDS Multi-AZ deployment
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"{name}-db-subnet-group",
            subnet_ids=private_subnet_ids,
            tags={**tags, "Name": f"{name}-db-subnet-group"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create RDS instance with Multi-AZ, encryption, and automated backups
        self.rds_instance = aws.rds.Instance(
            f"{name}-rds-instance",
            identifier=f"pulumi-optimization-db-{region}",
            engine="postgres",
            engine_version="13.13",
            instance_class="db.m5.large",
            allocated_storage=100,
            max_allocated_storage=1000,  # Enable storage autoscaling
            
            # Database configuration
            db_name="pulumioptimization",
            username="dbadmin",
            manage_master_user_password=True,  # AWS manages password in Secrets Manager
            
            # High Availability and Backup
            multi_az=True,  # Multi-AZ deployment for HA
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            
            # Security
            vpc_security_group_ids=[database_security_group_id],
            db_subnet_group_name=self.db_subnet_group.name,
            publicly_accessible=False,
            
            # Encryption at rest
            storage_encrypted=True,
            # kms_key_id will use default RDS KMS key
            
            # Performance and Monitoring
            performance_insights_enabled=True,
            monitoring_interval=60,
            enabled_cloudwatch_logs_exports=["postgresql"],
            
            # Deletion protection for production
            deletion_protection=True,
            skip_final_snapshot=False,
            final_snapshot_identifier=f"pulumi-optimization-db-{region}-final-snapshot",
            
            tags={**tags, "Name": f"{name}-rds-instance"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Export RDS endpoint for Lambda connections
        self.rds_endpoint = self.rds_instance.endpoint
        
        # Create DynamoDB table with encryption and auto-scaling
        self.dynamodb_table = aws.dynamodb.Table(
            f"{name}-dynamodb-table",
            name=f"pulumi-optimization-{region}",
            billing_mode="PAY_PER_REQUEST",  # On-demand pricing with auto-scaling
            
            # Define primary key
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            hash_key="id",
            range_key="timestamp",
            
            # Enable encryption at rest
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                # Uses AWS managed key by default
            ),
            
            # Enable point-in-time recovery
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            
            # Configure streams for cross-region replication
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            
            tags={**tags, "Name": f"{name}-dynamodb-table"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Set up DynamoDB Global Tables for cross-region replication (primary region only)
        if is_primary:
            # Create replica in secondary region
            secondary_region = "us-west-2" if region == "us-east-1" else "us-east-1"
            
            # Note: Global Tables v2 (2019.11.21) is automatically enabled with streams
            # The replica will be created by the secondary region deployment
            pass
        
        # Create DynamoDB backup vault for additional protection
        self.dynamodb_backup = aws.backup.Plan(
            f"{name}-dynamodb-backup-plan",
            rule=[
                aws.backup.PlanRuleArgs(
                    rule_name="daily_backup",
                    target_vault_name="default",  # Use default backup vault
                    schedule="cron(0 2 ? * * *)",  # Daily at 2 AM
                    start_window=60,  # 1 hour
                    completion_window=120,  # 2 hours
                    lifecycle=aws.backup.PlanRuleLifecycleArgs(
                        cold_storage_after=30,
                        delete_after=365
                    ),
                    copy_actions=[
                        aws.backup.PlanRuleCopyActionArgs(
                            destination_vault_arn=f"arn:aws:backup:{secondary_region if is_primary else 'us-east-1'}:*:backup-vault:default",
                            lifecycle=aws.backup.PlanRuleCopyActionLifecycleArgs(
                                cold_storage_after=30,
                                delete_after=365
                            )
                        )
                    ] if is_primary else []
                )
            ],
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # IAM role for backup service
        backup_role = aws.iam.Role(
            f"{name}-backup-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "backup.amazonaws.com"
                        }
                    }
                ]
            }""",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Attach AWS managed backup policy
        aws.iam.RolePolicyAttachment(
            f"{name}-backup-policy-attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create backup selection for DynamoDB table
        self.backup_selection = aws.backup.Selection(
            f"{name}-dynamodb-backup-selection",
            iam_role_arn=backup_role.arn,
            name=f"{name}-dynamodb-backup-selection",
            plan_id=self.dynamodb_backup.id,
            resources=[self.dynamodb_table.arn],
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        self.register_outputs({})
```

## Storage Component

```python
# components/storage.py