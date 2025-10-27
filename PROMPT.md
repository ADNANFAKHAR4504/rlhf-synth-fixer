# Infrastructure Analysis/Monitoring

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with python**
> 
> Platform: **pulumi**  
> Language: **python**  
> Region: **ap-northeast-1**

---

## Background
JapanCart, a growing e-commerce platform in Japan, needs to implement a robust transaction monitoring system to comply with financial regulations and detect suspicious activities. The system needs to process approximately 1000 transactions per minute during peak hours.

## Problem Statement
Create a real-time transaction monitoring system for an e-commerce platform using Pulumi. The system should process transaction streams and detect potential fraud patterns using a caching layer for recent transaction history.

## Constraints and Requirements
- All resources must be deployed in ap-northeast-1 region with multi-AZ configuration where applicable
- Redis cache must maintain a 24-hour transaction history with automatic expiration

## Environment Setup
{'setup': 'Create the following infrastructure:', 'components': ['Kinesis Data Stream for real-time transaction ingestion', 'ElastiCache Redis cluster for maintaining transaction history', 'RDS PostgreSQL instance for permanent transaction storage', 'SecretsManager for database credentials management']}; Region: eu-south-2

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in python
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
Deploy all resources to: **ap-northeast-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
