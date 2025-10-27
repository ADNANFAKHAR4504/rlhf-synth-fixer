# Failure Recovery and High Availability

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cloudformation with yaml**
> 
> Platform: **cloudformation**  
> Language: **yaml**  
> Region: **ca-central-1**

---

## Background
A large university needs to modernize its student records management system. They require a solution that complies with educational data privacy regulations (FERPA) while providing high availability and disaster recovery capabilities. The system needs to handle concurrent access from multiple campus locations and maintain performance during peak registration periods.

## Problem Statement
Design and implement a CloudFormation template using Go CDK that provisions a highly available database infrastructure for a student records management system. The system must handle sensitive student data with proper encryption and backup mechanisms.

## Constraints and Requirements
- Must implement automated failover with RDS Multi-AZ deployment in ca-central-1 region
- Database credentials must be rotated automatically every 30 days using SecretsManager
- All data must be encrypted at rest and in transit using AWS KMS keys

## Environment Setup
The infrastructure should include: 1. Multi-AZ RDS PostgreSQL database cluster 2. ElastiCache Redis cluster for session management 3. SecretsManager for database credentials 4. Proper security groups and encryption settings 5. Automated backup configuration; Region: eu-south-1

---

## Implementation Guidelines

### Platform Requirements
- Use cloudformation as the IaC framework
- All code must be written in yaml
- Follow cloudformation best practices for resource organization
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
Deploy all resources to: **ca-central-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
