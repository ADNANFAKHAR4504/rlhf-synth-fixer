# Ideal Response

The ideal response for this prompt is a CDKTF Python stack that creates a serverless transaction processing API with:

## Architecture

1. **Lambda Functions (ZIP Packages)**
   - Upload Handler: Receives transaction files and stores in S3
   - Process Handler: Retrieves and processes transaction files
   - Status Handler: Returns processing status
   - All using Python 3.9 runtime with ARM64 architecture

2. **S3 Bucket**
   - Unique name using environmentSuffix variable to avoid conflicts
   - Versioning enabled for data protection
   - Server-side encryption (AES256) enabled

3. **API Gateway REST API**
   - POST /upload endpoint
   - GET /process/{transactionId} endpoint
   - GET /status/{transactionId} endpoint
   - Proper integrations with Lambda functions

4. **IAM Roles and Policies**
   - Lambda execution role with AssumeRole policy
   - S3 access permissions (GetObject, PutObject, ListBucket)
   - CloudWatch Logs permissions for debugging

## Key Implementation Details

- Lambda functions must use ZIP deployment packages, NOT container images
- S3 bucket names must include environmentSuffix to ensure uniqueness
- API Gateway integrations must be explicitly defined with depends_on
- Resource dependencies must be properly ordered to avoid circular references
- Lambda permissions must allow API Gateway invocation

## Deployment

The infrastructure should deploy successfully with:
```bash
cdktf synth
cdktf deploy
```

All resources should be created without errors and the API should be functional.

## Example Implementation

```python
from cdktf import TerraformStack
from imports.aws.provider import AwsProvider
from imports.aws.s3_bucket import S3Bucket
from imports.aws.lambda_function import LambdaFunction
from imports.aws.api_gateway_rest_api import ApiGatewayRestApi

class TransactionApiStack(TerraformStack):
    def __init__(self, scope, id, environment_suffix):
        super().__init__(scope, id)

        # Provider configuration
        AwsProvider(self, "aws", region="us-east-1")

        # S3 bucket for transaction storage
        bucket = S3Bucket(
            self, "transactions_bucket",
            bucket=f"transactions-{environment_suffix}",
            versioning={"enabled": True}
        )

        # Lambda functions for API handlers
        upload_lambda = LambdaFunction(
            self, "upload_lambda",
            function_name=f"transaction-upload-{environment_suffix}",
            runtime="python3.9",
            handler="lambda_upload.handler",
            filename="lib/lambda_upload.zip"
        )
```
