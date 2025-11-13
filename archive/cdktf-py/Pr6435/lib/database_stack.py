"""Database Stack - RDS PostgreSQL with Multi-AZ deployment."""

from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
import json


class DatabaseStack(Construct):
    """Database infrastructure for payment processing application."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        database_security_group_id: str,
        **kwargs
    ):
        """Initialize database stack."""
        super().__init__(scope, construct_id)

        # KMS Key for RDS Encryption
        kms_key = KmsKey(
            self,
            "rds_kms_key",
            description=f"KMS key for RDS encryption - {environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "*"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"payment-rds-kms-{environment_suffix}",
            },
        )

        KmsAlias(
            self,
            "rds_kms_alias",
            name=f"alias/payment-rds-{environment_suffix}",
            target_key_id=kms_key.key_id,
        )

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"payment-db-subnet-group-{environment_suffix}",
            description=f"Subnet group for payment database - {environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={
                "Name": f"payment-db-subnet-group-{environment_suffix}",
            },
        )

        # RDS PostgreSQL Instance
        self._rds_instance = DbInstance(
            self,
            "rds_instance",
            identifier=f"payment-db-{environment_suffix}",
            engine="postgres",
            engine_version="15",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            db_name="paymentdb",
            username="dbadmin",
            manage_master_user_password=True,
            multi_az=True,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[database_security_group_id],
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            auto_minor_version_upgrade=True,
            publicly_accessible=False,
            tags={
                "Name": f"payment-db-{environment_suffix}",
            },
        )

        # Store DB connection string in SSM Parameter Store
        # Note: In production, retrieve password from Secrets Manager
        connection_string = f"postgresql://dbadmin@{self._rds_instance.endpoint}/paymentdb"

        self._db_parameter = SsmParameter(
            self,
            "db_connection_parameter",
            name=f"/payment/{environment_suffix}/db/connection",
            description=f"Database connection string for payment app - {environment_suffix}",
            type="SecureString",
            value=connection_string,
            tags={
                "Name": f"payment-db-connection-{environment_suffix}",
            },
        )

    @property
    def rds_endpoint(self) -> str:
        """Return RDS endpoint."""
        return self._rds_instance.endpoint

    @property
    def rds_arn(self) -> str:
        """Return RDS ARN."""
        return self._rds_instance.arn

    @property
    def db_connection_parameter_name(self) -> str:
        """Return SSM parameter name for DB connection string."""
        return self._db_parameter.name
