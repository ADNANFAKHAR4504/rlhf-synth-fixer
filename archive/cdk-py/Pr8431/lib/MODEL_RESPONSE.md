I'll create a comprehensive AWS CDK project in Python that meets all your requirements. This will be a production-ready, secure multi-environment infrastructure.

```python
# app.py
#!/usr/bin/env python3

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Environment,
    Tags,
    Duration,
    RemovalPolicy,
    aws_s3 as s3,
    aws_kms as kms,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct
from typing import Dict, List
import os

class SecureInfrastructureStack(Stack):
    """
    Secure multi-environment AWS infrastructure stack following best practices
    """
    
    def __init__(self, scope: Construct, construct_id: str, environment: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.environment = environment
        self.is_production = environment == "production"
        
        # Create KMS keys first
        self.kms_keys = self._create_kms_keys()
        
        # Create VPC and networking
        self.vpc = self._create_vpc()
        
        # Create security groups
        self.security_groups = self._create_security_groups()
        
        # Create IAM roles and policies
        self.iam_resources = self._create_iam_resources()
        
        # Create S3 buckets
        self.s3_buckets = self._create_s3_buckets()
        
        # Create RDS database
        self.rds_instance = self._create_rds_database()
        
        # Apply tags to all resources
        self._apply_tags()
    
    def _create_kms_keys(self) -> Dict[str, kms.Key]:
        """Create KMS keys for encryption"""
        keys = {}
        
        # S3 encryption key
        keys['s3'] = kms.Key(
            self, f"S3Key-{self.environment}",
            description=f"KMS key for S3 bucket encryption - {self.environment}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN if self.is_production else RemovalPolicy.DESTROY
        )
        
        # RDS encryption key
        keys['rds'] = kms.Key(
            self, f"RDSKey-{self.environment}",
            description=f"KMS key for RDS encryption - {self.environment}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN if self.is_production else RemovalPolicy.DESTROY
        )
        
        return keys
    
    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets"""
        vpc = ec2.Vpc(
            self, f"VPC-{self.environment}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=2 if self.is_production else 1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{self.environment}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Database-{self.environment}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Create VPC Flow Logs
        flow_log_role = iam.Role(
            self, f"VPCFlowLogRole-{self.environment}",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/VPCFlowLogsDeliveryRolePolicy")
            ]
        )
        
        log_group = logs.LogGroup(
            self, f"VPCFlowLogGroup-{self.environment}",
            retention=logs.RetentionDays.ONE_MONTH if not self.is_production else logs.RetentionDays.ONE_YEAR,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        ec2.FlowLog(
            self, f"VPCFlowLog-{self.environment}",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group, flow_log_role)
        )
        
        return vpc
    
    def _create_security_groups(self) -> Dict[str, ec2.SecurityGroup]:
        """Create security groups with least privilege access"""
        security_groups = {}
        
        # Web server security group
        security_groups['web'] = ec2.SecurityGroup(
            self, f"WebSG-{self.environment}",
            vpc=self.vpc,
            description=f"Security group for web servers - {self.environment}",
            allow_all_outbound=False
        )
        
        # Allow HTTPS from anywhere
        security_groups['web'].add_ingress_rule(
            peer=ec2.Peer.ipv4("0.0.0.0/0"),
            connection=ec2.Port.tcp(443),
            description="HTTPS from anywhere"
        )
        
        # Allow HTTP from anywhere (redirect to HTTPS)
        security_groups['web'].add_ingress_rule(
            peer=ec2.Peer.ipv4("0.0.0.0/0"),
            connection=ec2.Port.tcp(80),
            description="HTTP from anywhere"
        )
        
        # Allow SSH from specific CIDR (company network)
        company_cidr = "203.0.113.0/24"  # Replace with your company's CIDR
        security_groups['web'].add_ingress_rule(
            peer=ec2.Peer.ipv4(company_cidr),
            connection=ec2.Port.tcp(22),
            description="SSH from company network"
        )
        
        # Outbound rules for web servers
        security_groups['web'].add_egress_rule(
            peer=ec2.Peer.ipv4("0.0.0.0/0"),
            connection=ec2.Port.tcp(443),
            description="HTTPS outbound"
        )
        
        security_groups['web'].add_egress_rule(
            peer=ec2.Peer.ipv4("0.0.0.0/0"),
            connection=ec2.Port.tcp(80),
            description="HTTP outbound"
        )
        
        # Database security group
        security_groups['database'] = ec2.SecurityGroup(
            self, f"DatabaseSG-{self.environment}",
            vpc=self.vpc,
            description=f"Security group for database - {self.environment}",
            allow_all_outbound=False
        )
        
        # Allow MySQL/Aurora from web servers only
        security_groups['database'].add_ingress_rule(
            peer=security_groups['web'],
            connection=ec2.Port.tcp(3306),
            description="MySQL from web servers"
        )
        
        # Application security group
        security_groups['application'] = ec2.SecurityGroup(
            self, f"ApplicationSG-{self.environment}",
            vpc=self.vpc,
            description=f"Security group for application servers - {self.environment}",
            allow_all_outbound=False
        )
        
        # Allow application port from web servers
        security_groups['application'].add_ingress_rule(
            peer=security_groups['web'],
            connection=ec2.Port.tcp(8080),
            description="Application port from web servers"
        )
        
        # Outbound to database
        security_groups['application'].add_egress_rule(
            peer=security_groups['database'],
            connection=ec2.Port.tcp(3306),
            description="MySQL to database"
        )
        
        # Outbound HTTPS for API calls
        security_groups['application'].add_egress_rule(
            peer=ec2.Peer.ipv4("0.0.0.0/0"),
            connection=ec2.Port.tcp(443),
            description="HTTPS outbound for APIs"
        )
        
        return security_groups
    
    def _create_iam_resources(self) -> Dict[str, iam.Role]:
        """Create IAM roles and policies following least privilege principle"""
        roles = {}
        
        # EC2 Instance Role for Web Servers
        roles['ec2_web'] = iam.Role(
            self, f"EC2WebRole-{self.environment}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description=f"Role for EC2 web servers - {self.environment}"
        )
        
        # Policy for web servers to access S3 buckets
        web_s3_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            resources=[
                f"arn:aws:s3:::web-assets-{self.environment}-*/*",
                f"arn:aws:s3:::user-uploads-{self.environment}-*/*"
            ]
        )
        
        roles['ec2_web'].add_to_policy(web_s3_policy)
        
        # CloudWatch Logs permissions
        cloudwatch_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams"
            ],
            resources=[f"arn:aws:logs:us-west-2:*:log-group:/aws/ec2/{self.environment}/*"]
        )
        
        roles['ec2_web'].add_to_policy(cloudwatch_policy)
        
        # EC2 Instance Role for Application Servers
        roles['ec2_app'] = iam.Role(
            self, f"EC2AppRole-{self.environment}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description=f"Role for EC2 application servers - {self.environment}"
        )
        
        # Application-specific S3 permissions
        app_s3_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject"
            ],
            resources=[
                f"arn:aws:s3:::app-data-{self.environment}-*/*"
            ]
        )
        
        roles['ec2_app'].add_to_policy(app_s3_policy)
        roles['ec2_app'].add_to_policy(cloudwatch_policy)
        
        # Environment-specific permissions
        if self.is_production:
            # Production has more restrictive permissions
            backup_policy = iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "rds:CreateDBSnapshot",
                    "rds:DescribeDBSnapshots"
                ],
                resources=["*"],
                conditions={
                    "StringEquals": {
                        "aws:RequestedRegion": "us-west-2"
                    }
                }
            )
            roles['ec2_app'].add_to_policy(backup_policy)
        else:
            # Development has additional permissions for testing
            dev_policy = iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:ListBucket",
                    "s3:GetBucketLocation"
                ],
                resources=[
                    f"arn:aws:s3:::*-{self.environment}-*"
                ]
            )
            roles['ec2_app'].add_to_policy(dev_policy)
        
        # Lambda execution role (if needed)
        roles['lambda'] = iam.Role(
            self, f"LambdaRole-{self.environment}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            description=f"Role for Lambda functions - {self.environment}"
        )
        
        return roles
    
    def _create_s3_buckets(self) -> Dict[str, s3.Bucket]:
        """Create S3 buckets with encryption and security best practices"""
        buckets = {}
        
        # Common bucket configuration
        bucket_config = {
            "encryption": s3.BucketEncryption.KMS,
            "encryption_key": self.kms_keys['s3'],
            "versioned": True,
            "block_public_access": s3.BlockPublicAccess.BLOCK_ALL,
            "removal_policy": RemovalPolicy.RETAIN if self.is_production else RemovalPolicy.DESTROY,
            "enforce_ssl": True,
            "server_access_logs_prefix": "access-logs/",
        }
        
        # Web assets bucket
        buckets['web_assets'] = s3.Bucket(
            self, f"WebAssets-{self.environment}",
            bucket_name=f"web-assets-{self.environment}-{self.account}-{self.region}",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(1)
                )
            ],
            **bucket_config
        )
        
        # User uploads bucket
        buckets['user_uploads'] = s3.Bucket(
            self, f"UserUploads-{self.environment}",
            bucket_name=f"user-uploads-{self.environment}-{self.account}-{self.region}",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
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
            **bucket_config
        )
        
        # Application data bucket
        buckets['app_data'] = s3.Bucket(
            self, f"AppData-{self.environment}",
            bucket_name=f"app-data-{self.environment}-{self.account}-{self.region}",
            **bucket_config
        )
        
        # Backup bucket (production only)
        if self.is_production:
            buckets['backups'] = s3.Bucket(
                self, f"Backups-{self.environment}",
                bucket_name=f"backups-{self.environment}-{self.account}-{self.region}",
                lifecycle_rules=[
                    s3.LifecycleRule(
                        id="BackupRetention",
                        transitions=[
                            s3.Transition(
                                storage_class=s3.StorageClass.GLACIER,
                                transition_after=Duration.days(30)
                            ),
                            s3.Transition(
                                storage_class=s3.StorageClass.DEEP_ARCHIVE,
                                transition_after=Duration.days(365)
                            )
                        ],
                        expiration=Duration.days(2555)  # 7 years
                    )
                ],
                **bucket_config
            )
        
        return buckets
    
    def _create_rds_database(self) -> rds.DatabaseInstance:
        """Create RDS database with encryption and backup"""
        
        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self, f"DBSubnetGroup-{self.environment}",
            description=f"Subnet group for RDS - {self.environment}",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )
        
        # Database configuration based on environment
        if self.is_production:
            instance_type = ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
            multi_az = True
            backup_retention = Duration.days(30)
            deletion_protection = True
        else:
            instance_type = ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO)
            multi_az = False
            backup_retention = Duration.days(7)
            deletion_protection = False
        
        # Create RDS instance
        database = rds.DatabaseInstance(
            self, f"Database-{self.environment}",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=instance_type,
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.security_groups['database']],
            storage_encrypted=True,
            storage_encryption_key=self.kms_keys['rds'],
            multi_az=multi_az,
            backup_retention=backup_retention,
            delete_automated_backups=not self.is_production,
            deletion_protection=deletion_protection,
            removal_policy=RemovalPolicy.RETAIN if self.is_production else RemovalPolicy.DESTROY,
            allocated_storage=20,
            max_allocated_storage=100,
            enable_performance_insights=self.is_production,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT if self.is_production else None,
            monitoring_interval=Duration.seconds(60) if self.is_production else None,
            auto_minor_version_upgrade=True,
            parameter_group=rds.ParameterGroup.from_parameter_group_name(
                self, f"DBParameterGroup-{self.environment}",
                parameter_group_name="default.mysql8.0"
            )
        )
        
        return database
    
    def _apply_tags(self) -> None:
        """Apply consistent tags to all resources"""
        tags = {
            "Environment": self.environment,
            "Project": "SecureInfrastructure",
            "ManagedBy": "CDK",
            "CostCenter": "Engineering",
            "Owner": "Platform Team"
        }
        
        if self.is_production:
            tags["Backup"] = "Required"
            tags["Monitoring"] = "Critical"
        
        for key, value in tags.items():
            Tags.of(self).add(key, value)


class SecureInfrastructureApp(cdk.App):
    """Main CDK application"""
    
    def __init__(self):
        super().__init__()
        
        # Environment configuration
        env_us_west_2 = Environment(
            account=os.getenv('CDK_DEFAULT_ACCOUNT'),
            region='us-west-2'
        )
        
        # Deploy development environment
        dev_stack = SecureInfrastructureStack(
            self, "SecureInfra-Dev",
            environment="development",
            env=env_us_west_2,
            description="Secure infrastructure stack for development environment"
        )
        
        # Deploy production environment
        prod_stack = SecureInfrastructureStack(
            self, "SecureInfra-Prod",
            environment="production",
            env=env_us_west_2,
            description="Secure infrastructure stack for production environment"
        )
        
        # Add stack-level tags
        Tags.of(dev_stack).add("StackType", "Development")
        Tags.of(prod_stack).add("StackType", "Production")


# Create and run the app
app = SecureInfrastructureApp()
app.synth()
```

## Additional Required Files

Create these additional files in your project:

### requirements.txt
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### cdk.json
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
    "@aws-cdk/aws-s3:autoDeleteObjectsPolicy": true,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": true,
    "@aws-cdk/aws-route53:deleteRoute53RecordSet": true,
    "@aws-cdk/aws-cloudformation:parseTemplateByDefault": true,
    "@aws-cdk/aws-elasticloadbalancingv2:trustStoreSupported": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueFalse": true,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:reduceRunTaskPermissions": true,
    "@aws-cdk/aws-events:generatedRuleIsNotManagedByConfig": true,
    "@aws-cdk/aws-route53-resolver:removeEmptyStringFromResolverQueryLogConfigAssociationName": true,
    "@aws-cdk/aws-lambda:defineRuntime": true
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Bootstrap CDK (first time only):**
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

3. **Deploy development environment:**
```bash
cdk deploy SecureInfra-Dev
```

4. **Deploy production environment:**
```bash
cdk deploy SecureInfra-Prod
```

## Key Security Features Implemented

### **Storage Encryption**
- All S3 buckets use AWS KMS encryption with customer-managed keys
- RDS instances encrypted at rest with KMS
- Versioning enabled on all S3 buckets
- Public access completely blocked on S3 buckets

### **Network Security**
- VPC with public, private, and isolated subnets
- Security groups with least privilege access
- VPC Flow Logs enabled for monitoring
- Restricted inbound/outbound rules

### **Access Control**
- IAM roles follow principle of least privilege
- Separate roles for different environments
- Environment-specific permissions
- Resource-based policies

### **Tagging & Environment Separation**
- Comprehensive tagging strategy
- Environment-specific configurations
- Cost tracking and resource management
- Automated compliance tagging

This infrastructure provides a solid foundation for secure, scalable applications with proper separation between development and production environments.