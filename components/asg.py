"""
ASG Component - Creates Auto Scaling Group with Launch Configuration
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class AsgComponent(ComponentResource):
    """
    Reusable ASG component with launch template and EC2 instances
    """

    def __init__(
        self,
        name: str,
        vpc_id: pulumi.Output,
        subnet_ids: list,
        target_group_arn: pulumi.Output,
        environment: str,
        environment_suffix: str,
        instance_type: str,
        ami_id: str,
        min_size: int,
        max_size: int,
        desired_capacity: int,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:asg:AsgComponent", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Create security group for instances
        self.instance_sg = aws.ec2.SecurityGroup(
            f"instance-sg-{environment}-{environment_suffix}",
            vpc_id=vpc_id,
            description=f"Security group for instances in {environment}",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow SSH from anywhere",
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
            tags={**tags, "Name": f"instance-sg-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # User data script to set up web server
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
"""

        # Create launch template
        self.launch_template = aws.ec2.LaunchTemplate(
            f"lt-{environment}-{environment_suffix}",
            image_id=ami_id,
            instance_type=instance_type,
            vpc_security_group_ids=[self.instance_sg.id],
            user_data=pulumi.Output.secret(user_data).apply(
                lambda data: __import__("base64").b64encode(data.encode()).decode()
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={
                        **tags,
                        "Name": f"instance-{environment}-{environment_suffix}",
                    },
                )
            ],
            opts=child_opts,
        )

        # Create Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f"asg-{environment}-{environment_suffix}",
            vpc_zone_identifiers=subnet_ids,
            target_group_arns=[target_group_arn],
            min_size=min_size,
            max_size=max_size,
            desired_capacity=desired_capacity,
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest",
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"asg-{environment}-{environment_suffix}",
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Environment",
                    value=environment,
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="ManagedBy",
                    value="Pulumi",
                    propagate_at_launch=True,
                ),
            ],
            opts=child_opts,
        )

        # Register outputs
        self.asg_name = self.asg.name
        self.asg_arn = self.asg.arn
        self.security_group_id = self.instance_sg.id

        self.register_outputs(
            {
                "asg_name": self.asg_name,
                "asg_arn": self.asg_arn,
                "security_group_id": self.security_group_id,
            }
        )
