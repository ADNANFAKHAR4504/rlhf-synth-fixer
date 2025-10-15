# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with yaml**
> 
> Platform: **cdk**  
> Language: **yaml**  
> Region: **eu-central-1**

---

## Background
MediTech Solutions needs to process real-time data from patient monitoring devices across multiple hospitals. The data needs to be collected, processed, and stored while maintaining HIPAA compliance. The solution should handle approximately 1000 events per second during peak hours.

## Problem Statement
Create a HIPAA-compliant event processing pipeline for a healthcare provider that needs to process and store patient monitoring device data in real-time. The system should handle incoming medical device data streams, process them, and store the results securely.

## Constraints and Requirements
- All data must be encrypted at rest and in transit using AWS KMS keys
- System must maintain HIPAA compliance with appropriate logging and access controls
- Solution must be highly available across multiple Availability Zones in eu-central-1

## Environment Setup
Using CDK in YAML, implement a solution that includes: 1. Kinesis Data Streams for real-time data ingestion 2. ECS Fargate cluster for data processing 3. RDS Aurora (encrypted) for processed data storage 4. SecretsManager for managing database credentials 5. API Gateway for external system integration

---

## Implementation Guidelines

### Platform Requirements
- Use cdk as the IaC framework
- All code must be written in yaml
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
Deploy all resources to: **eu-central-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
