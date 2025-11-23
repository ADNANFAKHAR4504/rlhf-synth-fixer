from constructs import Construct
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
import json


class ComputeConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_vpc_id: str,
        secondary_vpc_id: str,
        primary_subnet_ids: list,
        secondary_subnet_ids: list,
        primary_lambda_sg_id: str,
        secondary_lambda_sg_id: str,
        primary_db_secret_arn: str,
        secondary_db_secret_arn: str
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # DynamoDB Global Table for session state
        self.dynamodb_table = DynamodbTable(
            self,
            "session_table",
            name=f"payment-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="sessionId",
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            attribute=[
                DynamodbTableAttribute(
                    name="sessionId",
                    type="S"
                )
            ],
            replica=[
                DynamodbTableReplica(
                    region_name="us-west-2"
                )
            ],
            tags={
                "Name": f"payment-sessions-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # IAM Role for Lambda - Primary Region
        lambda_role_primary = IamRole(
            self,
            "lambda_role_primary",
            name=f"payment-lambda-role-primary-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"payment-lambda-role-primary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_vpc_policy_primary",
            role=lambda_role_primary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=primary_provider
        )

        # Custom policy for Lambda - Primary
        lambda_policy_primary = IamPolicy(
            self,
            "lambda_policy_primary",
            name=f"payment-lambda-policy-primary-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": f"arn:aws:dynamodb:us-east-1:*:table/payment-sessions-{environment_suffix}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": primary_db_secret_arn
                    }
                ]
            }),
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_custom_policy_primary",
            role=lambda_role_primary.name,
            policy_arn=lambda_policy_primary.arn,
            provider=primary_provider
        )

        # Payment Processing Lambda - Primary Region
        self.primary_payment_lambda = LambdaFunction(
            self,
            "payment_lambda_primary",
            function_name=f"payment-processor-primary-{environment_suffix}",
            role=lambda_role_primary.arn,
            handler="index.handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=512,
            timeout=30,
            filename="lambda_placeholder.zip",
            environment={
                "variables": {
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "DB_SECRET_ARN": primary_db_secret_arn,
                    "REGION": "us-east-1"
                }
            },
            vpc_config={
                "subnet_ids": primary_subnet_ids,
                "security_group_ids": [primary_lambda_sg_id]
            },
            tags={
                "Name": f"payment-processor-primary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # IAM Role for Lambda - Secondary Region
        lambda_role_secondary = IamRole(
            self,
            "lambda_role_secondary",
            name=f"payment-lambda-role-secondary-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"payment-lambda-role-secondary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_vpc_policy_secondary",
            role=lambda_role_secondary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=secondary_provider
        )

        # Custom policy for Lambda - Secondary
        lambda_policy_secondary = IamPolicy(
            self,
            "lambda_policy_secondary",
            name=f"payment-lambda-policy-secondary-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": f"arn:aws:dynamodb:us-west-2:*:table/payment-sessions-{environment_suffix}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": secondary_db_secret_arn
                    }
                ]
            }),
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_custom_policy_secondary",
            role=lambda_role_secondary.name,
            policy_arn=lambda_policy_secondary.arn,
            provider=secondary_provider
        )

        # Payment Processing Lambda - Secondary Region
        self.secondary_payment_lambda = LambdaFunction(
            self,
            "payment_lambda_secondary",
            function_name=f"payment-processor-secondary-{environment_suffix}",
            role=lambda_role_secondary.arn,
            handler="index.handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=512,
            timeout=30,
            filename="lambda_placeholder.zip",
            environment={
                "variables": {
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "DB_SECRET_ARN": secondary_db_secret_arn,
                    "REGION": "us-west-2"
                }
            },
            vpc_config={
                "subnet_ids": secondary_subnet_ids,
                "security_group_ids": [secondary_lambda_sg_id]
            },
            tags={
                "Name": f"payment-processor-secondary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # Backup Verification Lambda - Primary Region
        backup_lambda_role = IamRole(
            self,
            "backup_lambda_role",
            name=f"payment-backup-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"payment-backup-lambda-role-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "backup_lambda_basic_policy",
            role=backup_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=primary_provider
        )

        backup_policy = IamPolicy(
            self,
            "backup_lambda_policy",
            name=f"payment-backup-lambda-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds:DescribeDBClusterSnapshots"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "backup_lambda_custom_policy",
            role=backup_lambda_role.name,
            policy_arn=backup_policy.arn,
            provider=primary_provider
        )

        self.backup_verification_lambda = LambdaFunction(
            self,
            "backup_verification_lambda",
            function_name=f"payment-backup-verification-{environment_suffix}",
            role=backup_lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=256,
            timeout=300,
            filename="lambda_placeholder.zip",
            environment={
                "variables": {
                    "CLUSTER_IDENTIFIER": f"payment-primary-{environment_suffix}",
                    "ENVIRONMENT": environment_suffix
                }
            },
            tags={
                "Name": f"payment-backup-verification-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # CloudWatch Event Rule for daily backup verification
        backup_schedule_rule = CloudwatchEventRule(
            self,
            "backup_schedule",
            name=f"payment-backup-schedule-{environment_suffix}",
            description="Trigger backup verification daily",
            schedule_expression="rate(1 day)",
            provider=primary_provider
        )

        CloudwatchEventTarget(
            self,
            "backup_schedule_target",
            rule=backup_schedule_rule.name,
            arn=self.backup_verification_lambda.arn,
            provider=primary_provider
        )

        LambdaPermission(
            self,
            "backup_lambda_permission",
            statement_id="AllowExecutionFromCloudWatch",
            action="lambda:InvokeFunction",
            function_name=self.backup_verification_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=backup_schedule_rule.arn,
            provider=primary_provider
        )

    @property
    def dynamodb_table_name(self):
        return self.dynamodb_table.name

    @property
    def primary_payment_lambda_name(self):
        return self.primary_payment_lambda.function_name

    @property
    def secondary_payment_lambda_name(self):
        return self.secondary_payment_lambda.function_name

    @property
    def primary_api_endpoint(self):
        return f"https://{self.primary_payment_lambda.function_name}.lambda-url.us-east-1.on.aws"

    @property
    def secondary_api_endpoint(self):
        return f"https://{self.secondary_payment_lambda.function_name}.lambda-url.us-west-2.on.aws"
