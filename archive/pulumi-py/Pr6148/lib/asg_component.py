import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class AsgComponent(ComponentResource):
    """
    Auto Scaling Group component with LC and environment-specific capacity
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: list,
        target_group_arn: Output[str],
        min_size: int,
        max_size: int,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:compute:AsgComponent", name, None, opts)

        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"],
                ),
                aws.ec2.GetAmiFilterArgs(
                    name="state",
                    values=["available"],
                ),
            ],
        )

        # Create EC2 security group
        self.ec2_sg = aws.ec2.SecurityGroup(
            f"ec2-sg-{environment_suffix}",
            vpc_id=vpc_id,
            description="Security group for EC2 instances",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["10.0.0.0/16"],
                    description="Allow HTTP from VPC",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"ec2-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create IAM role for EC2
        self.role = aws.iam.Role(
            f"ec2-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={**tags, "Name": f"ec2-role-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Attach policies
        aws.iam.RolePolicyAttachment(
            f"ec2-ssm-policy-{environment_suffix}",
            role=self.role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=self),
        )

        aws.iam.RolePolicyAttachment(
            f"ec2-cloudwatch-policy-{environment_suffix}",
            role=self.role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=ResourceOptions(parent=self),
        )

        # Create instance profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"ec2-profile-{environment_suffix}",
            role=self.role.name,
            opts=ResourceOptions(parent=self),
        )

        # User data script
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
mkdir -p /var/www/html/health
echo "OK" > /var/www/html/health/index.html
"""

        # Create Launch Template
        self.launch_template = aws.ec2.LaunchTemplate(
            f"lt-{environment_suffix}",
            image_id=ami.id,
            instance_type="t3.micro",
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile.arn,
            ),
            vpc_security_group_ids=[self.ec2_sg.id],
            user_data=pulumi.Output.secret(user_data).apply(
                lambda s: __import__("base64").b64encode(s.encode()).decode()
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={**tags, "Name": f"instance-{environment_suffix}"},
                ),
            ],
            opts=ResourceOptions(parent=self),
        )

        # Create Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f"asg-{environment_suffix}",
            min_size=min_size,
            max_size=max_size,
            desired_capacity=min_size,
            vpc_zone_identifiers=private_subnet_ids,
            target_group_arns=[target_group_arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest",
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=k,
                    value=v,
                    propagate_at_launch=True,
                )
                for k, v in {**tags, "Name": f"asg-{environment_suffix}"}.items()
            ],
            opts=ResourceOptions(parent=self),
        )

        # Create CloudWatch alarm for high CPU
        self.cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"cpu-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Trigger when CPU exceeds 80%",
            dimensions={"AutoScalingGroupName": self.asg.name},
            tags={**tags, "Name": f"cpu-alarm-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Export properties
        self.asg_name = self.asg.name
        self.ec2_security_group_id = self.ec2_sg.id

        self.register_outputs(
            {
                "asg_name": self.asg_name,
                "ec2_security_group_id": self.ec2_security_group_id,
            }
        )
