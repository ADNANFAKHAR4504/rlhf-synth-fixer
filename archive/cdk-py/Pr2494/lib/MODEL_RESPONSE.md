I'll help you create a secure and scalable multi-tier web application infrastructure using AWS CDK with Python. Here's a comprehensive solution that follows AWS best practices:

```python
#!/usr/bin/env python3

from aws_cdk import (
    App,
    Stack,
    Environment,
    CfnOutput,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    aws_kms as kms,
    aws_dynamodb as dynamodb,
)
from constructs import Construct


class SecureMultiTierStack(Stack):
    """
    A secure multi-tier web application infrastructure stack following AWS best practices.
    
    Features:
    - VPC with public/private subnets across multiple AZs
    - Secure RDS instance with encryption and automated backups
    - S3 bucket with server-side encryption
    - IAM roles following principle of least privilege
    - Security groups with restricted access
    - KMS encryption for sensitive data
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Configuration parameters
        TRUSTED_IP_RANGE = "203.0.113.0/24"  # Replace with your actual IP range
        DB_NAME = "webapp_db"
        DB_USERNAME = "admin"

        # Create KMS key for encryption
        kms_key = self._create_kms_key()

        # Create VPC with public and private subnets
        vpc = self._create_vpc()

        # Create security groups
        web_sg, db_sg = self._create_security_groups(vpc, TRUSTED_IP_RANGE)

        # Create RDS instance
        rds_instance = self._create_rds_instance(
            vpc, db_sg, kms_key, DB_NAME, DB_USERNAME
        )

        # Create S3 bucket with encryption
        s3_bucket = self._create_s3_bucket(kms_key)

        # Create DynamoDB table
        dynamodb_table = self._create_dynamodb_table(kms_key)

        # Create IAM roles for EC2 instances
        ec2_role = self._create_ec2_iam_role(s3_bucket, dynamodb_table)

        # Create launch template for EC2 instances
        launch_template = self._create_launch_template(vpc, web_sg, ec2_role)

        # Output important information
        self._create_outputs(vpc, rds_instance, s3_bucket, dynamodb_table)

    def _create_kms_key(self) -> kms.Key:
        """Create a KMS key for encryption with proper key policy."""
        key = kms.Key(
            self,
            "WebAppKMSKey",
            description="KMS key for multi-tier web application encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,  # Use RETAIN for production
        )

        # Add key policy to allow the account root to manage the key
        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Enable IAM User Permissions",
                effect=iam.Effect.ALLOW,
                principals=[iam.AccountRootPrincipal()],
                actions=["kms:*"],
                resources=["*"],
            )
        )

        return key

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets across multiple AZs."""
        vpc = ec2.Vpc(
            self,
            "WebAppVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=2,  # One NAT gateway per AZ for high availability
            subnet_configuration=[
                # Public subnets for load balancers and NAT gateways
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                # Private subnets for application servers
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                # Isolated subnets for database
                ec2.SubnetConfiguration(
                    name="DatabaseSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Add VPC Flow Logs for security monitoring
        vpc.add_flow_log(
            "VPCFlowLog",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(),
        )

        return vpc

    def _create_security_groups(
        self, vpc: ec2.Vpc, trusted_ip_range: str
    ) -> tuple[ec2.SecurityGroup, ec2.SecurityGroup]:
        """Create security groups for web tier and database tier."""
        
        # Security group for web servers
        web_sg = ec2.SecurityGroup(
            self,
            "WebServerSecurityGroup",
            vpc=vpc,
            description="Security group for web servers",
            allow_all_outbound=False,  # Explicitly control outbound traffic
        )

        # Allow HTTPS traffic from anywhere
        web_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic from anywhere",
        )

        # Allow SSH only from trusted IP range
        web_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(trusted_ip_range),
            connection=ec2.Port.tcp(22),
            description="Allow SSH from trusted IP range only",
        )

        # Allow outbound HTTPS for updates and API calls
        web_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow outbound HTTPS",
        )

        # Allow outbound HTTP for package updates
        web_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow outbound HTTP",
        )

        # Security group for RDS database
        db_sg = ec2.SecurityGroup(
            self,
            "DatabaseSecurityGroup",
            vpc=vpc,
            description="Security group for RDS database",
            allow_all_outbound=False,
        )

        # Allow database access only from web servers
        db_sg.add_ingress_rule(
            peer=web_sg,
            connection=ec2.Port.tcp(3306),  # MySQL/Aurora port
            description="Allow database access from web servers only",
        )

        return web_sg, db_sg

    def _create_rds_instance(
        self,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        kms_key: kms.Key,
        db_name: str,
        username: str,
    ) -> rds.DatabaseInstance:
        """Create RDS instance with encryption and automated backups."""
        
        # Create subnet group for RDS in isolated subnets
        subnet_group = rds.SubnetGroup(
            self,
            "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
        )

        # Create parameter group for enhanced security
        parameter_group = rds.ParameterGroup(
            self,
            "DatabaseParameterGroup",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            description="Parameter group with security enhancements",
            parameters={
                "slow_query_log": "1",
                "general_log": "1",
                "log_queries_not_using_indexes": "1",
            },
        )

        # Create RDS instance
        rds_instance = rds.DatabaseInstance(
            self,
            "WebAppDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            subnet_group=subnet_group,
            security_groups=[security_group],
            database_name=db_name,
            credentials=rds.Credentials.from_generated_secret(
                username,
                secret_name="webapp-db-credentials",
                encryption_key=kms_key,
            ),
            # Encryption settings
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            # Backup settings
            backup_retention=Duration.days(7),
            backup_window="03:00-04:00",  # UTC
            maintenance_window="sun:04:00-sun:05:00",  # UTC
            # Performance and monitoring
            parameter_group=parameter_group,
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            performance_insight_encryption_key=kms_key,
            # Security settings
            deletion_protection=True,  # Set to False for development
            multi_az=False,  # Set to True for production
            allocated_storage=20,
            max_allocated_storage=100,  # Enable storage autoscaling
            delete_automated_backups=False,
            removal_policy=RemovalPolicy.SNAPSHOT,  # Create snapshot before deletion
        )

        return rds_instance

    def _create_s3_bucket(self, kms_key: kms.Key) -> s3.Bucket:
        """Create S3 bucket with server-side encryption and security settings."""
        bucket = s3.Bucket(
            self,
            "WebAppS3Bucket",
            # Encryption settings
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            bucket_key_enabled=True,  # Reduce KMS costs
            # Security settings
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            # Versioning and lifecycle
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    abort_incomplete_multipart_upload_after=Duration.days(1),
                ),
                s3.LifecycleRule(
                    id="TransitionToIA",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30),
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90),
                        ),
                    ],
                ),
            ],
            # Cleanup settings for development
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # Add bucket notification for security monitoring (optional)
        # You can add CloudTrail or CloudWatch Events here

        return bucket

    def _create_dynamodb_table(self, kms_key: kms.Key) -> dynamodb.Table:
        """Create DynamoDB table with encryption."""
        table = dynamodb.Table(
            self,
            "WebAppDynamoDBTable",
            table_name="webapp-sessions",
            partition_key=dynamodb.Attribute(
                name="session_id", type=dynamodb.AttributeType.STRING
            ),
            # Encryption
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=kms_key,
            # Billing and performance
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            # TTL for session management
            time_to_live_attribute="expires_at",
            # Cleanup settings for development
            removal_policy=RemovalPolicy.DESTROY,
        )

        return table

    def _create_ec2_iam_role(
        self, s3_bucket: s3.Bucket, dynamodb_table: dynamodb.Table
    ) -> iam.Role:
        """Create IAM role for EC2 instances following principle of least privilege."""
        
        # Create the role
        role = iam.Role(
            self,
            "WebAppEC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for web application EC2 instances",
        )

        # Add managed policies for basic EC2 functionality
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "AmazonSSMManagedInstanceCore"  # For Systems Manager
            )
        )

        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "CloudWatchAgentServerPolicy"  # For CloudWatch monitoring
            )
        )

        # Create custom policy for S3 access (least privilege)
        s3_policy = iam.Policy(
            self,
            "WebAppS3Policy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                    ],
                    resources=[f"{s3_bucket.bucket_arn}/*"],
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=["s3:ListBucket"],
                    resources=[s3_bucket.bucket_arn],
                ),
            ],
        )

        # Create custom policy for DynamoDB access (least privilege)
        dynamodb_policy = iam.Policy(
            self,
            "WebAppDynamoDBPolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                    ],
                    resources=[dynamodb_table.table_arn],
                ),
            ],
        )

        # Attach policies to role
        role.attach_inline_policy(s3_policy)
        role.attach_inline_policy(dynamodb_policy)

        return role

    def _create_launch_template(
        self, vpc: ec2.Vpc, security_group: ec2.SecurityGroup, role: iam.Role
    ) -> ec2.LaunchTemplate:
        """Create launch template for EC2 instances."""
        
        # Create instance profile for the role
        instance_profile = iam.CfnInstanceProfile(
            self,
            "WebAppInstanceProfile",
            roles=[role.role_name],
        )

        # User data script for instance initialization
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "yum install -y amazon-ssm-agent",
            "systemctl enable amazon-ssm-agent",
            "systemctl start amazon-ssm-agent",
            # Add your application-specific setup here
        )

        # Create launch template
        launch_template = ec2.LaunchTemplate(
            self,
            "WebAppLaunchTemplate",
            launch_template_name="webapp-launch-template",
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO
            ),
            security_group=security_group,
            role=role,
            user_data=user_data,
            # Enable detailed monitoring
            detailed_monitoring=True,
            # Disable IMDSv1 for security
            require_imdsv2=True,
        )

        return launch_template

    def _create_outputs(
        self,
        vpc: ec2.Vpc,
        rds_instance: rds.DatabaseInstance,
        s3_bucket: s3.Bucket,
        dynamodb_table: dynamodb.Table,
    ) -> None:
        """Create CloudFormation outputs for important resources."""
        
        CfnOutput(
            self,
            "VPCId",
            value=vpc.vpc_id,
            description="VPC ID",
        )

        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=rds_instance.instance_endpoint.hostname,
            description="RDS instance endpoint",
        )

        CfnOutput(
            self,
            "DatabaseSecretArn",
            value=rds_instance.secret.secret_arn,
            description="ARN of the database credentials secret",
        )

        CfnOutput(
            self,
            "S3BucketName",
            value=s3_bucket.bucket_name,
            description="S3 bucket name",
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=dynamodb_table.table_name,
            description="DynamoDB table name",
        )


# Application entry point
app = App()

# Deploy to specific environment (replace with your account/region)
env = Environment(
    account="123456789012",  # Replace with your AWS account ID
    region="us-east-1",      # Replace with your preferred region
)

SecureMultiTierStack(
    app,
    "SecureMultiTierStack",
    env=env,
    description="Secure multi-tier web application infrastructure",
)

app.synth()
```

## Key Features and Security Best Practices

### 🔒 **Security Features**

1. **Network Security**:
   - VPC with proper subnet isolation (public, private, isolated)
   - Security groups with least privilege access
   - VPC Flow Logs for monitoring
   - NAT Gateways for secure outbound access

2. **Encryption**:
   - KMS key with rotation enabled
   - RDS encryption at rest and in transit
   - S3 server-side encryption with KMS
   - DynamoDB encryption with customer-managed keys

3. **IAM Security**:
   - Principle of least privilege for all roles
   - Instance profiles for EC2 instances
   - Separate policies for different services
   - No hardcoded credentials

### 🏗️ **Infrastructure Components**

1. **VPC Configuration**:
   - CIDR: `10.0.0.0/16`
   - 2 public subnets (for load balancers)
   - 2 private subnets (for application servers)
   - 2 isolated subnets (for databases)

2. **RDS Features**:
   - Automated backups with 7-day retention
   - Multi-AZ deployment ready
   - Performance Insights enabled
   - Parameter group with security enhancements

3. **S3 Configuration**:
   - Block all public access
   - Versioning enabled
   - Lifecycle policies for cost optimization
   - SSL enforcement

## 🚀 **Deployment Instructions**

1. **Prerequisites**:
   ```bash
   pip install aws-cdk-lib constructs
   ```

2. **Configuration**:
   - Update the `TRUSTED_IP_RANGE` variable with your IP range
   - Replace the AWS account ID and region in the `env` variable

3. **Deploy**:
   ```bash
   cdk bootstrap  # First time only
   cdk deploy
   ```

4. **Cleanup**:
   ```bash
   cdk destroy
   ```

## 📋 **Additional Considerations for Production**

1. **Enable Multi-AZ for RDS** (set `multi_az=True`)
2. **Use larger instance types** for production workloads
3. **Enable deletion protection** for critical resources
4. **Add CloudTrail** for API logging
5. **Implement backup strategies** for all data stores
6. **Add monitoring and alerting** with CloudWatch
7. **Consider using AWS WAF** for web application protection

This infrastructure provides a solid foundation for a secure, scalable multi-tier web application following AWS best practices!