"""
Load Balancer infrastructure module.

This module creates Application Load Balancer, target groups,
and listeners for highly-available traffic distribution.
"""
from typing import List

import pulumi
import pulumi_aws as aws
from pulumi import CustomTimeouts, Output, ResourceOptions

from .config import InfraConfig


class LoadBalancerStack:
    """
    Creates and manages Application Load Balancer and related resources.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        vpc_id: Output[str],
        public_subnet_ids: Output[List[str]],
        security_group_id: Output[str],
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the load balancer stack.
        
        Args:
            config: Infrastructure configuration
            vpc_id: VPC ID
            public_subnet_ids: List of public subnet IDs
            security_group_id: Security group ID for ALB
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.vpc_id = vpc_id
        self.public_subnet_ids = public_subnet_ids
        self.security_group_id = security_group_id
        self.parent = parent
        
        # Create Target Group
        self.target_group = self._create_target_group()
        
        # Create Application Load Balancer
        self.alb = self._create_alb()
        
        # Create Listener
        self.listener = self._create_listener()
    
    def _create_target_group(self) -> aws.lb.TargetGroup:
        """
        Create Target Group for ALB.
        
        Returns:
            Target Group resource
        """
        tg_name = self.config.get_resource_name('tg')
        
        target_group = aws.lb.TargetGroup(
            tg_name,
            name=tg_name,
            port=self.config.target_group_port,
            protocol=self.config.target_group_protocol,
            vpc_id=self.vpc_id,
            target_type='instance',
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path=self.config.health_check_path,
                interval=self.config.health_check_interval,
                timeout=self.config.health_check_timeout,
                healthy_threshold=self.config.healthy_threshold,
                unhealthy_threshold=self.config.unhealthy_threshold,
                matcher='200'
            ),
            deregistration_delay=30,
            tags=self.config.get_tags_for_resource('TargetGroup', Name=tg_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return target_group
    
    def _create_alb(self) -> aws.lb.LoadBalancer:
        """
        Create Application Load Balancer.
        
        Returns:
            Load Balancer resource
        """
        alb_name = self.config.get_resource_name('alb')
        
        alb = aws.lb.LoadBalancer(
            alb_name,
            name=alb_name,
            load_balancer_type='application',
            internal=False,
            security_groups=[self.security_group_id],
            subnets=self.public_subnet_ids,
            enable_deletion_protection=self.config.enable_deletion_protection,
            enable_cross_zone_load_balancing=self.config.enable_cross_zone_load_balancing,
            idle_timeout=self.config.alb_idle_timeout,
            tags=self.config.get_tags_for_resource('LoadBalancer', Name=alb_name),
            opts=ResourceOptions(
                parent=self.parent,
                custom_timeouts=CustomTimeouts(create="10m")  # Standard ALB creation timeout
            )
        )
        
        return alb
    
    def _create_listener(self) -> aws.lb.Listener:
        """
        Create HTTP Listener for ALB.
        
        Returns:
            Listener resource
        """
        listener_name = self.config.get_resource_name('listener-http')
        
        listener = aws.lb.Listener(
            listener_name,
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol='HTTP',
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type='forward',
                    target_group_arn=self.target_group.arn
                )
            ],
            tags=self.config.get_tags_for_resource('Listener', Name=listener_name),
            opts=ResourceOptions(parent=self.alb)
        )
        
        return listener
    
    def get_target_group_arn(self) -> Output[str]:
        """Get Target Group ARN."""
        return self.target_group.arn
    
    def get_alb_arn(self) -> Output[str]:
        """Get ALB ARN."""
        return self.alb.arn
    
    def get_alb_dns_name(self) -> Output[str]:
        """Get ALB DNS name."""
        return self.alb.dns_name
    
    def get_alb_zone_id(self) -> Output[str]:
        """Get ALB zone ID."""
        return self.alb.zone_id

