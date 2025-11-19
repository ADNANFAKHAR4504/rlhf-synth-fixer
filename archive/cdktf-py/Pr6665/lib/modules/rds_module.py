"""RDS module for PostgreSQL database with conditional multi-AZ support."""
from cdktf import TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from typing import List
from .naming import NamingModule


class RdsModule(Construct):
    """RDS PostgreSQL module with environment-specific configuration."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        naming: NamingModule,
        vpc_id: str,
        private_subnet_ids: List[str],
        database_name: str,
        master_username: str,
        master_password: str,
        instance_class: str = "db.t3.micro",
        multi_az: bool = False,
        backup_retention_period: int = 7,
        skip_final_snapshot: bool = True
    ):
        super().__init__(scope, id)

        self.naming = naming

        # DB Subnet Group
        self.db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=naming.generate_unique_name("db-subnet-group"),
            subnet_ids=private_subnet_ids,
            tags={
                "Name": naming.generate_unique_name("db-subnet-group"),
                "Environment": naming.environment
            }
        )

        # Security Group for RDS
        self.db_security_group = SecurityGroup(
            self,
            "db_sg",
            name=naming.generate_simple_name("db-sg"),
            description="Security group for RDS PostgreSQL",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    description="PostgreSQL from VPC",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/8"]
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
                "Name": naming.generate_simple_name("db-sg"),
                "Environment": naming.environment
            }
        )

        # RDS Instance
        self.db_instance = DbInstance(
            self,
            "db_instance",
            identifier=naming.generate_simple_name("postgres"),
            engine="postgres",
            engine_version="14.15",
            instance_class=instance_class,
            allocated_storage=20,
            storage_type="gp3",
            db_name=database_name,
            username=master_username,
            password=master_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_security_group.id],
            multi_az=multi_az,
            backup_retention_period=backup_retention_period,
            skip_final_snapshot=skip_final_snapshot,
            deletion_protection=False,
            publicly_accessible=False,
            tags={
                "Name": naming.generate_simple_name("postgres"),
                "Environment": naming.environment
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "db_endpoint",
            value=self.db_instance.endpoint,
            description="RDS endpoint"
        )

        TerraformOutput(
            self,
            "db_name",
            value=self.db_instance.db_name,
            description="Database name"
        )
