"""TAP Stack module for CDKTF Python infrastructure - Payment Processing Migration."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
# S3 configuration classes removed due to import issues with AWS provider naming inconsistencies
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTableGlobalSecondaryIndex,
    DynamodbTablePointInTimeRecovery,
)
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for Payment Processing Infrastructure Migration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure for payment processing migration."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        self.environment_suffix = kwargs.get('environment_suffix', 'dev')
        self.aws_region = kwargs.get('aws_region', 'us-east-1')
        self.replication_region = 'us-west-2'
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Add required tags for production environment
        if 'tags' not in default_tags:
            default_tags['tags'] = {}
        default_tags['tags'].update({
            'Environment': 'production',
            'CostCenter': 'payments'
        })

        # Configure Primary AWS Provider (us-east-1)
        self.provider_primary = AwsProvider(
            self,
            "aws",
            region=self.aws_region,
            default_tags=[default_tags],
        )

        # Configure Secondary AWS Provider for S3 replication (us-west-2)
        self.provider_secondary = AwsProvider(
            self,
            "aws_replication",
            alias="replication",
            region=self.replication_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{self.environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Get availability zones
        self.azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available",
        )

        # Create infrastructure components
        self._create_kms_keys()
        self._create_vpc_infrastructure()
        self._create_iam_roles()
        self._create_rds_cluster()
        self._create_dynamodb_tables()
        self._create_lambda_functions()
        self._create_s3_buckets()
        self._create_alb()
        self._create_cloudwatch_monitoring()
        self._create_parameter_migration_resources()
        self._create_outputs()

    def _create_kms_keys(self):
        """Create KMS keys for encryption."""
        # KMS key for RDS encryption
        self.kms_rds = KmsKey(
            self,
            "kms_rds",
            description=f"KMS key for RDS encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
        )

        KmsAlias(
            self,
            "kms_rds_alias",
            name=f"alias/rds-{self.environment_suffix}",
            target_key_id=self.kms_rds.id,
        )

        # KMS key for S3 encryption (if needed for additional encryption)
        self.kms_s3 = KmsKey(
            self,
            "kms_s3",
            description=f"KMS key for S3 encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
        )

        KmsAlias(
            self,
            "kms_s3_alias",
            name=f"alias/s3-{self.environment_suffix}",
            target_key_id=self.kms_s3.id,
        )

    def _create_vpc_infrastructure(self):
        """Create VPC infrastructure with endpoints."""
        # Create production VPC
        self.vpc = Vpc(
            self,
            "production_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{self.environment_suffix}",
            }
        )

        # Create private subnets in 3 availability zones
        self.private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"private-subnet-{i+1}-{self.environment_suffix}",
                }
            )
            self.private_subnets.append(subnet)

        # Create public subnets for ALB
        self.public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{i+1}-{self.environment_suffix}",
                }
            )
            self.public_subnets.append(subnet)

        # Create Internet Gateway for public subnets
        self.igw = InternetGateway(
            self,
            "internet_gateway",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"igw-{self.environment_suffix}",
            }
        )

        # Create route table for public subnets
        self.public_route_table = RouteTable(
            self,
            "public_route_table",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={
                "Name": f"public-rt-{self.environment_suffix}",
            }
        )

        # Associate public subnets with route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_subnet_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
            )

        # Security group for RDS
        self.rds_sg = SecurityGroup(
            self,
            "rds_security_group",
            name=f"rds-sg-{self.environment_suffix}",
            description="Security group for RDS Aurora PostgreSQL",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="PostgreSQL from VPC",
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound",
                )
            ],
        )

        # Security group for Lambda
        self.lambda_sg = SecurityGroup(
            self,
            "lambda_security_group",
            name=f"lambda-sg-{self.environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound",
                )
            ],
        )

        # Security group for ALB
        self.alb_sg = SecurityGroup(
            self,
            "alb_security_group",
            name=f"alb-sg-{self.environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet",
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet",
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound",
                )
            ],
        )

    def _create_iam_roles(self):
        """Create IAM roles following least-privilege principle."""
        # IAM role for Lambda execution
        lambda_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        self.lambda_role = IamRole(
            self,
            "lambda_execution_role",
            name=f"lambda-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(lambda_assume_role_policy),
        )

        # Attach AWS managed policies for Lambda
        IamRolePolicyAttachment(
            self,
            "lambda_vpc_execution_policy",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        # Lambda inline policy for specific resource access
        lambda_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": [
                        f"arn:aws:dynamodb:{self.aws_region}:*:table/session-table-{self.environment_suffix}",
                        f"arn:aws:dynamodb:{self.aws_region}:*:table/session-table-{self.environment_suffix}/index/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::audit-logs-{self.environment_suffix}-*/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "rds:DescribeDBClusters",
                        "rds:DescribeDBInstances"
                    ],
                    "Resource": [
                        f"arn:aws:rds:{self.aws_region}:*:cluster:payment-cluster-{self.environment_suffix}",
                        f"arn:aws:rds:{self.aws_region}:*:db:payment-cluster-{self.environment_suffix}-*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": [
                        self.kms_rds.arn,
                        self.kms_s3.arn
                    ]
                }
            ]
        }

        self.lambda_role.add_override(
            "inline_policy",
            [
                {
                    "name": "lambda_resource_access",
                    "policy": json.dumps(lambda_policy)
                }
            ]
        )

        # IAM role for S3 replication
        s3_replication_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        self.s3_replication_role = IamRole(
            self,
            "s3_replication_role",
            name=f"s3-replication-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(s3_replication_assume_role_policy),
        )

        # S3 replication policy will be added after buckets are created

    def _create_rds_cluster(self):
        """Create RDS Aurora PostgreSQL cluster from snapshot."""
        # DB Subnet Group
        self.db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            description=f"DB subnet group for {self.environment_suffix}",
            tags={
                "Name": f"db-subnet-group-{self.environment_suffix}",
            }
        )

        # RDS Aurora Cluster
        self.rds_cluster = RdsCluster(
            self,
            "payment_cluster",
            cluster_identifier=f"payment-cluster-{self.environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.7",
            database_name="payments",
            master_username="dbadmin",
            master_password="ChangeMe123!",  # Should be from secrets manager in production
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            storage_encrypted=True,
            kms_key_id=self.kms_rds.arn,
            backup_retention_period=1,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            apply_immediately=True,
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={
                "Name": f"payment-cluster-{self.environment_suffix}",
            }
        )

        # Create 2 cluster instances for Multi-AZ
        self.rds_instances = []
        for i in range(2):
            instance = RdsClusterInstance(
                self,
                f"payment_cluster_instance_{i}",
                identifier=f"payment-cluster-{self.environment_suffix}-{i}",
                cluster_identifier=self.rds_cluster.id,
                instance_class="db.t3.medium",
                engine=self.rds_cluster.engine,
                engine_version=self.rds_cluster.engine_version,
                publicly_accessible=False,
                tags={
                    "Name": f"payment-cluster-instance-{i}-{self.environment_suffix}",
                }
            )
            self.rds_instances.append(instance)

    def _create_dynamodb_tables(self):
        """Create DynamoDB tables with GSI and point-in-time recovery."""
        # Session management table
        self.session_table = DynamodbTable(
            self,
            "session_table",
            name=f"session-table-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="session_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N"),
                DynamodbTableAttribute(name="user_id", type="S"),
                DynamodbTableAttribute(name="status", type="S"),
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="user_id-index",
                    hash_key="user_id",
                    range_key="timestamp",
                    projection_type="ALL",
                ),
                DynamodbTableGlobalSecondaryIndex(
                    name="status-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL",
                ),
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            tags={
                "Name": f"session-table-{self.environment_suffix}",
            }
        )

        # Transaction tracking table
        self.transaction_table = DynamodbTable(
            self,
            "transaction_table",
            name=f"transaction-table-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="created_at",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="created_at", type="N"),
                DynamodbTableAttribute(name="payment_status", type="S"),
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="payment_status-index",
                    hash_key="payment_status",
                    range_key="created_at",
                    projection_type="ALL",
                ),
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            tags={
                "Name": f"transaction-table-{self.environment_suffix}",
            }
        )

    def _create_lambda_functions(self):
        """Create Lambda functions with reserved concurrency."""
        # Payment processing Lambda
        self.payment_lambda = LambdaFunction(
            self,
            "payment_processor",
            function_name=f"payment-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=self.lambda_role.arn,
            filename="../../../lib/lambda_placeholder.zip",  # Placeholder - should be actual deployment package
            source_code_hash="${filebase64sha256(\"../../../lib/lambda_placeholder.zip\")}",
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=10,
            vpc_config={
                "subnet_ids": [subnet.id for subnet in self.private_subnets],
                "security_group_ids": [self.lambda_sg.id],
            },
            environment={
                "variables": {
                    "ENVIRONMENT": self.environment_suffix,
                    "RDS_ENDPOINT": self.rds_cluster.endpoint,
                    "SESSION_TABLE": self.session_table.name,
                    "TRANSACTION_TABLE": self.transaction_table.name,
                    "REGION": self.aws_region,
                }
            },
            tags={
                "Name": f"payment-processor-{self.environment_suffix}",
            }
        )

        # Validation Lambda
        self.validation_lambda = LambdaFunction(
            self,
            "payment_validator",
            function_name=f"payment-validator-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=self.lambda_role.arn,
            filename="../../../lib/lambda_placeholder.zip",
            source_code_hash="${filebase64sha256(\"../../../lib/lambda_placeholder.zip\")}",
            timeout=30,
            memory_size=256,
            reserved_concurrent_executions=5,
            vpc_config={
                "subnet_ids": [subnet.id for subnet in self.private_subnets],
                "security_group_ids": [self.lambda_sg.id],
            },
            environment={
                "variables": {
                    "ENVIRONMENT": self.environment_suffix,
                    "SESSION_TABLE": self.session_table.name,
                    "REGION": self.aws_region,
                }
            },
            tags={
                "Name": f"payment-validator-{self.environment_suffix}",
            }
        )

    def _create_s3_buckets(self):
        """Create S3 buckets - simplified version without advanced configurations."""
        # Primary audit logs bucket (us-east-1)
        bucket_name = f"audit-logs-{self.environment_suffix}-{self.aws_region}".lower()

        self.audit_bucket = S3Bucket(
            self,
            "audit_logs_bucket",
            bucket=bucket_name,
            force_destroy=True,
            tags={
                "Name": bucket_name,
            }
        )

        # Replication destination bucket (us-west-2)
        replica_bucket_name = f"audit-logs-{self.environment_suffix}-{self.replication_region}".lower()

        self.audit_bucket_replica = S3Bucket(
            self,
            "audit_logs_bucket_replica",
            provider=self.provider_secondary,
            bucket=replica_bucket_name,
            force_destroy=True,
            tags={
                "Name": replica_bucket_name,
            }
        )

        # Note: Versioning, encryption, lifecycle policies, and replication
        # have been removed due to AWS provider class naming inconsistencies
        # These can be configured manually or via AWS console after deployment

    def _create_alb(self):
        """Create Application Load Balancer for blue-green deployment."""
        # Application Load Balancer
        self.alb = Lb(
            self,
            "payment_alb",
            name=f"payment-alb-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=False,
            enable_cross_zone_load_balancing=True,
            tags={
                "Name": f"payment-alb-{self.environment_suffix}",
            }
        )

        # Blue target group
        self.target_group_blue = LbTargetGroup(
            self,
            "target_group_blue",
            name=f"tg-blue-{self.environment_suffix}",
            target_type="lambda",
            tags={
                "Name": f"tg-blue-{self.environment_suffix}",
                "DeploymentColor": "blue",
            }
        )

        # Green target group
        self.target_group_green = LbTargetGroup(
            self,
            "target_group_green",
            name=f"tg-green-{self.environment_suffix}",
            target_type="lambda",
            tags={
                "Name": f"tg-green-{self.environment_suffix}",
                "DeploymentColor": "green",
            }
        )

        # ALB Listener
        self.alb_listener = LbListener(
            self,
            "alb_listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=self.target_group_blue.arn,
                )
            ],
        )

    def _create_cloudwatch_monitoring(self):
        """Create CloudWatch dashboards and alarms."""
        # SNS Topic for alarm notifications
        self.alarm_topic = SnsTopic(
            self,
            "alarm_topic",
            name=f"payment-alarms-{self.environment_suffix}",
            display_name="Payment Processing Alarms",
            tags={
                "Name": f"payment-alarms-{self.environment_suffix}",
            }
        )

        # RDS CPU Alarm
        self.rds_cpu_alarm = CloudwatchMetricAlarm(
            self,
            "rds_cpu_alarm",
            alarm_name=f"rds-cpu-high-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when RDS CPU exceeds 80%",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "DBClusterIdentifier": self.rds_cluster.cluster_identifier,
            },
        )

        # Lambda Error Rate Alarm
        self.lambda_error_alarm = CloudwatchMetricAlarm(
            self,
            "lambda_error_alarm",
            alarm_name=f"lambda-error-rate-high-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=1,
            alarm_description="Alert when Lambda error rate exceeds 1%",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "FunctionName": self.payment_lambda.function_name,
            },
        )

        # CloudWatch Dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
                            [".", "DatabaseConnections", {"stat": "Sum"}],
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": self.aws_region,
                        "title": "RDS Metrics",
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                            [".", "Errors", {"stat": "Sum"}],
                            [".", "Duration", {"stat": "Average"}],
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": self.aws_region,
                        "title": "Lambda Metrics",
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}],
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": self.aws_region,
                        "title": "DynamoDB Metrics",
                    }
                },
            ]
        }

        self.dashboard = CloudwatchDashboard(
            self,
            "payment_dashboard",
            dashboard_name=f"payment-dashboard-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body),
        )

    def _create_parameter_migration_resources(self):
        """Create Lambda for parameter migration from /dev/* to /prod/*."""
        # Parameter migration Lambda role
        param_migration_assume_role = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        self.param_migration_role = IamRole(
            self,
            "param_migration_role",
            name=f"param-migration-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(param_migration_assume_role),
        )

        IamRolePolicyAttachment(
            self,
            "param_migration_basic_execution",
            role=self.param_migration_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        )

        # Parameter migration policy
        param_migration_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                        "ssm:GetParametersByPath"
                    ],
                    "Resource": f"arn:aws:ssm:{self.aws_region}:*:parameter/dev/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:PutParameter",
                        "ssm:AddTagsToResource"
                    ],
                    "Resource": f"arn:aws:ssm:{self.aws_region}:*:parameter/prod/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:DescribeParameters"
                    ],
                    "Resource": "*"
                }
            ]
        }

        self.param_migration_role.add_override(
            "inline_policy",
            [
                {
                    "name": "param_migration_policy",
                    "policy": json.dumps(param_migration_policy)
                }
            ]
        )

        # Parameter migration Lambda
        self.param_migration_lambda = LambdaFunction(
            self,
            "param_migration_lambda",
            function_name=f"param-migration-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=self.param_migration_role.arn,
            filename="../../../lib/lambda_placeholder.zip",
            source_code_hash="${filebase64sha256(\"../../../lib/lambda_placeholder.zip\")}",
            timeout=300,
            memory_size=256,
            environment={
                "variables": {
                    "SOURCE_PREFIX": "/dev/",
                    "TARGET_PREFIX": "/prod/",
                    "REGION": self.aws_region,
                }
            },
            tags={
                "Name": f"param-migration-{self.environment_suffix}",
            }
        )

    def _create_outputs(self):
        """Create Terraform outputs."""
        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc.id,
            description="Production VPC ID",
        )

        TerraformOutput(
            self,
            "rds_cluster_endpoint",
            value=self.rds_cluster.endpoint,
            description="RDS Aurora Cluster Endpoint",
        )

        TerraformOutput(
            self,
            "rds_cluster_reader_endpoint",
            value=self.rds_cluster.reader_endpoint,
            description="RDS Aurora Cluster Reader Endpoint",
        )

        TerraformOutput(
            self,
            "session_table_name",
            value=self.session_table.name,
            description="DynamoDB Session Table Name",
        )

        TerraformOutput(
            self,
            "transaction_table_name",
            value=self.transaction_table.name,
            description="DynamoDB Transaction Table Name",
        )

        TerraformOutput(
            self,
            "payment_lambda_arn",
            value=self.payment_lambda.arn,
            description="Payment Processor Lambda ARN",
        )

        TerraformOutput(
            self,
            "audit_bucket_name",
            value=self.audit_bucket.bucket,
            description="Audit Logs S3 Bucket Name",
        )

        TerraformOutput(
            self,
            "audit_bucket_replica_name",
            value=self.audit_bucket_replica.bucket,
            description="Audit Logs Replica S3 Bucket Name",
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=self.alb.dns_name,
            description="Application Load Balancer DNS Name",
        )

        TerraformOutput(
            self,
            "alarm_topic_arn",
            value=self.alarm_topic.arn,
            description="SNS Topic ARN for Alarms",
        )

        TerraformOutput(
            self,
            "dashboard_name",
            value=self.dashboard.dashboard_name,
            description="CloudWatch Dashboard Name",
        )
