# Terraform Infrastructure for Centralized Logging

Complete Terraform infrastructure code for a centralized logging system with 12 CloudWatch Log Groups, Kinesis Firehose with dynamic partitioning, S3 storage with GZIP compression, Lambda transformation, and CloudWatch Insights queries.

## Key Improvements from Initial Generation

1. **Environment Suffix Support**: Added `environment_suffix` variable and `local.name_prefix` to ensure all resources can be uniquely named for parallel deployments
2. **Fixed Firehose Buffer Size**: Changed from 1 MB to 64 MB (minimum required for dynamic partitioning)
3. **KMS Policy Dependencies**: Added explicit `depends_on` clauses for CloudWatch Log Groups to ensure KMS key policy is applied before log group creation
4. **Local Backend**: Changed from S3 backend to local backend for QA/testing purposes
5. **Comprehensive Testing**: Added 93 unit tests and 34 integration tests validating all infrastructure components

## Implementation Details

All Terraform files are structured logically in the lib/ directory:
- provider.tf: AWS provider and backend configuration
- variables.tf: All configurable parameters including environment_suffix
- main.tf: Core resources (KMS, S3, CloudWatch Log Groups, subscription filters)
- iam.tf: IAM roles and policies for all services
- lambda.tf: Lambda function for log transformation
- firehose.tf: Kinesis Firehose delivery stream configuration
- cloudwatch_insights.tf: Five query definitions for log analysis
- outputs.tf: Comprehensive outputs for all resources

## Deployment Success

- Deployed successfully on attempt 2/5
- All 12 CloudWatch Log Groups created with 90-day retention and KMS encryption
- Kinesis Firehose configured with GZIP compression and dynamic partitioning
- Lambda function deployed with Python 3.12 runtime
- S3 bucket with versioning, encryption, and lifecycle policies
- All IAM roles and policies properly configured

## Testing Results

### Unit Tests: 93/93 passed (100%)
- File existence tests
- Provider configuration tests
- Variable tests
- Resource configuration tests for all modules
- Security tests
- Naming convention tests
- Requirement validation tests
- Dependencies tests

### Integration Tests: 34/34 passed (100%)
- CloudWatch Log Groups verification (all 12 exist with correct configuration)
- S3 bucket encryption and versioning verification
- KMS key verification
- Lambda function runtime and configuration verification
- Kinesis Firehose GZIP compression and dynamic partitioning verification
- IAM roles and policies verification
- CloudWatch Insights queries verification
- Output validation

## Infrastructure Validation

All requirements met:
- 12 CloudWatch Log Groups with 90-day retention
- Kinesis Firehose with dynamic partitioning by application and date
- GZIP compression enabled
- S3 bucket with lifecycle policies (90 days to Glacier, 180 days to Deep Archive, 2555 days expiration)
- Lambda function for log transformation
- KMS encryption for all data at rest and in transit
- CloudWatch Insights queries for log analysis
- Cross-account access IAM roles
- All resources properly tagged and named with environment suffix
