"""
AWS Production Infrastructure Stack with Python Pulumi
=====================================================

This module creates a comprehensive AWS infrastructure including:
- VPC with public/private subnets across multiple AZs
- Auto Scaling Group with Application Load Balancer
- RDS with Multi-AZ deployment and encryption
- S3 buckets with lifecycle policies
- Lambda function for RDS snapshot management
- CloudWatch monitoring and SNS notifications
- IAM roles following least privilege principle
- Bastion host for secure access

Author: Infrastructure Team
Version: 1.0
"""
```python
import pulumi
import pulumi_aws as aws
import json
import base64
from typing import Dict, List, Optional

# Configuration
config = pulumi.Config()
environment = config.get("environment", "prod")
project_name = config.get("project_name", "tap-infrastructure")
vpc_cidr = config.get("vpc_cidr", "10.0.0.0/16")
db_instance_class = config.get("db_instance_class", "db.t3.micro")
ec2_instance_type = config.get("ec2_instance_type", "t3.micro")
min_size = config.get_int("min_size", 2)
max_size = config.get_int("max_size", 6)
desired_capacity = config.get_int("desired_capacity", 2)

# Common tags for all resources
common_tags = {
    "Environment": environment,
    "Project": project_name,
    "ManagedBy": "Pulumi",
    "CostCenter": "Infrastructure",
    "Owner": "DevOps-Team"
}

class TAPInfrastructure:
    """Main infrastructure class that orchestrates all AWS resources."""
    
    def __init__(self):
        self.availability_zones = self._get_availability_zones()
        self.vpc = None
        self.public_subnets = []
        self.private_subnets = []
        self.security_groups = {}
        self.load_balancer = None
        self.auto_scaling_group = None
        self.rds_instance = None
        self.s3_buckets = {}
        self.lambda_function = None
        self.cloudwatch_alarms = []
        self.sns_topic = None
        
    def _get_availability_zones(self) -> List[str]:
        """Get available AZs in the current region."""
        azs = aws.get_availability_zones(state="available")
        return azs.names[:2]  # Use first 2 AZs
    
    def create_networking(self):
        """Create VPC, subnets, gateways, and route tables."""
        
        # VPC
        self.vpc = aws.ec2.Vpc(
            f"{project_name}-vpc",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"{project_name}-vpc"}
        )
        
        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"{project_name}-igw",
            vpc_id=self.vpc.id,
            tags={**common_tags, "Name": f"{project_name}-igw"}
        )
        
        # Public Subnets
        for i, az in enumerate(self.availability_zones):
            public_subnet = aws.ec2.Subnet(
                f"{project_name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**common_tags, "Name": f"{project_name}-public-subnet-{i+1}", "Type": "Public"}
            )
            self.public_subnets.append(public_subnet)
        
        # Private Subnets
        for i, az in enumerate(self.availability_zones):
            private_subnet = aws.ec2.Subnet(
                f"{project_name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**common_tags, "Name": f"{project_name}-private-subnet-{i+1}", "Type": "Private"}
            )
            self.private_subnets.append(private_subnet)
        
        # NAT Gateways (one per AZ for high availability)
        nat_gateways = []
        for i, public_subnet in enumerate(self.public_subnets):
            # Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{project_name}-nat-eip-{i+1}",
                domain="vpc",
                tags={**common_tags, "Name": f"{project_name}-nat-eip-{i+1}"}
            )
            
            # NAT Gateway
            nat_gw = aws.ec2.NatGateway(
                f"{project_name}-nat-gw-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**common_tags, "Name": f"{project_name}-nat-gw-{i+1}"}
            )
            nat_gateways.append(nat_gw)
        
        # Public Route Table
        public_rt = aws.ec2.RouteTable(
            f"{project_name}-public-rt",
            vpc_id=self.vpc.id,
            tags={**common_tags, "Name": f"{project_name}-public-rt"}
        )
        
        # Public Route to Internet Gateway
        aws.ec2.Route(
            f"{project_name}-public-route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )
        
        # Associate public subnets with public route table
        for i, public_subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{project_name}-public-rta-{i+1}",
                subnet_id=public_subnet.id,
                route_table_id=public_rt.id
            )
        
        # Private Route Tables (one per AZ)
        for i, (private_subnet, nat_gw) in enumerate(zip(self.private_subnets, nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"{project_name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags={**common_tags, "Name": f"{project_name}-private-rt-{i+1}"}
            )
            
            # Route to NAT Gateway
            aws.ec2.Route(
                f"{project_name}-private-route-{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )
            
            # Associate private subnet with private route table
            aws.ec2.RouteTableAssociation(
                f"{project_name}-private-rta-{i+1}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id
            )
    
    def create_security_groups(self):
        """Create security groups following least privilege principle."""
        
        # ALB Security Group
        self.security_groups['alb'] = aws.ec2.SecurityGroup(
            f"{project_name}-alb-sg",
            name=f"{project_name}-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP access from internet"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS access from internet"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-alb-sg"}
        )
        
        # Web Servers Security Group
        self.security_groups['web'] = aws.ec2.SecurityGroup(
            f"{project_name}-web-sg",
            name=f"{project_name}-web-sg",
            description="Security group for web servers",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[self.security_groups['alb'].id],
                    description="HTTP from ALB"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=[vpc_cidr],
                    description="SSH from VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-web-sg"}
        )
        
        # Database Security Group
        self.security_groups['db'] = aws.ec2.SecurityGroup(
            f"{project_name}-db-sg",
            name=f"{project_name}-db-sg",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.security_groups['web'].id],
                    description="MySQL from web servers"
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-db-sg"}
        )
        
        # Bastion Host Security Group
        self.security_groups['bastion'] = aws.ec2.SecurityGroup(
            f"{project_name}-bastion-sg",
            name=f"{project_name}-bastion-sg",
            description="Security group for bastion host",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],  # In production, restrict this to your office IP
                    description="SSH access from internet"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-bastion-sg"}
        )
    
    def create_iam_roles(self):
        """Create IAM roles following least privilege principle."""
        
        # EC2 Instance Role
        ec2_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    }
                }
            ]
        })
        
        self.ec2_role = aws.iam.Role(
            f"{project_name}-ec2-role",
            assume_role_policy=ec2_assume_role_policy,
            tags=common_tags
        )
        
        # EC2 Instance Policy (CloudWatch and SSM access)
        ec2_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudwatch:PutMetricData",
                        "ec2:DescribeVolumes",
                        "ec2:DescribeTags",
                        "logs:PutLogEvents",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream"
                    ],
                    "Resource": "*"
                }
            ]
        })
        
        aws.iam.RolePolicy(
            f"{project_name}-ec2-policy",
            role=self.ec2_role.id,
            policy=ec2_policy
        )
        
        # Instance Profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"{project_name}-instance-profile",
            role=self.ec2_role.name
        )
        
        # Lambda Role for RDS Snapshot Management
        lambda_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }
            ]
        })
        
        self.lambda_role = aws.iam.Role(
            f"{project_name}-lambda-role",
            assume_role_policy=lambda_assume_role_policy,
            tags=common_tags
        )
        
        # Lambda Policy
        lambda_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "rds:DescribeDBSnapshots",
                        "rds:DeleteDBSnapshot",
                        "rds:CreateDBSnapshot"
                    ],
                    "Resource": "*"
                }
            ]
        })
        
        aws.iam.RolePolicy(
            f"{project_name}-lambda-policy",
            role=self.lambda_role.id,
            policy=lambda_policy
        )
    
    def create_compute_resources(self):
        """Create EC2 instances, Auto Scaling Group, and Load Balancer."""
        
        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                )
            ]
        )
        
        # User data script for EC2 instances
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
"""
        
        # Launch Template
        launch_template = aws.ec2.LaunchTemplate(
            f"{project_name}-launch-template",
            name_prefix=f"{project_name}-",
            image_id=ami.id,
            instance_type=ec2_instance_type,
            vpc_security_group_ids=[self.security_groups['web'].id],
            user_data=base64.b64encode(user_data.encode()).decode(),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile.name
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={**common_tags, "Name": f"{project_name}-web-server"}
                )
            ]
        )
        
        # Application Load Balancer
        self.load_balancer = aws.lb.LoadBalancer(
            f"{project_name}-alb",
            name=f"{project_name}-alb",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.public_subnets],
            security_groups=[self.security_groups['alb'].id],
            tags=common_tags
        )
        
        # Target Group
        target_group = aws.lb.TargetGroup(
            f"{project_name}-tg",
            name=f"{project_name}-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags=common_tags
        )
        
        # ALB Listener
        aws.lb.Listener(
            f"{project_name}-listener",
            load_balancer_arn=self.load_balancer.arn,
            port="80",
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ]
        )
        
        # Auto Scaling Group
        self.auto_scaling_group = aws.autoscaling.Group(
            f"{project_name}-asg",
            name=f"{project_name}-asg",
            vpc_zone_identifiers=[subnet.id for subnet in self.private_subnets],
            target_group_arns=[target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=min_size,
            max_size=max_size,
            desired_capacity=desired_capacity,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template.id,
                version="$Latest"
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=key,
                    value=value,
                    propagate_at_launch=True
                ) for key, value in common_tags.items()
            ]
        )
        
        # Bastion Host
        self.bastion_host = aws.ec2.Instance(
            f"{project_name}-bastion",
            ami=ami.id,
            instance_type="t3.nano",  # Smallest instance for cost optimization
            subnet_id=self.public_subnets[0].id,
            vpc_security_group_ids=[self.security_groups['bastion'].id],
            tags={**common_tags, "Name": f"{project_name}-bastion"}
        )
    
    def create_database(self):
        """Create RDS instance with Multi-AZ deployment."""
        
        # DB Subnet Group
        db_subnet_group = aws.rds.SubnetGroup(
            f"{project_name}-db-subnet-group",
            name=f"{project_name}-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**common_tags, "Name": f"{project_name}-db-subnet-group"}
        )
        
        # RDS Instance
        self.rds_instance = aws.rds.Instance(
            f"{project_name}-db",
            identifier=f"{project_name}-db",
            engine="mysql",
            engine_version="8.0",
            instance_class=db_instance_class,
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,
            db_name="tapdb",
            username="admin",
            password=config.require_secret("db_password"),  # Set this in Pulumi config
            vpc_security_group_ids=[self.security_groups['db'].id],
            db_subnet_group_name=db_subnet_group.name,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            multi_az=True,
            skip_final_snapshot=False,
            final_snapshot_identifier=f"{project_name}-db-final-snapshot",
            tags=common_tags
        )
    
    def create_storage(self):
        """Create S3 buckets with lifecycle policies."""
        
        # Application Data Bucket
        self.s3_buckets['app_data'] = aws.s3.Bucket(
            f"{project_name}-app-data",
            bucket=f"{project_name}-app-data-{pulumi.get_stack()}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags=common_tags
        )
        
        # Lifecycle Policy for cost optimization
        aws.s3.BucketLifecycleConfiguration(
            f"{project_name}-app-data-lifecycle",
            bucket=self.s3_buckets['app_data'].id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="transition_to_ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="delete_old_versions",
                    status="Enabled",
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        days=30
                    )
                )
            ]
        )
        
        # Access Logging Bucket
        self.s3_buckets['access_logs'] = aws.s3.Bucket(
            f"{project_name}-access-logs",
            bucket=f"{project_name}-access-logs-{pulumi.get_stack()}",
            tags=common_tags
        )
        
        # Enable ALB access logging
        aws.s3.BucketPolicy(
            f"{project_name}-alb-logs-policy",
            bucket=self.s3_buckets['access_logs'].id,
            policy=self.s3_buckets['access_logs'].arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": "arn:aws:iam::127311923021:root"  # ELB service account for us-east-1
                            },
                            "Action": "s3:PutObject",
                            "Resource": f"{arn}/alb-logs/*"
                        }
                    ]
                })
            )
        )
    
    def create_lambda_function(self):
        """Create Lambda function for RDS snapshot management."""
        
        lambda_code = '''
import boto3
import json
from datetime import datetime, timedelta

def lambda_handler(event, context):
    """
    Lambda function to manage RDS snapshots:
    - Create manual snapshots
    - Delete snapshots older than retention period
    """
    rds = boto3.client('rds')
    
    # Configuration
    db_instance_identifier = event.get('db_instance_identifier', 'tap-infrastructure-db')
    retention_days = event.get('retention_days', 7)
    
    try:
        # Create new snapshot
        snapshot_id = f"{db_instance_identifier}-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}"
        
        rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_identifier
        )
        
        print(f"Created snapshot: {snapshot_id}")
        
        # Delete old snapshots
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        snapshots = rds.describe_db_snapshots(
            DBInstanceIdentifier=db_instance_identifier,
            SnapshotType='manual'
        )
        
        for snapshot in snapshots['DBSnapshots']:
            snapshot_date = snapshot['SnapshotCreateTime'].replace(tzinfo=None)
            
            if snapshot_date < cutoff_date:
                rds.delete_db_snapshot(
                    DBSnapshotIdentifier=snapshot['DBSnapshotIdentifier']
                )
                print(f"Deleted old snapshot: {snapshot['DBSnapshotIdentifier']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps('Snapshot management completed successfully')
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
'''
        
        # Create Lambda function
        self.lambda_function = aws.lambda_.Function(
            f"{project_name}-snapshot-manager",
            name=f"{project_name}-snapshot-manager",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset(lambda_code)
            }),
            handler="lambda_function.lambda_handler",
            role=self.lambda_role.arn,
            timeout=300,
            tags=common_tags
        )
        
        # CloudWatch Event Rule to trigger Lambda daily
        event_rule = aws.cloudwatch.EventRule(
            f"{project_name}-snapshot-schedule",
            name=f"{project_name}-snapshot-schedule",
            description="Trigger RDS snapshot management daily",
            schedule_expression="rate(1 day)",
            tags=common_tags
        )
        
        # Lambda permission for CloudWatch Events
        aws.lambda_.Permission(
            f"{project_name}-lambda-permission",
            statement_id="AllowExecutionFromCloudWatch",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="events.amazonaws.com",
            source_arn=event_rule.arn
        )
        
        # CloudWatch Event Target
        aws.cloudwatch.EventTarget(
            f"{project_name}-lambda-target",
            rule=event_rule.name,
            target_id="SnapshotManagerTarget",
            arn=self.lambda_function.arn,
            input=json.dumps({
                "db_instance_identifier": f"{project_name}-db",
                "retention_days": 7
            })
        )
    
    def create_monitoring(self):
        """Create CloudWatch alarms and SNS notifications."""
        
        # SNS Topic for notifications
        self.sns_topic = aws.sns.Topic(
            f"{project_name}-alerts",
            name=f"{project_name}-alerts",
            tags=common_tags
        )
        
        # SNS Topic Subscription (replace with your email)
        aws.sns.TopicSubscription(
            f"{project_name}-email-alert",
            topic_arn=self.sns_topic.arn,
            protocol="email",
            endpoint=config.get("alert_email", "admin@example.com")
        )
        
        # CPU Utilization Alarm for ASG
        cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"{project_name}-high-cpu",
            name=f"{project_name}-high-cpu",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="This metric monitors ec2 cpu utilization",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "AutoScalingGroupName": self.auto_scaling_group.name
            },
            tags=common_tags
        )
        self.cloudwatch_alarms.append(cpu_alarm)
        
        # RDS CPU Utilization Alarm
        rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"{project_name}-rds-high-cpu",
            name=f"{project_name}-rds-high-cpu",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="This metric monitors RDS cpu utilization",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.rds_instance.id
            },
            tags=common_tags
        )
        self.cloudwatch_alarms.append(rds_cpu_alarm)
        
        # ALB Target Health Alarm
        alb_health_alarm = aws.cloudwatch.MetricAlarm(
            f"{project_name}-alb-unhealthy-targets",
            name=f"{project_name}-alb-unhealthy-targets",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=0,
            alarm_description="This metric monitors unhealthy ALB targets",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "LoadBalancer": self.load_balancer.arn_suffix
            },
            tags=common_tags
        )
        self.cloudwatch_alarms.append(alb_health_alarm)
    
    def deploy(self):
        """Deploy all infrastructure components."""
        print("🚀 Starting TAP Infrastructure deployment...")
        
        # Deploy in order due to dependencies
```
