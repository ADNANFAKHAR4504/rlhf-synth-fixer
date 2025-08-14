## Project Structure

First, let me outline the project structure and then provide the complete `app.py` file:

```
secure-aws-infrastructure/
├── app.py
├── requirements.txt
├── cdk.json
└── README.md
```

## Complete AWS CDK Python Code (app.py)

```python
#!/usr/bin/env python3
import os
from aws_cdk import (
    App, Stack, Environment,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_s3 as s3,
    aws_rds as rds,
    aws_kms as kms,
    aws_logs as logs,
    aws_cloudtrail as cloudtrail,
    aws_secretsmanager as secretsmanager,
    RemovalPolicy,
    Duration,
    CfnOutput
)
from constructs import Construct
import json

class SecureAWSInfrastructureStack(Stack):
    """
    Secure AWS Infrastructure Stack following security best practices
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # 1. VPC Configuration with Public and Private Subnets
        self.create_vpc()
        
        # 2. Security Groups
        self.create_security_groups()
        
        # 3. IAM Roles & Policies
        self.create_iam_roles()
        
        # 4. KMS Keys for Encryption
        self.create_kms_keys()
        
        # 5. Storage (S3 Buckets with Encryption)
        self.create_s3_buckets()
        
        # 6. Secrets Manager for Database Credentials
        self.create_secrets()
        
        # 7. RDS Database with Encryption and Multi-AZ
        self.create_rds_database()
        
        # 8. CloudTrail for Auditing
        self.create_cloudtrail()
        
        # 9. Bastion Host
        self.create_bastion_host()
        
        # 10. Application Servers in Private Subnets
        self.create_application_servers()
        
        # 11. Outputs
        self.create_outputs()

    def create_vpc(self):
        """Create VPC with public and private subnets across multiple AZs"""
        
        # Create VPC
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
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Create CloudWatch Log Group for VPC Flow Logs
        self.vpc_flow_log_group = logs.LogGroup(
            self, "VPCFlowLogGroup",
            log_group_name="/aws/vpc/flowlogs",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create IAM Role for VPC Flow Logs
        flow_log_role = iam.Role(
            self, "VPCFlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            inline_policies={
                "FlowLogPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=[
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            resources=[self.vpc_flow_log_group.log_group_arn]
                        )
                    ]
                )
            }
        )
        
        # Enable VPC Flow Logs
        self.vpc_flow_logs = ec2.FlowLog(
            self, "VPCFlowLogs",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                self.vpc_flow_log_group, 
                flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

    def create_security_groups(self):
        """Create security groups with least privilege access"""
        
        # Bastion Host Security Group
        self.bastion_sg = ec2.SecurityGroup(
            self, "BastionSecurityGroup",
            vpc=self.vpc,
            description="Security group for bastion host",
            allow_all_outbound=True
        )
        
        # Allow SSH from specific CIDR ranges (replace with your IP ranges)
        self.bastion_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("203.0.113.0/24"),  # Replace with your office IP range
            connection=ec2.Port.tcp(22),
            description="SSH access from office network"
        )
        
        # Application Load Balancer Security Group
        self.alb_sg = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=False
        )
        
        # Allow HTTP and HTTPS from internet
        self.alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="HTTP access from internet"
        )
        
        self.alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS access from internet"
        )
        
        # Application Server Security Group
        self.app_server_sg = ec2.SecurityGroup(
            self, "AppServerSecurityGroup",
            vpc=self.vpc,
            description="Security group for application servers",
            allow_all_outbound=True
        )
        
        # Allow SSH from bastion host
        self.app_server_sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(self.bastion_sg.security_group_id),
            connection=ec2.Port.tcp(22),
            description="SSH access from bastion host"
        )
        
        # Allow HTTP from ALB
        self.app_server_sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(self.alb_sg.security_group_id),
            connection=ec2.Port.tcp(80),
            description="HTTP access from ALB"
        )
        
        # RDS Security Group
        self.rds_sg = ec2.SecurityGroup(
            self, "RDSSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        
        # Allow MySQL/Aurora access from application servers
        self.rds_sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(self.app_server_sg.security_group_id),
            connection=ec2.Port.tcp(3306),
            description="MySQL access from application servers"
        )

    def create_iam_roles(self):
        """Create IAM roles with minimal privileges"""
        
        # EC2 Instance Role for Application Servers
        self.ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 application servers"
        )
        
        # Add SSM permissions for Systems Manager Session Manager
        self.ec2_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )
        
        # Create instance profile
        self.instance_profile = iam.InstanceProfile(
            self, "EC2InstanceProfile",
            role=self.ec2_role
        )
        
        # Bastion Host Role
        self.bastion_role = iam.Role(
            self, "BastionHostRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for bastion host"
        )
        
        # Add SSM permissions for bastion host
        self.bastion_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )
        
        # Create bastion instance profile
        self.bastion_instance_profile = iam.InstanceProfile(
            self, "BastionInstanceProfile",
            role=self.bastion_role
        )

    def create_kms_keys(self):
        """Create KMS keys for encryption"""
        
        # KMS Key for S3 Encryption
        self.s3_kms_key = kms.Key(
            self, "S3KMSKey",
            description="KMS key for S3 bucket encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # KMS Key for RDS Encryption
        self.rds_kms_key = kms.Key(
            self, "RDSKMSKey",
            description="KMS key for RDS encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # KMS Key for CloudTrail
        self.cloudtrail_kms_key = kms.Key(
            self, "CloudTrailKMSKey",
            description="KMS key for CloudTrail encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Grant CloudTrail service access to the key
        self.cloudtrail_kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Enable CloudTrail Encryption",
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=[
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                resources=["*"]
            )
        )

    def create_s3_buckets(self):
        """Create S3 buckets with encryption and security settings"""
        
        # Application Data Bucket
        self.app_data_bucket = s3.Bucket(
            self, "AppDataBucket",
            bucket_name=f"secure-app-data-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.s3_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
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
            ]
        )
        
        # CloudTrail Logs Bucket
        self.cloudtrail_bucket = s3.Bucket(
            self, "CloudTrailLogsBucket",
            bucket_name=f"secure-cloudtrail-logs-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.cloudtrail_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
        
        # Grant S3 access to EC2 role for application data bucket only
        self.app_data_bucket.grant_read_write(self.ec2_role)

    def create_secrets(self):
        """Create secrets in AWS Secrets Manager"""
        
        # Database credentials
        self.db_secret = secretsmanager.Secret(
            self, "DatabaseSecret",
            description="Database credentials for RDS instance",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": "admin"}),
                generate_string_key="password",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\",
                include_space=False,
                password_length=32
            )
        )
        
        # Grant read access to EC2 role for database secret
        self.db_secret.grant_read(self.ec2_role)

    def create_rds_database(self):
        """Create RDS database with encryption and Multi-AZ"""
        
        # Create DB Subnet Group
        self.db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )
        
        # Create RDS Instance
        self.database = rds.DatabaseInstance(
            self, "SecureDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            credentials=rds.Credentials.from_secret(self.db_secret),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.rds_sg],
            multi_az=True,
            storage_encrypted=True,
            storage_encryption_key=self.rds_kms_key,
            backup_retention=Duration.days(7),
            deletion_protection=False,  # Set to True in production
            delete_automated_backups=True,
            removal_policy=RemovalPolicy.DESTROY,  # Change for production
            allocated_storage=20,
            max_allocated_storage=100,
            enable_performance_insights=True,
            monitoring_interval=Duration.seconds(60),
            auto_minor_version_upgrade=True
        )

    def create_cloudtrail(self):
        """Create CloudTrail for API auditing"""
        
        # CloudTrail
        self.trail = cloudtrail.Trail(
            self, "SecureCloudTrail",
            bucket=self.cloudtrail_bucket,
            encryption_key=self.cloudtrail_kms_key,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_file_validation=True,
            send_to_cloud_watch_logs=True,
            cloud_watch_logs_retention=logs.RetentionDays.ONE_MONTH
        )
        
        # Add data events for S3 bucket
        self.trail.add_s3_event_selector(
            read_write_type=cloudtrail.ReadWriteType.ALL,
            include_management_events=True,
            s3_selector=[
                cloudtrail.S3EventSelector(
                    bucket=self.app_data_bucket,
                    object_prefix=""
                )
            ]
        )

    def create_bastion_host(self):
        """Create bastion host in public subnet"""
        
        # Latest Amazon Linux 2 AMI
        amzn_linux = ec2.MachineImage.latest_amazon_linux(
            generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            edition=ec2.AmazonLinuxEdition.STANDARD,
            virtualization=ec2.AmazonLinuxVirt.HVM,
            storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE
        )
        
        # User data script for bastion host
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-ssm-agent",
            "systemctl enable amazon-ssm-agent",
            "systemctl start amazon-ssm-agent"
        )
        
        # Bastion Host
        self.bastion_host = ec2.Instance(
            self, "BastionHost",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=amzn_linux,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            security_group=self.bastion_sg,
            role=self.bastion_role,
            user_data=user_data,
            detailed_monitoring=True
        )

    def create_application_servers(self):
        """Create application servers in private subnets"""
        
        # Latest Amazon Linux 2 AMI
        amzn_linux = ec2.MachineImage.latest_amazon_linux(
            generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            edition=ec2.AmazonLinuxEdition.STANDARD,
            virtualization=ec2.AmazonLinuxVirt.HVM,
            storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE
        )
        
        # User data script for application servers
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-ssm-agent httpd",
            "systemctl enable amazon-ssm-agent",
            "systemctl start amazon-ssm-agent",
            "systemctl enable httpd",
            "systemctl start httpd",
            "echo '<h1>Secure Application Server</h1>' > /var/www/html/index.html"
        )
        
        # Application Servers
        self.app_servers = []
        for i in range(2):
            server = ec2.Instance(
                self, f"AppServer{i+1}",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MICRO
                ),
                machine_image=amzn_linux,
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                security_group=self.app_server_sg,
                role=self.ec2_role,
                user_data=user_data,
                detailed_monitoring=True
            )
            self.app_servers.append(server)

    def create_outputs(self):
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self, "BastionHostId",
            value=self.bastion_host.instance_id,
            description="Bastion Host Instance ID"
        )
        
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.instance_endpoint.hostname,
            description="RDS Database Endpoint"
        )
        
        CfnOutput(
            self, "AppDataBucketName",
            value=self.app_data_bucket.bucket_name,
            description="Application Data S3 Bucket Name"
        )
        
        CfnOutput(
            self, "DatabaseSecretArn",
            value=self.db_secret.secret_arn,
            description="Database Secret ARN"
        )


# CDK App
app = App()

# Deploy to us-west-2 region
SecureAWSInfrastructureStack(
    app, 
    "SecureAWSInfrastructureStack",
    env=Environment(
        region="us-west-2"
    ),
    description="Secure AWS Infrastructure with best practices"
)

app.synth()
```

## Supporting Files

### requirements.txt
```txt
aws-cdk-lib>=2.100.0
constructs>=10.3.0
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

## Deployment Instructions

1. **Install AWS CDK**:
   ```bash
   npm install -g aws-cdk
   ```

2. **Set up Python environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

4. **Bootstrap CDK** (first time only):
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
   ```

5. **Deploy the stack**:
   ```bash
   cdk deploy
   ```

## Security Features Implemented

### 🔒 **Network Security**
- VPC with public/private subnets across multiple AZs
- Security groups with least privilege access
- VPC Flow Logs for network monitoring
- Bastion host for secure SSH access

### 🔐 **Encryption**
- KMS keys with automatic rotation
- S3 buckets encrypted with customer-managed KMS keys
- RDS encryption at rest and in transit
- CloudTrail logs encrypted

### 👤 **Identity & Access Management**
- IAM roles with minimal privileges
- Instance profiles for EC2 instances
- Secrets Manager for sensitive data
- No hardcoded credentials

### 📊 **Monitoring & Auditing**
- CloudTrail for API call auditing
- VPC Flow Logs
- CloudWatch integration
- Performance Insights for RDS

### 🏗️ **High Availability**
- Multi-AZ RDS deployment
- Resources distributed across multiple AZs
- Automated backups enabled

### 🛡️ **Data Protection**
- S3 buckets with public access blocked
- Versioning enabled on S3 buckets
- Lifecycle policies for cost optimization
- Deletion protection options

This infrastructure follows AWS Well-Architected Framework principles and implements defense-in-depth security strategies. Remember to customize the CIDR ranges, instance types, and other parameters according to your specific requirements.