from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_logging import S3BucketLoggingA
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.lambda_function import (
    LambdaFunction,
    LambdaFunctionVpcConfig,
    LambdaFunctionEnvironment
)
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret import DataAwsSecretsmanagerSecret
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf import AssetType, TerraformAsset
import json
import os


class DataProcessingModule(Construct):
    # pylint: disable=too-many-positional-arguments
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 vpc_id: str, private_subnet_ids: list, security_group_id: str,
                 kms_key_arn: str, lambda_role_arn: str):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Get current AWS account ID dynamically
        current = DataAwsCallerIdentity(self, "current")

        # S3 Access Logs Bucket
        self.access_logs_bucket = S3Bucket(self, "access-logs",
            bucket=f"s3-access-logs-{environment_suffix}-{current.account_id}",
            tags={
                "Name": f"access-logs-{environment_suffix}"
            }
        )

        # Access Logs Bucket Versioning
        S3BucketVersioningA(self, "access-logs-versioning",
            bucket=self.access_logs_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Access Logs Bucket Encryption
        S3BucketServerSideEncryptionConfigurationA(
            self, "access-logs-encryption",
            bucket=self.access_logs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=(
                    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=kms_key_arn
                    )
                )
            )]
        )

        # Main Data Bucket
        self.data_bucket = S3Bucket(self, "data-bucket",
            bucket=f"secure-data-{environment_suffix}-{current.account_id}",
            tags={
                "Name": f"data-bucket-{environment_suffix}"
            }
        )

        # Data Bucket Versioning (MFA delete disabled for easier testing and cleanup)
        S3BucketVersioningA(self, "data-bucket-versioning",
            bucket=self.data_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Data Bucket Encryption
        S3BucketServerSideEncryptionConfigurationA(
            self, "data-bucket-encryption",
            bucket=self.data_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=(
                    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=kms_key_arn
                    )
                )
            )]
        )

        # Data Bucket Logging
        S3BucketLoggingA(self, "data-bucket-logging",
            bucket=self.data_bucket.id,
            target_bucket=self.access_logs_bucket.id,
            target_prefix="data-bucket-logs/"
        )

        # S3 Bucket Policy - Deny Unencrypted Uploads
        self.bucket_policy = S3BucketPolicy(self, "bucket-policy",
            bucket=self.data_bucket.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "DenyUnencryptedUploads",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:PutObject",
                        "Resource": f"{self.data_bucket.arn}/*",
                        "Condition": {
                            "StringNotEquals": {
                                "s3:x-amz-server-side-encryption": "aws:kms"
                            }
                        }
                    },
                    {
                        "Sid": "RequireMFAForDelete",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:DeleteObject",
                        "Resource": f"{self.data_bucket.arn}/*",
                        "Condition": {
                            "BoolIfExists": {
                                "aws:MultiFactorAuthPresent": "false"
                            }
                        }
                    }
                ]
            })
        )

        # Lambda Asset
        lambda_code_path = os.path.join(os.path.dirname(__file__), "lambda")
        self.lambda_asset = TerraformAsset(self, "lambda-asset",
            path=lambda_code_path,
            type=AssetType.ARCHIVE
        )

        # Lambda Function for Data Processing with dynamic role
        self.processing_lambda = LambdaFunction(self, "processing-lambda",
            function_name=f"data-processor-{environment_suffix}",
            runtime="python3.11",
            handler="data_processor.handler",
            role=lambda_role_arn,
            filename=self.lambda_asset.path,
            source_code_hash=self.lambda_asset.asset_hash,
            timeout=60,
            memory_size=512,
            environment=LambdaFunctionEnvironment(
                variables={
                    "BUCKET_NAME": self.data_bucket.bucket,
                    "KMS_KEY_ID": kms_key_arn
                }
            ),
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=private_subnet_ids,
                security_group_ids=[security_group_id]
            ),
            tags={
                "Name": f"data-processor-{environment_suffix}"
            }
        )

        # Fetch existing secret from Secrets Manager
        self.db_secret = DataAwsSecretsmanagerSecret(self, "db-secret",
            name=f"database-credentials-{environment_suffix}"
        )
