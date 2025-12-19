"""
Database module for Aurora PostgreSQL and DynamoDB
"""

from typing import Dict, Any, List, Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


def create_aurora_cluster(
    environment: str,
    region: str,
    environment_suffix: str,
    vpc_id: Output[str],
    subnet_ids: List[Output[str]],
    security_group_id: Output[str],
    instance_class: str = "db.t4g.medium",
    instance_count: int = 1,
    enable_replica: bool = False,
    prod_stack_ref: Optional[pulumi.StackReference] = None,
    tags: Dict[str, str] = None,
    opts: ResourceOptions = None,
) -> Dict[str, Any]:
    """
    Create Aurora PostgreSQL cluster with optional read replicas.
    """
    
    tags = tags or {}
    
    # Create DB Subnet Group
    db_subnet_group = aws.rds.SubnetGroup(
        f"{environment}-{region}-aurora-subnet-group-{environment_suffix}",
        name=f"{environment}-{region}-aurora-subnet-{environment_suffix}",
        subnet_ids=subnet_ids,
        tags={**tags, "Name": f"{environment}-{region}-aurora-subnet-group-{environment_suffix}"},
        opts=opts,
    )
    
    # Generate master password (in production, use AWS Secrets Manager)
    master_password = pulumi.Config().get_secret("dbPassword") or "ChangeMeInProduction123!"
    
    # Create Aurora Cluster
    cluster = aws.rds.Cluster(
        f"{environment}-{region}-aurora-cluster-{environment_suffix}",
        cluster_identifier=f"{environment}-{region}-aurora-{environment_suffix}",
        engine="aurora-postgresql",
        engine_mode="provisioned",
        engine_version="15.13",
        database_name="frauddetection",
        master_username="dbadmin",
        master_password=master_password,
        db_subnet_group_name=db_subnet_group.name,
        vpc_security_group_ids=[security_group_id],
        storage_encrypted=True,
        backup_retention_period=7,
        preferred_backup_window="03:00-04:00",
        preferred_maintenance_window="mon:04:00-mon:05:00",
        skip_final_snapshot=True,  # For testing; set to False in production
        final_snapshot_identifier=f"{environment}-{region}-aurora-final-{environment_suffix}",
        enabled_cloudwatch_logs_exports=["postgresql"],
        deletion_protection=False,  # Enable in production
        apply_immediately=True,
        serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
            max_capacity=1.0,
            min_capacity=0.5,
        ),
        tags={**tags, "Name": f"{environment}-{region}-aurora-cluster-{environment_suffix}"},
        opts=opts,
    )
    
    # Create Aurora Instances
    instances = []
    for i in range(instance_count):
        instance = aws.rds.ClusterInstance(
            f"{environment}-{region}-aurora-instance-{i}-{environment_suffix}",
            identifier=f"{environment}-{region}-aurora-{i}-{environment_suffix}",
            cluster_identifier=cluster.id,
            instance_class=instance_class,
            engine="aurora-postgresql",
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**tags, "Name": f"{environment}-{region}-aurora-instance-{i}-{environment_suffix}"},
            opts=ResourceOptions(parent=cluster),
        )
        instances.append(instance)
    
    # Create read replica in different region if enabled (for prod to staging/dev)
    read_replica_endpoint = None
    if enable_replica and prod_stack_ref and environment in ["staging", "dev"]:
        # For cross-region replication, we would create a global database
        # This is a simplified version - full implementation requires more setup
        pulumi.log.info(f"Cross-region replica would be created for {environment}")
    
    return {
        "cluster_arn": cluster.arn,
        "cluster_id": cluster.id,
        "endpoint": cluster.endpoint,
        "reader_endpoint": cluster.reader_endpoint,
        "port": cluster.port,
        "database_name": cluster.database_name,
        "master_username": cluster.master_username,
    }


def create_dynamodb_table(
    environment: str,
    region: str,
    environment_suffix: str,
    enable_global_table: bool = False,
    replica_regions: List[str] = None,
    tags: Dict[str, str] = None,
    opts: ResourceOptions = None,
) -> Dict[str, Any]:
    """
    Create DynamoDB table with optional global table replication.
    """
    
    tags = tags or {}
    replica_regions = replica_regions or []

    # Build replicas configuration if global table is enabled
    table_replicas = None
    if enable_global_table and replica_regions:
        table_replicas = [
            aws.dynamodb.TableReplicaArgs(region_name=replica_region)
            for replica_region in replica_regions
        ]

    # Create DynamoDB Table with optional replicas
    table = aws.dynamodb.Table(
        f"{environment}-{region}-fraud-rules-{environment_suffix}",
        name=f"{environment}-{region}-fraud-rules-{environment_suffix}",
        billing_mode="PAY_PER_REQUEST",
        hash_key="ruleId",
        range_key="version",
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="ruleId",
                type="S",
            ),
            aws.dynamodb.TableAttributeArgs(
                name="version",
                type="N",
            ),
            aws.dynamodb.TableAttributeArgs(
                name="ruleType",
                type="S",
            ),
        ],
        global_secondary_indexes=[
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name="RuleTypeIndex",
                hash_key="ruleType",
                projection_type="ALL",
            ),
        ],
        replicas=table_replicas,
        stream_enabled=True,
        stream_view_type="NEW_AND_OLD_IMAGES",
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True,
        ),
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True,
        ),
        ttl=aws.dynamodb.TableTtlArgs(
            enabled=True,
            attribute_name="expiresAt",
        ),
        tags={**tags, "Name": f"{environment}-{region}-fraud-rules-{environment_suffix}"},
        opts=opts,
    )
    
    return {
        "table_name": table.name,
        "table_arn": table.arn,
        "table_id": table.id,
        "stream_arn": table.stream_arn,
    }
