# Create a Pulumi TypeScript program to migrate existing infrastructure from us-east-1 to eu-west-1

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
> 
> Platform: **Pulumi**  
> Language: **TypeScript**  
> Region: **eu-west-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A startup's data analytics platform currently runs in us-east-1 but needs to migrate to eu-west-1 for GDPR compliance. The platform consists of S3 buckets for data storage, DynamoDB tables for metadata, and Lambda functions for processing.

## Problem Statement

Create a Pulumi TypeScript program to migrate existing infrastructure from us-east-1 to eu-west-1. The configuration must:

1. Read existing resource configurations from a provided JSON file containing S3 bucket names and DynamoDB table schemas.
2. Create matching S3 buckets in eu-west-1 with versioning enabled and lifecycle policies for 90-day object expiration.
3. Deploy DynamoDB tables with identical schemas but adjusted read/write capacity based on provided scaling factors.
4. Set up cross-region replication from source buckets to new buckets during migration period.
5. Create Lambda functions for data validation that run post-migration checks.
6. Configure CloudWatch alarms for replication lag monitoring with SNS notifications.
7. Implement IAM roles with least-privilege access for migration processes.
8. Tag all resources with Environment, MigrationBatch, and SourceRegion tags.
9. Output a migration status report including resource ARNs and replication endpoints.

**Expected output:** A fully deployed infrastructure in eu-west-1 that mirrors the us-east-1 setup, with active replication streams and monitoring in place. The program should generate a JSON report listing all created resources, their replication status, and any configuration differences between regions.

## Constraints and Requirements

- Use Pulumi's stack references to manage multi-region deployments
- Implement retry logic for cross-region operations with exponential backoff
- All S3 buckets must use AES256 encryption with customer-managed KMS keys
- DynamoDB global tables feature must not be used; implement custom replication
- Lambda functions must use Node.js 18.x runtime with 256MB memory allocation
- Resource names must follow pattern: {original-name}-eu-{timestamp}

## Environment Setup

- AWS credentials with appropriate permissions
- Pulumi CLI tools installed
- TypeScript runtime/SDK configured

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in TypeScript
- Follow Pulumi best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: **eu-west-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
