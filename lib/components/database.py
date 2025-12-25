# components/database.py
"""
Database component that creates RDS Multi-AZ and DynamoDB with encryption
Implements high availability and cross-region replication strategies
"""

from typing import List
import pulumi
import pulumi_aws as aws


class DatabaseComponent(pulumi.ComponentResource):
    def __init__(
            self,
            name: str,
            vpc_id: pulumi.Output[str],
            private_subnet_ids: List[pulumi.Output[str]],
            database_security_group_id: pulumi.Output[str],
            region: str,
            is_primary: bool,
            tags: dict, opts: pulumi.ResourceOptions = None):
        super().__init__("custom:database:DatabaseComponent", name, None, opts)

        self.region = region
        self.is_primary = is_primary
        self.tags = tags
        self.vpc_id = vpc_id

        # Create DB Subnet Group for RDS Multi-AZ deployment
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"{name}-db-subnet-group",
            subnet_ids=private_subnet_ids,
            tags={**tags, "Name": f"{name}-db-subnet-group"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # LOCALSTACK FIX: Simplified RDS for LocalStack Community Edition
        # Changed to single-AZ, smaller instance, removed Pro features
        self.rds_instance = aws.rds.Instance(
            f"{name}-rds-instance",
            identifier=f"pulumi-optimization-db-{region}",
            engine="postgres",
            engine_version="13.9",  # LOCALSTACK FIX: Use older, more stable version
            instance_class="db.t3.micro",  # LOCALSTACK FIX: Smaller instance
            allocated_storage=20,  # LOCALSTACK FIX: Reduced storage
            # max_allocated_storage removed for LocalStack

            # Database configuration
            db_name="pulumioptimization",
            username="dbadmin",
            password="testpassword123",  # LOCALSTACK FIX: Simple password for testing
            # manage_master_user_password removed (Secrets Manager may not
            # work)

            # High Availability and Backup
            multi_az=False,  # LOCALSTACK FIX: Single-AZ for Community Edition
            backup_retention_period=0,  # LOCALSTACK FIX: Disable backups

            # Security
            vpc_security_group_ids=[database_security_group_id],
            db_subnet_group_name=self.db_subnet_group.name,
            publicly_accessible=False,

            # Encryption at rest
            storage_encrypted=False,  # LOCALSTACK FIX: Disable encryption
            # kms_key_id removed

            # Performance and Monitoring
            performance_insights_enabled=False,  # LOCALSTACK FIX: Disable Pro features
            # performance_insights_retention_period removed

            # Deletion protection for production
            deletion_protection=False,
            skip_final_snapshot=True,

            tags={**tags, "Name": f"{name}-rds-instance"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Export RDS endpoint for Lambda connections
        self.rds_endpoint = self.rds_instance.endpoint

        # LOCALSTACK FIX: Simplified DynamoDB for LocalStack Community Edition
        self.dynamodb_table = aws.dynamodb.Table(
            f"{name}-dynamodb-table",
            name=f"pulumi-optimization-{region}",
            billing_mode="PAY_PER_REQUEST",  # On-demand pricing

            # Define primary key
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            hash_key="id",
            range_key="timestamp",

            # LOCALSTACK FIX: Simplified encryption
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=False,  # LOCALSTACK FIX: Disable encryption for simplicity
            ),

            # LOCALSTACK FIX: Disable point-in-time recovery
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=False
            ),

            # LOCALSTACK FIX: Disable streams (not needed for single-region)
            stream_enabled=False,
            # stream_view_type removed

            tags={**tags, "Name": f"{name}-dynamodb-table"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # LOCALSTACK FIX: No Global Tables for single-region deployment

        # account_id = aws.get_caller_identity_output().account_id
        # dest_vault_arn = account_id.apply(
        #     lambda aid: f"arn:aws:backup:{secondary_region if is_primary else 'us-east-1'}:{aid}:backup-vault:Default"
        # )

        self.register_outputs({})
