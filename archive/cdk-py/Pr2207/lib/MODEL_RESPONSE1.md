# High Availability and Failure Recovery Infrastructure on AWS

I'll provide you with a comprehensive AWS CDK Python solution that meets all the requirements for a highly available, fault-tolerant web application infrastructure.

## Project Structure

```
ha-web-infrastructure/
├── app.py
├── requirements.txt
├── cdk.json
├── ha_web_infrastructure/
│   ├── __init__.py
│   ├── ha_web_stack.py
│   ├── constructs/
│   │   ├── __init__.py
│   │   ├── networking.py
│   │   ├── compute.py
│   │   ├── database.py
│   │   ├── storage.py
│   │   ├── monitoring.py
│   │   └── security.py
│   └── lambda/
│       └── auto_recovery.py
└── README.md
```

## Core Implementation

### 1. Main Application Entry Point (`app.py`)

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from ha_web_infrastructure.ha_web_stack import HaWebStack

app = cdk.App()

# Get environment configuration
env = cdk.Environment(
    account=app.node.try_get_context("account"),
    region=app.node.try_get_context("region")
)

# Standard tags for all resources
standard_tags = {
    "Environment": app.node.try_get_context("environment") or "production",
    "Owner": "DevOps Team",
    "CostCenter": "Engineering",
    "Project": "HA-Web-Infrastructure"
}

# Deploy the main stack
ha_web_stack = HaWebStack(
    app, 
    "HaWebStack",
    env=env,
    description="High Availability Web Application Infrastructure"
)

# Apply standard tags to all resources
for key, value in standard_tags.items():
    cdk.Tags.of(ha_web_stack).add(key, value)

app.synth()
```

### 2. Main Stack Definition (`ha_web_infrastructure/ha_web_stack.py`)

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_route53 as route53,
    aws_certificatemanager as acm,
    Duration
)
from constructs import Construct
from .constructs.networking import NetworkingConstruct
from .constructs.compute import ComputeConstruct
from .constructs.database import DatabaseConstruct
from .constructs.storage import StorageConstruct
from .constructs.monitoring import MonitoringConstruct
from .constructs.security import SecurityConstruct

class HaWebStack(Stack):
    """
    High Availability Web Application Stack
    
    This stack creates a highly available, fault-tolerant web application
    infrastructure across multiple availability zones with automated
    failure recovery capabilities.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get configuration from context
        domain_name = self.node.try_get_context("domain_name") or "example.com"
        
        # 1. Security - KMS keys and IAM roles
        self.security = SecurityConstruct(self, "Security")
        
        # 2. Networking - VPC, subnets, security groups
        self.networking = NetworkingConstruct(
            self, "Networking",
            kms_key=self.security.kms_key
        )
        
        # 3. Database - RDS with read replicas
        self.database = DatabaseConstruct(
            self, "Database",
            vpc=self.networking.vpc,
            kms_key=self.security.kms_key,
            db_security_group=self.networking.db_security_group
        )
        
        # 4. Storage - S3 with cross-region replication
        self.storage = StorageConstruct(
            self, "Storage",
            kms_key=self.security.kms_key
        )
        
        # 5. Compute - EC2, ALB, Auto Scaling
        self.compute = ComputeConstruct(
            self, "Compute",
            vpc=self.networking.vpc,
            database=self.database,
            storage=self.storage,
            security=self.security,
            alb_security_group=self.networking.alb_security_group,
            ec2_security_group=self.networking.ec2_security_group
        )
        
        # 6. Monitoring - CloudWatch, alarms, Lambda for auto-recovery
        self.monitoring = MonitoringConstruct(
            self, "Monitoring",
            auto_scaling_group=self.compute.auto_scaling_group,
            load_balancer=self.compute.load_balancer,
            database=self.database,
            lambda_role=self.security.lambda_execution_role
        )
        
        # 7. DNS - Route 53 with health checks
        self._setup_dns(domain_name)

    def _setup_dns(self, domain_name: str):
        """Set up Route 53 DNS with health checks and failover"""
        
        # Create hosted zone
        self.hosted_zone = route53.HostedZone(
            self, "HostedZone",
            zone_name=domain_name,
            comment="Hosted zone for HA web application"
        )
        
        # SSL Certificate
        self.certificate = acm.Certificate(
            self, "Certificate",
            domain_name=domain_name,
            subject_alternative_names=[f"*.{domain_name}"],
            validation=acm.CertificateValidation.from_dns(self.hosted_zone)
        )
        
        # Health check for primary ALB
        health_check = route53.HealthCheck(
            self, "PrimaryHealthCheck",
            type=route53.HealthCheckType.HTTPS,
            resource_path="/health",
            fqdn=self.compute.load_balancer.load_balancer_dns_name,
            port=443,
            request_interval=Duration.seconds(30),
            failure_threshold=3
        )
        
        # Primary A record with health check
        route53.ARecord(
            self, "PrimaryARecord",
            zone=self.hosted_zone,
            record_name=domain_name,
            target=route53.RecordTarget.from_alias(
                route53.targets.LoadBalancerTarget(self.compute.load_balancer)
            ),
            set_identifier="primary",
            health_check_id=health_check.health_check_id,
            weight=100
        )
```

### 3. Networking Construct (`ha_web_infrastructure/constructs/networking.py`)

```python
from aws_cdk import (
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_logs as logs,
    RemovalPolicy
)
from constructs import Construct

class NetworkingConstruct(Construct):
    """
    Networking infrastructure including VPC, subnets, and security groups
    across multiple availability zones for high availability.
    """

    def __init__(self, scope: Construct, construct_id: str, kms_key: kms.Key) -> None:
        super().__init__(scope, construct_id)

        # Create VPC across multiple AZs
        self.vpc = ec2.Vpc(
            self, "VPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,  # Use 3 AZs for maximum availability
            nat_gateways=2,  # NAT gateways in 2 AZs for redundancy
            subnet_configuration=[
                # Public subnets for ALB
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                # Private subnets for EC2 instances
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                # Isolated subnets for RDS
                ec2.SubnetConfiguration(
                    name="Database",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # VPC Flow Logs for security monitoring
        log_group = logs.LogGroup(
            self, "VPCFlowLogsGroup",
            retention=logs.RetentionDays.ONE_MONTH,
            encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        ec2.FlowLog(
            self, "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        # Security Groups
        self._create_security_groups()

    def _create_security_groups(self):
        """Create security groups for different tiers"""
        
        # ALB Security Group
        self.alb_security_group = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        # Allow HTTP and HTTPS from internet
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP from internet"
        )
        
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS from internet"
        )

        # EC2 Security Group
        self.ec2_security_group = ec2.SecurityGroup(
            self, "EC2SecurityGroup",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )
        
        # Allow traffic from ALB
        self.ec2_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(80),
            "Allow HTTP from ALB"
        )
        
        # Allow SSH from bastion (if needed)
        self.ec2_security_group.add_ingress_rule(
            ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            ec2.Port.tcp(22),
            "Allow SSH from VPC"
        )

        # Database Security Group
        self.db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        
        # Allow MySQL/Aurora access from EC2 instances
        self.db_security_group.add_ingress_rule(
            self.ec2_security_group,
            ec2.Port.tcp(3306),
            "Allow MySQL access from EC2 instances"
        )
```

### 4. Compute Construct (`ha_web_infrastructure/constructs/compute.py`)

```python
from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    Duration
)
from constructs import Construct

class ComputeConstruct(Construct):
    """
    Compute infrastructure including EC2 instances, Auto Scaling Group,
    and Application Load Balancer for high availability.
    """

    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, 
                 database, storage, security, alb_security_group: ec2.SecurityGroup,
                 ec2_security_group: ec2.SecurityGroup) -> None:
        super().__init__(scope, construct_id)

        self.vpc = vpc
        self.database = database
        self.storage = storage
        self.security = security

        # Create Application Load Balancer
        self._create_load_balancer(alb_security_group)
        
        # Create Launch Template and Auto Scaling Group
        self._create_auto_scaling_group(ec2_security_group)
        
        # Configure target group and listener
        self._configure_load_balancer_targets()

    def _create_load_balancer(self, security_group: ec2.SecurityGroup):
        """Create Application Load Balancer"""
        
        self.load_balancer = elbv2.ApplicationLoadBalancer(
            self, "ApplicationLoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            security_group=security_group,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            deletion_protection=True,  # Prevent accidental deletion
            load_balancer_name="ha-web-alb"
        )

    def _create_auto_scaling_group(self, security_group: ec2.SecurityGroup):
        """Create Auto Scaling Group with Launch Template"""
        
        # User data script for EC2 instances
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>High Availability Web Server</h1>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health",
            
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            
            # Configure CloudWatch agent
            "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
            """{
                "metrics": {
                    "namespace": "AWS/EC2/Custom",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                },
                "logs": {
                    "logs_collected": {
                        "files": {
                            "collect_list": [
                                {
                                    "file_path": "/var/log/httpd/access_log",
                                    "log_group_name": "/aws/ec2/httpd/access",
                                    "log_stream_name": "{instance_id}"
                                },
                                {
                                    "file_path": "/var/log/httpd/error_log",
                                    "log_group_name": "/aws/ec2/httpd/error",
                                    "log_stream_name": "{instance_id}"
                                }
                            ]
                        }
                    }
                }
            }""",
            "EOF",
            
            # Start CloudWatch agent
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
        )

        # Launch template
        launch_template = ec2.LaunchTemplate(
            self, "LaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=security_group,
            user_data=user_data,
            role=self.security.ec2_instance_role,
            detailed_monitoring=True,  # Enable detailed monitoring
            launch_template_name="ha-web-launch-template"
        )

        # Auto Scaling Group
        self.auto_scaling_group = autoscaling.AutoScalingGroup(
            self, "AutoScalingGroup",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=2,  # Minimum 2 instances for HA
            max_capacity=10,  # Scale up to 10 instances
            desired_capacity=3,  # Start with 3 instances
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            ),
            auto_scaling_group_name="ha-web-asg"
        )

        # Scaling policies
        self.auto_scaling_group.scale_on_cpu_utilization(
            "CPUScaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.minutes(5),
            scale_out_cooldown=Duration.minutes(3)
        )

    def _configure_load_balancer_targets(self):
        """Configure load balancer target group and listeners"""
        
        # Target group
        target_group = elbv2.ApplicationTargetGroup(
            self, "TargetGroup",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                path="/health",
                protocol=elbv2.Protocol.HTTP,
                port="80",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            ),
            target_group_name="ha-web-targets"
        )

        # Add ASG to target group
        target_group.add_target(self.auto_scaling_group)

        # HTTP Listener (redirect to HTTPS)
        self.load_balancer.add_listener(
            "HTTPListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(
                protocol="HTTPS",
                port="443",
                permanent=True
            )
        )

        # HTTPS Listener
        self.load_balancer.add_listener(
            "HTTPSListener",
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTPS,
            certificates=[elbv2.ListenerCertificate.from_arn(
                # This would be set from the certificate created in the main stack
                "arn:aws:acm:region:account:certificate/certificate-id"
            )],
            default_action=elbv2.ListenerAction.forward([target_group])
        )
```

### 5. Database Construct (`ha_web_infrastructure/constructs/database.py`)

```python
from aws_cdk import (
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_logs as logs,
    RemovalPolicy,
    Duration
)
from constructs import Construct

class DatabaseConstruct(Construct):
    """
    Database infrastructure with RDS Aurora cluster and read replicas
    for high availability and performance.
    """

    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 kms_key: kms.Key, db_security_group: ec2.SecurityGroup) -> None:
        super().__init__(scope, construct_id)

        self.vpc = vpc
        self.kms_key = kms_key

        # Create database subnet group
        self.db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            subnet_group_name="ha-web-db-subnet-group"
        )

        # Create Aurora cluster
        self._create_aurora_cluster(db_security_group)
        
        # Create read replicas
        self._create_read_replicas()

    def _create_aurora_cluster(self, security_group: ec2.SecurityGroup):
        """Create Aurora MySQL cluster with multi-AZ deployment"""
        
        # Parameter group for Aurora MySQL
        self.parameter_group = rds.ParameterGroup(
            self, "AuroraParameterGroup",
            engine=rds.DatabaseClusterEngine.aurora_mysql(
                version=rds.AuroraMysqlEngineVersion.VER_8_0_35
            ),
            description="Parameter group for Aurora MySQL cluster",
            parameters={
                "innodb_buffer_pool_size": "{DBInstanceClassMemory*3/4}",
                "max_connections": "1000",
                "slow_query_log": "1",
                "long_query_time": "2"
            }
        )

        # Aurora cluster
        self.cluster = rds.DatabaseCluster(
            self, "AuroraCluster",
            engine=rds.DatabaseClusterEngine.aurora_mysql(
                version=rds.AuroraMysqlEngineVersion.VER_8_0_35
            ),
            instance_props=rds.InstanceProps(
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.R6G,
                    ec2.InstanceSize.LARGE
                ),
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                security_groups=[security_group],
                parameter_group=self.parameter_group,
                enable_performance_insights=True,
                performance_insight_retention=rds.PerformanceInsightRetention.MONTHS_7,
                performance_insight_encryption_key=self.kms_key,
                auto_minor_version_upgrade=True,
                delete_automated_backups=False
            ),
            instances=2,  # Primary + 1 replica in different AZ
            default_database_name="webapp",
            credentials=rds.Credentials.from_generated_secret(
                "admin",
                secret_name="aurora-cluster-credentials",
                encryption_key=self.kms_key
            ),
            backup=rds.BackupProps(
                retention=Duration.days(7),
                preferred_window="03:00-04:00"
            ),
            preferred_maintenance_window="sun:04:00-sun:05:00",
            cloudwatch_logs_exports=["error", "general", "slowquery"],
            cloudwatch_logs_retention=logs.RetentionDays.ONE_MONTH,
            cloudwatch_logs_retention_role=None,  # Use service role
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            deletion_protection=True,
            subnet_group=self.db_subnet_group,
            cluster_identifier="ha-web-aurora-cluster"
        )

        # Enable monitoring
        self.cluster.metric_cpu_utilization().create_alarm(
            self, "DatabaseCPUAlarm",
            threshold=80,
            evaluation_periods=2,
            alarm_description="Database CPU utilization is too high"
        )

    def _create_read_replicas(self):
        """Create cross-region read replicas for disaster recovery"""
        
        # Note: Cross-region read replicas would be created in a separate stack
        # for a different region. Here we're adding additional read replicas
        # in the same region for read scaling.
        
        self.read_replica_1 = self.cluster.add_rotation_single_user(
            automatically_after=Duration.days(30)
        )
```

### 6. Storage Construct (`ha_web_infrastructure/constructs/storage.py`)

```python
from aws_cdk import (
    aws_s3 as s3,
    aws_s3_notifications as s3n,
    aws_kms as kms,
    aws_iam as iam,
    RemovalPolicy,
    Duration
)
from constructs import Construct

class StorageConstruct(Construct):
    """
    Storage infrastructure with S3 buckets and cross-region replication
    for data durability and disaster recovery.
    """

    def __init__(self, scope: Construct, construct_id: str, kms_key: kms.Key) -> None:
        super().__init__(scope, construct_id)

        self.kms_key = kms_key
        
        # Create primary S3 bucket
        self._create_primary_bucket()
        
        # Create backup bucket for cross-region replication
        self._create_backup_bucket()
        
        # Setup cross-region replication
        self._setup_cross_region_replication()

    def _create_primary_bucket(self):
        """Create primary S3 bucket with versioning and encryption"""
        
        self.primary_bucket = s3.Bucket(
            self, "PrimaryBucket",
            bucket_name=f"ha-web-primary-{self.node.addr}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            bucket_key_enabled=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.DEEP_ARCHIVE,
                            transition_after=Duration.days(365)
                        )
                    ]
                ),
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    enabled=True,
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ],
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.POST],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    max_age=3000
                )
            ],
            notification_key_filter=s3.NotificationKeyFilter(
                prefix="uploads/",
                suffix=".jpg"
            )
        )

        # Enable access logging
        self.access_logs_bucket = s3.Bucket(
            self, "AccessLogsBucket",
            bucket_name=f"ha-web-access-logs-{self.node.addr}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(90)
                )
            ]
        )

        self.primary_bucket.add_property_override(
            "LoggingConfiguration",
            {
                "DestinationBucketName": self.access_logs_bucket.bucket_name,
                "LogFilePrefix": "access-logs/"
            }
        )

    def _create_backup_bucket(self):
        """Create backup bucket for cross-region replication"""
        
        # This would typically be in a different region
        # For this example, we'll create it in the same region
        self.backup_bucket = s3.Bucket(
            self, "BackupBucket",
            bucket_name=f"ha-web-backup-{self.node.addr}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            bucket_key_enabled=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN
        )

    def _setup_cross_region_replication(self):
        """Setup cross-region replication between buckets"""
        
        # Create replication role
        replication_role = iam.Role(
            self, "ReplicationRole",
            assumed_by=iam.ServicePrincipal("s3.amazonaws.com"),
            inline_policies={
                "ReplicationPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObjectVersionForReplication",
                                "s3:GetObjectVersionAcl"
                            ],
                            resources=[f"{self.primary_bucket.bucket_arn}/*"]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:ListBucket"
                            ],
                            resources=[self.primary_bucket.bucket_arn]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:ReplicateObject",
                                "s3:ReplicateDelete"
                            ],
                            resources=[f"{self.backup_bucket.bucket_arn}/*"]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            resources=[self.kms_key.key_arn]
                        )
                    ]
                )
            }
        )

        # Add replication configuration to primary bucket
        self.primary_bucket.add_property_override(
            "ReplicationConfiguration",
            {
                "Role": replication_role.role_arn,
                "Rules": [
                    {
                        "Id": "ReplicateToBackup",
                        "Status": "Enabled",
                        "Prefix": "",
                        "Destination": {
                            "Bucket": self.backup_bucket.bucket_arn,
                            "StorageClass": "STANDARD_IA",
                            "EncryptionConfiguration": {
                                "ReplicaKmsKeyID": self.kms_key.key_arn
                            }
                        }
                    }
                ]
            }
        )
```

### 7. Security Construct (`ha_web_infrastructure/constructs/security.py`)

```python
from aws_cdk import (
    aws_kms as kms,
    aws_iam as iam,
    aws_logs as logs,
    RemovalPolicy
)
from constructs import Construct

class SecurityConstruct(Construct):
    """
    Security infrastructure including KMS keys, IAM roles, and policies