import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class AutoScalingStack:
    """Auto Scaling Group with Application Load Balancer and health checks."""
    
    def __init__(self, config: WebAppConfig, provider: aws.Provider,
                 launch_template_id: pulumi.Output[str], security_group_id: pulumi.Output[str]):
        self.config = config
        self.provider = provider
        self.launch_template_id = launch_template_id
        self.security_group_id = security_group_id
        self.vpc = self._get_default_vpc()
        self.subnets = self._get_subnets()
        self.load_balancer = self._create_load_balancer()
        self.target_group = self._create_target_group()
        self.load_balancer_listener = self._create_load_balancer_listener()
        self.auto_scaling_group = self._create_auto_scaling_group()
    
    def _get_default_vpc(self) -> pulumi.Output[str]:
        """Get default VPC ID."""
        return aws.ec2.get_vpc(
            default=True,
            opts=pulumi.InvokeOptions(provider=self.provider)
        ).id
    
    def _get_subnets(self) -> pulumi.Output[list]:
        """Get subnets from default VPC."""
        return pulumi.Output.all(self.vpc).apply(
            lambda args: aws.ec2.get_subnets(
                filters=[
                    aws.ec2.GetSubnetsFilterArgs(
                        name="vpc-id",
                        values=[args[0]]
                    )
                ],
                opts=pulumi.InvokeOptions(provider=self.provider)
            ).ids
        )
    
    def _create_load_balancer(self) -> aws.lb.LoadBalancer:
        """Create Application Load Balancer."""
        return aws.lb.LoadBalancer(
            "webapp-alb",
            name=self.config.lb_name,
            load_balancer_type="application",
            security_groups=[self.security_group_id],
            subnets=self.subnets,
            enable_deletion_protection=False,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_target_group(self) -> aws.lb.TargetGroup:
        """Create target group for load balancer."""
        return aws.lb.TargetGroup(
            "webapp-tg",
            name=self.config.target_group_name,
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc,
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
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_load_balancer_listener(self) -> aws.lb.Listener:
        """Create load balancer listener."""
        return aws.lb.Listener(
            "webapp-alb-listener",
            load_balancer_arn=self.load_balancer.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.target_group.arn
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """Create Auto Scaling Group."""
        return aws.autoscaling.Group(
            "webapp-asg",
            name=self.config.asg_name,
            vpc_zone_identifiers=self.subnets,
            target_group_arns=[self.target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=self.config.min_size,
            max_size=self.config.max_size,
            desired_capacity=self.config.desired_capacity,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template_id,
                version="$Latest"
            ),
            tags=[aws.autoscaling.GroupTagArgs(
                key="Name",
                value=self.config.get_tag_name("asg-instance"),
                propagate_at_launch=True
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def get_load_balancer_dns_name(self) -> pulumi.Output[str]:
        """Get load balancer DNS name."""
        return self.load_balancer.dns_name
    
    def get_load_balancer_arn(self) -> pulumi.Output[str]:
        """Get load balancer ARN."""
        return self.load_balancer.arn
    
    def get_target_group_arn(self) -> pulumi.Output[str]:
        """Get target group ARN."""
        return self.target_group.arn
    
    def get_auto_scaling_group_name(self) -> pulumi.Output[str]:
        """Get Auto Scaling Group name."""
        return self.auto_scaling_group.name
