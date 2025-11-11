Hey team,

We need to build a secure serverless API with proper encryption and audit logging. The security team has been asking for a reference implementation that shows how to properly configure KMS encryption for CloudWatch Logs in the ap-southeast-1 region. This is crucial because many of our existing services don't have proper encryption at rest for their logs, and we need to fix that pattern.

The business wants this to be a template that other teams can follow, so it needs to demonstrate best practices for security hardening while keeping things serverless and cost-effective. We've had issues in the past where CloudWatch Logs encryption failed during deployment because the KMS key policy didn't include the proper service principal permissions, so that's something we need to get right this time.

I've been asked to create this infrastructure using **Pulumi with ts**. The team is comfortable with this stack, and it integrates well with our existing deployment pipelines.

## What we need to build

Create a secure serverless API infrastructure using **Pulumi with ts** that demonstrates proper KMS encryption configuration for CloudWatch Logs in the ap-southeast-1 region.

### Core Requirements

1. **Serverless API**
   - REST API using API Gateway
   - Lambda function to handle API requests
   - Proper IAM roles with least privilege access
   - CloudWatch Logs for Lambda execution logging

2. **KMS Encryption**
   - Customer-managed KMS key for encrypting CloudWatch Logs
   - KMS key policy that includes CloudWatch Logs service principal permissions
   - The key policy must allow the CloudWatch Logs service in ap-southeast-1 to use the key
   - Proper key rotation enabled for security compliance

3. **CloudWatch Logs Encryption**
   - Log groups encrypted with the KMS key
   - Log retention policies to control costs
   - Proper permissions for Lambda to write to encrypted logs

### Technical Requirements

- All infrastructure defined using **Pulumi with ts**
- Use **Lambda** for compute (Node.js 18.x or later runtime)
- Use **API Gateway** for the REST API endpoint
- Use **KMS** for encryption key management
- Use **CloudWatch Logs** with KMS encryption enabled
- Use **IAM** for roles and policies with least privilege
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **ap-southeast-1** region

### Critical KMS Configuration

The KMS key policy must include a statement that allows the CloudWatch Logs service to use the key. This is the most common mistake when setting up log encryption. The policy must include:

- CloudWatch Logs service principal for ap-southeast-1 region
- Permissions for Encrypt, Decrypt, ReEncrypt, GenerateDataKey, CreateGrant, and DescribeKey
- Conditional access scoped to log groups in the account and region
- Proper resource ARN pattern for Lambda log groups

### Constraints

- All resources must be serverless to minimize costs
- No provisioned infrastructure (no EC2, ECS, etc.)
- KMS key must support automatic rotation
- CloudWatch Logs must have retention period set (7-14 days recommended)
- All resources must be destroyable (no Retain deletion policies)
- Lambda execution role must have minimal required permissions
- API Gateway should use proxy integration with Lambda
- Include proper error handling and structured logging in Lambda

## Success Criteria

- **Functionality**: API Gateway successfully invokes Lambda function
- **Security**: CloudWatch Logs are encrypted with customer-managed KMS key
- **Compliance**: KMS key policy includes proper CloudWatch Logs service permissions
- **Reliability**: Deployment succeeds without KMS permission errors
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: ts with proper types, well-tested, documented
- **Cost Optimization**: All resources are serverless with appropriate retention policies

## What to deliver

- Complete Pulumi ts implementation
- Lambda function with sample API handler
- API Gateway REST API configuration
- KMS key with proper CloudWatch Logs service permissions
- CloudWatch Log groups with KMS encryption
- IAM roles and policies following least privilege
- Unit tests for all infrastructure components
- Integration tests verifying the deployed API works
- Documentation explaining the KMS configuration pattern
