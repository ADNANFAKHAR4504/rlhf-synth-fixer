import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class CloudWatchStack:
    """CloudWatch log groups and monitoring configuration."""
    
    def __init__(self, config: WebAppConfig, provider: aws.Provider):
        self.config = config
        self.provider = provider
        self.log_group = self._create_log_group()
        self.log_stream = self._create_log_stream()
    
    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group for application logs."""
        return aws.cloudwatch.LogGroup(
            "webapp-log-group",
            name=self.config.log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_log_stream(self) -> aws.cloudwatch.LogStream:
        """Create log stream for the log group."""
        return aws.cloudwatch.LogStream(
            "webapp-log-stream",
            name="main-stream",
            log_group_name=self.log_group.name,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def get_log_group_name(self) -> pulumi.Output[str]:
        """Get log group name."""
        return self.log_group.name
    
    def get_log_group_arn(self) -> pulumi.Output[str]:
        """Get log group ARN."""
        return self.log_group.arn
