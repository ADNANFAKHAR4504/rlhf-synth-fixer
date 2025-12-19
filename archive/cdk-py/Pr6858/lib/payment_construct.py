from aws_cdk import (
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
)
from constructs import Construct
from typing import Dict, Any


class PaymentProcessingConstruct(Construct):
    """Reusable construct for payment processing components"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        kms_key: kms.Key,
        env_config: Dict[str, Any],
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix
        self.kms_key = kms_key
        self.env_config = env_config

        # Create components
        self.table = self._create_table()
        self.bucket = self._create_bucket()
        self.function = self._create_function()
        self.api = self._create_api()

    def _create_table(self) -> dynamodb.Table:
        """Create DynamoDB table"""
        env = self.env_config["environment"]

        if env == "production":
            billing_mode = dynamodb.BillingMode.PROVISIONED
            read_capacity = 5
            write_capacity = 5
        else:
            billing_mode = dynamodb.BillingMode.PAY_PER_REQUEST
            read_capacity = None
            write_capacity = None

        table_props = {
            "table_name": f"payment-data-{self.environment_suffix}",
            "partition_key": dynamodb.Attribute(
                name="id", type=dynamodb.AttributeType.STRING
            ),
            "billing_mode": billing_mode,
            "encryption": dynamodb.TableEncryption.CUSTOMER_MANAGED,
            "encryption_key": self.kms_key,
            "removal_policy": RemovalPolicy.DESTROY,
        }

        if billing_mode == dynamodb.BillingMode.PROVISIONED:
            table_props["read_capacity"] = read_capacity
            table_props["write_capacity"] = write_capacity

        return dynamodb.Table(self, "Table", **table_props)

    def _create_bucket(self) -> s3.Bucket:
        """Create S3 bucket"""
        env = self.env_config["environment"]
        glacier_days = 90 if env == "production" else 30

        return s3.Bucket(
            self,
            "Bucket",
            bucket_name=f"payment-data-{self.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(glacier_days),
                        )
                    ],
                )
            ],
        )

    def _create_function(self) -> _lambda.Function:
        """Create Lambda function"""
        role = iam.Role(
            self,
            "LambdaRole",
            role_name=f"payment-construct-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        self.table.grant_read_write_data(role)
        self.bucket.grant_read_write(role)

        return _lambda.Function(
            self,
            "Function",
            function_name=f"payment-construct-fn-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_inline("def handler(event, context): return {'statusCode': 200}"),
            memory_size=512,
            timeout=Duration.seconds(30),
            role=role,
            environment={
                "TABLE_NAME": self.table.table_name,
                "BUCKET_NAME": self.bucket.bucket_name,
            },
        )

    def _create_api(self) -> apigateway.RestApi:
        """Create API Gateway"""
        rate_limit = self.env_config["api_rate_limit"]

        api = apigateway.RestApi(
            self,
            "API",
            rest_api_name=f"payment-construct-api-{self.environment_suffix}",
            deploy_options=apigateway.StageOptions(
                throttling_rate_limit=rate_limit,
                throttling_burst_limit=rate_limit * 2,
            ),
        )

        integration = apigateway.LambdaIntegration(self.function)
        api.root.add_method("POST", integration)

        return api
