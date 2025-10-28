# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using CDK with Javascript**
>
> Platform: **CDK**
> Language: **Javascript**
> Region: **ca-central-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

HealthTech Inc. processes sensitive patient monitoring data from various medical devices across Canadian hospitals. Their current infrastructure handles 100,000 events per minute and stores approximately 5TB of patient data. They need a robust disaster recovery solution that maintains data integrity and HIPAA compliance while ensuring business continuity.

## Problem Statement

Design and implement a highly available disaster recovery solution for HealthTech Inc.'s patient data processing pipeline using CDK. The solution must handle real-time patient monitoring data, maintain HIPAA compliance, and ensure zero data loss with RPO < 15 minutes and RTO < 1 hour.

## Environment Setup

Create a multi-AZ infrastructure using Javascript CDK in ca-central-1 with the following components:
- Real-time data ingestion using Kinesis Data Streams
- Primary and replica RDS clusters for patient data
- ECS Fargate clusters for data processing
- EFS for persistent storage
- ElastiCache for session management
- API Gateway for external integrations
- CodePipeline for automated DR testing
- SecretsManager for credential management

Setup requirements:
- Node.js 14.x or later
- CDK CLI version 2.x
- AWS account with appropriate permissions
- Region: eu-central-1

## Constraints and Requirements

- All data must be encrypted at rest and in transit using KMS keys with automatic rotation
- System must maintain HIPAA compliance with full audit logging and must implement cross-region replication for all critical components
- Infrastructure must support automatic failover with zero data loss and maintain consistent RPO < 15 minutes

---

## Implementation Guidelines

### Platform Requirements
- Use CDK as the IaC framework
- All code must be written in Javascript
- Follow CDK best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately
- Maintain HIPAA compliance with full audit logging

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region

Deploy all resources to: **ca-central-1**

Note: There is a discrepancy between the primary region (ca-central-1) and the setup requirements mentioning eu-central-1. The primary region ca-central-1 should be used for deployment.

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- RPO < 15 minutes and RTO < 1 hour achieved
- Cross-region replication for critical components implemented
- Automatic failover with zero data loss functional
