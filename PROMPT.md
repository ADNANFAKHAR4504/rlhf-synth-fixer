# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with go**
> 
> Platform: **pulumi**  
> Language: **go**  
> Region: **us-east-1**

---

## Background
A federal agency needs to process citizenship application data that includes personally identifiable information (PII). The data needs to be ingested through a secure API, processed in containers, and stored in an encrypted database with proper audit trails.

## Problem Statement
Implement a secure data processing pipeline for a government agency that needs to collect, process, and store sensitive citizen data. The pipeline must meet FedRAMP Moderate compliance requirements and utilize containerized processing with proper data encryption at rest and in transit.

## Constraints and Requirements
- All data must be encrypted at rest and in transit using AWS KMS keys
- Database instance must be in private subnet with no public access

## Environment Setup
```
required_services:
  [Amazon API Gateway for secure data ingestion
Amazon ECS for containerized processing
Amazon RDS (PostgreSQL) with encryption
AWS Secrets Manager for credential management
Amazon Kinesis for data streaming]
setup_requirements:
  [Initialize Pulumi project with Go
Configure AWS provider for us-east-1 region
Set up proper networking with private subnets
Implement encryption and security configurations]
```

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in go
- Follow pulumi best practices for resource organization
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
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
