"""Lambda Stack for processing ECR scan results."""

from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf import AssetType, TerraformAsset
import json


class LambdaStack(Construct):
    """Lambda function for processing scan results."""

    def __init__(
        self,
        scope: Construct,
        environment_suffix: str,
        *,
        ecr_repository_arn: str,
        dynamodb_table_name: str,
        dynamodb_table_arn: str
    ):
        super().__init__(scope, "LambdaStack")

        # Create SNS topic for security alerts
        self.sns_topic = SnsTopic(
            self,
            "security_alerts",
            name=f"ecr-security-alerts-{environment_suffix}",
            display_name="ECR Security Alerts"
        )

        # Create IAM role for Lambda
        lambda_role = IamRole(
            self,
            "lambda_role",
            name=f"ecr-scan-processor-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Effect": "Allow"
                    }
                ]
            })
        )

        # Create IAM policy for Lambda
        lambda_policy = IamPolicy(
            self,
            "lambda_policy",
            name=f"ecr-scan-processor-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecr:DescribeImageScanFindings",
                            "ecr:GetAuthorizationToken",
                            "ecr:BatchGetImage"
                        ],
                        "Resource": ecr_repository_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:GetItem"
                        ],
                        "Resource": dynamodb_table_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": self.sns_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            })
        )

        # Attach policies to role
        IamRolePolicyAttachment(
            self,
            "lambda_policy_attachment",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Package Lambda function code
        lambda_asset = TerraformAsset(
            self,
            "lambda_code",
            path="lib/lambda",
            type=AssetType.ARCHIVE
        )

        # Create Lambda function
        self.lambda_function = LambdaFunction(
            self,
            "scan_processor",
            function_name=f"ecr-scan-processor-{environment_suffix}",
            role=lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            timeout=60,
            memory_size=256,
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            environment={
                "variables": {
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "SNS_TOPIC_ARN": self.sns_topic.arn
                }
            }
        )

        # Grant EventBridge permission to invoke Lambda
        LambdaPermission(
            self,
            "eventbridge_permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=self.lambda_function.function_name,
            principal="events.amazonaws.com"
        )

        # Export outputs
        self.function_arn = self.lambda_function.arn
        self.function_name = self.lambda_function.function_name
        self.sns_topic_arn = self.sns_topic.arn
