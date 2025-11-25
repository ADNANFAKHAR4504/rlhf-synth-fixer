# Blue-Green Deployment Infrastructure Implementation

I'll create a comprehensive Blue-Green deployment infrastructure using CDKTF with Python.

## Implementation Overview

The infrastructure includes:
1. VPC with public/private subnets across 2 AZs
2. Application Load Balancer with weighted routing
3. Blue and Green Auto Scaling Groups
4. RDS Aurora PostgreSQL Serverless v2
5. Security Groups and IAM roles
6. CloudWatch monitoring and SNS notifications
7. S3 bucket for artifacts
8. Secrets Manager for database credentials

## File Structure

```
lib/
├── __init__.py
├── tap_stack.py
├── network_stack.py
├── compute_stack.py
├── database_stack.py
└── monitoring_stack.py
```

## Implementation

### lib/__init__.py

```python
"""Blue-Green Deployment Infrastructure"""
```

### lib/tap_stack.py

```python
"""Main stack orchestrating Blue-Green deployment infrastructure"""
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from .network_stack import NetworkStack
from .compute_stack import ComputeStack
from .database_stack import DatabaseStack
from .monitoring_stack import MonitoringStack
import os


class TapStack(TerraformStack):
    """Main Terraform stack for Blue-Green deployment"""

    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # Get environment suffix
        self.environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        region = os.environ.get('AWS_REGION', 'us-east-1')

        # AWS Provider
        AwsProvider(self, 'aws',
            region=region,
            default_tags=[{
                'tags': {
                    'Environment': self.environment_suffix,
                    'ManagedBy': 'CDKTF',
                    'Project': 'BlueGreenDeployment'
                }
            }]
        )

        # Create network infrastructure
        network = NetworkStack(self, f'Network{self.environment_suffix}',
                             environment_suffix=self.environment_suffix)

        # Create database
        database = DatabaseStack(self, f'Database{self.environment_suffix}',
                                vpc_id=network.vpc_id,
                                private_subnet_ids=network.private_subnet_ids,
                                environment_suffix=self.environment_suffix)

        # Create compute resources (Blue-Green)
        compute = ComputeStack(self, f'Compute{self.environment_suffix}',
                             vpc_id=network.vpc_id,
                             public_subnet_ids=network.public_subnet_ids,
                             private_subnet_ids=network.private_subnet_ids,
                             database_endpoint=database.cluster_endpoint,
                             database_secret_arn=database.secret_arn,
                             environment_suffix=self.environment_suffix)

        # Create monitoring
        monitoring = MonitoringStack(self, f'Monitoring{self.environment_suffix}',
                                    alb_arn=compute.alb_arn,
                                    blue_asg_name=compute.blue_asg_name,
                                    green_asg_name=compute.green_asg_name,
                                    environment_suffix=self.environment_suffix)

        # Outputs
        TerraformOutput(self, 'alb_dns_name',
                       value=compute.alb_dns_name,
                       description='Application Load Balancer DNS name')

        TerraformOutput(self, 'blue_target_group_arn',
                       value=compute.blue_target_group_arn,
                       description='Blue environment target group ARN')

        TerraformOutput(self, 'green_target_group_arn',
                       value=compute.green_target_group_arn,
                       description='Green environment target group ARN')

        TerraformOutput(self, 'database_endpoint',
                       value=database.cluster_endpoint,
                       description='RDS Aurora cluster endpoint')

        TerraformOutput(self, 'database_secret_arn',
                       value=database.secret_arn,
                       description='Database credentials secret ARN')

        TerraformOutput(self, 'vpc_id',
                       value=network.vpc_id,
                       description='VPC ID')

        TerraformOutput(self, 'artifacts_bucket',
                       value=compute.artifacts_bucket_name,
                       description='S3 bucket for deployment artifacts')

        TerraformOutput(self, 'sns_topic_arn',
                       value=monitoring.sns_topic_arn,
                       description='SNS topic for notifications')
```

### lib/network_stack.py

```python
"""Network infrastructure for Blue-Green deployment"""
from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation


class NetworkStack(Construct):
    """Network stack with VPC, subnets, and gateways"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # VPC
        self.vpc = Vpc(self, 'vpc',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={'Name': f'bluegreen-vpc-{environment_suffix}'}
        )

        # Public Subnets
        self.public_subnet_1 = Subnet(self, 'public_subnet_1',
            vpc_id=self.vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone='us-east-1a',
            map_public_ip_on_launch=True,
            tags={'Name': f'bluegreen-public-1-{environment_suffix}'}
        )

        self.public_subnet_2 = Subnet(self, 'public_subnet_2',
            vpc_id=self.vpc.id,
            cidr_block='10.0.2.0/24',
            availability_zone='us-east-1b',
            map_public_ip_on_launch=True,
            tags={'Name': f'bluegreen-public-2-{environment_suffix}'}
        )

        # Private Subnets
        self.private_subnet_1 = Subnet(self, 'private_subnet_1',
            vpc_id=self.vpc.id,
            cidr_block='10.0.10.0/24',
            availability_zone='us-east-1a',
            tags={'Name': f'bluegreen-private-1-{environment_suffix}'}
        )

        self.private_subnet_2 = Subnet(self, 'private_subnet_2',
            vpc_id=self.vpc.id,
            cidr_block='10.0.11.0/24',
            availability_zone='us-east-1b',
            tags={'Name': f'bluegreen-private-2-{environment_suffix}'}
        )

        # Internet Gateway
        self.igw = InternetGateway(self, 'igw',
            vpc_id=self.vpc.id,
            tags={'Name': f'bluegreen-igw-{environment_suffix}'}
        )

        # EIP for NAT Gateway
        self.nat_eip = Eip(self, 'nat_eip',
            domain='vpc',
            tags={'Name': f'bluegreen-nat-eip-{environment_suffix}'}
        )

        # NAT Gateway
        self.nat_gateway = NatGateway(self, 'nat_gateway',
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={'Name': f'bluegreen-nat-{environment_suffix}'}
        )

        # Public Route Table
        self.public_rt = RouteTable(self, 'public_rt',
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block='0.0.0.0/0',
                gateway_id=self.igw.id
            )],
            tags={'Name': f'bluegreen-public-rt-{environment_suffix}'}
        )

        # Associate public subnets with public route table
        RouteTableAssociation(self, 'public_rta_1',
            subnet_id=self.public_subnet_1.id,
            route_table_id=self.public_rt.id
        )

        RouteTableAssociation(self, 'public_rta_2',
            subnet_id=self.public_subnet_2.id,
            route_table_id=self.public_rt.id
        )

        # Private Route Table
        self.private_rt = RouteTable(self, 'private_rt',
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block='0.0.0.0/0',
                nat_gateway_id=self.nat_gateway.id
            )],
            tags={'Name': f'bluegreen-private-rt-{environment_suffix}'}
        )

        # Associate private subnets with private route table
        RouteTableAssociation(self, 'private_rta_1',
            subnet_id=self.private_subnet_1.id,
            route_table_id=self.private_rt.id
        )

        RouteTableAssociation(self, 'private_rta_2',
            subnet_id=self.private_subnet_2.id,
            route_table_id=self.private_rt.id
        )

    @property
    def vpc_id(self):
        return self.vpc.id

    @property
    def public_subnet_ids(self):
        return [self.public_subnet_1.id, self.public_subnet_2.id]

    @property
    def private_subnet_ids(self):
        return [self.private_subnet_1.id, self.private_subnet_2.id]
```

### lib/compute_stack.py

```python
"""Compute resources for Blue-Green deployment"""
from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction, LbListenerDefaultActionForwardTargetGroup
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate, LaunchTemplateIamInstanceProfile
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import S3BucketServerSideEncryptionConfigurationA, S3BucketServerSideEncryptionConfigurationRuleA, S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
import base64


class ComputeStack(Construct):
    """Compute stack with ALB and Blue-Green ASGs"""

    def __init__(self, scope: Construct, id: str, vpc_id: str, public_subnet_ids: list,
                 private_subnet_ids: list, database_endpoint: str, database_secret_arn: str,
                 environment_suffix: str):
        super().__init__(scope, id)

        # S3 Bucket for artifacts
        self.artifacts_bucket = S3Bucket(self, 'artifacts_bucket',
            bucket=f'bluegreen-artifacts-{environment_suffix}',
            tags={'Name': f'bluegreen-artifacts-{environment_suffix}'}
        )

        # Enable versioning
        S3BucketVersioningA(self, 'bucket_versioning',
            bucket=self.artifacts_bucket.id,
            versioning_configuration={'status': 'Enabled'}
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(self, 'bucket_encryption',
            bucket=self.artifacts_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm='AES256'
                )
            )]
        )

        # ALB Security Group
        self.alb_sg = SecurityGroup(self, 'alb_sg',
            name=f'bluegreen-alb-sg-{environment_suffix}',
            description='Security group for Application Load Balancer',
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol='tcp',
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow HTTP from internet'
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol='tcp',
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow HTTPS from internet'
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound'
                )
            ],
            tags={'Name': f'bluegreen-alb-sg-{environment_suffix}'}
        )

        # EC2 Security Group
        self.ec2_sg = SecurityGroup(self, 'ec2_sg',
            name=f'bluegreen-ec2-sg-{environment_suffix}',
            description='Security group for EC2 instances',
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol='tcp',
                    security_groups=[self.alb_sg.id],
                    description='Allow HTTP from ALB'
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound'
                )
            ],
            tags={'Name': f'bluegreen-ec2-sg-{environment_suffix}'}
        )

        # Application Load Balancer
        self.alb = Lb(self, 'alb',
            name=f'bluegreen-alb-{environment_suffix}',
            internal=False,
            load_balancer_type='application',
            security_groups=[self.alb_sg.id],
            subnets=public_subnet_ids,
            tags={'Name': f'bluegreen-alb-{environment_suffix}'}
        )

        # Blue Target Group
        self.blue_tg = LbTargetGroup(self, 'blue_tg',
            name=f'bluegreen-blue-{environment_suffix}',
            port=80,
            protocol='HTTP',
            vpc_id=vpc_id,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path='/',
                protocol='HTTP'
            ),
            tags={'Name': f'bluegreen-blue-tg-{environment_suffix}'}
        )

        # Green Target Group
        self.green_tg = LbTargetGroup(self, 'green_tg',
            name=f'bluegreen-green-{environment_suffix}',
            port=80,
            protocol='HTTP',
            vpc_id=vpc_id,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path='/',
                protocol='HTTP'
            ),
            tags={'Name': f'bluegreen-green-tg-{environment_suffix}'}
        )

        # ALB Listener with weighted routing
        self.listener = LbListener(self, 'listener',
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol='HTTP',
            default_action=[
                LbListenerDefaultAction(
                    type='forward',
                    forward=LbListenerDefaultActionForwardTargetGroup(
                        target_group=[
                            {'arn': self.blue_tg.arn, 'weight': 100},
                            {'arn': self.green_tg.arn, 'weight': 0}
                        ]
                    )
                )
            ]
        )

        # IAM Role for EC2
        self.ec2_role = IamRole(self, 'ec2_role',
            name=f'bluegreen-ec2-role-{environment_suffix}',
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }""",
            tags={'Name': f'bluegreen-ec2-role-{environment_suffix}'}
        )

        # Attach policies
        IamRolePolicyAttachment(self, 'ssm_policy',
            role=self.ec2_role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
        )

        IamRolePolicyAttachment(self, 'secrets_policy',
            role=self.ec2_role.name,
            policy_arn='arn:aws:iam::aws:policy/SecretsManagerReadWrite'
        )

        IamRolePolicyAttachment(self, 's3_policy',
            role=self.ec2_role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
        )

        # Instance Profile
        self.instance_profile = IamInstanceProfile(self, 'instance_profile',
            name=f'bluegreen-instance-profile-{environment_suffix}',
            role=self.ec2_role.name
        )

        # Get latest Amazon Linux 2023 AMI
        self.ami = DataAwsAmi(self, 'amazon_linux',
            most_recent=True,
            owners=['amazon'],
            filter=[
                DataAwsAmiFilter(
                    name='name',
                    values=['al2023-ami-*-x86_64']
                ),
                DataAwsAmiFilter(
                    name='virtualization-type',
                    values=['hvm']
                )
            ]
        )

        # User data script
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Blue-Green Deployment - Environment: $ENVIRONMENT</h1>" > /var/www/html/index.html
"""

        # Blue Launch Template
        self.blue_lt = LaunchTemplate(self, 'blue_lt',
            name=f'bluegreen-blue-lt-{environment_suffix}',
            image_id=self.ami.id,
            instance_type='t3.micro',
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                arn=self.instance_profile.arn
            ),
            vpc_security_group_ids=[self.ec2_sg.id],
            user_data=base64.b64encode(user_data.replace('$ENVIRONMENT', 'BLUE').encode()).decode(),
            tags={'Name': f'bluegreen-blue-lt-{environment_suffix}'}
        )

        # Blue Auto Scaling Group
        self.blue_asg = AutoscalingGroup(self, 'blue_asg',
            name=f'bluegreen-blue-asg-{environment_suffix}',
            min_size=1,
            max_size=4,
            desired_capacity=2,
            vpc_zone_identifier=private_subnet_ids,
            target_group_arns=[self.blue_tg.arn],
            health_check_type='ELB',
            health_check_grace_period=300,
            launch_template={'id': self.blue_lt.id, 'version': '$Latest'},
            tag=[{
                'key': 'Name',
                'value': f'bluegreen-blue-{environment_suffix}',
                'propagate_at_launch': True
            }]
        )

        # Green Launch Template
        self.green_lt = LaunchTemplate(self, 'green_lt',
            name=f'bluegreen-green-lt-{environment_suffix}',
            image_id=self.ami.id,
            instance_type='t3.micro',
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                arn=self.instance_profile.arn
            ),
            vpc_security_group_ids=[self.ec2_sg.id],
            user_data=base64.b64encode(user_data.replace('$ENVIRONMENT', 'GREEN').encode()).decode(),
            tags={'Name': f'bluegreen-green-lt-{environment_suffix}'}
        )

        # Green Auto Scaling Group
        self.green_asg = AutoscalingGroup(self, 'green_asg',
            name=f'bluegreen-green-asg-{environment_suffix}',
            min_size=1,
            max_size=4,
            desired_capacity=2,
            vpc_zone_identifier=private_subnet_ids,
            target_group_arns=[self.green_tg.arn],
            health_check_type='ELB',
            health_check_grace_period=300,
            launch_template={'id': self.green_lt.id, 'version': '$Latest'},
            tag=[{
                'key': 'Name',
                'value': f'bluegreen-green-{environment_suffix}',
                'propagate_at_launch': True
            }]
        )

    @property
    def alb_arn(self):
        return self.alb.arn

    @property
    def alb_dns_name(self):
        return self.alb.dns_name

    @property
    def blue_target_group_arn(self):
        return self.blue_tg.arn

    @property
    def green_target_group_arn(self):
        return self.green_tg.arn

    @property
    def blue_asg_name(self):
        return self.blue_asg.name

    @property
    def green_asg_name(self):
        return self.green_asg.name

    @property
    def artifacts_bucket_name(self):
        return self.artifacts_bucket.id
```

### lib/database_stack.py

```python
"""Database infrastructure for Blue-Green deployment"""
from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
import json
import random
import string


class DatabaseStack(Construct):
    """Database stack with Aurora PostgreSQL Serverless v2"""

    def __init__(self, scope: Construct, id: str, vpc_id: str, private_subnet_ids: list,
                 environment_suffix: str):
        super().__init__(scope, id)

        # Generate random password
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))

        # Database Security Group
        self.db_sg = SecurityGroup(self, 'db_sg',
            name=f'bluegreen-db-sg-{environment_suffix}',
            description='Security group for RDS Aurora cluster',
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol='tcp',
                    cidr_blocks=['10.0.0.0/16'],
                    description='Allow PostgreSQL from VPC'
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound'
                )
            ],
            tags={'Name': f'bluegreen-db-sg-{environment_suffix}'}
        )

        # DB Subnet Group
        self.db_subnet_group = DbSubnetGroup(self, 'db_subnet_group',
            name=f'bluegreen-db-subnet-{environment_suffix}',
            subnet_ids=private_subnet_ids,
            tags={'Name': f'bluegreen-db-subnet-{environment_suffix}'}
        )

        # Secrets Manager for DB credentials
        self.db_secret = SecretsmanagerSecret(self, 'db_secret',
            name=f'bluegreen-db-credentials-{environment_suffix}',
            description='Database credentials for Blue-Green deployment',
            tags={'Name': f'bluegreen-db-credentials-{environment_suffix}'}
        )

        secret_value = {
            'username': 'dbadmin',
            'password': password,
            'engine': 'postgres',
            'host': '',  # Will be updated after cluster creation
            'port': 5432,
            'dbname': 'appdb'
        }

        SecretsmanagerSecretVersion(self, 'db_secret_version',
            secret_id=self.db_secret.id,
            secret_string=json.dumps(secret_value)
        )

        # RDS Aurora Cluster
        self.rds_cluster = RdsCluster(self, 'rds_cluster',
            cluster_identifier=f'bluegreen-cluster-{environment_suffix}',
            engine='aurora-postgresql',
            engine_mode='provisioned',
            engine_version='15',
            database_name='appdb',
            master_username='dbadmin',
            master_password=password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_sg.id],
            serverlessv2_scaling_configuration={
                'min_capacity': 0.5,
                'max_capacity': 1.0
            },
            skip_final_snapshot=True,
            tags={'Name': f'bluegreen-cluster-{environment_suffix}'}
        )

        # Cluster Instance
        RdsClusterInstance(self, 'rds_instance',
            identifier=f'bluegreen-instance-{environment_suffix}',
            cluster_identifier=self.rds_cluster.id,
            instance_class='db.serverless',
            engine='aurora-postgresql',
            engine_version='15',
            tags={'Name': f'bluegreen-instance-{environment_suffix}'}
        )

    @property
    def cluster_endpoint(self):
        return self.rds_cluster.endpoint

    @property
    def secret_arn(self):
        return self.db_secret.arn
```

### lib/monitoring_stack.py

```python
"""Monitoring and alerting for Blue-Green deployment"""
from constructs import Construct
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class MonitoringStack(Construct):
    """Monitoring stack with CloudWatch alarms and SNS"""

    def __init__(self, scope: Construct, id: str, alb_arn: str, blue_asg_name: str,
                 green_asg_name: str, environment_suffix: str):
        super().__init__(scope, id)

        # SNS Topic for alerts
        self.sns_topic = SnsTopic(self, 'sns_topic',
            name=f'bluegreen-alerts-{environment_suffix}',
            tags={'Name': f'bluegreen-alerts-{environment_suffix}'}
        )

        # ALB Target 5XX Alarm
        CloudwatchMetricAlarm(self, 'alb_5xx_alarm',
            alarm_name=f'bluegreen-alb-5xx-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='HTTPCode_Target_5XX_Count',
            namespace='AWS/ApplicationELB',
            period=60,
            statistic='Sum',
            threshold=10,
            alarm_description='Alert when ALB 5XX errors exceed threshold',
            alarm_actions=[self.sns_topic.arn],
            dimensions={'LoadBalancer': alb_arn.split(':loadbalancer/')[1]},
            tags={'Name': f'bluegreen-alb-5xx-alarm-{environment_suffix}'}
        )

        # Blue ASG Unhealthy Hosts Alarm
        CloudwatchMetricAlarm(self, 'blue_unhealthy_alarm',
            alarm_name=f'bluegreen-blue-unhealthy-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='UnHealthyHostCount',
            namespace='AWS/ApplicationELB',
            period=60,
            statistic='Average',
            threshold=0,
            alarm_description='Alert when Blue environment has unhealthy hosts',
            alarm_actions=[self.sns_topic.arn],
            tags={'Name': f'bluegreen-blue-unhealthy-alarm-{environment_suffix}'}
        )

        # Green ASG Unhealthy Hosts Alarm
        CloudwatchMetricAlarm(self, 'green_unhealthy_alarm',
            alarm_name=f'bluegreen-green-unhealthy-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='UnHealthyHostCount',
            namespace='AWS/ApplicationELB',
            period=60,
            statistic='Average',
            threshold=0,
            alarm_description='Alert when Green environment has unhealthy hosts',
            alarm_actions=[self.sns_topic.arn],
            tags={'Name': f'bluegreen-green-unhealthy-alarm-{environment_suffix}'}
        )

    @property
    def sns_topic_arn(self):
        return self.sns_topic.arn
```

## Deployment Instructions

1. Install dependencies:
```bash
pipenv install
```

2. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX="synthc2r9s6m4"
export AWS_REGION="us-east-1"
```

3. Deploy:
```bash
cdktf deploy
```

4. To switch traffic from Blue to Green, update the listener weights in the ALB configuration and redeploy.

## Testing

The infrastructure can be tested by:
1. Accessing the ALB DNS name
2. Verifying both Blue and Green environments are healthy
3. Testing database connectivity from EC2 instances
4. Simulating traffic switching
5. Monitoring CloudWatch metrics and alarms
