Hey team,

We need to build a document management infrastructure that can be deployed across multiple environments - dev, staging, and production. The business wants a consistent architecture pattern that can be replicated while respecting environment-specific configurations. I've been asked to create this using CDKTF with TypeScript.

The company has been struggling with manual infrastructure deployment and inconsistencies between their environments. They want to standardize how document storage, metadata tracking, and processing work across all environments while maintaining appropriate capacity and retention policies for each.

## What we need to build

Create a multi-environment document management infrastructure using **CDKTF with TypeScript** for the ap-southeast-1 region.

### Core Requirements

1. **Environment-aware Stack Configuration**
   - Stack must accept environment name as a parameter (dev, staging, prod)
   - All resource names must include environmentSuffix for clear identification
   - Enable dynamic configuration based on environment

2. **Document Storage with S3**
   - Create S3 bucket with environment-specific naming: company-docs-{env}
   - Enable versioning only for staging and production environments
   - Apply encryption using AWS managed keys for all environments
   - Implement lifecycle rules: archive objects after 30 days in dev, 90 days in staging/prod

3. **Metadata Tracking with DynamoDB**
   - Deploy DynamoDB table for document metadata
   - Use on-demand billing for dev environment only
   - Set provisioned capacity for staging/prod: 5/5 (dev), 10/10 (staging), 25/25 (production)
   - Environment-based read/write capacity configuration

4. **Document Processing with Lambda**
   - Deploy Lambda function for document processing
   - Environment-specific memory allocation
   - Configure different timeout values: 30s (dev), 60s (staging), 120s (prod)

5. **Monitoring with CloudWatch**
   - Create CloudWatch alarms for DynamoDB throttling
   - Environment-specific alarm thresholds
   - Different SNS topics based on environment severity

6. **Consistent Tagging**
   - Apply Environment and Project tags across all resources
   - Ensure tag propagation for compliance tracking

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **Amazon S3** for document storage with versioning and lifecycle rules
- Use **Amazon DynamoDB** for metadata tracking with environment-based capacity
- Use **AWS Lambda** for document processing with environment-specific configurations
- Use **Amazon CloudWatch** for monitoring and alerting
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- Deploy to ap-southeast-1 region
- Use CDK context or environment variables for environment name, not hardcoded values

### Constraints

- No hardcoded environment names in the code
- All resources must be destroyable (no Retain policies)
- S3 buckets must have encryption enabled for all environments
- DynamoDB must use on-demand billing for dev only
- Include proper error handling and logging
- Each environment must be independently deployable and updateable

## Success Criteria

- Functionality: Three separate CloudFormation stacks deployable via CDKTF
- Architecture: Consistent patterns across environments with environment-specific configurations
- Performance: Appropriate capacity settings for each environment
- Reliability: Independent deployability and updateability per environment
- Security: Encryption enabled, proper IAM policies
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: TypeScript, well-tested, documented
- Monitoring: CloudWatch alarms configured with environment-appropriate thresholds

## What to deliver

- Complete CDKTF TypeScript implementation
- S3 buckets with environment-specific naming and lifecycle rules
- DynamoDB table with environment-based capacity configuration
- Lambda function with environment-specific memory and timeout
- CloudWatch alarms for monitoring
- Unit tests for all components
- Documentation and deployment instructions