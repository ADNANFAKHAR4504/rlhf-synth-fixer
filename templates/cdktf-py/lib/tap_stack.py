from constructs import Construct
from cdktf import TerraformStack

class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)
        # -----------------------------------------------------------------------------
        # Define your Terraform resources here.
        # Example:
        #   from imports.aws import S3Bucket
        #   bucket = S3Bucket(self, "MyBucket", bucket="my-bucket-name")
        #
        # Use environment variables or variables passed from the app for dynamic config.
        # For example, you can use os.getenv("MY_VAR") for