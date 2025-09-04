``````python
"""
Issue 1: AutoScalingGroup CPU Metric - Corrected Implementation
"""
def _create_monitoring_and_logging(self):
    """
    Creates CloudWatch Alarms and S3 bucket for centralized logging
    """
    # Create S3 bucket for centralized logging
    self.logging_bucket = s3.Bucket(
        self, "CentralizedLoggingBucket",
        bucket_name=f"production-logs-{self.account}-{self.region}",
        versioned=True,
        encryption=s3.BucketEncryption.S3_MANAGED,
        public_read_access=False,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        lifecycle_rules=[
            s3.LifecycleRule(
                id="DeleteOldLogs",
                enabled=True,
                expiration=Duration.days(90)
            )
        ],
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True
    )

    # Add bucket policy for secure access
    bucket_policy_statement = iam.PolicyStatement(
        sid="DenyInsecureConnections",
        effect=iam.Effect.DENY,
        principals=[iam.AnyPrincipal()],
        actions=["s3:*"],
        resources=[
            self.logging_bucket.bucket_arn,
            f"{self.logging_bucket.bucket_arn}/*"
        ],
        conditions={
            "Bool": {
                "aws:SecureTransport": "false"
            }
        }
    )
    self.logging_bucket.add_to_resource_policy(bucket_policy_statement)

    # Create CloudWatch Log Group
    log_group = logs.LogGroup(
        self, "ApplicationLogGroup",
        log_group_name="/aws/ec2/production",
        retention=logs.RetentionDays.ONE_MONTH,
        removal_policy=RemovalPolicy.DESTROY
    )

    # FIXED: Create CloudWatch Alarm for Auto Scaling Group CPU utilization
    # ASG doesn't have metric_cpu_utilization() method, need to create manually
    asg_cpu_metric = cloudwatch.Metric(
        namespace="AWS/EC2",
        metric_name="CPUUtilization",
        dimensions_map={
            "AutoScalingGroupName": self.asg.auto_scaling_group_name
        },
        statistic="Average",
        period=Duration.minutes(5)
    )

    cpu_alarm = cloudwatch.Alarm(
        self, "HighCPUAlarm",
        alarm_name="Production-High-CPU-Utilization",
        alarm_description="Alarm when CPU exceeds 70%",
        metric=asg_cpu_metric,
        threshold=70,
        evaluation_periods=2,
        datapoints_to_alarm=2,
        treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    )

    # Create CloudWatch Alarm for RDS CPU utilization
    rds_cpu_alarm = cloudwatch.Alarm(
        self, "RDSHighCPUAlarm",
        alarm_name="Production-RDS-High-CPU",
        alarm_description="Alarm when RDS CPU exceeds 70%",
        metric=self.rds_instance.metric_cpu_utilization(),
        threshold=70,
        evaluation_periods=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    )

    # Create CloudWatch Alarm for ALB target health
    alb_unhealthy_targets = cloudwatch.Alarm(
        self, "ALBUnhealthyTargets",
        alarm_name="Production-ALB-Unhealthy-Targets",
        alarm_description="Alarm when ALB has unhealthy targets",
        metric=cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="UnHealthyHostCount",
            dimensions_map={
                "LoadBalancer": self.alb.load_balancer_full_name
            },
            statistic="Average",
            period=Duration.minutes(1)
        ),
        threshold=1,
        evaluation_periods=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
    )

"""
Issue 2 & 3: RDS Configuration Fixes
"""
def _create_database_layer(self) -> rds.DatabaseInstance:
    """
    Creates RDS instance with automated backups in private subnets
    """
    # Create DB subnet group
    db_subnet_group = rds.SubnetGroup(
        self, "DatabaseSubnetGroup",
        description="Subnet group for RDS database",
        vpc=self.vpc,
        vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
        )
    )

    # Create RDS instance
    rds_instance = rds.DatabaseInstance(
        self, "ProductionDatabase",
        engine=rds.DatabaseInstanceEngine.mysql(
            version=rds.MysqlEngineVersion.VER_8_0
        ),
        instance_type=ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
        ),
        vpc=self.vpc,
        subnet_group=db_subnet_group,
        security_groups=[self.rds_sg],
        database_name="productiondb",
        credentials=rds.Credentials.from_generated_secret(
            "dbadmin",
            secret_name="production-db-credentials"
        ),
        # Automated backups configuration
        backup_retention=Duration.days(7),
        delete_automated_backups=False,
        deletion_protection=True,
        # Multi-AZ deployment for production
        multi_az=True,
        # Storage configuration
        allocated_storage=20,
        storage_type=rds.StorageType.GP2,
        storage_encrypted=True,
        # FIXED: Monitoring interval as integer seconds instead of Duration
        monitoring_interval=60,  # 1 minute in seconds
        enable_performance_insights=True,
        performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
        # Maintenance window
        preferred_backup_window="03:00-04:00",
        preferred_maintenance_window="sun:04:00-sun:05:00",
        # Remove instance on stack deletion (change for production)
        removal_policy=RemovalPolicy.DESTROY
    )

    return rds_instance

"""
Issue 2: Fixed CfnOutput for RDS Endpoint
"""
def _create_outputs(self):
    """
    Creates CloudFormation outputs for key resources
    """
    # VPC Outputs
    CfnOutput(
        self, "VPCId",
        value=self.vpc.vpc_id,
        description="VPC ID",
        export_name="Production-VPC-ID"
    )

    CfnOutput(
        self, "VPCCidr",
        value=self.vpc.vpc_cidr_block,
        description="VPC CIDR Block",
        export_name="Production-VPC-CIDR"
    )

    # ALB Outputs
    CfnOutput(
        self, "LoadBalancerDNS",
        value=self.alb.load_balancer_dns_name,
        description="Application Load Balancer DNS Name",
        export_name="Production-ALB-DNS"
    )

    CfnOutput(
        self, "LoadBalancerURL",
        value=f"http://{self.alb.load_balancer_dns_name}",
        description="Application URL",
        export_name="Production-App-URL"
    )

    # FIXED: RDS Outputs with proper type conversion
    CfnOutput(
        self, "DatabaseEndpoint",
        value=self.rds_instance.instance_endpoint.hostname,
        description="RDS Database Endpoint",
        export_name="Production-DB-Endpoint"
    )

    # FIXED: Convert port number to string for CfnOutput
    CfnOutput(
        self, "DatabasePort",
        value=str(self.rds_instance.instance_endpoint.port),
        description="RDS Database Port",
        export_name="Production-DB-Port"
    )

    # Database connection string output
    CfnOutput(
        self, "DatabaseConnectionString",
        value=f"{self.rds_instance.instance_endpoint.hostname}:{self.rds_instance.instance_endpoint.port}",
        description="RDS Database Connection String",
        export_name="Production-DB-Connection"
    )

    # S3 Outputs
    CfnOutput(
        self, "LoggingBucketName",
        value=self.logging_bucket.bucket_name,
        description="Centralized Logging S3 Bucket",
        export_name="Production-Logging-Bucket"
    )

    # Auto Scaling Group Output
    CfnOutput(
        self, "AutoScalingGroupName",
        value=self.asg.auto_scaling_group_name,
        description="Auto Scaling Group Name",
        export_name="Production-ASG-Name"
    )
