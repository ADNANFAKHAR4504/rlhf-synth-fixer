# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using CloudFormation (cfn) with yaml**
>
> Platform: **cfn**
> Language: **yaml**
> Region: **ap-northeast-1**

---

## Background
StreamTech Japan, a growing media streaming company, needs to automate their content processing workflow. They receive multiple video formats from content creators and need to process, transcode, and store them securely while maintaining metadata in a reliable database system.

## Problem Statement
Design and implement a CloudFormation infrastructure for a media asset processing pipeline that handles video content for a Japanese streaming platform. The pipeline should process uploaded media files, manage metadata, and prepare content for distribution.

## Constraints and Requirements
- All resources must be deployed in ap-northeast-1 region with multi-AZ configuration where applicable
- The solution must implement encryption at rest for all stored data using AWS managed keys

## Environment Setup
The infrastructure should include: 1. A CodePipeline setup for CI/CD workflow 2. RDS PostgreSQL instance for metadata storage 3. EFS for temporary media file storage 4. ElastiCache Redis cluster for caching processed content metadata 5. API Gateway for content management endpoints 6. Appropriate security groups and network configuration; Region: eu-central-1

---

## Implementation Guidelines

### Platform Requirements
- Use CloudFormation (cfn) as the IaC framework
- All code must be written in yaml
- Follow CloudFormation best practices for resource organization
- Ensure all resources use the `EnvironmentSuffix` parameter for naming

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
Deploy all resources to: **ap-northeast-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
