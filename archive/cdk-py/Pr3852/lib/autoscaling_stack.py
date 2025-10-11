from aws_cdk import (
    aws_ec2 as ec2,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    NestedStack,
    Duration,
)
from constructs import Construct


class AutoScalingStack(NestedStack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        target_group: elbv2.ApplicationTargetGroup,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # User data script
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Marketplace Platform</h1>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health",
        )

        # Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self,
            "MarketplaceASG",
            vpc=vpc,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.LARGE
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            security_group=security_group,
            min_capacity=4,
            max_capacity=10,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            user_data=user_data,
        )

        # Attach to target group
        self.asg.attach_to_application_target_group(target_group)

        # Scaling policies
        self.asg.scale_on_cpu_utilization("CPUScaling", target_utilization_percent=70)
