"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional
import os

import aws_cdk as cdk
from constructs import Construct

# Import your stacks here
from .rds_high_availability_infra import (RdsHighAvailabilityInfra,
                                          RdsHighAvailabilityInfraProps)


class TapStackProps(cdk.StackProps):
    """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the
    deployment environment (e.g., 'dev', 'prod').
    vpc_id (Optional[str]): Existing VPC ID to use for RDS deployment
    admin_email (Optional[str]): Administrator email for notifications
    cost_center (Optional[str]): Cost center for resource tagging
    project (Optional[str]): Project name for resource tagging
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    vpc_id (Optional[str]): Stores the VPC ID for RDS deployment.
    admin_email (str): Administrator email for notifications.
    cost_center (str): Cost center for resource tagging.
    project (str): Project name for resource tagging.
  """

    def __init__(self,
                 environment_suffix: Optional[str] = None,
                 vpc_id: Optional[str] = None,
                 admin_email: Optional[str] = None,
                 cost_center: Optional[str] = None,
                 project: Optional[str] = None,
                 **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.admin_email = admin_email or "admin@company.com"
        self.cost_center = cost_center or "engineering"
        self.project = project or "tap"


class TapStack(cdk.Stack):
    """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other
  resource-specific stacks.
  It determines the environment suffix from the provided properties,
  CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming
      and configuration.
    rds_infra (RdsHighAvailabilityInfra): The RDS high availability
      infrastructure stack.
  """

    def __init__(self,
                 scope: Construct,
                 construct_id: str,
                 props: Optional[TapStackProps] = None,
                 **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else
            None) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Get other configuration values
        vpc_id = ((props.vpc_id if props else None)
                  or self.node.try_get_context('vpcId'))
        admin_email = ((props.admin_email if props else None)
                       or self.node.try_get_context('adminEmail')
                       or "admin@company.com")
        cost_center = ((props.cost_center if props else None)
                       or self.node.try_get_context('costCenter')
                       or "engineering")
        project = ((props.project if props else None)
                   or self.node.try_get_context('project') or "tap")

        # Detect if deploying to LocalStack
        is_localstack = os.environ.get("AWS_ENDPOINT_URL", "").find("localhost") != -1 or \
                        os.environ.get("LOCALSTACK_HOSTNAME") is not None

        # Create RDS High Availability Infrastructure
        self.rds_infra = RdsHighAvailabilityInfra(
            self, "RdsHighAvailabilityInfra",
            RdsHighAvailabilityInfraProps(
                environment_suffix=environment_suffix,
                vpc_id=vpc_id,
                admin_email=admin_email,
                cost_center=cost_center,
                project=project,
                is_localstack=is_localstack))

        # Add common tags to the entire stack
        cdk.Tags.of(self).add("CostCenter", cost_center)
        cdk.Tags.of(self).add("Environment", environment_suffix)
        cdk.Tags.of(self).add("Project", project)
        cdk.Tags.of(self).add("ManagedBy", "CDK")

        # Export outputs from nested stack to parent stack
        # Access resources directly from the nested stack
        # These outputs will be available in the parent CloudFormation stack
        cdk.CfnOutput(
            self,
            "RdsEndpoint",
            value=self.rds_infra.db_instance.instance_endpoint.hostname,
            description="RDS PostgreSQL endpoint",
            export_name=f"RdsEndpoint-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "RdsPort",
            value=str(self.rds_infra.db_instance.instance_endpoint.port),
            description="RDS PostgreSQL port",
            export_name=f"RdsPort-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "BackupBucketName",
            value=self.rds_infra.backup_bucket.bucket_name,
            description="S3 backup bucket name",
            export_name=f"BackupBucketName-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "NotificationTopicArn",
            value=self.rds_infra.notification_topic.topic_arn,
            description="SNS notification topic ARN",
            export_name=f"NotificationTopicArn-{environment_suffix}"
        )
