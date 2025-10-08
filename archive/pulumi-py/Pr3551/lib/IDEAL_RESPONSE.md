```python
class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP loyalty system project.

    This component orchestrates the instantiation of:
    - API Gateway for REST endpoints
    - Lambda functions for business logic
    - DynamoDB tables for member accounts and transactions
    - SNS for time-sensitive offers
    - SES for email campaigns
    - Pinpoint for multi-channel marketing
    - S3 for static campaign assets
    - EventBridge for scheduled campaigns
    - CloudWatch for metrics, logs, and alarms
    - IAM roles and policies (least-privilege)

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # ====================
        # 1. DynamoDB Tables
        # ====================

        # Member accounts table
        self.member_accounts_table = aws.dynamodb.Table(
            f"loyalty-member-accounts-{self.environment_suffix}",
            name=f"loyalty-member-accounts-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="member_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="member_id",
                    type="S",
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="email",
                    type="S",
                ),
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="email-index",
                    hash_key="email",
                    projection_type="ALL",
                )
            ],
            tags={**self.tags, "Name": f"loyalty-member-accounts-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Transactions table
        self.transactions_table = aws.dynamodb.Table(
            f"loyalty-transactions-{self.environment_suffix}",
            name=f"loyalty-transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transaction_id",
                    type="S",
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N",
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="member_id",
                    type="S",
                ),
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="member-id-index",
                    hash_key="member_id",
                    range_key="timestamp",
                    projection_type="ALL",
                )
            ],
            tags={**self.tags, "Name": f"loyalty-transactions-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ====================
        # 2. S3 Bucket for Campaign Assets (with encryption)
        # ====================

        self.campaign_assets_bucket = aws.s3.Bucket(
            f"loyalty-campaign-assets-{self.environment_suffix}",
            bucket=f"loyalty-campaign-assets-{self.environment_suffix}-{aws.get_caller_identity().account_id}",
            tags={**self.tags, "Name": f"loyalty-campaign-assets-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Enable server-side encryption for S3 bucket
        self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            f"loyalty-campaign-assets-encryption-{self.environment_suffix}",
            bucket=self.campaign_assets_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(parent=self.campaign_assets_bucket)
        )

        # Enable versioning for S3 bucket
        self.bucket_versioning = aws.s3.BucketVersioning(
            f"loyalty-campaign-assets-versioning-{self.environment_suffix}",
            bucket=self.campaign_assets_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self.campaign_assets_bucket)
        )

        # Block public access to the bucket
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"loyalty-campaign-assets-public-access-block-{self.environment_suffix}",
            bucket=self.campaign_assets_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.campaign_assets_bucket)
        )

        # ====================
        # 3. SNS Topic for Time-Sensitive Offers
        # ====================

        self.offers_topic = aws.sns.Topic(
            f"loyalty-offers-topic-{self.environment_suffix}",
            name=f"loyalty-offers-topic-{self.environment_suffix}",
            tags={**self.tags, "Name": f"loyalty-offers-topic-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Dead Letter Queue for SNS failures
        self.sns_dlq = aws.sqs.Queue(
            f"loyalty-sns-dlq-{self.environment_suffix}",
            name=f"loyalty-sns-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={**self.tags, "Name": f"loyalty-sns-dlq-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ====================
        # 4. SES Email Identity (placeholder - requires verification)
        # ====================

        # Note: SES requires email verification. Update with actual email domain.
        # For now, creating identity configuration set for tracking
        self.ses_configuration_set = aws.ses.ConfigurationSet(
            f"loyalty-email-config-{self.environment_suffix}",
            name=f"loyalty-email-config-{self.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # ====================
        # 5. Pinpoint Application for Multi-Channel Marketing
        # ====================

        self.pinpoint_app = aws.pinpoint.App(
            f"loyalty-pinpoint-app-{self.environment_suffix}",
            name=f"loyalty-pinpoint-app-{self.environment_suffix}",
            tags={**self.tags, "Name": f"loyalty-pinpoint-app-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ====================
        # 6. Lambda Execution Role
        # ====================

        self.lambda_role = aws.iam.Role(
            f"loyalty-lambda-role-{self.environment_suffix}",
            name=f"loyalty-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow",
                }]
            }),
            tags={**self.tags, "Name": f"loyalty-lambda-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        self.lambda_basic_policy = aws.iam.RolePolicyAttachment(
            f"loyalty-lambda-basic-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Custom policy for DynamoDB, SNS, SES, Pinpoint, S3 access
        self.lambda_custom_policy = aws.iam.RolePolicy(
            f"loyalty-lambda-custom-policy-{self.environment_suffix}",
            role=self.lambda_role.id,
            policy=Output.all(
                self.member_accounts_table.arn,
                self.transactions_table.arn,
                self.offers_topic.arn,
                self.campaign_assets_bucket.arn,
                self.pinpoint_app.arn
            ).apply(lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            arns[0],  # member_accounts_table
                            f"{arns[0]}/index/*",
                            arns[1],  # transactions_table
                            f"{arns[1]}/index/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": arns[2]  # offers_topic
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ses:SendEmail",
                            "ses:SendRawEmail",
                            "sqs:SendMessage"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "mobiletargeting:SendMessages",
                            "mobiletargeting:SendUsersMessages"
                        ],
                        "Resource": arns[4]  # pinpoint_app
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": f"{arns[3]}/*"  # campaign_assets_bucket
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # ====================
        # 7. Lambda Functions
        # ====================

        # Dead Letter Queue for Lambda failures
        self.lambda_dlq = aws.sqs.Queue(
            f"loyalty-lambda-dlq-{self.environment_suffix}",
            name=f"loyalty-lambda-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={**self.tags, "Name": f"loyalty-lambda-dlq-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Lambda function for transaction processing (earn/redeem)
        self.transaction_lambda = aws.lambda_.Function(
            f"loyalty-transaction-lambda-{self.environment_suffix}",
            name=f"loyalty-transaction-lambda-{self.environment_suffix}",
            runtime="python3.10",
            handler="index.handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os
import time
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
member_table = dynamodb.Table(os.environ['MEMBER_TABLE_NAME'])
transaction_table = dynamodb.Table(os.environ['TRANSACTION_TABLE_NAME'])

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        member_id = body.get('member_id')
        transaction_type = body.get('type')  # 'earn' or 'redeem'
        points = Decimal(str(body.get('points', 0)))

        # Get current member balance
        member_response = member_table.get_item(Key={'member_id': member_id})
        if 'Item' not in member_response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Member not found'})
            }

        current_balance = Decimal(str(member_response['Item'].get('points_balance', 0)))

        # Calculate new balance
        if transaction_type == 'earn':
            new_balance = current_balance + points
        elif transaction_type == 'redeem':
            if current_balance < points:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Insufficient points'})
                }
            new_balance = current_balance - points
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid transaction type'})
            }

        # Update member balance
        member_table.update_item(
            Key={'member_id': member_id},
            UpdateExpression='SET points_balance = :balance',
            ExpressionAttributeValues={':balance': new_balance}
        )

        # Record transaction
        transaction_id = f"{member_id}-{int(time.time() * 1000)}"
        transaction_table.put_item(
            Item={
                'transaction_id': transaction_id,
                'member_id': member_id,
                'timestamp': Decimal(str(int(time.time()))),
                'type': transaction_type,
                'points': points,
                'balance_after': new_balance
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'transaction_id': transaction_id,
                'new_balance': float(new_balance)
            }, default=str)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
""")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "MEMBER_TABLE_NAME": self.member_accounts_table.name,
                    "TRANSACTION_TABLE_NAME": self.transactions_table.name,
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.lambda_dlq.arn
            ),
            tags={**self.tags, "Name": f"loyalty-transaction-lambda-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_custom_policy])
        )

        # Lambda function for member lookup
        self.lookup_lambda = aws.lambda_.Function(
            f"loyalty-lookup-lambda-{self.environment_suffix}",
            name=f"loyalty-lookup-lambda-{self.environment_suffix}",
            runtime="python3.10",
            handler="index.handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
member_table = dynamodb.Table(os.environ['MEMBER_TABLE_NAME'])
transaction_table = dynamodb.Table(os.environ['TRANSACTION_TABLE_NAME'])

def handler(event, context):
    try:
        member_id = event.get('pathParameters', {}).get('member_id')

        # Get member details
        member_response = member_table.get_item(Key={'member_id': member_id})
        if 'Item' not in member_response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Member not found'})
            }

        member = member_response['Item']

        # Get recent transactions
        transaction_response = transaction_table.query(
            IndexName='member-id-index',
            KeyConditionExpression='member_id = :mid',
            ExpressionAttributeValues={':mid': member_id},
            ScanIndexForward=False,
            Limit=10
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'member': member,
                'recent_transactions': transaction_response.get('Items', [])
            }, default=str)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
""")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "MEMBER_TABLE_NAME": self.member_accounts_table.name,
                    "TRANSACTION_TABLE_NAME": self.transactions_table.name,
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.lambda_dlq.arn
            ),
            tags={**self.tags, "Name": f"loyalty-lookup-lambda-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_custom_policy])
        )

        # Lambda function for scheduled campaign processing (EventBridge target)
        self.campaign_lambda = aws.lambda_.Function(
            f"loyalty-campaign-lambda-{self.environment_suffix}",
            name=f"loyalty-campaign-lambda-{self.environment_suffix}",
            runtime="python3.10",
            handler="index.handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os

sns = boto3.client('sns')
ses = boto3.client('ses')
pinpoint = boto3.client('pinpoint')

def handler(event, context):
    # Placeholder for scheduled campaign processing
    # This would fetch members, send offers via SNS/SES/Pinpoint
    print("Running scheduled campaign")

    # Example: Publish to SNS topic
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    sns.publish(
        TopicArn=sns_topic_arn,
        Message='Time-sensitive loyalty offer!',
        Subject='Special Loyalty Points Offer'
    )

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Campaign processed successfully'})
    }
""")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "SNS_TOPIC_ARN": self.offers_topic.arn,
                    "PINPOINT_APP_ID": self.pinpoint_app.application_id,
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.lambda_dlq.arn
            ),
            tags={**self.tags, "Name": f"loyalty-campaign-lambda-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_custom_policy])
        )

        # ====================
        # 8. API Gateway REST API
        # ====================

        self.api = aws.apigateway.RestApi(
            f"loyalty-api-{self.environment_suffix}",
            name=f"loyalty-api-{self.environment_suffix}",
            description="Loyalty System REST API",
            tags={**self.tags, "Name": f"loyalty-api-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # /transactions resource
        self.transactions_resource = aws.apigateway.Resource(
            f"loyalty-transactions-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="transactions",
            opts=ResourceOptions(parent=self.api)
        )

        # POST /transactions method
        self.transactions_post_method = aws.apigateway.Method(
            f"loyalty-transactions-post-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self.transactions_resource)
        )

        # Integration with transaction Lambda
        self.transactions_integration = aws.apigateway.Integration(
            f"loyalty-transactions-integration-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method=self.transactions_post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.transaction_lambda.invoke_arn,
            opts=ResourceOptions(parent=self.transactions_post_method)
        )

        # /members resource
        self.members_resource = aws.apigateway.Resource(
            f"loyalty-members-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="members",
            opts=ResourceOptions(parent=self.api)
        )

        # /members/{member_id} resource
        self.member_id_resource = aws.apigateway.Resource(
            f"loyalty-member-id-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.members_resource.id,
            path_part="{member_id}",
            opts=ResourceOptions(parent=self.members_resource)
        )

        # GET /members/{member_id} method
        self.member_get_method = aws.apigateway.Method(
            f"loyalty-member-get-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.member_id_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=ResourceOptions(parent=self.member_id_resource)
        )

        # Integration with lookup Lambda
        self.member_integration = aws.apigateway.Integration(
            f"loyalty-member-integration-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.member_id_resource.id,
            http_method=self.member_get_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lookup_lambda.invoke_arn,
            opts=ResourceOptions(parent=self.member_get_method)
        )

        # API Gateway Deployment
        self.api_deployment = aws.apigateway.Deployment(
            f"loyalty-api-deployment-{self.environment_suffix}",
            rest_api=self.api.id,
            opts=ResourceOptions(
                parent=self.api,
                depends_on=[
                    self.transactions_integration,
                    self.member_integration
                ]
            )
        )

        # API Gateway Stage
        self.api_stage = aws.apigateway.Stage(
            f"loyalty-api-stage-{self.environment_suffix}",
            rest_api=self.api.id,
            deployment=self.api_deployment.id,
            stage_name=self.environment_suffix,
            tags={**self.tags, "Name": f"loyalty-api-stage-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.api_deployment)
        )

        # Lambda permissions for API Gateway
        self.transaction_lambda_permission = aws.lambda_.Permission(
            f"loyalty-transaction-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.transaction_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(self.api.execution_arn, "/*/*/*"),
            opts=ResourceOptions(parent=self.transaction_lambda)
        )

        self.lookup_lambda_permission = aws.lambda_.Permission(
            f"loyalty-lookup-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.lookup_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(self.api.execution_arn, "/*/*/*"),
            opts=ResourceOptions(parent=self.lookup_lambda)
        )

        # ====================
        # 9. SSM Parameters for Secure Configuration
        # ====================

        # SSM parameter for DynamoDB table names
        self.ssm_member_table_param = aws.ssm.Parameter(
            f"loyalty-member-table-param-{self.environment_suffix}",
            name=f"/loyalty/{self.environment_suffix}/dynamodb/member-table-name",
            type="String",
            value=self.member_accounts_table.name,
            description="DynamoDB member accounts table name",
            tags={**self.tags, "Name": f"loyalty-member-table-param-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.ssm_transactions_table_param = aws.ssm.Parameter(
            f"loyalty-transactions-table-param-{self.environment_suffix}",
            name=f"/loyalty/{self.environment_suffix}/dynamodb/transactions-table-name",
            type="String",
            value=self.transactions_table.name,
            description="DynamoDB transactions table name",
            tags={**self.tags, "Name": f"loyalty-transactions-table-param-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # SSM parameter for SNS topic ARN
        self.ssm_sns_topic_param = aws.ssm.Parameter(
            f"loyalty-sns-topic-param-{self.environment_suffix}",
            name=f"/loyalty/{self.environment_suffix}/sns/topic-arn",
            type="String",
            value=self.offers_topic.arn,
            description="SNS topic ARN for loyalty offers",
            tags={**self.tags, "Name": f"loyalty-sns-topic-param-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # SSM parameter for API Gateway URL
        self.ssm_api_url_param = aws.ssm.Parameter(
            f"loyalty-api-url-param-{self.environment_suffix}",
            name=f"/loyalty/{self.environment_suffix}/api/base-url",
            type="String",
            value=Output.concat(
                "https://",
                self.api.id,
                ".execute-api.",
                aws.get_region().region,
                ".amazonaws.com/",
                self.environment_suffix
            ),
            description="API Gateway base URL",
            tags={**self.tags, "Name": f"loyalty-api-url-param-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.api)
        )

        # ====================
        # 10. EventBridge Rule for Scheduled Campaigns
        # ====================

        self.campaign_schedule_rule = aws.cloudwatch.EventRule(
            f"loyalty-campaign-schedule-{self.environment_suffix}",
            name=f"loyalty-campaign-schedule-{self.environment_suffix}",
            description="Trigger loyalty campaigns daily at 9 AM UTC",
            schedule_expression="cron(0 9 * * ? *)",  # Daily at 9 AM UTC
            tags={**self.tags, "Name": f"loyalty-campaign-schedule-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # EventBridge target to invoke campaign Lambda
        self.campaign_schedule_target = aws.cloudwatch.EventTarget(
            f"loyalty-campaign-schedule-target-{self.environment_suffix}",
            rule=self.campaign_schedule_rule.name,
            arn=self.campaign_lambda.arn,
            opts=ResourceOptions(parent=self.campaign_schedule_rule)
        )

        # Lambda permission for EventBridge
        self.campaign_lambda_permission = aws.lambda_.Permission(
            f"loyalty-campaign-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.campaign_lambda.name,
            principal="events.amazonaws.com",
            source_arn=self.campaign_schedule_rule.arn,
            opts=ResourceOptions(parent=self.campaign_lambda)
        )

        # ====================
        # 11. CloudWatch Log Groups (Explicit Creation)
        # ====================

        # Log group for transaction Lambda
        self.transaction_lambda_log_group = aws.cloudwatch.LogGroup(
            f"loyalty-transaction-lambda-log-group-{self.environment_suffix}",
            name=Output.concat("/aws/lambda/", self.transaction_lambda.name),
            retention_in_days=30,
            tags={**self.tags, "Name": f"loyalty-transaction-lambda-log-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.transaction_lambda)
        )

        # Log group for lookup Lambda
        self.lookup_lambda_log_group = aws.cloudwatch.LogGroup(
            f"loyalty-lookup-lambda-log-group-{self.environment_suffix}",
            name=Output.concat("/aws/lambda/", self.lookup_lambda.name),
            retention_in_days=30,
            tags={**self.tags, "Name": f"loyalty-lookup-lambda-log-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.lookup_lambda)
        )

        # Log group for campaign Lambda
        self.campaign_lambda_log_group = aws.cloudwatch.LogGroup(
            f"loyalty-campaign-lambda-log-group-{self.environment_suffix}",
            name=Output.concat("/aws/lambda/", self.campaign_lambda.name),
            retention_in_days=30,
            tags={**self.tags, "Name": f"loyalty-campaign-lambda-log-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.campaign_lambda)
        )

        # Log group for API Gateway
        self.api_gateway_log_group = aws.cloudwatch.LogGroup(
            f"loyalty-api-gateway-log-group-{self.environment_suffix}",
            name=f"/aws/apigateway/loyalty-api-{self.environment_suffix}",
            retention_in_days=30,
            tags={**self.tags, "Name": f"loyalty-api-gateway-log-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.api)
        )

        # ====================
        # 12. CloudWatch Alarms
        # ====================

        # Alarm for Lambda errors
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"loyalty-lambda-error-alarm-{self.environment_suffix}",
            name=f"loyalty-lambda-error-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda functions have more than 5 errors in 5 minutes",
            dimensions={
                "FunctionName": self.transaction_lambda.name
            },
            tags={**self.tags, "Name": f"loyalty-lambda-error-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Alarm for Lambda throttles
        self.lambda_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"loyalty-lambda-throttle-alarm-{self.environment_suffix}",
            name=f"loyalty-lambda-throttle-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=3,
            alarm_description="Alert when Lambda functions are throttled",
            dimensions={
                "FunctionName": self.transaction_lambda.name
            },
            tags={**self.tags, "Name": f"loyalty-lambda-throttle-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Alarm for API Gateway 5xx errors
        self.api_5xx_alarm = aws.cloudwatch.MetricAlarm(
            f"loyalty-api-5xx-alarm-{self.environment_suffix}",
            name=f"loyalty-api-5xx-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when API Gateway has more than 10 5xx errors in 5 minutes",
            dimensions={
                "ApiName": self.api.name
            },
            tags={**self.tags, "Name": f"loyalty-api-5xx-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Alarm for DynamoDB throttled requests
        self.dynamodb_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"loyalty-dynamodb-throttle-alarm-{self.environment_suffix}",
            name=f"loyalty-dynamodb-throttle-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when DynamoDB has throttled requests",
            dimensions={
                "TableName": self.member_accounts_table.name
            },
            tags={**self.tags, "Name": f"loyalty-dynamodb-throttle-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Alarm for Lambda DLQ messages
        self.lambda_dlq_alarm = aws.cloudwatch.MetricAlarm(
            f"loyalty-lambda-dlq-alarm-{self.environment_suffix}",
            name=f"loyalty-lambda-dlq-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ApproximateNumberOfMessagesVisible",
            namespace="AWS/SQS",
            period=300,
            statistic="Average",
            threshold=1,
            alarm_description="Alert when messages appear in Lambda DLQ",
            dimensions={
                "QueueName": self.lambda_dlq.name
            },
            tags={**self.tags, "Name": f"loyalty-lambda-dlq-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ====================
        # 13. CloudWatch Dashboard
        # ====================

        self.cloudwatch_dashboard = aws.cloudwatch.Dashboard(
            f"loyalty-dashboard-{self.environment_suffix}",
            dashboard_name=f"loyalty-dashboard-{self.environment_suffix}",
            dashboard_body=Output.all(
                self.api.name,
                self.transaction_lambda.name,
                self.lookup_lambda.name,
                self.campaign_lambda.name,
                self.member_accounts_table.name,
                self.transactions_table.name
            ).apply(lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/ApiGateway", "Count"],
                                [".", "5XXError"],
                                [".", "4XXError"],
                                [".", "Latency"]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-east-1",
                            "title": "API Gateway Metrics",
                            "period": 300,
                            "yAxis": {
                                "left": {
                                    "label": "Count/ms"
                                }
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", args[1]],
                                [".", "Errors", "FunctionName", args[1]],
                                [".", "Duration", "FunctionName", args[1]],
                                [".", "Throttles", "FunctionName", args[1]]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-east-1",
                            "title": "Transaction Lambda Metrics",
                            "period": 300
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", args[4]],
                                [".", "ConsumedWriteCapacityUnits", "TableName", args[4]],
                                [".", "UserErrors", "TableName", args[4]]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-east-1",
                            "title": "DynamoDB Member Accounts Table",
                            "period": 300
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", args[2]],
                                [".", "Invocations", "FunctionName", args[3]]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-east-1",
                            "title": "All Lambda Functions Activity",
                            "period": 300
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # ====================
        # 14. Stack Outputs
        # ====================

        self.register_outputs({
            # API Gateway
            "api_base_url": Output.concat(
                "https://",
                self.api.id,
                ".execute-api.",
                aws.get_region().region,
                ".amazonaws.com/",
                self.environment_suffix
            ),
            "api_id": self.api.id,

            # DynamoDB Tables
            "member_accounts_table_name": self.member_accounts_table.name,
            "member_accounts_table_arn": self.member_accounts_table.arn,
            "transactions_table_name": self.transactions_table.name,
            "transactions_table_arn": self.transactions_table.arn,

            # SNS
            "offers_topic_arn": self.offers_topic.arn,

            # S3
            "campaign_assets_bucket_name": self.campaign_assets_bucket.bucket,
            "campaign_assets_bucket_arn": self.campaign_assets_bucket.arn,

            # Pinpoint
            "pinpoint_app_id": self.pinpoint_app.application_id,
            "pinpoint_app_arn": self.pinpoint_app.arn,

            # Lambda Functions
            "transaction_lambda_arn": self.transaction_lambda.arn,
            "lookup_lambda_arn": self.lookup_lambda.arn,
            "campaign_lambda_arn": self.campaign_lambda.arn,

            # SES
            "ses_configuration_set_name": self.ses_configuration_set.name,

            # CloudWatch
            "cloudwatch_dashboard_name": self.cloudwatch_dashboard.dashboard_name,
            "lambda_error_alarm_name": self.lambda_error_alarm.name,
            "api_5xx_alarm_name": self.api_5xx_alarm.name,

            # Dead Letter Queues
            "lambda_dlq_arn": self.lambda_dlq.arn,
            "sns_dlq_arn": self.sns_dlq.arn,

            # SSM Parameters
            "ssm_member_table_param_name": self.ssm_member_table_param.name,
            "ssm_transactions_table_param_name": self.ssm_transactions_table_param.name,
            "ssm_sns_topic_param_name": self.ssm_sns_topic_param.name,
            "ssm_api_url_param_name": self.ssm_api_url_param.name,
        })
```