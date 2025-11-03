"""Database infrastructure stack with RDS PostgreSQL."""

from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.db_instance import DbInstance


class DatabaseStack(Construct):
    """Database infrastructure with RDS PostgreSQL."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        kms_key_arn: str,
        db_secret_id: str
    ):
        """Initialize database stack."""
        super().__init__(scope, construct_id)

        # Create DB subnet group
        self.db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"healthcare-db-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            description="Subnet group for healthcare RDS instance",
            tags={
                "Name": f"healthcare-db-subnet-group-{environment_suffix}"
            }
        )

        # Create security group for RDS
        self.db_security_group = SecurityGroup(
            self,
            "db_security_group",
            name=f"healthcare-db-sg-{environment_suffix}",
            description="Security group for healthcare RDS PostgreSQL",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="Allow PostgreSQL access from VPC"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"healthcare-db-sg-{environment_suffix}"
            }
        )

        # Create RDS PostgreSQL instance with encryption
        self.db_instance = DbInstance(
            self,
            "postgres_db",
            identifier=f"healthcare-db-{environment_suffix}",
            engine="postgres",
            engine_version="16.4",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=kms_key_arn,
            db_name="healthcare",
            username="healthadmin",
            manage_master_user_password=True,
            master_user_secret_kms_key_id=kms_key_arn,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_security_group.id],
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            multi_az=False,
            publicly_accessible=False,
            deletion_protection=False,
            skip_final_snapshot=True,
            copy_tags_to_snapshot=True,
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            tags={
                "Name": f"healthcare-db-{environment_suffix}",
                "HIPAA": "true"
            }
        )

    @property
    def db_endpoint(self):
        """Return database endpoint."""
        return self.db_instance.endpoint

    @property
    def db_security_group_id(self):
        """Return database security group ID."""
        return self.db_security_group.id
