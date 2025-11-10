"""Storage infrastructure components including DynamoDB, RDS, and S3."""
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ComponentResource, Output, ResourceOptions


class StorageStack(ComponentResource):
    """ComponentResource for data storage infrastructure."""

    def __init__(
        self,
        name: str,
        environment: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        db_security_group_id: Output[str],
        enable_multi_az: bool,
        db_instance_class: str,
        dynamodb_read_capacity: int,
        dynamodb_write_capacity: int,
        log_retention_days: int,
        tags: Dict[str, str],
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:storage:StorageStack", name, {}, opts)

        # Create DynamoDB table for transactions
        self.dynamodb_table = aws.dynamodb.Table(
            f"transactions-{environment}-{environment_suffix}",
            name=f"transactions-{environment}-{environment_suffix}",
            billing_mode="PROVISIONED",
            hash_key="transactionId",
            range_key="timestamp",
            read_capacity=dynamodb_read_capacity,
            write_capacity=dynamodb_write_capacity,
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="transactionId", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="N"),
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True,
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
            ),
            tags={**tags, "Name": f"transactions-{environment}"},
            opts=ResourceOptions(parent=self),
        )
        self.db_password = random.RandomPassword(
            f"db-password-{environment}-{environment_suffix}",
            length=16,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?",
            opts=ResourceOptions(parent=self),
        )

        # Store database password in Parameter Store
        self.db_password_param = aws.ssm.Parameter(
            f"db-password-param-{environment}-{environment_suffix}",
            name=f"/payment/{environment}/db-password",
            type="SecureString",
            value=self.db_password.result,
            description=f"RDS password for {environment} environment",
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{environment}",
            subnet_ids=private_subnet_ids,
            tags={**tags, "Name": f"payment-db-subnet-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create RDS PostgreSQL instance
        self.rds_instance = aws.rds.Instance(
            f"postgres-{environment}-{environment_suffix}",
            identifier=f"payment-db-{environment}-{environment_suffix}",
            engine="postgres",
            engine_version="14.7",
            instance_class=db_instance_class,
            allocated_storage=20,
            storage_type="gp3",
            db_name="payments",
            username="dbadmin",
            password=self.db_password.result,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[db_security_group_id],
            multi_az=enable_multi_az,
            publicly_accessible=False,
            skip_final_snapshot=True,  # OK for dev/staging, should be False for production
            backup_retention_period=7 if enable_multi_az else 1,
            storage_encrypted=True,
            tags={**tags, "Name": f"payment-db-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create S3 bucket for audit logs
        self.audit_bucket = aws.s3.Bucket(
            f"audit-logs-{environment}-{environment_suffix}",
            bucket=f"payment-audit-{environment}-{environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=(
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="AES256",
                            )
                        ),
                    ),
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    id="delete-old-logs",
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                        days=log_retention_days,
                    ),
                )
            ],
            tags={**tags, "Name": f"payment-audit-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Block public access to S3 bucket
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"audit-bucket-block-{environment}",
            bucket=self.audit_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self),
        )

        # Expose outputs
        self.dynamodb_table_name = self.dynamodb_table.name
        self.dynamodb_table_arn = self.dynamodb_table.arn
        self.rds_endpoint = self.rds_instance.endpoint
        self.audit_bucket_name = self.audit_bucket.bucket

        self.register_outputs({
            "dynamodb_table_name": self.dynamodb_table_name,
            "dynamodb_table_arn": self.dynamodb_table_arn,
            "rds_endpoint": self.rds_endpoint,
            "audit_bucket_name": self.audit_bucket.bucket,
        })
