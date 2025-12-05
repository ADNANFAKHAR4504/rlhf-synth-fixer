"""
tap_stack.py
Infrastructure Compliance Analysis Tool Stack
This stack deploys a Lambda-based compliance analyzer for auditing CloudFormation stacks.
"""

from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
    CfnParameter,
    CfnOutput,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_s3 as s3,
    aws_logs as logs,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Parameter for environment suffix
        environment_suffix = CfnParameter(
            self,
            "environmentSuffix",
            type="String",
            description="Environment suffix for resource naming",
            default="dev",
        )

        suffix = environment_suffix.value_as_string

        # S3 bucket for compliance reports
        # Note: Bucket names must be globally unique, so we include account ID
        reports_bucket = s3.Bucket(
            self,
            "ComplianceReports",
            bucket_name=f"compliance-reports-{suffix}-{self.account}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            versioned=True,
        )

        # IAM role for Lambda function
        lambda_role = iam.Role(
            self,
            "ComplianceAnalyzerRole",
            role_name=f"compliance-analyzer-role-{suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        # Grant permissions for cross-account analysis
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudformation:DescribeStacks",
                    "cloudformation:ListStacks",
                    "cloudformation:DescribeStackResources",
                    "cloudformation:GetTemplate",
                    "s3:GetBucketEncryption",
                    "s3:GetPublicAccessBlock",
                    "s3:GetBucketVersioning",
                    "s3:GetBucketTagging",
                    "s3:ListBucket",
                    "rds:DescribeDBInstances",
                    "rds:DescribeDBClusters",
                    "rds:ListTagsForResource",
                    "ec2:DescribeSecurityGroups",
                    "ec2:DescribeSecurityGroupRules",
                    "ec2:DescribeTags",
                    "iam:GetPolicy",
                    "iam:GetPolicyVersion",
                    "iam:GetRole",
                    "iam:GetRolePolicy",
                    "iam:ListRolePolicies",
                    "iam:ListAttachedRolePolicies",
                    "tag:GetResources",
                    "sts:AssumeRole",
                    "sts:GetCallerIdentity",
                ],
                resources=["*"],
            )
        )

        # Grant write access to reports bucket
        reports_bucket.grant_write(lambda_role)

        # Lambda function for compliance analysis
        # Note: Using log_retention parameter instead of explicit log group creation
        # to avoid CloudFormation ResourceExistenceCheck conflict
        compliance_analyzer = lambda_.Function(
            self,
            "ComplianceAnalyzer",
            function_name=f"compliance-analyzer-{suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            role=lambda_role,
            timeout=Duration.minutes(15),
            memory_size=512,
            environment={
                "REPORTS_BUCKET": reports_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": suffix,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # Store references
        self.compliance_analyzer = compliance_analyzer
        self.reports_bucket = reports_bucket

        # Outputs for integration tests
        CfnOutput(
            self,
            "ComplianceAnalyzerFunction",
            value=compliance_analyzer.function_name,
            description="Compliance analyzer Lambda function name"
        )

        CfnOutput(
            self,
            "ReportsBucket",
            value=reports_bucket.bucket_name,
            description="S3 bucket for compliance reports"
        )

        CfnOutput(
            self,
            "LambdaRoleArn",
            value=lambda_role.role_arn,
            description="Lambda execution role ARN"
        )
