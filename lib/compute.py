from constructs import Construct
from cdktf import Fn
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate, LaunchTemplateIamInstanceProfile
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter


class ComputeConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_public_subnet_ids: list,
        secondary_public_subnet_ids: list,
        primary_private_subnet_ids: list,
        secondary_private_subnet_ids: list,
        primary_db_endpoint: str,
        secondary_db_endpoint: str,
        primary_app_security_group_id: str,
        primary_alb_security_group_id: str,
        secondary_app_security_group_id: str,
        secondary_alb_security_group_id: str,
        primary_vpc_id: str,
        secondary_vpc_id: str
    ):
        super().__init__(scope, construct_id)

        # Lookup latest Amazon Linux 2023 AMI for primary region
        primary_ami = DataAwsAmi(
            self,
            "primary-ami",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["al2023-ami-2023.*-x86_64"]
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"]
                ),
                DataAwsAmiFilter(
                    name="architecture",
                    values=["x86_64"]
                )
            ],
            provider=primary_provider
        )

        # Lookup latest Amazon Linux 2023 AMI for secondary region
        secondary_ami = DataAwsAmi(
            self,
            "secondary-ami",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["al2023-ami-2023.*-x86_64"]
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"]
                ),
                DataAwsAmiFilter(
                    name="architecture",
                    values=["x86_64"]
                )
            ],
            provider=secondary_provider
        )

        # IAM role for EC2 instances - Primary
        primary_instance_role = IamRole(
            self,
            "primary-instance-role",
            name=f"primary-instance-role-{environment_suffix}",
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"primary-instance-role-{environment_suffix}"},
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "primary-ssm-policy",
            role=primary_instance_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "primary-cloudwatch-policy",
            role=primary_instance_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            provider=primary_provider
        )

        primary_instance_profile = IamInstanceProfile(
            self,
            "primary-instance-profile",
            name=f"primary-instance-profile-{environment_suffix}",
            role=primary_instance_role.name,
            provider=primary_provider
        )

        # User data for primary instances
        primary_user_data = Fn.base64encode(f"""#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
docker run -d -p 8080:8080 \
  -e DB_ENDPOINT={primary_db_endpoint} \
  -e REGION=us-east-1 \
  --name trading-app \
  nginx:latest
""")

        # Launch template - Primary
        primary_launch_template = LaunchTemplate(
            self,
            "primary-launch-template",
            name=f"primary-lt-{environment_suffix}",
            image_id=primary_ami.id,
            instance_type="t3.medium",
            user_data=primary_user_data,
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                arn=primary_instance_profile.arn
            ),
            vpc_security_group_ids=[primary_app_security_group_id],
            tags={"Name": f"primary-lt-{environment_suffix}"},
            provider=primary_provider
        )

        # ALB - Primary
        self.primary_alb = Lb(
            self,
            "primary-alb",
            name=f"primary-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[primary_alb_security_group_id],
            subnets=primary_public_subnet_ids,
            enable_deletion_protection=False,
            tags={"Name": f"primary-alb-{environment_suffix}"},
            provider=primary_provider
        )

        # Target group - Primary
        primary_target_group = LbTargetGroup(
            self,
            "primary-tg",
            name=f"primary-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=primary_vpc_id,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2
            ),
            tags={"Name": f"primary-tg-{environment_suffix}"},
            provider=primary_provider
        )

        # Listener - Primary
        LbListener(
            self,
            "primary-listener",
            load_balancer_arn=self.primary_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=primary_target_group.arn
            )],
            provider=primary_provider
        )

        # Auto Scaling Group - Primary
        self.primary_asg = AutoscalingGroup(
            self,
            "primary-asg",
            name=f"primary-asg-{environment_suffix}",
            vpc_zone_identifier=primary_private_subnet_ids,
            min_size=2,
            max_size=6,
            desired_capacity=2,
            health_check_type="ELB",
            health_check_grace_period=300,
            target_group_arns=[primary_target_group.arn],
            launch_template={"id": primary_launch_template.id, "version": "$Latest"},
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"primary-asg-{environment_suffix}",
                    propagate_at_launch=True
                )
            ],
            provider=primary_provider
        )

        # IAM role for EC2 instances - Secondary
        secondary_instance_role = IamRole(
            self,
            "secondary-instance-role",
            name=f"secondary-instance-role-{environment_suffix}",
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"secondary-instance-role-{environment_suffix}"},
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "secondary-ssm-policy",
            role=secondary_instance_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "secondary-cloudwatch-policy",
            role=secondary_instance_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            provider=secondary_provider
        )

        secondary_instance_profile = IamInstanceProfile(
            self,
            "secondary-instance-profile",
            name=f"secondary-instance-profile-{environment_suffix}",
            role=secondary_instance_role.name,
            provider=secondary_provider
        )

        # User data for secondary instances
        secondary_user_data = Fn.base64encode(f"""#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
docker run -d -p 8080:8080 \
  -e DB_ENDPOINT={secondary_db_endpoint} \
  -e REGION=us-east-2 \
  --name trading-app \
  nginx:latest
""")

        # Launch template - Secondary
        secondary_launch_template = LaunchTemplate(
            self,
            "secondary-launch-template",
            name=f"secondary-lt-{environment_suffix}",
            image_id=secondary_ami.id,
            instance_type="t3.medium",
            user_data=secondary_user_data,
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                arn=secondary_instance_profile.arn
            ),
            vpc_security_group_ids=[secondary_app_security_group_id],
            tags={"Name": f"secondary-lt-{environment_suffix}"},
            provider=secondary_provider
        )

        # ALB - Secondary
        self.secondary_alb = Lb(
            self,
            "secondary-alb",
            name=f"secondary-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[secondary_alb_security_group_id],
            subnets=secondary_public_subnet_ids,
            enable_deletion_protection=False,
            tags={"Name": f"secondary-alb-{environment_suffix}"},
            provider=secondary_provider
        )

        # Target group - Secondary
        secondary_target_group = LbTargetGroup(
            self,
            "secondary-tg",
            name=f"secondary-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=secondary_vpc_id,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2
            ),
            tags={"Name": f"secondary-tg-{environment_suffix}"},
            provider=secondary_provider
        )

        # Listener - Secondary
        LbListener(
            self,
            "secondary-listener",
            load_balancer_arn=self.secondary_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=secondary_target_group.arn
            )],
            provider=secondary_provider
        )

        # Auto Scaling Group - Secondary
        self.secondary_asg = AutoscalingGroup(
            self,
            "secondary-asg",
            name=f"secondary-asg-{environment_suffix}",
            vpc_zone_identifier=secondary_private_subnet_ids,
            min_size=2,
            max_size=6,
            desired_capacity=2,
            health_check_type="ELB",
            health_check_grace_period=300,
            target_group_arns=[secondary_target_group.arn],
            launch_template={"id": secondary_launch_template.id, "version": "$Latest"},
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"secondary-asg-{environment_suffix}",
                    propagate_at_launch=True
                )
            ],
            provider=secondary_provider
        )

    @property
    def primary_alb_dns(self):
        return self.primary_alb.dns_name

    @property
    def secondary_alb_dns(self):
        return self.secondary_alb.dns_name

    @property
    def primary_alb_zone_id(self):
        return self.primary_alb.zone_id

    @property
    def secondary_alb_zone_id(self):
        return self.secondary_alb.zone_id

    @property
    def primary_alb_arn_suffix(self):
        return self.primary_alb.arn_suffix

    @property
    def secondary_alb_arn_suffix(self):
        return self.secondary_alb.arn_suffix

    @property
    def primary_alb_full_arn(self):
        return self.primary_alb.arn

    @property
    def secondary_alb_full_arn(self):
        return self.secondary_alb.arn

    @property
    def primary_asg_name(self):
        return self.primary_asg.name

    @property
    def secondary_asg_name(self):
        return self.secondary_asg.name
