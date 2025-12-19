I need to create an AWS CDK v2 Python stack for a high-availability RDS PostgreSQL database for an e-commerce application. Let me break down the requirements:

1. PostgreSQL database for e-commerce app with 30,000 daily orders and read-heavy workload
2. Primary instance (db.m5.large) with read replicas across two AZs
3. Security Groups allowing port 5432
4. KMS encryption for data at rest
5. CloudWatch for metrics and monitoring
6. S3 for automated backups
7. IAM roles with least-privilege access
8. Fully deployable CDK program in Python

I'll create a file called `rds_stack.py` that includes all these requirements. Let me construct it step by step.

First, let's set up the imports and basic stack structure:

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_kms as kms,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
)
from constructs import Construct

class EcommerceRdsStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Stack implementation goes here
```

Now, let's implement the components:

1. Create a VPC with 2 AZs:

```python
vpc = ec2.Vpc(
    self, "EcommerceVPC",
    max_azs=2,
    nat_gateways=2,
)
```

2. Create a security group for the RDS instance:

```python
db_security_group = ec2.SecurityGroup(
    self, "DatabaseSecurityGroup",
    vpc=vpc,
    description="Security group for the PostgreSQL database",
    allow_all_outbound=True,
)

db_security_group.add_ingress_rule(
    peer=ec2.Peer.any_ipv4(),
    connection=ec2.Port.tcp(5432),
    description="Allow PostgreSQL traffic on port 5432",
)
```

3. Create a KMS key for encryption:

```python
database_key = kms.Key(
    self, "DatabaseEncryptionKey",
    enable_key_rotation=True,
    description="KMS key for RDS database encryption",
    removal_policy=RemovalPolicy.RETAIN,
)
```

4. Create an S3 bucket for automated backups:

```python
backup_bucket = s3.Bucket(
    self, "RdsBackupBucket",
    encryption=s3.BucketEncryption.KMS,
    encryption_key=database_key,
    versioned=True,
    removal_policy=RemovalPolicy.RETAIN,
    block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
    enforce_ssl=True,
)
```

5. Create IAM role for RDS with least privilege:

```python
rds_role = iam.Role(
    self, "RdsRole",
    assumed_by=iam.ServicePrincipal("rds.amazonaws.com"),
    description="Role for RDS to access S3 bucket for backups",
)

backup_bucket.grant_read_write(rds_role)
```

6. Create the PostgreSQL database with read replicas:

```python
parameter_group = rds.ParameterGroup(
    self, "PostgreSQLParameterGroup",
    engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_13_7),
    description="Parameter group for PostgreSQL database",
)

# Primary instance
primary_instance = rds.DatabaseInstance(
    self, "PrimaryDatabase",
    engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_13_7),
    instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
    vpc=vpc,
    vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
    security_groups=[db_security_group],
    storage_encrypted=True,
    storage_encryption_key=database_key,
    multi_az=True,
    automated_backup_retention=7,
    backup_retention=Duration.days(30),
    deletion_protection=True,
    parameter_group=parameter_group,
    removal_policy=RemovalPolicy.SNAPSHOT,
    database_name="ecommerce",
    credentials=rds.Credentials.from_generated_secret("postgres", secret_name="ecommerce-db-credentials"),
    instance_identifier="ecommerce-primary",
    preferred_backup_window="00:00-02:00",
    preferred_maintenance_window="sun:04:00-sun:06:00",
    cloudwatch_logs_exports=["postgresql", "upgrade"],
    cloudwatch_logs_retention=7,
    enable_performance_insights=True,
    performance_insight_retention=7,
)

# Read replicas across two AZs
for i, az in enumerate(vpc.availability_zones[:2]):
    read_replica = rds.DatabaseInstanceReadReplica(
        self, f"ReadReplica{i+1}",
        source_database_instance=primary_instance,
        instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
        vpc=vpc,
        vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS, availability_zones=[az]),
        security_groups=[db_security_group],
        encryption_key=database_key,
        parameter_group=parameter_group,
        instance_identifier=f"ecommerce-replica-{i+1}",
        enable_performance_insights=True,
        performance_insight_retention=7,
        cloudwatch_logs_exports=["postgresql", "upgrade"],
        cloudwatch_logs_retention=7,
    )
```

7. Add CloudWatch alarms for monitoring:

```python
# CPU Utilization alarm
cpu_alarm = cloudwatch.Alarm(
    self, "CPUUtilizationAlarm",
    metric=primary_instance.metric_cpu_utilization(),
    evaluation_periods=3,
    threshold=80,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    alarm_description="Alarm if CPU utilization is greater than 80% for 3 consecutive periods",
)

# Free storage space alarm
storage_alarm = cloudwatch.Alarm(
    self, "FreeStorageSpaceAlarm",
    metric=primary_instance.metric("FreeStorageSpace"),
    evaluation_periods=3,
    threshold=10 * 1024 * 1024 * 1024,  # 10 GB in bytes
    comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    alarm_description="Alarm if free storage space is less than 10 GB for 3 consecutive periods",
)

# Database connections alarm
connections_alarm = cloudwatch.Alarm(
    self, "DatabaseConnectionsAlarm",
    metric=primary_instance.metric("DatabaseConnections"),
    evaluation_periods=3,
    threshold=100,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    alarm_description="Alarm if number of connections exceeds 100 for 3 consecutive periods",
)

# Replica lag alarm for each read replica
for i in range(2):
    replica_lag_alarm = cloudwatch.Alarm(
        self, f"ReplicaLagAlarm{i+1}",
        metric=cloudwatch.Metric(
            namespace="AWS/RDS",
            metric_name="ReplicaLag",
            dimensions_map={
                "DBInstanceIdentifier": f"ecommerce-replica-{i+1}"
            },
            statistic="Average",
            period=Duration.minutes(5)
        ),
        evaluation_periods=3,
        threshold=60,  # 60 seconds of lag
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarm_description=f"Alarm if replica {i+1} lag exceeds 60 seconds for 3 consecutive periods",
    )
```

8. Export outputs:

```python
# Export important information
from aws_cdk import CfnOutput

CfnOutput(self, "PrimaryDBEndpoint", value=primary_instance.db_instance_endpoint_address)
CfnOutput(self, "PrimaryDBPort", value=primary_instance.db_instance_endpoint_port)
CfnOutput(self, "DBSecretName", value=primary_instance.secret.secret_name)
```

Let's combine all this into a complete CDK stack file and add a proper CDK app entry point:

Now, I need to put it all together into the requested file name `tap_stack.py`:

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_kms as kms,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct

class EcommerceRdsStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # 1. Create a VPC with 2 AZs
        vpc = ec2.Vpc(
            self, "EcommerceVPC",
            max_azs=2,
            nat_gateways=2,
        )

        # 2. Create a security group for the RDS instance
        db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=vpc,
            description="Security group for the PostgreSQL database",
            allow_all_outbound=True,
        )

        db_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL traffic on port 5432",
        )

        # 3. Create a KMS key for encryption
        database_key = kms.Key(
            self, "DatabaseEncryptionKey",
            enable_key_rotation=True,
            description="KMS key for RDS database encryption",
            removal_policy=RemovalPolicy.RETAIN,
        )

        # 4. Create an S3 bucket for automated backups
        backup_bucket = s3.Bucket(
            self, "RdsBackupBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=database_key,
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
        )

        # 5. Create IAM role for RDS with least privilege
        rds_role = iam.Role(
            self, "RdsRole",
            assumed_by=iam.ServicePrincipal("rds.amazonaws.com"),
            description="Role for RDS to access S3 bucket for backups",
        )

        backup_bucket.grant_read_write(rds_role)

        # 6. Create the PostgreSQL database with read replicas
        parameter_group = rds.ParameterGroup(
            self, "PostgreSQLParameterGroup",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_13_7),
            description="Parameter group for PostgreSQL database",
        )

        # Primary instance
        primary_instance = rds.DatabaseInstance(
            self, "PrimaryDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_13_7),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[db_security_group],
            storage_encrypted=True,
            storage_encryption_key=database_key,
            multi_az=True,
            automated_backup_retention=7,
            backup_retention=Duration.days(30),
            deletion_protection=True,
            parameter_group=parameter_group,
            removal_policy=RemovalPolicy.SNAPSHOT,
            database_name="ecommerce",
            credentials=rds.Credentials.from_generated_secret("postgres", secret_name="ecommerce-db-credentials"),
            instance_identifier="ecommerce-primary",
            preferred_backup_window="00:00-02:00",
            preferred_maintenance_window="sun:04:00-sun:06:00",
            cloudwatch_logs_exports=["postgresql", "upgrade"],
            cloudwatch_logs_retention=7,
            enable_performance_insights=True,
            performance_insight_retention=7,
        )

        # Read replicas across two AZs
        for i, az in enumerate(vpc.availability_zones[:2]):
            read_replica = rds.DatabaseInstanceReadReplica(
                self, f"ReadReplica{i+1}",
                source_database_instance=primary_instance,
                instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS, availability_zones=[az]),
                security_groups=[db_security_group],
                encryption_key=database_key,
                parameter_group=parameter_group,
                instance_identifier=f"ecommerce-replica-{i+1}",
                enable_performance_insights=True,
                performance_insight_retention=7,
                cloudwatch_logs_exports=["postgresql", "upgrade"],
                cloudwatch_logs_retention=7,
            )

        # 7. Add CloudWatch alarms for monitoring
        # CPU Utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self, "CPUUtilizationAlarm",
            metric=primary_instance.metric_cpu_utilization(),
            evaluation_periods=3,
            threshold=80,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if CPU utilization is greater than 80% for 3 consecutive periods",
        )

        # Free storage space alarm
        storage_alarm = cloudwatch.Alarm(
            self, "FreeStorageSpaceAlarm",
            metric=primary_instance.metric("FreeStorageSpace"),
            evaluation_periods=3,
            threshold=10 * 1024 * 1024 * 1024,  # 10 GB in bytes
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Alarm if free storage space is less than 10 GB for 3 consecutive periods",
        )

        # Database connections alarm
        connections_alarm = cloudwatch.Alarm(
            self, "DatabaseConnectionsAlarm",
            metric=primary_instance.metric("DatabaseConnections"),
            evaluation_periods=3,
            threshold=100,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if number of connections exceeds 100 for 3 consecutive periods",
        )

        # Replica lag alarm for each read replica
        for i in range(2):
            replica_lag_alarm = cloudwatch.Alarm(
                self, f"ReplicaLagAlarm{i+1}",
                metric=cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="ReplicaLag",
                    dimensions_map={
                        "DBInstanceIdentifier": f"ecommerce-replica-{i+1}"
                    },
                    statistic="Average",
                    period=Duration.minutes(5)
                ),
                evaluation_periods=3,
                threshold=60,  # 60 seconds of lag
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"Alarm if replica {i+1} lag exceeds 60 seconds for 3 consecutive periods",
            )

        # Export important information
        CfnOutput(self, "PrimaryDBEndpoint", value=primary_instance.db_instance_endpoint_address)
        CfnOutput(self, "PrimaryDBPort", value=primary_instance.db_instance_endpoint_port)
        CfnOutput(self, "DBSecretName", value=primary_instance.secret.secret_name)
```

Let's refine this a bit more to ensure it meets all the requirements and fix any issues:

1. The database class should be db.m5.large as specified
2. We want to use a more recent PostgreSQL version (14 or higher)
3. The security group should be more restrictive (not open to any IPv4)

Let's make those adjustments:

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_kms as kms,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct

class EcommerceRdsStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # 1. Create a VPC with 2 AZs
        vpc = ec2.Vpc(
            self, "EcommerceVPC",
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # 2. Create an application security group to allow access to DB
        app_security_group = ec2.SecurityGroup(
            self, "ApplicationSecurityGroup",
            vpc=vpc,
            description="Security group for application servers",
            allow_all_outbound=True,
        )

        # 3. Create a security group for the RDS instance
        db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=vpc,
            description="Security group for the PostgreSQL database",
            allow_all_outbound=False,
        )

        # Allow access only from the application security group
        db_security_group.add_ingress_rule(
            peer=app_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL traffic from application servers",
        )

        # 4. Create a KMS key for encryption
        database_key = kms.Key(
            self, "DatabaseEncryptionKey",
            enable_key_rotation=True,
            description="KMS key for RDS database encryption",
            removal_policy=RemovalPolicy.RETAIN,
        )

        # 5. Create an S3 bucket for automated backups
        backup_bucket = s3.Bucket(
            self, "RdsBackupBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=database_key,
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
        )

        # 6. Create IAM role for RDS with least privilege
        rds_role = iam.Role(
            self, "RdsRole",
            assumed_by=iam.ServicePrincipal("rds.amazonaws.com"),
            description="Role for RDS to access S3 bucket for backups",
        )

        backup_bucket.grant_read_write(rds_role)

        # 7. Create the PostgreSQL database with read replicas
        parameter_group = rds.ParameterGroup(
            self, "PostgreSQLParameterGroup",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_14_7),
            description="Parameter group for PostgreSQL database",
            parameters={
                "shared_buffers": "1GB",
                "max_connections": "200",
                "work_mem": "16MB",
                "maintenance_work_mem": "256MB",
                "effective_cache_size": "3GB",
                "synchronous_commit": "off",  # Better performance for read-heavy workloads
            }
        )

        # Subnet group for RDS
        subnet_group = rds.SubnetGroup(
            self, "RdsSubnetGroup",
            description="Subnet group for the PostgreSQL database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
        )

        # Primary instance
        primary_instance = rds.DatabaseInstance(
            self, "PrimaryDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_14_7),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            subnet_group=subnet_group,
            security_groups=[db_security_group],
            storage_encrypted=True,
            storage_encryption_key=database_key,
            allocated_storage=100,
            storage_type=rds.StorageType.GP2,
            multi_az=True,
            automated_backup_retention=7,
            backup_retention=Duration.days(30),
            deletion_protection=True,
            parameter_group=parameter_group,
            removal_policy=RemovalPolicy.SNAPSHOT,
            database_name="ecommerce",
            credentials=rds.Credentials.from_generated_secret("postgres", secret_name="ecommerce-db-credentials"),
            instance_identifier="ecommerce-primary",
            preferred_backup_window="00:00-02:00",
            preferred_maintenance_window="sun:04:00-sun:06:00",
            cloudwatch_logs_exports=["postgresql", "upgrade"],
            enable_performance_insights=True,
            performance_insight_retention=rds.PerformanceInsightRetention.DAYS_7,
            monitoring_interval=Duration.seconds(60),
            monitoring_role=rds_role,
        )

        # Read replicas across two AZs
        for i, az in enumerate(vpc.availability_zones[:2]):
            read_replica = rds.DatabaseInstanceReadReplica(
                self, f"ReadReplica{i+1}",
                source_database_instance=primary_instance,
                instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED, availability_zones=[az]),
                security_groups=[db_security_group],
                encrypted=True,
                parameter_group=parameter_group,
                instance_identifier=f"ecommerce-replica-{i+1}",
                enable_performance_insights=True,
                performance_insight_retention=rds.PerformanceInsightRetention.DAYS_7,
                cloudwatch_logs_exports=["postgresql", "upgrade"],
                monitoring_interval=Duration.seconds(60),
                monitoring_role=rds_role,
            )

        # 8. Add CloudWatch alarms for monitoring
        # CPU Utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self, "CPUUtilizationAlarm",
            metric=primary_instance.metric_cpu_utilization(),
            evaluation_periods=3,
            threshold=80,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if CPU utilization is greater than 80% for 3 consecutive periods",
        )

        # Free storage space alarm
        storage_alarm = cloudwatch.Alarm(
            self, "FreeStorageSpaceAlarm",
            metric=primary_instance.metric("FreeStorageSpace"),
            evaluation_periods=3,
            threshold=10 * 1024 * 1024 * 1024,  # 10 GB in bytes
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Alarm if free storage space is less than 10 GB for 3 consecutive periods",
        )

        # Database connections alarm
        connections_alarm = cloudwatch.Alarm(
            self, "DatabaseConnectionsAlarm",
            metric=primary_instance.metric("DatabaseConnections"),
            evaluation_periods=3,
            threshold=100,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if number of connections exceeds 100 for 3 consecutive periods",
        )

        # Replica lag alarm for each read replica
        for i in range(2):
            replica_lag_alarm = cloudwatch.Alarm(
                self, f"ReplicaLagAlarm{i+1}",
                metric=cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="ReplicaLag",
                    dimensions_map={
                        "DBInstanceIdentifier": f"ecommerce-replica-{i+1}"
                    },
                    statistic="Average",
                    period=Duration.minutes(5)
                ),
                evaluation_periods=3,
                threshold=60,  # 60 seconds of lag
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"Alarm if replica {i+1} lag exceeds 60 seconds for 3 consecutive periods",
            )

        # 9. Export important information
        CfnOutput(self, "PrimaryDBEndpoint", value=primary_instance.db_instance_endpoint_address)
        CfnOutput(self, "PrimaryDBPort", value=primary_instance.db_instance_endpoint_port)
        CfnOutput(self, "DBSecretName", value=primary_instance.secret.secret_name)
```

Oops, there's a small issue here. I think I need to clean up the CDK file for clarity and also fix a few issues:

1. I notice that we're creating both monitoring_role and rds_role, which might be confusing
2. Need to fix the cloudwatch logs retention period
3. I should provide instructions to deploy the stack

Let me create the final version of the file with these fixes:

This looks mostly good, but let me make a few final tweaks to ensure the script is complete and correct:

The stack name should be tap_stack.py as requested, but the class should probably reflect that as well. I'll make that adjustment and fix a few parameters:

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_kms as kms,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct

class EcommerceRdsStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # 1. Create a VPC with 2 AZs
        vpc = ec2.Vpc(
            self, "EcommerceVPC",
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # 2. Create an application security group to allow access to DB
        app_security_group = ec2.SecurityGroup(
            self, "ApplicationSecurityGroup",
            vpc=vpc,
            description="Security group for application servers",
            allow_all_outbound=True,
        )

        # 3. Create a security group for the RDS instance
        db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=vpc,
            description="Security group for the PostgreSQL database",
            allow_all_outbound=False,
        )

        # Allow access only from the application security group
        db_security_group.add_ingress_rule(
            peer=app_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL traffic from application servers",
        )

        # 4. Create a KMS key for encryption
        database_key = kms.Key(
            self, "DatabaseEncryptionKey",
            enable_key_rotation=True,
            description="KMS key for RDS database encryption",
            removal_policy=RemovalPolicy.RETAIN,
        )

        # 5. Create an S3 bucket for automated backups
        backup_bucket = s3.Bucket(
            self, "RdsBackupBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=database_key,
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
        )

        # 6. Create IAM role for RDS with least privilege
        rds_role = iam.Role(
            self, "RdsRole",
            assumed_by=iam.ServicePrincipal("rds.amazonaws.com"),
            description="Role for RDS to access S3 bucket for backups and monitoring",
        )

        # Grant permissions to the role
        backup_bucket.grant_read_write(rds_role)
        rds_role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonRDSEnhancedMonitoringRole"))

        # 7. Create the PostgreSQL database with read replicas
        parameter_group = rds.ParameterGroup(
            self, "PostgreSQLParameterGroup",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_14_7),
            description="Parameter group for PostgreSQL database",
            parameters={
                "shared_buffers": "1GB",
                "max_connections": "200",
                "work_mem": "16MB",
                "maintenance_work_mem": "256MB",
                "effective_cache_size": "3GB",
                "synchronous_commit": "off",  # Better performance for read-heavy workloads
            }
        )

        # Subnet group for RDS
        subnet_group = rds.SubnetGroup(
            self, "RdsSubnetGroup",
            description="Subnet group for the PostgreSQL database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
        )

        # Primary instance
        primary_instance = rds.DatabaseInstance(
            self, "PrimaryDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_14_7),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            subnet_group=subnet_group,
            security_groups=[db_security_group],
            storage_encrypted=True,
            storage_encryption_key=database_key,
            allocated_storage=100,
            storage_type=rds.StorageType.GP2,
            multi_az=True,
            automated_backup_retention=7,
            backup_retention=Duration.days(30),
            deletion_protection=True,
            parameter_group=parameter_group,
            removal_policy=RemovalPolicy.SNAPSHOT,
            database_name="ecommerce",
            credentials=rds.Credentials.from_generated_secret("postgres", secret_name="ecommerce-db-credentials"),
            instance_identifier="ecommerce-primary",
            preferred_backup_window="00:00-02:00",
            preferred_maintenance_window="sun:04:00-sun:06:00",
            cloudwatch_logs_exports=["postgresql", "upgrade"],
            cloudwatch_logs_retention=logs.RetentionDays.ONE_WEEK,
            enable_performance_insights=True,
            performance_insight_retention=rds.PerformanceInsightRetention.DAYS_7,
            monitoring_interval=Duration.seconds(60),
            monitoring_role=rds_role,
        )

        # Read replicas across two AZs
        for i, az in enumerate(vpc.availability_zones[:2]):
            read_replica = rds.DatabaseInstanceReadReplica(
                self, f"ReadReplica{i+1}",
                source_database_instance=primary_instance,
                instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED, availability_zones=[az]),
                security_groups=[db_security_group],
                parameter_group=parameter_group,
                instance_identifier=f"ecommerce-replica-{i+1}",
                enable_performance_insights=True,
                performance_insight_retention=rds.PerformanceInsightRetention.DAYS_7,
                cloudwatch_logs_exports=["postgresql", "upgrade"],
                cloudwatch_logs_retention=logs.RetentionDays.ONE_WEEK,
                monitoring_interval=Duration.seconds(60),
                monitoring_role=rds_role,
            )

        # 8. Add CloudWatch alarms for monitoring
        # CPU Utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self, "CPUUtilizationAlarm",
            metric=primary_instance.metric_cpu_utilization(),
            evaluation_periods=3,
            threshold=80,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if CPU utilization is greater than 80% for 3 consecutive periods",
        )

        # Free storage space alarm
        storage_alarm = cloudwatch.Alarm(
            self, "FreeStorageSpaceAlarm",
            metric=primary_instance.metric("FreeStorageSpace"),
            evaluation_periods=3,
            threshold=10 * 1024 * 1024 * 1024,  # 10 GB in bytes
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Alarm if free storage space is less than 10 GB for 3 consecutive periods",
        )

        # Database connections alarm
        connections_alarm = cloudwatch.Alarm(
            self, "DatabaseConnectionsAlarm",
            metric=primary_instance.metric("DatabaseConnections"),
            evaluation_periods=3,
            threshold=100,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if number of connections exceeds 100 for 3 consecutive periods",
        )

        # Replica lag alarm for each read replica
        for i in range(2):
            replica_lag_alarm = cloudwatch.Alarm(
                self, f"ReplicaLagAlarm{i+1}",
                metric=cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="ReplicaLag",
                    dimensions_map={
                        "DBInstanceIdentifier": f"ecommerce-replica-{i+1}"
                    },
                    statistic="Average",
                    period=Duration.minutes(5)
                ),
                evaluation_periods=3,
                threshold=60,  # 60 seconds of lag
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"Alarm if replica {i+1} lag exceeds 60 seconds for 3 consecutive periods",
            )

        # 9. Export important information
        CfnOutput(self, "PrimaryDBEndpoint", value=primary_instance.db_instance_endpoint_address)
        CfnOutput(self, "PrimaryDBPort", value=primary_instance.db_instance_endpoint_port)
        CfnOutput(self, "DBSecretName", value=primary_instance.secret.secret_name)

# Add the app setup code
if __name__ == '__main__':
    import os
    from aws_cdk import App

    app = App()
    EcommerceRdsStack(app, "EcommerceRdsStack")
    app.synth()
```

Here's my solution for the high-availability RDS PostgreSQL stack:

## tap_stack.py

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_kms as kms,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct


class EcommerceRdsStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # 1. Create a VPC with 2 AZs for high availability
        vpc = ec2.Vpc(
            self, "EcommerceVPC",
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # 2. Create an application security group that will access the DB
        app_security_group = ec2.SecurityGroup(
            self, "ApplicationSecurityGroup",
            vpc=vpc,
            description="Security group for application servers",
            allow_all_outbound=True,
        )

        # 3. Create a security group for the RDS instance
        # Following principle of least privilege - only allow specific access
        db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=vpc,
            description="Security group for the PostgreSQL database",
            allow_all_outbound=False,
        )

        # Allow access only from the application security group on PostgreSQL port
        db_security_group.add_ingress_rule(
            peer=app_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL traffic from application servers",
        )

        # 4. Create a KMS key for encryption of data at rest
        database_key = kms.Key(
            self, "DatabaseEncryptionKey",
            enable_key_rotation=True,
            description="KMS key for RDS database encryption",
            removal_policy=RemovalPolicy.RETAIN,
        )

        # 5. Create an S3 bucket for automated backups
        backup_bucket = s3.Bucket(
            self, "RdsBackupBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=database_key,
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
        )

        # 6. Create IAM role for RDS with least privilege
        rds_role = iam.Role(
            self, "RdsRole",
            assumed_by=iam.ServicePrincipal("rds.amazonaws.com"),
            description="Role for RDS to access S3 bucket for backups and monitoring",
        )

        # Grant minimum required permissions to the RDS role
        backup_bucket.grant_read_write(rds_role)
        rds_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonRDSEnhancedMonitoringRole")
        )

        # 7. Create parameter group optimized for read-heavy e-commerce workload
        parameter_group = rds.ParameterGroup(
            self, "PostgreSQLParameterGroup",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_14_7),
            description="Parameter group for PostgreSQL database",
            parameters={
                "shared_buffers": "1GB",              # Increase shared buffer for better performance
                "max_connections": "200",             # Support many concurrent connections
                "work_mem": "16MB",                   # Memory for query operations
                "maintenance_work_mem": "256MB",      # Memory for maintenance operations
                "effective_cache_size": "3GB",        # Planner estimate of memory available
                "synchronous_commit": "off",          # Better performance for read-heavy workloads
            }
        )

        # Create subnet group for RDS instances
        subnet_group = rds.SubnetGroup(
            self, "RdsSubnetGroup",
            description="Subnet group for the PostgreSQL database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
        )

        # 8. Create the primary RDS instance
        primary_instance = rds.DatabaseInstance(
            self, "PrimaryDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_14_7),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),  # db.m5.large as specified
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            subnet_group=subnet_group,
            security_groups=[db_security_group],
            storage_encrypted=True,
            storage_encryption_key=database_key,
            allocated_storage=100,
            storage_type=rds.StorageType.GP2,
            multi_az=True,                                   # High availability setup
            automated_backup_retention=7,                    # Retain automated backups for 7 days
            backup_retention=Duration.days(30),              # Keep backups for 30 days
            deletion_protection=True,                        # Protect against accidental deletion
            parameter_group=parameter_group,
            removal_policy=RemovalPolicy.SNAPSHOT,           # Create snapshot before removal
            database_name="ecommerce",
            credentials=rds.Credentials.from_generated_secret("postgres", secret_name="ecommerce-db-credentials"),
            instance_identifier="ecommerce-primary",
            preferred_backup_window="00:00-02:00",           # Backup during off-peak hours
            preferred_maintenance_window="sun:04:00-sun:06:00", # Maintenance during off-peak hours
            cloudwatch_logs_exports=["postgresql", "upgrade"],  # Export logs to CloudWatch
            cloudwatch_logs_retention=logs.RetentionDays.ONE_WEEK,
            enable_performance_insights=True,                # Enable performance monitoring
            performance_insight_retention=rds.PerformanceInsightRetention.DAYS_7,
            monitoring_interval=Duration.seconds(60),        # Enhanced monitoring at 1-minute intervals
            monitoring_role=rds_role,
        )

        # 9. Create read replicas across two AZs
        for i, az in enumerate(vpc.availability_zones[:2]):
            read_replica = rds.DatabaseInstanceReadReplica(
                self, f"ReadReplica{i+1}",
                source_database_instance=primary_instance,
                instance_type=ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED, availability_zones=[az]),
                security_groups=[db_security_group],
                parameter_group=parameter_group,
                instance_identifier=f"ecommerce-replica-{i+1}",
                enable_performance_insights=True,
                performance_insight_retention=rds.PerformanceInsightRetention.DAYS_7,
                cloudwatch_logs_exports=["postgresql", "upgrade"],
                cloudwatch_logs_retention=logs.RetentionDays.ONE_WEEK,
                monitoring_interval=Duration.seconds(60),
                monitoring_role=rds_role,
            )

        # 10. Add CloudWatch alarms for monitoring
        # CPU Utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self, "CPUUtilizationAlarm",
            metric=primary_instance.metric_cpu_utilization(),
            evaluation_periods=3,
            threshold=80,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if CPU utilization is greater than 80% for 3 consecutive periods",
        )

        # Free storage space alarm
        storage_alarm = cloudwatch.Alarm(
            self, "FreeStorageSpaceAlarm",
            metric=primary_instance.metric("FreeStorageSpace"),
            evaluation_periods=3,
            threshold=10 * 1024 * 1024 * 1024,  # 10 GB in bytes
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Alarm if free storage space is less than 10 GB for 3 consecutive periods",
        )

        # Database connections alarm
        connections_alarm = cloudwatch.Alarm(
            self, "DatabaseConnectionsAlarm",
            metric=primary_instance.metric("DatabaseConnections"),
            evaluation_periods=3,
            threshold=100,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if number of connections exceeds 100 for 3 consecutive periods",
        )

        # Replica lag alarms
        for i in range(2):
            replica_lag_alarm = cloudwatch.Alarm(
                self, f"ReplicaLagAlarm{i+1}",
                metric=cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="ReplicaLag",
                    dimensions_map={
                        "DBInstanceIdentifier": f"ecommerce-replica-{i+1}"
                    },
                    statistic="Average",
                    period=Duration.minutes(5)
                ),
                evaluation_periods=3,
                threshold=60,  # 60 seconds of lag
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"Alarm if replica {i+1} lag exceeds 60 seconds for 3 consecutive periods",
            )

        # 11. Export important information
        CfnOutput(self, "PrimaryDBEndpoint", value=primary_instance.db_instance_endpoint_address)
        CfnOutput(self, "PrimaryDBPort", value=primary_instance.db_instance_endpoint_port)
        CfnOutput(self, "DBSecretName", value=primary_instance.secret.secret_name)


# Add the app setup code for deployment
if __name__ == '__main__':
    from aws_cdk import App

    app = App()
    EcommerceRdsStack(app, "EcommerceRdsStack")
    app.synth()
```

The stack creates a production-ready PostgreSQL infrastructure with:

- Primary RDS instance (db.m5.large) with Multi-AZ support
- Read replicas distributed across two availability zones
- KMS encryption for data at rest
- Security groups with least-privilege access
- CloudWatch monitoring with comprehensive alarms
- S3 bucket for automated backups
- IAM roles with minimal required permissions

This architecture handles 30,000+ daily e-commerce orders by distributing read queries across replicas while maintaining high availability and security.
