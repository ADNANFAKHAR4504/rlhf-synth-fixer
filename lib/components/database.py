import pulumi
import pulumi_aws as aws
from pulumi import Output
import json

class DatabaseStack:
    def __init__(self, name: str, 
                 subnet_group_name: Output[str], 
                 security_group_id: Output[str],
                 db_username: str,
                 db_name: str,
                 environment: str):
        self.name = name
        self.db_username = db_username
        self.db_name = db_name
        self.environment = environment
        
        # Generate secure random password
        db_password = aws.secretsmanager.Secret(
            f"{name}-db-password",
            description="RDS Aurora password",
            recovery_window_in_days=0 if self.environment == "dev" else 7
        )
        
        db_password_version = aws.secretsmanager.SecretVersion(
            f"{name}-db-password-version",
            secret_id=db_password.id,
            secret_string=pulumi.Output.secret(
                aws.secretsmanager.get_random_password(
                    length=32,
                    special=True,
                    exclude_characters="\"@/\\"
                ).result
            )
        )
        
        # KMS key for encryption
        self.kms_key = aws.kms.Key(
            f"{name}-rds-kms-key",
            description=f"KMS key for RDS encryption - {name}",
            enable_key_rotation=True,
            tags={"Name": f"{name}-rds-kms-key"}
        )
        
        # Aurora cluster parameter group
        self.cluster_parameter_group = aws.rds.ClusterParameterGroup(
            f"{name}-aurora-cluster-params",
            family="aurora-postgresql15",
            description=f"Cluster parameter group for {name}",
            parameters=[
                {"name": "shared_preload_libraries", "value": "pg_stat_statements"},
                {"name": "log_statement", "value": "all"},
                {"name": "log_min_duration_statement", "value": "1000"},
                {"name": "rds.force_ssl", "value": "1"}
            ],
            tags={"Name": f"{name}-aurora-cluster-params"}
        )
        
        # DB parameter group
        self.db_parameter_group = aws.rds.ParameterGroup(
            f"{name}-aurora-db-params",
            family="aurora-postgresql15",
            description=f"DB parameter group for {name}",
            parameters=[
                {"name": "log_connections", "value": "1"},
                {"name": "log_disconnections", "value": "1"}
            ],
            tags={"Name": f"{name}-aurora-db-params"}
        )
        
        # Aurora Serverless v2 scaling configuration
        scaling_config = {
            "min_capacity": 0.5 if self.environment == "dev" else 1,
            "max_capacity": 1 if self.environment == "dev" else 4
        }
        
        # RDS Aurora PostgreSQL cluster
        self.cluster = aws.rds.Cluster(
            f"{name}-aurora-cluster",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.3",
            database_name=self.db_name,
            master_username=self.db_username,
            master_password=db_password_version.secret_string,
            db_subnet_group_name=subnet_group_name,
            vpc_security_group_ids=[security_group_id],
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            backup_retention_period=7 if self.environment == "dev" else 30,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            deletion_protection=False if self.environment == "dev" else True,
            skip_final_snapshot=True if self.environment == "dev" else False,
            final_snapshot_identifier=f"{name}-final-snapshot" if self.environment != "dev" else None,
            serverlessv2_scaling_configuration=scaling_config,
            db_cluster_parameter_group_name=self.cluster_parameter_group.name,
            tags={"Name": f"{name}-aurora-cluster", "Environment": self.environment}
        )
        
        # Create cluster instances (2 for high availability)
        self.instances = []
        instance_count = 1 if self.environment == "dev" else 2
        
        for i in range(instance_count):
            instance = aws.rds.ClusterInstance(
                f"{name}-aurora-instance-{i+1}",
                cluster_identifier=self.cluster.id,
                instance_class="db.serverless",
                engine="aurora-postgresql",
                db_parameter_group_name=self.db_parameter_group.name,
                performance_insights_enabled=True if self.environment != "dev" else False,
                performance_insights_retention_period=7 if self.environment != "dev" else 0,
                monitoring_interval=60 if self.environment != "dev" else 0,
                monitoring_role_arn=self._create_monitoring_role().arn if self.environment != "dev" else None,
                tags={"Name": f"{name}-aurora-instance-{i+1}"}
            )
            self.instances.append(instance)
        
        # Store connection info in Parameter Store
        aws.ssm.Parameter(
            f"{name}-db-endpoint",
            type="String",
            value=self.cluster.endpoint,
            tags={"Name": f"{name}-db-endpoint"}
        )
        
        aws.ssm.Parameter(
            f"{name}-db-name",
            type="String",
            value=self.db_name,
            tags={"Name": f"{name}-db-name"}
        )
        
        aws.ssm.Parameter(
            f"{name}-db-username",
            type="String",
            value=self.db_username,
            tags={"Name": f"{name}-db-username"}
        )
        
        self.db_secret_arn = db_password.arn
        self.endpoint = self.cluster.endpoint
        self.reader_endpoint = self.cluster.reader_endpoint
    
    def _create_monitoring_role(self):
        """Create IAM role for RDS Enhanced Monitoring"""
        role = aws.iam.Role(
            f"{self.name}-rds-monitoring-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "monitoring.rds.amazonaws.com"},
                    "Effect": "Allow"
                }]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.name}-rds-monitoring-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        )
        
        return role

