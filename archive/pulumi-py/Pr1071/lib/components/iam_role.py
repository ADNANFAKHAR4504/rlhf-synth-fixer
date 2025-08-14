import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from typing import Dict, Any, Optional, List
import json


class IAMRoleComponent(ComponentResource):
  """
  A component that creates an IAM role with:
  - Minimum necessary permissions
  - Environment-specific naming and tagging
  - Configurable trust policy and permissions
  """

  def __init__(
      self,
      name: str,
      environment: str,
      trusted_services: Optional[List[str]] = None,
      s3_bucket_arn: Optional[pulumi.Output[str]] = None,
      dynamodb_table_arn: Optional[pulumi.Output[str]] = None,
      tags: Optional[Dict[str, str]] = None,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__("custom:aws:IAMRoleComponent", name, None, opts)

    # Default tags
    default_tags = {
      "Environment": environment,
      "ManagedBy": "Pulumi",
      "Project": "aws-infrastructure"
    }
    if tags:
      default_tags.update(tags)

    # Default trusted services
    if trusted_services is None:
      trusted_services = ["ec2.amazonaws.com", "lambda.amazonaws.com"]

    # Create trust policy
    trust_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": trusted_services
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    # Create IAM role
    self.role = aws.iam.Role(
      f"{name}-role",
      name=f"{environment}-{name}-role",
      assume_role_policy=json.dumps(trust_policy),
      tags=default_tags,
      opts=ResourceOptions(parent=self)
    )

    # Create policy for S3 and DynamoDB access if ARNs provided
    if s3_bucket_arn or dynamodb_table_arn:
      policy_statements = []

      if s3_bucket_arn:
        # S3 permissions - minimum necessary
        s3_statement = {
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket"
          ],
          "Resource": [
            s3_bucket_arn,
            pulumi.Output.concat(s3_bucket_arn, "/*")
          ]
        }
        policy_statements.append(s3_statement)

      if dynamodb_table_arn:
        # DynamoDB permissions - minimum necessary
        dynamodb_statement = {
          "Effect": "Allow",
          "Action": [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
            "dynamodb:Scan"
          ],
          "Resource": dynamodb_table_arn
        }
        policy_statements.append(dynamodb_statement)

      # Create the policy document
      policy_document = {
        "Version": "2012-10-17",
        "Statement": policy_statements
      }

      # Create and attach the policy
      self.policy = aws.iam.RolePolicy(
        f"{name}-policy",
        name=f"{environment}-{name}-policy",
        role=self.role.id,
        policy=pulumi.Output.json_dumps(policy_document),
        opts=ResourceOptions(parent=self)
      )

    # Create instance profile for EC2 if ec2 is in trusted services
    if "ec2.amazonaws.com" in trusted_services:
      self.instance_profile = aws.iam.InstanceProfile(
        f"{name}-instance-profile",
        name=f"{environment}-{name}-instance-profile",
        role=self.role.name,
        opts=ResourceOptions(parent=self)
      )

    # Register outputs
    outputs = {
      "iam_role_name": self.role.name,
      "iam_role_arn": self.role.arn
    }

    if hasattr(self, 'instance_profile'):
      outputs["instance_profile_name"] = self.instance_profile.name

    self.register_outputs(outputs)

  @property
  def role_name(self) -> pulumi.Output[str]:
    """Returns the role name"""
    return self.role.name

  @property
  def role_arn(self) -> pulumi.Output[str]:
    """Returns the role ARN"""
    return self.role.arn