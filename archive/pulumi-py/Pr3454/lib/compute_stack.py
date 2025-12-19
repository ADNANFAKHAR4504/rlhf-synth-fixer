"""
compute_stack.py

Compute resources including Lambda functions for anomaly detection.
"""

import json
import pulumi
from pulumi import ResourceOptions, AssetArchive, FileAsset, FileArchive
import pulumi_aws as aws


class ComputeStack(pulumi.ComponentResource):
    """
    Compute infrastructure component.
    """
    def __init__(
        self,
        name: str,
        *,
        environment_suffix: str,
        kinesis_stream_arn: pulumi.Output[str],
        dynamodb_table_name: pulumi.Output[str],
        s3_bucket_name: pulumi.Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:compute:ComputeStack', name, None, opts)

        # Lambda execution role
        self.lambda_role = aws.iam.Role(
            f"lambda-execution-role-{environment_suffix}",
            name=f"AnomalyLambdaRole-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            ],
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda policy for DynamoDB, S3, and SageMaker
        self.lambda_policy = aws.iam.RolePolicy(
            f"lambda-policy-{environment_suffix}",
            role=self.lambda_role.id,
            policy=pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": pulumi.Output.concat(
                            "arn:aws:dynamodb:us-west-1:",
                            aws.get_caller_identity().account_id,
                            ":table/",
                            dynamodb_table_name,
                            "*"
                        )
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": pulumi.Output.concat(
                            "arn:aws:s3:::",
                            s3_bucket_name,
                            "/*"
                        )
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sagemaker:InvokeEndpoint"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream",
                            "kinesis:ListStreams"
                        ],
                        "Resource": kinesis_stream_arn
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Lambda layer for dependencies - Commented out due to empty zip issue
        # TODO: Create proper layer with actual dependencies
        self.lambda_layer = None

        # Lambda function
        self.anomaly_lambda = aws.lambda_.Function(
            f"anomaly-detection-{environment_suffix}",
            name=f"AnomalyDetection-{environment_suffix}",
            runtime="python3.11",
            handler="handler.lambda_handler",
            role=self.lambda_role.arn,
            timeout=60,
            memory_size=512,
            reserved_concurrent_executions=10,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "S3_BUCKET": s3_bucket_name,
                    "ENVIRONMENT": environment_suffix,
                    "SAGEMAKER_ENDPOINT": f"anomaly-detection-endpoint-{environment_suffix}"
                }
            ),
            # layers=[self.lambda_layer.arn] if self.lambda_layer else [],
            code=AssetArchive({
                "handler.py": FileAsset("./lib/lambda_function/handler.py")
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission for IoT
        self.lambda_permission = aws.lambda_.Permission(
            f"iot-invoke-permission-{environment_suffix}",
            statement_id="AllowIoTInvoke",
            action="lambda:InvokeFunction",
            function=self.anomaly_lambda.name,
            principal="iot.amazonaws.com",
            opts=ResourceOptions(parent=self)
        )

        # Kinesis event source mapping
        self.kinesis_event_mapping = aws.lambda_.EventSourceMapping(
            f"kinesis-lambda-mapping-{environment_suffix}",
            event_source_arn=kinesis_stream_arn,
            function_name=self.anomaly_lambda.name,
            starting_position="LATEST",
            maximum_batching_window_in_seconds=5,
            parallelization_factor=2,
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            'lambda_function_name': self.anomaly_lambda.name,
            'lambda_function_arn': self.anomaly_lambda.arn
        })
