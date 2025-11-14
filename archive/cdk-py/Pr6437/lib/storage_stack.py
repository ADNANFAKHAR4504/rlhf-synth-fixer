from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
    Tags,
    CfnOutput,
    Fn
)
from constructs import Construct

class StorageStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for payment data
        bucket = s3.Bucket(
            self, f"PaymentData-{environment_suffix}",
            bucket_name=f"payment-data-{environment_suffix}-{self.account}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        self.bucket = bucket

        CfnOutput(
            self, "BucketArn",
            value=bucket.bucket_arn,
            export_name=f"bucket-arn-{environment_suffix}"
        )

        CfnOutput(
            self, "BucketName",
            value=bucket.bucket_name,
            export_name=f"bucket-name-{environment_suffix}"
        )
