# lib/components/load_balancer.py

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class LoadBalancerInfrastructure(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    vpc_id: pulumi.Input[str],
    public_subnet_ids: pulumi.Input[List[str]],
    tags: dict,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('aws:components:LoadBalancerInfrastructure', name, None, opts)

    self.tags = tags

    # Create Load Balancer Security Group
    self.lb_security_group = aws.ec2.SecurityGroup(
      f"{name}-lb-sg",
      name=f"{name}-lb-sg",
      description="Security group for Application Load Balancer",
      vpc_id=vpc_id,
      ingress=[
        {
          "protocol": "tcp",
          "from_port": 80,
          "to_port": 80,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "HTTP from internet"
        },
        {
          "protocol": "tcp",
          "from_port": 443,
          "to_port": 443,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "HTTPS from internet"
        }
      ],
      egress=[
        {
          "protocol": "-1",
          "from_port": 0,
          "to_port": 0,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "All outbound traffic"
        }
      ],
      tags={
        **tags,
        "Name": f"{name}-lb-sg"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create Application Load Balancer
    self.load_balancer = aws.lb.LoadBalancer(
      f"{name}-alb",
      name=f"{name}-alb",
      load_balancer_type="application",
      subnets=public_subnet_ids,
      security_groups=[self.lb_security_group.id],
      enable_deletion_protection=False,
      tags={
        **tags,
        "Name": f"{name}-alb"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create Target Group
    self.target_group = aws.lb.TargetGroup(
      f"{name}-tg",
      name=f"{name}-tg",
      port=80,
      protocol="HTTP",
      vpc_id=vpc_id,
      target_type="instance",
      health_check={
        "enabled": True,
        "healthy_threshold": 2,
        "unhealthy_threshold": 2,
        "timeout": 5,
        "interval": 30,
        "path": "/",
        "matcher": "200",
        "port": "traffic-port",
        "protocol": "HTTP"
      },
      tags={
        **tags,
        "Name": f"{name}-tg"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create Load Balancer Listener
    self.lb_listener = aws.lb.Listener(
      f"{name}-listener",
      load_balancer_arn=self.load_balancer.arn,
      port=80,
      protocol="HTTP",
      default_actions=[{
        "type": "forward",
        "target_group_arn": self.target_group.arn
      }],
      tags={
        **tags,
        "Name": f"{name}-listener"
      },
      opts=ResourceOptions(parent=self)
    )

    # Register outputs
    self.register_outputs({
      "load_balancer_arn": self.load_balancer.arn,
      "load_balancer_dns": self.load_balancer.dns_name,
      "load_balancer_zone_id": self.load_balancer.zone_id,
      "target_group_arn": self.target_group.arn,
      "lb_security_group_id": self.lb_security_group.id
    })