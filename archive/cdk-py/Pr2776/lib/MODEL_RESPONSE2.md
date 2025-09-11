``````python
def create_monitoring_and_logging(self):
    """
    Create CloudWatch alarms and S3 bucket for logging
    """
    # S3 bucket for centralized logging
    log_bucket = s3.Bucket(
        self, "CentralizedLogsBucket",
        bucket_name=f"production-logs-{self.account}-{self.region}",
        versioned=True,
        encryption=s3.BucketEncryption.S3_MANAGED,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        removal_policy=RemovalPolicy.RETAIN,
        lifecycle_rules=[
            s3.LifecycleRule(
                id="LogRetentionRule",
                enabled=True,
                expiration=Duration.days(365),  # Keep logs for 1 year
                transitions=[
                    s3.Transition(
                        storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                        transition_after=Duration.days(30)
                    ),
                    s3.Transition(
                        storage_class=s3.StorageClass.GLACIER,
                        transition_after=Duration.days(90)
                    )
                ]
            )
        ]
    )
    
    # Bucket policy for ALB access logs
    log_bucket.add_to_resource_policy(
        iam.PolicyStatement(
            sid="AWSLogDeliveryWrite",
            effect=iam.Effect.ALLOW,
            principals=[
                iam.ServicePrincipal("delivery.logs.amazonaws.com")
            ],
            actions=["s3:PutObject"],
            resources=[f"{log_bucket.bucket_arn}/*"]
        )
    )
    
    # CloudWatch Log Group for application logs
    log_group = logs.LogGroup(
        self, "ApplicationLogGroup",
        log_group_name="/aws/production/webapp",
        retention=logs.RetentionDays.ONE_MONTH,
        removal_policy=RemovalPolicy.RETAIN
    )
    
    # ✅ FIX 1: Correct way to create AutoScalingGroup CPU metric
    asg_cpu_metric = cloudwatch.Metric(
        namespace="AWS/AutoScaling",
        metric_name="CPUUtilization",
        dimensions_map={
            "AutoScalingGroupName": self.asg.auto_scaling_group_name
        },
        statistic="Average",
        period=Duration.minutes(5)
    )
    
    # CloudWatch Alarms for Auto Scaling Group
    cpu_alarm = cloudwatch.Alarm(
        self, "HighCPUAlarm",
        alarm_name="Production-High-CPU-Utilization",
        alarm_description="Alarm when CPU exceeds 70%",
        metric=asg_cpu_metric,  # ✅ Using the correctly created metric
        threshold=70,
        evaluation_periods=2,
        datapoints_to_alarm=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
    )
    
    # Database CPU alarm (this one was correct, but adding for completeness)
    db_cpu_alarm = cloudwatch.Alarm(
        self, "DatabaseHighCPUAlarm",
        alarm_name="Production-Database-High-CPU",
        alarm_description="Database CPU utilization is high",
        metric=self.database.metric_cpu_utilization(),  # RDS does have this method
        threshold=70,
        evaluation_periods=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    )
    
    # ALB target health alarm
    target_health_alarm = cloudwatch.Alarm(
        self, "UnhealthyTargetsAlarm",
        alarm_name="Production-Unhealthy-Targets",
        alarm_description="ALB has unhealthy targets",
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
    
    return {
        'log_bucket': log_bucket,
        'log_group': log_group,
        'alarms': [cpu_alarm, db_cpu_alarm, target_health_alarm]
    }

def create_database_layer(self):
    """
    Create RDS MySQL instance in private subnets
    """
    # Create DB subnet group
    db_subnet_group = rds.SubnetGroup(
        self, "DatabaseSubnetGroup",
        description="Subnet group for RDS database",
        vpc=self.vpc,
        vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
        ),
        subnet_group_name="production-db-subnet-group"
    )
    
    # ✅ FIX 3: Create RDS instance with correct monitoring interval
    database = rds.DatabaseInstance(
        self, "ProductionDatabase",
        engine=rds.DatabaseInstanceEngine.mysql(
            version=rds.MysqlEngineVersion.VER_8_0_35
        ),
        instance_type=ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
        ),
        vpc=self.vpc,
        subnet_group=db_subnet_group,
        security_groups=[self.security_groups['database']],
        credentials=rds.Credentials.from_generated_secret(
            "dbadmin",
            secret_name="production-db-credentials"
        ),
        database_name="productiondb",
        backup_retention=Duration.days(7),  # This Duration is fine for backup retention
        delete_automated_backups=False,
        deletion_protection=True,
        instance_identifier="production-mysql-db",
        allocated_storage=20,
        storage_encrypted=True,
        multi_az=False,  # Set to True for production HA
        auto_minor_version_upgrade=True,
        removal_policy=RemovalPolicy.RETAIN,
        # ✅ FIX 3: Use integer seconds instead of Duration objects
        monitoring_interval=60,  # 60 seconds = 1 minute (use 0, 1, 5, 10, 15, 30, 60)
        enable_performance_insights=True,
        performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,  # 7 days for free tier
        cloudwatch_logs_exports=["error", "general", "slow-query"]  # Enable log exports
    )
    
    return database

def create_outputs(self):
    """
    Create CloudFormation outputs for important resources
    """
    CfnOutput(
        self, "VPCId",
        value=self.vpc.vpc_id,
        description="VPC ID for the production environment",
        export_name="Production-VPC-ID"
    )
    
    CfnOutput(
        self, "LoadBalancerURL",
        value=f"http://{self.alb.load_balancer_dns_name}",
        description="URL of the Application Load Balancer",
        export_name="Production-ALB-URL"
    )
    
    CfnOutput(
        self, "LoadBalancerDNS",
        value=self.alb.load_balancer_dns_name,
        description="DNS name of the Application Load Balancer",
        export_name="Production-ALB-DNS"
    )
    
    # ✅ FIX 2: Convert RDS endpoint and port to strings
    CfnOutput(
        self, "DatabaseEndpoint",
        value=self.database.instance_endpoint.hostname,
        description="RDS database endpoint hostname",
        export_name="Production-DB-Endpoint"
    )
    
    CfnOutput(
        self, "DatabasePort",
        value=str(self.database.instance_endpoint.port),  # ✅ Convert to string
        description="RDS database port",
        export_name="Production-DB-Port"
    )
    
    CfnOutput(
        self, "DatabaseConnectionString",
        value=f"{self.database.instance_endpoint.hostname}:{str(self.database.instance_endpoint.port)}",  # ✅ Both converted to string
        description="Complete RDS database connection endpoint",
        export_name="Production-DB-Connection"
    )
    
    CfnOutput(
        self, "AutoScalingGroupName",
        value=self.asg.auto_scaling_group_name,
        description="Auto Scaling Group name",
        export_name="Production-ASG-Name"
    )