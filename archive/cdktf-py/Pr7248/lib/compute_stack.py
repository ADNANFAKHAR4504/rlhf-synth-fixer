"""Compute resources for Blue-Green deployment"""
from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import (
    LbListener,
    LbListenerDefaultAction
)
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate, LaunchTemplateIamInstanceProfile
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from . import create_allow_all_egress_rule
import base64


class ComputeStack(Construct):
    """Compute stack with ALB and Blue-Green ASGs"""

    # pylint: disable=redefined-builtin,too-many-arguments,too-many-locals,too-many-statements
    def __init__(self, scope: Construct, id: str, vpc_id: str, public_subnet_ids: list,
                 private_subnet_ids: list, database_endpoint: str, database_secret_arn: str,
                 environment_suffix: str):
        super().__init__(scope, id)

        # S3 Bucket for artifacts
        self.artifacts_bucket = S3Bucket(self, 'artifacts_bucket',
            bucket=f'bluegreen-artifacts-v1-{environment_suffix}',
            tags={'Name': f'bluegreen-artifacts-v1-{environment_suffix}'}
        )

        # Enable versioning
        S3BucketVersioningA(self, 'bucket_versioning',
            bucket=self.artifacts_bucket.id,
            versioning_configuration={'status': 'Enabled'}
        )

        # Enable encryption
        encryption_default = S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
            sse_algorithm='AES256'
        )
        encryption_rule = S3BucketServerSideEncryptionConfigurationRuleA(
            apply_server_side_encryption_by_default=encryption_default
        )
        S3BucketServerSideEncryptionConfigurationA(
            self, 'bucket_encryption',
            bucket=self.artifacts_bucket.id,
            rule=[encryption_rule]
        )

        # ALB Security Group
        self.alb_sg = SecurityGroup(self, 'alb_sg',
            name=f'bluegreen-alb-sg-v1-{environment_suffix}',
            description='Security group for Application Load Balancer v1',
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
            egress=[create_allow_all_egress_rule()],
            tags={'Name': f'bluegreen-alb-sg-v1-{environment_suffix}'}
        )

        # EC2 Security Group
        self.ec2_sg = SecurityGroup(self, 'ec2_sg',
            name=f'bluegreen-ec2-sg-v1-{environment_suffix}',
            description='Security group for EC2 instances v1',
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
            egress=[create_allow_all_egress_rule()],
            tags={'Name': f'bluegreen-ec2-sg-v1-{environment_suffix}'}
        )

        # Application Load Balancer
        self.alb = Lb(self, 'alb',
            name=f'bluegreen-alb-v1-{environment_suffix}',
            internal=False,
            load_balancer_type='application',
            security_groups=[self.alb_sg.id],
            subnets=public_subnet_ids,
            tags={'Name': f'bluegreen-alb-v1-{environment_suffix}'}
        )

        # Blue Target Group
        self.blue_tg = LbTargetGroup(self, 'blue_tg',
            name=f'bluegreen-blue-v1-{environment_suffix}',
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
            tags={'Name': f'bluegreen-blue-tg-v1-{environment_suffix}'}
        )

        # Green Target Group
        self.green_tg = LbTargetGroup(self, 'green_tg',
            name=f'bluegreen-green-v1-{environment_suffix}',
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
            tags={'Name': f'bluegreen-green-tg-v1-{environment_suffix}'}
        )

        # ALB Listener - initially forward all traffic to blue
        self.listener = LbListener(self, 'listener',
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol='HTTP',
            default_action=[
                LbListenerDefaultAction(
                    type='forward',
                    target_group_arn=self.blue_tg.arn
                )
            ]
        )

        # IAM Role for EC2
        self.ec2_role = IamRole(self, 'ec2_role',
            name=f'bluegreen-ec2-role-v1-{environment_suffix}',
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
            tags={'Name': f'bluegreen-ec2-role-v1-{environment_suffix}'}
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
            name=f'bluegreen-instance-profile-v1-{environment_suffix}',
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
            name=f'bluegreen-blue-lt-v1-{environment_suffix}',
            image_id=self.ami.id,
            instance_type='t3.micro',
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                arn=self.instance_profile.arn
            ),
            vpc_security_group_ids=[self.ec2_sg.id],
            user_data=base64.b64encode(user_data.replace('$ENVIRONMENT', 'BLUE').encode()).decode(),
            tags={'Name': f'bluegreen-blue-lt-v1-{environment_suffix}'}
        )

        # Blue Auto Scaling Group
        self.blue_asg = AutoscalingGroup(self, 'blue_asg',
            name=f'bluegreen-blue-asg-v1-{environment_suffix}',
            min_size=1,
            max_size=4,
            desired_capacity=2,
            vpc_zone_identifier=private_subnet_ids,
            target_group_arns=[self.blue_tg.arn],
            health_check_type='ELB',
            health_check_grace_period=300,
            launch_template={'id': self.blue_lt.id, 'version': '$Latest'},
            tag=[AutoscalingGroupTag(
                key='Name',
                value=f'bluegreen-blue-v1-{environment_suffix}',
                propagate_at_launch=True
            )]
        )

        # Green Launch Template
        self.green_lt = LaunchTemplate(self, 'green_lt',
            name=f'bluegreen-green-lt-v1-{environment_suffix}',
            image_id=self.ami.id,
            instance_type='t3.micro',
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                arn=self.instance_profile.arn
            ),
            vpc_security_group_ids=[self.ec2_sg.id],
            user_data=base64.b64encode(user_data.replace('$ENVIRONMENT', 'GREEN').encode()).decode(),
            tags={'Name': f'bluegreen-green-lt-v1-{environment_suffix}'}
        )

        # Green Auto Scaling Group
        self.green_asg = AutoscalingGroup(self, 'green_asg',
            name=f'bluegreen-green-asg-v1-{environment_suffix}',
            min_size=1,
            max_size=4,
            desired_capacity=2,
            vpc_zone_identifier=private_subnet_ids,
            target_group_arns=[self.green_tg.arn],
            health_check_type='ELB',
            health_check_grace_period=300,
            launch_template={'id': self.green_lt.id, 'version': '$Latest'},
            tag=[AutoscalingGroupTag(
                key='Name',
                value=f'bluegreen-green-v1-{environment_suffix}',
                propagate_at_launch=True
            )]
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
