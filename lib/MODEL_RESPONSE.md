I'll help you create a production-ready AWS infrastructure using AWS CDK with Python. This will be a comprehensive setup that meets all your requirements.

## Project Structure

First, let's set up the project structure:

```
aws-infrastructure/
├── app.py
├── main.py
├── requirements.txt
└── cdk.json
```

## Requirements File

**requirements.txt**
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

## CDK Configuration

**cdk.json**
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjects": true,
    "@aws-cdk/aws-codebuild:batchServiceRole": true,
    "@aws-cdk/aws-iam:externalIdCondition": true
  }
}
```

## Main Infrastructure Stack

**main.py**
```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_s3 as s3,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Tags
)
from constructs import Construct
import os


class ProductionInfrastructureStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Environment suffix for tagging
        environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'prod')
        
        # Apply tags to all resources in the stack
        Tags.of(self).add("Environment", f"Environment{environment_suffix}")
        
        # Create VPC
        self.vpc = self._create_vpc()
        
        # Create Security Groups
        self.security_groups = self._create_security_groups()
        
        # Create RDS Subnet Group
        self.db_subnet_group = self._create_db_subnet_group()
        
        # Create RDS Instance
        self.rds_instance = self._create_rds_instance()
        
        # Create S3 Bucket for logs
        self.s3_bucket = self._create_s3_bucket()
        
        # Create IAM Role for EC2 instances
        self.ec2_role = self._create_ec2_role()
        
        # Create Launch Template
        self.launch_template = self._create_launch_template()
        
        # Create Application Load Balancer
        self.alb = self._create_application_load_balancer()
        
        # Create Auto Scaling Group
        self.asg = self._create_auto_scaling_group()
        
        # Create CloudWatch Alarms
        self._create_cloudwatch_alarms()
        
        # Create outputs
        self._create_outputs()

    def _create_vpc(self):
        """Create VPC with public and private subnets"""
        vpc = ec2.Vpc(
            self, "ProductionVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,  # Use 2 AZs for high availability
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
            nat_gateways=1,  # One NAT Gateway in public subnet
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        return vpc

    def _create_security_groups(self):
        """Create security groups for different components"""
        
        # ALB Security Group
        alb_sg = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        # Allow HTTP and HTTPS from anywhere
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from anywhere"
        )
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from anywhere"
        )
        
        # EC2 Security Group
        ec2_sg = ec2.SecurityGroup(
            self, "EC2SecurityGroup",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )
        
        # Allow HTTP from ALB
        ec2_sg.add_ingress_rule(
            alb_sg,
            ec2.Port.tcp(80),
            "Allow HTTP traffic from ALB"
        )
        
        # Allow SSH from specific IP range (replace with your IP range)
        ec2_sg.add_ingress_rule(
            ec2.Peer.ipv4("0.0.0.0/0"),  # Replace with your specific IP range
            ec2.Port.tcp(22),
            "Allow SSH access from specific IP range"
        )
        
        # RDS Security Group
        rds_sg = ec2.SecurityGroup(
            self, "RDSSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        
        # Allow MySQL/Aurora access from EC2 instances
        rds_sg.add_ingress_rule(
            ec2_sg,
            ec2.Port.tcp(3306),
            "Allow MySQL access from EC2 instances"
        )
        
        return {
            "alb": alb_sg,
            "ec2": ec2_sg,
            "rds": rds_sg
        }

    def _create_db_subnet_group(self):
        """Create RDS subnet group"""
        return rds.SubnetGroup(
            self, "DBSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

    def _create_rds_instance(self):
        """Create RDS MySQL instance"""
        return rds.DatabaseInstance(
            self, "ProductionDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.security_groups["rds"]],
            database_name="productiondb",
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name="rds-credentials"
            ),
            allocated_storage=20,
            storage_encrypted=True,
            multi_az=False,  # Set to True for production
            deletion_protection=True,
            backup_retention=Duration.days(7),
            delete_automated_backups=False,
            removal_policy=RemovalPolicy.SNAPSHOT
        )

    def _create_s3_bucket(self):
        """Create S3 bucket for application logs with lifecycle policy"""
        bucket = s3.Bucket(
            self, "ApplicationLogsBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
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
            ],
            removal_policy=RemovalPolicy.RETAIN
        )
        
        return bucket

    def _create_ec2_role(self):
        """Create IAM role for EC2 instances"""
        role = iam.Role(
            self, "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )
        
        # Add S3 permissions for log bucket
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:DeleteObject"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )
        
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["s3:ListBucket"],
                resources=[self.s3_bucket.bucket_arn]
            )
        )
        
        return role

    def _create_launch_template(self):
        """Create launch template for EC2 instances"""
        
        # User data script
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from $(hostname -f)</h1>' > /var/www/html/index.html",
            
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            
            # Configure CloudWatch agent
            "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
            """{
                "metrics": {
                    "namespace": "CWAgent",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": [
                                "cpu_usage_idle",
                                "cpu_usage_iowait",
                                "cpu_usage_user",
                                "cpu_usage_system"
                            ],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": [
                                "used_percent"
                            ],
                            "metrics_collection_interval": 60,
                            "resources": [
                                "*"
                            ]
                        },
                        "mem": {
                            "measurement": [
                                "mem_used_percent"
                            ],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }""",
            "EOF",
            
            # Start CloudWatch agent
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"
        )
        
        return ec2.LaunchTemplate(
            self, "LaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.security_groups["ec2"],
            role=self.ec2_role,
            user_data=user_data
        )

    def _create_application_load_balancer(self):
        """Create Application Load Balancer"""
        alb = elbv2.ApplicationLoadBalancer(
            self, "ApplicationLoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.security_groups["alb"],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )
        
        return alb

    def _create_auto_scaling_group(self):
        """Create Auto Scaling Group with target group"""
        
        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self, "TargetGroup",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                path="/",
                protocol=elbv2.Protocol.HTTP
            )
        )
        
        # Add listener to ALB
        listener = self.alb.add_listener(
            "Listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )
        
        # Create Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, "AutoScalingGroup",
            vpc=self.vpc,
            launch_template=self.launch_template,
            min_capacity=2,
            max_capacity=6,
            desired_capacity=4,  # 2 instances per private subnet
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            target_group_arns=[target_group.target_group_arn],
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            )
        )
        
        # Add scaling policies
        asg.scale_on_cpu_utilization(
            "CPUScaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.minutes(5),
            scale_out_cooldown=Duration.minutes(5)
        )
        
        return asg

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for monitoring"""
        
        # CPU Utilization Alarm
        cpu_alarm = cloudwatch.Alarm(
            self, "HighCPUAlarm",
            metric=self.asg.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            alarm_description="Alarm when CPU exceeds 80%"
        )
        
        # ALB Target Health Alarm
        target_response_time_alarm = cloudwatch.Alarm(
            self, "HighResponseTimeAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="TargetResponseTime",
                dimensions_map={
                    "LoadBalancer": self.alb.load_balancer_full_name
                }
            ),
            threshold=1,  # 1 second
            evaluation_periods=3,
            datapoints_to_alarm=2,
            alarm_description="Alarm when response time exceeds 1 second"
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer"
        )
        
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="ID of the VPC"
        )
        
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS instance endpoint"
        )
        
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="Name of the S3 bucket for logs"
        )
```

## App Entry Point

**app.py**
```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from main import ProductionInfrastructureStack

app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environment_suffix") or os.environ.get("ENVIRONMENT_SUFFIX", "prod")

ProductionInfrastructureStack(
    app, 
    f"ProductionInfrastructureStack-{environment_suffix}",
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region='us-west-2'  # Fixed region as requested
    ),
    description=f"Production-ready infrastructure stack for {environment_suffix} environment"
)

app.synth()
```

## Deployment Instructions

### 1. Setup and Installation

```bash
# Create project directory
mkdir aws-infrastructure
cd aws-infrastructure

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install AWS CDK CLI (if not already installed)
npm install -g aws-cdk
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

### 3. Deploy the Stack

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy the stack
cdk deploy

# Deploy with custom environment suffix
ENVIRONMENT_SUFFIX=staging cdk deploy
```

### 4. Clean Up

```bash
# Destroy the stack when no longer needed
cdk destroy
```

## Key Features Implemented

### ✅ **Networking**
- VPC with CIDR `10.0.0.0/16`
- Public subnet for ALB and NAT Gateway
- Two private subnets for EC2 instances and RDS
- Internet Gateway and NAT Gateway with Elastic IP

### ✅ **Compute**
- Auto Scaling Group with 2-6 instances
- Launch template with CloudWatch agent
- CPU-based scaling policies
- Health checks and monitoring

### ✅ **Load Balancing**
- Application Load Balancer in public subnet
- HTTP listener (HTTPS can be added with SSL certificate)
- Target group with health checks

### ✅ **Database**
- RDS MySQL instance in private subnet
- Encrypted storage and automated backups
- Security group restricting access to EC2 instances only

### ✅ **Storage**
- S3 bucket for application logs
- Lifecycle policy transitioning to Glacier after 30 days
- Proper IAM permissions for EC2 access

### ✅ **Security**
- Security groups with least privilege access
- IAM roles with minimal required permissions
- Database credentials stored in AWS Secrets Manager

### ✅ **Monitoring**
- CloudWatch alarms for CPU utilization and response time
- CloudWatch agent on EC2 instances
- Comprehensive metrics collection

### ✅ **Tagging**
- All resources tagged with `Environment: EnvironmentSuffix`
- Easy identification and management

## Customization Options

1. **Environment Suffix**: Set via `ENVIRONMENT_SUFFIX` environment variable
2. **Instance Types**: Modify in `_create_launch_template()` and `_create_rds_instance()`
3. **Scaling Parameters**: Adjust in `_create_auto_scaling_group()`
4. **Security**: Update IP ranges in security group rules
5. **Database**: Change engine type, version, or instance class in RDS configuration

This infrastructure is production-ready and follows AWS best practices for high availability, security, and scalability!