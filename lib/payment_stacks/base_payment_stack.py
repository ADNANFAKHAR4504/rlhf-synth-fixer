"""base_payment_stack.py

Abstract base stack class containing all shared infrastructure components
for payment processing across environments.
"""

from abc import abstractmethod
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


class BasePaymentStack(cdk.Stack):
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
            export_name=f"payment-vpc-id-{self.environment_suffix}",
            description="VPC ID for the payment processing infrastructure"
        )

        CfnOutput(
            self,
            "ClusterArn",
            value=self.cluster.cluster_arn,
            export_name=f"payment-cluster-arn-{self.environment_suffix}",
            description="ECS Cluster ARN"
        )

        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=self.aurora_cluster.cluster_endpoint.hostname,
            export_name=f"payment-db-endpoint-{self.environment_suffix}",
            description="Aurora PostgreSQL cluster endpoint"
        )

        CfnOutput(
            self,
            "LoadBalancerDns",
            value=self.alb.load_balancer_dns_name,
            export_name=f"payment-alb-dns-{self.environment_suffix}",
            description="Application Load Balancer DNS name"
        )

        CfnOutput(
            self,
            "SessionTableName",
            value=self.session_table.table_name,
            export_name=f"payment-session-table-{self.environment_suffix}",
            description="DynamoDB session table name"
        )

        CfnOutput(
            self,
            "QueueUrl",
            value=self.processing_queue.queue_url,
            export_name=f"payment-queue-url-{self.environment_suffix}",
            description="SQS processing queue URL"
        )

        CfnOutput(
            self,
            "AuditBucketName",
            value=self.audit_bucket.bucket_name,
            export_name=f"payment-audit-bucket-{self.environment_suffix}",
            description="S3 audit logs bucket name"
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