"""
Database Stack for Payment Processing Infrastructure

Creates Aurora PostgreSQL cluster with multi-AZ deployment, encryption at rest,
and Secrets Manager integration for credentials.
"""

import json
from typing import List, Optional

import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import Output, ResourceOptions


class DatabaseStackArgs:
    """
    Arguments for Database Stack.

    Args:
        environment_suffix: Suffix for resource naming
        vpc_id: VPC ID for database deployment
        private_subnet_ids: List of private subnet IDs
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        self.tags = tags or {}


class DatabaseStack(pulumi.ComponentResource):
    """
    Aurora PostgreSQL database infrastructure.

    Creates:
    - DB subnet group across multiple AZs
    - Security group for database access
    - Secrets Manager secret for database credentials
    - Aurora PostgreSQL cluster with multi-AZ
    - Aurora cluster instances
    """

    def __init__(
        self,
        name: str,
        args: DatabaseStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:database:DatabaseStack', name, None, opts)

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"payment-db-subnet-group-{args.environment_suffix}",
            subnet_ids=args.private_subnet_ids,
            tags={
                **args.tags,
                'Name': f'payment-db-subnet-group-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for database
        self.db_security_group = aws.ec2.SecurityGroup(
            f"payment-db-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description="Security group for Aurora PostgreSQL database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.0.0/16"],  # Allow from VPC
                    description="PostgreSQL access from VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                **args.tags,
                'Name': f'payment-db-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Generate database credentials
        self.db_username = "paymentadmin"

        # Generate random password for database
        self.db_random_password = random.RandomPassword(
            f"payment-db-random-password-{args.environment_suffix}",
            length=32,
            special=True,
            override_special="!@#$%^&*()_+-=[]{}|;:,.<>?",
            opts=ResourceOptions(parent=self)
        )

        self.db_password = aws.secretsmanager.Secret(
            f"payment-db-password-{args.environment_suffix}",
            description="Aurora PostgreSQL master password",
            tags=args.tags,
            opts=ResourceOptions(parent=self)
        )

        # Store random password in secret
        self.db_password_version = aws.secretsmanager.SecretVersion(
            f"payment-db-password-version-{args.environment_suffix}",
            secret_id=self.db_password.id,
            secret_string=self.db_random_password.result,
            opts=ResourceOptions(parent=self)
        )

        # Create Aurora PostgreSQL cluster
        self.db_cluster = aws.rds.Cluster(
            f"payment-db-cluster-{args.environment_suffix}",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_mode="provisioned",
            database_name="paymentdb",
            master_username=self.db_username,
            master_password=self.db_password_version.secret_string,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_security_group.id],
            storage_encrypted=True,
            skip_final_snapshot=True,  # For destroyability
            final_snapshot_identifier=None,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={
                **args.tags,
                'Name': f'payment-db-cluster-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.db_subnet_group, self.db_security_group])
        )

        # Create Aurora cluster instances (multi-AZ)
        self.db_instances = []
        for i in range(2):  # Create 2 instances for multi-AZ
            instance = aws.rds.ClusterInstance(
                f"payment-db-instance-{i+1}-{args.environment_suffix}",
                cluster_identifier=self.db_cluster.id,
                instance_class="db.t3.medium",
                engine=aws.rds.EngineType.AURORA_POSTGRESQL,
                publicly_accessible=False,
                tags={
                    **args.tags,
                    'Name': f'payment-db-instance-{i+1}-{args.environment_suffix}'
                },
                opts=ResourceOptions(parent=self, depends_on=[self.db_cluster])
            )
            self.db_instances.append(instance)

        # Create Secrets Manager secret for connection string
        self.connection_string = Output.all(
            self.db_cluster.endpoint,
            self.db_cluster.port,
            self.db_cluster.database_name,
            self.db_username,
            self.db_password_version.secret_string
        ).apply(lambda args: f"postgresql://{args[3]}:{args[4]}@{args[0]}:{args[1]}/{args[2]}")

        self.db_secret = aws.secretsmanager.Secret(
            f"payment-db-connection-{args.environment_suffix}",
            description="Aurora PostgreSQL connection string for payment processing",
            tags=args.tags,
            opts=ResourceOptions(parent=self)
        )

        # Build secret string with all cluster details
        self.db_secret_string = Output.all(
            self.db_cluster.endpoint,
            self.db_cluster.port,
            self.db_cluster.database_name,
            self.db_username,
            self.db_password_version.secret_string
        ).apply(lambda args: json.dumps({
            "connection_string": f"postgresql://{args[3]}:{args[4]}@{args[0]}:{args[1]}/{args[2]}",
            "host": args[0],
            "port": args[1],
            "database": args[2],
            "username": args[3],
            "password": args[4]
        }))

        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"payment-db-connection-version-{args.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=self.db_secret_string,
            opts=ResourceOptions(parent=self, depends_on=[self.db_secret])
        )

        # Export outputs
        self.cluster_endpoint = self.db_cluster.endpoint
        self.cluster_reader_endpoint = self.db_cluster.reader_endpoint
        self.db_secret_arn = self.db_secret.arn

        self.register_outputs({
            'cluster_endpoint': self.cluster_endpoint,
            'cluster_reader_endpoint': self.cluster_reader_endpoint,
            'db_secret_arn': self.db_secret_arn,
            'connection_string': pulumi.Output.secret(self.connection_string),
        })
