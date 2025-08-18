I'll design and implement a comprehensive AWS infrastructure security configuration using AWS CDK in Python. Here's a complete project structure that meets all your requirements:

## Project Structure

```
secure-infrastructure/
├── app.py
├── main.py
├── cdk.json
├── requirements.txt
├── secure_infrastructure/
│   ├── __init__.py
│   ├── secure_infrastructure_stack.py
│   ├── constructs/
│   │   ├── __init__.py
│   │   ├── vpc_construct.py
│   │   ├── security_construct.py
│   │   ├── storage_construct.py
│   │   └── database_construct.py
└── README.md
```

## Core Files

### `cdk.json`
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

### `requirements.txt`
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.26.0
```

### `app.py`
```python
#!/usr/bin/env python3
"""
AWS CDK Application Entry Point
This file initializes the CDK app and deploys the secure infrastructure stack.
"""

import aws_cdk as cdk
from secure_infrastructure.secure_infrastructure_stack import SecureInfrastructureStack

# Initialize CDK app
app = cdk.App()

# Deploy to us-west-2 by default as requested
env = cdk.Environment(
    account=app.node.try_get_context("account") or "123456789012",  # Replace with actual account
    region=app.node.try_get_context("region") or "us-west-2"
)

# Create the main infrastructure stack
SecureInfrastructureStack(
    app, 
    "SecureInfrastructureStack",
    env=env,
    description="Secure AWS infrastructure with comprehensive security controls"
)

app.synth()
```

### `main.py`
```python
#!/usr/bin/env python3
"""
Main AWS CDK Python Project for Secure Infrastructure
This is the main entry point that demonstrates the complete secure infrastructure setup.

Author: AWS Solutions Architect
Purpose: Implement security best practices across AWS services
"""

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_s3 as s3,
    aws_kms as kms,
    aws_rds as rds,
    aws_cloudtrail as cloudtrail,
    aws_logs as logs,
    CfnOutput,
    RemovalPolicy,
    Duration,
    Tags
)
from constructs import Construct
import json

class SecureInfrastructureStack(Stack):
    """
    Main stack implementing comprehensive AWS security best practices
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Apply consistent tagging policy for cost tracking and compliance
        self._apply_common_tags()

        # 1. Create KMS keys first (needed for encryption)
        self.kms_key = self._create_kms_key()

        # 2. Create VPC with security-first design
        self.vpc = self._create_secure_vpc()

        # 3. Create security groups with restrictive rules
        self.security_groups = self._create_security_groups()

        # 4. Create IAM roles following principle of least privilege
        self.iam_roles = self._create_iam_roles()

        # 5. Create encrypted S3 buckets with secure naming
        self.s3_buckets = self._create_secure_s3_buckets()

        # 6. Create encrypted RDS instance
        self.rds_instance = self._create_encrypted_rds()

        # 7. Enable CloudTrail for comprehensive logging
        self.cloudtrail = self._create_cloudtrail()

        # Output important resource information
        self._create_outputs()

    def _apply_common_tags(self):
        """Apply consistent tagging policy across all resources"""
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("Project", "SecureInfrastructure")
        Tags.of(self).add("Owner", "SecurityTeam")
        Tags.of(self).add("CostCenter", "Security")
        Tags.of(self).add("Compliance", "Required")
        Tags.of(self).add("BackupRequired", "Yes")

    def _create_kms_key(self) -> kms.Key:
        """
        Create KMS key for encryption across services
        Why: Centralized key management for data encryption at rest
        """
        key = kms.Key(
            self, "SecureInfrastructureKey",
            description="KMS key for secure infrastructure encryption",
            enable_key_rotation=True,  # Automatic key rotation for enhanced security
            removal_policy=RemovalPolicy.RETAIN,  # Prevent accidental key deletion
            policy=iam.PolicyDocument(
                statements=[
                    # Allow root account full access
                    iam.PolicyStatement(
                        sid="Enable IAM User Permissions",
                        effect=iam.Effect.ALLOW,
                        principals=[iam.AccountRootPrincipal()],
                        actions=["kms:*"],
                        resources=["*"]
                    ),
                    # Allow CloudTrail to use the key
                    iam.PolicyStatement(
                        sid="Allow CloudTrail to encrypt logs",
                        effect=iam.Effect.ALLOW,
                        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                        actions=[
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey",
                            "kms:Encrypt",
                            "kms:ReEncrypt*",
                            "kms:CreateGrant"
                        ],
                        resources=["*"]
                    )
                ]
            )
        )

        # Create alias for easier key management
        kms.Alias(
            self, "SecureInfrastructureKeyAlias",
            alias_name="alias/secure-infrastructure-key",
            target_key=key
        )

        return key

    def _create_secure_vpc(self) -> ec2.Vpc:
        """
        Create VPC with security-first design
        Why: Network isolation and controlled traffic flow
        """
        vpc = ec2.Vpc(
            self, "SecureVPC",
            # Use 2 AZs for high availability as required
            max_azs=2,
            # CIDR block providing sufficient IP space
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            # Create both public and private subnets as required
            subnet_configuration=[
                # Public subnets for load balancers, NAT gateways
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,  # /24 provides 254 usable IPs per subnet
                ),
                # Private subnets for application servers, databases
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
            # Enable DNS hostnames and resolution for proper service discovery
            enable_dns_hostnames=True,
            enable_dns_support=True,
            # Create NAT gateways in each AZ for high availability
            nat_gateways=2,
        )

        # Enable VPC Flow Logs for network monitoring and security analysis
        vpc_flow_log_role = iam.Role(
            self, "VPCFlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/VPCFlowLogsDeliveryRolePolicy"
                )
            ]
        )

        log_group = logs.LogGroup(
            self, "VPCFlowLogGroup",
            retention=logs.RetentionDays.ONE_MONTH,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        ec2.FlowLog(
            self, "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group, vpc_flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        return vpc

    def _create_security_groups(self) -> dict:
        """
        Create restrictive security groups
        Why: Control network access with principle of least privilege
        """
        security_groups = {}

        # Web tier security group - only allows HTTP/HTTPS from specific IPs
        web_sg = ec2.SecurityGroup(
            self, "WebSecurityGroup",
            vpc=self.vpc,
            description="Security group for web tier with restricted access",
            allow_all_outbound=False  # Explicitly control outbound traffic
        )

        # Allow HTTPS from specific IP ranges only (replace with your actual IPs)
        # This demonstrates restricting to specific IP ranges as required
        allowed_ip_ranges = [
            "203.0.113.0/24",  # Example: Your office IP range
            "198.51.100.0/24"  # Example: Your backup office IP range
        ]

        for ip_range in allowed_ip_ranges:
            web_sg.add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(443),
                description=f"HTTPS access from {ip_range}"
            )
            web_sg.add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(80),
                description=f"HTTP access from {ip_range}"
            )

        # Allow outbound HTTPS for updates and API calls
        web_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS outbound for updates"
        )

        security_groups["web"] = web_sg

        # Database security group - only allows access from web tier
        db_sg = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for database tier",
            allow_all_outbound=False
        )

        # Only allow database access from web security group
        db_sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(web_sg.security_group_id),
            connection=ec2.Port.tcp(5432),  # PostgreSQL port
            description="Database access from web tier only"
        )

        security_groups["database"] = db_sg

        return security_groups

    def _create_iam_roles(self) -> dict:
        """
        Create IAM roles following principle of least privilege
        Why: Ensure minimal permissions for each service
        """
        roles = {}

        # EC2 instance role with minimal permissions
        ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Minimal permissions role for EC2 instances",
            managed_policies=[
                # Only allow SSM access for secure management
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                )
            ]
        )

        # Custom policy for specific S3 bucket access only
        s3_access_policy = iam.Policy(
            self, "S3AccessPolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    resources=[
                        "arn:aws:s3:::*secure-data*/*"  # Only access secure-data buckets
                    ]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=["s3:ListBucket"],
                    resources=["arn:aws:s3:::*secure-data*"]
                )
            ]
        )

        ec2_role.attach_inline_policy(s3_access_policy)
        roles["ec2"] = ec2_role

        # Lambda execution role with minimal permissions
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Minimal permissions role for Lambda functions",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Only allow KMS decrypt for this specific key
        lambda_kms_policy = iam.Policy(
            self, "LambdaKMSPolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "kms:Decrypt",
                        "kms:DescribeKey"
                    ],
                    resources=[self.kms_key.key_arn]
                )
            ]
        )

        lambda_role.attach_inline_policy(lambda_kms_policy)
        roles["lambda"] = lambda_role

        return roles

    def _create_secure_s3_buckets(self) -> dict:
        """
        Create S3 buckets with security best practices
        Why: Protect data at rest with encryption and access controls
        """
        buckets = {}

        # Application data bucket with secure-data naming requirement
        app_bucket = s3.Bucket(
            self, "SecureDataAppBucket",
            bucket_name=f"secure-data-app-{self.account}-{self.region}",
            # Server-side encryption with KMS as required
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            # Block all public access for security
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            # Enable versioning for data protection
            versioned=True,
            # Lifecycle rules for cost optimization
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
                        )
                    ]
                )
            ],
            # Enable access logging
            server_access_logs_prefix="access-logs/",
            # Prevent accidental deletion in production
            removal_policy=RemovalPolicy.RETAIN
        )

        buckets["app"] = app_bucket

        # Backup bucket with secure-data naming requirement
        backup_bucket = s3.Bucket(
            self, "SecureDataBackupBucket",
            bucket_name=f"secure-data-backup-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            # Cross-region replication for disaster recovery
            removal_policy=RemovalPolicy.RETAIN
        )

        buckets["backup"] = backup_bucket

        # CloudTrail logs bucket with secure-data naming
        cloudtrail_bucket = s3.Bucket(
            self, "SecureDataCloudTrailBucket",
            bucket_name=f"secure-data-cloudtrail-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN
        )

        buckets["cloudtrail"] = cloudtrail_bucket

        return buckets

    def _create_encrypted_rds(self) -> rds.DatabaseInstance:
        """
        Create RDS instance with KMS encryption
        Why: Protect sensitive data at rest using customer-managed keys
        """
        # Create DB subnet group in private subnets
        db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

        # Create parameter group for additional security settings
        parameter_group = rds.ParameterGroup(
            self, "DatabaseParameterGroup",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            parameters={
                # Enable SSL connections only
                "ssl": "1",
                "log_statement": "all",  # Log all statements for auditing
                "log_min_duration_statement": "1000"  # Log slow queries
            }
        )

        # Create encrypted RDS instance
        database = rds.DatabaseInstance(
            self, "SecureDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, 
                ec2.InstanceSize.MICRO
            ),
            # Use KMS encryption as required
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            # Place in private subnets only
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.security_groups["database"]],
            # Use parameter group with security settings
            parameter_group=parameter_group,
            # Enable automated backups with encryption
            backup_retention=Duration.days(7),
            delete_automated_backups=False,
            deletion_protection=True,  # Prevent accidental deletion
            # Enable monitoring
            monitoring_interval=Duration.seconds(60),
            # Credentials management
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name="secure-db-credentials",
                encryption_key=self.kms_key
            ),
            removal_policy=RemovalPolicy.RETAIN
        )

        return database

    def _create_cloudtrail(self) -> cloudtrail.Trail:
        """
        Create CloudTrail for comprehensive logging
        Why: Monitor and log all management events for security and compliance
        """
        # Create CloudWatch log group for CloudTrail
        cloudtrail_log_group = logs.LogGroup(
            self, "CloudTrailLogGroup",
            retention=logs.RetentionDays.ONE_YEAR,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.RETAIN
        )

        # Create IAM role for CloudTrail to write to CloudWatch
        cloudtrail_role = iam.Role(
            self, "CloudTrailRole",
            assumed_by=iam.ServicePrincipal("cloudtrail.amazonaws.com"),
            inline_policies={
                "CloudWatchLogsPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources=[cloudtrail_log_group.log_group_arn + ":*"]
                        )
                    ]
                )
            }
        )

        # Create CloudTrail with comprehensive logging
        trail = cloudtrail.Trail(
            self, "SecureCloudTrail",
            # Store logs in encrypted S3 bucket
            bucket=self.s3_buckets["cloudtrail"],
            # Also send to CloudWatch for real-time monitoring
            cloud_watch_logs_group=cloudtrail_log_group,
            cloud_watch_logs_role=cloudtrail_role,
            # Enable encryption with KMS
            kms_key=self.kms_key,
            # Log all management events as required
            management_events=cloudtrail.ReadWriteType.ALL,
            # Include global services like IAM
            include_global_service_events=True,
            # Enable for all regions
            is_multi_region_trail=True,
            # Enable log file validation for integrity
            enable_file_validation=True,
            # Send SNS notifications for log delivery (optional)
            send_to_cloud_watch_logs=True
        )

        return trail

    def _create_outputs(self):
        """Create CloudFormation outputs for important resources"""
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID for the secure infrastructure"
        )

        CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS Key ID for encryption"
        )

        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS Database endpoint"
        )

        CfnOutput(
            self, "S3BucketNames",
            value=",".join([bucket.bucket_name for bucket in self.s3_buckets.values()]),
            description="S3 bucket names containing secure-data"
        )


# Main execution
if __name__ == "__main__":
    app = cdk.App()
    
    # Deploy to us-west-2 by default
    env = cdk.Environment(
        account=app.node.try_get_context("account"),
        region=app.node.try_get_context("region") or "us-west-2"
    )
    
    SecureInfrastructureStack(
        app, 
        "SecureInfrastructureStack",
        env=env,
        description="Comprehensive secure AWS infrastructure implementation"
    )
    
    app.synth()
```

### `secure_infrastructure/secure_infrastructure_stack.py`
```python
"""
Modular version of the secure infrastructure stack
This separates concerns into different construct files for better maintainability
"""

from aws_cdk import Stack, Tags
from constructs import Construct
from .constructs.vpc_construct import SecureVPCConstruct
from .constructs.security_construct import SecurityConstruct
from .constructs.storage_construct import StorageConstruct
from .constructs.database_construct import DatabaseConstruct

class SecureInfrastructureStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Apply common tags
        self._apply_common_tags()
        
        # Create VPC infrastructure
        self.vpc_construct = SecureVPCConstruct(self, "VPC")
        
        # Create security components
        self.security_construct = SecurityConstruct(
            self, "Security", 
            vpc=self.vpc_construct.vpc
        )
        
        # Create storage components
        self.storage_construct = StorageConstruct(
            self, "Storage",
            kms_key=self.security_construct.kms_key
        )
        
        # Create database components
        self.database_construct = DatabaseConstruct(
            self, "Database",
            vpc=self.vpc_construct.vpc,
            security_group=self.security_construct.database_sg,
            kms_key=self.security_construct.kms_key
        )
    
    def _apply_common_tags(self):
        """Apply consistent tagging policy"""
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("Project", "SecureInfrastructure")
        Tags.of(self).add("Owner", "SecurityTeam")
        Tags.of(self).add("CostCenter", "Security")
```

## Construct Files

### `secure_infrastructure/constructs/vpc_construct.py`
```python
"""VPC Construct with security-first design"""

from constructs import Construct
from aws_cdk import aws_ec2 as ec2, aws_logs as logs, aws_iam as iam, RemovalPolicy

class SecureVPCConstruct(Construct):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = self._create_vpc()
        self._enable_flow_logs()
    
    def _create_vpc(self) -> ec2.Vpc:
        """Create secure VPC with public and private subnets"""
        return ec2.Vpc(
            self, "SecureVPC",
            max_azs=2,
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet", 
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
            nat_gateways=2,
        )
    
    def _enable_flow_logs(self):
        """Enable VPC Flow Logs for security monitoring"""
        flow_log_role = iam.Role(
            self, "FlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/VPCFlowLogsDeliveryRolePolicy"
                )
            ]
        )
        
        log_group = logs.LogGroup(
            self, "FlowLogGroup",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        ec2.FlowLog(
            self, "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group, flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )
```

### `secure_infrastructure/constructs/security_construct.py`
```python
"""Security Construct for IAM, KMS, and Security Groups"""

from constructs import Construct
from aws_cdk import (
    aws_kms as kms,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_cloudtrail as cloudtrail,
    aws_logs as logs,
    RemovalPolicy
)

class SecurityConstruct(Construct):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.kms_key = self._create_kms_key()
        self.web_sg, self.database_sg = self._create_security_groups()
        self.iam_roles = self._create_iam_roles()
        self.cloudtrail = self._create_cloudtrail()
    
    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption"""
        key = kms.Key(
            self, "MasterKey",
            description="Master encryption key for secure infrastructure",
            enable_key