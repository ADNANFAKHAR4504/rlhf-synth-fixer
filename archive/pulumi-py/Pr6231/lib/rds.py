"""
RDS PostgreSQL Database
Creates RDS instance with automated backups
"""

import pulumi
import pulumi_aws as aws
import json

def create_rds_instance(environment_suffix: str, vpc, private_subnets, security_group):
    """
    Create RDS PostgreSQL instance with automated backups
    """

    # Create DB subnet group
    db_subnet_group = aws.rds.SubnetGroup(
        f"db-subnet-group-{environment_suffix}",
        subnet_ids=[subnet.id for subnet in private_subnets],
        tags={
            "Name": f"db-subnet-group-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create a random password for the database
    db_password = pulumi.Output.secret("TempPassword123!")  # In production, use existing secret
    db_username = "postgres"
    db_name = "flaskapp"

    # Create RDS PostgreSQL instance
    db_instance = aws.rds.Instance(
        f"postgres-{environment_suffix}",
        identifier=f"postgres-{environment_suffix}",
        engine="postgres",
        engine_version="14",
        instance_class="db.t3.micro",
        allocated_storage=20,
        storage_type="gp2",
        storage_encrypted=True,
        db_name=db_name,
        username=db_username,
        password=db_password,
        db_subnet_group_name=db_subnet_group.name,
        vpc_security_group_ids=[security_group.id],
        publicly_accessible=False,
        skip_final_snapshot=True,  # For destroyable infrastructure
        backup_retention_period=5,
        backup_window="03:00-04:00",
        maintenance_window="mon:04:00-mon:05:00",
        multi_az=False,  # Single AZ for cost optimization
        tags={
            "Name": f"postgres-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create connection string secret in Secrets Manager
    db_connection_string = pulumi.Output.all(
        db_instance.endpoint,
        db_username,
        db_password,
        db_name
    ).apply(lambda args: f"postgresql://{args[1]}:{args[2]}@{args[0]}/{args[3]}")

    db_secret = aws.secretsmanager.Secret(
        f"db-connection-{environment_suffix}",
        name=f"db-connection-{environment_suffix}",
        description="Database connection string for Flask application",
        tags={
            "Name": f"db-connection-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    db_secret_version = aws.secretsmanager.SecretVersion(
        f"db-connection-version-{environment_suffix}",
        secret_id=db_secret.id,
        secret_string=db_connection_string
    )

    return {
        "db_instance": db_instance,
        "db_subnet_group": db_subnet_group,
        "db_secret": db_secret
    }
