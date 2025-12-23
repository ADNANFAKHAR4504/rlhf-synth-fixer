I'll create a comprehensive Pulumi Python solution that meets all your enterprise-grade requirements. This solution will be modular, secure, and scalable across multiple environments and regions.

## 1. Project Structure

```
pulumi-aws-infrastructure/
├── __main__.py                 # Main Pulumi entry point
├── Pulumi.yaml                 # Project configuration
├── Pulumi.dev.yaml            # Development stack config
├── Pulumi.staging.yaml        # Staging stack config
├── Pulumi.test.yaml           # Test stack config
├── Pulumi.prod.yaml           # Production stack config
├── components/
│   ├── __init__.py
│   ├── vpc.py                 # VPC component
│   ├── compute.py             # EC2 and Lambda components
│   ├── database.py            # DynamoDB component
│   ├── storage.py             # S3 component
│   ├── monitoring.py          # CloudWatch component
│   ├── load_balancer.py       # ALB component
│   └── iam.py                 # IAM roles and policies
├── tests/
│   ├── __init__.py
│   ├── test_infrastructure.py
│   └── test_security.py
└── requirements.txt
```

## 2. Main Pulumi Files

### `Pulumi.yaml`
```yaml
name: aws-multi-environment-infrastructure
runtime: python
description: Multi-environment, multi-region AWS infrastructure with enterprise-grade best practices
template:
  config:
    aws:region:
      description: The AWS region to deploy to
      default: us-east-1
    environment:
      description: Environment name (dev, staging, test, prod)
      default: dev
    vpc_cidr:
      description: CIDR block for VPC
      default: "10.0.0.0/16"
    instance_type:
      description: EC2 instance type
      default: t3.micro
```

### `Pulumi.dev.yaml`
```yaml
config:
  aws:region: us-east-1
  aws-multi-environment-infrastructure:environment: dev
  aws-multi-environment-infrastructure:vpc_cidr: "10.1.0.0/16"
  aws-multi-environment-infrastructure:instance_type: t3.micro
```

### `Pulumi.staging.yaml`
```yaml
config:
  aws:region: us-west-1
  aws-multi-environment-infrastructure:environment: staging
  aws-multi-environment-infrastructure:vpc_cidr: "10.2.0.0/16"
  aws-multi-environment-infrastructure:instance_type: t3.small
```

### `Pulumi.test.yaml`
```yaml
config:
  aws:region: us-west-2
  aws-multi-environment-infrastructure:environment: test
  aws-multi-environment-infrastructure:vpc_cidr: "10.3.0.0/16"
  aws-multi-environment-infrastructure:instance_type: t3.micro
```

### `Pulumi.prod.yaml`
```yaml
config:
  aws:region: us-east-2
  aws-multi-environment-infrastructure:environment: prod
  aws-multi-environment-infrastructure:vpc_cidr: "10.4.0.0/16"
  aws-multi-environment-infrastructure:instance_type: t3.medium
```

## 3. Main Infrastructure Code

### `__main__.py`
```python
"""
Multi-Environment AWS Infrastructure with Pulumi
Enterprise-grade infrastructure deployment across multiple regions
"""

import pulumi
import pulumi_aws as aws
from components.vpc import VPCComponent
from components.iam import IAMComponent
from components.compute import ComputeComponent
from components.database import DatabaseComponent
from components.storage import StorageComponent
from components.load_balancer import LoadBalancerComponent
from components.monitoring import MonitoringComponent

# Get configuration values
config = pulumi.Config()
environment = config.require("environment")
vpc_cidr = config.get("vpc_cidr") or "10.0.0.0/16"
instance_type = config.get("instance_type") or "t3.micro"

# Get current AWS region
current_region = aws.get_region()

# Common tags for all resources
common_tags = {
    "Environment": environment,
    "Project": "multi-env-infrastructure",
    "ManagedBy": "Pulumi",
    "Region": current_region.name,
}

def main():
    """Main function to orchestrate infrastructure deployment"""
    
    # 1. Create VPC with isolated networking
    vpc_component = VPCComponent(
        f"vpc-{environment}",
        cidr_block=vpc_cidr,
        environment=environment,
        tags=common_tags
    )
    
    # 2. Create IAM roles and policies
    iam_component = IAMComponent(
        f"iam-{environment}",
        environment=environment,
        tags=common_tags
    )
    
    # 3. Create S3 buckets with encryption
    storage_component = StorageComponent(
        f"storage-{environment}",
        environment=environment,
        tags=common_tags
    )
    
    # 4. Create DynamoDB tables with PITR
    database_component = DatabaseComponent(
        f"database-{environment}",
        environment=environment,
        tags=common_tags
    )
    
    # 5. Create compute resources (EC2 and Lambda)
    compute_component = ComputeComponent(
        f"compute-{environment}",
        vpc_id=vpc_component.vpc.id,
        private_subnet_ids=vpc_component.private_subnet_ids,
        public_subnet_ids=vpc_component.public_subnet_ids,
        security_group_id=vpc_component.security_group.id,
        instance_profile_name=iam_component.instance_profile.name,
        lambda_role_arn=iam_component.lambda_role.arn,
        instance_type=instance_type,
        environment=environment,
        tags=common_tags
    )
    
    # 6. Create Application Load Balancer
    alb_component = LoadBalancerComponent(
        f"alb-{environment}",
        vpc_id=vpc_component.vpc.id,
        public_subnet_ids=vpc_component.public_subnet_ids,
        security_group_id=vpc_component.alb_security_group.id,
        target_instances=compute_component.instances,
        environment=environment,
        tags=common_tags
    )
    
    # 7. Create monitoring and alarms
    monitoring_component = MonitoringComponent(
        f"monitoring-{environment}",
        alb_arn=alb_component.alb.arn,
        instances=compute_component.instances,
        lambda_function_name=compute_component.lambda_function.name,
        dynamodb_table_name=database_component.table.name,
        environment=environment,
        tags=common_tags
    )
    
    # Export important resource information
    pulumi.export("vpc_id", vpc_component.vpc.id)
    pulumi.export("alb_dns_name", alb_component.alb.dns_name)
    pulumi.export("alb_zone_id", alb_component.alb.zone_id)
    pulumi.export("dynamodb_table_name", database_component.table.name)
    pulumi.export("s3_bucket_name", storage_component.bucket.bucket)
    pulumi.export("lambda_function_name", compute_component.lambda_function.name)
    pulumi.export("environment", environment)
    pulumi.export("region", current_region.name)

if __name__ == "__main__":
    main()
```

## 4. Component Files

### `components/vpc.py`
```python
"""
VPC Component - Creates isolated networking infrastructure
"""

import pulumi
import pulumi_aws as aws
from typing import List

class VPCComponent(pulumi.ComponentResource):
    def __init__(self, name: str, cidr_block: str, environment: str, tags: dict, opts=None):
        super().__init__("custom:aws:VPC", name, None, opts)
        
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block=cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"{environment}-vpc"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"{environment}-igw"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        
        # Create public subnets (2 for high availability)
        self.public_subnets = []
        self.public_subnet_ids = []
        
        for i in range(min(2, len(azs.names))):
            subnet = aws.ec2.Subnet(
                f"{name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"{cidr_block[:-4]}{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**tags, "Name": f"{environment}-public-subnet-{i+1}", "Type": "Public"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)
            self.public_subnet_ids.append(subnet.id)
        
        # Create private subnets (2 for high availability)
        self.private_subnets = []
        self.private_subnet_ids = []
        
        for i in range(min(2, len(azs.names))):
            subnet = aws.ec2.Subnet(
                f"{name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"{cidr_block[:-4]}{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={**tags, "Name": f"{environment}-private-subnet-{i+1}", "Type": "Private"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)
            self.private_subnet_ids.append(subnet.id)
        
        # Create NAT Gateways for private subnets
        self.nat_gateways = []
        for i, public_subnet in enumerate(self.public_subnets):
            # Allocate Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{name}-nat-eip-{i+1}",
                domain="vpc",
                tags={**tags, "Name": f"{environment}-nat-eip-{i+1}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            
            # Create NAT Gateway
            nat_gw = aws.ec2.NatGateway(
                f"{name}-nat-gw-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**tags, "Name": f"{environment}-nat-gw-{i+1}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat_gw)
        
        # Create route tables
        # Public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"{name}-public-rt",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"{environment}-public-rt"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Public route to Internet Gateway
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
        
        # Private route tables (one per AZ for high availability)
        self.private_route_tables = []
        for i, (private_subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt = aws.ec2.RouteTable(
                f"{name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags={**tags, "Name": f"{environment}-private-rt-{i+1}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            
            # Route to NAT Gateway
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
                subnet_id=private_subnet.id,
                route_table_id=rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )
            
            self.private_route_tables.append(rt)
        
        # Security Groups
        # EC2 Security Group
        self.security_group = aws.ec2.SecurityGroup(
            f"{name}-ec2-sg",
            description="Security group for EC2 instances",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP from ALB",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=[cidr_block]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="SSH",
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=[cidr_block]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**tags, "Name": f"{environment}-ec2-sg"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # ALB Security Group
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"{name}-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTPS",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**tags, "Name": f"{environment}-alb-sg"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "public_subnet_ids": self.public_subnet_ids,
            "private_subnet_ids": self.private_subnet_ids,
            "security_group_id": self.security_group.id,
            "alb_security_group_id": self.alb_security_group.id
        })
```

### `components/iam.py`
```python
"""
IAM Component - Creates IAM roles and policies following least privilege principle
"""

import pulumi
import pulumi_aws as aws
import json

class IAMComponent(pulumi.ComponentResource):
    def __init__(self, name: str, environment: str, tags: dict, opts=None):
        super().__init__("custom:aws:IAM", name, None, opts)
        
        # EC2 Instance Role
        self.instance_role = aws.iam.Role(
            f"{name}-ec2-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    }
                }]
            }),
            tags={**tags, "Name": f"{environment}-ec2-role"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # EC2 Instance Policy
        self.instance_policy = aws.iam.RolePolicy(
            f"{name}-ec2-policy",
            role=self.instance_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Resource": f"arn:aws:ssm:*:*:parameter/{environment}/*"
                    },
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
                        "Resource": f"arn:aws:dynamodb:*:*:table/{environment}-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"arn:aws:s3:::{environment}-*/*"
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
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Instance Profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"{name}-instance-profile",
            role=self.instance_role.name,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Lambda Execution Role
        self.lambda_role = aws.iam.Role(
            f"{name}-lambda-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags={**tags, "Name": f"{environment}-lambda-role"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Lambda Basic Execution Policy
        aws.iam.RolePolicyAttachment(
            f"{name}-lambda-basic-execution",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Lambda Custom Policy
        self.lambda_policy = aws.iam.RolePolicy(
            f"{name}-lambda-policy",
            role=self.lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
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
                        "Resource": f"arn:aws:dynamodb:*:*:table/{environment}-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Resource": f"arn:aws:ssm:*:*:parameter/{environment}/*"
                    }
                ]
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Backup Role for automated backups
        self.backup_role = aws.iam.Role(
            f"{name}-backup-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "backup.amazonaws.com"
                    }
                }]
            }),
            tags={**tags, "Name": f"{environment}-backup-role"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Attach AWS Backup service role policy
        aws.iam.RolePolicyAttachment(
            f"{name}-backup-service-role",
            role=self.backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        self.register_outputs({
            "instance_role_arn": self.instance_role.arn,
            "lambda_role_arn": self.lambda_role.arn,
            "backup_role_arn": self.backup_role.arn,
            "instance_profile_name": self.instance_profile.name
        })
```

### `components/storage.py`
```python
"""
Storage Component - Creates S3 buckets with encryption and security best practices
"""

import pulumi
import pulumi_aws as aws
import json

class StorageComponent(pulumi.ComponentResource):
    def __init__(self, name: str, environment: str, tags: dict, opts=None):
        super().__init__("custom:aws:Storage", name, None, opts)
        
        # S3 Bucket for application data
        self.bucket = aws.s3.Bucket(
            f"{name}-app-bucket",
            bucket=f"{environment}-app-data-{pulumi.get_stack()}",
            tags={**tags, "Name": f"{environment}-app-bucket"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # S3 Bucket Versioning
        self.bucket_versioning = aws.s3.BucketVersioningV2(
            f"{name}-bucket-versioning",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # S3 Bucket Server-Side Encryption
        self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"{name}-bucket-encryption",
            bucket=self.bucket.id,
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs(
                rules=[
                    aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256"
                        ),
                        bucket_key_enabled=True
                    )
                ]
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # S3 Bucket Public Access Block
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"{name}-bucket-pab",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # S3 Bucket Policy for secure access
        self.bucket_policy = aws.s3.BucketPolicy(
            f"{name}-bucket-policy",
            bucket=self.bucket.id,
            policy=self.bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "DenyInsecureConnections",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:*",
                        "Resource": [
                            arn,
                            f"{arn}/*"
                        ],
                        "Condition": {
                            "Bool": {
                                "aws:SecureTransport": "false"
                            }
                        }
                    }
                ]
            })),
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.bucket_public_access_block])
        )
        
        # S3 Bucket Lifecycle Configuration
        self.bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f"{name}-bucket-lifecycle",
            bucket=self.bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="transition_to_ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="delete_old_versions",
                    status="Enabled",
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=365
                    )
                )
            ],
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create Systems Manager Parameters for configuration
        self.ssm_parameter_db_config = aws.ssm.Parameter(
            f"{name}-db-config",
            name=f"/{environment}/database/config",
            type="String",
            value=json.dumps({
                "read_capacity": 5 if environment in ["dev", "test"] else 10,
                "write_capacity": 5 if environment in ["dev", "test"] else 10,
                "backup_retention_days": 7 if environment in ["dev", "test"] else 30
            }),
            description=f"Database configuration for {environment}",
            tags={**tags, "Name": f"{environment}-db-config"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        self.ssm_parameter_app_config = aws.ssm.Parameter(
            f"{name}-app-config",
            name=f"/{environment}/application/config",
            type="String",
            value=json.dumps({
                "log_level": "DEBUG" if environment in ["dev", "test"] else "INFO",
                "cache_ttl": 300,
                "max_connections": 10 if environment in ["dev", "test"] else 50
            }),
            description=f"Application configuration for {environment}",
            tags={**tags, "Name": f"{environment}-app-config"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        self.register_outputs({
            "bucket_name": self.bucket.bucket,
            "bucket_arn": self.bucket.arn,
            "db_config_parameter": self.ssm_parameter_db_config.name,
            "app_config_parameter": self.ssm_parameter_app_config.name
        })
```

### `components/database.py`
```python
"""
Database Component - Creates DynamoDB tables with PITR and backup configurations
"""

import pulumi
import pulumi_aws as aws

class DatabaseComponent(pulumi.ComponentResource):
    def __init__(self, name: str, environment: str, tags: dict, opts=None):
        super().__init__("custom:aws:Database", name, None, opts)
        
        # Determine capacity based on environment
        read_capacity = 5 if environment in ["dev", "test"] else 20
        write_capacity = 5 if environment in ["dev", "test"] else 20
        
        # DynamoDB Table
        self.table = aws.dynamodb.Table(
            f"{name}-main-table",
            name=f"{environment}-application-data",
            billing_mode="PROVISIONED",
            read_capacity=read_capacity,
            write_capacity=write_capacity,
            hash_key="id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="user_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="status",
                    type="S"
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="UserIndex",
                    hash_key="user_id",
                    range_key="timestamp",
                    write_capacity=read_capacity // 2,
                    read_capacity=write_capacity // 2,
                    projection_type="ALL"
                ),
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="StatusIndex",
                    hash_key="status",
                    range_key="timestamp",
                    write_capacity=read_capacity