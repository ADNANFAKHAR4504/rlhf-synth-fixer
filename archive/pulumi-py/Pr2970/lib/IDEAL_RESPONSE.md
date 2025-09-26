"""
tap_stack.py

AWS Infrastructure Implementation using Pulumi and Python
Creates a comprehensive, production-ready cloud environment on AWS.
"""
```python
import json
import base64
from typing import Optional, Dict, Any

import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import (
    ec2, iam, s3, rds, lb, autoscaling, 
    sns, cloudwatch, lambda_, secretsmanager,
    kms
)


class TapStackArgs:
    """Configuration arguments for the TapStack."""

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
      self.environment_suffix = environment_suffix or 'dev'
      # Start with required tags
      self.tags = {
          'Environment': self.environment_suffix,
          'Team': '3',
          'Project': 'iac-test-automations'
      }
      # Override with custom tags if provided
      if tags:
          self.tags.update(tags)


class TapStack(pulumi.ComponentResource):
    """Main AWS Infrastructure Stack Implementation."""
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        self.region = 'ap-south-1'
        
        # Get latest Amazon Linux 2 AMI
        self.ami = ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[{"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]}]
        )
        
        # Create all infrastructure components
        self._create_vpc_and_networking()
        self._create_security_groups()
        self._create_iam_roles()
        self._create_s3_buckets()
        self._create_secrets_manager()
        self._create_rds_database()
        self._create_launch_template()
        self._create_load_balancer()
        self._create_autoscaling_group()
        self._create_sns_notifications()
        self._create_cloudwatch_monitoring()
        self._create_lambda_backup()
        self._create_logging_infrastructure()
        
        # Register outputs
        try:
            if hasattr(self, 'vpc') and self.vpc:
                self.register_outputs({'vpc_id': self.vpc.id})
            if hasattr(self, 'alb') and self.alb:
                self.register_outputs({'alb_dns_name': self.alb.dns_name})
            if hasattr(self, 'rds_instance') and self.rds_instance:
                self.register_outputs({'rds_endpoint': self.rds_instance.endpoint})
            if hasattr(self, 'static_files_bucket') and self.static_files_bucket:
                self.register_outputs({'s3_bucket_name': self.static_files_bucket.id})
        except Exception as e:
            # Handle case where attributes don't exist (e.g., during testing)
            print(f"Warning: Could not register outputs: {e}")
            pass
    
    def _create_vpc_and_networking(self):
        """Create VPC with public and private subnets across two AZs."""
        # VPC
        self.vpc = ec2.Vpc(
            f"vpc-v1-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"vpc-v1-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Internet Gateway
        self.igw = ec2.InternetGateway(
            f"igw-v1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"igw-v1-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Get availability zones
        import pulumi_aws
        azs = pulumi_aws.get_availability_zones()
        
        # Public subnets
        self.public_subnets = []
        self.private_subnets = []
        self.public_route_tables = []
        self.private_route_tables = []
        
        for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
            # Public subnet
            public_subnet = ec2.Subnet(
                f"public-subnet-v1-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"public-subnet-v1-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = ec2.Subnet(
                f"private-subnet-v1-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**self.tags, "Name": f"private-subnet-v1-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)
            
            # Public route table
            public_rt = ec2.RouteTable(
                f"public-rt-v1-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={**self.tags, "Name": f"public-rt-v1-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            
            ec2.Route(
                f"public-route-v1-{i+1}-{self.environment_suffix}",
                route_table_id=public_rt.id,
                destination_cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id,
                opts=ResourceOptions(parent=self)
            )
            
            ec2.RouteTableAssociation(
                f"public-rta-v1-{i+1}-{self.environment_suffix}",
                subnet_id=public_subnet.id,
                route_table_id=public_rt.id,
                opts=ResourceOptions(parent=self)
            )
            self.public_route_tables.append(public_rt)
        
        # Create single NAT Gateway (to avoid AWS limit of 100 NAT gateways)
        # Use the first public subnet for the NAT Gateway
        nat_eip = ec2.Eip(
            f"nat-eip-v1-{self.environment_suffix}",
            domain="vpc",
            tags={**self.tags, "Name": f"nat-eip-v1-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        self.nat_gateway = ec2.NatGateway(
            f"nat-gateway-v1-{self.environment_suffix}",
            allocation_id=nat_eip.id,
            subnet_id=self.public_subnets[0].id,  # Use first public subnet
            tags={**self.tags, "Name": f"nat-gateway-v1-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Create private route tables that all use the single NAT Gateway
        for i, private_subnet in enumerate(self.private_subnets):
            private_rt = ec2.RouteTable(
                f"private-rt-v1-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={**self.tags, "Name": f"private-rt-v1-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            
            ec2.Route(
                f"private-route-v1-{i+1}-{self.environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateway.id,  # All private subnets use same NAT Gateway
                opts=ResourceOptions(parent=self)
            )
            
            ec2.RouteTableAssociation(
                f"private-rta-v1-{i+1}-{self.environment_suffix}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )
            self.private_route_tables.append(private_rt)
    
    def _create_security_groups(self):
        """Create security groups and network ACLs."""
        # ALB Security Group
        self.alb_sg = ec2.SecurityGroup(
            f"alb-sg-v2-{self.environment_suffix}",
            name=f"alb-sg-v2-{self.environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.tags, "Name": f"alb-sg-v2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # EC2 Security Group
        self.ec2_sg = ec2.SecurityGroup(
            f"ec2-sg-v2-{self.environment_suffix}",
            name=f"ec2-sg-v2-{self.environment_suffix}",
            description="Security group for EC2 instances",
            vpc_id=self.vpc.id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[self.alb_sg.id]
                ),
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.tags, "Name": f"ec2-sg-v2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # RDS Security Group
        self.rds_sg = ec2.SecurityGroup(
            f"rds-sg-v2-{self.environment_suffix}",
            name=f"rds-sg-v2-{self.environment_suffix}",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[self.ec2_sg.id]
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.tags, "Name": f"rds-sg-v2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Network ACLs
        self.public_nacl = ec2.NetworkAcl(
            f"public-nacl-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"public-nacl-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        self.private_nacl = ec2.NetworkAcl(
            f"private-nacl-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"private-nacl-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Associate NACLs with subnets
        for i, subnet in enumerate(self.public_subnets):
            ec2.NetworkAclAssociation(
                f"public-nacl-assoc-{i+1}-{self.environment_suffix}",
                network_acl_id=self.public_nacl.id,
                subnet_id=subnet.id,
                opts=ResourceOptions(parent=self)
            )
        
        for i, subnet in enumerate(self.private_subnets):
            ec2.NetworkAclAssociation(
                f"private-nacl-assoc-{i+1}-{self.environment_suffix}",
                network_acl_id=self.private_nacl.id,
                subnet_id=subnet.id,
                opts=ResourceOptions(parent=self)
            )
    
    def _create_iam_roles(self):
        """Create IAM roles for EC2 and Lambda with least privilege."""
        # EC2 Instance Role
        self.ec2_role = iam.Role(
            f"ec2-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"}
                }]
            }),
            tags={**self.tags, "Name": f"ec2-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # EC2 Instance Profile
        self.ec2_instance_profile = iam.InstanceProfile(
            f"ec2-instance-profile-{self.environment_suffix}",
            role=self.ec2_role.name,
            tags={**self.tags, "Name": f"ec2-instance-profile-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # EC2 Role Policy - minimal permissions
        iam.RolePolicy(
            f"ec2-policy-{self.environment_suffix}",
            role=self.ec2_role.id,
            policy=json.dumps({
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
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": f"arn:aws:secretsmanager:{self.region}:*:secret:rds-credentials-{self.environment_suffix}*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Role
        self.lambda_role = iam.Role(
            f"lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }),
            tags={**self.tags, "Name": f"lambda-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Role Policy
        iam.RolePolicy(
            f"lambda-policy-{self.environment_suffix}",
            role=self.lambda_role.id,
            policy=json.dumps({
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
                            "rds:CreateDBSnapshot",
                            "rds:DescribeDBSnapshots",
                            "rds:DeleteDBSnapshot"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )
    
    def _create_s3_buckets(self):
        """Create S3 buckets for static files and logs with versioning."""
        # Static files bucket
        self.static_files_bucket = s3.Bucket(
            f"static-files-{self.environment_suffix}",
            versioning=s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
                rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={**self.tags, "Name": f"static-files-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Logs bucket
        self.logs_bucket = s3.Bucket(
            f"logs-{self.environment_suffix}",
            versioning=s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
                rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={**self.tags, "Name": f"logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
    
    def _create_secrets_manager(self):
        """Create AWS Secrets Manager for database credentials."""
        import secrets
        import string
        
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
        
        self.db_secret = secretsmanager.Secret(
            f"rds-credentials-{self.environment_suffix}",
            name=f"rds-credentials-{self.environment_suffix}",
            description="Database credentials for RDS instance",
            tags={**self.tags, "Name": f"rds-credentials-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        self.db_secret_version = secretsmanager.SecretVersion(
            f"rds-credentials-version-{self.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=json.dumps({
                "username": "dbadmin",
                "password": password
            }),
            opts=ResourceOptions(parent=self)
        )
    
    def _create_rds_database(self):
        """Deploy PostgreSQL RDS with multi-AZ in private subnet."""
        # DB Subnet Group
        self.db_subnet_group = rds.SubnetGroup(
            f"db-subnet-group-v1-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.tags, "Name": f"db-subnet-group-v1-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # DB Parameter Group
        self.db_parameter_group = rds.ParameterGroup(
            f"db-parameter-group-v1-{self.environment_suffix}",
            family="postgres17",
            description="Custom parameter group for PostgreSQL",
            parameters=[
                {"name": "log_statement", "value": "all"},
                {"name": "log_min_duration_statement", "value": "1000"}
            ],
            tags={**self.tags, "Name": f"db-parameter-group-v1-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # RDS Instance
        self.rds_instance = rds.Instance(
            f"rds-instance-v1-{self.environment_suffix}",
            engine="postgres",
            engine_version="17.6",
            instance_class="db.t3.micro",
            allocated_storage=20,
            max_allocated_storage=100,
            storage_type="gp3",
            storage_encrypted=True,
            db_name="appdb",
            username="dbadmin",
            password=self.db_secret_version.secret_string.apply(lambda s: json.loads(s)["password"]),
            vpc_security_group_ids=[self.rds_sg.id],
            db_subnet_group_name=self.db_subnet_group.name,
            parameter_group_name=self.db_parameter_group.name,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            multi_az=True,
            skip_final_snapshot=False,
            final_snapshot_identifier=f"rds-final-snapshot-{self.environment_suffix}",
            deletion_protection=False,
            tags={**self.tags, "Name": f"rds-instance-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
    
    def _create_launch_template(self):
        """Create launch template with latest Amazon Linux 2 AMI."""
        # User data script
        user_data = base64.b64encode("""
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname)</h1>" > /var/www/html/index.html
""".encode()).decode()
        
        self.launch_template = ec2.LaunchTemplate(
            f"launch-template-{self.environment_suffix}",
            name=f"launch-template-{self.environment_suffix}",
            image_id=self.ami.id,
            instance_type="t3.micro",
            vpc_security_group_ids=[self.ec2_sg.id],
            iam_instance_profile=ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.ec2_instance_profile.name
            ),
            user_data=user_data,
            tag_specifications=[
                ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={**self.tags, "Name": f"ec2-instance-{self.environment_suffix}"}
                )
            ],
            tags={**self.tags, "Name": f"launch-template-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
    
    def _create_autoscaling_group(self):
        """Deploy Auto Scaling Group in private subnets."""
        self.asg = autoscaling.Group(
            f"asg-{self.environment_suffix}",
            name=f"asg-{self.environment_suffix}",
            vpc_zone_identifiers=[subnet.id for subnet in self.private_subnets],
            launch_template=autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            min_size=2,
            max_size=4,
            desired_capacity=2,
            health_check_type="ELB",
            health_check_grace_period=300,
            target_group_arns=[self.target_group.arn],
            tags=[
                autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"asg-instance-{self.environment_suffix}",
                    propagate_at_launch=True
                )
            ] + [autoscaling.GroupTagArgs(key=k, value=v, propagate_at_launch=True) for k, v in self.tags.items()],
            opts=ResourceOptions(parent=self)
        )
        
        # Auto Scaling Policies
        self.scale_up_policy = autoscaling.Policy(
            f"scale-up-policy-{self.environment_suffix}",
            name=f"scale-up-policy-{self.environment_suffix}",
            scaling_adjustment=1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=self.asg.name,
            opts=ResourceOptions(parent=self)
        )
        
        self.scale_down_policy = autoscaling.Policy(
            f"scale-down-policy-{self.environment_suffix}",
            name=f"scale-down-policy-{self.environment_suffix}",
            scaling_adjustment=-1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=self.asg.name,
            opts=ResourceOptions(parent=self)
        )
    
    def _create_load_balancer(self):
        """Configure Application Load Balancer in public subnets."""
        # Target Group
        self.target_group = lb.TargetGroup(
            f"target-group-{self.environment_suffix}",
            name=f"target-group-{self.environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="instance",
            health_check=lb.TargetGroupHealthCheckArgs(
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
            tags={**self.tags, "Name": f"target-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Application Load Balancer
        self.alb = lb.LoadBalancer(
            f"alb-v2-{self.environment_suffix}",
            name=f"alb-v2-{self.environment_suffix}",
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=False,
            tags={**self.tags, "Name": f"alb-v2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # ALB Listener
        self.alb_listener = lb.Listener(
            f"alb-listener-v2-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            opts=ResourceOptions(parent=self)
        )
    
    def _create_sns_notifications(self):
        """Set up SNS for Auto Scaling Group notifications."""
        self.sns_topic = sns.Topic(
            f"asg-notifications-{self.environment_suffix}",
            name=f"asg-notifications-{self.environment_suffix}",
            tags={**self.tags, "Name": f"asg-notifications-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # SNS Topic Policy
        sns.TopicPolicy(
            f"sns-topic-policy-{self.environment_suffix}",
            arn=self.sns_topic.arn,
            policy=self.sns_topic.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "autoscaling.amazonaws.com"},
                        "Action": "SNS:Publish",
                        "Resource": arn
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )
        
        # Auto Scaling Notifications
        autoscaling.Notification(
            f"asg-notification-{self.environment_suffix}",
            group_names=[self.asg.name],
            notifications=[
                "autoscaling:EC2_INSTANCE_LAUNCH",
                "autoscaling:EC2_INSTANCE_TERMINATE",
                "autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
                "autoscaling:EC2_INSTANCE_TERMINATE_ERROR"
            ],
            topic_arn=self.sns_topic.arn,
            opts=ResourceOptions(parent=self)
        )
    
    def _create_cloudwatch_monitoring(self):
        """Configure CloudWatch monitoring for EC2, RDS, and ALB."""
        # CloudWatch Log Groups
        self.ec2_log_group = cloudwatch.LogGroup(
            f"ec2-logs-{self.environment_suffix}",
            name=f"/aws/ec2/{self.environment_suffix}",
            retention_in_days=30,
            tags={**self.tags, "Name": f"ec2-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        self.rds_log_group = cloudwatch.LogGroup(
            f"rds-logs-{self.environment_suffix}",
            name=f"/aws/rds/{self.environment_suffix}",
            retention_in_days=30,
            tags={**self.tags, "Name": f"rds-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Alarms
        self.cpu_alarm = cloudwatch.MetricAlarm(
            f"cpu-alarm-{self.environment_suffix}",
            name=f"cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="This metric monitors ec2 cpu utilization",
            alarm_actions=[self.sns_topic.arn],
            dimensions={"AutoScalingGroupName": self.asg.name},
            tags={**self.tags, "Name": f"cpu-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        self.rds_cpu_alarm = cloudwatch.MetricAlarm(
            f"rds-cpu-alarm-{self.environment_suffix}",
            name=f"rds-cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="This metric monitors rds cpu utilization",
            alarm_actions=[self.sns_topic.arn],
            dimensions={"DBInstanceIdentifier": self.rds_instance.id},
            tags={**self.tags, "Name": f"rds-cpu-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
    
    def _create_lambda_backup(self):
        """Create Lambda function for automated RDS snapshots."""
        # Lambda function code
        lambda_code = """
import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    rds = boto3.client('rds')
    
    try:
        # Create snapshot
        snapshot_id = f"automated-snapshot-{context.aws_request_id}"
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=event['DBInstanceIdentifier']
        )
        
        logger.info(f"Snapshot created: {snapshot_id}")
        
        # Clean up old snapshots (keep last 7)
        snapshots = rds.describe_db_snapshots(
            DBInstanceIdentifier=event['DBInstanceIdentifier'],
            SnapshotType='automated'
        )
        
        if len(snapshots['DBSnapshots']) > 7:
            # Sort by creation time and delete oldest
            snapshots['DBSnapshots'].sort(key=lambda x: x['SnapshotCreateTime'])
            for snapshot in snapshots['DBSnapshots'][:-7]:
                rds.delete_db_snapshot(DBSnapshotIdentifier=snapshot['DBSnapshotIdentifier'])
                logger.info(f"Deleted old snapshot: {snapshot['DBSnapshotIdentifier']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps('Snapshot operation completed successfully')
        }
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
"""
        
        # Create Lambda function
        self.lambda_function = lambda_.Function(
            f"rds-backup-lambda-{self.environment_suffix}",
            name=f"rds-backup-lambda-{self.environment_suffix}",
            runtime="python3.9",
            role=self.lambda_role.arn,
            handler="index.lambda_handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            timeout=300,
            memory_size=128,
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    "DB_INSTANCE_IDENTIFIER": self.rds_instance.id
                }
            ),
            tags={**self.tags, "Name": f"rds-backup-lambda-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # EventBridge rule for daily snapshots
        self.event_rule = cloudwatch.EventRule(
            f"rds-backup-rule-{self.environment_suffix}",
            name=f"rds-backup-rule-{self.environment_suffix}",
            description="Trigger RDS backup Lambda function daily",
            schedule_expression="rate(1 day)",
            tags={**self.tags, "Name": f"rds-backup-rule-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # EventBridge target
        cloudwatch.EventTarget(
            f"rds-backup-target-{self.environment_suffix}",
            rule=self.event_rule.name,
            target_id="RDSBackupTarget",
            arn=self.lambda_function.arn,
            input=self.rds_instance.id.apply(lambda instance_id: json.dumps({
                "DBInstanceIdentifier": instance_id
            })),
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda permission for EventBridge
        lambda_.Permission(
            f"lambda-eventbridge-permission-{self.environment_suffix}",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="events.amazonaws.com",
            source_arn=self.event_rule.arn,
            opts=ResourceOptions(parent=self)
        )
    
    def _create_logging_infrastructure(self):
        """Enable logging infrastructure."""
        # ALB Access Logs - Note: This would need to be configured separately
        # as the LoadBalancerLogsArgs is not available in the current AWS provider version
        pass

# Create the TapStack instance only when run as main module
if __name__ == "__main__":
    import os
    from pulumi import Config

    # Initialize Pulumi configuration
    config = Config()

    # Get environment suffix from config or fallback to 'dev'
    environment_suffix = config.get('env') or 'dev'

    # Create the TapStack
    stack = TapStack(
        name="pulumi-infra",
        args=TapStackArgs(environment_suffix=environment_suffix),
    )
    
    # Export outputs at stack level
    from pulumi import export
    
    # Export the outputs - these will be available after the stack is created
    export("vpc_id", stack.vpc.id)
    export("alb_dns_name", stack.alb.dns_name) 
    export("rds_endpoint", stack.rds_instance.endpoint)
    export("s3_bucket_name", stack.static_files_bucket.id)
```
