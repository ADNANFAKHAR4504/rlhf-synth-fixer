"""RDS Aurora Serverless Database"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any
import json

def create_database(
    environment_suffix: str,
    vpc_id: pulumi.Output[str],
    private_subnet_ids: List[pulumi.Output[str]],
    security_group_id: pulumi.Output[str],
    db_password: pulumi.Output[str],
    environment: str,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create RDS Aurora Serverless v2 cluster"""

    # Create subnet group
    db_subnet_group = aws.rds.SubnetGroup(
        f"payment-db-subnet-group-{environment_suffix}",
        subnet_ids=private_subnet_ids,
        description=f"Subnet group for payment database {environment_suffix}",
        tags={**tags, "Name": f"payment-db-subnet-group-{environment_suffix}"}
    )

    # Create secret for database credentials
    db_secret = aws.secretsmanager.Secret(
        f"payment-db-secret-{environment_suffix}",
        description=f"Database credentials for {environment_suffix}",
        tags=tags
    )

    # Store database credentials in Secrets Manager
    db_credentials = {
        "username": "dbadmin",
        "password": db_password
    }

    db_secret_version = aws.secretsmanager.SecretVersion(
        f"payment-db-secret-version-{environment_suffix}",
        secret_id=db_secret.id,
        secret_string=pulumi.Output.json_dumps(db_credentials)
    )

    # Create Aurora Serverless v2 cluster
    cluster = aws.rds.Cluster(
        f"payment-db-cluster-{environment_suffix}",
        cluster_identifier=f"payment-db-{environment_suffix}",
        engine=aws.rds.EngineType.AURORA_POSTGRESQL,
        engine_mode="provisioned",
        engine_version="15.8",
        database_name="transactions",
        master_username="dbadmin",
        master_password=db_password,
        db_subnet_group_name=db_subnet_group.name,
        vpc_security_group_ids=[security_group_id],
        serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
            max_capacity=2.0 if environment == "prod" else 1.0,
            min_capacity=0.5
        ),
        backup_retention_period=7 if environment == "prod" else 1,
        preferred_backup_window="03:00-04:00",
        preferred_maintenance_window="mon:04:00-mon:05:00",
        storage_encrypted=True,
        skip_final_snapshot=True,
        enabled_cloudwatch_logs_exports=["postgresql"],
        tags={**tags, "Name": f"payment-db-cluster-{environment_suffix}"}
    )

    # Create cluster instance
    cluster_instance = aws.rds.ClusterInstance(
        f"payment-db-instance-{environment_suffix}",
        identifier=f"payment-db-instance-{environment_suffix}",
        cluster_identifier=cluster.id,
        instance_class="db.serverless",
        engine=aws.rds.EngineType.AURORA_POSTGRESQL,
        engine_version="15.8",
        publicly_accessible=False,
        tags={**tags, "Name": f"payment-db-instance-{environment_suffix}"}
    )

    return {
        "cluster": cluster,
        "instance": cluster_instance,
        "subnet_group": db_subnet_group,
        "secret": db_secret
    }
