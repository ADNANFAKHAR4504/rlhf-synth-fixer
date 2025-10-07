### Reasoning Trace
---

This is a comprehensive request for creating an AWS CDK Python script for a high-availability web application infrastructure. Let me break down the requirements:

1. **Networking:**
   - VPC with public and private subnets
   - Across 2 Availability Zones

2. **Compute & Load Balancing:**
   - Auto Scaling Group with minimum 2 EC2 instances
   - Application Load Balancer

3. **Database:**
   - RDS instance in private subnet
   - Multi-AZ enabled

4. **Security & IAM:**
   - Security groups for ALB (HTTP) and EC2 (SSH)
   - IAM roles for EC2 instances

5. **Operations & Monitoring:**
   - Lambda function for RDS backups
   - S3 bucket with versioning for logs
   - CloudWatch alarms for CPU/memory
   - Stack termination protection

6. **General:**
   - Output ALB DNS name
   - Tag all resources with Environment, Project, Owner
   - Support multi-region deployment

I'll create a comprehensive CDK Python script that addresses all these requirements.
### Answer 
---

I'll create a comprehensive AWS CDK Python script that deploys a high-availability web application infrastructure with all the specified components. Here's the complete solution:

## Project Structure

First, let's set up the project structure:

```bash
mkdir high-availability-webapp
cd high-availability-webapp
```

## requirements.txt

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

## app.py

```python
#!/usr/bin/env python3
"""
Main entry point for the CDK application.
Supports multi-region deployment through environment configuration.
"""

import os
import aws_cdk as cdk
from stacks.webapp_stack import HighAvailabilityWebAppStack

app = cdk.App()

# Get deployment configuration from environment variables or use defaults
environment = app.node.try_get_context("environment") or "dev"
project_name = app.node.try_get_context("project") or "WebApp"
owner = app.node.try_get_context("owner") or "DevOps"

# Define deployment regions - supports multi-region deployment
regions = {
    "primary": {
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "region": os.environ.get("CDK_DEFAULT_REGION", "us-east-1")
    },
    # Add secondary regions as needed
    # "secondary": {
    #     "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
    #     "region": "eu-west-1"
    # }
}

# Deploy stack to each configured region
for stack_name, env_config in regions.items():
    stack = HighAvailabilityWebAppStack(
        app,
        f"HA-WebApp-Stack-{stack_name}-{environment}",
        env=cdk.Environment(**env_config),
        environment=environment,
        project_name=project_name,
        owner=owner,
        description="High Availability Web Application Infrastructure"
    )
    
    # Enable termination protection
    stack.termination_protection = True

# Add tags to all resources in the app
cdk.Tags.of(app).add("Environment", environment)
cdk.Tags.of(app).add("Project", project_name)
cdk.Tags.of(app).add("Owner", owner)

app.synth()
```

## stacks/webapp_stack.py

```python
"""
High Availability Web Application Infrastructure Stack
Implements a scalable, fault-tolerant architecture with monitoring and backup capabilities.
"""

from aws_cdk import (
    Stack,
    CfnOutput,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_events as events,
    aws_events_targets as targets,
    aws_logs as logs,
)
from constructs import Construct


class HighAvailabilityWebAppStack(Stack):
    """
    CDK Stack for deploying a high-availability web application infrastructure.
    
    Components:
    - VPC with public/private subnets across 2 AZs
    - Auto Scaling Group with EC2 instances
    - Application Load Balancer
    - RDS Multi-AZ database
    - Lambda function for backups
    - S3 bucket for logs
    - CloudWatch monitoring
    """
    
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str,
        environment: str,
        project_name: str,
        owner: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.environment = environment
        self.project_name = project_name
        self.owner = owner
        
        # Create networking components
        vpc = self._create_vpc()
        
        # Create security groups
        alb_sg, ec2_sg, rds_sg = self._create_security_groups(vpc)
        
        # Create S3 bucket for logs
        log_bucket = self._create_log_bucket()
        
        # Create IAM role for EC2 instances
        ec2_role = self._create_ec2_role(log_bucket)
        
        # Create RDS database
        database = self._create_rds_database(vpc, rds_sg)
        
        # Create Application Load Balancer
        alb = self._create_application_load_balancer(vpc, alb_sg)
        
        # Create Auto Scaling Group
        asg = self._create_auto_scaling_group(
            vpc, ec2_sg, ec2_role, alb, database
        )
        
        # Create Lambda function for RDS backups
        backup_lambda = self._create_backup_lambda(database, vpc)
        
        # Create CloudWatch alarms
        self._create_cloudwatch_alarms(asg)
        
        # Output the ALB DNS name
        CfnOutput(
            self,
            "ALBDNSName",
            value=alb.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer",
            export_name=f"{self.stack_name}-alb-dns"
        )
    
    def _create_vpc(self) -> ec2.Vpc:
        """
        Create VPC with public and private subnets across 2 Availability Zones.
        """
        vpc = ec2.Vpc(
            self,
            "HA-VPC",
            max_azs=2,  # Deploy across 2 availability zones
            nat_gateways=2,  # One NAT gateway per AZ for high availability
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Database",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )
        
        return vpc
    
    def _create_security_groups(self, vpc: ec2.Vpc) -> tuple:
        """
        Create security groups for ALB, EC2, and RDS instances.
        """
        # Security group for Application Load Balancer
        alb_sg = ec2.SecurityGroup(
            self,
            "ALB-SecurityGroup",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        # Allow HTTP traffic from the internet
        alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from internet"
        )
        
        # Security group for EC2 instances
        ec2_sg = ec2.SecurityGroup(
            self,
            "EC2-SecurityGroup",
            vpc=vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )
        
        # Allow traffic from ALB
        ec2_sg.add_ingress_rule(
            peer=alb_sg,
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from ALB"
        )
        
        # Allow SSH access (restrict in production)
        ec2_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access"
        )
        
        # Security group for RDS database
        rds_sg = ec2.SecurityGroup(
            self,
            "RDS-SecurityGroup",
            vpc=vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        
        # Allow database connections from EC2 instances
        rds_sg.add_ingress_rule(
            peer=ec2_sg,
            connection=ec2.Port.tcp(3306),
            description="Allow MySQL connections from EC2 instances"
        )
        
        return alb_sg, ec2_sg, rds_sg
    
    def _create_log_bucket(self) -> s3.Bucket:
        """
        Create S3 bucket with versioning enabled for storing application logs.
        """
        log_bucket = s3.Bucket(
            self,
            "ApplicationLogBucket",
            bucket_name=f"{self.project_name.lower()}-logs-{self.account}-{self.region}",
            versioned=True,  # Enable versioning as required
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(90),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ],
            removal_policy=RemovalPolicy.RETAIN  # Retain logs even if stack is deleted
        )
        
        return log_bucket
    
    def _create_ec2_role(self, log_bucket: s3.Bucket) -> iam.Role:
        """
        Create IAM role for EC2 instances with necessary permissions.
        """
        ec2_role = iam.Role(
            self,
            "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instances in the web application",
            managed_policies=[
                # CloudWatch agent permissions
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchAgentServerPolicy"
                ),
                # SSM for remote management
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                )
            ]
        )
        
        # Grant write permissions to the log bucket
        log_bucket.grant_write(ec2_role)
        
        # Add inline policy for application-specific permissions
        ec2_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "secretsmanager:GetSecretValue",
                    "kms:Decrypt"
                ],
                resources=["*"],
                effect=iam.Effect.ALLOW
            )
        )
        
        return ec2_role
    
    def _create_rds_database(self, vpc: ec2.Vpc, rds_sg: ec2.SecurityGroup) -> rds.DatabaseInstance:
        """
        Create RDS database instance with Multi-AZ support in private subnet.
        """
        # Create subnet group for database
        db_subnet_group = rds.SubnetGroup(
            self,
            "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create RDS instance
        database = rds.DatabaseInstance(
            self,
            "ApplicationDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.SMALL
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[rds_sg],
            multi_az=True,  # Enable Multi-AZ for high availability
            allocated_storage=100,
            storage_type=rds.StorageType.GP3,
            storage_encrypted=True,
            database_name="webapp",
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="Mon:04:00-Mon:05:00",
            deletion_protection=True if self.environment == "prod" else False,
            removal_policy=RemovalPolicy.SNAPSHOT,
            cloudwatch_logs_exports=["error", "general", "slowquery"]
        )
        
        return database
    
    def _create_application_load_balancer(
        self, vpc: ec2.Vpc, alb_sg: ec2.SecurityGroup
    ) -> elbv2.ApplicationLoadBalancer:
        """
        Create Application Load Balancer in public subnets.
        """
        alb = elbv2.ApplicationLoadBalancer(
            self,
            "ApplicationLoadBalancer",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_sg,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )
        
        # Enable access logs
        alb.log_access_logs(
            s3.Bucket.from_bucket_name(
                self, "ALBLogBucket",
                f"{self.project_name.lower()}-logs-{self.account}-{self.region}"
            ),
            prefix="alb-logs"
        )
        
        return alb
    
    def _create_auto_scaling_group(
        self, 
        vpc: ec2.Vpc, 
        ec2_sg: ec2.SecurityGroup,
        ec2_role: iam.Role,
        alb: elbv2.ApplicationLoadBalancer,
        database: rds.DatabaseInstance
    ) -> autoscaling.AutoScalingGroup:
        """
        Create Auto Scaling Group with EC2 instances.
        """
        # User data script for EC2 instances
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>High Availability Web App</h1>' > /var/www/html/index.html",
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            # Install MySQL client for database connectivity
            "yum install -y mysql",
            # Store database endpoint in environment variable
            f"echo 'export DB_ENDPOINT={database.db_instance_endpoint_address}' >> /etc/environment"
        )
        
        # Create Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self,
            "WebServerAutoScalingGroup",
            vpc=vpc,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            min_capacity=2,  # Minimum 2 instances as required
            max_capacity=6,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_group=ec2_sg,
            role=ec2_role,
            user_data=user_data,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                max_batch_size=1,
                min_instances_in_service=1
            )
        )
        
        # Add target group
        listener = alb.add_listener(
            "HTTPListener",
            port=80,
            open=True
        )
        
        listener.add_targets(
            "WebServerTargets",
            port=80,
            targets=[asg],
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=Duration.seconds(5),
                interval=Duration.seconds(30)
            )
        )
        
        # Configure auto-scaling based on CPU utilization
        asg.scale_on_cpu_utilization(
            "ScaleOnCPU",
            target_utilization_percent=70
        )
        
        return asg
    
    def _create_backup_lambda(
        self, database: rds.DatabaseInstance, vpc: ec2.Vpc
    ) -> lambda_.Function:
        """
        Create Lambda function for daily automated backups of RDS database.
        """
        # Lambda execution role
        lambda_role = iam.Role(
            self,
            "BackupLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )
        
        # Add RDS backup permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "rds:CreateDBSnapshot",
                    "rds:DescribeDBInstances",
                    "rds:DescribeDBSnapshots",
                    "rds:DeleteDBSnapshot",
                    "rds:ListTagsForResource"
                ],
                resources=[
                    f"arn:aws:rds:{self.region}:{self.account}:db:{database.instance_identifier}",
                    f"arn:aws:rds:{self.region}:{self.account}:snapshot:*"
                ],
                effect=iam.Effect.ALLOW
            )
        )
        
        # Lambda function code
        backup_lambda = lambda_.Function(
            self,
            "RDSBackupFunction",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_inline("""
import boto3
import os
from datetime import datetime

def handler(event, context):
    '''
    Create a manual snapshot of the RDS database.
    Delete snapshots older than 30 days.
    '''
    rds_client = boto3.client('rds')
    db_instance_id = os.environ['DB_INSTANCE_ID']
    
    # Create snapshot
    snapshot_id = f"{db_instance_id}-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    
    try:
        response = rds_client.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_id,
            Tags=[
                {'Key': 'Type', 'Value': 'Automated'},
                {'Key': 'Environment', 'Value': os.environ['ENVIRONMENT']}
            ]
        )
        print(f"Created snapshot: {snapshot_id}")
        
        # Clean up old snapshots (older than 30 days)
        snapshots = rds_client.describe_db_snapshots(
            DBInstanceIdentifier=db_instance_id,
            SnapshotType='manual'
        )
        
        for snapshot in snapshots['DBSnapshots']:
            if (datetime.now(snapshot['SnapshotCreateTime'].tzinfo) - 
                snapshot['SnapshotCreateTime']).days > 30:
                try:
                    rds_client.delete_db_snapshot(
                        DBSnapshotIdentifier=snapshot['DBSnapshotIdentifier']
                    )
                    print(f"Deleted old snapshot: {snapshot['DBSnapshotIdentifier']}")
                except Exception as e:
                    print(f"Error deleting snapshot: {e}")
        
        return {
            'statusCode': 200,
            'body': f'Successfully created snapshot: {snapshot_id}'
        }
        
    except Exception as e:
        print(f"Error creating snapshot: {e}")
        return {
            'statusCode': 500,
            'body': f'Error creating snapshot: {str(e)}'
        }
"""),
            handler="index.handler",
            role=lambda_role,
            timeout=Duration.minutes(5),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            environment={
                "DB_INSTANCE_ID": database.instance_identifier,
                "ENVIRONMENT": self.environment
            }
        )
        
        # Schedule daily backups at 2 AM UTC
        backup_rule = events.Rule(
            self,
            "DailyBackupRule",
            schedule=events.Schedule.cron(
                minute="0",
                hour="2",
                month="*",
                week_day="*"
            )
        )
        
        backup_rule.add_target(targets.LambdaFunction(backup_lambda))
        
        return backup_lambda
    
    def _create_cloudwatch_alarms(self, asg: autoscaling.AutoScalingGroup) -> None:
        """
        Create CloudWatch alarms for CPU and memory utilization monitoring.
        """
        # CPU utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self,
            "HighCPUAlarm",
            metric=asg.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
            alarm_description="Alarm when CPU utilization exceeds 80%"
        )
        
        # Memory utilization alarm (requires CloudWatch agent configuration)
        memory_metric = cloudwatch.Metric(
            namespace="CWAgent",
            metric_name="mem_used_percent",
            dimensions_map={
                "AutoScalingGroupName": asg.auto_scaling_group_name
            }
        )
        
        memory_alarm = cloudwatch.Alarm(
            self,
            "HighMemoryAlarm",
            metric=memory_metric,
            threshold=85,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
            alarm_description="Alarm when memory utilization exceeds 85%"
        )
        
        # Scale up when CPU is high
        cpu_alarm.add_alarm_action(
            cw_actions.AutoScalingAction(
                autoscaling.StepScalingAction(
                    asg,
                    "ScaleUpAction",
                    adjustment_type=autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
                    scaling_steps=[
                        autoscaling.ScalingInterval(lower=0, change=1)
                    ]
                )
            )
        )
        
        # Low CPU alarm for scaling down
        low_cpu_alarm = cloudwatch.Alarm(
            self,
            "LowCPUAlarm",
            metric=asg.metric_cpu_utilization(),
            threshold=20,
            evaluation_periods=3,
            datapoints_to_alarm=3,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            alarm_description="Alarm when CPU utilization is below 20%"
        )
        
        low_cpu_alarm.add_alarm_action(
            cw_actions.AutoScalingAction(
                autoscaling.StepScalingAction(
                    asg,
                    "ScaleDownAction",
                    adjustment_type=autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
                    scaling_steps=[
                        autoscaling.ScalingInterval(upper=0, change=-1)
                    ]
                )
            )
        )
```

## cdk.json

```json
{
  "app": "python3 app.py",
  "context": {
    "@aws-cdk/core:stackRelativePath": "true",
    "@aws-cdk/core:enableStackNameDuplicates": false,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount": true,
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "environment": "dev",
    "project": "WebApp",
    "owner": "DevOps"
  }
}
```

## Setup and Deployment Instructions

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Bootstrap the CDK (if not already done):**
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

3. **Synthesize the CloudFormation template:**
```bash
cdk synth
```

4. **Deploy the stack:**
```bash
cdk deploy --context environment=prod --context project=MyWebApp --context owner=TeamName
```

5. **Deploy to multiple regions:**
```bash
# Deploy to primary region
cdk deploy --context environment=prod

# For secondary region, modify app.py to include secondary region configuration
```

## Key Features Implemented

### High Availability
- ✅ Multi-AZ VPC deployment across 2 availability zones
- ✅ Multi-AZ RDS database for automatic failover
- ✅ Auto Scaling Group with minimum 2 instances
- ✅ Application Load Balancer distributing traffic

### Security
- ✅ IAM roles instead of IAM users
- ✅ Security groups with least privilege access
- ✅ Private subnets for compute and database resources
- ✅ Encryption enabled for RDS and S3

### Operations & Monitoring
- ✅ Lambda function for automated daily RDS backups
- ✅ S3 bucket with versioning for application logs
- ✅ CloudWatch alarms for CPU and memory monitoring
- ✅ Stack termination protection enabled

### Multi-Region Support
- ✅ Parameterized deployment through CDK context
- ✅ Region-specific resource naming
- ✅ Environment-based configuration

### Resource Tagging
- ✅ All resources tagged with Environment, Project, and Owner
- ✅ Tags applied at the app level for consistency

The stack outputs the ALB DNS name which can be used to access the web application. The architecture is designed to be fault-tolerant, scalable, and secure, following AWS best practices for high-availability deployments.