from constructs import Construct
from cdktf import TerraformStack
from imports.aws.provider import AwsProvider

class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str = "dev",
        state_bucket: str = "iac-rlhf-tf-states",
        state_bucket_region: str = "us-east-1",
        aws_region: str = "us-east-1",
        default_tags: dict = None,
    ):
        super().__init__(scope, id)

        # -----------------------------------------------------------------------------
        # Configure AWS Provider
        # -----------------------------------------------------------------------------
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags={
                "tags": default_tags or {
                    "Environment": environment_suffix,
                    "Project": "TapStack",
                }
            },
        )

        # -----------------------------------------------------------------------------
        # Configure S3 Backend with escape hatch for state locking
        # -----------------------------------------------------------------------------
        self.add_override(
            "terraform.backend.s3",
            {
                "bucket": state_bucket,
                "key": f"{environment_suffix}/{id}.tfstate",
                "region": state_bucket_region,
                "encrypt": True,
                "use_lockfile": True,
            },
        )

        # -----------------------------------------------------------------------------
        # Define your Terraform resources here
        # -----------------------------------------------------------------------------
        # Example:
        # from imports.aws.s3_bucket import S3Bucket
        # bucket = S3Bucket(self, "MyBucket", bucket=f"my-bucket-{environment_suffix}")
        # ...