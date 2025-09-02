"""
tap_stack.py - Comprehensive AWS Cloud Infrastructure with Python Pulumi

This script creates a production-ready AWS environment including:
- VPC with public/private subnets across multiple AZs
- NAT Gateways for private subnet internet access
- Auto Scaling Group with EC2 instances
- Application Load Balancer
- RDS database with Multi-AZ and encryption
- S3 buckets with logging and versioning
- CloudWatch monitoring and SNS notifications
- IAM roles with least privilege
- Security groups and bastion host
- Cost optimization and tagging

Author: Infrastructure Team
Environment: Production
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, get_stack
from typing import Dict, List, Optional
import json

# Configuration
config = pulumi.Config()
environment = get_stack() or "prod"
project_name = "tap-infrastructure"

# Common tags for cost tracking and management
common_tags = {
    "Environment": "Production",
    "Project": project_name,
    "ManagedBy": "Pulumi",
    "CostCenter": "Infrastructure",
    "Owner": "DevOps Team"
}

class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for TAP infrastructure.
    Creates a complete, production-ready AWS environment.
    """
    
    def __init__(self, name: str, opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        # Initialize infrastructure components
        self.vpc = self._create_vpc()
        self.security_groups = self._create_security_groups()
        self.iam_roles = self._create_iam_roles()
        self.s3_buckets = self._create_s3_buckets()
        self.rds = self._create_rds_database()
        self.lambda_function = self._create_lambda_function()
        self.ec2_instances = self._create_ec2_infrastructure()
        self.monitoring = self._create_monitoring()
        
        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "public_subnet_ids": [subnet.id for subnet in self.vpc.public_subnets],
            "private_subnet_ids": [subnet.id for subnet in self.vpc.private_subnets],
            "load_balancer_dns": self.ec2_instances["load_balancer"].dns_name,
            "rds_endpoint": self.rds.endpoint,
            "s3_bucket_name": self.s3_buckets["main"].bucket,
            "bastion_public_ip": self.ec2_instances["bastion"].public_ip
        })

    def _create_vpc(self):
        """Create VPC with public and private subnets across multiple AZs"""
        
        # Get available AZs
        available_azs = aws.get_availability_zones(state="available")
        azs = available_azs.names[:3]  # Use first 3 AZs
        
        # VPC
        vpc = aws.ec2.Vpc(f"{project_name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"{project_name}-vpc"}
        )
        
        # Internet Gateway
        internet_gateway = aws.ec2.InternetGateway(f"{project_name}-igw",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"{project_name}-igw"}
        )
        
        # Public subnets
        public_subnets = []
        public_route_table = aws.ec2.RouteTable(f"{project_name}-public-rt",
            vpc_id=vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=internet_gateway.id
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-public-rt"}
        )
        
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(f"{project_name}-public-{az}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**common_tags, "Name": f"{project_name}-public-{az}"}
            )
            public_subnets.append(subnet)
            
            # Associate public subnet with route table
            aws.ec2.RouteTableAssociation(f"{project_name}-public-rta-{az}",
                subnet_id=subnet.id,
                route_table_id=public_route_table.id
            )
        
        # Private subnets
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(f"{project_name}-private-{az}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**common_tags, "Name": f"{project_name}-private-{az}"}
            )
            private_subnets.append(subnet)
        
        # NAT Gateway (one per AZ for high availability)
        nat_gateways = []
        private_route_tables = []
        
        for i, (az, private_subnet) in enumerate(zip(azs, private_subnets)):
            # Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(f"{project_name}-nat-eip-{az}",
                vpc=True,
                tags={**common_tags, "Name": f"{project_name}-nat-eip-{az}"}
            )
            
            # NAT Gateway
            nat_gateway = aws.ec2.NatGateway(f"{project_name}-nat-{az}",
                allocation_id=eip.id,
                subnet_id=public_subnets[i].id,
                tags={**common_tags, "Name": f"{project_name}-nat-{az}"}
            )
            nat_gateways.append(nat_gateway)
            
            # Private route table
            private_rt = aws.ec2.RouteTable(f"{project_name}-private-rt-{az}",
                vpc_id=vpc.id,
                routes=[
                    aws.ec2.RouteTableRouteArgs(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat_gateway.id
                    )
                ],
                tags={**common_tags, "Name": f"{project_name}-private-rt-{az}"}
            )
            private_route_tables.append(private_rt)
            
            # Associate private subnet with route table
            aws.ec2.RouteTableAssociation(f"{project_name}-private-rta-{az}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id
            )
        
        return pulumi.Output.all(vpc, public_subnets, private_subnets, nat_gateways).apply(
            lambda args: type('VPC', (), {
                'id': args[0].id,
                'public_subnets': args[1],
                'private_subnets': args[2],
                'nat_gateways': args[3]
            })
        )

    def _create_security_groups(self):
        """Create security groups with least privilege access"""
        
        # Bastion host security group
        bastion_sg = aws.ec2.SecurityGroup(f"{project_name}-bastion-sg",
            description="Security group for bastion host",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="SSH from anywhere (restrict in production)",
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-bastion-sg"}
        )
        
        # Application security group
        app_sg = aws.ec2.SecurityGroup(f"{project_name}-app-sg",
            description="Security group for application instances",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP from load balancer",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[self.ec2_instances["load_balancer_sg"].id]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTPS from load balancer",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    security_groups=[self.ec2_instances["load_balancer_sg"].id]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="SSH from bastion",
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    security_groups=[bastion_sg.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-app-sg"}
        )
        
        # Load balancer security group
        lb_sg = aws.ec2.SecurityGroup(f"{project_name}-lb-sg",
            description="Security group for load balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP from internet",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTPS from internet",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-lb-sg"}
        )
        
        # RDS security group
        rds_sg = aws.ec2.SecurityGroup(f"{project_name}-rds-sg",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="PostgreSQL from application instances",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[app_sg.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**common_tags, "Name": f"{project_name}-rds-sg"}
        )
        
        return {
            "bastion": bastion_sg,
            "app": app_sg,
            "load_balancer": lb_sg,
            "rds": rds_sg
        }

    def _create_iam_roles(self):
        """Create IAM roles with least privilege access"""
        
        # EC2 instance role
        ec2_role = aws.iam.Role(f"{project_name}-ec2-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"}
                }]
            }),
            tags=common_tags
        )
        
        # EC2 instance profile
        ec2_profile = aws.iam.InstanceProfile(f"{project_name}-ec2-profile",
            role=ec2_role.name,
            tags=common_tags
        )
        
        # Lambda execution role
        lambda_role = aws.iam.Role(f"{project_name}-lambda-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }),
            tags=common_tags
        )
        
        # Attach policies
        aws.iam.RolePolicyAttachment(f"{project_name}-ec2-policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )
        
        aws.iam.RolePolicyAttachment(f"{project_name}-lambda-policy",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )
        
        # Custom policy for RDS snapshot management
        rds_snapshot_policy = aws.iam.Policy(f"{project_name}-rds-snapshot-policy",
            description="Policy for RDS snapshot management",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBInstances",
                            "rds:DescribeDBSnapshots",
                            "rds:DeleteDBSnapshot"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags=common_tags
        )
        
        aws.iam.RolePolicyAttachment(f"{project_name}-lambda-rds-policy",
            role=lambda_role.name,
            policy_arn=rds_snapshot_policy.arn
        )
        
        return {
            "ec2_role": ec2_role,
            "ec2_profile": ec2_profile,
            "lambda_role": lambda_role
        }

    def _create_s3_buckets(self):
        """Create S3 buckets with logging and versioning"""
        
        # Main application bucket
        main_bucket = aws.s3.Bucket(f"{project_name}-app-{environment}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )]
            ),
            tags=common_tags
        )
        
        # Logging bucket
        logging_bucket = aws.s3.Bucket(f"{project_name}-logs-{environment}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )]
            ),
            lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
                id="log_retention",
                enabled=True,
                expiration=aws.s3.BucketLifecycleRuleExpirationArgs(days=90),
                transitions=[
                    aws.s3.BucketLifecycleRuleTransitionArgs(
                        days=30,
                        storage_class="STANDARD_IA"
                    ),
                    aws.s3.BucketLifecycleRuleTransitionArgs(
                        days=60,
                        storage_class="GLACIER"
                    )
                ]
            )],
            tags=common_tags
        )
        
        # Enable access logging on main bucket
        aws.s3.BucketLogging(f"{project_name}-main-bucket-logging",
            bucket=main_bucket.id,
            target_bucket=logging_bucket.id,
            target_prefix="app-logs/"
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(f"{project_name}-main-bucket-public-access-block",
            bucket=main_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        aws.s3.BucketPublicAccessBlock(f"{project_name}-logging-bucket-public-access-block",
            bucket=logging_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        return {
            "main": main_bucket,
            "logging": logging_bucket
        }

    def _create_rds_database(self):
        """Create RDS database with Multi-AZ and encryption"""
        
        # Subnet group for RDS
        db_subnet_group = aws.rds.SubnetGroup(f"{project_name}-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.vpc.private_subnets],
            tags=common_tags
        )
        
        # Parameter group for RDS
        db_parameter_group = aws.rds.ParameterGroup(f"{project_name}-db-parameter-group",
            family="postgres13",
            description="Custom parameter group for TAP database",
            parameters=[
                aws.rds.ParameterGroupParameterArgs(
                    name="log_connections",
                    value="1"
                ),
                aws.rds.ParameterGroupParameterArgs(
                    name="log_disconnections",
                    value="1"
                )
            ],
            tags=common_tags
        )
        
        # RDS instance
        db_instance = aws.rds.Instance(f"{project_name}-db",
            allocated_storage=20,
            storage_type="gp2",
            engine="postgres",
            engine_version="13.7",
            instance_class="db.t3.micro",  # Small for cost optimization
            db_name="tapdb",
            username="tapadmin",
            password=pulumi.Config("db").require_secret("password"),
            parameter_group_name=db_parameter_group.name,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[self.security_groups["rds"].id],
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            multi_az=True,
            storage_encrypted=True,
            deletion_protection=True,
            skip_final_snapshot=False,
            final_snapshot_identifier=f"{project_name}-db-final-snapshot",
            tags=common_tags
        )
        
        return db_instance

    def _create_lambda_function(self):
        """Create Lambda function for RDS snapshot management"""
        
        # Lambda function code
        lambda_code = """
import boto3
import json
from datetime import datetime, timedelta

def lambda_handler(event, context):
    rds = boto3.client('rds')
    
    # Get all RDS instances
    instances = rds.describe_db_instances()
    
    for instance in instances['DBInstances']:
        instance_id = instance['DBInstanceIdentifier']
        
        # Get snapshots for this instance
        snapshots = rds.describe_db_snapshots(
            DBInstanceIdentifier=instance_id,
            SnapshotType='automated'
        )
        
        # Keep only last 7 days of snapshots
        cutoff_date = datetime.now() - timedelta(days=7)
        
        for snapshot in snapshots['DBSnapshots']:
            snapshot_date = snapshot['SnapshotCreateTime'].replace(tzinfo=None)
            if snapshot_date < cutoff_date:
                try:
                    rds.delete_db_snapshot(DBSnapshotIdentifier=snapshot['DBSnapshotIdentifier'])
                    print(f"Deleted old snapshot: {snapshot['DBSnapshotIdentifier']}")
                except Exception as e:
                    print(f"Error deleting snapshot {snapshot['DBSnapshotIdentifier']}: {e}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Snapshot cleanup completed')
    }
"""
        
        # Create Lambda function
        lambda_function = aws.lambda_.Function(f"{project_name}-snapshot-cleanup",
            runtime="python3.9",
            role=self.iam_roles["lambda_role"].arn,
            handler="index.lambda_handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            timeout=300,
            memory_size=128,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": environment
                }
            ),
            tags=common_tags
        )
        
        # CloudWatch Events rule to trigger Lambda daily
        event_rule = aws.cloudwatch.EventRule(f"{project_name}-daily-snapshot-cleanup",
            description="Trigger RDS snapshot cleanup daily",
            schedule_expression="rate(1 day)",
            tags=common_tags
        )
        
        # Event target
        aws.cloudwatch.EventTarget(f"{project_name}-lambda-target",
            rule=event_rule.name,
            arn=lambda_function.arn
        )
        
        # Lambda permission for CloudWatch Events
        aws.lambda_.Permission(f"{project_name}-lambda-permission",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="events.amazonaws.com",
            source_arn=event_rule.arn
        )
        
        return lambda_function

    def _create_ec2_infrastructure(self):
        """Create EC2 instances, Auto Scaling Group, and Load Balancer"""
        
        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[aws.ec2.GetAmiFilterArgs(
                name="name",
                values=["amzn2-ami-hvm-*-x86_64-gp2"]
            )]
        )
        
        # User data for EC2 instances
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from TAP Infrastructure!</h1>" > /var/www/html/index.html
"""
        
        # Launch template
        launch_template = aws.ec2.LaunchTemplate(f"{project_name}-launch-template",
            name_prefix=f"{project_name}-lt",
            image_id=ami.id,
            instance_type="t3.micro",  # Small for cost optimization
            key_name="tap-key",  # You'll need to create this key pair
            vpc_security_group_ids=[self.security_groups["app"].id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.iam_roles["ec2_profile"].name
            ),
            user_data=pulumi.Output.all().apply(lambda _: user_data),
            tag_specifications=[aws.ec2.LaunchTemplateTagSpecificationArgs(
                resource_type="instance",
                tags=common_tags
            )],
            tags=common_tags
        )
        
        # Auto Scaling Group
        asg = aws.autoscaling.Group(f"{project_name}-asg",
            desired_capacity=2,
            max_size=4,
            min_size=1,
            target_group_arns=[self.ec2_instances["target_group"].arn],
            vpc_zone_identifier=[subnet.id for subnet in self.vpc.private_subnets],
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template.id,
                version="$Latest"
            ),
            health_check_grace_period=300,
            health_check_type="ELB",
            tag=[aws.autoscaling.GroupTagArgs(
                key="Name",
                value=f"{project_name}-instance",
                propagate_at_launch=True
            )]
        )
        
        # Target group for load balancer
        target_group = aws.lb.TargetGroup(f"{project_name}-tg",
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
        
        # Application Load Balancer
        load_balancer = aws.lb.LoadBalancer(f"{project_name}-alb",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.security_groups["load_balancer"].id],
            subnets=[subnet.id for subnet in self.vpc.public_subnets],
            enable_deletion_protection=False,
            tags=common_tags
        )
        
        # HTTP listener
        http_listener = aws.lb.Listener(f"{project_name}-http-listener",
            load_balancer_arn=load_balancer.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )]
        )
        
        # Bastion host
        bastion = aws.ec2.Instance(f"{project_name}-bastion",
            ami=ami.id,
            instance_type="t3.micro",
            key_name="tap-key",  # You'll need to create this key pair
            vpc_security_group_ids=[self.security_groups["bastion"].id],
            subnet_id=self.vpc.public_subnets[0].id,
            associate_public_ip_address=True,
            tags={**common_tags, "Name": f"{project_name}-bastion"}
        )
        
        # Scale up policy
        scale_up_policy = aws.autoscaling.Policy(f"{project_name}-scale-up",
            scaling_adjustment=1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=asg.name
        )
        
        # Scale down policy
        scale_down_policy = aws.autoscaling.Policy(f"{project_name}-scale-down",
            scaling_adjustment=-1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=asg.name
        )
        
        return {
            "asg": asg,
            "target_group": target_group,
            "load_balancer": load_balancer,
            "http_listener": http_listener,
            "bastion": bastion,
            "scale_up_policy": scale_up_policy,
            "scale_down_policy": scale_down_policy
        }

    def _create_monitoring(self):
        """Create CloudWatch monitoring and SNS notifications"""
        
        # SNS topic for notifications
        sns_topic = aws.sns.Topic(f"{project_name}-alerts",
            tags=common_tags
        )
        
        # CloudWatch alarms
        cpu_alarm = aws.cloudwatch.MetricAlarm(f"{project_name}-cpu-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="CPU utilization is too high",
            alarm_actions=[sns_topic.arn],
            ok_actions=[sns_topic.arn],
            dimensions=[aws.cloudwatch.MetricAlarmDimensionArgs(
                name="AutoScalingGroupName",
                value=self.ec2_instances["asg"].name
            )],
            tags=common_tags
        )
        
        memory_alarm = aws.cloudwatch.MetricAlarm(f"{project_name}-memory-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="System/Linux",
            period=300,
            statistic="Average",
            threshold=85.0,
            alarm_description="Memory utilization is too high",
            alarm_actions=[sns_topic.arn],
            ok_actions=[sns_topic.arn],
            dimensions=[aws.cloudwatch.MetricAlarmDimensionArgs(
                name="AutoScalingGroupName",
                value=self.ec2_instances["asg"].name
            )],
            tags=common_tags
        )
        
        rds_cpu_alarm = aws.cloudwatch.MetricAlarm(f"{project_name}-rds-cpu-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="RDS CPU utilization is too high",
            alarm_actions=[sns_topic.arn],
            ok_actions=[sns_topic.arn],
            dimensions=[aws.cloudwatch.MetricAlarmDimensionArgs(
                name="DBInstanceIdentifier",
                value=self.rds.id
            )],
            tags=common_tags
        )
        
        # Dashboard
        dashboard = aws.cloudwatch.Dashboard(f"{project_name}-dashboard",
            dashboard_name=f"{project_name}-dashboard",
            dashboard_body=pulumi.Output.all(
                self.ec2_instances["asg"].name,
                self.rds.id
            ).apply(lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", args[0]],
                                [".", "MemoryUtilization", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "us-east-1",
                            "title": "EC2 Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "x": 12,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", args[1]],
                                [".", "DatabaseConnections", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "us-east-1",
                            "title": "RDS Metrics"
                        }
                    }
                ]
            })),
            tags=common_tags
        )
        
        return {
            "sns_topic": sns_topic,
            "cpu_alarm": cpu_alarm,
            "memory_alarm": memory_alarm,
            "rds_cpu_alarm": rds_cpu_alarm,
            "dashboard": dashboard
        }

# Create the stack instance
stack = TapStack("tap-infrastructure")

# Export key outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("load_balancer_dns", stack.ec2_instances["load_balancer"].dns_name)
pulumi.export("rds_endpoint", stack.rds.endpoint)
pulumi.export("s3_bucket_name", stack.s3_buckets["main"].bucket)
pulumi.export("bastion_public_ip", stack.ec2_instances["bastion"].public_ip)
