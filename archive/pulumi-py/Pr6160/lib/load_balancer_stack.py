"""
load_balancer_stack.py

Application Load Balancer with target groups, listeners, and security groups.
"""

from typing import List

import pulumi
from pulumi import Output, ResourceOptions
import pulumi_aws as aws


class LoadBalancerStack(pulumi.ComponentResource):
    """
    Load Balancer infrastructure component.

    Creates Application Load Balancer, target groups, listeners, and security groups.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        public_subnet_ids: List[Output[str]],
        log_bucket_name: Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:loadbalancer:LoadBalancerStack', name, None, opts)

        # Create security group for ALB
        self.alb_sg = aws.ec2.SecurityGroup(
            f'alb-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for ALB in {environment_suffix}',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow HTTP from internet',
                    from_port=80,
                    to_port=80,
                    protocol='tcp',
                    cidr_blocks=['0.0.0.0/0'],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow HTTPS from internet',
                    from_port=443,
                    to_port=443,
                    protocol='tcp',
                    cidr_blocks=['0.0.0.0/0'],
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
            tags={**tags, 'Name': f'alb-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f'alb-{environment_suffix}',
            name=f'alb-{environment_suffix}',
            internal=False,
            load_balancer_type='application',
            security_groups=[self.alb_sg.id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            access_logs=aws.lb.LoadBalancerAccessLogsArgs(
                bucket=log_bucket_name,
                enabled=True,
                prefix=f'alb-logs-{environment_suffix}'
            ),
            tags={**tags, 'Name': f'alb-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create target group
        self.target_group = aws.lb.TargetGroup(
            f'tg-{environment_suffix}',
            name=f'tg-{environment_suffix}',
            port=80,
            protocol='HTTP',
            vpc_id=vpc_id,
            target_type='instance',
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher='200',
                path='/',
                port='traffic-port',
                protocol='HTTP',
                timeout=5,
                unhealthy_threshold=2,
            ),
            deregistration_delay=30,
            tags={**tags, 'Name': f'tg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create HTTP listener
        self.listener = aws.lb.Listener(
            f'alb-listener-http-{environment_suffix}',
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol='HTTP',
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type='forward',
                    target_group_arn=self.target_group.arn,
                )
            ],
            tags={**tags, 'Name': f'alb-listener-http-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.alb_dns_name = self.alb.dns_name
        self.alb_zone_id = self.alb.zone_id
        self.alb_arn = self.alb.arn
        self.alb_arn_suffix = self.alb.arn_suffix
        self.alb_security_group_id = self.alb_sg.id
        self.target_group_arn = self.target_group.arn
        self.target_group_arn_suffix = self.target_group.arn_suffix

        self.register_outputs({
            'alb_dns_name': self.alb_dns_name,
            'alb_zone_id': self.alb_zone_id,
            'alb_arn': self.alb_arn,
            'alb_arn_suffix': self.alb_arn_suffix,
            'target_group_arn': self.target_group_arn,
            'target_group_arn_suffix': self.target_group_arn_suffix,
        })
