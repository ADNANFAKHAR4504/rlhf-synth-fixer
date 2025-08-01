## CDK Python Configuration
### Project Structure
```
aws-secure-infrastructure/
├── app.py
├── requirements.txt
├── cdk.json
├── stacks/
│   ├── __init__.py
│   ├── security_stack.py
│   ├── database_stack.py
│   ├── storage_stack.py
│   ├── monitoring_stack.py
│   └── cloudfront_stack.py
└── constructs/
    ├── __init__.py
    └── secure_constructs.py
```

### Main Application Entry Point (app.py)
```python
#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.security_stack import SecurityStack
from stacks.database_stack import DatabaseStack
from stacks.storage_stack import StorageStack
from stacks.monitoring_stack import MonitoringStack
from stacks.cloudfront_stack import CloudFrontStack

app = cdk.App()

# Define environments and accounts
environments = {
    'dev': {
        'account': '111111111111',  # Replace with actual dev account ID
        'regions': ['us-east-1', 'eu-west-1']
    },
    'prod': {
        'account': '222222222222',  # Replace with actual prod account ID
        'regions': ['us-east-1', 'eu-west-1']
    }
}

# Common tags for all resources
common_tags = {
    'Project': 'SecureInfrastructure',
    'Owner': 'DevOps-Team'
}

# Deploy stacks across accounts and regions
for env_name, env_config in environments.items():
    for region in env_config['regions']:
        env = cdk.Environment(
            account=env_config['account'],
            region=region
        )
        
        # Environment-specific tags
        env_tags = {
            **common_tags,
            'Environment': env_name
        }
        
        # Security Stack (VPC, Security Groups, IAM)
        security_stack = SecurityStack(
            app, 
            f"SecurityStack-{env_name}-{region}",
            env=env,
            tags=env_tags
        )
        
        # Database Stack (RDS with KMS encryption)
        database_stack = DatabaseStack(
            app,
            f"DatabaseStack-{env_name}-{region}",
            vpc=security_stack.vpc,
            security_group=security_stack.rds_security_group,
            env=env,
            tags=env_tags
        )
        
        # Storage Stack (S3 buckets)
        storage_stack = StorageStack(
            app,
            f"StorageStack-{env_name}-{region}",
            env=env,
            tags=env_tags
        )
        
        # Monitoring Stack (GuardDuty)
        monitoring_stack = MonitoringStack(
            app,
            f"MonitoringStack-{env_name}-{region}",
            env=env,
            tags=env_tags
        )
        
        # CloudFront Stack (only in us-east-1 for global distribution)
        if region == 'us-east-1':
            cloudfront_stack = CloudFrontStack(
                app,
                f"CloudFrontStack-{env_name}",
                storage_bucket=storage_stack.web_bucket,
                env=env,
                tags=env_tags
            )

app.synth()
```

### Security Stack (stacks/security_stack.py)
```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_kms as kms,
    CfnOutput
)
from constructs import Construct

class SecurityStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create VPC with private and public subnets
        self.vpc = ec2.Vpc(
            self, "SecureVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="DatabaseSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )
        
        # Create KMS key for encryption
        self.kms_key = kms.Key(
            self, "SecureKMSKey",
            description="KMS key for encrypting AWS resources",
            enable_key_rotation=True,
            policy=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        sid="Enable IAM User Permissions",
                        effect=iam.Effect.ALLOW,
                        principals=[iam.AccountRootPrincipal()],
                        actions=["kms:*"],
                        resources=["*"]
                    )
                ]
            )
        )
        
        # Security Group for EC2 instances - NO unrestricted SSH access
        self.ec2_security_group = ec2.SecurityGroup(
            self, "EC2SecurityGroup",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )
        
        # Only allow SSH from private subnet CIDR ranges
        for subnet in self.vpc.private_subnets:
            self.ec2_security_group.add_ingress_rule(
                peer=ec2.Peer.ipv4(subnet.ipv4_cidr_block),
                connection=ec2.Port.tcp(22),
                description=f"SSH from private subnet {subnet.subnet_id}"
            )
        
        # Security Group for RDS
        self.rds_security_group = ec2.SecurityGroup(
            self, "RDSSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS instances",
            allow_all_outbound=False
        )
        
        # Allow database access only from EC2 security group
        self.rds_security_group.add_ingress_rule(
            peer=self.ec2_security_group,
            connection=ec2.Port.tcp(3306),
            description="MySQL access from EC2 instances"
        )
        
        # Security Group for ALB
        self.alb_security_group = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        # Allow HTTP and HTTPS from anywhere for ALB
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="HTTP access"
        )
        
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS access"
        )
        
        # Create IAM roles with least privilege
        self._create_iam_roles()
        
        # Outputs
        CfnOutput(self, "VPCId", value=self.vpc.vpc_id)
        CfnOutput(self, "KMSKeyId", value=self.kms_key.key_id)
    
    def _create_iam_roles(self):
        # EC2 Instance Role with minimal permissions
        self.ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Role for EC2 instances with minimal permissions",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )
        
        # Custom policy for EC2 instances
        ec2_policy = iam.Policy(
            self, "EC2CustomPolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    resources=[
                        "arn:aws:s3:::secure-app-bucket-*/*"
                    ]
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
        
        ec2_policy.attach_to_role(self.ec2_role)
        
        # Lambda Execution Role
        self.lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for Lambda functions",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
```

### Database Stack (stacks/database_stack.py)
```python
from aws_cdk import (
    Stack,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_kms as kms,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class DatabaseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, 
                 security_group: ec2.SecurityGroup, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create KMS key for RDS encryption
        rds_kms_key = kms.Key(
            self, "RDSKMSKey",
            description="KMS key for RDS encryption",
            enable_key_rotation=True
        )
        
        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=vpc,
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )
        
        # Create RDS instance with KMS encryption
        self.database = rds.DatabaseInstance(
            self, "SecureDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            subnet_group=db_subnet_group,
            security_groups=[security_group],
            
            # Encryption configuration
            storage_encrypted=True,
            storage_encryption_key=rds_kms_key,
            
            # Security configurations
            multi_az=True,
            backup_retention=Duration.days(7),
            deletion_protection=True,
            delete_automated_backups=False,
            
            # Database configuration
            database_name="secureapp",
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name="rds-credentials"
            ),
            
            # Monitoring
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            performance_insight_encryption_key=rds_kms_key,
            
            # Maintenance
            auto_minor_version_upgrade=True,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            
            removal_policy=RemovalPolicy.SNAPSHOT
        )
        
        # Create read replica with encryption
        self.read_replica = rds.DatabaseInstanceReadReplica(
            self, "DatabaseReadReplica",
            source_database_instance=self.database,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            subnet_group=db_subnet_group,
            security_groups=[security_group],
            
            # Encryption for read replica
            storage_encrypted=True,
            storage_encryption_key=rds_kms_key,
            
            auto_minor_version_upgrade=True,
            deletion_protection=True
        )
        
        # Outputs
        CfnOutput(self, "DatabaseEndpoint", value=self.database.instance_endpoint.hostname)
        CfnOutput(self, "DatabasePort", value=str(self.database.instance_endpoint.port))
        CfnOutput(self, "ReadReplicaEndpoint", value=self.read_replica.instance_endpoint.hostname)
```

### Storage Stack (stacks/storage_stack.py)
```python
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class StorageStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create KMS key for S3 encryption
        s3_kms_key = kms.Key(
            self, "S3KMSKey",
            description="KMS key for S3 bucket encryption",
            enable_key_rotation=True
        )
        
        # Application data bucket - completely private
        self.app_data_bucket = s3.Bucket(
            self, "AppDataBucket",
            bucket_name=f"secure-app-data-{self.account}-{self.region}",
            
            # Security configurations
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            public_read_access=False,
            
            # Encryption
            encryption=s3.BucketEncryption.KMS,
            encryption_key=s3_kms_key,
            bucket_key_enabled=True,
            
            # Versioning and lifecycle
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(90),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ],
            
            # Access logging
            server_access_logs_prefix="access-logs/",
            
            # Removal policy
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Web content bucket for CloudFront
        self.web_bucket = s3.Bucket(
            self, "WebContentBucket",
            bucket_name=f"secure-web-content-{self.account}-{self.region}",
            
            # Security configurations - NO public access
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            public_read_access=False,
            
            # Encryption
            encryption=s3.BucketEncryption.KMS,
            encryption_key=s3_kms_key,
            bucket_key_enabled=True,
            
            # Versioning
            versioned=True,
            
            # CORS for web content (if needed)
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.HEAD],
                    allowed_origins=["https://*.cloudfront.net"],
                    allowed_headers=["*"],
                    max_age=3000
                )
            ],
            
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Backup bucket
        self.backup_bucket = s3.Bucket(
            self, "BackupBucket",
            bucket_name=f"secure-backups-{self.account}-{self.region}",
            
            # Security configurations
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            public_read_access=False,
            
            # Encryption
            encryption=s3.BucketEncryption.KMS,
            encryption_key=s3_kms_key,
            bucket_key_enabled=True,
            
            # Versioning and lifecycle
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="ArchiveOldBackups",
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
                )
            ],
            
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Add bucket notifications for security monitoring
        self._add_bucket_notifications()
        
        # Outputs
        CfnOutput(self, "AppDataBucketName", value=self.app_data_bucket.bucket_name)
        CfnOutput(self, "WebBucketName", value=self.web_bucket.bucket_name)
        CfnOutput(self, "BackupBucketName", value=self.backup_bucket.bucket_name)
    
    def _add_bucket_notifications(self):
        """Add CloudTrail and other monitoring for bucket access"""
        # This would typically integrate with CloudTrail and CloudWatch
        # for monitoring bucket access patterns
        pass
```

### Monitoring Stack (stacks/monitoring_stack.py)
```python
from aws_cdk import (
    Stack,
    aws_guardduty as guardduty,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_cloudwatch_actions as cw_actions,
    CfnOutput
)
from constructs import Construct

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Enable GuardDuty
        self.guardduty_detector = guardduty.CfnDetector(
            self, "GuardDutyDetector",
            enable=True,
            finding_publishing_frequency="FIFTEEN_MINUTES",
            
            # Enable S3 protection
            datasources=guardduty.CfnDetector.CFNDataSourceConfigurationsProperty(
                s3_logs=guardduty.CfnDetector.CFNS3LogsConfigurationProperty(
                    enable=True
                ),
                kubernetes=guardduty.CfnDetector.CFNKubernetesConfigurationProperty(
                    audit_logs=guardduty.CfnDetector.CFNKubernetesAuditLogsConfigurationProperty(
                        enable=True
                    )
                ),
                malware_protection=guardduty.CfnDetector.CFNMalwareProtectionConfigurationProperty(
                    scan_ec2_instance_with_findings=guardduty.CfnDetector.CFNScanEc2InstanceWithFindingsConfigurationProperty(
                        ebs_volumes=True
                    )
                )
            )
        )
        
        # Create SNS topic for GuardDuty alerts
        self.security_alerts_topic = sns.Topic(
            self, "SecurityAlertsTopic",
            topic_name="security-alerts",
            display_name="Security Alerts"
        )
        
        # Create CloudWatch alarms for security events
        self._create_security_alarms()
        
        # Outputs
        CfnOutput(self, "GuardDutyDetectorId", value=self.guardduty_detector.ref)
        CfnOutput(self, "SecurityAlertsTopicArn", value=self.security_alerts_topic.topic_arn)
    
    def _create_security_alarms(self):
        """Create CloudWatch alarms for security monitoring"""
        
        # Alarm for failed SSH attempts
        ssh_failure_alarm = cloudwatch.Alarm(
            self, "SSHFailureAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/Events",
                metric_name="FailedSSHAttempts",
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=1,
            alarm_description="Alert on multiple failed SSH attempts"
        )
        
        ssh_failure_alarm.add_alarm_action(
            cw_actions.SnsAction(self.security_alerts_topic)
        )
        
        # Alarm for root account usage
        root_usage_alarm = cloudwatch.Alarm(
            self, "RootAccountUsageAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/CloudTrail",
                metric_name="RootAccountUsage",
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=1,
            alarm_description="Alert on root account usage"
        )
        
        root_usage_alarm.add_alarm_action(
            cw_actions.SnsAction(self.security_alerts_topic)
        )
```

### CloudFront Stack (stacks/cloudfront_stack.py)
```python
from aws_cdk import (
    Stack,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_s3 as s3,
    aws_wafv2 as wafv2,
    aws_shield as shield,
    CfnOutput,
    Duration
)
from constructs import Construct

class CloudFrontStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, 
                 storage_bucket: s3.Bucket, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create Origin Access Control for S3
        origin_access_control = cloudfront.S3OriginAccessControl(
            self, "OriginAccessControl",
            signing_behavior=cloudfront.OriginAccessControlSigningBehavior.ALWAYS,
            signing_protocol=cloudfront.OriginAccessControlSigningProtocol.SIGV4,
            origin_access_control_name="secure-oac"
        )
        
        # Create WAF Web ACL for additional protection
        web_acl = self._create_waf_web_acl()
        
        # Create CloudFront distribution
        self.distribution = cloudfront.Distribution(
            self, "SecureDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3StaticWebsiteOrigin(
                    bucket=storage_bucket,
                    origin_access_control_id=origin_access_control.origin_access_control_id
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                origin_request_policy=cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                response_headers_policy=cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS
            ),
            
            # Security configurations
            web_acl_id=web_acl.attr_arn,
            
            # SSL/TLS configuration
            minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            
            # Logging
            enable_logging=True,
            log_bucket=storage_bucket,
            log_file_prefix="cloudfront-logs/",
            
            # Geographic restrictions (if needed)
            geo_restriction=cloudfront.GeoRestriction.allowlist("US", "CA", "GB", "DE", "FR"),
            
            # Price class
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            
            # Error responses
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.minutes(30)
                )
            ]
        )
        
        # Enable AWS Shield Advanced (requires manual subscription)
        # Note: Shield Advanced requires manual subscription and has additional costs
        self._enable_shield_advanced()
        
        # Outputs
        CfnOutput(self, "DistributionId", value=self.distribution.distribution_id)
        CfnOutput(self, "DistributionDomainName", value=self.distribution.distribution_domain_name)
        CfnOutput(self, "WebACLArn", value=web_acl.attr_arn)
    
    def _create_waf_web_acl(self):
        """Create WAF Web ACL with security rules"""
        
        # Rate limiting rule
        rate_limit_rule = wafv2.CfnWebACL.RuleProperty(
            name="RateLimitRule",
            priority=1,
            statement=wafv2.CfnWebACL.StatementProperty(
                rate_based_statement=wafv2.CfnWebACL.RateBasedStatementProperty(
                    limit=2000,
                    aggregate_key_type="IP"
                )
            ),
            action=wafv2.CfnWebACL.RuleActionProperty(
                block={}
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name="RateLimitRule"
            )
        )
        
        # AWS Managed Rules - Core Rule Set
        core_rule_set = wafv2.CfnWebACL.RuleProperty(
            name="AWSManagedRulesCoreRuleSet",
            priority=2,
            override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
            statement=wafv2.CfnWebACL.StatementProperty(
                managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                    vendor_name="AWS",
                    name="AWSManagedRulesCommonRuleSet"
                )
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name="CoreRuleSetRule"
            )
        )
        
        # AWS Managed Rules - Known Bad Inputs
        bad_inputs_rule = wafv2.CfnWebACL.RuleProperty(
            name="AWSManagedRulesKnownBadInputsRuleSet",
            priority=3,
            override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
            statement=wafv2.CfnWebACL.StatementProperty(
                managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                    vendor_name="AWS",
                    name="AWSManagedRulesKnownBadInputsRuleSet"
                )
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name="BadInputsRule"
            )
        )
        
        # Create Web ACL
        web_acl = wafv2.CfnWebACL(
            self, "WebACL",
            scope="CLOUDFRONT",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            rules=[rate_limit_rule, core_rule_set, bad_inputs_rule],
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name="SecureWebACL"
            )
        )
        
        return web_acl
    
    def _enable_shield_advanced(self):
        """Enable AWS Shield Advanced protection"""
        # Note: Shield Advanced requires manual subscription
        # This creates the protection association
        shield.CfnProtection(
            self, "ShieldAdvancedProtection",
            name="CloudFrontDistributionProtection",
            resource_arn=f"arn:aws:cloudfront::{self.account}:distribution/{self.distribution.distribution_id}"
        )
```

### Requirements File (requirements.txt)
```python
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.26.0
```

### CDK Configuration (cdk.json)
```json
{
  "app": "python app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
    "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
   "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```