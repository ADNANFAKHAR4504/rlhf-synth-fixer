# Prompt

Create a serverless transaction processing API with the following requirements:

1. **API Gateway REST API** with the following endpoints:
   - POST /upload - Upload transaction file to S3
   - GET /process/{transactionId} - Process a transaction file
   - GET /status/{transactionId} - Get processing status

2. **Lambda Functions** (using ZIP packages, NOT container images):
   - Upload Handler: Validates and stores files in S3
   - Process Handler: Processes transaction files from S3
   - Status Handler: Returns processing status
   - All using Python 3.9 runtime with ARM64 architecture

3. **S3 Bucket** for transaction file storage:
   - Use unique bucket name with environmentSuffix variable
   - Pattern: transaction-files-${environmentSuffix}
   - Enable versioning and encryption

4. **IAM Roles and Policies**:
   - Lambda execution roles with S3 access
   - Proper least-privilege permissions

5. **Environment**: us-east-1 region

**CRITICAL Requirements**:
- Lambda functions MUST use ZIP deployment packages (inline code)
- NO ECR or container image references
- S3 bucket name MUST include environmentSuffix to avoid conflicts
- All API Gateway integrations must be properly defined with depends_on
- No circular dependencies in resource definitions
