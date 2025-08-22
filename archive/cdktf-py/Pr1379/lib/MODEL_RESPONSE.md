I'll design a comprehensive multi-environment CDKTF infrastructure solution that addresses all the complex constraints. This solution will use advanced patterns for environment separation, security compliance, and cross-region consistency.

## Project Structure

```
iac-aws-nova-model/
├── cdktf.json
├── requirements.txt
├── main.py
├── constructs/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── base_stack.py
│   │   ├── networking.py
│   │   ├── security.py
│   │   ├── storage.py
│   │   ├── compute.py
│   │   └── monitoring.py
│   └── utils/
│       ├── __init__.py
│       ├── config.py
│       ├── secrets.py
│       └── tagging.py
├── environments/
│   ├── __init__.py
│   ├── us_east_1.py
│   ├── eu_central_1.py
│   └── common.py
├── policies/
│   ├── iam_policies.json
│   └── security_groups.json
└── scripts/
    ├── validate_parity.py
    └── deploy.sh
```

## Core Configuration Files

### cdktf.json
```json
{
  "language": "python",
  "app": "python main.py",
  "projectId": "iac-aws-nova-model",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

### requirements.txt
```txt
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=16.0.0
boto3>=1.34.0
pydantic>=2.0.0
cryptography>=41.0.0
```

### main.py
```python
#!/usr/bin/env python3
import os
from cdktf import App, TerraformStack
from constructs import Construct
from environments.us_east_1 import USEast1Environment
from environments.eu_central_1 import EUCentral1Environment
from constructs.utils.config import EnvironmentConfig

class NovaModelApp(App):
    def __init__(self):
        super().__init__()
        
        # Initialize environments with strict separation
        self.us_east_1 = USEast1Environment(
            self, 
            "us-east-1-nova",
            config=EnvironmentConfig.load_environment_config("us-east-1")
        )
        
        self.eu_central_1 = EUCentral1Environment(
            self, 
            "eu-central-1-nova",
            config=EnvironmentConfig.load_environment_config("eu-central-1")
        )

if __name__ == "__main__":
    app = NovaModelApp()
    app.synth()
```

## Core Constructs

### constructs/utils/config.py
```python
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import json
import os

class NetworkConfig(BaseModel):
    vpc_cidr: str
    availability_zones: list[str]
    public_subnet_cidrs: list[str]
    private_subnet_cidrs: list[str]
    database_subnet_cidrs: list[str]

class SecurityConfig(BaseModel):
    kms_key_rotation: bool = True
    cloudtrail_enabled: bool = True
    vpc_flow_logs_enabled: bool = True
    ssm_session_logging: bool = True

class ComplianceConfig(BaseModel):
    backup_retention_days: int = 7
    encryption_required: bool = True
    cross_region_replication: bool = False
    audit_log_retention_days: int = 90

class EnvironmentConfig(BaseModel):
    region: str
    environment: str
    project_name: str = "IaC-AWS-Nova-Model"
    network: NetworkConfig
    security: SecurityConfig
    compliance: ComplianceConfig
    tags: Dict[str, str] = Field(default_factory=dict)
    
    @classmethod
    def load_environment_config(cls, region: str) -> 'EnvironmentConfig':
        """Load environment-specific configuration"""
        config_map = {
            "us-east-1": {
                "region": "us-east-1",
                "environment": "us-east-1-prod",
                "network": {
                    "vpc_cidr": "10.1.0.0/16",
                    "availability_zones": ["us-east-1a", "us-east-1b", "us-east-1c"],
                    "public_subnet_cidrs": ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"],
                    "private_subnet_cidrs": ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"],
                    "database_subnet_cidrs": ["10.1.21.0/24", "10.1.22.0/24", "10.1.23.0/24"]
                },
                "security": {
                    "kms_key_rotation": True,
                    "cloudtrail_enabled": True,
                    "vpc_flow_logs_enabled": True,
                    "ssm_session_logging": True
                },
                "compliance": {
                    "backup_retention_days": 7,
                    "encryption_required": True,
                    "cross_region_replication": False,
                    "audit_log_retention_days": 90
                },
                "tags": {
                    "Environment": "us-east-1-prod",
                    "Region": "us-east-1",
                    "Project": "IaC-AWS-Nova-Model",
                    "Compliance": "SOC2",
                    "DataClassification": "Internal"
                }
            },
            "eu-central-1": {
                "region": "eu-central-1",
                "environment": "eu-central-1-prod",
                "network": {
                    "vpc_cidr": "10.2.0.0/16",
                    "availability_zones": ["eu-central-1a", "eu-central-1b", "eu-central-1c"],
                    "public_subnet_cidrs": ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"],
                    "private_subnet_cidrs": ["10.2.11.0/24", "10.2.12.0/24", "10.2.13.0/24"],
                    "database_subnet_cidrs": ["10.2.21.0/24", "10.2.22.0/24", "10.2.23.0/24"]
                },
                "security": {
                    "kms_key_rotation": True,
                    "cloudtrail_enabled": True,
                    "vpc_flow_logs_enabled": True,
                    "ssm_session_logging": True
                },
                "compliance": {
                    "backup_retention_days": 7,
                    "encryption_required": True,
                    "cross_region_replication": False,
                    "audit_log_retention_days": 90
                },
                "tags": {
                    "Environment": "eu-central-1-prod",
                    "Region": "eu-central-1",
                    "Project": "IaC-AWS-Nova-Model",
                    "Compliance": "GDPR",
                    "DataClassification": "Internal"
                }
            }
        }
        
        return cls(**config_map[region])
```

### constructs/utils/tagging.py
```python
from typing import Dict, Any
from constructs.utils.config import EnvironmentConfig

class TaggingStrategy:
    """Centralized tagging strategy for consistent resource tagging"""
    
    @staticmethod
    def get_base_tags(config: EnvironmentConfig) -> Dict[str, str]:
        """Get base tags for all resources"""
        return {
            **config.tags,
            "ManagedBy": "CDKTF",
            "CreatedAt": "plan-time",
            "BackupRequired": "true" if config.compliance.backup_retention_days > 0 else "false",
            "EncryptionRequired": "true" if config.compliance.encryption_required else "false"
        }
    
    @staticmethod
    def get_resource_tags(config: EnvironmentConfig, resource_type: str, 
                         additional_tags: Dict[str, str] = None) -> Dict[str, str]:
        """Get tags for specific resource types"""
        base_tags = TaggingStrategy.get_base_tags(config)
        resource_tags = {
            "ResourceType": resource_type,
            "Region": config.region
        }
        
        if additional_tags:
            resource_tags.update(additional_tags)
            
        return {**base_tags, **resource_tags}
```

### constructs/utils/secrets.py
```python
import boto3
import json
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError

class SecretManager:
    """Dynamic secret management with environment-specific versioning"""
    
    def __init__(self, region: str):
        self.region = region
        self.secrets_client = boto3.client('secretsmanager', region_name=region)
    
    def get_secret(self, secret_name: str, version_stage: str = "AWSCURRENT") -> Dict[str, Any]:
        """Retrieve secret at plan time without storing in code"""
        try:
            response = self.secrets_client.get_secret_value(
                SecretId=f"{secret_name}-{self.region}",
                VersionStage=version_stage
            )
            return json.loads(response['SecretString'])
        except ClientError as e:
            raise Exception(f"Failed to retrieve secret {secret_name}: {e}")
    
    def create_secret_reference(self, secret_name: str) -> str:
        """Create a reference to a secret for Terraform data source"""
        return f"data.aws_secretsmanager_secret_version.{secret_name.replace('-', '_')}.secret_string"
```

## Core Infrastructure Constructs

### constructs/core/base_stack.py
```python
from cdktf import TerraformStack, TerraformOutput, DataTerraformRemoteState
from cdktf_cdktf_provider_aws.provider import AwsProvider
from constructs import Construct
from typing import Dict, Any
from constructs.utils.config import EnvironmentConfig
from constructs.utils.tagging import TaggingStrategy

class BaseStack(TerraformStack):
    """Base stack with common configurations and providers"""
    
    def __init__(self, scope: Construct, construct_id: str, config: EnvironmentConfig):
        super().__init__(scope, construct_id)
        
        self.config = config
        self.tagging_strategy = TaggingStrategy()
        
        # Configure AWS Provider with region-specific settings
        self.aws_provider = AwsProvider(
            self,
            "aws",
            region=config.region,
            default_tags=[{
                "tags": self.tagging_strategy.get_base_tags(config)
            }],
            # Enforce local state storage
            skip_credentials_validation=False,
            skip_region_validation=False,
            skip_requesting_account_id=False
        )
        
        # Store provider reference for child constructs
        self.provider = self.aws_provider
    
    def add_output(self, name: str, value: str, description: str = None, 
                   sensitive: bool = False) -> TerraformOutput:
        """Add output with consistent naming"""
        return TerraformOutput(
            self,
            f"{self.config.environment}_{name}",
            value=value,
            description=description,
            sensitive=sensitive
        )
```

### constructs/core/networking.py
```python
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from constructs import Construct
from typing import List
from constructs.utils.config import EnvironmentConfig
from constructs.utils.tagging import TaggingStrategy

class NetworkingConstruct(Construct):
    """Region-agnostic networking construct with hot-swap capability"""
    
    def __init__(self, scope: Construct, construct_id: str, config: EnvironmentConfig):
        super().__init__(scope, construct_id)
        
        self.config = config
        self.tagging_strategy = TaggingStrategy()
        
        # Create VPC with region-specific CIDR
        self.vpc = self._create_vpc()
        
        # Create subnets across availability zones
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()
        self.database_subnets = self._create_database_subnets()
        
        # Create internet gateway and NAT gateways
        self.internet_gateway = self._create_internet_gateway()
        self.nat_gateways = self._create_nat_gateways()
        
        # Create route tables and routes
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()
        
        # Enable VPC Flow Logs
        self.flow_logs = self._create_vpc_flow_logs()
    
    def _create_vpc(self) -> Vpc:
        """Create VPC with consistent configuration"""
        return Vpc(
            self,
            "vpc",
            cidr_block=self.config.network.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags=self.tagging_strategy.get_resource_tags(
                self.config, 
                "VPC",
                {"Name": f"{self.config.environment}-vpc"}
            )
        )
    
    def _create_public_subnets(self) -> List[Subnet]:
        """Create public subnets across AZs"""
        subnets = []
        for i, (az, cidr) in enumerate(zip(
            self.config.network.availability_zones,
            self.config.network.public_subnet_cidrs
        )):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags=self.tagging_strategy.get_resource_tags(
                    self.config,
                    "PublicSubnet",
                    {
                        "Name": f"{self.config.environment}-public-subnet-{i+1}",
                        "SubnetType": "Public",
                        "AZ": az
                    }
                )
            )
            subnets.append(subnet)
        return subnets
    
    def _create_private_subnets(self) -> List[Subnet]:
        """Create private subnets across AZs"""
        subnets = []
        for i, (az, cidr) in enumerate(zip(
            self.config.network.availability_zones,
            self.config.network.private_subnet_cidrs
        )):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                tags=self.tagging_strategy.get_resource_tags(
                    self.config,
                    "PrivateSubnet",
                    {
                        "Name": f"{self.config.environment}-private-subnet-{i+1}",
                        "SubnetType": "Private",
                        "AZ": az
                    }
                )
            )
            subnets.append(subnet)
        return subnets
    
    def _create_database_subnets(self) -> List[Subnet]:
        """Create database subnets across AZs"""
        subnets = []
        for i, (az, cidr) in enumerate(zip(
            self.config.network.availability_zones,
            self.config.network.database_subnet_cidrs
        )):
            subnet = Subnet(
                self,
                f"database_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                tags=self.tagging_strategy.get_resource_tags(
                    self.config,
                    "DatabaseSubnet",
                    {
                        "Name": f"{self.config.environment}-database-subnet-{i+1}",
                        "SubnetType": "Database",
                        "AZ": az
                    }
                )
            )
            subnets.append(subnet)
        return subnets
    
    def _create_internet_gateway(self) -> InternetGateway:
        """Create internet gateway"""
        return InternetGateway(
            self,
            "internet_gateway",
            vpc_id=self.vpc.id,
            tags=self.tagging_strategy.get_resource_tags(
                self.config,
                "InternetGateway",
                {"Name": f"{self.config.environment}-igw"}
            )
        )
    
    def _create_nat_gateways(self) -> List[NatGateway]:
        """Create NAT gateways for private subnet internet access"""
        nat_gateways = []
        for i, public_subnet in enumerate(self.public_subnets):
            # Create EIP for NAT Gateway
            eip = Eip(
                self,
                f"nat_eip_{i}",
                domain="vpc",
                tags=self.tagging_strategy.get_resource_tags(
                    self.config,
                    "EIP",
                    {"Name": f"{self.config.environment}-nat-eip-{i+1}"}
                )
            )
            
            # Create NAT Gateway
            nat_gateway = NatGateway(
                self,
                f"nat_gateway_{i}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags=self.tagging_strategy.get_resource_tags(
                    self.config,
                    "NATGateway",
                    {"Name": f"{self.config.environment}-nat-gateway-{i+1}"}
                )
            )
            nat_gateways.append(nat_gateway)
        
        return nat_gateways
    
    def _create_public_route_table(self) -> RouteTable:
        """Create public route table"""
        route_table = RouteTable(
            self,
            "public_route_table",
            vpc_id=self.vpc.id,
            tags=self.tagging_strategy.get_resource_tags(
                self.config,
                "RouteTable",
                {"Name": f"{self.config.environment}-public-rt"}
            )
        )
        
        # Add route to internet gateway
        Route(
            self,
            "public_internet_route",
            route_table_id=route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.internet_gateway.id
        )
        
        # Associate public subnets
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_subnet_association_{i}",
                subnet_id=subnet.id,
                route_table_id=route_table.id
            )
        
        return route_table
    
    def _create_private_route_tables(self) -> List[RouteTable]:
        """Create private route tables with NAT gateway routes"""
        route_tables = []
        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            route_table = RouteTable(
                self,
                f"private_route_table_{i}",
                vpc_id=self.vpc.id,
                tags=self.tagging_strategy.get_resource_tags(
                    self.config,
                    "RouteTable",
                    {"Name": f"{self.config.environment}-private-rt-{i+1}"}
                )
            )
            
            # Add route to NAT gateway
            Route(
                self,
                f"private_nat_route_{i}",
                route_table_id=route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id
            )
            
            # Associate private subnet
            RouteTableAssociation(
                self,
                f"private_subnet_association_{i}",
                subnet_id=private_subnet.id,
                route_table_id=route_table.id
            )
            
            route_tables.append(route_table)
        
        return route_tables
    
    def _create_vpc_flow_logs(self) -> FlowLog:
        """Create VPC Flow Logs with centralized logging"""
        if not self.config.security.vpc_flow_logs_enabled:
            return None
        
        # Create CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            "vpc_flow_logs_group",
            name=f"/aws/vpc/flowlogs/{self.config.environment}",
            retention_in_days=self.config.compliance.audit_log_retention_days,
            tags=self.tagging_strategy.get_resource_tags(
                self.config,
                "CloudWatchLogGroup",
                {"Name": f"{self.config.environment}-vpc-flow-logs"}
            )
        )
        
        # Create IAM role for VPC Flow Logs
        flow_logs_role = IamRole(
            self,
            "vpc_flow_logs_role",
            name=f"{self.config.environment}-vpc-flow-logs-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Principal": {
                            "Service": "vpc-flow-logs.amazonaws.com"
                        },
                        "Effect": "Allow"
                    }
                ]
            }""",
            tags=self.tagging_strategy.get_resource_tags(
                self.config,
                "IAMRole",
                {"Name": f"{self.config.environment}-vpc-flow-logs-role"}
            )
        )
        
        # Attach policy to role
        IamRolePolicyAttachment(
            self,
            "vpc_flow_logs_policy_attachment",
            role=flow_logs_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy"
        )
        
        # Create VPC Flow Logs
        return FlowLog(
            self,
            "vpc_flow_logs",
            iam_role_arn=flow_logs_role.arn,
            log_destination=log_group.arn,
            log_destination_type="cloud-watch-logs",
            resource_id=self.vpc.id,
            resource_type="VPC",
            traffic_type="ALL",
            tags=self.tagging_strategy.get_resource_tags(
                self.config,
                "VPCFlowLog",
                {"Name": f"{self.config.environment}-vpc-flow-logs"}
            )
        )
```

### constructs/core/security.py
```python
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudtrail import Cloudtrail
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_encryption import S3BucketServerSideEncryptionConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from constructs import Construct
from typing import Dict, List
from constructs.utils.config import EnvironmentConfig
from constructs.utils.tagging import TaggingStrategy
import json

class SecurityConstruct(Construct):
    """Comprehensive security construct with KMS, IAM, and monitoring"""
    
    def __init__(self, scope: Construct, construct_id: str, config: EnvironmentConfig, vpc_id: str):
        super().__init__(scope, construct_id)
        
        self.config = config
        self.vpc_id = vpc_id
        self.tagging_strategy = TaggingStrategy()
        
        # Create KMS keys for encryption
        self.kms_keys = self._create_kms_keys()
        
        # Create security groups
        self.security_groups = self._create_security_groups()
        
        # Create IAM roles and policies
        self.iam_roles = self._create_iam_roles()
        
        # Create CloudTrail
        self.cloudtrail = self._create_cloudtrail()
    
    def _create_kms_keys(self) -> Dict[str, KmsKey]:
        """Create KMS keys for different services"""
        keys = {}
        
        key_configs = {
            "general": "General purpose encryption key",
            "s3": "S3 bucket encryption key",
            "rds": "RDS encryption key",
            "cloudtrail": "CloudTrail encryption key"
        }
        
        for key_name, description in key_configs.items():
            key = KmsKey(
                self,
                f"kms_key_{key_name}",
                description=f"{self.config.environment} - {description}",
                key_usage="ENCRYPT_DECRYPT",
                key_spec="SYMMETRIC_DEFAULT",
                enable_key_rotation=self.config.security.kms_key_rotation,
                deletion_window_in_days=7,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {"AWS": f"arn:aws:iam::{self._get_account_id()}:root"},
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow use of the key within region only",
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": [
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "StringEquals": {
                                    "aws:RequestedRegion": self.config.region
                                }
                            }
                        }
                    ]
                }),
                tags=self.tagging_strategy.get_resource_tags(
                    self.config,
                    "KMSKey",
                    {"Name": f"{self.config.environment}-{key_name}-key"}
                )
            )
            
            # Create alias for the key
            KmsAlias(
                self,
                f"kms_alias_{key_name}",
                name=f"alias/{self.config.environment}-{key_name}",
                target_key_id=key.key_id
            )
            
            keys[key_name] = key
        
        return keys
    
    def _create_security_groups(self) -> Dict[str, SecurityGroup]:
        """Create security groups with minimal access"""
        security_groups = {}
        
        # Web tier security group
        web_sg = SecurityGroup(
            self,
            "web_security_group",
            name=f"{self.config.environment}-web-sg",
            description="Security group for web tier",
            vpc_id=self.vpc_id,
            tags=self.tagging_strategy.get_resource_tags(
                self.config,
                "SecurityGroup",
                {"Name": f"{self.config.environment}-web-sg", "Tier": "Web"}
            )
        )
        
        # Allow HTTPS inbound
        SecurityGroupRule(
            self,
            "web_https_inbound",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=web_sg.id,
            description="HTTPS inbound"
        )
        
        # Allow HTTP inbound (redirect to HTTPS)
        SecurityGroupRule(
            self,
            "web_http_inbound",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=web_sg.id,
            description="HTTP inbound for redirect"
        )
        
        security_groups["web"] = web_sg
        
        # Application tier security group
        app_sg = SecurityGroup(
            self,
            "app_security_group",
            name=f"{self.config.environment}-app-sg",
            description="Security group for application tier",
            vpc_id=self.vpc_id,
            tags=self.tagging_strategy.get_resource_tags(
                self.config,
                "SecurityGroup",
                {"Name": f"{self.config.environment}-app-sg", "Tier": "Application"}
            )
        )
        
        # Allow traffic from web tier
        SecurityGroupRule(
            self,
            "app_from_web",
            type="ingress",
            from_port=8080,
            to_port=8080,
            protocol="tcp",
            source_security_group_id=web_sg.id,
            security_group_id=app_sg.id,
            description="Application port from web tier"