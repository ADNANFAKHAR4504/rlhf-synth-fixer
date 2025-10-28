# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with python**
> 
> Platform: **cdk**  
> Language: **python**  
> Region: **eu-west-2**

---

## Background
A healthcare provider needs to modernize their patient record management system. They require a solution that can handle real-time patient data updates, securely store sensitive health information, and maintain HIPAA compliance throughout the data lifecycle.

## Problem Statement
Design and implement a HIPAA-compliant healthcare data processing pipeline using AWS CDK. The system should ingest patient health records, process them securely, and store them in a compliant database while maintaining an audit trail.

## Constraints and Requirements
- All resources must be deployed in eu-west-2 region
- All data must be encrypted at rest and in transit using KMS keys
- Database access must be restricted to private subnets only
- Implementation must include audit logging for all data access events

## Environment Setup
```
required_services:
  primary:
  [Amazon Kinesis Data Streams for real-time data ingestion
Amazon RDS (PostgreSQL) with encryption for HIPAA-compliant storage
Amazon ECS for data processing containers
AWS Secrets Manager for credential management]
setup:
  Use AWS CDK v2 with Python to create the infrastructure stack; Region:
  eu-west-2
```

---

## Implementation Guidelines

### Platform Requirements
- Use cdk as the IaC framework
- All code must be written in python
- Follow cdk best practices for resource organization
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
Deploy all resources to: **eu-west-2**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
