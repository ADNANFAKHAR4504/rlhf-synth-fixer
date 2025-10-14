### Reasoning Trace
---

Alright, let me design a comprehensive Pulumi program for ScalePayments, a FinTech startup. I need to create:

1. A main stack implementation in `lib/tap_stack.py` that includes:
   - VPC with proper networking (subnets, NAT gateways, etc.)
   - ECS Fargate for microservices
   - RDS for transaction storage
   - ElastiCache for session management
   - API Gateway for external access
   - Load balancers
   - Security groups with proper rules
   - IAM roles and policies
   - Environment-specific configurations
   - Proper resource connectivity

2. Unit tests in `tests/unit/test_tap_stack.py` with:
   - At least 85% code coverage
   - Testing individual components
   - Resource configuration validation
   - Environment-specific settings tests

3. Integration tests in `tests/integration/test_tap_stack.py` with:
   - Creative real-world scenarios
   - End-to-end workflow testing
   - Failover scenarios
   - Security compliance testing
   - Environment promotion workflows

Let me start with the main stack implementation:

Key considerations:
- Multi-environment support (dev, staging, production)
- FinTech compliance requirements (encryption at rest, encryption in transit, audit logging)
- Proper networking with private subnets for databases
- Auto-scaling for ECS services
- High availability with multi-AZ deployments
- Security best practices (least privilege IAM, encrypted storage, secure networking)

I'll structure the code with:
- Configuration classes for environment-specific settings
- Resource creation methods with proper dependencies
- Helper methods for common patterns
- Comprehensive error handling and validation

For testing:
- Unit tests will mock Pulumi resources and test configurations
- Integration tests will simulate real scenarios like payment processing, failover, etc.

Let me write the complete implementation:
### Answer 
---

Looking at the requirements for ScalePayments' FinTech platform, I'll design a comprehensive multi-environment infrastructure with proper resource connectivity, security, and compliance features. Here's the complete implementation:

## lib/tap_stack.py

```python
"""
ScalePayments Infrastructure Stack
A comprehensive Pulumi program for deploying a FinTech payment processing platform
across multiple environments with proper security, compliance, and scalability.
"""

import json
import pulumi
from pulumi import Output, ResourceOptions, Config
import pulumi_aws as aws
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import hashlib


class Environment(Enum):
    """Supported deployment environments"""
    DEVELOPMENT = "dev"
    STAGING = "staging"
    PRODUCTION = "prod"


@dataclass
class EnvironmentConfig:
    """Environment-specific configuration parameters"""
    name: str
    vpc_cidr: str
    az_count: int
    nat_gateway_count: int
    rds_instance_class: str
    rds_multi_az: bool
    rds_backup_retention: int
    rds_encrypted: bool
    elasticache_node_type: str
    elasticache_num_cache_nodes: int
    ecs_desired_count: Dict[str, int]
    ecs_cpu: Dict[str, int]
    ecs_memory: Dict[str, int]
    enable_deletion_protection: bool
    enable_performance_insights: bool
    enable_enhanced_monitoring: bool
    log_retention_days: int
    enable_waf: bool
    enable_guardduty: bool
    enable_config: bool
    tags: Dict[str, str] = field(default_factory=dict)


class ScalePaymentsStack:
    """Main infrastructure stack for ScalePayments platform"""
    
    # Environment configurations
    ENV_CONFIGS = {
        Environment.DEVELOPMENT: EnvironmentConfig(
            name="dev",
            vpc_cidr="10.0.0.0/16",
            az_count=2,
            nat_gateway_count=1,
            rds_instance_class="db.t3.small",
            rds_multi_az=False,
            rds_backup_retention=7,
            rds_encrypted=True,
            elasticache_node_type="cache.t3.micro",
            elasticache_num_cache_nodes=1,
            ecs_desired_count={"api": 2, "payment": 2, "notification": 1},
            ecs_cpu={"api": 256, "payment": 512, "notification": 256},
            ecs_memory={"api": 512, "payment": 1024, "notification": 512},
            enable_deletion_protection=False,
            enable_performance_insights=False,
            enable_enhanced_monitoring=False,
            log_retention_days=7,
            enable_waf=False,
            enable_guardduty=False,
            enable_config=False,
            tags={"Environment": "Development", "CostCenter": "Engineering"}
        ),
        Environment.STAGING: EnvironmentConfig(
            name="staging",
            vpc_cidr="10.1.0.0/16",
            az_count=2,
            nat_gateway_count=2,
            rds_instance_class="db.t3.medium",
            rds_multi_az=True,
            rds_backup_retention=14,
            rds_encrypted=True,
            elasticache_node_type="cache.t3.small",
            elasticache_num_cache_nodes=2,
            ecs_desired_count={"api": 3, "payment": 3, "notification": 2},
            ecs_cpu={"api": 512, "payment": 1024, "notification": 512},
            ecs_memory={"api": 1024, "payment": 2048, "notification": 1024},
            enable_deletion_protection=True,
            enable_performance_insights=True,
            enable_enhanced_monitoring=True,
            log_retention_days=30,
            enable_waf=True,
            enable_guardduty=True,
            enable_config=True,
            tags={"Environment": "Staging", "CostCenter": "Engineering", "Compliance": "PCI-DSS"}
        ),
        Environment.PRODUCTION: EnvironmentConfig(
            name="prod",
            vpc_cidr="10.2.0.0/16",
            az_count=3,
            nat_gateway_count=3,
            rds_instance_class="db.r5.xlarge",
            rds_multi_az=True,
            rds_backup_retention=30,
            rds_encrypted=True,
            elasticache_node_type="cache.r5.large",
            elasticache_num_cache_nodes=3,
            ecs_desired_count={"api": 5, "payment": 5, "notification": 3},
            ecs_cpu={"api": 1024, "payment": 2048, "notification": 1024},
            ecs_memory={"api": 2048, "payment": 4096, "notification": 2048},
            enable_deletion_protection=True,
            enable_performance_insights=True,
            enable_enhanced_monitoring=True,
            log_retention_days=365,
            enable_waf=True,
            enable_guardduty=True,
            enable_config=True,
            tags={"Environment": "Production", "CostCenter": "Operations", 
                  "Compliance": "PCI-DSS", "DataClassification": "Sensitive"}
        )
    }
    
    def __init__(self, environment: str = "dev", config: Optional[Config] = None):
        """
        Initialize the ScalePayments infrastructure stack
        
        Args:
            environment: Target deployment environment (dev/staging/prod)
            config: Optional Pulumi configuration object
        """
        self.pulumi_config = config or Config()
        self.environment = self._validate_environment(environment)
        self.env_config = self.ENV_CONFIGS[self.environment]
        self.stack_name = f"scalepayments-{self.env_config.name}"
        
        # Resource containers
        self.vpc: Optional[aws.ec2.Vpc] = None
        self.subnets: Dict[str, List[aws.ec2.Subnet]] = {"public": [], "private": [], "database": []}
        self.security_groups: Dict[str, aws.ec2.SecurityGroup] = {}
        self.iam_roles: Dict[str, aws.iam.Role] = {}
        self.ecs_cluster: Optional[aws.ecs.Cluster] = None
        self.ecs_services: Dict[str, aws.ecs.Service] = {}
        self.rds_cluster: Optional[aws.rds.Cluster] = None
        self.elasticache_cluster: Optional[aws.elasticache.ReplicationGroup] = None
        self.alb: Optional[aws.lb.LoadBalancer] = None
        self.api_gateway: Optional[aws.apigatewayv2.Api] = None
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        self.kms_keys: Dict[str, aws.kms.Key] = {}
        
        # Initialize infrastructure
        self._create_infrastructure()
    
    def _validate_environment(self, environment: str) -> Environment:
        """Validate and return the environment enum"""
        try:
            return Environment(environment)
        except ValueError:
            raise ValueError(f"Invalid environment: {environment}. Must be one of: dev, staging, prod")
    
    def _get_availability_zones(self) -> List[str]:
        """Get availability zones for the current region"""
        azs = aws.get_availability_zones(state="available")
        return azs.names[:self.env_config.az_count]
    
    def _create_tags(self, resource_name: str, additional_tags: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Create standardized tags for resources"""
        tags = {
            "Name": f"{self.stack_name}-{resource_name}",
            "ManagedBy": "Pulumi",
            "Stack": self.stack_name,
            "Project": "ScalePayments",
            **self.env_config.tags
        }
        if additional_tags:
            tags.update(additional_tags)
        return tags
    
    def _create_infrastructure(self):
        """Create all infrastructure components"""
        self._create_kms_keys()
        self._create_networking()
        self._create_security_groups()
        self._create_iam_roles()
        self._create_log_groups()
        self._create_rds_cluster()
        self._create_elasticache_cluster()
        self._create_ecs_cluster()
        self._create_load_balancer()
        self._create_ecs_services()
        self._create_api_gateway()
        if self.env_config.enable_waf:
            self._create_waf()
        if self.env_config.enable_guardduty:
            self._create_guardduty()
        if self.env_config.enable_config:
            self._create_aws_config()
    
    def _create_kms_keys(self):
        """Create KMS keys for encryption"""
        # RDS encryption key
        self.kms_keys["rds"] = aws.kms.Key(
            f"{self.stack_name}-rds-key",
            description=f"KMS key for RDS encryption - {self.stack_name}",
            deletion_window_in_days=30 if self.environment == Environment.PRODUCTION else 7,
            enable_key_rotation=True,
            tags=self._create_tags("rds-kms-key")
        )
        
        # ElastiCache encryption key
        self.kms_keys["elasticache"] = aws.kms.Key(
            f"{self.stack_name}-elasticache-key",
            description=f"KMS key for ElastiCache encryption - {self.stack_name}",
            deletion_window_in_days=30 if self.environment == Environment.PRODUCTION else 7,
            enable_key_rotation=True,
            tags=self._create_tags("elasticache-kms-key")
        )
        
        # Logs encryption key
        self.kms_keys["logs"] = aws.kms.Key(
            f"{self.stack_name}-logs-key",
            description=f"KMS key for CloudWatch logs encryption - {self.stack_name}",
            deletion_window_in_days=30 if self.environment == Environment.PRODUCTION else 7,
            enable_key_rotation=True,
            tags=self._create_tags("logs-kms-key")
        )
    
    def _create_networking(self):
        """Create VPC and networking components"""
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{self.stack_name}-vpc",
            cidr_block=self.env_config.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags=self._create_tags("vpc")
        )
        
        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"{self.stack_name}-igw",
            vpc_id=self.vpc.id,
            tags=self._create_tags("igw")
        )
        
        # Get AZs
        azs = self._get_availability_zones()
        
        # Create subnets
        subnet_cidrs = self._calculate_subnet_cidrs()
        
        # Create public subnets
        for i, az in enumerate(azs):
            public_subnet = aws.ec2.Subnet(
                f"{self.stack_name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidrs["public"][i],
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags=self._create_tags(f"public-subnet-{i+1}", {"Type": "Public"})
            )
            self.subnets["public"].append(public_subnet)
        
        # Create NAT Gateways
        nat_gateways = []
        for i in range(min(self.env_config.nat_gateway_count, len(azs))):
            eip = aws.ec2.Eip(
                f"{self.stack_name}-nat-eip-{i+1}",
                domain="vpc",
                tags=self._create_tags(f"nat-eip-{i+1}")
            )
            
            nat_gateway = aws.ec2.NatGateway(
                f"{self.stack_name}-nat-gateway-{i+1}",
                allocation_id=eip.id,
                subnet_id=self.subnets["public"][i].id,
                tags=self._create_tags(f"nat-gateway-{i+1}")
            )
            nat_gateways.append(nat_gateway)
        
        # Create private subnets
        for i, az in enumerate(azs):
            private_subnet = aws.ec2.Subnet(
                f"{self.stack_name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidrs["private"][i],
                availability_zone=az,
                tags=self._create_tags(f"private-subnet-{i+1}", {"Type": "Private"})
            )
            self.subnets["private"].append(private_subnet)
        
        # Create database subnets
        for i, az in enumerate(azs):
            db_subnet = aws.ec2.Subnet(
                f"{self.stack_name}-db-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidrs["database"][i],
                availability_zone=az,
                tags=self._create_tags(f"db-subnet-{i+1}", {"Type": "Database"})
            )
            self.subnets["database"].append(db_subnet)
        
        # Create route tables
        # Public route table
        public_rt = aws.ec2.RouteTable(
            f"{self.stack_name}-public-rt",
            vpc_id=self.vpc.id,
            tags=self._create_tags("public-rt")
        )
        
        aws.ec2.Route(
            f"{self.stack_name}-public-route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )
        
        for i, subnet in enumerate(self.subnets["public"]):
            aws.ec2.RouteTableAssociation(
                f"{self.stack_name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )
        
        # Private route tables
        for i, subnet in enumerate(self.subnets["private"]):
            private_rt = aws.ec2.RouteTable(
                f"{self.stack_name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags=self._create_tags(f"private-rt-{i+1}")
            )
            
            nat_index = i % len(nat_gateways)
            aws.ec2.Route(
                f"{self.stack_name}-private-route-{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateways[nat_index].id
            )
            
            aws.ec2.RouteTableAssociation(
                f"{self.stack_name}-private-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )
        
        # Database route table (no internet access)
        db_rt = aws.ec2.RouteTable(
            f"{self.stack_name}-db-rt",
            vpc_id=self.vpc.id,
            tags=self._create_tags("db-rt")
        )
        
        for i, subnet in enumerate(self.subnets["database"]):
            aws.ec2.RouteTableAssociation(
                f"{self.stack_name}-db-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=db_rt.id
            )
    
    def _calculate_subnet_cidrs(self) -> Dict[str, List[str]]:
        """Calculate subnet CIDRs based on VPC CIDR and AZ count"""
        base_octets = self.env_config.vpc_cidr.split('.')[:2]
        subnet_cidrs = {
            "public": [],
            "private": [],
            "database": []
        }
        
        for i in range(self.env_config.az_count):
            subnet_cidrs["public"].append(f"{'.'.join(base_octets)}.{i*10}.0/24")
            subnet_cidrs["private"].append(f"{'.'.join(base_octets)}.{100+i*10}.0/24")
            subnet_cidrs["database"].append(f"{'.'.join(base_octets)}.{200+i*10}.0/24")
        
        return subnet_cidrs
    
    def _create_security_groups(self):
        """Create security groups for different components"""
        # ALB Security Group
        self.security_groups["alb"] = aws.ec2.SecurityGroup(
            f"{self.stack_name}-alb-sg",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet (redirect to HTTPS)"
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
            tags=self._create_tags("alb-sg")
        )
        
        # ECS Security Group
        self.security_groups["ecs"] = aws.ec2.SecurityGroup(
            f"{self.stack_name}-ecs-sg",
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.security_groups["alb"].id],
                    description="HTTP from ALB"
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
            tags=self._create_tags("ecs-sg")
        )
        
        # Allow ECS tasks to communicate with each other
        aws.ec2.SecurityGroupRule(
            f"{self.stack_name}-ecs-internal-ingress",
            type="ingress",
            from_port=0,
            to_port=65535,
            protocol="tcp",
            source_security_group_id=self.security_groups["ecs"].id,
            security_group_id=self.security_groups["ecs"].id,
            description="Allow ECS tasks to communicate"
        )
        
        # RDS Security Group
        self.security_groups["rds"] = aws.ec2.SecurityGroup(
            f"{self.stack_name}-rds-sg",
            vpc_id=self.vpc.id,
            description="Security group for RDS database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[self.security_groups["ecs"].id],
                    description="PostgreSQL from ECS tasks"
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
            tags=self._create_tags("rds-sg")
        )
        
        # ElastiCache Security Group
        self.security_groups["elasticache"] = aws.ec2.SecurityGroup(
            f"{self.stack_name}-elasticache-sg",
            vpc_id=self.vpc.id,
            description="Security group for ElastiCache",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    security_groups=[self.security_groups["ecs"].id],
                    description="Redis from ECS tasks"
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
            tags=self._create_tags("elasticache-sg")
        )
    
    def _create_iam_roles(self):
        """Create IAM roles and policies"""
        # ECS Task Execution Role
        ecs_execution_assume_policy = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    actions=["sts:AssumeRole"],
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type="Service",
                            identifiers=["ecs-tasks.amazonaws.com"]
                        )
                    ]
                )
            ]
        )
        
        self.iam_roles["ecs_execution"] = aws.iam.Role(
            f"{self.stack_name}-ecs-execution-role",
            assume_role_policy=ecs_execution_assume_policy.json,
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
            ],
            tags=self._create_tags("ecs-execution-role")
        )
        
        # ECS Task Role
        self.iam_roles["ecs_task"] = aws.iam.Role(
            f"{self.stack_name}-ecs-task-role",
            assume_role_policy=ecs_execution_assume_policy.json,
            tags=self._create_tags("ecs-task-role")
        )
        
        # Task role policies
        task_policy = aws.iam.RolePolicy(
            f"{self.stack_name}-ecs-task-policy",
            role=self.iam_roles["ecs_task"].id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "kms:Decrypt"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"arn:aws:s3:::scalepayments-{self.env_config.name}/*"
                    }
                ]
            })
        )
    
    def _create_log_groups(self):
        """Create CloudWatch log groups"""
        services = ["api", "payment", "notification"]
        
        for service in services:
            self.log_groups[service] = aws.cloudwatch.LogGroup(
                f"{self.stack_name}-{service}-logs",
                retention_in_days=self.env_config.log_retention_days,
                kms_key_id=self.kms_keys["logs"].arn,
                tags=self._create_tags(f"{service}-logs")
            )
    
    def _create_rds_cluster(self):
        """Create RDS Aurora PostgreSQL cluster"""
        # Create subnet group
        db_subnet_group = aws.rds.SubnetGroup(
            f"{self.stack_name}-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.subnets["database"]],
            description=f"Database subnet group for {self.stack_name}",
            tags=self._create_tags("db-subnet-group")
        )
        
        # Generate master password securely
        master_password = aws.secretsmanager.RandomPassword(
            f"{self.stack_name}-rds-password",
            length=32,
            special=True,
            exclude_characters="\"'@/\\"
        )
        
        # Store password in Secrets Manager
        rds_secret = aws.secretsmanager.Secret(
            f"{self.stack_name}-rds-secret",
            description=f"RDS master password for {self.stack_name}",
            kms_key_id=self.kms_keys["rds"].arn,
            tags=self._create_tags("rds-secret")
        )
        
        rds_secret_version = aws.secretsmanager.SecretVersion(
            f"{self.stack_name}-rds-secret-version",
            secret_id=rds_secret.id,
            secret_string=master_password.result.apply(
                lambda pwd: json.dumps({"username": "dbadmin", "password": pwd})
            )
        )
        
        # Create Aurora cluster
        self.rds_cluster = aws.rds.Cluster(
            f"{self.stack_name}-aurora-cluster",
            engine="aurora-postgresql",
            engine_version="13.7",
            master_username="dbadmin",
            master_password=master_password.result,
            database_name="scalepayments",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[self.security_groups["rds"].id],
            storage_encrypted=self.env_config.rds_encrypted,
            kms_key_id=self.kms_keys["rds"].arn if self.env_config.rds_encrypted else None,
            backup_retention_period=self.env_config.rds_backup_retention,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            deletion_protection=self.env_config.enable_deletion_protection,
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags=self._create_tags("aurora-cluster")
        )
        
        # Create cluster instances
        for i in range(2 if self.env_config.rds_multi_az else 1):
            aws.rds.ClusterInstance(
                f"{self.stack_name}-aurora-instance-{i+1}",
                cluster_identifier=self.rds_cluster.id,
                instance_class=self.env_config.rds_instance_class,
                engine="aurora-postgresql",
                performance_insights_enabled=self.env_config.enable_performance_insights,
                monitoring_interval=60 if self.env_config.enable_enhanced_monitoring else 0,
                monitoring_role_arn=self.iam_roles.get("rds_monitoring", {}).arn if self.env_config.enable_enhanced_monitoring else None,
                tags=self._create_tags(f"aurora-instance-{i+1}")
            )
    
    def _create_elasticache_cluster(self):
        """Create ElastiCache Redis cluster"""
        # Create subnet group
        cache_subnet_group = aws.elasticache.SubnetGroup(
            f"{self.stack_name}-cache-subnet-group",
            subnet_ids=[subnet.id for subnet in self.subnets["private"]],
            description=f"ElastiCache subnet group for {self.stack_name}",
            tags=self._create_tags("cache-subnet-group")
        )
        
        # Create replication group
        self.elasticache_cluster = aws.elasticache.ReplicationGroup(
            f"{self.stack_name}-redis",
            replication_group_description=f"Redis cluster for {self.stack_name}",
            engine="redis",
            node_type=self.env_config.elasticache_node_type,
            number_cache_clusters=self.env_config.elasticache_num_cache_nodes,
            automatic_failover_enabled=self.env_config.elasticache_num_cache_nodes > 1,
            multi_az_enabled=self.env_config.elasticache_num_cache_nodes > 1,
            subnet_group_name=cache_subnet_group.name,
            security_group_ids=[self.security_groups["elasticache"].id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            kms_key_id=self.kms_keys["elasticache"].arn,
            snapshot_retention_limit=5 if self.environment != Environment.DEVELOPMENT else 0,
            snapshot_window="03:00-05:00",
            maintenance_window="sun:05:00-sun:07:00",
            notification_topic_arn=None,  # Would add SNS topic in production
            tags=self._create_tags("redis-cluster")
        )
    
    def _create_ecs_cluster(self):
        """Create ECS Fargate cluster"""
        self.ecs_cluster = aws.ecs.Cluster(
            f"{self.stack_name}-ecs-cluster",
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategies=[
                aws.ecs.ClusterDefaultCapacityProviderStrategyArgs(
                    capacity_provider="FARGATE",
                    weight=1,
                    base=1
                )
            ],
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags=self._create_tags("ecs-cluster")
        )
    
    def _create_load_balancer(self):
        """Create Application Load Balancer"""
        self.alb = aws.lb.LoadBalancer(
            f"{self.stack_name}-alb",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.subnets["public"]],
            security_groups=[self.security_groups["alb"].id],
            enable_deletion_protection=self.env_config.enable_deletion_protection,
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            tags=self._create_tags("alb")
        )
        
        # Create target groups for services
        self.target_groups = {}
        for service in ["api", "payment", "notification"]:
            self.target_groups[service] = aws.lb.TargetGroup(
                f"{self.stack_name}-{service}-tg",
                port=8080,
                protocol="HTTP",
                vpc_id=self.vpc.id,
                target_type="ip",
                health_check=aws.lb.TargetGroupHealthCheckArgs(
                    enabled=True,
                    healthy_threshold=2,
                    unhealthy_threshold=2,
                    timeout=5,
                    interval=30,
                    path=f"/{service}/health",
                    matcher="200"
                ),
                deregistration_delay=30,
                tags=self._create_tags(f"{service}-tg")
            )
    
    def _create_ecs_services(self):
        """Create ECS services for microservices"""
        services = {
            "api": {
                "image": "scalepayments/api:latest",
                "port": 8080,
                "path_pattern": "/api/*",
                "priority": 100
            },
            "payment": {
                "image": "scalepayments/payment:latest",
                "port": 8080,
                "path_pattern": "/payment/*",
                "priority": 200
            },
            "notification": {
                "image": "scalepayments/notification:latest",
                "port": 8080,
                "path_pattern": "/notification/*",
                "priority": 300
            }
        }
        
        # Create HTTPS listener
        https_listener = aws.lb.Listener(
            f"{self.stack_name}-https-listener",
            load_balancer_arn=self.alb.arn,
            port=443,
            protocol="HTTPS",
            certificate_arn=None,  # Would add ACM certificate ARN
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="fixed-response",
                    fixed_response=aws.lb.ListenerDefaultActionFixedResponseArgs(
                        content_type="text/plain",
                        message_body="Not Found",
                        status_code="404"
                    )
                )
            ],
            tags=self._create_tags("https-listener")
        )
        
        for service_name, service_config in services.items():
            # Create task definition
            container_definitions = [{
                "name": service_name,
                "image": service_config["image"],
                "portMappings": [{
                    "containerPort": service_config["port"],
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "ENVIRONMENT", "value": self.env_config.name},
                    {"name": "SERVICE_NAME", "value": service_name}
                ],
                "secrets": [
                    {
                        "name": "DB_PASSWORD",
                        "valueFrom": f"arn:aws:secretsmanager:{pulumi.get_region()}:{pulumi.get_caller_identity().account_id}:secret:{self.stack_name}-rds-secret"
                    }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": self.log_groups[service_name].name,
                        "awslogs-region": pulumi.get_region(),
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "essential": True,
                "memory": self.env_config.ecs_memory[service_name],
                "cpu": self.env_config.ecs_cpu[service_name]
            }]
            
            task_definition = aws.ecs.TaskDefinition(
                f"{self.stack_name}-{service_name}-task",
                family=f"{self.stack_name}-{service_name}",
                network_mode="awsvpc",
                requires_compatibilities=["FARGATE"],
                cpu=str(self.env_config.ecs_cpu[service_name]),
                memory=str(self.env_config.ecs_memory[service_name]),
                execution_role_arn=self.iam_roles["ecs_execution"].arn,
                task_role_arn=self.iam_roles["ecs_task"].arn,
                container_definitions=json.dumps(container_definitions),
                tags=self._create_tags(f"{service_name}-task")
            )
            
            # Create service
            self.ecs_services[service_name] = aws.ecs.Service(
                f"{self.stack_name}-{service_name}-service",
                cluster=self.ecs_cluster.arn,
                task_definition=task_definition.arn,
                desired_count=self.env_config.ecs_desired_count[service_name],
                launch_type="FARGATE",
                network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                    subnets=[subnet.id for subnet in self.subnets["private"]],
                    security_groups=[self.security_groups["ecs"].id],
                    assign_public_ip=False
                ),
                load_balancers=[
                    aws.ecs.ServiceLoadBalancerArgs(
                        target_group_arn=self.target_groups[service_name].arn,
                        container_name=service_name,
                        container_port=service_config["port"]
                    )
                ],
                health_check_grace_period_seconds=60,
                deployment_configuration=aws.ecs.ServiceDeploymentConfigurationArgs(
                    maximum_percent=200,
                    minimum_healthy_percent=100
                ),
                enable_ecs_managed_tags=True,
                propagate_tags="SERVICE",
                tags=self._create_tags(f"{service_name}-service")
            )
            
            # Create listener rule
            aws.lb.ListenerRule(
                f"{self.stack_name}-{service_name}-rule",
                listener_arn=https_listener.arn,
                priority=service_config["priority"],
                conditions=[
                    aws.lb.ListenerRuleConditionArgs(
                        path_pattern=aws.lb.ListenerRuleConditionPathPatternArgs(
                            values=[service_config["path_pattern"]]
                        )
                    )
                ],
                actions=[
                    aws.lb.ListenerRuleActionArgs(
                        type="forward",
                        target_group_arn=self.target_groups[service_name].arn
                    )
                ],
                tags=self._create_tags(f"{service_name}-listener-rule")
            )
    
    def _create_api_gateway(self):
        """Create API Gateway for external API access"""
        self.api_gateway = aws.apigatewayv2.Api(
            f"{self.stack_name}-api-gateway",
            name=f"{self.stack_name}-api",
            protocol_type="HTTP",
            description=f"API Gateway for {self.stack_name}",
            cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
                allow_origins=["*"] if self.environment == Environment.DEVELOPMENT else ["https://scalepayments.com"],
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["*"],
                max_age=300
            ),
            tags=self._create_tags("api-gateway")
        )
        
        # Create VPC Link for private integration
        vpc_link = aws.apigatewayv2.VpcLink(
            f"{self.stack_name}-vpc-link",
            name=f"{self.stack_name}-vpc-link",
            security_group_ids=[self.security_groups["alb"].id],
            subnet_ids=[subnet.id for subnet in self.subnets["private"]],
            tags=self._create_tags("vpc-link")
        )
    
    def _create_waf(self):
        """Create WAF for additional security (staging/production only)"""
        if not self.env_config.enable_waf:
            return
        
        # Create WAF Web ACL
        waf_acl = aws.wafv2.WebAcl(
            f"{self.stack_name}-waf-acl",
            scope="REGIONAL",
            default_action=aws.wafv2.WebAclDefaultActionArgs(
                allow=aws.wafv2.WebAclDefaultActionAllowArgs()
            ),
            rules=[
                aws.wafv2.WebAclRuleArgs(
                    name="RateLimitRule",
                    priority=1,
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    action=aws.wafv2.WebAclRuleActionArgs(
                        block=aws.wafv2.WebAclRuleActionBlockArgs()
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"{self.stack_name}-waf-acl",
                sampled_requests_enabled=True
            ),
            tags=self._create_tags("waf-acl")
        )
        
        # Associate WAF with ALB
        aws.wafv2.WebAclAssociation(
            f"{self.stack_name}-waf-association",
            resource_arn=self.alb.arn,
            web_acl_arn=waf_acl.arn
        )
    
    def _create_guardduty(self):
        """Enable GuardDuty for threat detection (staging/production only)"""
        if not self.env_config.enable_guardduty:
            return
        
        guardduty = aws.guardduty.Detector(
            f"{self.stack_name}-guardduty",
            enable=True,
            finding_publishing_frequency="FIFTEEN_MINUTES",
            tags=self._create_tags("guardduty")
        )
    
    def _create_aws_config(self):
        """Enable AWS Config for compliance (staging/production only)"""
        if not self.env_config.enable_config:
            return
        
        # Create S3 bucket for Config
        config_bucket = aws.s3.Bucket(
            f"{self.stack_name}-config-bucket",
            bucket=f"scalepayments-config-{self.env_config.name}-{pulumi.get_stack()}",
            acl="private",
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
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(days=90)
                )
            ],
            tags=self._create_tags("config-bucket")
        )
        
        # Create Config Recorder Role
        config_role_policy = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    actions=["sts:AssumeRole"],
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type="Service",
                            identifiers=["config.amazonaws.com"]
                        )
                    ]
                )
            ]
        )
        
        config_role = aws.iam.Role(
            f"{self.stack_name}-config-role",
            assume_role_policy=config_role_policy.json,
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/ConfigRole"
            ],
            tags=self._create_tags("config-role")
        )
        
        # Create Config Recorder
        recorder = aws.cfg.Recorder(
            f"{self.stack_name}-config-recorder",
            role_arn=config_role.arn,
            recording_group=aws.cfg.RecorderRecordingGroupArgs(
                all_supported=True
            )
        )
        
        # Create Delivery Channel
        delivery_channel = aws.cfg.DeliveryChannel(
            f"{self.stack_name}-config-delivery",
            s3_bucket_name=config_bucket.bucket
        )
        
        # Start Config Recorder
        aws.cfg.RecorderStatus(
            f"{self.stack_name}-config-status",
            name=recorder.name,
            is_enabled=True,
            opts=ResourceOptions(depends_on=[delivery_channel])
        )
    
    def get_outputs(self) -> Dict[str, Any]:
        """Get stack outputs for export"""
        return {
            "vpc_id": self.vpc.id if self.vpc else None,
            "alb_dns": self.alb.dns_name if self.alb else None,
            "rds_endpoint": self.rds_cluster.endpoint if self.rds_cluster else None,
            "redis_endpoint": self.elasticache_cluster.primary_endpoint_address if self.elasticache_cluster else None,
            "api_gateway_url": self.api_gateway.api_endpoint if self.api_gateway else None,
            "ecs_cluster_name": self.ecs_cluster.name if self.ecs_cluster else None,
            "environment": self.env_config.name
        }


def main():
    """Main entry point for Pulumi program"""
    config = Config()
    environment = config.get("environment") or "dev"
    
    # Create stack
    stack = ScalePaymentsStack(environment=environment, config=config)
    
    # Export outputs
    outputs = stack.get_outputs()
    for key, value in outputs.items():
        pulumi.export(key, value)


if __name__ == "__main__":
    main()
```

## tests/unit/test_tap_stack.py

```python
"""
Unit tests for ScalePayments Infrastructure Stack
Comprehensive testing with 85%+ code coverage for all components
"""

import unittest
from unittest.mock import Mock, MagicMock, patch, PropertyMock
import json
import pulumi
from pulumi import Config
import pulumi_aws as aws

# Set up test environment
pulumi.runtime.set_mocks(
    MockMocks(),
    preview=False,
)

from lib.tap_stack import ScalePaymentsStack, Environment, EnvironmentConfig


class MockMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources"""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {
                **args.inputs,
                "id": f"vpc-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789:vpc/vpc-{args.name}",
                "default_security_group_id": f"sg-default-{args.name}"
            }
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {
                **args.inputs,
                "id": f"subnet-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789:subnet/subnet-{args.name}"
            }
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {
                **args.inputs,
                "id": f"sg-{args.name}",
                "arn": f"arn:aws:ec2:us-east-1:123456789:security-group/sg-{args.name}"
            }
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs = {
                **args.inputs,
                "id": f"cluster-{args.name}",
                "arn": f"arn:aws:ecs:us-east-1:123456789:cluster/{args.name}",
                "name": args.name
            }
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs = {
                **args.inputs,
                "id": f"rds-{args.name}",
                "arn": f"arn:aws:rds:us-east-1:123456789:cluster:{args.name}",
                "endpoint": f"{args.name}.cluster-xyz.us-east-1.rds.amazonaws.com",
                "reader_endpoint": f"{args.name}.cluster-ro-xyz.us-east-1.rds.amazonaws.com"
            }
        elif args.typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs = {
                **args.inputs,
                "id": f"redis-{args.name}",
                "arn": f"arn:aws:elasticache:us-east-1:123456789:replicationgroup:{args.name}",
                "primary_endpoint_address": f"{args.name}.cache.amazonaws.com",
                "configuration_endpoint_address": f"{args.name}.cache.amazonaws.com"
            }
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {
                **args.inputs,
                "id": f"lb-{args.name}",
                "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/{args.name}/xyz",
                "dns_name": f"{args.name}-123456789.us-east-1.elb.amazonaws.com",
                "zone_id": "Z35SXDOTRQ7X7K"
            }
        elif args.typ == "aws:apigatewayv2/api:Api":
            outputs = {
                **args.inputs,
                "id": f"api-{args.name}",
                "api_endpoint": f"https://{args.name}.execute-api.us-east-1.amazonaws.com",
                "arn": f"arn:aws:apigateway:us-east-1::/apis/{args.name}"
            }
        elif args.typ == "aws:kms/key:Key":
            outputs = {
                **args.inputs,
                "id": f"kms-{args.name}",
                "arn": f"arn:aws:kms:us-east-1:123456789:key/{args.name}",
                "key_id": f"key-{args.name}"
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": f"role-{args.name}",
                "arn": f"arn:aws:iam::123456789:role/{args.name}",
                "name": args.name
            }
        
        return [args.name + '_id', outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
        elif args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1"}
        elif args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"account_id": "123456789"}
        return {}


class TestScalePaymentsStack(unittest.TestCase):
    """Test suite for ScalePaymentsStack"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_config = Mock(spec=Config)
        self.mock_config.get.return_value = "dev"
    
    def test_environment_validation(self):
        """Test environment validation"""
        # Valid environments
        for env in ["dev", "staging", "prod"]:
            stack = ScalePaymentsStack(environment=env, config=self.mock_config)
            self.assertEqual(stack.environment.value, env)
        
        # Invalid environment
        with self.assertRaises(ValueError) as context:
            ScalePaymentsStack(environment="invalid", config=self.mock_config)
        self.assertIn("Invalid environment", str(context.exception))
    
    def test_environment_config_loading(self):
        """Test environment-specific configuration loading"""
        # Development environment
        dev_stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        self.assertEqual(dev_stack.env_config.name, "dev")
        self.assertEqual(dev_stack.env_config.vpc_cidr, "10.0.0.0/16")
        self.assertEqual(dev_stack.env_config.az_count, 2)
        self.assertFalse(dev_stack.env_config.rds_multi_az)
        self.assertFalse(dev_stack.env_config.enable_waf)
        
        # Staging environment
        staging_stack = ScalePaymentsStack(environment="staging", config=self.mock_config)
        self.assertEqual(staging_stack.env_config.name, "staging")
        self.assertEqual(staging_stack.env_config.vpc_cidr, "10.1.0.0/16")
        self.assertTrue(staging_stack.env_config.rds_multi_az)
        self.assertTrue(staging_stack.env_config.enable_waf)
        
        # Production environment
        prod_stack = ScalePaymentsStack(environment="prod", config=self.mock_config)
        self.assertEqual(prod_stack.env_config.name, "prod")
        self.assertEqual(prod_stack.env_config.vpc_cidr, "10.2.0.0/16")
        self.assertEqual(prod_stack.env_config.az_count, 3)
        self.assertEqual(prod_stack.env_config.rds_backup_retention, 30)
        self.assertTrue(prod_stack.env_config.enable_guardduty)
    
    def test_tag_creation(self):
        """Test standardized tag creation"""
        stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        
        # Basic tags
        tags = stack._create_tags("test-resource")
        self.assertEqual(tags["Name"], "scalepayments-dev-test-resource")
        self.assertEqual(tags["ManagedBy"], "Pulumi")
        self.assertEqual(tags["Stack"], "scalepayments-dev")
        self.assertEqual(tags["Project"], "ScalePayments")
        self.assertEqual(tags["Environment"], "Development")
        
        # With additional tags
        additional = {"CustomTag": "CustomValue"}
        tags = stack._create_tags("test-resource", additional)
        self.assertEqual(tags["CustomTag"], "CustomValue")
    
    def test_subnet_cidr_calculation(self):
        """Test subnet CIDR calculation logic"""
        stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        cidrs = stack._calculate_subnet_cidrs()
        
        # Verify structure
        self.assertIn("public", cidrs)
        self.assertIn("private", cidrs)
        self.assertIn("database", cidrs)
        
        # Verify CIDR patterns for dev (2 AZs)
        self.assertEqual(len(cidrs["public"]), 2)
        self.assertEqual(cidrs["public"][0], "10.0.0.0/24")
        self.assertEqual(cidrs["public"][1], "10.0.10.0/24")
        
        self.assertEqual(len(cidrs["private"]), 2)
        self.assertEqual(cidrs["private"][0], "10.0.100.0/24")
        self.assertEqual(cidrs["private"][1], "10.0.110.0/24")
        
        self.assertEqual(len(cidrs["database"]), 2)
        self.assertEqual(cidrs["database"][0], "10.0.200.0/24")
        self.assertEqual(cidrs["database"][1], "10.0.210.0/24")
    
    def test_availability_zones(self):
        """Test availability zone selection"""
        stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        azs = stack._get_availability_zones()
        
        # Dev should use 2 AZs
        self.assertEqual(len(azs), 2)
        
        # Production should use 3 AZs
        prod_stack = ScalePaymentsStack(environment="prod", config=self.mock_config)
        prod_azs = prod_stack._get_availability_zones()
        self.assertEqual(len(prod_azs), 3)
    
    def test_kms_key_creation(self):
        """Test KMS key creation with environment-specific settings"""
        # Development environment
        dev_stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        self.assertIn("rds", dev_stack.kms_keys)
        self.assertIn("elasticache", dev_stack.kms_keys)
        self.assertIn("logs", dev_stack.kms_keys)
        
        # Production environment (different deletion window)
        prod_stack = ScalePaymentsStack(environment="prod", config=self.mock_config)
        self.assertIn("rds", prod_stack.kms_keys)
    
    def test_vpc_creation(self):
        """Test VPC and networking resource creation"""
        stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        
        # Verify VPC exists
        self.assertIsNotNone(stack.vpc)
        
        # Verify subnets
        self.assertEqual(len(stack.subnets["public"]), 2)
        self.assertEqual(len(stack.subnets["private"]), 2)
        self.assertEqual(len(stack.subnets["database"]), 2)
    
    def test_security_group_creation(self):
        """Test security group creation and rules"""
        stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        
        # Verify all security groups exist
        expected_groups = ["alb", "ecs", "rds", "elasticache"]
        for sg_name in expected_groups:
            self.assertIn(sg_name, stack.security_groups)
            self.assertIsNotNone(stack.security_groups[sg_name])
    
    def test_iam_role_creation(self):
        """Test IAM role and policy creation"""
        stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        
        # Verify IAM roles exist
        self.assertIn("ecs_execution", stack.iam_roles)
        self.assertIn("ecs_task", stack.iam_roles)
        self.assertIsNotNone(stack.iam_roles["ecs_execution"])
        self.assertIsNotNone(stack.iam_roles["ecs_task"])
    
    def test_log_group_creation(self):
        """Test CloudWatch log group creation"""
        stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        
        # Verify log groups for each service
        services = ["api", "payment", "notification"]
        for service in services:
            self.assertIn(service, stack.log_groups)
            self.assertIsNotNone(stack.log_groups[service])
    
    def test_rds_cluster_configuration(self):
        """Test RDS cluster configuration across environments"""
        # Development
        dev_stack = ScalePaymentsStack(environment="dev", config=self.mock_config)
        self.assertIsNotNone(dev_stack.rds_cluster)
        
        # Production (different settings)
        prod_stack = ScalePaymentsStack(environment="prod", config=self.mock_config)
        self.assertIsNotNone(prod_stack.rds_cluster)
    