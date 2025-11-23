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
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf import TerraformAsset, AssetType


class ComputeStack(Construct):
    """Compute infrastructure with Lambda and EventBridge."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_region: str, secondary_region: str, primary_provider, secondary_provider,
                 primary_vpc, secondary_vpc, primary_private_subnets, secondary_private_subnets,
                 primary_lambda_security_group, secondary_lambda_security_group,
                 primary_aurora_endpoint: str, secondary_aurora_endpoint: str, dynamodb_table_name: str):
        super().__init__(scope, construct_id)

        account_id = DataAwsCallerIdentity(self, "account_id", provider=primary_provider).account_id

        # Lambda asset
        lambda_asset = TerraformAsset(self, "lambda_asset", path="lib/lambda", type=AssetType.ARCHIVE)

        # Primary Lambda
        primary_lambda_role = self._create_lambda_role("primary", environment_suffix, primary_provider)
        self._attach_lambda_policies(primary_lambda_role, primary_region, account_id, dynamodb_table_name, environment_suffix, primary_provider, "primary")
        
        primary_lambda = LambdaFunction(
            self, "primary_lambda",
            function_name=f"payment-processor-primary-{environment_suffix}",
            role=primary_lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            memory_size=1024,
            timeout=30,
            environment=LambdaFunctionEnvironment(variables={
                "REGION": primary_region,
                "DB_ENDPOINT": primary_aurora_endpoint,
                "DYNAMODB_TABLE": dynamodb_table_name,
                "ENVIRONMENT_SUFFIX": environment_suffix,
            }),
            vpc_config={"subnet_ids": [s.id for s in primary_private_subnets], "security_group_ids": [primary_lambda_security_group.id]},
            tags={"Name": f"payment-processor-primary-{environment_suffix}"},
            provider=primary_provider,
        )
        self.primary_lambda_function_name = primary_lambda.function_name
        
        primary_lambda_url = LambdaFunctionUrl(
            self, "primary_lambda_url",
            function_name=primary_lambda.function_name,
            authorization_type="NONE",
            provider=primary_provider,
        )
        self.primary_lambda_url = primary_lambda_url.function_url

        # Secondary Lambda
        secondary_lambda_role = self._create_lambda_role("secondary", environment_suffix, secondary_provider)
        self._attach_lambda_policies(secondary_lambda_role, secondary_region, account_id, dynamodb_table_name, environment_suffix, secondary_provider, "secondary")
        
        secondary_lambda = LambdaFunction(
            self, "secondary_lambda",
            function_name=f"payment-processor-secondary-{environment_suffix}",
            role=secondary_lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            memory_size=1024,
            timeout=30,
            environment=LambdaFunctionEnvironment(variables={
                "REGION": secondary_region,
                "DB_ENDPOINT": secondary_aurora_endpoint,
                "DYNAMODB_TABLE": dynamodb_table_name,
                "ENVIRONMENT_SUFFIX": environment_suffix,
            }),
            vpc_config={"subnet_ids": [s.id for s in secondary_private_subnets], "security_group_ids": [secondary_lambda_security_group.id]},
            tags={"Name": f"payment-processor-secondary-{environment_suffix}"},
            provider=secondary_provider,
        )
        self.secondary_lambda_function_name = secondary_lambda.function_name
        
        secondary_lambda_url = LambdaFunctionUrl(
            self, "secondary_lambda_url",
            function_name=secondary_lambda.function_name,
            authorization_type="NONE",
            provider=secondary_provider,
        )
        self.secondary_lambda_url = secondary_lambda_url.function_url

        # EventBridge cross-region replication
        primary_event_rule = CloudwatchEventRule(
            self, "primary_event_rule",
            name=f"payment-events-primary-{environment_suffix}",
            description="Payment events for cross-region replication",
            event_pattern=json.dumps({"source": ["payment.processor"], "detail-type": ["Payment Transaction"]}),
            tags={"Name": f"payment-events-primary-{environment_suffix}"},
            provider=primary_provider,
        )

        CloudwatchEventTarget(
            self, "primary_event_target",
            rule=primary_event_rule.name,
            arn=f"arn:aws:events:{secondary_region}:{account_id}:event-bus/default",
            role_arn=self._create_eventbridge_role("primary", environment_suffix, primary_region, secondary_region, account_id, primary_provider).arn,
            provider=primary_provider,
        )

        secondary_event_rule = CloudwatchEventRule(
            self, "secondary_event_rule",
            name=f"payment-events-secondary-{environment_suffix}",
            description="Payment events for cross-region replication",
            event_pattern=json.dumps({"source": ["payment.processor"], "detail-type": ["Payment Transaction"]}),
            tags={"Name": f"payment-events-secondary-{environment_suffix}"},
            provider=secondary_provider,
        )

        CloudwatchEventTarget(
            self, "secondary_event_target",
            rule=secondary_event_rule.name,
            arn=f"arn:aws:events:{primary_region}:{account_id}:event-bus/default",
            role_arn=self._create_eventbridge_role("secondary", environment_suffix, secondary_region, primary_region, account_id, secondary_provider).arn,
            provider=secondary_provider,
        )

    def _create_lambda_role(self, region_name: str, environment_suffix: str, provider) -> IamRole:
        """Create IAM role for Lambda."""
        return IamRole(
            self, f"{region_name}_lambda_role",
            name=f"payment-lambda-{region_name}-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-lambda-{region_name}-{environment_suffix}"},
            provider=provider,
        )

    def _attach_lambda_policies(self, role: IamRole, region: str, account_id: str, table_name: str, environment_suffix: str, provider, region_name: str):
        """Attach policies to Lambda role."""
        IamRolePolicyAttachment(
            self, f"{region_name}_lambda_basic",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=provider,
        )

        policy = IamPolicy(
            self, f"{region_name}_lambda_policy",
            name=f"payment-lambda-policy-{region_name}-{environment_suffix}",
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
            self, f"{region_name}_lambda_policy_attach",
            role=role.name,
            policy_arn=policy.arn,
            provider=provider,
        )

    def _create_eventbridge_role(self, region_name: str, environment_suffix: str, source_region: str, target_region: str, account_id: str, provider) -> IamRole:
        """Create IAM role for EventBridge cross-region replication."""
        role = IamRole(
            self, f"{region_name}_eventbridge_role",
            name=f"payment-eventbridge-{source_region}-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"events.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-eventbridge-{source_region}-{environment_suffix}"},
            provider=provider,
        )

        policy = IamPolicy(
            self, f"{region_name}_eventbridge_policy",
            name=f"payment-eventbridge-policy-{source_region}-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Effect": "Allow", "Action": "events:PutEvents",
                               "Resource": f"arn:aws:events:{target_region}:{account_id}:event-bus/default"}]
            }),
            provider=provider,
        )

        IamRolePolicyAttachment(
            self, f"{region_name}_eventbridge_policy_attach",
            role=role.name,
            policy_arn=policy.arn,
            provider=provider,
        )

        return role