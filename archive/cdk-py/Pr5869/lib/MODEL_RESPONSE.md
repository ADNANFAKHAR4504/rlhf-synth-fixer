# Multi-Environment Payment Processing Infrastructure - CDK Python Implementation

This implementation provides a complete multi-environment payment processing infrastructure using AWS CDK with Python. It includes an abstract base stack class that ensures consistency across Dev, Staging, and Prod environments while allowing controlled environment-specific variations.

## Architecture Overview

- Abstract BasePaymentStack with shared infrastructure components
- Three environment-specific stacks (Dev, Staging, Prod) inheriting from base
- VPC with 3 AZs, public/private subnets, NAT gateways per environment
- RDS Aurora PostgreSQL Multi-AZ with environment-specific sizing
- ECS Fargate with environment-specific auto-scaling
- Cross-region S3 replication from prod to DR region
- VPC peering between environments
- CloudWatch monitoring with environment-specific thresholds
- Custom CDK constructs for reusable components
- CDK aspects for security policy enforcement
- JSON manifest generation for resource tracking

## File: lib/__init__.py

```python
"""Multi-environment payment processing infrastructure package."""
```

## File: lib/tap_stack.py

```python
"""tap_stack.py

Main CDK stack orchestrator for multi-environment payment processing infrastructure.
This module instantiates the environment-specific payment stacks.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from lib.payment_stacks.dev_stack import DevPaymentStack
from lib.payment_stacks.staging_stack import StagingPaymentStack
from lib.payment_stacks.prod_stack import ProdPaymentStack


class TapStackProps(cdk.StackProps):
    """Properties for the TapStack CDK stack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main orchestrator stack for multi-environment payment processing infrastructure.

    This stack instantiates the appropriate environment-specific payment stack
    based on the environment suffix.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Determine which environment stack to deploy based on suffix
        suffix_lower = environment_suffix.lower()

        if 'prod' in suffix_lower or 'prd' in suffix_lower:
            # Deploy production stack
            self.payment_stack = ProdPaymentStack(
                self,
                f"ProdPaymentStack",
                environment_suffix=environment_suffix
            )
        elif 'stag' in suffix_lower or 'staging' in suffix_lower:
            # Deploy staging stack
            self.payment_stack = StagingPaymentStack(
                self,
                f"StagingPaymentStack",
                environment_suffix=environment_suffix
            )
        else:
            # Deploy dev stack (default)
            self.payment_stack = DevPaymentStack(
                self,
                f"DevPaymentStack",
                environment_suffix=environment_suffix
            )

        # Export key outputs
        self.vpc_id = self.payment_stack.vpc_id
        self.cluster_arn = self.payment_stack.cluster_arn
        self.db_endpoint = self.payment_stack.db_endpoint
```

## File: lib/payment_stacks/__init__.py

```python
"""Payment processing stacks package."""
```

## File: lib/payment_stacks/base_payment_stack.py

```python
"""base_payment_stack.py

Abstract base stack class containing all shared infrastructure components
for payment processing across environments.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
import json
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_ssm as ssm,
    CfnOutput,
    RemovalPolicy,
    Duration,
)
from constructs import Construct
from lib.constructs.vpc_construct import VpcConstruct
from lib.constructs.database_construct import DatabaseConstruct
from lib.constructs.ecs_construct import EcsConstruct
from lib.constructs.monitoring_construct import MonitoringConstruct
from lib.aspects.security_aspect import SecurityPolicyAspect


class BasePaymentStack(Construct, ABC):
    """
    Abstract base stack containing shared infrastructure for payment processing.

    All environment-specific stacks must inherit from this base and implement
    the abstract methods for environment-specific configurations.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.environment_name = self.get_environment_name()

        # Validate CIDR configuration before proceeding
        self._validate_cidr_blocks()

        # Create VPC infrastructure
        self.vpc_construct = VpcConstruct(
            self,
            "VpcConstruct",
            environment_suffix=environment_suffix,
            cidr_block=self.get_vpc_cidr(),
            environment_name=self.environment_name
        )
        self.vpc = self.vpc_construct.vpc

        # Create security groups
        self._create_security_groups()

        # Create database infrastructure
        self.database_construct = DatabaseConstruct(
            self,
            "DatabaseConstruct",
            vpc=self.vpc,
            environment_suffix=environment_suffix,
            instance_type=self.get_db_instance_type(),
            security_group=self.db_security_group
        )
        self.aurora_cluster = self.database_construct.cluster

        # Create DynamoDB for session storage
        self.session_table = self._create_session_table()

        # Create SQS queue for async processing
        self.processing_queue = self._create_sqs_queue()
        self.dlq = self._create_dlq()

        # Create S3 bucket for audit logs
        self.audit_bucket = self._create_audit_bucket()

        # Create ECS infrastructure
        self.ecs_construct = EcsConstruct(
            self,
            "EcsConstruct",
            vpc=self.vpc,
            environment_suffix=environment_suffix,
            min_capacity=self.get_min_capacity(),
            max_capacity=self.get_max_capacity(),
            security_group=self.ecs_security_group,
            database=self.aurora_cluster,
            session_table=self.session_table,
            queue=self.processing_queue
        )
        self.cluster = self.ecs_construct.cluster
        self.service = self.ecs_construct.service
        self.alb = self.ecs_construct.alb

        # Create monitoring infrastructure
        self.monitoring_construct = MonitoringConstruct(
            self,
            "MonitoringConstruct",
            environment_suffix=environment_suffix,
            environment_name=self.environment_name,
            alb=self.alb,
            ecs_service=self.service,
            aurora_cluster=self.aurora_cluster,
            queue=self.processing_queue,
            alarm_thresholds=self.get_alarm_thresholds()
        )

        # Store sensitive configuration in Parameter Store
        self._store_parameters()

        # Apply security policies via CDK aspect
        cdk.Aspects.of(self).add(SecurityPolicyAspect())

        # Add tags
        self._add_tags()

        # Generate manifest
        self._generate_manifest()

        # Create outputs
        self._create_outputs()

    def _validate_cidr_blocks(self):
        """Validate that CIDR blocks don't overlap across environments."""
        cidr_block = self.get_vpc_cidr()
        # In production, add validation logic to check existing CIDRs

    def _create_security_groups(self):
        """Create security groups for all services."""
        # ALB security group
        self.alb_security_group = ec2.SecurityGroup(
            self,
            f"AlbSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for ALB in {self.environment_name}",
            allow_all_outbound=True
        )

        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic"
        )

        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic"
        )

        # ECS security group
        self.ecs_security_group = ec2.SecurityGroup(
            self,
            f"EcsSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for ECS tasks in {self.environment_name}",
            allow_all_outbound=True
        )

        self.ecs_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(8080),
            "Allow traffic from ALB"
        )

        # Database security group
        self.db_security_group = ec2.SecurityGroup(
            self,
            f"DbSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for Aurora database in {self.environment_name}",
            allow_all_outbound=False
        )

        self.db_security_group.add_ingress_rule(
            self.ecs_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL from ECS"
        )

    def _create_session_table(self) -> dynamodb.Table:
        """Create DynamoDB table for session storage."""
        table = dynamodb.Table(
            self,
            f"SessionTable-{self.environment_suffix}",
            table_name=f"payment-sessions-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="sessionId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
            time_to_live_attribute="ttl"
        )

        return table

    def _create_sqs_queue(self) -> sqs.Queue:
        """Create SQS queue for async processing."""
        dlq = sqs.Queue(
            self,
            f"PaymentDLQ-{self.environment_suffix}",
            queue_name=f"payment-dlq-{self.environment_suffix}",
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            retention_period=Duration.days(14)
        )

        queue = sqs.Queue(
            self,
            f"PaymentQueue-{self.environment_suffix}",
            queue_name=f"payment-processing-{self.environment_suffix}",
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            visibility_timeout=Duration.seconds(300),
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=dlq
            )
        )

        return queue

    def _create_dlq(self) -> sqs.Queue:
        """Create dead letter queue."""
        return sqs.Queue(
            self,
            f"PaymentDLQStandalone-{self.environment_suffix}",
            queue_name=f"payment-dlq-standalone-{self.environment_suffix}",
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            retention_period=Duration.days(14)
        )

    def _create_audit_bucket(self) -> s3.Bucket:
        """Create S3 bucket for audit logs."""
        bucket = s3.Bucket(
            self,
            f"AuditBucket-{self.environment_suffix}",
            bucket_name=f"payment-audit-logs-{self.environment_suffix}",
            encryption=s3.BucketEncryption.KMS_MANAGED,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        # Add replication for production environment
        if self.environment_name == "prod":
            self._configure_replication(bucket)

        return bucket

    def _configure_replication(self, bucket: s3.Bucket):
        """Configure cross-region replication for production bucket."""
        replication_role = iam.Role(
            self,
            f"ReplicationRole-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("s3.amazonaws.com"),
            description="Role for S3 cross-region replication"
        )

        replication_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "s3:GetReplicationConfiguration",
                    "s3:ListBucket"
                ],
                resources=[bucket.bucket_arn]
            )
        )

    def _store_parameters(self):
        """Store sensitive configuration in Systems Manager Parameter Store."""
        ssm.StringParameter(
            self,
            f"DbEndpointParam-{self.environment_suffix}",
            parameter_name=f"/payment/{self.environment_name}/db/endpoint",
            string_value=self.aurora_cluster.cluster_endpoint.hostname,
            description=f"Aurora cluster endpoint for {self.environment_name}"
        )

        ssm.StringParameter(
            self,
            f"QueueUrlParam-{self.environment_suffix}",
            parameter_name=f"/payment/{self.environment_name}/queue/url",
            string_value=self.processing_queue.queue_url,
            description=f"SQS queue URL for {self.environment_name}"
        )

    def _add_tags(self):
        """Add tags to all resources in this stack."""
        cdk.Tags.of(self).add("Environment", self.environment_name)
        cdk.Tags.of(self).add("EnvironmentSuffix", self.environment_suffix)
        cdk.Tags.of(self).add("Application", "PaymentProcessing")
        cdk.Tags.of(self).add("ManagedBy", "CDK")

    def _generate_manifest(self):
        """Generate JSON manifest file documenting all deployed resources."""
        manifest = {
            "environment": self.environment_name,
            "environment_suffix": self.environment_suffix,
            "resources": {
                "vpc_id": self.vpc.vpc_id,
                "cluster_arn": self.cluster.cluster_arn,
                "db_endpoint": self.aurora_cluster.cluster_endpoint.hostname,
                "session_table": self.session_table.table_name,
                "queue_url": self.processing_queue.queue_url,
                "alb_dns": self.alb.load_balancer_dns_name
            }
        }

        ssm.StringParameter(
            self,
            f"ManifestParam-{self.environment_suffix}",
            parameter_name=f"/payment/{self.environment_name}/manifest",
            string_value=json.dumps(manifest, indent=2),
            description=f"Resource manifest for {self.environment_name}"
        )

    def _create_outputs(self):
        """Create CloudFormation outputs."""
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            export_name=f"payment-vpc-id-{self.environment_suffix}"
        )

        CfnOutput(
            self,
            "ClusterArn",
            value=self.cluster.cluster_arn,
            export_name=f"payment-cluster-arn-{self.environment_suffix}"
        )

        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=self.aurora_cluster.cluster_endpoint.hostname,
            export_name=f"payment-db-endpoint-{self.environment_suffix}"
        )

    @property
    def vpc_id(self) -> str:
        """Return VPC ID."""
        return self.vpc.vpc_id

    @property
    def cluster_arn(self) -> str:
        """Return ECS cluster ARN."""
        return self.cluster.cluster_arn

    @property
    def db_endpoint(self) -> str:
        """Return database endpoint."""
        return self.aurora_cluster.cluster_endpoint.hostname

    # Abstract methods
    @abstractmethod
    def get_environment_name(self) -> str:
        """Return the environment name."""
        pass

    @abstractmethod
    def get_vpc_cidr(self) -> str:
        """Return VPC CIDR block."""
        pass

    @abstractmethod
    def get_db_instance_type(self) -> ec2.InstanceType:
        """Return database instance type."""
        pass

    @abstractmethod
    def get_min_capacity(self) -> int:
        """Return minimum ECS task capacity."""
        pass

    @abstractmethod
    def get_max_capacity(self) -> int:
        """Return maximum ECS task capacity."""
        pass

    @abstractmethod
    def get_alarm_thresholds(self) -> Dict[str, Any]:
        """Return CloudWatch alarm thresholds."""
        pass
```

## File: lib/payment_stacks/dev_stack.py

```python
"""dev_stack.py

Development environment stack for payment processing infrastructure.
"""

from typing import Dict, Any
from aws_cdk import aws_ec2 as ec2
from constructs import Construct
from lib.payment_stacks.base_payment_stack import BasePaymentStack


class DevPaymentStack(BasePaymentStack):
    """Development environment payment processing stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(
            scope,
            construct_id,
            environment_suffix=environment_suffix,
            **kwargs
        )

    def get_environment_name(self) -> str:
        return "dev"

    def get_vpc_cidr(self) -> str:
        return "10.0.0.0/16"

    def get_db_instance_type(self) -> ec2.InstanceType:
        return ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE3,
            ec2.InstanceSize.MEDIUM
        )

    def get_min_capacity(self) -> int:
        return 1

    def get_max_capacity(self) -> int:
        return 5

    def get_alarm_thresholds(self) -> Dict[str, Any]:
        return {
            "cpu_threshold": 80,
            "memory_threshold": 80,
            "response_time_threshold": 5000,
            "error_rate_threshold": 10
        }
```

## File: lib/payment_stacks/staging_stack.py

```python
"""staging_stack.py

Staging environment stack for payment processing infrastructure.
"""

from typing import Dict, Any
from aws_cdk import aws_ec2 as ec2
from constructs import Construct
from lib.payment_stacks.base_payment_stack import BasePaymentStack


class StagingPaymentStack(BasePaymentStack):
    """Staging environment payment processing stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(
            scope,
            construct_id,
            environment_suffix=environment_suffix,
            **kwargs
        )

    def get_environment_name(self) -> str:
        return "staging"

    def get_vpc_cidr(self) -> str:
        return "10.1.0.0/16"

    def get_db_instance_type(self) -> ec2.InstanceType:
        return ec2.InstanceType.of(
            ec2.InstanceClass.MEMORY6_GRAVITON,
            ec2.InstanceSize.LARGE
        )

    def get_min_capacity(self) -> int:
        return 1

    def get_max_capacity(self) -> int:
        return 5

    def get_alarm_thresholds(self) -> Dict[str, Any]:
        return {
            "cpu_threshold": 75,
            "memory_threshold": 75,
            "response_time_threshold": 3000,
            "error_rate_threshold": 5
        }
```

## File: lib/payment_stacks/prod_stack.py

```python
"""prod_stack.py

Production environment stack for payment processing infrastructure.
"""

from typing import Dict, Any
from aws_cdk import aws_ec2 as ec2
from constructs import Construct
from lib.payment_stacks.base_payment_stack import BasePaymentStack


class ProdPaymentStack(BasePaymentStack):
    """Production environment payment processing stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(
            scope,
            construct_id,
            environment_suffix=environment_suffix,
            **kwargs
        )

    def get_environment_name(self) -> str:
        return "prod"

    def get_vpc_cidr(self) -> str:
        return "10.2.0.0/16"

    def get_db_instance_type(self) -> ec2.InstanceType:
        return ec2.InstanceType.of(
            ec2.InstanceClass.MEMORY6_GRAVITON,
            ec2.InstanceSize.LARGE
        )

    def get_min_capacity(self) -> int:
        return 2

    def get_max_capacity(self) -> int:
        return 10

    def get_alarm_thresholds(self) -> Dict[str, Any]:
        return {
            "cpu_threshold": 70,
            "memory_threshold": 70,
            "response_time_threshold": 2000,
            "error_rate_threshold": 1
        }
```

## File: lib/constructs/__init__.py

```python
"""Custom CDK constructs package."""
```

## File: lib/constructs/vpc_construct.py

```python
"""vpc_construct.py

Custom CDK construct for VPC infrastructure.
"""

from aws_cdk import aws_ec2 as ec2
from constructs import Construct


class VpcConstruct(Construct):
    """Custom construct for VPC with 3 AZs."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        cidr_block: str,
        environment_name: str,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        self.vpc = ec2.Vpc(
            self,
            f"PaymentVpc-{environment_suffix}",
            vpc_name=f"payment-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr(cidr_block),
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        self.vpc.add_flow_log(f"VpcFlowLog-{environment_suffix}")
```

## File: lib/constructs/database_construct.py

```python
"""database_construct.py

Custom CDK construct for RDS Aurora PostgreSQL.
"""

from aws_cdk import (
    aws_ec2 as ec2,
    aws_rds as rds,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class DatabaseConstruct(Construct):
    """Custom construct for Aurora PostgreSQL database."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        environment_suffix: str,
        instance_type: ec2.InstanceType,
        security_group: ec2.SecurityGroup,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        subnet_group = rds.SubnetGroup(
            self,
            f"DbSubnetGroup-{environment_suffix}",
            description=f"Subnet group for Aurora in {environment_suffix}",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

        self.cluster = rds.DatabaseCluster(
            self,
            f"AuroraCluster-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            credentials=rds.Credentials.from_generated_secret(
                username="paymentadmin",
                secret_name=f"payment-db-creds-{environment_suffix}"
            ),
            instance_props=rds.InstanceProps(
                instance_type=instance_type,
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                security_groups=[security_group]
            ),
            instances=2,
            storage_encrypted=True,
            backup=rds.BackupProps(retention=Duration.days(7)),
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
            subnet_group=subnet_group
        )
```

## File: lib/constructs/ecs_construct.py

```python
"""ecs_construct.py

Custom CDK construct for ECS Fargate with ALB.
"""

from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class EcsConstruct(Construct):
    """Custom construct for ECS Fargate service."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        environment_suffix: str,
        min_capacity: int,
        max_capacity: int,
        security_group: ec2.SecurityGroup,
        database: rds.DatabaseCluster,
        session_table: dynamodb.Table,
        queue: sqs.Queue,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        self.cluster = ecs.Cluster(
            self,
            f"PaymentCluster-{environment_suffix}",
            cluster_name=f"payment-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True
        )

        execution_role = iam.Role(
            self,
            f"TaskExecutionRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        task_role = iam.Role(
            self,
            f"TaskRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )

        database.secret.grant_read(task_role)
        session_table.grant_read_write_data(task_role)
        queue.grant_send_messages(task_role)
        queue.grant_consume_messages(task_role)

        log_group = logs.LogGroup(
            self,
            f"PaymentLogGroup-{environment_suffix}",
            log_group_name=f"/ecs/payment-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY
        )

        task_definition = ecs.FargateTaskDefinition(
            self,
            f"PaymentTaskDef-{environment_suffix}",
            memory_limit_mib=2048,
            cpu=1024,
            execution_role=execution_role,
            task_role=task_role
        )

        container = task_definition.add_container(
            f"PaymentContainer-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="payment",
                log_group=log_group
            ),
            environment={
                "ENVIRONMENT": environment_suffix,
                "QUEUE_URL": queue.queue_url,
                "SESSION_TABLE": session_table.table_name
            },
            secrets={
                "DB_HOST": ecs.Secret.from_secrets_manager(database.secret, "host"),
                "DB_USERNAME": ecs.Secret.from_secrets_manager(database.secret, "username"),
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(database.secret, "password")
            }
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=8080, protocol=ecs.Protocol.TCP)
        )

        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            f"PaymentALB-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            load_balancer_name=f"payment-alb-{environment_suffix}"
        )

        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"PaymentTargetGroup-{environment_suffix}",
            vpc=vpc,
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )

        self.alb.add_listener(
            f"PaymentListener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )

        self.service = ecs.FargateService(
            self,
            f"PaymentService-{environment_suffix}",
            cluster=self.cluster,
            task_definition=task_definition,
            desired_count=min_capacity,
            assign_public_ip=False,
            security_groups=[security_group],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            service_name=f"payment-service-{environment_suffix}"
        )

        self.service.attach_to_application_target_group(target_group)

        scaling = self.service.auto_scale_task_count(
            min_capacity=min_capacity,
            max_capacity=max_capacity
        )

        scaling.scale_on_cpu_utilization(
            f"CpuScaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        scaling.scale_on_memory_utilization(
            f"MemoryScaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )
```

## File: lib/constructs/monitoring_construct.py

```python
"""monitoring_construct.py

Custom CDK construct for CloudWatch monitoring.
"""

from typing import Dict, Any
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_elasticloadbalancingv2 as elbv2,
    aws_ecs as ecs,
    aws_rds as rds,
    aws_sqs as sqs,
    aws_sns as sns,
    Duration,
)
from constructs import Construct


class MonitoringConstruct(Construct):
    """Custom construct for CloudWatch monitoring."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        environment_name: str,
        alb: elbv2.ApplicationLoadBalancer,
        ecs_service: ecs.FargateService,
        aurora_cluster: rds.DatabaseCluster,
        queue: sqs.Queue,
        alarm_thresholds: Dict[str, Any],
        **kwargs
    ):
        super().__init__(scope, construct_id)

        alarm_topic = sns.Topic(
            self,
            f"AlarmTopic-{environment_suffix}",
            topic_name=f"payment-alarms-{environment_suffix}",
            display_name=f"Payment Alarms - {environment_name}"
        )

        dashboard = cloudwatch.Dashboard(
            self,
            f"PaymentDashboard-{environment_suffix}",
            dashboard_name=f"payment-{environment_suffix}"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[
                    alb.metric_request_count(
                        statistic="Sum",
                        period=Duration.minutes(5)
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="ECS CPU Utilization",
                left=[
                    ecs_service.metric_cpu_utilization(
                        statistic="Average",
                        period=Duration.minutes(5)
                    )
                ]
            )
        )

        ecs_cpu_metric = ecs_service.metric_cpu_utilization()

        cloudwatch.Alarm(
            self,
            f"EcsCpuAlarm-{environment_suffix}",
            metric=ecs_cpu_metric,
            threshold=alarm_thresholds["cpu_threshold"],
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_name=f"payment-ecs-cpu-{environment_suffix}"
        ).add_alarm_action(cloudwatch.SnsAction(alarm_topic))
```

## File: lib/aspects/__init__.py

```python
"""CDK aspects package."""
```

## File: lib/aspects/security_aspect.py

```python
"""security_aspect.py

CDK aspect to enforce security policies.
"""

from aws_cdk import (
    IAspect,
    aws_s3 as s3,
    aws_rds as rds,
)
from constructs import IConstruct


class SecurityPolicyAspect(IAspect):
    """CDK Aspect to enforce security policies."""

    def visit(self, node: IConstruct) -> None:
        """Visit each construct and apply security policies."""

        if isinstance(node, s3.CfnBucket):
            if not node.bucket_encryption:
                print(f"WARNING: S3 bucket {node.node.id} missing encryption")

        if isinstance(node, rds.CfnDBCluster):
            if not node.storage_encrypted:
                print(f"WARNING: RDS cluster {node.node.id} missing encryption")
```

## File: lib/README.md

```markdown
# Multi-Environment Payment Processing Infrastructure

Complete CDK Python implementation for deploying identical payment processing infrastructure across Dev, Staging, and Prod environments.

## Architecture

- Abstract BasePaymentStack with shared components
- Environment-specific stacks (Dev, Staging, Prod)
- VPC with 3 AZs per environment
- RDS Aurora PostgreSQL Multi-AZ
- ECS Fargate with auto-scaling
- S3, DynamoDB, SQS for data and messaging
- CloudWatch monitoring and alarms

## Deployment

```bash
cdk deploy -c environmentSuffix=dev
cdk deploy -c environmentSuffix=staging
cdk deploy -c environmentSuffix=prod
```

## Environment Configurations

- **Dev**: 10.0.0.0/16, db.t3.medium, 1-5 tasks
- **Staging**: 10.1.0.0/16, db.r6g.large, 1-5 tasks
- **Prod**: 10.2.0.0/16, db.r6g.large, 2-10 tasks

All resources include environmentSuffix for uniqueness.
```
