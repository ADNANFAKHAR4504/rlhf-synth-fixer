## AWS CDK Stack Modernization and Compliance Fixes

You need to resolve critical deprecation warnings and AWS runtime constraints in the serverless data processing pipeline to ensure production readiness and future compatibility.

### Problem Description

The current CDK stack has two critical issues preventing successful deployment:

1. **CDK Deprecation Warning**: The DynamoDB table configuration uses deprecated properties that will be removed in future CDK versions
2. **Lambda Runtime Constraint**: The Lambda function configuration attempts to set reserved environment variables that AWS doesn't allow

### Specific Requirements

#### 1. DynamoDB Point-in-Time Recovery Update

- **Current Issue**: Using deprecated `pointInTimeRecovery` property
- **Required Fix**: Update to use the new `pointInTimeRecoverySpecification` format
- **Maintain**: Same functionality - point-in-time recovery should remain enabled

#### 2. Lambda Environment Variable Compliance

- **Current Issue**: Manually setting `AWS_REGION` environment variable
- **AWS Constraint**: `AWS_REGION` is reserved by Lambda runtime and cannot be set manually
- **Required Fix**: Remove the manual `AWS_REGION` setting and use runtime-provided alternatives
- **Reference**: AWS Lambda environment variable documentation

### Expected Outcomes

1. **Clean Deployment**: Stack should deploy without warnings or errors
2. **Future Compatibility**: No deprecated CDK properties should remain
3. **AWS Compliance**: All Lambda environment variables should follow AWS constraints
4. **Functional Preservation**: All existing functionality must be maintained
5. **Regional Access**: Lambda should still have access to region information through AWS-provided methods

### Technical Context

This is a serverless data processing pipeline with:

- S3 bucket with event notifications
- Lambda function for file processing
- DynamoDB table for metadata storage
- IAM roles with least privilege access

The fixes should maintain the same architecture while ensuring modern CDK practices and AWS compliance.
