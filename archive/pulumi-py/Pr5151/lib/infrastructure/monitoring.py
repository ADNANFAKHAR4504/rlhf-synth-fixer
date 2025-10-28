"""
Monitoring infrastructure module.

This module creates CloudWatch Log Groups and additional monitoring
resources for EC2 instances and S3 buckets.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class MonitoringStack:
    """
    Creates and manages CloudWatch monitoring resources.
    
    Features:
    - Log groups for EC2 instance logs
    - Log groups for Auto Scaling events
    - Metric alarms for operational monitoring
    """
    
    def __init__(
        self,
        config: InfraConfig,
        asg_name: Output[str],
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: Infrastructure configuration
            asg_name: Auto Scaling Group name
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.asg_name = asg_name
        self.aws_provider = aws_provider
        self.parent = parent
        
        # Create log groups
        self.ec2_log_group = self._create_ec2_log_group()
        self.asg_log_group = self._create_asg_log_group()
    
    def _create_ec2_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for EC2 instance logs.
        
        Returns:
            CloudWatch Log Group resource
        """
        log_group_name = f"/aws/ec2/{self.config.environment_suffix}"
        resource_name = self.config.get_resource_name('log-group-ec2', include_region=False)
        
        log_group = aws.cloudwatch.LogGroup(
            resource_name,
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags_for_resource('LogGroup', Name=log_group_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )
        
        return log_group
    
    def _create_asg_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for Auto Scaling events.
        
        Returns:
            CloudWatch Log Group resource
        """
        log_group_name = f"/aws/autoscaling/{self.config.environment_suffix}"
        resource_name = self.config.get_resource_name('log-group-asg', include_region=False)
        
        log_group = aws.cloudwatch.LogGroup(
            resource_name,
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags_for_resource('LogGroup', Name=log_group_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )
        
        return log_group
    
    def get_ec2_log_group_name(self) -> Output[str]:
        """Get EC2 log group name."""
        return self.ec2_log_group.name
    
    def get_ec2_log_group_arn(self) -> Output[str]:
        """Get EC2 log group ARN."""
        return self.ec2_log_group.arn
    
    def get_asg_log_group_name(self) -> Output[str]:
        """Get ASG log group name."""
        return self.asg_log_group.name
    
    def get_asg_log_group_arn(self) -> Output[str]:
        """Get ASG log group ARN."""
        return self.asg_log_group.arn

