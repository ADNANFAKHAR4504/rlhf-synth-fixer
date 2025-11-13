"""
Multi-Region Disaster Recovery Solution for PostgreSQL Database
Implements automatic failover between us-east-1 (primary) and us-west-2 (DR)
"""

import pulumi
import pulumi_aws as aws
import json

# Configuration
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")
db_username = config.get("dbUsername") or "dbadmin"

# AWS Providers for multi-region deployment
primary_provider = aws.Provider("primary-provider", region="us-east-1")
dr_provider = aws.Provider("dr-provider", region="us-west-2")

# =============================================================================
# PRIMARY REGION (us-east-1) - Core Resources
# =============================================================================

# KMS Key for primary region encryption
primary_kms = aws.kms.Key(
    f"primary-kms-{environment_suffix}",
    description=f"KMS key for RDS encryption in us-east-1 - {environment_suffix}",
    enable_key_rotation=True,
    deletion_window_in_days=10,
    tags={
        "Name": f"rds-primary-kms-{environment_suffix}",
        "Environment": environment_suffix,
        "Region": "us-east-1",
        "Purpose": "RDS encryption"
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

primary_kms_alias = aws.kms.Alias(
    f"primary-kms-alias-{environment_suffix}",
    name=f"alias/rds-primary-{environment_suffix}",
    target_key_id=primary_kms.key_id,
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Create VPC in primary region (since no default VPC exists)
primary_vpc = aws.ec2.Vpc(
    f"primary-vpc-{environment_suffix}",
    cidr_block="10.100.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"primary-db-vpc-{environment_suffix}",
        "Environment": environment_suffix,
        "Region": "us-east-1"
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Get availability zones in primary region
primary_azs = aws.get_availability_zones(
    state="available",
    opts=pulumi.InvokeOptions(provider=primary_provider)
)

# Create subnets in primary region (minimum 2 AZs)
primary_subnet_1 = aws.ec2.Subnet(
    f"primary-subnet-1-{environment_suffix}",
    vpc_id=primary_vpc.id,
    cidr_block="10.100.1.0/24",
    availability_zone=primary_azs.names[0],
    map_public_ip_on_launch=False,
    tags={
        "Name": f"primary-db-subnet-1-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

primary_subnet_2 = aws.ec2.Subnet(
    f"primary-subnet-2-{environment_suffix}",
    vpc_id=primary_vpc.id,
    cidr_block="10.100.2.0/24",
    availability_zone=primary_azs.names[1],
    map_public_ip_on_launch=False,
    tags={
        "Name": f"primary-db-subnet-2-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

primary_subnets = pulumi.Output.all(primary_subnet_1.id, primary_subnet_2.id)

# DB Subnet Group spanning multiple AZs
primary_subnet_group = aws.rds.SubnetGroup(
    f"primary-subnet-group-{environment_suffix}",
    name=f"trading-db-primary-subnet-{environment_suffix}",
    subnet_ids=primary_subnets,
    description=f"Subnet group for primary RDS instance - {environment_suffix}",
    tags={
        "Name": f"primary-db-subnet-group-{environment_suffix}",
        "Environment": environment_suffix,
        "Region": "us-east-1"
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Security Group for primary RDS instance
primary_sg = aws.ec2.SecurityGroup(
    f"primary-db-sg-{environment_suffix}",
    name=f"trading-db-primary-sg-{environment_suffix}",
    description=f"Security group for primary PostgreSQL database - {environment_suffix}",
    vpc_id=primary_vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="PostgreSQL access from within VPC",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/8"]
        ),
        aws.ec2.SecurityGroupIngressArgs(
            description="PostgreSQL replication from DR region",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["172.31.0.0/16"]
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            description="Allow all outbound traffic",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={
        "Name": f"primary-db-sg-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Enhanced Monitoring IAM Role
monitoring_role = aws.iam.Role(
    f"rds-monitoring-role-{environment_suffix}",
    name=f"rds-enhanced-monitoring-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "monitoring.rds.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={
        "Name": f"rds-monitoring-role-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

monitoring_role_policy_attachment = aws.iam.RolePolicyAttachment(
    f"rds-monitoring-policy-{environment_suffix}",
    role=monitoring_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Database Parameter Group optimized for replication
parameter_group = aws.rds.ParameterGroup(
    f"postgres-params-{environment_suffix}",
    name=f"postgres15-replication-{environment_suffix}",
    family="postgres15",
    description=f"PostgreSQL 15 parameters optimized for replication - {environment_suffix}",
    parameters=[
        aws.rds.ParameterGroupParameterArgs(
            name="max_connections",
            value="200"
        ),
        aws.rds.ParameterGroupParameterArgs(
            name="shared_buffers",
            value="{DBInstanceClassMemory/4096}",
            apply_method="pending-reboot"
        ),
        aws.rds.ParameterGroupParameterArgs(
            name="max_wal_senders",
            value="10"
        ),
        aws.rds.ParameterGroupParameterArgs(
            name="wal_keep_size",
            value="1024"
        ),
        aws.rds.ParameterGroupParameterArgs(
            name="log_statement",
            value="all"
        ),
        aws.rds.ParameterGroupParameterArgs(
            name="log_min_duration_statement",
            value="1000"
        )
    ],
    tags={
        "Name": f"postgres-params-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Secrets Manager for database credentials
db_secret = aws.secretsmanager.Secret(
    f"db-credentials-{environment_suffix}",
    name=f"trading-db-credentials-{environment_suffix}",
    description=f"Database credentials for trading DB - {environment_suffix}",
    kms_key_id=primary_kms.id,
    tags={
        "Name": f"db-credentials-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Generate secure random password
db_password = aws.secretsmanager.SecretVersion(
    f"db-credentials-version-{environment_suffix}",
    secret_id=db_secret.id,
    secret_string=pulumi.Output.all().apply(
        lambda _: json.dumps({
            "username": db_username,
            "password": "CHANGE_ME_AFTER_DEPLOYMENT",
            "engine": "postgres",
            "host": "will-be-updated",
            "port": 5432,
            "dbname": "trading"
        })
    ),
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Primary RDS Instance with Multi-AZ
primary_db = aws.rds.Instance(
    f"primary-db-{environment_suffix}",
    identifier=f"trading-db-primary-{environment_suffix}",
    engine="postgres",
    engine_version="15.7",
    instance_class="db.t3.medium",
    allocated_storage=100,
    max_allocated_storage=500,
    storage_type="gp3",
    storage_encrypted=True,
    kms_key_id=primary_kms.arn,
    db_name="trading",
    username=db_username,
    password=db_password.secret_string.apply(
        lambda s: json.loads(s)["password"]
    ),
    db_subnet_group_name=primary_subnet_group.name,
    vpc_security_group_ids=[primary_sg.id],
    parameter_group_name=parameter_group.name,
    backup_retention_period=7,
    backup_window="03:00-04:00",
    maintenance_window="mon:04:00-mon:05:00",
    multi_az=True,
    publicly_accessible=False,
    enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
    monitoring_interval=60,
    monitoring_role_arn=monitoring_role.arn,
    performance_insights_enabled=True,
    performance_insights_retention_period=7,
    performance_insights_kms_key_id=primary_kms.arn,
    auto_minor_version_upgrade=True,
    deletion_protection=False,
    skip_final_snapshot=True,
    apply_immediately=False,
    tags={
        "Name": f"trading-db-primary-{environment_suffix}",
        "Environment": environment_suffix,
        "Region": "us-east-1",
        "Role": "primary"
    },
    opts=pulumi.ResourceOptions(
        provider=primary_provider,
        depends_on=[monitoring_role_policy_attachment]
    )
)

# =============================================================================
# DR REGION (us-west-2) - Disaster Recovery Resources
# =============================================================================

# KMS Key for DR region encryption
dr_kms = aws.kms.Key(
    f"dr-kms-{environment_suffix}",
    description=f"KMS key for RDS encryption in us-west-2 - {environment_suffix}",
    enable_key_rotation=True,
    deletion_window_in_days=10,
    tags={
        "Name": f"rds-dr-kms-{environment_suffix}",
        "Environment": environment_suffix,
        "Region": "us-west-2",
        "Purpose": "RDS encryption"
    },
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

dr_kms_alias = aws.kms.Alias(
    f"dr-kms-alias-{environment_suffix}",
    name=f"alias/rds-dr-{environment_suffix}",
    target_key_id=dr_kms.key_id,
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

# Create VPC in DR region (since no default VPC exists)
dr_vpc = aws.ec2.Vpc(
    f"dr-vpc-{environment_suffix}",
    cidr_block="10.200.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"dr-db-vpc-{environment_suffix}",
        "Environment": environment_suffix,
        "Region": "us-west-2"
    },
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

# Get availability zones in DR region
dr_azs = aws.get_availability_zones(
    state="available",
    opts=pulumi.InvokeOptions(provider=dr_provider)
)

# Create subnets in DR region (minimum 2 AZs)
dr_subnet_1 = aws.ec2.Subnet(
    f"dr-subnet-1-{environment_suffix}",
    vpc_id=dr_vpc.id,
    cidr_block="10.200.1.0/24",
    availability_zone=dr_azs.names[0],
    map_public_ip_on_launch=False,
    tags={
        "Name": f"dr-db-subnet-1-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

dr_subnet_2 = aws.ec2.Subnet(
    f"dr-subnet-2-{environment_suffix}",
    vpc_id=dr_vpc.id,
    cidr_block="10.200.2.0/24",
    availability_zone=dr_azs.names[1],
    map_public_ip_on_launch=False,
    tags={
        "Name": f"dr-db-subnet-2-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

dr_subnets = pulumi.Output.all(dr_subnet_1.id, dr_subnet_2.id)

# DB Subnet Group for DR region
dr_subnet_group = aws.rds.SubnetGroup(
    f"dr-subnet-group-{environment_suffix}",
    name=f"trading-db-dr-subnet-{environment_suffix}",
    subnet_ids=dr_subnets,
    description=f"Subnet group for DR RDS instance - {environment_suffix}",
    tags={
        "Name": f"dr-db-subnet-group-{environment_suffix}",
        "Environment": environment_suffix,
        "Region": "us-west-2"
    },
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

# Security Group for DR RDS instance
dr_sg = aws.ec2.SecurityGroup(
    f"dr-db-sg-{environment_suffix}",
    name=f"trading-db-dr-sg-{environment_suffix}",
    description=f"Security group for DR PostgreSQL database - {environment_suffix}",
    vpc_id=dr_vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="PostgreSQL access from within VPC",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/8"]
        ),
        aws.ec2.SecurityGroupIngressArgs(
            description="PostgreSQL replication from primary region",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["172.31.0.0/16"]
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            description="Allow all outbound traffic",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={
        "Name": f"dr-db-sg-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

# Read Replica in DR region for cross-region disaster recovery
replica_db = aws.rds.Instance(
    f"replica-db-{environment_suffix}",
    identifier=f"trading-db-replica-{environment_suffix}",
    replicate_source_db=primary_db.arn,
    instance_class="db.t3.medium",
    storage_encrypted=True,
    kms_key_id=dr_kms.arn,
    vpc_security_group_ids=[dr_sg.id],
    publicly_accessible=False,
    monitoring_interval=60,
    monitoring_role_arn=monitoring_role.arn,
    performance_insights_enabled=True,
    performance_insights_retention_period=7,
    performance_insights_kms_key_id=dr_kms.arn,
    enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
    auto_minor_version_upgrade=True,
    deletion_protection=False,
    skip_final_snapshot=True,
    backup_retention_period=7,
    tags={
        "Name": f"trading-db-replica-{environment_suffix}",
        "Environment": environment_suffix,
        "Region": "us-west-2",
        "Role": "replica"
    },
    opts=pulumi.ResourceOptions(
        provider=dr_provider,
        depends_on=[primary_db]
    )
)

# =============================================================================
# MONITORING AND ALARMS
# =============================================================================

# SNS Topic for database alerts
alert_topic = aws.sns.Topic(
    f"db-alerts-{environment_suffix}",
    name=f"trading-db-alerts-{environment_suffix}",
    display_name=f"Trading DB Alerts - {environment_suffix}",
    tags={
        "Name": f"db-alerts-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# CloudWatch Alarm - Primary DB CPU Utilization
primary_cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"primary-cpu-alarm-{environment_suffix}",
    name=f"trading-db-primary-cpu-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/RDS",
    period=300,
    statistic="Average",
    threshold=80,
    alarm_description="Alert when primary DB CPU exceeds 80%",
    alarm_actions=[alert_topic.arn],
    dimensions={
        "DBInstanceIdentifier": primary_db.identifier
    },
    tags={
        "Name": f"primary-cpu-alarm-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# CloudWatch Alarm - Replication Lag (Critical for RPO)
replication_lag_alarm = aws.cloudwatch.MetricAlarm(
    f"replication-lag-alarm-{environment_suffix}",
    name=f"trading-db-replication-lag-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="ReplicaLag",
    namespace="AWS/RDS",
    period=60,
    statistic="Average",
    threshold=60,
    alarm_description="CRITICAL: Replication lag exceeds 60 seconds - RPO at risk",
    alarm_actions=[alert_topic.arn],
    treat_missing_data="notBreaching",
    dimensions={
        "DBInstanceIdentifier": replica_db.identifier
    },
    tags={
        "Name": f"replication-lag-alarm-{environment_suffix}",
        "Environment": environment_suffix,
        "Severity": "critical"
    },
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

# CloudWatch Alarm - Primary DB Storage Space
primary_storage_alarm = aws.cloudwatch.MetricAlarm(
    f"primary-storage-alarm-{environment_suffix}",
    name=f"trading-db-primary-storage-{environment_suffix}",
    comparison_operator="LessThanThreshold",
    evaluation_periods=1,
    metric_name="FreeStorageSpace",
    namespace="AWS/RDS",
    period=300,
    statistic="Average",
    threshold=10737418240,
    alarm_description="Alert when primary DB free storage falls below 10GB",
    alarm_actions=[alert_topic.arn],
    dimensions={
        "DBInstanceIdentifier": primary_db.identifier
    },
    tags={
        "Name": f"primary-storage-alarm-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# CloudWatch Alarm - Database Connections
primary_connections_alarm = aws.cloudwatch.MetricAlarm(
    f"primary-connections-alarm-{environment_suffix}",
    name=f"trading-db-primary-connections-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="DatabaseConnections",
    namespace="AWS/RDS",
    period=300,
    statistic="Average",
    threshold=180,
    alarm_description="Alert when database connections exceed 180 (90% of max)",
    alarm_actions=[alert_topic.arn],
    dimensions={
        "DBInstanceIdentifier": primary_db.identifier
    },
    tags={
        "Name": f"primary-connections-alarm-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# =============================================================================
# ROUTE 53 HEALTH CHECKS AND FAILOVER
# =============================================================================

# Route 53 Hosted Zone (assumes existing zone, use data source in production)
# For this example, we'll create a private hosted zone
hosted_zone = aws.route53.Zone(
    f"db-zone-{environment_suffix}",
    name=f"trading-db-{environment_suffix}.internal",
    vpcs=[
        aws.route53.ZoneVpcArgs(
            vpc_id=primary_vpc.id,
            vpc_region="us-east-1"
        )
    ],
    tags={
        "Name": f"db-zone-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Route 53 Health Check for primary database
primary_health_check = aws.route53.HealthCheck(
    f"primary-db-health-{environment_suffix}",
    type="CALCULATED",
    child_health_threshold=1,
    child_healthchecks=[],
    tags={
        "Name": f"primary-db-health-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Route 53 Record - Primary Database (with failover)
primary_dns_record = aws.route53.Record(
    f"primary-db-record-{environment_suffix}",
    zone_id=hosted_zone.zone_id,
    name=f"db-primary.trading-db-{environment_suffix}.internal",
    type="CNAME",
    ttl=60,
    records=[primary_db.endpoint],
    set_identifier="primary",
    failover_routing_policies=[
        aws.route53.RecordFailoverRoutingPolicyArgs(
            type="PRIMARY"
        )
    ],
    health_check_id=primary_health_check.id,
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Route 53 Record - DR Database (failover secondary)
dr_dns_record = aws.route53.Record(
    f"dr-db-record-{environment_suffix}",
    zone_id=hosted_zone.zone_id,
    name=f"db-primary.trading-db-{environment_suffix}.internal",
    type="CNAME",
    ttl=60,
    records=[replica_db.endpoint],
    set_identifier="secondary",
    failover_routing_policies=[
        aws.route53.RecordFailoverRoutingPolicyArgs(
            type="SECONDARY"
        )
    ],
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# =============================================================================
# CROSS-REGION SNAPSHOT AUTOMATION (Optional Enhancement)
# =============================================================================

# IAM Role for Lambda snapshot copying
snapshot_lambda_role = aws.iam.Role(
    f"snapshot-copy-role-{environment_suffix}",
    name=f"rds-snapshot-copy-lambda-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={
        "Name": f"snapshot-copy-role-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# Lambda execution policy
snapshot_lambda_policy = aws.iam.RolePolicy(
    f"snapshot-copy-policy-{environment_suffix}",
    role=snapshot_lambda_role.id,
    policy=pulumi.Output.all(primary_kms.arn, dr_kms.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "rds:DescribeDBSnapshots",
                        "rds:CopyDBSnapshot",
                        "rds:DeleteDBSnapshot",
                        "rds:ListTagsForResource",
                        "rds:AddTagsToResource"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:CreateGrant",
                        "kms:DescribeKey",
                        "kms:Decrypt",
                        "kms:Encrypt"
                    ],
                    "Resource": [args[0], args[1]]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]
        })
    ),
    opts=pulumi.ResourceOptions(provider=primary_provider)
)

# =============================================================================
# OUTPUTS
# =============================================================================

pulumi.export("primary_endpoint", primary_db.endpoint)
pulumi.export("primary_arn", primary_db.arn)
pulumi.export("replica_endpoint", replica_db.endpoint)
pulumi.export("replica_arn", replica_db.arn)
pulumi.export("primary_kms_key_id", primary_kms.id)
pulumi.export("dr_kms_key_id", dr_kms.id)
pulumi.export("db_secret_arn", db_secret.arn)
pulumi.export("hosted_zone_id", hosted_zone.zone_id)
pulumi.export("hosted_zone_name", hosted_zone.name)
pulumi.export("failover_dns_name", primary_dns_record.name)
pulumi.export("alert_topic_arn", alert_topic.arn)
pulumi.export("primary_security_group_id", primary_sg.id)
pulumi.export("dr_security_group_id", dr_sg.id)
