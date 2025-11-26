"""Migration Stack - AWS DMS for database migration."""

from typing import Dict, List, Any
from cdktf import Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.dms_replication_subnet_group import DmsReplicationSubnetGroup
from cdktf_cdktf_provider_aws.dms_replication_instance import DmsReplicationInstance
from cdktf_cdktf_provider_aws.dms_endpoint import DmsEndpoint
from cdktf_cdktf_provider_aws.dms_replication_task import DmsReplicationTask
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class MigrationConstruct(Construct):
    """Migration Construct with AWS DMS resources."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        private_subnet_ids: List[str],
        dms_security_group_id: str,
        target_db_endpoint: str,
        db_secret_arn: str,
        **kwargs: Any
    ) -> None:
        """Initialize Migration construct.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            environment_suffix: Environment suffix for resource naming
            private_subnet_ids: List of private subnet IDs
            dms_security_group_id: Security group ID for DMS
            target_db_endpoint: Target database endpoint
            db_secret_arn: Database secret ARN
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Create IAM role for DMS
        dms_role = IamRole(
            self,
            f"dms-vpc-role-{environment_suffix}",
            name=f"dms-vpc-role-{environment_suffix}",
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "dms.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"dms-vpc-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        IamRolePolicyAttachment(
            self,
            f"dms-vpc-policy-{environment_suffix}",
            role=dms_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
        )

        # Create DMS replication subnet group
        self.subnet_group = DmsReplicationSubnetGroup(
            self,
            f"dms-subnet-group-{environment_suffix}",
            replication_subnet_group_id=f"payment-dms-subnet-{environment_suffix}",
            replication_subnet_group_description="Subnet group for DMS replication",
            subnet_ids=private_subnet_ids,
            tags={
                "Name": f"payment-dms-subnet-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Create DMS replication instance
        self.replication_instance = DmsReplicationInstance(
            self,
            f"dms-instance-{environment_suffix}",
            replication_instance_id=f"payment-dms-{environment_suffix}",
            replication_instance_class="dms.t3.medium",
            allocated_storage=100,
            engine_version="3.5.3",  # Using available version 3.5.3
            multi_az=False,  # Set to True for production
            publicly_accessible=False,
            replication_subnet_group_id=self.subnet_group.replication_subnet_group_id,
            vpc_security_group_ids=[dms_security_group_id],
            tags={
                "Name": f"payment-dms-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

        # Create source endpoint (on-premises PostgreSQL)
        self.source_endpoint = DmsEndpoint(
            self,
            f"dms-source-endpoint-{environment_suffix}",
            endpoint_id=f"payment-source-{environment_suffix}",
            endpoint_type="source",
            engine_name="postgres",
            server_name="onprem-db.example.com",  # Replace with actual on-prem server
            port=5432,
            database_name="payments",
            username="dbadmin",
            password="SourcePassword123!",  # Use Secrets Manager in production
            ssl_mode="require",
            tags={
                "Name": f"payment-source-endpoint-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Create target endpoint (Aurora PostgreSQL)
        self.target_endpoint = DmsEndpoint(
            self,
            f"dms-target-endpoint-{environment_suffix}",
            endpoint_id=f"payment-target-{environment_suffix}",
            endpoint_type="target",
            engine_name="aurora-postgresql",
            server_name=target_db_endpoint,
            port=5432,
            database_name="payments",
            username="dbadmin",
            password="TempPassword123!ChangeMe",  # Should match Aurora password
            ssl_mode="require",
            tags={
                "Name": f"payment-target-endpoint-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Create replication task
        self.replication_task = DmsReplicationTask(
            self,
            f"dms-task-{environment_suffix}",
            replication_task_id=f"payment-migration-{environment_suffix}",
            migration_type="full-load-and-cdc",
            replication_instance_arn=self.replication_instance.replication_instance_arn,
            source_endpoint_arn=self.source_endpoint.endpoint_arn,
            target_endpoint_arn=self.target_endpoint.endpoint_arn,
            table_mappings=Fn.jsonencode({
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
            replication_task_settings=Fn.jsonencode({
                "TargetMetadata": {
                    "TargetSchema": "public",
                    "SupportLobs": True,
                    "FullLobMode": False,
                    "LobChunkSize": 64,
                    "LimitedSizeLobMode": True,
                    "LobMaxSize": 32
                },
                "FullLoadSettings": {
                    "TargetTablePrepMode": "DROP_AND_CREATE",
                    "MaxFullLoadSubTasks": 8
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
                }
            }),
            start_replication_task=False,  # Manual start recommended
            tags={
                "Name": f"payment-migration-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

    def get_replication_instance_arn(self) -> str:
        """Get DMS replication instance ARN."""
        return self.replication_instance.replication_instance_arn

    def get_replication_task_arn(self) -> str:
        """Get DMS replication task ARN."""
        return self.replication_task.replication_task_arn
