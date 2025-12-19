"""Compliance validator construct for infrastructure analysis."""

import os
from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.s3_bucket_notification import S3BucketNotification


class ComplianceValidator(Construct):
    """Construct that creates infrastructure for compliance validation."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the compliance validator construct."""
        super().__init__(scope, construct_id)

        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')

        # S3 bucket for storing validation reports
        self.reports_bucket = S3Bucket(
            self,
            f"reports-bucket-{environment_suffix}",
            bucket=f"compliance-reports-{environment_suffix}"
        )

        # Enable versioning (separate resource to avoid deprecation warning)
        S3BucketVersioningA(
            self,
            f"reports-bucket-versioning-{environment_suffix}",
            bucket=self.reports_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Enable encryption (separate resource to avoid deprecation warning)
        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"reports-bucket-encryption-{environment_suffix}",
            bucket=self.reports_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            ]
        )

        # IAM role for Lambda validation function
        self.lambda_role = IamRole(
            self,
            f"lambda-validator-role-{environment_suffix}",
            name=f"compliance-validator-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }"""
        )

        # IAM policy for Lambda permissions
        self.lambda_policy = IamPolicy(
            self,
            f"lambda-validator-policy-{environment_suffix}",
            name=f"compliance-validator-policy-{environment_suffix}",
            policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeSecurityGroups",
                            "ec2:DescribeVpcs",
                            "ec2:DescribeSubnets"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iam:ListPolicies",
                            "iam:GetPolicy",
                            "iam:GetPolicyVersion",
                            "iam:ListRoles",
                            "iam:GetRole",
                            "iam:ListAttachedRolePolicies"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListAllMyBuckets",
                            "s3:GetBucketEncryption",
                            "s3:GetBucketTagging",
                            "s3:PutObject"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBInstances",
                            "rds:DescribeDBClusters",
                            "rds:ListTagsForResource"
                        ],
                        "Resource": "*"
                    }
                ]
            }"""
        )

        # Attach policy to role (using escape hatch)
        self.lambda_role.node.add_dependency(self.lambda_policy)

        # Lambda function for post-deployment validation
        # Calculate absolute path to Lambda ZIP file
        import os
        zip_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "lambda", "compliance_validator.zip")
        )
        
        self.validator_lambda = LambdaFunction(
            self,
            f"compliance-validator-lambda-{environment_suffix}",
            function_name=f"compliance-validator-{environment_suffix}",
            role=self.lambda_role.arn,
            handler="compliance_validator_handler.handler",
            runtime="python3.11",
            timeout=300,
            memory_size=512,
            environment={
                "variables": {
                    "REPORTS_BUCKET": self.reports_bucket.id,
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "REGION": aws_region
                }
            },
            filename=zip_path
        )

        # Lambda permission for S3 invocation
        LambdaPermission(
            self,
            f"lambda-s3-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function_name=self.validator_lambda.function_name,
            principal="s3.amazonaws.com",
            source_arn=self.reports_bucket.arn
        )
