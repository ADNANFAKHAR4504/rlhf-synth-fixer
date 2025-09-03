import json
import pulumi
import pulumi_aws as aws
from pulumi import Output


class IAMRoles(pulumi.ComponentResource):
  """
  Component for creating IAM roles and policies following least privilege principle.
  Also creates a TestHarnessRole for integration testing.
  """

  def __init__(self, name: str, bucket_arn: Output[str], opts: pulumi.ResourceOptions = None):
    super().__init__('custom:aws:IAMRoles', name, {}, opts)

    lambda_assume_role_policy = json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          }
        }
      ]
    })

    self.lambda_role = aws.iam.Role(
      f"{name}-lambda-role",
      assume_role_policy=lambda_assume_role_policy,
      description="IAM role for Lambda function execution",
      tags={
        "Name": f"{name}-lambda-role",
        "Component": "Lambda"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Attach basic Lambda execution policy
    self.lambda_basic_execution_attachment = aws.iam.RolePolicyAttachment(
      f"{name}-lambda-basic-execution",
      role=self.lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Lambda S3 Access Policy
    self.s3_access_policy = aws.iam.Policy(
      f"{name}-s3-access-policy",
      description="Policy for Lambda to access S3 bucket",
      policy=bucket_arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:GetBucketNotificationConfiguration",
              "s3:HeadObject"
            ],
            "Resource": [f"{arn}/*", arn]
          }
        ]
      })),
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.s3_policy_attachment = aws.iam.RolePolicyAttachment(
      f"{name}-s3-policy-attachment",
      role=self.lambda_role.name,
      policy_arn=self.s3_access_policy.arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.register_outputs({
      'lambda_role_arn': self.lambda_role.arn,
      'lambda_role_name': self.lambda_role.name
    })
