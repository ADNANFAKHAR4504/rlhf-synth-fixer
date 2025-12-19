# Multi-Region Payment Processing Migration - CDKTF Python Implementation

This implementation provides a complete CDKTF Python solution for migrating a payment processing system from single-region to multi-region architecture.

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python main.py",
  "projectId": "payment-migration",
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

## File: main.py

```python
#!/usr/bin/env python
from cdktf import App
from stacks.payment_stack import PaymentMigrationStack

app = App()

# Create stack with environment suffix
environment_suffix = app.node.try_get_context("environment_suffix") or "dev"
migration_phase = app.node.try_get_context("migration_phase") or "legacy"

PaymentMigrationStack(
    app,
    "payment-migration",
    environment_suffix=environment_suffix,
    migration_phase=migration_phase
)

app.synth()
```

## File: stacks/__init__.py

```python
# Empty init file
```

## File: stacks/payment_stack.py

```python
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from constructs import Construct
from .networking import NetworkingModule
from .database import DatabaseModule
from .compute import ComputeModule
from .storage import StorageModule
from .security import SecurityModule
from .monitoring import MonitoringModule
from .dns import DnsModule

class PaymentMigrationStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.migration_phase = migration_phase

        # Configure S3 backend for state
        S3Backend(self,
            bucket="payment-terraform-state",
            key=f"payment-migration/{migration_phase}/terraform.tfstate",
            region="us-east-1",
            encrypt=True,
            dynamodb_table="terraform-state-lock"
        )

        # Primary region provider
        self.primary_provider = AwsProvider(self, "aws-primary",
            region="us-east-1",
            alias="primary",
            default_tags=[{
                "tags": {
                    "Environment": migration_phase,
                    "Project": "payment-migration",
                    "MigrationPhase": migration_phase,
                    "Suffix": environment_suffix
                }
            }]
        )

        # Secondary region provider
        self.secondary_provider = AwsProvider(self, "aws-secondary",
            region="us-east-2",
            alias="secondary",
            default_tags=[{
                "tags": {
                    "Environment": migration_phase,
                    "Project": "payment-migration",
                    "MigrationPhase": migration_phase,
                    "Suffix": environment_suffix
                }
            }]
        )

        # Security module (KMS, IAM) - ISSUE: Missing environmentSuffix in KMS key aliases
        self.security = SecurityModule(self, "security",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Networking module - ISSUE: Missing environmentSuffix in VPC names
        self.networking = NetworkingModule(self, "networking",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Database module
        self.database = DatabaseModule(self, "database",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            networking=self.networking,
            security=self.security,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Storage module - ISSUE: Missing cross-region replication configuration
        self.storage = StorageModule(self, "storage",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            security=self.security,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Compute module
        self.compute = ComputeModule(self, "compute",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            networking=self.networking,
            security=self.security,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Monitoring module - ISSUE: Missing critical alarms for replication lag
        self.monitoring = MonitoringModule(self, "monitoring",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            database=self.database,
            compute=self.compute,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # DNS module
        self.dns = DnsModule(self, "dns",
            primary_provider=self.primary_provider,
            compute=self.compute,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Outputs
        TerraformOutput(self, "primary_vpc_id",
            value=self.networking.primary_vpc.id
        )

        TerraformOutput(self, "secondary_vpc_id",
            value=self.networking.secondary_vpc.id
        )

        TerraformOutput(self, "database_endpoint",
            value=self.database.global_cluster.engine
        )

        TerraformOutput(self, "primary_alb_dns",
            value=self.compute.primary_alb.dns_name
        )
```

## File: stacks/networking.py

```python
from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.ec2_transit_gateway import Ec2TransitGateway
from cdktf_cdktf_provider_aws.ec2_transit_gateway_vpc_attachment import Ec2TransitGatewayVpcAttachment
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from constructs import Construct

class NetworkingModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # ISSUE: VPC names missing environmentSuffix
        # Primary VPC (us-east-1)
        self.primary_vpc = Vpc(self, "primary-vpc",
            provider=primary_provider,
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{migration_phase}",  # Missing environmentSuffix
                "MigrationPhase": migration_phase
            }
        )

        # Secondary VPC (us-east-2)
        self.secondary_vpc = Vpc(self, "secondary-vpc",
            provider=secondary_provider,
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{migration_phase}",  # Missing environmentSuffix
                "MigrationPhase": migration_phase
            }
        )

        # Primary subnets (3 AZs)
        self.primary_subnets = []
        azs_primary = ["us-east-1a", "us-east-1b", "us-east-1c"]
        for i, az in enumerate(azs_primary):
            subnet = Subnet(self, f"primary-subnet-{i}",
                provider=primary_provider,
                vpc_id=self.primary_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-subnet-primary-{i}-{environment_suffix}",
                    "MigrationPhase": migration_phase
                }
            )
            self.primary_subnets.append(subnet)

        # Secondary subnets (3 AZs)
        self.secondary_subnets = []
        azs_secondary = ["us-east-2a", "us-east-2b", "us-east-2c"]
        for i, az in enumerate(azs_secondary):
            subnet = Subnet(self, f"secondary-subnet-{i}",
                provider=secondary_provider,
                vpc_id=self.secondary_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-subnet-secondary-{i}-{environment_suffix}",
                    "MigrationPhase": migration_phase
                }
            )
            self.secondary_subnets.append(subnet)

        # Internet Gateways
        self.primary_igw = InternetGateway(self, "primary-igw",
            provider=primary_provider,
            vpc_id=self.primary_vpc.id,
            tags={
                "Name": f"payment-igw-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_igw = InternetGateway(self, "secondary-igw",
            provider=secondary_provider,
            vpc_id=self.secondary_vpc.id,
            tags={
                "Name": f"payment-igw-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Transit Gateway for inter-region connectivity
        self.transit_gateway = Ec2TransitGateway(self, "transit-gateway",
            provider=primary_provider,
            description="Transit Gateway for multi-region payment processing",
            amazon_side_asn=64512,
            default_route_table_association="enable",
            default_route_table_propagation="enable",
            tags={
                "Name": f"payment-tgw-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Transit Gateway VPC attachments
        self.primary_tgw_attachment = Ec2TransitGatewayVpcAttachment(self, "primary-tgw-attachment",
            provider=primary_provider,
            subnet_ids=[s.id for s in self.primary_subnets],
            transit_gateway_id=self.transit_gateway.id,
            vpc_id=self.primary_vpc.id,
            tags={
                "Name": f"payment-tgw-attach-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Security Groups
        self.primary_alb_sg = SecurityGroup(self, "primary-alb-sg",
            provider=primary_provider,
            name=f"payment-alb-sg-primary-{environment_suffix}",
            description="Security group for primary ALB",
            vpc_id=self.primary_vpc.id,
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
                    description="Allow HTTP from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-alb-sg-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.primary_ecs_sg = SecurityGroup(self, "primary-ecs-sg",
            provider=primary_provider,
            name=f"payment-ecs-sg-primary-{environment_suffix}",
            description="Security group for primary ECS tasks",
            vpc_id=self.primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.primary_alb_sg.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-ecs-sg-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ISSUE: Missing security group for RDS
        # Database security group should be created here
```

## File: stacks/database.py

```python
from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from constructs import Construct

class DatabaseModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 networking, security, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # DB Subnet Groups
        self.primary_db_subnet_group = DbSubnetGroup(self, "primary-db-subnet-group",
            provider=primary_provider,
            name=f"payment-db-subnet-primary-{environment_suffix}",
            subnet_ids=[s.id for s in networking.primary_subnets],
            tags={
                "Name": f"payment-db-subnet-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_db_subnet_group = DbSubnetGroup(self, "secondary-db-subnet-group",
            provider=secondary_provider,
            name=f"payment-db-subnet-secondary-{environment_suffix}",
            subnet_ids=[s.id for s in networking.secondary_subnets],
            tags={
                "Name": f"payment-db-subnet-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Global Database Cluster
        self.global_cluster = RdsGlobalCluster(self, "global-cluster",
            provider=primary_provider,
            global_cluster_identifier=f"payment-global-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name="payments",
            # ISSUE: Missing storage encryption configuration
            # storage_encrypted should be True
            # kms_key_id should reference security.primary_kms_key.arn
        )

        # Primary Regional Cluster
        self.primary_cluster = RdsCluster(self, "primary-cluster",
            provider=primary_provider,
            cluster_identifier=f"payment-cluster-primary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name="payments",
            master_username="admin",
            master_password="ChangeMe12345!",  # ISSUE: Hardcoded password
            db_subnet_group_name=self.primary_db_subnet_group.name,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            # ISSUE: Missing encryption configuration
            # storage_encrypted=True,
            # kms_key_id=security.primary_kms_key.arn,
            global_cluster_identifier=self.global_cluster.id,
            tags={
                "Name": f"payment-cluster-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Primary Cluster Instances
        self.primary_instances = []
        for i in range(2):
            instance = RdsClusterInstance(self, f"primary-instance-{i}",
                provider=primary_provider,
                identifier=f"payment-db-primary-{i}-{environment_suffix}",
                cluster_identifier=self.primary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                engine_version="14.6",
                publicly_accessible=False,
                tags={
                    "Name": f"payment-db-primary-{i}-{environment_suffix}",
                    "MigrationPhase": migration_phase
                }
            )
            self.primary_instances.append(instance)

        # Secondary Regional Cluster
        self.secondary_cluster = RdsCluster(self, "secondary-cluster",
            provider=secondary_provider,
            cluster_identifier=f"payment-cluster-secondary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            db_subnet_group_name=self.secondary_db_subnet_group.name,
            # ISSUE: Missing encryption configuration
            global_cluster_identifier=self.global_cluster.id,
            depends_on=[self.primary_cluster],
            tags={
                "Name": f"payment-cluster-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Secondary Cluster Instances
        self.secondary_instances = []
        for i in range(2):
            instance = RdsClusterInstance(self, f"secondary-instance-{i}",
                provider=secondary_provider,
                identifier=f"payment-db-secondary-{i}-{environment_suffix}",
                cluster_identifier=self.secondary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                engine_version="14.6",
                publicly_accessible=False,
                tags={
                    "Name": f"payment-db-secondary-{i}-{environment_suffix}",
                    "MigrationPhase": migration_phase
                }
            )
            self.secondary_instances.append(instance)
```

## File: stacks/compute.py

```python
from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceLoadBalancer, EcsServiceNetworkConfiguration
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from constructs import Construct

class ComputeModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 networking, security, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # Primary ECS Cluster
        self.primary_cluster = EcsCluster(self, "primary-ecs-cluster",
            provider=primary_provider,
            name=f"payment-ecs-cluster-primary-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={
                "Name": f"payment-ecs-cluster-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Primary ALB
        self.primary_alb = Lb(self, "primary-alb",
            provider=primary_provider,
            name=f"payment-alb-primary-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[networking.primary_alb_sg.id],
            subnets=[s.id for s in networking.primary_subnets],
            enable_deletion_protection=False,
            tags={
                "Name": f"payment-alb-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Primary Target Groups (for blue-green deployment)
        self.primary_tg_blue = LbTargetGroup(self, "primary-tg-blue",
            provider=primary_provider,
            name=f"payment-tg-blue-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=networking.primary_vpc.id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "interval": 30,
                "timeout": 5,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3
            },
            tags={
                "Name": f"payment-tg-blue-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.primary_tg_green = LbTargetGroup(self, "primary-tg-green",
            provider=primary_provider,
            name=f"payment-tg-green-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=networking.primary_vpc.id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "interval": 30,
                "timeout": 5,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3
            },
            tags={
                "Name": f"payment-tg-green-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ALB Listener
        self.primary_listener = LbListener(self, "primary-listener",
            provider=primary_provider,
            load_balancer_arn=self.primary_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=self.primary_tg_blue.arn
            )],
            tags={
                "Name": f"payment-listener-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ECS Task Definition
        self.task_definition = EcsTaskDefinition(self, "task-definition",
            provider=primary_provider,
            family=f"payment-task-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=security.ecs_execution_role.arn,
            task_role_arn=security.ecs_task_role.arn,
            container_definitions='''[
                {
                    "name": "payment-api",
                    "image": "nginx:latest",
                    "cpu": 256,
                    "memory": 512,
                    "essential": true,
                    "portMappings": [
                        {
                            "containerPort": 8080,
                            "protocol": "tcp"
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": "/ecs/payment-api",
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "ecs"
                        }
                    }
                }
            ]''',
            tags={
                "Name": f"payment-task-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ECS Service
        self.primary_service = EcsService(self, "primary-service",
            provider=primary_provider,
            name=f"payment-service-primary-{environment_suffix}",
            cluster=self.primary_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            deployment_controller={"type": "ECS"},  # ISSUE: Should use CODE_DEPLOY for blue-green
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[s.id for s in networking.primary_subnets],
                security_groups=[networking.primary_ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=self.primary_tg_blue.arn,
                container_name="payment-api",
                container_port=8080
            )],
            tags={
                "Name": f"payment-service-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ISSUE: Missing secondary region ECS resources
        # Secondary region should have similar ECS cluster, ALB, target groups, and service
```

## File: stacks/storage.py

```python
from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from constructs import Construct

class StorageModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 security, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # Transaction logs bucket - Primary
        self.transaction_logs_primary = S3Bucket(self, "transaction-logs-primary",
            provider=primary_provider,
            bucket=f"payment-transaction-logs-primary-{environment_suffix}",
            tags={
                "Name": f"payment-transaction-logs-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Enable versioning
        S3BucketVersioning(self, "transaction-logs-primary-versioning",
            provider=primary_provider,
            bucket=self.transaction_logs_primary.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Encryption configuration
        S3BucketServerSideEncryptionConfiguration(self, "transaction-logs-primary-encryption",
            provider=primary_provider,
            bucket=self.transaction_logs_primary.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=security.primary_kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )

        # Lifecycle configuration
        S3BucketLifecycleConfiguration(self, "transaction-logs-primary-lifecycle",
            provider=primary_provider,
            bucket=self.transaction_logs_primary.id,
            rule=[S3BucketLifecycleConfigurationRule(
                id="archive-old-logs",
                status="Enabled",
                transition=[S3BucketLifecycleConfigurationRuleTransition(
                    days=90,
                    storage_class="GLACIER"
                )]
            )]
        )

        # ISSUE: Missing cross-region replication configuration
        # Should have S3BucketReplicationConfiguration pointing to secondary bucket

        # Transaction logs bucket - Secondary
        self.transaction_logs_secondary = S3Bucket(self, "transaction-logs-secondary",
            provider=secondary_provider,
            bucket=f"payment-transaction-logs-secondary-{environment_suffix}",
            tags={
                "Name": f"payment-transaction-logs-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Enable versioning on secondary
        S3BucketVersioning(self, "transaction-logs-secondary-versioning",
            provider=secondary_provider,
            bucket=self.transaction_logs_secondary.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Encryption configuration for secondary
        S3BucketServerSideEncryptionConfiguration(self, "transaction-logs-secondary-encryption",
            provider=secondary_provider,
            bucket=self.transaction_logs_secondary.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=security.secondary_kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )

        # Audit trails bucket - Primary
        self.audit_trails_primary = S3Bucket(self, "audit-trails-primary",
            provider=primary_provider,
            bucket=f"payment-audit-trails-primary-{environment_suffix}",
            tags={
                "Name": f"payment-audit-trails-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Enable versioning
        S3BucketVersioning(self, "audit-trails-primary-versioning",
            provider=primary_provider,
            bucket=self.audit_trails_primary.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Encryption configuration
        S3BucketServerSideEncryptionConfiguration(self, "audit-trails-primary-encryption",
            provider=primary_provider,
            bucket=self.audit_trails_primary.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=security.primary_kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )

        # Audit trails bucket - Secondary (no replication config)
        self.audit_trails_secondary = S3Bucket(self, "audit-trails-secondary",
            provider=secondary_provider,
            bucket=f"payment-audit-trails-secondary-{environment_suffix}",
            tags={
                "Name": f"payment-audit-trails-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )
```

## File: stacks/security.py

```python
from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable
from constructs import Construct
import json

class SecurityModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # Primary KMS Key
        self.primary_kms_key = KmsKey(self, "primary-kms-key",
            provider=primary_provider,
            description=f"KMS key for payment processing encryption in primary region",
            enable_key_rotation=True,
            deletion_window_in_days=30,
            tags={
                "Name": f"payment-kms-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ISSUE: KMS alias missing environmentSuffix
        KmsAlias(self, "primary-kms-alias",
            provider=primary_provider,
            name=f"alias/payment-primary",  # Missing environmentSuffix
            target_key_id=self.primary_kms_key.key_id
        )

        # Secondary KMS Key
        self.secondary_kms_key = KmsKey(self, "secondary-kms-key",
            provider=secondary_provider,
            description=f"KMS key for payment processing encryption in secondary region",
            enable_key_rotation=True,
            deletion_window_in_days=30,
            tags={
                "Name": f"payment-kms-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ISSUE: KMS alias missing environmentSuffix
        KmsAlias(self, "secondary-kms-alias",
            provider=secondary_provider,
            name=f"alias/payment-secondary",  # Missing environmentSuffix
            target_key_id=self.secondary_kms_key.key_id
        )

        # ECS Execution Role
        self.ecs_execution_role = IamRole(self, "ecs-execution-role",
            provider=primary_provider,
            name=f"payment-ecs-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-ecs-execution-role-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        IamRolePolicyAttachment(self, "ecs-execution-policy",
            provider=primary_provider,
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # ECS Task Role
        self.ecs_task_role = IamRole(self, "ecs-task-role",
            provider=primary_provider,
            name=f"payment-ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-ecs-task-role-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ISSUE: Missing IAM policy for S3 bucket access
        # ECS tasks need access to S3 buckets for transaction logs

        # ISSUE: Missing IAM policy for KMS access
        # ECS tasks need KMS decrypt permissions

        # DynamoDB table for state locking
        self.state_lock_table = DynamodbTable(self, "state-lock-table",
            provider=primary_provider,
            name=f"terraform-state-lock-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="LockID",
            attribute=[{
                "name": "LockID",
                "type": "S"
            }],
            tags={
                "Name": f"terraform-state-lock-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # S3 Replication Role (needed for cross-region replication)
        self.s3_replication_role = IamRole(self, "s3-replication-role",
            provider=primary_provider,
            name=f"payment-s3-replication-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-s3-replication-role-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ISSUE: Missing IAM policy for S3 replication role
        # Should have policy allowing s3:GetReplicationConfiguration, s3:ListBucket, s3:GetObjectVersionForReplication, s3:ReplicateObject, etc.
```

## File: stacks/monitoring.py

```python
from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from constructs import Construct

class MonitoringModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 database, compute, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # SNS Topic for alerts
        self.alert_topic = SnsTopic(self, "alert-topic",
            provider=primary_provider,
            name=f"payment-alerts-{environment_suffix}",
            tags={
                "Name": f"payment-alerts-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # CloudWatch Log Group for ECS
        self.ecs_log_group = CloudwatchLogGroup(self, "ecs-log-group",
            provider=primary_provider,
            name="/ecs/payment-api",
            retention_in_days=30,
            tags={
                "Name": f"payment-ecs-logs-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ALB 5xx errors alarm
        self.alb_5xx_alarm = CloudwatchMetricAlarm(self, "alb-5xx-alarm",
            provider=primary_provider,
            alarm_name=f"payment-alb-5xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when ALB returns too many 5xx errors",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "LoadBalancer": compute.primary_alb.arn_suffix
            },
            tags={
                "Name": f"payment-alb-5xx-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ECS CPU utilization alarm
        self.ecs_cpu_alarm = CloudwatchMetricAlarm(self, "ecs-cpu-alarm",
            provider=primary_provider,
            alarm_name=f"payment-ecs-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when ECS CPU utilization is high",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "ServiceName": compute.primary_service.name,
                "ClusterName": compute.primary_cluster.name
            },
            tags={
                "Name": f"payment-ecs-cpu-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ISSUE: Missing critical alarm for database replication lag
        # Should have CloudwatchMetricAlarm for AuroraGlobalDBReplicationLag

        # ISSUE: Missing alarm for S3 replication status
        # Should have alarm monitoring S3 replication metrics

        # ISSUE: Missing alarm for ECS memory utilization
        # Should monitor memory usage alongside CPU
```

## File: stacks/dns.py

```python
from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordAlias
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from constructs import Construct

class DnsModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, compute,
                 environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # Route 53 Hosted Zone
        self.hosted_zone = Route53Zone(self, "hosted-zone",
            provider=primary_provider,
            name=f"payments-{environment_suffix}.example.com",
            tags={
                "Name": f"payment-zone-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Health check for primary ALB
        self.primary_health_check = Route53HealthCheck(self, "primary-health-check",
            provider=primary_provider,
            fqdn=compute.primary_alb.dns_name,
            port=80,
            type="HTTP",
            resource_path="/health",
            failure_threshold=3,
            request_interval=30,
            tags={
                "Name": f"payment-health-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Weighted routing record for primary region
        self.primary_record = Route53Record(self, "primary-record",
            provider=primary_provider,
            zone_id=self.hosted_zone.zone_id,
            name=f"api.payments-{environment_suffix}.example.com",
            type="A",
            set_identifier="primary",
            weighted_routing_policy={"weight": 100},  # ISSUE: Should support variable weights for gradual migration
            health_check_id=self.primary_health_check.id,
            alias=Route53RecordAlias(
                name=compute.primary_alb.dns_name,
                zone_id=compute.primary_alb.zone_id,
                evaluate_target_health=True
            )
        )

        # ISSUE: Missing secondary region DNS record
        # Should have weighted record for secondary region ALB

        # ISSUE: Missing health check for secondary region
```

## File: requirements.txt

```
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.3.0
```

## File: Pipfile

```
[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"

[packages]
cdktf = ">=0.19.0"
cdktf-cdktf-provider-aws = ">=19.0.0"
constructs = ">=10.3.0"

[dev-packages]
pytest = "*"
pytest-cov = "*"

[requires]
python_version = "3.9"
```

## File: .gitignore

```
# CDKTF
.gen/
cdktf.out/
imports/
__pycache__/
*.pyc
.terraform/
*.tfstate
*.tfstate.*

# Python
*.egg-info/
dist/
build/
.venv/
venv/
.pytest_cache/

# IDE
.vscode/
.idea/
*.swp
*.swo
```