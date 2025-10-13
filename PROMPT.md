# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with python**
> 
> Platform: **cdk**  
> Language: **python**  
> Region: **ap-southeast-1**

---

## Background
SmartFactory Inc. operates medical device manufacturing facilities that generate sensitive IoT sensor data. They need a compliant infrastructure to collect, process, and store this data while maintaining audit trails for regulatory compliance.

## Problem Statement
Create a CDK infrastructure for a manufacturing company that needs to process IoT sensor data while maintaining HIPAA and ISO 27001 compliance requirements. The solution should include secure data storage, processing, and audit logging capabilities.

## Constraints and Requirements
- All data must be encrypted at rest and in transit using AWS KMS keys
- Database backups must be retained for at least 30 days
- Infrastructure must be deployed in private subnets with controlled access through NAT Gateway

## Environment Setup
The infrastructure should include: 1. An ECS cluster for data processing applications 2. RDS instance for storing processed data with encryption at rest 3. ElastiCache for temporary data caching 4. SecretsManager for managing database credentials 5. Kinesis Data Streams for real-time data ingestion

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
Deploy all resources to: **ap-southeast-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
