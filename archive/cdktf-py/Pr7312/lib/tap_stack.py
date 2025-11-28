"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, Fn, Token, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.dms_replication_subnet_group import DmsReplicationSubnetGroup
from cdktf_cdktf_provider_aws.dms_replication_instance import DmsReplicationInstance
from cdktf_cdktf_provider_aws.dms_endpoint import DmsEndpoint
from cdktf_cdktf_provider_aws.dms_replication_task import DmsReplicationTask
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.backup_plan import BackupPlan, BackupPlanRule, BackupPlanRuleLifecycle
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection, BackupSelectionSelectionTag
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json
import os


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        aws_provider = AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Get current AWS account ID
        current_account = DataAwsCallerIdentity(self, "current")

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # ==========================================
        # KMS Key for Encryption
        # ==========================================

        kms_key = KmsKey(
            self,
            "migration_kms_key",
            description=f"KMS key for database migration encryption - {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{current_account.account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow RDS to use the key",
                        "Effect": "Allow",
                        "Principal": {"Service": "rds.amazonaws.com"},
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey",
                            "kms:CreateGrant"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow DMS to use the key",
                        "Effect": "Allow",
                        "Principal": {"Service": "dms.amazonaws.com"},
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey",
                            "kms:CreateGrant"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        KmsAlias(
            self,
            "migration_kms_alias",
            name=f"alias/migration-{environment_suffix}",
            target_key_id=kms_key.key_id
        )

        # ==========================================
        # VPC and Networking
        # ==========================================

        # Migration VPC
        migration_vpc = Vpc(
            self,
            "migration_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"migration-vpc-{environment_suffix}"
            }
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "migration_igw",
            vpc_id=migration_vpc.id,
            tags={
                "Name": f"migration-igw-{environment_suffix}"
            }
        )

        # Create subnets in different AZs
        subnet_a = Subnet(
            self,
            "migration_subnet_a",
            vpc_id=migration_vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"migration-subnet-a-{environment_suffix}"
            }
        )

        subnet_b = Subnet(
            self,
            "migration_subnet_b",
            vpc_id=migration_vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"migration-subnet-b-{environment_suffix}"
            }
        )

        subnet_c = Subnet(
            self,
            "migration_subnet_c",
            vpc_id=migration_vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone=f"{aws_region}c",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"migration-subnet-c-{environment_suffix}"
            }
        )

        # Route table for public subnets
        route_table = RouteTable(
            self,
            "migration_route_table",
            vpc_id=migration_vpc.id,
            tags={
                "Name": f"migration-rt-{environment_suffix}"
            }
        )

        # Route to internet gateway
        Route(
            self,
            "migration_internet_route",
            route_table_id=route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Associate subnets with route table
        RouteTableAssociation(
            self,
            "migration_rta_a",
            subnet_id=subnet_a.id,
            route_table_id=route_table.id
        )

        RouteTableAssociation(
            self,
            "migration_rta_b",
            subnet_id=subnet_b.id,
            route_table_id=route_table.id
        )

        RouteTableAssociation(
            self,
            "migration_rta_c",
            subnet_id=subnet_c.id,
            route_table_id=route_table.id
        )

        # Security Group for Aurora
        aurora_sg = SecurityGroup(
            self,
            "aurora_security_group",
            name=f"aurora-sg-{environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=migration_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="PostgreSQL from VPC and DMS",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"aurora-sg-{environment_suffix}"
            }
        )

        # Security Group for DMS
        dms_sg = SecurityGroup(
            self,
            "dms_security_group",
            name=f"dms-sg-{environment_suffix}",
            description="Security group for DMS replication instance",
            vpc_id=migration_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="PostgreSQL from anywhere in VPC",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=[migration_vpc.cidr_block]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"dms-sg-{environment_suffix}"
            }
        )

        # DB Subnet Group for Aurora
        db_subnet_group = DbSubnetGroup(
            self,
            "aurora_subnet_group",
            name=f"aurora-subnet-group-{environment_suffix}",
            description="Subnet group for Aurora PostgreSQL cluster",
            subnet_ids=[subnet_a.id, subnet_b.id, subnet_c.id]
        )

        # ==========================================
        # REQUIREMENT 1: Aurora PostgreSQL Cluster
        # ==========================================

        aurora_cluster = RdsCluster(
            self,
            "migration_aurora_cluster",
            cluster_identifier=f"migration-aurora-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.6",
            database_name="migrationdb",
            master_username="dbadmin",
            master_password="ChangeMe123456!",  # In production, use Secrets Manager
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[aurora_sg.id],
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            deletion_protection=False,
            skip_final_snapshot=True,
            apply_immediately=True,
            # Note: backtrack_window is not supported for Aurora PostgreSQL (only available for Aurora MySQL)
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 2.0
            },
            tags={
                "Name": f"migration-aurora-{environment_suffix}",
                "Purpose": "database-migration"
            }
        )

        # Aurora Writer Instance
        aurora_writer_instance = RdsClusterInstance(
            self,
            "aurora_writer_instance",
            identifier=f"migration-aurora-writer-{environment_suffix}",
            cluster_identifier=aurora_cluster.cluster_identifier,
            instance_class="db.serverless",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            publicly_accessible=False,
            tags={
                "Name": f"migration-aurora-writer-{environment_suffix}",
                "Role": "writer"
            }
        )

        # Aurora Reader Instance 1 (AZ a)
        aurora_reader_instance_1 = RdsClusterInstance(
            self,
            "aurora_reader_instance_1",
            identifier=f"migration-aurora-reader-1-{environment_suffix}",
            cluster_identifier=aurora_cluster.cluster_identifier,
            instance_class="db.serverless",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            availability_zone=f"{aws_region}a",
            publicly_accessible=False,
            tags={
                "Name": f"migration-aurora-reader-1-{environment_suffix}",
                "Role": "reader"
            }
        )

        # Aurora Reader Instance 2 (AZ b)
        aurora_reader_instance_2 = RdsClusterInstance(
            self,
            "aurora_reader_instance_2",
            identifier=f"migration-aurora-reader-2-{environment_suffix}",
            cluster_identifier=aurora_cluster.cluster_identifier,
            instance_class="db.serverless",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            availability_zone=f"{aws_region}b",
            publicly_accessible=False,
            tags={
                "Name": f"migration-aurora-reader-2-{environment_suffix}",
                "Role": "reader"
            }
        )

        # ==========================================
        # REQUIREMENT 2-4: AWS DMS Setup
        # ==========================================

        # DMS Subnet Group
        dms_subnet_group = DmsReplicationSubnetGroup(
            self,
            "dms_subnet_group",
            replication_subnet_group_id=f"dms-subnet-group-{environment_suffix}",
            replication_subnet_group_description="Subnet group for DMS replication instance",
            subnet_ids=[subnet_a.id, subnet_b.id, subnet_c.id]
        )

        # DMS Replication Instance (2 vCPUs, 8GB RAM = dms.r5.large)
        # Note: engine_version is optional and defaults to the latest version
        # Removing explicit engine_version to use AWS default
        dms_instance = DmsReplicationInstance(
            self,
            "dms_replication_instance",
            replication_instance_id=f"dms-replication-{environment_suffix}",
            replication_instance_class="dms.r5.large",
            allocated_storage=100,
            vpc_security_group_ids=[dms_sg.id],
            replication_subnet_group_id=dms_subnet_group.replication_subnet_group_id,
            publicly_accessible=False,
            multi_az=False,
            auto_minor_version_upgrade=True,
            kms_key_arn=kms_key.arn,
            tags={
                "Name": f"dms-replication-{environment_suffix}"
            }
        )

        # DMS Source Endpoint (On-premises PostgreSQL)
        dms_source_endpoint = DmsEndpoint(
            self,
            "dms_source_endpoint",
            endpoint_id=f"dms-source-onprem-{environment_suffix}",
            endpoint_type="source",
            engine_name="postgres",
            server_name="onprem-postgres.example.com",  # Replace with actual on-prem server
            port=5432,
            database_name="payment_db",
            username="replication_user",
            password="ChangeMe123!",  # In production, use Secrets Manager
            ssl_mode="require",
            extra_connection_attributes="",
            tags={
                "Name": f"dms-source-onprem-{environment_suffix}",
                "Type": "source"
            }
        )

        # DMS Target Endpoint (Aurora PostgreSQL)
        dms_target_endpoint = DmsEndpoint(
            self,
            "dms_target_endpoint",
            endpoint_id=f"dms-target-aurora-{environment_suffix}",
            endpoint_type="target",
            engine_name="aurora-postgresql",
            server_name=aurora_cluster.endpoint,
            port=5432,
            database_name=aurora_cluster.database_name,
            username=aurora_cluster.master_username,
            password=aurora_cluster.master_password,
            ssl_mode="require",
            extra_connection_attributes="",
            tags={
                "Name": f"dms-target-aurora-{environment_suffix}",
                "Type": "target"
            }
        )

        # DMS Replication Task (Full Load + CDC)
        dms_task = DmsReplicationTask(
            self,
            "dms_migration_task",
            replication_task_id=f"dms-migration-task-{environment_suffix}",
            migration_type="full-load-and-cdc",
            replication_instance_arn=dms_instance.replication_instance_arn,
            source_endpoint_arn=dms_source_endpoint.endpoint_arn,
            target_endpoint_arn=dms_target_endpoint.endpoint_arn,
            table_mappings=json.dumps({
                "rules": [
                    {
                        "rule-type": "selection",
                        "rule-id": "1",
                        "rule-name": "include-all-tables",
                        "object-locator": {
                            "schema-name": "public",
                            "table-name": "%"
                        },
                        "rule-action": "include"
                    }
                ]
            }),
            replication_task_settings=json.dumps({
                "TargetMetadata": {
                    "TargetSchema": "",
                    "SupportLobs": True,
                    "FullLobMode": False,
                    "LobChunkSize": 64,
                    "LimitedSizeLobMode": True,
                    "LobMaxSize": 32
                },
                "FullLoadSettings": {
                    "TargetTablePrepMode": "DROP_AND_CREATE",
                    "CreatePkAfterFullLoad": False,
                    "StopTaskCachedChangesApplied": False,
                    "StopTaskCachedChangesNotApplied": False,
                    "MaxFullLoadSubTasks": 8,
                    "TransactionConsistencyTimeout": 600,
                    "CommitRate": 10000
                },
                "Logging": {
                    "EnableLogging": True,
                    "LogComponents": [
                        {
                            "Id": "TRANSFORMATION",
                            "Severity": "LOGGER_SEVERITY_DEFAULT"
                        },
                        {
                            "Id": "SOURCE_UNLOAD",
                            "Severity": "LOGGER_SEVERITY_DEFAULT"
                        },
                        {
                            "Id": "TARGET_LOAD",
                            "Severity": "LOGGER_SEVERITY_DEFAULT"
                        }
                    ]
                },
                "ChangeProcessingTuning": {
                    "BatchApplyEnabled": True,
                    "BatchApplyTimeoutMin": 1,
                    "BatchApplyTimeoutMax": 30,
                    "BatchApplyMemoryLimit": 500,
                    "BatchSplitSize": 0,
                    "MinTransactionSize": 1000,
                    "CommitTimeout": 1,
                    "MemoryLimitTotal": 1024,
                    "MemoryKeepTime": 60,
                    "StatementCacheSize": 50
                },
                "ChangeProcessingDdlHandlingPolicy": {
                    "HandleSourceTableDropped": True,
                    "HandleSourceTableTruncated": True,
                    "HandleSourceTableAltered": True
                }
            }),
            tags={
                "Name": f"dms-migration-task-{environment_suffix}"
            }
        )

        # ==========================================
        # REQUIREMENT 5: Route 53 Hosted Zone
        # ==========================================

        # Use a non-reserved domain name (example.com is reserved by AWS)
        # Use a domain that can be configured via environment variable or use a test domain
        route53_domain = os.environ.get('ROUTE53_DOMAIN', f"migration-{environment_suffix}.internal")
        hosted_zone = Route53Zone(
            self,
            "migration_hosted_zone",
            name=route53_domain,
            comment="Hosted zone for database migration blue-green deployment",
            force_destroy=True,
            tags={
                "Name": route53_domain,
                "Purpose": "blue-green-deployment"
            }
        )

        # Weighted routing - 100% to on-premises initially
        Route53Record(
            self,
            "onprem_weighted_record",
            zone_id=hosted_zone.zone_id,
            name=f"db.{route53_domain}",
            type="CNAME",
            ttl=60,
            weighted_routing_policy={
                "weight": 100
            },
            set_identifier=f"onprem-{environment_suffix}",
            records=["onprem-postgres.example.com"]  # Placeholder - replace with actual on-prem hostname
        )

        # Weighted routing - 0% to Aurora initially
        Route53Record(
            self,
            "aurora_weighted_record",
            zone_id=hosted_zone.zone_id,
            name=f"db.{route53_domain}",
            type="CNAME",
            ttl=60,
            weighted_routing_policy={
                "weight": 0
            },
            set_identifier=f"aurora-{environment_suffix}",
            records=[aurora_cluster.endpoint]
        )

        # ==========================================
        # REQUIREMENT 6: Parameter Store
        # ==========================================

        migration_state_param = SsmParameter(
            self,
            "migration_state_param",
            name=f"/migration/{environment_suffix}/state",
            description="Migration state checkpoint",
            type="String",
            value=json.dumps({
                "status": "initialized",
                "phase": "pre-migration",
                "last_updated": "2024-01-01T00:00:00Z",
                "onprem_weight": 100,
                "aurora_weight": 0
            }),
            tags={
                "Name": f"migration-state-{environment_suffix}",
                "Purpose": "migration-checkpoint"
            }
        )

        migration_config_param = SsmParameter(
            self,
            "migration_config_param",
            name=f"/migration/{environment_suffix}/config",
            description="Migration configuration parameters",
            type="String",
            value=json.dumps({
                "aurora_endpoint": aurora_cluster.endpoint,
                "aurora_reader_endpoint": aurora_cluster.reader_endpoint,
                "dms_task_arn": dms_task.replication_task_arn,
                "hosted_zone_id": hosted_zone.zone_id,
                "cutover_threshold_seconds": 60
            }),
            tags={
                "Name": f"migration-config-{environment_suffix}",
                "Purpose": "migration-configuration"
            }
        )

        # ==========================================
        # REQUIREMENT 8: Lambda for Route 53 Updates
        # ==========================================

        # IAM Role for Lambda
        lambda_role = IamRole(
            self,
            "route53_updater_lambda_role",
            name=f"route53-updater-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"route53-updater-role-{environment_suffix}"
            }
        )

        # Lambda Basic Execution Policy
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Lambda Custom Policy for Route53, SSM, and DMS
        IamRolePolicy(
            self,
            "lambda_route53_policy",
            name=f"route53-updater-policy-{environment_suffix}",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "route53:ChangeResourceRecordSets",
                            "route53:GetChange",
                            "route53:ListResourceRecordSets"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:PutParameter",
                            "ssm:GetParameters"
                        ],
                        "Resource": f"arn:aws:ssm:{aws_region}:*:parameter/migration/{environment_suffix}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dms:DescribeReplicationTasks",
                            "dms:DescribeTableStatistics"
                        ],
                        "Resource": "*"
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

        # Lambda Function for Route 53 cutover
        # Lambda ZIP file path - use absolute path to ensure Terraform can find it
        lambda_zip_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "lambda", "route53_updater.zip"))
        
        route53_lambda = LambdaFunction(
            self,
            "route53_updater_lambda",
            function_name=f"route53-updater-{environment_suffix}",
            filename=lambda_zip_path,
            handler="route53_updater.handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=300,
            memory_size=256,
            environment={
                "variables": {
                    "HOSTED_ZONE_ID": hosted_zone.zone_id,
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "AURORA_ENDPOINT": aurora_cluster.endpoint,
                    "DMS_TASK_ARN": dms_task.replication_task_arn,
                    "SSM_STATE_PARAM": f"/migration/{environment_suffix}/state",
                    "SSM_CONFIG_PARAM": f"/migration/{environment_suffix}/config"
                }
            },
            tags={
                "Name": f"route53-updater-{environment_suffix}",
                "Purpose": "migration-cutover"
            }
        )

        # ==========================================
        # REQUIREMENT 7: EventBridge Rules
        # ==========================================

        # EventBridge Rule for DMS Task State Changes
        dms_event_rule = CloudwatchEventRule(
            self,
            "dms_task_state_change_rule",
            name=f"dms-task-state-change-{environment_suffix}",
            description="Capture DMS task state changes for migration monitoring",
            event_pattern=json.dumps({
                "source": ["aws.dms"],
                "detail-type": ["DMS Replication Task State Change"],
                "detail": {
                    "eventCategories": ["state change"],
                    "sourceIdentifier": [dms_task.replication_task_arn]
                }
            }),
            state="ENABLED",
            tags={
                "Name": f"dms-event-rule-{environment_suffix}"
            }
        )

        # Lambda Permission for EventBridge
        LambdaPermission(
            self,
            "lambda_eventbridge_permission",
            statement_id=f"AllowEventBridgeInvoke-{environment_suffix}",
            action="lambda:InvokeFunction",
            function_name=route53_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=dms_event_rule.arn
        )

        # EventBridge Target (Lambda)
        CloudwatchEventTarget(
            self,
            "dms_event_target",
            rule=dms_event_rule.name,
            arn=route53_lambda.arn,
            target_id=f"dms-lambda-target-{environment_suffix}"
        )

        # SNS Topic for Migration Notifications
        migration_topic = SnsTopic(
            self,
            "migration_notification_topic",
            name=f"migration-notifications-{environment_suffix}",
            display_name="Database Migration Notifications",
            tags={
                "Name": f"migration-notifications-{environment_suffix}"
            }
        )

        # EventBridge Rule for Migration Milestones
        milestone_event_rule = CloudwatchEventRule(
            self,
            "migration_milestone_rule",
            name=f"migration-milestone-{environment_suffix}",
            description="Capture migration milestones for notifications",
            event_pattern=json.dumps({
                "source": ["aws.dms"],
                "detail-type": ["DMS Replication Task State Change"],
                "detail": {
                    "eventCategories": ["state change", "failure", "configuration change"]
                }
            }),
            state="ENABLED",
            tags={
                "Name": f"migration-milestone-rule-{environment_suffix}"
            }
        )

        # EventBridge Target (SNS)
        CloudwatchEventTarget(
            self,
            "milestone_sns_target",
            rule=milestone_event_rule.name,
            arn=migration_topic.arn,
            target_id=f"milestone-sns-target-{environment_suffix}"
        )

        # ==========================================
        # REQUIREMENT 9: CloudWatch Dashboard
        # ==========================================

        migration_dashboard = CloudwatchDashboard(
            self,
            "migration_dashboard",
            dashboard_name=f"migration-dashboard-{environment_suffix}",
            dashboard_body=json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/DMS", "CDCLatencySource", {"stat": "Average", "label": "Source CDC Latency"}],
                                [".", "CDCLatencyTarget", {"stat": "Average", "label": "Target CDC Latency"}]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": aws_region,
                            "title": "DMS Replication Lag",
                            "period": 60,
                            "yAxis": {
                                "left": {"label": "Seconds"}
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                [
                                    "AWS/RDS",
                                    "DatabaseConnections",
                                    "DBClusterIdentifier",
                                    aurora_cluster.cluster_identifier,
                                    {"stat": "Sum", "label": "Aurora Connections"}
                                ]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": aws_region,
                            "title": "Database Connections",
                            "period": 60,
                            "yAxis": {
                                "left": {"label": "Count"}
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                [
                                    "AWS/DMS",
                                    "FullLoadThroughputBandwidthTarget",
                                    {"stat": "Average", "label": "Target Throughput"}
                                ],
                                [
                                    ".",
                                    "FullLoadThroughputRowsTarget",
                                    {"stat": "Average", "label": "Target Rows/sec"}
                                ]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": aws_region,
                            "title": "DMS Throughput",
                            "period": 60
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                [
                                    "AWS/RDS",
                                    "CPUUtilization",
                                    "DBClusterIdentifier",
                                    aurora_cluster.cluster_identifier,
                                    {"stat": "Average"}
                                ],
                                [
                                    ".",
                                    "FreeableMemory",
                                    ".",
                                    ".",
                                    {"stat": "Average"}
                                ]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": aws_region,
                            "title": "Aurora Performance Metrics",
                            "period": 60
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                [
                                    "AWS/RDS",
                                    "AuroraReplicaLag",
                                    "DBClusterIdentifier",
                                    aurora_cluster.cluster_identifier,
                                    {"stat": "Average"}
                                ]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": aws_region,
                            "title": "Aurora Replica Lag",
                            "period": 60,
                            "yAxis": {
                                "left": {"label": "Milliseconds"}
                            }
                        }
                    },
                    {
                        "type": "log",
                        "properties": {
                            "query": (
                                f"SOURCE '/aws/dms/tasks/{dms_task.replication_task_id}' | "
                                f"fields @timestamp, @message | "
                                f"filter @message like /ERROR/ | "
                                f"sort @timestamp desc | limit 20"
                            ),
                            "region": aws_region,
                            "title": "DMS Task Errors",
                            "stacked": False
                        }
                    }
                ]
            })
        )

        # CloudWatch Alarm for DMS Replication Lag
        CloudwatchMetricAlarm(
            self,
            "dms_replication_lag_alarm",
            alarm_name=f"dms-replication-lag-{environment_suffix}",
            alarm_description="Alert when DMS replication lag exceeds 60 seconds",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CDCLatencySource",
            namespace="AWS/DMS",
            period=60,
            statistic="Average",
            threshold=60.0,
            treat_missing_data="notBreaching",
            alarm_actions=[migration_topic.arn],
            dimensions={
                "ReplicationInstanceIdentifier": dms_instance.replication_instance_id,
                "ReplicationTaskIdentifier": dms_task.replication_task_id
            },
            tags={
                "Name": f"dms-lag-alarm-{environment_suffix}"
            }
        )

        # CloudWatch Alarm for Aurora CPU
        CloudwatchMetricAlarm(
            self,
            "aurora_cpu_alarm",
            alarm_name=f"aurora-high-cpu-{environment_suffix}",
            alarm_description="Alert when Aurora CPU exceeds 80%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            treat_missing_data="notBreaching",
            alarm_actions=[migration_topic.arn],
            dimensions={
                "DBClusterIdentifier": aurora_cluster.cluster_identifier
            },
            tags={
                "Name": f"aurora-cpu-alarm-{environment_suffix}"
            }
        )

        # CloudWatch Alarm for Aurora Connections
        CloudwatchMetricAlarm(
            self,
            "aurora_connections_alarm",
            alarm_name=f"aurora-high-connections-{environment_suffix}",
            alarm_description="Alert when Aurora connections exceed 80% of max",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=60,
            statistic="Sum",
            threshold=800,
            treat_missing_data="notBreaching",
            alarm_actions=[migration_topic.arn],
            dimensions={
                "DBClusterIdentifier": aurora_cluster.cluster_identifier
            },
            tags={
                "Name": f"aurora-connections-alarm-{environment_suffix}"
            }
        )

        # ==========================================
        # REQUIREMENT 10: AWS Backup for Aurora
        # ==========================================

        # Backup Vault
        backup_vault = BackupVault(
            self,
            "aurora_backup_vault",
            name=f"aurora-backup-vault-{environment_suffix}",
            kms_key_arn=kms_key.arn,
            force_destroy=True,
            tags={
                "Name": f"aurora-backup-vault-{environment_suffix}",
                "Purpose": "post-migration-snapshots"
            }
        )

        # IAM Role for AWS Backup
        backup_role = IamRole(
            self,
            "backup_service_role",
            name=f"backup-service-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "backup.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"backup-service-role-{environment_suffix}"
            }
        )

        # Attach AWS Backup Service Role Policy
        IamRolePolicyAttachment(
            self,
            "backup_service_role_policy",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
        )

        IamRolePolicyAttachment(
            self,
            "backup_restore_policy",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
        )

        # Backup Plan
        backup_plan = BackupPlan(
            self,
            "aurora_backup_plan",
            name=f"aurora-backup-plan-{environment_suffix}",
            rule=[
                BackupPlanRule(
                    rule_name="daily_backup",
                    target_vault_name=backup_vault.name,
                    schedule="cron(0 5 ? * * *)",
                    start_window=60,
                    completion_window=120,
                    lifecycle=BackupPlanRuleLifecycle(
                        delete_after=7
                    )
                )
            ],
            tags={
                "Name": f"aurora-backup-plan-{environment_suffix}",
                "Purpose": "daily-snapshots"
            }
        )

        # Backup Selection
        BackupSelection(
            self,
            "aurora_backup_selection",
            name=f"aurora-backup-selection-{environment_suffix}",
            plan_id=backup_plan.id,
            iam_role_arn=backup_role.arn,
            selection_tag=[
                BackupSelectionSelectionTag(
                    type="STRINGEQUALS",
                    key="Purpose",
                    value="database-migration"
                )
            ]
        )

        # ==========================================
        # Stack Outputs
        # ==========================================

        TerraformOutput(
            self,
            "VpcId",
            value=migration_vpc.id,
            description="VPC ID for migration infrastructure"
        )

        TerraformOutput(
            self,
            "AuroraClusterId",
            value=aurora_cluster.cluster_identifier,
            description="Aurora PostgreSQL cluster identifier"
        )

        TerraformOutput(
            self,
            "AuroraClusterEndpoint",
            value=aurora_cluster.endpoint,
            description="Aurora PostgreSQL cluster writer endpoint"
        )

        TerraformOutput(
            self,
            "AuroraClusterReaderEndpoint",
            value=aurora_cluster.reader_endpoint,
            description="Aurora PostgreSQL cluster reader endpoint"
        )

        TerraformOutput(
            self,
            "AuroraClusterPort",
            value=aurora_cluster.port,
            description="Aurora PostgreSQL cluster port"
        )

        TerraformOutput(
            self,
            "DmsReplicationInstanceId",
            value=dms_instance.replication_instance_id,
            description="DMS replication instance identifier"
        )

        TerraformOutput(
            self,
            "DmsReplicationInstanceArn",
            value=dms_instance.replication_instance_arn,
            description="DMS replication instance ARN"
        )

        TerraformOutput(
            self,
            "DmsSourceEndpointArn",
            value=dms_source_endpoint.endpoint_arn,
            description="DMS source endpoint ARN"
        )

        TerraformOutput(
            self,
            "DmsTargetEndpointArn",
            value=dms_target_endpoint.endpoint_arn,
            description="DMS target endpoint ARN"
        )

        TerraformOutput(
            self,
            "DmsMigrationTaskArn",
            value=dms_task.replication_task_arn,
            description="DMS replication task ARN"
        )

        TerraformOutput(
            self,
            "Route53HostedZoneId",
            value=hosted_zone.zone_id,
            description="Route 53 hosted zone ID for blue-green deployment"
        )

        TerraformOutput(
            self,
            "LambdaFunctionName",
            value=route53_lambda.function_name,
            description="Lambda function name for Route 53 cutover automation"
        )

        TerraformOutput(
            self,
            "LambdaFunctionArn",
            value=route53_lambda.arn,
            description="Lambda function ARN for Route 53 cutover automation"
        )

        TerraformOutput(
            self,
            "SnsTopicArn",
            value=migration_topic.arn,
            description="SNS topic ARN for migration notifications"
        )

        TerraformOutput(
            self,
            "KmsKeyId",
            value=kms_key.key_id,
            description="KMS key ID for encryption"
        )

        TerraformOutput(
            self,
            "CloudWatchDashboardName",
            value=f"migration-dashboard-{environment_suffix}",
            description="CloudWatch dashboard name for migration monitoring"
        )

        TerraformOutput(
            self,
            "CloudWatchDashboardUrl",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={aws_region}#dashboards:name=migration-dashboard-{environment_suffix}",
            description="CloudWatch dashboard URL"
        )

        TerraformOutput(
            self,
            "EventBridgeRuleName",
            value=dms_event_rule.name,
            description="EventBridge rule name for DMS task state changes"
        )

        # Additional outputs for integration tests
        TerraformOutput(
            self,
            "SubnetIdA",
            value=subnet_a.id,
            description="Subnet ID for availability zone A"
        )

        TerraformOutput(
            self,
            "SubnetIdB",
            value=subnet_b.id,
            description="Subnet ID for availability zone B"
        )

        TerraformOutput(
            self,
            "SubnetIdC",
            value=subnet_c.id,
            description="Subnet ID for availability zone C"
        )

        TerraformOutput(
            self,
            "InternetGatewayId",
            value=igw.id,
            description="Internet Gateway ID"
        )

        TerraformOutput(
            self,
            "AuroraSecurityGroupId",
            value=aurora_sg.id,
            description="Aurora security group ID"
        )

        TerraformOutput(
            self,
            "DmsSecurityGroupId",
            value=dms_sg.id,
            description="DMS security group ID"
        )

        TerraformOutput(
            self,
            "AuroraWriterInstanceId",
            value=aurora_writer_instance.id,
            description="Aurora writer instance identifier"
        )

        TerraformOutput(
            self,
            "AuroraReaderInstanceId1",
            value=aurora_reader_instance_1.id,
            description="Aurora reader instance 1 identifier"
        )

        TerraformOutput(
            self,
            "AuroraReaderInstanceId2",
            value=aurora_reader_instance_2.id,
            description="Aurora reader instance 2 identifier"
        )

        TerraformOutput(
            self,
            "Route53DnsName",
            value=hosted_zone.name,
            description="Route 53 hosted zone DNS name"
        )

        TerraformOutput(
            self,
            "SsmConfigParameter",
            value=migration_config_param.name,
            description="SSM parameter name for migration configuration"
        )

        TerraformOutput(
            self,
            "SsmStateParameter",
            value=migration_state_param.name,
            description="SSM parameter name for migration state"
        )

        TerraformOutput(
            self,
            "BackupVaultName",
            value=backup_vault.name,
            description="AWS Backup vault name"
        )

        TerraformOutput(
            self,
            "BackupPlanId",
            value=backup_plan.id,
            description="AWS Backup plan ID"
        )
