"""Compute infrastructure with Lambda and EventBridge."""

import json
from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.lambda_function_url import LambdaFunctionUrl
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf import TerraformAsset, AssetType


class ComputeStack(Construct):
    """Compute infrastructure with Lambda and EventBridge."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 region: str, provider, vpc, private_subnets, lambda_security_group,
                 aurora_endpoint: str, dynamodb_table_name: str):
        super().__init__(scope, construct_id)

        account_id = DataAwsCallerIdentity(self, "account_id", provider=provider).account_id

        # Lambda asset
        lambda_asset = TerraformAsset(self, "lambda_asset", path="lib/lambda", type=AssetType.ARCHIVE)

        # Lambda IAM role
        lambda_role = self._create_lambda_role(environment_suffix, provider)
        self._attach_lambda_policies(lambda_role, region, account_id, dynamodb_table_name, environment_suffix, provider)

        # Lambda function
        lambda_func = LambdaFunction(
            self, "lambda",
            function_name=f"payment-processor-{environment_suffix}",
            role=lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            memory_size=1024,
            timeout=30,
            environment=LambdaFunctionEnvironment(variables={
                "REGION": region,
                "DB_ENDPOINT": aurora_endpoint,
                "DYNAMODB_TABLE": dynamodb_table_name,
                "ENVIRONMENT_SUFFIX": environment_suffix,
            }),
            vpc_config={"subnet_ids": [s.id for s in private_subnets], "security_group_ids": [lambda_security_group.id]},
            tags={"Name": f"payment-processor-{environment_suffix}"},
            provider=provider,
        )
        self.lambda_function_name = lambda_func.function_name

        lambda_url = LambdaFunctionUrl(
            self, "lambda_url",
            function_name=lambda_func.function_name,
            authorization_type="NONE",
            provider=provider,
        )
        self.lambda_url = lambda_url.function_url

        # EventBridge rule for payment events
        event_rule = CloudwatchEventRule(
            self, "event_rule",
            name=f"payment-events-{environment_suffix}",
            description="Payment events for processing",
            event_pattern=json.dumps({"source": ["payment.processor"], "detail-type": ["Payment Transaction"]}),
            tags={"Name": f"payment-events-{environment_suffix}"},
            provider=provider,
        )

        # EventBridge target to Lambda
        CloudwatchEventTarget(
            self, "event_target",
            rule=event_rule.name,
            arn=lambda_func.arn,
            provider=provider,
        )

        # Lambda permission for EventBridge
        LambdaPermission(
            self, "lambda_permission",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=lambda_func.function_name,
            principal="events.amazonaws.com",
            source_arn=event_rule.arn,
            provider=provider,
        )

    def _create_lambda_role(self, environment_suffix: str, provider) -> IamRole:
        """Create IAM role for Lambda."""
        return IamRole(
            self, "lambda_role",
            name=f"payment-lambda-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-lambda-{environment_suffix}"},
            provider=provider,
        )

    def _attach_lambda_policies(self, role: IamRole, region: str, account_id: str, table_name: str, environment_suffix: str, provider):
        """Attach policies to Lambda role."""
        IamRolePolicyAttachment(
            self, "lambda_basic",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=provider,
        )

        policy = IamPolicy(
            self, "lambda_policy",
            name=f"payment-lambda-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {"Effect": "Allow", "Action": ["rds:Describe*"], "Resource": "*"},
                    {"Effect": "Allow", "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:Scan"],
                     "Resource": f"arn:aws:dynamodb:{region}:{account_id}:table/{table_name}"},
                    {"Effect": "Allow", "Action": ["ssm:GetParameter", "ssm:GetParameters"],
                     "Resource": f"arn:aws:ssm:{region}:{account_id}:parameter/payment/{environment_suffix}/*"},
                    {"Effect": "Allow", "Action": "events:PutEvents",
                     "Resource": f"arn:aws:events:{region}:{account_id}:event-bus/default"}
                ]
            }),
            provider=provider,
        )

        IamRolePolicyAttachment(
            self, "lambda_policy_attach",
            role=role.name,
            policy_arn=policy.arn,
            provider=provider,
        )
