"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional
from datetime import datetime
import base64

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
    environment (Optional[str]): Environment name (dev, staging, prod). Defaults to 'dev'.
    aws_region (Optional[str]): AWS region for deployment. Defaults to 'us-east-1'.
    db_password (Optional[pulumi.Output[str]]): Database password secret. Defaults to 'DefaultPassword123!' for development.
  """

  def __init__(
      self, 
      environment_suffix: Optional[str] = None, 
      tags: Optional[dict] = None,
      environment: Optional[str] = None,
      aws_region: Optional[str] = None,
      db_password: Optional[pulumi.Output[str]] = None
  ):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags
    self.environment = environment or 'dev'
    self.aws_region = aws_region or 'us-east-1'
    self.db_password = db_password or 'DefaultPassword123!'


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}
        self.environment = args.environment
        self.aws_region = args.aws_region
        deployment_date = datetime.now().strftime("%Y-%m-%d")

        # Validate environment
        valid_environments = ["dev", "staging", "prod"]
        if self.environment not in valid_environments:
            raise ValueError(f"Environment must be one of {valid_environments}, got: {self.environment}")

        # Environment-specific configurations
        env_config = {
            "dev": {
                "rds_instance_type": "db.t3.micro",
                "asg_min": 1,
                "asg_max": 2,
                "s3_lifecycle_days": 7,
                "cpu_alarm_threshold": 80,
            },
            "staging": {
                "rds_instance_type": "db.t3.small",
                "asg_min": 2,
                "asg_max": 4,
                "s3_lifecycle_days": 30,
                "cpu_alarm_threshold": 80,
            },
            "prod": {
                "rds_instance_type": "db.t3.medium",
                "asg_min": 3,
                "asg_max": 6,
                "s3_lifecycle_days": 90,
                "cpu_alarm_threshold": 70,
            },
        }

        current_config = env_config[self.environment]

        # Dynamically fetch the latest Amazon Linux 2 AMI for the current region
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"],
                ),
                aws.ec2.GetAmiFilterArgs(
                    name="virtualization-type",
                    values=["hvm"],
                ),
            ],
        )
        ami_id = ami.id

        # Common tags
        common_tags = {
            **self.tags,
            "Environment": self.environment,
            "EnvironmentSuffix": self.environment_suffix,
            "CostCenter": "FinTech",
            "DeploymentDate": deployment_date,
            "ManagedBy": "Pulumi",
        }

        # VPC Configuration
        vpc = aws.ec2.Vpc(
            f"payment-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"payment-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )
        self.vpc = vpc

        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"payment-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"payment-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Public Subnets (for ALB)
        public_subnet_1 = aws.ec2.Subnet(
            f"payment-public-subnet-1-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=azs.names[0],
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"payment-public-subnet-1-{self.environment_suffix}", "Type": "Public"},
            opts=ResourceOptions(parent=self),
        )

        public_subnet_2 = aws.ec2.Subnet(
            f"payment-public-subnet-2-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=azs.names[1],
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"payment-public-subnet-2-{self.environment_suffix}", "Type": "Public"},
            opts=ResourceOptions(parent=self),
        )
        self.public_subnets = [public_subnet_1, public_subnet_2]

        # Private Subnets (for application servers)
        private_subnet_1 = aws.ec2.Subnet(
            f"payment-private-subnet-1-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=azs.names[0],
            tags={**common_tags, "Name": f"payment-private-subnet-1-{self.environment_suffix}", "Type": "Private"},
            opts=ResourceOptions(parent=self),
        )

        private_subnet_2 = aws.ec2.Subnet(
            f"payment-private-subnet-2-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=azs.names[1],
            tags={**common_tags, "Name": f"payment-private-subnet-2-{self.environment_suffix}", "Type": "Private"},
            opts=ResourceOptions(parent=self),
        )
        self.private_subnets = [private_subnet_1, private_subnet_2]

        # Database Subnets
        db_subnet_1 = aws.ec2.Subnet(
            f"tap-payment-db-subnet-1-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.31.0/24",
            availability_zone=azs.names[0],
            tags={**common_tags, "Name": f"tap-payment-db-subnet-1-{self.environment_suffix}", "Type": "Database"},
            opts=ResourceOptions(parent=self),
        )

        db_subnet_2 = aws.ec2.Subnet(
            f"tap-payment-db-subnet-2-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.32.0/24",
            availability_zone=azs.names[1],
            tags={**common_tags, "Name": f"tap-payment-db-subnet-2-{self.environment_suffix}", "Type": "Database"},
            opts=ResourceOptions(parent=self),
        )

        # NAT Gateway for private subnets
        eip = aws.ec2.Eip(
            f"tap-payment-nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={**common_tags, "Name": f"tap-payment-nat-eip-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        nat_gateway = aws.ec2.NatGateway(
            f"payment-nat-{self.environment_suffix}",
            subnet_id=public_subnet_1.id,
            allocation_id=eip.id,
            tags={**common_tags, "Name": f"payment-nat-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[igw]),
        )

        # Public Route Table
        public_route_table = aws.ec2.RouteTable(
            f"payment-public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"payment-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        public_route = aws.ec2.Route(
            f"payment-public-route-{self.environment_suffix}",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=ResourceOptions(parent=self),
        )

        public_rt_association_1 = aws.ec2.RouteTableAssociation(
            f"payment-public-rta-1-{self.environment_suffix}",
            subnet_id=public_subnet_1.id,
            route_table_id=public_route_table.id,
            opts=ResourceOptions(parent=self),
        )

        public_rt_association_2 = aws.ec2.RouteTableAssociation(
            f"payment-public-rta-2-{self.environment_suffix}",
            subnet_id=public_subnet_2.id,
            route_table_id=public_route_table.id,
            opts=ResourceOptions(parent=self),
        )

        # Private Route Table
        private_route_table = aws.ec2.RouteTable(
            f"payment-private-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"payment-private-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        private_route = aws.ec2.Route(
            f"payment-private-route-{self.environment_suffix}",
            route_table_id=private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id,
            opts=ResourceOptions(parent=self),
        )

        private_rt_association_1 = aws.ec2.RouteTableAssociation(
            f"payment-private-rta-1-{self.environment_suffix}",
            subnet_id=private_subnet_1.id,
            route_table_id=private_route_table.id,
            opts=ResourceOptions(parent=self),
        )

        private_rt_association_2 = aws.ec2.RouteTableAssociation(
            f"payment-private-rta-2-{self.environment_suffix}",
            subnet_id=private_subnet_2.id,
            route_table_id=private_route_table.id,
            opts=ResourceOptions(parent=self),
        )

        # Security Groups

        # ALB Security Group
        alb_security_group = aws.ec2.SecurityGroup(
            f"payment-alb-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from anywhere",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                )
            ],
            tags={**common_tags, "Name": f"payment-alb-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Application Security Group
        app_security_group = aws.ec2.SecurityGroup(
            f"payment-app-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for application servers",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[alb_security_group.id],
                    description="Allow HTTP from ALB",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    security_groups=[alb_security_group.id],
                    description="Allow HTTPS from ALB",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                )
            ],
            tags={**common_tags, "Name": f"payment-app-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Database Security Group
        db_security_group = aws.ec2.SecurityGroup(
            f"tap-payment-db-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for RDS database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.11.0/24", "10.0.12.0/24"],
                    description="Allow PostgreSQL from application subnets",
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                )
            ],
            tags={**common_tags, "Name": f"tap-payment-db-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # RDS Subnet Group
        db_subnet_group = aws.rds.SubnetGroup(
            f"tap-payment-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[db_subnet_1.id, db_subnet_2.id],
            tags={**common_tags, "Name": f"tap-payment-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # RDS PostgreSQL Instance
        db_instance = aws.rds.Instance(
            f"tap-payment-db-{self.environment_suffix}",
            identifier=f"tap-payment-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="13.22",
            instance_class=current_config["rds_instance_type"],
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,
            db_name="paymentdb",
            username="dbadmin",
            password=args.db_password,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[db_security_group.id],
            multi_az=(self.environment == "prod"),
            skip_final_snapshot=(self.environment != "prod"),
            backup_retention_period=7 if self.environment == "prod" else 1,
            publicly_accessible=False,
            tags={**common_tags, "Name": f"tap-payment-db-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )
        self.db_instance = db_instance

        # S3 Bucket for transaction logs
        s3_bucket = aws.s3.Bucket(
            f"tap-payment-logs-{self.environment_suffix}",
            bucket=f"tap-payment-logs-{self.environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True,
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    id="expire-old-logs",
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                        days=current_config["s3_lifecycle_days"],
                    ),
                )
            ],
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                ),
            ),
            tags=common_tags,
            opts=ResourceOptions(parent=self),
        )
        self.s3_bucket = s3_bucket

        # Block public access to S3 bucket
        s3_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"tap-payment-logs-pab-{self.environment_suffix}",
            bucket=s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self),
        )

        # Application Load Balancer
        alb = aws.lb.LoadBalancer(
            f"tap-payment-alb-{self.environment_suffix}",
            name=f"tap-payment-alb-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_security_group.id],
            subnets=[public_subnet_1.id, public_subnet_2.id],
            enable_deletion_protection=False,
            tags={**common_tags, "Name": f"tap-payment-alb-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )
        self.alb = alb

        # Target Group
        target_group = aws.lb.TargetGroup(
            f"tap-payment-tg-{self.environment_suffix}",
            name=f"tap-payment-tg-{self.environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="instance",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                protocol="HTTP",
                port="80",
                healthy_threshold=3,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                matcher="200",
            ),
            deregistration_delay=30,
            tags={**common_tags, "Name": f"tap-payment-tg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # ALB Listener (HTTP)
        alb_listener = aws.lb.Listener(
            f"tap-payment-alb-listener-{self.environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=target_group.arn,
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # IAM Role for EC2 instances
        ec2_role = aws.iam.Role(
            f"payment-ec2-role-{self.environment_suffix}",
            name=f"paymentt-ec2-role-{self.environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags=common_tags,
            opts=ResourceOptions(parent=self),
        )

        # Attach CloudWatch policy
        cloudwatch_policy_attachment = aws.iam.RolePolicyAttachment(
            f"payment-ec2-cloudwatch-policy-{self.environment_suffix}",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=ResourceOptions(parent=self),
        )

        # Attach SSM policy for Session Manager
        ssm_policy_attachment = aws.iam.RolePolicyAttachment(
            f"payment-ec2-ssm-policy-{self.environment_suffix}",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=self),
        )

        # S3 access policy for logs
        s3_policy = aws.iam.RolePolicy(
            f"payment-ec2-s3-policy-{self.environment_suffix}",
            role=ec2_role.id,
            policy=s3_bucket.arn.apply(
                lambda arn: f"""{{
                "Version": "2012-10-17",
                "Statement": [{{
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        "{arn}",
                        "{arn}/*"
                    ]
                }}]
            }}"""
            ),
            opts=ResourceOptions(parent=self),
        )

        # Instance Profile
        instance_profile = aws.iam.InstanceProfile(
            f"tap-payment-instance-profile-{self.environment_suffix}",
            name=f"tap-payment-instance-profile-{self.environment_suffix}",
            role=ec2_role.name,
            opts=ResourceOptions(parent=self),
        )

        # User data script
        user_data_script = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Payment Processing App - $(hostname -f)</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
"""

        # Launch Template
        launch_template = aws.ec2.LaunchTemplate(
            f"tap-payment-lt-{self.environment_suffix}",
            name=f"tap-payment-lt-{self.environment_suffix}",
            image_id=ami_id,
            instance_type="t3.micro",
            vpc_security_group_ids=[app_security_group.id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=instance_profile.arn,
            ),
            user_data=pulumi.Output.all().apply(
                lambda _: base64.b64encode(user_data_script.encode()).decode()
            ),
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True,
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={**common_tags, "Name": f"payment-app-{self.environment_suffix}"},
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # Auto Scaling Group
        asg = aws.autoscaling.Group(
            f"tap-payment-asg-{self.environment_suffix}",
            name=f"tap-payment-asg-{self.environment_suffix}",
            vpc_zone_identifiers=[private_subnet_1.id, private_subnet_2.id],
            target_group_arns=[target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=current_config["asg_min"],
            max_size=current_config["asg_max"],
            desired_capacity=current_config["asg_min"],
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template.id,
                version="$Latest",
            ),
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances",
            ],
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"tap-payment-asg-{self.environment_suffix}",
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Environment",
                    value=self.environment,
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="EnvironmentSuffix",
                    value=self.environment_suffix,
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="CostCenter",
                    value="FinTech",
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="DeploymentDate",
                    value=deployment_date,
                    propagate_at_launch=True,
                ),
            ],
            opts=ResourceOptions(parent=self),
        )
        self.asg = asg

        # CloudWatch Alarm for CPU Utilization
        cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"payment-cpu-alarm-{self.environment_suffix}",
            name=f"payment-cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=current_config["cpu_alarm_threshold"],
            alarm_description=f"Triggers when CPU exceeds {current_config['cpu_alarm_threshold']}% for {self.environment} environment",
            dimensions={
                "AutoScalingGroupName": asg.name,
            },
            tags=common_tags,
            opts=ResourceOptions(parent=self),
        )

        # CloudWatch Alarm for RDS CPU
        rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"payment-rds-cpu-alarm-{self.environment_suffix}",
            name=f"payment-rds-cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=current_config["cpu_alarm_threshold"],
            alarm_description=f"Triggers when RDS CPU exceeds {current_config['cpu_alarm_threshold']}% for {self.environment} environment",
            dimensions={
                "DBInstanceIdentifier": db_instance.identifier,
            },
            tags=common_tags,
            opts=ResourceOptions(parent=self),
        )

        # Register outputs using pulumi.export
        pulumi.export("vpc_id", vpc.id)
        pulumi.export("alb_dns_name", alb.dns_name)
        # Handle None dns_name gracefully for unit tests
        alb_url = alb.dns_name.apply(lambda dns: f"http://{dns}" if dns else "")
        pulumi.export("alb_url", alb_url)
        pulumi.export("rds_endpoint", db_instance.endpoint)
        pulumi.export("rds_address", db_instance.address)
        pulumi.export("s3_bucket_name", s3_bucket.id)
        pulumi.export("s3_bucket_arn", s3_bucket.arn)
        pulumi.export("asg_name", asg.name)
        pulumi.export("environment", self.environment)
        pulumi.export("environment_suffix", self.environment_suffix)
        pulumi.export("region", self.aws_region)
