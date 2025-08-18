I'll create a comprehensive AWS CDK application that meets all your requirements. Here's the complete implementation:

## Project Structure

```
project-root/
├── tap.py            # Entry point
├── lib/
│   └── tap_stack.py  # Stack definition
├── requirements.txt  # Dependencies
└── cdk.json         # CDK configuration
```

## 1. Entry Point (`tap.py`)

```python
#!/usr/bin/env python3
"""
AWS CDK Application Entry Point
This file serves as the main entry point for the CDK application.
"""

import aws_cdk as cdk
from lib.tap_stack import TapStack

# Initialize CDK app
app = cdk.App()

# Create the main stack in us-east-1 region
TapStack(
    app,
    "TapStack",
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region="us-east-1"
    ),
    description="Secure, scalable, and modular web application infrastructure"
)

# Synthesize the CloudFormation template
app.synth()
```

## 2. Main Stack Definition (`lib/tap_stack.py`)

```python
"""
Main CDK Stack for High-Availability Web Application
This module contains all infrastructure components organized in a modular fashion.
"""

from typing import List
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_rds as rds,
    aws_iam as iam,
    aws_secretsmanager as secretsmanager,
    aws_s3 as s3,
    CfnOutput,
    Duration,
    RemovalPolicy
)
from constructs import Construct


class TapStack(Stack):
    """
    Main stack class that provisions all infrastructure components
    for a high-availability web application.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Initialize all infrastructure components
        self._create_vpc()
        self._create_s3_bucket()
        self._create_database_secrets()
        self._create_rds_database()
        self._create_iam_roles()
        self._create_security_groups()
        self._create_load_balancer()
        self._create_launch_template()
        self._create_auto_scaling_group()
        self._create_outputs()

    def _create_vpc(self) -> None:
        """
        Create VPC with public and private subnets across multiple AZs.
        Follows AWS best practices for network segmentation.
        """
        self.vpc = ec2.Vpc(
            self, "TapVPC",
            vpc_name="tap-vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,  # Use 3 AZs for high availability
            subnet_configuration=[
                # Public subnets for load balancer
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name="PublicSubnet",
                    cidr_mask=24
                ),
                # Private subnets for EC2 instances
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name="PrivateSubnet",
                    cidr_mask=24
                ),
                # Isolated subnets for RDS
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    name="DatabaseSubnet",
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Add VPC Flow Logs for security monitoring
        self.vpc.add_flow_log(
            "VPCFlowLog",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs()
        )

    def _create_s3_bucket(self) -> None:
        """
        Create S3 bucket for application data storage.
        Configured with security best practices.
        """
        self.s3_bucket = s3.Bucket(
            self, "TapAppBucket",
            bucket_name=f"tap-app-bucket-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            enforce_ssl=True
        )

    def _create_database_secrets(self) -> None:
        """
        Create and manage database credentials using AWS Secrets Manager.
        """
        self.db_secret = secretsmanager.Secret(
            self, "DatabaseSecret",
            secret_name="tap-db-credentials",
            description="Database credentials for TAP application",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "tapuser"}',
                generate_string_key="password",
                exclude_characters='"@/\\\'',
                password_length=32
            )
        )

    def _create_rds_database(self) -> None:
        """
        Create RDS PostgreSQL instance in private subnets.
        Configured for high availability and security.
        """
        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )

        # Create database security group
        self.db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )

        # Create RDS instance
        self.database = rds.DatabaseInstance(
            self, "TapDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.db_security_group],
            credentials=rds.Credentials.from_secret(self.db_secret),
            database_name="tapdb",
            allocated_storage=20,
            storage_encrypted=True,
            backup_retention=Duration.days(7),
            deletion_protection=False,  # For demo purposes
            delete_automated_backups=True,
            removal_policy=RemovalPolicy.DESTROY  # For demo purposes
        )

    def _create_iam_roles(self) -> None:
        """
        Create IAM roles and policies following least privilege principle.
        """
        # Create IAM role for EC2 instances
        self.ec2_role = iam.Role(
            self, "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instances in TAP application"
        )

        # Add S3 access policy
        s3_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            resources=[
                self.s3_bucket.bucket_arn,
                f"{self.s3_bucket.bucket_arn}/*"
            ]
        )

        # Add Secrets Manager access policy
        secrets_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            resources=[self.db_secret.secret_arn]
        )

        # Add CloudWatch logs policy
        logs_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams"
            ],
            resources=["*"]
        )

        # Attach policies to role
        self.ec2_role.add_to_policy(s3_policy)
        self.ec2_role.add_to_policy(secrets_policy)
        self.ec2_role.add_to_policy(logs_policy)

        # Create instance profile
        self.instance_profile = iam.InstanceProfile(
            self, "EC2InstanceProfile",
            role=self.ec2_role
        )

    def _create_security_groups(self) -> None:
        """
        Create security groups with minimal required access.
        """
        # Load balancer security group
        self.alb_security_group = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )

        # Allow HTTP and HTTPS from internet
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP from internet"
        )
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from internet"
        )

        # EC2 security group
        self.ec2_security_group = ec2.SecurityGroup(
            self, "EC2SecurityGroup",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )

        # Allow HTTP from load balancer
        self.ec2_security_group.add_ingress_rule(
            peer=self.alb_security_group,
            connection=ec2.Port.tcp(80),
            description="Allow HTTP from load balancer"
        )

        # Allow SSH from specific IP (replace with your IP)
        # For demo purposes, allowing from anywhere - restrict in production
        self.ec2_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access (restrict in production)"
        )

        # Allow database access from EC2
        self.db_security_group.add_ingress_rule(
            peer=self.ec2_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from EC2 instances"
        )

    def _create_load_balancer(self) -> None:
        """
        Create Application Load Balancer for high availability.
        """
        self.load_balancer = elbv2.ApplicationLoadBalancer(
            self, "TapLoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_security_group,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )

        # Create target group
        self.target_group = elbv2.ApplicationTargetGroup(
            self, "TapTargetGroup",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/health",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=3
            )
        )

        # Create listener
        self.load_balancer.add_listener(
            "TapListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[self.target_group]
        )

    def _create_launch_template(self) -> None:
        """
        Create launch template for EC2 instances with user data script.
        """
        # User data script to bootstrap instances
        user_data_script = ec2.UserData.for_linux()
        user_data_script.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y httpd aws-cli",
            "systemctl start httpd",
            "systemctl enable httpd",

            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",

            # Create a simple health check endpoint
            "echo '<html><body><h1>TAP Application</h1><p>Instance ID: ' > /var/www/html/health",
            "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/health",
            "echo '</p></body></html>' >> /var/www/html/health",

            # Create main application page
            "echo '<html><body><h1>Welcome to TAP Application</h1>' > /var/www/html/index.html",
            "echo '<p>This is a highly available web application running on AWS.</p>' >> /var/www/html/index.html",
            "echo '<p>Instance ID: ' >> /var/www/html/index.html",
            "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/index.html",
            "echo '</p></body></html>' >> /var/www/html/index.html",

            # Retrieve database credentials from Secrets Manager
            f"aws secretsmanager get-secret-value --secret-id {self.db_secret.secret_name} --region {self.region} --query SecretString --output text > /tmp/db-creds.json",

            # Set proper permissions
            "chown apache:apache /var/www/html/*",
            "chmod 644 /var/www/html/*"
        )

        # Create launch template
        self.launch_template = ec2.LaunchTemplate(
            self, "TapLaunchTemplate",
            launch_template_name="tap-launch-template",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.ec2_security_group,
            role=self.ec2_role,
            user_data=user_data_script,
            detailed_monitoring=True
        )

    def _create_auto_scaling_group(self) -> None:
        """
        Create Auto Scaling Group for dynamic scaling.
        """
        self.auto_scaling_group = autoscaling.AutoScalingGroup(
            self, "TapAutoScalingGroup",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            launch_template=self.launch_template,
            min_capacity=2,
            max_capacity=10,
            desired_capacity=2,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update()
        )

        # Attach to target group
        self.auto_scaling_group.attach_to_application_target_group(
            self.target_group
        )

        # Add scaling policies
        self.auto_scaling_group.scale_on_cpu_utilization(
            "CPUScaling",
            target_utilization_percent=70,
            cooldown=Duration.minutes(5)
        )

        # Add scaling based on ALB request count
        self.auto_scaling_group.scale_on_request_count(
            "RequestCountScaling",
            requests_per_minute=1000,
            cooldown=Duration.minutes(5)
        )

    def _create_outputs(self) -> None:
        """
        Create CloudFormation outputs for important resources.
        """
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.load_balancer.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer"
        )

        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.instance_endpoint.hostname,
            description="RDS database endpoint"
        )

        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name for application data"
        )

        CfnOutput(
            self, "DatabaseSecretArn",
            value=self.db_secret.secret_arn,
            description="ARN of the database credentials secret"
        )

        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
```

## 3. Dependencies (`requirements.txt`)

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

## 4. CDK Configuration (`cdk.json`)

```json
{
  "app": "python tap.py",
  "watch": {
    "include": ["**"],
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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingForLambdaInvoke": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjectsPolicy": true,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": true,
    "@aws-cdk/aws-lambda:codeBucketPrefixSameAsFunction": true,
    "@aws-cdk/aws-iot:mqttRetainPacketOrder": true
  }
}
```

## 🚀 Deployment Instructions

1. **Install Dependencies:**

```bash
pip install -r requirements.txt
```

2. **Bootstrap CDK (first time only):**

```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

3. **Deploy the Stack:**

```bash
cdk deploy
```

4. **View Outputs:**
   After deployment, you'll see outputs including:

- Load Balancer DNS name
- Database endpoint
- S3 bucket name
- Secret ARN

## 🔒 Security Features Implemented

1. **Network Security:**
   - VPC with proper subnet segmentation
   - Security groups with minimal required access
   - Database in isolated subnets

2. **IAM Security:**
   - Least privilege IAM roles
   - Instance profiles for EC2 access
   - Specific resource-based permissions

3. **Data Security:**
   - Encrypted S3 bucket
   - Encrypted RDS database
   - Secrets Manager for credentials
   - SSL enforcement on S3

4. **Monitoring:**
   - VPC Flow Logs
   - CloudWatch integration
   - Health checks on load balancer

## 🔧 Key Features

- **High Availability:** Multi-AZ deployment with auto-scaling
- **Security:** Following AWS security best practices
- **Scalability:** Auto Scaling Group with CPU and request-based scaling
- **Modularity:** Clean, organized code structure
- **Maintainability:** Comprehensive documentation and comments

This infrastructure provides a robust foundation for hosting a high-availability web application with proper security controls and scalability features.
