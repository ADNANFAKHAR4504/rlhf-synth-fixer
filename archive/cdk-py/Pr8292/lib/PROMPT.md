Write IAC code in cdk python using the data given below:
---
Contraints:

Use AWS cdk py to manage infrastructure.
 Implement Amazon RDS with automatic backups.
 Ensure PostgreSQL as the database engine with storage auto-scaling enabled.
 Configure an Amazon S3 bucket to store database backups with versioning and lifecycle policies for data retention.
 Establish IAM roles with strict least privilege permissions for accessing RDS and S3.
 Set up CloudWatch Alarms for monitoring database instance performance metrics such as CPUUtilization and FreeStorageSpace.
 Enable Multi-AZ deployment to ensure high availability for the RDS instances.
 Implement automated snapshot creation for the database at regular intervals using AWS Backup.
 Provide a mechanism to notify administrators on failures via Amazon SNS.
 Encrypt database and backup S3 storage with AWS KMS managed keys.
 Integrate VPC with private and public subnets ensuring secure database access only from the private subnet.
 Ensure the RDS instance has a recovery point objective (RPO) of less than 5 minutes.

Environment:

Deploy in AWS us-east-1 region with pre-existing VPC. Ensure compliance with organizational naming conventions and security practices. Resources should tag cost center, environment, and project labels.

Proposed Statement:

You are tasked with developing a cdk code in py to set up a robust, high-availability data infrastructure using Amazon RDS and Amazon S3 for backups. The objectives are as follows: 1) Implement Amazon RDS with automatic backups and storage auto-scaling. 2) Use PostgreSQL as the database engine. 3) Configure S3 for storing backups with versioning and defined retention policies. 4) Implement IAM roles enforcing least privilege. 5) Set up monitoring via CloudWatch Alarms. 6) Ensure Multi-AZ for RDS for high availability. 7) Enable automated backup snapshots. 8) Notify admins of failures using SNS. 9) Ensure all data is encrypted at rest and in transit. 10) Align with a recovery point objective (RPO) of less than 5 minutes. 11) Validate the stack deployment ensuring rollback on any failure. The expected output is a py file named `lib/rds_high_availability_infra.py`. The solution must demonstrate compliance with all the constraints and pass validation checks. 12) This file `lib/rds_high_availability_infra.py` should be called in the `lib/tap_stack.py` file and make sure to integrate the data from the `lib/tap_stack.py` file in the `lib/rds_high_availability_infra.py` file and these are the contents of the `lib/tap_stack.py` file:


```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
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
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'
```