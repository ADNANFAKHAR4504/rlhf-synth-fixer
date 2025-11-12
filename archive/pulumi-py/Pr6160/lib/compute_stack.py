"""
compute_stack.py

Compute infrastructure with Auto Scaling Group, launch template, and IAM roles.
Instance types are environment-specific: t3.micro (dev), t3.small (staging), t3.medium (prod).
"""

from typing import List

import pulumi
from pulumi import Output, ResourceOptions
import pulumi_aws as aws


class ComputeStack(pulumi.ComponentResource):
    """
    Compute infrastructure component.

    Creates Auto Scaling Group with environment-appropriate instance types,
    launch template, IAM roles, and security groups.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        alb_security_group_id: Output[str],
        alb_target_group_arn: Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:compute:ComputeStack', name, None, opts)

        # Environment-specific instance types
        instance_types = {
            'dev': 't3.micro',
            'staging': 't3.small',
            'prod': 't3.medium'
        }
        instance_type = instance_types.get(environment_suffix, 't3.micro')

        # Environment-specific scaling configuration
        scaling_config = {
            'dev': {'min': 1, 'max': 2, 'desired': 1},
            'staging': {'min': 2, 'max': 4, 'desired': 2},
            'prod': {'min': 2, 'max': 6, 'desired': 2}
        }
        scaling = scaling_config.get(environment_suffix, scaling_config['dev'])

        # Create security group for instances
        self.instance_sg = aws.ec2.SecurityGroup(
            f'instance-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for EC2 instances in {environment_suffix}',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow HTTP from ALB',
                    from_port=80,
                    to_port=80,
                    protocol='tcp',
                    security_groups=[alb_security_group_id],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow HTTPS from ALB',
                    from_port=443,
                    to_port=443,
                    protocol='tcp',
                    security_groups=[alb_security_group_id],
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description='Allow all outbound traffic',
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                ),
            ],
            tags={**tags, 'Name': f'instance-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for EC2 instances
        self.instance_role = aws.iam.Role(
            f'instance-role-{environment_suffix}',
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={**tags, 'Name': f'instance-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Attach SSM policy for management
        aws.iam.RolePolicyAttachment(
            f'instance-role-ssm-{environment_suffix}',
            role=self.instance_role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
            opts=ResourceOptions(parent=self)
        )

        # Attach CloudWatch policy
        aws.iam.RolePolicyAttachment(
            f'instance-role-cloudwatch-{environment_suffix}',
            role=self.instance_role.name,
            policy_arn='arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
            opts=ResourceOptions(parent=self)
        )

        # Create instance profile
        self.instance_profile = aws.iam.InstanceProfile(
            f'instance-profile-{environment_suffix}',
            role=self.instance_role.name,
            tags={**tags, 'Name': f'instance-profile-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Get latest Amazon Linux 2023 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=['amazon'],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name='name',
                    values=['al2023-ami-*-x86_64']
                ),
                aws.ec2.GetAmiFilterArgs(
                    name='virtualization-type',
                    values=['hvm']
                ),
            ]
        )

        # User data script
        user_data = (
            f"#!/bin/bash\n"
            f"set -e\n"
            f"yum update -y\n"
            f"yum install -y httpd\n"
            f"systemctl start httpd\n"
            f"systemctl enable httpd\n"
            f'echo "<h1>Environment: {environment_suffix}</h1>" > '
            f'/var/www/html/index.html\n'
        )

        # Create launch template
        self.launch_template = aws.ec2.LaunchTemplate(
            f'launch-template-{environment_suffix}',
            name_prefix=f'lt-{environment_suffix}-',
            image_id=ami.id,
            instance_type=instance_type,
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile.arn
            ),
            vpc_security_group_ids=[self.instance_sg.id],
            user_data=pulumi.Output.secret(user_data).apply(
                lambda ud: __import__('base64').b64encode(ud.encode()).decode()
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='instance',
                    tags={**tags, 'Name': f'instance-{environment_suffix}'}
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='volume',
                    tags={**tags, 'Name': f'volume-{environment_suffix}'}
                ),
            ],
            tags={**tags, 'Name': f'launch-template-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f'asg-{environment_suffix}',
            name=f'asg-{environment_suffix}',
            min_size=scaling['min'],
            max_size=scaling['max'],
            desired_capacity=scaling['desired'],
            health_check_type='ELB',
            health_check_grace_period=300,
            vpc_zone_identifiers=private_subnet_ids,
            target_group_arns=[alb_target_group_arn],
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version='$Latest'
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=k,
                    value=v,
                    propagate_at_launch=True
                ) for k, v in {**tags, 'Name': f'asg-{environment_suffix}'}.items()
            ],
            opts=ResourceOptions(parent=self)
        )

        # Create scaling policy - target tracking based on CPU
        # pylint: disable=line-too-long
        predefined_metric = aws.autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
            predefined_metric_type='ASGAverageCPUUtilization'
        )
        aws.autoscaling.Policy(
            f'asg-policy-cpu-{environment_suffix}',
            autoscaling_group_name=self.asg.name,
            policy_type='TargetTrackingScaling',
            target_tracking_configuration=aws.autoscaling.PolicyTargetTrackingConfigurationArgs(
                predefined_metric_specification=predefined_metric,
                target_value=70.0
            ),
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.instance_security_group_id = self.instance_sg.id
        self.asg_name = self.asg.name
        self.asg_arn = self.asg.arn

        self.register_outputs({
            'instance_security_group_id': self.instance_security_group_id,
            'asg_name': self.asg_name,
            'asg_arn': self.asg_arn,
        })
