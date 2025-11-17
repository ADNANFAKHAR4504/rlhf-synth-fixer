"""Database infrastructure module for RDS PostgreSQL."""

from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_parameter_group import DbParameterGroup


class DatabaseInfrastructure(Construct):
    """Database infrastructure with RDS PostgreSQL Multi-AZ."""

    # pylint: disable=too-many-positional-arguments
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        db_security_group_id: str,
    ):
        """
        Initialize database infrastructure.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Unique suffix for resource naming
            vpc_id: VPC ID
            private_subnet_ids: List of private subnet IDs
            db_security_group_id: Security group ID for database
        """
        super().__init__(scope, construct_id)

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"payment-db-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={
                "Name": f"payment-db-subnet-group-{environment_suffix}",
            },
        )

        # DB Parameter Group for PostgreSQL
        # Note: 'ssl' parameter cannot be modified in RDS, it's controlled by rds.force_ssl
        db_param_group = DbParameterGroup(
            self,
            "db_param_group",
            name=f"payment-db-params-{environment_suffix}",
            family="postgres15",
            description="Custom parameter group for payment processing database",
            parameter=[
                {
                    "name": "log_connections",
                    "value": "1",
                },
                {
                    "name": "log_disconnections",
                    "value": "1",
                },
                {
                    "name": "rds.force_ssl",
                    "value": "1",
                },
            ],
            tags={
                "Name": f"payment-db-params-{environment_suffix}",
            },
        )

        # Database credentials
        # Using managed_master_user_password feature for secure password generation
        # AWS automatically stores credentials in Secrets Manager
        db_username = "dbadmin"
        db_name = "paymentdb"

        # RDS PostgreSQL instance with Multi-AZ
        # Use managed master user password feature for secure password generation
        self.db_instance = DbInstance(
            self,
            "db_instance",
            identifier=f"payment-db-{environment_suffix}",
            engine="postgres",
            engine_version="15.14",
            instance_class="db.t3.medium",
            allocated_storage=100,
            max_allocated_storage=1000,
            storage_type="gp3",
            storage_encrypted=True,
            multi_az=True,
            db_name=db_name,
            username=db_username,
            manage_master_user_password=True,
            master_user_secret_kms_key_id=None,  # Use default AWS managed key
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[db_security_group_id],
            parameter_group_name=db_param_group.name,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            deletion_protection=False,
            skip_final_snapshot=True,
            copy_tags_to_snapshot=True,
            auto_minor_version_upgrade=True,
            publicly_accessible=False,
            tags={
                "Name": f"payment-db-{environment_suffix}",
                "Compliance": "PCI-DSS",
            },
        )

    @property
    def db_endpoint(self) -> str:
        """Return database endpoint."""
        return self.db_instance.endpoint

    @property
    def db_instance_identifier(self) -> str:
        """Return database instance identifier."""
        return self.db_instance.identifier
