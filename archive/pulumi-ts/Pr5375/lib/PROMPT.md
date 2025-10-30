Hey team,

We've got a data analytics platform currently running in us-east-1 that needs to migrate to eu-west-1 for GDPR compliance. The platform uses S3 buckets for data storage, DynamoDB tables for metadata, and Lambda functions for processing. We need to create a clean migration path that doesn't disrupt operations.

The business challenge is that we need to replicate all these resources in the new region while maintaining data integrity during the transition. We can't just lift and shift - we need active replication, validation checks, and monitoring in place to ensure nothing falls through the cracks. The compliance team is watching this closely since GDPR requirements are strict.

I've been asked to build this migration infrastructure using **Pulumi with TypeScript**. We need a programmatic approach that can read the existing resource configurations from a JSON file and recreate them in the new region with appropriate adjustments for regional differences.

## What we need to build

Create a migration system using **Pulumi with TypeScript** that handles cross-region infrastructure replication from us-east-1 to eu-west-1.

### Core Requirements

1. **Configuration Management**
   - Read existing resource configurations from a JSON file
   - Parse S3 bucket names and DynamoDB table schemas
   - Support scaling factors for capacity adjustments

2. **S3 Bucket Migration**
   - Create matching buckets in eu-west-1 with versioning enabled
   - Implement lifecycle policies for 90-day object expiration
   - Enable cross-region replication from source to destination buckets
   - Use customer-managed KMS keys for AES256 encryption

3. **DynamoDB Table Migration**
   - Deploy tables with identical schemas in eu-west-1
   - Adjust read/write capacity based on provided scaling factors
   - Do not use DynamoDB global tables feature
   - Implement custom replication logic

4. **Data Validation**
   - Create Lambda functions for post-migration validation checks
   - Use Node.js 18.x runtime with 256MB memory allocation
   - Functions should verify data integrity after replication

5. **Monitoring and Alerting**
   - Configure CloudWatch alarms for replication lag
   - Set up SNS notifications for alert delivery
   - Monitor all replication streams

6. **Security and Access Control**
   - Implement IAM roles with least-privilege access
   - Create specific roles for migration processes
   - Ensure proper encryption at rest and in transit

7. **Resource Organization**
   - Tag all resources with Environment, MigrationBatch, and SourceRegion
   - Follow naming pattern: {original-name}-eu-{timestamp}
   - Include environmentSuffix in all resource names for uniqueness

8. **Migration Reporting**
   - Output a migration status report as JSON
   - Include resource ARNs for all created resources
   - List replication endpoints and their status
   - Document configuration differences between regions

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for data storage with versioning and replication
- Use **DynamoDB** for metadata tables with custom replication
- Use **Lambda** (Node.js 18.x, 256MB) for validation functions
- Use **CloudWatch** for monitoring and alarms
- Use **SNS** for notification delivery
- Use **KMS** for customer-managed encryption keys
- Use **IAM** for roles and policies with least-privilege access
- Resource names must include environmentSuffix for uniqueness
- Deploy to **eu-west-1** region

### Constraints

- Use Pulumi stack references for multi-region deployments
- Implement retry logic with exponential backoff for cross-region operations
- All S3 buckets must use AES256 encryption with customer-managed KMS keys
- DynamoDB global tables feature must not be used
- Lambda functions must use Node.js 18.x runtime with 256MB memory
- Resource naming pattern: {original-name}-eu-{timestamp}
- All resources must be destroyable (no Retain policies)
- Follow naming convention: {resource-type}-environmentSuffix
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete infrastructure deployed in eu-west-1 mirroring us-east-1
- **Replication**: Active cross-region replication streams for all S3 buckets
- **Validation**: Lambda functions successfully run post-migration checks
- **Monitoring**: CloudWatch alarms configured with SNS notifications
- **Security**: All encryption, IAM roles, and least-privilege access implemented
- **Resource Naming**: All resources include environmentSuffix and follow naming pattern
- **Reporting**: JSON report generated with ARNs, endpoints, and configuration differences
- **Code Quality**: TypeScript code, well-tested, documented
- **Destroyability**: Infrastructure can be cleanly torn down

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 buckets with versioning, lifecycle policies, and cross-region replication
- DynamoDB tables with custom replication logic
- Lambda validation functions using Node.js 18.x
- CloudWatch alarms with SNS notifications
- IAM roles and policies with least-privilege access
- KMS customer-managed keys for encryption
- Comprehensive resource tagging
- Unit tests for all components
- Documentation and deployment instructions
- JSON migration status report as output