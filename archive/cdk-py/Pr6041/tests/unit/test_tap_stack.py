"""Unit tests for the CDK TapStack using the assertive Template helpers."""

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from lib.tap_stack import TapStack, TapStackProps


def synth_template(props: TapStackProps | None = None, context: dict | None = None) -> Template:
    """Helper that instantiates the stack and returns a Template for assertions."""
    app = cdk.App(context=context or {})
    stack = TapStack(app, "TapStackUnderTest", props)
    return Template.from_stack(stack)


def test_default_environment_suffix_is_dev():
    template = synth_template()

    template.has_resource_properties(
        "AWS::SQS::Queue",
        Match.object_like(
            {
                "QueueName": "webhook-queue-dev",
                "VisibilityTimeout": 300,
                "RedrivePolicy": {
                    "maxReceiveCount": 3,
                    "deadLetterTargetArn": {"Fn::GetAtt": [Match.any_value(), "Arn"]},
                },
            }
        ),
    )


def test_kms_key_rotation_and_lambda_encryption():
    template = synth_template(TapStackProps(environment_suffix="ops"))

    template.has_resource_properties(
        "AWS::KMS::Key",
        Match.object_like({"EnableKeyRotation": True}),
    )

    template.has_resource_properties(
        "AWS::Lambda::Function",
        Match.object_like(
            {
                "KmsKeyArn": {"Fn::GetAtt": [Match.any_value(), "Arn"]},
                "Environment": {
                    "Variables": Match.object_like(
                        {
                            "ENVIRONMENT_SUFFIX": "ops",
                        }
                    )
                },
            }
        ),
    )


def test_bucket_lifecycle_and_kms_key_present():
    template = synth_template(TapStackProps(environment_suffix="qa"))

    template.resource_count_is("AWS::KMS::Key", 1)

    template.has_resource_properties(
        "AWS::S3::Bucket",
        Match.object_like(
            {
                "BucketName": "failed-webhooks-qa",
                "LifecycleConfiguration": {
                    "Rules": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Transitions": Match.array_with(
                                        [
                                            Match.object_like(
                                                {
                                                    "StorageClass": "GLACIER",
                                                    "TransitionInDays": 90,
                                                }
                                            )
                                        ]
                                    )
                                }
                            )
                        ]
                    )
                },
            }
        ),
    )


def test_api_gateway_and_dynamodb_configuration():
    template = synth_template(TapStackProps(environment_suffix="stage"))

    template.resource_count_is("AWS::ApiGateway::Method", 3)

    template.has_resource_properties(
        "AWS::DynamoDB::Table",
        Match.object_like(
            {
                "TableName": "WebhookEvents-stage",
                "KeySchema": Match.array_with(
                    [
                        {"AttributeName": "eventId", "KeyType": "HASH"},
                        {"AttributeName": "timestamp", "KeyType": "RANGE"},
                    ]
                ),
            }
        ),
    )
