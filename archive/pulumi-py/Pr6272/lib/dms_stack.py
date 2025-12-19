"""
dms_stack.py

Database Migration Service (DMS) infrastructure module.
Creates DMS replication instances, endpoints, and tasks for database migration.
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output, CustomTimeouts
import json


class DmsStackArgs:
    """Arguments for DmsStack component."""

    def __init__(
        self,
        environment_suffix: str,
        dms_subnet_ids: List[Output[str]],
        dms_security_group_id: Output[str],
        source_cluster_endpoint: Output[str],
        source_cluster_arn: Output[str],
        target_cluster_endpoint: Output[str],
        target_cluster_arn: Output[str],
        db_subnet_group_name: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.dms_subnet_ids = dms_subnet_ids
        self.dms_security_group_id = dms_security_group_id
        self.source_cluster_endpoint = source_cluster_endpoint
        self.source_cluster_arn = source_cluster_arn
        self.target_cluster_endpoint = target_cluster_endpoint
        self.target_cluster_arn = target_cluster_arn
        self.db_subnet_group_name = db_subnet_group_name
        self.tags = tags or {}


class DmsStack(pulumi.ComponentResource):
    """
    DMS infrastructure for database migration.

    Creates:
    - DMS subnet group
    - DMS replication instance
    - Source and target endpoints
    - DMS replication tasks for full-load and CDC
    - IAM roles for DMS
    """

    def __init__(
        self,
        name: str,
        args: DmsStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:dms:DmsStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'DMS'
        }

        # Create DMS IAM roles
        # CRITICAL: These roles must be fully created and have policy attachments complete
        # before creating the replication instance, otherwise it will fail with "Incompatible network"
        role_dependencies = self._create_dms_iam_roles()

        # DMS Subnet Group
        # Must wait for IAM role attachments to complete before creating subnet group
        self.dms_subnet_group = aws.dms.ReplicationSubnetGroup(
            f"dms-subnet-group-{self.environment_suffix}",
            replication_subnet_group_id=f"dms-subnet-group-{self.environment_suffix}",
            replication_subnet_group_description=f"DMS subnet group for {self.environment_suffix}",
            subnet_ids=args.dms_subnet_ids,
            tags={
                **self.tags,
                'Name': f"dms-subnet-group-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self, depends_on=role_dependencies)
        )

        # DMS Replication Instance
        # Note: Replication instances can take 5-10 minutes to become "available"
        # CRITICAL: The IAM roles (especially dms-vpc-role) must be fully configured
        # with policy attachments complete before creating the instance, otherwise
        # it will fail with "Incompatible network" error
        # 
        # IMPORTANT: If an existing instance shows "Incompatible network" in AWS Console,
        # it was created with misconfigured IAM roles. You must DELETE it first, then
        # redeploy. The instance will be recreated with properly configured IAM roles.
        self.replication_instance = aws.dms.ReplicationInstance(
            f"dms-replication-instance-{self.environment_suffix}",
            replication_instance_id=f"dms-rep-inst-{self.environment_suffix}",
            replication_instance_class="dms.c5.xlarge",
            allocated_storage=100,
            vpc_security_group_ids=[args.dms_security_group_id],
            replication_subnet_group_id=self.dms_subnet_group.replication_subnet_group_id,
            multi_az=False,  # Single AZ for cost optimization
            publicly_accessible=False,
            engine_version="3.6.1",
            auto_minor_version_upgrade=True,
            apply_immediately=True,
            tags={
                **self.tags,
                'Name': f"dms-replication-instance-{self.environment_suffix}"
            },
            opts=ResourceOptions(
                parent=self,
                # CRITICAL: Ensure all IAM role dependencies are complete, including policy attachments
                depends_on=role_dependencies,
                # Add custom timeout to allow time for instance to become available
                custom_timeouts=CustomTimeouts(
                    create="15m",  # Allow 15 minutes for instance to become available
                    update="15m",
                    delete="10m"
                )
            )
        )

        # Source Endpoint (Production Aurora)
        self.source_endpoint = aws.dms.Endpoint(
            f"dms-source-endpoint-{self.environment_suffix}",
            endpoint_id=f"dms-source-{self.environment_suffix}",
            endpoint_type="source",
            engine_name="aurora-postgresql",
            server_name=args.source_cluster_endpoint,
            port=5432,
            database_name="payments",
            username="dbadmin",
            password=pulumi.Output.secret("ChangeMe123!"),
            ssl_mode="require",
            extra_connection_attributes="",
            tags={
                **self.tags,
                'Name': f"dms-source-endpoint-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Target Endpoint (Migration Aurora)
        self.target_endpoint = aws.dms.Endpoint(
            f"dms-target-endpoint-{self.environment_suffix}",
            endpoint_id=f"dms-target-{self.environment_suffix}",
            endpoint_type="target",
            engine_name="aurora-postgresql",
            server_name=args.target_cluster_endpoint,
            port=5432,
            database_name="payments",
            username="dbadmin",
            password=pulumi.Output.secret("ChangeMe123!"),
            ssl_mode="require",
            extra_connection_attributes="",
            tags={
                **self.tags,
                'Name': f"dms-target-endpoint-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # DMS Replication Task - Full Load + CDC
        # IMPORTANT: The task creation requires the replication instance to be in "available" state
        # Pulumi's depends_on ensures ordering but doesn't wait for the instance to be "available"
        # Use the replication instance ARN in an apply() to ensure it's created first
        # NOTE: If the replication instance shows "Incompatible network" in AWS Console, it was created
        # with misconfigured IAM roles. You must DELETE the instance first, then redeploy.
        # The instance will be recreated with properly configured IAM roles.
        replication_instance_arn_ready = self.replication_instance.replication_instance_arn.apply(
            lambda arn: arn
        )
        
        self.replication_task = aws.dms.ReplicationTask(
            f"dms-replication-task-{self.environment_suffix}",
            replication_task_id=f"dms-task-{self.environment_suffix}",
            migration_type="full-load-and-cdc",
            replication_instance_arn=replication_instance_arn_ready,
            source_endpoint_arn=self.source_endpoint.endpoint_arn,
            target_endpoint_arn=self.target_endpoint.endpoint_arn,
            table_mappings=json.dumps({
                "rules": [
                    {
                        "rule-type": "selection",
                        "rule-id": "1",
                        "rule-name": "1",
                        "object-locator": {
                            "schema-name": "public",
                            "table-name": "%"
                        },
                        "rule-action": "include"
                    }
                ]
            }),
            replication_task_settings=json.dumps({
                "Logging": {
                    "EnableLogging": True,
                    "LogComponents": [
                        {
                            "Id": "SOURCE_CAPTURE",
                            "Severity": "LOGGER_SEVERITY_DEFAULT"
                        },
                        {
                            "Id": "TARGET_APPLY",
                            "Severity": "LOGGER_SEVERITY_INFO"
                        }
                    ]
                },
                "ControlTablesSettings": {
                    "ControlSchema": "dms_control",
                    "HistoryTimeslotInMinutes": 5,
                    "HistoryTableEnabled": True,
                    "SuspendedTablesTableEnabled": True,
                    "StatusTableEnabled": True
                },
                "ChangeProcessingTuning": {
                    "BatchApplyPreserveTransaction": True,
                    "BatchApplyTimeoutMin": 1,
                    "BatchApplyTimeoutMax": 30,
                    "BatchSplitSize": 0,
                    "MinTransactionSize": 1000,
                    "CommitTimeout": 1,
                    "MemoryLimitTotal": 1024,
                    "MemoryKeepTime": 60,
                    "StatementCacheSize": 50
                },
                "ValidationSettings": {
                    "EnableValidation": True,
                    "ValidationMode": "ROW_LEVEL",
                    "ThreadCount": 5
                },
                "FullLoadSettings": {
                    "TargetTablePrepMode": "TRUNCATE_BEFORE_LOAD",
                    "MaxFullLoadSubTasks": 8
                }
            }),
            tags={
                **self.tags,
                'Name': f"dms-replication-task-{self.environment_suffix}"
            },
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    self.replication_instance,
                    self.source_endpoint,
                    self.target_endpoint
                ],
                # NOTE: DMS ReplicationTask does NOT support customTimeouts
                # If this fails with "replication instance is not active", the instance must be
                # in "available" state. If it shows "Incompatible network", delete and recreate it.
                protect=False
            )
        )

        # CloudWatch Log Group for DMS
        self.dms_log_group = aws.cloudwatch.LogGroup(
            f"dms-log-group-{self.environment_suffix}",
            name=f"/aws/dms/{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.tags,
                'Name': f"dms-log-group-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'replication_instance_arn': self.replication_instance.replication_instance_arn,
            'replication_task_arn': self.replication_task.replication_task_arn,
            'source_endpoint_arn': self.source_endpoint.endpoint_arn,
            'target_endpoint_arn': self.target_endpoint.endpoint_arn
        })

    def _create_dms_iam_roles(self):
        """Create required IAM roles for DMS service."""

        invoke_opts = pulumi.InvokeOptions(parent=self)
        dependencies = []

        vpc_role_name = f"dms-vpc-role-{self.environment_suffix}"
        cloudwatch_role_name = f"dms-cloudwatch-logs-role-{self.environment_suffix}"

        # Try to get existing DMS VPC role, or create if it doesn't exist
        try:
            existing_vpc_role = aws.iam.get_role(name=vpc_role_name, opts=invoke_opts)
            # Use Role.get() with the role name (not ARN) to import existing role
            dms_vpc_role = aws.iam.Role.get(
                f"dms-vpc-role-{self.environment_suffix}",
                existing_vpc_role.name,  # Use name, not ARN
                opts=ResourceOptions(parent=self)
            )
        except Exception:
            # Role doesn't exist, create it
            dms_vpc_role = aws.iam.Role(
                f"dms-vpc-role-{self.environment_suffix}",
                name=vpc_role_name,
                path="/service-role/",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "dms.amazonaws.com"
                        }
                    }]
                }),
                tags={
                    **self.tags,
                    'Name': f"dms-vpc-role-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, ignore_changes=["assume_role_policy", "tags", "tags_all"])
            )
        dependencies.append(dms_vpc_role)

        # CRITICAL: Always create the policy attachment, even if role already exists
        # This ensures the attachment is tracked by Pulumi and exists before DMS resources are created
        vpc_attachment = aws.iam.RolePolicyAttachment(
            f"dms-vpc-policy-attachment-{self.environment_suffix}",
            role=dms_vpc_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole",
            opts=ResourceOptions(
                parent=dms_vpc_role,
                depends_on=[dms_vpc_role],
                # Ignore changes to prevent conflicts if attachment already exists
                ignore_changes=["policy_arn", "role"]
            )
        )
        dependencies.append(vpc_attachment)

        # Try to get existing DMS CloudWatch role, or create if it doesn't exist
        try:
            existing_cloudwatch_role = aws.iam.get_role(name=cloudwatch_role_name, opts=invoke_opts)
            # Use Role.get() with the role name (not ARN) to import existing role
            dms_cloudwatch_role = aws.iam.Role.get(
                f"dms-cloudwatch-role-{self.environment_suffix}",
                existing_cloudwatch_role.name,  # Use name, not ARN
                opts=ResourceOptions(parent=self)
            )
        except Exception:
            # Role doesn't exist, create it
            dms_cloudwatch_role = aws.iam.Role(
                f"dms-cloudwatch-role-{self.environment_suffix}",
                name=cloudwatch_role_name,
                path="/service-role/",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "dms.amazonaws.com"
                        }
                    }]
                }),
                tags={
                    **self.tags,
                    'Name': f"dms-cloudwatch-role-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, ignore_changes=["assume_role_policy", "tags", "tags_all"])
            )
        dependencies.append(dms_cloudwatch_role)

        # CRITICAL: Always create the policy attachment, even if role already exists
        # This ensures the attachment is tracked by Pulumi and exists before DMS resources are created
        cloudwatch_attachment = aws.iam.RolePolicyAttachment(
            f"dms-cloudwatch-policy-attachment-{self.environment_suffix}",
            role=dms_cloudwatch_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole",
            opts=ResourceOptions(
                parent=dms_cloudwatch_role,
                depends_on=[dms_cloudwatch_role],
                # Ignore changes to prevent conflicts if attachment already exists
                ignore_changes=["policy_arn", "role"]
            )
        )
        dependencies.append(cloudwatch_attachment)

        return dependencies
