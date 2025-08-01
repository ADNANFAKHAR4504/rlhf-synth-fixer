I'll create a secure AWS infrastructure using CDK Python with all the requirements you specified. Here's the complete implementation:

## `tap.py` - CDK App Entrypoint

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get allowed IP ranges from context or use default
allowed_ip_ranges = app.node.try_get_context("allowed_ip_ranges") or ["0.0.0.0/0"]

TapStack(
    app, 
    "TapStack",
    env=cdk.Environment(region="us-east-1"),
    allowed_ip_ranges=allowed_ip_ranges,
    description="Secure AWS Infrastructure with VPC, EC2, RDS, ALB, and S3"
)

app.synth()
```

## `lib/tap_stack.py` - CDK Stack Definition

```python
from typing import List
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_logs as logs,
    aws_kms as kms,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class TapStack(Stack):
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str, 
        allowed_ip_ranges: List[str],
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.allowed_ip_ranges = allowed_ip_ranges
        
        # Common tags for all resources
        self.common_tags = {
            "Environment": "Production",
            "Project": "TapInfrastructure",
            "ManagedBy": "CDK"
        }
        
        # Apply tags to the stack
        for key, value in self.common_tags.items():
            cdk.Tags.of(self).add(key, value)
        
        # Create infrastructure components
        self.create_vpc()
        self.create_security_groups()
        self.create_iam_roles()
        self.create_kms_key()
        self.create_s3_bucket()
        self.create_ec2_instance()
        self.create_rds_instance()
        self.create_application_load_balancer()
        self.create_vpc_flow_logs()
        self.create_outputs()

    def create_vpc(self):
        """Create VPC with public and private subnets across 2 AZs"""
        self.vpc = ec2.Vpc(
            self,
            "TapVPC",
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
                )
            ],
            nat_gateways=1,  # One NAT Gateway for cost optimization
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

    def create_security_groups(self):
        """Create security groups for EC2, RDS, and ALB"""
        
        # ALB Security Group
        self.alb_security_group = ec2.SecurityGroup(
            self,
            "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        # Add HTTP and HTTPS ingress rules for ALB from allowed IPs
        for ip_range in self.allowed_ip_ranges:
            self.alb_security_group.add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(80),
                description=f"Allow HTTP from {ip_range}"
            )
            self.alb_security_group.add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(443),
                description=f"Allow HTTPS from {ip_range}"
            )
        
        # EC2 Security Group
        self.ec2_security_group = ec2.SecurityGroup(
            self,
            "EC2SecurityGroup",
            vpc=self.vpc,
            description="Security group for EC2 instance",
            allow_all_outbound=True
        )
        
        # Add SSH access from allowed IPs
        for ip_range in self.allowed_ip_ranges:
            self.ec2_security_group.add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(22),
                description=f"Allow SSH from {ip_range}"
            )
        
        # Allow HTTP from ALB
        self.ec2_security_group.add_ingress_rule(
            peer=self.alb_security_group,
            connection=ec2.Port.tcp(80),
            description="Allow HTTP from ALB"
        )
        
        # RDS Security Group
        self.rds_security_group = ec2.SecurityGroup(
            self,
            "RDSSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS PostgreSQL instance",
            allow_all_outbound=False
        )
        
        # Allow PostgreSQL access only from EC2 security group
        self.rds_security_group.add_ingress_rule(
            peer=self.ec2_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from EC2"
        )

    def create_iam_roles(self):
        """Create IAM roles with least privilege principles"""
        
        # EC2 IAM Role
        self.ec2_role = iam.Role(
            self,
            "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instance with minimal permissions"
        )
        
        # Add S3 read-only access to specific bucket
        self.ec2_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:ListBucket"
                ],
                resources=[
                    f"arn:aws:s3:::tap-secure-bucket-{self.account}",
                    f"arn:aws:s3:::tap-secure-bucket-{self.account}/*"
                ]
            )
        )
        
        # Add CloudWatch write access
        self.ec2_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:PutMetricData",
                    "ec2:DescribeVolumes",
                    "ec2:DescribeTags",
                    "logs:PutLogEvents",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:DescribeLogStreams",
                    "logs:DescribeLogGroups"
                ],
                resources=["*"]
            )
        )
        
        # Create instance profile
        self.instance_profile = iam.InstanceProfile(
            self,
            "EC2InstanceProfile",
            role=self.ec2_role
        )

    def create_kms_key(self):
        """Create KMS key for encryption"""
        self.kms_key = kms.Key(
            self,
            "TapKMSKey",
            description="KMS key for encrypting S3 bucket and RDS",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Add key alias
        kms.Alias(
            self,
            "TapKMSKeyAlias",
            alias_name="alias/tap-infrastructure-key",
            target_key=self.kms_key
        )

    def create_s3_bucket(self):
        """Create S3 bucket with security configurations"""
        self.s3_bucket = s3.Bucket(
            self,
            "TapSecureBucket",
            bucket_name=f"tap-secure-bucket-{self.account}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,  # For demo purposes
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ]
        )
        
        # Add bucket policy to restrict access to specific IP ranges
        bucket_policy_statements = []
        for ip_range in self.allowed_ip_ranges:
            bucket_policy_statements.append(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    principals=[iam.AnyPrincipal()],
                    actions=["s3:GetObject"],
                    resources=[f"{self.s3_bucket.bucket_arn}/*"],
                    conditions={
                        "IpAddress": {
                            "aws:SourceIp": ip_range
                        }
                    }
                )
            )
        
        # Add policy to allow EC2 role access
        bucket_policy_statements.append(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[self.ec2_role],
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:ListBucket"
                ],
                resources=[
                    self.s3_bucket.bucket_arn,
                    f"{self.s3_bucket.bucket_arn}/*"
                ]
            )
        )
        
        # Apply bucket policy
        self.s3_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    self.s3_bucket.bucket_arn,
                    f"{self.s3_bucket.bucket_arn}/*"
                ],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            )
        )

    def create_ec2_instance(self):
        """Create EC2 instance in public subnet"""
        
        # Get latest Amazon Linux 2 AMI
        amzn_linux = ec2.MachineImage.latest_amazon_linux(
            generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            edition=ec2.AmazonLinuxEdition.STANDARD,
            virtualization=ec2.AmazonLinuxVirt.HVM,
            storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE
        )
        
        # User data script for basic setup
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from Tap Infrastructure</h1>' > /var/www/html/index.html",
            "yum install -y amazon-cloudwatch-agent",
            # Install and configure CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm"
        )
        
        # Create EC2 instance
        self.ec2_instance = ec2.Instance(
            self,
            "TapEC2Instance",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=amzn_linux,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            security_group=self.ec2_security_group,
            role=self.ec2_role,
            user_data=user_data,
            detailed_monitoring=True,  # Enable CloudWatch detailed monitoring
            key_name=None  # Remove if you want to specify a key pair
        )
        
        # Create and associate Elastic IP
        self.elastic_ip = ec2.CfnEIP(
            self,
            "TapElasticIP",
            domain="vpc",
            instance_id=self.ec2_instance.instance_id
        )

    def create_rds_instance(self):
        """Create RDS PostgreSQL instance in private subnet"""
        
        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self,
            "TapDBSubnetGroup",
            description="Subnet group for RDS instance",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )
        
        # Create RDS instance
        self.rds_instance = rds.DatabaseInstance(
            self,
            "TapRDSInstance",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_14_9
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.rds_security_group],
            database_name="tapdb",
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name="tap-rds-credentials"
            ),
            allocated_storage=20,
            storage_type=rds.StorageType.GP2,
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup_retention=Duration.days(7),
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            cloudwatch_logs_exports=["postgresql"],
            deletion_protection=False,  # Set to True for production
            removal_policy=RemovalPolicy.DESTROY  # Change for production
        )

    def create_application_load_balancer(self):
        """Create Application Load Balancer"""
        
        # Create ALB
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            "TapALB",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_security_group,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )
        
        # Create target group
        self.target_group = elbv2.ApplicationTargetGroup(
            self,
            "TapTargetGroup",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            targets=[elbv2.InstanceTarget(self.ec2_instance)],
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/",
                port="80",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=3,
                healthy_threshold_count=2
            )
        )
        
        # Create listener
        self.alb_listener = self.alb.add_listener(
            "TapALBListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[self.target_group]
        )

    def create_vpc_flow_logs(self):
        """Create VPC Flow Logs to CloudWatch"""
        
        # Create CloudWatch Log Group for VPC Flow Logs
        self.flow_logs_group = logs.LogGroup(
            self,
            "VPCFlowLogsGroup",
            log_group_name="/aws/vpc/flowlogs",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create IAM role for VPC Flow Logs
        flow_logs_role = iam.Role(
            self,
            "VPCFlowLogsRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            inline_policies={
                "FlowLogsDeliveryRolePolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            resources=["*"]
                        )
                    ]
                )
            }
        )
        
        # Create VPC Flow Logs
        self.vpc_flow_logs = ec2.FlowLog(
            self,
            "VPCFlowLogs",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                self.flow_logs_group,
                flow_logs_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

    def create_outputs(self):
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self,
            "EC2InstanceId",
            value=self.ec2_instance.instance_id,
            description="EC2 Instance ID"
        )
        
        CfnOutput(
            self,
            "ElasticIP",
            value=self.elastic_ip.ref,
            description="Elastic IP address"
        )
        
        CfnOutput(
            self,
            "ALBDNSName",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name"
        )
        
        CfnOutput(
            self,
            "RDSEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS Instance Endpoint"
        )
        
        CfnOutput(
            self,
            "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 Bucket Name"
        )
        
        CfnOutput(
            self,
            "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS Key ID"
        )
```

## Additional Files Needed

### `requirements.txt`
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### `cdk.json`
```json
{
  "app": "python tap.py",
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjectsPolicy": true,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": true,
    "@aws-cdk/aws-lambda:codeBucketPrefixSeparator": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true,
    "allowed_ip_ranges": ["YOUR_IP_RANGE/32"]
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure allowed IP ranges (optional):**
   ```bash
   # Set your specific IP range in cdk.json context or pass it during deployment
   cdk deploy --context allowed_ip_ranges='["YOUR_IP/32"]'
   ```

3. **Deploy the stack:**
   ```bash
   cdk bootstrap  # First time only
   cdk deploy
   ```

## Key Security Features Implemented

### 🔒 **Network Security**
- VPC with proper subnet isolation (public/private)
- Security groups with least privilege access
- NAT Gateway for private subnet internet access
- VPC Flow Logs for network monitoring

### 🛡️ **Access Control**
- IAM roles with minimal permissions
- EC2 role limited to specific S3 bucket and CloudWatch
- RDS accessible only from EC2 instances
- IP-based restrictions for SSH and HTTP access

### 🔐 **Encryption**
- KMS encryption for S3 bucket and RDS
- SSL/TLS enforcement for S3 (deny non-secure transport)
- RDS storage encryption enabled

### 📊 **Monitoring & Logging**
- CloudWatch detailed monitoring for EC2
- RDS performance insights enabled
- VPC Flow Logs to CloudWatch
- CloudWatch logs export for PostgreSQL

### 💾 **Data Management**
- S3 lifecycle policy (Glacier transition after 30 days)
- RDS automated backups (7 days retention)
- S3 versioning enabled
- Block all public S3 access

This implementation follows AWS Well-Architected Framework principles and CDK best practices, providing a secure, scalable, and maintainable infrastructure foundation.