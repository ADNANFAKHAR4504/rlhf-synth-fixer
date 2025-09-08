# High Availability and Fault-Tolerant Web Infrastructure on AWS

I'll help you create a comprehensive, production-ready AWS CDK Python project that delivers a highly available, fault-tolerant web application infrastructure. This solution will incorporate all the requirements you've outlined with best practices and automated failure recovery.

## 🏗️ Project Structure

```
ha-web-infrastructure/
├── app.py
├── requirements.txt
├── cdk.json
├── README.md
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
│   │   ├── security.py
│   │   └── dns.py
│   └── lambda_functions/
│       ├── auto_recovery.py
│       └── health_checker.py
└── scripts/
    ├── deploy.sh
    └── destroy.sh
```

## 📋 Configuration Files

### `requirements.txt`
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.26.0
```

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
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true,
    "environment": "production",
    "domain_name": "your-domain.com",
    "notification_email": "alerts@your-domain.com"
  }
}
```

## 🚀 Main Application Entry Point

### `app.py`
```python
#!/usr/bin/env python3
"""
High Availability Web Infrastructure
AWS CDK Application Entry Point

This application creates a highly available, fault-tolerant web infrastructure
across multiple availability zones with automated failure recovery.
"""

import aws_cdk as cdk
from ha_web_infrastructure.ha_web_stack import HaWebStack

# Initialize CDK app
app = cdk.App()

# Get configuration from context
environment = app.node.try_get_context("environment") or "production"
domain_name = app.node.try_get_context("domain_name") or "example.com"
notification_email = app.node.try_get_context("notification_email") or "admin@example.com"

# Define deployment environment
env = cdk.Environment(
    account=app.node.try_get_context("account"),
    region=app.node.try_get_context("region") or "us-east-1"
)

# Standard tags for all resources
standard_tags = {
    "Environment": environment,
    "Project": "HA-Web-Infrastructure",
    "Owner": "DevOps-Team",
    "CostCenter": "Engineering",
    "Application": "WebApp",
    "ManagedBy": "CDK",
    "BackupRequired": "true",
    "MonitoringRequired": "true"
}

# Create the main stack
ha_web_stack = HaWebStack(
    app,
    f"HaWebStack-{environment}",
    env=env,
    description=f"High Availability Web Application Infrastructure - {environment}",
    domain_name=domain_name,
    notification_email=notification_email,
    environment=environment
)

# Apply standard tags to all resources in the stack
for key, value in standard_tags.items():
    cdk.Tags.of(ha_web_stack).add(key, value)

# Synthesize the CDK app
app.synth()
```

## 🏗️ Main Stack Implementation

### `ha_web_infrastructure/ha_web_stack.py`
```python
"""
High Availability Web Stack

This stack orchestrates all the components needed for a highly available,
fault-tolerant web application infrastructure.
"""

from aws_cdk import (
    Stack,
    CfnOutput,
    Duration
)
from constructs import Construct

from .constructs.security import SecurityConstruct
from .constructs.networking import NetworkingConstruct
from .constructs.database import DatabaseConstruct
from .constructs.storage import StorageConstruct
from .constructs.compute import ComputeConstruct
from .constructs.monitoring import MonitoringConstruct
from .constructs.dns import DnsConstruct

class HaWebStack(Stack):
    """
    High Availability Web Application Stack
    
    Creates a comprehensive, fault-tolerant infrastructure with:
    - Multi-AZ deployment for high availability
    - Auto Scaling for dynamic capacity management
    - Load balancing for traffic distribution
    - Database with read replicas
    - Cross-region data replication
    - Automated monitoring and recovery
    - DNS failover capabilities
    """

    def __init__(self, scope: Construct, construct_id: str, 
                 domain_name: str, notification_email: str, 
                 environment: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.domain_name = domain_name
        self.notification_email = notification_email
        self.environment = environment

        # 1. Security Foundation - KMS keys, IAM roles, and policies
        print("🔐 Setting up security infrastructure...")
        self.security = SecurityConstruct(
            self, "Security",
            environment=environment
        )

        # 2. Networking - VPC, subnets, security groups across multiple AZs
        print("🌐 Creating networking infrastructure...")
        self.networking = NetworkingConstruct(
            self, "Networking",
            kms_key=self.security.kms_key,
            environment=environment
        )

        # 3. Database - RDS Aurora with read replicas for high availability
        print("🗄️ Setting up database infrastructure...")
        self.database = DatabaseConstruct(
            self, "Database",
            vpc=self.networking.vpc,
            kms_key=self.security.kms_key,
            db_security_group=self.networking.db_security_group,
            environment=environment
        )

        # 4. Storage - S3 with cross-region replication
        print("💾 Creating storage infrastructure...")
        self.storage = StorageConstruct(
            self, "Storage",
            kms_key=self.security.kms_key,
            environment=environment
        )

        # 5. Compute - EC2 instances, ALB, Auto Scaling Group
        print("⚡ Deploying compute infrastructure...")
        self.compute = ComputeConstruct(
            self, "Compute",
            vpc=self.networking.vpc,
            database=self.database,
            storage=self.storage,
            security=self.security,
            alb_security_group=self.networking.alb_security_group,
            ec2_security_group=self.networking.ec2_security_group,
            environment=environment
        )

        # 6. Monitoring - CloudWatch, alarms, Lambda for auto-recovery
        print("📊 Setting up monitoring and auto-recovery...")
        self.monitoring = MonitoringConstruct(
            self, "Monitoring",
            auto_scaling_group=self.compute.auto_scaling_group,
            load_balancer=self.compute.load_balancer,
            database=self.database,
            storage=self.storage,
            lambda_role=self.security.lambda_execution_role,
            notification_email=notification_email,
            environment=environment
        )

        # 7. DNS - Route 53 with health checks and failover
        print("🌍 Configuring DNS with health checks...")
        self.dns = DnsConstruct(
            self, "DNS",
            domain_name=domain_name,
            load_balancer=self.compute.load_balancer,
            environment=environment
        )

        # Stack Outputs
        self._create_outputs()

    def _create_outputs(self):
        """Create CloudFormation outputs for important resources"""
        
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.compute.load_balancer.load_balancer_dns_name,
            description="Application Load Balancer DNS name",
            export_name=f"HaWeb-{self.environment}-ALB-DNS"
        )

        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.cluster.cluster_endpoint.hostname,
            description="RDS Aurora cluster endpoint",
            export_name=f"HaWeb-{self.environment}-DB-Endpoint"
        )

        CfnOutput(
            self, "PrimaryBucketName",
            value=self.storage.primary_bucket.bucket_name,
            description="Primary S3 bucket name",
            export_name=f"HaWeb-{self.environment}-S3-Primary"
        )

        CfnOutput(
            self, "HostedZoneId",
            value=self.dns.hosted_zone.hosted_zone_id,
            description="Route 53 hosted zone ID",
            export_name=f"HaWeb-{self.environment}-HostedZone-ID"
        )

        CfnOutput(
            self, "WebsiteURL",
            value=f"https://{self.domain_name}",
            description="Website URL",
            export_name=f"HaWeb-{self.environment}-Website-URL"
        )
```

## 🔐 Security Infrastructure

### `ha_web_infrastructure/constructs/security.py`
```python
"""
Security Construct

Implements comprehensive security measures including:
- KMS encryption keys
- IAM roles and policies with least privilege
- Security groups and NACLs
- Secrets management
"""

from aws_cdk import (
    aws_kms as kms,
    aws_iam as iam,
    aws_secretsmanager as secrets,
    RemovalPolicy,
    Duration
)
from constructs import Construct

class SecurityConstruct(Construct):
    """
    Security infrastructure with encryption, IAM roles, and access policies
    following the principle of least privilege.
    """

    def __init__(self, scope: Construct, construct_id: str, environment: str) -> None:
        super().__init__(scope, construct_id)

        self.environment = environment
        
        # Create KMS keys for encryption
        self._create_kms_keys()
        
        # Create IAM roles and policies
        self._create_iam_roles()
        
        # Create secrets for sensitive data
        self._create_secrets()

    def _create_kms_keys(self):
        """Create KMS keys for different services"""
        
        # Main KMS key for general encryption
        self.kms_key = kms.Key(
            self, "MainKMSKey",
            description=f"Main KMS key for HA Web Infrastructure - {self.environment}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias=f"alias/ha-web-main-{self.environment}"
        )

        # Separate key for database encryption
        self.db_kms_key = kms.Key(
            self, "DatabaseKMSKey",
            description=f"Database encryption key - {self.environment}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias=f"alias/ha-web-db-{self.environment}"
        )

        # Key for Lambda function encryption
        self.lambda_kms_key = kms.Key(
            self, "LambdaKMSKey",
            description=f"Lambda function encryption key - {self.environment}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias=f"alias/ha-web-lambda-{self.environment}"
        )

    def _create_iam_roles(self):
        """Create IAM roles with least privilege access"""
        
        # EC2 Instance Role
        self.ec2_instance_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instances",
            role_name=f"HaWeb-EC2-Role-{self.environment}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ],
            inline_policies={
                "S3Access": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject"
                            ],
                            resources=["arn:aws:s3:::ha-web-*/*"]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["s3:ListBucket"],
                            resources=["arn:aws:s3:::ha-web-*"]
                        )
                    ]
                ),
                "KMSAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "kms:Decrypt",
                                "kms:GenerateDataKey",
                                "kms:CreateGrant"
                            ],
                            resources=[
                                self.kms_key.key_arn,
                                self.db_kms_key.key_arn
                            ]
                        )
                    ]
                )
            }
        )

        # Lambda Execution Role for Auto Recovery
        self.lambda_execution_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="IAM role for Lambda auto-recovery functions",
            role_name=f"HaWeb-Lambda-Role-{self.environment}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "AutoRecoveryPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "ec2:DescribeInstances",
                                "ec2:StartInstances",
                                "ec2:StopInstances",
                                "ec2:RebootInstances",
                                "autoscaling:DescribeAutoScalingGroups",
                                "autoscaling:SetDesiredCapacity",
                                "autoscaling:UpdateAutoScalingGroup",
                                "elasticloadbalancing:DescribeTargetHealth",
                                "route53:ChangeResourceRecordSets",
                                "route53:GetHealthCheck",
                                "route53:ListHealthChecks",
                                "sns:Publish",
                                "cloudwatch:PutMetricData"
                            ],
                            resources=["*"]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            resources=[self.lambda_kms_key.key_arn]
                        )
                    ]
                )
            }
        )

        # RDS Enhanced Monitoring Role
        self.rds_monitoring_role = iam.Role(
            self, "RDSMonitoringRole",
            assumed_by=iam.ServicePrincipal("monitoring.rds.amazonaws.com"),
            description="IAM role for RDS Enhanced Monitoring",
            role_name=f"HaWeb-RDS-Monitoring-Role-{self.environment}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonRDSEnhancedMonitoringRole")
            ]
        )

    def _create_secrets(self):
        """Create secrets for sensitive configuration data"""
        
        # Application configuration secrets
        self.app_secrets = secrets.Secret(
            self, "AppSecrets",
            description=f"Application secrets for HA Web - {self.environment}",
            secret_name=f"ha-web/app-config/{self.environment}",
            encryption_key=self.kms_key,
            generate_secret_string=secrets.SecretStringGenerator(
                secret_string_template='{"username": "admin"}',
                generate_string_key="password",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\\\"",
                password_length=32
            )
        )
```

## 🌐 Networking Infrastructure

### `ha_web_infrastructure/constructs/networking.py`
```python
"""
Networking Construct

Creates a robust networking foundation with:
- Multi-AZ VPC with public, private, and database subnets
- Security groups with least privilege access
- NAT Gateways for high availability
- VPC Flow Logs for security monitoring
"""

from aws_cdk import (
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_logs as logs,
    RemovalPolicy
)
from constructs import Construct

class NetworkingConstruct(Construct):
    """
    Networking infrastructure spanning multiple availability zones
    for high availability and fault tolerance.
    """

    def __init__(self, scope: Construct, construct_id: str, 
                 kms_key: kms.Key, environment: str) -> None:
        super().__init__(scope, construct_id)

        self.kms_key = kms_key
        self.environment = environment

        # Create VPC with multiple AZs
        self._create_vpc()
        
        # Create security groups
        self._create_security_groups()
        
        # Setup VPC Flow Logs
        self._setup_flow_logs()

    def _create_vpc(self):
        """Create VPC with subnets across multiple availability zones"""
        
        self.vpc = ec2.Vpc(
            self, "VPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,  # Use 3 AZs for maximum availability
            nat_gateways=2,  # NAT gateways in 2 AZs for redundancy
            nat_gateway_provider=ec2.NatProvider.gateway(),
            subnet_configuration=[
                # Public subnets for ALB and NAT Gateways
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                    map_public_ip_on_launch=True
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
            enable_dns_support=True,
            vpc_name=f"HaWeb-VPC-{self.environment}"
        )

        # Add VPC endpoints for AWS services to reduce NAT Gateway costs
        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )

        self.vpc.add_gateway_endpoint(
            "DynamoDBEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )

    def _create_security_groups(self):
        """Create security groups for different application tiers"""
        
        # Application Load Balancer Security Group
        self.alb_security_group = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            security_group_name=f"HaWeb-ALB-SG-{self.environment}",
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

        # EC2 Instances Security Group
        self.ec2_security_group = ec2.SecurityGroup(
            self, "EC2SecurityGroup",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            security_group_name=f"HaWeb-EC2-SG-{self.environment}",
            allow_all_outbound=True
        )
        
        # Allow traffic from ALB only
        self.ec2_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(80),
            "Allow HTTP from ALB"
        )
        
        # Allow SSH from bastion host (if needed for maintenance)
        self.ec2_security_group.add_ingress_rule(
            ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            ec2.Port.tcp(22),
            "Allow SSH from VPC (for maintenance)"
        )

        # Database Security Group
        self.db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
            security_group_name=f"HaWeb-DB-SG-{self.environment}",
            allow_all_outbound=False
        )
        
        # Allow MySQL/Aurora access from EC2 instances only
        self.db_security_group.add_ingress_rule(
            self.ec2_security_group,
            ec2.Port.tcp(3306),
            "Allow MySQL access from EC2 instances"
        )

        # Lambda Security Group (for auto-recovery functions)
        self.lambda_security_group = ec2.SecurityGroup(
            self, "LambdaSecurityGroup",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            security_group_name=f"HaWeb-Lambda-SG-{self.environment}",
            allow_all_outbound=True
        )

    def _setup_flow_logs(self):
        """Setup VPC Flow Logs for security monitoring"""
        
        # Create log group for VPC Flow Logs
        flow_log_group = logs.LogGroup(
            self, "VPCFlowLogsGroup",
            log_group_name=f"/aws/vpc/flowlogs/{self.environment}",
            retention=logs.RetentionDays.ONE_MONTH,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create VPC Flow Logs
        ec2.FlowLog(
            self, "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(flow_log_group),
            traffic_type=ec2.FlowLogTrafficType.ALL,
            flow_log_name=f"HaWeb-VPC-FlowLog-{self.environment}"
        )
```

## ⚡ Compute Infrastructure

### `ha_web_infrastructure/constructs/compute.py`
```python
"""
Compute Construct

Implements scalable compute infrastructure with:
- Application Load Balancer for traffic distribution
- Auto Scaling Group for dynamic capacity management
- Launch Template with optimized configurations
- Health checks and monitoring integration
"""

from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    aws_certificatemanager as acm,
    Duration,
    CfnOutput
)
from constructs import Construct

class ComputeConstruct(Construct):
    """
    Compute infrastructure with load balancing and auto scaling
    for high availability and fault tolerance.
    """

    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 database, storage, security, alb_security_group: ec2.SecurityGroup,
                 ec2_security_group: ec2.SecurityGroup, environment: str) -> None:
        super().__init__(scope, construct_id)

        self.vpc = vpc
        self.database = database
        self.storage = storage
        self.security = security
        self.environment = environment

        # Create Application Load Balancer
        self._create_load_balancer(alb_security_group)
        
        # Create Launch Template and Auto Scaling Group
        self._create_auto_scaling_group(ec2_security_group)
        
        # Configure load balancer targets and listeners
        self._configure_load_balancer()

    def _create_load_balancer(self, security_group: ec2.SecurityGroup):
        """Create Application Load Balancer with high availability"""
        
        self.load_balancer = elbv2.ApplicationLoadBalancer(
            self, "ApplicationLoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            security_group=security_group,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            deletion_protection=True,  # Prevent accidental deletion
            load_balancer_name=f"HaWeb-ALB-{self.environment}",
            idle_timeout=Duration.seconds(60)
        )

        # Enable access logs
        self.load_balancer.log_access_logs(
            bucket=self.storage.access_logs_bucket,
            prefix="alb-access-logs"
        )

    def _create_auto_scaling_group(self, security_group: ec2.SecurityGroup):
        """Create Auto Scaling Group with Launch Template"""
        
        # Create user data script for EC2 instances
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            
            # Install and configure Apache
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            
            # Create a simple web application
            "cat > /var/www/html/index.html << 'EOF'",
            """<!DOCTYPE html>
<html>
<head>
    <title>High Availability Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { color: #28a745; font-weight: bold; }
        .info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 High Availability Web Application</h1>
        <p class="status">✅ Application is running successfully!</p>
        <div class="info">
            <h3>Instance Information:</h3>
            <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
            <p><strong>Availability Zone:</strong> <span id="az">Loading...</span></p>
            <p><strong>Region:</strong> <span id="region">Loading...</span></p>
            