"""TAP Stack module for CDKTF Python multi-region disaster recovery infrastructure."""

import os
from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA as S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import S3BucketServerSideEncryptionConfigurationA as S3BucketServerSideEncryptionConfiguration, S3BucketServerSideEncryptionConfigurationRuleA, S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import S3BucketReplicationConfigurationA as S3BucketReplicationConfiguration, S3BucketReplicationConfigurationRule, S3BucketReplicationConfigurationRuleDestination, S3BucketReplicationConfigurationRuleFilter
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.lb_target_group_attachment import LbTargetGroupAttachment
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordWeightedRoutingPolicy
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import VpcPeeringConnectionAccepterA as VpcPeeringConnectionAccepter
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import BackupPlan, BackupPlanRule, BackupPlanRuleLifecycle
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection, BackupSelectionSelectionTag
from cdktf_cdktf_provider_random.provider import RandomProvider
from cdktf_cdktf_provider_random.password import Password


class PrimaryRegionStack(TerraformStack):
    """Primary region (us-east-1) infrastructure stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the primary region stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})
        global_cluster_id = kwargs.get('global_cluster_id')

        # Configure AWS Provider for primary region
        provider = AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure Random Provider
        RandomProvider(
            self,
            "random"
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/primary-{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Generate random password for Aurora clusters
        db_password = Password(
            self,
            "aurora_master_password",
            length=16,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?"
        )

        # 1. VPC and Networking - Primary Region (10.0.0.0/16)
        primary_vpc = Vpc(
            self,
            "primary_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"primary-vpc-v1-{environment_suffix}"}
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "primary_igw",
            vpc_id=primary_vpc.id,
            tags={"Name": f"primary-igw-v1-{environment_suffix}"}
        )

        # Availability Zones
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # Public Subnets (for ALB)
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"primary_public_subnet_{i}",
                vpc_id=primary_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"primary-public-{az}-v1-{environment_suffix}"}
            )
            public_subnets.append(subnet)

        # Private Subnets (for Lambda, Aurora)
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"primary_private_subnet_{i}",
                vpc_id=primary_vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={"Name": f"primary-private-{az}-v1-{environment_suffix}"}
            )
            private_subnets.append(subnet)

        # Route table for public subnets
        public_rt = RouteTable(
            self,
            "primary_public_rt",
            vpc_id=primary_vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"primary-public-rt-v1-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"primary_public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Route table for private subnets (no NAT Gateway for cost optimization)
        private_rt = RouteTable(
            self,
            "primary_private_rt",
            vpc_id=primary_vpc.id,
            tags={"Name": f"primary-private-rt-v1-{environment_suffix}"}
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(
                self,
                f"primary_private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # 2. KMS Key for Primary Region
        primary_kms_key = KmsKey(
            self,
            "primary_kms_key",
            description=f"KMS key for primary region {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={"Name": f"primary-kms-v1-{environment_suffix}"}
        )

        KmsAlias(
            self,
            "primary_kms_alias",
            name=f"alias/primary-dr-v1-{environment_suffix}",
            target_key_id=primary_kms_key.id
        )

        # 3. Security Groups
        # ALB Security Group
        alb_sg = SecurityGroup(
            self,
            "primary_alb_sg",
            name=f"primary-alb-sg-v1-{environment_suffix}",
            description="Security group for primary ALB",
            vpc_id=primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS"
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
            tags={"Name": f"primary-alb-sg-v1-{environment_suffix}"}
        )

        # Lambda Security Group
        lambda_sg = SecurityGroup(
            self,
            "primary_lambda_sg",
            name=f"primary-lambda-sg-v1-{environment_suffix}",
            description="Security group for primary Lambda functions",
            vpc_id=primary_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": f"primary-lambda-sg-v1-{environment_suffix}"}
        )

        # Aurora Security Group
        aurora_sg = SecurityGroup(
            self,
            "primary_aurora_sg",
            name=f"primary-aurora-sg-v1-{environment_suffix}",
            description="Security group for primary Aurora cluster",
            vpc_id=primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[lambda_sg.id],
                    description="Allow PostgreSQL from Lambda"
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
            tags={"Name": f"primary-aurora-sg-v1-{environment_suffix}"}
        )

        # 4. Aurora PostgreSQL Primary Cluster
        db_subnet_group = DbSubnetGroup(
            self,
            "primary_db_subnet_group",
            name=f"primary-db-subnet-v1-{environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            tags={"Name": f"primary-db-subnet-v1-{environment_suffix}"}
        )

        primary_cluster = RdsCluster(
            self,
            "primary_aurora_cluster",
            cluster_identifier=f"primary-aurora-v1-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name=f"transactionsv1{environment_suffix.replace('-', '')}",
            master_username="dbadmin",
            master_password=db_password.result,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[aurora_sg.id],
            skip_final_snapshot=True,
            deletion_protection=False,
            storage_encrypted=True,
            kms_key_id=primary_kms_key.arn,
            enabled_cloudwatch_logs_exports=["postgresql"],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            global_cluster_identifier=global_cluster_id,
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0
            },
            depends_on=[db_subnet_group],
            tags={"Name": f"primary-aurora-v1-{environment_suffix}", "BackupPlan": "aurora-backup"}
        )

        # Aurora Serverless v2 instances
        for i in range(2):
            RdsClusterInstance(
                self,
                f"primary_aurora_instance_{i}",
                identifier=f"primary-aurora-{environment_suffix}-{i}",
                cluster_identifier=primary_cluster.id,
                instance_class="db.serverless",
                engine=primary_cluster.engine,
                engine_version=primary_cluster.engine_version,
                publicly_accessible=False,
                tags={"Name": f"primary-aurora-instance-{i}-v1-{environment_suffix}"}
            )

        # 5. SQS Queue
        primary_queue = SqsQueue(
            self,
            "primary_sqs_queue",
            name=f"primary-transactions-v1-{environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=1209600,  # 14 days
            kms_master_key_id=primary_kms_key.id,
            tags={"Name": f"primary-transactions-v1-{environment_suffix}"}
        )

        # 6. Lambda IAM Role
        lambda_role = IamRole(
            self,
            "primary_lambda_role",
            name=f"primary-lambda-role-v1-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={"Name": f"primary-lambda-role-v1-{environment_suffix}"}
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "primary_lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "primary_lambda_vpc_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Custom policy for SQS, DynamoDB, KMS, RDS
        IamRolePolicy(
            self,
            "primary_lambda_custom_policy",
            role=lambda_role.id,
            name=f"primary-lambda-custom-v1-{environment_suffix}",
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": "{primary_queue.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": "arn:aws:dynamodb:*:*:table/session-state-{environment_suffix}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "{primary_kms_key.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "rds-data:ExecuteStatement",
                            "rds-data:BatchExecuteStatement"
                        ],
                        "Resource": "{primary_cluster.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": "arn:aws:s3:::transaction-logs-{environment_suffix}/*"
                    }}
                ]
            }}"""
        )

        # 7. Lambda Function
        # Get absolute path to Lambda ZIP file
        lambda_zip_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "lambda", "transaction_processor.zip"))
        
        primary_lambda = LambdaFunction(
            self,
            "primary_lambda",
            function_name=f"primary-transaction-processor-v1-{environment_suffix}",
            role=lambda_role.arn,
            handler="transaction_processor.handler",
            runtime="python3.12",
            timeout=60,
            memory_size=512,
            filename=lambda_zip_path,
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "DB_CLUSTER_ARN": primary_cluster.arn,
                    "DB_NAME": primary_cluster.database_name,
                    "DYNAMODB_TABLE": f"session-state-v1-{environment_suffix}"
                }
            },
            vpc_config={
                "subnet_ids": [s.id for s in private_subnets],
                "security_group_ids": [lambda_sg.id]
            },
            tags={"Name": f"primary-transaction-processor-v1-{environment_suffix}"}
        )

        # Lambda SQS Event Source Mapping
        LambdaEventSourceMapping(
            self,
            "primary_lambda_sqs_trigger",
            event_source_arn=primary_queue.arn,
            function_name=primary_lambda.function_name,
            batch_size=10,
            maximum_batching_window_in_seconds=5
        )

        # CloudWatch Log Group for Lambda
        CloudwatchLogGroup(
            self,
            "primary_lambda_log_group",
            name=f"/aws/lambda/{primary_lambda.function_name}",
            retention_in_days=7,
            tags={"Name": f"primary-lambda-logs-v1-{environment_suffix}"}
        )

        # 8. S3 Buckets
        # Transaction Logs Bucket
        primary_logs_bucket = S3Bucket(
            self,
            "primary_logs_bucket",
            bucket=f"transaction-logs-v1-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"transaction-logs-v1-{environment_suffix}"}
        )

        S3BucketVersioning(
            self,
            "primary_logs_versioning",
            bucket=primary_logs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "primary_logs_encryption",
            bucket=primary_logs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=primary_kms_key.arn
                )
            )]
        )

        # Documents Bucket
        primary_docs_bucket = S3Bucket(
            self,
            "primary_docs_bucket",
            bucket=f"transaction-documents-v1-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"transaction-documents-v1-{environment_suffix}"}
        )

        S3BucketVersioning(
            self,
            "primary_docs_versioning",
            bucket=primary_docs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "primary_docs_encryption",
            bucket=primary_docs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=primary_kms_key.arn
                )
            )]
        )

        # 9. Application Load Balancer
        primary_alb = Lb(
            self,
            "primary_alb",
            name=f"primary-alb-v1-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[s.id for s in public_subnets],
            enable_deletion_protection=False,
            tags={"Name": f"primary-alb-v1-{environment_suffix}"}
        )

        # Target Group for Lambda
        primary_target_group = LbTargetGroup(
            self,
            "primary_target_group",
            name=f"primary-tg-v1-{environment_suffix}",
            target_type="lambda",
            tags={"Name": f"primary-tg-v1-{environment_suffix}"}
        )

        # Lambda permission for ALB
        LambdaPermission(
            self,
            "primary_lambda_alb_permission",
            statement_id="AllowALBInvoke",
            action="lambda:InvokeFunction",
            function_name=primary_lambda.function_name,
            principal="elasticloadbalancing.amazonaws.com",
            source_arn=primary_target_group.arn
        )

        # Register Lambda with Target Group
        LbTargetGroupAttachment(
            self,
            "primary_lambda_attachment",
            target_group_arn=primary_target_group.arn,
            target_id=primary_lambda.arn,
            depends_on=[primary_lambda]
        )

        # ALB Listener
        LbListener(
            self,
            "primary_alb_listener",
            load_balancer_arn=primary_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=primary_target_group.arn
            )],
            tags={"Name": f"primary-alb-listener-v1-{environment_suffix}"}
        )

        # 10. SNS Topic
        primary_sns_topic = SnsTopic(
            self,
            "primary_sns_topic",
            name=f"primary-alarms-v1-{environment_suffix}",
            kms_master_key_id=primary_kms_key.id,
            tags={"Name": f"primary-alarms-v1-{environment_suffix}"}
        )

        # 11. CloudWatch Alarms
        # Aurora replication lag alarm
        CloudwatchMetricAlarm(
            self,
            "primary_aurora_lag_alarm",
            alarm_name=f"primary-aurora-lag-v1-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=5000,  # 5 seconds in milliseconds
            alarm_description="Aurora Global DB replication lag",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": primary_cluster.cluster_identifier
            },
            tags={"Name": f"primary-aurora-lag-v1-{environment_suffix}"}
        )

        # Lambda error alarm
        CloudwatchMetricAlarm(
            self,
            "primary_lambda_error_alarm",
            alarm_name=f"primary-lambda-errors-v1-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function errors",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={
                "FunctionName": primary_lambda.function_name
            },
            tags={"Name": f"primary-lambda-errors-v1-{environment_suffix}"}
        )

        # 12. AWS Backup
        backup_vault = BackupVault(
            self,
            "primary_backup_vault",
            name=f"primary-aurora-vault-v1-{environment_suffix}",
            kms_key_arn=primary_kms_key.arn,
            tags={"Name": f"primary-aurora-vault-v1-{environment_suffix}"}
        )

        backup_plan = BackupPlan(
            self,
            "primary_backup_plan",
            name=f"primary-aurora-backup-v1-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily-backup",
                target_vault_name=backup_vault.name,
                schedule="cron(0 3 * * ? *)",  # Daily at 3 AM
                lifecycle=BackupPlanRuleLifecycle(
                    delete_after=7
                )
            )],
            tags={"Name": f"primary-aurora-backup-v1-{environment_suffix}"}
        )

        # IAM role for AWS Backup
        backup_role = IamRole(
            self,
            "primary_backup_role",
            name=f"primary-backup-role-v1-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "backup.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={"Name": f"primary-backup-role-v1-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "primary_backup_policy",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
        )

        BackupSelection(
            self,
            "primary_backup_selection",
            name=f"primary-aurora-selection-v1-{environment_suffix}",
            plan_id=backup_plan.id,
            iam_role_arn=backup_role.arn,
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="BackupPlan",
                value="aurora-backup"
            )]
        )

        # Outputs
        self.vpc_id = primary_vpc.id
        self.vpc_cidr = "10.0.0.0/16"  # Store literal CIDR for testing
        self.private_route_table_id = private_rt.id
        self.aurora_cluster_arn = primary_cluster.arn
        self.aurora_endpoint = primary_cluster.endpoint
        self.lambda_arn = primary_lambda.arn
        self.alb_dns = primary_alb.dns_name
        self.logs_bucket = primary_logs_bucket.id
        self.docs_bucket = primary_docs_bucket.id
        self.sns_topic_arn = primary_sns_topic.arn
        self.kms_key_id = primary_kms_key.id

        TerraformOutput(
            self,
            "primary_alb_dns_output",
            value=primary_alb.dns_name,
            description="Primary region ALB DNS name"
        )

        TerraformOutput(
            self,
            "primary_aurora_endpoint_output",
            value=primary_cluster.endpoint,
            description="Primary Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "primary_vpc_id_output",
            value=primary_vpc.id,
            description="Primary VPC ID"
        )

        TerraformOutput(
            self,
            "primary_lambda_arn_output",
            value=primary_lambda.arn,
            description="Primary Lambda function ARN"
        )

        TerraformOutput(
            self,
            "primary_sqs_queue_url_output",
            value=primary_queue.url,
            description="Primary SQS queue URL"
        )

        TerraformOutput(
            self,
            "primary_s3_logs_bucket_output",
            value=primary_logs_bucket.id,
            description="Primary S3 logs bucket name"
        )

        TerraformOutput(
            self,
            "primary_s3_docs_bucket_output",
            value=primary_docs_bucket.id,
            description="Primary S3 docs bucket name"
        )


class DrRegionStack(TerraformStack):
    """DR region (us-east-2) infrastructure stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the DR region stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-2')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})
        global_cluster_id = kwargs.get('global_cluster_id')
        primary_logs_bucket = kwargs.get('primary_logs_bucket')
        primary_docs_bucket = kwargs.get('primary_docs_bucket')
        primary_sns_topic_arn = kwargs.get('primary_sns_topic_arn')

        # Configure AWS Provider for DR region
        provider = AwsProvider(
            self,
            "aws_dr",
            region=aws_region,
            default_tags=[default_tags],
            alias="dr"
        )

        # Configure Random Provider
        RandomProvider(
            self,
            "random"
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/dr-{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Generate random password for Aurora clusters
        db_password = Password(
            self,
            "aurora_master_password",
            length=16,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?"
        )

        # 1. VPC and Networking - DR Region (10.1.0.0/16)
        dr_vpc = Vpc(
            self,
            "dr_vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"dr-vpc-v1-{environment_suffix}"},
            provider=provider
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "dr_igw",
            vpc_id=dr_vpc.id,
            tags={"Name": f"dr-igw-v1-{environment_suffix}"},
            provider=provider
        )

        # Availability Zones
        azs = ["us-east-2a", "us-east-2b", "us-east-2c"]

        # Public Subnets (for ALB)
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"dr_public_subnet_{i}",
                vpc_id=dr_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"dr-public-{az}-v1-{environment_suffix}"},
                provider=provider
            )
            public_subnets.append(subnet)

        # Private Subnets (for Lambda, Aurora)
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"dr_private_subnet_{i}",
                vpc_id=dr_vpc.id,
                cidr_block=f"10.1.{i+10}.0/24",
                availability_zone=az,
                tags={"Name": f"dr-private-{az}-v1-{environment_suffix}"},
                provider=provider
            )
            private_subnets.append(subnet)

        # Route table for public subnets
        public_rt = RouteTable(
            self,
            "dr_public_rt",
            vpc_id=dr_vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"dr-public-rt-v1-{environment_suffix}"},
            provider=provider
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"dr_public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                provider=provider
            )

        # Route table for private subnets
        private_rt = RouteTable(
            self,
            "dr_private_rt",
            vpc_id=dr_vpc.id,
            tags={"Name": f"dr-private-rt-v1-{environment_suffix}"},
            provider=provider
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(
                self,
                f"dr_private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                provider=provider
            )

        # 2. KMS Key for DR Region
        dr_kms_key = KmsKey(
            self,
            "dr_kms_key",
            description=f"KMS key for DR region {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={"Name": f"dr-kms-v1-{environment_suffix}"},
            provider=provider
        )

        KmsAlias(
            self,
            "dr_kms_alias",
            name=f"alias/dr-dr-v1-{environment_suffix}",
            target_key_id=dr_kms_key.id,
            provider=provider
        )

        # 3. Security Groups
        # ALB Security Group
        alb_sg = SecurityGroup(
            self,
            "dr_alb_sg",
            name=f"dr-alb-sg-v1-{environment_suffix}",
            description="Security group for DR ALB",
            vpc_id=dr_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS"
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
            tags={"Name": f"dr-alb-sg-v1-{environment_suffix}"},
            provider=provider
        )

        # Lambda Security Group
        lambda_sg = SecurityGroup(
            self,
            "dr_lambda_sg",
            name=f"dr-lambda-sg-v1-{environment_suffix}",
            description="Security group for DR Lambda functions",
            vpc_id=dr_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": f"dr-lambda-sg-v1-{environment_suffix}"},
            provider=provider
        )

        # Aurora Security Group
        aurora_sg = SecurityGroup(
            self,
            "dr_aurora_sg",
            name=f"dr-aurora-sg-v1-{environment_suffix}",
            description="Security group for DR Aurora cluster",
            vpc_id=dr_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[lambda_sg.id],
                    description="Allow PostgreSQL from Lambda"
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
            tags={"Name": f"dr-aurora-sg-v1-{environment_suffix}"},
            provider=provider
        )

        # 4. Aurora PostgreSQL Secondary Cluster
        db_subnet_group = DbSubnetGroup(
            self,
            "dr_db_subnet_group",
            name=f"dr-db-subnet-v1-{environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            tags={"Name": f"dr-db-subnet-v1-{environment_suffix}"},
            provider=provider
        )

        dr_cluster = RdsCluster(
            self,
            "dr_aurora_cluster",
            cluster_identifier=f"dr-aurora-v1-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            master_username="dbadmin",
            master_password=db_password.result,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[aurora_sg.id],
            skip_final_snapshot=True,
            deletion_protection=False,
            storage_encrypted=True,
            kms_key_id=dr_kms_key.arn,
            enabled_cloudwatch_logs_exports=["postgresql"],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            global_cluster_identifier=global_cluster_id,
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0
            },
            depends_on=[db_subnet_group],
            tags={"Name": f"dr-aurora-v1-{environment_suffix}", "BackupPlan": "aurora-backup"},
            provider=provider
        )

        # Aurora Serverless v2 instances
        for i in range(2):
            RdsClusterInstance(
                self,
                f"dr_aurora_instance_{i}",
                identifier=f"dr-aurora-{environment_suffix}-{i}",
                cluster_identifier=dr_cluster.id,
                instance_class="db.serverless",
                engine=dr_cluster.engine,
                engine_version=dr_cluster.engine_version,
                publicly_accessible=False,
                tags={"Name": f"dr-aurora-instance-{i}-v1-{environment_suffix}"},
                provider=provider
            )

        # 5. SQS Queue
        dr_queue = SqsQueue(
            self,
            "dr_sqs_queue",
            name=f"dr-transactions-v1-{environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=1209600,  # 14 days
            kms_master_key_id=dr_kms_key.id,
            tags={"Name": f"dr-transactions-v1-{environment_suffix}"},
            provider=provider
        )

        # 6. Lambda IAM Role
        lambda_role = IamRole(
            self,
            "dr_lambda_role",
            name=f"dr-lambda-role-v1-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={"Name": f"dr-lambda-role-v1-{environment_suffix}"},
            provider=provider
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "dr_lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=provider
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "dr_lambda_vpc_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=provider
        )

        # Custom policy for SQS, DynamoDB, KMS, RDS
        IamRolePolicy(
            self,
            "dr_lambda_custom_policy",
            role=lambda_role.id,
            name=f"dr-lambda-custom-v1-{environment_suffix}",
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": "{dr_queue.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": "arn:aws:dynamodb:*:*:table/session-state-{environment_suffix}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "{dr_kms_key.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "rds-data:ExecuteStatement",
                            "rds-data:BatchExecuteStatement"
                        ],
                        "Resource": "{dr_cluster.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": "arn:aws:s3:::transaction-logs-dr-{environment_suffix}/*"
                    }}
                ]
            }}""",
            provider=provider
        )

        # 7. Lambda Function
        # Get absolute path to Lambda ZIP file
        lambda_zip_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "lambda", "transaction_processor.zip"))
        
        dr_lambda = LambdaFunction(
            self,
            "dr_lambda",
            function_name=f"dr-transaction-processor-v1-{environment_suffix}",
            role=lambda_role.arn,
            handler="transaction_processor.handler",
            runtime="python3.12",
            timeout=60,
            memory_size=512,
            filename=lambda_zip_path,
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "DB_CLUSTER_ARN": dr_cluster.arn,
                    "DB_NAME": dr_cluster.database_name if hasattr(dr_cluster, 'database_name') else f"transactionsv1{environment_suffix.replace('-', '')}",
                    "DYNAMODB_TABLE": f"session-state-v1-{environment_suffix}"
                }
            },
            vpc_config={
                "subnet_ids": [s.id for s in private_subnets],
                "security_group_ids": [lambda_sg.id]
            },
            tags={"Name": f"dr-transaction-processor-v1-{environment_suffix}"},
            provider=provider
        )

        # Lambda SQS Event Source Mapping
        LambdaEventSourceMapping(
            self,
            "dr_lambda_sqs_trigger",
            event_source_arn=dr_queue.arn,
            function_name=dr_lambda.function_name,
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            provider=provider
        )

        # CloudWatch Log Group for Lambda
        CloudwatchLogGroup(
            self,
            "dr_lambda_log_group",
            name=f"/aws/lambda/{dr_lambda.function_name}",
            retention_in_days=7,
            tags={"Name": f"dr-lambda-logs-v1-{environment_suffix}"},
            provider=provider
        )

        # 8. S3 Buckets (DR replicas)
        # Transaction Logs Bucket
        dr_logs_bucket = S3Bucket(
            self,
            "dr_logs_bucket",
            bucket=f"transaction-logs-dr-v1-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"transaction-logs-dr-v1-{environment_suffix}"},
            provider=provider
        )

        S3BucketVersioning(
            self,
            "dr_logs_versioning",
            bucket=dr_logs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            provider=provider
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "dr_logs_encryption",
            bucket=dr_logs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=dr_kms_key.arn
                )
            )],
            provider=provider
        )

        # Documents Bucket
        dr_docs_bucket = S3Bucket(
            self,
            "dr_docs_bucket",
            bucket=f"transaction-documents-dr-v1-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"transaction-documents-dr-v1-{environment_suffix}"},
            provider=provider
        )

        S3BucketVersioning(
            self,
            "dr_docs_versioning",
            bucket=dr_docs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            provider=provider
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "dr_docs_encryption",
            bucket=dr_docs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=dr_kms_key.arn
                )
            )],
            provider=provider
        )

        # 9. Application Load Balancer
        dr_alb = Lb(
            self,
            "dr_alb",
            name=f"dr-alb-v1-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[s.id for s in public_subnets],
            enable_deletion_protection=False,
            tags={"Name": f"dr-alb-v1-{environment_suffix}"},
            provider=provider
        )

        # Target Group for Lambda
        dr_target_group = LbTargetGroup(
            self,
            "dr_target_group",
            name=f"dr-tg-v1-{environment_suffix}",
            target_type="lambda",
            tags={"Name": f"dr-tg-v1-{environment_suffix}"},
            provider=provider
        )

        # Lambda permission for ALB
        LambdaPermission(
            self,
            "dr_lambda_alb_permission",
            statement_id="AllowALBInvoke",
            action="lambda:InvokeFunction",
            function_name=dr_lambda.function_name,
            principal="elasticloadbalancing.amazonaws.com",
            source_arn=dr_target_group.arn,
            provider=provider
        )

        # Register Lambda with Target Group
        LbTargetGroupAttachment(
            self,
            "dr_lambda_attachment",
            target_group_arn=dr_target_group.arn,
            target_id=dr_lambda.arn,
            depends_on=[dr_lambda],
            provider=provider
        )

        # ALB Listener
        LbListener(
            self,
            "dr_alb_listener",
            load_balancer_arn=dr_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=dr_target_group.arn
            )],
            tags={"Name": f"dr-alb-listener-v1-{environment_suffix}"},
            provider=provider
        )

        # 10. SNS Topic
        dr_sns_topic = SnsTopic(
            self,
            "dr_sns_topic",
            name=f"dr-alarms-v1-{environment_suffix}",
            kms_master_key_id=dr_kms_key.id,
            tags={"Name": f"dr-alarms-v1-{environment_suffix}"},
            provider=provider
        )

        # Note: Cross-region SNS-to-SNS subscriptions are not directly supported.
        # For cross-region alarm notifications, you would typically:
        # 1. Use CloudWatch Events/EventBridge to forward alarms cross-region
        # 2. Use Lambda functions to forward notifications
        # 3. Configure separate email/SMS subscriptions in each region

        # 11. CloudWatch Alarms
        # Aurora replication lag alarm
        CloudwatchMetricAlarm(
            self,
            "dr_aurora_lag_alarm",
            alarm_name=f"dr-aurora-lag-v1-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=5000,  # 5 seconds in milliseconds
            alarm_description="Aurora Global DB replication lag in DR",
            alarm_actions=[dr_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": dr_cluster.cluster_identifier
            },
            tags={"Name": f"dr-aurora-lag-v1-{environment_suffix}"},
            provider=provider
        )

        # Lambda error alarm
        CloudwatchMetricAlarm(
            self,
            "dr_lambda_error_alarm",
            alarm_name=f"dr-lambda-errors-v1-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function errors in DR",
            alarm_actions=[dr_sns_topic.arn],
            dimensions={
                "FunctionName": dr_lambda.function_name
            },
            tags={"Name": f"dr-lambda-errors-v1-{environment_suffix}"},
            provider=provider
        )

        # S3 replication alarm (for logs bucket)
        CloudwatchMetricAlarm(
            self,
            "dr_s3_replication_alarm",
            alarm_name=f"dr-s3-replication-v1-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="ReplicationLatency",
            namespace="AWS/S3",
            period=300,
            statistic="Average",
            threshold=1,
            alarm_description="S3 replication latency",
            alarm_actions=[dr_sns_topic.arn],
            dimensions={
                "SourceBucket": primary_logs_bucket if primary_logs_bucket else f"transaction-logs-v1-{environment_suffix}",
                "DestinationBucket": dr_logs_bucket.id,
                "RuleId": "replication-rule"
            },
            tags={"Name": f"dr-s3-replication-v1-{environment_suffix}"},
            provider=provider
        )

        # 12. AWS Backup
        backup_vault = BackupVault(
            self,
            "dr_backup_vault",
            name=f"dr-aurora-vault-v1-{environment_suffix}",
            kms_key_arn=dr_kms_key.arn,
            tags={"Name": f"dr-aurora-vault-v1-{environment_suffix}"},
            provider=provider
        )

        backup_plan = BackupPlan(
            self,
            "dr_backup_plan",
            name=f"dr-aurora-backup-v1-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily-backup",
                target_vault_name=backup_vault.name,
                schedule="cron(0 3 * * ? *)",  # Daily at 3 AM
                lifecycle=BackupPlanRuleLifecycle(
                    delete_after=7
                )
            )],
            tags={"Name": f"dr-aurora-backup-v1-{environment_suffix}"},
            provider=provider
        )

        # IAM role for AWS Backup
        backup_role = IamRole(
            self,
            "dr_backup_role",
            name=f"dr-backup-role-v1-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "backup.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={"Name": f"dr-backup-role-v1-{environment_suffix}"},
            provider=provider
        )

        IamRolePolicyAttachment(
            self,
            "dr_backup_policy",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
            provider=provider
        )

        BackupSelection(
            self,
            "dr_backup_selection",
            name=f"dr-aurora-selection-v1-{environment_suffix}",
            plan_id=backup_plan.id,
            iam_role_arn=backup_role.arn,
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="BackupPlan",
                value="aurora-backup"
            )],
            provider=provider
        )

        # Outputs
        self.vpc_id = dr_vpc.id
        self.vpc_cidr = "10.1.0.0/16"  # Store literal CIDR for testing
        self.private_route_table_id = private_rt.id
        self.aurora_cluster_arn = dr_cluster.arn
        self.aurora_endpoint = dr_cluster.endpoint
        self.lambda_arn = dr_lambda.arn
        self.alb_dns = dr_alb.dns_name
        self.logs_bucket = dr_logs_bucket.id
        self.docs_bucket = dr_docs_bucket.id
        self.sns_topic_arn = dr_sns_topic.arn
        self.kms_key_id = dr_kms_key.id

        TerraformOutput(
            self,
            "dr_alb_dns_output",
            value=dr_alb.dns_name,
            description="DR region ALB DNS name"
        )

        TerraformOutput(
            self,
            "dr_aurora_endpoint_output",
            value=dr_cluster.endpoint,
            description="DR Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "dr_vpc_id_output",
            value=dr_vpc.id,
            description="DR VPC ID"
        )

        TerraformOutput(
            self,
            "dr_lambda_arn_output",
            value=dr_lambda.arn,
            description="DR Lambda function ARN"
        )

        TerraformOutput(
            self,
            "dr_sqs_queue_url_output",
            value=dr_queue.url,
            description="DR SQS queue URL"
        )

        TerraformOutput(
            self,
            "dr_s3_logs_bucket_output",
            value=dr_logs_bucket.id,
            description="DR S3 logs bucket name"
        )

        TerraformOutput(
            self,
            "dr_s3_docs_bucket_output",
            value=dr_docs_bucket.id,
            description="DR S3 docs bucket name"
        )


class GlobalResourcesStack(TerraformStack):
    """Global resources stack for cross-region infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the global resources stack."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})
        primary_vpc_id = kwargs.get('primary_vpc_id')
        dr_vpc_id = kwargs.get('dr_vpc_id')
        primary_vpc_cidr = kwargs.get('primary_vpc_cidr', '10.0.0.0/16')
        dr_vpc_cidr = kwargs.get('dr_vpc_cidr', '10.1.0.0/16')
        primary_route_table_id = kwargs.get('primary_route_table_id')
        dr_route_table_id = kwargs.get('dr_route_table_id')
        primary_alb_dns = kwargs.get('primary_alb_dns')
        dr_alb_dns = kwargs.get('dr_alb_dns')

        # Configure AWS Provider for primary region (global resources)
        primary_provider = AwsProvider(
            self,
            "aws_primary",
            region="us-east-1",
            default_tags=[default_tags],
            alias="primary"
        )

        # Configure AWS Provider for DR region
        dr_provider = AwsProvider(
            self,
            "aws_dr_global",
            region="us-east-2",
            default_tags=[default_tags],
            alias="dr"
        )

        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/global-{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # 1. Aurora Global Cluster
        # Note: Using Aurora PostgreSQL 14.6 which supports global clusters
        global_cluster = RdsGlobalCluster(
            self,
            "global_aurora_cluster",
            global_cluster_identifier=f"global-aurora-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name=f"transactionsv1{environment_suffix.replace('-', '')}",
            storage_encrypted=True,
            deletion_protection=False,
            provider=primary_provider
        )

        # 2. DynamoDB Global Table
        dynamodb_table = DynamodbTable(
            self,
            "global_dynamodb_table",
            name=f"session-state-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attribute=[
                DynamodbTableAttribute(
                    name="session_id",
                    type="S"
                )
            ],
            replica=[
                DynamodbTableReplica(
                    region_name="us-east-2"
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery={
                "enabled": True
            },
            tags={"Name": f"session-state-{environment_suffix}"},
            provider=primary_provider
        )

        # 3. VPC Peering Connection (if VPC IDs provided)
        if primary_vpc_id and dr_vpc_id:
            peering_connection = VpcPeeringConnection(
                self,
                "vpc_peering",
                vpc_id=primary_vpc_id,
                peer_vpc_id=dr_vpc_id,
                peer_region="us-east-2",
                auto_accept=False,
                tags={"Name": f"primary-dr-peering-v1-{environment_suffix}"},
                provider=primary_provider
            )

            # Accept peering connection in DR region
            VpcPeeringConnectionAccepter(
                self,
                "vpc_peering_accepter",
                vpc_peering_connection_id=peering_connection.id,
                auto_accept=True,
                tags={"Name": f"primary-dr-peering-accepter-v1-{environment_suffix}"},
                provider=dr_provider
            )

            # Add routes for peering connection (if route table IDs provided)
            if primary_route_table_id:
                Route(
                    self,
                    "primary_to_dr_route",
                    route_table_id=primary_route_table_id,
                    destination_cidr_block=dr_vpc_cidr,
                    vpc_peering_connection_id=peering_connection.id,
                    provider=primary_provider
                )

            if dr_route_table_id:
                Route(
                    self,
                    "dr_to_primary_route",
                    route_table_id=dr_route_table_id,
                    destination_cidr_block=primary_vpc_cidr,
                    vpc_peering_connection_id=peering_connection.id,
                    provider=dr_provider
                )

        # 4. Route53 Hosted Zone
        # Using a custom domain pattern instead of example.com (reserved by AWS)
        hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"transactions-{environment_suffix}.internal",
            comment=f"Hosted zone for transaction processing {environment_suffix}",
            tags={"Name": f"transactions-zone-{environment_suffix}"},
            provider=primary_provider
        )

        # 5. Route53 Health Checks
        if primary_alb_dns:
            primary_health_check = Route53HealthCheck(
                self,
                "primary_health_check",
                fqdn=primary_alb_dns,
                port=80,
                type="HTTP",
                resource_path="/",
                failure_threshold=3,
                request_interval=30,
                measure_latency=True,
                tags={"Name": f"primary-health-check-v1-{environment_suffix}"},
                provider=primary_provider
            )

        if dr_alb_dns:
            dr_health_check = Route53HealthCheck(
                self,
                "dr_health_check",
                fqdn=dr_alb_dns,
                port=80,
                type="HTTP",
                resource_path="/",
                failure_threshold=3,
                request_interval=30,
                measure_latency=True,
                tags={"Name": f"dr-health-check-v1-{environment_suffix}"},
                provider=primary_provider
            )

        # 6. Route53 Weighted Routing Records
        if primary_alb_dns:
            Route53Record(
                self,
                "primary_record",
                zone_id=hosted_zone.zone_id,
                name=f"app.{hosted_zone.name}",
                type="CNAME",
                ttl=60,
                records=[primary_alb_dns],
                weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                    weight=100
                ),
                set_identifier="primary",
                health_check_id=primary_health_check.id if primary_alb_dns else None,
                provider=primary_provider
            )

        if dr_alb_dns:
            Route53Record(
                self,
                "dr_record",
                zone_id=hosted_zone.zone_id,
                name=f"app.{hosted_zone.name}",
                type="CNAME",
                ttl=60,
                records=[dr_alb_dns],
                weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                    weight=50
                ),
                set_identifier="dr",
                health_check_id=dr_health_check.id if dr_alb_dns else None,
                provider=primary_provider
            )

        # Outputs
        TerraformOutput(
            self,
            "global_cluster_id_output",
            value=global_cluster.id,
            description="Aurora Global Cluster ID"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name_output",
            value=dynamodb_table.name,
            description="DynamoDB Global Table name"
        )

        TerraformOutput(
            self,
            "route53_zone_id_output",
            value=hosted_zone.zone_id,
            description="Route53 Hosted Zone ID"
        )

        TerraformOutput(
            self,
            "route53_nameservers_output",
            value=Fn.join(",", hosted_zone.name_servers),
            description="Route53 Hosted Zone nameservers"
        )

        self.global_cluster_id = global_cluster.id


class TapStack(TerraformStack):
    """
    Unified TAP Stack that consolidates GlobalResourcesStack, PrimaryRegionStack, and DrRegionStack.
    This wrapper provides a single stack interface for easier output collection and management.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the unified TAP stack."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider for primary region
        primary_provider = AwsProvider(
            self,
            "aws_primary",
            region="us-east-1",
            default_tags=[default_tags],
        )

        # Configure AWS Provider for DR region
        dr_provider = AwsProvider(
            self,
            "aws_dr",
            region="us-east-2",
            default_tags=[default_tags],
            alias="dr"
        )

        # Configure Random Provider
        RandomProvider(
            self,
            "random"
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/tap-{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Generate random password for Aurora clusters
        db_password = Password(
            self,
            "aurora_master_password",
            length=16,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?"
        )

        # 1. Create Global Resources (Aurora Global Cluster and DynamoDB Global Table)
        # Aurora Global Cluster
        global_cluster = RdsGlobalCluster(
            self,
            "global_aurora_cluster",
            global_cluster_identifier=f"global-aurora-v1-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name=f"transactionsv1{environment_suffix.replace('-', '')}",
            storage_encrypted=True,
            deletion_protection=False,
            provider=primary_provider
        )

        # DynamoDB Global Table
        dynamodb_table = DynamodbTable(
            self,
            "global_dynamodb_table",
            name=f"session-state-v1-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attribute=[
                DynamodbTableAttribute(
                    name="session_id",
                    type="S"
                )
            ],
            replica=[
                DynamodbTableReplica(
                    region_name="us-east-2"
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery={
                "enabled": True
            },
            tags={"Name": f"session-state-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # Route53 Hosted Zone
        hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"transactions-v1-{environment_suffix}.internal",
            comment=f"Hosted zone for transaction processing {environment_suffix}",
            tags={"Name": f"transactions-zone-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # 2. Create Primary Region Infrastructure
        # VPC and Networking - Primary Region (10.0.0.0/16)
        primary_vpc = Vpc(
            self,
            "primary_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"primary-vpc-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # Internet Gateway
        primary_igw = InternetGateway(
            self,
            "primary_igw",
            vpc_id=primary_vpc.id,
            tags={"Name": f"primary-igw-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # Availability Zones for Primary
        primary_azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # Public Subnets (for ALB) - Primary
        primary_public_subnets = []
        for i, az in enumerate(primary_azs):
            subnet = Subnet(
                self,
                f"primary_public_subnet_{i}",
                vpc_id=primary_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"primary-public-{az}-v1-{environment_suffix}"},
                provider=primary_provider
            )
            primary_public_subnets.append(subnet)

        # Private Subnets (for Lambda, Aurora) - Primary
        primary_private_subnets = []
        for i, az in enumerate(primary_azs):
            subnet = Subnet(
                self,
                f"primary_private_subnet_{i}",
                vpc_id=primary_vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={"Name": f"primary-private-{az}-v1-{environment_suffix}"},
                provider=primary_provider
            )
            primary_private_subnets.append(subnet)

        # Route table for public subnets - Primary
        primary_public_rt = RouteTable(
            self,
            "primary_public_rt",
            vpc_id=primary_vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=primary_igw.id
            )],
            tags={"Name": f"primary-public-rt-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # Associate public subnets with public route table - Primary
        for i, subnet in enumerate(primary_public_subnets):
            RouteTableAssociation(
                self,
                f"primary_public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=primary_public_rt.id,
                provider=primary_provider
            )

        # Route table for private subnets - Primary
        primary_private_rt = RouteTable(
            self,
            "primary_private_rt",
            vpc_id=primary_vpc.id,
            tags={"Name": f"primary-private-rt-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # Associate private subnets with private route table - Primary
        for i, subnet in enumerate(primary_private_subnets):
            RouteTableAssociation(
                self,
                f"primary_private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=primary_private_rt.id,
                provider=primary_provider
            )

        # KMS Key for Primary Region
        primary_kms_key = KmsKey(
            self,
            "primary_kms_key",
            description=f"KMS key for primary region {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={"Name": f"primary-kms-v1-{environment_suffix}"},
            provider=primary_provider
        )

        KmsAlias(
            self,
            "primary_kms_alias",
            name=f"alias/primary-dr-v1-{environment_suffix}",
            target_key_id=primary_kms_key.id,
            provider=primary_provider
        )

        # Security Groups - Primary
        primary_alb_sg = SecurityGroup(
            self,
            "primary_alb_sg",
            name=f"primary-alb-sg-v1-{environment_suffix}",
            description="Security group for primary ALB",
            vpc_id=primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS"
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
            tags={"Name": f"primary-alb-sg-v1-{environment_suffix}"},
            provider=primary_provider
        )

        primary_lambda_sg = SecurityGroup(
            self,
            "primary_lambda_sg",
            name=f"primary-lambda-sg-v1-{environment_suffix}",
            description="Security group for primary Lambda functions",
            vpc_id=primary_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": f"primary-lambda-sg-v1-{environment_suffix}"},
            provider=primary_provider
        )

        primary_aurora_sg = SecurityGroup(
            self,
            "primary_aurora_sg",
            name=f"primary-aurora-sg-v1-{environment_suffix}",
            description="Security group for primary Aurora cluster",
            vpc_id=primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[primary_lambda_sg.id],
                    description="Allow PostgreSQL from Lambda"
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
            tags={"Name": f"primary-aurora-sg-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # Aurora PostgreSQL Primary Cluster
        primary_db_subnet_group = DbSubnetGroup(
            self,
            "primary_db_subnet_group",
            name=f"primary-db-subnet-v1-{environment_suffix}",
            subnet_ids=[s.id for s in primary_private_subnets],
            tags={"Name": f"primary-db-subnet-v1-{environment_suffix}"},
            provider=primary_provider
        )

        primary_cluster = RdsCluster(
            self,
            "primary_aurora_cluster",
            cluster_identifier=f"primary-aurora-v1-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name=f"transactionsv1{environment_suffix.replace('-', '')}",
            master_username="dbadmin",
            master_password=db_password.result,
            db_subnet_group_name=primary_db_subnet_group.name,
            vpc_security_group_ids=[primary_aurora_sg.id],
            skip_final_snapshot=True,
            deletion_protection=False,
            storage_encrypted=True,
            kms_key_id=primary_kms_key.arn,
            enabled_cloudwatch_logs_exports=["postgresql"],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            global_cluster_identifier=global_cluster.id,
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0
            },
            depends_on=[primary_db_subnet_group],
            tags={"Name": f"primary-aurora-v1-{environment_suffix}", "BackupPlan": "aurora-backup"},
            provider=primary_provider
        )

        # Aurora Serverless v2 instances - Primary
        for i in range(2):
            RdsClusterInstance(
                self,
                f"primary_aurora_instance_{i}",
                identifier=f"primary-aurora-{environment_suffix}-{i}",
                cluster_identifier=primary_cluster.id,
                instance_class="db.serverless",
                engine=primary_cluster.engine,
                engine_version=primary_cluster.engine_version,
                publicly_accessible=False,
                tags={"Name": f"primary-aurora-instance-{i}-v1-{environment_suffix}"},
                provider=primary_provider
            )

        # SQS Queue - Primary
        primary_queue = SqsQueue(
            self,
            "primary_sqs_queue",
            name=f"primary-transactions-v1-{environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=1209600,
            kms_master_key_id=primary_kms_key.id,
            tags={"Name": f"primary-transactions-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # Lambda IAM Role - Primary
        primary_lambda_role = IamRole(
            self,
            "primary_lambda_role",
            name=f"primary-lambda-role-v1-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={"Name": f"primary-lambda-role-v1-{environment_suffix}"},
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "primary_lambda_basic_execution",
            role=primary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "primary_lambda_vpc_execution",
            role=primary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=primary_provider
        )

        IamRolePolicy(
            self,
            "primary_lambda_custom_policy",
            role=primary_lambda_role.id,
            name=f"primary-lambda-custom-v1-{environment_suffix}",
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": "{primary_queue.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": "arn:aws:dynamodb:*:*:table/session-state-{environment_suffix}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "{primary_kms_key.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "rds-data:ExecuteStatement",
                            "rds-data:BatchExecuteStatement"
                        ],
                        "Resource": "{primary_cluster.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": "arn:aws:s3:::transaction-logs-{environment_suffix}/*"
                    }}
                ]
            }}""",
            provider=primary_provider
        )

        # Lambda Function - Primary
        lambda_zip_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "lambda", "transaction_processor.zip"))

        primary_lambda = LambdaFunction(
            self,
            "primary_lambda",
            function_name=f"primary-transaction-processor-v1-{environment_suffix}",
            role=primary_lambda_role.arn,
            handler="transaction_processor.handler",
            runtime="python3.12",
            timeout=60,
            memory_size=512,
            filename=lambda_zip_path,
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "DB_CLUSTER_ARN": primary_cluster.arn,
                    "DB_NAME": primary_cluster.database_name,
                    "DYNAMODB_TABLE": f"session-state-v1-{environment_suffix}"
                }
            },
            vpc_config={
                "subnet_ids": [s.id for s in primary_private_subnets],
                "security_group_ids": [primary_lambda_sg.id]
            },
            tags={"Name": f"primary-transaction-processor-v1-{environment_suffix}"},
            provider=primary_provider
        )

        LambdaEventSourceMapping(
            self,
            "primary_lambda_sqs_trigger",
            event_source_arn=primary_queue.arn,
            function_name=primary_lambda.function_name,
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            provider=primary_provider
        )

        CloudwatchLogGroup(
            self,
            "primary_lambda_log_group",
            name=f"/aws/lambda/{primary_lambda.function_name}",
            retention_in_days=7,
            tags={"Name": f"primary-lambda-logs-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # S3 Buckets - Primary
        primary_logs_bucket = S3Bucket(
            self,
            "primary_logs_bucket",
            bucket=f"transaction-logs-v1-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"transaction-logs-v1-{environment_suffix}"},
            provider=primary_provider
        )

        S3BucketVersioning(
            self,
            "primary_logs_versioning",
            bucket=primary_logs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            provider=primary_provider
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "primary_logs_encryption",
            bucket=primary_logs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=primary_kms_key.arn
                )
            )],
            provider=primary_provider
        )

        primary_docs_bucket = S3Bucket(
            self,
            "primary_docs_bucket",
            bucket=f"transaction-documents-v1-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"transaction-documents-v1-{environment_suffix}"},
            provider=primary_provider
        )

        S3BucketVersioning(
            self,
            "primary_docs_versioning",
            bucket=primary_docs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            provider=primary_provider
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "primary_docs_encryption",
            bucket=primary_docs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=primary_kms_key.arn
                )
            )],
            provider=primary_provider
        )

        # ALB - Primary
        primary_alb = Lb(
            self,
            "primary_alb",
            name=f"primary-alb-v1-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[primary_alb_sg.id],
            subnets=[s.id for s in primary_public_subnets],
            enable_deletion_protection=False,
            tags={"Name": f"primary-alb-v1-{environment_suffix}"},
            provider=primary_provider
        )

        primary_target_group = LbTargetGroup(
            self,
            "primary_target_group",
            name=f"primary-tg-v1-{environment_suffix}",
            target_type="lambda",
            tags={"Name": f"primary-tg-v1-{environment_suffix}"},
            provider=primary_provider
        )

        LambdaPermission(
            self,
            "primary_lambda_alb_permission",
            statement_id="AllowALBInvoke",
            action="lambda:InvokeFunction",
            function_name=primary_lambda.function_name,
            principal="elasticloadbalancing.amazonaws.com",
            source_arn=primary_target_group.arn,
            provider=primary_provider
        )

        LbTargetGroupAttachment(
            self,
            "primary_lambda_attachment",
            target_group_arn=primary_target_group.arn,
            target_id=primary_lambda.arn,
            depends_on=[primary_lambda],
            provider=primary_provider
        )

        LbListener(
            self,
            "primary_alb_listener",
            load_balancer_arn=primary_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=primary_target_group.arn
            )],
            tags={"Name": f"primary-alb-listener-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # SNS Topic - Primary
        primary_sns_topic = SnsTopic(
            self,
            "primary_sns_topic",
            name=f"primary-alarms-v1-{environment_suffix}",
            kms_master_key_id=primary_kms_key.id,
            tags={"Name": f"primary-alarms-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # CloudWatch Alarms - Primary
        CloudwatchMetricAlarm(
            self,
            "primary_aurora_lag_alarm",
            alarm_name=f"primary-aurora-lag-v1-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=5000,
            alarm_description="Aurora Global DB replication lag",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": primary_cluster.cluster_identifier
            },
            tags={"Name": f"primary-aurora-lag-v1-{environment_suffix}"},
            provider=primary_provider
        )

        CloudwatchMetricAlarm(
            self,
            "primary_lambda_error_alarm",
            alarm_name=f"primary-lambda-errors-v1-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function errors",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={
                "FunctionName": primary_lambda.function_name
            },
            tags={"Name": f"primary-lambda-errors-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # AWS Backup - Primary
        primary_backup_vault = BackupVault(
            self,
            "primary_backup_vault",
            name=f"primary-aurora-vault-v1-{environment_suffix}",
            kms_key_arn=primary_kms_key.arn,
            tags={"Name": f"primary-aurora-vault-v1-{environment_suffix}"},
            provider=primary_provider
        )

        primary_backup_plan = BackupPlan(
            self,
            "primary_backup_plan",
            name=f"primary-aurora-backup-v1-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily-backup",
                target_vault_name=primary_backup_vault.name,
                schedule="cron(0 3 * * ? *)",
                lifecycle=BackupPlanRuleLifecycle(
                    delete_after=7
                )
            )],
            tags={"Name": f"primary-aurora-backup-v1-{environment_suffix}"},
            provider=primary_provider
        )

        primary_backup_role = IamRole(
            self,
            "primary_backup_role",
            name=f"primary-backup-role-v1-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "backup.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={"Name": f"primary-backup-role-v1-{environment_suffix}"},
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "primary_backup_policy",
            role=primary_backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
            provider=primary_provider
        )

        BackupSelection(
            self,
            "primary_backup_selection",
            name=f"primary-aurora-selection-v1-{environment_suffix}",
            plan_id=primary_backup_plan.id,
            iam_role_arn=primary_backup_role.arn,
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="BackupPlan",
                value="aurora-backup"
            )],
            provider=primary_provider
        )

        # 3. Create DR Region Infrastructure
        # VPC and Networking - DR Region (10.1.0.0/16)
        dr_vpc = Vpc(
            self,
            "dr_vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"dr-vpc-v1-{environment_suffix}"},
            provider=dr_provider
        )

        dr_igw = InternetGateway(
            self,
            "dr_igw",
            vpc_id=dr_vpc.id,
            tags={"Name": f"dr-igw-v1-{environment_suffix}"},
            provider=dr_provider
        )

        dr_azs = ["us-east-2a", "us-east-2b", "us-east-2c"]

        dr_public_subnets = []
        for i, az in enumerate(dr_azs):
            subnet = Subnet(
                self,
                f"dr_public_subnet_{i}",
                vpc_id=dr_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"dr-public-{az}-v1-{environment_suffix}"},
                provider=dr_provider
            )
            dr_public_subnets.append(subnet)

        dr_private_subnets = []
        for i, az in enumerate(dr_azs):
            subnet = Subnet(
                self,
                f"dr_private_subnet_{i}",
                vpc_id=dr_vpc.id,
                cidr_block=f"10.1.{i+10}.0/24",
                availability_zone=az,
                tags={"Name": f"dr-private-{az}-v1-{environment_suffix}"},
                provider=dr_provider
            )
            dr_private_subnets.append(subnet)

        dr_public_rt = RouteTable(
            self,
            "dr_public_rt",
            vpc_id=dr_vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=dr_igw.id
            )],
            tags={"Name": f"dr-public-rt-v1-{environment_suffix}"},
            provider=dr_provider
        )

        for i, subnet in enumerate(dr_public_subnets):
            RouteTableAssociation(
                self,
                f"dr_public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=dr_public_rt.id,
                provider=dr_provider
            )

        dr_private_rt = RouteTable(
            self,
            "dr_private_rt",
            vpc_id=dr_vpc.id,
            tags={"Name": f"dr-private-rt-v1-{environment_suffix}"},
            provider=dr_provider
        )

        for i, subnet in enumerate(dr_private_subnets):
            RouteTableAssociation(
                self,
                f"dr_private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=dr_private_rt.id,
                provider=dr_provider
            )

        # KMS Key for DR Region
        dr_kms_key = KmsKey(
            self,
            "dr_kms_key",
            description=f"KMS key for DR region {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={"Name": f"dr-kms-v1-{environment_suffix}"},
            provider=dr_provider
        )

        KmsAlias(
            self,
            "dr_kms_alias",
            name=f"alias/dr-dr-v1-{environment_suffix}",
            target_key_id=dr_kms_key.id,
            provider=dr_provider
        )

        # Security Groups - DR
        dr_alb_sg = SecurityGroup(
            self,
            "dr_alb_sg",
            name=f"dr-alb-sg-v1-{environment_suffix}",
            description="Security group for DR ALB",
            vpc_id=dr_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS"
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
            tags={"Name": f"dr-alb-sg-v1-{environment_suffix}"},
            provider=dr_provider
        )

        dr_lambda_sg = SecurityGroup(
            self,
            "dr_lambda_sg",
            name=f"dr-lambda-sg-v1-{environment_suffix}",
            description="Security group for DR Lambda functions",
            vpc_id=dr_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": f"dr-lambda-sg-v1-{environment_suffix}"},
            provider=dr_provider
        )

        dr_aurora_sg = SecurityGroup(
            self,
            "dr_aurora_sg",
            name=f"dr-aurora-sg-v1-{environment_suffix}",
            description="Security group for DR Aurora cluster",
            vpc_id=dr_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[dr_lambda_sg.id],
                    description="Allow PostgreSQL from Lambda"
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
            tags={"Name": f"dr-aurora-sg-v1-{environment_suffix}"},
            provider=dr_provider
        )

        # Aurora PostgreSQL Secondary Cluster - DR
        dr_db_subnet_group = DbSubnetGroup(
            self,
            "dr_db_subnet_group",
            name=f"dr-db-subnet-v1-{environment_suffix}",
            subnet_ids=[s.id for s in dr_private_subnets],
            tags={"Name": f"dr-db-subnet-v1-{environment_suffix}"},
            provider=dr_provider
        )

        dr_cluster = RdsCluster(
            self,
            "dr_aurora_cluster",
            cluster_identifier=f"dr-aurora-v1-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            db_subnet_group_name=dr_db_subnet_group.name,
            vpc_security_group_ids=[dr_aurora_sg.id],
            skip_final_snapshot=True,
            deletion_protection=False,
            storage_encrypted=True,
            kms_key_id=dr_kms_key.arn,
            enabled_cloudwatch_logs_exports=["postgresql"],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            global_cluster_identifier=global_cluster.id,
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0
            },
            depends_on=[dr_db_subnet_group],
            tags={"Name": f"dr-aurora-v1-{environment_suffix}", "BackupPlan": "aurora-backup"},
            provider=dr_provider
        )

        # Aurora Serverless v2 instances - DR
        for i in range(2):
            RdsClusterInstance(
                self,
                f"dr_aurora_instance_{i}",
                identifier=f"dr-aurora-{environment_suffix}-{i}",
                cluster_identifier=dr_cluster.id,
                instance_class="db.serverless",
                engine=dr_cluster.engine,
                engine_version=dr_cluster.engine_version,
                publicly_accessible=False,
                tags={"Name": f"dr-aurora-instance-{i}-v1-{environment_suffix}"},
                provider=dr_provider
            )

        # SQS Queue - DR
        dr_queue = SqsQueue(
            self,
            "dr_sqs_queue",
            name=f"dr-transactions-v1-{environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=1209600,
            kms_master_key_id=dr_kms_key.id,
            tags={"Name": f"dr-transactions-v1-{environment_suffix}"},
            provider=dr_provider
        )

        # Lambda IAM Role - DR
        dr_lambda_role = IamRole(
            self,
            "dr_lambda_role",
            name=f"dr-lambda-role-v1-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={"Name": f"dr-lambda-role-v1-{environment_suffix}"},
            provider=dr_provider
        )

        IamRolePolicyAttachment(
            self,
            "dr_lambda_basic_execution",
            role=dr_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=dr_provider
        )

        IamRolePolicyAttachment(
            self,
            "dr_lambda_vpc_execution",
            role=dr_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=dr_provider
        )

        IamRolePolicy(
            self,
            "dr_lambda_custom_policy",
            role=dr_lambda_role.id,
            name=f"dr-lambda-custom-v1-{environment_suffix}",
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": "{dr_queue.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": "arn:aws:dynamodb:*:*:table/session-state-{environment_suffix}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "{dr_kms_key.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "rds-data:ExecuteStatement",
                            "rds-data:BatchExecuteStatement"
                        ],
                        "Resource": "{dr_cluster.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": "arn:aws:s3:::transaction-logs-dr-{environment_suffix}/*"
                    }}
                ]
            }}""",
            provider=dr_provider
        )

        # Lambda Function - DR
        dr_lambda = LambdaFunction(
            self,
            "dr_lambda",
            function_name=f"dr-transaction-processor-v1-{environment_suffix}",
            role=dr_lambda_role.arn,
            handler="transaction_processor.handler",
            runtime="python3.12",
            timeout=60,
            memory_size=512,
            filename=lambda_zip_path,
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "DB_CLUSTER_ARN": dr_cluster.arn,
                    "DB_NAME": dr_cluster.database_name if hasattr(dr_cluster, 'database_name') else f"transactionsv1{environment_suffix.replace('-', '')}",
                    "DYNAMODB_TABLE": f"session-state-v1-{environment_suffix}"
                }
            },
            vpc_config={
                "subnet_ids": [s.id for s in dr_private_subnets],
                "security_group_ids": [dr_lambda_sg.id]
            },
            tags={"Name": f"dr-transaction-processor-v1-{environment_suffix}"},
            provider=dr_provider
        )

        LambdaEventSourceMapping(
            self,
            "dr_lambda_sqs_trigger",
            event_source_arn=dr_queue.arn,
            function_name=dr_lambda.function_name,
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            provider=dr_provider
        )

        CloudwatchLogGroup(
            self,
            "dr_lambda_log_group",
            name=f"/aws/lambda/{dr_lambda.function_name}",
            retention_in_days=7,
            tags={"Name": f"dr-lambda-logs-v1-{environment_suffix}"},
            provider=dr_provider
        )

        # S3 Buckets - DR
        dr_logs_bucket = S3Bucket(
            self,
            "dr_logs_bucket",
            bucket=f"transaction-logs-dr-v1-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"transaction-logs-dr-v1-{environment_suffix}"},
            provider=dr_provider
        )

        S3BucketVersioning(
            self,
            "dr_logs_versioning",
            bucket=dr_logs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            provider=dr_provider
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "dr_logs_encryption",
            bucket=dr_logs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=dr_kms_key.arn
                )
            )],
            provider=dr_provider
        )

        dr_docs_bucket = S3Bucket(
            self,
            "dr_docs_bucket",
            bucket=f"transaction-documents-dr-v1-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"transaction-documents-dr-v1-{environment_suffix}"},
            provider=dr_provider
        )

        S3BucketVersioning(
            self,
            "dr_docs_versioning",
            bucket=dr_docs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            provider=dr_provider
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "dr_docs_encryption",
            bucket=dr_docs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=dr_kms_key.arn
                )
            )],
            provider=dr_provider
        )

        # ALB - DR
        dr_alb = Lb(
            self,
            "dr_alb",
            name=f"dr-alb-v1-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[dr_alb_sg.id],
            subnets=[s.id for s in dr_public_subnets],
            enable_deletion_protection=False,
            tags={"Name": f"dr-alb-v1-{environment_suffix}"},
            provider=dr_provider
        )

        dr_target_group = LbTargetGroup(
            self,
            "dr_target_group",
            name=f"dr-tg-v1-{environment_suffix}",
            target_type="lambda",
            tags={"Name": f"dr-tg-v1-{environment_suffix}"},
            provider=dr_provider
        )

        LambdaPermission(
            self,
            "dr_lambda_alb_permission",
            statement_id="AllowALBInvoke",
            action="lambda:InvokeFunction",
            function_name=dr_lambda.function_name,
            principal="elasticloadbalancing.amazonaws.com",
            source_arn=dr_target_group.arn,
            provider=dr_provider
        )

        LbTargetGroupAttachment(
            self,
            "dr_lambda_attachment",
            target_group_arn=dr_target_group.arn,
            target_id=dr_lambda.arn,
            depends_on=[dr_lambda],
            provider=dr_provider
        )

        LbListener(
            self,
            "dr_alb_listener",
            load_balancer_arn=dr_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=dr_target_group.arn
            )],
            tags={"Name": f"dr-alb-listener-v1-{environment_suffix}"},
            provider=dr_provider
        )

        # SNS Topic - DR
        dr_sns_topic = SnsTopic(
            self,
            "dr_sns_topic",
            name=f"dr-alarms-v1-{environment_suffix}",
            kms_master_key_id=dr_kms_key.id,
            tags={"Name": f"dr-alarms-v1-{environment_suffix}"},
            provider=dr_provider
        )

        # CloudWatch Alarms - DR
        CloudwatchMetricAlarm(
            self,
            "dr_aurora_lag_alarm",
            alarm_name=f"dr-aurora-lag-v1-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=5000,
            alarm_description="Aurora Global DB replication lag in DR",
            alarm_actions=[dr_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": dr_cluster.cluster_identifier
            },
            tags={"Name": f"dr-aurora-lag-v1-{environment_suffix}"},
            provider=dr_provider
        )

        CloudwatchMetricAlarm(
            self,
            "dr_lambda_error_alarm",
            alarm_name=f"dr-lambda-errors-v1-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function errors in DR",
            alarm_actions=[dr_sns_topic.arn],
            dimensions={
                "FunctionName": dr_lambda.function_name
            },
            tags={"Name": f"dr-lambda-errors-v1-{environment_suffix}"},
            provider=dr_provider
        )

        CloudwatchMetricAlarm(
            self,
            "dr_s3_replication_alarm",
            alarm_name=f"dr-s3-replication-v1-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="ReplicationLatency",
            namespace="AWS/S3",
            period=300,
            statistic="Average",
            threshold=1,
            alarm_description="S3 replication latency",
            alarm_actions=[dr_sns_topic.arn],
            dimensions={
                "SourceBucket": primary_logs_bucket.id,
                "DestinationBucket": dr_logs_bucket.id,
                "RuleId": "replication-rule"
            },
            tags={"Name": f"dr-s3-replication-v1-{environment_suffix}"},
            provider=dr_provider
        )

        # AWS Backup - DR
        dr_backup_vault = BackupVault(
            self,
            "dr_backup_vault",
            name=f"dr-aurora-vault-v1-{environment_suffix}",
            kms_key_arn=dr_kms_key.arn,
            tags={"Name": f"dr-aurora-vault-v1-{environment_suffix}"},
            provider=dr_provider
        )

        dr_backup_plan = BackupPlan(
            self,
            "dr_backup_plan",
            name=f"dr-aurora-backup-v1-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily-backup",
                target_vault_name=dr_backup_vault.name,
                schedule="cron(0 3 * * ? *)",
                lifecycle=BackupPlanRuleLifecycle(
                    delete_after=7
                )
            )],
            tags={"Name": f"dr-aurora-backup-v1-{environment_suffix}"},
            provider=dr_provider
        )

        dr_backup_role = IamRole(
            self,
            "dr_backup_role",
            name=f"dr-backup-role-v1-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "backup.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={"Name": f"dr-backup-role-v1-{environment_suffix}"},
            provider=dr_provider
        )

        IamRolePolicyAttachment(
            self,
            "dr_backup_policy",
            role=dr_backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
            provider=dr_provider
        )

        BackupSelection(
            self,
            "dr_backup_selection",
            name=f"dr-aurora-selection-v1-{environment_suffix}",
            plan_id=dr_backup_plan.id,
            iam_role_arn=dr_backup_role.arn,
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="BackupPlan",
                value="aurora-backup"
            )],
            provider=dr_provider
        )

        # 4. VPC Peering Connection
        peering_connection = VpcPeeringConnection(
            self,
            "vpc_peering",
            vpc_id=primary_vpc.id,
            peer_vpc_id=dr_vpc.id,
            peer_region="us-east-2",
            auto_accept=False,
            tags={"Name": f"primary-dr-peering-v1-{environment_suffix}"},
            provider=primary_provider
        )

        VpcPeeringConnectionAccepter(
            self,
            "vpc_peering_accepter",
            vpc_peering_connection_id=peering_connection.id,
            auto_accept=True,
            tags={"Name": f"primary-dr-peering-accepter-v1-{environment_suffix}"},
            provider=dr_provider
        )

        Route(
            self,
            "primary_to_dr_route",
            route_table_id=primary_private_rt.id,
            destination_cidr_block="10.1.0.0/16",
            vpc_peering_connection_id=peering_connection.id,
            provider=primary_provider
        )

        Route(
            self,
            "dr_to_primary_route",
            route_table_id=dr_private_rt.id,
            destination_cidr_block="10.0.0.0/16",
            vpc_peering_connection_id=peering_connection.id,
            provider=dr_provider
        )

        # 5. Route53 Health Checks and Records
        primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            fqdn=primary_alb.dns_name,
            port=80,
            type="HTTP",
            resource_path="/",
            failure_threshold=3,
            request_interval=30,
            measure_latency=True,
            tags={"Name": f"primary-health-check-v1-{environment_suffix}"},
            provider=primary_provider
        )

        dr_health_check = Route53HealthCheck(
            self,
            "dr_health_check",
            fqdn=dr_alb.dns_name,
            port=80,
            type="HTTP",
            resource_path="/",
            failure_threshold=3,
            request_interval=30,
            measure_latency=True,
            tags={"Name": f"dr-health-check-v1-{environment_suffix}"},
            provider=primary_provider
        )

        # Route53 Weighted Routing Records
        Route53Record(
            self,
            "primary_record",
            zone_id=hosted_zone.zone_id,
            name=f"app.{hosted_zone.name}",
            type="CNAME",
            ttl=60,
            records=[primary_alb.dns_name],
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=100
            ),
            set_identifier="primary",
            health_check_id=primary_health_check.id,
            provider=primary_provider
        )

        Route53Record(
            self,
            "dr_record",
            zone_id=hosted_zone.zone_id,
            name=f"app.{hosted_zone.name}",
            type="CNAME",
            ttl=60,
            records=[dr_alb.dns_name],
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=50
            ),
            set_identifier="dr",
            health_check_id=dr_health_check.id,
            provider=primary_provider
        )

        # Terraform Outputs - Global Resources
        TerraformOutput(
            self,
            "global_cluster_id_output",
            value=global_cluster.id,
            description="Aurora Global Cluster ID"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name_output",
            value=dynamodb_table.name,
            description="DynamoDB Global Table name"
        )

        TerraformOutput(
            self,
            "route53_zone_id_output",
            value=hosted_zone.zone_id,
            description="Route53 Hosted Zone ID"
        )

        TerraformOutput(
            self,
            "route53_nameservers_output",
            value=Fn.join(",", hosted_zone.name_servers),
            description="Route53 Hosted Zone nameservers"
        )

        # Terraform Outputs - Primary Region
        TerraformOutput(
            self,
            "primary_alb_dns_output",
            value=primary_alb.dns_name,
            description="Primary region ALB DNS name"
        )

        TerraformOutput(
            self,
            "primary_aurora_endpoint_output",
            value=primary_cluster.endpoint,
            description="Primary Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "primary_vpc_id_output",
            value=primary_vpc.id,
            description="Primary VPC ID"
        )

        TerraformOutput(
            self,
            "primary_lambda_arn_output",
            value=primary_lambda.arn,
            description="Primary Lambda function ARN"
        )

        TerraformOutput(
            self,
            "primary_sqs_queue_url_output",
            value=primary_queue.url,
            description="Primary SQS queue URL"
        )

        TerraformOutput(
            self,
            "primary_s3_logs_bucket_output",
            value=primary_logs_bucket.id,
            description="Primary S3 logs bucket name"
        )

        TerraformOutput(
            self,
            "primary_s3_docs_bucket_output",
            value=primary_docs_bucket.id,
            description="Primary S3 docs bucket name"
        )

        # Terraform Outputs - DR Region
        TerraformOutput(
            self,
            "dr_alb_dns_output",
            value=dr_alb.dns_name,
            description="DR region ALB DNS name"
        )

        TerraformOutput(
            self,
            "dr_aurora_endpoint_output",
            value=dr_cluster.endpoint,
            description="DR Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "dr_vpc_id_output",
            value=dr_vpc.id,
            description="DR VPC ID"
        )

        TerraformOutput(
            self,
            "dr_lambda_arn_output",
            value=dr_lambda.arn,
            description="DR Lambda function ARN"
        )

        TerraformOutput(
            self,
            "dr_sqs_queue_url_output",
            value=dr_queue.url,
            description="DR SQS queue URL"
        )

        TerraformOutput(
            self,
            "dr_s3_logs_bucket_output",
            value=dr_logs_bucket.id,
            description="DR S3 logs bucket name"
        )

        TerraformOutput(
            self,
            "dr_s3_docs_bucket_output",
            value=dr_docs_bucket.id,
            description="DR S3 docs bucket name"
        )
