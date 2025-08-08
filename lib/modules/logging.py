"""Logging module for centralized AWS service logging."""
import os

import pulumi
import pulumi_aws as aws

class LoggingManager:
    """Manages centralized logging for all AWS services."""

    def __init__(self, project_name: str, environment: str,
                 kms_key: aws.kms.Key, logging_key: aws.kms.Key):
        self.project_name = project_name
        self.environment = environment
        self.kms_key = kms_key
        self.logging_key = logging_key
    def create_cloudtrail(
            self,
            s3_bucket: aws.s3.Bucket) -> aws.cloudtrail.Trail:
        """Create CloudTrail for API logging."""

        cloudtrail = aws.cloudtrail.Trail(
            f"{self.project_name}-cloudtrail",
            name=f"{self.project_name}-cloudtrail",
            s3_bucket_name=s3_bucket.bucket,
            s3_key_prefix="cloudtrail-logs/",
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_logging=True,
            enable_log_file_validation=True,
            kms_key_id=self.kms_key.arn,
            event_selectors=[aws.cloudtrail.TrailEventSelectorArgs(
                read_write_type="All",
                include_management_events=True,
                data_resources=[aws.cloudtrail.TrailEventSelectorDataResourceArgs(
                    type="AWS::S3::Object",
                    # Correctly log all object-level events for all buckets in account
                    values=["arn:aws:s3"]
                )]
            )],
            tags={
                "Name": f"{self.project_name}-cloudtrail",
                "Environment": self.environment,
                "Purpose": "api-audit-logging",
                "ManagedBy": "pulumi"
            }
        )

        return cloudtrail

    def create_cloudwatch_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch Log Group for VPC Flow Logs."""

        retention_days = int(os.getenv('LOG_RETENTION_DAYS', '90'))

        log_group = aws.cloudwatch.LogGroup(
            f"{self.project_name}-vpc-flow-logs",
            name=f"/aws/vpc/{self.project_name}-flow-logs",
            retention_in_days=retention_days,
            kms_key_id=self.logging_key.arn,  # ensure symmetric CMK with proper policy
            tags={
                "Name": f"{self.project_name}-vpc-flow-logs",
                "Environment": self.environment,
                "Purpose": "vpc-flow-logging",
                "ManagedBy": "pulumi"
            }
        )

        return log_group

    def create_vpc_flow_logs(self, vpc_id: pulumi.Output[str],
                             log_group: aws.cloudwatch.LogGroup,
                             flow_logs_role: aws.iam.Role) -> aws.ec2.FlowLog:
        """Create VPC Flow Logs."""

        flow_log = aws.ec2.FlowLog(
            f"{self.project_name}-vpc-flow-log",
            vpc_id=vpc_id,
            traffic_type="ALL",
            log_destination_type="cloud-watch-logs",
            log_destination=log_group.arn,
            iam_role_arn=flow_logs_role.arn,
            log_format="${srcaddr} ${dstaddr} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action}",
            tags={
                "Name": f"{self.project_name}-vpc-flow-log",
                "Environment": self.environment,
                "Purpose": "network-traffic-logging",
                "ManagedBy": "pulumi"
            }
        )

        return flow_log
